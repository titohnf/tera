-- Enable Row Level Security on all tables
alter table profiles enable row level security;
alter table subjects enable row level security;
alter table classes enable row level security;
alter table class_students enable row level security;
alter table sessions enable row level security;
alter table attendances enable row level security;
alter table materials enable row level security;
alter table assessments enable row level security;
alter table assessment_results enable row level security;
alter table performance_note_templates enable row level security;
alter table performance_notes enable row level security;
alter table salary_schemes enable row level security;
alter table session_payments enable row level security;
alter table notification_logs enable row level security;

-- Helper: check if user is admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Helper: check if user is tutor
create or replace function is_tutor()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'tutor'
  );
$$ language sql security definer stable;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "Users can view their own profile"
  on profiles for select using (id = auth.uid());

create policy "Tutors can view students in their classes"
  on profiles for select using (
    exists (
      select 1 from class_students cs
      join classes c on c.id = cs.class_id
      where cs.student_id = profiles.id
        and c.tutor_id = auth.uid()
        and cs.is_active = true
    )
  );

create policy "Admin can view all profiles"
  on profiles for select using (is_admin());

create policy "Users can update their own profile"
  on profiles for update using (id = auth.uid());

-- ============================================================
-- SUBJECTS
-- ============================================================
create policy "Authenticated users can view subjects"
  on subjects for select using (auth.role() = 'authenticated');

create policy "Admin can manage subjects"
  on subjects for all using (is_admin());

-- ============================================================
-- CLASSES
-- ============================================================
create policy "Tutor can view their own classes"
  on classes for select using (tutor_id = auth.uid());

create policy "Students can view enrolled classes"
  on classes for select using (
    exists (
      select 1 from class_students cs
      where cs.class_id = classes.id
        and cs.student_id = auth.uid()
        and cs.is_active = true
    )
  );

create policy "Admin can manage all classes"
  on classes for all using (is_admin());

-- ============================================================
-- CLASS STUDENTS
-- ============================================================
create policy "Tutor can view students in their classes"
  on class_students for select using (
    exists (
      select 1 from classes c
      where c.id = class_students.class_id and c.tutor_id = auth.uid()
    )
  );

create policy "Students can view their own enrollments"
  on class_students for select using (student_id = auth.uid());

create policy "Admin can manage class students"
  on class_students for all using (is_admin());

-- ============================================================
-- SESSIONS
-- ============================================================
create policy "Tutor can view their own sessions"
  on sessions for select using (tutor_id = auth.uid());

create policy "Tutor can update their own sessions"
  on sessions for update using (tutor_id = auth.uid());

create policy "Students can view sessions of enrolled classes"
  on sessions for select using (
    exists (
      select 1 from class_students cs
      where cs.class_id = sessions.class_id
        and cs.student_id = auth.uid()
        and cs.is_active = true
    )
  );

create policy "Admin can manage all sessions"
  on sessions for all using (is_admin());

-- ============================================================
-- ATTENDANCES
-- ============================================================
create policy "Tutor can manage attendance for their sessions"
  on attendances for all using (
    exists (
      select 1 from sessions s
      where s.id = attendances.session_id and s.tutor_id = auth.uid()
    )
  );

create policy "Students can view their own attendance"
  on attendances for select using (student_id = auth.uid());

create policy "Parents can view their child's attendance"
  on attendances for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'parent'
      -- parent-student link would be added in a future migration
    )
  );

create policy "Admin can manage all attendances"
  on attendances for all using (is_admin());

-- ============================================================
-- MATERIALS
-- ============================================================
create policy "Tutor can manage materials for their sessions"
  on materials for all using (
    exists (
      select 1 from sessions s
      where s.id = materials.session_id and s.tutor_id = auth.uid()
    )
  );

create policy "Students can view materials of enrolled sessions"
  on materials for select using (
    exists (
      select 1 from sessions s
      join class_students cs on cs.class_id = s.class_id
      where s.id = materials.session_id
        and cs.student_id = auth.uid()
        and cs.is_active = true
    )
  );

create policy "Admin can manage all materials"
  on materials for all using (is_admin());

-- ============================================================
-- ASSESSMENTS
-- ============================================================
create policy "Tutor can manage assessments for their sessions"
  on assessments for all using (
    exists (
      select 1 from sessions s
      where s.id = assessments.session_id and s.tutor_id = auth.uid()
    )
  );

create policy "Students can view assessments of enrolled sessions"
  on assessments for select using (
    exists (
      select 1 from sessions s
      join class_students cs on cs.class_id = s.class_id
      where s.id = assessments.session_id
        and cs.student_id = auth.uid()
        and cs.is_active = true
    )
  );

create policy "Admin can manage all assessments"
  on assessments for all using (is_admin());

-- ============================================================
-- ASSESSMENT RESULTS
-- ============================================================
create policy "Tutor can manage results for their assessments"
  on assessment_results for all using (
    exists (
      select 1 from assessments a
      join sessions s on s.id = a.session_id
      where a.id = assessment_results.assessment_id and s.tutor_id = auth.uid()
    )
  );

create policy "Students can view their own results"
  on assessment_results for select using (student_id = auth.uid());

create policy "Admin can manage all assessment results"
  on assessment_results for all using (is_admin());

-- ============================================================
-- PERFORMANCE NOTE TEMPLATES
-- ============================================================
create policy "Authenticated users can view active templates"
  on performance_note_templates for select using (
    auth.role() = 'authenticated' and is_active = true
  );

create policy "Tutors can manage their own templates"
  on performance_note_templates for all using (
    created_by = auth.uid() and is_tutor()
  );

create policy "Admin can manage all templates"
  on performance_note_templates for all using (is_admin());

-- ============================================================
-- PERFORMANCE NOTES
-- ============================================================
create policy "Tutor can manage their own notes"
  on performance_notes for all using (tutor_id = auth.uid());

create policy "Students can view their own notes"
  on performance_notes for select using (student_id = auth.uid());

create policy "Admin can manage all performance notes"
  on performance_notes for all using (is_admin());

-- ============================================================
-- SALARY SCHEMES
-- ============================================================
create policy "Tutor can view their own salary schemes"
  on salary_schemes for select using (tutor_id = auth.uid());

create policy "Admin can manage all salary schemes"
  on salary_schemes for all using (is_admin());

-- ============================================================
-- SESSION PAYMENTS
-- ============================================================
create policy "Tutor can view their own payments"
  on session_payments for select using (tutor_id = auth.uid());

create policy "Admin can manage all payments"
  on session_payments for all using (is_admin());

-- ============================================================
-- NOTIFICATION LOGS
-- ============================================================
create policy "Users can view their own notification logs"
  on notification_logs for select using (recipient_id = auth.uid());

create policy "Admin can manage notification logs"
  on notification_logs for all using (is_admin());
