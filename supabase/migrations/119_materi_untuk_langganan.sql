-- ============================================================
-- Materi untuk akun langganan
--
-- Membalik satu keputusan dari 110, dengan sengaja. Sampai sekarang materi
-- adalah bahan internal bimbel: `curriculum_resources` cuma terbuka untuk
-- `is_admin()` (057) dan `is_family()` (076), dan `muatTopik()` bahkan pulang
-- dengan materi kosong tanpa query untuk pelanggan. Yang berubah bukan
-- keamanannya melainkan produknya — langganan SORA kini memang dimaksudkan
-- memberi anak bahan bacaannya, bukan cuma soal latihan.
--
-- DUA BATAS YANG TIDAK IKUT DIBUKA:
--
--   1. `kind = 'materi'` saja. `latihan_soal` di tabel yang sama adalah bahan
--      untuk MENYUSUN soal dan bisa memuat kunci jawaban — portal keluarga pun
--      tidak menampilkannya, dan `scripts/buka-akses-materi.mjs` tidak pernah
--      menyentuhnya. Policy yang membuka seluruh tabel akan membocorkannya ke
--      orang yang justru sedang mengerjakan soalnya.
--   2. `has_product('sora')`, bukan `role = 'mandiri'`. Yang berhak adalah yang
--      berlangganan aktif, dan hanya fungsi itu yang tahu tanggalnya — akun
--      yang langganannya habis berhenti melihat materi pada detik yang tepat,
--      tanpa bergantung pada proses apa pun yang harus berjalan (109).
--
-- Ini TIDAK memberi akses TERA kepada siapa pun. Larangan di 109 soal itu tetap
-- berlaku: yang dibuka di sini bahan ajar, bukan tagihan, jadwal, atau laporan,
-- dan tidak satu pun policy `family_covers_student()` disentuh.
-- ============================================================

create policy "Subscribers read learning materials" on curriculum_resources
  for select using (has_product('sora') and kind = 'materi');

-- Tanpa ini penukaran tautan ke salinan Drive TERA (117/118) diam-diam tidak
-- terjadi untuk pelanggan, dan yang mereka buka adalah berkas sumber milik
-- tutor — yang hampir selalu meminta izin akses.
create policy "Subscribers read curriculum resource duplications"
  on curriculum_resource_duplications for select using (has_product('sora'));

notify pgrst, 'reload schema';
