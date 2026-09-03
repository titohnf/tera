-- ============================================================
-- Mengosongkan hasil uji coba pilot, sekali, sebelum butir aslinya masuk
--
-- MENGHAPUS DATA. Bacalah seluruh kepala berkas ini sebelum menjalankannya.
--
-- KENAPA. Migrasi 175 mengubah ARTI angka pilot: sejak ia terpasang, jawaban
-- di paket peta dinilai dengan skema 'pengukuran' — Benar-Salah dikoreksi
-- terhadap tebakan, multi-select dapat nilai sebagian — sedangkan seluruh
-- jawaban SEBELUMNYA dinilai 'sederhana'. `practice_answers.score` disimpan,
-- bukan dihitung ulang, jadi dua arti yang berbeda kini hidup di kolom yang
-- sama. Migrasi 178 menambah satu lapis lagi pada kisi pernyataan.
--
-- Selama keduanya bercampur, tidak ada satu pun angka pilot yang bisa dibaca:
-- Skor Putaran 1 sebuah topik bisa separuh lahir dari aturan lama dan separuh
-- dari aturan baru, dan tidak ada kolom yang menyebut yang mana.
--
-- ALASAN KEDUA, yang tidak kalah penting. `semai_paket_topik` melewati paket
-- yang sudah punya sesi — aturannya sendiri, supaya paket yang sedang
-- dikerjakan murid tidak berubah isinya di tengah jalan. Akibatnya enam paket
-- ujian membeku dengan isi lama: D-02, D-03, D-04, D-08 (dikerjakan sebelum
-- 176) serta D-06 dan D-07 (dikerjakan saat verifikasi 176 dan 177). Keenamnya
-- tidak punya butir C4–C6 maupun butir dua tingkat. Selama sesinya ada, tidak
-- ada cara melengkapinya tanpa mengubah paket yang sudah dikerjakan — dan itu
-- justru yang aturan tadi larang.
--
-- YANG DIHAPUS, dihitung pada 3 September 2026:
--
--   48 sesi jalur peta        paket_topik_id / probe_topik_id / penempatan_topik_id
--   319 jawaban di dalamnya
--   2 baris penempatan_topik
--   42 baris status_topik_siswa (cetakan, disusun ulang sesudah ini)
--   8 baris jadwal_retest
--   3 baris notifikasi_eskalasi
--
-- YANG TIDAK DISENTUH:
--
--   6 sesi latihan biasa      tidak berpangkal pada paket peta — jalur kurikulum
--                             dan kuis tutor tidak pernah memakai skema
--                             'pengukuran', jadi angkanya tidak pernah ambigu
--   seluruh bank soal         butir, paket, dan keanggotaannya tetap
--   seluruh kolam probe        `item_probe` tetap
--
-- TIGA MURID KEHILANGAN RIWAYAT PETANYA, dan satu di antaranya bukan murid uji:
--
--   M Hafidz Alfatih   16 sesi   ← MURID SUNGGUHAN
--   UJI Peta QA        31 sesi
--   UJI Sampel QA       1 sesi
--
-- Riwayat Hafidz adalah riwayat uji coba: seluruhnya dikerjakan di atas butir
-- dummy migrasi 169/171, dan seluruhnya dinilai dengan skema yang sejak 175
-- dinyatakan tidak memadai untuk pengukuran. Menyimpannya bukan menyelamatkan
-- capaian anak itu, melainkan menyimpan angka yang tidak bisa dibaca lagi.
-- Kalau itu dinilai keliru, JANGAN jalankan berkas ini — hapus dulu klausa
-- yang menyebut dirinya di bagian 1, lalu terima bahwa enam paket ujian tetap
-- beku dan angka lamanya tetap bercampur.
--
-- JEJAK ESKALASI IKUT DIHAPUS, dan itu melanggar janji yang dibuat migrasi 149.
-- Tabel `notifikasi_eskalasi` dijaga trigger append-only justru supaya tidak
-- ada yang bisa menghapus bukti bahwa SOP-nya pernah dijalankan — termasuk
-- admin. Di sini trigger itu dimatikan sebentar, dan alasannya harus lebih
-- kuat daripada kenyamanan: tiga baris itu menunjuk paket dan skor yang
-- detik berikutnya tidak ada lagi, dan `status_topik_murid` membaca eskalasi
-- yang belum direspons untuk menahan topik di keadaan `eskalasi_tutor`.
-- Membiarkannya berarti tiga topik terkunci selamanya di keadaan yang
-- pemicunya sudah tidak bisa ditelusuri. Jejak yang menunjuk ke ruang kosong
-- bukan jejak audit; ia cuma sisa.
--
-- SEKALI PAKAI. Berkas ini bukan alat pembersih yang boleh dijalankan lagi
-- kapan-kapan. Sesudah pilot memakai butir sungguhan, menjalankannya berarti
-- menghapus capaian anak yang benar-benar diukur.
--
-- Jalankan SESUDAH 178.
-- ============================================================

-- 0. Siapa yang terdampak, dicatat SEBELUM datanya hilang ----------------------
--
-- Dipakai bagian 4 untuk menyusun ulang cetakan status. Harus diambil sekarang:
-- sesudah bagian 1 tidak ada lagi cara mengetahui murid mana yang punya peta.
--
-- Dan harus DIBATASI pada mereka. `evaluasi_unlock` menulis satu baris untuk
-- setiap topik yang aktif, jadi memanggilnya untuk seluruh murid akan
-- melahirkan sembilan belas baris status bagi anak yang tidak pernah membuka
-- peta sama sekali — kebisingan baru yang lahir dari pembersihan.
--
-- Tanpa `on commit drop`: berkas ini dijalankan lewat editor SQL yang tidak
-- selalu membungkus seluruh skripnya dalam satu transaksi, dan tabel yang
-- lenyap begitu pernyataan pertamanya selesai akan membuat bagian 4 gagal
-- dengan galat yang menyesatkan. Dibuang eksplisit di ujung berkas.
drop table if exists murid_terdampak;
create temp table murid_terdampak as
select distinct s.learner_id
from practice_sessions s
where s.paket_topik_id is not null
   or s.probe_topik_id is not null
   or s.penempatan_topik_id is not null;

-- 1. Sesi jalur peta dan jawabannya --------------------------------------------
--
-- Jawabannya dihapus lebih dulu dan eksplisit, tidak bersandar pada cascade:
-- yang dihapus di sini nilai anak, dan bersandar pada perilaku yang tidak
-- terlihat di berkas ini membuat pembacanya tidak tahu apa yang sebenarnya
-- hilang.
delete from practice_answers a
where exists (
  select 1 from practice_sessions s
  where s.id = a.session_id
    and (s.paket_topik_id is not null
      or s.probe_topik_id is not null
      or s.penempatan_topik_id is not null)
);

delete from practice_sessions s
where s.paket_topik_id is not null
   or s.probe_topik_id is not null
   or s.penempatan_topik_id is not null;

-- 2. Keadaan turunan -----------------------------------------------------------
--
-- Semuanya dihitung DARI sesi yang barusan hilang, jadi tidak ada satu pun
-- yang masih punya dasar. `status_topik_siswa` cetakan, bukan sumber — ia
-- disusun ulang di bagian 4.
delete from penempatan_topik;
delete from jadwal_retest;
delete from paket_topik_kunci;
delete from status_topik_siswa;

-- 3. Jejak eskalasi ------------------------------------------------------------
--
-- Trigger append-only dimatikan seukur satu pernyataan, lalu dinyalakan lagi
-- di baris berikutnya. Alasannya di kepala berkas; yang penting di sini adalah
-- ia TIDAK dibiarkan mati.
alter table notifikasi_eskalasi disable trigger jaga_eskalasi_append_only;
delete from notifikasi_eskalasi;
alter table notifikasi_eskalasi enable trigger jaga_eskalasi_append_only;

-- 4. Paket disusun ulang, dan petanya dihitung ulang ---------------------------
do $$
declare
  v_topik text;
  v_murid uuid;
begin
  -- Tidak ada lagi paket yang punya sesi, jadi `semai_paket_topik` kini
  -- menyentuh SEMUANYA — termasuk enam paket ujian yang tadi beku. Sesudah ini
  -- kesembilan belas paket ujian memuat kolam penuh C1–C6 berikut butir dua
  -- tingkatnya, dan menyajikan dua belas di antaranya per murid (177).
  foreach v_topik in array array['D-01','D-02','D-03','D-04','D-05','D-06','D-07','D-08','D-09','D-10','D-11','D-12','D-13','D-14','D-15','D-16','D-17','D-18','D-19'] loop
    perform semai_paket_topik(v_topik);
  end loop;

  -- Cetakan status disusun ulang untuk tiap murid yang punya peta. Tanpa ini
  -- layarnya kosong sampai ada yang kebetulan memicunya, dan "kosong" terbaca
  -- sebagai galat, bukan sebagai awal yang bersih.
  for v_murid in select learner_id from murid_terdampak loop
    perform evaluasi_unlock(v_murid);
  end loop;
end;
$$;

-- 5. Murid uji yang saya buat sendiri ------------------------------------------
--
-- `UJI Sampel QA` lahir hanya untuk membuktikan bahwa sampel ujian 177 berbeda
-- antar-murid — dua belas butir milik murid A dibandingkan dengan milik murid
-- B. Pekerjaannya selesai, dan sebuah murid palsu yang tertinggal di daftar
-- akan ditemukan seseorang bulan depan sebagai anak yang tidak pernah hadir.
--
-- `UJI Peta QA` TIDAK dihapus: ia sudah ada sebelum sesi ini dan dipakai
-- pengujian lain.
delete from learners where access_code = 'UJI-SAMPEL-QA';

drop table if exists murid_terdampak;

notify pgrst, 'reload schema';
