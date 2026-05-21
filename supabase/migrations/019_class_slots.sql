create table class_slots (
  id          uuid primary key default uuid_generate_v4(),
  class_id    uuid not null references classes(id) on delete cascade,
  slot_index  smallint not null,
  day_of_week smallint check (day_of_week between 0 and 6),
  start_time  time,
  tutor_id    uuid references profiles(id) on delete set null,
  subject_ids uuid[] not null default '{}',
  unique (class_id, slot_index)
);

alter table class_slots enable row level security;

create policy "Admins manage class slots" on class_slots
  for all using (is_admin());

create policy "Tutors view their class slots" on class_slots
  for select using (tutor_id = auth.uid());
