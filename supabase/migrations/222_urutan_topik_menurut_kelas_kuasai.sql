-- ============================================================
-- Urutan topik disesuaikan dengan kelas_kuasai
--
-- Checkpoint di layar Misi mengikuti `kelas_kuasai` (ukuran yang sama dengan
-- "setara kelas Y" di laporan orang tua, 181). Tiga topik berdiri di urutan yang
-- lebih belakang dari kelasnya, sehingga checkpointnya naik-turun dan kelas 5
-- tidak pernah tampil (satu-satunya topik kelas 5, AC-18, ada sesudah topik
-- kelas 6):
--
--   AC-13..16 (kuasai 6) mendahului AC-17 (4) dan AC-18 (5)
--   EF-11, EF-12 (kuasai 12) mendahului EF-13 (11)
--
-- Berkas ini hanya MENUKAR letak. Tidak ada prasyarat yang dilanggar: AC-17
-- bergantung pada AC-10 dan AC-18 pada AC-05 (keduanya jauh di depan), AC-13..16
-- pada AC-02/13/06/07, EF-13 pada D-04 (EF-14 bergantung pada EF-13, dan EF-14
-- tetap sesudahnya), EF-11/12 pada D-16/D-17.
--
-- YANG IKUT BERUBAH, dan memang dimaksudkan: urutan rekomendasi bagi anak yang
-- belum menuntaskan topik-topik ini. Topik yang sudah tuntas tidak terpengaruh
-- selain letaknya di daftar.
--
-- Aman dijalankan berulang. Jalankan sesudah 221.
-- ============================================================

update topik t set urutan = v.urutan
from (values
  ('AC-17', 13),
  ('AC-18', 14),
  ('AC-13', 15),
  ('AC-14', 16),
  ('AC-15', 17),
  ('AC-16', 18),
  ('EF-13', 211),
  ('EF-11', 212),
  ('EF-12', 213)
) as v(id, urutan)
where t.id = v.id and t.urutan is distinct from v.urutan;
