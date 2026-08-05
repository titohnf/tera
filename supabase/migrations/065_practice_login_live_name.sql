-- ============================================================
-- `learners.name` disalin dari profil saat kode diterbitkan, jadi memperbaiki
-- nama murid di Tera tidak pernah sampai ke halaman latihan. Ambil namanya dari
-- `profiles` saat murid itu murid Tera, dan pakai kolom `name` hanya sebagai
-- cadangan untuk murid luar yang memang tidak punya profil.
--
-- Kolom `learners.name` tetap ada: ia satu-satunya nama yang dimiliki murid luar.
-- ============================================================

drop function if exists practice_login(text);

create or replace function practice_login(p_access_code text)
returns table (learner_id uuid, learner_name text, is_tera_student boolean)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select l.id, coalesce(p.full_name, l.name), l.profile_id is not null
  from learners l
  left join profiles p on p.id = l.profile_id
  where l.access_code = p_access_code
    and coalesce(p_access_code, '') <> '';
$$;

-- Daftar nama di halaman kuis publik ikut memakai nama hidup, dengan alasan
-- yang sama.
drop function if exists quiz_roster(text);

create or replace function quiz_roster(p_share_code text)
returns table (learner_id uuid, learner_name text)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select l.id, coalesce(p.full_name, l.name)
  from quizzes q
  join class_students cs on cs.class_id = q.class_id and cs.is_active
  join learners l on l.profile_id = cs.student_id
  left join profiles p on p.id = l.profile_id
  where q.share_code = p_share_code
    and q.status = 'published'
    and coalesce(p_share_code, '') <> ''
  order by coalesce(p.full_name, l.name);
$$;
