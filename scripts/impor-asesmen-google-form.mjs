/**
 * Mengubah Google Form berkuis di folder bimbel Drive menjadi kuis Sora DRAF,
 * membaca soal DAN kunci jawabannya langsung dari Google Forms API.
 *
 *   node --env-file=.env.local scripts/impor-asesmen-google-form.mjs --kunci ~/kunci.json                       # periksa saja
 *   node --env-file=.env.local scripts/impor-asesmen-google-form.mjs --kunci ~/kunci.json --jalur "7 SMP" --tulis # periksa lalu tulis
 *
 * Ini menggantikan jalur skrip Apps Script (`impor-asesmen-apps-script.mjs`)
 * sebagai sumber utama: form yang sudah diedit tutor di antarmuka Forms
 * memegang kunci yang SEBENARNYA dipakai menilai, termasuk kunci grid
 * Benar/Salah yang tidak pernah tertulis di skrip.
 *
 * Yang dibaca (hanya butir yang punya `grading`; identitas, refleksi, dan
 * unggah foto tidak bernilai, jadi ikut tersaring sendiri):
 *   - pilihan RADIO     -> mcq_single
 *   - pilihan CHECKBOX  -> mcq_multi
 *   - grid dua kolom    -> statement_grid (satu kunci dan satu poin per baris)
 * Form yang memuat gambar atau video dilewati seluruhnya: kalimat soalnya
 * bergantung pada gambar itu, dan kuis tanpa gambarnya menyesatkan.
 *
 * Pengaman sama seperti skrip lain: tiap butir diuji `nilai_jawaban()` di
 * database (dua skema), kuis masuk sebagai `draft`, tidak ditugaskan ke sesi,
 * dan tidak ada yang ditulis ke Drive (cakupan read-only).
 *
 * Judul kuis = nama berkas di Drive tanpa awalan nomor. Kuis hasil skrip Apps
 * Script yang masih draf murni (tanpa penugasan dan percobaan) DIGANTI oleh
 * versi form yang lengkap; kuis lain dengan judul sama dilewati.
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
const PENANDA_SKRIP = 'Dibuat otomatis dari skrip Google Form'
const PENANDA_FORM = 'Dibuat otomatis dari Google Form'

if (!BERKAS_KUNCI) {
  console.error('--kunci butuh jalur ke berkas JSON kunci service account.')
  process.exit(1)
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const kunci = JSON.parse(readFileSync(BERKAS_KUNCI, 'utf8'))
const auth = new google.auth.JWT({
  email: kunci.client_email,
  key: kunci.private_key,
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/forms.body.readonly',
  ],
})
const drive = google.drive({ version: 'v3', auth })
const forms = google.forms({ version: 'v1', auth })

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
      else if (f.mimeType === 'application/vnd.google-apps.form') keluar.push({ ...f, jalur })
    }
    token = r.data.nextPageToken
  } while (token)
}

const tanpaNomor = t => t.replace(/^\s*(?:Question\s*)?\d+[.:]\s*(?:\(Level[^)]*\))?\s*/i, '').trim()
const tanpaHuruf = t => t.replace(/^\s*[A-Za-z][.)]\s+/, '').trim()

/** Semua pilihan berawalan "A. ", "B. " ... berurutan? Maka awalan itu dibuang. */
function bukaHuruf(nilai) {
  const huruf = nilai.every((v, i) => new RegExp(`^${String.fromCharCode(65 + i)}[.)]\\s`).test(v.trim()))
  return huruf ? nilai.map(tanpaHuruf) : nilai
}

function uraikanForm(form) {
  const soal = []
  const catatan = []
  const gambar = (form.items ?? []).some(it => it.imageItem || it.videoItem || it.questionItem?.image)
  if (gambar) return { soal, catatan: ['memuat gambar/video'], gambar: true }

  for (const [n, it] of (form.items ?? []).entries()) {
    const label = `item ${n + 1}`
    if (it.questionItem) {
      const q = it.questionItem.question
      if (!q.grading) continue
      if (!q.choiceQuestion) {
        catatan.push(`${label}: butir bernilai tapi bukan pilihan (${Object.keys(q).filter(k => k.endsWith('Question')).join(',')})`)
        continue
      }
      const asli = (q.choiceQuestion.options ?? []).map(o => o.value ?? '')
      if ((q.choiceQuestion.options ?? []).some(o => o.isOther)) {
        catatan.push(`${label}: ada opsi "Lainnya"`)
        continue
      }
      const pilihan = bukaHuruf(asli)
      const benarAsli = (q.grading.correctAnswers?.answers ?? []).map(a => a.value)
      const benar = benarAsli.map(v => pilihan[asli.indexOf(v)])
      if (benar.length === 0 || benar.some(b => b === undefined)) {
        catatan.push(`${label}: kunci tidak cocok dengan pilihan`)
        continue
      }
      if (new Set(pilihan).size !== pilihan.length) {
        catatan.push(`${label}: teks pilihan kembar`)
        continue
      }
      const bobot = Number(q.grading.pointValue)
      if (!(bobot > 0)) {
        catatan.push(`${label}: bobot ${q.grading.pointValue}`)
        continue
      }
      const prompt = tanpaNomor(it.title ?? '')
      if (q.choiceQuestion.type === 'RADIO' || q.choiceQuestion.type === 'DROP_DOWN') {
        if (benar.length !== 1) {
          catatan.push(`${label}: pilihan ganda dengan ${benar.length} kunci`)
          continue
        }
        soal.push({ type: 'mcq_single', prompt, options: { choices: pilihan }, correct_answer: benar[0], weight: bobot })
      } else if (q.choiceQuestion.type === 'CHECKBOX') {
        soal.push({ type: 'mcq_multi', prompt, options: { choices: pilihan }, correct_answer: benar, weight: bobot })
      } else {
        catatan.push(`${label}: tipe pilihan ${q.choiceQuestion.type}`)
      }
    } else if (it.questionGroupItem) {
      const baris = it.questionGroupItem.questions ?? []
      if (!baris.some(b => b.grading)) continue
      const kolom = (it.questionGroupItem.grid?.columns?.options ?? []).map(o => o.value)
      if (kolom.length !== 2) {
        catatan.push(`${label}: grid dengan ${kolom.length} kolom`)
        continue
      }
      if (baris.some(b => !b.grading || (b.grading.correctAnswers?.answers ?? []).length !== 1)) {
        catatan.push(`${label}: ada baris grid tanpa tepat satu kunci`)
        continue
      }
      const bobot = baris.reduce((a, b) => a + Number(b.grading.pointValue), 0)
      if (!(bobot > 0)) {
        catatan.push(`${label}: bobot grid ${bobot}`)
        continue
      }
      const pernyataan = baris.map(b => b.rowQuestion?.title ?? '')
      if (pernyataan.some(t => !t.trim())) {
        catatan.push(`${label}: baris grid tanpa teks`)
        continue
      }
      const jawab = baris.map(b => b.grading.correctAnswers.answers[0].value)
      if (jawab.some(v => !kolom.includes(v))) {
        catatan.push(`${label}: kunci grid di luar kolom`)
        continue
      }
      soal.push({
        type: 'statement_grid',
        prompt: tanpaNomor(it.title ?? ''),
        options: { statements: bukaHuruf(pernyataan), answer_labels: kolom },
        correct_answer: { answers: jawab.map(v => v === kolom[0]), grading_mode: 'proportional' },
        weight: bobot,
      })
    }
  }
  return { soal, catatan, gambar: false }
}

const jawabanBenar = s => (s.type === 'statement_grid' ? s.correct_answer.answers : s.correct_answer)

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
console.log(`${terpilih.length} Google Form${JALUR ? ` (jalur memuat "${JALUR}")` : ''}.\n`)

const siap = []
const judulDipakai = new Set()
let lewat = 0
for (const b of terpilih) {
  const nama = b.name.replace(/^\d+\.\s*/, '').trim()
  let form
  try {
    form = (await forms.forms.get({ formId: b.id })).data
  } catch (e) {
    console.log(`LEWAT    ${nama}: form tidak terbaca (${e.message.slice(0, 60)})`)
    lewat++
    continue
  }
  const hasil = uraikanForm(form)
  if (hasil.gambar) {
    console.log(`LEWAT    ${nama}: memuat gambar/video`)
    lewat++
    continue
  }
  if (hasil.soal.length === 0 || hasil.catatan.length > 0) {
    console.log(`LEWAT    ${nama}: ${hasil.soal.length} soal terbaca; ${hasil.catatan.join(' | ') || 'tidak ada butir bernilai'}`)
    lewat++
    continue
  }
  if (judulDipakai.has(nama)) {
    console.log(`KEMBAR   ${nama}: judul sama dengan form lain, dilewati`)
    lewat++
    continue
  }
  const salahKunci = await periksaKunci(hasil.soal)
  if (salahKunci) {
    console.log(`LEWAT    ${nama}: ${salahKunci}`)
    lewat++
    continue
  }
  judulDipakai.add(nama)
  const jenis = hasil.soal.reduce((a, s) => ((a[s.type] = (a[s.type] ?? 0) + 1), a), {})
  console.log(`SIAP     ${nama}: ${hasil.soal.length} soal ${JSON.stringify(jenis)}, bobot ${hasil.soal.reduce((a, s) => a + s.weight, 0)}`)
  siap.push({
    judul: nama,
    judulForm: form.info?.title ?? null,
    soal: hasil.soal,
    deskripsi: `${PENANDA_FORM} (kunci dari Forms API). Sumber: ${b.jalur.replace(/^\//, '')}`,
  })
}

console.log(`\n${siap.length} kuis siap, ${lewat} dilewati.`)
if (!TULIS) {
  console.log('Belum ditulis. Tambahkan --tulis untuk memasukkan yang SIAP sebagai kuis draf.')
  process.exit(0)
}

const { data: admin } = await db.from('profiles').select('id').eq('role', 'admin').order('created_at').limit(1)
const penulis = admin?.[0]?.id ?? null

/** Draf buatan skrip Apps Script yang belum dipakai siapa pun: aman diganti. */
async function bisaDiganti(kuis) {
  if (kuis.status !== 'draft' || !(kuis.description ?? '').startsWith(PENANDA_SKRIP)) return false
  const [{ count: penugasan }, { count: percobaan }] = await Promise.all([
    db.from('assessments').select('id', { count: 'exact', head: true }).eq('quiz_id', kuis.id),
    db.from('attempts').select('id', { count: 'exact', head: true }).eq('quiz_id', kuis.id),
  ])
  return (penugasan ?? 0) === 0 && (percobaan ?? 0) === 0
}

for (const k of siap) {
  const judulCari = [k.judul, k.judulForm].filter(Boolean)
  const { data: ada } = await db.from('quizzes').select('id, title, status, description').in('title', judulCari)
  let lewatiIni = false
  for (const lama of ada ?? []) {
    if (await bisaDiganti(lama)) {
      await db.from('quizzes').delete().eq('id', lama.id)
      console.log(`GANTI    ${lama.title}: draf skrip diganti versi form`)
    } else if ((lama.description ?? '').startsWith(PENANDA_FORM)) {
      console.log(`ADA      ${k.judul}: sudah diimpor dari form, dilewati`)
      lewatiIni = true
    } else {
      console.log(`ADA      ${k.judul}: judul "${lama.title}" dipakai kuis lain, dilewati`)
      lewatiIni = true
    }
  }
  if (lewatiIni) continue

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
