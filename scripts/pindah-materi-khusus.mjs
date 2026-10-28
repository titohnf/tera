/**
 * Memindahkan materi permintaan khusus (kelas privat) keluar dari "Materi
 * Kurikulum" ke folder "Materi Khusus" di sebelahnya.
 *
 * Kenapa: katalog materi tampil ke SEMUA anak di mapel dan kelas yang sama.
 * Materi yang dibuat untuk satu anak ("Mental Math", "Fondasi Berhitung", "Materi
 * OSN", simulasi ASTS) bukan kurikulum baku, dan kalau ditaruh di katalog akan
 * muncul di "Belajar" anak lain. Folder "Materi Kurikulum" dibaca skrip sinkron;
 * "Materi Khusus" tidak — jadi daftar "tanpa kecocokan" berhenti menampung yang
 * memang bukan kurikulum. Materi khusus tetap dilampirkan tutor di jurnal sesi.
 *
 * Yang dipindahkan: berkas dengan jalur di `KHUSUS` di bawah. Susunan subfolder
 * ditiru (`Materi Khusus/<Mapel>/<Kelas>/<Topik>/`) supaya asal-usul tiap berkas
 * tetap terbaca. Berkas hanya DIPINDAH — id-nya tidak berubah, tidak ada yang
 * disalin atau dihapus. Folder kosong yang ditinggalkan dibiarkan.
 *
 * Tiap pemindahan dicatat di `pindah-materi-khusus.log.json` (id berkas, induk
 * lama, induk baru) — cukup untuk mengembalikan semuanya dengan `--batalkan`.
 *
 * Aman diulang: berkas yang sudah di tujuannya dilewati.
 *
 *   node --env-file=.env.local scripts/pindah-materi-khusus.mjs --kunci ~/kunci.json            # laporan
 *   node --env-file=.env.local scripts/pindah-materi-khusus.mjs --kunci ~/kunci.json --tulis     # memindahkan
 *   node --env-file=.env.local scripts/pindah-materi-khusus.mjs --kunci ~/kunci.json --batalkan  # mengembalikan (laporan)
 *   ... --batalkan --tulis                                                                       # benar-benar mengembalikan
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { google } from 'googleapis'

const TULIS = process.argv.includes('--tulis')
const BATALKAN = process.argv.includes('--batalkan')
const ROOT = '1uYbssLlmPq1oaKKdTqWJBuSd63SRXs4v'
const LOG = new URL('./pindah-materi-khusus.log.json', import.meta.url)

// Jalur folder (dari "Materi Kurikulum") yang bukan kurikulum baku. Awalan: semua
// berkas di bawah jalur itu ikut.
const KHUSUS = [
  'Fondasi Berhitung/',
  'Matematika/Kelas 6/TKA Kelas 6/',
  'Biologi/Kelas 12/Rangkuman Materi TKA',
  'Kimia/Kelas 10/Materi OSN',
  'Kimia/Kelas 10/Ringkasan Materi Hakikat Ilmu Kimia, Struktur Atom dan Konfigurasi Elektron',
  'Matematika/Kelas 7/Ringkasan Materi Tema Bilangan',
  'Matematika/Kelas 11/Simulasi ASTS',
  'Ekonomi/Kelas 11/Simulasi ASTS',
]

const iKunci = process.argv.indexOf('--kunci')
const jalurKunci = iKunci !== -1 ? process.argv[iKunci + 1] : null
if (!jalurKunci || jalurKunci.startsWith('--')) {
  console.error('--kunci butuh jalur ke berkas JSON kunci service account.')
  process.exit(1)
}
const k = JSON.parse(readFileSync(jalurKunci.replace(/^~/, process.env.HOME ?? '~'), 'utf8'))
const drive = google.drive({
  version: 'v3',
  auth: new google.auth.JWT({
    email: k.client_email,
    key: k.private_key,
    scopes: [TULIS ? 'https://www.googleapis.com/auth/drive' : 'https://www.googleapis.com/auth/drive.readonly'],
  }),
})

async function isiFolder(id) {
  const out = []
  let token
  do {
    const r = await drive.files.list({
      q: `'${id}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, parents)',
      pageSize: 200,
      pageToken: token,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    out.push(...r.data.files)
    token = r.data.nextPageToken
  } while (token)
  return out
}

async function cariAtauBuat(induk, nama) {
  const ada = (await isiFolder(induk)).find(f => f.name === nama && f.mimeType === 'application/vnd.google-apps.folder')
  if (ada) return ada.id
  if (!TULIS) return `(akan dibuat: ${nama})`
  const r = await drive.files.create({
    requestBody: { name: nama, mimeType: 'application/vnd.google-apps.folder', parents: [induk] },
    fields: 'id',
    supportsAllDrives: true,
  })
  return r.data.id
}

// ── Batalkan ────────────────────────────────────────────────────────────────
if (BATALKAN) {
  if (!existsSync(LOG)) { console.error('Tidak ada catatan pemindahan untuk dibatalkan.'); process.exit(1) }
  const catatan = JSON.parse(readFileSync(LOG, 'utf8'))
  console.log(`akan dikembalikan: ${catatan.length} berkas  (${TULIS ? 'TULIS' : 'LAPORAN SAJA'})`)
  let ok = 0
  for (const c of catatan) {
    console.log(`  ${c.jalur}  →  induk lama`)
    if (!TULIS) continue
    await drive.files.update({ fileId: c.id, addParents: c.indukLama, removeParents: c.indukBaru, supportsAllDrives: true })
    ok++
  }
  if (TULIS) console.log(`dikembalikan: ${ok}`)
  process.exit(0)
}

// ── Pindahkan ───────────────────────────────────────────────────────────────
const akarMateri = (await isiFolder(ROOT)).find(f => f.name === 'Materi Kurikulum')
if (!akarMateri) { console.error('Folder "Materi Kurikulum" tidak ditemukan.'); process.exit(1) }

// Telusuri: berkas dengan jalur (dari Materi Kurikulum) dan id induknya.
const berkas = []
async function jelajah(id, jalur) {
  for (const f of await isiFolder(id)) {
    if (f.mimeType === 'application/vnd.google-apps.folder') await jelajah(f.id, [...jalur, f.name])
    else berkas.push({ id: f.id, name: f.name, jalur, induk: id })
  }
}
await jelajah(akarMateri.id, [])

const kena = berkas.filter(b => KHUSUS.some(p => (b.jalur.join('/') + '/').startsWith(p.endsWith('/') ? p : p + '/')))
console.log(`berkas yang akan dipindah ke "Materi Khusus": ${kena.length}  (${TULIS ? 'TULIS' : 'LAPORAN SAJA — tidak mengubah apa pun'})`)
for (const b of kena) console.log(`  ${b.jalur.join(' / ')}  ·  ${b.name.slice(0, 60)}`)

if (!TULIS) {
  console.log('\nTambahkan --tulis untuk membuat folder "Materi Khusus" dan memindahkannya.')
  process.exit(0)
}

const akarKhusus = await cariAtauBuat(ROOT, 'Materi Khusus')
console.log(`\nfolder "Materi Khusus": ${akarKhusus}`)
const catatan = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : []
const cache = new Map()
async function tujuan(jalur) {
  let induk = akarKhusus
  let kunci = ''
  for (const nama of jalur) {
    kunci += '/' + nama
    if (!cache.has(kunci)) cache.set(kunci, await cariAtauBuat(induk, nama))
    induk = cache.get(kunci)
  }
  return induk
}

let pindah = 0
for (const b of kena) {
  const baru = await tujuan(b.jalur)
  if (baru === b.induk) continue
  await drive.files.update({ fileId: b.id, addParents: baru, removeParents: b.induk, supportsAllDrives: true, fields: 'id' })
  catatan.push({ id: b.id, jalur: b.jalur.join(' / ') + ' · ' + b.name, indukLama: b.induk, indukBaru: baru })
  pindah++
}
writeFileSync(LOG, JSON.stringify(catatan, null, 2) + '\n')
console.log(`dipindahkan: ${pindah} dari ${kena.length}. Catatan: scripts/pindah-materi-khusus.log.json`)
