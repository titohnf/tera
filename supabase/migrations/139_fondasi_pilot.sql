-- ============================================================
-- Fondasi Tahap 0: penanggung jawab, jejak kunjungan, dan angka yang bisa
-- diubah tanpa deploy
--
-- Tiga hal kecil yang jadi prasyarat FR7, FR9, FR11, dan FR12. Semuanya
-- aditif; tidak ada satu pun perilaku yang berubah sampai ada kode yang
-- membacanya.
-- ============================================================

-- 1. Satu tutor penanggung jawab per murid (FR9) --------------------------------
--
-- Dokumen fondasi Bagian 3.2 menuntut ini SEBELUM pilot melibatkan anak
-- sungguhan: eskalasi harus punya alamat, dan "tutor mana saja yang sedang
-- piket" bukan alamat. Relasi tutor–murid yang sudah ada di Tera semuanya
-- lewat KELAS (`classes.tutor_id`, `sessions.tutor_id`), yang menjawab
-- pertanyaan berbeda — siapa yang mengajar sesi ini — dan bisa berganti tiap
-- pertemuan.
--
-- FK TUNGGAL, BUKAN RIWAYAT, dan itu batasan yang disengaja (Skema Data
-- Bagian 3.1): untuk 1–2 tutor pilot ini cukup. Begitu jumlahnya bertambah di
-- Tahap 1, kolom ini perlu tumbuh jadi tabel penugasan dengan rentang tanggal,
-- supaya pergantian tutor di tengah jalan tidak menghapus jejak siapa yang
-- bertanggung jawab pada periode tertentu. `notifikasi_eskalasi` nanti
-- MENYALIN nilai ini saat notifikasi dibuat, justru supaya riwayatnya tetap
-- benar meski kolom ini berubah kemudian.
--
-- Nullable: murid di luar pilot tidak punya penanggung jawab, dan memaksa
-- kolom ini terisi akan mengubah aturan bagi seluruh murid Tera demi tiga
-- topik percobaan. Yang menegakkan "wajib terisi sebelum paket pertama" adalah
-- gerbang di jalur paket Bloom, bukan skema.
alter table learners
  add column if not exists tutor_penanggung_jawab_id uuid references profiles(id) on delete set null;

create index if not exists learners_tutor_penanggung_jawab_idx
  on learners(tutor_penanggung_jawab_id);

comment on column learners.tutor_penanggung_jawab_id is
  'Tutor yang menerima eskalasi untuk murid ini (FR9). FK tunggal, bukan riwayat — batasan sadar untuk skala pilot.';

-- 2. Kapan terakhir murid ini datang (FR12) -------------------------------------
--
-- Dipakai menghitung `hari_sejak_kunjungan_terakhir` untuk sapaan kontekstual,
-- tanpa menyapu riwayat sesi setiap kali beranda dibuka (Alur Kunjungan
-- Kembali Bagian 6).
--
-- Sengaja BUKAN "streak". Dokumen Alur Kunjungan Kembali Bagian 3 menolak
-- mekanisme itu dengan alasan yang eksplisit: streak yang terputus terasa
-- seperti hukuman. Kolom ini hanya tahu kapan terakhir, bukan berapa hari
-- berturut-turut — dan ketiadaan yang kedua itu keputusan, bukan kekurangan.
alter table learners
  add column if not exists terakhir_aktif timestamptz;

comment on column learners.terakhir_aktif is
  'Kunjungan terakhir murid ke permukaan belajar (FR12). Bukan streak — lihat Alur Kunjungan Kembali Bagian 3.';

-- 3. Angka yang tim konten boleh ubah sendiri -----------------------------------
--
-- Ambang mastery muncul di empat tempat berbeda dalam PRD (FR5, FR7, FR11, dan
-- kriteria `tuntas` di FR13), dan dokumen fondasi Bagian 3.4 menyebut 75%
-- sebagai CONTOH yang perlu difinalisasi tim konten. Menanamnya di kode berarti
-- setiap penyesuaian jadi deploy, dan menuliskannya empat kali berarti empat
-- tempat yang bisa berbeda.
--
-- Bentuknya kunci–nilai jsonb, bukan satu kolom per pengaturan: yang disimpan
-- di sini adalah angka kebijakan yang jumlahnya akan bertambah (interval
-- retest, ambang nudge, teks framing), dan menambah kolom untuk tiap satu
-- berarti migrasi untuk tiap satu.
--
-- BUKAN tempat untuk rahasia atau konfigurasi teknis — hanya keputusan
-- pedagogis yang pemiliknya tim konten, dan yang boleh dibaca siapa pun yang
-- sudah masuk.
create table if not exists pengaturan (
  kunci text primary key,
  nilai jsonb not null,
  keterangan text,
  diperbarui_pada timestamptz not null default now()
);

comment on table pengaturan is
  'Angka & teks kebijakan pedagogis yang boleh diubah tim konten tanpa deploy. Bukan untuk rahasia atau konfigurasi teknis.';

alter table pengaturan enable row level security;

-- Dibaca siapa pun yang sudah masuk: ambangnya bukan rahasia, dan halaman
-- murid perlu tahu angka yang sama dengan yang dipakai server.
drop policy if exists "Pengguna masuk membaca pengaturan" on pengaturan;
create policy "Pengguna masuk membaca pengaturan" on pengaturan
  for select to authenticated using (true);

-- Diubah admin saja. Tutor pun tidak: ini keputusan kebijakan, bukan operasi
-- harian.
drop policy if exists "Admin mengelola pengaturan" on pengaturan;
create policy "Admin mengelola pengaturan" on pengaturan
  for all using (is_admin()) with check (is_admin());

insert into pengaturan (kunci, nilai, keterangan) values
  (
    'ambang_mastery',
    '0.75'::jsonb,
    'Ambang penguasaan, dari Skor Putaran 1. Dipakai bersama oleh kriteria tuntas (FR13), pemicu eskalasi dua paket berturut-turut (FR7), dan kriteria lolos retest (FR11). Contoh di dokumen fondasi Bagian 3.4; difinalisasi tim konten.'
  ),
  (
    'retest_interval_awal_hari',
    '{"biasa": 14, "ekstra_wajib": 7}'::jsonb,
    'Interval retest pertama sesudah topik tuntas (FR11, dokumen Retest Terjadwal Bagian 2.1). Default operasional berbasis pola umum spaced repetition, BUKAN kalibrasi untuk populasi ini — wajib ditinjau ulang begitu data retest nyata terkumpul.'
  ),
  (
    'retest_faktor_pelebaran',
    '2'::jsonb,
    'Pengali interval retest setiap kali lolos (FR11). Sama seperti di atas: default operasional, belum terkalibrasi.'
  ),
  (
    'retest_interval_maksimum_hari',
    '90'::jsonb,
    'Batas atas interval retest; sesudah ini retest berjalan sebagai pemeliharaan (FR11).'
  )
on conflict (kunci) do nothing;

notify pgrst, 'reload schema';
