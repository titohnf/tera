create table tutor_availability (
  tutor_id    uuid not null references profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  primary key (tutor_id, day_of_week)
);

alter table tutor_availability enable row level security;

create policy "Tutors manage own availability" on tutor_availability
  for all using (tutor_id = auth.uid());

create policy "Admins view all availability" on tutor_availability
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
