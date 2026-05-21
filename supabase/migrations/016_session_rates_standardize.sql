-- Reset to standardized structure: fixed jenjang × jenis combinations
delete from session_rates;

-- Grup
insert into session_rates (class_type, jenjang, jenis, rate_per_session) values
  ('group', 'Calistung', 'Reguler', 60000),
  ('group', 'Calistung', 'Fokus',   60000),
  ('group', 'SD',        'Reguler', 70000),
  ('group', 'SD',        'Fokus',   80000),
  ('group', 'SMP',       'Reguler', 80000),
  ('group', 'SMP',       'Fokus',   90000),
  ('group', 'SMA',       'Reguler', 90000),
  ('group', 'SMA',       'Fokus',   100000),
  ('group', 'Umum',      'Reguler', 0),
  ('group', 'Umum',      'Fokus',   0);

-- Privat
insert into session_rates (class_type, jenjang, jenis, rate_per_session) values
  ('private', 'Calistung', 'Reguler', 60000),
  ('private', 'Calistung', 'Fokus',   60000),
  ('private', 'SD',        'Reguler', 60000),
  ('private', 'SD',        'Fokus',   60000),
  ('private', 'SMP',       'Reguler', 80000),
  ('private', 'SMP',       'Fokus',   80000),
  ('private', 'SMA',       'Reguler', 100000),
  ('private', 'SMA',       'Fokus',   100000),
  ('private', 'Umum',      'Reguler', 0),
  ('private', 'Umum',      'Fokus',   0);
