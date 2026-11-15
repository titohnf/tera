-- ============================================================
-- Gerbang penanggung jawab (FR9) tidak berlaku untuk pelanggan langganan
--
-- Gerbang di migrasi 149/155 menolak membuka paket topik untuk murid yang
-- `learners.tutor_penanggung_jawab_id`-nya kosong. Gerbang itu dibuat untuk
-- murid pilot bimbel, yang memang punya tutor yang menerima eskalasi.
--
-- Pelanggan langganan (role `mandiri`) belajar sendiri dan tidak pernah punya
-- tutor, jadi mereka terkunci dari semua paket dengan pesan "belum punya tutor
-- penanggung jawab" yang tidak bisa mereka bereskan sendiri.
--
-- Perubahan: gerbang dilewati bila pemilik learner-nya berperan `mandiri`.
-- Murid bimbel dan yayasan tetap kena gerbang. Eskalasi untuk pelanggan
-- langganan tetap tercatat, dengan tutor kosong (kolomnya nullable).
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
     and not exists (
       select 1
       from learners l
       join profiles p on p.id = l.profile_id
       where l.id = new.learner_id
         and p.role = 'mandiri'
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
