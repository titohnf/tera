-- ============================================================
-- Kapan sebuah soal terakhir disunting
--
-- `question_bank_items` sejak migrasi 061 hanya mencatat `created_at`. Selama
-- editornya autosave, itu tidak terasa: tiap ketikan langsung mendarat, dan
-- pertanyaan "sudah tersimpan belum?" tidak pernah muncul.
--
-- Editornya sekarang menyimpan hanya saat tombol "Simpan perubahan" ditekan
-- (repo `form`, `bank/BankItem.tsx`), dan pertanyaan itu jadi pertanyaan
-- sungguhan. Penyusun soal butuh melihat kapan terakhir kali soalnya berubah —
-- bukan cuma di sesi yang sedang berjalan, tapi juga saat membukanya lagi
-- besok.
--
-- Diisi trigger, bukan oleh aplikasi: yang menulis ke tabel ini bukan cuma
-- editor soal — ada impor CSV, penyalinan dari paket ke bank, dan suatu saat
-- nanti sesuatu yang belum ditulis. Kolom yang diisi pemanggil akan benar
-- sampai ada satu pemanggil yang lupa.
-- ============================================================

alter table question_bank_items
  add column if not exists updated_at timestamptz not null default now();

-- Soal lama tidak punya riwayat suntingan; kelahirannya adalah keterangan
-- terbaik yang ada.
update question_bank_items set updated_at = created_at where updated_at is null;

drop trigger if exists set_question_bank_items_updated_at on question_bank_items;
create trigger set_question_bank_items_updated_at before update on question_bank_items
  for each row execute function set_updated_at();
