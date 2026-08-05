-- ============================================================
-- TKA: tanam baris topik yang tidak pernah dibuat seed 062
--
-- Seed 062 hanya meng-insert 4 baris TEMA ke `curriculum_topics`. Topiknya
-- dibuat lewat `curriculum_group_id()` di dalam `seed_tka_question()`, dan
-- fungsi itu cuma menyentuh `curriculum_topic_groups` — tabel identitas, bukan
-- tabel isi. Jadi setiap topik TKA punya id group (soalnya tertag ke situ dan
-- latihan mandiri jalan normal), tapi tidak punya baris di `curriculum_topics`.
--
-- Halaman Kurikulum membaca `curriculum_topics`, karena itu temanya kelihatan
-- sementara topiknya tidak. Bandingkan dengan `createCurriculumTopics` di
-- lib/actions/admin/curriculum.ts, yang selalu mengerjakan dua-duanya: minta
-- group_id, lalu insert baris topiknya. Seed melewatkan separuh kedua.
--
-- Migrasi ini menambal separuh yang hilang. Urutannya diambil dari created_at
-- group supaya sama dengan urutan penulisan di seed, dan mulai dari 1 mengikuti
-- konvensi createCurriculumTopics.
-- ============================================================

insert into curriculum_topics (
  curriculum, subject_id, grade_level, semester, theme, topic,
  learning_outcomes, sort_order, group_id
)
select
  g.curriculum, g.subject_id, g.grade_level, g.semester, g.theme, g.topic,
  null,
  row_number() over (partition by g.subject_id, g.theme order by g.created_at, g.topic),
  g.id
from curriculum_topic_groups g
where g.curriculum = 'TKA'
  and not exists (
    select 1 from curriculum_topics ct where ct.group_id = g.id
  );
