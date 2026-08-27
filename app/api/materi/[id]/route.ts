export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { extractDriveFileId } from '@/lib/curriculum-resource-links'

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

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

  const admin = createAdminClient()
  const { data: salinan } = await admin
    .from('curriculum_resource_duplications')
    .select('pdf_path')
    .eq('drive_file_id', fileId)
    .maybeSingle()

  // Belum dipindahkan ke penyimpanan Tera. Bukan kesalahan pemakainya, dan
  // bukan kesalahan yang bisa ia perbaiki — pemanggilnya sudah tahu ini bisa
  // terjadi dan tidak pernah menautkan ke sini kalau `pdf_path` kosong.
  const path = (salinan?.pdf_path as string | null) ?? null
  if (!path) return new NextResponse('Materi ini belum tersedia untuk dibaca di halaman', { status: 404 })

  // Byte-nya TIDAK lewat sini. Rute ini memutuskan, lalu menyingkir.
  //
  // Menyalurkan isi berkasnya sendiri terasa lebih rapat, tapi mustahil di
  // tempat ia akan berjalan: fungsi serverless Netlify membatasi respons di
  // sekitar 6 MB, sedangkan materi di sini ada yang 16 MB — dan kegagalannya
  // baru muncul di produksi, tidak pernah di lokal, karena batas itu milik
  // pembungkusnya dan bukan milik kodenya. Membaca seluruh PDF ke memori
  // fungsi juga membayar ongkos yang sama dua kali untuk berkas yang toh sudah
  // duduk di penyimpanan yang bisa menyajikannya sendiri.
  //
  // Yang dijaga tetap sama: URL ini baru dibuat SETELAH RLS mengizinkan, dan
  // umurnya satu menit — cukup untuk bingkai yang sedang memuatnya, terlalu
  // pendek untuk jadi tautan yang beredar. Pola yang sama sudah dipakai
  // `getSignedUrlAdmin()` untuk materi sesi, hanya dengan umur yang jauh lebih
  // panjang di sana.
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
    },
  })
}
