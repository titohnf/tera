alter table payslips
  add column if not exists is_deleted boolean not null default false;

create index payslips_is_deleted_idx on payslips(is_deleted) where not is_deleted;
