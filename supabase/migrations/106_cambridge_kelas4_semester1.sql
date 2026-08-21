-- ============================================================
-- Kurikulum Cambridge Kelas 4 Semester 1 — Math, Science
--
-- Dari spreadsheet Kelas 4: tab "Math" (24 pertemuan) dan tab "Science"
-- (24 pertemuan). Tab Matematika dan IPAS berbahasa Indonesia di file yang sama
-- adalah Kurikulum Merdeka, bukan Cambridge, jadi tidak ikut di sini.
--
-- Ini isi pertama untuk 'Kurikulum Cambridge': sampai sekarang kolom
-- `curriculum_topics.curriculum` hanya berisi 'Kurikulum Merdeka' dan 'TKA'
-- meski Cambridge sudah lama terdaftar di lib/curriculum-config.ts.
--
-- Mapel Math dan Science juga baru: mapel yang ada sekarang ('Matematika',
-- 'IPA', dst.) melayani Kurikulum Merdeka, dan menumpuk topik Cambridge di
-- sana akan mencampur dua silabus dalam satu dropdown tutor. Keduanya dibuat di
-- sini dengan `curriculum = {Kurikulum Cambridge}` supaya UI bisa memisahkan.
-- `subjects.name` tidak punya unique constraint, jadi penjaganya `if not
-- exists`, bukan `on conflict`.
--
-- Dua penyesuaian terhadap teks spreadsheet:
--   1. Beberapa judul topik Bab 5-7 terbaca "Shapes" tanpa penanda dimensi
--      ("Nets of  Shapes"). Ditulis ulang sebagai 2D/3D sesuai isi capaiannya —
--      Bab 5 bangun datar, Bab 6 bangun ruang beserta jaring-jaringnya, Bab 7
--      keliling dan luas bangun datar.
--   2. Spasi ganda dan spasi di ujung judul dirapikan.
--
-- Murni penambahan, dengan penjaga `not exists` supaya aman dijalankan dua
-- kali. group_id lewat curriculum_group_id() (migrasi 060), sama seperti
-- topik yang diinput admin dari UI.
-- ============================================================

-- Mapel baru khusus Cambridge -------------------------------------------
do $$
begin
  if not exists (select 1 from subjects where name = 'Math') then
    insert into subjects (name, description, level, curriculum)
    values ('Math', 'Cambridge Primary Mathematics', array['SD'], array['Kurikulum Cambridge']);
  end if;

  if not exists (select 1 from subjects where name = 'Science') then
    insert into subjects (name, description, level, curriculum)
    values ('Science', 'Cambridge Primary Science', array['SD'], array['Kurikulum Cambridge']);
  end if;
end $$;

create temporary table cambridge_k4_s1 (subject text, sort_order int, theme text, topic text, cp text);

-- Tab "Math"
insert into cambridge_k4_s1 (subject, sort_order, theme, topic, cp) values
  ('Math', 1,  'Chapter 1', 'Place Value & Larger Numbers',
   'Membaca/menulis bilangan besar dan memahami nilai tempat.'),
  ('Math', 2,  'Chapter 1', 'Counting & Comparing',
   'Menghitung maju/mundur, membandingkan, dan mengurutkan bilangan.'),
  ('Math', 3,  'Chapter 1', 'Rounding Numbers',
   'Membulatkan ke puluhan, ratusan, ribuan, hingga ratusan ribu terdekat.'),
  ('Math', 4,  'Chapter 2', 'Introducing Negative Numbers',
   'Membaca/menulis bilangan di bawah 0 dan menghitung maju/mundur melewati 0.'),
  ('Math', 5,  'Ch 2 & 3', 'Compare Negatives & Factors (2C, 3A)',
   'Membandingkan bilangan negatif; Memahami faktor dan kelipatan.'),
  ('Math', 6,  'Chapter 3', 'Tests of Divisibility (3B)',
   'Menguji aturan pembagian angka tertentu.'),
  ('Math', 7,  'Chapter 4', 'Telling Time & Timetables',
   'Membaca jam (analog/digital) dan jadwal dengan notasi 12-jam & 24-jam.'),
  ('Math', 8,  'Chapter 4', 'Converting & Intervals of Time',
   'Mengonversi satuan waktu dan menghitung durasi antarsatuan waktu.'),
  ('Math', 9,  'Chapter 5', '2D Shapes & Tessellation',
   'Menggabungkan bangun datar dan membuat pola teselasi.'),
  ('Math', 10, 'Chapter 5', 'Symmetry & Reflection',
   'Menemukan garis simetri dan merefleksikan bangun datar.'),
  ('Math', 11, 'Review', 'Persiapan ATS (Bagian 1)',
   'Ulasan materi Bab 1 - Bab 3 (Bilangan, Faktor, Kelipatan).'),
  ('Math', 12, 'Review', 'Persiapan ATS (Bagian 2)',
   'Ulasan materi Bab 4 - Bab 5 (Waktu dan Bangun Datar) & Latihan Soal.'),
  ('Math', 13, 'Chapter 6', '3D Shapes',
   'Mengidentifikasi sisi (faces) bangun datar pada bangun ruang.'),
  ('Math', 14, 'Chapter 6', 'Nets of 3D Shapes',
   'Membuat jaring-jaring bangun ruang.'),
  ('Math', 15, 'Chapter 7', 'Perimeter of 2D Shapes',
   'Memperkirakan dan mengukur keliling bangun datar.'),
  ('Math', 16, 'Chapter 7', 'Area of 2D Shapes',
   'Memperkirakan dan mengukur luas bangun datar.'),
  ('Math', 17, 'Chapter 7', 'Grids, Rules & Irregular Shapes',
   'Menggunakan kisi-kisi/aturan untuk luas/keliling & menaksir luas area tidak beraturan.'),
  ('Math', 18, 'Chapter 8', 'Addition & Subtraction Rules',
   'Membuat generalisasi dalam penjumlahan dan pengurangan.'),
  ('Math', 19, 'Chapter 8', 'Unknown Numbers',
   'Menggunakan objek, bentuk, dan simbol untuk mencari angka yang belum diketahui.'),
  ('Math', 20, 'Chapter 8', 'Addition of 3-Digit Numbers',
   'Menjumlahkan bilangan bulat tiga digit.'),
  ('Math', 21, 'Chapter 8', 'Subtraction of 3-Digit Numbers',
   'Mengurangkan bilangan bulat tiga digit.'),
  ('Math', 22, 'Review', 'Kilas Balik Pasca-ATS',
   'Ulasan materi Bab 6 - Bab 8 (3D Shapes, Area/Perimeter, Add/Subtract).'),
  ('Math', 23, 'Review', 'Persiapan AAS (Bagian 1)',
   'Latihan soal komprehensif / Try Out untuk materi awal.'),
  ('Math', 24, 'Review', 'Persiapan AAS (Bagian 2)',
   'Latihan soal komprehensif / Try Out untuk materi akhir dan evaluasi.');

-- Tab "Science"
insert into cambridge_k4_s1 (subject, sort_order, theme, topic, cp) values
  ('Science', 1,  'Bones and Muscles', 'Bones in Your Hand & How Do My Arm Muscles Work?',
   'Siswa dapat menganalisis fungsi tulang dan menalar cara kerja otot sebagai satu kesatuan sistem gerak mekanis.'),
  ('Science', 2,  'Bones and Muscles', 'What Am I? & Review',
   'Siswa dapat mengonsolidasikan pemahaman anatomi dasar melalui kuis identifikasi dan pemetaan konsep.'),
  ('Science', 3,  'Diseases', 'Who Caught the Germs? & Measure It Right!',
   'Siswa dapat menalar proses penyebaran kuman penyakit dan mempraktikkan akurasi pengukuran suhu tubuh.'),
  ('Science', 4,  'Diseases', 'Medicine Safety & My Vaccination Record',
   'Siswa dapat mengevaluasi pentingnya standar keselamatan obat dan menganalisis peran vaksinasi bagi pertahanan tubuh.'),
  ('Science', 5,  'Energy from Food', 'Where Do Plants Grow Better? & Spot and Colour!',
   'Siswa dapat mengevaluasi kondisi optimal pertumbuhan tanaman sebagai produsen utama energi.'),
  ('Science', 6,  'Energy from Food', 'Make a Food Chain & Review',
   'Siswa dapat memodelkan rantai makanan untuk menelusuri aliran energi antarorganisme di alam.'),
  ('Science', 7,  'Different Habitats', 'What Can I Find? & Where Can Orchids Grow?',
   'Siswa dapat membedakan karakteristik berbagai habitat dan menganalisis syarat hidup tanaman spesifik seperti anggrek.'),
  ('Science', 8,  'Different Habitats', 'Where Can Mosquitoes Survive? & Review',
   'Siswa dapat merumuskan hubungan sebab-akibat antara kondisi lingkungan dengan kemampuan bertahan hidup serangga.'),
  ('Science', 9,  'Materials, Substances and Particles', 'Making Models of Solids and Liquids',
   'Siswa dapat memvisualisasikan perbedaan susunan partikel zat padat dan cair melalui pembuatan model.'),
  ('Science', 10, 'Materials, Substances and Particles', 'Make Your Own Slushies! & Fizzing Lemon',
   'Siswa dapat mengobservasi dan menalar perubahan wujud zat serta reaksi kimia sederhana dari eksperimen faktual.'),
  ('Science', 11, 'Persiapan ATS', 'Review Analitik Bones and Muscles - Bab 5',
   'Siswa dapat menyintesis fondasi biologi dasar dan materi wujud zat sebagai persiapan komprehensif ujian tengah semester.'),
  ('Science', 12, 'Persiapan ATS', 'Simulasi Asesmen Tengah Semester',
   'Siswa dapat memecahkan soal-soal literasi sains dan logika eksperimen dari paruh pertama semester.'),
  ('Science', 13, 'Energy', 'What Energy Can You Find? & How Do Things Move?',
   'Siswa dapat mengidentifikasi berbagai bentuk energi dan menganalisis gaya yang menyebabkan benda bergerak.'),
  ('Science', 14, 'Energy', 'Where Will the Heat Go? & Review',
   'Siswa dapat menelusuri arah perpindahan energi panas (heat transfer) melalui penalaran logis kondisi termal.'),
  ('Science', 15, 'Properties of Light', 'How Light Travels',
   'Siswa dapat membuktikan sifat perambatan cahaya secara garis lurus melalui pengamatan saintifik.'),
  ('Science', 16, 'Properties of Light', 'What Reflects Light Well? & Review',
   'Siswa dapat mengklasifikasikan efektivitas berbagai material dalam memantulkan cahaya.'),
  ('Science', 17, 'Electrical Circuits', 'Make Your Own Paper Clip Switch & What Happens to the Lamp?',
   'Siswa dapat menyusun rangkaian listrik sederhana dan menalar fungsi saklar (menggunakan penjepit kertas) terhadap kondisi lampu.'),
  ('Science', 18, 'Electrical Circuits', 'Make a Circuit Tester & Review',
   'Siswa dapat mendiagnosis kelancaran arus listrik menggunakan alat uji sirkuit buatan sendiri.'),
  ('Science', 19, 'The Solar System', 'My Solar System',
   'Siswa dapat memvisualisasikan model Tata Surya secara proporsional dari pusat hingga planet terluar.'),
  ('Science', 20, 'The Solar System', 'Day and Night & Review',
   'Siswa dapat menalar fenomena rotasi planet yang menyebabkan terjadinya siklus siang dan malam.'),
  ('Science', 21, 'Structure of the Earth', 'Layers of the Earth',
   'Siswa dapat mengidentifikasi struktur berlapis dari penyusun internal planet Bumi.'),
  ('Science', 22, 'Structure of the Earth', 'The Volcano Model & It''s an Earthquake!',
   'Siswa dapat memodelkan mekanisme terjadinya letusan gunung berapi dan gempa bumi sebagai aktivitas tektonik.'),
  ('Science', 23, 'Persiapan AAS', 'Review Komprehensif Semester 1',
   'Siswa dapat mengkonsolidasikan nalar fisika dasar dan ilmu bumi-antariksa untuk memperkuat memori konseptual.'),
  ('Science', 24, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester',
   'Siswa dapat menyelesaikan simulasi evaluasi akhir dengan mengedepankan logika pembuktian dan akurasi analisis data.');

-- Berhenti kalau ada mata pelajaran yang tidak ada, daripada diam-diam
-- melewatkan satu tab penuh.
do $$
declare
  v_missing text;
begin
  select string_agg(b.subject, ', ')
    into v_missing
  from (select distinct subject from cambridge_k4_s1) b
  where not exists (select 1 from subjects s where s.name = b.subject);

  if v_missing is not null then
    raise exception 'Mata pelajaran tidak ditemukan di tabel subjects: %', v_missing;
  end if;
end $$;

insert into curriculum_topics (
  curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id
)
select
  'Kurikulum Cambridge', s.id, 'Kelas 4', 1, b.theme, b.topic, b.cp, b.sort_order,
  curriculum_group_id('Kurikulum Cambridge', s.id, 'Kelas 4', 1, b.theme, b.topic)
from cambridge_k4_s1 b
join subjects s on s.name = b.subject
where not exists (
  select 1 from curriculum_topics t
  where t.subject_id = s.id
    and t.curriculum = 'Kurikulum Cambridge'
    and t.grade_level = 'Kelas 4'
    and t.semester = 1
    and coalesce(t.theme, '') = b.theme
    and t.topic = b.topic
);

drop table cambridge_k4_s1;
