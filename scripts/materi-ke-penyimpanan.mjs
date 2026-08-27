/**
 * Memindahkan materi dari Drive ke penyimpanan Tera, sekali jalan.
 *
 * Yang membuat ini ada: berkas Drive dijaga identitas GOOGLE, sedangkan yang
 * kita kenal identitas TERA. Selama materinya tautan Drive, satu-satunya cara
 * membuatnya terbaca anak adalah membukanya untuk siapa saja yang punya
 * tautannya — yang berarti juga untuk siapa saja di internet yang menerima
 * tautan itu dari mereka. Setelah dipindahkan, yang menjaganya `/api/materi/[id]`
 * dan sesi Tera, dan berkas Drive-nya bisa tetap tertutup rapat.
 *
 * Yang dipindahkan: setiap berkas Drive yang ditautkan `curriculum_resources`
 * sebagai `kind = 'materi'` — persis yang dibaca `/belajar`, tidak lebih.
 *
 * Berkas yang punya salinan di folder bimbel (`copy_link`, migrasi 117) dibaca
 * dari salinannya. Yang tidak punya dibaca LANGSUNG dari berkas tutornya, dan
 * itu bukan kompromi: sejak materi hidup di bucket sendiri, menyalinnya ke
 * Drive lebih dulu tidak menghasilkan apa pun yang belum kita punya. Salinan
 * Drive dulu ada supaya bimbel memiliki berkasnya; sekarang kepemilikan itu
 * datang dari PDF di penyimpanan kita, yang jauh lebih tidak bisa dicabut
 * daripada berkas Drive yang izinnya dipegang orang lain.
 *
 * Membaca sumber langsung menuntut service account punya akses baca ke berkas
 * itu — entah karena tutornya membukanya untuk siapa saja yang punya link,
 * entah karena berkasnya dibagikan ke alamat service account. Yang tidak bisa
 * dibaca dilaporkan per berkas, dan tidak menghentikan yang lain.
 *
 * Semuanya jadi PDF. Materi yang ada berbentuk .docx, .pptx, .pdf, dan Google
 * Docs; browser cuma bisa menampilkan dua yang terakhir, dan bingkai pratinjau
 * Drive yang selama ini menutupi bedanya justru yang sedang kita tinggalkan.
 *
 * Berkas Google diekspor langsung oleh Drive. Berkas unggahan (.docx/.pptx)
 * dikonversi DI SINI dengan LibreOffice, bukan dengan menyalinnya dulu jadi
 * format Google. Cara yang kedua itu yang pertama kali dicoba, dan ia mustahil:
 * salinannya menjadi milik service account, dan service account tidak punya
 * jatah penyimpanan Drive sama sekali — 0 byte, bukan kuota kecil. Membagikan
 * folder kepadanya tidak menolong, karena yang dihitung Drive adalah pemilik
 * berkasnya, dan pemilik salinan adalah yang menyalin. Jawabannya "jangan
 * menulis apa pun ke Drive", bukan "beri izin lebih banyak".
 *
 * Butuh LibreOffice (`brew install --cask libreoffice`). Yang dipakai hanya
 * `soffice --headless --convert-to pdf`, dan berkas sementaranya duduk di
 * direktori sementara sistem, bukan di dalam repo.
 *
 * HANYA `kind = 'materi'`. `latihan_soal` tidak pernah disentuh, alasan yang
 * sama dengan `buka-akses-materi.mjs`: itu bahan penyusun soal dan bisa memuat
 * kunci jawaban.
 *
 * BAWAANNYA TIDAK MENULIS APA-APA.
 *
 *   node scripts/materi-ke-penyimpanan.mjs           # lihat rencananya
 *   node scripts/materi-ke-penyimpanan.mjs --ubah    # benar-benar memindahkan
 *   node scripts/materi-ke-penyimpanan.mjs --ubah --kunci ~/kunci.json
 *
 * Aman diulang: berkas yang `pdf_path`-nya sudah terisi dilewati.
 *
 * Butuh GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
 * dan service account itu harus punya akses baca ke folder salinan. `--kunci`
 * menerima berkas JSON kunci apa adanya seperti yang diunduh dari Google Cloud,
 * dan menyusun kedua nilai itu darinya. Itu ada karena cara satunya —
 * menempelkan kunci privat PEM ke dalam berkas .env sebagai SATU baris dengan
 * `\n` yang di-escape — adalah langkah yang paling mudah salah diam-diam:
 * kunci yang formatnya rusak gagal saat menandatangani, jauh dari tempat
 * kesalahannya dibuat.
 *
 * Isi berkas kuncinya tidak pernah dicetak, dan jalur berkasnya tidak pernah
 * ditulis ke mana pun.
 */

import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { getDriveClient } from '../lib/google-drive.ts'

try {
  for (const baris of readFileSync('.env.local', 'utf8').split('\n')) {
    const cocok = baris.match(/^([A-Z_]+)=(.*)$/)
    if (cocok && !process.env[cocok[1]]) process.env[cocok[1]] = cocok[2].replace(/^["']|["']$/g, '')
  }
} catch {
  // Boleh datang dari luar.
}

const UBAH = process.argv.includes('--ubah')

const berkasKunci = process.argv[process.argv.indexOf('--kunci') + 1]
if (process.argv.includes('--kunci')) {
  if (!berkasKunci || berkasKunci.startsWith('--')) {
    console.error('--kunci butuh jalur ke berkas JSON kunci service account.')
    process.exit(1)
  }
  try {
    const k = JSON.parse(readFileSync(berkasKunci.replace(/^~/, process.env.HOME ?? '~'), 'utf8'))
    if (!k.client_email || !k.private_key) throw new Error('tidak ada client_email / private_key di dalamnya')
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = k.client_email
    // `getDriveClient()` meng-escape `\n` balik jadi baris baru, jadi yang
    // dikirim dari sini harus berbentuk escape — sama seperti kalau nilainya
    // datang dari .env.
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = k.private_key.replace(/\n/g, '\\n')
  } catch (e) {
    console.error('Gagal membaca berkas kunci:', e.message)
    process.exit(1)
  }
}

const GOOGLE = {
  'application/vnd.google-apps.document': null,
  'application/vnd.google-apps.presentation': null,
  'application/vnd.google-apps.spreadsheet': null,
}

const SOFFICE = '/Applications/LibreOffice.app/Contents/MacOS/soffice'

/**
 * Batas ukuran PDF yang mau kita simpan.
 *
 * Angkanya bukan pilihan kita: penyimpanan Supabase pada plan project ini
 * menolak objek di atas 50 MB, dan penolakannya datang sebagai
 * "The object exceeded the maximum allowed size" setelah seluruh berkas
 * terlanjur diunduh dan dikonversi. Memeriksanya lebih dulu menghemat
 * pekerjaan itu dan, lebih penting, mengubah kegagalan yang membingungkan jadi
 * kalimat yang menyebut berkas mana dan berapa besarnya.
 *
 * Yang kebesaran DILEWATI, bukan dipaksa masuk. Mengecilkannya berarti
 * menurunkan resolusi gambar pindaian — dan buku pelajaran SD yang dipindai
 * adalah justru jenis berkas yang paling cepat jadi tidak terbaca kalau
 * gambarnya diturunkan. Materi seperti ini tetap memakai tautan Drive-nya
 * lewat urutan cadangan di `materiTopik()`; yang hilang cuma kemampuan
 * membacanya di dalam halaman, bukan materinya.
 */
const BATAS = 45 * 1024 * 1024

/**
 * Byte berkas unggahan jadi PDF, lewat LibreOffice.
 *
 * Nama berkas sementaranya dijaga tetap punya akhiran yang benar: LibreOffice
 * memilih penyaring impornya dari akhiran itu, dan berkas tanpa akhiran
 * diperlakukan sebagai teks — hasilnya PDF berisi byte mentah yang terbaca
 * sebagai sampah, BUKAN sebuah kegagalan yang terlihat.
 */
function keP(bytes, namaAsli) {
  const dir = mkdtempSync(join(tmpdir(), 'materi-'))
  try {
    const akhiran = (basename(namaAsli).match(/\.[a-z0-9]+$/i) ?? ['.docx'])[0]
    const masuk = join(dir, `bahan${akhiran}`)
    writeFileSync(masuk, bytes)
    execFileSync(SOFFICE, ['--headless', '--convert-to', 'pdf', '--outdir', dir, masuk], {
      stdio: 'ignore',
      timeout: 5 * 60 * 1000,
    })
    return readFileSync(join(dir, 'bahan.pdf'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function idBerkasDrive(url) {
  try {
    const u = new URL(url)
    if (!['docs.google.com', 'drive.google.com'].includes(u.hostname.replace(/^www\./, ''))) return null
    if (u.pathname.includes('/forms/d/e/')) return null
    const m = u.pathname.match(/\/d\/([a-zA-Z0-9_-]{15,})/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !kunci) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diatur.')
  process.exit(1)
}
const db = createClient(url, kunci)

// Berkas sumber yang dipakai sebagai materi di suatu tempat — penyaring yang
// sama dengan `buka-akses-salinan.mjs`, dan alasannya juga sama.
const [{ data: kurikulum, error: gagalMateri }, { data: salinan, error }] = await Promise.all([
  db.from('curriculum_resources').select('title, link_url').eq('kind', 'materi').order('title'),
  db.from('curriculum_resource_duplications').select('drive_file_id, copy_link, pdf_path'),
])
if (gagalMateri) {
  console.error('Gagal membaca curriculum_resources:', gagalMateri.message)
  process.exit(1)
}
if (error) {
  console.error('Gagal membaca curriculum_resource_duplications:', error.message)
  console.error('Kalau pesannya soal kolom pdf_path, migrasi 120 belum dijalankan.')
  process.exit(1)
}

const salinanById = new Map((salinan ?? []).map((s) => [s.drive_file_id, s]))

// Satu antrean per BERKAS, bukan per baris materi: berkas yang sama ditautkan
// dari banyak topik sekaligus (lihat 058), dan memindahkannya berulang kali
// cuma menimpa PDF yang sama dengan isi yang sama.
const antre = []
const terlihat = new Set()
let sudah = 0
let bukanBerkas = 0
for (const m of kurikulum ?? []) {
  const id = idBerkasDrive(m.link_url ?? '')
  if (!id) { bukanBerkas++; continue }
  if (terlihat.has(id)) continue
  terlihat.add(id)
  const d = salinanById.get(id)
  if (d?.pdf_path) { sudah++; continue }
  const idSalinan = d?.copy_link ? idBerkasDrive(d.copy_link) : null
  antre.push({ sumber: id, baca: idSalinan ?? id, lewatSalinan: !!idSalinan, judul: m.title })
}

console.log(`materi yang sudah pindah : ${sudah}`)
console.log(`akan dipindahkan         : ${antre.length} (${antre.filter(a => a.lewatSalinan).length} lewat salinan, ${antre.filter(a => !a.lewatSalinan).length} langsung dari sumbernya)`)
console.log(`bukan berkas Drive       : ${bukanBerkas} (tautan web lain — dilewati)`)
console.log(`mode                     : ${UBAH ? 'UBAH' : 'LIHAT SAJA (tidak menulis apa pun)'}\n`)

if (!UBAH) {
  for (const a of antre) console.log(`  akan dipindah : ${a.judul.slice(0, 55)}`)
  console.log('\nJalankan lagi dengan --ubah kalau memang mau memindahkannya.')
  process.exit(0)
}

if (!existsSync(SOFFICE)) {
  console.error(`LibreOffice tidak ditemukan di ${SOFFICE}.`)
  console.error('Pasang dengan: brew install --cask libreoffice')
  process.exit(1)
}

const drive = getDriveClient()
let berhasil = 0
const gagal = []
const kebesaran = []

for (const a of antre) {
  try {
    const { data: meta } = await drive.files.get({
      fileId: a.baca,
      fields: 'name, mimeType',
      supportsAllDrives: true,
    })

    let pdf
    if (meta.mimeType in GOOGLE) {
      // Berkas Google: Drive yang mengekspornya, hasilnya paling setia.
      const res = await drive.files.export(
        { fileId: a.baca, mimeType: 'application/pdf' },
        { responseType: 'arraybuffer' },
      )
      pdf = Buffer.from(res.data)
    } else {
      const res = await drive.files.get(
        { fileId: a.baca, alt: 'media', supportsAllDrives: true },
        { responseType: 'arraybuffer' },
      )
      const bytes = Buffer.from(res.data)
      // Sudah PDF: diambil apa adanya, tanpa konversi yang cuma menurunkan mutu.
      pdf = meta.mimeType === 'application/pdf' ? bytes : keP(bytes, meta.name)
    }

    if (pdf.length > BATAS) {
      kebesaran.push(`${meta.name} — ${(pdf.length / 1024 / 1024).toFixed(0)} MB`)
      console.log(`  KEBESARAN : ${meta.name} (${(pdf.length / 1024 / 1024).toFixed(0)} MB, batas ${BATAS / 1024 / 1024} MB)`)
      continue
    }

    // Dinamai dengan id berkas SUMBER, kunci yang sama dengan tabelnya. Nama
    // aslinya tidak dipakai: ada yang mengandung spasi, kurung, dan koma, dan
    // nama berkas adalah hal terakhir yang pantas jadi sumber kejutan.
    const path = `${a.sumber}.pdf`
    const { error: gagalUnggah } = await db.storage
      .from('materi')
      .upload(path, pdf, { contentType: 'application/pdf', upsert: true })
    if (gagalUnggah) throw new Error(gagalUnggah.message)

    // `upsert`, bukan `update`: berkas yang tidak pernah disalin ke Drive belum
    // punya barisnya sama sekali. Barisnya lahir di sini dengan `copy_link`
    // kosong — dan itu memang keadaan yang sebenarnya, bukan data yang hilang:
    // berkas ini tidak punya salinan Drive, ia punya PDF di penyimpanan kita.
    // Kolom lain tidak ikut dikirim, jadi baris lama tidak kehilangan apa pun.
    const { error: gagalTulis } = await db
      .from('curriculum_resource_duplications')
      .upsert({ drive_file_id: a.sumber, pdf_path: path }, { onConflict: 'drive_file_id' })
    if (gagalTulis) throw new Error(gagalTulis.message)

    berhasil++
    console.log(`  pindah : ${meta.name} (${(pdf.length / 1024 / 1024).toFixed(1)} MB)`)
  } catch (e) {
    gagal.push(`${a.judul.slice(0, 45)} — ${e.message}`)
    console.log(`  GAGAL  : ${a.judul.slice(0, 45)} — ${e.message}`)
  }
}

console.log(`\nberhasil : ${berhasil}`)
if (kebesaran.length) {
  console.log(`kebesaran: ${kebesaran.length} — dilewati, tetap memakai tautan Drive-nya:`)
  for (const k of kebesaran) console.log('  -', k)
}
if (gagal.length) {
  console.log(`gagal    : ${gagal.length}`)
  for (const g of gagal) console.log('  -', g)
}
