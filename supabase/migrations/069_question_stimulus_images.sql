-- ============================================================
-- Gambar stimulus untuk soal
--
-- `question_bank_items.prompt` selama ini teks murni (LaTeX dirender di sisi
-- klien lewat MathText). Itu cukup untuk soal rutin, tapi TKA adalah asesmen
-- berbasis stimulus: dari 30 contoh soal resmi Matematika SMP, 17 di antaranya
-- bergantung pada gambar — diagram alur, bangun geometri, grafik data — yang
-- tidak bisa dinyatakan sebagai teks.
--
-- Bentuknya array, bukan satu kolom url: sebagian soal memakai lebih dari satu
-- gambar (mis. contoh soal no. 18 punya dua bangun terpisah). Urutan array =
-- urutan tampil, di atas prompt.
--
-- Tidak ikut ke sini: gambar yang isinya cuma rumus. Enam contoh soal resmi
-- memakai potongan gambar untuk persamaan; itu dialihaksarakan ke LaTeX saat
-- impor supaya bisa dicari, diskalakan, dan dibaca pembaca layar.
-- ============================================================

alter table question_bank_items
  add column if not exists stimulus_images text[] not null default '{}';

alter table questions
  add column if not exists stimulus_images text[] not null default '{}';

-- Latihan mandiri membaca soal lewat fungsi security definer, bukan lewat tabel,
-- jadi kolom baru tidak sampai ke murid kalau fungsinya tidak ikut diperlebar.
-- Tipe kembaliannya berubah, dan `create or replace` tidak bisa mengubah itu.
drop function if exists practice_draw_questions(text, uuid[], integer);

create function practice_draw_questions(
  p_access_code text,
  p_group_ids uuid[],
  p_limit integer
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
    select l.id as learner_id
    from learners l
    where l.access_code = p_access_code
      and coalesce(p_access_code, '') <> ''
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

-- Berkasnya --------------------------------------------------------------
-- Bucket publik: gambar soal ikut dibaca murid tamu di /q/[code] yang tidak
-- punya sesi Supabase sama sekali, jadi URL bertanda tangan tidak bisa dipakai
-- tanpa menaruh penandatangan di jalur render tiap soal. Konsekuensinya jujur:
-- siapa pun yang menebak URL bisa melihat gambarnya. Kunci jawaban tidak pernah
-- ada di gambar, jadi yang bocor paling jauh adalah stimulusnya.
insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict (id) do update set public = true;

-- Menulis tetap admin-only, sejalan dengan kebijakan Tera bahwa tutor tidak
-- menyusun soal.
drop policy if exists "Admin manages question images" on storage.objects;
create policy "Admin manages question images" on storage.objects
  for all
  using (bucket_id = 'question-images' and is_admin())
  with check (bucket_id = 'question-images' and is_admin());
