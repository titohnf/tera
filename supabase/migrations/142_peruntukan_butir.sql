-- ============================================================
-- Butir menyatakan ia ditulis untuk latihan atau untuk ujian
--
-- Protokol Uji Coba Bagian 4 menuntut dua kolam yang EKSKLUSIF: 24 butir
-- latihan dan 12 butir ujian, ditulis sebagai butir yang berbeda sejak awal,
-- bukan dipilih belakangan dari kolam yang sama. Dokumen fondasi Bagian 3.7
-- menyebut alasannya — paket ujian ada untuk memberi satu titik data bersih,
-- dan butir yang sudah pernah dikerjakan sebagai latihan tidak lagi bersih.
--
-- Sampai sekarang niat itu tidak punya tempat tinggal di data. Naskah soal
-- membawanya (field `paket` di berkas JSON tim konten), lalu hilang begitu
-- butirnya masuk bank — dan sesudah 36 butir mendarat, tidak ada lagi yang
-- bisa menjawab 12 mana yang ditulis untuk ujian selain ingatan orang.
--
-- Kolom ini yang menyimpannya, dan nanti FR2 memakainya untuk memvalidasi
-- kedua kolam benar-benar tidak beririsan.
--
-- NULLABLE, dan itu keadaan yang sah: butir di luar pilot — seluruh bank soal
-- Tera yang sudah ada — memang tidak ditulis untuk salah satu kolam. Yang
-- kosong berarti "bukan bagian dari kolam pilot mana pun", bukan "belum
-- diputuskan".
-- ============================================================

alter table question_bank_items
  add column if not exists peruntukan text;

alter table question_bank_items
  drop constraint if exists question_bank_items_peruntukan_check;
alter table question_bank_items
  add constraint question_bank_items_peruntukan_check
  check (peruntukan is null or peruntukan in ('latihan', 'ujian'));

create index if not exists question_bank_items_peruntukan_idx
  on question_bank_items(peruntukan)
  where peruntukan is not null;

comment on column question_bank_items.peruntukan is
  'Kolam tempat butir ini ditulis: latihan atau ujian (Protokol Uji Coba Bagian 4). NULL = di luar cakupan pilot.';

notify pgrst, 'reload schema';
