alter table classes
  add column if not exists jenis text check (jenis in ('reguler', 'fokus')),
  add column if not exists fokus_types text[] not null default '{}';
