-- ============================================================
-- `perlu_verifikasi_ulang` dilepas begitu topiknya berhenti tuntas
--
-- Ditemukan saat menguji penjalaran berjenjang pada empat topik (migrasi 169).
-- Rantainya sendiri bekerja persis seperti yang dirancang — D-01 gagal retest,
-- D-02 ditandai; D-02 gagal verifikasi, D-03 dan D-08 ikut ditandai — tapi
-- topik yang JATUH itu tetap membawa penandanya:
--
--   D-02 = butuh_pengulangan + perlu_verifikasi_ulang
--
-- Dokumen Retest Terjadwal Bagian 5.1 menuliskannya eksplisit: mekanisme ini
-- "hanya berlaku untuk topik berstatus `tuntas`". Penanda itu berarti "sudah
-- tuntas, tapi fondasinya diragukan — periksa lagi". Untuk topik yang sudah
-- turun ke `butuh_pengulangan` ia bukan cuma mubazir melainkan salah: tidak
-- ada ketuntasan yang perlu diperiksa ulang, yang ada ketuntasan yang harus
-- dibangun ulang.
--
-- YANG DIRUSAKNYA BUKAN LABEL. Penanda ini punya satu kekuatan yang tidak
-- dimiliki apa pun di jalur retest: ia MENGABAIKAN JADWAL. `retest_jatuh_tempo`
-- menampilkan topik bertanda itu sebagai mendesak, dan `retest_buka_sesi`
-- membukanya hari itu juga meski tanggalnya masih dua minggu lagi. Diuji, dan
-- benar terjadi: D-02 yang berstatus `butuh_pengulangan` dengan jatuh tempo
-- 16 September tetap bisa membuka probe hari ini.
--
-- Akibatnya justru menghapus aturan yang paling ditekankan dokumen itu.
-- Bagian 2.2 mereset interval PENUH ke interval awal saat retest gagal —
-- "supaya siklus pembuktian ulang benar-benar penuh", bukan dikurangi separuh.
-- Penanda yang tertinggal membuat reset itu tidak berarti apa-apa: muridnya
-- boleh mencoba lagi keesokan harinya, dan lima butir probe yang kebetulan
-- lolos mengembalikan topiknya jadi `tuntas` tanpa satu hari pun jeda.
--
-- DIPASANG DI `evaluasi_unlock`, BUKAN DI `catat_hasil_retest`. Yang kedua cuma
-- salah satu jalan sebuah topik bisa berhenti tuntas; yang pertama adalah
-- SATU-SATUNYA tempat status ditulis. Menambal di jalan masuknya berarti
-- menambal lagi setiap kali jalan masuk baru muncul, dan yang terlewat nanti
-- tidak akan terlihat sampai ada yang mengujinya lagi seperti hari ini.
--
-- Jalankan SESUDAH 167.
-- ============================================================

create or replace function evaluasi_unlock(p_learner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
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

  -- Invarian, bukan tambalan: penanda "fondasinya diragukan" tidak punya arti
  -- untuk topik yang ketuntasannya sendiri sudah tidak berlaku. Dijalankan
  -- terhadap SELURUH baris murid ini, bukan hanya yang barusan berubah —
  -- sebuah baris yang penandanya tertinggal dari kejadian lama pun ikut
  -- dibereskan saat murid itu menyelesaikan sesi berikutnya.
  update status_topik_siswa
     set perlu_verifikasi_ulang = false
   where learner_id = p_learner_id
     and perlu_verifikasi_ulang
     and status <> 'tuntas';
end;
$$;

comment on function evaluasi_unlock(uuid) is
  'Menyegarkan cetakan status topik seorang murid (PRD FR13). Hanya topik yang `aktif` — atau yang sudah terlanjur punya baris — yang ditulis. Menegakkan pula invarian FR11: `perlu_verifikasi_ulang` hanya berlaku untuk topik yang berstatus tuntas.';

-- Membereskan baris yang sudah terlanjur salah sebelum perbaikan ini.
update status_topik_siswa
   set perlu_verifikasi_ulang = false
 where perlu_verifikasi_ulang and status <> 'tuntas';

notify pgrst, 'reload schema';
