-- ============================================================
-- Kurikulum "Misi Matematika": topik mastery sebagai pilihan di jurnal tutor
--
-- Siswa yayasan mengerjakan Misi (topik `topik`, kode AC-01 dst), tetapi jurnal
-- tutor hanya mengenal `curriculum_topics`. Migrasi 140 memisahkan keduanya
-- dengan sengaja, jadi tutor tidak punya cara memilih topik Misi di jurnal, dan
-- materi/asesmen topik itu tidak bisa ikut otomatis.
--
-- Yang dilakukan di sini:
--
--  1. Kolom `curriculum_topic_groups.topik_id` (nullable) menunjuk topik
--     mastery asalnya. Ini jangkar untuk menyambungkan materi dan asesmen
--     per topik, bukan salinan teks.
--  2. Tiap topik mastery yang AKTIF dibuatkan satu topik jurnal di kurikulum
--     'Misi Matematika' (Matematika, 'Semua Kelas', semester 1 sebagai isian —
--     lihat lib/curriculum-config.ts). Temanya elemen peta kompetensi, topiknya
--     "<kode> · <nama>". Tanpa baris CP: jurnal tidak mewajibkan CP untuk topik
--     tanpa CP.
--
-- Hanya topik aktif, karena yang belum dibuka belum bisa dikerjakan siswa dan
-- tidak pantas muncul di pilihan tutor. Saat topik baru diaktifkan, jalankan
-- ulang bagian 2 (aman diulang: yang sudah ada dilewati).
-- ============================================================

alter table curriculum_topic_groups
  add column if not exists topik_id text references topik(id) on delete set null;

create unique index if not exists curriculum_topic_groups_topik_idx
  on curriculum_topic_groups (topik_id) where topik_id is not null;

do $$
declare
  v_mtk uuid;
  v_n int;
begin
  select id into v_mtk from subjects where name = 'Matematika';
  if v_mtk is null then
    raise exception 'Mapel Matematika tidak ditemukan';
  end if;

  insert into curriculum_topics (
    curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id
  )
  select
    'Misi Matematika', v_mtk, 'Semua Kelas', 1,
    case t.elemen
      when 'bilangan' then 'Bilangan'
      when 'aljabar' then 'Aljabar'
      when 'geometri_pengukuran' then 'Geometri dan Pengukuran'
      when 'data_peluang' then 'Data dan Peluang'
      else t.elemen
    end,
    t.id || ' · ' || t.nama,
    null,
    t.urutan,
    curriculum_group_id(
      'Misi Matematika', v_mtk, 'Semua Kelas', 1,
      case t.elemen
        when 'bilangan' then 'Bilangan'
        when 'aljabar' then 'Aljabar'
        when 'geometri_pengukuran' then 'Geometri dan Pengukuran'
        when 'data_peluang' then 'Data dan Peluang'
        else t.elemen
      end,
      t.id || ' · ' || t.nama
    )
  from topik t
  where t.aktif
    and not exists (
      select 1 from curriculum_topics c
      where c.subject_id = v_mtk
        and c.curriculum = 'Misi Matematika'
        and c.topic = t.id || ' · ' || t.nama
    );
  get diagnostics v_n = row_count;
  raise notice 'Topik Misi Matematika baru: %', v_n;

  -- Jangkar ke topik asal, dari kode di depan nama topiknya.
  update curriculum_topic_groups g
  set topik_id = t.id
  from topik t
  where g.curriculum = 'Misi Matematika'
    and g.subject_id = v_mtk
    and g.topik_id is null
    and g.topic like t.id || ' · %';
end $$;

notify pgrst, 'reload schema';
