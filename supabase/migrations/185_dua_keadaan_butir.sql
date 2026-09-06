-- ============================================================
-- Butir punya dua keadaan, bukan empat tahap
--
-- Migrasi 141 membangun alur verifikasi empat tahap — draf, terverifikasi
-- matematis, direview pedagogis, aktif — dengan trigger yang menolak lompatan
-- lebih dari satu langkah. Alasannya diambil dari Dokumen Fondasi Bagian 3.12,
-- yang menyebut verifikasi matematis independen "wajib, tidak boleh dilewati".
--
-- YANG TERJADI SESUDAHNYA, dan yang membatalkan alur itu: verifikasinya memang
-- dilakukan, tapi TIDAK DI SINI. Naskah butir disusun di luar sistem, kunci
-- numeriknya dihitung ulang secara terpisah sebelum berkasnya ditulis, dan yang
-- sampai ke bank adalah hasil yang sudah diperiksa. Empat tahap di dalam
-- aplikasi kemudian tidak menambah satu pun pemeriksaan; ia menambah dua klik
-- per butir untuk mencatat pemeriksaan yang sudah selesai di tempat lain.
--
-- Buktinya ada di datanya sendiri: seribu butir di bank, TIDAK SATU PUN pernah
-- berada di salah satu dari dua tahap perantara itu. Bukan karena orang
-- melewatinya diam-diam — melainkan karena satu-satunya jalan masuk butir hari
-- ini (impor) mendaratkannya sebagai draf, dan satu-satunya yang berarti
-- sesudah itu adalah "boleh dikerjakan murid atau belum".
--
-- MAKA KEADAANNYA TINGGAL TIGA:
--
--   draf    — sudah di bank, belum sampai ke murid.
--   aktif   — boleh dikerjakan murid.
--   ditarik — dihentikan dari peredaran.
--
-- YANG HILANG, dan dikatakan supaya tidak ditemukan sebagai kejutan: sesudah
-- ini tidak ada lagi jejak di dalam sistem yang membedakan butir yang melewati
-- verifikasi matematis dan review pedagogis dari butir yang langsung
-- diaktifkan. Yang menjamin kuncinya benar sekarang seluruhnya di luar: cara
-- naskahnya disusun, dan pemeriksa impor yang menguji tiap kunci dengan
-- `nilai_jawaban()` sebelum butirnya masuk. Kalau kelak verifikasi dua tangan
-- perlu dicatat di dalam sistem lagi, yang dibangun mestinya JEJAK — siapa
-- memeriksa, kapan — bukan tahapan status yang bisa diklik siapa saja.
--
-- YANG TIDAK BERUBAH: hanya butir `aktif` yang sampai ke murid (FR1).
-- `topik_paket_items` dan `practice_draw_questions` tetap menyaringnya, dan
-- tidak satu pun disentuh di sini.
--
-- Jalankan SESUDAH 184.
-- ============================================================

-- 1. Butir yang tertinggal di tahap perantara ----------------------------------
--
-- Nol baris hari ini. Tetap ditulis supaya migrasi ini benar di lingkungan yang
-- banknya sudah memakai tahapan itu — dan arahnya ke `draf`, bukan ke `aktif`:
-- butir yang belum pernah dinyatakan siap tidak boleh jadi siap karena sebuah
-- migrasi kehabisan kolom untuk menaruhnya.
update question_bank_items
   set status_verifikasi = 'draf'
 where status_verifikasi in ('terverifikasi_matematis', 'direview_pedagogis');

-- 2. Keadaan yang diizinkan ----------------------------------------------------
alter table question_bank_items
  drop constraint if exists question_bank_items_status_verifikasi_check;
alter table question_bank_items
  add constraint question_bank_items_status_verifikasi_check
  check (status_verifikasi in ('draf', 'aktif', 'ditarik'));

comment on column question_bank_items.status_verifikasi is
  'Keadaan butir (FR1): draf, aktif, atau ditarik. Hanya `aktif` yang boleh sampai ke murid.';

-- 3. Perpindahannya ------------------------------------------------------------
--
-- Yang tersisa dari trigger 141 tinggal satu aturan, dan ia satu-satunya yang
-- masih menjaga sesuatu yang nyata: butir yang DITARIK tidak boleh langsung
-- hidup lagi sebagai aktif. Butir ditarik karena ada yang salah padanya —
-- kunci yang keliru, angka yang tidak konsisten — dan menghidupkannya kembali
-- ke tangan murid dengan satu klik yang sama seperti mengaktifkan butir biasa
-- adalah cara paling mudah mengembalikan kesalahan yang baru saja dihentikan.
-- Ia kembali sebagai draf, lalu diaktifkan dengan sadar.
create or replace function jaga_transisi_status_soal()
returns trigger
language plpgsql
as $$
begin
  if new.status_verifikasi is not distinct from old.status_verifikasi then
    return new;
  end if;

  -- Menarik butir dari peredaran selalu boleh: kunci jawaban yang ternyata
  -- salah harus bisa dihentikan detik itu juga, bukan sesudah melewati alur.
  if new.status_verifikasi = 'ditarik' then
    return new;
  end if;

  if old.status_verifikasi = 'ditarik' and new.status_verifikasi <> 'draf' then
    raise exception
      'Butir yang ditarik hanya bisa dihidupkan lagi sebagai draf, bukan langsung ke %',
      new.status_verifikasi;
  end if;

  return new;
end;
$$;

comment on function jaga_transisi_status_soal() is
  'Menjaga satu-satunya perpindahan keadaan butir yang tidak boleh: dari `ditarik` langsung ke `aktif` (migrasi 185). Sisanya bebas.';

notify pgrst, 'reload schema';
