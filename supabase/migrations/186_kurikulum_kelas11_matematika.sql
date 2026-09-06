-- ============================================================
-- Kurikulum Kelas 11 Semester 1 — Matematika (Barisan/Deret, Fungsi,
-- Matematika Keuangan)
--
-- Dari spreadsheet Kelas 11 yang berisi empat tab. Dicocokkan satu per satu
-- dengan isi `curriculum_topics` untuk 'Kelas 11' di produksi, dan hasilnya:
--
--   * Bahasa Inggris (14 pertemuan) — SUDAH ADA seluruhnya, tema dan topiknya
--     persis sama. Tidak ada yang ditambahkan.
--
--   * Ekonomi — tab ini memuat dua blok. Blok kedua, yang di spreadsheet
--     diberi baris pemisah 'Tambahan' dan berisi 20 pertemuan, SUDAH ADA
--     seluruhnya di basis data. Blok pertama (11 pertemuan) adalah versi
--     ringkas dari materi yang sama: satu pertemuan blok pertama memampatkan
--     dua sampai empat pertemuan blok kedua ('Konsep Pendapatan Nasional &
--     Pendapatan Per Kapita' = pertemuan 2 dan 3, 'Kemiskinan, Kesenjangan,
--     Solusi, & Ekonomi Digital' = pertemuan 7, 8, dan 9). Blok itu sengaja
--     TIDAK dimasukkan: judul tema dan topiknya berbeda, jadi
--     curriculum_group_id() akan melahirkan 11 topik baru yang isinya sudah
--     diajarkan oleh 20 topik yang ada — bukan memperbarui yang lama,
--     melainkan menggandakan kurikulum Ekonomi Kelas 11 dalam dua versi.
--
--   * Matematika (21 pertemuan) — BELUM ADA. Inilah satu-satunya isi migrasi
--     ini.
--
-- CATATAN TENTANG 17 TOPIK MATEMATIKA KELAS 11 YANG SUDAH ADA. Basis data
-- sudah memuat 17 topik Matematika Kelas 11 semester 1 (sort_order 1–17):
-- Penjumlahan Dasar, Porogapit, Pecahan Senilai, sampai Perhitungan Proporsi
-- Numerik. Itu tab keempat spreadsheet — daftar keterampilan berhitung dasar,
-- bukan kurikulum kelas 11 — yang rupanya pernah diinput lewat Admin ->
-- Kurikulum ke jenjang ini. Migrasi ini tidak menyentuhnya: memindahkan atau
-- menghapusnya adalah keputusan kurikulum tersendiri, dan `group_id` ke-17
-- topik itu bisa saja sudah dirujuk materi atau bank soal.
--
-- Karena itu 21 pertemuan di bawah memakai sort_order 18–38, menyambung
-- setelahnya, bukan 1–21 yang akan bertumpuk urutannya dengan yang lama.
--
-- Murni penambahan, dengan penjaga `not exists` supaya aman dijalankan dua
-- kali. group_id lewat curriculum_group_id() (migrasi 060), sama seperti
-- topik yang diinput admin dari UI.
-- ============================================================

create temporary table kelas11_s1 (subject text, sort_order int, theme text, topic text, cp text);

-- Tab "Matematika" — pertemuan 1–21, digeser ke sort_order 18–38
insert into kelas11_s1 (subject, sort_order, theme, topic, cp) values
  ('Matematika', 18, 'Barisan dan Deret', 'Konsep Dasar Barisan dan Deret',
   'Siswa dapat menalar pola keteraturan bilangan dan memahami konsep dasar pembentukan suatu barisan serta deret.'),
  ('Matematika', 19, 'Barisan dan Deret', 'Barisan dan Deret Aritmetika',
   'Siswa dapat menganalisis pola penambahan yang konstan serta menentukan rumus suku ke-n dan jumlah deret aritmetika.'),
  ('Matematika', 20, 'Barisan dan Deret', 'Barisan dan Deret Geometri',
   'Siswa dapat membedakan pola perkalian rasio yang konstan serta menghitung nilai suku ke-n dan deret geometri.'),
  ('Matematika', 21, 'Barisan dan Deret', 'Masalah yang Melibatkan Barisan dan Deret',
   'Siswa dapat memecahkan masalah kontekstual sehari-hari yang menggunakan pemodelan barisan dan deret.'),
  ('Matematika', 22, 'Evaluasi Bab 1', 'Asesmen Sumatif Bab 1',
   'Siswa dapat menyelesaikan asesmen formatif untuk mengukur penguasaan materi pola bilangan, aritmetika, dan geometri.'),
  ('Matematika', 23, 'Persiapan ATS', 'Review Materi Barisan dan Deret',
   'Siswa dapat mengonsolidasikan pemahaman terkait pola bilangan dan deret sebagai persiapan menghadapi ujian tengah semester.'),
  ('Matematika', 24, 'Persiapan ATS', 'Simulasi Asesmen Tengah Semester (ATS)',
   'Siswa dapat mengerjakan paket soal simulasi ATS untuk melatih ketelitian dan penalaran analitis paruh pertama semester.'),
  ('Matematika', 25, 'Fungsi Invers dan Komposisi', 'Sifat-Sifat Fungsi',
   'Siswa dapat mengidentifikasi domain, kodomain, range, serta sifat-sifat khusus dari suatu fungsi.'),
  ('Matematika', 26, 'Fungsi Invers dan Komposisi', 'Operasi Aljabar Fungsi',
   'Siswa dapat melakukan operasi hitung penjumlahan, pengurangan, perkalian, dan pembagian pada fungsi aljabar.'),
  ('Matematika', 27, 'Fungsi Invers dan Komposisi', 'Fungsi Invers',
   'Siswa dapat menentukan rumus fungsi kebalikan (invers) melalui manipulasi aljabar secara runtut.'),
  ('Matematika', 28, 'Fungsi Invers dan Komposisi', 'Fungsi Komposisi',
   'Siswa dapat menyusun komposisi dua fungsi atau lebih untuk menghasilkan bentuk fungsi baru.'),
  ('Matematika', 29, 'Fungsi Invers dan Komposisi', 'Menyelesaikan Masalah yang Melibatkan Operasi Invers dan Komposisi Fungsi',
   'Siswa dapat memecahkan persoalan kontekstual yang memadukan konsep fungsi invers dan komposisi fungsi.'),
  ('Matematika', 30, 'Evaluasi Bab 2', 'Asesmen Sumatif Bab 2',
   'Siswa dapat menyelesaikan asesmen formatif untuk mengevaluasi pemahaman menyeluruh mengenai fungsi invers dan komposisi.'),
  ('Matematika', 31, 'Matematika Keuangan', 'Konsep Bunga Majemuk pada Investasi',
   'Siswa dapat memodelkan pertumbuhan nilai investasi menggunakan konsep deret eksponensial dalam sistem bunga majemuk.'),
  ('Matematika', 32, 'Matematika Keuangan', 'Pinjaman dengan Bunga Majemuk',
   'Siswa dapat memecahkan masalah kontekstual terkait perhitungan nilai akhir dan nilai tunai pada skema pinjaman bunga majemuk.'),
  ('Matematika', 33, 'Matematika Keuangan', 'Konsep Dasar Anuitas',
   'Siswa dapat menalar prinsip anuitas sebagai sistem pembayaran cicilan berkala yang melibatkan komponen bunga dan pokok.'),
  ('Matematika', 34, 'Matematika Keuangan', 'Menghitung Nilai Anuitas',
   'Siswa dapat menghitung besar cicilan anuitas secara presisi berdasarkan suku bunga dan jangka waktu pinjaman.'),
  ('Matematika', 35, 'Matematika Keuangan', 'Tabel Pelunasan Anuitas',
   'Siswa dapat menyusun rincian tabel pelunasan berkala untuk memisahkan porsi angsuran pokok dan beban bunga pinjaman.'),
  ('Matematika', 36, 'Evaluasi Keuangan', 'Studi Kasus Literasi Finansial',
   'Siswa dapat memecahkan persoalan finansial komprehensif yang menggabungkan skenario investasi majemuk dan kredit anuitas.'),
  ('Matematika', 37, 'Persiapan AAS', 'Review Komprehensif Semester 1',
   'Siswa dapat menyintesis kembali konsep barisan/deret, fungsi, dan matematika keuangan sebagai penguatan memori jangka panjang.'),
  ('Matematika', 38, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat mengerjakan dan membahas paket soal simulasi AAS dengan mengedepankan logika analisis kuantitatif.');

-- Berhenti kalau ada mata pelajaran yang tidak ada, daripada diam-diam
-- melewatkan satu tab penuh.
do $$
declare
  v_missing text;
begin
  select string_agg(b.subject, ', ')
    into v_missing
  from (select distinct subject from kelas11_s1) b
  where not exists (select 1 from subjects s where s.name = b.subject);

  if v_missing is not null then
    raise exception 'Mata pelajaran tidak ditemukan di tabel subjects: %', v_missing;
  end if;
end $$;

insert into curriculum_topics (
  curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id
)
select
  'Kurikulum Merdeka', s.id, 'Kelas 11', 1, b.theme, b.topic, b.cp, b.sort_order,
  curriculum_group_id('Kurikulum Merdeka', s.id, 'Kelas 11', 1, b.theme, b.topic)
from kelas11_s1 b
join subjects s on s.name = b.subject
where not exists (
  select 1 from curriculum_topics t
  where t.subject_id = s.id
    and t.curriculum = 'Kurikulum Merdeka'
    and t.grade_level = 'Kelas 11'
    and t.semester = 1
    and coalesce(t.theme, '') = b.theme
    and t.topic = b.topic
);

drop table kelas11_s1;
