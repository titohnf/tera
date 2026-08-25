-- ============================================================
-- Sesi latihan yang selamat dari muat ulang
--
-- Latihan di Sora hidup seluruhnya di dalam satu komponen React: soalnya
-- diundi sekali, disimpan di state, dan halamannya tidak pernah berpindah.
-- Muat ulang berarti sesi itu hilang, dan itu bisa diterima di sana karena
-- pemakainya duduk di perangkat tutor saat les.
--
-- Permukaan `/belajar` di Tera dipakai di ponsel, di rumah, oleh anak yang
-- menutup tab dan membukanya lagi. Sesi yang hilang saat itu berarti soal yang
-- sudah dijawab hilang bersamanya. Karena itu undian sebuah sesi disimpan, dan
-- rutenya per sesi (`/belajar/[sesiId]`) supaya alamatnya bisa dibuka lagi.
--
-- Tiga fungsi baru di bawah semuanya bergerbang pada `practice_actor()` lewat
-- sesinya sendiri — bukan pada policy tabel. Itu disengaja: policy
-- `practice_sessions`/`practice_answers` hari ini masih `using (true)`
-- (warisan QuizCraft, ditutup pada langkah terakhir rencana tiga core setelah
-- `/practice` di Sora pensiun). Menulis `/belajar` di atas policy yang sudah
-- dijadwalkan dicabut berarti membangun di lantai yang akan dibongkar.
--
-- KOMPATIBEL MUNDUR. Kolom baru punya default, tidak ada tanda tangan lama yang
-- berubah, dan Sora tidak memanggil satu pun fungsi di sini.
--
-- Jalankan SESUDAH 113 — tanpa `learner_for_me()` yang benar, tidak ada
-- pelanggan yang sampai ke sini.
-- ============================================================

-- 1. Undian yang disimpan ------------------------------------------------------
--
-- Urutannya bermakna: soal ke-n sesi ini adalah `item_ids[n]`, dan itulah yang
-- membuat "lanjutkan dari soal terakhir" bisa dihitung tanpa mengundi ulang.
--
-- Baris sesi lama (seluruhnya dari Sora) tetap sah dengan array kosong: fungsi
-- di bawah mengembalikan nol baris untuknya, dan tidak ada yang memanggilnya
-- untuk sesi Sora.

alter table practice_sessions
  add column if not exists item_ids uuid[] not null default '{}';

comment on column practice_sessions.item_ids is
  'Soal yang diundi untuk sesi ini, berurut. Kosong untuk sesi Sora yang undiannya hidup di browser.';

-- 2. Membuka sesi --------------------------------------------------------------
--
-- Undian dan pembuatan barisnya jadi satu tindakan. Dipisah — undi di aplikasi,
-- lalu insert — berarti ada jeda di mana sebuah sesi sudah punya soal tapi
-- belum punya baris, dan soal itu hilang kalau insert-nya gagal.
--
-- `essay` dan `upload_file` disaring keluar. Keduanya tidak bisa dinilai
-- otomatis (`lib/belajar/penilaian.ts` mengembalikan null untuk keduanya),
-- sedangkan seluruh janji permukaan ini adalah umpan balik seketika. Soal yang
-- muncul lalu selalu dinilai nol bukan latihan, melainkan kebingungan. Ini juga
-- sebabnya jumlah soal yang didapat bisa kurang dari yang diminta.
--
-- `practice_draw_questions` dipanggil apa adanya, bukan disalin: urutan undian
-- (belum pernah dijawab dulu, lalu yang masih salah, lalu yang paling lama tak
-- disentuh) adalah pengetahuan yang sudah ditulis di sana dan tidak boleh punya
-- dua salinan yang bisa menyimpang.

create or replace function practice_open_session(
  p_subject_id uuid,
  p_group_ids uuid[],
  p_limit integer,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_learner uuid;
  v_items uuid[];
  v_session uuid;
begin
  v_learner := practice_actor(coalesce(p_access_code, ''), p_learner_id);
  if v_learner is null then return null; end if;

  select array_agg(q.id order by q.ord)
    into v_items
  from practice_draw_questions(
         coalesce(p_access_code, ''),
         p_group_ids,
         greatest(coalesce(p_limit, 10), 1),
         p_learner_id
       ) with ordinality as q(id, type, prompt, options, weight, stimulus_images, ord)
  where q.type not in ('essay', 'upload_file');

  if v_items is null or cardinality(v_items) = 0 then return null; end if;

  insert into practice_sessions (learner_id, subject_id, group_ids, question_count, item_ids)
  values (v_learner, p_subject_id, coalesce(p_group_ids, '{}'), cardinality(v_items), v_items)
  returning id into v_session;

  return v_session;
end;
$$;

-- 3. Keadaan sebuah sesi -------------------------------------------------------
--
-- Satu panggilan menjawab dua hal yang selalu ditanya bersama: soal apa saja di
-- sesi ini, dan mana yang sudah dijawab. Dipisah jadi dua panggilan berarti
-- keduanya bisa terbaca dari dua titik waktu yang berbeda, dan pemakainya
-- melihat soal yang sudah dijawabnya disodorkan lagi.
--
-- KUNCI JAWABAN TIDAK IKUT. Kolom yang dikembalikan sama persis dengan
-- `practice_draw_questions`, dengan alasan yang sama: kunci hanya keluar lewat
-- `practice_answer_key()`, sesudah pemakainya menjawab.

create or replace function practice_session_state(
  p_session_id uuid,
  p_access_code text default ''
)
returns table (
  item_id uuid,
  ord integer,
  type text,
  prompt text,
  options jsonb,
  weight numeric,
  stimulus_images text[],
  answered boolean,
  is_correct boolean,
  score numeric,
  max_score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id,
         i.ord::integer,
         b.type,
         b.prompt,
         b.options,
         b.weight,
         b.stimulus_images,
         pa.id is not null,
         pa.is_correct,
         pa.score,
         pa.max_score
  from practice_sessions ps
  cross join lateral unnest(ps.item_ids) with ordinality as i(item_id, ord)
  join question_bank_items b on b.id = i.item_id
  -- Jawaban terakhir yang menang kalau entah bagaimana ada dua: yang dilihat
  -- pemakainya di layar adalah umpan balik yang baru saja ia terima.
  left join lateral (
    select a.id, a.is_correct, a.score, a.max_score
    from practice_answers a
    where a.session_id = ps.id and a.question_bank_item_id = i.item_id
    order by a.answered_at desc
    limit 1
  ) pa on true
  where ps.id = p_session_id
    and ps.learner_id = practice_actor(coalesce(p_access_code, ''), ps.learner_id)
  order by i.ord;
$$;

-- 4. Mencatat jawaban dan menutup sesi -----------------------------------------
--
-- Penilaiannya tetap di aplikasi (`gradeAnswer` yang sama dipakai Sora, supaya
-- satu soal bernilai sama di mana pun ia ditemui), jadi fungsi ini menerima
-- skor yang sudah jadi. Yang dijaga di sini bukan angkanya melainkan SESINYA:
-- tanpa gerbang ini, siapa pun yang punya anon key bisa menulis baris
-- `practice_answers` atas nama sesi orang lain selama policy `using (true)`
-- masih hidup.
--
-- `learner_id` diambil dari sesinya, tidak diterima sebagai argumen. Kolom itu
-- didenormalisasi (lihat 061) dan satu-satunya nilai benarnya sudah ada di
-- baris sesi — menerimanya dari pemanggil hanya membuka jalan agar keduanya
-- berbeda.

create or replace function practice_record_answer(
  p_session_id uuid,
  p_item_id uuid,
  p_response jsonb,
  p_is_correct boolean,
  p_score numeric,
  p_max_score numeric,
  p_access_code text default ''
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_learner uuid;
begin
  select ps.learner_id into v_learner
  from practice_sessions ps
  where ps.id = p_session_id
    and ps.learner_id = practice_actor(coalesce(p_access_code, ''), ps.learner_id)
    -- Soal yang tidak diundi untuk sesi ini tidak bisa dicatat ke dalamnya.
    and p_item_id = any (ps.item_ids);

  if v_learner is null then return false; end if;

  insert into practice_answers (
    session_id, learner_id, question_bank_item_id, response, is_correct, score, max_score
  )
  values (p_session_id, v_learner, p_item_id, p_response, p_is_correct, p_score, p_max_score);

  return true;
end;
$$;

create or replace function practice_finish_session(
  p_session_id uuid,
  p_access_code text default ''
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_updated uuid;
begin
  update practice_sessions ps
     -- Sesi yang sudah selesai tidak dimundurkan waktunya kalau halaman
     -- hasilnya dibuka dua kali.
     set finished_at = coalesce(ps.finished_at, now())
   where ps.id = p_session_id
     and ps.learner_id = practice_actor(coalesce(p_access_code, ''), ps.learner_id)
  returning ps.id into v_updated;

  return v_updated is not null;
end;
$$;

-- 5. Siapa yang punya sesi ini -------------------------------------------------
--
-- Rute sesi (`/belajar/[sesiId]`) sengaja tidak membawa "atas nama siapa" di
-- alamatnya. Kalau ia membawanya, tautan yang disalin-tempel bisa menyandingkan
-- id sesi seorang anak dengan id anak lain, dan halamannya harus mengurus
-- perselisihan itu. Sebuah sesi sudah tahu miliknya siapa; fungsi ini yang
-- menanyakannya, dengan gerbang yang sama seperti fungsi lain di migrasi ini.
--
-- `profile_id` ikut supaya halaman sesi bisa menautkan kembali ke `/belajar`
-- dengan `?anak=` yang benar untuk jalur keluarga. Ia bukan rahasia: pemanggil
-- yang lolos gerbang ini memang berhak bertindak atas nama pelajar itu.

create or replace function practice_session_owner(
  p_session_id uuid,
  p_access_code text default ''
)
returns table (learner_id uuid, learner_name text, profile_id uuid)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select l.id, coalesce(p.full_name, l.name), l.profile_id
  from practice_sessions ps
  join learners l on l.id = ps.learner_id
  left join profiles p on p.id = l.profile_id
  where ps.id = p_session_id
    and ps.learner_id = practice_actor(coalesce(p_access_code, ''), ps.learner_id);
$$;

notify pgrst, 'reload schema';
