alter table classes
  drop constraint if exists classes_class_type_check;
alter table classes
  add constraint classes_class_type_check check (class_type in ('group', 'private', 'yayasan'));

alter table session_rates
  drop constraint if exists session_rates_class_type_check;
alter table session_rates
  add constraint session_rates_class_type_check check (class_type in ('group', 'private', 'yayasan'));
