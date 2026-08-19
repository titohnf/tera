-- ============================================================
-- class_slots.effective_from — sejak kapan sebuah slot berlaku
--
-- Slot kelas (hari + jam + mapel + tutor) selama ini berlaku untuk seluruh
-- umur kelas. Akibatnya tidak ada cara menyatakan "hari Selasa jadi Bahasa
-- Indonesia mulai Agustus": mengubah mapel slot akan menulis ulang juga sesi
-- Selasa bulan-bulan sebelumnya yang kebetulan masih kosong, sehingga riwayat
-- kelas ikut berubah surut. Satu-satunya pengaman selama ini adalah kebetulan:
-- sesi lama yang sudah diisi tutor memang tidak disentuh regenerasi.
--
-- Dengan kolom ini, updateClass hanya membangun ulang sesi pada tanggal >=
-- effective_from untuk hari yang bersangkutan; tanggal sebelumnya dibiarkan
-- apa adanya, terisi maupun tidak.
--
-- Null berarti "berlaku sejak kelas dimulai" — perilaku lama, dan itulah nilai
-- semua baris yang sudah ada.
-- ============================================================

alter table class_slots
  add column if not exists effective_from date;

comment on column class_slots.effective_from is
  'Tanggal mulai berlakunya slot ini. Null = sejak kelas dimulai. Sesi sebelum tanggal ini tidak ikut digenerate ulang saat kelas diedit.';
