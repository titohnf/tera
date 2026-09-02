-- ============================================================
-- Berapa yang benar, berapa yang salah — bukan cuma berapa yang dikerjakan
--
-- Sesudah 129, sebuah topik berbunyi "33% · Kurang · 1/3 soal dikerjakan".
-- Ketiganya benar, dan bersama-sama masih menyembunyikan kalimat yang paling
-- ingin dibaca orang tua: soal yang dikerjakan itu benar atau salah. "1/3
-- dikerjakan" sama bunyinya untuk anak yang menjawab satu soal dengan benar dan
-- anak yang menjawab satu soal dengan salah, dan persen yang membedakan
-- keduanya menuntut pembacanya menghitung mundur dari sebuah pecahan berbobot.
--
-- Yang dipulangkan tiga cacah, semuanya dari JAWABAN TERAKHIR tiap soal —
-- dasar yang sama dengan `score` (128), supaya cacah dan persennya tidak
-- pernah bercerita beda:
--
--   correct  nilainya penuh
--   partial  dapat sebagian — `statement_grid` dan `mcq_multi` memang bisa
--            begitu, dan melipatnya ke "benar" atau ke "salah" sama-sama
--            berbohong tentang tujuh soal statement_grid yang ada sekarang
--   wrong    nol
--
-- Yang belum dikerjakan tidak ikut dicacah: `total - answered` sudah
-- mengatakannya, dan kolom keempat yang bisa dihitung dari kolom lain adalah
-- kolom yang cepat atau lambat berbeda sendiri.
--
-- `max_score = 0` pada baris jawaban (soal tanpa bobot) dihitung sebagai salah,
-- bukan sebagai benar: `score >= max_score` akan memulangkan "benar" untuk
-- setiap jawaban nol atas soal berbobot nol, dan itu kabar bohong yang paling
-- mudah lolos dari pembacaan.
-- ============================================================

drop function if exists practice_topic_progress(text, uuid, uuid);

create or replace function practice_topic_progress(
  p_access_code text default '',
  p_learner_id uuid default null,
  p_subject_id uuid default null
)
returns table (
  group_id uuid,
  answered bigint,
  total bigint,
  score numeric,
  max_score numeric,
  max_available numeric,
  first_score numeric,
  correct bigint,
  partial bigint,
  wrong bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  ),
  pool as (
    select distinct g.id as group_id, b.id as item_id, b.weight
    from curriculum_topic_groups g
    join question_curriculum_tags t on t.group_id = g.id
    join question_bank_items b on b.id = t.question_bank_item_id
    where (select learner from me) is not null
      and (p_subject_id is null or g.subject_id = p_subject_id)
      and (b.is_public or not practice_only_public(coalesce(p_access_code, ''), p_learner_id))
  ),
  terakhir as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from practice_answers a
    where a.learner_id = (select learner from me)
    order by a.question_bank_item_id, a.answered_at desc
  ),
  pertama as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score
    from practice_answers a
    where a.learner_id = (select learner from me)
    order by a.question_bank_item_id, a.answered_at asc
  )
  select p.group_id,
         count(t.question_bank_item_id),
         count(*),
         coalesce(sum(t.score), 0),
         coalesce(sum(t.max_score), 0),
         coalesce(sum(p.weight), 0),
         coalesce(sum(f.score), 0),
         count(*) filter (
           where t.question_bank_item_id is not null
             and coalesce(t.max_score, 0) > 0
             and coalesce(t.score, 0) >= t.max_score
         ),
         count(*) filter (
           where t.question_bank_item_id is not null
             and coalesce(t.score, 0) > 0
             and coalesce(t.score, 0) < coalesce(t.max_score, 0)
         ),
         count(*) filter (
           where t.question_bank_item_id is not null
             and (coalesce(t.score, 0) <= 0 or coalesce(t.max_score, 0) <= 0)
         )
  from pool p
  left join terakhir t on t.question_bank_item_id = p.item_id
  left join pertama f on f.question_bank_item_id = p.item_id
  group by p.group_id;
$$;

notify pgrst, 'reload schema';
