-- ============================================================
-- TKA Kelas 9: bubarkan tema Fase, satukan ke taksonomi resmi
--
-- Migrasi 095 memasukkan rencana 64 pertemuan sebagai empat tema "Fase 1..4".
-- Hasilnya daftar kurikulum memuat dua sumbu sekaligus: kisi-kisi resmi
-- (apa yang diuji) dan urutan mengajar (kapan diajarkan). Dua sumbu itu banyak
-- beririsan — 29 dari 72 topik pertemuan mengulang materi yang sudah punya
-- sub-elemen/sub-kompetensi resmi, bahkan ada yang namanya nyaris sama
-- ("Menemukan Informasi Tersurat" vs "Mengidentifikasi informasi tersurat",
-- dan "Transformasi Geometri" yang identik). Topik kembar seperti itu memecah
-- penandaan: materi yang ditempel di satu topik tidak muncul di kembarannya.
--
-- Yang dilakukan migrasi ini:
--   1. 29 topik pertemuan yang materinya sudah diwakili matriks resmi dihapus,
--      setelah tag bank soal, materi, dan sesi yang menunjuknya dipindahkan ke
--      sub-elemen/sub-kompetensi resmi yang memuatnya — tidak ada yang hilang.
--   2. 43 topik sisanya — asesmen, latihan soal, simulasi, dan (khusus Bahasa
--      Indonesia) kaidah kebahasaan yang tidak diuji TKA — pindah ke tema baru
--      sesuai sifatnya. Perpindahan dilakukan dengan meng-update group-nya,
--      bukan hapus-buat-ulang, jadi id group (beserta tag & materinya) utuh.
--   3. Keempat tema "Fase 1..4" dihapus.
--
-- Tema baru:
--   Fondasi Kebahasaan & Strategi Membaca  (B. Indonesia saja)  sort 2000
--   Asesmen & Diagnostik                                        sort 3000
--   Latihan Soal Intensif                                       sort 4000
--   Simulasi & Pemantapan                                       sort 5000
-- Semuanya di atas tema resmi (sort 1..33) supaya kisi-kisi tetap tampil dulu.
-- Urutan pertemuan di dalam tema baru tetap terjaga: sort_order lama digeser
-- (sort_order - 100 + base), dan sort_order lama = 100 + nomor pertemuan × 10.
--
-- Catatan tentang "Fondasi Kebahasaan & Strategi Membaca": lima topik di
-- dalamnya (ejaan, kalimat efektif, struktur teks, paragraf, membaca cepat)
-- tidak ada di matriks TKA — TKA Bahasa Indonesia menguji literasi membaca,
-- bukan kaidah kebahasaan. Tetap disimpan karena diajarkan sebagai fondasi.
--
-- Idempoten: semua langkah dicari berdasarkan tema Fase yang sudah tidak ada
-- setelah migrasi ini jalan, jadi eksekusi kedua tidak melakukan apa-apa.
-- Konsekuensinya, migrasi 095 tidak boleh dijalankan ulang setelah ini — ia
-- akan membangun kembali keempat tema Fase beserta seluruh topiknya.
-- ============================================================

do $restruk$
declare
  v_mtk uuid;
  v_bin uuid;
  r record;
  v_group uuid;
  v_old uuid;
  v_new uuid;
  v_topic_row uuid;
begin
  select id into v_mtk from subjects where name = 'Matematika' limit 1;
  select id into v_bin from subjects where name = 'Bahasa Indonesia' limit 1;
  if v_mtk is null or v_bin is null then
    raise exception 'Mapel Matematika / Bahasa Indonesia tidak ditemukan.';
  end if;

  -- Nama tema Fase dari migrasi 095, persis.
  create temp table rs_fase (theme text) on commit drop;
  insert into rs_fase values
    ('Fase 1 — Fondasi (Ags–Okt 2026)'),
    ('Fase 2 — Pendalaman & Perluasan (Nov–Des 2026)'),
    ('Fase 3 — Latihan Soal Intensif (Jan–Feb 2027)'),
    ('Fase 4 — Simulasi & Pemantapan (Mar 2027)');

  -- Tema baru dan urutannya. 'B' = Bahasa Indonesia saja.
  create temp table rs_theme (theme text, base int, only_subj text) on commit drop;
  insert into rs_theme values
    ('Fondasi Kebahasaan & Strategi Membaca', 2000, 'B'),
    ('Asesmen & Diagnostik',                  3000, null),
    ('Latihan Soal Intensif',                 4000, null),
    ('Simulasi & Pemantapan',                 5000, null);

  -- Topik yang dipertahankan: subj, nama lama, nama baru, tema baru, base.
  create temp table rs_keep (subj text, topic text, new_topic text, new_theme text, base int) on commit drop;
  insert into rs_keep values
    ('B', 'Tes Diagnostik & Orientasi TKA', 'Tes Diagnostik & Orientasi TKA', 'Asesmen & Diagnostik', 3000),
    ('B', 'Struktur & Jenis Teks', 'Struktur & Jenis Teks', 'Fondasi Kebahasaan & Strategi Membaca', 2000),
    ('B', 'Ejaan & Tanda Baca (PUEBI Dasar)', 'Ejaan & Tanda Baca (PUEBI Dasar)', 'Fondasi Kebahasaan & Strategi Membaca', 2000),
    ('B', 'Kalimat Efektif & Struktur Kalimat', 'Kalimat Efektif & Struktur Kalimat', 'Fondasi Kebahasaan & Strategi Membaca', 2000),
    ('B', 'Paragraf & Pengembangan Ide', 'Paragraf & Pengembangan Ide', 'Fondasi Kebahasaan & Strategi Membaca', 2000),
    ('B', 'Strategi Membaca Cepat (Skimming-Scanning)', 'Strategi Membaca Cepat (Skimming-Scanning)', 'Fondasi Kebahasaan & Strategi Membaca', 2000),
    ('B', 'Latihan Soal PG Sederhana Campuran', 'Latihan Soal PG Sederhana Campuran', 'Latihan Soal Intensif', 4000),
    ('B', 'Review & Tes Formatif Fase 1', 'Review & Tes Formatif Literasi', 'Asesmen & Diagnostik', 3000),
    ('B', 'Latihan Soal PG Kompleks & Kategori', 'Latihan Soal PG Kompleks & Kategori', 'Latihan Soal Intensif', 4000),
    ('B', 'Latihan Intensif: Teks Informasi', 'Latihan Intensif: Teks Informasi', 'Latihan Soal Intensif', 4000),
    ('B', 'Latihan Intensif: Teks Fiksi', 'Latihan Intensif: Teks Fiksi', 'Latihan Soal Intensif', 4000),
    ('B', 'Latihan Intensif: Kaidah Kebahasaan', 'Latihan Intensif: Kaidah Kebahasaan', 'Latihan Soal Intensif', 4000),
    ('B', 'Latihan Gabungan Semua Topik Bahasa Indonesia', 'Latihan Gabungan Semua Topik Bahasa Indonesia', 'Latihan Soal Intensif', 4000),
    ('B', 'Analisis Kesalahan & Strategi Membaca Efektif', 'Analisis Kesalahan & Strategi Membaca Efektif', 'Latihan Soal Intensif', 4000),
    ('B', 'Try Out Mini Bahasa Indonesia', 'Try Out Mini Bahasa Indonesia', 'Latihan Soal Intensif', 4000),
    ('B', 'Pembahasan Try Out & Remedial Bahasa Indonesia', 'Pembahasan Try Out & Remedial Bahasa Indonesia', 'Latihan Soal Intensif', 4000),
    ('B', 'Latihan Soal HOTS Bahasa Indonesia', 'Latihan Soal HOTS Bahasa Indonesia', 'Latihan Soal Intensif', 4000),
    ('B', 'Simulasi Ujian TKA Penuh #1', 'Simulasi Ujian TKA Penuh #1', 'Simulasi & Pemantapan', 5000),
    ('B', 'Pembahasan Simulasi #1 & Analisis Individual', 'Pembahasan Simulasi #1 & Analisis Individual', 'Simulasi & Pemantapan', 5000),
    ('B', 'Remedial Terfokus (Kelompok Sesuai Kelemahan)', 'Remedial Terfokus (Kelompok Sesuai Kelemahan)', 'Simulasi & Pemantapan', 5000),
    ('B', 'Simulasi Ujian TKA Penuh #2', 'Simulasi Ujian TKA Penuh #2', 'Simulasi & Pemantapan', 5000),
    ('B', 'Pembahasan Simulasi #2 & Strategi Mengerjakan', 'Pembahasan Simulasi #2 & Strategi Mengerjakan', 'Simulasi & Pemantapan', 5000),
    ('B', 'Latihan Terakhir Topik Lemah (Personalisasi)', 'Latihan Terakhir Topik Lemah (Personalisasi)', 'Simulasi & Pemantapan', 5000),
    ('B', 'Simulasi Ujian TKA Penuh #3 (Final Check)', 'Simulasi Ujian TKA Penuh #3 (Final Check)', 'Simulasi & Pemantapan', 5000),
    ('B', 'Pembahasan Final, Kesiapan Teknis & Mental', 'Pembahasan Final, Kesiapan Teknis & Mental', 'Simulasi & Pemantapan', 5000),
    ('M', 'Tes Diagnostik & Pemetaan Awal', 'Tes Diagnostik & Pemetaan Awal', 'Asesmen & Diagnostik', 3000),
    ('M', 'Review & Tes Formatif Fase 1', 'Review & Tes Formatif Numerasi', 'Asesmen & Diagnostik', 3000),
    ('M', 'Latihan Intensif: Bilangan & Aljabar', 'Latihan Intensif: Bilangan & Aljabar', 'Latihan Soal Intensif', 4000),
    ('M', 'Latihan Intensif: Geometri & Pengukuran', 'Latihan Intensif: Geometri & Pengukuran', 'Latihan Soal Intensif', 4000),
    ('M', 'Latihan Intensif: Data & Peluang', 'Latihan Intensif: Data & Peluang', 'Latihan Soal Intensif', 4000),
    ('M', 'Latihan Gabungan Semua Topik Matematika', 'Latihan Gabungan Semua Topik Matematika', 'Latihan Soal Intensif', 4000),
    ('M', 'Analisis Kesalahan & Strategi Eliminasi', 'Analisis Kesalahan & Strategi Eliminasi', 'Latihan Soal Intensif', 4000),
    ('M', 'Try Out Mini Matematika', 'Try Out Mini Matematika', 'Latihan Soal Intensif', 4000),
    ('M', 'Pembahasan Try Out & Remedial Matematika', 'Pembahasan Try Out & Remedial Matematika', 'Latihan Soal Intensif', 4000),
    ('M', 'Latihan Soal HOTS Matematika', 'Latihan Soal HOTS Matematika', 'Latihan Soal Intensif', 4000),
    ('M', 'Simulasi Ujian TKA Penuh #1', 'Simulasi Ujian TKA Penuh #1', 'Simulasi & Pemantapan', 5000),
    ('M', 'Pembahasan Simulasi #1 & Analisis Individual', 'Pembahasan Simulasi #1 & Analisis Individual', 'Simulasi & Pemantapan', 5000),
    ('M', 'Remedial Terfokus (Kelompok Sesuai Kelemahan)', 'Remedial Terfokus (Kelompok Sesuai Kelemahan)', 'Simulasi & Pemantapan', 5000),
    ('M', 'Simulasi Ujian TKA Penuh #2', 'Simulasi Ujian TKA Penuh #2', 'Simulasi & Pemantapan', 5000),
    ('M', 'Pembahasan Simulasi #2 & Strategi Mengerjakan', 'Pembahasan Simulasi #2 & Strategi Mengerjakan', 'Simulasi & Pemantapan', 5000),
    ('M', 'Latihan Terakhir Topik Lemah (Personalisasi)', 'Latihan Terakhir Topik Lemah (Personalisasi)', 'Simulasi & Pemantapan', 5000),
    ('M', 'Simulasi Ujian TKA Penuh #3 (Final Check)', 'Simulasi Ujian TKA Penuh #3 (Final Check)', 'Simulasi & Pemantapan', 5000),
    ('M', 'Pembahasan Final, Kesiapan Teknis & Mental', 'Pembahasan Final, Kesiapan Teknis & Mental', 'Simulasi & Pemantapan', 5000);

  -- Topik yang dibuang karena materinya sudah diwakili matriks resmi, beserta
  -- sub-elemen/sub-kompetensi tujuan pemindahan tag & materinya.
  create temp table rs_dup (subj text, topic text, off_theme text, off_topic text) on commit drop;
  insert into rs_dup values
    ('B', 'Bahasa Kias & Citraan', 'Pemahaman Inferensial', 'Menjelaskan bahasa kias dan citraan (teks fiksi)'),
    ('B', 'Hubungan Logis Antargagasan', 'Pemahaman Inferensial', 'Menjelaskan kelogisan hubungan antarperistiwa/gagasan/informasi'),
    ('B', 'Kosakata & Istilah dalam Konteks', 'Pemahaman Tekstual', 'Mengidentifikasi istilah di berbagai bidang'),
    ('B', 'Membandingkan Informasi Antarteks', 'Evaluasi dan Apresiasi', 'Menilai kesesuaian/keakuratan unsur kebahasaan dan isi antarteks'),
    ('B', 'Memprediksi Peristiwa dalam Teks', 'Pemahaman Inferensial', 'Memprediksi peristiwa'),
    ('B', 'Menanggapi Isi Teks & Respons Emosional', 'Evaluasi dan Apresiasi', 'Menyimpulkan respons emosional terhadap unsur teks fiksi'),
    ('B', 'Menemukan Informasi Tersurat', 'Pemahaman Tekstual', 'Mengidentifikasi informasi tersurat'),
    ('B', 'Menilai Relevansi & Keakuratan Informasi', 'Evaluasi dan Apresiasi', 'Menilai relevansi peristiwa dengan kehidupan sehari-hari'),
    ('B', 'Menyusun Kerangka/Bagan dari Teks', 'Pemahaman Tekstual', 'Menyusun kerangka/bagan dari bagian penting teks'),
    ('B', 'Pemahaman Inferensial — Ide Tersirat', 'Pemahaman Inferensial', 'Menyimpulkan ide pokok/gagasan pendukung/tokoh/peristiwa/latar/nilai (dalam dan antarteks)'),
    ('B', 'Unsur Intrinsik Teks Fiksi (Dasar)', 'Pemahaman Tekstual', 'Mengidentifikasi objek/latar dari kosakata (fiksi/nonfiksi)'),
    ('M', 'Bangun Datar — Keliling & Luas', 'Geometri dan Pengukuran', 'Pengukuran'),
    ('M', 'Bangun Ruang Dasar', 'Geometri dan Pengukuran', 'Pengukuran'),
    ('M', 'Bentuk Aljabar Dasar', 'Aljabar', 'Bentuk Aljabar'),
    ('M', 'Bilangan Berpangkat & Bentuk Akar', 'Bilangan', 'Bilangan Real'),
    ('M', 'Bilangan Bulat', 'Bilangan', 'Bilangan Real'),
    ('M', 'Data — Penyajian & Ukuran Pemusatan', 'Data dan Peluang', 'Data'),
    ('M', 'Kesebangunan & Kekongruenan', 'Geometri dan Pengukuran', 'Objek Geometri'),
    ('M', 'Luas Permukaan & Volume Bangun Ruang', 'Geometri dan Pengukuran', 'Pengukuran'),
    ('M', 'Pecahan & Desimal', 'Bilangan', 'Bilangan Real'),
    ('M', 'Peluang & Soal Kontekstual Gabungan', 'Data dan Peluang', 'Peluang'),
    ('M', 'Persamaan Linear Satu Variabel', 'Aljabar', 'Persamaan dan Pertidaksamaan Linier'),
    ('M', 'Persen, Rasio, dan Perbandingan', 'Bilangan', 'Bilangan Real'),
    ('M', 'Pertidaksamaan Linear Satu Variabel', 'Aljabar', 'Persamaan dan Pertidaksamaan Linier'),
    ('M', 'Pola Bilangan & Barisan', 'Aljabar', 'Barisan dan Deret'),
    ('M', 'Relasi & Fungsi', 'Aljabar', 'Fungsi'),
    ('M', 'Sistem Persamaan Linear Dua Variabel', 'Aljabar', 'Persamaan dan Pertidaksamaan Linier'),
    ('M', 'Teorema Pythagoras', 'Geometri dan Pengukuran', 'Objek Geometri'),
    ('M', 'Transformasi Geometri', 'Geometri dan Pengukuran', 'Transformasi Geometri');

  -- 1. Topik yang dipertahankan: cukup ganti tema (dan nama, untuk dua topik
  --    "Review & Tes Formatif Fase 1" yang namanya menyebut fase). Trigger
  --    sync_curriculum_topic_group mendorong nilai barunya ke curriculum_topics
  --    dan curriculum_resources, jadi tag soal & materi ikut pindah sendiri.
  for r in select * from rs_keep loop
    -- UPDATE ... RETURNING INTO tidak mengosongkan variabelnya kalau tidak ada
    -- baris yang cocok, jadi nilainya harus direset tiap putaran.
    v_group := null;

    update curriculum_topic_groups g
    set theme = r.new_theme, topic = r.new_topic
    where g.curriculum = 'TKA' and g.grade_level = 'Kelas 9'
      and g.subject_id = case r.subj when 'M' then v_mtk else v_bin end
      and g.theme in (select theme from rs_fase)
      and g.topic = r.topic
    returning g.id into v_group;

    -- sort_order lama = 100 + nomor pertemuan × 10 (+1/+2 untuk baris CP),
    -- jadi menggesernya dengan selisih base mempertahankan urutan pertemuan.
    if v_group is not null then
      update curriculum_topics
      set sort_order = sort_order - 100 + r.base
      where group_id = v_group;
    end if;
  end loop;

  -- 2. Topik duplikat: pindahkan dulu semua yang menempel, baru dihapus.
  for r in select * from rs_dup loop
    select id into v_old from curriculum_topic_groups
    where curriculum = 'TKA' and grade_level = 'Kelas 9'
      and subject_id = case r.subj when 'M' then v_mtk else v_bin end
      and theme in (select theme from rs_fase)
      and topic = r.topic;

    continue when v_old is null;

    v_new := curriculum_group_id(
      'TKA', case r.subj when 'M' then v_mtk else v_bin end, 'Kelas 9', 1,
      r.off_theme, r.off_topic
    );

    -- Insert, bukan update: beberapa topik lama melebur ke satu sub-elemen,
    -- dan satu soal bisa tertag ke dua di antaranya. Tag lamanya hilang lewat
    -- cascade saat group lama dihapus di bawah.
    insert into question_curriculum_tags (question_bank_item_id, group_id)
    select question_bank_item_id, v_new
    from question_curriculum_tags where group_id = v_old
    on conflict do nothing;

    update curriculum_resources
    set group_id = v_new, theme = r.off_theme, topic = r.off_topic
    where group_id = v_old;

    -- Sesi menunjuk satu BARIS curriculum_topics, bukan group; arahkan ke baris
    -- topik (learning_outcomes null) milik sub-elemen resminya, kalau tidak
    -- `on delete set null` akan diam-diam mengosongkan topik sesi itu.
    select id into v_topic_row from curriculum_topics
    where group_id = v_new and learning_outcomes is null limit 1;

    if v_topic_row is not null then
      update sessions
      set curriculum_topic_id = v_topic_row
      where curriculum_topic_id in (select id from curriculum_topics where group_id = v_old);
    end if;

    delete from curriculum_topics where group_id = v_old;
    delete from curriculum_topic_groups where id = v_old;
  end loop;

  -- 3. Baris tema Fase (topic null) — tidak punya group, dihapus sendiri.
  delete from curriculum_topics
  where curriculum = 'TKA' and grade_level = 'Kelas 9'
    and subject_id in (v_mtk, v_bin)
    and topic is null
    and theme in (select theme from rs_fase);

  -- 4. Baris tema untuk tema baru, hanya untuk mapel yang benar-benar punya
  --    topik di dalamnya (Fondasi Kebahasaan hanya ada di B. Indonesia).
  insert into curriculum_topics
    (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order)
  select 'TKA', s.subject_id, 'Kelas 9', 1, t.theme, null, null, t.base
  from rs_theme t
  cross join (values (v_mtk, 'M'), (v_bin, 'B')) as s(subject_id, subj)
  where (t.only_subj is null or t.only_subj = s.subj)
    and exists (
      select 1 from curriculum_topics ct
      where ct.curriculum = 'TKA' and ct.grade_level = 'Kelas 9'
        and ct.subject_id = s.subject_id and ct.theme = t.theme and ct.topic is not null
    )
    and not exists (
      select 1 from curriculum_topics ct
      where ct.curriculum = 'TKA' and ct.grade_level = 'Kelas 9'
        and ct.subject_id = s.subject_id and ct.theme = t.theme and ct.topic is null
    );
end $restruk$;
