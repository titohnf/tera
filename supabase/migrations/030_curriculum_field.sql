alter table curriculum_topics
  add column if not exists curriculum text not null default 'Kurikulum Merdeka';

create index if not exists curriculum_topics_curriculum_idx on curriculum_topics(curriculum);
