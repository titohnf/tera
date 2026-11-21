-- ============================================================
-- Peta kompetensi per soal
--
-- Untuk membaca hasil try out menurut KOMPETENSI, bukan hanya menurut nomor
-- soal: persentase benar per elemen, sub-elemen, kompetensi, dan indikator,
-- seperti halaman daya serap Pusmendik. Hasilnya dipakai untuk (a) merujuk
-- penyusunan soal try out berikutnya, dan (b) membaca kemampuan per siswa.
--
-- Bentuk isi (objek JSON, satu per soal):
--   {
--     "elemen":     { "nama": "Bilangan",       "nasional": 36.03 },
--     "subelemen":  { "nama": "Bilangan Real",  "nasional": 35.63 },
--     "kompetensi": { "nama": "…",              "nasional": 34.09 },
--     "indikator":  { "nama": "…", "nomor": 1,  "nasional": 34.09 },
--     "sumber": "…"
--   }
-- `nasional` = persentase capaian nasional di sumbernya (null bila tidak ada),
-- sebagai pembanding. Null berarti soal belum dipetakan.
--
-- Dua tabel, sejajar dengan `bank_item_id`: kolom di bank ikut tersalin ke
-- paket yang dirakit dari bank, dan kolom di `questions` yang dibaca laporan.
--
-- Aman dijalankan ulang. Tidak mengubah soal, kunci, ataupun nilai.
-- ============================================================

alter table question_bank_items
  add column if not exists kompetensi jsonb;

alter table questions
  add column if not exists kompetensi jsonb;

comment on column question_bank_items.kompetensi is
  'Peta kompetensi soal (elemen, subelemen, kompetensi, indikator, nasional). Null = belum dipetakan.';
comment on column questions.kompetensi is
  'Salinan peta kompetensi dari bank soal, dibaca laporan hasil try out. Null = belum dipetakan.';
