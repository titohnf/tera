alter table classes
  add column if not exists semester int check (semester in (1, 2)),
  add column if not exists academic_year text;
