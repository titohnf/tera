-- Add link_url to materials and make file_path nullable
alter table materials
  alter column file_path drop not null,
  add column link_url text;

-- Add link_url to assessments
alter table assessments
  add column link_url text;
