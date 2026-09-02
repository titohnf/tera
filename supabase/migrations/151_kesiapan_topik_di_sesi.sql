-- ============================================================
-- Jembatan yang dipakai: topik jadwal hari ini, dan kesiapan peta muridnya
--
-- Aplikasi punya dua kurikulum yang pekerjaannya berbeda dan keduanya benar:
-- `curriculum_topic_groups` adalah JADWAL (tutor hari ini mengajar apa), `topik`
-- adalah PETA KOMPETENSI (apa yang harus dikuasai murid, berurut menurut
-- prasyarat). Migrasi 140 sudah membuat jembatannya, `topik_grup`, dan migrasi
-- 143 sengaja mengisinya tangan alih-alih menebak dari kemiripan nama.
--
-- Sampai sekarang tidak ada satu pun layar yang menyeberanginya. Jembatan yang
-- tidak pernah dilewati akan berhenti diisi, lalu salah tanpa ada yang tahu.
--
-- SOAL TIDAK PERNAH MENGALIR LEWAT SINI. Fungsi ini hanya membaca: tutor yang
-- hari ini terjadwal mengajar "Bilangan Bulat" melihat topik peta apa yang
-- diukur oleh bab itu, dan sejauh mana murid di kelasnya sudah menempuhnya.
-- Penyajian butir tetap berpangkal pada tag masing-masing jalur, dan sejak
-- migrasi 148 sebuah butir hanya boleh berada di salah satunya.
--
-- YANG SENGAJA TIDAK DIKEMBALIKAN: Skor Putaran 1. Gerbang di sini adalah
-- "tutor sesi ini", dan itu bukan gerbang yang sama dengan penanggung jawab
-- pengukuran (150). Mengajar sebuah pertemuan tidak menjadikan seseorang pihak
-- yang berhak atas angka diagnostik anak itu — yang pantas dilihat tutor kelas
-- adalah sejauh mana muridnya sudah berjalan, bukan seberapa goyah langkah
-- pertamanya. Kalau kelak dibutuhkan, yang ditambah gerbangnya, bukan diam-diam
-- kolomnya.
-- ============================================================

create or replace function topik_kesiapan_sesi(
  p_session_id uuid,
  p_profile_ids uuid[]
)
returns table (
  profile_id uuid,
  nama text,
  topik_id text,
  topik_nama text,
  paket_latihan_selesai integer,
  paket_latihan_total integer,
  level_tertinggi smallint,
  skor_ujian numeric
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  with sesi as (
    select s.class_id, ct.group_id
    from sessions s
    left join curriculum_topics ct on ct.id = s.curriculum_topic_id
    where s.id = p_session_id
      -- Gerbangnya di sini, bukan di WHERE terluar: kalau ia gagal, seluruh CTE
      -- di bawahnya kehilangan pangkal dan tidak ada satu baris pun yang bisa
      -- lolos lewat jalan lain.
      and (is_admin() or is_session_tutor(p_session_id))
  ),
  peta as (
    select t.id, t.nama
    from topik_grup tg
    join topik t on t.id = tg.topik_id
    where tg.group_id = (select group_id from sesi)
  ),
  -- Id profil datang dari browser, jadi disaring ulang ke murid kelas ini.
  -- Tanpa itu, tutor yang sah atas sebuah sesi bisa menanyakan kesiapan anak
  -- mana pun di bimbel hanya dengan menukar isi array-nya.
  murid as (
    select l.id as learner_id, l.profile_id, coalesce(pr.full_name, l.name) as nama
    from learners l
    left join profiles pr on pr.id = l.profile_id
    where l.profile_id = any(p_profile_ids)
      and exists (
        select 1 from class_students cs
        where cs.student_id = l.profile_id
          and cs.class_id = (select class_id from sesi)
      )
  )
  select
    murid.profile_id,
    murid.nama,
    peta.id,
    peta.nama,
    (select count(distinct p.id)
       from paket_topik p
       join practice_sessions ps on ps.paket_topik_id = p.id
      where p.topik_id = peta.id
        and p.jenis = 'latihan'
        and ps.learner_id = murid.learner_id
        and ps.finished_at is not null)::integer,
    (select count(*) from paket_topik p
      where p.topik_id = peta.id and p.jenis = 'latihan')::integer,
    -- Level tertinggi yang paketnya pernah DISELESAIKAN. Bukan "dikuasai":
    -- kriteria tuntas milik FR13 dan berpangkal pada Skor Putaran 1, yang
    -- sengaja tidak sampai ke layar ini. Kalimat yang jujur untuk angka ini
    -- adalah "sudah sampai C2", bukan "sudah bisa C2".
    (select max(p.level_bloom)
       from paket_topik p
       join practice_sessions ps on ps.paket_topik_id = p.id
      where p.topik_id = peta.id
        and p.jenis = 'latihan'
        and ps.learner_id = murid.learner_id
        and ps.finished_at is not null),
    (select s.skor_akhir
       from paket_topik p
       cross join lateral skor_paket_topik(murid.learner_id, p.id) s
      where p.topik_id = peta.id and p.jenis = 'ujian'
      limit 1)
  from murid
  cross join peta
  order by murid.nama, peta.id;
$$;

comment on function topik_kesiapan_sesi(uuid, uuid[]) is
  'Topik peta yang diukur oleh bab jadwal sebuah sesi, beserta sejauh mana murid kelas itu menempuhnya. Gerbang: tutor sesi itu atau admin. Sengaja tanpa Skor Putaran 1.';

revoke all on function topik_kesiapan_sesi(uuid, uuid[]) from public, anon;
grant execute on function topik_kesiapan_sesi(uuid, uuid[]) to authenticated;

notify pgrst, 'reload schema';
