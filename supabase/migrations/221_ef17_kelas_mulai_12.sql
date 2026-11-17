-- ============================================================
-- EF-17: kelas mulai 11 -> 12
--
-- Topik penutup "Trigonometri lanjut, limit, dasar kalkulus, vektor/matriks"
-- tercatat kelas_mulai = 11 (migrasi 180), tetapi urutannya 217: paling akhir,
-- sesudah EF-15 dan EF-16 yang kelas 12. Di layar Misi, checkpoint per kelas
-- (Jenderal = kelas 11, Legenda = kelas 12) jadi terbaca naik-turun.
--
-- `kelas_kuasai` EF-17 sudah 12, jadi kelas_mulai disamakan dengan urutan dan
-- penguasaannya. YANG IKUT BERUBAH, dan memang dimaksudkan:
--   * Anak kelas 11 melihat EF-17 di "Untuk jenjang di atasmu" (boleh dicoba),
--     bukan di jalur utama.
--   * `periksa_eskalasi_dua_paket()` (197) tidak lagi memanggil tutor untuk
--     anak kelas 11 pada EF-17, seperti topik kelas 12 lainnya.
-- Klaim kesetaraan kelas (181) memakai kelas_kuasai dan tidak terpengaruh.
--
-- Aman dijalankan berulang. Jalankan sesudah 220.
-- ============================================================

update topik set kelas_mulai = 12 where id = 'EF-17' and kelas_mulai is distinct from 12;
