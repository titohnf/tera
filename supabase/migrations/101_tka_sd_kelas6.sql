-- ============================================================
-- TKA SD (Kelas 6): Matematika & Bahasa Indonesia
--
-- Sumber: tka.kemendikdasmen.go.id/hasiltka/daya-serap, hierarki daya serap
--   nasional TP 2025/2026, sheet "SD-Matematika" (173.265 sekolah / 4.451.475
--   peserta) dan "SD-Bahasa Indonesia" (174.750 sekolah / 4.456.503 peserta),
--   diambil 20 Agustus 2026.
--
-- Sampai migrasi ini, seluruh isi TKA di Tera hanya Kelas 9 (lihat catatan di
-- 066: "kalau nanti Kelas 6 / Kelas 12 diisi..."). Ini mengisi Kelas 6.
--
-- Pemetaan ke taksonomi Tera, mengikuti tiga level di sumbernya:
--   Level 1 (Kompetensi/Elemen)      -> theme
--   Level 2 (Sub-Kompetensi/Materi)  -> topic
--   Level 3 (Capaian Pembelajaran)   -> learning_outcomes (CP)
--
-- Dua hal yang membedakan jenjang SD dari Kelas 9 yang sudah ada:
--
--   1. Matematika SD memakai tema "Data dan Ketidakpastian", BUKAN "Data dan
--      Peluang" seperti SMP. Namanya sengaja dibiarkan beda — itu nama resmi di
--      jenjangnya, dan menyeragamkannya akan salah kutip.
--   2. Bahasa Indonesia SD tidak punya kolom Level 3 sama sekali di sumbernya,
--      persis seperti Bahasa Indonesia SMP di migrasi 096. Jadi tidak ada baris
--      CP; topiknya tetap bisa ditandai ke bank soal & materi, dan CP bisa
--      ditambahkan sendiri lewat halaman Kurikulum kalau nanti diperlukan.
--
-- Perlakuan teks CP Matematika mengikuti 068: sebagian besar CP di sumber
-- diawali kalimat pembuka yang sama persis — "Kemampuan memahami,
-- mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan
-- permasalahan terkait ..." — dan yang disimpan di sini hanya cakupannya.
-- CP yang di sumbernya memang sudah ditulis tanpa pembuka itu disalin verbatim.
-- Tanda titik di akhir nama topik/sub-kompetensi dibuang, mengikuti 096.
--
-- Idempoten dengan cara yang sama seperti 096: baris isi ditulis ulang, tapi
-- group-nya dipakai ulang lewat curriculum_group_id() supaya tag bank soal &
-- materi yang menempel pada topik tidak ikut terhapus oleh cascade.
--
-- semester = 1 hanya pengisi: TKA tidak mengenal semester, tapi kolomnya
-- `not null check (semester in (1, 2))` dan ikut jadi kunci unik group. UI
-- menyembunyikan kontrol semester untuk TKA (lib/curriculum-config.ts).
-- ============================================================

do $tkasd$
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
  create temp table sd_theme (subj text, theme text, ord int) on commit drop;
  insert into sd_theme values
    ('M', 'Bilangan',                 100),
    ('M', 'Geometri dan Pengukuran',  200),
    ('M', 'Data dan Ketidakpastian',  300),
    ('B', 'Pemahaman Tekstual',       100),
    ('B', 'Pemahaman Inferensial',    200),
    ('B', 'Evaluasi dan Apresiasi',   300);

  create temp table sd_topic (subj text, theme text, topic text, ord int) on commit drop;
  insert into sd_topic values
    ('M', 'Bilangan',                'Bilangan Rasional',                110),
    ('M', 'Geometri dan Pengukuran', 'Objek Geometri',                   210),
    ('M', 'Geometri dan Pengukuran', 'Pengukuran',                       220),
    ('M', 'Data dan Ketidakpastian', 'Penyajian dan Penggunaan Data',    310),

    ('B', 'Pemahaman Tekstual', 'Menyusun kembali informasi dari teks dalam bentuk ikhtisar/bagan', 110),
    ('B', 'Pemahaman Tekstual', 'Mengidentifikasi informasi tersurat dalam teks', 120),
    ('B', 'Pemahaman Tekstual', 'Mengidentifikasi objek berdasarkan kosakata yang digunakan dalam teks fiksi atau nonfiksi', 130),

    ('B', 'Pemahaman Inferensial', 'Menjelaskan makna ungkapan yang digunakan dalam teks', 210),
    ('B', 'Pemahaman Inferensial', 'Menyimpulkan ide pokok, gagasan pendukung, amanat, tokoh, peristiwa, dan/atau nilai-nilai dalam teks', 220),
    ('B', 'Pemahaman Inferensial', 'Menyimpulkan perubahan sederhana pada objek, karakter, dan/atau latar dalam teks fiksi atau nonfiksi', 230),

    ('B', 'Evaluasi dan Apresiasi', 'Menilai kesesuaian antarunsur dan/atau antarinformasi dalam teks', 310),
    ('B', 'Evaluasi dan Apresiasi', 'Menilai relevansi peristiwa dalam teks dengan kehidupan sehari-hari berdasarkan pengalaman atau pengetahuan pribadi', 320),
    ('B', 'Evaluasi dan Apresiasi', 'Menyimpulkan respons emosional terhadap unsur teks fiksi', 330);

  -- CP hanya untuk Matematika; Bahasa Indonesia SD tidak punya Level 3.
  create temp table sd_cp (theme text, topic text, ord int, cp text) on commit drop;
  insert into sd_cp values
    ('Bilangan', 'Bilangan Rasional', 111, 'Pecahan senilai menggunakan gambar dan simbol matematika'),
    ('Bilangan', 'Bilangan Rasional', 112, 'Mengurutkan beberapa bilangan yang dinyatakan dalam bentuk berbeda (bilangan cacah, pecahan, desimal, dan persentase)'),
    ('Bilangan', 'Bilangan Rasional', 113, 'Menentukan faktor suatu bilangan cacah dan mengenal bilangan prima'),
    ('Bilangan', 'Bilangan Rasional', 114, 'Menggunakan penjumlahan/pengurangan/perkalian/pembagian dua bilangan cacah (bilangan dan hasil operasi maks. empat angka), termasuk mengestimasi hasil operasi'),
    ('Bilangan', 'Bilangan Rasional', 115, 'Operasi penjumlahan, pengurangan, perkalian, dan pembagian bilangan cacah'),
    ('Bilangan', 'Bilangan Rasional', 116, 'Operasi penjumlahan dan pengurangan bilangan pecahan, serta operasi perkalian dan pembagian bilangan pecahan dengan bilangan asli'),
    ('Bilangan', 'Bilangan Rasional', 117, 'Menyelesaikan persamaan sederhana menggunakan operasi penjumlahan atau pengurangan (dalam bentuk sederhana)'),
    ('Bilangan', 'Bilangan Rasional', 118, 'Menyelesaikan persamaan sederhana menggunakan operasi penjumlahan, pengurangan, perkalian, dan pembagian (dalam bentuk sederhana)'),
    ('Bilangan', 'Bilangan Rasional', 119, 'Menentukan KPK dan FPB'),

    ('Geometri dan Pengukuran', 'Objek Geometri', 211, 'Bentuk bangun datar'),
    ('Geometri dan Pengukuran', 'Objek Geometri', 212, 'Konstruksi bangun ruang dan visualisasi spasial (bagian depan, atas, dan samping)'),
    ('Geometri dan Pengukuran', 'Objek Geometri', 213, 'Mengidentifikasi ciri-ciri dari segiempat, segitiga, segibanyak, dan lingkaran'),

    ('Geometri dan Pengukuran', 'Pengukuran', 221, 'Panjang benda menggunakan satuan baku'),
    ('Geometri dan Pengukuran', 'Pengukuran', 222, 'Berat benda menggunakan satuan baku'),
    ('Geometri dan Pengukuran', 'Pengukuran', 223, 'Volume benda menggunakan satuan baku'),
    ('Geometri dan Pengukuran', 'Pengukuran', 224, 'Menentukan panjang dan berat benda menggunakan satuan baku (termasuk menentukan satuan yang tepat)'),
    ('Geometri dan Pengukuran', 'Pengukuran', 225, 'Waktu'),
    ('Geometri dan Pengukuran', 'Pengukuran', 226, 'Besar sudut'),
    ('Geometri dan Pengukuran', 'Pengukuran', 227, 'Keliling dan luas bangun datar (segitiga, segiempat, dan segi banyak)'),
    ('Geometri dan Pengukuran', 'Pengukuran', 228, 'Menghitung keliling dan luas persegi panjang bila diketahui panjang dan lebarnya, dan menghitung panjang atau lebar bila diketahui luas/keliling dan salah satu sisinya'),

    ('Data dan Ketidakpastian', 'Penyajian dan Penggunaan Data', 311, 'Pengambilan informasi dan penggunaan data'),
    ('Data dan Ketidakpastian', 'Penyajian dan Penggunaan Data', 312, 'Menyajikan, menganalisis, dan menginterpretasi data dalam bentuk diagram batang atau tabel');

  -- Isi lama tema-tema ini dihapus supaya migrasi bisa diulang; group-nya
  -- sengaja dibiarkan hidup (cascade-nya membuang question_curriculum_tags
  -- dan curriculum_resources).
  delete from curriculum_topics ct
  where ct.curriculum = 'TKA'
    and ct.grade_level = 'Kelas 6'
    and (
      (ct.subject_id = v_mtk and ct.theme in (select theme from sd_theme where subj = 'M'))
      or (ct.subject_id = v_bin and ct.theme in (select theme from sd_theme where subj = 'B'))
    );

  -- Baris tema (topic null) — tidak punya group, ditulis langsung.
  insert into curriculum_topics
    (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order)
  select 'TKA', case t.subj when 'M' then v_mtk else v_bin end,
         'Kelas 6', 1, t.theme, null, null, t.ord
  from sd_theme t;

  for r in select * from sd_topic order by subj, ord loop
    v_group := curriculum_group_id(
      'TKA', case r.subj when 'M' then v_mtk else v_bin end,
      'Kelas 6', 1, r.theme, r.topic
    );

    insert into curriculum_topics
      (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id)
    values (
      'TKA', case r.subj when 'M' then v_mtk else v_bin end,
      'Kelas 6', 1, r.theme, r.topic, null, r.ord, v_group
    );

    -- CP milik topik ini (Matematika saja).
    if r.subj = 'M' then
      insert into curriculum_topics
        (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id)
      select 'TKA', v_mtk, 'Kelas 6', 1, c.theme, c.topic, c.cp, c.ord, v_group
      from sd_cp c
      where c.theme = r.theme and c.topic = r.topic;
    end if;
  end loop;
end $tkasd$;

-- Tanpa 'TKA' di subjects.curriculum dan 'SD' di subjects.level, mapelnya tidak
-- muncul di sidebar halaman Kurikulum: sidebar dibangun dari daftar mapel yang
-- memuat kurikulum aktif dan menyaringnya per jenjang (diturunkan dari nomor
-- kelas, 'Kelas 6' -> SD), bukan dari topik yang ada. Pola yang sama sudah
-- dipakai untuk SMP di 066 dan 096.
update subjects s
set curriculum = array_append(coalesce(s.curriculum, array[]::text[]), 'TKA')
where not coalesce(s.curriculum, array[]::text[]) @> array['TKA']
  and exists (
    select 1 from curriculum_topics ct
    where ct.subject_id = s.id and ct.curriculum = 'TKA'
  );

update subjects s
set level = array_append(coalesce(s.level, array[]::text[]), 'SD')
where not coalesce(s.level, array[]::text[]) @> array['SD']
  and exists (
    select 1 from curriculum_topics ct
    where ct.subject_id = s.id and ct.curriculum = 'TKA' and ct.grade_level = 'Kelas 6'
  );
