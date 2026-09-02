-- ============================================================
-- CP untuk 11 sub-kompetensi Bahasa Indonesia TKA Kelas 9
--
-- Migrasi 096 memasukkan matriks Pusmendik Bahasa Indonesia sebagai tema
-- (kompetensi) dan topik (sub-kompetensi), dan sengaja membiarkan kolom CP-nya
-- kosong: matriks itu memang berhenti di dua tingkat, tidak punya kolom lingkup
-- materi seperti matriks Matematika di migrasi 068 — dan kolom itulah yang di
-- sana menjadi baris CP.
--
-- Akibatnya 11 sub-kompetensi ini satu-satunya bagian kurikulum Bahasa
-- Indonesia Kelas 9 yang tidak punya CP sama sekali; 50 baris CP lain yang ada
-- semuanya milik rencana pembelajaran Fase 1-4 dari migrasi 095.
--
-- PENTING — rumusan di bawah BUKAN kutipan dari Pusmendik. Sumbernya tidak
-- menyediakannya, jadi kalimat-kalimat ini disusun sebagai penjabaran dari
-- judul sub-kompetensinya sendiri, memakai register yang sama dengan matriks
-- ('Peserta didik mampu ...'). Kalau nanti Pusmendik menerbitkan rumusan
-- resminya, yang di bawah ini yang harus mengalah — perbaikannya cukup lewat
-- halaman Kurikulum.
--
-- Ditulis ke baris sub-kompetensi yang sudah ada, bukan sebagai baris baru.
-- CurriculumTable menyaring baris CP dengan `learning_outcomes !== null`, jadi
-- mengisi kolom itu di tempat sudah cukup membuat CP-nya muncul, sekaligus
-- menjaga group_id dan segala yang menunjuk baris ini tetap utuh.
--
-- Hanya mengisi yang masih kosong, jadi aman diulang dan tidak menimpa
-- suntingan admin.
-- ============================================================

create temporary table cp_bin_k9 (theme text, topic text, cp text);

insert into cp_bin_k9 (theme, topic, cp) values
  ('Pemahaman Tekstual', 'Mengidentifikasi istilah di berbagai bidang',
   'Peserta didik mampu menentukan makna istilah dari berbagai bidang berdasarkan konteks kalimat dan paragraf tempat istilah itu digunakan, baik pada teks informasi maupun teks fiksi.'),
  ('Pemahaman Tekstual', 'Mengidentifikasi objek/latar dari kosakata (fiksi/nonfiksi)',
   'Peserta didik mampu mengenali objek, tokoh, dan latar yang dirujuk oleh pilihan kosakata dalam teks, pada teks fiksi maupun nonfiksi.'),
  ('Pemahaman Tekstual', 'Mengidentifikasi informasi tersurat',
   'Peserta didik mampu menemukan informasi yang dinyatakan langsung dalam teks, termasuk informasi yang tersebar di beberapa bagian atau disajikan lewat tabel, grafik, dan gambar.'),
  ('Pemahaman Tekstual', 'Menyusun kerangka/bagan dari bagian penting teks',
   'Peserta didik mampu menata bagian-bagian penting teks menjadi kerangka atau bagan yang memperlihatkan hubungan antargagasan beserta urutan penyajiannya.'),

  ('Pemahaman Inferensial', 'Menyimpulkan ide pokok/gagasan pendukung/tokoh/peristiwa/latar/nilai (dalam dan antarteks)',
   'Peserta didik mampu menyimpulkan ide pokok dan gagasan pendukung pada teks informasi, serta tokoh, peristiwa, latar, dan nilai pada teks fiksi, baik di dalam satu teks maupun antarteks.'),
  ('Pemahaman Inferensial', 'Menjelaskan kelogisan hubungan antarperistiwa/gagasan/informasi',
   'Peserta didik mampu menjelaskan kelogisan hubungan sebab-akibat, urutan, dan pertentangan antarperistiwa, antargagasan, atau antarinformasi di dalam teks.'),
  ('Pemahaman Inferensial', 'Memprediksi peristiwa',
   'Peserta didik mampu memprediksi peristiwa yang mungkin terjadi selanjutnya berdasarkan petunjuk yang tersedia di dalam teks.'),
  ('Pemahaman Inferensial', 'Menjelaskan bahasa kias dan citraan (teks fiksi)',
   'Peserta didik mampu menjelaskan makna bahasa kias dan citraan dalam teks fiksi serta pengaruhnya terhadap suasana dan penggambaran cerita.'),

  ('Evaluasi dan Apresiasi', 'Menilai relevansi peristiwa dengan kehidupan sehari-hari',
   'Peserta didik mampu menilai keterkaitan peristiwa atau gagasan dalam teks dengan keadaan kehidupan sehari-hari, disertai alasan yang bersandar pada isi teks.'),
  ('Evaluasi dan Apresiasi', 'Menilai kesesuaian/keakuratan unsur kebahasaan dan isi antarteks',
   'Peserta didik mampu menilai ketepatan unsur kebahasaan serta kesesuaian dan keakuratan isi ketika membandingkan dua teks atau lebih.'),
  ('Evaluasi dan Apresiasi', 'Menyimpulkan respons emosional terhadap unsur teks fiksi',
   'Peserta didik mampu menyimpulkan respons emosional yang ditimbulkan unsur-unsur teks fiksi dan menunjukkan bagian teks yang menimbulkannya.');

-- Berhenti kalau ada topik yang tidak ketemu, daripada diam-diam mengisi
-- sebagian. Judul sub-kompetensi di migrasi 096 panjang dan mudah bergeser
-- kalau sempat disunting lewat halaman Kurikulum.
do $$
declare
  v_hilang text;
begin
  if not exists (select 1 from subjects where name = 'Bahasa Indonesia') then
    raise exception 'Mapel Bahasa Indonesia tidak ditemukan di tabel subjects';
  end if;

  select string_agg(b.theme || ' :: ' || b.topic, E'\n  ')
    into v_hilang
  from cp_bin_k9 b
  where not exists (
    select 1 from curriculum_topics t
    where t.subject_id = (select id from subjects where name = 'Bahasa Indonesia')
      and t.curriculum = 'TKA'
      and t.grade_level = 'Kelas 9'
      and coalesce(t.theme, '') = b.theme
      and t.topic = b.topic
  );

  if v_hilang is not null then
    raise exception E'Sub-kompetensi tidak ditemukan:\n  %', v_hilang;
  end if;
end $$;

update curriculum_topics t
set learning_outcomes = b.cp
from cp_bin_k9 b
where t.subject_id = (select id from subjects where name = 'Bahasa Indonesia')
  and t.curriculum = 'TKA'
  and t.grade_level = 'Kelas 9'
  and coalesce(t.theme, '') = b.theme
  and t.topic = b.topic
  and t.learning_outcomes is null;

drop table cp_bin_k9;
