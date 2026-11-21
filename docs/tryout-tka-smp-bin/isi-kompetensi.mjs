// Memasang peta kompetensi (peta-kompetensi.json) ke 30 soal try out TKA SMP Bahasa Indonesia.
// Soal ke-n (order_index n-1) = indikator nomor n. Butuh migrasi 224. Default: periksa; --tulis untuk menulis.
//   node --env-file=.env.local docs/tryout-tka-smp-bin/isi-kompetensi.mjs <quiz_id> [--tulis]
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const dir = new URL('.', import.meta.url).pathname
const QUIZ = process.argv[2]
const tulis = process.argv.includes('--tulis')
if (!QUIZ || QUIZ.startsWith('--')) { console.error('Beri id paket: ... isi-kompetensi.mjs <quiz_id> [--tulis]'); process.exit(1) }
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const peta = JSON.parse(readFileSync(dir + 'peta-kompetensi.json', 'utf8'))
const { data: qs } = await db.from('questions').select('id, order_index, bank_item_id').eq('quiz_id', QUIZ).order('order_index')
if (qs?.length !== 30) { console.error('Paket harus berisi 30 soal, ditemukan', qs?.length); process.exit(1) }
console.log('30 soal dicocokkan dengan 30 indikator.')
if (!tulis) { console.log('Belum ditulis. Tambahkan --tulis.'); process.exit(0) }
for (const q of qs) {
  const p = peta[String(q.order_index + 1)]
  const a = await db.from('questions').update({ kompetensi: p }).eq('id', q.id)
  const b = q.bank_item_id ? await db.from('question_bank_items').update({ kompetensi: p }).eq('id', q.bank_item_id) : {}
  if (a.error || b.error) { console.error('Gagal menulis soal', q.order_index + 1, a.error ?? b.error); process.exit(1) }
}
console.log('Selesai: peta kompetensi terpasang di 30 soal (paket dan bank).')
