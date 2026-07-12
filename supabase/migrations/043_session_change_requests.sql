-- ============================================================
-- SESSION CHANGE REQUESTS
-- Tutor-initiated requests to cancel, reschedule, or hand off a
-- session, subject to admin approval.
-- ============================================================
create table session_change_requests (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  requested_by uuid not null references profiles(id) on delete cascade,
  request_type text not null check (request_type in ('cancel', 'reschedule', 'change_tutor')),
  reason text not null,
  new_scheduled_at timestamptz,
  new_tutor_id uuid references profiles(id) on delete set null,
  new_tutor_confirmed boolean, -- null = not yet responded; only relevant for request_type = 'change_tutor'
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text,
  acknowledged_at timestamptz, -- when the requesting tutor dismissed the resolved notice
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index session_change_requests_session_id_idx on session_change_requests(session_id);
create index session_change_requests_status_idx on session_change_requests(status);

create trigger set_session_change_requests_updated_at before update on session_change_requests
  for each row execute function set_updated_at();

alter table session_change_requests enable row level security;

create policy "Tutor can view their own change requests"
  on session_change_requests for select using (requested_by = auth.uid());

create policy "Tutor can create change requests for their own sessions"
  on session_change_requests for insert with check (
    requested_by = auth.uid()
    and exists (
      select 1 from sessions s
      where s.id = session_id and s.tutor_id = auth.uid()
    )
  );

create policy "Tutor can withdraw their own pending change requests"
  on session_change_requests for delete using (
    requested_by = auth.uid() and status = 'pending'
  );

create policy "Tutor can acknowledge resolved requests they made"
  on session_change_requests for update using (requested_by = auth.uid());

create policy "Proposed tutor can view swap requests naming them"
  on session_change_requests for select using (new_tutor_id = auth.uid());

create policy "Proposed tutor can respond to swap requests naming them"
  on session_change_requests for update using (new_tutor_id = auth.uid());

create policy "Admin can manage all session change requests"
  on session_change_requests for all using (is_admin());
