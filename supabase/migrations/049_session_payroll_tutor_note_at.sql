-- ============================================================
-- SESSION PAYROLL TUTOR NOTE TIMESTAMP
-- Records when a tutor submitted a re-review note, so admins can
-- see when it was written alongside the note itself.
-- ============================================================
alter table sessions add column payroll_tutor_note_at timestamptz;
