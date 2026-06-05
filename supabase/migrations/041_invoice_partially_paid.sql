-- Add partially_paid status and clean up draft invoices

-- Drop old constraint
alter table invoices drop constraint invoices_status_check;

-- Add new constraint with partially_paid
alter table invoices add constraint invoices_status_check
  check (status in ('draft', 'sent', 'partially_paid', 'paid'));

-- Delete all draft invoices (not yet sent to parents)
delete from invoices where status = 'draft';
