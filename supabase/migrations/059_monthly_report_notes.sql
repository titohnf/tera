-- ============================================================
-- MONTHLY REPORT NOTES (Laporan Bulanan)
-- Free-text fields the admin fills in directly on the monthly
-- learning report per student per month — separate from tutor
-- performance_notes (which are per-session and category-driven).
-- One row per (student_id, month), upserted from the admin UI.
-- ============================================================
create table monthly_report_notes (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  month text not null,
  mastered text,
  needs_practice text,
  other_notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, month)
);

alter table monthly_report_notes enable row level security;

create policy "Admins manage monthly report notes"
  on monthly_report_notes for all using (is_admin());
