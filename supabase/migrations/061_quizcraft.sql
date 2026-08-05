-- ============================================================
-- QUIZCRAFT — mesin soal: bank soal, kuis, dan latihan mandiri
--
-- Dibawa masuk dari aplikasi QuizCraft yang berdiri sendiri, supaya nilai hasil
-- latihan bisa mengalir ke Laporan Bulanan alih-alih diketik ulang, dan supaya
-- `curriculum_resources.kind = 'bank_soal'` tidak lagi sekadar menunjuk ke
-- Google Form di luar sistem.
--
-- Tiga hal yang ditinggalkan dari skema QuizCraft lama:
--   * tabel `classes`-nya sendiri  -> pakai `classes`/`class_students` Tera
--   * tabel `topics`-nya sendiri   -> pakai `curriculum_topic_groups` (060)
--   * kepemilikan per tutor        -> hanya admin yang menyusun soal
-- ============================================================

-- Identitas murid latihan -----------------------------------------------------
-- Satu tabel untuk dua jenis murid: yang terdaftar di Tera (`profile_id` terisi)
-- dan yang dari luar (null). Laporan Bulanan cukup melihat baris yang terpaut
-- profil; murid luar boleh berlatih tanpa mengotori data operasional Tera.
--
-- Murid tetap tidak punya akun: `access_code` adalah kredensial ringan yang
-- dibagikan admin, bukan login.

create table learners (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  access_code text,
  created_at timestamptz not null default now()
);

create unique index learners_profile_id_key on learners(profile_id) where profile_id is not null;
create unique index learners_access_code_key on learners(access_code) where access_code is not null;

-- Rubrik penguasaan -----------------------------------------------------------
-- Data, bukan aturan sistem. Baris dengan `subject_id` null adalah default untuk
-- semua mapel; baris ber-subject menimpanya. Tanpa keduanya, hasil ditampilkan
-- sebagai persentase mentah tanpa label.

create table mastery_rubrics (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid references subjects(id) on delete cascade,
  -- [{"label":"Kurang","min":0},{"label":"Memadai","min":50}, ...] menaik
  bands jsonb not null,
  created_at timestamptz not null default now()
);

-- Satu rubrik per mapel, dan satu default global. Index ekspresi karena unique
-- biasa menganggap tiap null berbeda, sehingga default global bisa kembar.
create unique index mastery_rubrics_subject_key
  on mastery_rubrics (coalesce(subject_id, '00000000-0000-0000-0000-000000000000'::uuid));

create or replace function mastery_rubric_for(p_subject_id uuid)
returns jsonb
language sql
stable
as $$
  select bands from mastery_rubrics
  where subject_id is not distinct from p_subject_id
     or subject_id is null
  order by (subject_id is null)  -- yang spesifik menang atas default
  limit 1;
$$;

-- Bank soal -------------------------------------------------------------------

create table question_bank_items (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references profiles(id) on delete set null,
  type text not null,
  prompt text not null,
  options jsonb,
  correct_answer jsonb,
  weight numeric not null default 1,
  -- Ditampilkan ke murid setelah menjawab di latihan mandiri.
  explanation text,
  created_at timestamptz not null default now()
);

-- Menunjuk group, bukan enam kolom string: inilah gunanya 060. Ganti nama topik
-- tidak melepaskan soalnya, dan hapus topik ikut membersihkan tagnya.
create table question_curriculum_tags (
  question_bank_item_id uuid not null references question_bank_items(id) on delete cascade,
  group_id uuid not null references curriculum_topic_groups(id) on delete cascade,
  primary key (question_bank_item_id, group_id)
);

create index question_curriculum_tags_group_idx on question_curriculum_tags(group_id);

-- Kuis ------------------------------------------------------------------------

create table quizzes (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references profiles(id) on delete set null,
  class_id uuid references classes(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  share_code text unique,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  type text not null check (type in (
    'mcq_single', 'true_false', 'short_answer', 'essay',
    'mcq_multi', 'matching', 'ordering', 'fill_blank', 'upload_file',
    'statement_grid'
  )),
  prompt text not null,
  options jsonb,
  correct_answer jsonb,
  weight numeric not null default 1,
  order_index integer not null default 0,
  branching jsonb,
  explanation text,
  created_at timestamptz not null default now()
);

create table attempts (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  guest_name text not null,
  learner_id uuid references learners(id) on delete set null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  total_score numeric,
  current_question_index integer not null default 0,
  last_active_at timestamptz not null default now()
);

create table answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  -- Didenormalisasi supaya Supabase Realtime bisa memfilter langsung; filter
  -- postgres_changes hanya mendukung kesetaraan satu kolom pada tabel itu.
  quiz_id uuid references quizzes(id) on delete cascade,
  response jsonb,
  auto_score numeric,
  manual_score numeric,
  needs_manual_grading boolean not null default false,
  tutor_feedback text,
  unique (attempt_id, question_id)
);

-- Latihan mandiri -------------------------------------------------------------
-- Sesi dan jawaban dipisah, sejajar attempts/answers di sisi kuis.

create table practice_sessions (
  id uuid primary key default uuid_generate_v4(),
  learner_id uuid not null references learners(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  -- Apa yang dipilih murid, untuk label saja. Rincian skor dihitung ulang dari
  -- question_curriculum_tags, jadi topik yang dihapus merusak label, bukan angka.
  group_ids uuid[] not null default '{}',
  question_count integer not null default 10,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table practice_answers (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references practice_sessions(id) on delete cascade,
  -- Didenormalisasi dari sesi supaya kueri penguasaan lintas waktu untuk satu
  -- murid tidak perlu join, alasan yang sama dengan answers.quiz_id.
  learner_id uuid not null references learners(id) on delete cascade,
  question_bank_item_id uuid not null references question_bank_items(id) on delete cascade,
  response jsonb,
  is_correct boolean,
  score numeric,
  -- Bobot soal saat dijawab, supaya rincian sesi lama tetap jujur setelah bobot
  -- diubah atau soalnya dihapus.
  max_score numeric,
  answered_at timestamptz not null default now()
);

create index questions_quiz_id_idx on questions(quiz_id);
create index attempts_quiz_id_idx on attempts(quiz_id);
create index attempts_last_active_at_idx on attempts(last_active_at);
create index answers_attempt_id_idx on answers(attempt_id);
create index answers_quiz_id_idx on answers(quiz_id);
create index practice_sessions_learner_idx on practice_sessions(learner_id);
create index practice_answers_session_idx on practice_answers(session_id);
create index practice_answers_learner_idx on practice_answers(learner_id);

-- Row Level Security ----------------------------------------------------------

alter table learners enable row level security;
alter table mastery_rubrics enable row level security;
alter table question_bank_items enable row level security;
alter table question_curriculum_tags enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table attempts enable row level security;
alter table answers enable row level security;
alter table practice_sessions enable row level security;
alter table practice_answers enable row level security;

-- Admin menyusun segalanya. Tidak ada kepemilikan per tutor: sesuai kebijakan,
-- tutor tidak membuat soal.

create policy "Admins manage learners" on learners for all using (is_admin());
create policy "Admins manage mastery rubrics" on mastery_rubrics for all using (is_admin());
create policy "Admins manage question bank" on question_bank_items for all using (is_admin());
create policy "Admins manage question tags" on question_curriculum_tags for all using (is_admin());
create policy "Admins manage quizzes" on quizzes for all using (is_admin());
create policy "Admins manage questions" on questions for all using (is_admin());
create policy "Admins manage attempts" on attempts for all using (is_admin());
create policy "Admins manage answers" on answers for all using (is_admin());
create policy "Admins manage practice sessions" on practice_sessions for all using (is_admin());
create policy "Admins manage practice answers" on practice_answers for all using (is_admin());

-- Tutor hanya membaca hasil murid di kelas yang dia ajar. Mereka mengisi
-- performance_notes per sesi, jadi perlu tahu murid lemah di mana — tapi tidak
-- pernah melihat kunci jawaban lewat jalur ini karena hanya baris hasil yang
-- terbuka, bukan question_bank_items.

create policy "Tutors read own class quizzes" on quizzes
  for select using (
    is_tutor() and exists (
      select 1 from classes c where c.id = quizzes.class_id and c.tutor_id = auth.uid()
    )
  );

create policy "Tutors read own class attempts" on attempts
  for select using (
    is_tutor() and exists (
      select 1 from quizzes q join classes c on c.id = q.class_id
      where q.id = attempts.quiz_id and c.tutor_id = auth.uid()
    )
  );

create policy "Tutors read own class answers" on answers
  for select using (
    is_tutor() and exists (
      select 1 from quizzes q join classes c on c.id = q.class_id
      where q.id = answers.quiz_id and c.tutor_id = auth.uid()
    )
  );

create policy "Tutors give feedback on own class answers" on answers
  for update using (
    is_tutor() and exists (
      select 1 from quizzes q join classes c on c.id = q.class_id
      where q.id = answers.quiz_id and c.tutor_id = auth.uid()
    )
  );

create policy "Tutors read own class practice sessions" on practice_sessions
  for select using (
    is_tutor() and exists (
      select 1 from learners l
      join class_students cs on cs.student_id = l.profile_id
      join classes c on c.id = cs.class_id
      where l.id = practice_sessions.learner_id and c.tutor_id = auth.uid()
    )
  );

create policy "Tutors read own class practice answers" on practice_answers
  for select using (
    is_tutor() and exists (
      select 1 from learners l
      join class_students cs on cs.student_id = l.profile_id
      join classes c on c.id = cs.class_id
      where l.id = practice_answers.learner_id and c.tutor_id = auth.uid()
    )
  );

-- Murid anonim mengerjakan kuis lewat share code. Sama seperti sebelumnya:
-- kunci jawaban tidak diamankan lewat RLS melainkan lewat kolom yang dipilih
-- aplikasi, dan penilaian selalu di server.

create policy "Public reads published quizzes" on quizzes
  for select using (status = 'published');

create policy "Public reads questions of published quizzes" on questions
  for select using (
    exists (select 1 from quizzes q where q.id = questions.quiz_id and q.status = 'published')
  );

create policy "Public creates attempts on published quizzes" on attempts
  for insert with check (
    exists (select 1 from quizzes q where q.id = attempts.quiz_id and q.status = 'published')
  );

create policy "Public updates attempts on published quizzes" on attempts
  for update using (
    exists (select 1 from quizzes q where q.id = attempts.quiz_id and q.status = 'published')
  ) with check (
    exists (select 1 from quizzes q where q.id = attempts.quiz_id and q.status = 'published')
  );

create policy "Public reads attempts" on attempts for select using (true);

create policy "Public writes answers for published quizzes" on answers
  for insert with check (
    exists (
      select 1 from attempts a join quizzes q on q.id = a.quiz_id
      where a.id = answers.attempt_id and q.status = 'published'
    )
  );

create policy "Public updates answers for published quizzes" on answers
  for update using (
    exists (
      select 1 from attempts a join quizzes q on q.id = a.quiz_id
      where a.id = answers.attempt_id and q.status = 'published'
    )
  ) with check (
    exists (
      select 1 from attempts a join quizzes q on q.id = a.quiz_id
      where a.id = answers.attempt_id and q.status = 'published'
    )
  );

create policy "Public reads answers" on answers for select using (true);

-- Latihan mandiri: tulisan terbuka untuk anon dengan postur yang sama seperti
-- attempts di atas. Kode latihan bukan penghalang pemalsuan, dan catatan latihan
-- bukan nilai resmi. Pembacaan bank soal digerbangi fungsi di bawah.

create policy "Public creates practice sessions" on practice_sessions
  for insert with check (true);
create policy "Public reads practice sessions" on practice_sessions
  for select using (true);
create policy "Public finishes practice sessions" on practice_sessions
  for update using (finished_at is null) with check (true);
create policy "Public creates practice answers" on practice_answers
  for insert with check (true);
create policy "Public reads practice answers" on practice_answers
  for select using (true);

-- Jalur baca bergerbang untuk latihan mandiri ---------------------------------
-- `question_bank_items` tetap tertutup untuk anon. Latihan mandiri hanya
-- menyentuhnya lewat fungsi security definer di bawah, yang semuanya menuntut
-- kode akses. Sengaja tidak memakai view: view biasa melewati RLS dan akan
-- membuka seluruh bank soal ke anon sekaligus.

drop function if exists practice_login(text);
drop function if exists practice_subjects(text);
drop function if exists practice_topics(text, uuid);
drop function if exists practice_draw_questions(text, uuid[], integer);
drop function if exists practice_answer_key(text, uuid);
drop function if exists practice_summary(text, uuid);
drop function if exists quiz_roster(text);

create or replace function practice_login(p_access_code text)
returns table (learner_id uuid, learner_name text, is_tera_student boolean)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.name, l.profile_id is not null
  from learners l
  where l.access_code = p_access_code
    and coalesce(p_access_code, '') <> '';
$$;

-- Mapel yang benar-benar punya soal bertag. Berlaku sama untuk murid Tera
-- maupun murid luar, dan tidak pernah menampilkan menu kosong.
create or replace function practice_subjects(p_access_code text)
returns table (subject_id uuid, subject_name text, question_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, count(distinct t.question_bank_item_id)
  from subjects s
  join curriculum_topic_groups g on g.subject_id = s.id
  join question_curriculum_tags t on t.group_id = g.id
  where exists (
    select 1 from learners l
    where l.access_code = p_access_code and coalesce(p_access_code, '') <> ''
  )
  group by s.id, s.name
  having count(distinct t.question_bank_item_id) > 0
  order by s.name;
$$;

create or replace function practice_topics(p_access_code text, p_subject_id uuid)
returns table (
  group_id uuid,
  grade_level text,
  semester int,
  theme text,
  topic text,
  question_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.grade_level, g.semester, g.theme, g.topic,
         count(distinct t.question_bank_item_id)
  from curriculum_topic_groups g
  left join question_curriculum_tags t on t.group_id = g.id
  where g.subject_id = p_subject_id
    and exists (
      select 1 from learners l
      where l.access_code = p_access_code and coalesce(p_access_code, '') <> ''
    )
  group by g.id, g.grade_level, g.semester, g.theme, g.topic
  order by g.grade_level, g.semester, g.theme nulls first, g.topic;
$$;

-- Mengundi satu set soal, tanpa kunci jawaban. Daftar group kosong berarti
-- "semua topik di mapel ini".
--
-- Urutan prioritas: belum pernah dijawab -> pernah dijawab tapi belum pernah
-- benar -> sudah dikuasai; penyeimbang terakhir paling lama tidak dilihat, lalu
-- acak. Tidak ada soal yang dibuang dari undian, jadi topik yang bank soalnya
-- masih tipis tetap bisa mengisi sesi penuh.
create or replace function practice_draw_questions(
  p_access_code text,
  p_group_ids uuid[],
  p_limit integer
)
returns table (id uuid, type text, prompt text, options jsonb, weight numeric)
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
    select distinct b.id, b.type, b.prompt, b.options, b.weight
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
  select pool.id, pool.type, pool.prompt, pool.options, pool.weight
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

-- Kunci untuk satu soal yang sedang dikerjakan. `options` ikut karena matching,
-- ordering, dan statement_grid dinilai terhadap struktur soalnya sendiri, bukan
-- terhadap correct_answer saja. Penilaiannya sendiri tetap di TypeScript
-- (src/lib/grading.ts) supaya cuma ada satu implementasi.
create or replace function practice_answer_key(p_access_code text, p_item_id uuid)
returns table (type text, options jsonb, correct_answer jsonb, weight numeric, explanation text)
language sql
stable
security definer
set search_path = public
as $$
  select b.type, b.options, b.correct_answer, b.weight, b.explanation
  from question_bank_items b
  where b.id = p_item_id
    and coalesce(p_access_code, '') <> ''
    and exists (select 1 from learners l where l.access_code = p_access_code)
    and exists (select 1 from question_curriculum_tags t where t.question_bank_item_id = b.id);
$$;

-- Daftar nama untuk halaman kuis publik, supaya murid memilih namanya alih-alih
-- mengetik bebas. Digerbangi share code, dan hanya membuka nama murid di kelas
-- kuis itu — RLS `profiles` dan `class_students` milik Tera tidak perlu dilonggarkan
-- untuk anon. Murid yang belum punya baris `learners` tidak muncul di sini.
create or replace function quiz_roster(p_share_code text)
returns table (learner_id uuid, learner_name text)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.name
  from quizzes q
  join class_students cs on cs.class_id = q.class_id and cs.is_active
  join learners l on l.profile_id = cs.student_id
  where q.share_code = p_share_code
    and q.status = 'published'
    and coalesce(p_share_code, '') <> ''
  order by l.name;
$$;

-- Rincian skor per topik untuk satu sesi. Soal bertag dua topik dihitung di
-- keduanya — itu memang tujuannya: pertanyaannya "sejauh apa murid ini menguasai
-- topik itu", bukan "apakah angkanya berjumlah 100%".
create or replace function practice_summary(p_access_code text, p_session_id uuid)
returns table (
  group_id uuid,
  topic text,
  theme text,
  answered bigint,
  score numeric,
  max_score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.topic, g.theme, count(*),
         coalesce(sum(pa.score), 0), coalesce(sum(pa.max_score), 0)
  from practice_answers pa
  join practice_sessions ps on ps.id = pa.session_id
  join learners l on l.id = ps.learner_id
  join question_curriculum_tags t on t.question_bank_item_id = pa.question_bank_item_id
  join curriculum_topic_groups g on g.id = t.group_id
  where pa.session_id = p_session_id
    and l.access_code = p_access_code
    and coalesce(p_access_code, '') <> ''
  group by g.id, g.topic, g.theme
  order by g.theme nulls first, g.topic;
$$;

-- Live Monitoring butuh Realtime aktif pada dua tabel ini.
do $realtime$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'attempts'
  ) then
    alter publication supabase_realtime add table attempts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'answers'
  ) then
    alter publication supabase_realtime add table answers;
  end if;
end $realtime$;

-- Bucket penyimpanan untuk tipe soal upload_file.
insert into storage.buckets (id, name, public)
values ('quiz-uploads', 'quiz-uploads', true)
on conflict (id) do nothing;

drop policy if exists "anyone can upload quiz files" on storage.objects;
create policy "anyone can upload quiz files" on storage.objects
  for insert with check (bucket_id = 'quiz-uploads');

drop policy if exists "anyone can read quiz files" on storage.objects;
create policy "anyone can read quiz files" on storage.objects
  for select using (bucket_id = 'quiz-uploads');
