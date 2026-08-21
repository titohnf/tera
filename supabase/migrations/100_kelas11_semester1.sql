-- ============================================================
-- Kurikulum Kelas 11 Semester 1 — Matematika, Bahasa Inggris, Ekonomi
--
-- Dari spreadsheet "Kelas 11 Semester 1", satu tab per daftar:
--
--   * "Fondasi Berhitung" (17 pertemuan) — isinya aritmetika dasar, dari
--     penjumlahan bersusun sampai rasio. Tidak ada mata pelajaran bernama
--     "Fondasi Berhitung"; daftar ini masuk ke Matematika Kelas 11 semester 1,
--     yang sebelumnya kosong.
--   * "B.Inggris" (14 pertemuan) — masuk ke Bahasa Inggris, juga sebelumnya
--     kosong.
--   * Tab Ekonomi memuat dua tabel: daftar 11 pertemuan yang sudah persis ada
--     di DB, lalu blok "Tambahan" berisi versi 20 pertemuan yang memecah topik
--     gabungan menjadi satu topik per pertemuan. Yang dipakai adalah versi 20;
--     versi 11 diganti.
--
-- Mengganti daftar Ekonomi berarti menghapus topik, dan tiga sesi berstatus
-- completed menempel ke sana. Dua di antaranya aman: topik "Siklus Aliran
-- Pendapatan & Interaksi Antarpasar" dan "Pengangguran" ada di kedua versi
-- dengan tema dan nama yang sama persis, jadi barisnya dipertahankan (hanya
-- sort_order dan capaian pembelajarannya disesuaikan) dan group_id-nya tidak
-- berubah. Yang ketiga menempel ke "Konsep Pendapatan Nasional & Pendapatan Per
-- Kapita", yang di versi baru dipecah jadi dua; sesi itu dipindahkan ke "Konsep
-- Pendapatan Nasional" sebelum topik lamanya dihapus, supaya tidak jatuh ke
-- null lewat `on delete set null` di migrasi 028.
--
-- Penghapusan dilakukan lewat curriculum_topic_groups, bukan langsung ke
-- curriculum_topics — sama seperti deleteCurriculumTopic di
-- lib/actions/admin/curriculum.ts — supaya cascade ikut membereskan
-- curriculum_resources dan tag bank soal yang menunjuk group tersebut.
--
-- Penjaga `not exists` tetap dipasang supaya migrasi ini aman dijalankan dua
-- kali: yang kedua tidak menggandakan apa pun dan tidak menghapus apa pun lagi.
-- ============================================================

create temporary table kelas11_s1 (subject text, sort_order int, theme text, topic text, cp text);

-- Tab "Fondasi Berhitung" -> Matematika
insert into kelas11_s1 (subject, sort_order, theme, topic, cp) values
  ('Matematika', 1,  'Dasar: Penjumlahan', 'Penjumlahan Dasar & Kompleks (1-2 Angka)',
   'Siswa dapat menghitung penjumlahan bilangan dasar dengan cepat serta menyelesaikan penjumlahan hingga 2 angka menggunakan cara bersusun dengan teknik menyimpan.'),
  ('Matematika', 2,  'Dasar: Penjumlahan', 'Penjumlahan Dasar & Kompleks (3-4 Angka)',
   'Siswa dapat menghitung penjumlahan bilangan dasar dengan cepat serta menyelesaikan penjumlahan besar hingga 4 angka menggunakan cara bersusun dengan teknik menyimpan.'),
  ('Matematika', 3,  'Dasar: Pengurangan', 'Pengurangan Dasar & Kompleks (1-2 Angka)',
   'Siswa dapat menghitung pengurangan secara langsung untuk angka kecil serta menggunakan cara bersusun ke bawah dengan teknik meminjam secara presisi untuk angka hingga puluhan.'),
  ('Matematika', 4,  'Dasar: Pengurangan', 'Pengurangan Dasar & Kompleks (3-4 Angka)',
   'Siswa dapat menghitung pengurangan secara langsung untuk angka kecil serta menggunakan cara bersusun ke bawah dengan teknik meminjam secara presisi untuk angka hingga ribuan.'),
  ('Matematika', 5,  'Menengah: Perkalian', 'Perkalian Dasar (1-2 Angka)',
   'Siswa dapat menghitung hasil perkalian dasar melalui proses penjumlahan berulang dan mengingat kombinasi perkalian bilangan 1 hingga 10 secara mekanis.'),
  ('Matematika', 6,  'Menengah: Perkalian', 'Perkalian Kompleks (Bersusun)',
   'Siswa dapat menghitung perkalian bilangan multi-digit (puluhan hingga ratusan) menggunakan teknik perkalian bersusun ke bawah secara akurat.'),
  ('Matematika', 7,  'Menengah: Pembagian', 'Pembagian Dasar & Sisa Bagi',
   'Siswa dapat menghitung hasil bagi dan menentukan sisa pada pembagian bilangan 1 dan 2 angka secara langsung.'),
  ('Matematika', 8,  'Menengah: Pembagian', 'Pembagian Kompleks (Porogapit)',
   'Siswa dapat menghitung pembagian bilangan besar (ratusan hingga ribuan) secara bertahap menggunakan teknik pembagian bersusun (porogapit).'),
  ('Matematika', 9,  'Menengah: Operasi Campuran', 'Hierarki Operasi Hitung Dasar (Tanpa Kurung)',
   'Siswa dapat menghitung operasi campuran secara akurat dengan menerapkan aturan baku mekanis bahwa perkalian dan pembagian dikerjakan lebih dahulu daripada penjumlahan dan pengurangan.'),
  ('Matematika', 10, 'Menengah: Operasi Campuran', 'Hierarki Operasi Hitung Kompleks (Dengan Kurung)',
   'Siswa dapat menghitung hasil operasi hitung campuran yang lebih kompleks dengan menguasai prioritas mutlak pengerjaan komputasi untuk angka di dalam tanda kurung.'),
  ('Matematika', 11, 'Menengah: Pecahan', 'Pecahan Senilai & Penyederhanaan',
   'Siswa dapat menghitung nilai pecahan yang setara dan membagi pembilang serta penyebut menggunakan angka FPB hingga bentuk pecahan paling sederhana.'),
  ('Matematika', 12, 'Atas: Pecahan', 'Penjumlahan & Pengurangan Pecahan',
   'Siswa dapat menghitung operasi penjumlahan dan pengurangan pecahan dengan mencari dan menyamakan Kelipatan Persekutuan Terkecil (KPK) pada penyebutnya.'),
  ('Matematika', 13, 'Atas: Pecahan', 'Perkalian & Pembagian Pecahan',
   'Siswa dapat menghitung perkalian pecahan (atas kali atas, bawah kali bawah), serta menghitung pembagian pecahan dengan memanipulasinya dengan cara membalik posisi pecahan pembagi.'),
  ('Matematika', 14, 'Atas: Desimal', 'Penjumlahan & Pengurangan Bilangan Desimal',
   'Siswa dapat menghitung penjumlahan dan pengurangan bilangan desimal dengan mensejajarkan letak koma dan posisi nilai tempat secara presisi dari atas ke bawah.'),
  ('Matematika', 15, 'Atas: Desimal', 'Perkalian & Pembagian Bilangan Desimal',
   'Siswa dapat menghitung perkalian desimal dengan menata jumlah angka di belakang koma, serta menyelesaikan pembagian desimal dengan menggeser letak koma atau mengubah ke pecahan biasa.'),
  ('Matematika', 16, 'Atas: Konversi', 'Fraksi, Desimal, & Persentase',
   'Siswa dapat menghitung konversi perubahan bentuk angka secara matematis dari pecahan biasa menjadi desimal dan mengubahnya ke bentuk persentase, atau sebaliknya.'),
  ('Matematika', 17, 'Atas: Rasio', 'Perhitungan Proporsi Numerik',
   'Siswa dapat menghitung nilai akhir suatu besaran secara langsung dan matematis jika diketahui jumlah angka total, angka selisih, dan nilai angka pembandingnya.');

-- Tab "B.Inggris" -> Bahasa Inggris
insert into kelas11_s1 (subject, sort_order, theme, topic, cp) values
  ('Bahasa Inggris', 1,  'Present Tenses & Past vs. Present Perfect', 'Present tenses (simple, continuous, perfect); past simple vs. present perfect.',
   'Siswa dapat menalar dan menggunakan berbagai bentuk present tenses secara akurat, serta membedakan penggunaan past simple dengan present perfect dalam konteks kalimat.'),
  ('Bahasa Inggris', 2,  'Narrative Tenses & The Passive', 'Narrative past tenses; the passive.',
   'Siswa dapat menyusun kalimat menggunakan narrative past tenses untuk bercerita runtut dan menerapkan bentuk kalimat pasif (the passive) secara tepat.'),
  ('Bahasa Inggris', 3,  'Determiners & Quantity Expressions', 'Determiners; expressions of quantity.',
   'Siswa dapat mengidentifikasi dan menggunakan determiners serta expressions of quantity dengan presisi saat menjelaskan jumlah/kuantitas suatu objek.'),
  ('Bahasa Inggris', 4,  'Future Forms (Continuous & Perfect)', 'Future forms; future continuous and future perfect simple.',
   'Siswa dapat merumuskan prediksi dan rencana ke depan menggunakan berbagai future forms, secara khusus menguasai future continuous dan future perfect simple.'),
  ('Bahasa Inggris', 5,  'Negative/Question Forms & Verb Patterns', 'Negative forms; question forms; verb + infinitive / -ing.',
   'Siswa dapat menyusun pola kalimat negatif dan interogatif dasar, serta menalar perbedaan makna antara penggunaan gerund (-ing) dan infinitive setelah kata kerja tertentu.'),
  ('Bahasa Inggris', 6,  'Review Grammar 1', 'Persiapan ATS',
   'Siswa dapat mengonsolidasikan pemahaman tata bahasa (tenses, passive, quantifiers, gerund/infinitive) dari pertemuan 1 hingga 5.'),
  ('Bahasa Inggris', 7,  'Simulasi Asesmen Tengah Semester (ATS)', 'Evaluasi ATS',
   'Siswa dapat memecahkan soal-soal simulasi ATS yang berfokus pada keakuratan struktur dan logika grammar paruh pertama semester.'),
  ('Bahasa Inggris', 8,  'Real Conditionals & Past Habits', 'Zero & first conditionals; time linkers; usually, used to, would, be used to, get used to.',
   'Siswa dapat menyusun kalimat pengandaian (zero & first) serta mengekspresikan kebiasaan masa lalu dan masa kini melalui pola used to dan would.'),
  ('Bahasa Inggris', 9,  'Unreal Conditionals & Wishes', 'Second, third, and mixed conditionals; wish and if only.',
   'Siswa dapat memformulasikan kalimat pengandaian yang tidak nyata (unreal situations) menggunakan aturan second, third, dan mixed conditionals, serta ungkapan wish/if only.'),
  ('Bahasa Inggris', 10, 'Reporting Verbs, Articles, & Relative Clauses', 'Reporting verbs (active/passive); articles (a/an/the/zero); relative clauses.',
   'Siswa dapat melaporkan informasi menggunakan reporting verbs, menempatkan artikel (a/an/the/zero) dengan benar, dan merangkai kalimat majemuk menggunakan relative clauses.'),
  ('Bahasa Inggris', 11, 'Expressing Past Ability & Future in the Past', 'Could, was able to, managed to, succeeded in; future in the past.',
   'Siswa dapat mengekspresikan pencapaian masa lalu melalui frasa alternatif selain could, serta menerapkan konsep sintaksis future in the past.'),
  ('Bahasa Inggris', 12, 'Focus Adverbs & Causative Verbs', 'Focus adverbs (only, just, even); causative have and get.',
   'Siswa dapat menggunakan focus adverbs untuk memberikan penekanan makna spesifik dan menyusun instruksi tidak langsung melalui pola causative have dan get.'),
  ('Bahasa Inggris', 13, 'Review Grammar 2', 'Persiapan AAS',
   'Siswa dapat menyintesis struktur tata bahasa lanjutan, terutama logika conditionals, causatives, dan reporting verbs untuk persiapan ujian akhir.'),
  ('Bahasa Inggris', 14, 'Simulasi Asesmen Akhir Semester (AAS)', 'Evaluasi AAS',
   'Siswa dapat menyelesaikan paket soal simulasi AAS dengan tingkat keakuratan tata bahasa dan sintaksis yang tinggi secara komprehensif.');

-- Tab Ekonomi, blok "Tambahan" (versi 20 pertemuan)
insert into kelas11_s1 (subject, sort_order, theme, topic, cp) values
  ('Ekonomi', 1,  'Pendapatan Nasional', 'Siklus Aliran Pendapatan & Interaksi Antarpasar',
   'Siswa dapat menganalisis siklus aliran pendapatan (circular flow model) dan menalar bagaimana interaksi antarpasar membentuk struktur perekonomian makro.'),
  ('Ekonomi', 2,  'Pendapatan Nasional', 'Konsep Pendapatan Nasional',
   'Siswa dapat membedah berbagai pendekatan dalam konsep pendapatan nasional dan menghitung komponennya secara logis tanpa sekadar menghafal rumus.'),
  ('Ekonomi', 3,  'Pendapatan Nasional', 'Pendapatan Per Kapita',
   'Siswa dapat menganalisis data pendapatan per kapita secara kritis untuk mengevaluasi tingkat kesejahteraan dan produktivitas suatu negara.'),
  ('Ekonomi', 4,  'Evaluasi Tema Pendapatan Nasional', 'Asesmen Tema Pendapatan Nasional',
   'Siswa dapat menyelesaikan asesmen formatif Tema Pendapatan Nasional dengan memecahkan soal berbasis literasi dan analisis data pendapatan nasional.'),
  ('Ekonomi', 5,  'Dinamika Ekonomi & Tantangannya', 'Pertumbuhan Ekonomi',
   'Siswa dapat menganalisis indikator pengukur pertumbuhan ekonomi dan mengevaluasi faktor-faktor yang mendorong laju pertumbuhan suatu negara.'),
  ('Ekonomi', 6,  'Dinamika Ekonomi & Tantangannya', 'Pembangunan Ekonomi',
   'Siswa dapat membedakan secara fundamental antara pertumbuhan dan pembangunan ekonomi, serta mengevaluasi indikator keberhasilan pembangunan.'),
  ('Ekonomi', 7,  'Dinamika Ekonomi & Tantangannya', 'Kemiskinan & Kesenjangan Ekonomi',
   'Siswa dapat menelaah fenomena kemiskinan dan menganalisis kesenjangan ekonomi menggunakan indeks ketimpangan data riil.'),
  ('Ekonomi', 8,  'Dinamika Ekonomi & Tantangannya', 'Solusi Mengatasi Kemiskinan dan Kesenjangan',
   'Siswa dapat merumuskan dan mengevaluasi solusi kebijakan fiskal maupun moneter yang efektif untuk mengatasi masalah kemiskinan dan ketimpangan.'),
  ('Ekonomi', 9,  'Dinamika Ekonomi & Tantangannya', 'Ekonomi Digital dan Literasi Keuangan',
   'Siswa dapat menalar peran adaptasi ekonomi digital serta pentingnya literasi keuangan dalam mempercepat pertumbuhan ekonomi yang inklusif.'),
  ('Ekonomi', 10, 'Evaluasi Tema Dinamika Ekonomi & Tantangannya', 'Asesmen Tema Dinamika Ekonomi & Tantangannya',
   'Siswa dapat mengerjakan evaluasi Tema Dinamika Ekonomi & Tantangannya yang berfokus pada daya nalar terhadap tantangan dan dinamika solusi isu makroekonomi.'),
  ('Ekonomi', 11, 'Persiapan ATS', 'Review Analitik Tema Pendapatan Nasional & Tema Dinamika Ekonomi & Tantangannya',
   'Siswa dapat merangkum dan mengonsolidasikan benang merah konsep dari pendapatan nasional hingga dinamika ekonomi sebagai persiapan ujian tengah semester.'),
  ('Ekonomi', 12, 'Persiapan ATS', 'Simulasi Asesmen Tengah Semester (ATS)',
   'Siswa dapat mengerjakan dan membedah simulasi soal ATS yang menguji nalar, logika penyelesaian masalah, serta literasi data ekonomi.'),
  ('Ekonomi', 13, 'Permasalahan Ketenagakerjaan', 'Konsep Ketenagakerjaan',
   'Siswa dapat menganalisis struktur penduduk, membedakan angkatan kerja dan bukan angkatan kerja, serta menghitung tingkat partisipasi angkatan kerja.'),
  ('Ekonomi', 14, 'Permasalahan Ketenagakerjaan', 'Sistem Upah',
   'Siswa dapat mengevaluasi berbagai sistem upah yang berlaku di Indonesia serta dampaknya terhadap kesejahteraan pekerja dan beban produksi perusahaan.'),
  ('Ekonomi', 15, 'Permasalahan Ketenagakerjaan', 'Pengangguran',
   'Siswa dapat mengklasifikasikan jenis-jenis pengangguran, menganalisis penyebabnya dari sisi struktural/friksional, dan merumuskan solusi penanganannya.'),
  ('Ekonomi', 16, 'Evaluasi Tema Permasalahan Ketenagakerjaan', 'Asesmen Permasalahan Ketenagakerjaan',
   'Siswa dapat menyelesaikan asesmen formatif Tema Permasalahan Ketenagakerjaan terkait problematika ketenagakerjaan, upah, dan pengangguran terbuka.'),
  ('Ekonomi', 17, 'Pengayaan', 'Studi Kasus Terpadu: Ekonomi & Pekerjaan',
   'Siswa dapat memecahkan studi kasus kompleks (HOTS) yang menghubungkan laju pertumbuhan ekonomi (Bab 2) dengan kapasitas penyerapan tenaga kerja (Bab 3).'),
  ('Ekonomi', 18, 'Pengayaan', 'Analisis Disrupsi Ekonomi',
   'Siswa dapat mengevaluasi dampak otomatisasi dan ekonomi digital terhadap pergeseran tren ketenagakerjaan dan sistem upah di masa depan.'),
  ('Ekonomi', 19, 'Persiapan AAS', 'Review Komprehensif Semester 1',
   'Siswa dapat menyintesis kembali seluruh konsep makroekonomi dari Tema Pendapatan Nasional hingga Tema Permasalahan Ketenagakerjaan untuk memperkuat struktur memori konseptual jangka panjang.'),
  ('Ekonomi', 20, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat membedah dan menyelesaikan paket soal simulasi AAS dengan mengedepankan logika analisis data dan pemecahan masalah ekonomi komprehensif.');

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

-- 1. Tambahkan semua topik yang belum ada. Dua topik Ekonomi yang namanya sama
--    persis di kedua versi tidak tersentuh di sini, jadi id dan group_id-nya
--    (dan sesi yang menempel) tetap.
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

-- 2. Samakan urutan dan capaian pembelajaran topik yang dipertahankan dengan
--    versi baru di spreadsheet.
update curriculum_topics t
set sort_order = b.sort_order,
    learning_outcomes = b.cp
from kelas11_s1 b
join subjects s on s.name = b.subject
where t.subject_id = s.id
  and t.curriculum = 'Kurikulum Merdeka'
  and t.grade_level = 'Kelas 11'
  and t.semester = 1
  and coalesce(t.theme, '') = b.theme
  and t.topic = b.topic
  and (t.sort_order is distinct from b.sort_order
       or t.learning_outcomes is distinct from b.cp);

-- 3. Pindahkan sesi yang menempel ke topik Ekonomi lama "Konsep Pendapatan
--    Nasional & Pendapatan Per Kapita" — versi baru memecahnya jadi dua, dan
--    bagian yang diajarkan lebih dulu adalah "Konsep Pendapatan Nasional".
update sessions
set curriculum_topic_id = (
  select t.id from curriculum_topics t
  join subjects s on s.id = t.subject_id and s.name = 'Ekonomi'
  where t.curriculum = 'Kurikulum Merdeka'
    and t.grade_level = 'Kelas 11' and t.semester = 1
    and t.theme = 'Pendapatan Nasional'
    and t.topic = 'Konsep Pendapatan Nasional'
)
where curriculum_topic_id in (
  select t.id from curriculum_topics t
  join subjects s on s.id = t.subject_id and s.name = 'Ekonomi'
  where t.curriculum = 'Kurikulum Merdeka'
    and t.grade_level = 'Kelas 11' and t.semester = 1
    and t.theme = 'Pendapatan Nasional'
    and t.topic = 'Konsep Pendapatan Nasional & Pendapatan Per Kapita'
);

-- 4. Buang sisa daftar Ekonomi versi lama. Dihapus lewat group supaya cascade
--    ikut membereskan curriculum_resources dan tag bank soal — persis yang
--    dilakukan deleteCurriculumTopic di admin UI. Hanya menyentuh Ekonomi
--    Kelas 11 semester 1, jadi mapel lain tidak ikut terpengaruh.
delete from curriculum_topic_groups g
using subjects s
where g.subject_id = s.id
  and s.name = 'Ekonomi'
  and g.curriculum = 'Kurikulum Merdeka'
  and g.grade_level = 'Kelas 11'
  and g.semester = 1
  and not exists (
    select 1 from kelas11_s1 b
    where b.subject = 'Ekonomi'
      and b.theme = coalesce(g.theme, '')
      and b.topic = g.topic
  );

drop table kelas11_s1;
