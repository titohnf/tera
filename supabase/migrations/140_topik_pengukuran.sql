-- ============================================================
-- Topik sebagai satuan PENGUKURAN, di samping kurikulum sebagai jadwal
--
-- Peta Kompetensi Matematika Bagian 1 menyebut dua lapis kurikulum yang selama
-- ini diperlakukan seolah satu hal: kurikulum-sebagai-jadwal (tema & materi per
-- semester, yang sudah hidup di `curriculum_topic_groups`) dan
-- kurikulum-sebagai-peta-kompetensi (Elemen → Indikator, tempat Bloom/DOK/SOLO
-- menempel). Dokumen itu menegaskan lapisan kedua TIDAK menggantikan yang
-- pertama; keduanya dipakai untuk fungsi masing-masing.
--
-- Tabel ini lapisan kedua itu.
--
-- KENAPA TABEL SENDIRI, BUKAN KOLOM `kode` DI `curriculum_topic_groups`. Karena
-- datanya membantah asumsi bahwa satu topik dokumen = satu grup kurikulum. Di
-- kurikulum yang berjalan, "Bilangan Bulat" adalah TEMA berisi empat grup
-- terpisah, dan materi yang Learning Progression sebut milik D-01 bahkan
-- melintasi tema (sifat operasi duduk di tema Bilangan Rasional). Sebuah kode
-- yang ditempel di grup juga tidak punya tempat untuk apa pun yang dibutuhkan
-- FR11/FR13 — prasyarat, penanda remediasi — dan kode tanpa tabel berarti
-- `status_topik_siswa.topik_id` dan `jadwal_retest.topik_id` menunjuk teks
-- tanpa integritas referensial.
--
-- `id` BERUPA KODE, BUKAN UUID. Keputusan sadar dari Skema Data Bagian 2.1:
-- kode `D-01`/`AC-19`/`EF-09` sudah unik global by design, jauh lebih mudah
-- dibaca tim konten dan saat menelusuri produksi, dan menghindari lapisan
-- pemetaan tambahan antara UUID internal dan kode tampilan.
-- ============================================================

create table if not exists topik (
  -- Format `[Fase]-[nomor 2 digit]` dari Learning Progression Bagian 2. Fase
  -- majemuk (AC, EF) ikut sah. Dijaga di skema supaya salah ketik jadi galat
  -- saat menulis, bukan topik hantu yang tidak pernah cocok dengan apa pun.
  id text primary key check (id ~ '^[A-F]{1,2}-[0-9]{2}$'),
  nama text not null,
  elemen text not null check (elemen in ('bilangan', 'aljabar', 'geometri_pengukuran', 'data_peluang')),
  -- String, bukan int: sebagian topik membentang lebih dari satu kelas ("7-8"),
  -- mengikuti kolom Kelas di Learning Progression.
  jenjang_kelas text not null,
  -- Penanda titik lemah nasional dari Learning Progression Bagian 2.1. Bukan
  -- hiasan: ia yang menentukan interval retest awal 7 hari alih-alih 14 (FR11),
  -- dan kelak bobot rekomendasi di Tahap 1.
  penanda_remediasi text not null default 'biasa'
    check (penanda_remediasi in ('biasa', 'ekstra', 'ekstra_wajib')),
  -- Urutan tampil dalam elemennya. Nomor di `id` sudah berurut, tapi ia teks —
  -- mengurutkan lewat kolom sendiri lebih jujur daripada mengandalkan bahwa
  -- 'D-02' < 'D-10' secara leksikografis (kebetulan benar untuk dua digit, dan
  -- kebetulan bukan jaminan).
  urutan int not null,
  aktif boolean not null default false,
  dibuat_pada timestamptz not null default now()
);

comment on table topik is
  'Topik sebagai satuan pengukuran (Learning Progression). Lapisan terpisah dari curriculum_topic_groups yang mengatur jadwal — lihat Peta Kompetensi Bagian 1.';
comment on column topik.aktif is
  'Topik yang benar-benar dibuka untuk dikerjakan. Tahap 0 hanya D-01; D-02/D-03 menyusul di Tahap 1.';

-- Prasyarat sebagai tabel, bukan array -----------------------------------------
--
-- Skema Data Bagian 2.1 menuliskannya sebagai "array of FK". Postgres tidak
-- bisa menjamin integritas referensial elemen sebuah array, jadi array berarti
-- kode yang harus memeriksa sendiri bahwa tiap kode di dalamnya benar-benar
-- ada. Lebih penting lagi, FR11 Bagian 5.1 menanyakan arah SEBALIKNYA — "topik
-- mana saja yang menjadikan T sebagai prasyarat" — yang dengan array berarti
-- memindai seluruh tabel, dan dengan tabel ini tinggal satu indeks.
create table if not exists topik_prasyarat (
  topik_id text not null references topik(id) on delete cascade,
  prasyarat_id text not null references topik(id) on delete cascade,
  primary key (topik_id, prasyarat_id),
  -- Topik tidak bisa jadi prasyarat dirinya sendiri. Rantai melingkar yang
  -- lebih panjang tidak dijaga di sini (butuh rekursi); yang ini murah dan
  -- menangkap salah ketik paling umum.
  check (topik_id <> prasyarat_id)
);

create index if not exists topik_prasyarat_prasyarat_idx on topik_prasyarat(prasyarat_id);

comment on table topik_prasyarat is
  'Prasyarat antar-topik (FR13). Arah baca yang paling sering: siapa saja yang bergantung pada topik ini (FR11 Bagian 5.1).';

-- Jembatan ke kurikulum yang berjalan ------------------------------------------
--
-- MURNI UNTUK PELABELAN & PELAPORAN: supaya tutor dan orang tua tetap melihat
-- "Bilangan Bulat" yang mereka kenal, dan supaya soal pilot punya tempat
-- bergantung di taksonomi yang sudah ada.
--
-- BUKAN penyaring isi paket. Paket Bloom disusun dari daftar butir eksplisit
-- (`paket_soal_item`, menyusul), bukan dari kueri atas tag grup — jadi tidak
-- ada jalur "ambil semua soal di grup ini" yang bisa menyeret soal lama masuk
-- ke pengukuran. Perbedaan itu yang membuat pemetaan di bawah boleh tidak
-- sempurna tanpa merusak apa pun: ia menentukan LABEL, bukan isi.
create table if not exists topik_grup (
  topik_id text not null references topik(id) on delete cascade,
  group_id uuid not null references curriculum_topic_groups(id) on delete cascade,
  primary key (topik_id, group_id)
);

create index if not exists topik_grup_group_idx on topik_grup(group_id);

comment on table topik_grup is
  'Jembatan pelaporan topik pengukuran ↔ grup kurikulum. Menentukan label yang dilihat tutor/orang tua, BUKAN isi paket.';

-- RLS ---------------------------------------------------------------------------
--
-- Peta kompetensi bukan rahasia: ia perlu dibaca setiap layar yang menyebut
-- nama topik. Yang dibatasi penyuntingannya.
alter table topik enable row level security;
alter table topik_prasyarat enable row level security;
alter table topik_grup enable row level security;

drop policy if exists "Pengguna masuk membaca topik" on topik;
create policy "Pengguna masuk membaca topik" on topik
  for select to authenticated using (true);
drop policy if exists "Admin mengelola topik" on topik;
create policy "Admin mengelola topik" on topik
  for all using (is_admin()) with check (is_admin());

drop policy if exists "Pengguna masuk membaca prasyarat" on topik_prasyarat;
create policy "Pengguna masuk membaca prasyarat" on topik_prasyarat
  for select to authenticated using (true);
drop policy if exists "Admin mengelola prasyarat" on topik_prasyarat;
create policy "Admin mengelola prasyarat" on topik_prasyarat
  for all using (is_admin()) with check (is_admin());

drop policy if exists "Pengguna masuk membaca jembatan topik" on topik_grup;
create policy "Pengguna masuk membaca jembatan topik" on topik_grup
  for select to authenticated using (true);
drop policy if exists "Admin mengelola jembatan topik" on topik_grup;
create policy "Admin mengelola jembatan topik" on topik_grup
  for all using (is_admin()) with check (is_admin());

-- Isian awal: satu topik, bukan tiga -------------------------------------------
--
-- Cakupan pilot adalah D-01 SAJA. Brief awal dan PRD FR13 sempat menyebut tiga
-- topik linear (D-01→D-02→D-03), tapi Protokol Uji Coba v1.2 Bagian 2 dan
-- Learning Progression v1.5 sama-sama memindahkan D-02/D-03 ke Tahap 1 setelah
-- rekonsiliasi — dan keduanya dokumen yang lebih baru. Menyemai ketiganya
-- sekarang berarti dua topik yang tidak punya satu butir soal pun.
insert into topik (id, nama, elemen, jenjang_kelas, penanda_remediasi, urutan, aktif) values
  ('D-01', 'Bilangan Bulat: operasi & sifat dasar', 'bilangan', '7', 'biasa', 1, true)
on conflict (id) do nothing;

-- D-01 tidak punya prasyarat (kolom Prasyarat "—" di Learning Progression),
-- jadi `topik_prasyarat` sengaja kosong. Itu bukan tabel yang terlupa diisi.

-- Dipilih lewat sifatnya, bukan ditulis sebagai UUID: id grup berbeda di tiap
-- lingkungan, dan migrasi yang memuat UUID produksi hanya benar di satu tempat.
insert into topik_grup (topik_id, group_id)
select 'D-01', g.id
from curriculum_topic_groups g
join subjects s on s.id = g.subject_id
where s.name = 'Matematika'
  and g.curriculum = 'Kurikulum Merdeka'
  and g.grade_level = 'Kelas 7'
  and g.theme = 'Bilangan Bulat'
on conflict do nothing;

-- ------------------------------------------------------------
-- CATATAN YANG HARUS DITAGIH DI TAHAP BERIKUTNYA
--
-- `/belajar` mengundi soal lewat tag grup (`practice_draw_questions`). Begitu
-- 36 butir pilot ditag ke grup bertema Bilangan Bulat, murid mana pun yang
-- memilih topik itu di latihan mandiri akan mendapatkannya secara acak —
-- termasuk 12 butir paket ujian yang menurut Protokol Uji Coba Bagian 4 harus
-- eksklusif. Itu item exposure sebelum pilotnya jalan, dan ia merusak makna
-- Skor Putaran 1: butir yang sudah pernah dilihat di latihan bebas bukan lagi
-- percobaan pertama.
--
-- Keputusan yang sudah diambil: SELURUH butir anggota paket Bloom dikecualikan
-- dari undian latihan bebas. Belum bisa dikerjakan di sini karena penyaringnya
-- butuh `paket_soal_item`, yang lahir bersama paket. Ditagih di migrasi paket.
-- ------------------------------------------------------------

notify pgrst, 'reload schema';
