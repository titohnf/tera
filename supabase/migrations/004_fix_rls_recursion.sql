-- Fix: infinite recursion in RLS policies
--
-- Root cause: is_admin() queries profiles → profiles policy queries class_students
-- → class_students policy calls is_admin() → queries profiles → infinite loop
--
-- Fix: add a helper function with `set row_security = off` so it bypasses RLS
-- when querying profiles, breaking the recursive cycle.

create or replace function get_my_role()
returns text
language sql
security definer
set row_security = off
stable
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean as $$
  select get_my_role() = 'admin';
$$ language sql security definer stable;

create or replace function is_tutor()
returns boolean as $$
  select get_my_role() = 'tutor';
$$ language sql security definer stable;
