-- ============================================================
-- Sinkron soal digital: CP yang diajarkan dengan tiap form
--
-- Tabel Materi dan Latihan Soal memberi tiap item nomor CP (menurut kurikulum),
-- dan Bank Soal ikut: tiap paket dari sebuah form menunjuk CP-nya. CP sebuah
-- form hanya bisa diketahui dari sesi tempat tutor memakainya (tautan asesmen
-- di sesi -> `selected_cp_ids`), dan menyelesaikan tautan pendek (forms.gle)
-- ke id terbit form butuh permintaan jaringan — terlalu mahal untuk dilakukan
-- setiap halaman admin dibuka. Karena itu sinkron harian yang menghitungnya dan
-- menyimpannya di sini.
--
-- Yang disimpan ID CP, bukan nomornya: nomor dihitung dari kurikulum saat
-- halaman dibuka, jadi kalau kurikulum berubah labelnya ikut berubah; CP yang
-- sudah dihapus dari kurikulum cukup tidak tampil.
-- ============================================================

alter table sinkron_soal_drive
  add column if not exists cp_ids uuid[] not null default '{}';
