-- ============================================================
-- Keluarga boleh membaca pemetaan soal ke topik kurikulum.
--
-- Halaman Penguasaan (`app/keluarga/[studentId]/penguasaan/page.tsx`)
-- menghitung penguasaan per topik dengan menggabungkan tiga hal:
--
--     practice_answers  ->  question_curriculum_tags  ->  curriculum_topic_groups
--
-- Migrasi 076 sudah membuka mata rantai pertama dan ketiga untuk keluarga
-- ("Families read own practice answers", "Families read curriculum groups"),
-- tapi yang di TENGAH terlewat. `question_curriculum_tags` menyalakan RLS di
-- 061_quizcraft.sql dengan satu-satunya policy `"Admins manage question tags"`,
-- jadi bagi orang tua tabel itu selalu kosong.
--
-- Akibatnya halamannya tidak pernah bisa menampilkan apa pun: `groupOf` kosong,
-- setiap baris jawaban gagal dipetakan ke topik, dan orang tua selalu membaca
-- "Belum ada latihan mandiri yang dikerjakan" berapa pun soal yang sudah
-- dikerjakan anaknya. Belum ada yang mengeluh karena `practice_answers` memang
-- masih kosong — cacatnya baru menggigit tepat saat latihan mulai dipakai.
--
-- Dibuka selebar `is_family()`, mengikuti alasan yang sama dengan blok kurikulum
-- di 076: tabel ini hanya berisi pasangan id soal dan id topik. Tidak ada teks
-- soal, tidak ada pilihan jawaban, dan tidak ada kunci jawaban — semuanya
-- tinggal di `question_bank_items`, yang tetap tertutup dan hanya bisa dibuka
-- lewat fungsi `practice_*` di 092.
-- ============================================================

create policy "Families read question tags" on question_curriculum_tags
  for select using (is_family());
