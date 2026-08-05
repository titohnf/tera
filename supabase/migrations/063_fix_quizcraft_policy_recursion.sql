-- ============================================================
-- FIX: infinite recursion in policy for relation "class_students"
--
-- Penyebabnya siklus yang sudah lama ada di 002_rls_policies.sql:
--   class_students SELECT  -> menanyakan classes
--   classes SELECT         -> menanyakan class_students   ("Students can view
--                                                          enrolled classes")
--
-- Tera sendiri tidak pernah menabraknya karena seluruh aplikasinya memakai
-- service role lewat createAdminClient(), yang melewati RLS. Policy tutor di
-- 061 adalah yang pertama benar-benar membaca class_students/classes di bawah
-- RLS, jadi siklus itu meledak di sana.
--
-- Perbaikannya sama dengan 004_fix_rls_recursion.sql: pindahkan kueri ke fungsi
-- security definer ber-`row_security = off`, sehingga policy tidak lagi memicu
-- policy tabel lain.
--
-- Catatan: siklus aslinya di 002 TIDAK diperbaiki di sini. Selama Tera memakai
-- service role, ia tidak terlihat — tapi ia akan muncul lagi kalau nanti ada
-- kode Tera yang membaca kedua tabel itu sebagai tutor atau murid.
-- ============================================================

create or replace function tutor_teaches_learner(p_learner_id uuid)
returns boolean
language sql
security definer
set row_security = off
stable
as $$
  select exists (
    select 1
    from learners l
    join class_students cs on cs.student_id = l.profile_id and cs.is_active
    join classes c on c.id = cs.class_id
    where l.id = p_learner_id
      and c.tutor_id = auth.uid()
  );
$$;

create or replace function tutor_owns_quiz(p_quiz_id uuid)
returns boolean
language sql
security definer
set row_security = off
stable
as $$
  select exists (
    select 1
    from quizzes q
    join classes c on c.id = q.class_id
    where q.id = p_quiz_id
      and c.tutor_id = auth.uid()
  );
$$;

-- Policy tutor ditulis ulang memakai kedua helper di atas -------------------

drop policy if exists "Tutors read own class quizzes" on quizzes;
create policy "Tutors read own class quizzes" on quizzes
  for select using (is_tutor() and tutor_owns_quiz(quizzes.id));

drop policy if exists "Tutors read own class attempts" on attempts;
create policy "Tutors read own class attempts" on attempts
  for select using (is_tutor() and tutor_owns_quiz(attempts.quiz_id));

drop policy if exists "Tutors read own class answers" on answers;
create policy "Tutors read own class answers" on answers
  for select using (is_tutor() and tutor_owns_quiz(answers.quiz_id));

drop policy if exists "Tutors give feedback on own class answers" on answers;
create policy "Tutors give feedback on own class answers" on answers
  for update using (is_tutor() and tutor_owns_quiz(answers.quiz_id));

drop policy if exists "Tutors read own class practice sessions" on practice_sessions;
create policy "Tutors read own class practice sessions" on practice_sessions
  for select using (is_tutor() and tutor_teaches_learner(practice_sessions.learner_id));

drop policy if exists "Tutors read own class practice answers" on practice_answers;
create policy "Tutors read own class practice answers" on practice_answers
  for select using (is_tutor() and tutor_teaches_learner(practice_answers.learner_id));

-- quiz_roster ikut menyentuh class_students, jadi ia juga harus mematikan RLS
-- di dalam dirinya, bukan sekadar security definer.
drop function if exists quiz_roster(text);

create or replace function quiz_roster(p_share_code text)
returns table (learner_id uuid, learner_name text)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select l.id, l.name
  from quizzes q
  join class_students cs on cs.class_id = q.class_id and cs.is_active
  join learners l on l.profile_id = cs.student_id
  where q.share_code = p_share_code
    and q.status = 'published'
    and coalesce(p_share_code, '') <> ''
  order by l.name;
$$;
