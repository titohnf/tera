-- Curriculum topics table
create table curriculum_topics (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references subjects(id) on delete cascade,
  grade_level text not null,       -- e.g. 'Kelas 10', 'Kelas 7', 'Kelas 4'
  semester int not null check (semester in (1, 2)),
  theme text,                      -- Tema
  topic text not null,             -- Topik
  learning_outcomes text,          -- Capaian Pembelajaran
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index curriculum_topics_subject_id_idx on curriculum_topics(subject_id);
create index curriculum_topics_grade_level_idx on curriculum_topics(grade_level);

create trigger set_curriculum_topics_updated_at before update on curriculum_topics
  for each row execute function set_updated_at();

-- Link sessions to curriculum topics
alter table sessions add column if not exists curriculum_topic_id uuid references curriculum_topics(id) on delete set null;
