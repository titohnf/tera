-- ============================================================
-- Penguasaan dihitung atas SELURUH soal topik, dan nilai pertamanya disimpan
--
-- 128 memulangkan nilai jawaban terakhir beserta bobot soal yang dijawab saja.
-- Dipakai sebagai persentase, angka itu menjawab "seberapa tepat yang sudah
-- dikerjakan" — bukan "seberapa dikuasai topik ini". Bedanya bukan main: anak
-- yang mengerjakan 1 dari 3 soal Data dan benar mendapat 100%, lengkap dengan
-- label "Istimewa", sementara dua soal sisanya belum pernah ia lihat. Halaman
-- yang bernama Penguasaan tidak boleh berkata begitu.
--
-- `max_available` karena itu ditambahkan: jumlah bobot SELURUH soal topik yang
-- boleh ditemui pelajar ini, dijawab maupun belum. Dengan penyebut itu, 1 benar
-- dari 3 soal adalah 33%, dan 100% cuma mungkin kalau semua soal dikerjakan dan
-- semuanya benar. Cakupannya sendiri (`answered`/`total`) tetap terpisah — ia
-- yang pantas digambar sebagai bilah kemajuan, karena cuma itu yang benar-benar
-- "berapa dari berapa".
--
-- Bobotnya diambil dari `question_bank_items.weight` yang BERLAKU SEKARANG,
-- bukan dari `max_score` yang tercatat saat menjawab. Penyebut sebuah topik
-- harus menggambarkan topik itu hari ini; kalau bobot soal diubah admin, yang
-- ikut berubah penyebut seluruh pelajar, bukan cuma yang belum menjawab.
--
-- `first_score` menjawab pertanyaan yang muncul begitu penguasaan memakai
-- jawaban TERAKHIR: anak yang mengulang topik setelah membaca pembahasan bisa
-- naik dari 10% ke 100%, dan angka 100% sendirian menyembunyikan bahwa ia
-- pernah 10%. Yang dipulangkan jumlah nilai jawaban PERTAMA tiap soal, jadi
-- layar bisa mengatakan "naik dari 10%" — kenaikan itu justru kabar terbaik
-- yang dipunyai halaman ini, dan menyembunyikannya sama saja dengan
-- menyembunyikan bahwa pembahasannya bekerja.
--
-- Tanda tangannya sama, tapi bentuk hasilnya berubah — jadi fungsinya DIHAPUS
-- dulu, seperti 125. `create or replace` tidak bisa mengubah `returns table`.
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
  first_score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  ),
  -- Soal yang BOLEH ditemui pemanggil ini, satu baris per (topik, soal),
  -- beserta bobotnya. Saringannya sama persis dengan `practice_topics()` dan
  -- `practice_progress()`.
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
         coalesce(sum(f.score), 0)
  from pool p
  left join terakhir t on t.question_bank_item_id = p.item_id
  left join pertama f on f.question_bank_item_id = p.item_id
  group by p.group_id;
$$;

notify pgrst, 'reload schema';
