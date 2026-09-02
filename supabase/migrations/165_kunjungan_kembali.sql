-- ============================================================
-- Kunjungan kembali: sapaan yang tahu sudah berapa lama, dan pemanasan yang
-- boleh ditolak
--
-- FR12 dan dokumen Alur Kunjungan Kembali. Kolom `learners.terakhir_aktif`
-- sudah berdiri sejak migrasi 139 dan sejak itu TIDAK PERNAH DITULIS maupun
-- dibaca satu baris kode pun — migrasi ini yang menghidupkannya.
--
-- BUKAN STREAK, dan itu keputusan yang sudah diambil dua kali di dua dokumen.
-- Kolom ini hanya tahu KAPAN TERAKHIR, bukan berapa hari berturut-turut.
-- Alur Kunjungan Kembali Bagian 3 menolak streak dengan alasan eksplisit:
-- streak yang terputus terasa seperti hukuman, dan anak yang merasa dihukum
-- karena absen tiga hari punya satu alasan lagi untuk tidak kembali di hari
-- keempat. Ketiadaan itu keputusan, bukan kekurangan — dan siapa pun yang kelak
-- tergoda menambahkannya perlu membaca dokumen itu dulu.
--
-- SATU PANGGILAN YANG MEMBACA SEKALIGUS MENULIS. `catat_kunjungan`
-- mengembalikan jarak hari dari kunjungan SEBELUMNYA, lalu menstempel yang
-- sekarang. Dipisah jadi dua panggilan, halaman yang memanggil pembacanya dua
-- kali dalam satu render akan mendapat "0 hari" pada panggilan kedua, dan
-- sapaannya lenyap tanpa sebab yang kelihatan.
--
-- PEMANASAN BUKAN RETEST, dan pemisahannya ditegakkan di skema. Dokumen Bagian
-- 4.2: hasil probe pemanasan TIDAK mengubah status topik dan tidak menggerakkan
-- perhitungan interval. Ia alat bantu mengingat, bukan pengukuran — dan sebuah
-- tawaran yang diam-diam menurunkan status topik saat ditolak-lalu-dikerjakan-
-- setengah-hati adalah tawaran yang berbohong. Kolom `probe_pemanasan` yang
-- membedakannya, dan trigger retest yang berhenti membacanya.
--
-- Jalankan SESUDAH 164.
-- ============================================================

-- 1. Pemanasan sebagai jenis probe tersendiri ---------------------------------

alter table practice_sessions
  add column if not exists probe_pemanasan boolean not null default false;

comment on column practice_sessions.probe_pemanasan is
  'Probe pemanasan sesudah jeda panjang (FR12, Alur Kunjungan Kembali Bagian 4.2). Memakai kolam yang sama dengan retest, tapi hasilnya TIDAK menggerakkan status topik maupun interval retest.';

-- 2. Kunjungan --------------------------------------------------------------

create or replace function catat_kunjungan(
  p_access_code text default '',
  p_learner_id uuid default null
)
returns int
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_learner uuid;
  v_hari int;
begin
  v_learner := practice_actor(coalesce(p_access_code, ''), p_learner_id);
  if v_learner is null then return null; end if;

  -- Null untuk kunjungan pertama seumur hidup, dan itu berbeda dari nol.
  -- Pemanggilnya menampilkan beranda tanpa sapaan untuk keduanya, tapi
  -- membedakannya di sini menjaga agar "belum pernah datang" tidak diam-diam
  -- terbaca sebagai "baru saja datang" oleh pembaca berikutnya.
  select case
           when l.terakhir_aktif is null then null
           else greatest(0, (current_date - l.terakhir_aktif::date))
         end
    into v_hari
  from learners l where l.id = v_learner;

  update learners set terakhir_aktif = now() where id = v_learner;

  return v_hari;
end;
$$;

comment on function catat_kunjungan(text, uuid) is
  'Menstempel kunjungan murid dan mengembalikan jarak hari dari kunjungan SEBELUMNYA (FR12). Null berarti belum pernah datang. Bukan streak — lihat Alur Kunjungan Kembali Bagian 3.';

-- 3. Probe pemanasan ----------------------------------------------------------
--
-- Topiknya adalah topik TERAKHIR yang dikerjakan sebelum jeda, bukan topik yang
-- paling lemah maupun yang paling mendesak: dokumen Bagian 4.2 menyebutnya
-- "dari yang kemarin dipelajari", dan yang membuat pemanasan terasa ringan
-- adalah karena isinya sudah dikenal.
--
-- Tidak ada syarat jatuh tempo di sini — pemanasan memang tidak punya jadwal.
-- Yang menentukan ia ditawarkan atau tidak adalah lamanya jeda, dan itu
-- diputuskan pemanggilnya.
create or replace function pemanasan_buka_sesi(
  p_access_code text default '',
  p_learner_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_learner uuid;
  v_topik text;
  v_subject uuid;
  v_items uuid[];
  v_session uuid;
begin
  v_learner := practice_actor(coalesce(p_access_code, ''), p_learner_id);
  if v_learner is null then return null; end if;

  select p.topik_id into v_topik
  from practice_sessions s
  join paket_topik p on p.id = s.paket_topik_id
  where s.learner_id = v_learner and s.finished_at is not null
  order by s.finished_at desc
  limit 1;

  if v_topik is null then return null; end if;

  -- Satu pemanasan yang belum selesai dilanjutkan, bukan ditumpuk.
  select s.id into v_session
  from practice_sessions s
  where s.learner_id = v_learner
    and s.probe_pemanasan
    and s.finished_at is null
  order by s.started_at desc limit 1;
  if v_session is not null then return v_session; end if;

  select id into v_subject from subjects where name = 'Matematika' limit 1;

  with kolam as (
    select ip.question_bank_item_id as item_id,
           (
             select max(s.started_at)
             from practice_answers a
             join practice_sessions s on s.id = a.session_id
             where a.learner_id = v_learner
               and s.probe_topik_id = v_topik
               and a.question_bank_item_id = ip.question_bank_item_id
           ) as terakhir_dilihat
    from item_probe ip
    join question_bank_items b on b.id = ip.question_bank_item_id
    where ip.topik_id = v_topik
      and b.status_verifikasi = 'aktif'
  )
  select array_agg(pilih.item_id order by pilih.terakhir_dilihat nulls first, random())
    into v_items
  from (
    select * from kolam order by terakhir_dilihat nulls first, random() limit 5
  ) pilih;

  if v_items is null or cardinality(v_items) < 3 then return null; end if;

  insert into practice_sessions
    (learner_id, subject_id, group_ids, question_count, item_ids,
     probe_topik_id, probe_pemanasan)
  values
    (v_learner, v_subject, '{}'::uuid[], cardinality(v_items), v_items,
     v_topik, true)
  returning id into v_session;

  return v_session;
end;
$$;

comment on function pemanasan_buka_sesi(text, uuid) is
  'Membuka satu probe pemanasan pada topik terakhir yang dikerjakan (FR12, Alur Kunjungan Kembali Bagian 4.2). Opsional dan tanpa konsekuensi — hasilnya tidak menggerakkan status topik.';

-- 4. Retest berhenti membaca pemanasan ----------------------------------------
--
-- Menggantikan versi migrasi 164. Satu baris yang bertambah, dan tanpanya
-- seluruh janji "pemanasan tidak mengubah apa pun" jadi tidak benar: probe
-- pemanasan yang dikerjakan setengah hati akan menurunkan topik yang sudah
-- tuntas ke `butuh_pengulangan` dan mereset interval retestnya.
create or replace function retest_sesudah_sesi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_skor numeric;
  v_maks numeric;
  v_ambang numeric;
begin
  if new.probe_topik_id is null then return new; end if;
  if new.probe_pemanasan then return new; end if;
  if new.finished_at is null or old.finished_at is not null then return new; end if;

  select coalesce(sum(a.score), 0), coalesce(sum(a.max_score), 0)
    into v_skor, v_maks
  from practice_answers a where a.session_id = new.id;

  if coalesce(v_maks, 0) <= 0 then return new; end if;

  select coalesce((nilai #>> '{}')::numeric, 0.75) into v_ambang
  from pengaturan where kunci = 'ambang_mastery';

  perform catat_hasil_retest(
    new.learner_id, new.probe_topik_id,
    (v_skor / v_maks) >= coalesce(v_ambang, 0.75)
  );
  return new;
end;
$$;

-- 5. Hak ----------------------------------------------------------------------

grant execute on function catat_kunjungan(text, uuid) to anon, authenticated;
grant execute on function pemanasan_buka_sesi(text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
