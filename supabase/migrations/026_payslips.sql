create table payslips (
  id uuid primary key default uuid_generate_v4(),
  payslip_number text not null,
  tutor_id uuid not null references profiles(id) on delete restrict,
  tutor_name text not null,
  month text not null,           -- YYYY-MM, bulan kerja (misal 2025-05 untuk gaji Mei)
  pay_date date not null,        -- tanggal gajian, biasanya tgl 1 bulan berikutnya
  total_sessions int not null default 0,
  base_total numeric(12,2) not null default 0,
  bonus_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  line_items jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  notes text,
  sent_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tutor_id, month)
);

create index payslips_tutor_id_idx on payslips(tutor_id);
create index payslips_month_idx on payslips(month);
create index payslips_status_idx on payslips(status);

-- RLS: admin bisa semua, tutor hanya bisa read milik sendiri
alter table payslips enable row level security;

create policy "Admin full access on payslips"
  on payslips for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Tutor read own payslips"
  on payslips for select
  using (
    tutor_id = auth.uid()
    and status in ('sent', 'paid')
  );
