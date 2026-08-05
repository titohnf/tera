-- ============================================================
-- "Bank Soal" jadi "Latihan Soal"
--
-- Penggantian istilah yang dimulai di Sora diteruskan ke Tera supaya keduanya
-- menyebut hal yang sama dengan nama yang sama. Yang berubah di database hanya
-- satu: nilai `curriculum_resources.kind`.
--
-- Urutannya penting — constraint lama dilepas dulu, baru barisnya diperbarui,
-- baru constraint baru dipasang. Memperbarui baris lebih dulu akan ditolak oleh
-- check yang masih hanya mengizinkan 'bank_soal'.
--
-- `sessions.cp_urls` TIDAK ikut diganti nama: itu nama kolom, bukan istilah
-- yang dilihat pengguna, dan mengganti nama kolom yang dibaca di banyak tempat
-- demi kerapian penamaan bukan pertukaran yang sepadan. Kolom itu sudah
-- berpindah arti sekali di migrasi 080 (per topik); satu perubahan berisiko
-- pada satu kolom sudah cukup.
-- ============================================================

alter table curriculum_resources
  drop constraint if exists curriculum_resources_kind_check;

update curriculum_resources
set kind = 'latihan_soal'
where kind = 'bank_soal';

alter table curriculum_resources
  add constraint curriculum_resources_kind_check
  check (kind in ('materi', 'latihan_soal'));
