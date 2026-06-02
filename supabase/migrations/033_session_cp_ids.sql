-- Store multiple selected CP (Capaian Pembelajaran) IDs per session
alter table sessions
  add column if not exists selected_cp_ids uuid[] not null default '{}';
