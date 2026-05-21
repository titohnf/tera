create table tutor_subjects (
  tutor_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  primary key (tutor_id, subject_id)
);

alter table tutor_subjects enable row level security;

create policy "Tutors manage own subject preferences" on tutor_subjects
  for all using (tutor_id = auth.uid());

create policy "Admins manage all tutor subject preferences" on tutor_subjects
  for all using (get_my_role() = 'admin');
