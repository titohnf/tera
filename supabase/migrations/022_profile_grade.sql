alter table profiles
  add column if not exists grade smallint check (grade between 1 and 12);
