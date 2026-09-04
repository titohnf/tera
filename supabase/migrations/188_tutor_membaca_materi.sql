-- ============================================================
-- Tutor boleh membaca materi kurikulum
--
-- Sebuah sesi yang topiknya sudah bermateri MENGUNCI kolom lampiran tutornya:
-- "Materi topik ini sudah tersedia di Kurikulum dan otomatis muncul untuk
-- murid. Tidak perlu ditempel lagi." Tutornya lalu diberi tahu judul materinya,
-- dan tidak diberi satu pun cara membukanya — karena `curriculum_resources`
-- tidak punya policy select untuk peran tutor sama sekali. Yang ada cuma
-- `is_admin()` (057), `is_family()` (076), dan `has_product('sora')` (119).
--
-- Selama ini kekurangan itu tidak terlihat karena halaman sesi tutor membaca
-- dengan service role, jadi judulnya tetap muncul. Yang tidak bisa disembunyikan
-- dengan cara yang sama adalah `/api/materi/<id>`: rute itu sengaja meminta
-- barisnya lewat KLIEN SESI lebih dulu, dan baru setelah lolos memakai service
-- role untuk mengambil bytenya. Urutan itu adalah seluruh keamanannya, jadi
-- jawabannya bukan melonggarkan rutenya melainkan memberi tutor hak yang memang
-- pantas dimilikinya: melihat bahan yang sedang diajarkannya.
--
-- `kind = 'materi'` saja, mengikuti batas yang sama dengan 119. `latihan_soal`
-- di tabel yang sama adalah bahan untuk MENYUSUN soal dan bisa memuat kunci
-- jawaban; membukanya adalah keputusan tersendiri yang belum diminta siapa pun.
--
-- Tidak dibatasi ke topik yang diajarnya. Batas seperti itu terdengar lebih
-- rapat, tapi ia harus menelusuri sesi -> kelas -> topik di dalam setiap
-- pemeriksaan baris, dan yang dijaganya cuma daftar bahan ajar yang sudah
-- dibagikan ke seluruh keluarga dan pelanggan. Kerumitan yang tidak menambah
-- apa pun yang dijaga adalah kerumitan yang akan salah suatu hari.
-- ============================================================

create policy "Tutors read learning materials" on curriculum_resources
  for select using (is_tutor() and kind = 'materi');

notify pgrst, 'reload schema';
