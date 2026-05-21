create table session_rates (
  id         uuid primary key default uuid_generate_v4(),
  class_type text not null check (class_type in ('group', 'private')),
  jenjang    text not null,
  jenis      text not null,
  rate_per_session numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table session_rates enable row level security;

create policy "Admins manage session rates" on session_rates
  for all using (is_admin());

-- Seed: Kelas Grup
insert into session_rates (class_type, jenjang, jenis, rate_per_session) values
  ('group', 'Calistung',   'Reguler',      60000),
  ('group', 'SD',          'Reguler',      70000),
  ('group', 'SMP',         'Reguler',      80000),
  ('group', 'SMA',         'Reguler',      90000),
  ('group', 'SD',          'TKA/US',       80000),
  ('group', 'SMP',         'TKA/US',       90000),
  ('group', 'SMA TKA+US',  'TKA/US/UTBK', 100000),
  ('group', 'SMA',         'UTBK',         100000);

-- Seed: Kelas Privat
insert into session_rates (class_type, jenjang, jenis, rate_per_session) values
  ('private', 'Calistung', 'Reguler', 60000),
  ('private', 'SD',        'Reguler', 60000),
  ('private', 'SMP',       'Reguler', 80000),
  ('private', 'SMA',       'Reguler', 100000),
  ('private', 'SD',        'TKA/US',  60000),
  ('private', 'SMP',       'TKA/US',  80000),
  ('private', 'SMA',       'TKA/US',  100000),
  ('private', 'SMA',       'UTBK',    100000);
