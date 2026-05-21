create table class_subjects (
  class_id   uuid not null references classes(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  primary key (class_id, subject_id)
);

alter table class_subjects enable row level security;

create policy "Admins manage class subjects" on class_subjects
  for all using (is_admin());

create policy "Tutors view their class subjects" on class_subjects
  for select using (
    exists (select 1 from classes where id = class_id and tutor_id = auth.uid())
  );

create policy "Students view enrolled class subjects" on class_subjects
  for select using (
    exists (
      select 1 from class_students
      where class_id = class_subjects.class_id
        and student_id = auth.uid()
        and is_active = true
    )
  );

-- Migrate existing single subject_id data
insert into class_subjects (class_id, subject_id)
select id, subject_id from classes where subject_id is not null
on conflict do nothing;

alter table classes drop column if exists subject_id;
