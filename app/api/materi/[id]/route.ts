export const runtime = 'nodejs'

import { Readable } from 'stream'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { extractDriveFileId } from '@/lib/curriculum-resource-links'
import { getDriveClient } from '@/lib/google-drive'

/**
 * Satu berkas materi, disajikan Tera sendiri.
 *
 * Inilah yang membuat "materi bisa dilihat email yang terdaftar di Tera" jadi
 * kalimat yang bisa ditegakkan. Selama materinya berupa tautan Drive, yang
 * memutuskan adalah identitas GOOGLE pembacanya — dan anak yang membuka
 * `/belajar` di HP hampir tidak pernah login dengan akun yang dibagikan, kalau
 * login sama sekali. Berkas yang sama, disajikan dari sini, dijaga oleh sesi
 * Tera yang memang sudah dipakainya untuk sampai ke halaman itu.
 *
 * URUTANNYA ADALAH SELURUH KEAMANANNYA:
 *
 *   1. Barisnya diminta lewat CLIENT SESI. Kalau RLS tidak mengizinkan, `data`
 *      pulang kosong dan permintaannya berhenti di situ. Yang memutuskan tetap
 *      policy 057/076/119 — rute ini tidak pernah membaca peran, tidak pernah
 *      memanggil `has_product()`, dan tidak pernah menyalin aturannya.
 *   2. BARU setelah itu service role dipakai, dan hanya untuk mengambil byte
 *      dari bucket privat. Bucket itu sengaja tidak punya policy `select`
 *      untuk siapa pun (migrasi 120).
 *
 * Membalik urutannya — mengambil berkasnya dulu, memeriksa belakangan — adalah
 * cara membuat kebocoran yang tetap lulus semua tes, karena berkasnya memang
 * selalu berhasil diambil.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  // `?periksa=1` menjawab "siapa yang akan melayani ini" tanpa memindahkan satu
  // byte pun. Ada karena jawabannya tidak bisa dilihat dari layar: kedua jalur
  // menghasilkan PDF yang sama, dan header penandanya hilang dari pandangan
  // begitu browser mengikuti pengalihan ke bucket. Membaca DevTools bukan
  // syarat yang pantas untuk pertanyaan sesederhana ini.
  const periksa = new URL(request.url).searchParams.has('periksa')

  const supabase = await createClient()
  const { data: materi } = await supabase
    .from('curriculum_resources')
    .select('title, link_url, kind')
    .eq('id', id)
    .eq('kind', 'materi')
    .maybeSingle()

  // Tidak bisa dibedakan "tidak ada" dari "bukan hakmu", dan memang tidak perlu:
  // keduanya berarti halaman ini tidak punya apa-apa untuk orang ini.
  if (!materi) return new NextResponse('Tidak ditemukan', { status: 404 })

  const fileId = extractDriveFileId(materi.link_url as string)
  if (!fileId) return new NextResponse('Tidak ditemukan', { status: 404 })

  if (periksa) return await laporkanSumber(fileId, materi.title as string)

  // Drive lebih dulu, penyimpanan Tera sebagai jaring pengaman.
  //
  // Sejak materi berkumpul di folder bimbel `Materi Kurikulum/`, folder itulah
  // satu-satunya tempat berkasnya berada — bukan lagi tautan tersebar di Drive
  // macam-macam tutor. Membacanya langsung dari sana berarti apa yang dibuka
  // anak SELALU berkas yang sama dengan yang dipegang admin, tanpa ada salinan
  // yang bisa tertinggal versi. Dan penyimpanan Supabase berhenti tumbuh, yang
  // memang jadi alasan seluruh perpindahan ini.
  //
  // Yang tidak berubah: byte-nya tidak pernah keluar sebelum RLS di atas
  // mengizinkan. Service account baru dipakai SESUDAH itu, sama seperti service
  // role dipakai sesudahnya sebelum ini.
  const dariDrive = await ambilDariDrive(fileId)
  if (dariDrive) return dariDrive

  // Belum bisa dibaca dari Drive — berkasnya belum dibagikan ke service
  // account, atau kredensialnya belum terpasang di lingkungan ini. Selama
  // salinan PDF-nya masih ada di bucket, anak tidak perlu tahu bedanya.
  const admin = createAdminClient()
  const { data: salinan } = await admin
    .from('curriculum_resource_duplications')
    .select('pdf_path')
    .eq('drive_file_id', fileId)
    .maybeSingle()

  const path = (salinan?.pdf_path as string | null) ?? null
  if (!path) return new NextResponse('Materi ini belum tersedia untuk dibaca di halaman', { status: 404 })

  // Byte-nya TIDAK lewat sini. Rute ini memutuskan, lalu menyingkir.
  //
  // Menyalurkan isi berkasnya sendiri terasa lebih rapat, tapi mustahil di
  // tempat ia akan berjalan: fungsi serverless Netlify membatasi respons di
  // sekitar 6 MB, sedangkan materi di sini ada yang 16 MB — dan kegagalannya
  // baru muncul di produksi, tidak pernah di lokal, karena batas itu milik
  // pembungkusnya dan bukan milik kodenya.
  //
  // Yang dijaga tetap sama: URL ini baru dibuat SETELAH RLS mengizinkan, dan
  // umurnya satu menit — cukup untuk bingkai yang sedang memuatnya, terlalu
  // pendek untuk jadi tautan yang beredar.
  const { data: bertanda, error } = await admin.storage
    .from('materi')
    .createSignedUrl(path, 60)
  if (error || !bertanda) return new NextResponse('Gagal membaca berkas', { status: 502 })

  return NextResponse.redirect(bertanda.signedUrl, {
    headers: {
      // Pengalihannya sendiri tidak boleh disimpan siapa pun: tujuannya
      // kedaluwarsa dalam satu menit, dan pengalihan yang ter-cache akan
      // mengirim pembaca berikutnya ke tautan yang sudah mati.
      'Cache-Control': 'private, no-store',
      // Jalur cadangan yang terpakai — artinya Drive gagal. Lihat catatan di
      // `ambilDariDrive()`.
      'X-Sumber-Materi': 'bucket',
    },
  })
}

/**
 * Bentuk nilai kredensial, tanpa nilainya.
 *
 * Panjang dan awalannya cukup menunjuk sebabnya: kunci yang benar 1700-an
 * karakter dan diawali `-----BEGIN`, sedangkan alamat service account cuma
 * puluhan karakter — kalau keduanya tertukar saat ditempel, angkanya yang
 * memberi tahu, bukan tebakan. Tidak ada potongan isinya yang dikembalikan.
 */
function bentukKredensial() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ?? ''
  const k = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '').trim()
  const diawali = k.startsWith('-----BEGIN')
    ? 'PEM'
    : k.startsWith('{')
      ? 'JSON'
      : k.startsWith('"') || k.startsWith("'")
        ? 'tanda kutip'
        : k
          ? 'lainnya'
          : 'kosong'
  // Alamatnya TIDAK dikembalikan apa adanya.
  //
  // Awalnya ia dianggap tidak rahasia — memang begitu, kalau isinya memang
  // alamat. Tapi variabel bisa tertukar isi, dan di sini benar-benar tertukar:
  // yang tersimpan di sana adalah badan kunci privat, dan menampilkannya apa
  // adanya mencetak kunci itu ke sebuah halaman web. Yang menentukan rahasia
  // atau tidak bukan NAMA variabelnya melainkan isinya, dan isinya tidak bisa
  // dipastikan dari sini. Jadi tidak ada nilai kredensial yang keluar utuh —
  // bentuknya saja, untuk semuanya.
  const alamatWajar = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  return {
    email: email ? (alamatWajar ? email : `(bukan alamat — ${email.length} karakter)`) : '(kosong)',
    panjang_kunci: k.length,
    diawali,
    memuat_private_key: k.includes('PRIVATE KEY'),
    memuat_escape_n: k.includes('\\n'),
  }
}

/** Jenis Google-native yang harus diekspor jadi PDF; sisanya diambil apa adanya. */
const EKSPOR_PDF = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.spreadsheet',
])

/**
 * Berkas Drive sebagai respons PDF, atau null kalau tidak bisa diambil.
 *
 * Null BUKAN kesalahan yang perlu diteriakkan: ia berarti "coba jalan yang
 * lain", dan pemanggilnya memang punya satu. Sebabnya bisa kredensial yang
 * belum terpasang, berkas yang belum dibagikan ke service account, atau berkas
 * yang sudah dihapus — ketiganya sama-sama tidak bisa diperbaiki dari sini, dan
 * ketiganya tidak boleh menjatuhkan permintaan selama masih ada salinan.
 *
 * Google Docs/Slides/Sheets diekspor jadi PDF; sisanya (PDF, dan apa pun yang
 * kelak ditaruh admin di folder itu) disalurkan apa adanya. `.docx` dan `.pptx`
 * memang akan terunduh alih-alih tampil — itu bukan yang diperbaiki di sini,
 * melainkan aturan untuk admin: yang ditaruh di `Materi Kurikulum/` harus PDF
 * atau Google Docs.
 */
async function ambilDariDrive(fileId: string): Promise<NextResponse | null> {
  try {
    const drive = getDriveClient()
    const { data: meta } = await drive.files.get({
      fileId,
      fields: 'mimeType, name, size',
      supportsAllDrives: true,
    })
    const mime = meta.mimeType ?? ''

    const berkas = EKSPOR_PDF.has(mime)
      ? await drive.files.export({ fileId, mimeType: 'application/pdf' }, { responseType: 'stream' })
      : await drive.files.get(
          { fileId, alt: 'media', supportsAllDrives: true },
          { responseType: 'stream' },
        )

    const isi = mime === 'application/pdf' || EKSPOR_PDF.has(mime) ? 'application/pdf' : mime
    const kepala: Record<string, string> = {
      'Content-Type': isi,
      // Bukan lampiran: bingkai di halaman topik menampilkannya di tempat, dan
      // `attachment` akan memaksa unduhan yang justru sedang ditinggalkan.
      'Content-Disposition': 'inline',
      // Milik satu pembaca, tidak boleh singgah di cache bersama mana pun.
      'Cache-Control': 'private, no-store',
      // Dari mana byte ini datang, supaya bisa dibaca di DevTools.
      //
      // Kedua jalur menghasilkan PDF yang sama di layar, jadi jalur yang gagal
      // diam-diam TERLIHAT persis seperti jalur yang berhasil — dan justru itu
      // yang membuatnya berbahaya: kredensial yang tidak terpasang di produksi
      // tidak akan pernah mengumumkan dirinya. Header ini satu-satunya cara
      // membedakan keduanya tanpa menebak dari waktu muat.
      'X-Sumber-Materi': 'drive',
    }
    // Ukurannya hanya diketahui untuk berkas biner; hasil ekspor tidak punya
    // panjang yang bisa disebut di muka, dan menebaknya lebih buruk daripada
    // membiarkan responsnya mengalir tanpa Content-Length.
    if (!EKSPOR_PDF.has(mime) && meta.size) kepala['Content-Length'] = String(meta.size)

    return new NextResponse(Readable.toWeb(berkas.data as Readable) as ReadableStream, {
      headers: kepala,
    })
  } catch {
    return null
  }
}

/**
 * Siapa yang akan melayani berkas ini, dinyatakan dalam kalimat.
 *
 * Memakai pemeriksaan yang sama dengan jalur sungguhan — metadata Drive, lalu
 * `pdf_path` di bucket — tapi berhenti sebelum mengambil isinya. Jadi ia murah,
 * dan jawabannya tetap jawaban yang benar.
 *
 * Tidak menyebut apa pun yang belum berhak dilihat pemanggilnya: ia baru
 * dipanggil SETELAH RLS meluluskan barisnya, sama seperti dua jalur lainnya.
 */
async function laporkanSumber(fileId: string, judul: string): Promise<NextResponse> {
  let drive: string
  try {
    const { data: meta } = await getDriveClient().files.get({
      fileId,
      fields: 'mimeType, trashed',
      supportsAllDrives: true,
    })
    const mime = meta.mimeType ?? ''
    const bisa = mime === 'application/pdf' || EKSPOR_PDF.has(mime)
    drive = meta.trashed
      ? 'ada tapi di Sampah Drive'
      : bisa
        ? 'siap'
        : `bentuknya ${mime} — akan terunduh, bukan tampil`
  } catch (e) {
    // Pesannya ikut, bukan cuma kodenya. `ERR_OSSL_UNSUPPORTED` sendirian
    // pernah membuat kami mengira kredensialnya tidak sampai ke server,
    // padahal ia sampai dan cuma bentuknya yang rusak.
    const kode = (e as { code?: number | string }).code
    const pesan = (e as Error).message?.split('\n')[0] ?? ''
    drive = `tidak bisa diambil${kode ? ` (${kode})` : ''}${pesan ? ` — ${pesan.slice(0, 120)}` : ''}`
  }

  const admin = createAdminClient()
  const { data: salinan } = await admin
    .from('curriculum_resource_duplications')
    .select('pdf_path')
    .eq('drive_file_id', fileId)
    .maybeSingle()

  const sumber = drive === 'siap' ? 'drive' : salinan?.pdf_path ? 'bucket' : 'tidak ada'
  return NextResponse.json(
    {
      judul,
      sumber,
      // Bentuk nilai kredensialnya, BUKAN isinya. Cukup untuk membedakan
      // "tertukar dengan email", "terpotong", dan "bukan berkas kunci sama
      // sekali" — tiga sebab yang menghasilkan galat PEM yang sama persis, dan
      // yang tanpa ini hanya bisa ditebak satu per satu lewat coba-coba deploy.
      kredensial: bentukKredensial(),
      arti:
        sumber === 'drive'
          ? 'Dilayani langsung dari folder Drive bimbel. Bucket tidak dipakai.'
          : sumber === 'bucket'
            ? 'Drive TIDAK terpakai — masih ditolong salinan di bucket Supabase. Jangan kosongkan bucket.'
            : 'Tidak ada satu pun sumber yang bisa melayani berkas ini.',
      drive,
      bucket: salinan?.pdf_path ? 'ada salinannya' : 'tidak ada salinan',
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
