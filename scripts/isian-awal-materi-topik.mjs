/**
 * Isian awal `curriculum_resources` dari materi yang sudah diunggah tutor.
 *
 * Materi per TOPIK (`curriculum_resources`) adalah tabel yang benar untuk
 * bahan belajar: dikurasi sekali, lalu dipakai kelas mana pun yang membahas
 * topik itu, dan itulah yang dibaca panel materi di `/belajar` maupun portal
 * keluarga. Masalahnya tabel itu kosong sama sekali di produksi, sementara
 * bimbel sudah punya ratusan tautan — tercatat di `materials`, terikat pada
 * SESI kelas, bukan pada topik.
 *
 * Skrip ini menaikkan yang bisa dinaikkan: materi yang sesinya mencatat
 * `curriculum_topic_id`, sehingga topiknya diketahui tanpa menebak. Sisanya
 * sengaja ditinggalkan — sesi tanpa topik kurikulum berarti kita tidak tahu
 * bahan itu milik topik mana, dan menebaknya berarti mengotori tabel yang
 * justru ada supaya bersih.
 *
 * Ini isian AWAL, bukan penyalin berkelanjutan. Sesudah dijalankan, materi baru
 * ditambahkan lewat /admin/materi-latihan-soal; `materials` tetap jadi lampiran
 * sesi seperti sebelumnya, dan keduanya tidak saling mengikuti.
 *
 * `selected_cp_ids` sengaja TIDAK ikut dibaca. Satu sesi bisa mencentang
 * beberapa CP, dan menempelkan satu materi ke semuanya melipatgandakan barisnya
 * tanpa ada yang pernah memutuskan bahwa bahan itu memang untuk semua CP itu.
 * Yang dipakai cuma topik utama sesinya.
 *
 * Aman diulang: baris yang tautannya sudah ada di topik yang sama dilewati.
 *
 *   node scripts/isian-awal-materi-topik.mjs --dry-run
 *   node scripts/isian-awal-materi-topik.mjs
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// Memuat .env.local sendiri supaya skrip ini bisa dijalankan tanpa pembungkus.
// Nilainya tidak pernah dicetak — kunci service role tidak boleh mendarat di
// riwayat terminal siapa pun.
try {
  for (const baris of readFileSync('.env.local', 'utf8').split('\n')) {
    const cocok = baris.match(/^([A-Z_]+)=(.*)$/)
    if (cocok && !process.env[cocok[1]]) process.env[cocok[1]] = cocok[2].replace(/^["']|["']$/g, '')
  }
} catch {
  // Tidak apa-apa: env boleh datang dari luar.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !kunci) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diatur.')
  process.exit(1)
}

// Service role, bukan sesi: skrip ini menulis atas nama pemeliharaan, dan
// `curriculum_resources` hanya terbuka untuk `is_admin()`.
const db = createClient(url, kunci)
const kering = process.argv.includes('--dry-run')

const { data: materials, error: galatMaterials } = await db
  .from('materials')
  .select('id, title, link_url, session_id, uploaded_by, created_at')
  .not('link_url', 'is', null)
  .order('created_at', { ascending: true })
if (galatMaterials) {
  console.error('Gagal membaca materials:', galatMaterials.message)
  process.exit(1)
}

const { data: sesi } = await db
  .from('sessions')
  .select('id, curriculum_topic_id')
  .not('curriculum_topic_id', 'is', null)
const topikSesi = new Map((sesi ?? []).map((s) => [s.id, s.curriculum_topic_id]))

// `curriculum_topics` adalah tabel datar — satu topik bisa punya banyak baris,
// dan yang menyatukannya adalah `group_id` (migrasi 060). Yang ditunjuk sesi
// adalah barisnya, yang dipakai materi adalah group-nya.
const { data: topikRows } = await db.from('curriculum_topics').select('id, group_id')
const groupDariTopik = new Map((topikRows ?? []).map((t) => [t.id, t.group_id]))

const { data: groups } = await db
  .from('curriculum_topic_groups')
  .select('id, curriculum, subject_id, grade_level, semester, theme, topic')
const groupById = new Map((groups ?? []).map((g) => [g.id, g]))

const { data: sudahAda } = await db.from('curriculum_resources').select('group_id, link_url')
// Dua himpunan dari sumber yang sama: `awal` beku sebagai potret isi tabel
// sebelum skrip berjalan, `kunciAda` ikut tumbuh selama perulangan. Yang
// pertama membedakan "sudah pernah dinaikkan" dari "kembar di dalam jalannya
// sendiri" — dua sebab yang berbeda, dan laporannya lebih berguna kalau
// keduanya tidak dicampur.
const awal = new Set((sudahAda ?? []).map((r) => `${r.group_id}|${r.link_url}`))
const kunciAda = new Set(awal)

const barisBaru = []
const alasan = { 'sesi tanpa topik kurikulum': 0, 'topik tanpa group': 0, 'sudah ada': 0, kembar: 0 }

for (const m of materials ?? []) {
  const topikId = topikSesi.get(m.session_id)
  if (!topikId) {
    alasan['sesi tanpa topik kurikulum']++
    continue
  }
  const groupId = groupDariTopik.get(topikId)
  const group = groupId ? groupById.get(groupId) : null
  if (!group) {
    alasan['topik tanpa group']++
    continue
  }

  const kunciBaris = `${groupId}|${m.link_url}`
  if (kunciAda.has(kunciBaris)) {
    // Bisa datang dari jalannya skrip sebelumnya, bisa juga dari dua sesi
    // berbeda yang melampirkan berkas yang sama untuk topik yang sama.
    alasan[awal.has(kunciBaris) ? 'sudah ada' : 'kembar']++
    continue
  }
  kunciAda.add(kunciBaris)

  barisBaru.push({
    subject_id: group.subject_id,
    curriculum: group.curriculum,
    grade_level: group.grade_level,
    semester: group.semester,
    // Kolomnya `not null` sejak 057, sementara group boleh tanpa tema sejak
    // 098 (TKA). Kosong, bukan gagal.
    theme: group.theme ?? '',
    topic: group.topic,
    group_id: groupId,
    kind: 'materi',
    title: m.title,
    link_url: m.link_url,
    created_by: m.uploaded_by,
  })
}

console.log(`materials bertautan : ${materials?.length ?? 0}`)
console.log(`akan dimasukkan     : ${barisBaru.length}`)
console.log('dilewati            :', alasan)

if (barisBaru.length > 0) {
  console.log('\ncontoh:')
  for (const b of barisBaru.slice(0, 5)) console.log(`  ${b.topic} — ${b.title}`)
}

if (kering) {
  console.log('\n--dry-run: tidak ada yang ditulis.')
  process.exit(0)
}

// Dipotong supaya satu kegagalan tidak menjatuhkan seluruh isian, dan supaya
// permintaannya tidak membengkak.
const POTONG = 100
let masuk = 0
for (let i = 0; i < barisBaru.length; i += POTONG) {
  const potongan = barisBaru.slice(i, i + POTONG)
  const { error } = await db.from('curriculum_resources').insert(potongan)
  if (error) {
    console.error(`Gagal pada potongan ${i / POTONG + 1}:`, error.message)
    process.exit(1)
  }
  masuk += potongan.length
}

console.log(`\n${masuk} materi masuk ke curriculum_resources.`)
console.log('Sisanya dikurasi lewat /admin/materi-latihan-soal.')
