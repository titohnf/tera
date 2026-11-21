-- ============================================================
-- Keamanan tahap 2 (1/2): semua tulis dan baca peserta lewat fungsi
--
-- Latar (docs/rancangan-keamanan-percobaan.md): kebijakan publik pada
-- `attempts` dan `answers` memperbolehkan siapa pun mengubah BARIS MANA PUN
-- (termasuk `auto_score` dan `total_score`), dan membaca jawaban serta nama
-- semua peserta (`using (true)`). Peserta tidak boleh menyentuh tabel itu
-- langsung. Migrasi ini menambah fungsi security definer untuk setiap hal yang
-- peserta lakukan; migrasi 232 (SESUDAH Sora baru terdeploy) mencabut
-- kebijakan publiknya.
--
-- ADITIF: hanya fungsi baru, aman dijalankan kapan saja.
--
--   mulai_percobaan_tamu   mulai percobaan paket biasa (bukan TKA) sebagai tamu/roster
--   simpan_jawaban         simpan SATU jawaban (hanya kolom `response`), menolak
--                          percobaan terkirim, soal paket lain, dan lewat batas waktu
--   catat_posisi           denyut posisi soal (Live Monitoring)
--   catat_kejadian         catatan keluar halaman/salin/dll
--   percobaan_berjalan     apakah percobaan di perangkat masih layak dilanjutkan
--   hasil_percobaan        data halaman "terima kasih": milik sendiri + angka
--                          peringkat tanpa nama
-- ============================================================

-- 1. Mulai percobaan paket biasa --------------------------------------------
create or replace function mulai_percobaan_tamu(p_share_code text, p_nama text, p_learner uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_quiz record;
  v_buka timestamptz;
  v_tutup timestamptz;
  v_max int;
  v_nama text := nullif(btrim(coalesce(p_nama, '')), '');
  v_ada_roster boolean;
  v_attempt record;
begin
  select id, status, settings, session_id into v_quiz from quizzes where share_code = p_share_code;
  if not found or v_quiz.status <> 'published' then
    raise exception 'paket_tidak_tersedia' using errcode = 'P0002';
  end if;
  if coalesce((v_quiz.settings ->> 'cbt_mode')::boolean, false) then
    raise exception 'gunakan_kode_atau_akun' using errcode = 'P0001';
  end if;

  v_buka := nullif(v_quiz.settings ->> 'opens_at', '')::timestamptz;
  v_tutup := nullif(v_quiz.settings ->> 'closes_at', '')::timestamptz;
  if v_buka is not null and now() < v_buka then raise exception 'belum_dibuka' using errcode = 'P0001'; end if;
  if v_tutup is not null and now() > v_tutup then raise exception 'sudah_ditutup' using errcode = 'P0001'; end if;

  -- Paket bersesi tidak menerima tamu (aturan migrasi 071).
  v_ada_roster := exists (select 1 from quiz_roster(p_share_code));
  if v_ada_roster then
    if p_learner is null or not exists (select 1 from quiz_roster(p_share_code) r where r.learner_id = p_learner) then
      raise exception 'pilih_nama_roster' using errcode = 'P0001';
    end if;
    select name into v_nama from learners where id = p_learner;
  else
    p_learner := null;
    if v_quiz.session_id is not null then raise exception 'paket_bersesi' using errcode = 'P0001'; end if;
    if v_nama is null then raise exception 'nama_wajib' using errcode = 'P0001'; end if;
  end if;

  v_max := nullif(v_quiz.settings ->> 'max_attempts', '')::int;
  if v_max is not null and (
       select count(*) from attempts a
       where a.quiz_id = v_quiz.id
         and (case when p_learner is not null then a.learner_id = p_learner else a.guest_name = v_nama end)
     ) >= v_max then
    raise exception 'batas_percobaan' using errcode = 'P0001';
  end if;

  insert into attempts (quiz_id, guest_name, learner_id)
  values (v_quiz.id, v_nama, p_learner)
  returning id, started_at into v_attempt;

  return jsonb_build_object('attempt_id', v_attempt.id, 'started_at', v_attempt.started_at, 'server_now', now());
end $$;

-- 2. Simpan satu jawaban -----------------------------------------------------
create or replace function simpan_jawaban(p_attempt uuid, p_question uuid, p_response jsonb, p_index int)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_a record;
  v_menit int;
begin
  select a.id, a.quiz_id, a.started_at, a.submitted_at, z.settings, z.status
    into v_a
  from attempts a
  join quizzes z on z.id = a.quiz_id
  where a.id = p_attempt;
  if not found then
    raise exception 'percobaan_tidak_ditemukan' using errcode = 'P0002';
  end if;
  if v_a.submitted_at is not null then
    return jsonb_build_object('terkunci', true);
  end if;

  -- Batas waktu hanya untuk paket bertampilan TKA (sama seperti penjaga di aplikasi).
  v_menit := case when coalesce((v_a.settings ->> 'cbt_mode')::boolean, false)
                  then nullif(v_a.settings ->> 'time_limit_minutes', '')::int end;
  if v_menit is not null and now() > v_a.started_at + make_interval(secs => v_menit * 60 + 60) then
    return jsonb_build_object('expired', true);
  end if;

  if not exists (select 1 from questions where id = p_question and quiz_id = v_a.quiz_id) then
    raise exception 'soal_bukan_milik_paket' using errcode = 'P0001';
  end if;

  insert into answers (attempt_id, question_id, quiz_id, response)
  values (p_attempt, p_question, v_a.quiz_id, p_response)
  on conflict (attempt_id, question_id) do update set response = excluded.response;

  update attempts
     set current_question_index = greatest(coalesce(p_index, 0), 0), last_active_at = now()
   where id = p_attempt;

  return '{}'::jsonb;
end $$;

-- 3. Denyut posisi ------------------------------------------------------------
create or replace function catat_posisi(p_attempt uuid, p_nomor int)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update attempts
     set current_question_index = greatest(coalesce(p_nomor, 0), 0), last_active_at = now()
   where id = p_attempt and submitted_at is null;
$$;

-- 4. Catatan kejadian ---------------------------------------------------------
create or replace function catat_kejadian(p_attempt uuid, p_kind text, p_durasi_ms int)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_quiz uuid;
begin
  select a.quiz_id into v_quiz
  from attempts a join quizzes z on z.id = a.quiz_id
  where a.id = p_attempt and a.submitted_at is null and z.status = 'published';
  if v_quiz is null then return; end if;
  insert into attempt_events (attempt_id, quiz_id, kind, durasi_ms)
  values (p_attempt, v_quiz, p_kind, case when p_durasi_ms is null then null else least(greatest(p_durasi_ms, 0), 86400000) end);
exception when check_violation then
  return;  -- jenis kejadian tidak dikenal: diabaikan, tidak boleh mengganggu peserta
end $$;

-- 5. Masih layak dilanjutkan? ---------------------------------------------------
create or replace function percobaan_berjalan(p_share_code text, p_attempt uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from attempts a
    join quizzes z on z.id = a.quiz_id
    where a.id = p_attempt
      and a.submitted_at is null
      and z.share_code = p_share_code
      and z.status = 'published'
      and (
        not coalesce((z.settings ->> 'cbt_mode')::boolean, false)
        or nullif(z.settings ->> 'time_limit_minutes', '') is null
        or now() <= a.started_at + make_interval(secs => (z.settings ->> 'time_limit_minutes')::int * 60 + 60)
      )
  );
$$;

-- 6. Data halaman "terima kasih" -----------------------------------------------
-- Percobaan SENDIRI utuh, pengaturan paket, dan (hanya untuk paket non-TKA)
-- daftar waktu dan skor percobaan lain TANPA nama, untuk menghitung peringkat.
create or replace function hasil_percobaan(p_attempt uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_a attempts%rowtype;
  v_settings jsonb;
begin
  select * into v_a from attempts where id = p_attempt;
  if not found then return null; end if;
  select settings into v_settings from quizzes where id = v_a.quiz_id;

  return jsonb_build_object(
    'attempt', to_jsonb(v_a),
    'settings', coalesce(v_settings, '{}'::jsonb),
    'lainnya', case
      when coalesce((v_settings ->> 'cbt_mode')::boolean, false) then '[]'::jsonb
      else coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', x.id, 'started_at', x.started_at, 'submitted_at', x.submitted_at, 'total_score', x.total_score))
        from attempts x
        where x.quiz_id = v_a.quiz_id and x.submitted_at is not null and x.total_score is not null
      ), '[]'::jsonb)
    end
  );
end $$;

grant execute on function mulai_percobaan_tamu(text, text, uuid) to anon, authenticated;
grant execute on function simpan_jawaban(uuid, uuid, jsonb, int) to anon, authenticated;
grant execute on function catat_posisi(uuid, int) to anon, authenticated;
grant execute on function catat_kejadian(uuid, text, int) to anon, authenticated;
grant execute on function percobaan_berjalan(text, uuid) to anon, authenticated;
grant execute on function hasil_percobaan(uuid) to anon, authenticated;
