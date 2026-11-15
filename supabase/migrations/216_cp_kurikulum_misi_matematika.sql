-- ============================================================
-- Capaian Pembelajaran (CP) untuk kurikulum 'Misi Matematika'
--
-- Migrasi 214 membuat topik Misi tanpa CP. Tanpa CP, tutor tidak punya apa pun
-- untuk dicentang di jurnal selain nama topiknya, dan jurnal tidak bisa
-- menyatakan apa yang sebenarnya dicapai murid di sesi itu.
--
-- Satu CP per topik, disusun dari nama topik di peta kompetensi
-- (`topik.nama`): "Siswa dapat memahami dan menyelesaikan soal tentang <nama>".
-- Sengaja umum: nama topik sudah menyebut isinya, dan kalimat yang lebih
-- spesifik sebaiknya ditulis kurator konten. Admin dapat menyuntingnya di
-- Admin -> Kurikulum -> Misi Matematika tanpa migrasi baru.
--
-- Aman diulang: topik yang sudah punya CP dilewati. Jalankan ulang setelah
-- menjalankan ulang 214 untuk topik yang baru diaktifkan.
-- ============================================================

insert into curriculum_topics (
  curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id
)
select
  g.curriculum, g.subject_id, g.grade_level, g.semester, g.theme, g.topic,
  'Siswa dapat memahami dan menyelesaikan soal tentang ' || lower(left(t.nama, 1)) || substr(t.nama, 2) || '.',
  t.urutan,
  g.id
from curriculum_topic_groups g
join topik t on t.id = g.topik_id
where g.curriculum = 'Misi Matematika'
  and not exists (
    select 1 from curriculum_topics c
    where c.group_id = g.id and c.learning_outcomes is not null
  );

notify pgrst, 'reload schema';
