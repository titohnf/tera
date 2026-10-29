/**
 * Mengubah berkas `.json` di folder Asesmen Drive — proyek Google Apps Script
 * pembuat Google Form — menjadi kuis Sora berstatus DRAF.
 *
 *   node --env-file=.env.local scripts/impor-asesmen-apps-script.mjs --kunci ~/kunci.json --jalur "7 SMP/Matematika"          # periksa saja
 *   node --env-file=.env.local scripts/impor-asesmen-apps-script.mjs --kunci ~/kunci.json --jalur "7 SMP/Matematika" --tulis  # periksa lalu tulis
 *
 * Skrip itu sudah memuat soal DAN kuncinya (`createChoice(teks, benar)`), jadi
 * tutor tidak perlu mengetik ulang apa pun. Yang dibaca hanya tiga bentuk:
 *   - addMultipleChoiceItem  -> mcq_single
 *   - addCheckboxItem        -> mcq_multi
 *   - addGridItem Benar/Salah -> statement_grid; kuncinya hanya ada di KOMENTAR
 *     ("Kunci manual UI: A(Benar), B(Salah) ..."), jadi grid tanpa komentar itu
 *     ditolak, bukan ditebak.
 * Bagian identitas, unggah foto, dan refleksi ikut dilewati: bukan soal.
 *
 * DUA PENGAMAN, sama seperti `impor-butir.mjs`:
 *   1. Tiap soal dikirim ke `nilai_jawaban()` di database bersama jawaban yang
 *      mestinya benar; kalau nilainya bukan bobot penuh, seluruh kuis ditolak.
 *   2. Kuis masuk sebagai `draft` dan tidak ditugaskan ke sesi mana pun. Tutor
 *      atau admin membacanya di Sora, lalu menerbitkan dan menugaskannya.
 *
 * Kuis dengan judul yang sama dengan yang sudah ada dilewati, jadi aman dijalankan ulang.
 * Tidak menulis apa pun ke Drive (cakupan read-only).
 */
import { readFileSync } from 'node:fs'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const TULIS = process.argv.includes('--tulis')
const arg = nama => {
  const i = process.argv.indexOf(nama)
  return i > 0 ? process.argv[i + 1] : null
}
const JALUR = arg('--jalur')
const BERKAS_KUNCI = arg('--kunci')
const FOLDER = '115fSYDrele2qIHKnfJlkrVEQgdy2afMB'

if (!BERKAS_KUNCI) {
  console.error('--kunci butuh jalur ke berkas JSON kunci service account.')
  process.exit(1)
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const kunci = JSON.parse(readFileSync(BERKAS_KUNCI, 'utf8'))
const auth = new google.auth.JWT({
  email: kunci.client_email,
  key: kunci.private_key,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})
const drive = google.drive({ version: 'v3', auth })

async function telusuri(id, jalur, keluar) {
  let token
  do {
    const r = await drive.files.list({
      q: `'${id}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id,name,mimeType)',
      pageSize: 200,
      pageToken: token,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    for (const f of r.data.files ?? []) {
      if (f.mimeType === 'application/vnd.google-apps.folder') await telusuri(f.id, `${jalur}/${f.name}`, keluar)
      else if (f.mimeType === 'application/json' && jalur.includes('Asesmen')) keluar.push({ ...f, jalur })
    }
    token = r.data.nextPageToken
  } while (token)
}

/** Literal string JS ('..' atau "..") -> nilainya. Hanya literal yang cocok polanya yang dievaluasi. */
function bacaLiteral(mentah) {
  const m = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/s.exec(mentah.trim())
  if (!m) throw new Error(`bukan literal string: ${mentah.slice(0, 40)}`)
  return JSON.parse(
    `"${m[2]
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')}"`,
  )
}

const LITERAL = String.raw`(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")`

/** "A. teks" -> "teks" */
const tanpaHuruf = t => t.replace(/^\s*[A-Za-z][.)]\s+/, '').trim()
/** "3. (Level C2 - Memahami)\nisi" -> "isi" */
const tanpaNomor = t => t.replace(/^\s*(?:Question\s*)?\d+[.:]\s*(?:\(Level[^)]*\))?\s*/i, '').trim()

function uraikanSkrip(sumber) {
  const soal = []
  const catatan = []
  const omisi = []
  const penanda = [...sumber.matchAll(/var\s+(\w+)\s*=\s*form\.add(MultipleChoice|Checkbox|CheckboxGrid|Grid)Item\(\)/g)]

  penanda.forEach((m, n) => {
    const awal = m.index
    const akhir = n + 1 < penanda.length ? penanda[n + 1].index : sumber.length
    // Komentar "// SOAL n (...)" tepat sebelum blok memuat poin untuk grid.
    const sebelum = sumber.slice(Math.max(0, awal - 200), awal)
    const blok = sumber.slice(awal, akhir)
    const v = m[1]
    const jenis = m[2]

    const judul = new RegExp(`setTitle\\((${LITERAL})\\)`).exec(blok)
    if (!judul) return catatan.push(`${v}: tanpa judul`)
    const prompt = tanpaNomor(bacaLiteral(judul[1]))
    const poin = /\.setPoints\((\d+(?:\.\d+)?)\)/.exec(blok)

    if (jenis === 'Grid' || jenis === 'CheckboxGrid') {
      const baris = /\.setRows\(\[([\s\S]*?)\]\)/.exec(blok)
      const kolom = /\.setColumns\(\[([\s\S]*?)\]\)/.exec(blok)
      const kunciGrid = /Kunci (?:manual UI|dari form UI):\s*([^\n]*)/.exec(blok)
      if (!baris || !kolom) return catatan.push(`${v}: grid tanpa baris/kolom`)
      // Kunci grid hanya ada kalau tutor menuliskannya di komentar; kebanyakan
      // skrip menyuruh mengaturnya manual di Google Form. Tanpa kunci, soalnya
      // DILEWATI dan dicatat — bukan ditebak.
      if (!kunciGrid) {
        omisi.push(tanpaNomor(bacaLiteral(judul[1])).slice(0, 80))
        return
      }
      const pernyataan = [...baris[1].matchAll(new RegExp(LITERAL, 'g'))].map(x => tanpaHuruf(bacaLiteral(x[0])))
      const label = [...kolom[1].matchAll(new RegExp(LITERAL, 'g'))].map(x => bacaLiteral(x[0]))
      const PASANG = [['Benar', 'Salah'], ['Correct', 'Incorrect'], ['True', 'False']]
      if (label.length !== 2 || !PASANG.some(([a, b]) => a === label[0] && b === label[1])) {
        return catatan.push(`${v}: kolom grid bukan pasangan Benar/Salah (${label.join('/')})`)
      }
      const pasangan = [...kunciGrid[1].matchAll(/([A-Z])\((Benar|Salah|Correct|Incorrect|True|False)\)/g)]
      if (pasangan.length !== pernyataan.length) {
        return catatan.push(`${v}: ${pernyataan.length} baris tapi ${pasangan.length} kunci di komentar`)
      }
      let bobot = poin ? Number(poin[1]) : null
      if (bobot === null) {
        const total = /Total (\d+(?:\.\d+)?) Poin/i.exec(sebelum + blok)
        const perBaris = /(?:Poin:|bernilai)\s*(\d+(?:\.\d+)?)\s*(?:Poin)?\s*(?:per baris)?/.exec(sebelum + blok)
        bobot = total ? Number(total[1]) : perBaris ? Number(perBaris[1]) * pernyataan.length : null
      }
      if (bobot === null) return catatan.push(`${v}: grid tanpa bobot yang bisa dibaca`)
      soal.push({
        type: 'statement_grid',
        prompt,
        options: { statements: pernyataan, answer_labels: label },
        correct_answer: { answers: pasangan.map(p => p[2] === label[0]), grading_mode: 'proportional' },
        weight: bobot,
      })
      return
    }

    const pilihan = [...blok.matchAll(new RegExp(`\\w+\\.createChoice\\((${LITERAL})\\s*,\\s*(true|false)\\s*\\)`, 'g'))].map(x => ({
      teks: tanpaHuruf(bacaLiteral(x[1])),
      benar: x[2] === 'true',
    }))
    if (pilihan.length < 2) return catatan.push(`${v}: kurang dari 2 pilihan`)
    const benar = pilihan.filter(p => p.benar)
    if (benar.length === 0) return catatan.push(`${v}: tidak ada pilihan bertanda benar`)
    if (new Set(pilihan.map(p => p.teks)).size !== pilihan.length) return catatan.push(`${v}: teks pilihan kembar`)
    if (!poin) return catatan.push(`${v}: tanpa setPoints`)

    if (jenis === 'MultipleChoice') {
      if (benar.length !== 1) return catatan.push(`${v}: pilihan ganda dengan ${benar.length} jawaban benar`)
      soal.push({
        type: 'mcq_single',
        prompt,
        options: { choices: pilihan.map(p => p.teks) },
        correct_answer: benar[0].teks,
        weight: Number(poin[1]),
      })
    } else {
      soal.push({
        type: 'mcq_multi',
        prompt,
        options: { choices: pilihan.map(p => p.teks) },
        correct_answer: benar.map(p => p.teks),
        weight: Number(poin[1]),
      })
    }
  })
  return { soal, catatan, omisi }
}

function jawabanBenar(s) {
  return s.type === 'statement_grid' ? s.correct_answer.answers : s.correct_answer
}

async function periksaKunci(soal) {
  for (const [i, s] of soal.entries()) {
    for (const skema of ['sederhana', 'pengukuran']) {
      const { data, error } = await db.rpc('nilai_jawaban', {
        p_tipe: s.type,
        p_opsi: s.options,
        p_kunci: s.correct_answer,
        p_jawaban: jawabanBenar(s),
        p_bobot: s.weight,
        p_skema: skema,
      })
      if (error) return `soal ${i + 1}: ${error.message}`
      if (Number(data) !== Number(s.weight)) {
        return `soal ${i + 1} (${s.type}, skema ${skema}): kunci bernilai ${data}, mestinya ${s.weight}`
      }
    }
  }
  return null
}

const berkas = []
await telusuri(FOLDER, '', berkas)
const terpilih = berkas.filter(b => !JALUR || b.jalur.includes(JALUR))
console.log(`${terpilih.length} berkas .json di folder Asesmen${JALUR ? ` (jalur memuat "${JALUR}")` : ''}.\n`)

const siap = []
let gagal = 0
for (const b of terpilih) {
  const nama = b.name.replace(/\.json$/i, '').replace(/^\d+\.\s*/, '')
  let proyek
  try {
    const r = await drive.files.get({ fileId: b.id, alt: 'media', supportsAllDrives: true }, { responseType: 'text' })
    proyek = typeof r.data === 'string' ? JSON.parse(r.data) : r.data
  } catch (e) {
    console.log(`LEWAT    ${nama}: bukan proyek Apps Script yang terbaca (${e.message.slice(0, 60)})`)
    gagal++
    continue
  }
  const sumber = (proyek.files ?? []).filter(f => f.type === 'server_js').map(f => f.source).join('\n')
  if (!sumber) {
    console.log(`LEWAT    ${nama}: tidak ada kode server_js`)
    gagal++
    continue
  }
  let hasil
  try {
    hasil = uraikanSkrip(sumber)
  } catch (e) {
    console.log(`GAGAL    ${nama}: ${e.message}`)
    gagal++
    continue
  }
  if (hasil.soal.length === 0 || hasil.catatan.length > 0) {
    console.log(`GAGAL    ${nama}: ${hasil.soal.length} soal terbaca; ${hasil.catatan.join(' | ') || 'tidak ada soal'}`)
    gagal++
    continue
  }
  const salahKunci = await periksaKunci(hasil.soal)
  if (salahKunci) {
    console.log(`GAGAL    ${nama}: ${salahKunci}`)
    gagal++
    continue
  }
  const jenis = hasil.soal.reduce((a, s) => ((a[s.type] = (a[s.type] ?? 0) + 1), a), {})
  console.log(`SIAP     ${nama}: ${hasil.soal.length} soal ${JSON.stringify(jenis)}, bobot ${hasil.soal.reduce((a, s) => a + s.weight, 0)}`)
  const catatanOmisi = hasil.omisi.length
    ? `Dibuat otomatis dari skrip Google Form. ${hasil.omisi.length} soal grid Benar/Salah belum disertakan karena kuncinya tidak ada di skrip; tambahkan manual di editor:\n${hasil.omisi.map(t => `- ${t}`).join('\n')}`
    : 'Dibuat otomatis dari skrip Google Form.'
  siap.push({ judul: nama, soal: hasil.soal, deskripsi: catatanOmisi })
  if (hasil.omisi.length) console.log(`         (${hasil.omisi.length} grid tanpa kunci dilewati)`)
}

console.log(`\n${siap.length} kuis siap, ${gagal} dilewati/gagal.`)
if (!TULIS) {
  console.log('Belum ditulis. Tambahkan --tulis untuk memasukkan yang SIAP sebagai kuis draf.')
  process.exit(0)
}

const { data: admin } = await db.from('profiles').select('id').eq('role', 'admin').order('created_at').limit(1)
const penulis = admin?.[0]?.id ?? null

for (const k of siap) {
  const { data: ada } = await db.from('quizzes').select('id').eq('title', k.judul).limit(1)
  if (ada?.length) {
    console.log(`ADA      ${k.judul}: dilewati (judul sudah ada)`)
    continue
  }
  const { data: kuis, error } = await db
    .from('quizzes')
    .insert({ title: k.judul, description: k.deskripsi, status: 'draft', kind: 'asesmen', created_by: penulis, settings: {} })
    .select('id')
    .single()
  if (error || !kuis) {
    console.error(`GAGAL    ${k.judul}: ${error?.message}`)
    continue
  }
  const { error: galatSoal } = await db.from('questions').insert(
    k.soal.map((s, i) => ({ quiz_id: kuis.id, order_index: i, ...s })),
  )
  if (galatSoal) {
    await db.from('quizzes').delete().eq('id', kuis.id)
    console.error(`GAGAL    ${k.judul}: soal tidak masuk (${galatSoal.message}); kuis dibatalkan`)
    continue
  }
  console.log(`DITULIS  ${k.judul}: ${k.soal.length} soal (draf)`)
}
