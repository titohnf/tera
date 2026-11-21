-- ============================================================
-- Soal peserta tanpa kunci, dan pengiriman percobaan yang dinilai di database
--
-- Latar: kebijakan `Public reads questions of published quizzes` (migrasi 061)
-- membuka SELURUH kolom `questions` untuk paket terbit, termasuk
-- `correct_answer` dan `explanation`. Siapa pun dengan kunci publik bisa
-- mengambil kunci jawaban lewat API, walau halaman siswa tidak
-- menampilkannya. Rancangan: docs/rancangan-keamanan-percobaan.md (tahap 1).
--
-- Migrasi ini ADITIF: hanya menambah tiga fungsi. Kode Sora yang lama tidak
-- peduli, jadi aman dijalankan kapan saja. Yang menutup celahnya adalah
-- migrasi 226, dan itu HARUS dijalankan sesudah Sora yang baru terdeploy.
--
--   soal_peserta(quiz)     soal tanpa kunci dan tanpa pembahasan
--   bobot_paket(quiz)      jumlah bobot soal (untuk "skor / total")
--   kirim_percobaan(id)    menilai dan menutup percobaan seluruhnya di database
--
-- Penilaian tetap lewat `nilai_jawaban_banyak()` (migrasi 138), satu-satunya
-- definisi aturan skoring, skema bawaan `sederhana` seperti yang dipakai
-- `finalizeAttempt` di Sora sampai sekarang.
-- ============================================================

-- 1. Soal untuk peserta -----------------------------------------------------
-- Kolom persis yang dibaca halaman siswa; tanpa correct_answer, explanation,
-- template, dan kompetensi.
create or replace function soal_peserta(p_quiz_id uuid)
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'id', q.id,
           'quiz_id', q.quiz_id,
           'type', q.type,
           'prompt', q.prompt,
           'options', q.options,
           'weight', q.weight,
           'order_index', q.order_index,
           'branching', q.branching,
           'stimulus_images', q.stimulus_images
         )
  from questions q
  join quizzes z on z.id = q.quiz_id
  where q.quiz_id = p_quiz_id
    and z.status = 'published'
  order by q.order_index, q.id;
$$;

comment on function soal_peserta(uuid) is
  'Soal sebuah paket TERBIT untuk peserta: tanpa kunci jawaban, pembahasan, templat, dan peta kompetensi.';

-- 2. Jumlah bobot -----------------------------------------------------------
-- Halaman hasil dulu menjumlahkannya lewat `answers(questions(weight))`, yang
-- ikut kosong begitu peserta tidak lagi boleh membaca `questions`.
create or replace function bobot_paket(p_quiz_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(weight), 0) from questions where quiz_id = p_quiz_id;
$$;

comment on function bobot_paket(uuid) is
  'Jumlah bobot seluruh soal sebuah paket. Hanya angka, tidak membuka isi soal.';

-- 3. Kirim percobaan --------------------------------------------------------
-- Melakukan persis yang selama ini dilakukan `finalizeAttempt` di TypeScript:
-- membaca soal dan jawaban percobaan itu, menilai, menulis `auto_score` per
-- jawaban, menjumlahkan (null selagi masih ada soal yang menunggu tutor), dan
-- mengisi `submitted_at`. Ditambah yang sebelumnya tidak ada: percobaan yang
-- sudah dikirim ditolak, jadi skor tidak bisa dinilai ulang atau ditimpa.
--
-- Soal tanpa jawaban ikut dinilai (jawaban null), sama seperti sebelumnya.
-- Esai dan unggah berkas bernilai null: bukan nol, melainkan masuk antrean
-- penilaian tutor (`needs_manual_grading`).
create or replace function kirim_percobaan(p_attempt_id uuid)
returns numeric
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_quiz uuid;
  v_dikirim timestamptz;
  v_daftar jsonb;
  v_nilai jsonb;
  v_total numeric;
  v_menunggu boolean;
begin
  -- Kunci baris percobaan supaya dua pengiriman bersamaan tidak saling menimpa.
  select a.quiz_id, a.submitted_at
    into v_quiz, v_dikirim
  from attempts a
  where a.id = p_attempt_id
  for update;

  if not found then
    raise exception 'percobaan_tidak_ditemukan' using errcode = 'P0002';
  end if;
  if v_dikirim is not null then
    raise exception 'sudah_dikirim' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(s.item order by s.n), '[]'::jsonb)
    into v_daftar
  from (
    select row_number() over (order by q.order_index, q.id) as n,
           jsonb_build_object(
             'tipe', q.type,
             'opsi', q.options,
             'kunci', q.correct_answer,
             'jawaban', a.response,
             'bobot', q.weight
           ) as item
    from questions q
    left join answers a on a.attempt_id = p_attempt_id and a.question_id = q.id
    where q.quiz_id = v_quiz
  ) s;

  v_nilai := nilai_jawaban_banyak(v_daftar);

  insert into answers (attempt_id, question_id, quiz_id, response, auto_score, manual_score, needs_manual_grading)
  select p_attempt_id,
         s.id,
         v_quiz,
         s.response,
         s.skor,
         null,
         s.skor is null
  from (
    select q.id,
           a.response,
           (v.val #>> '{}')::numeric as skor
    from (
      select q2.id, row_number() over (order by q2.order_index, q2.id) as n
      from questions q2
      where q2.quiz_id = v_quiz
    ) q
    left join answers a on a.attempt_id = p_attempt_id and a.question_id = q.id
    join jsonb_array_elements(v_nilai) with ordinality as v(val, ord) on v.ord = q.n
  ) s
  on conflict (attempt_id, question_id) do update
    set response = excluded.response,
        auto_score = excluded.auto_score,
        manual_score = null,
        needs_manual_grading = excluded.needs_manual_grading;

  select bool_or(jsonb_typeof(v.val) = 'null'),
         coalesce(sum((v.val #>> '{}')::numeric), 0)
    into v_menunggu, v_total
  from jsonb_array_elements(v_nilai) as v(val);

  if coalesce(v_menunggu, false) then
    v_total := null;
  end if;

  update attempts
     set total_score = v_total,
         submitted_at = now()
   where id = p_attempt_id;

  return v_total;
end;
$$;

comment on function kirim_percobaan(uuid) is
  'Menilai dan menutup satu percobaan di database. Menolak percobaan yang sudah dikirim. Mengembalikan total skor, atau null bila ada soal yang menunggu penilaian tutor.';

-- Peserta anonim dan murid berakun sama-sama memanggilnya. Yang dilindungi:
-- id percobaan tidak bisa ditebak, dan percobaan yang sudah dikirim ditolak.
grant execute on function soal_peserta(uuid) to anon, authenticated;
grant execute on function bobot_paket(uuid) to anon, authenticated;
grant execute on function kirim_percobaan(uuid) to anon, authenticated;
