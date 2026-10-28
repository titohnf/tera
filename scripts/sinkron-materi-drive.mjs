/**
 * Menyamakan katalog materi Tera dengan folder "Materi Kurikulum" di Drive.
 *
 * Katalog (`curriculum_resources`, kind = 'materi') hanya terisi kalau ada baris,
 * sementara tutor terus menaruh PDF baru di Drive. Selisihnya tidak terlihat di
 * mana pun: isi berkas yang sudah terdaftar tampil mutakhir karena halaman
 * membacanya langsung dari Drive, tapi berkas yang BELUM terdaftar tidak pernah
 * sampai ke layar keluarga. Skrip ini menutup selisih itu.
 *
 * Aturan pencocokan ada di `lib/materi-pemetaan.ts`, dan tidak pernah menebak:
 *
 *   1. kode topik di nama folder   —  "Pengenalan Gaya [t-9f3a2c]"
 *   2. peta keputusan manual       —  scripts/materi-pemetaan.json
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
import {
  bangunIndeks, cocokkan, judulDariNama, kemiripan, kodeTopik, kunciJalur, tanpaKode,
} from '../lib/materi-pemetaan.ts'

const TULIS = process.argv.includes('--tulis')
const BERI_KODE = process.argv.includes('--beri-kode')
const DAFTAR_KODE = process.argv.includes('--daftar-kode')
const ROOT = '1uYbssLlmPq1oaKKdTqWJBuSd63SRXs4v' // folder bimbel, sama dengan rapikan-materi-drive.mjs

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: grup, error: eGrup } = await db
  .from('curriculum_topic_groups')
  .select('id, curriculum, subject_id, grade_level, semester, theme, topic, subjects(name)')
if (eGrup) { console.error(eGrup.message); process.exit(1) }

// ── Daftar kode: tidak perlu Drive ──────────────────────────────────────────
if (DAFTAR_KODE) {
  const { data: materi } = await db.from('curriculum_resources').select('group_id, readable_at').eq('kind', 'materi')
  const jumlah = new Map()
  for (const m of materi ?? []) if (m.readable_at) jumlah.set(m.group_id, (jumlah.get(m.group_id) ?? 0) + 1)
  const sel = s => `"${String(s ?? '').replace(/"/g, '""')}"`
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

async function isiFolder(id) {
  const out = []
  let token
  do {
    const r = await drive.files.list({
      q: `'${id}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
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

// Satu tingkat folder sekali jalan, dengan banyak folder sekaligus: pohonnya
// ratusan folder, dan menelusurinya satu per satu memakan beberapa menit.
// `ids` sejajar dengan `jalur` — id folder tiap segmen, dipakai `--beri-kode`.
async function ambilBerkas(rootId) {
  const berkas = []
  let tingkat = [{ id: rootId, jalur: [], ids: [] }]
  while (tingkat.length) {
    const hasil = []
    for (let i = 0; i < tingkat.length; i += 8) {
      const potong = tingkat.slice(i, i + 8)
      const isi = await Promise.all(potong.map(f => isiFolder(f.id)))
      potong.forEach((f, j) => hasil.push({ f, isi: isi[j] }))
    }
    tingkat = []
    for (const { f, isi } of hasil) {
      for (const x of isi) {
        if (x.mimeType === 'application/vnd.google-apps.folder') {
          tingkat.push({ id: x.id, jalur: [...f.jalur, x.name], ids: [...f.ids, x.id] })
        } else {
          berkas.push({ id: x.id, name: x.name, mimeType: x.mimeType, jalur: f.jalur, ids: f.ids })
        }
      }
    }
  }
  return berkas
}

const adalahPdf = b => b.mimeType === 'application/pdf' || /\.pdf$/i.test(b.name)
const idDari = u => u?.match(/[-\w]{25,}/g) ?? []

console.log('membaca folder Drive…')
const akarMateri = (await isiFolder(ROOT)).find(f => f.name === 'Materi Kurikulum')
if (!akarMateri) {
  console.error('Folder "Materi Kurikulum" tidak ditemukan di folder bimbel.')
  process.exit(1)
}
const berkas = (await ambilBerkas(akarMateri.id)).filter(adalahPdf)

const peta = JSON.parse(readFileSync(new URL('./materi-pemetaan.json', import.meta.url), 'utf8'))
const indeks = bangunIndeks(grup, peta)
const { data: katalog } = await db.from('curriculum_resources').select('id, kind, title, link_url')
const terdaftar = new Set((katalog ?? []).flatMap(r => idDari(r.link_url)))

const baru = []
const dilewati = { sudah: 0 }
const cara = { kode: 0, peta: 0, nama: 0 }
const ambigu = []
const kodeAsing = []
const tanpaCocok = []
const foldersCocok = new Map() // id folder topik → { jalur, grup, namaSekarang }

for (const b of berkas) {
  const h = cocokkan(b.jalur, indeks)
  if (h.status === 'cocok') {
    // Folder topik = segmen ketiga (Mapel / Kelas / Topik). Dipakai --beri-kode.
    if (b.ids[2] && !foldersCocok.has(b.ids[2])) {
      foldersCocok.set(b.ids[2], { jalur: b.jalur.slice(0, 3), grup: h.grup, nama: b.jalur[2] })
    }
  }
  if (terdaftar.has(b.id)) { dilewati.sudah++; continue }
  if (h.status === 'cocok') { baru.push({ b, g: h.grup }); cara[h.cara]++ }
  else if (h.status === 'ambigu') ambigu.push({ b, calon: h.calon })
  else if (h.status === 'tak-ada') tanpaCocok.push(b)
  else kodeAsing.push({ b, status: h.status, kode: h.kode })
}

console.log(`\nberkas PDF di Materi Kurikulum : ${berkas.length}`)
console.log(`sudah terdaftar                : ${dilewati.sudah}`)
console.log(`akan didaftarkan               : ${baru.length}  (lewat kode ${cara.kode}, peta ${cara.peta}, nama persis ${cara.nama})`)
console.log(`ambigu (lebih dari satu grup)  : ${ambigu.length}`)
console.log(`kode/peta tak dikenal          : ${kodeAsing.length}`)
console.log(`tanpa kecocokan                : ${tanpaCocok.length}`)
console.log(`mode                           : ${TULIS ? 'TULIS' : 'LAPORAN SAJA (tidak menulis apa pun)'}\n`)

if (ambigu.length) {
  console.log('AMBIGU — beri kode topik di nama folder:')
  for (const a of ambigu) console.log(`  ${a.b.jalur.join(' / ')}  →  ${a.calon.map(c => `${kodeTopik(c.id)} ${c.theme}`).join(' | ')}`)
  console.log()
}

if (kodeAsing.length) {
  console.log('KODE / PETA TAK DIKENAL — grup topiknya sudah dihapus atau kodenya salah ketik:')
  for (const a of kodeAsing) console.log(`  ${a.b.jalur.join(' / ')}  →  ${a.kode} (${a.status})`)
  console.log()
}

if (tanpaCocok.length) {
  // Satu baris per FOLDER, bukan per berkas: yang perlu diputuskan folder-nya.
  const perFolder = new Map()
  for (const b of tanpaCocok) {
    const k = kunciJalur(b.jalur)
    perFolder.set(k, [...(perFolder.get(k) ?? []), b])
  }
  console.log(`TANPA KECOCOKAN — ${perFolder.size} folder. Untuk mendaftarkannya, beri kode topik di nama foldernya,`)
  console.log('atau tambahkan satu baris ke scripts/materi-pemetaan.json. Saran terdekat hanya petunjuk:\n')
  for (const [k, daftar] of perFolder) {
    const [mapel, kelas, ...sisa] = k.split('/')
    const topik = sisa.at(-1) ?? ''
    const kolam = grup.filter(g => g.subjects?.name === mapel && g.grade_level === (kelas?.match(/Kelas\s+\d+/i)?.[0] ?? kelas))
    const terdekat = kolam
      .map(g => ({ g, s: kemiripan(g.topic, topik) }))
      .sort((x, y) => y.s - x.s)[0]
    console.log(`  ${k}  (${daftar.length} berkas)`)
    console.log(
      kolam.length === 0
        ? '      (tidak ada topik untuk mapel + kelas ini di Tera)'
        : `      terdekat ${kodeTopik(terdekat.g.id)} (${terdekat.s.toFixed(2)}): ${terdekat.g.theme} / ${terdekat.g.topic}`,
    )
  }
  console.log()
}

// Materi yang berkasnya tidak lagi di folder bimbel. Hanya dilaporkan.
const idDiDrive = new Set(berkas.map(b => b.id))
const hilang = (katalog ?? []).filter(r => r.kind === 'materi' && idDari(r.link_url).length && !idDari(r.link_url).some(i => idDiDrive.has(i)))
if (hilang.length) {
  console.log(`Materi terdaftar yang berkasnya tidak ada di Materi Kurikulum (${hilang.length}) — tidak diubah:`)
  for (const r of hilang) console.log(`  ${r.title.slice(0, 70)}`)
  console.log()
}

// ── Memberi kode pada nama folder ───────────────────────────────────────────
if (BERI_KODE) {
  const antre = [...foldersCocok.entries()].filter(([, f]) => !f.nama.includes(`[${kodeTopik(f.grup.id)}]`) && !/\[t-[0-9a-f]{6}\]/i.test(f.nama))
  console.log(`FOLDER YANG AKAN DIBERI KODE: ${antre.length} dari ${foldersCocok.size} folder yang cocok`)
  for (const [, f] of antre.slice(0, 8)) console.log(`  ${f.jalur.join(' / ')}  →  "${tanpaKode(f.nama)} [${kodeTopik(f.grup.id)}]"`)
  if (antre.length > 8) console.log(`  … dan ${antre.length - 8} lainnya`)
  if (!TULIS) {
    console.log('\nTambahkan --tulis untuk benar-benar mengganti nama folder.')
  } else {
    let ok = 0
    for (const [id, f] of antre) {
      try {
        await drive.files.update({ fileId: id, requestBody: { name: `${tanpaKode(f.nama)} [${kodeTopik(f.grup.id)}]` }, supportsAllDrives: true })
        ok++
      } catch (e) {
        console.error(`  GAGAL ${f.jalur.join(' / ')}: ${e.message}`)
      }
    }
    console.log(`nama folder diganti: ${ok} dari ${antre.length}`)
  }
  console.log()
}

if (!TULIS) {
  console.log('Tambahkan --tulis untuk mendaftarkan yang cocok.')
  process.exit(0)
}

let berhasil = 0
for (let i = 0; i < baru.length; i += 25) {
  const paket = baru.slice(i, i + 25).map(({ b, g }) => ({
    subject_id: g.subject_id,
    curriculum: g.curriculum,
    grade_level: g.grade_level,
    semester: g.semester,
    theme: g.theme,
    topic: g.topic,
    group_id: g.id,
    kind: 'materi',
    title: judulDariNama(b.name),
    link_url: `https://drive.google.com/file/d/${b.id}/view`,
  }))
  const { error } = await db.from('curriculum_resources').insert(paket)
  if (error) {
    console.error(`GAGAL pada paket mulai ${i}: ${error.message}`)
    break
  }
  berhasil += paket.length
}
console.log(`terdaftar: ${berhasil} dari ${baru.length}`)
if (berhasil) console.log('Jalankan pindai-materi-drive.mjs --tulis supaya baris baru ditandai siap dibaca.')
