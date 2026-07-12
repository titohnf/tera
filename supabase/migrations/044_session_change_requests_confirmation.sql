-- ============================================================
-- Follow-up to 043: session_change_requests was applied before the
-- new_tutor_confirmed / acknowledged_at columns were added.
-- ============================================================
alter table session_change_requests
  add column if not exists new_tutor_confirmed boolean, -- null = not yet responded; only relevant for request_type = 'change_tutor'
  add column if not exists acknowledged_at timestamptz; -- when the requesting tutor dismissed the resolved notice

drop policy if exists "Tutor can acknowledge resolved requests they made" on session_change_requests;
create policy "Tutor can acknowledge resolved requests they made"
  on session_change_requests for update using (requested_by = auth.uid());

drop policy if exists "Proposed tutor can view swap requests naming them" on session_change_requests;
create policy "Proposed tutor can view swap requests naming them"
  on session_change_requests for select using (new_tutor_id = auth.uid());

drop policy if exists "Proposed tutor can respond to swap requests naming them" on session_change_requests;
create policy "Proposed tutor can respond to swap requests naming them"
  on session_change_requests for update using (new_tutor_id = auth.uid());
