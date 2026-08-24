-- ============================================================
-- Batas ukuran dan tipe berkas untuk bucket `quiz-uploads`
--
-- Bucket ini dibuat di migrasi 061 untuk tipe soal `upload_file`, dengan policy
-- yang membiarkan SIAPA PUN mengunggah:
--
--     create policy "anyone can upload quiz files" on storage.objects
--       for insert with check (bucket_id = 'quiz-uploads');
--
-- dan bucket-nya `public = true`, jadi apa pun yang masuk bisa dibaca siapa pun
-- yang tahu URL-nya. Tanpa batas ukuran dan tipe, itu bukan cuma bucket kuis —
-- itu penampung berkas anonim gratis di atas kuota Supabase milik bimbel.
--
-- YANG SENGAJA TIDAK DILAKUKAN: membatasi policy insert ke `authenticated`.
-- Murid mengerjakan paket soal di Sora sebagai TAMU, tanpa sesi login sama
-- sekali (`/q/[code]`) — itu rancangan yang disengaja di 061, dan mempersempit
-- policy-nya akan memutus pengumpulan jawaban bertipe upload tanpa satu pun
-- pesan galat yang dilihat murid. Yang bisa diperketat tanpa menyentuh siapa
-- yang boleh menulis adalah APA yang boleh ditulis, dan itulah isi migrasi ini.
--
-- Menutup policy-nya sendiri baru masuk akal bersamaan dengan pemensiunan
-- halaman murid di Sora, sekalian dengan policy `using (true)` di
-- `practice_answers` dan `attempts` yang menunggu momen yang sama.
--
-- 25 MB: cukup untuk foto pekerjaan tulis tangan dan PDF beberapa halaman —
-- jenis berkas yang memang dikumpulkan tipe soal ini — dan jauh di bawah angka
-- yang membuat bucket ini menarik sebagai tempat menitipkan berkas lain.
-- ============================================================

update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array[
      'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
      'application/pdf'
    ]
where id = 'quiz-uploads';
