-- ============================================================
-- Kemajuan bisa dihitung untuk satu jenjang saja
--
-- Kartu mapel di `/belajar` menyebut angka seluruh mapel, sementara isi yang
-- terbuka begitu mapelnya diketuk cuma jenjang si anak. Untuk Matematika
-- selisihnya bukan main: 31 soal dan 25 materi di kartunya, tapi di Kelas 7
-- ada 0 soal dan 6 materi — 30 soalnya di Kelas 9, sisanya di Kelas 1. Dua
-- angka itu sama-sama benar dan justru itu masalahnya: berdampingan, yang
-- pertama terbaca sebagai janji yang tidak ditepati yang kedua.
--
-- Segmen "Mapel tersedia di kelasmu" karena itu menghitung kelasnya saja, dan
-- penyebut kemajuannya harus ikut — cincin yang penuh atas 31 soal sementara
-- angka di sebelahnya bicara 6 adalah selisih yang sama, cuma pindah tempat.
--
-- `p_grade_levels` null berarti seluruh jenjang, persis perilaku 124. Segmen
-- "Mapel lain" tetap memakainya: di sana kelas si anak memang bukan ukurannya.
--
-- Fungsi lamanya DIHAPUS dulu, tidak bisa `create or replace` saja. Menambah
-- argumen berdefault membuat panggilan dua-argumen cocok dengan kedua versi,
-- dan Postgres menolaknya sebagai "function is not unique" — persoalan yang
-- sama yang memaksa 092 menghapus lebih dulu.
-- ============================================================

drop function if exists practice_progress(text, uuid);

create or replace function practice_progress(
  p_access_code text default '',
  p_learner_id uuid default null,
  p_grade_levels text[] default null
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
      and (p_grade_levels is null or g.grade_level = any(p_grade_levels))
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
