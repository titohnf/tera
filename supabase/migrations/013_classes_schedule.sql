alter table classes
  add column if not exists schedule_days smallint[] not null default '{}',
  add column if not exists schedule_time time;
