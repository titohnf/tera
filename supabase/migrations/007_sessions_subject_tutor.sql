-- Add subject_id to sessions (replaces topic in UI, topic column kept for backward compat)
alter table sessions add column if not exists subject_id uuid references subjects(id) on delete set null;
