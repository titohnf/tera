-- ============================================================
-- Kurikulum Kelas 5 Semester 1 — Matematika, Bahasa Inggris, dan satu blok
-- IPAS kedua
--
-- Dari spreadsheet Kelas 5 yang berisi enam tab; dua tab terakhir masih kosong
-- (hanya nomor pertemuan 1–21 tanpa isi) dan diabaikan. Empat tab sisanya
-- dicocokkan dengan `curriculum_topics` untuk 'Kelas 5' di produksi:
--
--   * Tab IPAS (20 pertemuan, Sistem Organ Gerak sampai Simulasi AAS) — SUDAH
--     ADA seluruhnya, tema dan topiknya persis sama. Tidak ada yang
--     ditambahkan.
--
--   * Tab Matematika (20 pertemuan) — BELUM ADA. Ditambahkan di bawah.
--
--   * Tab Bahasa Inggris (19 pertemuan) — BELUM ADA, dan Kelas 5 sampai hari
--     ini tidak punya satu pun topik Bahasa Inggris. Ditambahkan di bawah.
--
--   * Tab ketiga tanpa nama mapel (19 pertemuan: Geografi & Potensi Alam,
--     Keseimbangan Ekosistem, Siklus Hidrologi, Pubertas, Optik, Akustik) —
--     isinya IPAS, dan atas keputusan pemilik kurikulum dimasukkan sebagai
--     IPAS SEMESTER 1 berdampingan dengan 20 topik yang sudah ada, bukan
--     menggantikannya. Jadi IPAS Kelas 5 semester 1 sengaja memuat dua blok:
--     blok lama (anatomi + geografi + kebudayaan) dan blok ini.
--
-- URUTAN DISAMBUNG, TIDAK DITUMPUK. Matematika Kelas 5 sudah memuat 26 baris
-- CP dari seed 029 (tema Bilangan, Aljabar, Pengukuran, Geometri, Analisis
-- Data) di sort_order 0–25, dan IPAS memakai 1–20. Kalau 20 pertemuan
-- Matematika dan 19 pertemuan IPAS di bawah memakai nomor pertemuannya
-- sendiri, urutan tampilnya berselang-seling dengan yang lama. Karena itu
-- Matematika memakai sort_order 26–45 dan blok IPAS kedua memakai 21–39.
-- Nomor pertemuan aslinya tetap terbaca dari urutan barisnya.
--
-- Baris CP seed 029 tidak disentuh: itu daftar CP resmi dari sumber yang beda,
-- dan `group_id`-nya bisa saja sudah dirujuk materi atau bank soal.
--
-- Murni penambahan, dengan penjaga `not exists` supaya aman dijalankan dua
-- kali. group_id lewat curriculum_group_id() (migrasi 060), sama seperti
-- topik yang diinput admin dari UI.
-- ============================================================

create temporary table kelas5_s1 (subject text, sort_order int, theme text, topic text, cp text);

-- Tab "Matematika" — pertemuan 1–20, digeser ke sort_order 26–45
insert into kelas5_s1 (subject, sort_order, theme, topic, cp) values
  ('Matematika', 26, 'Bilangan', 'Intuisi Bilangan & Nilai Tempat sampai 1.000.000',
   'Siswa dapat menunjukkan pemahaman dan intuisi bilangan (number sense) dengan membaca, menulis, menentukan nilai tempat, serta melakukan komposisi dan dekomposisi bilangan cacah sampai 1.000.000 secara logis.'),
  ('Matematika', 27, 'Bilangan', 'Operasi Hitung sampai 100.000 & Masalah Finansial (Uang)',
   'Siswa dapat menalar operasi penjumlahan, pengurangan, perkalian, dan pembagian bilangan cacah sampai 100.000, serta memecahkan masalah kontekstual yang berkaitan dengan uang.'),
  ('Matematika', 28, 'Bilangan', 'Kelipatan Persekutuan Terkecil (KPK) & Faktor Persekutuan Terbesar (FPB)',
   'Siswa dapat menalar dan menyelesaikan masalah yang berkaitan dengan KPK dan FPB melalui pemahaman visual pembagi bersama, tanpa ketergantungan pada rumus cepat.'),
  ('Matematika', 29, 'Bilangan', 'Konsep, Bentuk, dan Operasi Pecahan Dasar',
   'Siswa dapat membandingkan dan mengurutkan berbagai pecahan (termasuk pecahan campuran), serta mengubah bentuk pecahan ke bentuk lain dengan memvisualisasikan proporsinya.'),
  ('Matematika', 30, 'Bilangan', 'Operasi Hitung Pecahan & Pengenalan Desimal',
   'Siswa dapat melakukan operasi penjumlahan, pengurangan, perkalian, dan pembagian pecahan dengan bilangan asli, serta membandingkan dan mengurutkan bilangan desimal (satu angka di belakang koma).'),
  ('Matematika', 31, 'Evaluasi Bilangan', 'Asesmen Tema Bilangan',
   'Siswa dapat menyelesaikan asesmen formatif untuk mengukur pemahaman fondasi bilangan cacah besar, KPK/FPB, pecahan, dan desimal.'),
  ('Matematika', 32, 'Pengayaan Bilangan', 'Pengayaan Nalar Bilangan',
   'Siswa dapat memecahkan masalah tingkat lanjut (HOTS) yang mengintegrasikan intuisi bilangan besar, manipulasi pecahan, dan logika aritmetika finansial.'),
  ('Matematika', 33, 'Persiapan ATS', 'Review Materi Asesmen Tengah Semester',
   'Siswa dapat merangkum dan mengonstruksi ulang pemahaman konsep utuh dari seluruh materi domain Bilangan.'),
  ('Matematika', 34, 'Persiapan ATS', 'Simulasi Asesmen Tengah Semester (ATS)',
   'Siswa dapat mengerjakan simulasi ATS yang menguji kemampuan bernalar dan memecahkan masalah numerik secara komprehensif.'),
  ('Matematika', 35, 'Aljabar', 'Kalimat Matematika & Nilai yang Belum Diketahui',
   'Siswa dapat menemukan nilai yang belum diketahui dalam kalimat matematika (+, -, x, /) sampai bilangan 1000 dengan menggunakan sifat-sifat bilangan dan operasinya (fondasi pra-aljabar).'),
  ('Matematika', 36, 'Aljabar', 'Pola Bilangan Membesar dan Mengecil',
   'Siswa dapat mengidentifikasi, meniru, dan mengembangkan pola bilangan membesar dan mengecil yang melibatkan operasi perkalian dan pembagian secara intuitif.'),
  ('Matematika', 37, 'Aljabar', 'Rasio Satuan & Proporsi Kehidupan Sehari-hari',
   'Siswa dapat bernalar secara proporsional menggunakan operasi perkalian dan pembagian untuk menyelesaikan masalah sehari-hari yang terkait dengan rasio satuan.'),
  ('Matematika', 38, 'Evaluasi & Pengayaan Aljabar', 'Asesmen & Pengayaan Tema Aljabar',
   'Siswa dapat menyelesaikan kuis formatif dan mengeksplorasi soal pengayaan yang memadukan logika aljabar dasar, penemuan pola, dan penalaran proporsional.'),
  ('Matematika', 39, 'Pengukuran', 'Keliling & Luas Bangun Datar',
   'Siswa dapat menentukan keliling dan luas berbagai bentuk bangun datar (segitiga, segiempat, dan segi banyak) melalui dekomposisi area keruangan, bukan sekadar hafalan rumus.'),
  ('Matematika', 40, 'Pengukuran', 'Keliling & Luas Bangun Gabungan',
   'Siswa dapat menghitung keliling dan luas bangun datar gabungan dengan cara memecah bangun tersebut menjadi kepingan bangun datar penyusunnya.'),
  ('Matematika', 41, 'Pengukuran', 'Pengukuran Durasi Waktu',
   'Siswa dapat menghitung dan menalar durasi waktu lintas jam dan menit untuk menyelesaikan permasalahan jadwal dan garis waktu sehari-hari.'),
  ('Matematika', 42, 'Pengukuran', 'Pengukuran Besar Sudut',
   'Siswa dapat mengukur besar sudut pada bangun datar atau sudut yang dibentuk dari dua garis berpotongan secara presisi.'),
  ('Matematika', 43, 'Evaluasi & Pengayaan Pengukuran', 'Asesmen & Pengayaan Tema Pengukuran',
   'Siswa dapat mengerjakan evaluasi akhir bab dan menyelesaikan tantangan spasial yang mengintegrasikan luas bangun gabungan dan konsep sudut.'),
  ('Matematika', 44, 'Persiapan AAS', 'Review Komprehensif Semester 1',
   'Siswa dapat mereview seluruh materi fondasi dari domain Bilangan, Aljabar, dan Pengukuran sebagai penguatan nalar menjelang ujian akhir semester.'),
  ('Matematika', 45, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat mengerjakan paket simulasi Asesmen Akhir Semester (AAS) dan membedah penyelesaiannya dengan mengedepankan logika matematika.');

-- Tab ketiga (tanpa nama mapel) — blok IPAS kedua, pertemuan 1–19,
-- digeser ke sort_order 21–39 supaya menyambung setelah blok IPAS yang ada
insert into kelas5_s1 (subject, sort_order, theme, topic, cp) values
  ('IPAS', 21, 'Geografi & Potensi Alam', 'Pemetaan Wilayah dan Karakteristik Negara Maritim-Agraris',
   'Siswa dapat menganalisis letak geografis Indonesia, mengidentifikasi pembagian wilayah daratan dan perairan, serta menalar potensinya sebagai negara maritim dan agraris.'),
  ('IPAS', 22, 'Dinamika Ekonomi Daerah', 'Pemenuhan Kebutuhan & Kegiatan Ekonomi',
   'Siswa dapat mengklasifikasikan jenis-jenis kebutuhan manusia dan menganalisis ragam kegiatan ekonomi di lingkungan sekitarnya.'),
  ('IPAS', 23, 'Literasi Finansial Dasar', 'Menjadi Pelaku Ekonomi yang Bijak',
   'Siswa dapat mengevaluasi peran berbagai pelaku ekonomi dan menerapkan sikap bijak dalam pengambilan keputusan finansial sehari-hari.'),
  ('IPAS', 24, 'Keseimbangan Ekosistem', 'Komponen dan Interaksi Ekosistem',
   'Siswa dapat membedakan komponen biotik dan abiotik serta menelaah pola interaksi antar makhluk hidup dalam suatu ekosistem.'),
  ('IPAS', 25, 'Keseimbangan Ekosistem', 'Peran Manusia dalam Kelestarian Alam',
   'Siswa dapat membedah dampak aktivitas manusia terhadap lingkungan dan merumuskan solusi menjaga harmoni alam.'),
  ('IPAS', 26, 'Siklus Hidrologi', 'Tahapan dan Proses Siklus Air',
   'Siswa dapat memodelkan tahapan terjadinya siklus air di alam dan memahami arah aliran air permukaan.'),
  ('IPAS', 27, 'Pelestarian Lingkungan', 'Menjaga Ketersediaan Air Bersih',
   'Siswa dapat menganalisis penyebab krisis air bersih dan merancang tindakan nyata pelestarian sumber air di lingkungan sekitar.'),
  ('IPAS', 28, 'Persiapan ATS', 'Review Geografi, Ekonomi, Ekosistem, dan Air',
   'Siswa dapat menyintesis keterkaitan antara kondisi geografis, aktivitas ekonomi manusia, dan dampaknya terhadap ekosistem.'),
  ('IPAS', 29, 'Evaluasi Tengah Semester', 'Simulasi Asesmen Tengah Semester (ATS)',
   'Siswa dapat memecahkan soal literasi sains dan sosial dari materi paruh pertama semester menggunakan nalar logis.'),
  ('IPAS', 30, 'Sejarah Lokal', 'Menelusuri Masa Lalu Daerah',
   'Siswa dapat mengidentifikasi tokoh, peristiwa, dan peninggalan sejarah yang membentuk identitas daerah tempat tinggalnya.'),
  ('IPAS', 31, 'Warisan Kebudayaan', 'Kekayaan Budaya Daerah',
   'Siswa dapat mengevaluasi ragam warisan budaya lokal dan menalar urgensi pelestariannya untuk kemajuan daerah.'),
  ('IPAS', 32, 'Biologi dan Pubertas', 'Persiapan Menghadapi Masa Puber',
   'Siswa dapat mengenali perubahan fisik dan emosional pada masa pubertas secara saintifik dan objektif.'),
  ('IPAS', 33, 'Kesehatan Reproduksi', 'Menjaga Kesehatan Fisik, Pikiran, dan Privasi',
   'Siswa dapat menerapkan prinsip kebersihan reproduksi, menjaga kesehatan mental, serta memahami batasan privasi tubuh.'),
  ('IPAS', 34, 'Optik Dasar', 'Sifat Perambatan Cahaya dan Penglihatan',
   'Siswa dapat membuktikan sifat perambatan cahaya secara logis dan menghubungkannya dengan cara kerja indera penglihatan manusia.'),
  ('IPAS', 35, 'Optik Dasar', 'Pembentukan Bayangan dan Spektrum Warna',
   'Siswa dapat menganalisis proses pembentukan bayangan benda dan menguraikan cahaya putih menjadi spektrum warna.'),
  ('IPAS', 36, 'Akustik Dasar', 'Sifat Perambatan Bunyi dan Pendengaran',
   'Siswa dapat mengidentifikasi media perambatan gelombang bunyi dan cara telinga merespons getaran.'),
  ('IPAS', 37, 'Akustik Dasar', 'Pemantulan dan Peredaman Bunyi',
   'Siswa dapat membedakan material yang berfungsi sebagai pemantul dan peredam bunyi melalui observasi fisik.'),
  ('IPAS', 38, 'Persiapan AAS', 'Review Sejarah, Pubertas, Cahaya, dan Bunyi',
   'Siswa dapat mengonsolidasikan pemahaman terkait fenomena fisika dasar, biologi manusia, dan sejarah sosial daerah.'),
  ('IPAS', 39, 'Evaluasi Akhir Semester', 'Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat menyelesaikan simulasi evaluasi akhir dengan mengedepankan nalar pemecahan masalah dan analisis fenomena sehari-hari.');

-- Tab "Bahasa Inggris" — pertemuan 1–19; Kelas 5 belum punya topik Bahasa
-- Inggris sama sekali, jadi nomor pertemuan dipakai apa adanya
insert into kelas5_s1 (subject, sort_order, theme, topic, cp) values
  ('Bahasa Inggris', 1,  'Nouns (Kata Benda)', 'Countable and Uncountable Nouns',
   'Siswa dapat membedakan dan mengelompokkan kata benda yang dapat dihitung (countable) dan tidak dapat dihitung (uncountable).'),
  ('Bahasa Inggris', 2,  'Quantifiers (Takaran/Jumlah)', 'Using Quantifiers',
   'Siswa dapat menyatakan takaran benda menggunakan quantifiers yang tepat, seperti a bowl of, a basket of, atau a spoonful of.'),
  ('Bahasa Inggris', 3,  'Asking Quantity (Menanyakan Jumlah)', 'How many & How much',
   'Siswa dapat menyusun pertanyaan kuantitas secara tepat menggunakan pola kalimat How many... dan How much....'),
  ('Bahasa Inggris', 4,  'Prepositions of Place (Kata Depan Letak)', 'Posisi Benda di Sekitar',
   'Siswa dapat mendeskripsikan letak benda menggunakan preposisi in, on, at, under, beside/next to, behind, above, between.'),
  ('Bahasa Inggris', 5,  'Sequence Words (Kata Urutan)', 'Tahapan Aktivitas',
   'Siswa dapat mengurutkan tahapan suatu kegiatan secara logis menggunakan sequence words seperti first, next, then, after that, finally, in the end.'),
  ('Bahasa Inggris', 6,  'Procedural Sentences (Kalimat Instruksi)', 'Menulis Langkah-langkah',
   'Siswa dapat menuliskan kalimat instruksi langkah demi langkah secara runtut (misal: First, cut the shallots with a knife).'),
  ('Bahasa Inggris', 7,  'Directions & Public Places (Petunjuk Arah & Tempat Umum)', 'Prepositions for Direction & Place',
   'Siswa dapat memberikan/merespons petunjuk arah jalan dasar serta mendeskripsikan lokasi bangunan publik dalam denah/peta menggunakan preposisi seperti turn left, walk straight, across from, dan in front of.'),
  ('Bahasa Inggris', 8,  'Review ATS', 'Penguatan Materi Paruh Pertama',
   'Siswa dapat mengonsolidasikan pemahaman terkait quantifiers, preposisi letak benda/arah, dan kata urutan waktu.'),
  ('Bahasa Inggris', 9,  'Evaluasi ATS', 'Simulasi Asesmen Tengah Semester',
   'Siswa dapat memecahkan soal evaluasi simulasi ATS yang berfokus pada materi grammar paruh pertama semester.'),
  ('Bahasa Inggris', 10, 'Adjectives (Kata Sifat)', 'Describing Objects',
   'Siswa dapat mendeskripsikan penampilan suatu barang menggunakan kata sifat umum (seperti pretty dan beautiful).'),
  ('Bahasa Inggris', 11, 'Adjectives (Kata Sifat)', 'Expensive vs. Cheap',
   'Siswa dapat membandingkan nilai atau harga barang menggunakan kata sifat expensive (mahal) dan cheap (murah).'),
  ('Bahasa Inggris', 12, 'Imperative Sentences (Kalimat Perintah)', 'Positive Imperatives',
   'Siswa dapat memahami dan mempraktikkan kalimat perintah atau instruksi positif secara langsung, seperti Put the books back on the shelf.'),
  ('Bahasa Inggris', 13, 'Imperative Sentences (Kalimat Larangan)', 'Negative Imperatives',
   'Siswa dapat memahami dan merumuskan kalimat larangan di ruang publik, seperti Be quiet dan Do not run.'),
  ('Bahasa Inggris', 14, 'Past Tense (Kejadian Masa Lampau)', 'Introduction to Past Tense',
   'Siswa dapat mengenali struktur dasar kalimat Past Tense untuk menceritakan kejadian yang sudah berlalu.'),
  ('Bahasa Inggris', 15, 'Past Tense Verbs', 'Regular Verbs',
   'Siswa dapat mengidentifikasi dan menyusun kalimat menggunakan kata kerja beraturan (seperti asked, studied, agreed, worked).'),
  ('Bahasa Inggris', 16, 'Past Tense Verbs', 'Irregular Verbs',
   'Siswa dapat menghafal dan menggunakan kata kerja tidak beraturan (seperti was/were, know/knew, write/wrote, eat/ate).'),
  ('Bahasa Inggris', 17, 'Storytelling (Bercerita)', 'Retelling a Story',
   'Siswa dapat menerapkan penggunaan regular dan irregular verbs secara utuh untuk menceritakan kembali sebuah cerita pendek.'),
  ('Bahasa Inggris', 18, 'Review AAS', 'Penguatan Materi Paruh Kedua',
   'Siswa dapat mengulang kaji materi adjectives, imperative sentences, dan past tense sebagai penguatan persiapan ujian akhir.'),
  ('Bahasa Inggris', 19, 'Evaluasi AAS', 'Simulasi Asesmen Akhir Semester',
   'Siswa dapat mengerjakan dan membahas paket simulasi soal AAS untuk mengukur penguasaan aspek tata bahasa secara komprehensif.');

-- Berhenti kalau ada mata pelajaran yang tidak ada, daripada diam-diam
-- melewatkan satu tab penuh.
do $$
declare
  v_missing text;
begin
  select string_agg(b.subject, ', ')
    into v_missing
  from (select distinct subject from kelas5_s1) b
  where not exists (select 1 from subjects s where s.name = b.subject);

  if v_missing is not null then
    raise exception 'Mata pelajaran tidak ditemukan di tabel subjects: %', v_missing;
  end if;
end $$;

insert into curriculum_topics (
  curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id
)
select
  'Kurikulum Merdeka', s.id, 'Kelas 5', 1, b.theme, b.topic, b.cp, b.sort_order,
  curriculum_group_id('Kurikulum Merdeka', s.id, 'Kelas 5', 1, b.theme, b.topic)
from kelas5_s1 b
join subjects s on s.name = b.subject
where not exists (
  select 1 from curriculum_topics t
  where t.subject_id = s.id
    and t.curriculum = 'Kurikulum Merdeka'
    and t.grade_level = 'Kelas 5'
    and t.semester = 1
    and coalesce(t.theme, '') = b.theme
    and t.topic = b.topic
);

drop table kelas5_s1;
