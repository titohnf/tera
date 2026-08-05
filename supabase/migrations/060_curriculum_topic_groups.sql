-- ============================================================
-- CURRICULUM TOPIC GROUPS — stable identity for a curriculum topic
--
-- `curriculum_topics` is a flat table: a "topic" is not one row but the GROUP
-- of rows sharing (curriculum, subject_id, grade_level, semester, theme, topic),
-- where a row with topic = null is a theme and a row with learning_outcomes is
-- a CP. That works for display, but it leaves a topic with no stable id, so
-- anything wanting to point AT a topic has to copy six string columns and hope
-- they never change. `curriculum_resources` does exactly that today.
--
-- It does not hold: renameTopic/deleteTopic in lib/actions/admin/curriculum.ts
-- only touch `curriculum_topics`, so renaming a topic silently detaches its
-- materi/bank soal links and deleting one leaves resource rows dangling.
--
-- This migration gives every topic a real id, points both `curriculum_topics`
-- and `curriculum_resources` at it, and lets the database do the cascading.
-- The denormalized string columns stay exactly where they are — every existing
-- query keeps working untouched — and a trigger keeps them in step with the
-- group they belong to.
-- ============================================================

create table curriculum_topic_groups (
  id uuid primary key default uuid_generate_v4(),
  curriculum text not null,
  subject_id uuid not null references subjects(id) on delete cascade,
  grade_level text not null,
  semester int not null check (semester in (1, 2)),
  theme text,
  topic text not null,
  created_at timestamptz not null default now()
);

-- Expression index rather than a plain unique constraint: `theme` is nullable,
-- and a unique constraint would treat every NULL theme as distinct, allowing
-- duplicate groups for themeless topics.
create unique index curriculum_topic_groups_key_idx
  on curriculum_topic_groups (
    curriculum, subject_id, grade_level, semester, coalesce(theme, ''), topic
  );

create index curriculum_topic_groups_subject_idx
  on curriculum_topic_groups (subject_id, grade_level, semester);

-- Backfill ---------------------------------------------------------------
-- Built from both tables, not just curriculum_topics: a resource whose topic
-- was renamed away is already orphaned today, and reading only the topics table
-- would silently drop it here too. Such a group ends up with no CP rows, which
-- is visible and fixable, rather than a link that quietly vanishes.

insert into curriculum_topic_groups (curriculum, subject_id, grade_level, semester, theme, topic)
select distinct curriculum, subject_id, grade_level, semester, theme, topic
from curriculum_topics
where topic is not null
union
select distinct curriculum, subject_id, grade_level, semester, theme, topic
from curriculum_resources
on conflict do nothing;

alter table curriculum_topics
  add column if not exists group_id uuid references curriculum_topic_groups(id) on delete cascade;

alter table curriculum_resources
  add column if not exists group_id uuid references curriculum_topic_groups(id) on delete cascade;

update curriculum_topics ct
set group_id = g.id
from curriculum_topic_groups g
where ct.topic is not null
  and g.curriculum = ct.curriculum
  and g.subject_id = ct.subject_id
  and g.grade_level = ct.grade_level
  and g.semester = ct.semester
  and coalesce(g.theme, '') = coalesce(ct.theme, '')
  and g.topic = ct.topic;

update curriculum_resources cr
set group_id = g.id
from curriculum_topic_groups g
where g.curriculum = cr.curriculum
  and g.subject_id = cr.subject_id
  and g.grade_level = cr.grade_level
  and g.semester = cr.semester
  and coalesce(g.theme, '') = coalesce(cr.theme, '')
  and g.topic = cr.topic;

create index if not exists curriculum_topics_group_id_idx on curriculum_topics(group_id);
create index if not exists curriculum_resources_group_id_idx on curriculum_resources(group_id);

-- Keeping the denormalized columns honest -------------------------------
-- Renaming a topic or theme now means updating the group; this trigger pushes
-- that down into the rows that carry the copies. Guarded on an actual change so
-- an unrelated update does not rewrite half the table.

create or replace function sync_curriculum_topic_group()
returns trigger
language plpgsql
as $$
begin
  if new.topic is distinct from old.topic
     or new.theme is distinct from old.theme
     or new.grade_level is distinct from old.grade_level
     or new.semester is distinct from old.semester
     or new.curriculum is distinct from old.curriculum then

    update curriculum_topics
    set curriculum = new.curriculum, grade_level = new.grade_level,
        semester = new.semester, theme = new.theme, topic = new.topic
    where group_id = new.id;

    update curriculum_resources
    set curriculum = new.curriculum, grade_level = new.grade_level,
        semester = new.semester, theme = new.theme, topic = new.topic
    where group_id = new.id;
  end if;

  return new;
end $$;

create trigger sync_curriculum_topic_group_after_update
  after update on curriculum_topic_groups
  for each row execute function sync_curriculum_topic_group();

-- Helper used by the admin actions: find or create the group for a topic, so
-- adding a topic and tagging a question both land on the same row.
create or replace function curriculum_group_id(
  p_curriculum text,
  p_subject_id uuid,
  p_grade_level text,
  p_semester int,
  p_theme text,
  p_topic text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from curriculum_topic_groups
  where curriculum = p_curriculum
    and subject_id = p_subject_id
    and grade_level = p_grade_level
    and semester = p_semester
    and coalesce(theme, '') = coalesce(p_theme, '')
    and topic = p_topic;

  if v_id is null then
    insert into curriculum_topic_groups
      (curriculum, subject_id, grade_level, semester, theme, topic)
    values (p_curriculum, p_subject_id, p_grade_level, p_semester, p_theme, p_topic)
    returning id into v_id;
  end if;

  -- Adopt any row that carries this topic's key but no group yet, so a rename
  -- or delete acting on the group reaches every row it should. Without this a
  -- freshly created group would own nothing and both would quietly no-op.
  update curriculum_topics
  set group_id = v_id
  where group_id is null
    and topic = p_topic
    and curriculum = p_curriculum and subject_id = p_subject_id
    and grade_level = p_grade_level and semester = p_semester
    and coalesce(theme, '') = coalesce(p_theme, '');

  update curriculum_resources
  set group_id = v_id
  where group_id is null
    and topic = p_topic
    and curriculum = p_curriculum and subject_id = p_subject_id
    and grade_level = p_grade_level and semester = p_semester
    and coalesce(theme, '') = coalesce(p_theme, '');

  return v_id;
end $$;

alter table curriculum_topic_groups enable row level security;

create policy "Admins manage curriculum topic groups"
  on curriculum_topic_groups for all using (is_admin());

-- Tutors read topics to see what a session covers; groups carry no more
-- information than the columns they already read.
create policy "Tutors read curriculum topic groups"
  on curriculum_topic_groups for select using (is_tutor());
