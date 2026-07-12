-- ============================================================
-- Lets the proposed replacement tutor dismiss a rejection notice
-- (separate from acknowledged_at, which the requesting tutor uses).
-- ============================================================
alter table session_change_requests
  add column if not exists new_tutor_acknowledged_at timestamptz;
