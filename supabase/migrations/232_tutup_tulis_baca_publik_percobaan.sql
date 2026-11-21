-- ============================================================
-- !!  JANGAN JALANKAN SEBELUM SORA YANG BARU TERDEPLOY DAN DIUJI  !!
--
-- Keamanan tahap 2 (2/2): mencabut kebijakan publik pada `attempts`,
-- `answers`, dan penulisan `attempt_events`. Peserta kini hanya bekerja lewat
-- fungsi migrasi 231. Sora versi LAMA menulis langsung ke tabel-tabel ini, jadi
-- menjalankan migrasi ini sebelum deploy membuat penyimpanan jawaban GAGAL.
--
-- Urutan: 231 -> deploy Sora (memakai fungsi) -> uji alur peserta -> 232 ->
-- uji lagi (anon tidak bisa membaca/menulis tabelnya).
--
-- Tidak tersentuh: kebijakan admin, tutor (baca/umpan balik), dan
-- "Students manage own attempts/answers" (murid berakun, hanya miliknya).
--
-- Pemulihan seketika (hanya bila terpaksa; membuka kembali celahnya):
--   create policy "Public reads attempts" on attempts for select using (true);
--   create policy "Public reads answers" on answers for select using (true);
--   (dan kebijakan tulis publik seperti di migrasi 061 dan 071)
-- ============================================================

drop policy if exists "Public creates attempts on published quizzes" on attempts;
drop policy if exists "Public updates attempts on published quizzes" on attempts;
drop policy if exists "Public reads attempts" on attempts;

drop policy if exists "Public writes answers for published quizzes" on answers;
drop policy if exists "Public updates answers for published quizzes" on answers;
drop policy if exists "Public reads answers" on answers;

-- Pencatatan kejadian kini lewat catat_kejadian(); anon tidak lagi menulis langsung.
drop policy if exists "Peserta mencatat kejadian di percobaan yang berjalan" on attempt_events;
