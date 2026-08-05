-- ============================================================
-- Kembalikan handle_new_user() sesuai definisi di repo
--
-- Ditemukan saat memindahkan akun keluarga: 23 akun dibuat dengan
-- `raw_user_meta_data` berisi {"full_name":"...","role":"parent"}, `full_name`
-- masuk ke profil dengan benar, tapi role-nya jadi `student`. Definisi di repo
-- (001_initial_schema.sql:260) membaca role dari metadata, jadi yang terpasang
-- di database bukan definisi itu.
--
-- Akibatnya bukan sekadar kejadian sekali: SETIAP akun baru — tutor, admin,
-- keluarga — akan selalu lahir sebagai `student`, dan role-nya harus diperbaiki
-- dengan tangan setiap kali.
--
-- Dua penyesuaian di luar mengembalikan perilaku aslinya, keduanya menutup
-- masalah laten yang sudah ada di versi repo:
--
--   * `set search_path = public` — fungsi `security definer` tanpa search_path
--     terkunci bisa diarahkan pemanggilnya ke tabel lain bernama sama. Alasan
--     yang sama dengan migrasi 070.
--   * `on conflict (id) do update` — versi lama gagal keras kalau baris profil
--     sudah ada, dan kegagalan di trigger `after insert on auth.users` berarti
--     pembuatan akun ikut gagal. Idempoten lebih aman untuk jalur yang tidak
--     bisa diulang setengah jalan.
-- ============================================================

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
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
        email = excluded.email,
        role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
