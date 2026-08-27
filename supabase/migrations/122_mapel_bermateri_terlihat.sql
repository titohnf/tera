-- ============================================================
-- Mapel yang baru punya materi ikut terlihat
--
-- `/belajar` selama ini soal-first: daftar mapelnya datang dari
-- `practice_subjects()`, yang menyaring habis mapel tanpa soal, dan daftar
-- topiknya disaring lagi di layar dengan `question_count > 0`. Akibatnya
-- SELURUH 53 materi tidak bisa dicapai satu pun keluarga — 44 topik bermateri
-- semuanya belum punya soal, dan tidak ada satu pun topik yang punya keduanya.
-- Bahan yang sudah dikumpulkan, dikonversi, dan disimpan rapi tetap tak
-- terlihat, bukan karena tidak ada melainkan karena tidak dicari.
--
-- Keputusannya: setiap topik SEHARUSNYA punya materi dan soal, dan yang belum
-- lengkap DIBERITAHUKAN di layar, bukan disembunyikan. Katalog yang diam soal
-- yang belum ada tidak membuat pekerjaannya selesai — ia cuma memindahkan
-- kejutannya ke orang tua yang bertanya "materinya di mana".
--
-- `practice_subjects()` SENGAJA TIDAK DIUBAH. Ia dipakai bersama repo `form`
-- (Sora), dan menambah mapel tanpa soal ke hasilnya akan mengubah permukaan
-- latihan di sana juga — mapel yang tidak bisa dilatih muncul di aplikasi yang
-- seluruhnya tentang berlatih. Penggabungannya dilakukan di sisi Tera
-- (`mapelLatihan()`), tempat keputusan itu memang berlaku. Disiplin yang sama
-- dengan 092 dan 110: fungsi bersama tidak berubah arti demi satu pemakainya.
--
-- Yang dibutuhkan penggabungan itu cuma satu: pelanggan langganan boleh membaca
-- NAMA mapel. Keluarga sudah boleh sejak 076; pelanggan belum pernah, karena
-- sampai 119 mereka tidak punya urusan dengan tabel kurikulum mana pun.
-- ============================================================

create policy "Subscribers read subjects" on subjects
  for select using (has_product('sora'));

notify pgrst, 'reload schema';
