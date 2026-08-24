-- ============================================================
-- Tabel yang punya policy tapi RLS-nya tidak pernah dinyalakan
--
-- Ditemukan saat menguji akun `mandiri` pertama terhadap database sungguhan:
-- akun polos tanpa langganan, tanpa satu pun baris `family_students`, bisa
-- membaca SELURUH tabel `invoices`, `invoice_payments`, `billing_rates`,
-- `billing_rate_periods`, dan `curriculum_topics`.
--
-- Sebabnya bukan policy yang salah. Untuk `invoices`, `invoice_payments`, dan
-- `curriculum_topics`, migrasi 076 sudah menuliskan policy yang tepat —
-- `is_family() and family_covers_student(...)` — tapi ketiga tabel itu tidak
-- pernah menerima `alter table ... enable row level security`. Policy di tabel
-- yang RLS-nya mati tidak menahan apa pun; ia cuma dokumentasi yang tampak
-- meyakinkan. `billing_rates` dan `billing_rate_periods` bahkan tidak pernah
-- punya policy sama sekali.
--
-- INI SUDAH BENAR HARI INI, sebelum ada satu pun akun langganan: setiap akun
-- keluarga yang sudah ada pun bisa membaca tagihan seluruh keluarga lain, dan
-- tarif bimbel terbuka untuk siapa saja yang punya sesi login. Yang berubah
-- dengan dibukanya pendaftaran mandiri bukan kemungkinannya, melainkan siapa
-- saja yang bisa mencobanya.
--
-- Aman dijalankan tanpa deploy. Sudah diperiksa satu per satu: seluruh halaman
-- admin yang menyentuh kelima tabel ini memakai `createAdminClient()` (service
-- role, yang melewati RLS), dan satu-satunya pembaca lewat client sesi adalah
-- portal keluarga — `app/keluarga/[studentId]/tagihan/page.tsx`,
-- `lib/keluarga-anak.ts`, dan `app/keluarga/[studentId]/materi/page.tsx` —
-- yang persis dilindungi policy 076 yang selama ini menganggur.
-- ============================================================

-- 1. Menyalakan yang policy-nya sudah menunggu ---------------------------------

alter table invoices enable row level security;
alter table invoice_payments enable row level security;
alter table curriculum_topics enable row level security;

-- Policy admin ditambahkan meski service role sudah melewatinya: 002 memasang
-- `is_admin()` di setiap tabel yang dilindunginya, dan halaman admin yang suatu
-- hari dipindah ke client sesi harus gagal karena aturannya, bukan karena tidak
-- ada aturannya.
create policy "Admin manage invoices" on invoices for all using (is_admin());
create policy "Admin manage invoice payments" on invoice_payments for all using (is_admin());
create policy "Admin manage curriculum topics" on curriculum_topics for all using (is_admin());

-- Kurikulum bukan data per murid. Tutor memang perlu membacanya, dan 076 sudah
-- membukanya untuk keluarga dengan alasan yang sama: yang membatasi relevansinya
-- adalah tampilan, bukan RLS.
create policy "Tutors read curriculum topics" on curriculum_topics
  for select using (is_tutor());

-- 2. Tarif: tidak pernah punya policy sama sekali ------------------------------
--
-- Ini angka internal — berapa sebuah kelas ditagihkan per jenjang dan jenis.
-- Tidak ada satu pun halaman non-admin yang membacanya, jadi tidak ada yang
-- perlu dibuka selain admin.

alter table billing_rates enable row level security;
alter table billing_rate_periods enable row level security;

create policy "Admin manage billing rates" on billing_rates for all using (is_admin());
create policy "Admin manage billing rate periods" on billing_rate_periods for all using (is_admin());

-- 3. Templat catatan: alat kerja, bukan bacaan umum ----------------------------
--
-- `002_rls_policies.sql:220` membukanya untuk semua akun terautentikasi. Saat
-- ditulis, "terautentikasi" berarti orang bimbel. Sekarang tidak lagi — dan
-- kalimat templat yang dipakai tutor menulis catatan tentang murid bukan
-- sesuatu yang perlu dibaca pelanggan langganan.

drop policy if exists "Authenticated users can view active templates" on performance_note_templates;
create policy "Authenticated users can view active templates"
  on performance_note_templates for select using (
    auth.role() = 'authenticated' and is_active = true and get_my_role() <> 'mandiri'
  );

notify pgrst, 'reload schema';
