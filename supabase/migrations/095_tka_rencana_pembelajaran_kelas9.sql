-- ============================================================
-- TKA Kelas 9: rencana pembelajaran 4 fase (64 pertemuan)
--
-- Sumber: dokumen "Rencana Pembelajaran Bimbel — Persiapan TKA Jenjang SMP"
--   (Kelas 9, Matematika & Bahasa Indonesia, Agustus 2026 – Maret 2027),
--   tabel Fase 1–4 pada bagian 5 s.d. 8.
--
-- Pemetaan ke taksonomi Tera (tema -> topik -> CP):
--   Fase              -> theme
--   Topik pertemuan   -> topic   (urut sesuai nomor pertemuan "Ke-")
--   Fokus/Sub-topik   -> learning_outcomes, baris pertama
--   Aktivitas         -> learning_outcomes, baris kedua ("Aktivitas — ...")
--
-- Untuk Matematika, tema Fase ini BERDAMPINGAN dengan tema resmi Pusmendik
-- (Bilangan, Aljabar, Geometri dan Pengukuran, Data dan Peluang) dari migrasi
-- 068 — dua sumbu yang berbeda: yang satu kisi-kisi ujian, yang satu urutan
-- mengajar. Yang resmi tidak disentuh sama sekali di sini.
--
-- Kolom "Tanggal" tidak ikut disimpan: `curriculum_topics` tidak punya tempat
-- untuk tanggal, dan dokumennya sendiri menyebut tanggal itu hanya pola contoh
-- (Selasa & Jumat) yang harus disesuaikan dengan hari operasional bimbel.
-- Urutan pertemuannya tetap terjaga lewat sort_order.
--
-- sort_order dipakai 100 + nomor pertemuan × 10, dengan CP di +1/+2:
--   - angkanya di atas tema resmi (yang memakai 1..10), jadi tema Fase muncul
--     setelah tema resmi — tabel Kurikulum mengurutkan tema berdasarkan
--     sort_order terkecil di dalamnya;
--   - baris topik selalu mendahului baris CP-nya, karena urutan topik di tabel
--     ditentukan oleh baris mana yang muncul lebih dulu.
--
-- Delapan pertemuan Fase 4 berlabel "Simulasi (M+B)" — mencakup dua mapel
-- sekaligus, jadi topiknya dimasukkan ke Matematika DAN Bahasa Indonesia.
--
-- Idempoten: baris isi keempat tema ini ditulis ulang tiap kali dijalankan,
-- tapi group-nya dipakai ulang lewat curriculum_group_id() — menghapus group
-- akan ikut membuang question_curriculum_tags dan materi yang menempel padanya.
-- ============================================================

do $rencana$
declare
  v_mtk uuid;
  v_bin uuid;
  r record;
  v_group uuid;
  v_base int;
begin
  select id into v_mtk from subjects where name = 'Matematika' limit 1;
  if v_mtk is null then
    raise exception 'Mapel Matematika tidak ditemukan. Buat dulu di Admin -> Mapel.';
  end if;

  select id into v_bin from subjects where name = 'Bahasa Indonesia' limit 1;
  if v_bin is null then
    raise exception 'Mapel Bahasa Indonesia tidak ditemukan. Buat dulu di Admin -> Mapel.';
  end if;

  -- Nama tema per fase ----------------------------------------------------
  create temp table rp_fase (fase int, theme text) on commit drop;
  insert into rp_fase values
    (1, 'Fase 1 — Fondasi (Ags–Okt 2026)'),
    (2, 'Fase 2 — Pendalaman & Perluasan (Nov–Des 2026)'),
    (3, 'Fase 3 — Latihan Soal Intensif (Jan–Feb 2027)'),
    (4, 'Fase 4 — Simulasi & Pemantapan (Mar 2027)');

  -- 64 pertemuan. mapel: 'M' = Matematika, 'B' = Bahasa Indonesia,
  -- 'MB' = simulasi gabungan (masuk ke kedua mapel).
  create temp table rp_meet (
    ke int, fase int, mapel text, topic text, fokus text, aktivitas text
  ) on commit drop;

  insert into rp_meet values
    -- Fase 1 — Fondasi ---------------------------------------------------
    (1, 1, 'M', 'Tes Diagnostik & Pemetaan Awal',
     'Asesmen awal seluruh topik dasar Matematika (bilangan, operasi hitung, aljabar dasar, bangun datar)',
     'Kerjakan tes diagnostik 30 soal; hasil dipakai memetakan kelompok kemampuan siswa'),
    (2, 1, 'B', 'Tes Diagnostik & Orientasi TKA',
     'Asesmen awal membaca teks informasi & fiksi; pengenalan format TKA (jenis soal, durasi, bentuk PG)',
     'Kerjakan tes diagnostik + sesi orientasi: apa itu TKA, kenapa penting, cara kerja CBT'),
    (3, 1, 'M', 'Bilangan Bulat',
     'Operasi hitung campuran, urutan operasi (KABATAKU), bilangan negatif',
     'Drill soal urutan operasi + kuis cepat'),
    (4, 1, 'B', 'Struktur & Jenis Teks',
     'Membedakan teks informasi (nonfiksi) dan teks fiksi; struktur umum tiap jenis teks',
     'Analisis 2 contoh teks pendek, identifikasi ciri masing-masing jenis'),
    (5, 1, 'M', 'Pecahan & Desimal',
     'Operasi pecahan (+,-,×,÷), konversi pecahan-desimal-persen',
     'Latihan soal konversi & operasi campuran'),
    (6, 1, 'B', 'Kosakata & Istilah dalam Konteks',
     'Mengidentifikasi penggunaan istilah di berbagai bidang; makna kata dari konteks kalimat',
     'Latihan menebak makna istilah asing dari teks, cek dengan KBBI'),
    (7, 1, 'M', 'Persen, Rasio, dan Perbandingan',
     'Soal persentase (untung-rugi, diskon), perbandingan senilai & berbalik nilai',
     'Studi kasus kontekstual (belanja, resep, kecepatan)'),
    (8, 1, 'B', 'Menemukan Informasi Tersurat',
     'Mengidentifikasi fakta & informasi eksplisit dalam teks; objek/latar dari kosakata',
     'Latihan cari ''jawaban ada di kalimat mana'' pada teks nonfiksi & fiksi'),
    (9, 1, 'M', 'Bilangan Berpangkat & Bentuk Akar',
     'Sifat-sifat eksponen, operasi bentuk akar sederhana',
     'Latihan soal + game cepat sifat pangkat'),
    (10, 1, 'B', 'Menyusun Kerangka/Bagan dari Teks',
     'Menyusun ulang bagian penting teks menjadi kerangka/bagan/peta konsep',
     'Latihan membuat mind-map dari 1 teks bacaan'),
    (11, 1, 'M', 'Bentuk Aljabar Dasar',
     'Suku, koefisien, variabel; penjumlahan-pengurangan-perkalian bentuk aljabar',
     'Latihan penyederhanaan bentuk aljabar'),
    (12, 1, 'B', 'Unsur Intrinsik Teks Fiksi (Dasar)',
     'Tokoh, latar, alur dalam cerpen/fabel sederhana',
     'Membaca 1 cerpen pendek, isi lembar kerja unsur intrinsik'),
    (13, 1, 'M', 'Persamaan Linear Satu Variabel',
     'Menyelesaikan PLSV, soal cerita sederhana',
     'Latihan soal cerita → model matematika → penyelesaian'),
    (14, 1, 'B', 'Ejaan & Tanda Baca (PUEBI Dasar)',
     'Kesalahan ejaan umum, penggunaan tanda baca dalam kalimat',
     'Latihan koreksi kalimat salah eja/tanda baca'),
    (15, 1, 'M', 'Pertidaksamaan Linear Satu Variabel',
     'Konsep & penyelesaian pertidaksamaan, notasi himpunan penyelesaian',
     'Latihan soal + diskusi perbedaan dengan persamaan'),
    (16, 1, 'B', 'Kalimat Efektif & Struktur Kalimat',
     'Ciri kalimat efektif, kesalahan struktur kalimat (SPOK)',
     'Latihan memperbaiki kalimat tidak efektif'),
    (17, 1, 'M', 'Pola Bilangan & Barisan',
     'Pola bilangan aritmetika sederhana, menemukan suku ke-n',
     'Latihan menemukan pola dari deret angka & gambar'),
    (18, 1, 'B', 'Paragraf & Pengembangan Ide',
     'Ide pokok & gagasan pendukung dalam paragraf; jenis pengembangan paragraf',
     'Latihan menandai ide pokok pada beberapa paragraf'),
    (19, 1, 'M', 'Bangun Datar — Keliling & Luas',
     'Rumus keliling & luas segitiga, persegi, persegi panjang, jajar genjang, trapesium, lingkaran',
     'Latihan soal + soal kontekstual (lahan, taman)'),
    (20, 1, 'B', 'Strategi Membaca Cepat (Skimming-Scanning)',
     'Teknik membaca efisien untuk menjawab soal dalam waktu terbatas',
     'Latihan timed-reading: baca teks 2 menit, jawab 5 soal'),
    (21, 1, 'M', 'Bangun Ruang Dasar',
     'Kubus & balok: unsur, luas permukaan, volume dasar',
     'Latihan soal + membuat jaring-jaring sederhana'),
    (22, 1, 'B', 'Latihan Soal PG Sederhana Campuran',
     'Gabungan topik Fase 1: teks informasi & fiksi, level literal-inferensial dasar',
     'Kerjakan 20 soal PG sederhana bergaya TKA, bahas bersama'),
    (23, 1, 'M', 'Teorema Pythagoras',
     'Konsep & penerapan Pythagoras pada segitiga siku-siku',
     'Latihan soal + penerapan pada soal kontekstual (tangga, jarak)'),
    (24, 1, 'B', 'Review & Tes Formatif Fase 1',
     'Rangkuman seluruh topik literasi Fase 1',
     'Tes formatif 20 soal + pembahasan, catat topik yang masih lemah'),

    -- Fase 2 — Pendalaman & Perluasan -------------------------------------
    -- Pertemuan 25 memang review Fase 1, tapi jatuh di tabel Fase 2 pada
    -- dokumen sumber (pasangan Matematika dari pertemuan 24); dibiarkan apa adanya.
    (25, 2, 'M', 'Review & Tes Formatif Fase 1',
     'Rangkuman seluruh topik numerasi Fase 1 (bilangan s.d. Pythagoras)',
     'Tes formatif 20 soal + pembahasan, catat topik yang masih lemah'),
    (26, 2, 'B', 'Pemahaman Inferensial — Ide Tersirat',
     'Menyimpulkan ide pokok/gagasan yang tidak dinyatakan langsung dalam teks',
     'Latihan soal ''apa maksud tersirat kalimat ini'''),
    (27, 2, 'M', 'Sistem Persamaan Linear Dua Variabel',
     'Metode substitusi & eliminasi, soal cerita SPLDV',
     'Latihan soal cerita kontekstual (harga barang, campuran)'),
    (28, 2, 'B', 'Hubungan Logis Antargagasan',
     'Menjelaskan kelogisan hubungan antarperistiwa/gagasan/informasi dalam & antarteks',
     'Latihan soal sebab-akibat dan urutan logis kejadian'),
    (29, 2, 'M', 'Relasi & Fungsi',
     'Konsep relasi, fungsi, notasi fungsi, nilai fungsi',
     'Latihan menentukan domain-range & menghitung nilai fungsi'),
    (30, 2, 'B', 'Memprediksi Peristiwa dalam Teks',
     'Memprediksi kelanjutan/kemungkinan peristiwa berdasarkan informasi teks',
     'Latihan soal prediksi pada cerpen/fabel'),
    (31, 2, 'M', 'Kesebangunan & Kekongruenan',
     'Syarat kesebangunan & kekongruenan bangun datar, penerapannya',
     'Latihan soal + kasus bayangan/skala peta'),
    (32, 2, 'B', 'Bahasa Kias & Citraan',
     'Majas & citraan dalam puisi/cerpen, efeknya terhadap makna teks',
     'Analisis 1 puisi pendek, identifikasi majas & citraan'),
    (33, 2, 'M', 'Luas Permukaan & Volume Bangun Ruang',
     'Prisma, limas, tabung, kerucut, bola',
     'Latihan soal + soal kontekstual (kemasan, tangki)'),
    (34, 2, 'B', 'Menilai Relevansi & Keakuratan Informasi',
     'Evaluasi kesesuaian informasi dengan konteks & antarteks (nonfiksi)',
     'Latihan soal bandingkan 2 teks berita/artikel sejenis'),
    (35, 2, 'M', 'Transformasi Geometri',
     'Translasi, refleksi, rotasi, dilatasi pada bidang koordinat',
     'Latihan menggambar & menghitung hasil transformasi'),
    (36, 2, 'B', 'Membandingkan Informasi Antarteks',
     'Menilai kesesuaian/keakuratan unsur dan isi antarteks jamak',
     'Latihan soal grup (2 teks sejenis, cari perbedaan sudut pandang)'),
    (37, 2, 'M', 'Data — Penyajian & Ukuran Pemusatan',
     'Diagram batang/garis/lingkaran, tabel; mean, median, modus, jangkauan (elemen resmi: Data dan Peluang)',
     'Latihan baca diagram + hitung ukuran pemusatan'),
    (38, 2, 'B', 'Menanggapi Isi Teks & Respons Emosional',
     'Menanggapi isi teks, merefleksi diri dengan tokoh, respons emosional pada teks fiksi',
     'Diskusi & tulisan singkat tanggapan terhadap cerpen'),
    (39, 2, 'M', 'Peluang & Soal Kontekstual Gabungan',
     'Konsep peluang sederhana; latihan soal numerasi terapan campuran',
     'Latihan soal cerita gabungan lintas topik Fase 2'),
    (40, 2, 'B', 'Latihan Soal PG Kompleks & Kategori',
     'Bentuk soal PG kompleks (benar/salah) & PG kompleks kategori khas TKA',
     'Kerjakan 15 soal format kompleks, bahas strategi menjawabnya'),

    -- Fase 3 — Latihan Soal Intensif --------------------------------------
    (41, 3, 'M', 'Latihan Intensif: Bilangan & Aljabar',
     'Paket soal campuran bilangan-aljabar, dikerjakan dengan waktu terbatas',
     '30 soal timed practice + pembahasan cepat'),
    (42, 3, 'B', 'Latihan Intensif: Teks Informasi',
     'Paket soal berbasis teks nonfiksi/artikel sesuai gaya TKA',
     '30 soal timed practice + pembahasan cepat'),
    (43, 3, 'M', 'Latihan Intensif: Geometri & Pengukuran',
     'Paket soal bangun datar, bangun ruang, Pythagoras, transformasi',
     '30 soal timed practice + pembahasan cepat'),
    (44, 3, 'B', 'Latihan Intensif: Teks Fiksi',
     'Paket soal berbasis cerpen/puisi/fabel sesuai gaya TKA',
     '30 soal timed practice + pembahasan cepat'),
    (45, 3, 'M', 'Latihan Intensif: Data & Peluang',
     'Paket soal elemen Data dan Peluang',
     '30 soal timed practice + pembahasan cepat'),
    (46, 3, 'B', 'Latihan Intensif: Kaidah Kebahasaan',
     'Paket soal ejaan, kalimat efektif, paragraf',
     '30 soal timed practice + pembahasan cepat'),
    (47, 3, 'M', 'Latihan Gabungan Semua Topik Matematika',
     'Simulasi mini per mapel mencakup seluruh materi numerasi',
     '1 set soal gabungan 30 soal/75 menit, sesuai format asli'),
    (48, 3, 'B', 'Latihan Gabungan Semua Topik Bahasa Indonesia',
     'Simulasi mini per mapel mencakup seluruh materi literasi',
     '1 set soal gabungan 30 soal/75 menit, sesuai format asli'),
    (49, 3, 'M', 'Analisis Kesalahan & Strategi Eliminasi',
     'Bedah kesalahan umum siswa dari latihan sebelumnya; teknik eliminasi jawaban',
     'Review kesalahan personal + latihan teknik eliminasi'),
    (50, 3, 'B', 'Analisis Kesalahan & Strategi Membaca Efektif',
     'Bedah kesalahan umum siswa; teknik membaca efektif di bawah tekanan waktu',
     'Review kesalahan personal + latihan strategi baca-jawab cepat'),
    (51, 3, 'M', 'Try Out Mini Matematika',
     'Simulasi 1 sesi penuh Matematika sesuai format TKA (30 soal/75 menit)',
     'Kerjakan try out dalam kondisi mendekati ujian asli'),
    (52, 3, 'B', 'Try Out Mini Bahasa Indonesia',
     'Simulasi 1 sesi penuh Bahasa Indonesia sesuai format TKA (30 soal/75 menit)',
     'Kerjakan try out dalam kondisi mendekati ujian asli'),
    (53, 3, 'M', 'Pembahasan Try Out & Remedial Matematika',
     'Pembahasan lengkap try out mini; remedial topik yang masih lemah per siswa',
     'Pembahasan + latihan remedial terarah'),
    (54, 3, 'B', 'Pembahasan Try Out & Remedial Bahasa Indonesia',
     'Pembahasan lengkap try out mini; remedial topik yang masih lemah per siswa',
     'Pembahasan + latihan remedial terarah'),
    (55, 3, 'M', 'Latihan Soal HOTS Matematika',
     'Soal kontekstual tingkat tinggi (penalaran, pemecahan masalah multi-langkah)',
     'Latihan soal HOTS + diskusi strategi penyelesaian'),
    (56, 3, 'B', 'Latihan Soal HOTS Bahasa Indonesia',
     'Soal evaluasi & refleksi tingkat tinggi (menilai, membandingkan, merefleksi)',
     'Latihan soal HOTS + diskusi strategi menjawab'),

    -- Fase 4 — Simulasi & Pemantapan (gabungan dua mapel) -----------------
    (57, 4, 'MB', 'Simulasi Ujian TKA Penuh #1',
     'Simulasi 2 mapel berurutan, format & durasi mendekati aslinya (120 menit)',
     'Kerjakan simulasi penuh dalam kondisi seperti ujian sesungguhnya'),
    (58, 4, 'MB', 'Pembahasan Simulasi #1 & Analisis Individual',
     'Pembahasan seluruh soal simulasi #1; analisis capaian per siswa per topik',
     'Pembahasan bersama + laporan hasil individual ke siswa/orang tua'),
    (59, 4, 'MB', 'Remedial Terfokus (Kelompok Sesuai Kelemahan)',
     'Pengelompokan siswa berdasarkan topik lemah hasil simulasi #1',
     'Sesi kelompok kecil sesuai kelemahan masing-masing'),
    (60, 4, 'MB', 'Simulasi Ujian TKA Penuh #2',
     'Simulasi 2 mapel berurutan, format & durasi mendekati aslinya (120 menit)',
     'Kerjakan simulasi penuh, ukur progres dibanding simulasi #1'),
    (61, 4, 'MB', 'Pembahasan Simulasi #2 & Strategi Mengerjakan',
     'Pembahasan soal simulasi #2; pemantapan manajemen waktu & teknik menjawab PG kompleks',
     'Pembahasan + latihan simulasi manajemen waktu (120 menit dibagi per mapel)'),
    (62, 4, 'MB', 'Latihan Terakhir Topik Lemah (Personalisasi)',
     'Latihan mandiri terbimbing sesuai kelemahan individual yang masih tersisa',
     'Latihan personal + pendampingan tutor per siswa'),
    (63, 4, 'MB', 'Simulasi Ujian TKA Penuh #3 (Final Check)',
     'Simulasi terakhir sebagai pengecekan kesiapan akhir',
     'Kerjakan simulasi penuh, target: stabil/meningkat dari simulasi #1 & #2'),
    (64, 4, 'MB', 'Pembahasan Final, Kesiapan Teknis & Mental',
     'Pembahasan simulasi #3; briefing teknis CBT (login, token, tata tertib); motivasi menjelang ujian',
     'Pembahasan singkat + sesi briefing & motivasi penutup');

  -- Satu baris per (pertemuan, mapel): 'MB' dipecah jadi dua ---------------
  create temp table rp_row on commit drop as
  select m.ke, f.theme, m.topic, m.fokus, m.aktivitas,
         case s.mapel when 'M' then v_mtk else v_bin end as subject_id
  from rp_meet m
  join rp_fase f on f.fase = m.fase
  cross join lateral (
    select unnest(case when m.mapel = 'MB' then array['M', 'B'] else array[m.mapel] end) as mapel
  ) s;

  -- Isi lama keempat tema ini dihapus supaya migrasi bisa diulang. Group-nya
  -- sengaja tidak ikut dihapus: cascade-nya akan membuang tag soal & materi.
  delete from curriculum_topics ct
  where ct.curriculum = 'TKA'
    and ct.grade_level = 'Kelas 9'
    and ct.subject_id in (v_mtk, v_bin)
    and ct.theme in (select theme from rp_fase);

  -- Baris tema (topic null) — tidak punya group, jadi ditulis langsung.
  -- Alias rr, bukan r: nama itu sudah dipakai variabel record di bawah, dan
  -- plpgsql akan membaca r.subject_id sebagai field record yang belum diisi.
  insert into curriculum_topics
    (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order)
  select 'TKA', rr.subject_id, 'Kelas 9', 1, rr.theme, null, null, 100 + min(rr.ke) * 10 - 5
  from rp_row rr
  group by rr.subject_id, rr.theme;

  -- Baris topik + dua CP-nya.
  for r in select * from rp_row order by subject_id, ke loop
    v_group := curriculum_group_id('TKA', r.subject_id, 'Kelas 9', 1, r.theme, r.topic);
    v_base := 100 + r.ke * 10;

    insert into curriculum_topics
      (curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order, group_id)
    values
      ('TKA', r.subject_id, 'Kelas 9', 1, r.theme, r.topic, null,                          v_base,     v_group),
      ('TKA', r.subject_id, 'Kelas 9', 1, r.theme, r.topic, r.fokus,                       v_base + 1, v_group),
      ('TKA', r.subject_id, 'Kelas 9', 1, r.theme, r.topic, 'Aktivitas — ' || r.aktivitas, v_base + 2, v_group);
  end loop;
end $rencana$;

-- Mapel yang punya topik TKA harus mencantumkan 'TKA' di subjects.curriculum,
-- kalau tidak sidebar halaman Kurikulum tidak memunculkannya sama sekali —
-- sidebar dibangun dari daftar mapel yang memuat kurikulum aktif. Sama untuk
-- jenjang 'SMP' (Kelas 9). Ini yang membuat Bahasa Indonesia ikut terlihat.
update subjects s
set curriculum = array_append(coalesce(s.curriculum, array[]::text[]), 'TKA')
where not coalesce(s.curriculum, array[]::text[]) @> array['TKA']
  and exists (
    select 1 from curriculum_topics ct
    where ct.subject_id = s.id and ct.curriculum = 'TKA'
  );

update subjects s
set level = array_append(coalesce(s.level, array[]::text[]), 'SMP')
where not coalesce(s.level, array[]::text[]) @> array['SMP']
  and exists (
    select 1 from curriculum_topics ct
    where ct.subject_id = s.id and ct.curriculum = 'TKA' and ct.grade_level = 'Kelas 9'
  );
