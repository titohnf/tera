-- ============================================================
-- Fondasi Berhitung jadi kurikulum sendiri, bukan bagian Kelas 11
--
-- Migrasi 100 memasukkan tab "Fondasi Berhitung" (17 pertemuan: penjumlahan
-- sampai rasio) ke Matematika Kelas 11 semester 1 karena belum ada tempat lain.
-- Isinya aritmetika dasar yang dipilih tutor di kelas mana pun, bukan materi
-- kelas 11 — akibatnya anak kelas 11 melihat 38 topik dengan 17 pertama adalah
-- "Penjumlahan Dasar", dan tutor kelas lain tidak bisa memilihnya sama sekali.
--
-- Topiknya dipindah ke kurikulum 'Fondasi Berhitung' dengan grade_level
-- 'Semua Kelas' (lihat lib/curriculum-config.ts). Dipindahkan lewat
-- curriculum_topic_groups, BUKAN dihapus dan dibuat ulang: trigger migrasi 060
-- menyalin perubahannya ke curriculum_topics dan curriculum_resources, dan
-- group_id tidak berubah — jadi materi, bank soal, dan kemajuan siswa yang
-- menunjuk ke topik ini tetap tersambung.
--
-- Dikenali dari tema berawalan 'Dasar:', 'Menengah:', 'Atas:' di Matematika
-- Kelas 11 semester 1 Kurikulum Merdeka (17 grup, dicek di produksi sebelum
-- migrasi ini ditulis). Berhenti kalau jumlahnya bukan 17, daripada memindahkan
-- sesuatu yang tidak dimaksud. Aman dijalankan dua kali: yang kedua tidak
-- menemukan apa-apa lagi dan berhenti dengan pesan, bukan memindahkan ulang.
-- ============================================================

do $$
declare
  v_mtk uuid;
  v_n int;
begin
  select id into v_mtk from subjects where name = 'Matematika';
  if v_mtk is null then
    raise exception 'Mapel Matematika tidak ditemukan';
  end if;

  select count(*) into v_n
  from curriculum_topic_groups
  where subject_id = v_mtk
    and curriculum = 'Kurikulum Merdeka'
    and grade_level = 'Kelas 11'
    and semester = 1
    and (theme like 'Dasar:%' or theme like 'Menengah:%' or theme like 'Atas:%');

  if v_n = 0 then
    raise notice 'Tidak ada topik Fondasi Berhitung di Kelas 11 — sudah dipindahkan?';
    return;
  end if;
  if v_n <> 17 then
    raise exception 'Diharapkan 17 topik Fondasi Berhitung di Kelas 11, ditemukan %', v_n;
  end if;

  update curriculum_topic_groups
  set curriculum = 'Fondasi Berhitung', grade_level = 'Semua Kelas', semester = 1
  where subject_id = v_mtk
    and curriculum = 'Kurikulum Merdeka'
    and grade_level = 'Kelas 11'
    and semester = 1
    and (theme like 'Dasar:%' or theme like 'Menengah:%' or theme like 'Atas:%');

  -- Mapel yang punya topik di kurikulum ini harus mencantumkannya (pola 066).
  update subjects
  set curriculum = array_append(coalesce(curriculum, array[]::text[]), 'Fondasi Berhitung')
  where id = v_mtk
    and not coalesce(curriculum, array[]::text[]) @> array['Fondasi Berhitung'];
end $$;

notify pgrst, 'reload schema';
