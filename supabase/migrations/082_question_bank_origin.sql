-- ============================================================
-- `questions.bank_item_id` — jejak soal yang diambil dari Latihan Soal
--
-- Soal yang ditambahkan dari bank disalin isinya ke `questions` dan setelah itu
-- tidak ada hubungan apa pun dengan asalnya. Akibatnya tombol "Simpan ke Bank"
-- tetap muncul di soal yang justru BERASAL dari bank, dan menekannya membuat
-- salinan kembar di bank tanpa ada yang mencegah.
--
-- Kolom ini hanya penanda asal, bukan tautan hidup: mengedit soal di paket
-- sengaja tidak mengubah aslinya di bank, dan sebaliknya. Itu perilaku yang
-- diinginkan — satu try out boleh memuat versi soal yang sudah disesuaikan
-- tanpa mengotori korpus bersama.
--
-- `on delete set null`: menghapus soal dari bank tidak boleh ikut menghapus
-- soal di paket yang sudah dikerjakan murid. Yang hilang cuma jejak asalnya.
-- ============================================================

alter table questions
  add column if not exists bank_item_id uuid
  references question_bank_items(id) on delete set null;

create index if not exists questions_bank_item_id_idx
  on questions(bank_item_id) where bank_item_id is not null;
