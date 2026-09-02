-- ============================================================
-- Soal ditandai ke topik pengukuran
--
-- Sampai sekarang sebuah butir hanya tahu ia muncul di grup kurikulum mana
-- (`question_curriculum_tags`). Itu jawaban untuk pertanyaan PENEMPATAN — "di
-- bab mana soal ini disodorkan" — dan tetap benar untuk kuis kelas, saringan
-- admin, serta seluruh mapel yang tidak punya peta kompetensi.
--
-- Yang belum punya jawaban: "butir ini mengukur topik apa". Keduanya terlihat
-- mirip sampai diperhatikan bahwa satu topik progression memetakan ke BANYAK
-- grup lintas kurikulum — D-01 saja ke empat — dan bahwa "Bilangan Bulat" di
-- Kurikulum Merdeka dan di Cambridge adalah dua baris berbeda karena `curriculum`
-- ikut di kunci uniknya. Butir yang ditandai ke salah satunya tidak pernah
-- terlihat oleh murid program lain, padahal yang diukur konsep yang sama.
--
-- KOLOM, BUKAN TABEL KEDUA — dan ini keputusan yang menentukan.
--
-- Penandaan kurikulum sengaja many-to-many, dan halaman penguasaan keluarga
-- bahkan mencatat keputusan sadar bahwa "soal bertanda dua topik dihitung di
-- keduanya", karena yang ditanyakan di sana CAKUPAN: sejauh apa topik ini sudah
-- disentuh. Untuk PENGUKURAN pertanyaannya berbeda: seberapa dikuasai topik
-- ini. Butir yang mengukur dua topik sekaligus membuat penguasaan keduanya
-- bergerak bersama tanpa sebab, dan angka yang bergerak tanpa sebab adalah
-- angka yang tidak bisa dipakai memutuskan apa pun.
--
-- Sebuah kolom membuat "dua topik pengukuran" tidak bisa diungkapkan sama
-- sekali. Kalau kelak ternyata memang perlu, melepasnya jadi tabel adalah
-- migrasi biasa; yang mahal justru arah sebaliknya — memungut kembali angka
-- yang terlanjur dihitung ganda selama berbulan-bulan.
--
-- WAKTUNYA SEKARANG karena `question_bank_items` KOSONG (0 baris). Tidak ada
-- satu butir pun yang perlu dipindahkan atau ditebak topiknya. Menunda ini
-- sampai bank terisi berarti menukar migrasi kolom dengan pekerjaan menandai
-- ratusan butir satu per satu.
-- ============================================================

alter table question_bank_items
  add column if not exists topik_id text references topik(id) on delete restrict;

create index if not exists question_bank_items_topik_idx
  on question_bank_items(topik_id)
  where topik_id is not null;

comment on column question_bank_items.topik_id is
  'Topik pengukuran yang diukur butir ini (Learning Progression). Tepat satu, atau NULL untuk butir di luar peta — mapel selain Matematika, dan soal kurikulum yang bukan instrumen ukur. Sumber TUNGGAL angka penguasaan; question_curriculum_tags tidak pernah menghasilkan angka penguasaan untuk butir yang punya topik.';

-- `on delete restrict`, bukan cascade: menghapus sebuah topik tidak boleh
-- diam-diam melepaskan butir-butirnya dari pengukuran. Kalau sebuah topik
-- memang harus hilang, butirnya dipindahkan dulu dengan sadar — dan kegagalan
-- di sini adalah cara sistem memaksa keputusan itu diambil.

notify pgrst, 'reload schema';
