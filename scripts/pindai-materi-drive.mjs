/**
 * Memeriksa materi mana yang benar-benar bisa dibaca anak, lalu menandainya.
 *
 * Menjawab satu pertanyaan per baris materi: kalau seorang anak membukanya
 * sekarang, apakah `/api/materi/[id]` bisa memulangkan sesuatu yang tampil di
 * layar? Tiga hal harus benar sekaligus, dan ketiganya diperiksa di sini
 * dengan cara yang sama seperti rutenya nanti:
 *
 *   1. Tautannya menunjuk sebuah berkas Drive
 *   2. Service account boleh membacanya — berkasnya ada, dan dibagikan
 *   3. Bentuknya bisa DITAMPILKAN browser: PDF, atau Google Docs/Slides/Sheets
 *      yang bisa diekspor jadi PDF
 *
 * Syarat ketiga yang paling sering terlewat. `.docx` dan `.pptx` lolos dua
 * syarat pertama dengan mulus — berkasnya ada, service account bisa membacanya
 * — lalu TERUNDUH alih-alih terbaca saat anak mengetuknya. Dari sudut pandang
 * kode itu sukses; dari sudut pandang anak yang memegang HP, itu kegagalan
 * yang bahkan tidak terlihat sebagai kegagalan.
 *
 * Yang lulus ketiganya diberi `readable_at = now()`; yang tidak dikembalikan ke
 * null. Dua arah, bukan satu — berkas yang dihapus, dipindahkan keluar folder,
 * atau dicabut izinnya harus BERHENTI dijanjikan, dan pemindai yang cuma bisa
 * menyalakan akan mempertahankan janji yang sudah lama tidak bisa ditepati.
 *
 * Dijalankan dengan tangan, bukan dari aplikasi: satu berkas menuntut satu
 * panggilan Drive API, dan halaman yang menggambar daftar mapel tidak boleh
 * menunggu lima puluh panggilan lebih dulu. Jalankan setiap kali admin
 * menambah, mengganti, atau memindahkan materi di folder bimbel.
 *
 * Butuh GOOGLE_SERVICE_ACCOUNT_EMAIL dan _PRIVATE_KEY (atau --kunci <berkas>),
 * plus NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.
 *
 *   node scripts/pindai-materi-drive.mjs            # laporan saja
 *   node scripts/pindai-materi-drive.mjs --tulis    # sekaligus menandai
 */
import { readFileSync } from 'fs'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const TULIS = process.argv.includes('--tulis')

const iKunci = process.argv.indexOf('--kunci')
if (iKunci !== -1) {
  const jalur = process.argv[iKunci + 1]
  if (!jalur || jalur.startsWith('--')) {
    console.error('--kunci butuh jalur ke berkas JSON kunci service account.')
    process.exit(1)
  }
  const k = JSON.parse(readFileSync(jalur.replace(/^~/, process.env.HOME ?? '~'), 'utf8'))
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = k.client_email
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = k.private_key.replace(/\n/g, '\\n')
}

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
if (!email || !key) {
  console.error('GOOGLE_SERVICE_ACCOUNT_EMAIL / _PRIVATE_KEY belum diatur. Pakai --kunci <berkas.json>.')
  process.exit(1)
}

const drive = google.drive({
  version: 'v3',
  auth: new google.auth.JWT({ email, key, scopes: ['https://www.googleapis.com/auth/drive.readonly'] }),
})
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

/** Sama dengan `extractDriveFileId()` di aplikasi; disalin agar skrip ini berdiri sendiri. */
function idBerkas(url) {
  try {
    const u = new URL(url)
    if (!['docs.google.com', 'drive.google.com'].includes(u.hostname)) return null
    if (u.pathname.includes('/forms/d/e/')) return null
    const m = u.pathname.match(/\/d\/([a-zA-Z0-9_-]{15,})/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

/** Bentuk yang benar-benar tampil di dalam halaman. Selebihnya akan terunduh. */
const BISA_TAMPIL = new Set([
  'application/pdf',
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.spreadsheet',
])

const { data: materi, error } = await sb
  .from('curriculum_resources')
  .select('id, title, link_url, readable_at')
  .eq('kind', 'materi')
if (error) {
  console.error('Gagal membaca curriculum_resources:', error.message)
  process.exit(1)
}

const siap = []
const belum = []

for (const r of materi) {
  const fileId = idBerkas(r.link_url)
  if (!fileId) {
    belum.push({ r, sebab: 'bukan tautan berkas Drive' })
    continue
  }
  try {
    const { data: meta } = await drive.files.get({
      fileId,
      fields: 'mimeType, name, trashed',
      supportsAllDrives: true,
    })
    // Berkas di Sampah masih bisa dibaca service account, dan itu justru
    // menyesatkan: ia akan hilang sendiri dalam 30 hari tanpa ada yang tahu.
    if (meta.trashed) belum.push({ r, sebab: 'ada di Sampah Drive' })
    else if (!BISA_TAMPIL.has(meta.mimeType ?? '')) {
      belum.push({ r, sebab: `${(meta.mimeType ?? '?').split('.').pop()} — akan terunduh, bukan tampil` })
    } else siap.push(r)
  } catch (e) {
    const sebab = e?.code === 404 ? 'berkasnya tidak ada' : 'service account tidak boleh membaca'
    belum.push({ r, sebab })
  }
}

console.log(`materi di katalog : ${materi.length}`)
console.log(`  siap dibaca     : ${siap.length}`)
console.log(`  belum           : ${belum.length}`)
if (belum.length) {
  console.log('\nyang belum siap:')
  const perSebab = {}
  for (const b of belum) (perSebab[b.sebab] ??= []).push(b.r.title)
  for (const [sebab, judul] of Object.entries(perSebab).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${judul.length}× ${sebab}`)
    for (const j of judul) console.log(`      - ${j.slice(0, 72)}`)
  }
}

// Perubahan yang akan terjadi, disebut sebelum ditulis — sebuah materi yang
// BERHENTI siap adalah kabar, bukan detail.
const nyala = siap.filter(r => !r.readable_at)
const padam = belum.filter(b => b.r.readable_at)
console.log(`\nperubahan: ${nyala.length} jadi siap, ${padam.length} berhenti siap`)
for (const b of padam) console.log(`  ! berhenti siap: ${b.r.title.slice(0, 60)} — ${b.sebab}`)

if (!TULIS) {
  console.log('\n== LAPORAN SAJA. Tambahkan --tulis untuk menandai. ==')
  process.exit(0)
}

const stempel = new Date().toISOString()
let ok = 0
for (const r of siap) {
  const { error } = await sb.from('curriculum_resources').update({ readable_at: stempel }).eq('id', r.id)
  if (error) console.error('gagal menandai', r.id, error.message)
  else ok++
}
let mati = 0
for (const b of padam) {
  const { error } = await sb.from('curriculum_resources').update({ readable_at: null }).eq('id', b.r.id)
  if (error) console.error('gagal menghapus tanda', b.r.id, error.message)
  else mati++
}
console.log(`\nditandai siap: ${ok} | tanda dicabut: ${mati}`)
