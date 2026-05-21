-- Convert level from text to text[] to support multiple jenjang
alter table subjects
  alter column level type text[]
  using case when level is null then null else array[level] end;
