-- ============================================================
-- `cancellation_reason` — kenapa sebuah sesi dibatalkan
--
-- Sesi yang dibatalkan selama ini hanya berubah status. Di halaman detail
-- kelas ia bahkan tidak terlihat berbeda sama sekali: kolom yang ada cuma
-- status payroll, sehingga sesi batal tampak seperti sesi biasa yang belum
-- diproses gajinya.
--
-- Padahal alasannya menentukan tindakan yang berbeda-beda. Siswa sakit
-- biasanya berarti sesi diganti hari lain dan tetap ditagihkan; libur nasional
-- berarti tidak ditagih dan tutor tidak dibayar; tutor berhalangan berarti
-- perlu tutor pengganti. Tanpa catatan itu, sebulan kemudian tidak ada yang
-- bisa menjelaskan kenapa jumlah pertemuan di invoice berbeda dari kalender —
-- pertanyaan yang justru sedang sering muncul sekarang.
--
-- Nullable, dan sengaja tidak dipaksa terisi: baris lama tidak punya alasan
-- untuk diisi surut, dan memaksanya hanya akan melahirkan alasan asal-asalan.
-- ============================================================

alter table sessions
  add column if not exists cancellation_reason text;

comment on column sessions.cancellation_reason is
  'Alasan sesi dibatalkan, diisi admin saat membatalkan. Null untuk sesi yang tidak dibatalkan atau yang dibatalkan sebelum kolom ini ada.';

-- Backfill dua tanggal libur nasional yang sesinya sudah dibatalkan lebih dulu,
-- sebelum kolom ini ada: 17 Agustus (Proklamasi Kemerdekaan, 3 sesi) dan
-- 25 Agustus (Maulid Nabi, 5 sesi). Keduanya dibatalkan atas dasar SKB 3
-- Menteri 2026, dan tanpa keterangan ini delapan sesi itu akan jadi satu-
-- satunya pembatalan di sistem yang tidak punya alasan.
update sessions
set cancellation_reason = 'Libur nasional — Proklamasi Kemerdekaan'
where status = 'cancelled'
  and cancellation_reason is null
  and scheduled_at >= '2026-08-17T00:00:00Z'
  and scheduled_at <  '2026-08-18T00:00:00Z';

update sessions
set cancellation_reason = 'Libur nasional — Maulid Nabi Muhammad saw.'
where status = 'cancelled'
  and cancellation_reason is null
  and scheduled_at >= '2026-08-25T00:00:00Z'
  and scheduled_at <  '2026-08-26T00:00:00Z';
