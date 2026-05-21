alter table subjects
  add column if not exists curriculum text[] default '{}';

update subjects
  set curriculum = array['Kurikulum Merdeka']
  where curriculum = '{}' or curriculum is null;
