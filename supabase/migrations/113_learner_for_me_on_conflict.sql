-- ============================================================
-- `learner_for_me()` tidak pernah bisa membuat baris
--
-- Ditemukan saat menguji jalur pelanggan langganan dari ujung ke ujung:
--
--     ERROR: there is no unique or exclusion constraint matching the
--            ON CONFLICT specification
--
-- Sebabnya indeks uniknya PARSIAL. Migrasi 061 menulis:
--
--     create unique index learners_profile_id_key
--       on learners(profile_id) where profile_id is not null;
--
-- karena `learners.profile_id` boleh null untuk murid luar Tera, dan unique
-- biasa menganggap tiap null berbeda. Postgres tidak akan memakai indeks
-- parsial untuk menyimpulkan konflik kecuali predikatnya ikut disebut di klausa
-- `on conflict`. Tanpa itu ia tidak jatuh ke jalur lain — ia gagal.
--
-- INI BUG LAMA, bukan akibat pekerjaan langganan. `learner_for_me()` lahir di
-- migrasi 075 untuk memberi murid yang login jalur ke `assessment_results`
-- tanpa menunggu admin menerbitkan kode. Cabang pembuatannya belum pernah
-- berhasil sekali pun sejak saat itu: yang berjalan hanyalah `select` di
-- atasnya, jadi fungsinya cuma bekerja untuk murid yang barisnya kebetulan
-- sudah ada. Itu juga yang membuat `practice_start_as_me()` (migrasi 110)
-- selalu mengembalikan null meski langganannya aktif.
--
-- Yang diubah hanya satu baris — predikat indeksnya disebutkan — tapi
-- diletakkan di migrasinya sendiri supaya perbaikan bug lama ini tidak
-- tersembunyi di dalam berkas yang judulnya bicara soal langganan.
-- ============================================================

create or replace function learner_for_me()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text;
begin
  if auth.uid() is null then return null; end if;

  select id into v_id from learners where profile_id = auth.uid();
  if v_id is not null then return v_id; end if;

  select coalesce(full_name, 'Murid') into v_name from profiles where id = auth.uid();

  insert into learners (profile_id, name) values (auth.uid(), v_name)
  -- `where profile_id is not null` menyalin predikat indeks parsial
  -- `learners_profile_id_key`. Cabang ini hanya tercapai kalau `select` di atas
  -- tidak menemukan apa-apa, jadi konfliknya praktis mustahil — tapi ia menahan
  -- dua permintaan yang datang bersamaan, dan itu memang kejadian yang tidak
  -- boleh melempar galat ke muka murid.
  on conflict (profile_id) where profile_id is not null
    do update set name = excluded.name
  returning id into v_id;

  return v_id;
end $$;

notify pgrst, 'reload schema';
