-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
create table announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  target_roles text[], -- null = all roles, or array of role names e.g. {'tutor','student'}
  created_by uuid references profiles(id) on delete set null,
  is_active boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- RLS
alter table announcements enable row level security;

-- Admins can do everything
create policy "admins_all_announcements" on announcements
  for all using (get_my_role() = 'admin');

-- Others can read active announcements targeted to their role or all
create policy "users_read_announcements" on announcements
  for select using (
    is_active = true
    and (
      target_roles is null
      or get_my_role()::text = any(target_roles)
    )
  );
