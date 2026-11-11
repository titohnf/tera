-- ============================================================
-- Terakhir berlatih = JAWABAN terakhir, bukan sesi yang dibuka
--
-- `terakhir_per_jenis_banyak()` (210) mengambil `started_at` sesi terakhir.
-- Menekan "Mulai" lalu keluar meninggalkan sesi KOSONG (lihat catatan di
-- `lib/belajar/sesi.ts`), jadi siswa yang cuma membuka sesi tampil "baru
-- berlatih" padahal belum menjawab satu soal pun — dan kolom Dikerjakan di
-- baris yang sama kosong. Data nyata: dua siswa bimbel punya sesi tanpa satu
-- jawaban pun, satu di antaranya "13 hari lalu" di tabel admin.
--
-- Fungsi yang sama (tanda tangan tidak berubah, jadi `create or replace`
-- cukup), kini menghitung `practice_answers.answered_at`. Penggolongan MISI vs
-- LATIHAN tetap seperti di 210.
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
         max(a.answered_at) filter (
           where s.paket_topik_id is null
             and s.probe_topik_id is null
             and not s.probe_pemanasan
         ),
         max(a.answered_at) filter (
           where s.paket_topik_id is not null
              or s.probe_topik_id is not null
              or s.probe_pemanasan
         )
  from learners l
  join practice_sessions s on s.learner_id = l.id
  join practice_answers a on a.session_id = s.id
  where l.profile_id is not null
    and (is_admin() or tutor_teaches_learner(l.id))
    and (p_learner_ids is null or l.id = any(p_learner_ids))
  group by l.id, l.profile_id;
$$;

notify pgrst, 'reload schema';
