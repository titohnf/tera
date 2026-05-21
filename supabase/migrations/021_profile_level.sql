alter table profiles
  add column if not exists level text check (level in ('Calistung', 'SD', 'SMP', 'SMA', 'Umum'));
