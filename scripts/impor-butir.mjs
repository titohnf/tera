/**
 * Impor butir dari JSON ke `question_bank_items`.
 *
 *   node scripts/impor-butir.mjs docs/impor-butir/contoh-butir.json          # periksa saja
 *   node scripts/impor-butir.mjs docs/impor-butir/contoh-butir.json --tulis  # periksa lalu tulis
 *
 * PERIKSA DULU, TULIS KEMUDIAN, dan itu bukan kehati-hatian umum: butir yang
 * salah bentuk tidak ditolak database. `options` yang keliru untuk sebuah tipe
 * tetap masuk sebagai jsonb yang sah, lalu `nilai_jawaban()` memulangkan 0
 * untuk jawaban yang sebenarnya benar — dan yang terlihat di layar adalah anak
 * yang salah, bukan soal yang salah.
 *
 * KUNCINYA DIUJI DENGAN PENILAI SUNGGUHAN. Tiap butir dikirim ke
 * `nilai_jawaban()` di database bersama jawaban yang MESTINYA benar; kalau
 * nilainya bukan bobot penuh, butirnya ditolak di sini. Menyalin ulang aturan
 * penilaian ke JavaScript berarti dua penilai yang bisa berbeda pendapat, dan
 * yang menentukan nilai anak tetap yang di database.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const TIPE = [
  'mcq_single', 'true_false', 'short_answer', 'essay', 'mcq_multi', 'matching',
  'ordering', 'fill_blank', 'upload_file', 'statement_grid', 'true_false_two_tier',
]
/** Tidak bisa dinilai mesin, jadi tidak boleh masuk kolam mana pun. */
const TANPA_NILAI = ['essay', 'upload_file']
/** Kuncinya tinggal di `options`, bukan di `correct_answer`. */
const KUNCI_DI_OPSI = ['matching', 'ordering']
const KOLAM = ['latihan', 'ujian', 'probe']
const STATUS = ['draf', 'aktif', 'ditarik']
const SUMBER = ['manual', 'ai_generated_verified']
const SOLO = ['unistruktural', 'multistruktural', 'relasional']
const PISA = ['personal', 'occupational', 'societal', 'scientific']
const ELEMEN = ['penalaran', 'pemecahan_masalah', 'komunikasi', 'representasi', 'koneksi']

const KOLOM = [
  'type', 'prompt', 'options', 'correct_answer', 'weight', 'explanation',
  'bloom_level', 'peruntukan', 'topik_id', 'status_verifikasi', 'penjelasan_per_opsi',
  'label_kategori', 'pola_solo', 'elemen_proses', 'tag_konteks_pisa',
  'sumber_pembuatan', 'stimulus_images',
]

/**
 * Jawaban yang MESTINYA benar untuk sebuah butir, dalam bentuk yang dikirim
 * layar pengerjaan. Untuk `matching` dan `ordering` ia diturunkan dari
 * `options` — memang di situ kuncinya tinggal, bukan di `correct_answer`.
 */
function jawabanBenar(b) {
  switch (b.type) {
    case 'short_answer': return Array.isArray(b.correct_answer) ? b.correct_answer[0] : b.correct_answer
    case 'ordering': return b.options?.items ?? null
    case 'matching': return Object.fromEntries((b.options?.pairs ?? []).map(p => [p.left, p.right]))
    case 'statement_grid': return b.correct_answer?.answers ?? null
    case 'true_false_two_tier': return { tier1: b.correct_answer?.tier1, tier2: b.correct_answer?.tier2 }
    default: return b.correct_answer
  }
}

function periksaBentuk(b, i, topikDefault, cakupan) {
  const galat = []
  const catat = []
  const di = `butir[${i}]`
  const topikId = 'topik_id' in b ? b.topik_id : topikDefault

  for (const k of Object.keys(b)) {
    if (!KOLOM.includes(k)) galat.push(`${di}: kolom "${k}" tidak dikenal`)
  }
  if (!TIPE.includes(b.type)) galat.push(`${di}: type "${b.type}" tidak dikenal`)
  if (typeof b.prompt !== 'string' || !b.prompt.trim()) galat.push(`${di}: prompt wajib berisi`)
  if (b.weight != null && !(Number(b.weight) > 0)) galat.push(`${di}: weight harus lebih besar dari 0`)
  if (b.status_verifikasi != null && !STATUS.includes(b.status_verifikasi)) galat.push(`${di}: status_verifikasi tidak sah`)
  if (b.sumber_pembuatan != null && !SUMBER.includes(b.sumber_pembuatan)) galat.push(`${di}: sumber_pembuatan tidak sah`)
  if (b.pola_solo != null && !SOLO.includes(b.pola_solo)) galat.push(`${di}: pola_solo tidak sah`)
  if (b.tag_konteks_pisa != null && !PISA.includes(b.tag_konteks_pisa)) galat.push(`${di}: tag_konteks_pisa tidak sah`)
  if (b.elemen_proses != null) {
    if (!Array.isArray(b.elemen_proses)) galat.push(`${di}: elemen_proses harus array`)
    else for (const e of b.elemen_proses) if (!ELEMEN.includes(e)) galat.push(`${di}: elemen_proses "${e}" tidak sah`)
  }
  if (b.bloom_level != null && !(Number.isInteger(b.bloom_level) && b.bloom_level >= 1 && b.bloom_level <= 6)) {
    galat.push(`${di}: bloom_level harus 1-6`)
  }

  // Kolam dan tipe yang tidak bisa dinilai mesin.
  if (b.peruntukan != null && !KOLAM.includes(b.peruntukan)) galat.push(`${di}: peruntukan tidak sah`)
  if (b.peruntukan != null && TANPA_NILAI.includes(b.type)) {
    galat.push(`${di}: ${b.type} tidak bisa dinilai mesin, jadi tidak boleh masuk kolam "${b.peruntukan}"`)
  }
  if (b.peruntukan != null && !topikId) galat.push(`${di}: butir berkolam wajib punya topik`)
  if (b.peruntukan != null && b.bloom_level == null) galat.push(`${di}: butir berkolam wajib punya bloom_level`)
  if (topikId && b.peruntukan == null) galat.push(`${di}: butir bertopik wajib menyebut peruntukan`)
  if (b.peruntukan === 'probe' && ![2, 3].includes(b.bloom_level)) {
    catat.push(`${di}: kolam probe dirancang C2-C3 (Retest Terjadwal Bagian 3); ini C${b.bloom_level}`)
  }
  if (topikId && cakupan.has(topikId) && b.bloom_level != null) {
    const { min, maks } = cakupan.get(topikId)
    if (min != null && (b.bloom_level < min || b.bloom_level > maks)) {
      catat.push(`${di}: C${b.bloom_level} di luar cakupan ${topikId} (C${min}-C${maks}) — jadi paket pengayaan, tidak menentukan ketuntasan`)
    }
  }

  // Bentuk `options` dan `correct_answer` per tipe.
  const opsi = b.options ?? null
  const kunci = b.correct_answer
  const pilihan = opsi?.choices
  switch (b.type) {
    case 'mcq_single':
      if (!Array.isArray(pilihan) || pilihan.length < 2) galat.push(`${di}: options.choices minimal dua`)
      else if (!pilihan.includes(kunci)) galat.push(`${di}: correct_answer harus SALAH SATU TEKS di options.choices, bukan huruf atau nomor`)
      break
    case 'mcq_multi':
      if (!Array.isArray(pilihan) || pilihan.length < 2) galat.push(`${di}: options.choices minimal dua`)
      else if (!Array.isArray(kunci) || kunci.length === 0) galat.push(`${di}: correct_answer harus array berisi`)
      else for (const k of kunci) if (!pilihan.includes(k)) galat.push(`${di}: correct_answer "${k}" tidak ada di options.choices`)
      break
    case 'true_false':
      if (opsi !== null) galat.push(`${di}: true_false tidak punya options`)
      if (kunci !== 'true' && kunci !== 'false') galat.push(`${di}: correct_answer harus "true" atau "false" (teks, bukan boolean)`)
      break
    case 'short_answer':
      if (opsi !== null) galat.push(`${di}: short_answer tidak punya options`)
      if (!Array.isArray(kunci) || kunci.length === 0 || kunci.some(k => typeof k !== 'string' || !k.trim())) {
        galat.push(`${di}: correct_answer harus array ejaan yang diterima, mis. ["-5"]`)
      }
      break
    case 'fill_blank': {
      if (opsi !== null) galat.push(`${di}: fill_blank tidak punya options`)
      const rumpang = (b.prompt.match(/___/g) ?? []).length
      if (!Array.isArray(kunci) || kunci.length === 0) galat.push(`${di}: correct_answer harus array, satu kunci per rumpang`)
      else if (rumpang !== kunci.length) galat.push(`${di}: ada ${rumpang} rumpang "___" di prompt tapi ${kunci.length} kunci`)
      break
    }
    case 'matching': {
      const pairs = opsi?.pairs
      if (!Array.isArray(pairs) || pairs.length < 2) galat.push(`${di}: options.pairs minimal dua`)
      else {
        for (const p of pairs) if (typeof p?.left !== 'string' || typeof p?.right !== 'string') galat.push(`${di}: setiap pair butuh left dan right berupa teks`)
        const kiri = pairs.map(p => p.left)
        if (new Set(kiri).size !== kiri.length) galat.push(`${di}: options.pairs.left harus unik — ia dipakai sebagai kunci jawaban`)
        // `correct_answer` boleh diisi sebagai salinan yang terbaca manusia,
        // tapi penilainya membaca `options.pairs`. Kalau keduanya ada dan
        // berbeda, yang salah adalah salinannya — dan itu harus terlihat.
        if (kunci != null) {
          for (const p of pairs) {
            if (kunci[p.left] !== p.right) galat.push(`${di}: correct_answer["${p.left}"] tidak sama dengan options.pairs (yang dipakai menilai)`)
          }
        }
      }
      break
    }
    case 'ordering': {
      const item = opsi?.items
      if (!Array.isArray(item) || item.length < 2) galat.push(`${di}: options.items minimal dua`)
      else {
        if (new Set(item).size !== item.length) galat.push(`${di}: options.items harus unik — layar memakainya sebagai key`)
        // options.items ADALAH urutan benarnya; layar mengacaknya sendiri.
        if (kunci != null && JSON.stringify(kunci) !== JSON.stringify(item)) {
          galat.push(`${di}: options.items harus sudah dalam urutan BENAR, dan correct_answer harus sama dengannya`)
        }
      }
      break
    }
    case 'statement_grid': {
      const p = opsi?.statements
      if (!Array.isArray(p) || p.length < 2) galat.push(`${di}: options.statements minimal dua`)
      if (!Array.isArray(opsi?.answer_labels) || opsi.answer_labels.length !== 2) galat.push(`${di}: options.answer_labels wajib dua, urut [benar, salah]`)
      if (!kunci || !Array.isArray(kunci.answers)) galat.push(`${di}: correct_answer.answers wajib array`)
      else {
        if (Array.isArray(p) && kunci.answers.length !== p.length) galat.push(`${di}: correct_answer.answers (${kunci.answers.length}) harus sepanjang options.statements (${p?.length})`)
        for (const a of kunci.answers) if (typeof a !== 'boolean' && a !== null) galat.push(`${di}: correct_answer.answers hanya boleh true, false, atau null`)
        if (!['proportional', 'all_or_nothing'].includes(kunci.grading_mode)) galat.push(`${di}: correct_answer.grading_mode harus "proportional" atau "all_or_nothing"`)
      }
      break
    }
    case 'true_false_two_tier': {
      const t2 = opsi?.tier2_choices
      if (!Array.isArray(t2) || t2.length < 2) galat.push(`${di}: options.tier2_choices minimal dua`)
      if (kunci?.tier1 !== 'true' && kunci?.tier1 !== 'false') galat.push(`${di}: correct_answer.tier1 harus "true" atau "false"`)
      if (Array.isArray(t2) && !t2.includes(kunci?.tier2)) galat.push(`${di}: correct_answer.tier2 harus salah satu teks di options.tier2_choices`)
      if (kunci?.skor_sebagian != null && !(kunci.skor_sebagian >= 0 && kunci.skor_sebagian <= 1)) galat.push(`${di}: skor_sebagian harus antara 0 dan 1`)
      break
    }
    case 'essay':
    case 'upload_file':
      if (kunci != null) galat.push(`${di}: ${b.type} dinilai manusia, correct_answer harus null`)
      break
  }

  // Pembahasan per opsi berkunci INDEKS opsi sebagai teks: {"0": "..."}.
  if (b.penjelasan_per_opsi != null) {
    const n = b.type === 'true_false' ? 2 : (pilihan?.length ?? opsi?.statements?.length ?? opsi?.tier2_choices?.length ?? 0)
    for (const k of Object.keys(b.penjelasan_per_opsi)) {
      if (!/^\d+$/.test(k) || (n > 0 && Number(k) >= n)) galat.push(`${di}: penjelasan_per_opsi["${k}"] bukan indeks opsi yang ada`)
    }
  }

  return { galat, catat, topikId }
}

async function main() {
  const berkas = process.argv[2]
  const tulis = process.argv.includes('--tulis')
  if (!berkas) {
    console.error('Pakai: node scripts/impor-butir.mjs <berkas.json> [--tulis]')
    process.exit(2)
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const kunciLayanan = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !kunciLayanan) {
    console.error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum ada di lingkungan.')
    process.exit(2)
  }
  const db = createClient(url, kunciLayanan)

  const isi = JSON.parse(readFileSync(berkas, 'utf8'))
  if (!Array.isArray(isi.butir)) {
    console.error('Berkas harus punya array "butir".')
    process.exit(2)
  }

  const { data: topik } = await db.from('topik').select('id, bloom_min, bloom_maks')
  const cakupan = new Map((topik ?? []).map(t => [t.id, { min: t.bloom_min, maks: t.bloom_maks }]))

  const galat = []
  const catat = []
  const siap = []
  for (const [i, b] of isi.butir.entries()) {
    const hasil = periksaBentuk(b, i, isi.topik_id ?? null, cakupan)
    galat.push(...hasil.galat)
    catat.push(...hasil.catat)
    if (hasil.topikId && !cakupan.has(hasil.topikId)) galat.push(`butir[${i}]: topik "${hasil.topikId}" tidak ada di tabel topik`)

    // Uji kunci dengan penilai sungguhan, kecuali yang memang dinilai manusia.
    //
    // DUA SKEMA, karena butir yang sama dinilai dua cara: paket latihan dan
    // paket ujian memakai 'pengukuran' (koreksi tebakan), sedangkan probe dan
    // latihan bebas memakai 'sederhana' (migrasi 175). Jawaban yang benar
    // mestinya bernilai penuh di keduanya; butir yang hanya penuh di salah
    // satunya adalah butir yang bentuknya belum benar.
    if (hasil.galat.length === 0 && !TANPA_NILAI.includes(b.type)) {
      const bobot = Number(b.weight ?? 1)
      for (const skema of ['sederhana', 'pengukuran']) {
        const { data: nilai, error } = await db.rpc('nilai_jawaban', {
          p_tipe: b.type,
          p_opsi: b.options ?? null,
          p_kunci: b.correct_answer ?? null,
          p_jawaban: jawabanBenar(b),
          p_bobot: bobot,
          p_skema: skema,
        })
        if (error) galat.push(`butir[${i}]: penilai menolak butirnya — ${error.message}`)
        else if (Number(nilai) !== bobot) {
          galat.push(`butir[${i}]: jawaban yang mestinya benar hanya bernilai ${nilai} dari ${bobot} di skema ${skema} — kunci dan opsinya belum cocok`)
        }
      }
    }
    siap.push({ butir: b, topikId: hasil.topikId })
  }

  for (const c of catat) console.log(`catatan  ${c}`)
  if (galat.length > 0) {
    for (const g of galat) console.error(`GAGAL    ${g}`)
    console.error(`\n${galat.length} masalah. Tidak ada yang ditulis.`)
    process.exit(1)
  }
  console.log(`\n${siap.length} butir lolos periksa (kuncinya diuji nilai_jawaban di database, dua skema).`)

  if (!tulis) {
    console.log('Belum ditulis. Tambahkan --tulis kalau memang mau dimasukkan.')
    return
  }

  const { data: admin } = await db.from('profiles').select('id').eq('role', 'admin').order('created_at').limit(1)
  const penulis = admin?.[0]?.id ?? null

  const baris = siap.map(({ butir: b, topikId }) => ({
    created_by: penulis,
    type: b.type,
    prompt: b.prompt,
    options: b.options ?? null,
    // Menjodohkan dan mengurutkan: kuncinya tinggal di `options`, dan
    // `nilai_jawaban()` memang membaca dari sana. Salinan yang boleh ditulis di
    // naskah tidak ikut disimpan — salinan kedua adalah salinan yang suatu hari
    // akan berbeda pendapat dengan aslinya, dan yang membacanya akan mengira
    // kunci yang lain. Sama dengan yang dilakukan impor Sora.
    correct_answer: KUNCI_DI_OPSI.includes(b.type) ? null : (b.correct_answer ?? null),
    weight: b.weight ?? 1,
    explanation: b.explanation ?? null,
    bloom_level: b.bloom_level ?? null,
    peruntukan: b.peruntukan ?? null,
    topik_id: topikId,
    status_verifikasi: b.status_verifikasi ?? 'draf',
    penjelasan_per_opsi: b.penjelasan_per_opsi ?? null,
    label_kategori: b.label_kategori ?? null,
    pola_solo: b.pola_solo ?? null,
    elemen_proses: b.elemen_proses ?? null,
    tag_konteks_pisa: b.tag_konteks_pisa ?? null,
    sumber_pembuatan: b.sumber_pembuatan ?? 'manual',
    stimulus_images: b.stimulus_images ?? [],
  }))

  const { data: masuk, error } = await db.from('question_bank_items').insert(baris).select('id, peruntukan, topik_id')
  if (error) {
    console.error('Gagal menulis:', error.message)
    process.exit(1)
  }
  console.log(`${masuk.length} butir masuk bank.`)

  // Kolam probe punya tabel keanggotaannya sendiri (migrasi 164). Tanpa baris
  // ini, `peruntukan = 'probe'` cuma label dan retest tetap memulangkan null.
  const probe = masuk.filter(b => b.peruntukan === 'probe')
  if (probe.length > 0) {
    const { error: e2 } = await db.from('item_probe')
      .insert(probe.map(b => ({ topik_id: b.topik_id, question_bank_item_id: b.id })))
    if (e2) console.error('Butirnya masuk, tapi keanggotaan probe gagal:', e2.message)
    else console.log(`${probe.length} butir terdaftar di kolam probe.`)
  }

  // Paketnya disusun ulang dari bank untuk topik yang butir latihan/ujiannya
  // bertambah. Aman diulang: paket yang sudah dikerjakan dilewati (migrasi 145).
  const perluSemai = [...new Set(masuk.filter(b => b.peruntukan !== 'probe' && b.topik_id).map(b => b.topik_id))]
  for (const t of perluSemai) {
    const { data: paket, error: e3 } = await db.rpc('semai_paket_topik', { p_topik_id: t })
    if (e3) console.error(`Semai paket ${t} gagal:`, e3.message)
    else console.log(`Paket ${t}: ${(paket ?? []).map(p => `${p.jenis}${p.level_bloom ? ' C' + p.level_bloom : ''}=${p.jumlah_butir}`).join(', ')}`)
  }

  console.log('\nButir masuk sebagai `draf` kecuali disebut lain — hanya `aktif` yang disajikan ke murid.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
