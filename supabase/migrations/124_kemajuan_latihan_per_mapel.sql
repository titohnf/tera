-- ============================================================
-- Berapa banyak soal sebuah mapel yang sudah pernah dikerjakan
--
-- `/belajar` menyebutkan berapa soal yang tersedia, tapi tidak pernah berapa
-- yang sudah dilewati. Angka "31 soal" sama bunyinya di hari pertama dan di
-- hari kesepuluh, jadi anak yang sudah mengerjakan separuhnya tidak punya cara
-- tahu ia sedang di mana — dan orang tua yang bertanya "sudah sampai mana"
-- dijawab dengan tebakan.
--
-- Yang dihitung SOAL BERBEDA yang pernah dijawab, bukan jumlah jawaban:
-- mengulang topik yang sama sepuluh kali tidak membuat kemajuan sepuluh kali
-- lipat, dan lingkaran yang penuh karena pengulangan adalah kabar bohong.
--
-- Penyebutnya dihitung dengan saringan yang persis sama dengan
-- `practice_subjects()` — termasuk `practice_only_public()` — supaya angka di
-- lingkaran dan angka "N soal" di sebelahnya tidak pernah berasal dari dua
-- kumpulan yang berbeda.
--
-- Fungsi BARU, bukan perubahan pada `practice_subjects()`: fungsi itu dipakai
-- bersama repo `form` (Sora), dan menambah kolom pada hasilnya menyentuh
-- pemakai yang tidak meminta apa-apa. Disiplin yang sama dengan 122.
--
-- `security definer` dengan gerbang `practice_actor()` mengikuti seluruh
-- keluarga `practice_*`: pemanggil yang tidak berhak tidak mendapat satu baris
-- pun, dan `practice_answers` tetap tidak perlu dibuka untuk keluarga di RLS.
-- ============================================================

create or replace function practice_progress(
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (subject_id uuid, answered bigint, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  ),
  -- Soal yang BOLEH ditemui pemanggil ini, satu baris per (mapel, soal).
  -- `distinct` penting: satu soal bisa ditandai ke beberapa topik dalam mapel
  -- yang sama, dan tanpa ini ia terhitung berkali-kali di penyebut.
  pool as (
    select distinct g.subject_id, b.id as item_id
    from curriculum_topic_groups g
    join question_curriculum_tags t on t.group_id = g.id
    join question_bank_items b on b.id = t.question_bank_item_id
    where (select learner from me) is not null
      and (b.is_public or not practice_only_public(coalesce(p_access_code, ''), p_learner_id))
  )
  select p.subject_id,
         count(distinct a.question_bank_item_id),
         count(distinct p.item_id)
  from pool p
  left join practice_answers a
    on a.question_bank_item_id = p.item_id
   and a.learner_id = (select learner from me)
  group by p.subject_id;
$$;

notify pgrst, 'reload schema';
