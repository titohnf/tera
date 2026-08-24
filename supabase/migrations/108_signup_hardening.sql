-- ============================================================
-- Pengamanan sebelum pendaftaran mandiri dibuka
--
-- Sampai hari ini akun HANYA bisa dibuat admin: tidak ada satu pun panggilan
-- `signUp()` di aplikasi, dan `lib/actions/admin/users.ts` memakai
-- `auth.admin.createUser`. Seluruh postur keamanan bersandar pada fakta itu —
-- sekitar 125 berkas memakai service-role key yang melewati RLS, dan yang
-- menahan adalah pemeriksaan role di layout. Selama himpunan akunnya tertutup,
-- itu memadai.
--
-- Pendaftaran mandiri membalik asumsinya. Berkas ini menutup empat hal yang
-- selama ini tidak berbahaya justru KARENA asumsi itu, dan berubah jadi lubang
-- pada hari ia gugur. Keempatnya digabung dalam satu migrasi karena semuanya
-- menjawab satu pertanyaan yang sama: apa yang berubah saat pendaftar bukan
-- lagi admin.
--
-- Jalankan SESUDAH migrasi 107 (nilai enum 'mandiri' dipakai di sini) dan
-- SEBELUM pendaftaran diaktifkan di dasbor Supabase.
-- ============================================================

-- 1. Trigger pendaftaran berhenti memercayai metadata -------------------------
--
-- Versi 077 membaca role dari `raw_user_meta_data->>'role'`. Nilai itu dikirim
-- KLIEN: `signUp({ options: { data: { role: 'admin' } } })` menaruh apa pun di
-- sana. Selama pendaftaran cuma lewat `auth.admin.createUser`, metadata itu
-- berasal dari kode kita sendiri dan boleh dipercaya. Begitu pendaftaran
-- dibuka, ia jadi satu baris menuju akses admin.
--
-- Bawaannya sekarang peran dengan hak paling kecil. Jalur admin tidak rusak:
-- `createUser()` (lib/actions/admin/users.ts:79) menulis `profiles.role` secara
-- eksplisit dengan service role tepat sesudah akun dibuat, jadi tutor dan admin
-- tetap lahir dengan peran yang benar — hanya urutannya yang berubah, dari
-- "trigger yang menentukan" jadi "trigger memberi lantai, admin yang menaikkan".
--
-- Cabang konflik juga berhenti menimpa `role`. Versi 077 menyetel
-- `role = excluded.role`, sehingga pendaftaran ulang memakai email yang sudah
-- terpakai akan MENURUNKAN peran staf yang bersangkutan. Sebelumnya itu hampir
-- mustahil; dengan pendaftaran terbuka ia jadi cara termurah untuk mengganggu.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'mandiri'
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
        email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2. Profil tidak lagi bisa diubah sendiri lewat anon key ---------------------
--
-- `002_rls_policies.sql:53` memberi policy update tanpa `with check` dan tanpa
-- pembatasan kolom:
--
--     create policy "Users can update their own profile"
--       on profiles for update using (id = auth.uid());
--
-- Artinya siapa pun yang punya sesi bisa menjalankan
-- `update profiles set role='admin' where id = auth.uid()` dari konsol browser
-- dengan anon key. Hari ini tidak ada orang tak dikenal yang punya sesi.
--
-- Penguncinya adalah pencabutan hak, bukan `with check`. Sudah diperiksa satu
-- per satu: SELURUH penulisan `profiles` di aplikasi ini lewat service role —
-- `lib/actions/admin/users.ts`, `lib/actions/admin/profile.ts`,
-- `lib/actions/tutor/profile.ts`, `lib/actions/avatar.ts`. Tidak ada satu pun
-- yang memakai client sesi, jadi mencabutnya seluruhnya tidak memutus apa pun,
-- dan tidak perlu menebak-nebak daftar kolom yang boleh lewat.
--
-- Policy-nya tetap ditulis ulang dengan `with check` sebagai kunci kedua: kalau
-- suatu hari hak update diberikan lagi kepada `authenticated`, ia tidak
-- langsung membuka pintu yang sama.

revoke update on profiles from authenticated;

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid())
  -- `role::text`, bukan `role`: get_my_role() mengembalikan text sementara
  -- kolomnya bertipe enum `user_role`, dan Postgres tidak punya operator `=`
  -- di antara keduanya. Karena get_my_role() dievaluasi pada snapshot sebelum
  -- perintah ini, perbandingannya berarti "peran barunya harus sama dengan
  -- peran lamanya".
  with check (id = auth.uid() and role::text = get_my_role());

-- 3. Kebocoran kehadiran yang sudah aktif hari ini ----------------------------
--
-- `002_rls_policies.sql:137` berbunyi "boleh baca kalau role-nya parent" —
-- tanpa tautan ke anaknya, dengan komentarnya sendiri mengakui itu:
-- "parent-student link would be added in a future migration". Migrasi 076
-- menuliskan policy yang benar tapi tidak menghapus yang ini, dan policy
-- bersifat OR — jadi yang longgar selalu menang.
--
-- Akibatnya setiap akun keluarga bisa membaca SELURUH tabel `attendances`,
-- bukan hanya kehadiran anaknya. Portal keluarga menyaring `student_id` sendiri
-- (lib/keluarga-anak.ts:69) sehingga tidak pernah terlihat, tapi permintaan
-- yang dirakit dengan tangan memakai token keluarga mana pun mengembalikan
-- semuanya.
--
-- Penggantinya sudah ada sejak 076: "Families read own attendance", yang
-- memakai `family_covers_student()`.

drop policy if exists "Parents can view their child's attendance" on attendances;

-- 4. Pengumuman tanpa sasaran bukan berarti "termasuk orang luar" -------------
--
-- `005_announcements.sql:24` memperlakukan `target_roles is null` sebagai
-- "semua orang". Saat ditulis, "semua orang" berarti admin, tutor, murid, dan
-- keluarga — semuanya bagian dari bimbel. Dengan adanya `mandiri`, kalimat yang
-- sama diam-diam berubah artinya jadi "termasuk pelanggan yang tidak punya
-- hubungan apa pun dengan bimbel".
--
-- Yang diperbaiki cuma maknanya, bukan bentuknya: pengumuman tanpa sasaran
-- tetap sampai ke semua peran INTERNAL. Pengumuman yang memang ditujukan ke
-- pelanggan tetap bisa dibuat, dengan menyebut 'mandiri' di `target_roles`.

-- Dibungkus pemeriksaan keberadaan tabel. `announcements` lahir di migrasi 005
-- dan tidak pernah dihapus migrasi mana pun, tapi ia bisa saja belum ada di
-- sebuah database — migrasi di proyek ini dijalankan dengan tangan, dan
-- database yang dibangun belakangan tidak selalu menempuh seluruh urutannya.
-- Tanpa pembungkus ini, satu tabel yang absen menggagalkan seluruh berkas —
-- termasuk dua penutup lubang di atasnya, yang justru paling mendesak.
do $announcements$
begin
  if to_regclass('public.announcements') is null then
    raise notice 'Tabel announcements tidak ada; policy-nya dilewati.';
    return;
  end if;

  drop policy if exists "users_read_announcements" on announcements;
  create policy "users_read_announcements" on announcements
    for select using (
      is_active = true
      and (
        (target_roles is null and get_my_role() <> 'mandiri')
        or get_my_role()::text = any(target_roles)
      )
    );
end
$announcements$;

-- 5. Helper peran -------------------------------------------------------------
--
-- Mengikuti pola `is_family()` di 076: `security definer` dengan search_path
-- terkunci, supaya aman dipanggil dari dalam policy tabel lain tanpa
-- menimbulkan rekursi RLS (persoalan yang dibereskan migrasi 004 dan 064).

create or replace function is_mandiri()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.get_my_role() = 'mandiri';
$$;

-- Sengaja TIDAK diubah: `subjects` tetap boleh dibaca semua akun terautentikasi
-- (002_rls_policies.sql:60). Pelanggan memang perlu nama mapel untuk memilih
-- latihan, dan daftar itu persis sama dengan yang dikembalikan
-- `practice_subjects()` kepadanya. Ditulis di sini supaya tidak ditinjau ulang
-- setiap kali ada yang menyisir policy.

notify pgrst, 'reload schema';
