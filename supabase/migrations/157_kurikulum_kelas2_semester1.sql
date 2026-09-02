-- ============================================================
-- Kurikulum Kelas 2 Semester 1 (Kurikulum Merdeka) — Matematika,
-- Bahasa Inggris, dan Bahasa Indonesia
--
-- Dari spreadsheet Kelas 2, yang berisi empat tab: Matematika (21 pertemuan),
-- Bahasa Inggris (22 pertemuan), Bahasa Indonesia (21 pertemuan), dan IPAS
-- (21 pertemuan).
--
-- Tab IPAS sengaja tidak ikut: isinya persis sama dengan yang sudah masuk
-- lewat migrasi 088 (21 pertemuan Pancaindra sampai Persiapan AAS), jadi
-- memasukkannya lagi hanya menambah kebisingan tanpa mengubah data.
--
-- Bahasa Inggris memakai buku Rise and Shine, tapi tetap dicatat sebagai
-- 'Kurikulum Merdeka' — kalender temanya mengikuti ATS/AAS sekolah nasional
-- dan capaiannya berbahasa Indonesia, beda dengan tab Cambridge Kelas 4 di
-- migrasi 106 yang punya mapel 'Math'/'Science' sendiri.
--
-- Dua catatan tentang isi yang sudah ada di basis data produksi:
--
--   * Saat migrasi ini ditulis, 63 dari 64 baris di bawah sudah ada persis
--     seperti ini di `curriculum_topics` — tema, topik, dan capaiannya sama —
--     tapi tidak ada satu pun migrasi yang mencatatnya; rupanya diinput lewat
--     Admin -> Kurikulum. Migrasi ini menuliskannya supaya basis data yang
--     dibangun ulang dari nol tidak kehilangan kurikulum Kelas 2.
--
--   * Satu-satunya beda: pertemuan 6 Bahasa Inggris. Spreadsheet menulis
--     temanya 'Kepemilikan (Possession)', basis data menulis 'Let''s explore
--     together' — sama seperti pertemuan 5, 7, dan 8 yang satu unit buku
--     dengannya. Di sini dipakai versi basis data. Tema ikut menentukan
--     identitas topik lewat curriculum_group_id() (migrasi 060), jadi menulis
--     tema spreadsheet berarti membuat topik kedua yang isinya sama, bukan
--     mengganti nama yang sudah ada.
--
-- Matematika Kelas 2 juga masih menyimpan 36 topik lama dari seed 029 (tema
-- Bilangan, Aljabar, Pengukuran, Geometri, Analisis Data). Itu daftar CP resmi
-- yang beda sumber, dan tidak disentuh di sini.
--
-- Murni penambahan, dengan penjaga `not exists` supaya aman dijalankan dua
-- kali. group_id lewat curriculum_group_id() (migrasi 060), sama seperti
-- topik yang diinput admin dari UI.
-- ============================================================

create temporary table kelas2_s1 (subject text, sort_order int, theme text, topic text, cp text);

-- Tab "Matematika"
insert into kelas2_s1 (subject, sort_order, theme, topic, cp) values
  ('Matematika', 1,  'Bilangan sampai 50', 'Mengenal Bilangan sampai 50',
   'Siswa dapat membangun pemahaman nilai tempat dan menghitung jumlah benda konkret hingga 50.'),
  ('Matematika', 2,  'Bilangan sampai 50', 'Membandingkan dan Mengurutkan Bilangan sampai 50',
   'Siswa dapat membandingkan nilai dua bilangan sampai 50 serta mengurutkannya dari yang terkecil atau terbesar.'),
  ('Matematika', 3,  'Bilangan sampai 50', 'Pengayaan & Evaluasi Bilangan sampai 50',
   'Siswa dapat menyelesaikan soal latihan Asesmen Sumatif 1 dan AKM untuk memperkuat pemahaman materi Bilangan sampai 50.'),
  ('Matematika', 4,  'Pengayaan', 'Penguatan Nalar & Pemecahan Masalah Bilangan sampai 50',
   'Siswa dapat mengasah kembali kemampuan berpikir kritis melalui soal pengayaan lanjutan materi Bilangan sampai 50.'),
  ('Matematika', 5,  'Pecahan', 'Mengenal Pecahan',
   'Siswa dapat mengenal konsep dasar pecahan sederhana (seperti setengah atau seperempat) melalui pembagian benda konkret.'),
  ('Matematika', 6,  'Pecahan', 'Pecahan Sederhana',
   'Siswa dapat menuliskan dan merepresentasikan bentuk pecahan sederhana dalam kehidupan sehari-hari.'),
  ('Matematika', 7,  'Pecahan', 'Pengayaan & Evaluasi Pecahan',
   'Siswa dapat menyelesaikan soal latihan Asesmen Sumatif 2 dan AKM untuk mengukur pemahaman konsep pecahan.'),
  ('Matematika', 8,  'Pengayaan', 'Penguatan Nalar & Pemecahan Masalah Pecahan',
   'Siswa dapat memperdalam konsep pecahan melalui latihan pemecahan masalah kontekstual.'),
  ('Matematika', 9,  'Bilangan sampai 100', 'Mengenal Bilangan Cacah sampai 100',
   'Siswa dapat membaca, menulis, dan menentukan nilai tempat bilangan cacah hingga 100.'),
  ('Matematika', 10, 'Bilangan sampai 100', 'Membandingkan dan Mengurutkan Bilangan sampai 100',
   'Siswa dapat membandingkan dua bilangan hingga 100 serta menyusun urutannya secara akurat.'),
  ('Matematika', 11, 'Bilangan sampai 100', 'Pengayaan & Evaluasi Bilangan sampai 100',
   'Siswa dapat menyelesaikan soal latihan Asesmen Sumatif 3 dan AKM terkait bilangan sampai 100.'),
  ('Matematika', 12, 'Pengayaan', 'Penguatan Nalar & Pemecahan Masalah Bilangan sampai 100',
   'Siswa dapat menyelesaikan variasi soal tantangan pada materi Bilangan sampai 100.'),
  ('Matematika', 13, 'Persiapan ATS', 'Review Materi Bilangan sampai 50, Pecahan dan Bilangan sampai 100',
   'Siswa dapat merangkum dan mengulang kembali konsep Bilangan 50, Pecahan, dan Bilangan 100 secara mandiri maupun terbimbing.'),
  ('Matematika', 14, 'Persiapan ATS', 'Simulasi & Pemantapan Soal ATS',
   'Siswa dapat menyelesaikan latihan soal tipe Asesmen Tengah Semester (ATS) untuk mengukur kesiapan menghadapi ujian tengah semester.'),
  ('Matematika', 15, 'Penjumlahan dan Pengurangan Bilangan', 'Penjumlahan Bilangan',
   'Siswa dapat melakukan operasi penjumlahan dua angka dengan berbagai strategi berhitung konkret.'),
  ('Matematika', 16, 'Penjumlahan dan Pengurangan Bilangan', 'Pengurangan Bilangan',
   'Siswa dapat melakukan operasi pengurangan dua angka dengan teknik menghitung mundur atau meminjam secara benar.'),
  ('Matematika', 17, 'Penjumlahan dan Pengurangan Bilangan', 'Operasi Hitung Campuran / Soal Cerita Penjumlahan & Pengurangan',
   'Siswa dapat memecahkan soal cerita kontekstual yang melibatkan operasi penjumlahan dan pengurangan bilangan.'),
  ('Matematika', 18, 'Penjumlahan dan Pengurangan Bilangan', 'Pengayaan & Evaluasi Penjumlahan dan Pengurangan Bilangan',
   'Siswa dapat menyelesaikan soal latihan Asesmen Sumatif 4 dan AKM terkait penjumlahan dan pengurangan bilangan.'),
  ('Matematika', 19, 'Pengayaan', 'Penguatan Nalar & Pemecahan Masalah Penjumlahan dan Pengurangan Bilangan',
   'Siswa dapat menguasai strategi cepat dan tepat dalam menyelesaikan soal cerita penjumlahan dan pengurangan.'),
  ('Matematika', 20, 'Persiapan AAS', 'Review & Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat mereview keseluruhan materi dari Let''s explore together sampai Bab 4 serta berlatih mengerjakan paket soal persiapan AAS.'),
  ('Matematika', 21, 'Persiapan AAS', 'Pembahasan Soal Asesmen Akhir Semester (AAS)',
   'Siswa dapat mendiskusikan kembali bagian-bagian materi yang masih belum dipahami secara tuntas sebelum pelaksanaan AAS.');

-- Tab "Bahasa Inggris"
insert into kelas2_s1 (subject, sort_order, theme, topic, cp) values
  ('Bahasa Inggris', 1,  'Introduction', 'Greetings & Introducing Oneself',
   'Siswa dapat menyapa, memperkenalkan diri sendiri (nama dan umur), serta mempraktikkan dialog literasi interpersonal sederhana (seperti Hello, my name is... dan Nice to meet you) dengan teman sebaya.'),
  ('Bahasa Inggris', 2,  'Welcome to the Rise and Shine Explorers Club', 'Numbers, Days of the Week & Weather',
   'Siswa dapat mengenali angka 11-20, nama hari, dan merespons pertanyaan literasi sederhana terkait cuaca dan hari (contoh: It''s Monday, It''s rainy).'),
  ('Bahasa Inggris', 3,  'Welcome to the Rise and Shine Explorers Club', 'School Items & Demonstrative Pronouns',
   'Siswa dapat mengidentifikasi benda-benda sekolah dan menalar penggunaan What''s this/that? serta kepemilikan (my/your) dalam konteks percakapan.'),
  ('Bahasa Inggris', 4,  'Welcome to the Rise and Shine Explorers Club', 'Evaluasi Tema Welcome to the Rise and Shine Explorers Club',
   'Siswa dapat menyelesaikan kuis formatif dan menjawab soal literasi sederhana mengenai kuantitas benda (How many?) dan benda di sekitarnya.'),
  ('Bahasa Inggris', 5,  'Let''s explore together', 'Vocabulary: My Things & Adjectives',
   'Siswa dapat menyebutkan barang-barang pribadi (seperti backpack, watch, sneakers) dan mendeskripsikannya menggunakan kata sifat (blond, dark, long, short).'),
  ('Bahasa Inggris', 6,  'Let''s explore together', 'Grammar: Do you have...? & He/she has...',
   'Siswa dapat menalar dan mempraktikkan kalimat tanya Do you have...? serta menyusun kalimat deskriptif sederhana tentang orang lain (He/she has...).'),
  ('Bahasa Inggris', 7,  'Let''s explore together', 'Global Citizenship: Our Local Heroes',
   'Siswa dapat menggali informasi dari teks literasi visual mengenai profesi pahlawan lokal (builder, chef, explorer, teacher) di lingkungan sekitar.'),
  ('Bahasa Inggris', 8,  'Let''s explore together', 'Evaluasi Tema Let''s explore together',
   'Siswa dapat mengevaluasi pemahaman kosakata barang pribadi dan tata bahasa Let''s explore together melalui penyelesaian soal formatif berbasis teks bacaan pendek.'),
  ('Bahasa Inggris', 9,  'Let''s be happy at home', 'Vocabulary: House & Furniture',
   'Siswa dapat mengidentifikasi ruangan di dalam rumah (bedroom, kitchen, dll) serta perabotan (bed, couch, dll) dari sebuah teks bergambar.'),
  ('Bahasa Inggris', 10, 'Let''s be happy at home', 'Grammar: Where''s...? & Prepositions of Place',
   'Siswa dapat menentukan letak benda atau orang menggunakan kata depan in, on, next to berdasarkan pertanyaan Where''s...? dalam sebuah cerita pendek.'),
  ('Bahasa Inggris', 11, 'Let''s be happy at home', 'Global Citizenship: Unusual Homes',
   'Siswa dapat membedah teks literasi budaya mengenai rumah-rumah unik di dunia (cave, igloo, tent, tree house) dan membandingkannya dengan rumah sendiri.'),
  ('Bahasa Inggris', 12, 'Let''s be happy at home', 'Evaluasi Tema Let''s be happy at home & Review Let''s explore together',
   'Siswa dapat menyelesaikan soal evaluasi Let''s be happy at home dan meninjau kembali (Review 1: Important to me) gabungan materi dari bab Welcome hingga Let''s be happy at home.'),
  ('Bahasa Inggris', 13, 'Persiapan ATS', 'Review Materi Tema Welcome to the Rise and Shine Explorers Club s.d. Tema Let''s be happy at home',
   'Siswa dapat merangkum konsep tata bahasa dan kosakata dasar dari awal semester secara mandiri untuk memperkuat fondasi ingatan.'),
  ('Bahasa Inggris', 14, 'Persiapan ATS', 'Simulasi Asesmen Tengah Semester (ATS)',
   'Siswa dapat menyelesaikan paket soal simulasi ATS yang menguji kemampuan membaca (reading comprehension) dan tata bahasa dasar.'),
  ('Bahasa Inggris', 15, 'Let''s explore nature', 'Vocabulary: Farm Animals & Outdoors',
   'Siswa dapat mengklasifikasikan hewan ternak (chicken, cow, dll) dan objek luar ruangan (bush, fence, dll) dari sebuah observasi gambar atau cerita.'),
  ('Bahasa Inggris', 16, 'Let''s explore nature', 'Grammar: There''s / There isn''t & Preposition (behind)',
   'Siswa dapat menyusun kalimat untuk menyatakan keberadaan suatu benda (There''s/There isn''t) dan menggunakan preposisi behind untuk menjawab letak objek.'),
  ('Bahasa Inggris', 17, 'Let''s explore nature', 'Global Citizenship: The Five Senses',
   'Siswa dapat menghubungkan kosakata pancaindera (hear, see, smell, taste, touch) dengan pengalaman nyata melalui teks literasi sains sederhana.'),
  ('Bahasa Inggris', 18, 'Let''s explore nature', 'Evaluasi Tema Let''s explore nature',
   'Siswa dapat menyelesaikan asesmen formatif Let''s explore nature dengan fokus pada pemahaman bacaan terkait alam dan keberadaan hewan.'),
  ('Bahasa Inggris', 19, 'Pengayaan', 'Pengayaan Literasi Welcome to the Rise and Shine Explorers Club & Let''s explore together',
   'Siswa dapat menganalisis teks cerita bergambar yang lebih kompleks terkait benda kepemilikan dan ciri fisik, serta menjawab pertanyaan nalar (HOTS dasar).'),
  ('Bahasa Inggris', 20, 'Pengayaan', 'Pengayaan Literasi Let''s be happy at home',
   'Siswa dapat memecahkan teka-teki logika atau membaca denah rumah sederhana untuk memantapkan pemahaman preposisi letak benda.'),
  ('Bahasa Inggris', 21, 'Pengayaan', 'Pengayaan Literasi Let''s explore nature',
   'Siswa dapat menyimpulkan informasi dari teks deskriptif mengenai kehidupan hewan di peternakan dan fungsi pancaindera.'),
  ('Bahasa Inggris', 22, 'Persiapan AAS', 'Simulasi Asesmen Akhir Semester (AAS)',
   'Siswa dapat mengerjakan paket soal AAS untuk mengukur kemampuan literasi bahasa Inggris secara komprehensif sebelum menghadapi ujian sesungguhnya.');

-- Tab "Bahasa Indonesia"
insert into kelas2_s1 (subject, sort_order, theme, topic, cp) values
  ('Bahasa Indonesia', 1,  'Mengenal Perasaan', 'Membaca: Berbagai Jenis Emosi',
   'Siswa dapat mengidentifikasi berbagai jenis perasaan (senang, sedih, marah, takut) melalui teks bacaan sederhana dan gambar ilustrasi.'),
  ('Bahasa Indonesia', 2,  'Mengenal Perasaan', 'Berbicara: Mengekspresikan Perasaan',
   'Siswa dapat menceritakan pengalaman pribadi terkait perasaan tertentu dengan lafal, intonasi, dan volume suara yang jelas.'),
  ('Bahasa Indonesia', 3,  'Mengenal Perasaan', 'Tata Bahasa: Huruf Kapital & Tanda Titik',
   'Siswa dapat menerapkan penggunaan huruf kapital di awal kalimat dan tanda titik di akhir kalimat dengan tepat.'),
  ('Bahasa Indonesia', 4,  'Mengenal Perasaan', 'Menulis: Jurnal Perasaan',
   'Siswa dapat menulis 3-4 kalimat sederhana yang mendeskripsikan perasaannya menggunakan kosakata baru terkait emosi.'),
  ('Bahasa Indonesia', 5,  'Mengenal Perasaan', 'Pengayaan Literasi & Evaluasi Tema Mengenal Perasaan',
   'Siswa dapat menyimpulkan isi cerita pendek tentang perasaan dan menyelesaikan kuis formatif pemahaman bacaan.'),
  ('Bahasa Indonesia', 6,  'Menjaga Kesehatan', 'Membaca: Informasi Kesehatan Diri',
   'Siswa dapat menggali informasi dari teks bacaan tentang cara menjaga kesehatan tubuh dan kebersihan lingkungan sekitar.'),
  ('Bahasa Indonesia', 7,  'Menjaga Kesehatan', 'Berdiskusi: Kebiasaan Sehat vs Tidak Sehat',
   'Siswa dapat menalar dan membedakan kebiasaan sehat dan tidak sehat, serta menyampaikannya secara lisan dalam diskusi.'),
  ('Bahasa Indonesia', 8,  'Menjaga Kesehatan', 'Tata Bahasa: Kalimat Tanya',
   'Siswa dapat menyusun kalimat tanya menggunakan kata tanya (apa, siapa, di mana, kapan, mengapa, bagaimana) beserta tanda tanya.'),
  ('Bahasa Indonesia', 9,  'Menjaga Kesehatan', 'Menulis: Rutinitas Hidup Sehat',
   'Siswa dapat menuliskan paragraf pendek mengenai rutinitas kesehatan harian dengan struktur kalimat yang runtut.'),
  ('Bahasa Indonesia', 10, 'Menjaga Kesehatan', 'Pengayaan Literasi & Evaluasi Tema Menjaga Kesehatan',
   'Siswa dapat menyelesaikan asesmen formatif dan membedah makna kosakata baru dari teks literasi kesehatan.'),
  ('Bahasa Indonesia', 11, 'Berhati-hati di Mana Saja', 'Membaca: Cerita Keselamatan',
   'Siswa dapat memahami isi cerita tentang pentingnya menjaga keselamatan diri di rumah maupun di tempat umum.'),
  ('Bahasa Indonesia', 12, 'Berhati-hati di Mana Saja', 'Mengamati: Mengenal Rambu dan Simbol',
   'Siswa dapat menginterpretasikan makna simbol, rambu lalu lintas, atau petunjuk keselamatan sederhana di lingkungan sekitar.'),
  ('Bahasa Indonesia', 13, 'Berhati-hati di Mana Saja', 'Tata Bahasa: Kalimat Perintah & Larangan',
   'Siswa dapat menggunakan dan membedakan kalimat perintah serta kalimat larangan menggunakan tanda seru secara tepat.'),
  ('Bahasa Indonesia', 14, 'Berhati-hati di Mana Saja', 'Menulis: Panduan Keamanan',
   'Siswa dapat menyusun daftar aturan keselamatan sederhana untuk diterapkan saat bermain atau menyeberang jalan.'),
  ('Bahasa Indonesia', 15, 'Berhati-hati di Mana Saja', 'Pengayaan Literasi & Evaluasi Tema Berhati-hati di Mana Saja',
   'Siswa dapat mengevaluasi pemahamannya tentang aturan keselamatan melalui kuis formatif dan bedah soal cerita.'),
  ('Bahasa Indonesia', 16, 'Keluargaku Unik', 'Membaca: Keberagaman Keluarga',
   'Siswa dapat menyimak dan menceritakan kembali isi teks mengenai berbagai kebiasaan dan keunikan struktur keluarga.'),
  ('Bahasa Indonesia', 17, 'Keluargaku Unik', 'Berbicara: Wawancara Sederhana',
   'Siswa dapat menyusun daftar pertanyaan dan melakukan simulasi wawancara singkat dengan teman mengenai keluarganya.'),
  ('Bahasa Indonesia', 18, 'Keluargaku Unik', 'Tata Bahasa: Kata Depan (di, ke, dari)',
   'Siswa dapat menempatkan kata depan di, ke, dan dari dengan penulisan yang benar (dipisah dari kata penunjuk tempat).'),
  ('Bahasa Indonesia', 19, 'Keluargaku Unik', 'Menulis: Deskripsi Keluarga',
   'Siswa dapat menulis karangan singkat yang menceritakan kegiatan favorit yang sering dilakukan bersama anggota keluarganya.'),
  ('Bahasa Indonesia', 20, 'Keluargaku Unik', 'Pengayaan Literasi & Evaluasi Tema Keluargaku Unik',
   'Siswa dapat mengevaluasi pemahamannya tentang keberagaman keluarga melalui kuis formatif dan bedah soal cerita.'),
  ('Bahasa Indonesia', 21, 'Persiapan AAS', 'Review Komprehensif Semester 1',
   'Siswa dapat mengulang kembali fondasi tata bahasa, kosakata, dan pemahaman literasi dari Tema Mengenal Perasaan hingga Tema Keluargaku Unik untuk kesiapan Asesmen Akhir Semester.');

-- Berhenti kalau ada mata pelajaran yang tidak ada, daripada diam-diam
-- melewatkan satu tab penuh.
do $$
declare
  v_missing text;
begin
  select string_agg(b.subject, ', ')
    into v_missing
  from (select distinct subject from kelas2_s1) b
  where not exists (select 1 from subjects s where s.name = b.subject);

  if v_missing is not null then
    raise exception 'Mata pelajaran tidak ditemukan di tabel subjects: %', v_missing;
  end if;
end $$;

insert into curriculum_topics (
  curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id
)
select
  'Kurikulum Merdeka', s.id, 'Kelas 2', 1, b.theme, b.topic, b.cp, b.sort_order,
  curriculum_group_id('Kurikulum Merdeka', s.id, 'Kelas 2', 1, b.theme, b.topic)
from kelas2_s1 b
join subjects s on s.name = b.subject
where not exists (
  select 1 from curriculum_topics t
  where t.subject_id = s.id
    and t.curriculum = 'Kurikulum Merdeka'
    and t.grade_level = 'Kelas 2'
    and t.semester = 1
    and coalesce(t.theme, '') = b.theme
    and t.topic = b.topic
);

drop table kelas2_s1;
