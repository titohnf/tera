-- Seed curriculum topics IPA SMP Kelas 7 Semester 1
-- Kolom Kategori/Bab -> kolom theme di database
-- Kolom Topik Pembelajaran -> kolom topic di database
-- Kolom Capaian / Fokus Kegiatan Pembelajaran -> kolom learning_outcomes di database

do $$
declare
  ipa_subject_id uuid;
begin
  -- Insert subject IPA SMP jika belum ada
  insert into subjects (name, description, level)
  values ('IPA', 'Ilmu Pengetahuan Alam SMP', array['SMP'])
  on conflict do nothing;

  select id into ipa_subject_id
  from subjects
  where name = 'IPA' and 'SMP' = any(level)
  limit 1;

  if ipa_subject_id is null then
    raise exception 'Subject IPA SMP tidak ditemukan setelah insert';
  end if;

  -- Hapus data lama untuk Kelas 7 Semester 1 jika ada
  delete from curriculum_topics
  where subject_id = ipa_subject_id
    and grade_level = 'Kelas 7'
    and semester = 1;

  -- Insert 23 pertemuan
  insert into curriculum_topics (subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order)
  values
  (ipa_subject_id, 'Kelas 7', 1, 'Hakikat Sains dan Percobaan dalam IPA', 'Sains, Metode Ilmiah & Keterampilan Proses', 'Siswa dapat memahami hakikat sains, menalar tahapan metode ilmiah beserta keterampilan proses sains, serta memecahkan soal literasi dari teks penemuan tokoh ilmuwan.', 0),
  (ipa_subject_id, 'Kelas 7', 1, 'Hakikat Sains dan Percobaan dalam IPA', 'Pengukuran Dasar 1: Besaran Pokok & Satuan Baku', 'Siswa dapat melakukan pengukuran besaran pokok (panjang, massa, waktu) dengan alat ukur presisi, menalar pentingnya satuan baku (SI), dan menganalisis teks literasi terkait sejarah standar ukur.', 1),
  (ipa_subject_id, 'Kelas 7', 1, 'Hakikat Sains dan Percobaan dalam IPA', 'Pengukuran Dasar 2: Besaran Turunan & Ketelitian Alat', 'Siswa dapat menalar konsep besaran turunan (mengukur volume benda tak beraturan), membedakan tingkat ketelitian alat ukur, dan membedah teks literasi berupa data manual instrumen laboratorium.', 2),
  (ipa_subject_id, 'Kelas 7', 1, 'Hakikat Sains dan Percobaan dalam IPA', 'Pengayaan Terpadu', 'Siswa dapat membahas dan memecahkan soal literasi tingkat lanjut (AKM) tentang desain eksperimen, serta mengeksplorasi logika ketidakpastian pengukuran untuk fondasi olimpiade dan ujian.', 3),
  (ipa_subject_id, 'Kelas 7', 1, 'Eksplorasi Materi dan Perubahannya', 'Klasifikasi Materi', 'Siswa dapat menalar perbedaan unsur, senyawa, dan campuran, serta membedah soal literasi dari teks infografis mengenai klasifikasi zat di alam.', 4),
  (ipa_subject_id, 'Kelas 7', 1, 'Eksplorasi Materi dan Perubahannya', 'Sifat Materi & Model Partikel', 'Siswa dapat memvisualisasikan model partikel (padat, cair, gas), menalar sifat materi secara mikroskopis, dan menyimpulkan informasi dari teks literasi fenomena alam.', 5),
  (ipa_subject_id, 'Kelas 7', 1, 'Eksplorasi Materi dan Perubahannya', 'Kerapatan (Massa Jenis)', 'Siswa dapat menalar konsep kerapatan massa secara intuitif tanpa bergantung pada hafalan rumus, serta memecahkan soal literasi terkait peristiwa benda mengapung.', 6),
  (ipa_subject_id, 'Kelas 7', 1, 'Eksplorasi Materi dan Perubahannya', 'Perubahan Fisika dan Kimia', 'Siswa dapat membedakan perubahan fisika dan kimia melalui analisis gejala, serta mengevaluasi soal literasi naratif tentang proses pembusukan makanan atau perkaratan.', 7),
  (ipa_subject_id, 'Kelas 7', 1, 'Eksplorasi Materi dan Perubahannya', 'Metode Pemisahan Campuran', 'Siswa dapat menalar berbagai metode pemisahan campuran (filtrasi, distilasi, kromatografi) dan mendiskusikan teks literasi tentang teknologi pengolahan air bersih.', 8),
  (ipa_subject_id, 'Kelas 7', 1, 'Eksplorasi Materi dan Perubahannya', 'Pengayaan Terpadu', 'Siswa dapat membahas dan memecahkan soal literasi kompleks terkait isu lingkungan (pencemaran materi), serta mengeksplorasi analisis grafik wujud zat untuk fondasi pengayaan.', 9),
  (ipa_subject_id, 'Kelas 7', 1, 'Evaluasi', 'Review & Kuis', 'Siswa dapat menyelesaikan kuis formatif dan membedah soal literasi terintegrasi untuk mendiagnosis pemahaman fondasi hakikat sains dan eksplorasi materi.', 10),
  (ipa_subject_id, 'Kelas 7', 1, 'Ujian Tengah', 'UTS (Ujian Tengah Semester)', 'Siswa dapat mengerjakan Ujian Tengah Semester yang mengukur nalar saintifik dan pemecahan masalah literasi secara komprehensif.', 11),
  (ipa_subject_id, 'Kelas 7', 1, 'Konsep Suhu, Pemuaian, dan Kalor', 'Suhu dan Alat Ukurnya', 'Siswa dapat menalar konsep suhu, mengonversi skala dengan logika perbandingan linear (tanpa rumus cepat), dan menganalisis teks literasi terkait data cuaca internasional.', 12),
  (ipa_subject_id, 'Kelas 7', 1, 'Konsep Suhu, Pemuaian, dan Kalor', 'Konsep Pemuaian Benda', 'Siswa dapat menalar fenomena pemuaian pada benda padat, cair, dan gas, serta memecahkan soal literasi mengenai rekayasa konstruksi rel kereta atau jembatan.', 13),
  (ipa_subject_id, 'Kelas 7', 1, 'Konsep Suhu, Pemuaian, dan Kalor', 'Kalor dan Perpindahannya', 'Siswa dapat memahami mekanisme konduksi, konveksi, dan radiasi, menalar keseimbangan energi, serta membedah teks literasi tentang insulasi arsitektur bangunan.', 14),
  (ipa_subject_id, 'Kelas 7', 1, 'Konsep Suhu, Pemuaian, dan Kalor', 'Pengayaan Terpadu', 'Siswa dapat memecahkan soal literasi tingkat lanjut mengenai efisiensi energi termal dan mengeksplorasi penalaran aljabar pada konsep Asas Black.', 15),
  (ipa_subject_id, 'Kelas 7', 1, 'Gerak dan Gaya dalam Kehidupan', 'Mengenal Konsep Gerak', 'Siswa dapat membedakan besaran skalar (jarak) dan vektor (perpindahan), menalar laju gerak lurus, serta memecahkan soal literasi membaca rute peta navigasi.', 16),
  (ipa_subject_id, 'Kelas 7', 1, 'Gerak dan Gaya dalam Kehidupan', 'Pengenalan Gaya', 'Siswa dapat mengidentifikasi berbagai jenis gaya sentuh dan tak sentuh, menggambar resultan gaya, dan membahas soal literasi tentang pentingnya gesekan ban kendaraan.', 17),
  (ipa_subject_id, 'Kelas 7', 1, 'Gerak dan Gaya dalam Kehidupan', 'Menyelisik Hukum I & II Newton', 'Siswa dapat menalar konsep inersia (kelembaman) dan hubungan massa terhadap percepatan, serta menganalisis teks literasi kecelakaan lalu lintas atau fitur keselamatan mobil.', 18),
  (ipa_subject_id, 'Kelas 7', 1, 'Gerak dan Gaya dalam Kehidupan', 'Hukum III Newton & Aplikasinya', 'Siswa dapat mengidentifikasi interaksi gaya aksi-reaksi pada berbagai benda dan membedah soal literasi naratif mengenai prinsip kerja dorongan roket ruang angkasa.', 19),
  (ipa_subject_id, 'Kelas 7', 1, 'Gerak dan Gaya dalam Kehidupan', 'Pengayaan Terpadu', 'Siswa dapat membahas soal literasi analitis dari grafik gerak lurus (v-t), serta mengeksplorasi penalaran sistem interaksi benda pada katrol untuk dasar mekanika tingkat tinggi.', 20),
  (ipa_subject_id, 'Kelas 7', 1, 'Evaluasi', 'Review & Kuis', 'Siswa dapat menyelesaikan kuis formatif dan membedah soal literasi untuk memastikan pemahaman konseptual interaksi energi termal dan mekanika gaya.', 21),
  (ipa_subject_id, 'Kelas 7', 1, 'Ujian Akhir', 'AAS (Asesmen Akhir Semester)', 'Siswa dapat mengerjakan Asesmen Akhir Semester yang menguji fondasi nalar kritis dan kemampuan membaca teks sains dari Bab 1 hingga Bab 4.', 22);
end $$;
