-- ============================================================
-- TKA Matematika SMP (Kelas 9): tambal CP yang belum tercakup
--
-- Latar: hierarki daya serap nasional TP 2025/2026
--   (tka.kemendikdasmen.go.id/hasiltka/daya-serap, sheet "SMP-Matematika",
--   68.144 sekolah / 4.218.005 peserta, diambil 20 Agustus 2026)
-- dicocokkan dengan isi yang ditulis migrasi 068 dari Matriks Asesmen Pusmendik.
--
-- Hasil pencocokan: tema (4) dan sub-elemen (10) sudah sama persis. Yang belum
-- tercakup ada di level CP saja — enam butir di bawah, masing-masing punya soal
-- yang benar-benar keluar di TKA 2025/2026 (nomor soalnya dicatat per baris).
--
-- Yang TIDAK dilakukan di sini, sengaja:
--
--   * Sub-elemen tidak ditambah atau dipindah. Sumber daya serap menaruh
--     kesebangunan/kekongruenan di bawah "Pengukuran" (soal 22), sementara 068
--     menaruhnya di "Objek Geometri" mengikuti Matriks Asesmen. Materinya sama
--     dan sudah ada; memindahkannya hanya akan memutus tag soal yang menempel.
--   * Topik kembar tidak dibuat. Ini alasan yang sama yang membuat migrasi 098
--     membubarkan tema Fase: satu materi yang muncul sebagai dua topik memecah
--     penandaan — materi yang ditempel di satu topik tidak terlihat di
--     kembarannya.
--
-- Penulisan CP mengikuti 068: kalimat pembuka "Memahami, mengaplikasikan, dan
-- bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait cakupan
-- sub-elemen berikut:" sama untuk semua baris, jadi yang disimpan cakupannya.
--
-- Idempoten: hanya menyisipkan CP yang teks persisnya belum ada di group-nya.
-- Group dicari, tidak dibuat: kalau 068 belum pernah dijalankan, sub-elemennya
-- memang belum ada dan menambahkan CP ke group kosong hanya akan bikin baris
-- yatim. Baris seperti itu dilewati dengan notice.
-- ============================================================

do $tkacp$
declare
  v_mtk uuid;
  r record;
  v_group uuid;
begin
  select id into v_mtk from subjects where name = 'Matematika' limit 1;
  if v_mtk is null then
    raise exception 'Mapel Matematika tidak ditemukan. Buat dulu di Admin -> Mapel.';
  end if;

  -- sort_order melanjutkan penomoran lokal per sub-elemen yang dipakai 068
  -- (Bilangan Real terisi 1..6, Fungsi 1, Barisan dan Deret 1..2, Pengukuran 1..2).
  create temp table cp_add (theme text, topic text, ord int, cp text) on commit drop;
  insert into cp_add values
    -- Soal 4: "Mengurutkan bilangan termasuk bilangan bulat dan bilangan
    -- desimal, berdasarkan informasi" (37,08%).
    ('Bilangan', 'Bilangan Real', 7,
     'Mengurutkan bilangan, termasuk bilangan bulat negatif, desimal, persentase, dan pecahan'),

    -- Soal 1 & 5 (34,09% / 37,65%). Di 068 cakupan ini hanya tercatat sebagai
    -- komentar "batasan Pusmendik", tidak pernah masuk baris CP.
    ('Bilangan', 'Bilangan Real', 8,
     'Bilangan berpangkat bulat, bentuk akar, dan bilangan dalam notasi ilmiah'),

    -- Soal 9: "Menyelesaikan permasalahan dengan menerapkan konsep sistem
    -- koordinat kartesius" (43,06%). Tidak ada padanannya sama sekali di 068.
    ('Aljabar', 'Fungsi', 2,
     'Sistem koordinat kartesius'),

    -- Soal 8: "Menginterpretasi grafik fungsi linear ..." (38,66%). CP lama
    -- hanya menyebut "penyajiannya", yang tidak menyebut grafik secara eksplisit.
    ('Aljabar', 'Fungsi', 3,
     'Grafik fungsi linear dan persamaan linear beserta penginterpretasiannya'),

    -- Soal 14 & 15 (41,89% / 40,40%). CP lama hanya menyebut barisan dan deret
    -- sebagai objek, bukan penggeneralisasian polanya.
    ('Aljabar', 'Barisan dan Deret', 3,
     'Menggeneralisasi pola barisan bilangan dan konfigurasi objek'),

    -- Soal 21: "Membandingkan luas juring atau panjang busur pada lingkaran"
    -- (35,23%). CP lama menulis "daerah lingkaran" — luas, bukan busur.
    ('Geometri dan Pengukuran', 'Pengukuran', 3,
     'Luas juring dan panjang busur lingkaran'),

    -- Soal 23 & 24 (34,81% / 35,22%) — dua capaian terendah di seluruh
    -- Matematika SMP. CP lama hanya menyebut volume, tidak luas permukaan.
    ('Geometri dan Pengukuran', 'Pengukuran', 4,
     'Luas permukaan bangun ruang (balok, kubus, dan gabungannya), termasuk konversi satuan baku volume');

  for r in select * from cp_add order by theme, topic, ord loop
    select id into v_group from curriculum_topic_groups
    where curriculum = 'TKA' and subject_id = v_mtk
      and grade_level = 'Kelas 9' and semester = 1
      and theme = r.theme and topic = r.topic;

    if v_group is null then
      raise notice 'Sub-elemen TKA "% / %" belum ada — CP "%" dilewati. Jalankan 068 lebih dulu.',
        r.theme, r.topic, r.cp;
      continue;
    end if;

    insert into curriculum_topics
      (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id)
    select 'TKA', v_mtk, 'Kelas 9', 1, r.theme, r.topic, r.cp, r.ord, v_group
    where not exists (
      select 1 from curriculum_topics ct
      where ct.group_id = v_group and ct.learning_outcomes = r.cp
    );
  end loop;
end $tkacp$;
