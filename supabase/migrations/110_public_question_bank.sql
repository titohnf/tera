-- ============================================================
-- Soal publik + pintu ketiga latihan: akun langganan
--
-- Sampai sekarang latihan mandiri punya dua pintu masuk (migrasi 092): KODE
-- AKSES yang diterbitkan admin, dan SESI KELUARGA yang bertindak atas nama
-- anaknya. Keduanya berarti "orang ini murid bimbel", jadi keduanya berhak atas
-- seluruh bank soal.
--
-- Pintu ketiga berbeda sifatnya. Pelanggan langganan bukan murid bimbel, dan
-- bank soal berisi soal yang disusun untuk sesi dan kelas tertentu. Karena itu
-- dua hal ditambahkan bersamaan di sini, dan memang harus bersamaan — pintunya
-- tidak boleh ada sebelum saringannya:
--
--   1. `question_bank_items.is_public` — soal mana yang boleh keluar dari
--      lingkungan bimbel.
--   2. Cabang ketiga di `practice_actor()`, digerbangi langganan aktif.
--
-- KOMPATIBEL MUNDUR. Tidak ada tanda tangan fungsi yang berubah, jadi Sora yang
-- sedang berjalan (repo `form`) tidak perlu di-deploy ulang — dan hasil yang
-- diterimanya identik, karena setiap predikat baru di bawah bernilai false
-- untuk pemanggil berkode maupun keluarga. Ini disengaja: migrasi dijalankan
-- manual dan tidak pernah sedetik pun bersamaan dengan deploy.
--
-- Jalankan SESUDAH 109 — `has_product()` dipakai di sini.
-- ============================================================

-- 1. Penanda soal publik ------------------------------------------------------
--
-- Di ITEM, bukan di topik. Penandaan soal ke topik bersifat many-to-many
-- (`question_curriculum_tags`), jadi penanda di tingkat topik memberi satu soal
-- dua jawaban yang bisa bertentangan. Yang lebih berbahaya: ia GAGAL TERBUKA —
-- soal privat baru yang kebetulan di-tag ke topik publik langsung ikut terbuka
-- tanpa ada yang memutuskan. Penanda per soal gagal tertutup.
--
-- `default false` berarti tidak ada yang bocor pada hari kolom ini mendarat:
-- seluruh korpus yang sudah ada tetap milik bimbel, dan soal yang dibuat Sora
-- sebelum ia punya sakelar sendiri pun tetap privat.
--
-- Namanya Inggris, tidak seperti artefak Tera yang baru: kolom ini menempel di
-- tabel warisan QuizCraft yang juga ditulis repo lain, dan konsistensi dengan
-- tetangganya di tabel itu lebih berguna daripada konsistensi dengan bahasa
-- migrasi ini.

alter table question_bank_items
  add column if not exists is_public boolean not null default false;

comment on column question_bank_items.is_public is
  'Boleh dikerjakan pelanggan langganan (role mandiri). Default false: bank soal milik bimbel kecuali dinyatakan lain.';

create index if not exists question_bank_items_public_idx
  on question_bank_items(id) where is_public;

-- 2. Pintu ketiga -------------------------------------------------------------
--
-- Dua cabang lama disalin PERSIS dari migrasi 092. Cabang ketiga ditaruh paling
-- akhir, dan `coalesce` berhenti pada cabang pertama yang berhasil — jadi
-- pemanggil berkode tidak membayar apa pun untuk keberadaannya.
--
-- Bedanya dengan cabang kedua: di sana learner-nya adalah ANAK pemanggil dan
-- haknya berasal dari daftar keluarga; di sini learner-nya adalah pemanggil itu
-- sendiri dan haknya berasal dari langganan aktif.
--
-- Cabang ini tidak bisa melebarkan apa pun untuk akun yang sudah ada: profil
-- `student` warisan yang punya baris `learners` memang cocok dengan
-- `l.profile_id = auth.uid()`, tapi `has_product('sora')` false untuknya.

create or replace function practice_actor(p_access_code text, p_learner_id uuid default null)
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (
      select l.id from learners l
      where l.access_code = p_access_code
        and coalesce(p_access_code, '') <> ''
    ),
    (
      select l.id from learners l
      where l.id = p_learner_id
        and l.profile_id is not null
        and family_covers_student(l.profile_id)
    ),
    (
      select l.id from learners l
      where l.id = p_learner_id
        and l.profile_id = auth.uid()
        and has_product('sora')
    )
  );
$$;

-- Menyiapkan identitas latihan untuk pemanggil sendiri, sejajar dengan
-- `practice_start_as_child()` untuk jalur keluarga.
--
-- `learner_for_me()` (migrasi 075) sudah melakukan cari-atau-buat, tapi TANPA
-- gerbang: ia membuat baris untuk siapa pun yang login. Dibungkus di sini
-- supaya akun yang mendaftar tapi belum membayar tidak pernah punya baris
-- `learners` sama sekali — bukan punya baris yang kebetulan tidak bisa dipakai.

create or replace function practice_start_as_me()
returns uuid
language plpgsql
volatile
security definer
set search_path = public
set row_security = off
as $$
begin
  if not has_product('sora') then return null; end if;
  return learner_for_me();
end;
$$;

-- 3. Siapa yang hanya boleh melihat soal publik -------------------------------
--
-- Dibuat sebagai fungsi terpisah, bukan dengan mengubah bentuk kembalian
-- `practice_actor()`: mengubahnya akan memaksa Sora di-deploy ulang pada detik
-- yang sama dengan migrasi ini, dan itu justru yang dihindari seluruh disiplin
-- kompatibilitas mundur di 092.
--
-- Kode akses diperiksa lebih dulu, urutan yang sama dengan `practice_actor()`:
-- kode selalu berarti murid Tera karena hanya admin yang menerbitkannya. Akun
-- langganan tidak pernah punya baris `family_students`, jadi cabang keluarga
-- mustahil baginya dan memeriksa perannya sendiri sudah cukup.

create or replace function practice_only_public(p_access_code text, p_learner_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(p_access_code, '') = '' and public.get_my_role() = 'mandiri';
$$;

-- 4. Saringan di setiap fungsi yang menyentuh isi soal -------------------------
--
-- `create or replace` tanpa `drop`: daftar argumen dan kolom keluarannya tidak
-- berubah, jadi persoalan "function is not unique" yang memaksa 092 menghapus
-- dulu tidak berlaku di sini.
--
-- `practice_summary` sengaja tidak ikut diubah: ia hanya membaca baris yang
-- sudah dijawab pemanggilnya sendiri, jadi tidak ada isi soal yang bisa bocor
-- lewat sana.

-- Mapel yang seluruh soalnya privat tidak muncul untuk pelanggan. `having` yang
-- sudah ada mengerjakannya sendiri begitu poolnya disaring — janji "jangan
-- pernah menyodorkan menu kosong" tetap ditepati, sekarang untuk dua kalangan.
create or replace function practice_subjects(p_access_code text, p_learner_id uuid default null)
returns table (subject_id uuid, subject_name text, question_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, count(distinct t.question_bank_item_id)
  from subjects s
  join curriculum_topic_groups g on g.subject_id = s.id
  join question_curriculum_tags t on t.group_id = g.id
  join question_bank_items b on b.id = t.question_bank_item_id
  where practice_actor(p_access_code, p_learner_id) is not null
    and (b.is_public or not practice_only_public(p_access_code, p_learner_id))
  group by s.id, s.name
  having count(distinct t.question_bank_item_id) > 0
  order by s.name;
$$;

-- Murid bimbel tetap melihat topik yang bank soalnya masih kosong (perilaku
-- lama, dan berguna: ia menunjukkan kurikulumnya utuh). Pelanggan tidak —
-- topik berhitung nol di daftar berbayar adalah laporan keluhan yang menunggu
-- ditulis. Itulah arti `or not practice_only_public(...)` di `having`.
create or replace function practice_topics(p_access_code text, p_subject_id uuid, p_learner_id uuid default null)
returns table (
  group_id uuid,
  grade_level text,
  semester int,
  theme text,
  topic text,
  question_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  -- Dihitung dari `b`, bukan dari `t`: `b` sudah tersaring publik, sedangkan
  -- `t` memuat seluruh penandaan. Untuk pemanggil berkode keduanya sama persis
  -- karena saringannya false; untuk pelanggan, hanya `b` yang jujur.
  select g.id, g.grade_level, g.semester, g.theme, g.topic,
         count(distinct b.id)
  from curriculum_topic_groups g
  left join question_curriculum_tags t on t.group_id = g.id
  left join question_bank_items b on b.id = t.question_bank_item_id
    and (b.is_public or not practice_only_public(p_access_code, p_learner_id))
  where g.subject_id = p_subject_id
    and practice_actor(p_access_code, p_learner_id) is not null
  group by g.id, g.grade_level, g.semester, g.theme, g.topic
  having count(distinct b.id) > 0
      or not practice_only_public(p_access_code, p_learner_id)
  order by g.grade_level, g.semester, g.theme nulls first, g.topic;
$$;

-- Satu baris tambahan di `pool`, bersebelahan dengan saringan topik. CTE `me`
-- tetap harus mengembalikan NOL baris saat pemanggil tidak berhak — catatan
-- yang sudah ada di 092 dan masih berlaku persis.
create or replace function practice_draw_questions(
  p_access_code text,
  p_group_ids uuid[],
  p_limit integer,
  p_learner_id uuid default null
)
returns table (id uuid, type text, prompt text, options jsonb, weight numeric, stimulus_images text[])
language sql
volatile
security definer
set search_path = public
as $$
  with me as (
    select a.learner_id
    from (select practice_actor(p_access_code, p_learner_id) as learner_id) a
    where a.learner_id is not null
  ),
  pool as (
    select distinct b.id, b.type, b.prompt, b.options, b.weight, b.stimulus_images
    from question_bank_items b
    join question_curriculum_tags t on t.question_bank_item_id = b.id
    cross join me
    where (p_group_ids is null
       or cardinality(p_group_ids) = 0
       or t.group_id = any (p_group_ids))
      and (b.is_public or not practice_only_public(p_access_code, p_learner_id))
  ),
  history as (
    select pa.question_bank_item_id,
           bool_or(coalesce(pa.is_correct, false)) as ever_correct,
           max(pa.answered_at) as last_seen
    from practice_answers pa
    join me on me.learner_id = pa.learner_id
    group by pa.question_bank_item_id
  )
  select pool.id, pool.type, pool.prompt, pool.options, pool.weight, pool.stimulus_images
  from pool
  left join history on history.question_bank_item_id = pool.id
  order by
    case
      when history.question_bank_item_id is null then 0
      when not history.ever_correct then 1
      else 2
    end,
    history.last_seen nulls first,
    random()
  limit greatest(coalesce(p_limit, 10), 1);
$$;

-- Yang paling penting disaring. Tanpa baris ini, pelanggan yang tahu id sebuah
-- soal privat bisa memintanya langsung dan mendapat kunci jawabannya —
-- fungsinya hanya memeriksa bahwa pemanggilnya berhak berlatih, bukan bahwa
-- soal itu memang miliknya untuk dikerjakan.
create or replace function practice_answer_key(p_access_code text, p_item_id uuid, p_learner_id uuid default null)
returns table (type text, options jsonb, correct_answer jsonb, weight numeric, explanation text)
language sql
stable
security definer
set search_path = public
as $$
  select b.type, b.options, b.correct_answer, b.weight, b.explanation
  from question_bank_items b
  where b.id = p_item_id
    and practice_actor(p_access_code, p_learner_id) is not null
    and (b.is_public or not practice_only_public(p_access_code, p_learner_id))
    and exists (select 1 from question_curriculum_tags t where t.question_bank_item_id = b.id);
$$;

notify pgrst, 'reload schema';
