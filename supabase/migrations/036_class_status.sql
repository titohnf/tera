alter table classes
  add column if not exists status text not null default 'aktif'
    check (status in ('aktif', 'selesai'));

-- Sinkronisasi: kelas yang is_active = false → selesai
update classes set status = 'selesai' where not is_active;
