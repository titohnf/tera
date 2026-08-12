-- ============================================================
-- `holidays` — kalender hari libur
--
-- Selama ini tidak ada satu pun tempat di Tera yang tahu tanggal berapa bimbel
-- libur. Akibatnya sesi tetap terjadwal di hari libur nasional, invoice terbit
-- menghitung sesi itu, lalu semuanya harus dibereskan manual satu per satu:
-- batalkan sesinya, koreksi invoicenya, jelaskan selisihnya. Agustus 2026
-- memakan delapan sesi lewat jalan itu.
--
-- Tabel ini membuat tanggal libur jadi data, bukan ingatan. Yang memakainya:
-- halaman Kalender Libur untuk mencatat dan membatalkan sesi yang bentrok, dan
-- nanti pembuatan jadwal supaya tidak melahirkan sesi di hari libur sejak awal.
--
-- `kind` memisahkan tiga hal yang perlakuannya bisa berbeda:
--   * nasional     — libur resmi SKB 3 Menteri, mengikat semua orang
--   * cuti_bersama — mengikat ASN; swasta boleh memilih, jadi bimbel bebas
--                    memutuskan tetap mengajar atau tidak
--   * internal     — libur bimbel sendiri: libur semester, acara internal,
--                    atau hari yang memang diliburkan pemilik
--
-- Tanggalnya unik: satu hari hanya boleh punya satu keterangan libur, supaya
-- pengecekan bentrok tidak pernah menghasilkan dua jawaban untuk tanggal sama.
-- ============================================================

create table if not exists holidays (
  id uuid primary key default uuid_generate_v4(),
  holiday_date date not null unique,
  name text not null,
  kind text not null default 'nasional' check (kind in ('nasional', 'cuti_bersama', 'internal')),
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists holidays_date_idx on holidays (holiday_date);

create trigger set_holidays_updated_at before update on holidays
  for each row execute function set_updated_at();

-- Admin yang mengelola. Tutor dan keluarga boleh membaca: jadwal yang mereka
-- lihat perlu bisa menerangkan kenapa sebuah hari kosong, dan tanggal libur
-- nasional bukan rahasia siapa pun.
alter table holidays enable row level security;

create policy "Admin manage holidays"
  on holidays for all
  using (is_admin())
  with check (is_admin());

create policy "Authenticated read holidays"
  on holidays for select
  using (auth.uid() is not null);

-- Seed: hari libur nasional 2026 sesuai SKB 3 Menteri (ditetapkan 19 September
-- 2025). Cuti bersama TIDAK ikut diseed selain 24 Desember — sisanya jatuh di
-- Maret dan Mei 2026 yang sudah lewat, dan menambahkannya sekarang cuma
-- meramaikan daftar tanpa mengubah apa pun.
--
-- `on conflict do nothing` supaya migrasi ini aman diulang dan tidak menimpa
-- keterangan yang mungkin sudah diedit admin.
insert into holidays (holiday_date, name, kind) values
  ('2026-01-01', 'Tahun Baru 2026 Masehi', 'nasional'),
  ('2026-01-16', 'Isra Mikraj Nabi Muhammad saw.', 'nasional'),
  ('2026-02-17', 'Tahun Baru Imlek 2577 Kongzili', 'nasional'),
  ('2026-03-19', 'Hari Suci Nyepi (Tahun Baru Saka 1948)', 'nasional'),
  ('2026-03-21', 'Idulfitri 1447 H (hari pertama)', 'nasional'),
  ('2026-03-22', 'Idulfitri 1447 H (hari kedua)', 'nasional'),
  ('2026-04-03', 'Wafat Yesus Kristus', 'nasional'),
  ('2026-04-05', 'Kebangkitan Yesus Kristus (Paskah)', 'nasional'),
  ('2026-05-01', 'Hari Buruh Internasional', 'nasional'),
  ('2026-05-14', 'Kenaikan Yesus Kristus', 'nasional'),
  ('2026-05-27', 'Iduladha 1447 H', 'nasional'),
  ('2026-05-31', 'Hari Raya Waisak 2570 BE', 'nasional'),
  ('2026-06-01', 'Hari Lahir Pancasila', 'nasional'),
  ('2026-06-16', '1 Muharam Tahun Baru Islam 1448 H', 'nasional'),
  ('2026-08-17', 'Proklamasi Kemerdekaan', 'nasional'),
  ('2026-08-25', 'Maulid Nabi Muhammad saw.', 'nasional'),
  ('2026-12-24', 'Cuti Bersama Kelahiran Yesus Kristus', 'cuti_bersama'),
  ('2026-12-25', 'Kelahiran Yesus Kristus', 'nasional')
on conflict (holiday_date) do nothing;
