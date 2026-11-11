-- ============================================================
-- Terakhir berlatih, dipisah menurut jenisnya
--
-- `terakhir_berlatih_banyak()` (209) mengambil sesi terakhir dari SEMUA sesi.
-- Di tabel admin itu membingungkan: siswa yang hanya mengerjakan Misi tampil
-- "3 hari lalu" di menu Latihan Mandiri, padahal kolom lain di baris yang sama
-- kosong — kolom lain hanya menghitung soal di menu Belajar.
--
-- Fungsi ini memisahkan keduanya, dengan penggolongan yang sama dengan yang
-- dipakai skema sesi sejak migrasi 145/164/165:
--
--   sesi MISI    = `paket_topik_id` terisi (paket peta kompetensi), atau
--                  `probe_topik_id` terisi (pengecekan ulang), atau
--                  `probe_pemanasan` (pemanasan sapaan kunjungan).
--   sesi LATIHAN = sisanya (menu Belajar, berkunci grup kurikulum).
--
-- Gerbangnya sama dengan 209: admin, atau tutor yang mengajar muridnya.
-- ============================================================

create or replace function terakhir_per_jenis_banyak(p_learner_ids uuid[] default null)
returns table (
  learner_id uuid,
  profile_id uuid,
  terakhir_latihan timestamptz,
  terakhir_misi timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select l.id,
         l.profile_id,
         max(s.started_at) filter (
           where s.paket_topik_id is null
             and s.probe_topik_id is null
             and not s.probe_pemanasan
         ),
         max(s.started_at) filter (
           where s.paket_topik_id is not null
              or s.probe_topik_id is not null
              or s.probe_pemanasan
         )
  from learners l
  join practice_sessions s on s.learner_id = l.id
  where l.profile_id is not null
    and (is_admin() or tutor_teaches_learner(l.id))
    and (p_learner_ids is null or l.id = any(p_learner_ids))
  group by l.id, l.profile_id;
$$;

revoke all on function terakhir_per_jenis_banyak(uuid[]) from public;
grant execute on function terakhir_per_jenis_banyak(uuid[]) to authenticated;

notify pgrst, 'reload schema';
