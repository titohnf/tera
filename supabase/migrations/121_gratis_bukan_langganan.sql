-- ============================================================
-- `is_public` berpindah arti: dari "boleh untuk pelanggan" jadi "gratis untuk siapa saja"
--
-- Migrasi 110 memasang saringan dengan asumsi yang sejak itu berubah: pelanggan
-- langganan dianggap orang luar yang hanya boleh menyentuh sebagian bank soal.
-- Keputusan produk hari ini kebalikannya — yang MEMBAYAR mendapat semuanya,
-- persis seperti murid bimbel. Yang disaring bukan lagi pelanggan, melainkan
-- lapisan gratis yang belum ada: orang yang mencoba tanpa berlangganan sama
-- sekali.
--
-- Jadi kolomnya tidak dihapus dan tidak diganti nama — artinya yang bergeser,
-- dan pergeseran itu MELONGGARKAN, tidak pernah mengetatkan. Soal yang hari ini
-- bertanda publik tetap bisa dikerjakan orang yang sama; yang bertambah adalah
-- soal yang tidak bertanda, untuk orang yang sudah membayar.
--
-- Namanya dibiarkan `is_public` walau "public" kini berarti gratis, bukan
-- sekadar keluar dari bimbel. Kolom ini menempel di tabel warisan QuizCraft
-- yang juga ditulis repo `form` (Sora); mengganti namanya berarti memaksa dua
-- repo di-deploy pada detik yang sama dengan migrasi ini — hal yang justru
-- dihindari seluruh disiplin kompatibilitas mundur di 092 dan 110.
--
-- SATU-SATUNYA yang berubah adalah predikatnya. Tidak ada tanda tangan fungsi
-- yang bergerak, jadi Sora tidak perlu di-deploy ulang, dan keenam fungsi
-- `practice_*` yang memanggilnya di 110 tidak perlu disentuh sama sekali.
-- ============================================================

comment on column question_bank_items.is_public is
  'Gratis untuk siapa saja, termasuk yang tidak berlangganan. Default false: bank soal milik bimbel kecuali dinyatakan lain. Pelanggan langganan aktif mendapat SELURUH bank soal dan tidak bergantung pada kolom ini (migrasi 121).';

-- Sebelumnya: setiap akun `mandiri` disaring. Sekarang: hanya yang langganan
-- SORA-nya tidak aktif.
--
-- `has_product()` yang memutuskan, bukan `role`, dan pemisahan itu sudah jadi
-- pendirian sejak 109: role menjawab "siapa kamu", langganan menjawab "apa yang
-- boleh kamu pakai". Ia juga memeriksa tanggal, jadi akun yang langganannya
-- habis jatuh kembali ke soal gratis pada detik yang tepat — tanpa bergantung
-- pada proses apa pun yang harus berjalan.
--
-- HARI INI PREDIKAT INI SELALU FALSE, dan itu bukan kekeliruan. Pintu masuknya
-- sendiri, `practice_start_as_me()` (110), masih menolak siapa pun tanpa
-- langganan aktif — jadi belum ada orang yang bisa sampai ke sini dalam keadaan
-- tersaring. Saringannya sengaja dipasang lebih dulu, sama seperti 110 menolak
-- membuka pintu ketiga sebelum saringannya ada: yang berbahaya adalah pintu
-- tanpa saringan, bukan saringan tanpa pintu.
create or replace function practice_only_public(p_access_code text, p_learner_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(p_access_code, '') = ''
     and public.get_my_role() = 'mandiri'
     and not public.has_product('sora');
$$;

notify pgrst, 'reload schema';
