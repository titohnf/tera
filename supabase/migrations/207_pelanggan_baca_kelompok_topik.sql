-- ============================================================
-- Pelanggan langganan boleh membaca kelompok topik kurikulum
--
-- Layar pertama `/belajar` menghitung jumlah topik tiap mapel dari
-- `curriculum_topic_groups` (`mapelLatihan()` di lib/belajar/sesi.ts), dibaca
-- lewat client sesi. Keluarga boleh membacanya sejak 076; pelanggan langganan
-- tidak pernah diberi — 126 hanya membuka `curriculum_topics`. Akibatnya kuerinya
-- pulang kosong tanpa galat, dan setiap kartu mapel menampilkan "0 topik"
-- padahal soalnya ada dan daftar topik di dalamnya terisi (itu dibaca lewat
-- RPC yang security definer, jadi tidak ikut terhalang).
--
-- Alasannya sama dengan 126 dan masih berlaku persis: kurikulum bukan data per
-- murid, dan isi tabel ini — jenjang, semester, tema, nama topik — sudah
-- terbaca lewat `curriculum_topics`. Tidak ada kunci jawaban di sini.
-- ============================================================

create policy "Subscribers read curriculum groups" on curriculum_topic_groups
  for select using (has_product('sora'));

notify pgrst, 'reload schema';
