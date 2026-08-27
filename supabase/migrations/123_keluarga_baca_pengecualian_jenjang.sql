-- ============================================================
-- Keluarga boleh membaca pengecualian jenjang anaknya
--
-- Sejak daftar topik di `/belajar` dikelompokkan per kelas, halaman itu perlu
-- tahu kurikulum jenjang mana yang berlaku untuk si anak — bukan cuma
-- `profiles.grade`. Untuk sebagian siswa keduanya berbeda: migrasi 105 dibuat
-- persis karena ada siswa kelas 8 yang atas keputusan manajemen belajar IPA
-- dari kurikulum Kelas 7, dan tabel `student_curriculum_grade_overrides`
-- menyimpan keputusan itu sebagai data, bukan sebagai nama di dalam kode.
--
-- Policy-nya sampai sekarang hanya admin dan tutor, karena satu-satunya yang
-- membacanya adalah halaman sesi. Tanpa baris ini, `/belajar` akan menyorot
-- Kelas 8 untuk anak yang IPA-nya Kelas 7 — bukan layar rusak, tapi sorotan
-- yang salah, yang justru lebih menyesatkan daripada tidak menyorot apa pun.
--
-- Yang dibuka cuma baca, cuma untuk anak yang memang di bawah keluarga itu
-- (`family_covers_student`, migrasi 076), dan isinya tidak lebih sensitif dari
-- kelas anaknya sendiri yang sudah mereka lihat di portal.
--
-- `lib/curriculum-grade.ts` sudah menjadi satu-satunya penerjemahnya, dan
-- ditulis agar aman tanpa migrasi ini: tanpa policy, kuerinya balik kosong dan
-- yang tersorot tinggal kelas asli si anak.
-- ============================================================

create policy "Families read own children curriculum grade overrides"
  on student_curriculum_grade_overrides
  for select using (is_family() and family_covers_student(student_id));

notify pgrst, 'reload schema';
