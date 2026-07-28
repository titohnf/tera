-- ============================================================
-- CURRICULUM RESOURCES (Materi & Bank Soal)
-- Link-only resources (teaching material / question bank) attached
-- to an existing curriculum topic. Identified by the same composite
-- key used by renameTopic/deleteTopic in lib/actions/admin/curriculum.ts
-- (curriculum, subject_id, grade_level, semester, theme, topic) rather
-- than a single curriculum_topics.id, since a "topic" is a group of
-- CP rows sharing that key, not one row.
-- ============================================================
create table curriculum_resources (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references subjects(id) on delete cascade,
  curriculum text not null,
  grade_level text not null,
  semester int not null,
  theme text not null,
  topic text not null,
  kind text not null check (kind in ('materi', 'bank_soal')),
  title text not null,
  link_url text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index curriculum_resources_lookup_idx
  on curriculum_resources(subject_id, curriculum, grade_level, semester, theme, topic);

alter table curriculum_resources enable row level security;

create policy "Admins manage curriculum resources"
  on curriculum_resources for all using (is_admin());
