-- ============================================================
-- Pelanggan langganan boleh membaca urutan kurikulum
--
-- Daftar topik di `/belajar` sekarang disusun menurut `curriculum_topics
-- .sort_order` — urutan yang dirapikan admin lewat tombol naik-turun di menu
-- Kurikulum — bukan menurut abjad. Tanpa baris ini, pelanggan langganan tetap
-- mendapat urutan abjad: kuerinya balik kosong dan penyusunannya batal.
--
-- Keluarga sudah boleh sejak 076, dengan alasan yang masih berlaku persis:
-- kurikulum bukan data per murid, dan yang membatasi relevansinya adalah
-- tampilan, bukan RLS.
--
-- HANYA `curriculum_topics`, dan itu memang seluruh isinya: rumusan capaian
-- pembelajaran, tema, dan urutan. Tidak ada kunci jawaban di sana —
-- `curriculum_resources` yang bisa memuat bahan penyusun soal tetap disaring
-- `kind = 'materi'` seperti yang ditetapkan 119.
-- ============================================================

create policy "Subscribers read curriculum" on curriculum_topics
  for select using (has_product('sora'));

notify pgrst, 'reload schema';
