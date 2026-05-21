create table invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null,
  class_id uuid references classes(id) on delete set null,
  student_id uuid references profiles(id) on delete set null,
  student_name text not null,
  parent_name text not null,
  line_items jsonb not null default '[]',
  total_due numeric(12,2) not null default 0,
  payment_method text not null default 'Transfer Bank',
  bank_account text not null default 'BSI - 7296753275 a.n. Suci Purnama Sari',
  due_date date,
  issued_at date not null default current_date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invoices_student_id_idx on invoices(student_id);
create index invoices_status_idx on invoices(status);
create index invoices_issued_at_idx on invoices(issued_at);
