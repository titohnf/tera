-- ============================================================
-- Persempit hak tutor atas soal: hanya soal di kuis yang ia buat sendiri
--
-- Migrasi 071 memberi tutor policy `for all` pada `questions` dengan syarat
-- `tutor_owns_quiz(quiz_id)`. Fungsi itu bernilai benar lewat DUA jalur — sesi
-- (`sessions.tutor_id`) dan kelas (`classes.tutor_id`) — karena memang dipakai
-- policy baca sejak migrasi 063.
--
-- Untuk hak BACA, cakupan seluas itu benar: tutor memang boleh melihat kuis di
-- kelasnya. Untuk hak TULIS, terlalu luas: kuis yang disusun admin untuk sebuah
-- kelas bisa disunting — bahkan soalnya dihapus — oleh tutor kelas itu, tanpa
-- ia pernah membuatnya. Kebijakannya adalah tutor membuat dan melihat soalnya
-- sendiri, bukan menyunting soal admin.
--
-- Jalur menulis dipisahkan ke `tutor_authors_quiz()`: hanya kuis yang tertaut
-- ke sesi milik tutor itu. `tutor_owns_quiz()` dibiarkan apa adanya supaya
-- policy baca di 063 tidak ikut menyempit.
--
-- Bank soal bersama tetap tertutup rapat untuk tutor, termasuk membacanya:
-- tutor menulis soalnya sendiri, tidak menarik dari korpus admin.
-- ============================================================

create or replace function tutor_authors_quiz(p_quiz_id uuid)
returns boolean
language sql
security definer
set row_security = off
stable
set search_path = public
as $$
  select exists (
    select 1
    from quizzes q
    join sessions s on s.id = q.session_id
    where q.id = p_quiz_id
      and s.tutor_id = auth.uid()
  );
$$;

drop policy if exists "Tutors manage own session questions" on questions;
create policy "Tutors manage own session questions" on questions
  for all
  using (is_tutor() and tutor_authors_quiz(questions.quiz_id))
  with check (is_tutor() and tutor_authors_quiz(questions.quiz_id));

-- Kuis itu sendiri: syaratnya sudah setara sejak 071 (session_id tidak null dan
-- sesinya milik tutor), ditulis ulang lewat helper yang sama supaya kalau
-- definisinya berubah, keduanya ikut bersama.
drop policy if exists "Tutors manage own session quizzes" on quizzes;
create policy "Tutors manage own session quizzes" on quizzes
  for all
  using (is_tutor() and tutor_owns_session(session_id))
  with check (is_tutor() and tutor_owns_session(session_id));
