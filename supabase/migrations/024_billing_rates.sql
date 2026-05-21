create table billing_rate_periods (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date date not null,
  end_date date,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table billing_rates (
  id uuid primary key default uuid_generate_v4(),
  period_id uuid not null references billing_rate_periods(id) on delete cascade,
  class_type text not null check (class_type in ('group', 'private')),
  jenjang text not null,
  jenis text not null,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index billing_rates_period_idx on billing_rates(period_id);

-- Seed default period (Semester Genap 2025/2026)
insert into billing_rate_periods (name, start_date, end_date, is_active)
values ('Semester Genap 2025/2026', '2026-01-01', '2026-06-30', true);

-- Seed billing rates from the default period
with p as (select id from billing_rate_periods where name = 'Semester Genap 2025/2026')
insert into billing_rates (period_id, class_type, jenjang, jenis, amount)
select p.id, v.class_type, v.jenjang, v.jenis, v.amount
from p, (values
  -- Grup (per bulan)
  ('group', 'Calistung', 'Reguler', 380000),
  ('group', 'SD',        'Reguler', 480000),
  ('group', 'SD',        'Fokus',   499000),
  ('group', 'SMP',       'Reguler', 560000),
  ('group', 'SMP',       'Fokus',   599000),
  ('group', 'SMA',       'Reguler', 720000),
  ('group', 'SMA',       'Fokus',   799000),
  -- Privat (per pertemuan)
  ('private', 'Calistung', 'Reguler',  80000),
  ('private', 'SD',        'Reguler',  80000),
  ('private', 'SD',        'Fokus',    80000),
  ('private', 'SMP',       'Reguler', 100000),
  ('private', 'SMP',       'Fokus',   100000),
  ('private', 'SMA',       'Reguler', 120000),
  ('private', 'SMA',       'Fokus',   120000)
) as v(class_type, jenjang, jenis, amount);
