-- ============================================================
-- Berapa banyak soal sebuah TOPIK yang sudah dikerjakan, dan seberapa benar
--
-- 124 dan 125 menjawab pertanyaan itu untuk satu mapel, dan cincin di kartu
-- mapel `/belajar` hidup dari sana. Begitu mapelnya dibuka, kabarnya berhenti:
-- seluruh baris topik terbaca sama — "12 soal · 3 materi" — baik yang sudah
-- dikerjakan tiga kali maupun yang belum pernah disentuh. Anak yang belajar
-- sendiri justru memutuskan di layar itu, dan yang ia butuhkan bukan berapa
-- soal yang ada melainkan berapa yang sudah ia lewati.
--
-- Skornya ikut, bukan cuma cacahnya. "Sudah 10 dari 12" tidak membedakan topik
-- yang dikuasai dari topik yang salah semua, dan justru yang kedua yang paling
-- perlu dibuka lagi. Labelnya TIDAK dikarang di sini: yang dipulangkan angka,
-- dan pemanggilnya menerjemahkannya lewat rubrik mapel (`mastery_rubric_for`)
-- persis seperti halaman hasil.
--
-- Yang dihitung JAWABAN TERAKHIR per soal, bukan seluruh jawaban. Mengulang
-- topik yang sama sampai benar adalah cara belajar yang kita harapkan, dan
-- rata-rata seumur hidup membuat perbaikan itu tidak pernah terlihat — nilai
-- pertama yang buruk menahan angkanya selamanya. Cacah "sudah dikerjakan"
-- memakai soal berbeda, alasan yang sama dengan 124.
--
-- Satu soal yang bertanda dua topik dihitung di KEDUANYA, seperti
-- `practice_summary` (092). Pertanyaannya "sejauh apa topik ini", bukan
-- "apakah jumlahnya seratus persen".
--
-- Fungsi BARU, bukan perubahan pada `practice_topics()`: fungsi itu dipakai
-- bersama repo `form` (Sora). Disiplin yang sama dengan 122, 124, dan 125.
-- ============================================================

create or replace function practice_topic_progress(
  p_access_code text default '',
  p_learner_id uuid default null,
  p_subject_id uuid default null
)
returns table (group_id uuid, answered bigint, total bigint, score numeric, max_score numeric)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  ),
  -- Soal yang BOLEH ditemui pemanggil ini, satu baris per (topik, soal).
  -- Saringannya sama persis dengan `practice_topics()` dan `practice_progress()`
  -- supaya penyebut di sini tidak pernah berasal dari kumpulan yang lain.
  pool as (
    select distinct g.id as group_id, b.id as item_id
    from curriculum_topic_groups g
    join question_curriculum_tags t on t.group_id = g.id
    join question_bank_items b on b.id = t.question_bank_item_id
    where (select learner from me) is not null
      and (p_subject_id is null or g.subject_id = p_subject_id)
      and (b.is_public or not practice_only_public(coalesce(p_access_code, ''), p_learner_id))
  ),
  -- Jawaban TERAKHIR pelajar ini untuk tiap soal.
  terakhir as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from practice_answers a
    where a.learner_id = (select learner from me)
    order by a.question_bank_item_id, a.answered_at desc
  )
  select p.group_id,
         count(t.question_bank_item_id),
         count(*),
         coalesce(sum(t.score), 0),
         coalesce(sum(t.max_score), 0)
  from pool p
  left join terakhir t on t.question_bank_item_id = p.item_id
  group by p.group_id;
$$;

notify pgrst, 'reload schema';
