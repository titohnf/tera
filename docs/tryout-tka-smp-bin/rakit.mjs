// Merakit 30 butir bank (sudah diimpor sebagai draf) menjadi satu paket try out DRAF di Sora.
//   node --env-file=.env.local docs/tryout-tka-smp-bin/rakit.mjs
// Urutan soal = nomor indikator (1-30): tiga soal berurutan memakai satu bacaan yang sama.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const sumber = JSON.parse(readFileSync(new URL('./butir-impor-tryout-smp-bin.json', import.meta.url), 'utf8')).butir
const JUDUL = 'Try Out TKA Bahasa Indonesia SMP Kelas 9'

const { data: ada } = await db.from('quizzes').select('id').eq('title', JUDUL)
if (ada?.length) { console.error('Paket dengan judul ini sudah ada, dihentikan:', ada.map(a => a.id).join(',')); process.exit(1) }

const { data: bank, error: e0 } = await db.from('question_bank_items')
  .select('id, type, prompt, options, correct_answer, weight, explanation, stimulus_images')
  .eq('status_verifikasi', 'draf').is('topik_id', null).order('created_at', { ascending: false }).limit(300)
if (e0) { console.error(e0.message); process.exit(1) }
const urut = []
for (const [i, s] of sumber.entries()) {
  const cocok = bank.filter(b => b.prompt === s.prompt && b.type === s.type)
  if (cocok.length !== 1) { console.error(`soal ${i + 1}: cocok ${cocok.length} butir bank, dihentikan`); process.exit(1) }
  urut.push(cocok[0])
}

const { data: admin } = await db.from('profiles').select('id').eq('role', 'admin').order('created_at').limit(1)
const { data: kuis, error: e1 } = await db.from('quizzes').insert({
  created_by: admin?.[0]?.id ?? null,
  title: JUDUL,
  description: 'Try out Bahasa Indonesia untuk kelas 9 SMP: 30 soal dari 10 bacaan (3 soal untuk tiap bacaan) dalam bentuk pilihan ganda, pilihan ganda kompleks, dan tabel pernyataan. Baca setiap bacaan dengan teliti, dan perhatikan petunjuk apakah jawabannya satu atau lebih dari satu.',
  status: 'draft',
  kind: 'tryout',
  settings: { cbt_mode: true, opens_at: null, closes_at: null, max_attempts: null, sequential_mode: false, shuffle_choices: false, shuffle_questions: false, time_limit_minutes: 75, show_score_immediately: false },
}).select('id, share_code').single()
if (e1) { console.error('Gagal membuat paket:', e1.message); process.exit(1) }

const { error: e2 } = await db.from('questions').insert(urut.map((b, i) => ({
  quiz_id: kuis.id, type: b.type, prompt: b.prompt, options: b.options, correct_answer: b.correct_answer,
  weight: b.weight, order_index: i, explanation: b.explanation, stimulus_images: b.stimulus_images ?? [], bank_item_id: b.id,
})))
if (e2) { await db.from('quizzes').delete().eq('id', kuis.id); console.error('Gagal mengisi soal, paket dibatalkan:', e2.message); process.exit(1) }
console.log('Paket draf dibuat:', kuis.id, '| kode bagikan:', kuis.share_code ?? '(belum ada)', '|', urut.length, 'soal')
