-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Role enum
create type user_role as enum ('admin', 'tutor', 'student', 'parent');

-- Session status enum
create type session_status as enum ('scheduled', 'ongoing', 'completed', 'cancelled');

-- Attendance status enum
create type attendance_status as enum ('present', 'late', 'absent', 'excused');

-- Payment status enum
create type payment_status as enum ('pending', 'paid', 'cancelled');

-- Bonus type enum
create type bonus_type as enum ('student_count', 'none');

-- ============================================================
-- PROFILES
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role user_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SUBJECTS
-- ============================================================
create table subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CLASSES
-- ============================================================
create table classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject_id uuid references subjects(id) on delete set null,
  tutor_id uuid not null references profiles(id) on delete restrict,
  base_price_per_session numeric(12,2) not null default 0,
  level text, -- e.g. SMA, SMP, SD
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CLASS STUDENTS
-- ============================================================
create table class_students (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  is_active boolean not null default true,
  unique (class_id, student_id)
);

-- ============================================================
-- SESSIONS
-- ============================================================
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references classes(id) on delete cascade,
  tutor_id uuid not null references profiles(id) on delete restrict, -- denormalized for RLS
  scheduled_at timestamptz not null,
  duration_minutes int not null default 90,
  location text,
  status session_status not null default 'scheduled',
  topic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sessions_tutor_id_idx on sessions(tutor_id);
create index sessions_scheduled_at_idx on sessions(scheduled_at);
create index sessions_status_idx on sessions(status);

-- ============================================================
-- ATTENDANCES
-- ============================================================
create table attendances (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  status attendance_status not null default 'absent',
  marked_by uuid references profiles(id) on delete set null,
  marked_at timestamptz not null default now(),
  notes text,
  unique (session_id, student_id)
);

create index attendances_session_id_idx on attendances(session_id);

-- ============================================================
-- MATERIALS
-- ============================================================
create table materials (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  uploaded_by uuid not null references profiles(id) on delete restrict,
  title text not null,
  file_path text not null, -- Supabase Storage path
  file_size_bytes bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

create index materials_session_id_idx on materials(session_id);

-- ============================================================
-- ASSESSMENTS
-- ============================================================
create table assessments (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  created_by uuid not null references profiles(id) on delete restrict,
  title text not null,
  description text,
  max_score numeric(6,2) not null default 100,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table assessment_results (
  id uuid primary key default uuid_generate_v4(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  score numeric(6,2),
  feedback text,
  graded_by uuid references profiles(id) on delete set null,
  graded_at timestamptz,
  unique (assessment_id, student_id)
);

-- ============================================================
-- PERFORMANCE NOTE TEMPLATES
-- ============================================================
create table performance_note_templates (
  id uuid primary key default uuid_generate_v4(),
  created_by uuid references profiles(id) on delete set null, -- null = system template
  category text not null, -- Attitude, Progress, Recommendation
  label text not null,
  body text not null, -- supports {{student_name}} placeholder
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PERFORMANCE NOTES
-- ============================================================
create table performance_notes (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  tutor_id uuid not null references profiles(id) on delete restrict,
  template_id uuid references performance_note_templates(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);

-- ============================================================
-- SALARY SCHEMES
-- ============================================================
create table salary_schemes (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references classes(id) on delete cascade,
  tutor_id uuid not null references profiles(id) on delete cascade,
  base_amount numeric(12,2) not null default 0,
  bonus_type bonus_type not null default 'none',
  bonus_threshold numeric(6,2), -- jumlah siswa hadir untuk dapat bonus
  bonus_amount numeric(12,2) not null default 0,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  unique (class_id, tutor_id)
);

-- ============================================================
-- SESSION PAYMENTS
-- ============================================================
create table session_payments (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  tutor_id uuid not null references profiles(id) on delete restrict,
  base_amount numeric(12,2) not null default 0,
  bonus_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) generated always as (base_amount + bonus_amount) stored,
  status payment_status not null default 'pending',
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, tutor_id)
);

create index session_payments_tutor_id_idx on session_payments(tutor_id);
create index session_payments_status_idx on session_payments(status);

-- ============================================================
-- NOTIFICATION LOGS
-- ============================================================
create table notification_logs (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  type text not null check (type in ('reminder_1d', 'reminder_1h', 'custom')),
  channel text not null check (channel in ('push', 'email')),
  sent_at timestamptz not null default now(),
  status text not null check (status in ('sent', 'failed')),
  unique (recipient_id, session_id, type, channel)
);

-- ============================================================
-- AUTO-UPDATE updated_at trigger
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger set_classes_updated_at before update on classes
  for each row execute function set_updated_at();
create trigger set_sessions_updated_at before update on sessions
  for each row execute function set_updated_at();
create trigger set_performance_notes_updated_at before update on performance_notes
  for each row execute function set_updated_at();
create trigger set_session_payments_updated_at before update on session_payments
  for each row execute function set_updated_at();

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
