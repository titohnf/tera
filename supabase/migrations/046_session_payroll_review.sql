-- ============================================================
-- SESSION PAYROLL REVIEW
-- Admin approval gate on top of session completion: a completed
-- session only counts toward a tutor's payslip once an admin
-- approves it. Rejected sessions are kicked back to the tutor.
-- ============================================================
alter table sessions
  add column payroll_status text not null default 'pending' check (payroll_status in ('pending', 'approved', 'rejected')),
  add column payroll_reviewed_by uuid references profiles(id) on delete set null,
  add column payroll_reviewed_at timestamptz,
  add column payroll_rejection_reason text;

create index sessions_payroll_status_idx on sessions(payroll_status);
