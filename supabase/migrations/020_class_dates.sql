alter table classes
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists duration_minutes smallint not null default 90;
