-- ============================================================
-- Ringkasan latihan untuk BANYAK siswa dalam satu panggilan, dan gerbang tutor
--
-- Dua kebutuhan yang dijawab satu migrasi karena memakai gerbang yang sama.
--
-- 1. KECEPATAN tabel admin (Latihan Mandiri, Ketuntasan Materi). Tabelnya dulu
--    memanggil `practice_topic_progress()` dan `topik_kemajuan()` sekali per
--    siswa lewat HTTP — dua perjalanan jaringan per siswa. Fungsi di bawah
--    menjalankan KEDUA fungsi itu apa adanya, siswa demi siswa, di dalam satu
--    pernyataan SQL. Aturannya tidak disalin: angkanya tetap lahir dari satu
--    tempat (migrasi 128/129/134/203 dan 183/189), hanya perjalanannya yang
--    dipangkas.
--
-- 2. KONSISTENSI matriks tutor (`/tutor/rekap-penguasaan`). Matriks itu dulu
--    menjumlahkan seluruh `practice_answers` sendiri, jadi menampilkan angka
--    yang berbeda dari yang dilihat admin dan orang tua untuk anak yang sama.
--    Agar ia memakai `practice_topic_progress()` juga, tutor harus lolos
--    `practice_actor()` untuk murid kelasnya.
--
-- ⚠️ YANG IKUT TERBUKA, dan perlu disadari (sama seperti catatan migrasi 208
--    untuk admin): `practice_actor()` juga menjaga fungsi yang MENULIS (membuka
--    sesi, mencatat jawaban). Tutor yang memanggilnya langsung lewat API bisa
--    bertindak atas nama murid yang ia ajar. Jangkauannya dibatasi
--    `tutor_teaches_learner()` — hanya murid aktif di kelas miliknya — dan
--    layar tutor tidak menyediakan tombolnya; yang baru hanya jalurnya. Tutor
--    sudah bisa MEMBACA seluruh tabel latihan murid itu lewat policy 063.
--
--    Cabang tutor sengaja terakhir: pemanggil lain tetap lolos di cabang yang
--    lama dan perilakunya tidak berubah.
-- ============================================================

create or replace function practice_actor(p_access_code text, p_learner_id uuid default null)
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (
      select l.id from learners l
      where l.access_code = p_access_code
        and coalesce(p_access_code, '') <> ''
    ),
    (
      select l.id from learners l
      where l.id = p_learner_id
        and l.profile_id is not null
        and family_covers_student(l.profile_id)
    ),
    (
      select l.id from learners l
      where l.id = p_learner_id
        and l.profile_id = auth.uid()
        and has_product('sora')
    ),
    (
      select l.id from learners l
      where l.id = p_learner_id
        and l.profile_id is not null
        and is_admin()
    ),
    (
      select l.id from learners l
      where l.id = p_learner_id
        and l.profile_id is not null
        and tutor_teaches_learner(l.id)
    )
  );
$$;

-- Penguasaan per topik kurikulum (Latihan Mandiri), satu baris per pelajar.
-- `baris` berisi baris `practice_topic_progress()` apa adanya sebagai json.
-- Hanya pelajar yang pernah membuka sesi; yang lain tidak perlu dihitung.
create or replace function kemajuan_latihan_banyak(p_learner_ids uuid[] default null)
returns table (learner_id uuid, profile_id uuid, baris jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.profile_id, jsonb_agg(to_jsonb(t))
  from learners l
  cross join lateral practice_topic_progress('', l.id, null::uuid) t
  where l.profile_id is not null
    and (is_admin() or tutor_teaches_learner(l.id))
    and (p_learner_ids is null or l.id = any(p_learner_ids))
    and exists (select 1 from practice_sessions s where s.learner_id = l.id)
  group by l.id, l.profile_id;
$$;

-- Ketuntasan peta kompetensi (Misi), bentuk yang sama.
create or replace function kemajuan_peta_banyak(p_learner_ids uuid[] default null)
returns table (learner_id uuid, profile_id uuid, baris jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.profile_id, jsonb_agg(to_jsonb(t))
  from learners l
  cross join lateral topik_kemajuan('', l.id) t
  where l.profile_id is not null
    and (is_admin() or tutor_teaches_learner(l.id))
    and (p_learner_ids is null or l.id = any(p_learner_ids))
    and exists (select 1 from practice_sessions s where s.learner_id = l.id)
  group by l.id, l.profile_id;
$$;

-- Kapan pelajar terakhir membuka sesi latihan atau Misi (keduanya sesi).
create or replace function terakhir_berlatih_banyak(p_learner_ids uuid[] default null)
returns table (learner_id uuid, profile_id uuid, terakhir timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.profile_id, max(s.started_at)
  from learners l
  join practice_sessions s on s.learner_id = l.id
  where l.profile_id is not null
    and (is_admin() or tutor_teaches_learner(l.id))
    and (p_learner_ids is null or l.id = any(p_learner_ids))
  group by l.id, l.profile_id;
$$;

revoke all on function kemajuan_latihan_banyak(uuid[]) from public;
revoke all on function kemajuan_peta_banyak(uuid[]) from public;
revoke all on function terakhir_berlatih_banyak(uuid[]) from public;
grant execute on function kemajuan_latihan_banyak(uuid[]) to authenticated;
grant execute on function kemajuan_peta_banyak(uuid[]) to authenticated;
grant execute on function terakhir_berlatih_banyak(uuid[]) to authenticated;

notify pgrst, 'reload schema';
