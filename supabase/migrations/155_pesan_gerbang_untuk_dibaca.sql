-- ============================================================
-- Pesan gerbang penanggung jawab ditulis ulang untuk pembacanya yang sebenarnya
--
-- Migrasi 149 memasang gerbang FR9 dengan pesan yang ditulis untuk pengembang:
-- ia menyebut "PRD FR9" dan menyuruh mengisi data murid. Waktu itu asumsinya
-- pesan itu berhenti di log, karena pemanggilnya menelan galat lalu memakai
-- kalimat umumnya sendiri.
--
-- Asumsi itu salah, dan cara ketahuannya mahal: layar anak berkata "paket ini
-- tidak bisa dikerjakan lagi — sudah benar semua" untuk paket yang belum pernah
-- disentuh siapa pun. Kalimat yang meyakinkan dan sepenuhnya keliru.
--
-- Sisi aplikasi sudah diperbaiki supaya alasan sebenarnya yang muncul. Yang
-- tersisa: alasannya harus berupa kalimat yang pantas dibaca anak sepuluh
-- tahun, bukan nomor pasal dokumen. Isinya tetap sama — apa yang terjadi, dan
-- siapa yang bisa membereskannya.
-- ============================================================

create or replace function jaga_paket_topik_punya_penanggung_jawab()
returns trigger
language plpgsql
as $$
begin
  if new.paket_topik_id is not null
     and not exists (
       select 1 from learners l
       where l.id = new.learner_id
         and l.tutor_penanggung_jawab_id is not null
     )
  then
    raise exception
      'Paket ini belum bisa dibuka karena kamu belum punya tutor penanggung jawab. Beri tahu tutormu ya — ia yang bisa membereskannya.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
