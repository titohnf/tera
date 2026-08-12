-- ============================================================
-- Memulihkan tanggal keluar siswa yang dinonaktifkan lewat tombol
-- "Nonaktifkan Siswa"
--
-- setStudentIsActive() di lib/actions/admin/users.ts menutup semua keanggotaan
-- kelas siswa dengan `is_active = false`, tapi tidak pernah mengisi
-- `unenrolled_at`. Bagi coversSession() di lib/enrollment.ts, baris non-aktif
-- tanpa tanggal keluar berarti "tanggal keluarnya tidak diketahui", dan
-- rentang seperti itu diperlakukan KOSONG — nol sesi dianggap milik siswa itu.
--
-- Akibatnya, begitu seorang siswa dinonaktifkan, halaman detailnya kehilangan
-- seluruh riwayat: tabel Riwayat Kelas menampilkan 0 sesi tanpa tanggal, tab
-- Jadwal kosong, statistik kehadiran dan nilainya hilang. Datanya tidak ke
-- mana-mana — hanya tersaring habis.
--
-- Aturan itu sendiri benar dan tetap dipertahankan: ia yang menjaga siswa yang
-- dikeluarkan versi lama tidak muncul kembali di seluruh sesi kelasnya (lihat
-- migrasi 085). Yang salah adalah penulisnya, dan itu sudah diperbaiki di
-- setStudentIsActive() sehingga baris baru selalu membawa tanggal keluar.
-- Migrasi ini membereskan baris yang terlanjur tertulis tanpa tanggal.
--
-- Tanggal keluar yang dipakai, berurutan sesuai ketersediaan:
--   1. sesi terakhir kelas itu yang sudah selesai — hari terakhir yang benar
--      benar ia jalani,
--   2. end_date kelas, untuk kelas yang belum punya sesi selesai,
--   3. enrolled_at, supaya rentangnya tetap valid (tidak pernah mundur
--      melewati tanggal masuk) walau isinya cuma satu hari.
-- ============================================================

update class_students cs
set unenrolled_at = greatest(
  cs.enrolled_at,
  coalesce(
    (
      select max(s.scheduled_at)
      from sessions s
      where s.class_id = cs.class_id
        and s.status = 'completed'
    ),
    c.end_date::timestamptz,
    cs.enrolled_at
  )
)
from classes c
where c.id = cs.class_id
  and cs.is_active = false
  and cs.unenrolled_at is null;
