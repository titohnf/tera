-- ============================================================
-- Menutup tulisan latihan yang terbuka untuk siapa saja
--
-- Migrasi 061 membuka `practice_sessions` dan `practice_answers` untuk anon
-- dengan alasan yang ditulis terang-terangan di sana: "kode latihan bukan
-- penghalang pemalsuan, dan catatan latihan bukan nilai resmi". Itu masuk akal
-- selama satu-satunya pintu latihan adalah kode akses yang dibagikan admin —
-- yang bisa dipalsukan hanya catatannya sendiri.
--
-- Dua hal berubah sejak itu.
--
-- Pertama, latihan pindah ke `/belajar` di aplikasi Tera, yang menulis
-- SELURUHNYA lewat fungsi bergerbang migrasi 114 (`practice_open_session`,
-- `practice_record_answer`, `practice_finish_session`). Tidak ada satu pun
-- tulisan yang masih lewat policy ini.
--
-- Kedua, populasi akunnya tidak lagi tertutup. Sejak migrasi 107–110 siapa pun
-- bisa mendaftar dan berlangganan, dan `learners` mereka memuat riwayat yang
-- akan jadi dasar laporan penguasaan. "Bukan nilai resmi" adalah penilaian yang
-- benar untuk murid bimbel yang tutornya mengenalnya; ia tidak berlaku untuk
-- orang asing yang bisa menulis baris atas nama learner mana pun.
--
-- PRASYARAT: `/practice` di Sora sudah dipensiunkan dan versinya sudah
-- ter-deploy. Migrasi ini dijalankan LEBIH DULU dari deploy Sora berarti Sora
-- yang masih terpasang berhenti mencatat jawaban — dan berhenti dengan diam,
-- karena kegagalan RLS pada insert bukan galat yang sampai ke layar murid.
--
-- `attempts` dan `answers` SENGAJA TIDAK DISENTUH di sini. Keduanya milik
-- jalur kuis `/q/[code]`, yang masih hidup dan memang anonim: murid tanpa akun
-- mengerjakannya lewat share code. Policy tulisnya pun sudah bergerbang status
-- `published`, bukan `true`. Yang bocor di sana tinggal DUA policy BACA
-- ("Public reads attempts", "Public reads answers"), dan menutupnya menuntut
-- pembacaan ulang seluruh alur `/q` — pekerjaan tersendiri, bukan ekor dari
-- pensiunnya `/practice`.
-- ============================================================

-- Tulisan: tidak ada lagi yang masuk selain lewat fungsi migrasi 114, yang
-- security definer dan karenanya tidak tunduk pada policy ini.
drop policy if exists "Public creates practice sessions" on practice_sessions;
drop policy if exists "Public finishes practice sessions" on practice_sessions;
drop policy if exists "Public creates practice answers" on practice_answers;

-- Bacaan: `using (true)` di sini berarti setiap pemegang anon key bisa membaca
-- seluruh riwayat latihan semua orang kalau ia menebak sebuah id. Diganti
-- dengan syarat yang sudah dipakai seluruh jalur latihan — sesi itu miliknya —
-- lewat gerbang yang sama, `practice_actor()`.
--
-- Halaman `/belajar` sendiri tidak bergantung pada policy baca ini: ia membaca
-- lewat `practice_session_state()` dan `practice_summary()` yang security
-- definer. Policy ini ada untuk yang lain — halaman penguasaan, dan siapa pun
-- yang kelak membaca riwayat latihan dengan client sesi.
drop policy if exists "Public reads practice sessions" on practice_sessions;
drop policy if exists "Public reads practice answers" on practice_answers;

create policy "Pemilik dan staf membaca sesi latihan" on practice_sessions
  for select using (
    learner_id = practice_actor('', learner_id)
    or is_admin()
    or is_tutor()
  );

create policy "Pemilik dan staf membaca jawaban latihan" on practice_answers
  for select using (
    learner_id = practice_actor('', learner_id)
    or is_admin()
    or is_tutor()
  );

notify pgrst, 'reload schema';
