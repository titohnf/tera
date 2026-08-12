-- ============================================================
-- Dua pintu masuk ke latihan mandiri: kode akses ATAU akun keluarga
--
-- Sampai sekarang kode akses bukan sekadar layar login di Sora — ia kredensial
-- yang dikirim ulang ke enam fungsi di bawah, dan tiap fungsi memverifikasinya
-- lagi. Akibatnya murid Tera hanya bisa berlatih kalau admin sudah menerbitkan
-- kode untuknya, padahal keluarganya sudah punya akun yang sah di database yang
-- sama.
--
-- Migrasi ini menambah pintu kedua, bukan mengganti yang lama. Keduanya dipakai
-- di keadaan yang berbeda dan keduanya memang dibutuhkan:
--
--   * KODE — anak berlatih di perangkat tutor saat les. Login akun keluarga di
--     perangkat orang lain membuka tagihan dan laporan keluarga itu; kode hanya
--     membuka latihan. Untuk murid luar Tera, kode tetap satu-satunya jalan.
--   * AKUN KELUARGA — anak berlatih di rumah, di perangkat keluarganya sendiri.
--     Tidak perlu menunggu admin menerbitkan apa pun.
--
-- Bentuk perubahannya: tiap fungsi menerima `p_learner_id` sebagai alternatif,
-- dan penjaganya dipusatkan di `practice_actor()` — satu tempat yang menjawab
-- "atas nama learner mana pemanggil ini boleh bertindak", entah lewat kode atau
-- lewat sesi keluarga.
--
-- KOMPATIBEL MUNDUR. `p_learner_id` punya default null dan diletakkan paling
-- akhir, jadi Sora versi yang sedang berjalan — yang cuma mengirim
-- `p_access_code` — tetap bekerja persis seperti sebelumnya. Ini disengaja:
-- migrasi dijalankan manual dan tidak pernah sedetik pun bersamaan dengan
-- deploy, jadi harus ada jeda di mana versi lama masih hidup.
--
-- Fungsi lama DIHAPUS dulu, bukan sekadar `create or replace`: menambah
-- parameter berarti tanda tangan baru, dan kalau yang lama dibiarkan, panggilan
-- dengan satu argumen jadi ambigu ("function is not unique") — persis yang mau
-- dihindari.
-- ============================================================

-- Penjaga bersama -------------------------------------------------------------
--
-- Mengembalikan id learner yang boleh diwakili pemanggil, atau null kalau tidak
-- ada. Kode diperiksa lebih dulu karena ia jalur tanpa sesi: murid luar dan anak
-- di perangkat tutor tidak punya `auth.uid()` sama sekali.
--
-- Jalur keluarga menumpang `family_covers_student()` dari migrasi 076, jadi
-- pertanyaan "anak ini milik keluarga yang mana" tetap dijawab di satu tempat.
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
    )
  );
$$;

-- Anak-anak sebuah keluarga, untuk layar pemilihan di Sora.
--
-- `learner_id` boleh null: anak yang belum pernah diberi kode belum punya baris
-- `learners`. Sora tetap menampilkannya, dan barisnya lahir saat anak itu
-- benar-benar mulai berlatih — lihat `practice_start_as_child()`.
create or replace function practice_children()
returns table (student_id uuid, student_name text, learner_id uuid)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select p.id, p.full_name, l.id
  from profiles p
  left join learners l on l.profile_id = p.id
  where p.id in (select my_students())
  order by p.full_name;
$$;

-- Menyiapkan identitas latihan untuk seorang anak, dipanggil dari sesi keluarga.
--
-- Tanpa ini, jalur keluarga tetap menyandera admin: barisnya cuma lahir saat
-- kode diterbitkan, jadi "tidak perlu kode lagi" tidak akan pernah benar-benar
-- terjadi. Kode aksesnya sengaja dibiarkan null — baris yang lahir dari sini
-- belum punya kode, dan admin tetap bisa menerbitkannya nanti lewat menu
-- Latihan Mandiri kalau anaknya perlu berlatih di perangkat tutor.
create or replace function practice_start_as_child(p_student uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
set row_security = off
as $$
declare
  v_learner uuid;
begin
  if not family_covers_student(p_student) then
    return null;
  end if;

  select id into v_learner from learners where profile_id = p_student;
  if v_learner is not null then
    return v_learner;
  end if;

  insert into learners (profile_id, name)
  select p_student, coalesce(p.full_name, 'Murid')
  from profiles p
  where p.id = p_student
  returning id into v_learner;

  return v_learner;
end;
$$;

-- Keenam fungsi latihan -------------------------------------------------------

drop function if exists practice_login(text);
drop function if exists practice_subjects(text);
drop function if exists practice_topics(text, uuid);
drop function if exists practice_draw_questions(text, uuid[], integer);
drop function if exists practice_answer_key(text, uuid);
drop function if exists practice_summary(text, uuid);

-- Nama tetap diambil hidup dari `profiles` untuk murid Tera (migrasi 065);
-- `learners.name` hanya cadangan untuk murid luar yang tidak punya profil.
create or replace function practice_login(p_access_code text, p_learner_id uuid default null)
returns table (learner_id uuid, learner_name text, is_tera_student boolean)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select l.id, coalesce(p.full_name, l.name), l.profile_id is not null
  from learners l
  left join profiles p on p.id = l.profile_id
  where l.id = practice_actor(p_access_code, p_learner_id);
$$;

-- Mapel yang benar-benar punya soal bertag. Berlaku sama untuk murid Tera
-- maupun murid luar, dan tidak pernah menampilkan menu kosong.
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
  where practice_actor(p_access_code, p_learner_id) is not null
  group by s.id, s.name
  having count(distinct t.question_bank_item_id) > 0
  order by s.name;
$$;

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
  select g.id, g.grade_level, g.semester, g.theme, g.topic,
         count(distinct t.question_bank_item_id)
  from curriculum_topic_groups g
  left join question_curriculum_tags t on t.group_id = g.id
  where g.subject_id = p_subject_id
    and practice_actor(p_access_code, p_learner_id) is not null
  group by g.id, g.grade_level, g.semester, g.theme, g.topic
  order by g.grade_level, g.semester, g.theme nulls first, g.topic;
$$;

-- Mengundi satu set soal, tanpa kunci jawaban. Daftar group kosong berarti
-- "semua topik di mapel ini".
--
-- Urutan prioritas: belum pernah dijawab -> pernah dijawab tapi belum pernah
-- benar -> sudah dikuasai; penyeimbang terakhir paling lama tidak dilihat, lalu
-- acak. Tidak ada soal yang dibuang dari undian, jadi topik yang bank soalnya
-- masih tipis tetap bisa mengisi sesi penuh.
--
-- CTE `me` harus mengembalikan NOL baris saat pemanggil tidak berhak, bukan satu
-- baris berisi null — `pool` di bawah memakainya lewat cross join, dan satu baris
-- null akan membuka seluruh bank soal.
create or replace function practice_draw_questions(
  p_access_code text,
  p_group_ids uuid[],
  p_limit integer,
  p_learner_id uuid default null
)
returns table (id uuid, type text, prompt text, options jsonb, weight numeric, stimulus_images text[])
language sql
-- Volatile, bukan stable: penyeimbangnya memanggil random(), jadi perencana
-- tidak boleh diberi tahu ini mengembalikan baris yang sama untuk argumen sama.
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
    where p_group_ids is null
       or cardinality(p_group_ids) = 0
       or t.group_id = any (p_group_ids)
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

-- Kunci untuk satu soal yang sedang dikerjakan. `options` ikut karena matching,
-- ordering, dan statement_grid dinilai terhadap struktur soalnya sendiri, bukan
-- terhadap correct_answer saja. Penilaiannya sendiri tetap di TypeScript
-- (src/lib/grading.ts) supaya cuma ada satu implementasi.
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
    and exists (select 1 from question_curriculum_tags t where t.question_bank_item_id = b.id);
$$;

-- Rincian skor per topik untuk satu sesi. Soal bertag dua topik dihitung di
-- keduanya — itu memang tujuannya: pertanyaannya "sejauh apa murid ini menguasai
-- topik itu", bukan "apakah angkanya berjumlah 100%".
--
-- Syaratnya sekarang lebih ketat daripada versi lama: dulu cukup "kodenya cocok",
-- sehingga satu kode sah bisa membaca ringkasan sesi milik learner lain kalau
-- id sesinya diketahui. Sekarang sesinya harus benar-benar milik pemanggil.
create or replace function practice_summary(p_access_code text, p_session_id uuid, p_learner_id uuid default null)
returns table (
  group_id uuid,
  topic text,
  theme text,
  answered bigint,
  score numeric,
  max_score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.topic, g.theme, count(*),
         coalesce(sum(pa.score), 0), coalesce(sum(pa.max_score), 0)
  from practice_answers pa
  join practice_sessions ps on ps.id = pa.session_id
  join question_curriculum_tags t on t.question_bank_item_id = pa.question_bank_item_id
  join curriculum_topic_groups g on g.id = t.group_id
  where pa.session_id = p_session_id
    and ps.learner_id = practice_actor(p_access_code, p_learner_id)
  group by g.id, g.topic, g.theme
  order by g.theme nulls first, g.topic;
$$;

-- PostgREST menyimpan bentuk fungsi di cache-nya. Supabase biasanya menyegarkan
-- sendiri setelah DDL, tapi baris ini murah dan menutup jeda di mana Sora bisa
-- kena "function not found" untuk tanda tangan yang baru saja berubah.
notify pgrst, 'reload schema';
