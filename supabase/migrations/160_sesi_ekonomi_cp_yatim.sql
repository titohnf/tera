-- ============================================================
-- Sesi Ekonomi 12 Agustus 2026: CP yatim sisa pemecahan topik
--
-- Migrasi 100 memecah topik Ekonomi Kelas 11 "Konsep Pendapatan Nasional &
-- Pendapatan Per Kapita" menjadi dua topik. Langkah 3 di sana memindahkan
-- `sessions.curriculum_topic_id` ke "Konsep Pendapatan Nasional", lalu langkah
-- 4 menghapus grup versi lama — dan baris CP topik gabungan itu ikut lenyap
-- lewat cascade.
--
-- Yang terlewat: `sessions.selected_cp_ids`. Kolom itu uuid[] tanpa foreign
-- key, jadi tidak ada cascade yang membereskannya; id baris CP yang sudah
-- terhapus tetap duduk di sana. Akibatnya daftar CP di rincian sesi keluarga
-- kosong, sementara tema dan topiknya tetap muncul dari
-- `curriculum_topic_id` yang sehat (lihat lib/actions/jadwal.ts — `cp_list`
-- disusun HANYA dari selected_cp_ids).
--
-- Satu sesi yang kena, dari 516 sesi yang ada saat migrasi ini ditulis.
--
-- Diisi dua topik, bukan satu, karena sesi ini memang membahas keduanya:
-- kolom `topic`-nya masih berbunyi nama gabungan yang lama, dan `cp_urls`-nya
-- berisi dua kunci — grup "Konsep Pendapatan Nasional" dan grup "Pendapatan
-- Per Kapita" (kunci cp_urls adalah group_id, lihat lib/latihan-soal-topics.ts).
--
-- Dicari lewat isi, bukan id sesi: sesi mana pun yang selected_cp_ids-nya
-- menunjuk baris yang tidak ada lagi DAN topik utamanya "Konsep Pendapatan
-- Nasional" adalah korban pemecahan yang sama. Aman diulang — setelah
-- dijalankan tidak ada lagi baris yang cocok.
-- ============================================================

update sessions s
set selected_cp_ids = (
  select array_agg(t.id order by t.sort_order)
  from curriculum_topics t
  where t.subject_id = (select id from subjects where name = 'Ekonomi')
    and t.curriculum = 'Kurikulum Merdeka'
    and t.grade_level = 'Kelas 11'
    and t.semester = 1
    and coalesce(t.theme, '') = 'Pendapatan Nasional'
    and t.topic in ('Konsep Pendapatan Nasional', 'Pendapatan Per Kapita')
)
where s.curriculum_topic_id = (
        select t.id from curriculum_topics t
        where t.subject_id = (select id from subjects where name = 'Ekonomi')
          and t.curriculum = 'Kurikulum Merdeka'
          and t.grade_level = 'Kelas 11'
          and t.semester = 1
          and coalesce(t.theme, '') = 'Pendapatan Nasional'
          and t.topic = 'Konsep Pendapatan Nasional'
      )
  and exists (
        select 1 from unnest(s.selected_cp_ids) as e(id)
        where not exists (select 1 from curriculum_topics t where t.id = e.id)
      );

-- Berhenti kalau ternyata masih ada sesi lain yang menyimpan CP yatim: yang
-- di atas hanya membereskan korban pemecahan topik Ekonomi, dan sisa lain
-- berarti ada sebab kedua yang belum ditelusuri.
do $$
declare
  v_sisa int;
begin
  select count(*) into v_sisa
  from sessions s
  where exists (
    select 1 from unnest(s.selected_cp_ids) as e(id)
    where not exists (select 1 from curriculum_topics t where t.id = e.id)
  );

  if v_sisa > 0 then
    raise exception 'Masih ada % sesi dengan selected_cp_ids yatim di luar sesi Ekonomi', v_sisa;
  end if;
end $$;
