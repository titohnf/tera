// Memperbarui kunci dan catatan (explanation) 30 soal paket BIN dan butir bank-nya dari butir-impor-tryout-smp-bin.json.
//   node --env-file=.env.local docs/tryout-tka-smp-bin/perbarui-kunci.mjs <quiz_id> [--tulis]
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const QUIZ = process.argv[2], tulis = process.argv.includes('--tulis')
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const butir = JSON.parse(readFileSync(new URL('./butir-impor-tryout-smp-bin.json', import.meta.url), 'utf8')).butir
const { data: qs } = await db.from('questions').select('id, order_index, prompt, type, correct_answer, bank_item_id').eq('quiz_id', QUIZ).order('order_index')
let beda = 0
for (const q of qs) {
  const b = butir[q.order_index]
  if (q.prompt !== b.prompt || q.type !== b.type) { console.error('soal', q.order_index + 1, 'prompt/tipe berbeda, dihentikan'); process.exit(1) }
  if (JSON.stringify(q.correct_answer) !== JSON.stringify(b.correct_answer)) { beda++; console.log('kunci berubah di soal', q.order_index + 1) }
  if (tulis) {
    const a = await db.from('questions').update({ correct_answer: b.correct_answer, explanation: b.explanation }).eq('id', q.id)
    const c = q.bank_item_id ? await db.from('question_bank_items').update({ correct_answer: b.correct_answer, explanation: b.explanation }).eq('id', q.bank_item_id) : {}
    if (a.error || c.error) { console.error('gagal', q.order_index + 1, a.error ?? c.error); process.exit(1) }
  }
}
console.log(tulis ? 'Diperbarui.' : 'Belum ditulis.', beda, 'kunci berbeda dari database.')
