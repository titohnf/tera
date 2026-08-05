-- ============================================================
-- `template` — soal berparameter untuk varian angka di remedial
--
-- Remedial berisi soal yang murid masih salah menjawabnya. Mengulang soal yang
-- persis sama mengundang murid menghafal jawabannya alih-alih memahaminya, jadi
-- soal yang punya templat melahirkan angka baru setiap kali disalin.
--
-- Bentuk isinya (lihat `src/lib/question-template.ts` di Sora):
--
--   {
--     "params": [{"name": "a", "min": 2, "max": 9, "step": 1}],
--     "constraints": ["gcd(p, q) == 1"],
--     "answer": "p + q + r",
--     "distractors": ["p + q", "p * q"],
--     "thousands": false
--   }
--
-- Pertanyaannya memuat `{{d * p}}` yang dihitung saat varian dibuat. Kurawal
-- ganda, bukan tunggal, karena pertanyaan boleh memuat LaTeX dan `\frac{1}{2}`
-- akan tertangkap oleh pola kurawal tunggal.
--
-- Rumusnya dihitung oleh parser kecil buatan sendiri di Sora, bukan `eval`:
-- isi kolom ini disunting lewat browser, dan sekali jalur itu terbuka siapa pun
-- yang bisa menulis soal bisa menjalankan kode di server.
--
-- Angka dibangkitkan SAAT PENYALINAN, bukan saat murid menjawab. Soal remedial
-- yang lahir adalah soal biasa dengan angka dan kunci yang sudah jadi, sehingga
-- penilaian, halaman hasil, dan latihan mandiri tidak perlu tahu apa pun soal
-- templat ini. Kalau dibangkitkan saat menjawab, seluruh jalur itu ikut berubah
-- dan tiap murid mengerjakan soal berbeda — jauh lebih mahal, dan menyulitkan
-- tutor membahas hasilnya di kelas.
--
-- Null untuk soal biasa, dan itu mayoritas: sebagian besar soal tidak punya
-- angka untuk divariasikan, dan soal non-matematika tidak punya sama sekali.
-- ============================================================

alter table questions
  add column if not exists template jsonb;

alter table question_bank_items
  add column if not exists template jsonb;

comment on column questions.template is
  'Templat varian angka untuk remedial; null untuk soal biasa. Lihat lib/question-template.ts di Sora.';
comment on column question_bank_items.template is
  'Templat varian angka untuk remedial; null untuk soal biasa. Lihat lib/question-template.ts di Sora.';
