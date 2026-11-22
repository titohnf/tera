-- ============================================================
-- Akun penguji: boleh memulai try out kapan saja
--
-- Try out dikerjakan bersama pada jam yang dijadwalkan (`quizzes.settings.opens_at` /
-- `closes_at`), dan database menolak percobaan yang dimulai sebelum jamnya. Akun uji milik
-- pemilik (untuk mencoba-coba) tidak boleh ikut menunggu. Barisnya `learners` ditandai
-- `penguji = true`; fungsi mulai percobaan melewati pemeriksaan jadwal untuk baris itu.
-- Tidak ada yang lain berubah: soal, kunci, dan satu-percobaan-per-paket tetap berlaku.
--
-- Perubahannya tiga hal:
--   1. kolom `learners.penguji` (default false, jadi tidak ada baris yang berubah);
--   2. `mulai_percobaan_peserta` dan `mulai_percobaan_akun` (salinan dari migrasi 227 dengan
--      satu syarat tambahan di pemeriksaan jadwal);
--   3. dua fungsi baca, `peserta_penguji(kode)` dan `akun_penguji()`, yang dipakai halaman
--      Tera dan Sora untuk tidak menampilkan hitung mundur bagi penguji.
--
-- ADITIF dan aman dijalankan kapan saja. Setelah dijalankan, tandai akunnya:
--   update learners set penguji = true where profile_id = '<id profil Tito Hanafi>';
-- ============================================================

alter table learners add column if not exists penguji boolean not null default false;

-- 1. Mulai percobaan dengan kode ------------------------------------------------
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

  select id, name, penguji into v_learner
  from learners
  where kode_peserta_bersih(p_kode) <> '' and upper(access_code) = kode_peserta_bersih(p_kode)
  limit 1;
  if not found then
    raise exception 'kode_tidak_dikenal' using errcode = 'P0002';
  end if;

  v_buka := nullif(v_quiz.settings ->> 'opens_at', '')::timestamptz;
  v_tutup := nullif(v_quiz.settings ->> 'closes_at', '')::timestamptz;
  if not v_learner.penguji then
    if v_buka is not null and now() < v_buka then
      raise exception 'belum_dibuka' using errcode = 'P0001';
    end if;
    if v_tutup is not null and now() > v_tutup then
      raise exception 'sudah_ditutup' using errcode = 'P0001';
    end if;
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

-- 2. Mulai percobaan dengan akun Tera -------------------------------------------
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
  v_penguji boolean;
  v_attempt record;
  v_buka timestamptz;
  v_tutup timestamptz;
begin
  if auth.uid() is null then
    raise exception 'belum_masuk' using errcode = 'P0002';
  end if;

  if coalesce((select role::text from profiles where id = auth.uid()), '') not in ('student', 'mandiri') then
    raise exception 'bukan_siswa' using errcode = 'P0001';
  end if;

  select id, status, settings into v_quiz from quizzes where share_code = p_share_code;
  if not found or v_quiz.status <> 'published' then
    raise exception 'paket_tidak_tersedia' using errcode = 'P0002';
  end if;

  v_learner := learner_for_me();
  if v_learner is null then
    raise exception 'belum_masuk' using errcode = 'P0002';
  end if;
  select name, penguji into v_nama, v_penguji from learners where id = v_learner;

  v_buka := nullif(v_quiz.settings ->> 'opens_at', '')::timestamptz;
  v_tutup := nullif(v_quiz.settings ->> 'closes_at', '')::timestamptz;
  if not coalesce(v_penguji, false) then
    if v_buka is not null and now() < v_buka then
      raise exception 'belum_dibuka' using errcode = 'P0001';
    end if;
    if v_tutup is not null and now() > v_tutup then
      raise exception 'sudah_ditutup' using errcode = 'P0001';
    end if;
  end if;

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

-- 3. Fungsi baca: apakah pemegang kode / akun ini penguji? -----------------------
create or replace function peserta_penguji(p_kode text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(bool_or(l.penguji), false)
  from learners l
  where kode_peserta_bersih(p_kode) <> '' and upper(l.access_code) = kode_peserta_bersih(p_kode);
$$;

create or replace function akun_penguji()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select penguji from learners where profile_id = auth.uid()), false);
$$;

grant execute on function mulai_percobaan_peserta(text, text) to anon, authenticated;
grant execute on function mulai_percobaan_akun(text) to authenticated;
grant execute on function peserta_penguji(text) to anon, authenticated;
grant execute on function akun_penguji() to authenticated;
