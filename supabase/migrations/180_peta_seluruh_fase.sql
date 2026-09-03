-- ============================================================
-- Peta kompetensi seluruh Fase A–F, dan tolok ukur kelasnya
--
-- PERTANYAAN YANG MELAHIRKAN MIGRASI INI: bisakah sistem membenarkan kalimat
-- "anak ini kelas 7, tetapi kemampuannya setara kelas 5"?
--
-- Sampai hari ini jawabannya cuma separuh. Ke ATAS bisa: seorang anak kelas 7
-- yang menuntaskan D-09 (jenjang kelas 8) punya bukti berlapis — enam paket
-- Bloom lolos di putaran pertama, ambang 0,75, retest terjadwal, dan sejak 175
-- skornya dikoreksi terhadap tebakan. Ke BAWAH mustahil, dan bukan karena
-- kurang canggih: peta hanya memuat Fase D. Untuk anak kelas 7 yang
-- kemampuannya setara kelas 5, sistem tidak punya satu pun topik untuk
-- menunjuknya. Tiga murid SD di basis data ini (kelas 2, 2, dan 5) bahkan tidak
-- punya satu topik pun yang berlaku bagi mereka.
--
-- Learning Progression Matematika sudah memuat seluruh jawabannya sejak awal —
-- 67 topik untuk kelas 1 sampai 12, dengan prasyarat lintas fase — dan
-- subjudulnya menyebut kegunaannya secara harfiah: "Benchmark Kelas untuk Klaim
-- Ekuivalensi Kemampuan (Kelas X, Kemampuan Setara Kelas Y)". Yang belum pernah
-- dilakukan adalah memindahkannya ke basis data. Migrasi 143 memasukkan Fase D;
-- 48 topik selebihnya tidak pernah menyusul.
--
-- Skema `topik` sendiri sudah menantikannya. Batasan `id ~ '^[A-F]{1,2}-[0-9]{2}$'`
-- di migrasi 140 sudah mengizinkan AC dan EF sejak hari pertama, lengkap dengan
-- komentar "Fase majemuk (AC, EF) ikut sah", dan `penanda_remediasi` sudah
-- punya nilai `ekstra_wajib` yang belum satu pun topik Fase D memakainya.
--
-- DUA KOLOM BARU, dan inilah yang membuat klaim ekuivalensi bisa dihitung
-- alih-alih diperkirakan. Kolom `jenjang_kelas` yang ada berupa teks ("5-6",
-- "11-12") karena mengikuti kolom Kelas di dokumen — bagus untuk dibaca orang,
-- tidak bisa dibandingkan mesin. `kelas_mulai` dan `kelas_kuasai` memisahkan
-- keduanya menjadi angka, persis seperti Bagian 1 dokumen itu mendefinisikannya:
--
--   kelas mulai   — kelas tempat topik ini pertama diperkenalkan
--   kelas kuasai  — kelas tempat topik ini diharapkan sudah dikuasai penuh
--
-- Dan dokumen itu pula yang sudah menetapkan aturan klaimnya, jadi tidak ada
-- kebijakan baru yang perlu diputuskan siapa pun di sini: "Kalau siswa kelas 4
-- sudah menguasai seluruh topik yang 'Kelas kuasai'-nya = 7, klaim 'kemampuan
-- setara kelas 7' punya dasar terukur." SELURUH topik, bukan sebagian besar.
--
-- SEMUA TOPIK BARU LAHIR NONAKTIF, dan ini bukan kehati-hatian melainkan
-- kejujuran. Topik yang aktif adalah topik yang bisa dikerjakan anak, dan tidak
-- satu pun dari 48 topik ini punya butir soal. Menyalakannya berarti
-- menampilkan peta yang setiap simpulnya buntu. Yang mereka kerjakan sekarang
-- adalah menjadi TOLOK UKUR — daftar terhadap mana penguasaan dibandingkan —
-- dan untuk itu mereka tidak perlu, malah tidak boleh, terlihat oleh murid.
--
-- TIDAK ADA SATU BUTIR SOAL PUN DITAMBAHKAN DI SINI, dan itu mengikuti
-- perintah dokumennya sendiri: "Claude Code hanya boleh memproduksi soal untuk
-- topik berstatus AKTIF PILOT saat ini — topik lain di dokumen ini adalah peta
-- jangka panjang, bukan tugas produksi konten sekarang." Menambah 48 topik
-- adalah memindahkan peta; mengisinya adalah pekerjaan konten yang belum
-- diminta, dan bank soalnya sendiri akan berjumlah ribuan butir.
--
-- URUTAN DITATA ULANG. Fase D menempati 1–19 karena ia yang lahir lebih dulu,
-- padahal dalam urutan belajar sungguhan ia di tengah. Sesudah ini: AC 1–31,
-- D 101–119, EF 201–217. Yang berubah hanya nomor pengurut tampilan; tidak ada
-- yang menyimpan angka itu sebagai rujukan.
--
-- Fungsi yang MEMAKAI tolok ukur ini — `kesetaraan_kelas()` — ada di migrasi
-- 181. Dipisah supaya berkas ini tetap satu hal saja: memindahkan peta.
--
-- Jalankan SESUDAH 179.
-- ============================================================

-- 1. Dua kolom tolok ukur ------------------------------------------------------
alter table topik add column if not exists kelas_mulai smallint
  check (kelas_mulai is null or kelas_mulai between 1 and 12);
alter table topik add column if not exists kelas_kuasai smallint
  check (kelas_kuasai is null or kelas_kuasai between 1 and 12);

comment on column topik.kelas_mulai is
  'Kelas tempat topik ini pertama diperkenalkan (Learning Progression Bagian 1).';
comment on column topik.kelas_kuasai is
  'Kelas tempat topik ini diharapkan sudah dikuasai penuh (Learning Progression Bagian 1). Kolom inilah yang dipakai klaim "kemampuan setara kelas Y": seluruh topik dengan kelas_kuasai <= Y harus tuntas.';

-- 2. Topik Fase A–C dan E–F ----------------------------------------------------
--
-- `on conflict do nothing`: berkas ini aman diulang, dan menjalankannya lagi
-- tidak boleh menimpa nama topik yang mungkin sudah disunting kurator.
insert into topik (id, nama, elemen, jenjang_kelas, penanda_remediasi, urutan, aktif) values
  ('AC-01', 'Bilangan cacah sampai 100; komposisi/dekomposisi', 'bilangan', '1', 'biasa', 1, false),
  ('AC-02', 'Bangun datar/ruang dasar; posisi benda', 'geometri_pengukuran', '1', 'biasa', 2, false),
  ('AC-03', 'Operasi tambah-kurang bilangan cacah sampai 20', 'bilangan', '1-2', 'biasa', 3, false),
  ('AC-04', 'Pola bukan bilangan (gambar, warna, suara)', 'aljabar', '1-2', 'biasa', 4, false),
  ('AC-05', 'Pecahan setengah & seperempat (konkret)', 'bilangan', '1-2', 'biasa', 5, false),
  ('AC-06', 'Bandingkan panjang/berat/durasi (satuan tidak baku)', 'geometri_pengukuran', '1-2', 'biasa', 6, false),
  ('AC-07', 'Urutkan, sortir, kelompokkan, sajikan data (piktogram)', 'data_peluang', '1-2', 'biasa', 7, false),
  ('AC-08', 'Bilangan cacah sampai 10.000', 'bilangan', '3', 'biasa', 8, false),
  ('AC-09', 'Operasi tambah-kurang bilangan cacah sampai 1.000', 'bilangan', '3-4', 'biasa', 9, false),
  ('AC-10', 'Operasi kali-bagi bilangan cacah', 'bilangan', '3-4', 'biasa', 10, false),
  ('AC-11', 'Isi nilai belum diketahui (pre-aljabar)', 'aljabar', '3-4', 'biasa', 11, false),
  ('AC-12', 'Pola gambar/bilangan sederhana (+/− sampai 100)', 'aljabar', '3-4', 'biasa', 12, false),
  ('AC-13', 'Ciri-ciri bangun datar/ruang', 'geometri_pengukuran', '3-6', 'biasa', 13, false),
  ('AC-14', 'Konstruksi bangun ruang & visualisasi spasial', 'geometri_pengukuran', '3-6', 'biasa', 14, false),
  ('AC-15', 'Satuan baku panjang/volume/berat', 'geometri_pengukuran', '3-6', 'biasa', 15, false),
  ('AC-16', 'Interpretasi & identifikasi kesalahan diagram batang', 'data_peluang', '3-6', 'biasa', 16, false),
  ('AC-17', 'Kelipatan dan faktor', 'bilangan', '4', 'biasa', 17, false),
  ('AC-18', 'Bandingkan & urutkan pecahan; pecahan senilai', 'bilangan', '4-5', 'biasa', 18, false),
  ('AC-19', 'Representasi pecahan dari bagian objek utuh (presisi tinggi)', 'bilangan', '5-6', 'ekstra', 19, false),
  ('AC-20', 'Mengurutkan bilangan bentuk berbeda (cacah, pecahan, desimal, persentase)', 'bilangan', '5-6', 'ekstra', 20, false),
  ('AC-21', 'Faktor & bilangan prima; KPK dan FPB', 'bilangan', '5-6', 'biasa', 21, false),
  ('AC-22', 'Operasi +,−,×,÷ bilangan cacah (maks 4 angka) & estimasi', 'bilangan', '5-6', 'biasa', 22, false),
  ('AC-23', 'Operasi hitung campuran (pecahan + bilangan asli)', 'bilangan', '5-6', 'biasa', 23, false),
  ('AC-24', 'Persamaan sederhana operasi hitung (representasi visual/simbol)', 'aljabar', '5-6', 'biasa', 24, false),
  ('AC-25', 'Pangkat dua/tiga, akar pangkat dua/tiga', 'bilangan', '5-6', 'biasa', 25, false),
  ('AC-26', 'Keliling & luas bangun datar segi banyak (gabungan segitiga)', 'geometri_pengukuran', '5-6', 'biasa', 26, false),
  ('AC-27', 'Menentukan panjang dari luas (kebalikan, satuan tepat)', 'geometri_pengukuran', '5-6', 'ekstra', 27, false),
  ('AC-28', 'Luas permukaan & volume kubus/balok dan gabungannya', 'geometri_pengukuran', '5-6', 'biasa', 28, false),
  ('AC-29', 'Besar sudut dari masalah kontekstual', 'geometri_pengukuran', '5-6', 'biasa', 29, false),
  ('AC-30', 'Durasi aktivitas dari keterangan waktu (jam)', 'geometri_pengukuran', '5-6', 'biasa', 30, false),
  ('AC-31', 'Menyajikan, menganalisis, menginterpretasi data untuk masalah', 'data_peluang', '5-6', 'biasa', 31, false),
  ('EF-01', 'Bunga majemuk & anuitas (model pinjaman/investasi)', 'bilangan', '10', 'biasa', 201, false),
  ('EF-02', 'Fungsi invers, komposisi fungsi', 'aljabar', '10', 'ekstra_wajib', 202, false),
  ('EF-03', 'Transformasi fungsi (linear, kuadrat, eksponensial)', 'aljabar', '10', 'biasa', 203, false),
  ('EF-04', 'Teorema lingkaran; trigonometri segitiga siku-siku', 'geometri_pengukuran', '10', 'biasa', 204, false),
  ('EF-05', 'Gabungan/irisan himpunan bilangan; klasifikasi sifat bilangan lanjut', 'bilangan', '11', 'ekstra_wajib', 205, false),
  ('EF-06', 'Sifat operasi bilangan real pada bentuk kompleks', 'bilangan', '11', 'biasa', 206, false),
  ('EF-07', 'Sistem pertidaksamaan/persamaan linear multivariabel (maks 3 variabel)', 'aljabar', '11', 'ekstra_wajib', 207, false),
  ('EF-08', 'Barisan-deret aritmatika (lanjutan)', 'aljabar', '11', 'biasa', 208, false),
  ('EF-09', 'Barisan-deret geometri', 'aljabar', '11', 'ekstra_wajib', 209, false),
  ('EF-10', 'Hubungan antar garis/bidang & kesebangunan (bangun ruang, lanjut)', 'geometri_pengukuran', '11', 'biasa', 210, false),
  ('EF-11', 'Transformasi geometri komposisi (gabungan ≥2 transformasi)', 'geometri_pengukuran', '11-12', 'ekstra_wajib', 211, false),
  ('EF-12', 'Jarak dua titik & volume/luas permukaan bangun ruang gabungan (sisi lengkung)', 'geometri_pengukuran', '11-12', 'ekstra_wajib', 212, false),
  ('EF-13', 'Interpretasi diagram garis; pencacahan (aturan penjumlahan/perkalian)', 'data_peluang', '11', 'ekstra', 213, false),
  ('EF-14', 'Ukuran pemusatan/sebaran untuk melengkapi data', 'data_peluang', '11-12', 'biasa', 214, false),
  ('EF-15', 'Peluang kejadian tunggal (kontekstual kompleks, lanjut)', 'data_peluang', '12', 'biasa', 215, false),
  ('EF-16', 'Peluang kejadian majemuk', 'data_peluang', '12', 'ekstra_wajib', 216, false),
  ('EF-17', 'Trigonometri lanjut, limit, dasar kalkulus, vektor/matriks', 'aljabar', '11-12', 'biasa', 217, false)
on conflict (id) do nothing;

-- 3. Urutan tunggal lintas fase ------------------------------------------------
update topik t set urutan = v.urutan
from (values
  ('D-01', 101),
  ('D-02', 102),
  ('D-03', 103),
  ('D-04', 104),
  ('D-05', 105),
  ('D-06', 106),
  ('D-07', 107),
  ('D-08', 108),
  ('D-09', 109),
  ('D-10', 110),
  ('D-11', 111),
  ('D-12', 112),
  ('D-13', 113),
  ('D-14', 114),
  ('D-15', 115),
  ('D-16', 116),
  ('D-17', 117),
  ('D-18', 118),
  ('D-19', 119),
  ('AC-01', 1),
  ('AC-02', 2),
  ('AC-03', 3),
  ('AC-04', 4),
  ('AC-05', 5),
  ('AC-06', 6),
  ('AC-07', 7),
  ('AC-08', 8),
  ('AC-09', 9),
  ('AC-10', 10),
  ('AC-11', 11),
  ('AC-12', 12),
  ('AC-13', 13),
  ('AC-14', 14),
  ('AC-15', 15),
  ('AC-16', 16),
  ('AC-17', 17),
  ('AC-18', 18),
  ('AC-19', 19),
  ('AC-20', 20),
  ('AC-21', 21),
  ('AC-22', 22),
  ('AC-23', 23),
  ('AC-24', 24),
  ('AC-25', 25),
  ('AC-26', 26),
  ('AC-27', 27),
  ('AC-28', 28),
  ('AC-29', 29),
  ('AC-30', 30),
  ('AC-31', 31),
  ('EF-01', 201),
  ('EF-02', 202),
  ('EF-03', 203),
  ('EF-04', 204),
  ('EF-05', 205),
  ('EF-06', 206),
  ('EF-07', 207),
  ('EF-08', 208),
  ('EF-09', 209),
  ('EF-10', 210),
  ('EF-11', 211),
  ('EF-12', 212),
  ('EF-13', 213),
  ('EF-14', 214),
  ('EF-15', 215),
  ('EF-16', 216),
  ('EF-17', 217)
) as v(id, urutan)
where t.id = v.id;

-- 4. Tolok ukur kelas untuk seluruh 67 topik -----------------------------------
update topik t set kelas_mulai = v.mulai, kelas_kuasai = v.kuasai
from (values
  ('D-01', 7, 7),
  ('D-02', 7, 7),
  ('D-03', 7, 7),
  ('D-04', 7, 7),
  ('D-05', 7, 7),
  ('D-06', 7, 7),
  ('D-07', 7, 8),
  ('D-08', 8, 8),
  ('D-09', 8, 8),
  ('D-10', 8, 8),
  ('D-11', 8, 8),
  ('D-12', 8, 8),
  ('D-13', 8, 9),
  ('D-14', 9, 9),
  ('D-15', 9, 9),
  ('D-16', 9, 9),
  ('D-17', 9, 9),
  ('D-18', 9, 9),
  ('D-19', 9, 9),
  ('AC-01', 1, 1),
  ('AC-02', 1, 1),
  ('AC-03', 1, 2),
  ('AC-04', 1, 2),
  ('AC-05', 1, 2),
  ('AC-06', 1, 2),
  ('AC-07', 1, 2),
  ('AC-08', 3, 3),
  ('AC-09', 3, 4),
  ('AC-10', 3, 4),
  ('AC-11', 3, 4),
  ('AC-12', 3, 4),
  ('AC-13', 3, 6),
  ('AC-14', 3, 6),
  ('AC-15', 3, 6),
  ('AC-16', 3, 6),
  ('AC-17', 4, 4),
  ('AC-18', 4, 5),
  ('AC-19', 5, 6),
  ('AC-20', 5, 6),
  ('AC-21', 5, 6),
  ('AC-22', 5, 6),
  ('AC-23', 5, 6),
  ('AC-24', 5, 6),
  ('AC-25', 5, 6),
  ('AC-26', 5, 6),
  ('AC-27', 5, 6),
  ('AC-28', 5, 6),
  ('AC-29', 5, 6),
  ('AC-30', 5, 6),
  ('AC-31', 5, 6),
  ('EF-01', 10, 10),
  ('EF-02', 10, 10),
  ('EF-03', 10, 10),
  ('EF-04', 10, 10),
  ('EF-05', 11, 11),
  ('EF-06', 11, 11),
  ('EF-07', 11, 11),
  ('EF-08', 11, 11),
  ('EF-09', 11, 11),
  ('EF-10', 11, 11),
  ('EF-11', 11, 12),
  ('EF-12', 11, 12),
  ('EF-13', 11, 11),
  ('EF-14', 11, 12),
  ('EF-15', 12, 12),
  ('EF-16', 12, 12),
  ('EF-17', 11, 12)
) as v(id, mulai, kuasai)
where t.id = v.id;

-- 5. Prasyarat, termasuk yang menyeberang fase ---------------------------------
--
-- Sepuluh topik Fase E-F mensyaratkan topik Fase D — itulah alasan skema ID
-- global di dokumennya, dan alasan `topik_prasyarat` menjadi tabel alih-alih
-- array di dalam barisnya sendiri.
insert into topik_prasyarat (topik_id, prasyarat_id) values
  ('AC-03', 'AC-01'),
  ('AC-05', 'AC-03'),
  ('AC-06', 'AC-02'),
  ('AC-08', 'AC-01'),
  ('AC-09', 'AC-03'),
  ('AC-09', 'AC-08'),
  ('AC-10', 'AC-09'),
  ('AC-11', 'AC-09'),
  ('AC-12', 'AC-04'),
  ('AC-13', 'AC-02'),
  ('AC-14', 'AC-13'),
  ('AC-15', 'AC-06'),
  ('AC-16', 'AC-07'),
  ('AC-17', 'AC-10'),
  ('AC-18', 'AC-05'),
  ('AC-19', 'AC-18'),
  ('AC-20', 'AC-19'),
  ('AC-21', 'AC-17'),
  ('AC-22', 'AC-10'),
  ('AC-23', 'AC-19'),
  ('AC-23', 'AC-22'),
  ('AC-24', 'AC-11'),
  ('AC-24', 'AC-22'),
  ('AC-25', 'AC-22'),
  ('AC-26', 'AC-13'),
  ('AC-26', 'AC-22'),
  ('AC-27', 'AC-26'),
  ('AC-28', 'AC-26'),
  ('AC-29', 'AC-13'),
  ('AC-30', 'AC-15'),
  ('AC-31', 'AC-16'),
  ('AC-31', 'AC-22'),
  ('EF-01', 'D-02'),
  ('EF-02', 'D-13'),
  ('EF-03', 'EF-02'),
  ('EF-04', 'D-12'),
  ('EF-05', 'EF-01'),
  ('EF-06', 'EF-05'),
  ('EF-07', 'D-14'),
  ('EF-08', 'D-15'),
  ('EF-09', 'EF-08'),
  ('EF-10', 'D-10'),
  ('EF-11', 'D-16'),
  ('EF-12', 'D-17'),
  ('EF-13', 'D-04'),
  ('EF-14', 'EF-13'),
  ('EF-15', 'D-19'),
  ('EF-16', 'EF-15'),
  ('EF-17', 'EF-04'),
  ('EF-17', 'EF-09')
on conflict do nothing;

notify pgrst, 'reload schema';
