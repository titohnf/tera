-- ============================================================
-- Cetakan status hanya untuk topik yang benar-benar dibuka, dan pengisian
-- pertamanya
--
-- Dua hal yang baru terlihat sesudah migrasi 163-166 berjalan pada data nyata.
--
-- SATU: `evaluasi_unlock` menulis SELURUH topik. Hari ini itu 19 baris per
-- murid, 18 di antaranya `terkunci` untuk topik yang `aktif`-nya masih false —
-- topik yang belum punya satu pun paket berisi dan tidak akan pernah muncul di
-- hadapan murid. Lima murid berarti 95 baris yang 90 di antaranya tidak
-- mengatakan apa-apa, dan rapor tutor menampilkannya sebagai delapan belas
-- baris "Belum waktunya" berjajar di bawah satu baris yang benar-benar berarti.
--
-- Ini persis keadaan yang sudah ditolak migrasi 146 untuk peta murid: "satu
-- kotak berisi dan delapan belas kotak abu-abu — keadaan yang membuat murid
-- merasa aplikasinya rusak, padahal isinya memang belum ditulis." Alasan yang
-- sama berlaku untuk layar tutor.
--
-- FR13 sendiri sudah menuliskannya: untuk Tahap 0 isi tabel ini "cukup satu
-- baris per siswa (`topik_id='D-01'`)". Jadi penyaring di bawah bukan
-- penyempitan cakupan, melainkan mengejar teks yang sudah ada.
--
-- Yang DEFINISINYA tidak disentuh: `status_topik_murid` tetap menghitung
-- seluruh topik, dan memang harus — prasyarat sebuah topik bisa menunjuk topik
-- yang belum aktif, dan menyaringnya di sana akan membuat `siap_dikerjakan`
-- dihitung dari himpunan yang bolong. Yang disaring cuma apa yang DITULIS.
--
-- Baris yang sudah terlanjur ada tetap disegarkan meski topiknya kemudian
-- dinonaktifkan: menghentikan pembaruan sebuah baris yang tetap terbaca di
-- layar lebih buruk daripada menulis satu baris tambahan — ia akan membeku pada
-- keadaan lama tanpa ada yang tahu sejak kapan.
--
-- DUA: tabelnya kosong untuk murid yang sudah terlanjur mengerjakan.
-- `evaluasi_unlock` berjalan dari trigger penyelesaian sesi, jadi 12 sesi yang
-- selesai SEBELUM migrasi 163 tidak pernah melahirkan satu baris pun. Bagian 2
-- mengisinya sekali.
--
-- Jalankan SESUDAH 166.
-- ============================================================

-- 1. Yang ditulis, disaring ---------------------------------------------------

create or replace function evaluasi_unlock(p_learner_id uuid)
returns void
language sql
security definer
set search_path = public
set row_security = off
as $$
  insert into status_topik_siswa (learner_id, topik_id, status)
  select p_learner_id, s.topik_id, s.status
  from status_topik_murid(p_learner_id) s
  join topik t on t.id = s.topik_id
  where t.aktif
     or exists (
       select 1 from status_topik_siswa ada
       where ada.learner_id = p_learner_id and ada.topik_id = s.topik_id
     )
  on conflict (learner_id, topik_id) do update
    set status = excluded.status,
        waktu_perubahan_status = case
          when status_topik_siswa.status is distinct from excluded.status
          then now() else status_topik_siswa.waktu_perubahan_status
        end
    where status_topik_siswa.status is distinct from excluded.status;
$$;

comment on function evaluasi_unlock(uuid) is
  'Menyegarkan cetakan status topik seorang murid (PRD FR13). Hanya topik yang `aktif` — atau yang sudah terlanjur punya baris — yang ditulis; definisinya sendiri tetap menghitung seluruh topik karena prasyarat bisa menunjuk topik yang belum dibuka.';

-- 2. Pengisian pertama --------------------------------------------------------
--
-- Sekali jalan, untuk keadaan yang sudah benar sejak sebelum tabelnya ada.
-- Aman diulang: `evaluasi_unlock` idempoten, dan klausa `where` di dalamnya
-- membuat baris yang statusnya tidak berubah tidak ikut tersentuh — jadi
-- `waktu_perubahan_status` tidak bergeser kalau migrasi ini dijalankan dua kali.
--
-- Ia juga melahirkan `jadwal_retest` lewat trigger untuk topik yang ternyata
-- sudah `tuntas`, dan itu memang yang diinginkan: retest pertamanya dihitung
-- dari hari ini, bukan dari tanggal ketuntasan yang sudah lewat — yang kedua
-- akan melahirkan jadwal yang jatuh temponya sudah lewat sejak detik ia dibuat.
do $$
declare
  v_learner uuid;
begin
  for v_learner in select id from learners loop
    perform evaluasi_unlock(v_learner);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
