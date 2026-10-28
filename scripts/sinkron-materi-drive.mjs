/**
 * Menyamakan katalog materi Tera dengan folder "Materi Kurikulum" di Drive.
 *
 * Katalog (`curriculum_resources`, kind = 'materi') hanya terisi kalau admin
 * mengetik satu tautan per topik, sementara tutor terus menaruh PDF baru di
 * Drive. Selisihnya tidak terlihat di mana pun: isi berkas yang sudah
 * terdaftar tampil mutakhir karena halaman membacanya langsung dari Drive, tapi
 * berkas yang BELUM terdaftar tidak pernah sampai ke layar keluarga. Skrip ini
 * menutup selisih itu.
 *
 * Aturan pencocokan — persis susunan yang dibuat `rapikan-materi-drive.mjs`:
 *
 *   Materi Kurikulum / <Mapel> / <Kelas> / <Topik> / berkas.pdf
 *
 * Berkas dihubungkan ke grup topik Tera yang mapelnya, kelasnya, dan topiknya
 * sama setelah dinormalkan (huruf kecil, tanda baca jadi spasi) — normalisasi
 * itu perlu karena Drive mengganti `/`, `?`, dan `:` di nama folder dengan `-`.
 * "Kelas 5 SD" dibaca sebagai "Kelas 5".
 *
 * HANYA YANG COCOK PERSIS yang didaftarkan. Pencocokan berdasarkan kemiripan
 * sengaja tidak dipakai: salah menaruh materi di topik lain berarti anak
 * membaca bahan yang keliru, kegagalan yang tak tampak sebagai kegagalan. Yang
 * tidak cocok dilaporkan beserta saran terdekatnya, untuk diputuskan manusia —
 * sering kali topiknya memang belum ada di kurikulum Tera, dan itu urusan lain.
 *
 * Tidak ada yang dihapus. Baris materi yang berkasnya sudah tidak ada di folder
 * hanya dilaporkan; ia tidak ditampilkan ke anak selama `readable_at`-nya null
 * (lihat `pindai-materi-drive.mjs`).
 *
 * Aman diulang: berkas yang file id-nya sudah ada di katalog dilewati.
 *
 * Sesudah menulis, jalankan `pindai-materi-drive.mjs --tulis` supaya baris baru
 * ditandai siap dibaca (`readable_at`). Tanpa itu, materinya terdaftar tapi
 * belum disebut kepada anak.
 *
 *   node --env-file=.env.local scripts/sinkron-materi-drive.mjs --kunci ~/kunci.json          # laporan
 *   node --env-file=.env.local scripts/sinkron-materi-drive.mjs --kunci ~/kunci.json --tulis   # mendaftarkan
 */
import { readFileSync } from 'fs'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const TULIS = process.argv.includes('--tulis')
const ROOT = '1uYbssLlmPq1oaKKdTqWJBuSd63SRXs4v' // folder bimbel, sama dengan rapikan-materi-drive.mjs

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

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const drive = google.drive({
  version: 'v3',
  auth: new google.auth.JWT({ email, key, scopes: ['https://www.googleapis.com/auth/drive.readonly'] }),
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
async function ambilBerkas(rootId) {
  const berkas = []
  let tingkat = [{ id: rootId, jalur: [] }]
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
          tingkat.push({ id: x.id, jalur: [...f.jalur, x.name] })
        } else {
          berkas.push({ id: x.id, name: x.name, mimeType: x.mimeType, jalur: f.jalur })
        }
      }
    }
  }
  return berkas
}

const norm = s => (s ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim()
const kelasDari = s => (s.match(/Kelas\s+\d+/i)?.[0] ?? s).replace(/\s+/g, ' ')
const idDari = u => u?.match(/[-\w]{25,}/g) ?? []
const tok = s => new Set(norm(s).split(' ').filter(w => w.length > 2))
const jaccard = (a, b) => {
  const i = [...a].filter(x => b.has(x)).length
  return i / (a.size + b.size - i || 1)
}

/** "18. Materi_7 SMP_IPA_Pengenalan Gaya.docx.pdf" → "Materi_7 SMP_IPA_Pengenalan Gaya" */
const judulDari = nama => nama.replace(/\.(docx?|pptx?)?\.?pdf$/i, '').replace(/\.pdf$/i, '').replace(/^\d+\.\s*/, '').trim()

const adalahPdf = b => b.mimeType === 'application/pdf' || /\.pdf$/i.test(b.name)

console.log('membaca folder Drive…')
const akarMateri = (await isiFolder(ROOT)).find(f => f.name === 'Materi Kurikulum')
if (!akarMateri) {
  console.error('Folder "Materi Kurikulum" tidak ditemukan di folder bimbel.')
  process.exit(1)
}
const berkas = (await ambilBerkas(akarMateri.id)).filter(adalahPdf)

const [{ data: grup }, { data: katalog }] = await Promise.all([
  db.from('curriculum_topic_groups').select('id, curriculum, subject_id, grade_level, semester, theme, topic, subjects(name)'),
  db.from('curriculum_resources').select('id, kind, title, link_url'),
])

const terdaftar = new Set((katalog ?? []).flatMap(r => idDari(r.link_url)))
const idxGrup = new Map()
for (const g of grup ?? []) {
  const kunci = [norm(g.subjects?.name), norm(g.grade_level), norm(g.topic)].join('|')
  idxGrup.set(kunci, [...(idxGrup.get(kunci) ?? []), g])
}

const baru = []
const ambigu = []
const tanpaCocok = []
let sudah = 0
for (const b of berkas) {
  if (terdaftar.has(b.id)) { sudah++; continue }
  const [mapel, kelas, ...sisa] = b.jalur
  // Topiknya folder ketiga; berkas di bawah subfolder tambahan (mis. "TKA Kelas 6")
  // dicoba dengan folder paling dalamnya.
  const calon = [sisa[0], sisa.at(-1)].filter(Boolean)
  let cocok = []
  for (const t of calon) {
    cocok = idxGrup.get([norm(mapel), norm(kelasDari(kelas ?? '')), norm(t)].join('|')) ?? []
    if (cocok.length) break
  }
  if (cocok.length === 1) baru.push({ b, g: cocok[0] })
  else if (cocok.length > 1) ambigu.push({ b, cocok })
  else tanpaCocok.push(b)
}

console.log(`\nberkas PDF di Materi Kurikulum : ${berkas.length}`)
console.log(`sudah terdaftar                : ${sudah}`)
console.log(`akan didaftarkan (cocok persis): ${baru.length}`)
console.log(`ambigu (lebih dari satu grup)  : ${ambigu.length}`)
console.log(`tanpa kecocokan                : ${tanpaCocok.length}`)
console.log(`mode                           : ${TULIS ? 'TULIS' : 'LAPORAN SAJA (tidak menulis apa pun)'}\n`)

if (ambigu.length) {
  console.log('AMBIGU — perlu diputuskan:')
  for (const a of ambigu) console.log(`  ${a.b.jalur.join(' / ')}  →  ${a.cocok.map(c => c.theme).join(' | ')}`)
  console.log()
}

if (tanpaCocok.length) {
  console.log('TANPA KECOCOKAN — topiknya tidak ada di kurikulum Tera dengan nama yang sama.')
  console.log('Saran terdekat hanya petunjuk, bukan keputusan:\n')
  for (const b of tanpaCocok) {
    const [mapel, kelas, ...sisa] = b.jalur
    const topik = sisa.at(-1) ?? ''
    const kolam = (grup ?? []).filter(g => norm(g.subjects?.name) === norm(mapel) && norm(g.grade_level) === norm(kelasDari(kelas ?? '')))
    const terdekat = kolam
      .map(g => ({ g, s: jaccard(tok(g.topic), tok(topik)) }))
      .sort((x, y) => y.s - x.s)[0]
    console.log(`  ${b.jalur.join(' / ')}`)
    console.log(
      kolam.length === 0
        ? '      (tidak ada topik untuk mapel + kelas ini di Tera)'
        : `      terdekat (${terdekat.s.toFixed(2)}): ${terdekat.g.theme} / ${terdekat.g.topic}`,
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

if (!TULIS) {
  console.log('Tambahkan --tulis untuk mendaftarkan yang cocok persis.')
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
    title: judulDari(b.name),
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
console.log('Jalankan pindai-materi-drive.mjs --tulis supaya baris baru ditandai siap dibaca.')
