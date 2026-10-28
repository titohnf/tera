/**
 * Menyamakan katalog materi Tera dengan folder "Materi Kurikulum" di Drive.
 *
 * Katalog (`curriculum_resources`, kind = 'materi') hanya terisi kalau ada baris,
 * sementara tutor terus menaruh PDF baru di Drive. Selisihnya tidak terlihat di
 * mana pun: isi berkas yang sudah terdaftar tampil mutakhir karena halaman
 * membacanya langsung dari Drive, tapi berkas yang BELUM terdaftar tidak pernah
 * sampai ke layar keluarga. Skrip ini menutup selisih itu.
 *
 * Aturan pencocokan dan seluruh alurnya ada di `lib/materi-pemetaan.ts` — dipakai juga
 * oleh tombol "Sinkronkan sekarang" di halaman admin dan tugas harian
 * (`/api/cron/sinkron-materi`), jadi yang dijalankan tangan dan yang dijalankan mesin
 * tidak pernah menyimpang. Pencocokan tidak pernah menebak:
 *
 *   1. kode topik di nama folder   —  "Pengenalan Gaya [t-9f3a2c]"
 *   2. peta keputusan manual       —  lib/materi-pemetaan.json
 *   3. nama persis                 —  Mapel / Kelas / Topik sama setelah dinormalkan
 *
 * Yang tidak lolos dilaporkan beserta saran terdekatnya (hanya petunjuk), dan
 * manusia yang memutuskan: tambahkan kode topik ke nama foldernya, atau satu
 * baris ke peta manual. Kode topik tampil di halaman admin Materi dan Latihan
 * Soal, dan `--daftar-kode` mencetak semuanya.
 *
 * Tidak ada yang dihapus. Baris materi yang berkasnya sudah tidak ada di folder
 * hanya dilaporkan; ia tidak ditampilkan ke anak selama `readable_at`-nya null
 * (lihat `pindai-materi-drive.mjs`).
 *
 * Aman diulang: berkas yang file id-nya sudah ada di katalog dilewati.
 *
 * Sesudah menulis, jalankan `pindai-materi-drive.mjs --tulis` supaya baris baru
 * ditandai siap dibaca (`readable_at`). Tanpa itu materinya terdaftar tapi belum
 * disebut kepada anak.
 *
 *   node --env-file=.env.local scripts/sinkron-materi-drive.mjs --kunci ~/kunci.json              # laporan
 *   node --env-file=.env.local scripts/sinkron-materi-drive.mjs --kunci ~/kunci.json --tulis      # mendaftarkan
 *   node --env-file=.env.local scripts/sinkron-materi-drive.mjs --daftar-kode > kode-topik.csv     # semua kode topik
 *   node --env-file=.env.local scripts/sinkron-materi-drive.mjs --kunci ~/kunci.json --beri-kode   # folder mana yang akan diberi kode
 *   ... --beri-kode --tulis                                                                       # benar-benar mengganti nama folder
 *
 * `--beri-kode` HANYA mengganti nama folder topik (menambah " [t-xxxxxx]" di
 * belakangnya) dan hanya untuk folder yang sudah cocok. Isi dan file id tidak
 * berubah, jadi tautan di katalog tetap hidup; dan nama folder tinggal dibalikkan
 * kalau tidak cocok dengan kebiasaan tutor.
 */
import { readFileSync } from 'fs'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { sinkronkanMateri, kodeTopik, tanpaKode } from '../lib/materi-pemetaan.ts'

const TULIS = process.argv.includes('--tulis')
const BERI_KODE = process.argv.includes('--beri-kode')
const DAFTAR_KODE = process.argv.includes('--daftar-kode')

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// ── Daftar kode: tidak perlu Drive ──────────────────────────────────────────
if (DAFTAR_KODE) {
  const { data: grup, error } = await db
    .from('curriculum_topic_groups')
    .select('id, grade_level, semester, theme, topic, subjects(name)')
  if (error) { console.error(error.message); process.exit(1) }
  const { data: materi } = await db.from('curriculum_resources').select('group_id, readable_at').eq('kind', 'materi')
  const jumlah = new Map()
  for (const m of materi ?? []) if (m.readable_at) jumlah.set(m.group_id, (jumlah.get(m.group_id) ?? 0) + 1)
  const sel = x => `"${String(x ?? '').replace(/"/g, '""')}"`
  console.log('kode,mapel,kelas,semester,tema,topik,materi_siap_baca')
  for (const g of [...grup].sort((a, b) =>
    (a.subjects?.name ?? '').localeCompare(b.subjects?.name ?? '') ||
    a.grade_level.localeCompare(b.grade_level, 'id', { numeric: true }) ||
    a.semester - b.semester || a.theme.localeCompare(b.theme) || a.topic.localeCompare(b.topic))) {
    console.log([kodeTopik(g.id), g.subjects?.name, g.grade_level, g.semester, g.theme, g.topic, jumlah.get(g.id) ?? 0].map(sel).join(','))
  }
  process.exit(0)
}

// ── Drive ───────────────────────────────────────────────────────────────────
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
  auth: new google.auth.JWT({
    email,
    key,
    // Menulis (mengganti nama folder) hanya bila diminta dua kali: --beri-kode --tulis.
    scopes: [BERI_KODE && TULIS ? 'https://www.googleapis.com/auth/drive' : 'https://www.googleapis.com/auth/drive.readonly'],
  }),
})

const peta = JSON.parse(readFileSync(new URL('../lib/materi-pemetaan.json', import.meta.url), 'utf8'))

console.log('membaca folder Drive…')
const h = await sinkronkanMateri({ db, drive, peta, tulis: TULIS })

const cara = { kode: 0, peta: 0, nama: 0 }
for (const b of h.baru) cara[b.cara]++
console.log(`\nberkas PDF di Materi Kurikulum : ${h.berkasDrive}`)
console.log(`sudah terdaftar                : ${h.sudahTerdaftar}`)
console.log(`${TULIS ? 'didaftarkan' : 'akan didaftarkan'}${TULIS ? '                    ' : '               '} : ${h.baru.length}  (lewat kode ${cara.kode}, peta ${cara.peta}, nama persis ${cara.nama})`)
console.log(`ambigu (lebih dari satu grup)  : ${h.ambigu.length}`)
console.log(`kode/peta tak dikenal          : ${h.kodeAsing.length}`)
console.log(`tanpa kecocokan                : ${h.tanpaCocok.reduce((n, t) => n + t.berkas, 0)}`)
console.log(`mode                           : ${TULIS ? 'TULIS' : 'LAPORAN SAJA (tidak menulis apa pun)'}\n`)

for (const a of h.ambigu) console.log(`AMBIGU ${a.jalur}  →  ${a.calon.join(' | ')}`)
for (const a of h.kodeAsing) console.log(`KODE TAK DIKENAL ${a.jalur}  →  ${a.kode}`)
if (h.tanpaCocok.length) {
  console.log(`TANPA KECOCOKAN — ${h.tanpaCocok.length} folder. Beri kode topik di nama foldernya, atau tambahkan satu baris ke lib/materi-pemetaan.json:\n`)
  for (const t of h.tanpaCocok) {
    console.log(`  ${t.jalur}  (${t.berkas} berkas)`)
    console.log(`      ${t.saran ? `terdekat ${t.saran}` : '(tidak ada topik untuk mapel + kelas ini di Tera)'}`)
  }
  console.log()
}
if (h.hilang.length) {
  console.log(`Materi terdaftar yang berkasnya tidak ada di Materi Kurikulum (${h.hilang.length}) — tidak diubah:`)
  for (const t of h.hilang) console.log(`  ${t.slice(0, 70)}`)
  console.log()
}
console.log(`materi di katalog : ${h.pindai.total}`)
console.log(`  siap dibaca     : ${h.pindai.siap}`)
console.log(`  belum           : ${h.pindai.belum.length}`)
console.log(`perubahan: ${h.pindai.menyala} jadi siap, ${h.pindai.padam} berhenti siap${h.pindai.tidakPasti ? `, ${h.pindai.tidakPasti} gagal diperiksa` : ''}\n`)

// ── Memberi kode pada nama folder ───────────────────────────────────────────
if (BERI_KODE) {
  const antre = h.folderCocok.filter(f => !/\[t-[0-9a-f]{6}\]/i.test(f.nama))
  console.log(`FOLDER YANG AKAN DIBERI KODE: ${antre.length} dari ${h.folderCocok.length} folder yang cocok`)
  for (const f of antre.slice(0, 8)) console.log(`  ${f.jalur.join(' / ')}  →  "${tanpaKode(f.nama)} [${f.kode}]"`)
  if (antre.length > 8) console.log(`  … dan ${antre.length - 8} lainnya`)
  if (!TULIS) {
    console.log('\nTambahkan --tulis untuk benar-benar mengganti nama folder.')
  } else {
    let ok = 0
    for (const f of antre) {
      try {
        await drive.files.update({ fileId: f.id, requestBody: { name: `${tanpaKode(f.nama)} [${f.kode}]` }, supportsAllDrives: true })
        ok++
      } catch (e) {
        console.error(`  GAGAL ${f.jalur.join(' / ')}: ${e.message}`)
      }
    }
    console.log(`nama folder diganti: ${ok} dari ${antre.length}`)
  }
  console.log()
}

if (!TULIS) console.log('Tambahkan --tulis untuk mendaftarkan yang cocok dan menandai yang siap dibaca.')
