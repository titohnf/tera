-- ============================================================
-- Kurikulum Kelas 10 Semester 1 — Matematika, Kimia, Fisika
--
-- Kelas 10 sebelumnya sama sekali kosong di curriculum_topics (nol baris untuk
-- grade_level 'Kelas 10'), jadi migrasi ini murni penambahan sesuai spreadsheet
-- "Kelas 10 Semester 1": satu tab per mata pelajaran — Matematika 20 pertemuan,
-- Kimia 10 pertemuan, Fisika 10 pertemuan.
--
-- Tab Kimia memberi nama kolomnya "Kategori", bukan "Tema" seperti dua tab
-- lain; isinya sama-sama pengelompokan pertemuan, jadi tetap masuk ke kolom
-- `theme`.
--
-- Tidak ada yang dihapus atau ditimpa, jadi tidak ada materi, bank soal, atau
-- sesi yang berisiko terputus. Penjaga `not exists` dipasang supaya migrasi ini
-- aman dijalankan dua kali. group_id diambil lewat curriculum_group_id(),
-- helper yang sama yang dipakai admin action saat menambah topik dari UI
-- (lihat migrasi 060), supaya topik hasil migrasi ini tidak berbeda bentuk
-- dengan yang diinput manual.
-- ============================================================

create temporary table kelas10_s1 (subject text, sort_order int, theme text, topic text, cp text);

-- Tab "Matematika"
insert into kelas10_s1 (subject, sort_order, theme, topic, cp) values
  ('Matematika', 1,  'Eksponen dan Logaritma', 'Bilangan Pangkat (Eksponen)',
   'Siswa dapat menalar sifat-sifat operasi eksponen melalui pembuktian pola perkalian berulang dan menggunakannya untuk menyederhanakan ekspresi aljabar.'),
  ('Matematika', 2,  'Eksponen dan Logaritma', 'Bentuk Akar & Merasionalkan Penyebut',
   'Siswa dapat memvisualisasikan hubungan antara pangkat pecahan dengan bentuk akar, serta menganalisis logika matematis di balik proses merasionalkan penyebut.'),
  ('Matematika', 3,  'Eksponen dan Logaritma', 'Konsep Dasar Logaritma',
   'Siswa dapat membangun intuisi bahwa logaritma adalah inversi dari eksponen, serta mampu menerjemahkan bentuk pangkat ke dalam bentuk logaritma dan sebaliknya.'),
  ('Matematika', 4,  'Eksponen dan Logaritma', 'Sifat-sifat Logaritma',
   'Siswa dapat menerapkan sifat-sifat logaritma untuk menyelesaikan manipulasi aljabar tingkat lanjut dengan nalar matematis tanpa sekadar menghafal rumus.'),
  ('Matematika', 5,  'Evaluasi & Pengayaan', 'Evaluasi Eksponen dan Logaritma & Pengayaan',
   'Siswa dapat menyelesaikan asesmen formatif Eksponen dan Logaritma dan memecahkan soal literasi sains (seperti peluruhan radioaktif atau skala Richter) yang memanfaatkan fungsi eksponensial.'),
  ('Matematika', 6,  'Barisan dan Deret', 'Barisan dan Deret Aritmetika',
   'Siswa dapat mengidentifikasi pola penambahan yang konstan (beda) pada suatu barisan dan mendeduksi rumus umum suku ke-n serta jumlah deretnya secara logis.'),
  ('Matematika', 7,  'Barisan dan Deret', 'Barisan dan Deret Geometri',
   'Siswa dapat menalar pola perkalian yang konstan (rasio) dan mengevaluasi perilaku deret geometri, termasuk deret geometri tak hingga pada kasus faktual.'),
  ('Matematika', 8,  'Barisan dan Deret', 'Bunga Majemuk',
   'Siswa dapat memodelkan situasi finansial nyata ke dalam bentuk deret geometri untuk menghitung pertumbuhan nilai uang (bunga majemuk).'),
  ('Matematika', 9,  'Evaluasi & Pengayaan', 'Evaluasi Barisan dan Deret & Pengayaan',
   'Siswa dapat menyelesaikan kuis formatif dan memecahkan masalah kontekstual yang menguji kemampuan menalar proporsi pola bilangan linier maupun eksponensial.'),
  ('Matematika', 10, 'Persiapan ATS', 'Review Fondasi Materi Eksponen dan Logaritma & 2',
   'Siswa dapat merangkum dan menghubungkan kembali fondasi konsep eksponensial, logaritma, dan deret secara komprehensif.'),
  ('Matematika', 11, 'Persiapan ATS', 'Simulasi Asesmen Tengah Semester (ATS)',
   'Siswa dapat mengerjakan simulasi ujian dengan fokus pada penyelesaian soal yang menuntut nalar dan pemecahan masalah (problem solving).'),
  ('Matematika', 12, 'Sistem Persamaan Linear', 'Sistem Persamaan Linear Dua Variabel (SPLDV)',
   'Siswa dapat memodelkan permasalahan kontekstual ke dalam SPLDV dan menyelesaikannya menggunakan logika substitusi atau eliminasi secara bermakna.'),
  ('Matematika', 13, 'Sistem Persamaan Linear', 'Sistem Persamaan Linear Tiga Variabel (SPLTV) - Konsep',
   'Siswa dapat mengekspansi nalar penyelesaian dua variabel untuk memecahkan sistem dengan tiga variabel secara terstruktur dan efisien.'),
  ('Matematika', 14, 'Sistem Persamaan Linear', 'Pemecahan Masalah SPLTV',
   'Siswa dapat menganalisis dan memecahkan soal cerita literasi matematis kompleks yang melibatkan komposisi tiga elemen atau variabel yang saling bergantung.'),
  ('Matematika', 15, 'Sistem Persamaan Linear', 'Sistem Pertidaksamaan Linear Dua Variabel (SPtLDV)',
   'Siswa dapat menerjemahkan batasan/kendala (constraints) ke dalam bentuk pertidaksamaan linier dan merepresentasikannya pada bidang koordinat.'),
  ('Matematika', 16, 'Sistem Persamaan Linear', 'Grafik Daerah Penyelesaian SPtLDV',
   'Siswa dapat memvisualisasikan irisan daerah penyelesaian dari beberapa pertidaksamaan secara akurat tanpa sekadar bergantung pada hafalan uji titik.'),
  ('Matematika', 17, 'Evaluasi Sistem Persamaan Linear', 'Evaluasi Sistem Persamaan Linear',
   'Siswa dapat menyelesaikan asesmen formatif untuk mengukur kemampuan pemodelan aljabar linier dan representasi grafis pertidaksamaan.'),
  ('Matematika', 18, 'Pengayaan TKA / Lanjut', 'Pengayaan Terpadu Semester 1',
   'Siswa dapat membedah soal-soal tipe ujian masuk perguruan tinggi (TKA/UTBK) yang mengintegrasikan pemahaman logaritma, deret, dan aljabar linier secara bersamaan.'),
  ('Matematika', 19, 'Persiapan AAS', 'Review Komprehensif Semester 1',
   'Siswa dapat mengkonsolidasikan seluruh pemahaman fondasi dan nalar matematika dari Eksponen dan Logaritma hingga Sistem Persamaan Linear untuk persiapan ujian akhir.'),
  ('Matematika', 20, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat mengerjakan dan mendiskusikan paket soal simulasi AAS dengan mengedepankan logika pembuktian dan akurasi komputasi.');

-- Tab "Kimia"
insert into kelas10_s1 (subject, sort_order, theme, topic, cp) values
  ('Kimia', 1,  'Pendahuluan Ilmu Kimia', 'Ilmu Kimia, Peranannya, dan Keselamatan Kerja',
   'Siswa dapat menalar peran ilmu kimia dalam kehidupan sehari-hari dan merancang prosedur keselamatan kerja di laboratorium secara tepat berdasarkan teks literasi manual laboratorium.'),
  ('Kimia', 2,  'Pendahuluan Ilmu Kimia', 'Gerakan Kimia Hijau, Pemanasan Global, & Nanoteknologi',
   'Siswa dapat menganalisis isu pemanasan global melalui prinsip Kimia Hijau (Green Chemistry) serta mengevaluasi peran nanoteknologi dari artikel sains populer.'),
  ('Kimia', 3,  'Evaluasi & Persiapan ATS', 'Asesmen Pendahuluan Ilmu Kimia & Persiapan ATS',
   'Siswa dapat menyelesaikan evaluasi formatif Pendahuluan Ilmu Kimia dan menyimulasikan pengerjaan soal Asesmen Tengah Semester (ATS) yang berfokus pada analisis studi kasus lingkungan.'),
  ('Kimia', 4,  'Struktur Atom', 'Partikel Sub-Atomik, Isotop, Isoton, dan Isobar',
   'Siswa dapat membedakan partikel penyusun atom (proton, elektron, neutron) serta menganalisis perbandingan jumlah partikel pada isotop, isoton, dan isobar secara logis.'),
  ('Kimia', 5,  'Struktur Atom', 'Konfigurasi Elektron Dasar',
   'Siswa dapat menyusun konfigurasi elektron dasar (model kulit) dan menganalisis pola pengisian kulit atom sebagai representasi tingkat kestabilan unsur.'),
  ('Kimia', 6,  'Struktur Atom', 'Perkembangan Model Atom & Konfigurasi Elektron Mekanika Kuantum',
   'Siswa dapat menganalisis sejarah perkembangan teori atom sebagai landasan untuk menalar bilangan kuantum dan menyusun konfigurasi elektron mekanika kuantum yang lebih kompleks.'),
  ('Kimia', 7,  'Struktur Atom', 'Sifat Periodik Unsur',
   'Siswa dapat memvisualisasikan struktur atom untuk membedah tren sifat periodik unsur (seperti jari-jari atom, energi ionisasi, afinitas, dan keelektronegatifan) dari analisis tabel periodik.'),
  ('Kimia', 8,  'Evaluasi & Pengayaan', 'Asesmen Struktur Atom & Pengayaan Terpadu',
   'Siswa dapat menyelesaikan kuis formatif Struktur Atom dan memecahkan soal pengayaan (AKM) yang menguji kemampuan menghubungkan konfigurasi elektron dengan sifat fisika/kimia unsur.'),
  ('Kimia', 9,  'Persiapan AAS', 'Review Komprehensif Semester 1',
   'Siswa dapat menyintesis kembali seluruh konsep hakikat kimia, gerakan kimia hijau, hingga mekanika kuantum atom untuk memperkuat memori konseptual jangka panjang.'),
  ('Kimia', 10, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat mengerjakan paket soal simulasi AAS untuk mengukur kemampuan literasi sains dan logika analitis sebelum menghadapi ujian akhir semester.');

-- Tab "Fisika"
insert into kelas10_s1 (subject, sort_order, theme, topic, cp) values
  ('Fisika', 1,  'Hakikat Fisika, Besaran, Satuan dan Dimensi', 'Hakikat Fisika, Metode Ilmiah, & Keselamatan Kerja',
   'Siswa dapat menalar hakikat fenomena alam melalui kacamata fisika, menyusun kerangka berpikir metode ilmiah secara logis, serta merancang prosedur keselamatan laboratorium.'),
  ('Fisika', 2,  'Hakikat Fisika, Besaran, Satuan dan Dimensi', 'Besaran, Satuan, dan Dimensi',
   'Siswa dapat mengonstruksi pemahaman terkait besaran turunan dan menggunakan analisis dimensi untuk membuktikan kebenaran suatu persamaan fisika tanpa sekadar menghafalnya.'),
  ('Fisika', 3,  'Evaluasi & Pengayaan', 'Asesmen Hakikat Fisika, Besaran, Satuan dan Dimensi & Pengayaan Nalar Saintifik',
   'Siswa dapat menyelesaikan kuis formatif Hakikat Fisika, Besaran, Satuan dan Dimensi dan memecahkan soal literasi pengayaan terkait penerapan metode ilmiah pada kasus riil di kehidupan sehari-hari.'),
  ('Fisika', 4,  'Persiapan ATS', 'Review Materi & Simulasi ATS (Hakikat Fisika, Besaran, Satuan dan Dimensi)',
   'Siswa dapat merangkum kembali fondasi pemodelan ilmiah dan menyelesaikan simulasi Asesmen Tengah Semester (ATS) yang berfokus pada logika fisika dasar.'),
  ('Fisika', 5,  'Notasi Ilmiah dan Pengukuran Alat Ukur', 'Konversi Satuan, Angka Penting, & Notasi Ilmiah',
   'Siswa dapat menerapkan aturan angka penting dan notasi ilmiah secara presisi untuk merepresentasikan dan mengonversi data hasil pengamatan saintifik.'),
  ('Fisika', 6,  'Notasi Ilmiah dan Pengukuran Alat Ukur', 'Pengukuran Alat Ukur',
   'Siswa dapat memvisualisasikan cara kerja dan membaca skala presisi pada alat ukur (seperti jangka sorong dan mikrometer sekrup) melalui pemahaman logis prinsip kerja alat.'),
  ('Fisika', 7,  'Notasi Ilmiah dan Pengukuran Alat Ukur', 'Kesalahan pada Hasil Pengukuran',
   'Siswa dapat menganalisis jenis-jenis kesalahan (ketidakpastian) dalam pengukuran dan menalar bagaimana dampaknya terhadap validitas suatu eksperimen fisika.'),
  ('Fisika', 8,  'Evaluasi & Pengayaan', 'Asesmen Notasi Ilmiah dan Pengukuran Alat Ukur & Pengayaan Analisis Data',
   'Siswa dapat menyelesaikan evaluasi formatif Notasi Ilmiah dan Pengukuran Alat Ukur serta membedah studi kasus pengayaan mengenai cara menekan persentase kesalahan relatif dalam sebuah penelitian.'),
  ('Fisika', 9,  'Persiapan AAS', 'Review Komprehensif Semester 1',
   'Siswa dapat menyintesis kembali korelasi antara dimensi besaran (Hakikat Fisika, Besaran, Satuan dan Dimensi) dengan ketelitian pengukuran eksperimental (Notasi Ilmiah dan Pengukuran Alat Ukur) sebagai penguatan nalar konseptual.'),
  ('Fisika', 10, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat membedah dan menyelesaikan paket soal simulasi AAS dengan mengedepankan logika pembuktian, keakuratan angka penting, dan pemecahan masalah saintifik.');

-- Berhenti kalau ada mata pelajaran yang tidak ada, daripada diam-diam
-- melewatkan satu tab penuh.
do $$
declare
  v_missing text;
begin
  select string_agg(b.subject, ', ')
    into v_missing
  from (select distinct subject from kelas10_s1) b
  where not exists (select 1 from subjects s where s.name = b.subject);

  if v_missing is not null then
    raise exception 'Mata pelajaran tidak ditemukan di tabel subjects: %', v_missing;
  end if;
end $$;

insert into curriculum_topics (
  curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id
)
select
  'Kurikulum Merdeka', s.id, 'Kelas 10', 1, b.theme, b.topic, b.cp, b.sort_order,
  curriculum_group_id('Kurikulum Merdeka', s.id, 'Kelas 10', 1, b.theme, b.topic)
from kelas10_s1 b
join subjects s on s.name = b.subject
where not exists (
  select 1 from curriculum_topics t
  where t.subject_id = s.id
    and t.curriculum = 'Kurikulum Merdeka'
    and t.grade_level = 'Kelas 10'
    and t.semester = 1
    and coalesce(t.theme, '') = b.theme
    and t.topic = b.topic
);

drop table kelas10_s1;
