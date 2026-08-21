-- ============================================================
-- Kurikulum Kelas 8 Semester 1 — Matematika, IPA
--
-- Sesuai spreadsheet "Kelas 8 Semester 1": satu tab per mata pelajaran,
-- masing-masing 20 pertemuan. Bentuknya mengikuti migrasi 099/100 (Kelas 10 dan
-- Kelas 11): kolom Tema -> `theme`, Topik Pembelajaran -> `topic`, Capaian /
-- Fokus Kegiatan Pembelajaran -> `learning_outcomes`, nomor Pertemuan ->
-- `sort_order`.
--
-- Satu penyesuaian terhadap isi spreadsheet: pada tab Matematika pertemuan
-- 13-15 kolom Tema tertulis "Tema Persamaan dan Pertidaksamaan Linear Satu
-- Variabel: Persamaan dan Pertidaksamaan Linear Satu Variabel", sedangkan
-- pertemuan 12 dengan tema yang sama tertulis singkat. Keduanya dinormalkan ke
-- "Persamaan dan Pertidaksamaan Linear Satu Variabel" supaya keempat pertemuan
-- itu mengelompok jadi satu tema, bukan dua tema yang isinya sama.
--
-- Murni penambahan: tidak ada baris yang dihapus atau ditimpa, jadi tidak ada
-- materi, bank soal, atau sesi yang berisiko terputus. Penjaga `not exists`
-- dipasang supaya migrasi ini aman dijalankan dua kali. group_id diambil lewat
-- curriculum_group_id() (lihat migrasi 060), helper yang sama yang dipakai
-- admin action saat menambah topik dari UI.
-- ============================================================

create temporary table kelas8_s1 (subject text, sort_order int, theme text, topic text, cp text);

-- Tab "Matematika"
insert into kelas8_s1 (subject, sort_order, theme, topic, cp) values
  ('Matematika', 1,  'Bilangan Berpangkat', 'Bilangan Berpangkat Bilangan Bulat',
   'Siswa dapat menalar konsep bilangan berpangkat sebagai perkalian berulang dan menemukan pola sifat-sifat operasi eksponen secara logis.'),
  ('Matematika', 2,  'Bilangan Berpangkat', 'Bilangan Akar',
   'Siswa dapat memvisualisasikan hubungan kebalikan (invers) antara pangkat dan bentuk akar, serta menyederhanakan bentuk akar dasar.'),
  ('Matematika', 3,  'Bilangan Berpangkat', 'Penulisan Bentuk Baku',
   'Siswa dapat menerapkan logika pergeseran nilai tempat untuk menuliskan bilangan yang sangat besar atau sangat kecil ke dalam bentuk baku.'),
  ('Matematika', 4,  'Evaluasi Tema Bilangan Berpangkat', 'Latihan Soal Tema Bilangan Berpangkat',
   'Siswa dapat menyelesaikan asesmen formatif Tema Bilangan Berpangkat dengan memecahkan persoalan yang melibatkan kombinasi operasi bilangan berpangkat dan akar.'),
  ('Matematika', 5,  'Teorema Pythagoras', 'Pengertian Teorema Pythagoras',
   'Siswa dapat membuktikan kebenaran Teorema Pythagoras secara visual atau geometris pada segitiga siku-siku tanpa sekadar menghafal rumus a^2 + b^2 = c^2.'),
  ('Matematika', 6,  'Teorema Pythagoras', 'Tripel Pythagoras',
   'Siswa dapat mengidentifikasi pola kombinasi tiga bilangan bulat pembentuk segitiga siku-siku (Tripel Pythagoras) melalui penalaran kelipatan proporsional.'),
  ('Matematika', 7,  'Teorema Pythagoras', 'Segitiga Istimewa',
   'Siswa dapat menganalisis dan menemukan perbandingan panjang sisi pada segitiga siku-siku istimewa (sudut 30°, 45°, 60°) melalui pemotongan bangun datar persegi dan segitiga sama sisi.'),
  ('Matematika', 8,  'Teorema Pythagoras', 'Penerapan Teorema Pythagoras',
   'Siswa dapat memodelkan masalah spasial dalam kehidupan sehari-hari (seperti jarak terpendek atau tinggi bangunan) dan menyelesaikannya menggunakan konsep Pythagoras.'),
  ('Matematika', 9,  'Evaluasi Tema Teorema Pythagoras', 'Latihan Soal Tema Teorema Pythagoras',
   'Siswa dapat mengerjakan evaluasi Tema Teorema Pythagoras untuk menguji keakuratan perhitungan dan nalar geometri keruangan.'),
  ('Matematika', 10, 'Persiapan ATS', 'Review Materi Tema Bilangan Berpangkat & Tema Teorema Pythagoras',
   'Siswa dapat merangkum dan menghubungkan kembali fondasi eksponensial dan penalaran spasial Pythagoras untuk persiapan ujian.'),
  ('Matematika', 11, 'Persiapan ATS', 'Simulasi Asesmen Tengah Semester (ATS)',
   'Siswa dapat menyelesaikan studi kasus simulasi ATS yang menuntut ketelitian berhitung dan analisis pembuktian geometri.'),
  ('Matematika', 12, 'Persamaan dan Pertidaksamaan Linear Satu Variabel', 'Memahami Konsep Persamaan Linear Satu Variabel',
   'Siswa dapat memahami persamaan linear sebagai analogi "timbangan yang seimbang" (konsep keadilan komputasi) untuk menemukan nilai variabel yang tidak diketahui.'),
  ('Matematika', 13, 'Persamaan dan Pertidaksamaan Linear Satu Variabel', 'Menyelesaikan Persamaan Linear Satu Variabel',
   'Siswa dapat menyelesaikan manipulasi aljabar dengan melakukan operasi yang sama pada kedua ruas secara runtut dan presisi.'),
  ('Matematika', 14, 'Persamaan dan Pertidaksamaan Linear Satu Variabel', 'Menemukan Konsep Pertidaksamaan Linear Satu Variabel',
   'Siswa dapat menalar batasan nilai (rentang kemungkinan) pada pertidaksamaan linear dan merepresentasikannya menggunakan garis bilangan.'),
  ('Matematika', 15, 'Persamaan dan Pertidaksamaan Linear Satu Variabel', 'Menyelesaikan Masalah Terkait Pertidaksamaan Linear Satu Variabel',
   'Siswa dapat menerjemahkan masalah kontekstual ke dalam model matematika pertidaksamaan dan menyelesaikan nilai batasannya secara logis.'),
  ('Matematika', 16, 'Evaluasi Tema Persamaan dan Pertidaksamaan Linear Satu Variabel', 'Latihan Soal Tema Persamaan dan Pertidaksamaan Linear Satu Variabel',
   'Siswa dapat menyelesaikan asesmen formatif Tema Persamaan dan Pertidaksamaan Linear Satu Variabel untuk mengukur kemampuan pemodelan aljabar dan akurasi penyelesaian linier.'),
  ('Matematika', 17, 'Pengayaan', 'Pengayaan Nalar Pemecahan Masalah Aljabar',
   'Siswa dapat memecahkan soal (HOTS) yang memadukan konsep persamaan linier dengan geometri bangun datar.'),
  ('Matematika', 18, 'Pengayaan', 'Pengayaan Terpadu Semester 1',
   'Siswa dapat mengintegrasikan pengetahuan bilangan berpangkat, Pythagoras, dan persamaan linier dalam satu kasus logika kompleks.'),
  ('Matematika', 19, 'Persiapan AAS', 'Review Komprehensif Semester 1',
   'Siswa dapat mengkonsolidasikan seluruh pemahaman fondasi dari Tema Bilangan Berpangkat hingga Tema Persamaan dan Pertidaksamaan Linear Satu Variabel untuk memperkuat memori konseptual jangka panjang.'),
  ('Matematika', 20, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat mengerjakan paket soal simulasi AAS dengan mengedepankan logika analisis penyelesaian dan akurasi nalar kuantitatif.');

-- Tab "IPA"
insert into kelas8_s1 (subject, sort_order, theme, topic, cp) values
  ('IPA', 1,  'Bumi dan Tata Surya', 'Tata Surya',
   'Siswa dapat menganalisis struktur Tata Surya dan menalar interaksi gravitasi yang mempertahankan keteraturan orbit benda-benda langit.'),
  ('IPA', 2,  'Bumi dan Tata Surya', 'Pengaruh Pergerakan Bumi dan Benda Langit',
   'Siswa dapat memvisualisasikan rotasi dan revolusi bumi serta mengevaluasi dampaknya terhadap fenomena alam (siang-malam, musim, fase bulan).'),
  ('IPA', 3,  'Bumi dan Tata Surya', 'Perubahan Iklim Bumi yang Dipengaruhi Benda Langit',
   'Siswa dapat menelaah faktor astronomis yang memengaruhi perubahan iklim di Bumi dan mengaitkannya dengan keberlangsungan kehidupan.'),
  ('IPA', 4,  'Evaluasi Tema Bumi dan Tata Surya', 'Latihan Soal Tema Bumi dan Tata Surya',
   'Siswa dapat menyelesaikan asesmen formatif Tema Bumi dan Tata Surya dengan memecahkan persoalan yang berfokus pada penalaran spasial fenomena astronomi.'),
  ('IPA', 5,  'Sistem Organisasi Kehidupan', 'Sel sebagai Unit Struktural dan Fungsional',
   'Siswa dapat mengidentifikasi sel sebagai blok penyusun dasar kehidupan dan membedakan fungsi organel penyusunnya secara logis.'),
  ('IPA', 6,  'Sistem Organisasi Kehidupan', 'Jaringan pada Tumbuhan dan Hewan',
   'Siswa dapat mengklasifikasikan jenis-jenis jaringan penyusun pada hewan dan tumbuhan serta menghubungkan struktur dengan fungsinya.'),
  ('IPA', 7,  'Sistem Organisasi Kehidupan', 'Organ dan Sistem Organ pada Makhluk Hidup',
   'Siswa dapat menganalisis interaksi antarjaringan yang membentuk organ dan mengevaluasi kolaborasi organ dalam suatu sistem organ.'),
  ('IPA', 8,  'Sistem Organisasi Kehidupan', 'Organisme & Latihan Soal Tema Sistem Organisasi Kehidupan',
   'Siswa dapat menyintesis pemahaman hierarki kehidupan hingga membentuk tingkatan organisme utuh dan menyelesaikan evaluasi Tema Sistem Organisasi Kehidupan.'),
  ('IPA', 9,  'Persiapan ATS', 'Review Analitik Tema Bumi dan Tata Surya & Tema Sistem Organisasi Kehidupan',
   'Siswa dapat merangkum dan menghubungkan konsep makrokosmos (Tata Surya) dengan mikrokosmos (Organisasi Kehidupan) sebagai penguatan nalar persiapan ujian.'),
  ('IPA', 10, 'Persiapan ATS', 'Simulasi Asesmen Tengah Semester (ATS)',
   'Siswa dapat membedah dan menyelesaikan simulasi soal ATS yang menguji literasi sains, analisis data, dan logika penyelesaian masalah.'),
  ('IPA', 11, 'Struktur dan Fungsi Tubuh Makhluk Hidup', 'Sistem Peredaran Darah',
   'Siswa dapat membedah anatomi sistem kardiovaskular dan menganalisis mekanisme peredaran darah dalam menjaga kelangsungan hidup.'),
  ('IPA', 12, 'Struktur dan Fungsi Tubuh Makhluk Hidup', 'Makanan dan Sistem Pencernaan',
   'Siswa dapat mengevaluasi alur pencernaan mekanik dan kimiawi, serta menghubungkan asupan nutrisi dengan fungsi metabolisme tubuh.'),
  ('IPA', 13, 'Struktur dan Fungsi Tubuh Makhluk Hidup', 'Sistem Pernapasan (Sistem Respirasi)',
   'Siswa dapat menalar mekanisme pertukaran gas di dalam tubuh dan menganalisis faktor yang memengaruhi kapasitas pernapasan manusia.'),
  ('IPA', 14, 'Struktur dan Fungsi Tubuh Makhluk Hidup', 'Sistem Ekskresi / Pembuangan',
   'Siswa dapat mengidentifikasi organ pengeluaran (ginjal, kulit, paru-paru, hati) dan menganalisis proses penyaringan zat sisa dari dalam tubuh.'),
  ('IPA', 15, 'Evaluasi Tema Struktur dan Fungsi Tubuh Makhluk Hidup', 'Latihan Soal Tema Struktur dan Fungsi Tubuh Makhluk Hidup',
   'Siswa dapat menyelesaikan asesmen formatif Tema Struktur dan Fungsi Tubuh Makhluk Hidup terkait mekanisme, anatomi, dan gangguan pada fisiologi tubuh makhluk hidup.'),
  ('IPA', 16, 'Pengayaan', 'Studi Kasus Terpadu: Ekologi & Perubahan Iklim',
   'Siswa dapat memecahkan soal (HOTS) yang mengintegrasikan dampak perubahan iklim ekstrim (Tema Bumi dan Tata Surya) terhadap kemampuan adaptasi jaringan dan organisme (Tema Sistem Organisasi Kehidupan).'),
  ('IPA', 17, 'Pengayaan', 'Analisis Penyakit Komplikasi',
   'Siswa dapat menganalisis studi kasus medis sederhana yang melibatkan kegagalan lebih dari satu sistem tubuh sekaligus (misalnya kaitan sistem pencernaan dan peredaran darah pada kasus obesitas).'),
  ('IPA', 18, 'Pengayaan', 'Pemodelan Konseptual (Deep Learning)',
   'Siswa dapat merancang analogi atau model konseptual (misal: analogi pabrik untuk sistem sel, atau model mekanis sistem pernapasan) guna memperkuat retensi memori jangka panjang.'),
  ('IPA', 19, 'Persiapan AAS', 'Review Komprehensif Semester 1',
   'Siswa dapat mengkonsolidasikan fondasi materi dari Tata Surya hingga Struktur Fisiologi Tubuh untuk persiapan Asesmen Akhir Semester.'),
  ('IPA', 20, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat mengerjakan paket soal simulasi AAS dengan mengedepankan nalar saintifik, logika pembuktian, dan literasi data sains.');

-- Berhenti kalau ada mata pelajaran yang tidak ada, daripada diam-diam
-- melewatkan satu tab penuh.
do $$
declare
  v_missing text;
begin
  select string_agg(b.subject, ', ')
    into v_missing
  from (select distinct subject from kelas8_s1) b
  where not exists (select 1 from subjects s where s.name = b.subject);

  if v_missing is not null then
    raise exception 'Mata pelajaran tidak ditemukan di tabel subjects: %', v_missing;
  end if;
end $$;

insert into curriculum_topics (
  curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id
)
select
  'Kurikulum Merdeka', s.id, 'Kelas 8', 1, b.theme, b.topic, b.cp, b.sort_order,
  curriculum_group_id('Kurikulum Merdeka', s.id, 'Kelas 8', 1, b.theme, b.topic)
from kelas8_s1 b
join subjects s on s.name = b.subject
where not exists (
  select 1 from curriculum_topics t
  where t.subject_id = s.id
    and t.curriculum = 'Kurikulum Merdeka'
    and t.grade_level = 'Kelas 8'
    and t.semester = 1
    and coalesce(t.theme, '') = b.theme
    and t.topic = b.topic
);

drop table kelas8_s1;
