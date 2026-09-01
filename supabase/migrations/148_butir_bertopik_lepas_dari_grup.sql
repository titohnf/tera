-- ============================================================
-- Butir yang sudah masuk peta kompetensi tidak lagi ditandai ke grup kurikulum
--
-- Migrasi 140 menutup catatannya dengan satu tagihan: butir pilot yang berstatus
-- `aktif` akan ikut terundi di latihan bebas, karena seluruh jalur grup menarik
-- soal lewat `question_curriculum_tags`. Untuk 12 butir paket ujian itu fatal —
-- Protokol Uji Coba Bagian 4 menuntut kolam ujian eksklusif, dan butir yang
-- sudah pernah dilihat murid bukan lagi percobaan pertama.
--
-- CARA YANG TIDAK DIPILIH, dan alasannya. Rencana semula menambahkan syarat
-- `b.topik_id is null` ke fungsi-fungsi penyaji. Setelah dihitung, itu berarti
-- menulis ulang tujuh badan fungsi — `practice_draw_questions`,
-- `practice_paket_items`, `practice_topics`, `practice_topic_progress`,
-- `practice_progress`, `practice_subjects`, `practice_summary` — beberapa di
-- antaranya seratus baris lebih. Tujuh salinan berarti tujuh kesempatan salah
-- salin, dan yang kedelapan adalah fungsi yang belum ditulis siapa pun hari ini
-- tapi akan menyalin pola yang sama besok, tanpa syarat itu ikut terbawa.
--
-- YANG DIPILIH: memutus di pangkalnya. Ketujuh fungsi itu sama-sama berpangkal
-- pada `question_curriculum_tags`. Butir yang tidak punya baris di sana tidak
-- terlihat oleh satu pun dari mereka — termasuk oleh fungsi yang belum ada.
-- Invariannya jadi benar dengan sendirinya alih-alih dijaga tujuh kali.
--
-- MENOLAK, BUKAN MENGHAPUS DIAM-DIAM. Trigger ini melempar galat, bukan
-- membuang tagnya tanpa suara. Penandaan yang lenyap tanpa sebab adalah persis
-- jenis kejadian yang membuat orang berhenti mempercayai layarnya sendiri.
-- Sora yang menyesuaikan: butir bertopik tidak lagi ditandai ke grup saat
-- diimpor, dan dijelajahi lewat topiknya.
--
-- AKIBAT YANG DISENGAJA: untuk mapel Matematika, peta kompetensi jadi
-- satu-satunya jalan. Butir bertopik hilang dari latihan bebas, dari kemajuan
-- per topik kurikulum, dan dari rekap yang berpangkal pada tag. Itulah saklar
-- Tahap 4 — bukan efek samping. Mapel yang tidak punya peta (IPA, IPS, Bahasa)
-- tidak tersentuh sama sekali: butirnya tidak punya `topik_id`, jadi trigger
-- ini tidak pernah berbunyi untuk mereka.
-- ============================================================

create or replace function jaga_butir_bertopik_tanpa_grup()
returns trigger
language plpgsql
as $$
declare
  v_topik text;
begin
  select b.topik_id into v_topik
  from question_bank_items b
  where b.id = new.question_bank_item_id;

  if v_topik is not null then
    raise exception
      'Butir ini diukur sebagai % , jadi ia disajikan lewat peta kompetensi — bukan lewat topik kurikulum. Lepas topik pengukurannya dulu kalau memang mau ditandai ke grup.',
      v_topik;
  end if;

  return new;
end;
$$;

drop trigger if exists jaga_butir_bertopik_tanpa_grup on question_curriculum_tags;
create trigger jaga_butir_bertopik_tanpa_grup
  before insert or update on question_curriculum_tags
  for each row execute function jaga_butir_bertopik_tanpa_grup();

-- Arah sebaliknya: memberi topik pengukuran pada butir yang sudah bertag grup.
--
-- Di sini tagnya DIBUANG, dan itu perbedaan yang disengaja dari trigger di
-- atas. Menolak akan memaksa orang membuka layar lain untuk melepas tag sebelum
-- boleh memilih topik — padahal memilih topik ADALAH pernyataan bahwa butir ini
-- pindah ke jalur peta. Yang dibuang pun disebutkan lewat `raise notice`,
-- bukan lenyap tanpa jejak di log.
create or replace function lepaskan_grup_saat_bertopik()
returns trigger
language plpgsql
as $$
declare
  v_dibuang int;
begin
  if new.topik_id is null or new.topik_id is not distinct from old.topik_id then
    return new;
  end if;

  delete from question_curriculum_tags t
  where t.question_bank_item_id = new.id;

  get diagnostics v_dibuang = row_count;
  if v_dibuang > 0 then
    raise notice 'Butir % dilepas dari % tag kurikulum karena kini diukur sebagai %',
      new.id, v_dibuang, new.topik_id;
  end if;

  return new;
end;
$$;

drop trigger if exists lepaskan_grup_saat_bertopik on question_bank_items;
create trigger lepaskan_grup_saat_bertopik
  after update of topik_id on question_bank_items
  for each row execute function lepaskan_grup_saat_bertopik();

notify pgrst, 'reload schema';
