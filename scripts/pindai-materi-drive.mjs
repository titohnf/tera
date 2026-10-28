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
 * Logikanya ada di `pindaiMateri()` (lib/materi-pemetaan.ts), yang juga dipanggil
 * `sinkronkanMateri()` — jadi tombol "Sinkronkan sekarang" di halaman admin dan
 * tugas harian menandai dengan aturan yang sama. Skrip ini hanya pembungkus
 * untuk menjalankannya dari terminal tanpa mendaftarkan apa pun.
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
import { pindaiMateri } from '../lib/materi-pemetaan.ts'

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
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const h = await pindaiMateri({ db, drive, tulis: TULIS })

console.log(`materi di katalog : ${h.total}`)
console.log(`  siap dibaca     : ${h.siap}`)
console.log(`  belum           : ${h.belum.length}`)
if (h.belum.length) {
  console.log('\nyang belum siap:')
  const perSebab = {}
  for (const b of h.belum) (perSebab[b.sebab] ??= []).push(b.judul)
  for (const [sebab, judul] of Object.entries(perSebab).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${judul.length}× ${sebab}`)
    for (const j of judul) console.log(`      - ${j}`)
  }
}
console.log(`\nperubahan: ${h.menyala} jadi siap, ${h.padam} berhenti siap${h.tidakPasti ? `, ${h.tidakPasti} gagal diperiksa (tidak diubah)` : ''}`)
console.log(TULIS ? `\nditandai: ${h.menyala} jadi siap | ${h.padam} tanda dicabut` : '\n== LAPORAN SAJA. Tambahkan --tulis untuk menandai. ==')
