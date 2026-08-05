-- ============================================================
-- Murid masuk asesmen dengan akunnya sendiri
--
-- Sebelum ini murid masuk sebagai tamu (mengetik nama) atau memilih dari
-- roster — dua-duanya klaim, bukan identitas. Untuk nilai yang mengalir ke
-- Tera itu tidak memadai. Sekarang murid login, dan identitasnya berasal dari
-- `auth.uid()`.
--
-- Semua jalur masuk lewat satu fungsi `security definer`, mengikuti pola yang
-- sudah dipakai `practice_*` dan `quiz_roster` di migrasi 061: sisi murid tidak
-- pernah menulis langsung ke tabel, jadi RLS tidak perlu menalar soal siapa
-- boleh mengaku sebagai siapa. Kalau attempt boleh di-insert langsung, murid
-- yang login masih bisa mengirim `learner_id` milik temannya.
-- ============================================================

/**
 * Baris `learners` milik pengguna yang sedang login, dibuat kalau belum ada.
 *
 * Dulu baris ini lahir saat admin menerbitkan kode latihan mandiri. Dengan
 * login itu tidak masuk akal lagi: murid yang login sudah punya `profiles.id`,
 * dan menunggu admin menerbitkan kode berarti 25 dari 26 murid tidak punya
 * jalur ke `assessment_results` sama sekali.
 *
 * `access_code` sengaja dibiarkan null — kode itu kredensial untuk latihan
 * mandiri, dan tidak ada alasan menerbitkannya hanya karena murid ikut asesmen.
 */
create or replace function learner_for_me()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text;
begin
  if auth.uid() is null then return null; end if;

  select id into v_id from learners where profile_id = auth.uid();
  if v_id is not null then return v_id; end if;

  select coalesce(full_name, 'Murid') into v_name from profiles where id = auth.uid();

  insert into learners (profile_id, name) values (auth.uid(), v_name)
  on conflict (profile_id) do update set name = excluded.name
  returning id into v_id;

  return v_id;
end $$;

/**
 * Apa yang ada di balik sebuah share code, dan apakah pengguna yang sedang
 * login berhak mengerjakannya.
 *
 * Dipisah dari fungsi mulai mengerjakan supaya halaman bisa menjelaskan
 * penolakan dengan tepat — "kamu tidak terdaftar di kelas sesi ini" berbeda
 * dari "kuisnya belum terbit", dan keduanya berbeda dari "kode tidak dikenal".
 */
create or replace function assessment_entry(p_share_code text)
returns table (
  assessment_id uuid,
  quiz_id uuid,
  session_id uuid,
  title text,
  quiz_status text,
  scheduled_at timestamptz,
  class_name text,
  eligible boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id, q.id, a.session_id, a.title, q.status, s.scheduled_at, c.name,
    exists (
      select 1 from class_students cs
      where cs.class_id = s.class_id and cs.is_active and cs.student_id = auth.uid()
    )
  from assessments a
  join quizzes q on q.id = a.quiz_id
  join sessions s on s.id = a.session_id
  left join classes c on c.id = s.class_id
  where a.share_code = p_share_code
    and coalesce(p_share_code, '') <> '';
$$;

/**
 * Mulai (atau lanjutkan) attempt murid yang sedang login untuk satu penugasan.
 *
 * Attempt yang belum disubmit dipakai ulang, bukan dibuat baru. Ini yang
 * membedakannya dari mode tamu: dengan identitas yang pasti, reload halaman di
 * tengah pengerjaan tidak lagi berarti kehilangan sesi.
 */
create or replace function start_assessment_attempt(p_share_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  e record;
  v_learner uuid;
  v_attempt uuid;
  v_name text;
begin
  select * into e from assessment_entry(p_share_code);
  if not found then raise exception 'Kode tidak dikenali.' using errcode = 'P0002'; end if;
  if e.quiz_status <> 'published' then
    raise exception 'Asesmen ini belum dibuka.' using errcode = 'P0002';
  end if;
  if not e.eligible then
    raise exception 'Kamu tidak terdaftar di kelas sesi ini.' using errcode = 'P0002';
  end if;

  v_learner := learner_for_me();
  if v_learner is null then
    raise exception 'Kamu belum masuk.' using errcode = 'P0002';
  end if;

  select id into v_attempt from attempts
  where assessment_id = e.assessment_id and learner_id = v_learner and submitted_at is null
  order by started_at limit 1;
  if v_attempt is not null then return v_attempt; end if;

  select name into v_name from learners where id = v_learner;

  insert into attempts (quiz_id, assessment_id, learner_id, guest_name)
  values (e.quiz_id, e.assessment_id, v_learner, coalesce(v_name, 'Murid'))
  returning id into v_attempt;

  return v_attempt;
end $$;

-- Murid boleh membaca dan menulis attempt-nya sendiri. Jalur menulis utama
-- tetap lewat fungsi di atas; policy ini yang memungkinkan halaman menyimpan
-- jawaban dan menutup attempt tanpa satu fungsi per aksi.
drop policy if exists "Students manage own attempts" on attempts;
create policy "Students manage own attempts" on attempts
  for all
  using (learner_id in (select id from learners where profile_id = auth.uid()))
  with check (learner_id in (select id from learners where profile_id = auth.uid()));

drop policy if exists "Students manage own answers" on answers;
create policy "Students manage own answers" on answers
  for all
  using (
    exists (
      select 1 from attempts at
      join learners l on l.id = at.learner_id
      where at.id = answers.attempt_id and l.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from attempts at
      join learners l on l.id = at.learner_id
      where at.id = answers.attempt_id and l.profile_id = auth.uid()
    )
  );
