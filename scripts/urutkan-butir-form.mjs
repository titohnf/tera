/**
 * Memulihkan URUTAN butir hasil sinkron Google Form.
 *
 * Butir sebuah form ditulis dalam satu perintah INSERT, sehingga semuanya
 * bernilai `created_at` yang persis sama, dan Sora serta Belajar (yang
 * mengurutkan `created_at, id`) menampilkannya dalam urutan id acak — soal 9
 * lebih dulu dari soal 1, dan tingkat kesulitan C1 -> C4 yang disusun tutor
 * hilang. Skrip ini memberi tiap butir `created_at` = dasar + nomor soal (ms),
 * dengan nomor soal dibaca dari judul soal di form ("3. (Level C2 ...)").
 *
 *   node --env-file=.env.local scripts/urutkan-butir-form.mjs --kunci K          # hitung saja
 *   node --env-file=.env.local scripts/urutkan-butir-form.mjs --kunci K --tulis
 *
 * Aman diulang. Tidak mengubah isi butir; hanya `created_at`, dan tetap dalam
 * selisih kurang dari satu detik dari nilai semula, jadi urutan ANTAR paket tidak berubah.
 */
import { readFileSync } from 'node:fs'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const TULIS = process.argv.includes('--tulis')
const i = process.argv.indexOf('--kunci')
const kunci = JSON.parse(readFileSync(process.argv[i + 1], 'utf8'))
const auth = new google.auth.JWT({ email: kunci.client_email, key: kunci.private_key, scopes: ['https://www.googleapis.com/auth/forms.body.readonly'] })
const forms = google.forms({ version: 'v1', auth })
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const norm = s => (s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const tanpaNomor = t => t.replace(/^\s*(?:Question\s*)?\d+[.:]\s*(?:\(Level[^)]*\))?\s*/i, '').trim()

const baris = []
for (let d = 0; ; d += 1000) {
  const { data } = await db.from('sinkron_soal_drive').select('file_id, nama, butir_ids').order('file_id').range(d, d + 999)
  baris.push(...data)
  if (data.length < 1000) break
}

let form = 0, diurut = 0, tanpaPasangan = 0
for (const b of baris.filter(x => x.butir_ids?.length)) {
  const { data: f } = await forms.forms.get({ formId: b.file_id })
  // Urutan butir bernilai di form = urutan soalnya (grid dihitung satu butir).
  const urutan = new Map()
  let n = 0
  for (const it of f.items ?? []) {
    const bernilai = it.questionItem?.question?.grading || it.questionGroupItem?.questions?.some(q => q.grading)
    if (!bernilai) continue
    urutan.set(norm(tanpaNomor(it.title ?? '')), ++n)
  }
  const { data: butir } = await db.from('question_bank_items').select('id, prompt, created_at').in('id', b.butir_ids)
  const dasar = Math.min(...butir.map(x => new Date(x.created_at).getTime()))
  form++
  for (const x of butir) {
    const no = urutan.get(norm(x.prompt))
    if (!no) { tanpaPasangan++; continue }
    diurut++
    if (TULIS) {
      const { error } = await db.from('question_bank_items').update({ created_at: new Date(dasar + no).toISOString() }).eq('id', x.id)
      if (error) { console.error(`GAGAL ${b.nama}: ${error.message}`); process.exit(1) }
    }
  }
}
console.log(`${form} form; ${diurut} butir ${TULIS ? 'diurutkan' : 'bisa diurutkan (belum ditulis, tambahkan --tulis)'}; ${tanpaPasangan} butir tak berpasangan di form.`)
