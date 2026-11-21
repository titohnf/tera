-- ============================================================
-- Masuk try out dengan kode peserta (murid luar) atau akun Tera (siswa bimbel)
--
-- Sebelumnya peserta mengetik nama bebas, sehingga hasilnya harus dicocokkan
-- manual ke siswa. Sekarang identitas pasti sejak awal:
--
--   * Siswa Tera masuk dengan email + password akunnya. Percobaan memakai
--     `learner_for_me()` (baris `learners` yang terpaut `profile_id`), jadi
--     hasilnya otomatis muncul di akun keluarga dan halaman admin.
--   * Murid luar masuk dengan `learners.access_code` (kode ringan yang sudah
--     ada sejak migrasi 061, dibagikan admin). Barisnya `profile_id` null.
--     Saat ia berlangganan, admin cukup mengisi `profile_id`; seluruh riwayat
--     try out ikut karena percobaan menunjuk ke `learners.id`.
--
-- `learners` hanya terbaca admin (RLS), jadi sekolah dan WA orang tua aman di
-- sana. Ketiga fungsi di bawah security definer dan hanya membuka nama.
--
-- ADITIF: kolom baru nullable dan fungsi baru. Aman dijalankan kapan saja.
-- ============================================================

alter table learners
  add column if not exists sekolah text,
  add column if not exists jenjang text,
  add column if not exists nama_wali text,
  add column if not exists wa text;

comment on column learners.wa is
  'Nomor WhatsApp orang tua/wali murid luar. Jalan pemulihan bila kode hilang; bukan kredensial.';

-- Kode dinormalkan: huruf besar, tanpa spasi atau tanda hubung, supaya
-- "q6g-484" yang diketik anak tetap cocok dengan "Q6G484".
create or replace function kode_peserta_bersih(p_kode text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(p_kode, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- 1. Cek kode: hanya mengembalikan nama (untuk layar konfirmasi) ---------------
create or replace function masuk_peserta(p_kode text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select l.name
  from learners l
  where kode_peserta_bersih(p_kode) <> ''
    and upper(l.access_code) = kode_peserta_bersih(p_kode)
  limit 1;
$$;

-- 2. Mulai percobaan dengan kode ---------------------------------------------
-- Percobaan yang belum dikirim dipakai ulang (waktu tetap dihitung dari awal);
-- yang sudah dikirim menolak percobaan baru pada paket yang sama.
create or replace function mulai_percobaan_peserta(p_share_code text, p_kode text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_quiz record;
  v_learner record;
  v_attempt record;
  v_buka timestamptz;
  v_tutup timestamptz;
begin
  select id, status, settings into v_quiz from quizzes where share_code = p_share_code;
  if not found or v_quiz.status <> 'published' then
    raise exception 'paket_tidak_tersedia' using errcode = 'P0002';
  end if;

  v_buka := nullif(v_quiz.settings ->> 'opens_at', '')::timestamptz;
  v_tutup := nullif(v_quiz.settings ->> 'closes_at', '')::timestamptz;
  if v_buka is not null and now() < v_buka then
    raise exception 'belum_dibuka' using errcode = 'P0001';
  end if;
  if v_tutup is not null and now() > v_tutup then
    raise exception 'sudah_ditutup' using errcode = 'P0001';
  end if;

  select id, name into v_learner
  from learners
  where kode_peserta_bersih(p_kode) <> '' and upper(access_code) = kode_peserta_bersih(p_kode)
  limit 1;
  if not found then
    raise exception 'kode_tidak_dikenal' using errcode = 'P0002';
  end if;

  if exists (select 1 from attempts where quiz_id = v_quiz.id and learner_id = v_learner.id and submitted_at is not null) then
    raise exception 'sudah_mengerjakan' using errcode = 'P0001';
  end if;

  select id, started_at into v_attempt
  from attempts
  where quiz_id = v_quiz.id and learner_id = v_learner.id and submitted_at is null
  order by started_at limit 1;

  if not found then
    insert into attempts (quiz_id, learner_id, guest_name)
    values (v_quiz.id, v_learner.id, v_learner.name)
    returning id, started_at into v_attempt;
  end if;

  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'started_at', v_attempt.started_at,
    'server_now', now(),
    'nama', v_learner.name
  );
end $$;

-- 3. Mulai percobaan dengan akun Tera ----------------------------------------
create or replace function mulai_percobaan_akun(p_share_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_quiz record;
  v_learner uuid;
  v_nama text;
  v_attempt record;
  v_buka timestamptz;
  v_tutup timestamptz;
begin
  if auth.uid() is null then
    raise exception 'belum_masuk' using errcode = 'P0002';
  end if;

  -- Hanya siswa: `learner_for_me()` membuat baris `learners` untuk profil mana
  -- pun, dan admin atau tutor yang kebetulan login tidak boleh ikut tercatat.
  if coalesce((select role::text from profiles where id = auth.uid()), '') not in ('student', 'mandiri') then
    raise exception 'bukan_siswa' using errcode = 'P0001';
  end if;

  select id, status, settings into v_quiz from quizzes where share_code = p_share_code;
  if not found or v_quiz.status <> 'published' then
    raise exception 'paket_tidak_tersedia' using errcode = 'P0002';
  end if;

  v_buka := nullif(v_quiz.settings ->> 'opens_at', '')::timestamptz;
  v_tutup := nullif(v_quiz.settings ->> 'closes_at', '')::timestamptz;
  if v_buka is not null and now() < v_buka then
    raise exception 'belum_dibuka' using errcode = 'P0001';
  end if;
  if v_tutup is not null and now() > v_tutup then
    raise exception 'sudah_ditutup' using errcode = 'P0001';
  end if;

  v_learner := learner_for_me();
  if v_learner is null then
    raise exception 'belum_masuk' using errcode = 'P0002';
  end if;
  select name into v_nama from learners where id = v_learner;

  if exists (select 1 from attempts where quiz_id = v_quiz.id and learner_id = v_learner and submitted_at is not null) then
    raise exception 'sudah_mengerjakan' using errcode = 'P0001';
  end if;

  select id, started_at into v_attempt
  from attempts
  where quiz_id = v_quiz.id and learner_id = v_learner and submitted_at is null
  order by started_at limit 1;

  if not found then
    insert into attempts (quiz_id, learner_id, guest_name)
    values (v_quiz.id, v_learner, coalesce(v_nama, 'Murid'))
    returning id, started_at into v_attempt;
  end if;

  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'started_at', v_attempt.started_at,
    'server_now', now(),
    'nama', coalesce(v_nama, 'Murid')
  );
end $$;

grant execute on function masuk_peserta(text) to anon, authenticated;
grant execute on function mulai_percobaan_peserta(text, text) to anon, authenticated;
grant execute on function mulai_percobaan_akun(text) to authenticated;
