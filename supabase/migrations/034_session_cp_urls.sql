-- Store bank soal URLs keyed by curriculum_topic_id (CP)
alter table sessions
  add column if not exists cp_urls jsonb not null default '{}';
