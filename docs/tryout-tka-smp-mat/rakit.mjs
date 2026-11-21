// Merakit 30 butir bank (sudah diimpor sebagai draf) menjadi satu paket try out DRAF di Sora.
//   node --env-file=.env.local docs/tryout-tka-smp-mat/rakit.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const sumber = JSON.parse(readFileSync(new URL('./butir-impor-tryout-smp-mat.json', import.meta.url), 'utf8')).butir
const JUDUL = 'Try Out TKA Matematika SMP Kelas 9 (contoh soal resmi 2025/2026)'

const { data: ada } = await db.from('quizzes').select('id').eq('title', JUDUL)
if (ada?.length) { console.error('Paket dengan judul ini sudah ada, dihentikan:', ada.map(a => a.id).join(',')); process.exit(1) }

// Cocokkan butir bank dengan naskah lewat teks soal (urutan naskah = nomor soal).
const { data: bank, error: e0 } = await db.from('question_bank_items')
  .select('id, type, prompt, options, correct_answer, weight, explanation, stimulus_images, created_by, created_at')
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
  description: '30 contoh soal resmi Pusat Asesmen Pendidikan (daya serap TKA SMP Matematika 2025/2026), satu soal per indikator. Kunci jawaban dibuat Claude karena situs sumber tidak menampilkannya; tinjau dulu sebelum diterbitkan.',
  status: 'draft',
  kind: 'tryout',
  settings: { show_score_immediately: false, shuffle_choices: false, shuffle_questions: false },
}).select('id').single()
if (e1) { console.error('Gagal membuat paket:', e1.message); process.exit(1) }

const { error: e2 } = await db.from('questions').insert(urut.map((b, i) => ({
  quiz_id: kuis.id, type: b.type, prompt: b.prompt, options: b.options, correct_answer: b.correct_answer,
  weight: b.weight, order_index: i, explanation: b.explanation, stimulus_images: b.stimulus_images ?? [], bank_item_id: b.id,
})))
if (e2) { await db.from('quizzes').delete().eq('id', kuis.id); console.error('Gagal mengisi soal, paket dibatalkan:', e2.message); process.exit(1) }
console.log('Paket draf dibuat:', kuis.id, '—', urut.length, 'soal')
