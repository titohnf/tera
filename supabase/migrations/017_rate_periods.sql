create table rate_periods (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  start_date date not null,
  end_date   date,
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

alter table rate_periods enable row level security;

create policy "Admins manage rate periods" on rate_periods
  for all using (is_admin());

-- Add period_id to session_rates
alter table session_rates add column period_id uuid references rate_periods(id) on delete cascade;

-- Create default period for existing rates
insert into rate_periods (name, start_date, is_active)
values ('Semester Genap 2025/2026', '2026-01-01', true)
returning id;

-- Link all existing rates to the new period
-- (run this after the insert above using the returned id)
-- We'll do this via a DO block:
do $$
declare
  pid uuid;
begin
  select id into pid from rate_periods order by created_at desc limit 1;
  update session_rates set period_id = pid where period_id is null;
end $$;

-- Now make period_id not null
alter table session_rates alter column period_id set not null;
