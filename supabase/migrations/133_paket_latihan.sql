-- ============================================================
-- Paket sebagai satuan penilaian, dan banyaknya paket sebagai keyakinan
--
-- Sampai sekarang penguasaan sebuah topik dihitung dari JAWABAN TERAKHIR tiap
-- soal, dengan penyebut seluruh soal topik (migrasi 129). Bentuk itu punya satu
-- sifat yang baru terasa setelah alur sepuluh soal jadi berulang: ia tidak
-- punya ingatan. Anak yang mengerjakan lima paket dan membaik terus-menerus
-- terbaca sama persis dengan anak yang mengerjakan satu paket lalu berhenti,
-- asal jawaban terakhirnya sama. Yang hilang justru bagian yang paling ingin
-- dibaca orang tua: sudah berapa kali, dan apakah membaik.
--
-- Sesudah migrasi ini ada dua angka, bukan satu:
--
--   paket_avg    RATA-RATA nilai seluruh paket yang sudah selesai. Paket yang
--                jelek tidak bisa dihapus dengan mengulang — ia ikut ditimbang
--                selamanya, dan itu memang maksudnya. Yang menggeser rata-rata
--                adalah mengerjakan paket baru dengan lebih baik.
--   paket_count  BANYAKNYA paket selesai. Ini bukan nilai melainkan seberapa
--                banyak bukti yang menopang nilai itu — 100% dari satu paket
--                dan 100% dari lima paket adalah dua pernyataan yang sangat
--                berbeda, dan sebelum ini keduanya dicetak dengan angka yang
--                sama persis.
--
-- APA ITU SATU PAKET. Sebuah `practice_sessions` yang `paket_of`-nya null —
-- yaitu sepuluh soal yang diundi sebagai pekerjaan baru. Sesi PERBAIKAN bukan
-- paket tersendiri; ia menunjuk induknya lewat `paket_of`, dan jawabannya
-- memperbaiki nilai paket itu. Kalau perbaikan dihitung sebagai paket
-- tersendiri, dua hal rusak sekaligus: keyakinan naik hanya karena mengulang
-- soal yang sama, dan rata-ratanya diseret oleh paket lima soal yang isinya
-- justru soal-soal tersulit.
--
-- `paket_of` selalu menunjuk AKAR, bukan induk langsung. Perbaikan atas
-- perbaikan tetap menunjuk paket yang sama, jadi tidak ada rantai yang perlu
-- ditelusuri dan tidak ada kedalaman yang perlu dibatasi.
--
-- NILAI SEBUAH PAKET dihitung dari jawaban terakhir tiap soal DI DALAM
-- keluarga sesi itu saja (paketnya sendiri dan perbaikan-perbaikannya). Batas
-- itu yang membuat penilaiannya benar-benar spesifik per paket: soal yang
-- kebetulan terundi lagi di paket lain tidak boleh mengubah nilai paket yang
-- sudah lewat.
-- ============================================================

alter table practice_sessions
  add column if not exists paket_of uuid references practice_sessions(id) on delete set null;

create index if not exists practice_sessions_paket_of_idx on practice_sessions(paket_of);

comment on column practice_sessions.paket_of is
  'Paket induk kalau sesi ini perbaikan; null kalau sesi ini sendiri sebuah paket. Selalu menunjuk akar.';

-- 1. Sesi perbaikan mencatat induknya ------------------------------------------
--
-- Sama dengan migrasi 132, ditambah satu baris: paketnya diwariskan. Sumber
-- yang sendirinya sebuah perbaikan mewariskan `paket_of` miliknya, jadi yang
-- tersimpan selalu akar.

create or replace function practice_open_retry_session(
  p_session_id uuid,
  p_access_code text default ''
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
  v_subject uuid;
  v_groups uuid[];
  v_paket uuid;
  v_session uuid;
begin
  select ps.learner_id, ps.subject_id, ps.group_ids, coalesce(ps.paket_of, ps.id)
    into v_learner, v_subject, v_groups, v_paket
  from practice_sessions ps
  where ps.id = p_session_id
    and ps.finished_at is not null
    and ps.learner_id = practice_actor(coalesce(p_access_code, ''), ps.learner_id);

  if v_learner is null then return null; end if;

  select array_agg(i.item_id order by i.ord)
    into v_items
  from practice_sessions ps
  cross join lateral unnest(ps.item_ids) with ordinality as i(item_id, ord)
  left join lateral (
    select a.score, a.max_score
    from practice_answers a
    where a.session_id = ps.id and a.question_bank_item_id = i.item_id
    order by a.answered_at desc
    limit 1
  ) pa on true
  where ps.id = p_session_id
    and (
      pa.score is null
      or coalesce(pa.max_score, 0) <= 0
      or coalesce(pa.score, 0) < pa.max_score
    );

  if v_items is null or cardinality(v_items) = 0 then return null; end if;

  insert into practice_sessions
    (learner_id, subject_id, group_ids, question_count, item_ids, paket_of)
  values
    (v_learner, v_subject, coalesce(v_groups, '{}'), cardinality(v_items), v_items, v_paket)
  returning id into v_session;

  return v_session;
end;
$$;

-- 2. Kemajuan topik, kini dengan paket -----------------------------------------
--
-- Kolom lama DIPERTAHANKAN semuanya. Cacah benar/sebagian/salah (migrasi 130)
-- menjawab pertanyaan yang berbeda dari rata-rata paket — "berapa soal di topik
-- ini yang sudah pernah dikuasai" versus "seberapa baik ia mengerjakan paket" —
-- dan keduanya dipakai di layar yang berbeda. Yang ditambahkan dua kolom di
-- ujung, jadi pemanggil lama tidak perlu ikut berubah.

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
  paket_count bigint,
  paket_avg numeric
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
  ),
  -- Paket = sesi selesai yang bukan perbaikan.
  paket as (
    select ps.id, ps.group_ids, ps.item_ids
    from practice_sessions ps
    where ps.learner_id = (select learner from me)
      and ps.paket_of is null
      and ps.finished_at is not null
      and coalesce(cardinality(ps.item_ids), 0) > 0
  ),
  -- Nilai tiap paket, dari jawaban terakhir tiap soal DI DALAM keluarga sesi
  -- paket itu. Soal yang belum terjawab ikut sebagai nol lewat `coalesce`:
  -- paket yang ditinggalkan lalu ditutup memang belum dikerjakan penuh, dan
  -- membuang soalnya dari penyebut akan membuatnya terbaca 100%.
  nilai_paket as (
    select p.id,
           sum(coalesce(j.score, 0)) as skor,
           sum(coalesce(j.max_score, 0)) as maks
    from paket p
    cross join lateral unnest(p.item_ids) as it(item_id)
    left join lateral (
      select a.score, a.max_score
      from practice_answers a
      where a.question_bank_item_id = it.item_id
        and (
          a.session_id = p.id
          or a.session_id in (
            select r.id from practice_sessions r where r.paket_of = p.id
          )
        )
      order by a.answered_at desc
      limit 1
    ) j on true
    group by p.id
  ),
  per_topik as (
    select g.gid as group_id,
           count(*) as paket_count,
           avg(100.0 * n.skor / n.maks) as paket_avg
    from paket p
    join nilai_paket n on n.id = p.id
    cross join lateral unnest(p.group_ids) as g(gid)
    where n.maks > 0
    group by g.gid
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
         coalesce(max(pt.paket_count), 0),
         max(pt.paket_avg)
  from pool p
  left join terakhir t on t.question_bank_item_id = p.item_id
  left join pertama f on f.question_bank_item_id = p.item_id
  left join per_topik pt on pt.group_id = p.group_id
  group by p.group_id;
$$;

notify pgrst, 'reload schema';
