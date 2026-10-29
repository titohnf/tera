-- ============================================================
-- Sinkron soal digital: topik form dari SESI tempat tutor memakainya
--
-- Nama form tidak selalu memuat nama topik yang sama dengan kurikulum, tapi
-- tutor menempelkan tautan form itu di asesmen sebuah sesi, dan sesi itu sudah
-- tahu topiknya (`sessions.selected_cp_ids`). Menyambungkan keduanya
-- — tautan di asesmen -> id terbit form -> berkas Drive — memberi topik yang
-- pasti untuk form yang dipakai di sesi, termasuk form kelas privat.
--
-- Diuji 29 Okt 2026 terhadap 33 form yang sudah terpasang lewat nama: topiknya
-- sama persis dalam semua kasus (0 selisih).
--
--   * `terbit_id` = id terbit form (`/forms/d/e/<id>/viewform`), jembatan antara
--     berkas Drive dan tautan yang tutor tempel.
--   * `cara_cocok` menerima nilai baru 'tautan'.
-- ============================================================

alter table sinkron_soal_drive
  add column if not exists terbit_id text;

alter table sinkron_soal_drive
  drop constraint if exists sinkron_soal_drive_cara_cocok_check;

alter table sinkron_soal_drive
  add constraint sinkron_soal_drive_cara_cocok_check
  check (cara_cocok in ('nama', 'peta', 'kode', 'tautan'));
