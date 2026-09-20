-- Pembahasan soal: soal tanpa pembahasan tidak mengajari apa pun.
--
-- Murid yang salah menjawab cuma tahu ia salah. Halaman Materi & Latihan Soal
-- sudah lama memperlakukan topik bersoal-tanpa-pembahasan sebagai belum
-- lengkap (lihat `kelengkapan()` di MateriLatihanSoalTable.tsx), tapi jurnal
-- sesi belum pernah menagihnya ke tutor yang membuat soalnya. Dua kolom ini
-- yang membuat tagihan itu mungkin.
--
-- Keduanya sengaja terpisah dari kolom soalnya, bukan objek gabungan: kolom
-- soal sudah dibaca di banyak tempat (lihat 080_bank_soal_per_topic.sql), dan
-- pembahasan datang belakangan, sering berhari-hari setelah soalnya.

-- Pembahasan untuk satu asesmen — pasangan `link_url`.
alter table assessments
  add column if not exists pembahasan_url text;

-- Pembahasan untuk latihan soal per topik — pasangan `cp_urls`, dikunci
-- dengan kunci yang sama persis (group_id topik, atau 'custom' untuk CP bebas
-- kelas privat; lihat lib/latihan-soal-topics.ts). Kunci yang berbeda antara
-- kedua peta berarti pembahasan yatim yang tidak pernah tampil.
alter table sessions
  add column if not exists cp_pembahasan_urls jsonb not null default '{}';

comment on column assessments.pembahasan_url is
  'Tautan pembahasan soal asesmen ini, diisi tutor. Wajib bila link_url terisi dan sesinya dijadwalkan sejak 1 September 2026.';
comment on column sessions.cp_pembahasan_urls is
  'Tautan pembahasan latihan soal per topik. Kuncinya sama dengan cp_urls.';
