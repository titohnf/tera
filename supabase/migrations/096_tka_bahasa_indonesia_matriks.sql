-- ============================================================
-- TKA Bahasa Indonesia SMP: matriks asesmen resmi (Kelas 9)
--
-- Sumber: dokumen "Rencana Pembelajaran Bimbel — Persiapan TKA Jenjang SMP",
--   bagian 3.2 "Bahasa Indonesia SMP/MTs/sederajat — 3 Kompetensi", yang
--   dokumen itu sebut dirangkum dari laman Pusmendik
--   (pusmendik.kemendikdasmen.go.id/tka).
--
-- Perhatikan bedanya dengan Matematika: rumusan di bagian 3.2 adalah RINGKASAN
-- yang ditulis penyusun dokumen, bukan salinan verbatim seperti matriks
-- Matematika di migrasi 068. Kalau nanti dicocokkan langsung ke laman
-- Pusmendik, kata-katanya mungkin perlu dirapikan lewat halaman Kurikulum.
--
-- Pemetaan ke taksonomi Tera:
--   Kompetensi     -> theme
--   Sub-kompetensi -> topic
--
-- Tidak ada baris CP: matriks Bahasa Indonesia hanya punya dua tingkat
-- (kompetensi dan sub-kompetensi), tidak ada kolom cakupan seperti pada
-- Matematika. Topiknya tetap bisa ditandai ke bank soal & materi, dan CP bisa
-- ditambahkan sendiri lewat halaman Kurikulum kalau nanti diperlukan.
--
-- sort_order dipakai di bawah 100 supaya ketiga tema resmi ini muncul sebelum
-- tema "Fase 1..4" dari migrasi 095, yang memakai 105 ke atas.
--
-- Idempoten dengan cara yang sama seperti 095: baris isi ditulis ulang, tapi
-- group-nya dipakai ulang lewat curriculum_group_id() supaya tag soal & materi
-- yang menempel pada topik tidak ikut terhapus.
-- ============================================================

do $bindo$
declare
  v_bin uuid;
  r record;
begin
  select id into v_bin from subjects where name = 'Bahasa Indonesia' limit 1;
  if v_bin is null then
    raise exception 'Mapel Bahasa Indonesia tidak ditemukan. Buat dulu di Admin -> Mapel.';
  end if;

  create temp table bi_theme (theme text, ord int) on commit drop;
  insert into bi_theme values
    ('Pemahaman Tekstual',    10),
    ('Pemahaman Inferensial', 20),
    ('Evaluasi dan Apresiasi', 30);

  create temp table bi_topic (theme text, topic text, ord int) on commit drop;
  insert into bi_topic values
    ('Pemahaman Tekstual', 'Mengidentifikasi istilah di berbagai bidang', 11),
    ('Pemahaman Tekstual', 'Mengidentifikasi objek/latar dari kosakata (fiksi/nonfiksi)', 12),
    ('Pemahaman Tekstual', 'Mengidentifikasi informasi tersurat', 13),
    ('Pemahaman Tekstual', 'Menyusun kerangka/bagan dari bagian penting teks', 14),

    ('Pemahaman Inferensial', 'Menyimpulkan ide pokok/gagasan pendukung/tokoh/peristiwa/latar/nilai (dalam dan antarteks)', 21),
    ('Pemahaman Inferensial', 'Menjelaskan kelogisan hubungan antarperistiwa/gagasan/informasi', 22),
    ('Pemahaman Inferensial', 'Memprediksi peristiwa', 23),
    ('Pemahaman Inferensial', 'Menjelaskan bahasa kias dan citraan (teks fiksi)', 24),

    ('Evaluasi dan Apresiasi', 'Menilai relevansi peristiwa dengan kehidupan sehari-hari', 31),
    ('Evaluasi dan Apresiasi', 'Menilai kesesuaian/keakuratan unsur kebahasaan dan isi antarteks', 32),
    ('Evaluasi dan Apresiasi', 'Menyimpulkan respons emosional terhadap unsur teks fiksi', 33);

  -- Isi lama ketiga tema ini dihapus supaya migrasi bisa diulang; group-nya
  -- sengaja dibiarkan hidup (cascade-nya membuang question_curriculum_tags).
  delete from curriculum_topics ct
  where ct.curriculum = 'TKA'
    and ct.grade_level = 'Kelas 9'
    and ct.subject_id = v_bin
    and ct.theme in (select theme from bi_theme);

  -- Baris tema (topic null) — tidak punya group, ditulis langsung.
  insert into curriculum_topics
    (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order)
  select 'TKA', v_bin, 'Kelas 9', 1, t.theme, null, null, t.ord
  from bi_theme t;

  for r in select * from bi_topic order by ord loop
    insert into curriculum_topics
      (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id)
    values (
      'TKA', v_bin, 'Kelas 9', 1, r.theme, r.topic, null, r.ord,
      curriculum_group_id('TKA', v_bin, 'Kelas 9', 1, r.theme, r.topic)
    );
  end loop;
end $bindo$;

-- Sama seperti 095: tanpa 'TKA' di subjects.curriculum dan 'SMP' di
-- subjects.level, mapelnya tidak muncul di sidebar halaman Kurikulum.
update subjects s
set curriculum = array_append(coalesce(s.curriculum, array[]::text[]), 'TKA')
where not coalesce(s.curriculum, array[]::text[]) @> array['TKA']
  and exists (
    select 1 from curriculum_topics ct
    where ct.subject_id = s.id and ct.curriculum = 'TKA'
  );

update subjects s
set level = array_append(coalesce(s.level, array[]::text[]), 'SMP')
where not coalesce(s.level, array[]::text[]) @> array['SMP']
  and exists (
    select 1 from curriculum_topics ct
    where ct.subject_id = s.id and ct.curriculum = 'TKA' and ct.grade_level = 'Kelas 9'
  );
