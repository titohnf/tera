-- ============================================================
-- Kurikulum IPAS Kelas 2 Semester 1 (Kurikulum Merdeka) — daftar baru
--
-- Menggantikan 10 pertemuan lama (tema Mengenal Makhluk Hidup dan Lingkungan
-- Sekitarku) dengan 21 pertemuan sesuai spreadsheet kurikulum:
-- Pancaindra, Benda di Sekitar Kita, Lingkungan Sekolahku, dan Pengalamanku
-- di Sekolah, masing-masing diikuti evaluasi dan pengayaan, plus persiapan
-- ATS dan AAS.
--
-- Cara kerjanya sengaja bukan "hapus semua lalu isi ulang":
--
--   * Baris yang tema + topiknya tetap ada di daftar baru DIPERBARUI di
--     tempat, bukan dibuat ulang. Sesi yang sudah menunjuk topik lewat
--     `sessions.curriculum_topic_id` tetap tertaut — saat migrasi ini ditulis
--     ada satu sesi (5 Agustus 2026) yang menunjuk "Benda Hidup dan Tak
--     Hidup", dan topik itu masih ada di daftar baru.
--
--   * Yang dihapus adalah barisnya di `curriculum_topic_groups`, bukan di
--     `curriculum_topics`. Grup adalah identitas topik (lihat migrasi 060) dan
--     dialah yang ditunjuk materi serta bank soal. Menghapus baris topik saja
--     akan meninggalkan grup yatim yang tidak muncul di halaman Kurikulum tapi
--     tetap nongol di pemilih topik materi dan bank soal. Menghapus grupnya
--     ikut membersihkan baris topiknya lewat cascade — ini pula yang dilakukan
--     deleteTopic() di lib/actions/admin/curriculum.ts.
--
--   * Baris baru mengambil group_id lewat curriculum_group_id(), helper yang
--     sama yang dipakai admin action saat menambah topik dari UI, supaya topik
--     hasil migrasi ini tidak berbeda bentuk dengan yang diinput manual.
--
-- Tidak ada materi (`curriculum_resources`) maupun bank soal yang tertaut ke
-- topik-topik lama saat migrasi ini ditulis, jadi tidak ada yang ikut hilang.
-- ============================================================

create temporary table ipas_k2_s1_baru (sort_order int, theme text, topic text, cp text);

insert into ipas_k2_s1_baru (sort_order, theme, topic, cp) values
  (1,  'Mengenal Makhluk Hidup', 'Benda Hidup dan Tak Hidup',
       'Siswa dapat mengidentifikasi, mengelompokkan, dan membedakan ciri-ciri benda hidup (manusia, hewan, tumbuhan) dengan benda tak hidup di lingkungan sekitar.'),
  (2,  'Pancaindra', 'Pancaindra dan Fungsinya',
       'Siswa dapat mengidentifikasi kelima pancaindra manusia beserta fungsi spesifiknya dalam kehidupan sehari-hari.'),
  (3,  'Pancaindra', 'Merawat Pancaindra',
       'Siswa dapat menjelaskan dan mempraktikkan cara-cara merawat kebersihan serta kesehatan pancaindra secara mandiri.'),
  (4,  'Evaluasi Pancaindra', 'Asesmen Sumatif Pancaindra',
       'Siswa dapat menyelesaikan asesmen sumatif untuk mengukur pemahaman konseptual terkait fungsi dan perawatan pancaindra.'),
  (5,  'Pengayaan Pancaindra', 'Memilih Tantangan & Proyek Belajar',
       'Siswa dapat menyelesaikan proyek belajar atau tantangan pengayaan berbasis observasi yang berkaitan dengan eksplorasi indra.'),
  (6,  'Benda di Sekitar Kita', 'Ciri-Ciri Benda',
       'Siswa dapat mengamati, mendeskripsikan, dan mengklasifikasikan ciri-ciri benda yang ada di lingkungan sekitarnya.'),
  (7,  'Benda di Sekitar Kita', 'Perubahan Bentuk Benda',
       'Siswa dapat menalar dan mendemonstrasikan proses perubahan bentuk benda melalui pengamatan sederhana secara langsung.'),
  (8,  'Evaluasi Benda di Sekitar Kita', 'Asesmen Sumatif Benda di Sekitar Kita',
       'Siswa dapat mengerjakan evaluasi sumatif untuk menguji pemahaman nalar mengenai wujud ciri dan perubahan bentuk benda.'),
  (9,  'Pengayaan Benda di Sekitar Kita', 'Memilih Tantangan & Proyek Belajar',
       'Siswa dapat melakukan proyek belajar interaktif sebagai bentuk pengayaan untuk mengobservasi sifat benda-benda di sekitar.'),
  (10, 'Persiapan ATS', 'Review Materi Pancaindra & Benda di Sekitar Kita',
       'Siswa dapat merangkum kembali fondasi esensial dari materi pancaindra dan karakteristik benda sebagai penguatan pemahaman.'),
  (11, 'Persiapan ATS', 'Simulasi Asesmen Tengah Semester (ATS)',
       'Siswa dapat menyelesaikan simulasi Asesmen Tengah Semester (ATS) untuk mengukur kesiapan dan pemecahan masalah dasar.'),
  (12, 'Lingkungan Sekolahku', 'Hidup Sehat & Lingkungan Sekolah yang Sehat dan tidak Sehat',
       'Siswa dapat membedakan ciri-ciri lingkungan sekolah yang sehat dan tidak sehat serta menerapkan perilaku kebiasaan hidup sehat.'),
  (13, 'Lingkungan Sekolahku', 'Denah Lingkungan Sekolah dan Kelas yang Tertata Rapi',
       'Siswa dapat membaca arah dan membuat denah spasial sederhana mengenai tata letak lingkungan sekolah dan ruang kelas.'),
  (14, 'Evaluasi Lingkungan Sekolahku', 'Asesmen Sumatif Lingkungan Sekolahku',
       'Siswa dapat menyelesaikan asesmen sumatif untuk mengukur pemahaman tentang pentingnya kebersihan dan tata letak sekolah.'),
  (15, 'Pengayaan Lingkungan Sekolahku', 'Memilih Tantangan & Proyek Belajar',
       'Siswa dapat merancang proyek belajar kreatif atau menyelesaikan tantangan pengayaan terkait pelestarian lingkungan sekolah.'),
  (16, 'Pengalamanku di Sekolah', 'Sikap dan Perilaku di Sekolah',
       'Siswa dapat menyebutkan dan menerapkan contoh sikap serta perilaku yang beradab saat berinteraksi di lingkungan sekolah.'),
  (17, 'Pengalamanku di Sekolah', 'Cara Bersikap Dalam Perbedaan & Kegemaran di Sekolah',
       'Siswa dapat menunjukkan sikap toleransi terhadap perbedaan karakteristik teman dan menceritakan berbagai macam kegemaran.'),
  (18, 'Evaluasi Pengalamanku di Sekolah', 'Asesmen Sumatif Pengalamanku di Sekolah',
       'Siswa dapat menyelesaikan asesmen sumatif untuk mengevaluasi pemahaman mengenai keragaman sosial dan interaksi di sekolah.'),
  (19, 'Pengayaan Pengalamanku di Sekolah', 'Memilih Tantangan & Proyek Belajar',
       'Siswa dapat berkolaborasi menyelesaikan proyek belajar akhir tentang merefleksikan pengalaman dan sikap positif di sekolah.'),
  (20, 'Persiapan AAS', 'Review Komprehensif Semester 1',
       'Siswa dapat mengulas secara utuh seluruh materi fondasi dari Tema Pancaindra hingga Tema Pengalamanku di Sekolah untuk menguatkan pemahaman sebelum ujian akhir.'),
  (21, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
       'Siswa dapat mengerjakan paket soal simulasi Asesmen Akhir Semester (AAS) untuk melatih ketelitian dan daya nalar terpadu.');

-- Berhenti kalau mata pelajarannya tidak ada, daripada diam-diam tidak
-- mengubah apa pun.
do $$
begin
  if not exists (select 1 from subjects where name = 'IPAS') then
    raise exception 'Mata pelajaran IPAS tidak ditemukan di tabel subjects';
  end if;
end $$;

-- 1. Topik yang bertahan: perbarui capaian dan urutannya di tempat.
update curriculum_topics t
set learning_outcomes = b.cp,
    sort_order = b.sort_order
from ipas_k2_s1_baru b
where t.subject_id = (select id from subjects where name = 'IPAS')
  and t.curriculum = 'Kurikulum Merdeka'
  and t.grade_level = 'Kelas 2'
  and t.semester = 1
  and coalesce(t.theme, '') = b.theme
  and t.topic = b.topic;

-- 2. Topik yang tidak ada lagi: hapus grupnya, baris topiknya ikut lewat cascade.
delete from curriculum_topic_groups g
where g.subject_id = (select id from subjects where name = 'IPAS')
  and g.curriculum = 'Kurikulum Merdeka'
  and g.grade_level = 'Kelas 2'
  and g.semester = 1
  and not exists (
    select 1 from ipas_k2_s1_baru b
    where b.theme = coalesce(g.theme, '') and b.topic = g.topic
  );

-- 3. Topik baru.
insert into curriculum_topics (
  curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id
)
select
  'Kurikulum Merdeka', s.id, 'Kelas 2', 1, b.theme, b.topic, b.cp, b.sort_order,
  curriculum_group_id('Kurikulum Merdeka', s.id, 'Kelas 2', 1, b.theme, b.topic)
from ipas_k2_s1_baru b
cross join (select id from subjects where name = 'IPAS') s
where not exists (
  select 1 from curriculum_topics t
  where t.subject_id = s.id
    and t.curriculum = 'Kurikulum Merdeka'
    and t.grade_level = 'Kelas 2'
    and t.semester = 1
    and coalesce(t.theme, '') = b.theme
    and t.topic = b.topic
);

drop table ipas_k2_s1_baru;
