-- ============================================================
-- Keluarga boleh tahu siapa yang mengajar anaknya
--
-- Migrasi 076 membuka `profiles` untuk keluarga hanya sebatas anaknya sendiri
-- (`Families read own children`). Wajar sebagai titik awal, tapi akibatnya kolom
-- Tutor di jadwal anak selalu kosong: `sessions.tutor_id` terbaca, namanya
-- tidak. Halaman admin menampilkan "Rifka Fauziah Azis", halaman orang tua
-- menampilkan garis — untuk sesi yang sama persis.
--
-- Yang dibuka di sini sempit dan sudah diketahui orang tuanya: nama tutor yang
-- benar-benar mengajar sesi anaknya. Bukan seluruh daftar tutor, bukan tutor
-- kelas lain, dan tidak ada kolom lain yang ikut terbuka — RLS bekerja per
-- baris, jadi profil yang tidak lolos penyaring ini tetap tidak terlihat.
--
-- Penyaringnya lewat fungsi security definer dengan `row_security = off`,
-- mengikuti pola `my_students()` di migrasi 076. Alasannya sama: fungsi ini
-- dipanggil DARI DALAM policy `profiles`, dan kalau ia sendiri tunduk RLS maka
-- `sessions` -> `profiles` -> `sessions` saling menunggu.
-- ============================================================

create or replace function my_childrens_tutors()
returns setof uuid
language sql
security definer
set row_security = off
stable
set search_path = public
as $$
  select distinct s.tutor_id
  from sessions s
  join class_students cs on cs.class_id = s.class_id
  where cs.student_id in (select my_students())
    and s.tutor_id is not null;
$$;

drop policy if exists "Families read their children's tutors" on profiles;
create policy "Families read their children's tutors" on profiles
  for select
  using (is_family() and id in (select my_childrens_tutors()));

notify pgrst, 'reload schema';
