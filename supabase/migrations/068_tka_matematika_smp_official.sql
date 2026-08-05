-- ============================================================
-- TKA Matematika SMP: ganti taksonomi usulan dengan Matriks Asesmen resmi
--
-- Sumber:
--   https://pusmendik.kemendikdasmen.go.id/tka/tka/view/mata-pelajaran-wajib/smp/Matematika
--   bagian "Matriks Asesmen" (diambil 5 Agustus 2026)
--
-- Pemetaan ke taksonomi Tera, sesuai kolom di Pusmendik:
--   Elemen/Materi        -> theme  (tema)
--   Sub-elemen/Submateri -> topic  (topik)
--   Kompetensi           -> learning_outcomes (CP), satu baris per butir cakupan
--
-- Yang diganti: 14 topik dari seed 062 adalah USULAN, bukan daftar resmi —
-- header seed itu menyatakannya sendiri. Matriks resmi punya 10 sub-elemen
-- dengan penamaan dan pengelompokan yang berbeda (mis. "Bilangan Bulat dan
-- Pecahan", "Bilangan Berpangkat dan Bentuk Akar", dan "Rasio dan Proporsi"
-- semuanya melebur ke satu sub-elemen "Bilangan Real"). Empat temanya sudah
-- benar dan tidak diubah.
--
-- 14 soal contoh dipetakan ke sub-elemen resminya (tabel `tka_map` di bawah)
-- sebelum group lama dihapus, jadi tidak ada soal yang kehilangan tag. Sesi
-- yang menunjuk baris topik lama juga dipindahkan, supaya `curriculum_topic_id`
-- tidak diam-diam jadi null oleh cascade.
--
-- Tidak ikut dimasukkan: kolom "Batasan/Catatan" milik Bilangan Real dan Data.
-- Skema `curriculum_topics` tidak punya tempat untuk itu, dan menempelkannya
-- sebagai CP akan mencampur dua hal berbeda. Isinya dicatat di komentar tiap
-- sub-elemen di bawah kalau nanti mau ditampilkan.
--
-- Satu koreksi terhadap sumber: Pusmendik menulis "peginterpretasian", diambil
-- di sini sebagai "penginterpretasian". Sisanya verbatim, termasuk ejaan
-- "Linier" pada nama sub-elemen.
-- ============================================================

do $tka$
declare
  v_subject uuid;
  r record;
begin
  select id into v_subject from subjects where name = 'Matematika' limit 1;
  if v_subject is null then
    raise exception 'Subject Matematika tidak ditemukan. Buat dulu di Admin -> Mapel.';
  end if;

  -- Sub-elemen resmi, dengan urutan tampilnya di dalam tema ---------------
  create temp table tka_sub (theme text, topic text, ord int) on commit drop;
  insert into tka_sub values
    ('Bilangan',                 'Bilangan Real',                        1),
    ('Aljabar',                  'Persamaan dan Pertidaksamaan Linier',  1),
    ('Aljabar',                  'Bentuk Aljabar',                       2),
    ('Aljabar',                  'Fungsi',                               3),
    ('Aljabar',                  'Barisan dan Deret',                    4),
    ('Geometri dan Pengukuran',  'Objek Geometri',                       1),
    ('Geometri dan Pengukuran',  'Transformasi Geometri',                2),
    ('Geometri dan Pengukuran',  'Pengukuran',                           3),
    ('Data dan Peluang',         'Data',                                 1),
    ('Data dan Peluang',         'Peluang',                              2);

  -- Topik usulan lama -> sub-elemen resmi yang memuatnya ------------------
  create temp table tka_map (old_topic text, theme text, topic text) on commit drop;
  insert into tka_map values
    ('Bilangan Bulat dan Pecahan',          'Bilangan',                'Bilangan Real'),
    ('Bilangan Berpangkat dan Bentuk Akar', 'Bilangan',                'Bilangan Real'),
    ('Rasio dan Proporsi',                  'Bilangan',                'Bilangan Real'),
    ('Bentuk Aljabar dan Operasinya',       'Aljabar',                 'Bentuk Aljabar'),
    ('Persamaan dan Pertidaksamaan Linear', 'Aljabar',                 'Persamaan dan Pertidaksamaan Linier'),
    ('Sistem Persamaan Linear Dua Variabel','Aljabar',                 'Persamaan dan Pertidaksamaan Linier'),
    ('Relasi dan Fungsi',                   'Aljabar',                 'Fungsi'),
    ('Teorema Pythagoras',                  'Geometri dan Pengukuran', 'Objek Geometri'),
    ('Transformasi Geometri',               'Geometri dan Pengukuran', 'Transformasi Geometri'),
    ('Bangun Datar, Keliling dan Luas',     'Geometri dan Pengukuran', 'Pengukuran'),
    ('Bangun Ruang dan Volume',             'Geometri dan Pengukuran', 'Pengukuran'),
    ('Penyajian dan Pengolahan Data',       'Data dan Peluang',        'Data'),
    ('Ukuran Pemusatan dan Penyebaran',     'Data dan Peluang',        'Data'),
    ('Peluang',                             'Data dan Peluang',        'Peluang');

  -- Kompetensi (CP) per sub-elemen ---------------------------------------
  -- Kalimat pembuka "Memahami, mengaplikasikan, dan bernalar yang lebih tinggi
  -- untuk menyelesaikan permasalahan terkait cakupan sub-elemen berikut:"
  -- sama untuk semua baris di matriks, jadi yang disimpan hanya cakupannya.
  create temp table tka_cp (theme text, topic text, ord int, cp text) on commit drop;
  insert into tka_cp values
    -- Batasan Pusmendik: bilangan bulat, bilangan rasional dan irasional,
    -- bilangan berpangkat bulat, bilangan akar, dan bilangan dalam notasi ilmiah.
    ('Bilangan', 'Bilangan Real', 1, 'Perbandingan dan sifat-sifat bilangan'),
    ('Bilangan', 'Bilangan Real', 2, 'Operasi aritmetika pada bilangan'),
    ('Bilangan', 'Bilangan Real', 3, 'Estimasi/perkiraan hasil perhitungan'),
    ('Bilangan', 'Bilangan Real', 4, 'Faktorisasi prima bilangan asli'),
    ('Bilangan', 'Bilangan Real', 5, 'Rasio (skala, proporsi, dan laju perubahan)'),
    ('Bilangan', 'Bilangan Real', 6, 'Perbandingan senilai dan berbalik nilai'),

    ('Aljabar', 'Persamaan dan Pertidaksamaan Linier', 1, 'Persamaan linear satu variabel'),
    ('Aljabar', 'Persamaan dan Pertidaksamaan Linier', 2, 'Pertidaksamaan linear satu variabel'),
    ('Aljabar', 'Persamaan dan Pertidaksamaan Linier', 3, 'Sistem persamaan linear dua variabel'),
    ('Aljabar', 'Bentuk Aljabar', 1, 'Bentuk aljabar dan sifat-sifat operasinya (komutatif, asosiatif, dan distributif)'),
    ('Aljabar', 'Fungsi', 1, 'Relasi dan fungsi (domain, kodomain, range), serta penyajiannya'),
    ('Aljabar', 'Barisan dan Deret', 1, 'Barisan berhingga bilangan'),
    ('Aljabar', 'Barisan dan Deret', 2, 'Deret berhingga bilangan'),

    ('Geometri dan Pengukuran', 'Objek Geometri', 1, 'Hubungan antar-sudut yang terbentuk oleh dua garis yang berpotongan, dan oleh dua garis sejajar yang dipotong suatu garis transversal (termasuk penentuan besar sudut dalam segitiga)'),
    ('Geometri dan Pengukuran', 'Objek Geometri', 2, 'Teorema Pythagoras'),
    ('Geometri dan Pengukuran', 'Objek Geometri', 3, 'Kekongruenan dan kesebangunan bangun datar'),
    ('Geometri dan Pengukuran', 'Objek Geometri', 4, 'Jaring-jaring bangun ruang (prisma, tabung, limas dan kerucut)'),
    ('Geometri dan Pengukuran', 'Transformasi Geometri', 1, 'Transformasi tunggal (refleksi, translasi, rotasi, dan dilatasi) terhadap titik, garis, dan bangun datar pada bidang'),
    ('Geometri dan Pengukuran', 'Pengukuran', 1, 'Keliling dan luas bangun datar (daerah segi banyak dan daerah lingkaran, serta daerah gabungannya)'),
    ('Geometri dan Pengukuran', 'Pengukuran', 2, 'Volume bangun ruang (prisma, limas, dan bola)'),

    -- Batasan Pusmendik: penyajian data meliputi diagram batang, diagram garis,
    -- diagram lingkaran, dan tabel.
    ('Data dan Peluang', 'Data', 1, 'Perumusan pertanyaan untuk mendapatkan data, serta penyajian, dan penginterpretasian data'),
    ('Data dan Peluang', 'Data', 2, 'Penentuan dan penaksiran rerata (mean), median, modus, dan jangkauan (range) dari data'),
    ('Data dan Peluang', 'Data', 3, 'Perbandingan ukuran pemusatan dan ukuran penyebaran beberapa kelompok data'),
    ('Data dan Peluang', 'Peluang', 1, 'Peluang dan frekuensi relatif dari kejadian tunggal');

  -- 1. Group untuk tiap sub-elemen resmi (dibuat kalau belum ada) ---------
  create temp table tka_group (theme text, topic text, ord int, group_id uuid) on commit drop;
  for r in select * from tka_sub loop
    insert into tka_group values (
      r.theme, r.topic, r.ord,
      curriculum_group_id('TKA', v_subject, 'Kelas 9', 1, r.theme, r.topic)
    );
  end loop;

  -- 2. Tag soal ditambahkan ke group resmi SEBELUM group lama dihapus.
  --    Ditulis sebagai insert, bukan update: beberapa topik lama melebur ke
  --    satu sub-elemen, dan update akan menabrak primary key (item, group)
  --    kalau satu soal kebetulan tertag ke dua topik yang melebur. Tag lamanya
  --    hilang sendiri lewat cascade saat group lama dihapus di langkah 6.
  insert into question_curriculum_tags (question_bank_item_id, group_id)
  select distinct t.question_bank_item_id, ng.group_id
  from question_curriculum_tags t
  join curriculum_topic_groups og on og.id = t.group_id
  join tka_map m on m.old_topic = og.topic
  join tka_group ng on ng.theme = m.theme and ng.topic = m.topic
  where og.curriculum = 'TKA' and og.subject_id = v_subject
  on conflict do nothing;

  -- 3. Sesi yang menunjuk baris topik lama dicatat dulu. Baris itu dihapus di
  --    langkah 4, dan `sessions.curriculum_topic_id` punya `on delete set
  --    null` — tanpa catatan ini, topik sesinya hilang diam-diam.
  create temp table tka_session (session_id uuid, theme text, topic text) on commit drop;
  insert into tka_session
  select s.id, m.theme, m.topic
  from sessions s
  join curriculum_topics ot on ot.id = s.curriculum_topic_id
  join tka_map m on m.old_topic = ot.topic
  where ot.curriculum = 'TKA' and ot.subject_id = v_subject;

  -- 4. Baris isi ditulis ulang dari nol supaya migrasi ini bisa dijalankan
  --    berkali-kali. Tema tidak ikut dihapus: namanya sudah sesuai matriks.
  --
  --    Yang dihapus dibatasi pada 14 topik usulan + 10 sub-elemen resmi.
  --    Menghapus semua topik TKA milik mapel ini akan ikut membuang topik yang
  --    ditambahkan admin sendiri lewat halaman Kurikulum sejak seed dijalankan.
  delete from curriculum_topics
  where curriculum = 'TKA' and subject_id = v_subject and topic is not null
    and (
      topic in (select old_topic from tka_map)
      or topic in (select topic from tka_sub)
    );

  insert into curriculum_topics (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id)
  select 'TKA', v_subject, 'Kelas 9', 1, g.theme, g.topic, null, g.ord, g.group_id
  from tka_group g;

  insert into curriculum_topics (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id)
  select 'TKA', v_subject, 'Kelas 9', 1, c.theme, c.topic, c.cp, c.ord, g.group_id
  from tka_cp c
  join tka_group g on g.theme = c.theme and g.topic = c.topic;

  -- 5. Sesi diarahkan ke baris topik penggantinya.
  update sessions s
  set curriculum_topic_id = nt.id
  from tka_session ts
  join curriculum_topics nt
    on nt.curriculum = 'TKA' and nt.subject_id = v_subject
   and nt.theme = ts.theme and nt.topic = ts.topic and nt.learning_outcomes is null
  where s.id = ts.session_id;

  -- 6. Group usulan yang tidak dipakai lagi. Cascade-nya aman sekarang:
  --    tag dan sesi sudah dipindah, baris isinya sudah ditulis ulang.
  --
  --    Dibatasi ke 14 nama topik usulan, bukan "semua yang bukan resmi":
  --    group buatan admin sendiri harus tetap hidup beserta tag soalnya.
  delete from curriculum_topic_groups g
  where g.curriculum = 'TKA'
    and g.subject_id = v_subject
    and g.topic in (select old_topic from tka_map)
    and not exists (select 1 from tka_group ng where ng.group_id = g.id);
end $tka$;
