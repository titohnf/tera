alter table classes
  add column if not exists class_type text check (class_type in ('group', 'private'));
