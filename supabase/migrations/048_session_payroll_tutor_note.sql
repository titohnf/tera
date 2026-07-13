-- ============================================================
-- SESSION PAYROLL RE-REVIEW NOTE
-- Lets a tutor explain what was fixed when asking an admin to
-- re-review a rejected session's payroll compliance.
-- ============================================================
alter table sessions add column payroll_tutor_note text;
