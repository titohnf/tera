-- ============================================================
-- Sinkron soal digital dari Google Form di Drive
--
-- Tutor menaruh asesmen sebagai Google Form di folder bimbel. Tugas harian
-- (`/api/cron/sinkron-soal`, kembaran sinkron materi) membaca form itu lewat
-- Google Forms API dan membuat soal digitalnya: satu kuis draf di Sora (bahan
-- penugasan semester depan) dan butir bank soal draf bertag topik kurikulum
-- (yang dikerjakan anak di menu Belajar). Semester ini tidak ada hubungannya
-- dengan kelengkapan jurnal tutor.
--
-- Tabel ini adalah buku catatan sinkronnya, satu baris per form:
--
--   * `modified_time` = kapan form terakhir diubah di Drive. Form yang tidak
--     berubah tidak dibaca ulang; yang berubah dibuat ulang HANYA kalau semua
--     hasil lamanya masih draf dan belum dipakai siapa pun — kalau tidak,
--     barisnya ditandai `perlu_tinjauan` dan tidak ada yang ditimpa.
--   * `group_id` kosong = topiknya belum bisa dipastikan. Kuis tetap dibuat,
--     butir bank soal belum (butir tanpa topik tidak muncul di Belajar). Baris
--     ini jadi daftar kerja admin, sama seperti berkas materi tanpa kecocokan.
--
-- Hanya admin yang membaca dan menulis. Tugas harian memakai service role.
-- ============================================================

create table if not exists sinkron_soal_drive (
  file_id text primary key,
  nama text not null,
  jalur text not null,
  modified_time timestamptz,
  group_id uuid references curriculum_topic_groups(id) on delete set null,
  cara_cocok text check (cara_cocok in ('nama', 'peta', 'kode')),
  quiz_id uuid references quizzes(id) on delete set null,
  butir_ids uuid[] not null default '{}',
  jumlah_butir integer not null default 0,
  status text not null check (status in ('selesai', 'tanpa_topik', 'dilewati', 'galat', 'perlu_tinjauan')),
  catatan text,
  diperiksa_at timestamptz not null default now()
);

create index if not exists sinkron_soal_drive_status_idx on sinkron_soal_drive(status);
create index if not exists sinkron_soal_drive_group_idx on sinkron_soal_drive(group_id);

alter table sinkron_soal_drive enable row level security;

drop policy if exists "Admins manage sinkron soal drive" on sinkron_soal_drive;
create policy "Admins manage sinkron soal drive" on sinkron_soal_drive
  for all using (is_admin()) with check (is_admin());
