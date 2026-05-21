alter table curriculum_topics
  alter column topic drop not null,
  alter column topic set default null;
