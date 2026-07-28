-- Let tutors request a subject (mapel) change for private-class sessions,
-- subject to admin approval, using the same session_change_requests flow.
alter table session_change_requests
  drop constraint session_change_requests_request_type_check;

alter table session_change_requests
  add constraint session_change_requests_request_type_check
  check (request_type in ('cancel', 'reschedule', 'change_tutor', 'change_subject'));

alter table session_change_requests
  add column new_subject_id uuid references subjects(id) on delete set null;
