-- Separate payments table; invoice line_items stay immutable after sent

create table invoice_payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index invoice_payments_invoice_id_idx on invoice_payments(invoice_id);

-- Migrate existing deduction rows into invoice_payments (preserve old payment data)
insert into invoice_payments (invoice_id, amount, paid_at, created_at)
select
  id as invoice_id,
  (item->>'amount')::numeric as amount,
  now() as paid_at,
  now() as created_at
from invoices,
lateral jsonb_array_elements(line_items) as item
where (item->>'is_deduction')::boolean = true;

-- Remove deduction rows from line_items and restore total_due to original amount
update invoices
set
  line_items = (
    select coalesce(jsonb_agg(item), '[]'::jsonb)
    from jsonb_array_elements(line_items) as item
    where not (item->>'is_deduction')::boolean
  ),
  total_due = (
    select coalesce(sum(
      case when (item->>'months')::int = 0 then (item->>'amount')::numeric
      else (item->>'months')::int * (item->>'amount')::numeric
      end
    ), 0)
    from jsonb_array_elements(line_items) as item
    where not (item->>'is_deduction')::boolean
  )
where line_items @> '[{"is_deduction": true}]'::jsonb;

-- Fix status: partially_paid stays, but recalculate based on actual coverage
update invoices i
set status = case
  when (
    select coalesce(sum(p.amount), 0)
    from invoice_payments p
    where p.invoice_id = i.id
  ) <= 0 then 'sent'
  when (
    select coalesce(sum(p.amount), 0)
    from invoice_payments p
    where p.invoice_id = i.id
  ) >= i.total_due then 'paid'
  else 'partially_paid'
end
where status in ('partially_paid', 'sent');
