-- ============================================================
-- Asesmen jadi lapisan penugasan: satu kuis bisa dipakai di banyak sesi
--
-- Migrasi 071 mengikat kuis ke satu sesi lewat `quizzes.session_id`. Itu cukup
-- untuk kuis yang disusun tutor untuk sesinya sendiri, tapi tidak untuk asesmen
-- yang disusun admin lalu dipakai berulang di banyak sesi — dan yang terakhir
-- ini justru yang lazim.
--
-- Persoalannya bukan penyimpanan, melainkan perutean: sebuah nilai harus tahu
-- SESI MANA yang ia isi. Selama rantainya `attempt -> quiz -> session`, satu
-- kuis yang melayani banyak sesi memutus rantai itu, dan tidak ada cara jujur
-- menebak nilai itu milik sesi yang mana.
--
-- Setelah migrasi ini ada dua sumbu yang berbeda, dan membedakannya penting:
--
--   quizzes.session_id  -> SUMBU KEPEMILIKAN. Sesi tempat kuis disusun; inilah
--                          yang menentukan siapa boleh menyuntingnya (policy
--                          071/072). Kuis induk buatan admin bernilai null,
--                          sehingga tidak ada tutor yang bisa mengubahnya.
--   assessments         -> SUMBU PENUGASAN. Di sesi mana kuis dipakai. Satu
--                          kuis boleh punya banyak baris; tiap baris membawa
--                          share code dan hasilnya sendiri.
--
-- Tabelnya sudah ada dan sudah per sesi, jadi tidak ada tabel baru.
-- ============================================================

-- Satu kuis kini boleh ditugaskan ke banyak sesi.
drop index if exists assessments_quiz_id_key;

-- Share code pindah ke penugasan: pintu masuk murid adalah "kuis ini di sesi
-- ini", bukan kuisnya saja. `quizzes.share_code` dibiarkan untuk kuis lepas
-- yang tidak terikat sesi sama sekali.
alter table assessments
  add column if not exists share_code text;

create unique index if not exists assessments_share_code_key
  on assessments(share_code) where share_code is not null;

-- Attempt membawa penugasannya. Inilah yang membuat perutean nilai jadi sepele:
-- attempt sudah tahu asesmen mana yang ia isi, tanpa menebak lewat kuis.
alter table attempts
  add column if not exists assessment_id uuid references assessments(id) on delete set null;

create index if not exists attempts_assessment_id_idx on attempts(assessment_id);

-- Backfill: kuis bersesi yang sudah terlanjur ada dijadikan satu penugasan,
-- lengkap dengan share code-nya, supaya tautan yang sudah beredar tetap hidup.
insert into assessments (session_id, created_by, title, description, max_score, quiz_id, share_code)
select
  q.session_id,
  coalesce(q.created_by, s.tutor_id),
  q.title,
  'Dinilai otomatis dari QuizCraft.',
  100,
  q.id,
  q.share_code
from quizzes q
join sessions s on s.id = q.session_id
where q.session_id is not null
  and not exists (select 1 from assessments a where a.quiz_id = q.id and a.session_id = q.session_id);

-- Attempt lama diarahkan ke penugasan yang baru dibuat.
update attempts at
set assessment_id = a.id
from quizzes q
join assessments a on a.quiz_id = q.id and a.session_id = q.session_id
where at.quiz_id = q.id and at.assessment_id is null;

-- Perutean nilai ------------------------------------------------------------
-- Ditulis ulang untuk memakai `attempts.assessment_id` sebagai sumber utama.
-- Jalur lama (menebak lewat quizzes.session_id) tetap dipakai sebagai cadangan
-- untuk attempt yang lahir sebelum migrasi ini dan tidak sempat terisi.
create or replace function sync_quiz_assessment_result(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt attempts%rowtype;
  v_assessment assessments%rowtype;
  v_student uuid;
  v_total numeric;
  v_max numeric;
begin
  select * into v_attempt from attempts where id = p_attempt_id;
  if not found or v_attempt.submitted_at is null then return; end if;

  if v_attempt.assessment_id is not null then
    select * into v_assessment from assessments where id = v_attempt.assessment_id;
  else
    select a.* into v_assessment
    from assessments a
    join quizzes q on q.id = a.quiz_id and q.session_id = a.session_id
    where q.id = v_attempt.quiz_id
    limit 1;
  end if;
  if v_assessment.id is null then return; end if;

  -- Hanya attempt pertama murid ini pada penugasan yang sama.
  if exists (
    select 1 from attempts a
    where a.quiz_id = v_attempt.quiz_id
      and a.assessment_id is not distinct from v_attempt.assessment_id
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
    where a.attempt_id = p_attempt_id and a.needs_manual_grading and a.manual_score is null
  ) then
    return;
  end if;

  select coalesce(sum(coalesce(a.manual_score, a.auto_score, 0)), 0) into v_total
  from answers a where a.attempt_id = p_attempt_id;

  select coalesce(sum(q.weight), 0) into v_max
  from questions q where q.quiz_id = v_attempt.quiz_id;
  if v_max = 0 then return; end if;

  insert into assessment_results (assessment_id, student_id, score, graded_at)
  values (v_assessment.id, v_student, round(v_total / v_max * 100, 2), now())
  on conflict (assessment_id, student_id) do update
    set score = excluded.score, graded_at = excluded.graded_at;
end $$;

-- Roster mengikuti penugasan, bukan kuis: murid yang berhak adalah murid di
-- kelas SESI itu, sehingga satu kuis yang dipakai di dua kelas memberi dua
-- daftar yang berbeda.
create or replace function assessment_roster(p_share_code text)
returns table (learner_id uuid, learner_name text)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.name
  from assessments a
  join sessions s on s.id = a.session_id
  join class_students cs on cs.class_id = s.class_id and cs.is_active
  join learners l on l.profile_id = cs.student_id
  where a.share_code = p_share_code
    and coalesce(p_share_code, '') <> '';
$$;
