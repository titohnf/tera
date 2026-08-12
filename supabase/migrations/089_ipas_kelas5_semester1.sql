-- ============================================================
-- Kurikulum IPAS Kelas 5 Semester 1 (Kurikulum Merdeka)
--
-- Sebelum migrasi ini IPAS Kelas 5 Semester 1 sama sekali kosong — nol topik,
-- nol grup — jadi isinya murni penambahan 20 pertemuan sesuai spreadsheet
-- "Kelas 5 Semester 1": Sistem Organ Gerak, Sistem Pernapasan, Kondisi
-- Geografis, Pencernaan, Kebudayaan, dan Peredaran Darah, diselingi proyek
-- belajar serta persiapan ATS dan AAS.
--
-- Tidak ada yang dihapus dan tidak ada yang ditimpa, jadi tidak ada materi,
-- bank soal, atau sesi yang berisiko terputus — berbeda dengan migrasi 088
-- yang mengganti daftar Kelas 2 yang sudah terisi.
--
-- Penjaga `not exists` tetap dipasang supaya migrasi ini aman dijalankan dua
-- kali: yang kedua tidak menggandakan apa pun. group_id diambil lewat
-- curriculum_group_id(), helper yang sama yang dipakai admin action saat
-- menambah topik dari UI (lihat migrasi 060), supaya topik hasil migrasi ini
-- tidak berbeda bentuk dengan yang diinput manual.
-- ============================================================

create temporary table ipas_k5_s1 (sort_order int, theme text, topic text, cp text);

insert into ipas_k5_s1 (sort_order, theme, topic, cp) values
  (1,  'Sistem Organ Gerak', 'Sistem Organ Gerak Hewan dan Manusia',
       'Siswa dapat menganalisis fungsi, susunan tulang, dan cara kerja sistem organ gerak pada hewan dan manusia melalui pengamatan gambar atau model.'),
  (2,  'Sistem Organ Gerak', 'Kelainan Organ Gerak & Evaluasi Tema Sistem Organ Gerak',
       'Siswa dapat mengidentifikasi berbagai kelainan pada organ gerak, menjelaskan cara merawat kesehatannya, serta menyelesaikan Uji Kompetensi Tema Sistem Organ Gerak'),
  (3,  'Sistem Pernapasan', 'Pernapasan pada Hewan dan Manusia',
       'Siswa dapat membedakan organ pernapasan dan mekanisme bernapas antara berbagai jenis hewan serta manusia.'),
  (4,  'Sistem Pernapasan', 'Gangguan Pernapasan & Evaluasi Tema Sistem Pernapasan',
       'Siswa dapat menalar penyebab gangguan pada sistem pernapasan manusia, cara mencegahnya, dan menyelesaikan Uji Kompetensi Tema Sistem Pernapasan.'),
  (5,  'Kondisi Geografis', 'Peta Kondisi Geografis Negara Indonesia',
       'Siswa dapat menelaah letak geografis dan astronomis wilayah Indonesia serta dampaknya terhadap kondisi alam sekitar.'),
  (6,  'Kondisi Geografis', 'Komponen Peta, Jenis Peta & Evaluasi Tema Kondisi Geografis',
       'Siswa dapat mengidentifikasi komponen-komponen penyusun peta, membedakan jenis peta, dan menyelesaikan Uji Kompetensi Kondisi Geografis.'),
  (7,  'Pengayaan ATS', 'Proyek Belajar IPAS 1 (Tema Sistem Organ Gerak - Tema Kondisi Geografis)',
       'Siswa dapat merancang dan mempresentasikan proyek belajar yang menghubungkan kondisi geografis suatu wilayah dengan kebiasaan makhluk hidup di dalamnya.'),
  (8,  'Persiapan ATS', 'Review Materi ATS',
       'Siswa dapat merangkum konsep anatomi dasar (organ gerak dan pernapasan) serta tata letak geografis Indonesia secara komprehensif.'),
  (9,  'Persiapan ATS', 'Simulasi Asesmen Tengah Semester (ATS)',
       'Siswa dapat mengerjakan paket soal simulasi ATS dan membedah penyelesaiannya untuk mengukur kesiapan menghadapi ujian tengah semester.'),
  (10, 'Pencernaan', 'Pencernaan Makanan Pada Hewan dan Manusia',
       'Siswa dapat menguraikan urutan alur proses pencernaan makanan pada hewan ruminansia dan manusia secara runtut.'),
  (11, 'Pencernaan', 'Gangguan Pencernaan, Makanan, dan Kesehatan',
       'Siswa dapat mengidentifikasi gangguan alat pencernaan, serta menyimpulkan hubungan antara asupan gizi makanan dengan kesehatan tubuh.'),
  (12, 'Pencernaan', 'Uji Kompetensi Tema Pencernaan & Proyek Belajar',
       'Siswa dapat menyelesaikan evaluasi formatif Tema Pencernaan dan menyusun menu makanan sehat seimbang sebagai bentuk proyek belajar.'),
  (13, 'Kebudayaan', 'Suku Bangsa di Indonesia',
       'Siswa dapat mengidentifikasi persebaran berbagai suku bangsa di Indonesia serta mengenali karakteristik khasnya dari peta geografis.'),
  (14, 'Kebudayaan', 'Keragaman Budaya & Evaluasi Tema Kebudayaan',
       'Siswa dapat menelaah ragam budaya lokal (tarian, rumah adat, tradisi), menunjukkan sikap toleransi, dan menyelesaikan Uji Kompetensi Tema Kebudayaan.'),
  (15, 'Peredaran Darah', 'Peredaran Darah Pada Manusia dan Hewan',
       'Siswa dapat membandingkan organ jantung serta mekanisme peredaran darah besar dan kecil pada manusia maupun hewan.'),
  (16, 'Peredaran Darah', 'Gangguan Organ Peredaran Darah & Perawatannya',
       'Siswa dapat menganalisis berbagai penyakit/gangguan pada sistem peredaran darah dan merumuskan pola hidup untuk menjaga kesehatannya.'),
  (17, 'Peredaran Darah', 'Uji Kompetensi Bab 6 & Proyek Belajar',
       'Siswa dapat menyelesaikan asesmen formatif Bab 6 dan mempresentasikan cara kerja peredaran darah melalui model sederhana.'),
  (18, 'Pengayaan AAS', 'Proyek Terpadu IPAS 2 (Tema Pencernaan - Tema Peredaran Darah)',
       'Siswa dapat mengintegrasikan pemahaman tentang sistem organ anatomi tubuh kaitannya dengan kebiasaan makanan khas di berbagai daerah budaya.'),
  (19, 'Persiapan AAS', 'Review Komprehensif Semester 1',
       'Siswa dapat mengulang kaji seluruh materi sains biologi dan materi sosial geografi untuk memperkuat pemahaman utuh.'),
  (20, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
       'Siswa dapat mengerjakan paket soal simulasi AAS secara mandiri untuk melatih ketelitian dan kesiapan dalam menjawab soal-soal literasi IPAS.');

-- Berhenti kalau mata pelajarannya tidak ada, daripada diam-diam tidak
-- menambahkan apa pun.
do $$
begin
  if not exists (select 1 from subjects where name = 'IPAS') then
    raise exception 'Mata pelajaran IPAS tidak ditemukan di tabel subjects';
  end if;
end $$;

insert into curriculum_topics (
  curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id
)
select
  'Kurikulum Merdeka', s.id, 'Kelas 5', 1, b.theme, b.topic, b.cp, b.sort_order,
  curriculum_group_id('Kurikulum Merdeka', s.id, 'Kelas 5', 1, b.theme, b.topic)
from ipas_k5_s1 b
cross join (select id from subjects where name = 'IPAS') s
where not exists (
  select 1 from curriculum_topics t
  where t.subject_id = s.id
    and t.curriculum = 'Kurikulum Merdeka'
    and t.grade_level = 'Kelas 5'
    and t.semester = 1
    and coalesce(t.theme, '') = b.theme
    and t.topic = b.topic
);

drop table ipas_k5_s1;
