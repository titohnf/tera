-- ============================================================
-- Kuis QuizCraft terikat ke satu sesi kelas, dan nilainya mengalir ke asesmen
--
-- Sebelum ini `quizzes` hanya tahu kelas (`class_id`), sementara Tera mewajibkan
-- asesmen dan bank soal diisi per SESI. Akibatnya dua sistem punya cerita
-- berbeda tentang hal yang sama: tutor menempelkan URL bank soal di
-- `sessions.cp_urls` dan mengetik nilai ke `assessment_results` dengan tangan,
-- padahal QuizCraft sudah memegang soal dan skornya.
--
-- Tiga bagian:
--   1. `quizzes.session_id` — satu sesi boleh punya beberapa kuis, jadi FK-nya
--      di sisi kuis.
--   2. Tutor boleh menyusun soal untuk kuis di sesinya sendiri. Bank soal
--      bersama (`question_bank_items`) TETAP admin-only: yang dibuka di sini
--      adalah soal milik satu kuis, bukan korpus yang dipakai kelas lain.
--   3. Nilai attempt disalin ke `assessment_results` lewat trigger.
--
-- Keputusan yang perlu diketahui pembaca berikutnya:
--
--   * Nilainya PERSEN (0–100), bukan skor mentah. `assessments.max_score`
--     tetap 100. Skor mentah akan berubah artinya setiap kali soal ditambah
--     atau bobotnya diedit, sehingga nilai lama jadi tidak sebanding; persen
--     tidak.
--   * Skornya dihitung ulang dari `answers`, bukan dibaca dari
--     `attempts.total_score`. Dengan begitu penilaian manual soal esai ikut
--     mengalir sendiri saat tutor menilainya, tanpa jalur kedua.
--   * Yang dipakai attempt PERTAMA (started_at paling awal). Asesmen dikerjakan
--     sekali di akhir sesi; kalau toh ada attempt kedua, yang pertama tetap
--     yang jadi nilai.
--   * Attempt tamu ditolak untuk kuis bersesi: tanpa learner tidak ada jalur ke
--     `profiles`, jadi hasilnya tidak akan pernah bisa jadi nilai. Lebih baik
--     ditolak di depan daripada jadi data yang menggantung.
-- ============================================================

alter table quizzes
  add column if not exists session_id uuid references sessions(id) on delete set null;

create index if not exists quizzes_session_id_idx on quizzes(session_id);

-- Asesmen yang lahir dari sebuah kuis ditandai, supaya sinkronisasi tidak
-- membuat baris baru tiap kali berjalan dan asesmen manual tidak tersentuh.
alter table assessments
  add column if not exists quiz_id uuid references quizzes(id) on delete cascade;

create unique index if not exists assessments_quiz_id_key
  on assessments(quiz_id) where quiz_id is not null;

-- 1. Kepemilikan tutor ------------------------------------------------------
-- Ditambah jalur sesi. Sebelumnya hanya lewat kelas, sehingga kuis yang
-- ditautkan ke sesi milik tutor tidak terlihat olehnya kalau tutor utama
-- kelasnya orang lain — kasus yang biasa terjadi saat tutor pengganti.
create or replace function tutor_owns_quiz(p_quiz_id uuid)
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
    left join classes c on c.id = q.class_id
    left join sessions s on s.id = q.session_id
    where q.id = p_quiz_id
      and (c.tutor_id = auth.uid() or s.tutor_id = auth.uid())
  );
$$;

-- 2. Tutor menyusun soal untuk kuis di sesinya ------------------------------
create or replace function tutor_owns_session(p_session_id uuid)
returns boolean
language sql
security definer
set row_security = off
stable
set search_path = public
as $$
  select exists (
    select 1 from sessions s where s.id = p_session_id and s.tutor_id = auth.uid()
  );
$$;

drop policy if exists "Tutors manage own session quizzes" on quizzes;
create policy "Tutors manage own session quizzes" on quizzes
  for all
  using (is_tutor() and session_id is not null and tutor_owns_session(session_id))
  with check (is_tutor() and session_id is not null and tutor_owns_session(session_id));

drop policy if exists "Tutors manage own session questions" on questions;
create policy "Tutors manage own session questions" on questions
  for all
  using (is_tutor() and tutor_owns_quiz(questions.quiz_id))
  with check (is_tutor() and tutor_owns_quiz(questions.quiz_id));

-- 3. Kuis bersesi tidak menerima tamu ---------------------------------------
drop policy if exists "Public creates attempts on published quizzes" on attempts;
create policy "Public creates attempts on published quizzes" on attempts
  for insert with check (
    exists (
      select 1 from quizzes q
      where q.id = attempts.quiz_id
        and q.status = 'published'
        and (q.session_id is null or attempts.learner_id is not null)
    )
  );

-- 4. Nilai mengalir ke asesmen ----------------------------------------------

/**
 * Hitung ulang nilai satu attempt dan tulis ke assessment_results.
 *
 * Diam (tidak menulis apa pun) kalau: kuisnya tidak terikat sesi, attempt-nya
 * belum submit, attempt-nya bukan yang pertama untuk murid itu, murid tidak
 * punya profil, atau masih ada jawaban yang menunggu penilaian manual.
 */
create or replace function sync_quiz_assessment_result(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quiz quizzes%rowtype;
  v_attempt attempts%rowtype;
  v_student uuid;
  v_assessment uuid;
  v_total numeric;
  v_max numeric;
begin
  select * into v_attempt from attempts where id = p_attempt_id;
  if not found or v_attempt.submitted_at is null then return; end if;

  select * into v_quiz from quizzes where id = v_attempt.quiz_id;
  if not found or v_quiz.session_id is null then return; end if;

  -- Hanya attempt pertama murid ini yang jadi nilai.
  if exists (
    select 1 from attempts a
    where a.quiz_id = v_attempt.quiz_id
      and a.learner_id is not distinct from v_attempt.learner_id
      and a.started_at < v_attempt.started_at
  ) then
    return;
  end if;

  select l.profile_id into v_student from learners l where l.id = v_attempt.learner_id;
  if v_student is null then return; end if;

  -- Masih menunggu tutor menilai esai/unggahan: jangan tulis angka setengah jadi.
  if exists (
    select 1 from answers a
    where a.attempt_id = p_attempt_id
      and a.needs_manual_grading
      and a.manual_score is null
  ) then
    return;
  end if;

  select coalesce(sum(coalesce(a.manual_score, a.auto_score, 0)), 0)
    into v_total
  from answers a where a.attempt_id = p_attempt_id;

  select coalesce(sum(q.weight), 0) into v_max from questions q where q.quiz_id = v_quiz.id;
  if v_max = 0 then return; end if;

  -- Asesmen pendamping kuisnya, dibuat sekali.
  select id into v_assessment from assessments where quiz_id = v_quiz.id;
  if v_assessment is null then
    insert into assessments (session_id, created_by, title, description, max_score, quiz_id)
    values (
      v_quiz.session_id,
      coalesce(v_quiz.created_by, (select tutor_id from sessions where id = v_quiz.session_id)),
      v_quiz.title,
      'Dinilai otomatis dari QuizCraft.',
      100,
      v_quiz.id
    )
    returning id into v_assessment;
  end if;

  insert into assessment_results (assessment_id, student_id, score, graded_at)
  values (v_assessment, v_student, round(v_total / v_max * 100, 2), now())
  on conflict (assessment_id, student_id) do update
    set score = excluded.score, graded_at = excluded.graded_at;
end $$;

create or replace function trg_sync_assessment_from_attempt()
returns trigger language plpgsql as $$
begin
  perform sync_quiz_assessment_result(new.id);
  return new;
end $$;

create or replace function trg_sync_assessment_from_answer()
returns trigger language plpgsql as $$
begin
  perform sync_quiz_assessment_result(new.attempt_id);
  return new;
end $$;

drop trigger if exists sync_assessment_on_attempt on attempts;
create trigger sync_assessment_on_attempt
  after insert or update of submitted_at, total_score on attempts
  for each row execute function trg_sync_assessment_from_attempt();

-- Penilaian manual menyentuh answers, bukan attempts, jadi butuh pemicunya
-- sendiri — kalau tidak, nilai esai tidak pernah sampai ke Tera.
drop trigger if exists sync_assessment_on_answer on answers;
create trigger sync_assessment_on_answer
  after insert or update of manual_score, auto_score, needs_manual_grading on answers
  for each row execute function trg_sync_assessment_from_answer();
