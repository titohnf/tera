-- ============================================================
-- Asesmen Sora dikerjakan dari akun keluarga (menu Belajar)
--
-- Asesmen sesi sudah bisa dikerjakan di Sora lewat `/q/[kode]` (075), tapi
-- hanya oleh akun murid yang login sendiri. Yang dipakai keluarga bimbel adalah
-- akun ORANG TUA, yang mewakili anak lewat `family_students` — pintu yang sudah
-- dipakai seluruh permukaan latihan (`practice_*`, 092). Migrasi ini membuka
-- pintu yang sama untuk asesmen, supaya nilainya mengalir ke
-- `assessment_results` lewat trigger 071/074 tanpa tutor mengetik ulang.
--
-- Lima fungsi, semuanya `security definer` dan semuanya bergerbang
-- `family_covers_student()`. Sisi keluarga TIDAK diberi policy baru di `quizzes`,
-- `questions`, `attempts`, atau `answers`: tabel-tabel itu memuat kunci jawaban
-- (`questions.correct_answer`), dan akun yang sama dipakai anaknya berlatih.
-- Fungsi di bawah yang memutuskan kolom mana yang boleh keluar.
--
--   asesmen_anak()           daftar asesmen sesi anak + keadaan pengerjaannya
--   mulai_asesmen_anak()     buat (atau lanjutkan) attempt
--   soal_asesmen_anak()      soal TANPA kunci dan pembahasan
--   simpan_jawaban_asesmen() catat satu jawaban
--   kirim_asesmen_anak()     nilai di database lewat nilai_jawaban_banyak(),
--                            tutup attempt, kembalikan persen
--
-- Penilaian dilakukan di sini, bukan di browser atau server aplikasi: aturannya
-- satu-satunya di `nilai_jawaban()` (136/138), sama dengan yang dipakai Sora.
--
-- Esai dan unggah berkas BELUM didukung di layar keluarga. Asesmen yang
-- memuatnya ditandai `bisa_dikerjakan = false` dan layar menjelaskannya,
-- alih-alih menyajikan soal yang tidak bisa dijawab.
-- ============================================================

-- Jendela waktu: sesi sebulan terakhir sampai besok. Asesmen dikerjakan di
-- akhir pertemuan; yang lebih tua dari itu tidak lagi ditawarkan.

create or replace function asesmen_anak(p_student uuid)
returns table (
  assessment_id uuid,
  session_id uuid,
  title text,
  kind text,
  scheduled_at timestamptz,
  class_name text,
  jumlah_soal integer,
  bisa_dikerjakan boolean,
  alasan text,
  attempt_id uuid,
  selesai boolean,
  persen numeric
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    a.id,
    a.session_id,
    a.title,
    q.kind,
    s.scheduled_at,
    c.name,
    (select count(*)::int from questions qq where qq.quiz_id = q.id),
    case
      when exists (select 1 from questions qq
                   where qq.quiz_id = q.id and qq.type in ('essay', 'upload_file')) then false
      when (select count(*) from questions qq where qq.quiz_id = q.id) = 0 then false
      when (q.settings ->> 'opens_at') is not null
           and now() < (q.settings ->> 'opens_at')::timestamptz then false
      when (q.settings ->> 'closes_at') is not null
           and now() > (q.settings ->> 'closes_at')::timestamptz then false
      else true
    end,
    case
      when exists (select 1 from questions qq
                   where qq.quiz_id = q.id and qq.type in ('essay', 'upload_file'))
        then 'Memuat soal esai atau unggah berkas — dikerjakan lewat tutor.'
      when (select count(*) from questions qq where qq.quiz_id = q.id) = 0
        then 'Soalnya belum diisi.'
      when (q.settings ->> 'opens_at') is not null
           and now() < (q.settings ->> 'opens_at')::timestamptz then 'Belum dibuka.'
      when (q.settings ->> 'closes_at') is not null
           and now() > (q.settings ->> 'closes_at')::timestamptz then 'Sudah ditutup.'
      else null
    end,
    at.id,
    coalesce(at.submitted_at is not null, false),
    case
      when at.submitted_at is null then null
      else round(
        100 * coalesce(at.total_score, 0)
        / nullif((select sum(qq.weight) from questions qq where qq.quiz_id = q.id), 0), 0)
    end
  from assessments a
  join quizzes q on q.id = a.quiz_id and q.status = 'published'
  join sessions s on s.id = a.session_id
  left join classes c on c.id = s.class_id
  left join lateral (
    select x.id, x.submitted_at, x.total_score
    from attempts x
    join learners l on l.id = x.learner_id
    where x.assessment_id = a.id and l.profile_id = p_student
    order by (x.submitted_at is not null) desc, x.started_at
    limit 1
  ) at on true
  where family_covers_student(p_student)
    and exists (
      select 1 from class_students cs
      where cs.class_id = s.class_id and cs.is_active and cs.student_id = p_student
    )
    and s.scheduled_at between now() - interval '30 days' and now() + interval '1 day'
  order by s.scheduled_at desc;
$$;

-- Mulai atau lanjutkan. Attempt yang belum disubmit dipakai ulang, supaya muat
-- ulang di tengah pengerjaan tidak menghilangkan jawaban. Yang sudah disubmit
-- ditolak: hanya attempt pertama yang jadi nilai (071), jadi menawarkan yang
-- kedua cuma menjanjikan sesuatu yang tidak akan dihitung.
create or replace function mulai_asesmen_anak(p_assessment uuid, p_student uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
set row_security = off
as $$
declare
  e record;
  v_learner uuid;
  v_attempt uuid;
begin
  if not family_covers_student(p_student) then
    raise exception 'Bukan anak dari akun ini.' using errcode = 'P0002';
  end if;

  select * into e from asesmen_anak(p_student) where assessment_id = p_assessment;
  if not found then
    raise exception 'Asesmen ini tidak tersedia untuk anak ini.' using errcode = 'P0002';
  end if;
  if not e.bisa_dikerjakan then
    raise exception '%', coalesce(e.alasan, 'Asesmen ini belum bisa dikerjakan.')
      using errcode = 'P0002';
  end if;
  if e.selesai then
    raise exception 'Asesmen ini sudah dikerjakan.' using errcode = 'P0002';
  end if;

  select id into v_learner from learners where profile_id = p_student;
  if v_learner is null then
    insert into learners (profile_id, name)
    select p_student, coalesce(p.full_name, 'Murid') from profiles p where p.id = p_student
    returning id into v_learner;
  end if;

  select id into v_attempt from attempts
  where assessment_id = p_assessment and learner_id = v_learner and submitted_at is null
  order by started_at limit 1;
  if v_attempt is not null then return v_attempt; end if;

  insert into attempts (quiz_id, assessment_id, learner_id, guest_name)
  select a.quiz_id, a.id, v_learner, coalesce(l.name, 'Murid')
  from assessments a, learners l
  where a.id = p_assessment and l.id = v_learner
  returning id into v_attempt;

  return v_attempt;
end $$;

-- Penjaga bersama untuk tiga fungsi di bawah: attempt itu milik anak dari akun
-- ini, dan belum disubmit.
create or replace function _attempt_anak_terbuka(p_attempt uuid)
returns uuid  -- quiz_id, atau null kalau bukan haknya / sudah selesai
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select at.quiz_id
  from attempts at
  join learners l on l.id = at.learner_id
  where at.id = p_attempt
    and at.submitted_at is null
    and l.profile_id is not null
    and family_covers_student(l.profile_id);
$$;

-- Soal TANPA correct_answer dan explanation. Urutan mengikuti order_index.
create or replace function soal_asesmen_anak(p_attempt uuid)
returns table (id uuid, tipe text, prompt text, opsi jsonb, bobot numeric, urutan integer)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select q.id, q.type, q.prompt, q.options, q.weight, q.order_index
  from questions q
  where q.quiz_id = _attempt_anak_terbuka(p_attempt)
  order by q.order_index, q.created_at;
$$;

-- Jawaban yang sudah tercatat di attempt ini, supaya pengerjaan bisa dilanjutkan.
create or replace function jawaban_asesmen_anak(p_attempt uuid)
returns table (question_id uuid, response jsonb)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select a.question_id, a.response
  from answers a
  where a.attempt_id = p_attempt
    and _attempt_anak_terbuka(p_attempt) is not null;
$$;

create or replace function simpan_jawaban_asesmen(
  p_attempt uuid, p_question uuid, p_response jsonb
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
set row_security = off
as $$
declare
  v_quiz uuid := _attempt_anak_terbuka(p_attempt);
begin
  if v_quiz is null then return false; end if;
  if not exists (select 1 from questions where id = p_question and quiz_id = v_quiz) then
    return false;
  end if;

  insert into answers (attempt_id, question_id, quiz_id, response)
  values (p_attempt, p_question, v_quiz, p_response)
  on conflict (attempt_id, question_id) do update set response = excluded.response;

  update attempts
  set last_active_at = now()
  where id = p_attempt;

  return true;
end $$;

-- Menilai, menutup, dan mengembalikan persen (0-100). Soal yang tidak dijawab
-- dinilai sebagai jawaban kosong (null), sama dengan `finalizeAttempt` di Sora.
create or replace function kirim_asesmen_anak(p_attempt uuid)
returns numeric
language plpgsql
volatile
security definer
set search_path = public
set row_security = off
as $$
declare
  v_quiz uuid := _attempt_anak_terbuka(p_attempt);
  v_daftar jsonb;
  v_nilai jsonb;
  v_total numeric;
  v_max numeric;
begin
  if v_quiz is null then
    raise exception 'Asesmen ini tidak bisa dikirim.' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'tipe', q.type, 'opsi', q.options, 'kunci', q.correct_answer,
           'jawaban', a.response, 'bobot', q.weight
         ) order by q.order_index, q.created_at), '[]'::jsonb)
    into v_daftar
  from questions q
  left join answers a on a.question_id = q.id and a.attempt_id = p_attempt
  where q.quiz_id = v_quiz;

  v_nilai := nilai_jawaban_banyak(v_daftar);

  -- Satu baris answers per soal, termasuk yang tidak dijawab, dengan skor
  -- dari hasil di atas (sejajar urutan yang sama).
  insert into answers (attempt_id, question_id, quiz_id, response, auto_score,
                       manual_score, needs_manual_grading)
  select p_attempt, s.id, v_quiz, s.response,
         (v_nilai ->> (s.n - 1)::int)::numeric, null,
         (v_nilai -> (s.n - 1)::int) = 'null'::jsonb
  from (
    select q.id, a.response,
           row_number() over (order by q.order_index, q.created_at) as n
    from questions q
    left join answers a on a.question_id = q.id and a.attempt_id = p_attempt
    where q.quiz_id = v_quiz
  ) s
  on conflict (attempt_id, question_id) do update
    set auto_score = excluded.auto_score,
        needs_manual_grading = excluded.needs_manual_grading;

  select coalesce(sum(auto_score), 0) into v_total from answers where attempt_id = p_attempt;
  select coalesce(sum(weight), 0) into v_max from questions where quiz_id = v_quiz;

  -- submitted_at terisi terakhir: trigger 071 menyalin nilai ke
  -- assessment_results begitu kolom ini berubah.
  update attempts
  set total_score = v_total, submitted_at = now(), last_active_at = now()
  where id = p_attempt;

  if v_max = 0 then return 0; end if;
  return round(100 * v_total / v_max, 0);
end $$;

grant execute on function asesmen_anak(uuid) to authenticated;
grant execute on function mulai_asesmen_anak(uuid, uuid) to authenticated;
grant execute on function soal_asesmen_anak(uuid) to authenticated;
grant execute on function jawaban_asesmen_anak(uuid) to authenticated;
grant execute on function simpan_jawaban_asesmen(uuid, uuid, jsonb) to authenticated;
grant execute on function kirim_asesmen_anak(uuid) to authenticated;
revoke execute on function _attempt_anak_terbuka(uuid) from public, anon, authenticated;
