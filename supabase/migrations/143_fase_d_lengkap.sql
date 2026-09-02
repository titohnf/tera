-- ============================================================
-- Peta kompetensi Fase D lengkap: 19 topik beserta rantai prasyaratnya
--
-- Migrasi 140 membuat tabelnya dan mengisi satu baris. Satu baris tidak pernah
-- menguji apa pun: rantai prasyarat yang cuma punya satu simpul tidak bisa
-- salah, dan `evaluasi_unlock` yang belum ditulis pun akan terlihat benar.
-- Migrasi ini mengisi seluruh Fase D supaya rantainya bisa diperiksa sungguhan.
--
-- SUMBERNYA `Learning_Progression_Matematika.md` Bagian 2.1, disalin apa
-- adanya — bukan diringkas ulang di sini. Kalau dokumen itu direvisi, migrasi
-- baru yang menyesuaikan, bukan baris ini yang disunting.
--
-- KENAPA SELURUH FASE D, PADAHAL PILOT CUMA D-01. Karena yang diisi di sini
-- peta, bukan pekerjaan. `aktif = false` untuk 18 topik berarti tidak satu pun
-- muncul di hadapan murid; yang mereka lakukan hanya membuat prasyarat D-01
-- punya konteks dan membuat ekspansi berikutnya tinggal menyalakan, bukan
-- memasukkan data sambil menebak-nebak lagi.
--
-- YANG SENGAJA TIDAK ADA DI SINI: pemetaan `topik_grup` untuk ke-18 topik baru.
-- D-01 dipetakan di migrasi 140 lewat `where theme = 'Bilangan Bulat'`, dan itu
-- kebetulan benar untuk satu kasus. Untuk sisanya tema kurikulum tidak sejajar
-- dengan topik progression — dokumen 140 sendiri mencatat bahwa "sifat operasi"
-- milik D-01 justru duduk di tema Bilangan Rasional. Menebak dengan pola yang
-- sama akan melahirkan label salah yang muncul diam-diam di layar orang tua.
-- Pemetaannya ditulis per pasangan sesudah dilihat manusia, di migrasi
-- tersendiri.
--
-- Catatan lapangan yang perlu diketahui saat memetakan nanti: dari 19 topik ini
-- hanya 6 yang punya padanan di kurikulum bimbel (D-01/02/03 di Kelas 7;
-- D-08/09/12 di Kelas 8). Matematika Kelas 9 Kurikulum Merdeka belum terisi
-- sama sekali, jadi D-14 sampai D-19 memang belum punya grup untuk dipetakan —
-- keadaan yang sah, bukan pekerjaan yang terlewat.
-- ============================================================

-- 1. Topik ---------------------------------------------------------------------
--
-- `penanda_remediasi` mengikuti tanda [EKSTRA] dan [EKSTRA WAJIB] di kolom
-- "Kriteria naik" dokumen sumber. Bukan hiasan: ia yang menentukan interval
-- retest awal 7 hari alih-alih 14 (FR11), dan kelak bobot rekomendasi.
--
-- `jenjang_kelas` teks, bukan angka — sebagian topik membentang dua kelas
-- (D-07 di 7-8, D-13 di 8-9), dan memaksanya jadi satu angka berarti memilih
-- salah satu lalu melupakan yang lain.
insert into topik (id, nama, elemen, jenjang_kelas, penanda_remediasi, urutan, aktif) values
  ('D-01', 'Bilangan Bulat: operasi & sifat dasar',                         'bilangan',            '7',   'biasa',        1,  true),
  ('D-02', 'Bilangan Rasional: pecahan, desimal, persen, urutan bilangan',  'bilangan',            '7',   'ekstra',       2,  false),
  ('D-03', 'Rasio, proporsi, perbandingan senilai/berbalik nilai',          'bilangan',            '7',   'biasa',        3,  false),
  ('D-04', 'Data: perumusan pertanyaan, penyajian & interpretasi dasar',    'data_peluang',        '7',   'biasa',        4,  false),
  ('D-05', 'Data: mean, median, modus, jangkauan',                          'data_peluang',        '7',   'ekstra',       5,  false),
  ('D-06', 'Geometri: hubungan antar-sudut',                                'geometri_pengukuran', '7',   'biasa',        6,  false),
  ('D-07', 'Aljabar: bentuk aljabar & sifat operasi',                       'aljabar',             '7-8', 'biasa',        7,  false),
  ('D-08', 'Bilangan: bilangan berpangkat, bentuk akar, notasi ilmiah',     'bilangan',            '8',   'ekstra_wajib', 8,  false),
  ('D-09', 'Aljabar: PLSV & pertidaksamaan linear satu variabel',           'aljabar',             '8',   'biasa',        9,  false),
  ('D-10', 'Geometri: kekongruenan & kesebangunan',                         'geometri_pengukuran', '8',   'biasa',        10, false),
  ('D-11', 'Geometri: jaring-jaring bangun ruang',                          'geometri_pengukuran', '8',   'biasa',        11, false),
  ('D-12', 'Geometri: Teorema Pythagoras',                                  'geometri_pengukuran', '8',   'biasa',        12, false),
  ('D-13', 'Aljabar: relasi, fungsi, koordinat kartesius',                  'aljabar',             '8-9', 'biasa',        13, false),
  ('D-14', 'Aljabar: Sistem Persamaan Linear Dua Variabel (SPLDV)',         'aljabar',             '9',   'biasa',        14, false),
  ('D-15', 'Aljabar: barisan dan deret',                                    'aljabar',             '9',   'biasa',        15, false),
  ('D-16', 'Geometri: transformasi tunggal',                                'geometri_pengukuran', '9',   'biasa',        16, false),
  ('D-17', 'Geometri: luas/keliling kompleks, volume gabungan, luas juring', 'geometri_pengukuran','9',   'ekstra_wajib', 17, false),
  ('D-18', 'Data: perbandingan pemusatan/penyebaran antar kelompok',        'data_peluang',        '9',   'biasa',        18, false),
  ('D-19', 'Data: peluang & frekuensi relatif kejadian tunggal',            'data_peluang',        '9',   'biasa',        19, false)
on conflict (id) do nothing;

-- 2. Prasyarat -----------------------------------------------------------------
--
-- Sembilan belas sisi untuk lima belas topik: empat topik sengaja tanpa
-- prasyarat sama sekali (D-01, D-04, D-06, D-19) dan menurut dokumen sumber
-- keempatnya BOLEH DIKERJAKAN PARALEL — urutan nomor ID bukan urutan wajib,
-- yang wajib linear hanya rantai prasyarat eksplisit di bawah ini.
--
-- Empat topik punya dua prasyarat sekaligus. D-12 yang paling penting dibaca:
-- Pythagoras menuntut D-08 (bentuk akar), bukan cuma D-06 (sudut) — dokumen
-- sumber menandainya dengan tanda seru karena inilah rantai yang paling sering
-- dilewati, dan akibatnya murid mengerjakan Pythagoras tanpa bisa menyederhanakan
-- akar hasilnya.
insert into topik_prasyarat (topik_id, prasyarat_id) values
  ('D-02', 'D-01'),
  ('D-03', 'D-02'),
  ('D-05', 'D-04'),
  ('D-07', 'D-01'),
  ('D-07', 'D-02'),
  ('D-08', 'D-02'),
  ('D-09', 'D-07'),
  ('D-10', 'D-03'),
  ('D-11', 'D-06'),
  ('D-12', 'D-08'),
  ('D-12', 'D-06'),
  ('D-13', 'D-09'),
  ('D-14', 'D-09'),
  ('D-14', 'D-13'),
  ('D-15', 'D-07'),
  ('D-16', 'D-13'),
  ('D-17', 'D-11'),
  ('D-17', 'D-12'),
  ('D-18', 'D-05')
on conflict (topik_id, prasyarat_id) do nothing;

notify pgrst, 'reload schema';
