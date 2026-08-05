-- ============================================================
-- Kunci search_path untuk is_admin(), dan kualifikasi pemanggilannya di policy
-- Storage.
--
-- `is_admin()` dan `get_my_role()` (migrasi 004) adalah `security definer` tapi
-- tidak memasang `set search_path`. Untuk policy di tabel skema `public` itu
-- aman: search_path pemanggilnya memang memuat `public`. Policy
-- `storage.objects` yang ditambahkan migrasi 069 berbeda — ia dieksekusi dalam
-- konteks layanan Storage, yang search_path-nya bukan urusan kita, sehingga
-- `is_admin()` bisa gagal diresolusi dan unggah gambar soal ditolak dengan
-- alasan yang menyesatkan.
--
-- Dua perbaikan, keduanya mempertahankan perilaku:
--   1. `set search_path = public` di kedua fungsi. Ini juga menutup celah
--      klasik `security definer` tanpa search_path, di mana pemanggil bisa
--      mengarahkan resolusi nama ke tabel buatannya sendiri.
--   2. Policy Storage memanggil `public.is_admin()` secara eksplisit.
-- ============================================================

-- `set row_security = off` WAJIB dipertahankan: itulah inti migrasi 004, yang
-- memutus rekursi is_admin() -> profiles -> class_students -> is_admin().
create or replace function get_my_role()
returns text
language sql
security definer
set row_security = off
stable
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.get_my_role() = 'admin';
$$;

create or replace function is_tutor()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.get_my_role() = 'tutor';
$$;

drop policy if exists "Admin manages question images" on storage.objects;
create policy "Admin manages question images" on storage.objects
  for all
  using (bucket_id = 'question-images' and public.is_admin())
  with check (bucket_id = 'question-images' and public.is_admin());
