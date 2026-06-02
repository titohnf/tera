-- ============================================================
-- DEMO SEED DATA — Jalankan via Supabase Dashboard > SQL Editor
-- Mencakup semua kemungkinan row yang muncul di halaman Siswa
-- ============================================================

-- ── 1. Auth users (diperlukan karena profiles FK ke auth.users) ───────────────

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  -- Tutor
  ('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'tutor.demo@tera.id', '',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}',
   false, '', '', '', ''),
  -- Siswa 1–10
  ('a0000001-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'andi@demo.id', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000001-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'budi@demo.id', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000001-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'citra@demo.id', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000001-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'dewi@demo.id', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000001-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'eko@demo.id', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000001-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'farah@demo.id', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000001-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'gilang@demo.id', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000001-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'hana@demo.id', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000001-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'irfan@demo.id', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', ''),
  ('a0000001-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'joko@demo.id', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '', '', '')
on conflict (id) do nothing;


-- ── 2. Profiles ───────────────────────────────────────────────────────────────

insert into profiles (id, full_name, email, phone, role, level, grade, parent_name, created_at)
values
  -- Tutor
  ('a0000001-0000-0000-0000-000000000001', 'Ahmad Fauzi', 'tutor.demo@tera.id',
   '081234567890', 'tutor', null, null, null, now() - interval '1 year'),

  -- 1. Andi — SD kelas 1, aktif, sesi bulan ini (Kondisi D)
  ('a0000001-0000-0000-0000-000000000011', 'Andi Pratama', 'andi@demo.id',
   '08111111111', 'student', 'SD', '1', 'Bapak Santoso', now() - interval '6 months'),

  -- 2. Budi — SD kelas 4, aktif, sesi terjadwal depan belum sesi bulan ini (Kondisi C)
  ('a0000001-0000-0000-0000-000000000012', 'Budi Santoso', 'budi@demo.id',
   '08122222222', 'student', 'SD', '4', 'Ibu Wati', now() - interval '5 months'),

  -- 3. Citra — SMP kelas 7, aktif, pernah sesi tapi bukan bulan ini (Kondisi B)
  ('a0000001-0000-0000-0000-000000000013', 'Citra Dewi', 'citra@demo.id',
   '08133333333', 'student', 'SMP', '7', 'Bapak Hendra', now() - interval '4 months'),

  -- 4. Dewi — SMA kelas 10, aktif, BELUM PERNAH ada sesi + kritis KL-02 (Kondisi A)
  ('a0000001-0000-0000-0000-000000000014', 'Dewi Rahayu', 'dewi@demo.id',
   '08144444444', 'student', 'SMA', '10', 'Ibu Sari', now() - interval '20 days'),

  -- 5. Eko — SMA kelas 12, aktif, KRITIS KC-04 tidak ada sesi > 21 hari
  ('a0000001-0000-0000-0000-000000000015', 'Eko Wijaya', 'eko@demo.id',
   '08155555555', 'student', 'SMA', '12', 'Bapak Tono', now() - interval '3 months'),

  -- 6. Farah — SMP kelas 9, aktif, KRITIS KK-01 tagihan overdue > 30 hari
  ('a0000001-0000-0000-0000-000000000016', 'Farah Aulia', 'farah@demo.id',
   '08166666666', 'student', 'SMP', '9', 'Ibu Laila', now() - interval '4 months'),

  -- 7. Gilang — SMA kelas 11, aktif, KRITIS GANDA (KC-04 + KL-02)
  ('a0000001-0000-0000-0000-000000000017', 'Gilang Saputra', 'gilang@demo.id',
   '08177777777', 'student', 'SMA', '11', 'Bapak Bimo', now() - interval '5 months'),

  -- 8. Hana — SMP kelas 8, NON-AKTIF (pernah di kelas, sekarang tidak)
  ('a0000001-0000-0000-0000-000000000018', 'Hana Putri', 'hana@demo.id',
   '08188888888', 'student', 'SMP', '8', 'Ibu Rina', now() - interval '8 months'),

  -- 9. Irfan — TANPA KELAS (belum pernah di kelas manapun)
  ('a0000001-0000-0000-0000-000000000019', 'Irfan Hakim', 'irfan@demo.id',
   '08199999999', 'student', 'SD', '6', 'Bapak Dodi', now() - interval '2 days'),

  -- 10. Joko — Umum, aktif, normal
  ('a0000001-0000-0000-0000-000000000020', 'Joko Susilo', 'joko@demo.id',
   '08100000000', 'student', 'Umum', null, 'Bapak Bambang', now() - interval '2 months')
on conflict (id) do nothing;


-- ── 3. Classes ────────────────────────────────────────────────────────────────

insert into classes (id, name, level, is_active, tutor_id, class_type)
values
  ('b0000001-0000-0000-0000-000000000001', 'SD Reguler Pagi',   'SD',   true,  'a0000001-0000-0000-0000-000000000001', 'group'),
  ('b0000001-0000-0000-0000-000000000002', 'SMP Intensif',      'SMP',  true,  'a0000001-0000-0000-0000-000000000001', 'group'),
  ('b0000001-0000-0000-0000-000000000003', 'SMA Persiapan UN',  'SMA',  true,  'a0000001-0000-0000-0000-000000000001', 'private'),
  ('b0000001-0000-0000-0000-000000000004', 'Kelas Tanpa Jadwal', 'SMA', true,  'a0000001-0000-0000-0000-000000000001', 'private')
on conflict (id) do nothing;


-- ── 4. Enrollments ────────────────────────────────────────────────────────────

insert into class_students (student_id, class_id, is_active)
values
  -- Andi → SD Reguler (aktif)
  ('a0000001-0000-0000-0000-000000000011', 'b0000001-0000-0000-0000-000000000001', true),
  -- Budi → SD Reguler (aktif)
  ('a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000001', true),
  -- Citra → SMP Intensif (aktif)
  ('a0000001-0000-0000-0000-000000000013', 'b0000001-0000-0000-0000-000000000002', true),
  -- Dewi → Kelas Tanpa Jadwal (aktif) — kondisi A + KL-02
  ('a0000001-0000-0000-0000-000000000014', 'b0000001-0000-0000-0000-000000000004', true),
  -- Eko → SMA Persiapan (aktif) — KC-04
  ('a0000001-0000-0000-0000-000000000015', 'b0000001-0000-0000-0000-000000000003', true),
  -- Farah → SMP Intensif (aktif) — KK-01
  ('a0000001-0000-0000-0000-000000000016', 'b0000001-0000-0000-0000-000000000002', true),
  -- Gilang → Kelas Tanpa Jadwal (aktif) — KC-04 + KL-02
  ('a0000001-0000-0000-0000-000000000017', 'b0000001-0000-0000-0000-000000000004', true),
  -- Hana → SMP Intensif (NON-AKTIF)
  ('a0000001-0000-0000-0000-000000000018', 'b0000001-0000-0000-0000-000000000002', false),
  -- Joko → SD Reguler (aktif)
  ('a0000001-0000-0000-0000-000000000020', 'b0000001-0000-0000-0000-000000000001', true)
  -- Irfan: tidak dimasukkan ke kelas manapun (tanpa-kelas)
on conflict (student_id, class_id) do nothing;


-- ── 5. Sessions ───────────────────────────────────────────────────────────────

insert into sessions (id, class_id, tutor_id, scheduled_at, status, topic, duration_minutes)
values
  -- SD Reguler: sesi bulan ini (untuk Andi dan Budi)
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001',
   'a0000001-0000-0000-0000-000000000001',
   date_trunc('month', now()) + interval '5 days', 'completed', 'Perkalian dan Pembagian', 90),
  ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001',
   'a0000001-0000-0000-0000-000000000001',
   date_trunc('month', now()) + interval '12 days', 'completed', 'Pecahan Sederhana', 90),

  -- SD Reguler: sesi terjadwal depan (Kondisi C untuk Budi — tapi Budi sudah ada sesi bulan ini, jadi ini untuk ilustrasi)
  ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001',
   'a0000001-0000-0000-0000-000000000001',
   now() + interval '5 days', 'scheduled', 'Geometri Dasar', 90),

  -- SMP Intensif: sesi 3 bulan lalu (Citra — Kondisi B)
  ('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000002',
   'a0000001-0000-0000-0000-000000000001',
   now() - interval '3 months', 'completed', 'Persamaan Linear', 90),
  ('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000002',
   'a0000001-0000-0000-0000-000000000001',
   now() - interval '2 months 20 days', 'completed', 'Sistem Persamaan', 90),

  -- SMA Persiapan: sesi 25 hari lalu (Eko — KC-04, > 21 hari tanpa sesi)
  ('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000003',
   'a0000001-0000-0000-0000-000000000001',
   now() - interval '25 days', 'completed', 'Integral Tak Tentu', 90),

  -- Kelas Tanpa Jadwal: tidak ada sesi sama sekali (Dewi, Gilang — KL-02)
  -- (tidak ada insert sessions untuk kelas ini)

  -- Hana (SMP, non-aktif) pernah ada sesi
  ('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000002',
   'a0000001-0000-0000-0000-000000000001',
   now() - interval '5 months', 'completed', 'Aljabar', 90),

  -- Joko (SD Reguler, Umum)
  ('c0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000001',
   'a0000001-0000-0000-0000-000000000001',
   date_trunc('month', now()) + interval '8 days', 'completed', 'Bahasa Indonesia Dasar', 60)
on conflict (id) do nothing;


-- ── 6. Attendances ────────────────────────────────────────────────────────────

insert into attendances (session_id, student_id, status)
values
  -- Andi hadir (Kondisi D)
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000011', 'present'),
  ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000011', 'present'),
  -- Budi hadir (Kondisi D — ada sesi bulan ini)
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000012', 'late'),
  ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000012', 'present'),
  -- Citra hadir di sesi lama (Kondisi B — bukan bulan ini)
  ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000013', 'present'),
  ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000013', 'absent'),
  -- Eko hadir sesi 25 hari lalu (KC-04)
  ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000015', 'present'),
  -- Farah hadir sesi lama
  ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000016', 'present'),
  -- Hana hadir sesi lama (non-aktif)
  ('c0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000018', 'present'),
  -- Joko hadir
  ('c0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000020', 'present')
on conflict (session_id, student_id) do nothing;


-- ── 7. Invoices ───────────────────────────────────────────────────────────────
-- Kolom wajib: student_name, parent_name, invoice_number, total_due, issued_at
-- Status: hanya 'draft' | 'sent' | 'paid' — overdue dideteksi via due_date < today

insert into invoices (id, student_id, class_id, student_name, parent_name, invoice_number, total_due, issued_at, due_date, status)
values
  -- Andi: lunas
  ('d0000001-0000-0000-0000-000000000011',
   'a0000001-0000-0000-0000-000000000011', 'b0000001-0000-0000-0000-000000000001',
   'Andi Pratama', 'Bapak Santoso',
   'INV/DEMO/001', 800000,
   (current_date - interval '2 months')::date, (current_date - interval '1 month 15 days')::date, 'paid'),

  -- Budi: draft
  ('d0000001-0000-0000-0000-000000000012',
   'a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000001',
   'Budi Santoso', 'Ibu Wati',
   'INV/DEMO/002', 800000,
   (current_date - interval '5 days')::date, (current_date + interval '25 days')::date, 'draft'),

  -- Citra: terkirim, belum jatuh tempo
  ('d0000001-0000-0000-0000-000000000013',
   'a0000001-0000-0000-0000-000000000013', 'b0000001-0000-0000-0000-000000000002',
   'Citra Dewi', 'Bapak Hendra',
   'INV/DEMO/003', 600000,
   (current_date - interval '15 days')::date, (current_date + interval '15 days')::date, 'sent'),

  -- Farah: OVERDUE > 30 hari (KK-01 kritis)
  ('d0000001-0000-0000-0000-000000000016',
   'a0000001-0000-0000-0000-000000000016', 'b0000001-0000-0000-0000-000000000002',
   'Farah Aulia', 'Ibu Laila',
   'INV/DEMO/006', 600000,
   (current_date - interval '50 days')::date, (current_date - interval '35 days')::date, 'sent'),

  -- Farah: invoice kedua overdue (tagihan menumpuk KK-02)
  ('d0000001-0000-0000-0000-000000000017',
   'a0000001-0000-0000-0000-000000000016', 'b0000001-0000-0000-0000-000000000002',
   'Farah Aulia', 'Ibu Laila',
   'INV/DEMO/006B', 600000,
   (current_date - interval '80 days')::date, (current_date - interval '65 days')::date, 'sent'),

  -- Joko: lunas
  ('d0000001-0000-0000-0000-000000000020',
   'a0000001-0000-0000-0000-000000000020', 'b0000001-0000-0000-0000-000000000001',
   'Joko Susilo', 'Bapak Bambang',
   'INV/DEMO/010', 800000,
   (current_date - interval '1 month')::date, (current_date - interval '5 days')::date, 'paid')
on conflict (id) do nothing;
