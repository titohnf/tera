// Memasang peta kompetensi (peta-kompetensi.json) ke 30 soal try out TKA SMP Matematika.
// Butuh migrasi 224. Default: periksa saja; --tulis untuk menulis.
//   node --env-file=.env.local docs/tryout-tka-smp-mat/isi-kompetensi.mjs [--tulis]
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const dir = new URL('.', import.meta.url).pathname
const tulis = process.argv.includes('--tulis')
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const QUIZ = 'f6ac0769-2fa4-40a2-9cf2-98e7b95a46bd'
const peta = JSON.parse(readFileSync(dir + 'peta-kompetensi.json', 'utf8'))
const mentah = JSON.parse(readFileSync(dir + 'soal-mentah.json', 'utf8'))

const { error: eKolom } = await db.from('questions').select('kompetensi').limit(1)
if (eKolom) { console.error('Kolom `kompetensi` belum ada. Jalankan migrasi 224 dulu.\n', eKolom.message); process.exit(1) }

// Salah ketik di situs sumber ("Menyelesaian", "permukaaan", "Phytagoras") sudah diperbaiki di peta; disamakan dulu sebelum dibandingkan.
const norm = (t) => t.toLowerCase().replace(/menyelesaian\b/g, 'menyelesaikan').replace(/permukaaan/g, 'permukaan').replace(/phytagoras/g, 'pythagoras').replace(/[^a-z0-9]+/g, ' ').trim()
const { data: qs } = await db.from('questions').select('id, order_index, bank_item_id').eq('quiz_id', QUIZ).order('order_index')
let salah = 0
const rencana = []
for (const q of qs) {
  const m = mentah.find((x) => x.i === q.order_index + 1)
  const nomor = m.text.match(/Indikator:.*?\((\d+)\)/)?.[1]
  const p = peta[nomor]
  const asal = m.text.match(/Indikator:(.*?)\(\d+\)/)?.[1] ?? ''
  const cocok = p && norm(asal).slice(0, 25) === norm(p.indikator.nama).slice(0, 25)
  if (!cocok) { salah++; console.error(`soal ${q.order_index + 1}: indikator (${nomor}) tidak cocok dengan naskah: "${asal.trim()}" vs "${p?.indikator.nama}"`) }
  rencana.push({ q, nomor, p })
}
console.log(`${rencana.length} soal dicocokkan, ${salah} tidak cocok.`)
if (salah) process.exit(1)
if (!tulis) { console.log('Belum ditulis. Tambahkan --tulis.'); process.exit(0) }
for (const { q, p } of rencana) {
  const a = await db.from('questions').update({ kompetensi: p }).eq('id', q.id)
  const b = q.bank_item_id ? await db.from('question_bank_items').update({ kompetensi: p }).eq('id', q.bank_item_id) : {}
  if (a.error || b.error) { console.error('Gagal menulis soal', q.order_index + 1, a.error ?? b.error); process.exit(1) }
}
console.log('Selesai: peta kompetensi terpasang di', rencana.length, 'soal (paket dan bank).')
