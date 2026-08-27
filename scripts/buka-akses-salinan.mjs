/**
 * Membuka akses SALINAN di Drive TERA — bukan berkas sumbernya.
 *
 * Saudara dekat `buka-akses-materi.mjs`, dan sengaja dipisah. Yang itu membuka
 * berkas SUMBER milik tutor, yang tersebar di Drive macam-macam orang. Yang ini
 * membuka salinan di folder "Materi dan Bank Soal" — berkas yang sudah jadi
 * milik bimbel, dan yang sejak migrasi 117 benar-benar ditautkan halaman
 * /admin/materi-latihan-soal. Selama salinannya tertutup, mengalihkan tautan ke
 * salinan cuma memindahkan layar "Anda memerlukan akses" dari satu berkas ke
 * berkas lain.
 *
 * Daftarnya diambil dari `curriculum_resource_duplications.copy_link`, jadi
 * migrasi 117 harus sudah dijalankan. Baris yang belum punya `copy_link`
 * (peninggalan sebelum migrasi itu) dilewati dan disebutkan di layar.
 *
 * BAWAANNYA TIDAK MENULIS APA-APA, alasannya sama dengan skrip sebelah:
 * salah jalan di sini artinya bahan bimbel bisa dibuka siapa pun di internet
 * yang menebak tautannya.
 *
 *   node scripts/buka-akses-salinan.mjs                     # lihat saja
 *   node scripts/buka-akses-salinan.mjs --ubah              # membuka semuanya
 *   node scripts/buka-akses-salinan.mjs --ubah --hanya-materi
 *
 * `--hanya-materi` menyisakan berkas yang benar-benar dibaca anak di `/belajar`
 * dan membiarkan salinan bank soal tetap tertutup. Alasannya sama dengan yang
 * membuat `buka-akses-materi.mjs` tidak pernah menyentuh `latihan_soal`: itu
 * bahan untuk MENYUSUN soal dan bisa memuat kunci jawaban, dan portal keluarga
 * pun tidak menampilkannya. Membukanya untuk siapa pun yang punya tautan
 * adalah hal yang tidak bisa ditarik kembali dari orang yang sudah menyimpannya.
 *
 * Yang diubah cuma satu: menambahkan izin baca untuk siapa pun yang punya
 * tautannya. Peran yang diberikan `reader`, tidak pernah `writer`. Tidak ada
 * berkas yang dipindah, diubah isinya, apalagi dihapus.
 *
 * CATATAN: salinan-salinan ini dibuat lewat akun pemiliknya, bukan lewat
 * service account. Kalau service account tidak punya hak berbagi atas sebuah
 * berkas, ia dilaporkan di bagian "tidak bisa disentuh" dan harus dibuka
 * manusia dari Drive.
 */

import { readFileSync } from 'node:fs'
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

const MODE = process.argv.includes('--ubah') ? 'ubah' : 'lihat'
const HANYA_MATERI = process.argv.includes('--hanya-materi')

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

/** Sama dengan pemeriksaan di `buka-akses-materi.mjs`: dibuka sungguhan tanpa kredensial. */
async function sudahTerbuka(fileId) {
  try {
    const res = await fetch(`https://drive.google.com/file/d/${fileId}/view`, { redirect: 'manual' })
    const lokasi = res.headers.get('location') ?? ''
    if (res.status === 401 || res.status === 403) return false
    if (lokasi.includes('accounts.google.com')) return false
    return true
  } catch {
    return true
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !kunci) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diatur.')
  process.exit(1)
}

const db = createClient(url, kunci)
const { data: salinan, error } = await db
  .from('curriculum_resource_duplications')
  .select('drive_file_id, copy_link')
if (error) {
  console.error('Gagal membaca curriculum_resource_duplications:', error.message)
  console.error('Kalau pesannya soal kolom copy_link, migrasi 117 belum dijalankan.')
  process.exit(1)
}

/**
 * Id berkas sumber yang dipakai sebagai MATERI di suatu tempat.
 *
 * Tabel duplikasi tidak tahu jenis: kuncinya id berkas, dan berkas yang sama
 * bisa ditautkan sebagai materi di satu baris dan bank soal di baris lain.
 * Jadi jenisnya ditanyakan balik ke tempat tautannya hidup — dan berkas yang
 * dipakai sebagai keduanya dihitung materi, karena memang ada anak yang
 * membacanya.
 */
async function idSumberMateri() {
  const [{ data: kurikulum }, { data: bahan }] = await Promise.all([
    db.from('curriculum_resources').select('link_url').eq('kind', 'materi'),
    db.from('materials').select('link_url').not('link_url', 'is', null),
  ])
  const ids = new Set()
  for (const r of [...(kurikulum ?? []), ...(bahan ?? [])]) {
    const id = idBerkasDrive(r.link_url ?? '')
    if (id) ids.add(id)
  }
  return ids
}

const sumberMateri = HANYA_MATERI ? await idSumberMateri() : null

const berkas = []
let tanpaTautan = 0
let bukanMateri = 0
for (const s of salinan ?? []) {
  if (!s.copy_link) {
    tanpaTautan++
    continue
  }
  if (sumberMateri && !sumberMateri.has(s.drive_file_id)) {
    bukanMateri++
    continue
  }
  const fileId = idBerkasDrive(s.copy_link)
  if (!fileId) {
    tanpaTautan++
    continue
  }
  if (!berkas.some((b) => b.fileId === fileId)) berkas.push({ fileId, link: s.copy_link })
}

console.log(`tercatat tersalin : ${salinan?.length ?? 0}`)
console.log(`punya tautan      : ${berkas.length} (${tanpaTautan} tanpa tautan salinan — dilewati)`)
if (HANYA_MATERI) console.log(`bukan materi      : ${bukanMateri} (dibiarkan tertutup)`)
console.log(`mode              : ${MODE === 'lihat' ? 'LIHAT SAJA (tidak menulis apa pun)' : 'UBAH'}\n`)

const drive = MODE === 'lihat' ? null : getDriveClient()
const hasil = { sudah: 0, dibuka: 0, perlu: 0, takTerjangkau: [] }

for (const b of berkas) {
  if (await sudahTerbuka(b.fileId)) {
    hasil.sudah++
    continue
  }
  if (MODE === 'lihat') {
    hasil.perlu++
    console.log(`  perlu dibuka : ${b.link}`)
    continue
  }
  try {
    await drive.permissions.create({
      fileId: b.fileId,
      requestBody: { type: 'anyone', role: 'reader' },
      sendNotificationEmail: false,
      supportsAllDrives: true,
    })
    hasil.dibuka++
    console.log(`  dibuka  : ${b.link}`)
  } catch (e) {
    hasil.takTerjangkau.push(b.link)
    console.log(`  GAGAL   : ${b.link} — ${e.message}`)
  }
}

console.log('')
console.log(`sudah terbuka     : ${hasil.sudah}`)
if (MODE === 'ubah') console.log(`baru dibuka       : ${hasil.dibuka}`)
else console.log(`perlu dibuka      : ${hasil.perlu}\n\nJalankan lagi dengan --ubah kalau memang mau membukanya.`)
if (hasil.takTerjangkau.length) {
  console.log(`\ntidak bisa disentuh service account (${hasil.takTerjangkau.length}) — harus dibuka manual di Drive:`)
  for (const l of hasil.takTerjangkau) console.log('  -', l)
}
