-- ============================================================
-- `quizzes.updated_at` — kapan sebuah paket soal terakhir disentuh
--
-- Daftar paket soal di Sora menampilkan "Diperbarui N lalu", dan sampai
-- sekarang satu-satunya stempel waktu yang ada adalah `created_at`. Itu
-- menjawab pertanyaan yang salah: yang dicari admin saat memindai daftar
-- adalah mana yang baru saja dikerjakan, bukan mana yang paling dulu dibuat.
--
-- Dua trigger, bukan satu:
--
--   1. Perubahan pada baris `quizzes` sendiri (judul, deskripsi, pengaturan,
--      status) — pola `set_updated_at()` yang sama dengan tabel lain di Tera.
--   2. Perubahan pada `questions` ikut menaikkan `updated_at` induknya.
--      Tanpa ini stempelnya bohong: menyunting sepuluh soal tidak menyentuh
--      baris `quizzes` sama sekali, padahal itulah pekerjaan yang sebenarnya.
--      Soal disimpan lewat autosave per ketikan (lihat `saveQuestion`), jadi
--      trigger ini memang sering jalan — biayanya satu update satu baris,
--      dan itu sepadan dengan stempel yang jujur.
--
-- Backfill memakai `created_at` supaya tidak ada baris yang tampil kosong
-- sebelum sentuhan berikutnya.
-- ============================================================

alter table quizzes
  add column if not exists updated_at timestamptz not null default now();

update quizzes set updated_at = created_at where updated_at is null;

drop trigger if exists quizzes_updated_at on quizzes;
create trigger quizzes_updated_at
  before update on quizzes
  for each row execute function set_updated_at();

/**
 * Menaikkan `quizzes.updated_at` saat soalnya berubah.
 *
 * `security definer` supaya tutor yang menyunting soal di kuis sesinya tetap
 * bisa menaikkan stempel induknya tanpa perlu hak update penuh atas baris
 * `quizzes` itu.
 */
create or replace function touch_quiz_from_question()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update quizzes
  set updated_at = now()
  where id = coalesce(new.quiz_id, old.quiz_id);
  return coalesce(new, old);
end $$;

drop trigger if exists questions_touch_quiz on questions;
create trigger questions_touch_quiz
  after insert or update or delete on questions
  for each row execute function touch_quiz_from_question();
