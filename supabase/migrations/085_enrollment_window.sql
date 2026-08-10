-- Rentang keanggotaan siswa di sebuah kelas.
--
-- Sebelum ini `class_students` hanya punya `enrolled_at` (diisi now() saat
-- baris dibuat, tidak pernah dibaca siapa pun) dan `is_active`. Akibatnya
-- siswa yang baru masuk di tengah semester tetap dianggap anggota sejak
-- kelasnya dimulai: ia muncul di presensi sesi bulan-bulan sebelumnya,
-- ikut terhitung di laporan bulanan, dan invoice grupnya dihitung dari
-- start_date kelas.
--
-- Setelah migrasi ini, `enrolled_at` menjadi tanggal mulai yang bisa diedit
-- admin, dan `unenrolled_at` menandai tanggal terakhir siswa ikut kelas
-- (null = masih berjalan). Rentangnya inklusif di kedua ujung: sesi dihitung
-- milik siswa bila tanggalnya >= enrolled_at dan <= unenrolled_at.

alter table class_students
  add column if not exists unenrolled_at timestamptz;

comment on column class_students.enrolled_at is
  'Tanggal siswa mulai ikut kelas ini (inklusif). Sesi sebelum tanggal ini bukan miliknya.';
comment on column class_students.unenrolled_at is
  'Tanggal terakhir siswa ikut kelas ini (inklusif). Null berarti masih berjalan.';

-- Backfill konservatif: baris lama diperlakukan seperti perilaku sekarang,
-- yaitu anggota sejak kelas dimulai. Tanpa ini, enrolled_at yang berisi
-- "kapan baris dibuat" akan tiba-tiba menyembunyikan sesi-sesi lama dari
-- siswa yang memang sudah ikut sejak awal tapi baru didaftarkan belakangan.
update class_students cs
set enrolled_at = least(cs.enrolled_at, c.start_date::timestamptz)
from classes c
where c.id = cs.class_id
  and c.start_date is not null
  and cs.enrolled_at > c.start_date::timestamptz;

-- Siswa yang sudah dikeluarkan sebelum migrasi ini tidak punya jejak kapan
-- keluarnya. Sekarang mereka disaring lewat rentang, bukan lagi lewat
-- is_active saja, jadi beri rentang kosong supaya hasilnya persis sama
-- dengan sebelum migrasi. Admin bisa mengoreksi tanggalnya dari halaman
-- edit kelas kalau riwayatnya perlu benar.
update class_students
set unenrolled_at = enrolled_at
where is_active = false
  and unenrolled_at is null;

create index if not exists class_students_class_window_idx
  on class_students (class_id, enrolled_at, unenrolled_at);
