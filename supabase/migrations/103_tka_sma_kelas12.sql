-- ============================================================
-- TKA SMA (Kelas 12): Matematika & Bahasa Indonesia
--
-- Sumber: tka.kemendikdasmen.go.id/hasiltka/daya-serap, hierarki daya serap
--   nasional TP 2025/2026, sheet "SMA-Matematika" dan "SMA-Bahasa Indonesia"
--   (23.215 sekolah; 2.033.865 dan 2.034.307 peserta), diambil 20 Agustus 2026.
--
-- Melengkapi 101 (Kelas 6). Dengan migrasi ini ketiga jenjang TKA terisi:
-- Kelas 6 (SD), Kelas 9 (SMP, dari 068 + 096 + 102), Kelas 12 (SMA).
--
-- Pemetaan ke taksonomi Tera, mengikuti tiga level di sumbernya:
--   Level 1 (Kompetensi/Elemen)      -> theme
--   Level 2 (Sub-Kompetensi/Materi)  -> topic
--   Level 3 (Capaian Pembelajaran)   -> learning_outcomes (CP)
--
-- Perbedaan jenjang SMA dari Kelas 9 yang sudah ada — jangan diseragamkan:
--
--   1. Matematika SMA punya sub-elemen "Perbandingan Trigonometri" di bawah
--      Geometri dan Pengukuran; tidak ada padanannya di SMP.
--   2. "Aturan pencacahan (permutasi & kombinasi)" masuk sub-elemen Data, bukan
--      Peluang. Ini ikut sumbernya, meski secara materi terasa dekat ke Peluang.
--   3. Sub-elemen aljabarnya ditulis "Persamaan dan Pertidaksamaan Linear",
--      dengan "Linear". Kelas 9 memakai ejaan "Linier" karena Matriks Asesmen
--      Pusmendik menulisnya begitu (lihat catatan di 068). Keduanya disalin
--      verbatim dari jenjangnya masing-masing, jadi memang beda — bukan typo.
--   4. Bahasa Indonesia SMA tidak punya kolom Level 3, sama seperti SD dan SMP.
--      Jadi tidak ada baris CP; topiknya tetap bisa ditandai ke bank soal &
--      materi, dan CP bisa ditambahkan lewat halaman Kurikulum kalau perlu.
--   5. Sub-kompetensi Bahasa Indonesia SMA berbeda rumusan dari SMP — mis.
--      "kata serapan dari bahasa daerah/asing" (SMP: "istilah dalam berbagai
--      bidang") dan "hubungan makna antarkalimat/antarparagraf" (SMP:
--      "kelogisan hubungan antarperistiwa"). Disalin apa adanya.
--
-- Cakupan: TKA SMA juga punya mapel pilihan (Fisika, Kimia, Biologi, Ekonomi,
-- Sosiologi, dst). Yang diseed di sini hanya dua mapel wajib, sesuai isi sheet.
--
-- Perlakuan teks CP Matematika mengikuti 068 dan 101: kalimat pembuka yang
-- berulang di semua baris — "Kemampuan memahami, mengaplikasikan, dan bernalar
-- yang lebih tinggi untuk menyelesaikan permasalahan terkait ..." — dibuang,
-- yang disimpan cakupannya. Titik di akhir nama topik juga dibuang.
--
-- Idempoten seperti 096 dan 101: baris isi ditulis ulang, group-nya dipakai
-- ulang lewat curriculum_group_id() supaya tag bank soal & materi yang menempel
-- pada topik tidak ikut terhapus oleh cascade.
--
-- semester = 1 hanya pengisi; TKA tidak mengenal semester (lib/curriculum-config.ts).
-- ============================================================

do $tkasma$
declare
  v_mtk uuid;
  v_bin uuid;
  r record;
  v_group uuid;
begin
  select id into v_mtk from subjects where name = 'Matematika' limit 1;
  select id into v_bin from subjects where name = 'Bahasa Indonesia' limit 1;
  if v_mtk is null or v_bin is null then
    raise exception 'Mapel Matematika / Bahasa Indonesia tidak ditemukan. Buat dulu di Admin -> Mapel.';
  end if;

  -- 'M' = Matematika, 'B' = Bahasa Indonesia -----------------------------
  create temp table sma_theme (subj text, theme text, ord int) on commit drop;
  insert into sma_theme values
    ('M', 'Bilangan',                 100),
    ('M', 'Aljabar',                  200),
    ('M', 'Geometri dan Pengukuran',  300),
    ('M', 'Data dan Peluang',         400),
    ('B', 'Pemahaman Tekstual',       100),
    ('B', 'Pemahaman Inferensial',    200),
    ('B', 'Evaluasi dan Apresiasi',   300);

  create temp table sma_topic (subj text, theme text, topic text, ord int) on commit drop;
  insert into sma_topic values
    ('M', 'Bilangan',                'Bilangan Real',                          110),
    ('M', 'Aljabar',                 'Fungsi',                                 210),
    ('M', 'Aljabar',                 'Barisan dan Deret',                      220),
    ('M', 'Aljabar',                 'Persamaan dan Pertidaksamaan Linear',    230),
    ('M', 'Geometri dan Pengukuran', 'Objek Geometri',                         310),
    ('M', 'Geometri dan Pengukuran', 'Transformasi Geometri',                  320),
    ('M', 'Geometri dan Pengukuran', 'Pengukuran',                             330),
    ('M', 'Geometri dan Pengukuran', 'Perbandingan Trigonometri',              340),
    ('M', 'Data dan Peluang',        'Data',                                   410),
    ('M', 'Data dan Peluang',        'Peluang',                                420),

    ('B', 'Pemahaman Tekstual', 'Mengidentifikasi penggunaan kata serapan dari bahasa daerah/asing dalam berbagai bidang', 110),
    ('B', 'Pemahaman Tekstual', 'Mengidentifikasi latar, karakter, dan/atau fenomena berdasarkan kosakata yang digunakan dalam teks fiksi atau nonfiksi', 120),
    ('B', 'Pemahaman Tekstual', 'Menyusun kerangka atau bagan berdasarkan bagian-bagian penting dalam teks', 130),

    ('B', 'Pemahaman Inferensial', 'Menyimpulkan ide pokok, gagasan pendukung, tokoh, peristiwa, latar, konflik, atau nilai-nilai dalam teks', 210),
    ('B', 'Pemahaman Inferensial', 'Menjelaskan hubungan makna antarkalimat dan/atau antarparagraf dalam teks', 220),
    ('B', 'Pemahaman Inferensial', 'Memprediksi lanjutan atau akhir uraian/cerita berdasarkan bagian tertentu dalam teks', 230),

    ('B', 'Evaluasi dan Apresiasi', 'Menilai ketepatan dan kesesuaian penggunaan bahasa dalam teks', 310),
    ('B', 'Evaluasi dan Apresiasi', 'Menyimpulkan respons emosional terhadap unsur puisi, prosa, dan drama', 320),
    ('B', 'Evaluasi dan Apresiasi', 'Menilai relevansi peristiwa dalam teks dengan kehidupan sehari-hari', 330),
    ('B', 'Evaluasi dan Apresiasi', 'Menilai keakuratan, kesesuaian, kecukupan, atau ketepatan informasi dalam teks', 340),
    ('B', 'Evaluasi dan Apresiasi', 'Menilai ketepatan bagian teks untuk menggambarkan karakter, peristiwa, atau latar dalam teks fiksi', 350);

  -- CP hanya untuk Matematika; Bahasa Indonesia SMA tidak punya Level 3.
  create temp table sma_cp (theme text, topic text, ord int, cp text) on commit drop;
  insert into sma_cp values
    ('Bilangan', 'Bilangan Real', 111, 'Jenis dan sifat bilangan'),

    ('Aljabar', 'Fungsi', 211, 'Invers fungsi dan representasinya'),
    ('Aljabar', 'Fungsi', 212, 'Fungsi komposisi dan representasinya'),
    ('Aljabar', 'Barisan dan Deret', 221, 'Barisan dan deret aritmetika'),
    ('Aljabar', 'Barisan dan Deret', 222, 'Barisan dan deret geometri'),
    ('Aljabar', 'Persamaan dan Pertidaksamaan Linear', 231, 'Sistem pertidaksamaan linear multivariabel'),
    ('Aljabar', 'Persamaan dan Pertidaksamaan Linear', 232, 'Program linear'),

    ('Geometri dan Pengukuran', 'Objek Geometri', 311, 'Hubungan dua sudut, dua garis, dan dua bidang'),
    ('Geometri dan Pengukuran', 'Objek Geometri', 312, 'Hubungan objek geometri pada bangun datar dan bangun ruang'),
    ('Geometri dan Pengukuran', 'Objek Geometri', 313, 'Kesebangunan atau kekongruenan bangun datar'),
    ('Geometri dan Pengukuran', 'Objek Geometri', 314, 'Teorema Pythagoras'),
    ('Geometri dan Pengukuran', 'Transformasi Geometri', 321, 'Transformasi geometri (translasi, refleksi, rotasi, dan dilatasi, serta komposisinya) dari titik'),
    ('Geometri dan Pengukuran', 'Pengukuran', 331, 'Jarak dua objek geometri'),
    ('Geometri dan Pengukuran', 'Pengukuran', 332, 'Keliling dan luas bangun datar'),
    ('Geometri dan Pengukuran', 'Pengukuran', 333, 'Volume dan luas permukaan bangun ruang'),
    ('Geometri dan Pengukuran', 'Perbandingan Trigonometri', 341, 'Perbandingan trigonometri (sinus, kosinus, tangen, kotangen, sekan, kosekan)'),

    ('Data dan Peluang', 'Data', 411, 'Penyajian data dalam bentuk diagram batang, diagram garis, diagram lingkaran, grafik, tabel, dan bentuk visual'),
    ('Data dan Peluang', 'Data', 412, 'Aturan pencacahan (aturan penjumlahan, aturan perkalian, permutasi, dan kombinasi)'),
    ('Data dan Peluang', 'Data', 413, 'Ukuran pemusatan dan penyebaran data tunggal dan data kelompok'),
    ('Data dan Peluang', 'Peluang', 421, 'Peluang suatu kejadian tunggal'),
    ('Data dan Peluang', 'Peluang', 422, 'Peluang suatu kejadian majemuk');

  -- Isi lama tema-tema ini dihapus supaya migrasi bisa diulang; group-nya
  -- sengaja dibiarkan hidup (cascade-nya membuang question_curriculum_tags
  -- dan curriculum_resources).
  delete from curriculum_topics ct
  where ct.curriculum = 'TKA'
    and ct.grade_level = 'Kelas 12'
    and (
      (ct.subject_id = v_mtk and ct.theme in (select theme from sma_theme where subj = 'M'))
      or (ct.subject_id = v_bin and ct.theme in (select theme from sma_theme where subj = 'B'))
    );

  -- Baris tema (topic null) — tidak punya group, ditulis langsung.
  insert into curriculum_topics
    (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order)
  select 'TKA', case t.subj when 'M' then v_mtk else v_bin end,
         'Kelas 12', 1, t.theme, null, null, t.ord
  from sma_theme t;

  for r in select * from sma_topic order by subj, ord loop
    v_group := curriculum_group_id(
      'TKA', case r.subj when 'M' then v_mtk else v_bin end,
      'Kelas 12', 1, r.theme, r.topic
    );

    insert into curriculum_topics
      (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id)
    values (
      'TKA', case r.subj when 'M' then v_mtk else v_bin end,
      'Kelas 12', 1, r.theme, r.topic, null, r.ord, v_group
    );

    -- CP milik topik ini (Matematika saja).
    if r.subj = 'M' then
      insert into curriculum_topics
        (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id)
      select 'TKA', v_mtk, 'Kelas 12', 1, c.theme, c.topic, c.cp, c.ord, v_group
      from sma_cp c
      where c.theme = r.theme and c.topic = r.topic;
    end if;
  end loop;
end $tkasma$;

-- Tanpa 'TKA' di subjects.curriculum dan 'SMA' di subjects.level, mapelnya
-- tidak muncul di sidebar halaman Kurikulum: sidebar dibangun dari daftar mapel
-- yang memuat kurikulum aktif dan menyaringnya per jenjang (diturunkan dari
-- nomor kelas, 'Kelas 12' -> SMA), bukan dari topik yang ada. Pola yang sama
-- dipakai untuk SMP di 066/096 dan SD di 101.
update subjects s
set curriculum = array_append(coalesce(s.curriculum, array[]::text[]), 'TKA')
where not coalesce(s.curriculum, array[]::text[]) @> array['TKA']
  and exists (
    select 1 from curriculum_topics ct
    where ct.subject_id = s.id and ct.curriculum = 'TKA'
  );

update subjects s
set level = array_append(coalesce(s.level, array[]::text[]), 'SMA')
where not coalesce(s.level, array[]::text[]) @> array['SMA']
  and exists (
    select 1 from curriculum_topics ct
    where ct.subject_id = s.id and ct.curriculum = 'TKA' and ct.grade_level = 'Kelas 12'
  );
