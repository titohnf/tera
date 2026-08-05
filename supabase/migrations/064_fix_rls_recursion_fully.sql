-- ============================================================
-- FIX MENYELURUH: siklus RLS antar tabel
--
-- 004 sudah memutus satu siklus (is_admin -> profiles -> class_students ->
-- is_admin) dengan memindahkan kuerinya ke fungsi security definer ber-
-- `row_security = off`. Tapi siklusnya lebih dari satu:
--
--   classes SELECT        -> menanyakan class_students
--   class_students SELECT -> menanyakan classes
--
--   profiles SELECT       -> menanyakan class_students -> classes -> ...
--   sessions/materials/assessments/class_subjects -> class_students -> classes
--
-- Selama seluruh aplikasi Tera memakai createAdminClient() (service role, yang
-- melewati RLS), tidak ada yang terlihat. Begitu ada satu kueri yang berjalan
-- sebagai anon, tutor, atau murid, Postgres melempar
-- "infinite recursion detected in policy for relation ...". Itulah yang terjadi
-- saat halaman latihan mandiri menyentuh practice_sessions.
--
-- 063 hanya menambal policy milik QuizCraft. File ini menambal sumbernya, jadi
-- fitur Tera mana pun yang nanti membaca data tanpa service role tidak menabrak
-- ranjau yang sama.
--
-- Polanya persis 004: setiap policy yang harus melihat tabel LAIN memanggil
-- fungsi security definer, bukan menulis subquery yang akan memicu policy tabel
-- itu. Aturan siapa-boleh-lihat-apa tidak berubah sama sekali.
-- ============================================================

-- Helper ---------------------------------------------------------------------

create or replace function is_class_tutor(p_class_id uuid)
returns boolean
language sql
security definer
set row_security = off
stable
as $$
  select exists (
    select 1 from classes c
    where c.id = p_class_id and c.tutor_id = auth.uid()
  );
$$;

create or replace function is_enrolled_in_class(p_class_id uuid)
returns boolean
language sql
security definer
set row_security = off
stable
as $$
  select exists (
    select 1 from class_students cs
    where cs.class_id = p_class_id
      and cs.student_id = auth.uid()
      and cs.is_active
  );
$$;

/** Murid yang diajar tutor yang sedang login — dipakai policy `profiles`. */
create or replace function tutor_teaches_student(p_student_id uuid)
returns boolean
language sql
security definer
set row_security = off
stable
as $$
  select exists (
    select 1 from class_students cs
    join classes c on c.id = cs.class_id
    where cs.student_id = p_student_id
      and cs.is_active
      and c.tutor_id = auth.uid()
  );
$$;

create or replace function is_session_tutor(p_session_id uuid)
returns boolean
language sql
security definer
set row_security = off
stable
as $$
  select exists (
    select 1 from sessions s
    where s.id = p_session_id and s.tutor_id = auth.uid()
  );
$$;

create or replace function is_enrolled_in_session(p_session_id uuid)
returns boolean
language sql
security definer
set row_security = off
stable
as $$
  select exists (
    select 1 from sessions s
    join class_students cs on cs.class_id = s.class_id
    where s.id = p_session_id
      and cs.student_id = auth.uid()
      and cs.is_active
  );
$$;

create or replace function is_assessment_tutor(p_assessment_id uuid)
returns boolean
language sql
security definer
set row_security = off
stable
as $$
  select exists (
    select 1 from assessments a
    join sessions s on s.id = a.session_id
    where a.id = p_assessment_id and s.tutor_id = auth.uid()
  );
$$;

-- PROFILES -------------------------------------------------------------------

drop policy if exists "Tutors can view students in their classes" on profiles;
create policy "Tutors can view students in their classes"
  on profiles for select using (tutor_teaches_student(profiles.id));

-- CLASSES --------------------------------------------------------------------

drop policy if exists "Students can view enrolled classes" on classes;
create policy "Students can view enrolled classes"
  on classes for select using (is_enrolled_in_class(classes.id));

-- CLASS STUDENTS -------------------------------------------------------------

drop policy if exists "Tutor can view students in their classes" on class_students;
create policy "Tutor can view students in their classes"
  on class_students for select using (is_class_tutor(class_students.class_id));

-- CLASS SUBJECTS -------------------------------------------------------------

drop policy if exists "Tutors view their class subjects" on class_subjects;
create policy "Tutors view their class subjects"
  on class_subjects for select using (is_class_tutor(class_subjects.class_id));

drop policy if exists "Students view enrolled class subjects" on class_subjects;
create policy "Students view enrolled class subjects"
  on class_subjects for select using (is_enrolled_in_class(class_subjects.class_id));

-- SESSIONS -------------------------------------------------------------------

drop policy if exists "Students can view sessions of enrolled classes" on sessions;
create policy "Students can view sessions of enrolled classes"
  on sessions for select using (is_enrolled_in_class(sessions.class_id));

-- ATTENDANCES ----------------------------------------------------------------

drop policy if exists "Tutor can manage attendance for their sessions" on attendances;
create policy "Tutor can manage attendance for their sessions"
  on attendances for all using (is_session_tutor(attendances.session_id));

-- MATERIALS ------------------------------------------------------------------

drop policy if exists "Tutor can manage materials for their sessions" on materials;
create policy "Tutor can manage materials for their sessions"
  on materials for all using (is_session_tutor(materials.session_id));

drop policy if exists "Students can view materials of enrolled sessions" on materials;
create policy "Students can view materials of enrolled sessions"
  on materials for select using (is_enrolled_in_session(materials.session_id));

-- ASSESSMENTS ----------------------------------------------------------------

drop policy if exists "Tutor can manage assessments for their sessions" on assessments;
create policy "Tutor can manage assessments for their sessions"
  on assessments for all using (is_session_tutor(assessments.session_id));

drop policy if exists "Students can view assessments of enrolled sessions" on assessments;
create policy "Students can view assessments of enrolled sessions"
  on assessments for select using (is_enrolled_in_session(assessments.session_id));

-- ASSESSMENT RESULTS ---------------------------------------------------------

drop policy if exists "Tutor can manage results for their assessments" on assessment_results;
create policy "Tutor can manage results for their assessments"
  on assessment_results for all using (is_assessment_tutor(assessment_results.assessment_id));

-- QUIZCRAFT ------------------------------------------------------------------
-- 063 sudah memakai helper sendiri; disamakan namanya di sini supaya hanya ada
-- satu kumpulan helper.

drop policy if exists "Tutors read own class quizzes" on quizzes;
create policy "Tutors read own class quizzes" on quizzes
  for select using (is_tutor() and is_class_tutor(quizzes.class_id));
