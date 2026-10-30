-- ============================================================
-- Penanda "akses portal sudah dikirim ke orang tua"
--
-- Tombol "Kirim Akses ke WhatsApp Orang Tua" di halaman siswa hanya perlu
-- dipakai SEKALI per siswa: sesudah pesannya terkirim (tombol diklik), ia tidak
-- ditampilkan lagi. Kolom ini menyimpan kapan penandanya dipasang.
--
-- Siswa yang sudah ada saat migrasi ini dijalankan dianggap SUDAH dikirimi
-- (30 Okt 2026 semuanya dikirim manual), jadi tombol hanya muncul untuk siswa
-- yang dibuat sesudahnya.
--
-- Jalankan SEBELUM kode yang membacanya dideploy.
-- ============================================================

alter table profiles add column if not exists akses_dikirim_at timestamptz;

update profiles
set akses_dikirim_at = now()
where role = 'student' and akses_dikirim_at is null;

notify pgrst, 'reload schema';
