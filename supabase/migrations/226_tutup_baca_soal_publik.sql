-- ============================================================
-- !!  JANGAN JALANKAN SEBELUM SORA YANG BARU TERDEPLOY  !!
--
-- Menutup celah kunci jawaban: peserta tidak lagi boleh membaca tabel
-- `questions` secara langsung. Halaman siswa Sora versi LAMA masih membaca
-- tabel itu, jadi menjalankan migrasi ini sebelum deploy membuat soal KOSONG
-- di layar siswa.
--
-- Urutan: 225 -> deploy Sora (membaca lewat `soal_peserta`) -> uji alur siswa
-- -> 226 -> uji lagi (anon membaca `questions` harus 0 baris).
-- Rancangan: docs/rancangan-keamanan-percobaan.md.
--
-- Pemulihan seketika bila perlu:
--   create policy "Public reads questions of published quizzes" on questions
--     for select using (exists (select 1 from quizzes q
--       where q.id = questions.quiz_id and q.status = 'published'));
-- ============================================================

drop policy if exists "Public reads questions of published quizzes" on questions;

-- Pengelola tetap membaca soal paketnya: admin sudah punya `Admins manage
-- questions`, tutor sesi punya `Tutors manage own session questions`; yang
-- dulu hanya bergantung pada kebijakan publik adalah pembuat paket dan tutor
-- kelas, jadi mereka diberi jalur baca sendiri.
drop policy if exists "Pengelola membaca soal paket" on questions;
create policy "Pengelola membaca soal paket" on questions
  for select using (
    is_admin()
    or (
      is_tutor()
      and exists (
        select 1
        from quizzes q
        where q.id = questions.quiz_id
          and (
            q.created_by = auth.uid()
            or (q.class_id is not null and is_class_tutor(q.class_id))
            or (q.session_id is not null and is_session_tutor(q.session_id))
          )
      )
    )
  );
