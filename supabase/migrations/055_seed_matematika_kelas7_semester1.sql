-- Seed curriculum topics Matematika SMP Kelas 7 Semester 1
-- Kolom Tema -> kolom theme di database
-- Kolom Topik Pembelajaran -> kolom topic di database
-- Kolom Capaian / Fokus Kegiatan Pembelajaran -> kolom learning_outcomes di database

do $$
declare
  matematika_subject_id uuid;
begin
  select id into matematika_subject_id
  from subjects
  where name = 'Matematika'
  limit 1;

  if matematika_subject_id is null then
    raise exception 'Subject Matematika tidak ditemukan';
  end if;

  -- Hapus data lama untuk Kelas 7 Semester 1 jika ada
  delete from curriculum_topics
  where subject_id = matematika_subject_id
    and grade_level = 'Kelas 7'
    and semester = 1;

  -- Insert 23 pertemuan
  insert into curriculum_topics (subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order)
  values
  (matematika_subject_id, 'Kelas 7', 1, 'Bilangan Bulat', 'Pengertian, Penjumlahan, dan Pengurangan', 'Siswa dapat membangun intuisi bilangan bulat, menalar operasi tambah/kurang sebagai "selisih jarak", serta memecahkan soal literasi terkait pergerakan suhu atau kedalaman benda.', 0),
  (matematika_subject_id, 'Kelas 7', 1, 'Bilangan Bulat', 'Perkalian, Pembagian, Pangkat, & Bilangan Prima', 'Siswa dapat menalar pola kelipatan, konsep eksponen, dan bilangan prima, serta membahas soal literasi yang berkaitan dengan pembagian logistik atau pola penyebaran.', 1),
  (matematika_subject_id, 'Kelas 7', 1, 'Bilangan Bulat', 'Faktor (FPB) dan Kelipatan (KPK)', 'Siswa dapat menemukan FPB dan KPK melalui pemahaman pembagi bersama, serta menyelesaikan soal literasi tentang penjadwalan berkala atau pembagian paket bantuan.', 2),
  (matematika_subject_id, 'Kelas 7', 1, 'Bilangan Bulat', 'Pengayaan Terpadu', 'Siswa dapat membahas dan memecahkan soal literasi tingkat lanjut (AKM) terkait analisis grafik, serta mengeksplorasi matriks bilangan dan sifat bilangan untuk fondasi ujian.', 3),
  (matematika_subject_id, 'Kelas 7', 1, 'Bilangan Rasional', 'Pecahan, Lambang, Pecahan Negatif, & Operasi Hitung', 'Siswa dapat memvisualisasikan pecahan, menempatkan pecahan negatif pada garis bilangan, menyelesaikan operasi hitung pecahan dengan penyamaan penyebut logis, serta menelaah soal literasi dari teks narasi/resep.', 4),
  (matematika_subject_id, 'Kelas 7', 1, 'Bilangan Rasional', 'Sifat Operasi dan Urutan Operasi', 'Siswa dapat menerapkan hierarki operasi hitung campuran pada pecahan dan membedah soal literasi terkait tahap penyelesaian masalah keuangan sederhana.', 5),
  (matematika_subject_id, 'Kelas 7', 1, 'Bilangan Rasional', 'Persentase & Bilangan Desimal', 'Siswa dapat menalar kesetaraan desimal dan persen, serta memecahkan soal literasi dalam konteks diskon belanja atau data sensus penduduk.', 6),
  (matematika_subject_id, 'Kelas 7', 1, 'Bilangan Rasional', 'Notasi Ilmiah (Bentuk Baku)', 'Siswa dapat menuliskan angka besar/kecil dengan perpangkatan basis 10 dan mendiskusikan soal literasi dari teks sains (jarak antarplanet atau ukuran sel).', 7),
  (matematika_subject_id, 'Kelas 7', 1, 'Bilangan Rasional', 'Pengayaan Terpadu', 'Siswa dapat memecahkan soal literasi kompleks dari teks instruksional (seperti resep masakan skala besar), serta memecahkan masalah pecahan bertingkat dan desimal berulang.', 8),
  (matematika_subject_id, 'Kelas 7', 1, 'Evaluasi', 'Review Materi Bilangan Bulat', 'Siswa dapat merangkum konsep dasar, menyelesaikan kuis formatif, dan membahas soal literasi terintegrasi untuk memperkuat pemahaman utuh pada materi bilangan bulat.', 9),
  (matematika_subject_id, 'Kelas 7', 1, 'Evaluasi', 'Review Materi Bilangan Rasional', 'Siswa dapat mereview seluruh konsep pecahan, desimal, persentase, dan notasi ilmiah serta membedah soal literasi untuk menguji pemahaman mendalam pada bilangan rasional.', 10),
  (matematika_subject_id, 'Kelas 7', 1, 'Ujian Tengah', 'UTS (Ujian Tengah Semester)', 'Siswa dapat mengerjakan Ujian Tengah Semester yang mengukur penguasaan nalar matematika dan pemecahan masalah literasi secara komprehensif.', 11),
  (matematika_subject_id, 'Kelas 7', 1, 'Rasio', 'Pengertian Perbandingan', 'Siswa dapat memahami konsep dasar membandingkan dua besaran secara logis dan menyimpulkan informasi dari teks literasi yang memuat data statistik dasar.', 12),
  (matematika_subject_id, 'Kelas 7', 1, 'Rasio', 'Perbandingan Senilai & Berbalik Nilai', 'Siswa dapat menalar konsep perbandingan senilai dan berbalik nilai secara intuitif, serta menyelesaikan soal literasi terkait proporsi bahan baku UMKM maupun manajemen waktu proyek.', 13),
  (matematika_subject_id, 'Kelas 7', 1, 'Rasio', 'Skala dan Peta', 'Siswa dapat mengaplikasikan rasio untuk menghitung skala peta dan mengevaluasi soal literasi berbasis teks geografi atau tata letak kota.', 14),
  (matematika_subject_id, 'Kelas 7', 1, 'Rasio', 'Laju Perubahan & Grafik Perbandingan', 'Siswa dapat menganalisis laju perubahan satu variabel terhadap variabel lain, memvisualisasikannya ke dalam grafik linear, serta membaca informasi tersirat dari grafik literasi visual.', 15),
  (matematika_subject_id, 'Kelas 7', 1, 'Rasio', 'Review Materi Rasio', 'Siswa dapat merangkum seluruh konsep perbandingan (senilai dan berbalik nilai), skala peta, serta laju perubahan, menyelesaikan kuis formatif, dan membedah soal literasi terintegrasi untuk memperkuat pemahaman utuh pada materi Rasio.', 16),
  (matematika_subject_id, 'Kelas 7', 1, 'Rasio', 'Pengayaan Terpadu', 'Siswa dapat membahas, mengkritisi, dan menyusun formula matematika dari teks literasi kompleks berbasis data statistik riil atau infografis panjang yang berkaitan dengan aplikasi rasio dan skala.', 17),
  (matematika_subject_id, 'Kelas 7', 1, 'Pengayaan', 'Pengayaan TKA: Bilangan Bulat', 'Siswa dapat membahas dan membedah bedah soal tipe TKA lanjutan khusus untuk materi bilangan bulat, sifat-sifatnya, serta analisis logika kuantitatif.', 18),
  (matematika_subject_id, 'Kelas 7', 1, 'Pengayaan', 'Pengayaan TKA: Bilangan Rasional', 'Siswa dapat mendiskusikan dan menyelesaikan tipe soal TKA yang menguji manipulasi aljabar tingkat lanjut pada bilangan rasional, pecahan bertingkat, dan bentuk baku.', 19),
  (matematika_subject_id, 'Kelas 7', 1, 'Pengayaan', 'Pengayaan TKA: Rasio', 'Siswa dapat menguasai strategi penyelesaian soal TKA tingkat tinggi yang berkaitan dengan pemodelan perbandingan, laju perubahan, dan analisis data rasio.', 20),
  (matematika_subject_id, 'Kelas 7', 1, 'Ujian Akhir', 'AAS (Asesmen Akhir Semester)', 'Siswa dapat mengerjakan Asesmen Akhir Semester yang menguji fondasi nalar dan kemampuan literasi dari Bab 1 hingga Bab 3.', 21),
  (matematika_subject_id, 'Kelas 7', 1, 'Pengayaan', 'Pengayaan: Olimpiade', 'Siswa dapat menyelesaikan soal-soal latihan olimpiade yang berkaitan dengan tema bilangan bulat, bilangan rasional dan rasio.', 22);
end $$;
