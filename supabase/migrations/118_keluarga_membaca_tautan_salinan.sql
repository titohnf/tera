-- Keluarga boleh membaca tautan salinan materi.
--
-- Migrasi 117 memindahkan tautan materi ke salinan di Drive TERA, tapi
-- pemindahan itu baru terjadi di halaman admin. Panel materi di `/belajar`
-- membaca `curriculum_resources.link_url` langsung — berkas SUMBER milik tutor,
-- yang justru sering meminta izin akses. Anak yang membukanya melihat formulir
-- minta akses di dalam bingkainya, persis penyakit yang sudah dicatat panjang
-- lebar di `scripts/buka-akses-materi.mjs`.
--
-- Supaya `materiTopik()` bisa menukarnya, pembacanya harus boleh melihat tabel
-- duplikasi. 058 hanya memberi hak kepada admin, dan permukaan belajar memakai
-- client sesi, bukan service role — jadi tanpa policy ini penukarannya selalu
-- pulang kosong dan diam-diam tidak melakukan apa pun.
--
-- Yang dibuka cuma pasangan "id berkas sumber → tautan salinan". Tidak ada
-- nilai lain di tabel ini, dan tautannya sendiri toh sudah ditampilkan ke
-- keluarga lewat `curriculum_resources` yang dibuka policy 076.
create policy "Families read curriculum resource duplications"
  on curriculum_resource_duplications for select using (is_family());
