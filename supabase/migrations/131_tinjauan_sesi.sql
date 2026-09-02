-- ============================================================
-- Daftar soal sebuah sesi yang sudah selesai — nomor per nomor
--
-- Halaman hasil berhenti di rekap per topik: "18% · Kurang", lalu "Bilangan
-- Real · 11 soal". Sesudah 130 dan halaman rincian topik, orang tua sudah bisa
-- melihat soal nomor 4, 7, dan 9 yang salah — dan berhenti persis di situ,
-- karena tidak ada satu pun layar yang bisa menjawab "soal nomor 4 itu apa".
-- Nomor tanpa soalnya cuma memindahkan pertanyaannya, bukan menjawabnya.
--
-- Yang dipulangkan sengaja LEBIH BANYAK daripada `practice_session_state`:
-- jawaban yang dikirim anaknya (`response`), kuncinya (`correct_answer`), dan
-- pembahasannya. Ketiganya tidak ada di fungsi itu, dan memang tidak boleh ada
-- — sesi yang sedang berjalan membaca keadaannya lewat sana, dan kunci yang
-- ikut ke browser sebelum soalnya dijawab adalah kunci yang bocor.
--
-- Karena itu gerbangnya dua, bukan satu:
--
--   1. `practice_actor()` — sesi ini milik pemanggilnya, sama dengan seluruh
--      keluarga fungsi `practice_*`.
--   2. `finished_at is not null` — SESINYA SUDAH SELESAI. Ini yang membuat
--      fungsi ini tidak bisa dipakai mengintip: sesi yang masih berjalan
--      memulangkan nol baris, jadi tidak ada jalan dari soal yang belum
--      dijawab menuju kuncinya. Halaman hasil memanggil
--      `practice_finish_session` lebih dulu, jadi syarat ini tidak pernah
--      menghalangi pemakaian yang wajar.
--
-- Soal yang tidak dijawab tetap dipulangkan dengan `response` null: sesi yang
-- ditinggalkan di tengah lalu ditutup punya lubang, dan daftar yang melompati
-- nomornya membuat pembacanya mengira nomor itu tidak pernah ada.
--
-- `ord` datang dari `unnest(item_ids) with ordinality`, sama persis dengan
-- `practice_session_state` — jadi "Soal 4" di halaman hasil adalah soal yang
-- sama dengan "Soal 4 dari 10" yang dilihat anaknya waktu mengerjakan.
-- ============================================================

create or replace function practice_session_review(
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
  response jsonb,
  answered boolean,
  is_correct boolean,
  score numeric,
  max_score numeric,
  correct_answer jsonb,
  explanation text
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
         pa.response,
         pa.id is not null,
         pa.is_correct,
         pa.score,
         pa.max_score,
         b.correct_answer,
         b.explanation
  from practice_sessions ps
  cross join lateral unnest(ps.item_ids) with ordinality as i(item_id, ord)
  join question_bank_items b on b.id = i.item_id
  -- Jawaban terakhir yang menang kalau ada dua, sama dengan
  -- `practice_session_state`: `practice_record_answer` menyisipkan tanpa kunci
  -- unik, dan yang benar untuk ditinjau adalah jawaban yang terakhir dikirim.
  left join lateral (
    select a.id, a.response, a.is_correct, a.score, a.max_score
    from practice_answers a
    where a.session_id = ps.id and a.question_bank_item_id = i.item_id
    order by a.answered_at desc
    limit 1
  ) pa on true
  where ps.id = p_session_id
    and ps.finished_at is not null
    and ps.learner_id = practice_actor(coalesce(p_access_code, ''), ps.learner_id)
  order by i.ord;
$$;

notify pgrst, 'reload schema';
