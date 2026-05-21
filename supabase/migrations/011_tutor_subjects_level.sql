-- Recreate tutor_subjects with level column so each subject+level combo is independent
drop table if exists tutor_subjects;

create table tutor_subjects (
  tutor_id   uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  level      text not null default '',
  primary key (tutor_id, subject_id, level)
);

alter table tutor_subjects enable row level security;

create policy "Tutors manage own subject preferences" on tutor_subjects
  for all using (tutor_id = auth.uid());

create policy "Admins manage all tutor subject preferences" on tutor_subjects
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
