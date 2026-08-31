-- ============================================================
-- Membedakan paket yang tuntas karena benar dari yang tuntas karena terkunci
--
-- Migrasi 134 mencacah `paket_tuntas` — paket yang tidak bisa dikerjakan lagi,
-- entah karena seluruh soalnya sudah benar atau karena kuncinya sudah dibuka.
-- Untuk pertanyaan "berapa banyak topik ini sudah dihadapi" itu tepat: dua-
-- duanya berarti selesai, dan keduanya sama-sama menopang nilai yang tertulis.
--
-- Tapi di layar keduanya jadi satu titik hitam yang sama, dan pada topik yang
-- separuh paketnya berhenti di tengah jalan hasilnya berbunyi "2 dari 2 paket
-- tuntas" bersanding dengan 55%. Kalimat itu benar dan tetap salah kesannya:
-- yang terbaca kabar baik, yang terjadi dua paket yang berhenti sebelum
-- selesai.
--
-- Kolom ini yang membedakannya. `paket_sempurna` mencacah paket yang seluruh
-- soalnya benar; selisihnya terhadap `paket_tuntas` adalah paket yang berhenti
-- karena kuncinya dibuka — dan itu yang digambar sebagai titik berongga.
--
-- Ditambahkan sebagai kolom, bukan dihitung ulang di layar: daftar Penguasaan
-- menampilkan puluhan topik sekaligus, dan menanyakan keadaan paket satu per
-- satu di sana berarti puluhan perjalanan untuk sesuatu yang sudah dilewati
-- kueri ini.
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
  wrong bigint,
  paket_total bigint,
  paket_tuntas bigint,
  paket_sempurna bigint
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
      and b.type not in ('essay', 'upload_file')
      and (b.is_public or not practice_only_public(coalesce(p_access_code, ''), p_learner_id))
  ),
  terakhir as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where a.learner_id = (select learner from me)
      and s.finished_at is not null
    order by a.question_bank_item_id, a.answered_at desc
  ),
  pertama as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where a.learner_id = (select learner from me)
      and s.finished_at is not null
    order by a.question_bank_item_id, a.answered_at asc
  ),
  paket as (
    select p.group_id,
           ((row_number() over (partition by p.group_id order by b.created_at, b.id) - 1) / 10 + 1)
             as paket_index,
           p.item_id
    from pool p
    join question_bank_items b on b.id = p.item_id
  ),
  paket_selesai as (
    select k.group_id,
           k.paket_index,
           bool_and(
             t.question_bank_item_id is not null
             and coalesce(t.max_score, 0) > 0
             and coalesce(t.score, 0) >= t.max_score
           ) as sempurna
    from paket k
    left join terakhir t on t.question_bank_item_id = k.item_id
    group by k.group_id, k.paket_index
  ),
  paket_ringkas as (
    select ps.group_id,
           count(*) as jumlah,
           count(*) filter (where ps.sempurna) as sempurna,
           count(*) filter (
             where ps.sempurna
                or exists (
                  select 1 from practice_paket_locks l
                  where l.learner_id = (select learner from me)
                    and l.group_id = ps.group_id
                    and l.paket_index = ps.paket_index
                )
           ) as tuntas
    from paket_selesai ps
    group by ps.group_id
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
         ),
         coalesce(max(pr.jumlah), 0),
         coalesce(max(pr.tuntas), 0),
         coalesce(max(pr.sempurna), 0)
  from pool p
  left join terakhir t on t.question_bank_item_id = p.item_id
  left join pertama f on f.question_bank_item_id = p.item_id
  left join paket_ringkas pr on pr.group_id = p.group_id
  group by p.group_id;
$$;

notify pgrst, 'reload schema';
