-- ============================================================
-- Matematika Kelas 2 Semester 1: satu daftar, bukan dua
--
-- Sejak migrasi 157 mencatat 21 topik dari spreadsheet Kelas 2, mapel
-- Matematika Kelas 2 semester 1 punya DUA daftar kurikulum yang hidup
-- berdampingan di pemilih topik tutor:
--
--   * 8 topik dari seed 029 (36 baris CP; di model migrasi 060 satu baris
--     `curriculum_topics` adalah satu CP dan `group_id` adalah identitas
--     topiknya), dan
--   * 21 topik rencana pertemuan dari spreadsheet.
--
-- Empat topik seed 029 sudah tercakup spreadsheet dan dihapus di sini. Empat
-- sisanya — Pengenalan Pola Bilangan, pengukuran panjang/berat/waktu, bangun
-- 2 dan 3 dimensi, serta pengumpulan dan penyajian data — tidak punya padanan
-- di spreadsheet sama sekali, jadi dibiarkan: spreadsheet adalah rencana
-- pertemuan satu semester, bukan daftar CP yang lengkap.
--
-- Yang dipindahkan lebih dulu, karena topik lama itu terpakai:
--
--   * 4 sesi yang sudah selesai (5-26 Agustus 2026) menunjuk baris CP lama
--     lewat `sessions.curriculum_topic_id` dan `sessions.selected_cp_ids`.
--     Yang kedua tidak punya foreign key — kalau barisnya hilang tanpa
--     ditangani, isinya jadi uuid yang tidak menunjuk apa-apa dan daftar CP di
--     rincian sesi keluarga diam-diam jadi kosong.
--
--   * 4 materi menempel di grup lama. `curriculum_resources.group_id` cascade
--     on delete (migrasi 060), jadi menghapus grupnya berarti menghapus
--     materinya.
--
-- Pemetaan topiknya per grup, kecuali dua materi yang judulnya sendiri sudah
-- menyebut topik spreadsheet yang lebih tepat daripada grup tempatnya
-- menempel sekarang.
--
-- "Nilai tempat" bermuara di "Mengenal Bilangan Cacah sampai 100", bukan
-- "Mengenal Bilangan sampai 50": capaian topik spreadsheet itu berbunyi
-- "membaca, menulis, dan menentukan nilai tempat bilangan cacah hingga 100",
-- persis cakupan topik lamanya sampai ratusan.
--
-- Terakhir sort_order-nya dirapikan supaya 21 pertemuan spreadsheet berada di
-- depan (1-21) dan sisa seed 029 mengekor (22-38). Tanpa itu, basis data yang
-- dibangun ulang dari nol akan menyelang-nyeling keduanya: seed 029 memberi
-- nomor 0-35 dan migrasi 157 memberi nomor 1-21 pada daftar yang berbeda.
-- ============================================================

-- Peta topik lama (semuanya bertema 'Bilangan') ke topik spreadsheet --------
create temporary table peta_grup (lama_topic text, baru_theme text, baru_topic text);

insert into peta_grup (lama_topic, baru_theme, baru_topic) values
  ('Bilangan cacah sampai 100 (membaca, menulis, dan membandingkan)',
   'Bilangan sampai 100', 'Mengenal Bilangan Cacah sampai 100'),
  ('Nilai tempat (satuan, puluhan, dan ratusan)',
   'Bilangan sampai 100', 'Mengenal Bilangan Cacah sampai 100'),
  ('Operasi hitung bilangan (Penjumlahan dan Pengurangan sampai 100)',
   'Penjumlahan dan Pengurangan Bilangan', 'Penjumlahan Bilangan'),
  ('Pengenalan pecahan sederhana (1/2, 1/4, dan 1/8)',
   'Pecahan', 'Mengenal Pecahan');

-- Materi yang judulnya menyebut topik lain; ini menang atas peta per grup.
create temporary table peta_materi (judul text, baru_theme text, baru_topic text);

insert into peta_materi (judul, baru_theme, baru_topic) values
  ('Membandingkan Bilangan',
   'Bilangan sampai 100', 'Membandingkan dan Mengurutkan Bilangan sampai 100'),
  ('Penguatan Nalar & Pemecahan Masalah Bilangan sampai 50',
   'Pengayaan', 'Penguatan Nalar & Pemecahan Masalah Bilangan sampai 50');

-- Baris CP lama yang akan hilang, beserta grupnya ---------------------------
create temporary table baris_lama as
select t.id, t.group_id, t.topic
from curriculum_topics t
where t.subject_id = (select id from subjects where name = 'Matematika')
  and t.curriculum = 'Kurikulum Merdeka'
  and t.grade_level = 'Kelas 2'
  and t.semester = 1
  and coalesce(t.theme, '') = 'Bilangan'
  and t.topic in (select lama_topic from peta_grup);

-- Tujuan tiap grup lama: satu baris CP spreadsheet, plus grupnya ------------
create temporary table tujuan as
select distinct p.lama_topic, t.id as baru_id, t.group_id as baru_group_id,
       coalesce(t.theme, '') as baru_theme, t.topic as baru_topic
from peta_grup p
join curriculum_topics t
  on t.subject_id = (select id from subjects where name = 'Matematika')
 and t.curriculum = 'Kurikulum Merdeka'
 and t.grade_level = 'Kelas 2'
 and t.semester = 1
 and coalesce(t.theme, '') = p.baru_theme
 and t.topic = p.baru_topic;

-- Berhenti kalau petanya tidak utuh, daripada memindahkan separuh lalu
-- menghapus sisanya.
do $$
declare
  v_lama int;
  v_tujuan int;
begin
  select count(*) into v_lama from peta_grup p
  where not exists (select 1 from tujuan t where t.lama_topic = p.lama_topic);
  if v_lama > 0 then
    raise exception 'Topik tujuan tidak ditemukan untuk % topik lama; migrasi 157 belum dijalankan?', v_lama;
  end if;

  select count(*) into v_tujuan from tujuan;
  if v_tujuan <> (select count(*) from peta_grup) then
    raise exception 'Topik spreadsheet tujuan tidak tunggal: % baris untuk % pemetaan',
      v_tujuan, (select count(*) from peta_grup);
  end if;

  if exists (
    select 1 from peta_materi pm
    where not exists (
      select 1 from curriculum_topics t
      where t.subject_id = (select id from subjects where name = 'Matematika')
        and t.curriculum = 'Kurikulum Merdeka'
        and t.grade_level = 'Kelas 2'
        and t.semester = 1
        and coalesce(t.theme, '') = pm.baru_theme
        and t.topic = pm.baru_topic
    )
  ) then
    raise exception 'Topik tujuan materi tidak ditemukan di daftar spreadsheet';
  end if;
end $$;

-- Grup lama tidak boleh dipakai hal lain yang tidak ditangani di sini.
do $$
declare
  v_pesan text;
begin
  select string_agg(x, ', ') into v_pesan from (
    select 'question_curriculum_tags: ' || count(*) as x from question_curriculum_tags
      where group_id in (select distinct group_id from baris_lama) having count(*) > 0
    union all
    select 'practice_sessions: ' || count(*) from practice_sessions
      where paket_group_id in (select distinct group_id from baris_lama) having count(*) > 0
    union all
    select 'practice_paket_locks: ' || count(*) from practice_paket_locks
      where group_id in (select distinct group_id from baris_lama) having count(*) > 0
    union all
    select 'topik_grup: ' || count(*) from topik_grup
      where group_id in (select distinct group_id from baris_lama) having count(*) > 0
  ) q;

  if v_pesan is not null then
    raise exception 'Grup lama masih dipakai: %. Tangani dulu sebelum menghapus.', v_pesan;
  end if;
end $$;

-- 1. Sesi: topik utama ------------------------------------------------------
update sessions s
set curriculum_topic_id = tj.baru_id
from baris_lama bl
join tujuan tj on tj.lama_topic = bl.topic
where s.curriculum_topic_id = bl.id;

-- 2. Sesi: CP yang dicentang tutor.
--
-- Topik spreadsheet hanya punya satu baris CP, jadi beberapa CP lama dari satu
-- grup melebur jadi satu — karena itu `distinct`. Sesi yang CP-nya tak satu pun
-- dari daftar lama tidak disentuh.
update sessions s
set selected_cp_ids = (
  select coalesce(array_agg(distinct coalesce(tj.baru_id, e.id)), '{}'::uuid[])
  from unnest(s.selected_cp_ids) as e(id)
  left join baris_lama bl on bl.id = e.id
  left join tujuan tj on tj.lama_topic = bl.topic
)
where s.selected_cp_ids && (select coalesce(array_agg(id), '{}'::uuid[]) from baris_lama);

-- 3. Materi: yang judulnya menyebut topik lain -----------------------------
update curriculum_resources r
set group_id = t.group_id,
    theme = t.theme,
    topic = t.topic
from peta_materi pm
join curriculum_topics t
  on t.subject_id = (select id from subjects where name = 'Matematika')
 and t.curriculum = 'Kurikulum Merdeka'
 and t.grade_level = 'Kelas 2'
 and t.semester = 1
 and coalesce(t.theme, '') = pm.baru_theme
 and t.topic = pm.baru_topic
where r.title = pm.judul
  and r.group_id in (select distinct group_id from baris_lama);

-- 4. Materi: sisanya ikut peta per grup ------------------------------------
update curriculum_resources r
set group_id = pg.baru_group_id,
    theme = pg.baru_theme,
    topic = pg.baru_topic
from (
  select distinct bl.group_id as lama_group_id,
         tj.baru_group_id, tj.baru_theme, tj.baru_topic
  from baris_lama bl
  join tujuan tj on tj.lama_topic = bl.topic
) pg
where r.group_id = pg.lama_group_id;

-- 5. Hapus grupnya; baris CP-nya ikut lewat cascade ------------------------
delete from curriculum_topic_groups g
where g.id in (select distinct group_id from baris_lama);

-- 6. Urutan: pertemuan spreadsheet di depan, sisa seed 029 mengekor --------
with urut as (
  select id, row_number() over (
    order by case
               when coalesce(theme, '') in ('Aljabar', 'Pengukuran', 'Geometri', 'Analisis Data')
               then 2 else 1
             end,
             sort_order,
             id
  ) as n
  from curriculum_topics
  where subject_id = (select id from subjects where name = 'Matematika')
    and curriculum = 'Kurikulum Merdeka'
    and grade_level = 'Kelas 2'
    and semester = 1
)
update curriculum_topics t
set sort_order = urut.n
from urut
where urut.id = t.id
  and t.sort_order is distinct from urut.n;

drop table baris_lama;
drop table tujuan;
drop table peta_grup;
drop table peta_materi;
