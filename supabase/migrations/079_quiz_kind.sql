-- ============================================================
-- `quizzes.kind` — asesmen, remedial, atau try out
--
-- Sampai sekarang ketiganya adalah hal yang sama di database dan hanya
-- dibedakan lewat judul yang diketik admin. Itu cukup selama daftarnya satu,
-- tapi tidak lagi begitu Sora memisahkannya jadi tiga menu: menu butuh
-- penanda yang bisa disaring, bukan tebakan dari kata di judul.
--
-- Yang TIDAK dijawab kolom ini adalah "dikerjakan siapa" — itu tetap urusan
-- `assessments` (ditugaskan ke sesi = hanya murid kelas itu) versus share code
-- lepas. Sebuah try out pun boleh ditugaskan ke sesi. Dua sumbu yang berbeda,
-- sengaja tidak digabung: menggabungnya berarti memilih satu di antara "ini
-- jenis latihan apa" dan "siapa yang boleh mengerjakannya", padahal keduanya
-- dipakai untuk hal berbeda.
--
-- Default `asesmen` sekaligus jadi backfill untuk baris lama: itu isi Sora
-- sejauh ini, dan admin bisa memindahkan yang keliru lewat editor.
-- ============================================================

alter table quizzes
  add column if not exists kind text not null default 'asesmen';

alter table quizzes
  drop constraint if exists quizzes_kind_check;

alter table quizzes
  add constraint quizzes_kind_check check (kind in ('asesmen', 'remedial', 'tryout'));

create index if not exists quizzes_kind_idx on quizzes(kind);
