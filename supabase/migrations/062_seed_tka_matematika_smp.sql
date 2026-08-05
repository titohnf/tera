-- ============================================================
-- SEED: Kurikulum TKA Matematika SMP + bank soal contohnya
--
-- TKA (Tes Kemampuan Akademik) dipetakan ke bentuk kurikulum Tera sebagai:
--   curriculum  = 'TKA'          (berdampingan dengan 'Kurikulum Merdeka')
--   grade_level = 'SMP'
--   theme       = elemen Pusmendik (Bilangan, Aljabar, ...)
--   topic       = sub-elemen
--
-- Catatan yang perlu disadari: `curriculum_topics.semester` punya check
-- constraint (1, 2) sementara TKA tidak mengenal semester sama sekali. Semua
-- baris di bawah memakai semester 1 karena kolomnya wajib diisi — angkanya tidak
-- bermakna untuk TKA, dan halaman latihan menampilkannya apa adanya.
--
-- Empat elemennya resmi dari Pusmendik. Sub-elemen di bawahnya adalah usulan
-- berdasarkan cakupan Matematika SMP — bebas diubah lewat halaman Kurikulum.
-- ============================================================

create or replace function seed_tka_question(
  p_subject uuid,
  p_theme text,
  p_topic text,
  p_type text,
  p_prompt text,
  p_options jsonb,
  p_answer jsonb,
  p_explanation text
)
returns void
language plpgsql
as $seed_q$
declare
  v_group uuid;
  v_item uuid;
begin
  v_group := curriculum_group_id('TKA', p_subject, 'SMP', 1, p_theme, p_topic);

  -- Prompt yang menandai soal: menjalankan ulang seed tidak menumpuk salinan.
  select id into v_item from question_bank_items where prompt = p_prompt;

  if v_item is null then
    insert into question_bank_items (type, prompt, options, correct_answer, weight, explanation)
    values (p_type, p_prompt, p_options, p_answer, 1, p_explanation)
    returning id into v_item;
  else
    update question_bank_items
    set type = p_type, options = p_options, correct_answer = p_answer, explanation = p_explanation
    where id = v_item;
  end if;

  insert into question_curriculum_tags (question_bank_item_id, group_id)
  values (v_item, v_group)
  on conflict do nothing;
end $seed_q$;

do $seed_main$
declare
  v_subject uuid;
begin
  select id into v_subject from subjects where name = 'Matematika' limit 1;
  if v_subject is null then
    raise exception 'Subject Matematika tidak ditemukan. Buat dulu di Admin -> Mapel.';
  end if;

  -- Bersihkan versi sebelumnya. Menghapus group ikut membersihkan baris CP,
  -- materi/bank soal, dan tag soalnya lewat cascade — lalu ditanam ulang di
  -- bawah, jadi seed ini aman dijalankan berkali-kali.
  delete from curriculum_topic_groups
  where curriculum = 'TKA' and subject_id = v_subject;

  delete from curriculum_topics
  where curriculum = 'TKA' and subject_id = v_subject;

  -- Baris tema (topic null) supaya strukturnya tampil di halaman Kurikulum.
  insert into curriculum_topics (curriculum, subject_id, grade_level, semester, theme, topic, sort_order)
  values
    ('TKA', v_subject, 'SMP', 1, 'Bilangan', null, 0),
    ('TKA', v_subject, 'SMP', 1, 'Aljabar', null, 1),
    ('TKA', v_subject, 'SMP', 1, 'Geometri dan Pengukuran', null, 2),
    ('TKA', v_subject, 'SMP', 1, 'Data dan Peluang', null, 3);

  -- Bilangan ------------------------------------------------------------------

  perform seed_tka_question(v_subject, 'Bilangan', 'Bilangan Bulat dan Pecahan', 'mcq_single',
    'Hasil dari $-8 + 15 \div (-3)$ adalah ...',
    jsonb_build_object('choices', to_jsonb(array['$-13$', '$-3$', '$3$', '$13$'])),
    to_jsonb('$-13$'::text),
    'Kerjakan pembagian dulu: $15 \div (-3) = -5$. Baru dijumlahkan: $-8 + (-5) = -13$.');

  perform seed_tka_question(v_subject, 'Bilangan', 'Bilangan Berpangkat dan Bentuk Akar', 'mcq_single',
    'Bentuk paling sederhana dari $\sqrt{72}$ adalah ...',
    jsonb_build_object('choices', to_jsonb(array['$6\sqrt{2}$', '$2\sqrt{6}$', '$8\sqrt{3}$', '$36$'])),
    to_jsonb('$6\sqrt{2}$'::text),
    'Pecah 72 menjadi kuadrat sempurna dikali sisanya: $72 = 36 \times 2$, jadi $\sqrt{72} = \sqrt{36} \times \sqrt{2} = 6\sqrt{2}$.');

  perform seed_tka_question(v_subject, 'Bilangan', 'Rasio dan Proporsi', 'mcq_single',
    'Perbandingan uang Ani dan Budi adalah $3 : 5$. Jika selisih uang mereka Rp40.000, berapa uang Budi?',
    jsonb_build_object('choices', to_jsonb(array['Rp100.000', 'Rp60.000', 'Rp160.000', 'Rp25.000'])),
    to_jsonb('Rp100.000'::text),
    'Selisihnya $5 - 3 = 2$ bagian. Jadi 1 bagian $= 40.000 \div 2 = 20.000$. Uang Budi $= 5 \times 20.000 = $ Rp100.000.');

  -- Aljabar -------------------------------------------------------------------

  perform seed_tka_question(v_subject, 'Aljabar', 'Bentuk Aljabar dan Operasinya', 'mcq_multi',
    'Manakah yang senilai dengan $2(3x - 4) + 5x$? (pilih semua yang benar)',
    jsonb_build_object('choices', to_jsonb(array[
      '$11x - 8$', '$-8 + 11x$', '$6x - 8 + 5x$', '$11x + 8$', '$16x - 8$'])),
    to_jsonb(array['$11x - 8$', '$-8 + 11x$', '$6x - 8 + 5x$']),
    'Jabarkan dulu: $2(3x-4) = 6x - 8$, lalu $6x - 8 + 5x = 11x - 8$. Penulisan $-8 + 11x$ sama saja karena penjumlahan boleh ditukar.');

  perform seed_tka_question(v_subject, 'Aljabar', 'Persamaan dan Pertidaksamaan Linear', 'mcq_single',
    'Nilai $x$ yang memenuhi $4x - 7 = 2x + 9$ adalah ...',
    jsonb_build_object('choices', to_jsonb(array['$8$', '$4$', '$1$', '$16$'])),
    to_jsonb('$8$'::text),
    'Kumpulkan $x$ di satu ruas: $4x - 2x = 9 + 7$, jadi $2x = 16$ dan $x = 8$.');

  perform seed_tka_question(v_subject, 'Aljabar', 'Relasi dan Fungsi', 'mcq_single',
    'Diketahui $f(x) = 3x - 5$. Nilai $f(-2)$ adalah ...',
    jsonb_build_object('choices', to_jsonb(array['$-11$', '$-1$', '$1$', '$11$'])),
    to_jsonb('$-11$'::text),
    'Ganti setiap $x$ dengan $-2$: $f(-2) = 3(-2) - 5 = -6 - 5 = -11$.');

  perform seed_tka_question(v_subject, 'Aljabar', 'Sistem Persamaan Linear Dua Variabel', 'mcq_single',
    'Penyelesaian dari $x + y = 10$ dan $x - y = 4$ adalah ...',
    jsonb_build_object('choices', to_jsonb(array[
      '$x = 7$, $y = 3$', '$x = 3$, $y = 7$', '$x = 6$, $y = 4$', '$x = 5$, $y = 5$'])),
    to_jsonb('$x = 7$, $y = 3$'::text),
    'Jumlahkan kedua persamaan: $2x = 14$, jadi $x = 7$. Masukkan ke persamaan pertama: $7 + y = 10$, jadi $y = 3$.');

  -- Geometri dan Pengukuran ---------------------------------------------------

  perform seed_tka_question(v_subject, 'Geometri dan Pengukuran', 'Bangun Datar, Keliling dan Luas', 'mcq_single',
    'Keliling sebuah persegi panjang 36 cm. Jika panjangnya 11 cm, luasnya adalah ...',
    jsonb_build_object('choices', to_jsonb(array[
      '$77$ cm$^2$', '$88$ cm$^2$', '$99$ cm$^2$', '$396$ cm$^2$'])),
    to_jsonb('$77$ cm$^2$'::text),
    'Keliling $= 2(p + l)$, jadi $p + l = 18$. Karena $p = 11$, maka $l = 7$. Luas $= 11 \times 7 = 77$ cm$^2$.');

  perform seed_tka_question(v_subject, 'Geometri dan Pengukuran', 'Bangun Ruang dan Volume', 'mcq_single',
    'Volume kubus dengan panjang rusuk 6 cm adalah ...',
    jsonb_build_object('choices', to_jsonb(array[
      '$216$ cm$^3$', '$36$ cm$^3$', '$144$ cm$^3$', '$72$ cm$^3$'])),
    to_jsonb('$216$ cm$^3$'::text),
    'Volume kubus $= s^3 = 6 \times 6 \times 6 = 216$ cm$^3$. Yang $36$ itu luas satu sisinya, bukan volume.');

  perform seed_tka_question(v_subject, 'Geometri dan Pengukuran', 'Teorema Pythagoras', 'statement_grid',
    'Sebuah segitiga siku-siku punya sisi tegak 6 cm dan 8 cm. Tentukan benar atau salah tiap pernyataan.',
    jsonb_build_object(
      'statements', to_jsonb(array[
        'Panjang sisi miringnya 10 cm.',
        'Kelilingnya 24 cm.',
        'Luasnya 48 cm$^2$.']),
      'answer_labels', to_jsonb(array['Benar', 'Salah'])),
    jsonb_build_object('answers', to_jsonb(array[true, true, false]), 'grading_mode', 'proportional'),
    'Sisi miring $= \sqrt{6^2 + 8^2} = \sqrt{100} = 10$ cm. Keliling $= 6 + 8 + 10 = 24$ cm. Luas $= \frac{1}{2} \times 6 \times 8 = 24$ cm$^2$, bukan 48 — jangan lupa dikali setengah.');

  perform seed_tka_question(v_subject, 'Geometri dan Pengukuran', 'Transformasi Geometri', 'mcq_single',
    'Titik $A(3, -2)$ dicerminkan terhadap sumbu $x$. Koordinat bayangannya adalah ...',
    jsonb_build_object('choices', to_jsonb(array[
      '$(3, 2)$', '$(-3, -2)$', '$(-3, 2)$', '$(-2, 3)$'])),
    to_jsonb('$(3, 2)$'::text),
    'Pencerminan terhadap sumbu $x$ hanya membalik tanda ordinat: $(x, y) \to (x, -y)$. Jadi $(3, -2) \to (3, 2)$.');

  -- Data dan Peluang ----------------------------------------------------------

  perform seed_tka_question(v_subject, 'Data dan Peluang', 'Penyajian dan Pengolahan Data', 'statement_grid',
    'Nilai ulangan 8 siswa: 6, 7, 7, 8, 8, 8, 9, 10. Tentukan benar atau salah tiap pernyataan.',
    jsonb_build_object(
      'statements', to_jsonb(array[
        'Modus data tersebut adalah 8.',
        'Jangkauan data tersebut adalah 4.',
        'Ada 3 siswa yang nilainya di atas 8.']),
      'answer_labels', to_jsonb(array['Benar', 'Salah'])),
    jsonb_build_object('answers', to_jsonb(array[true, true, false]), 'grading_mode', 'proportional'),
    'Modus = nilai paling sering muncul, yaitu 8 (muncul 3 kali). Jangkauan $= 10 - 6 = 4$. Nilai di atas 8 hanya 9 dan 10, jadi 2 siswa — bukan 3.');

  perform seed_tka_question(v_subject, 'Data dan Peluang', 'Ukuran Pemusatan dan Penyebaran', 'mcq_single',
    'Rata-rata dari data 5, 7, 8, 10, 10 adalah ...',
    jsonb_build_object('choices', to_jsonb(array['$8$', '$7{,}5$', '$9$', '$10$'])),
    to_jsonb('$8$'::text),
    'Jumlahkan lalu bagi banyak datanya: $(5 + 7 + 8 + 10 + 10) \div 5 = 40 \div 5 = 8$.');

  perform seed_tka_question(v_subject, 'Data dan Peluang', 'Peluang', 'mcq_multi',
    'Sebuah dadu bermata enam dilempar satu kali. Manakah pernyataan yang benar? (pilih semua yang benar)',
    jsonb_build_object('choices', to_jsonb(array[
      'Peluang muncul mata genap adalah $\frac{1}{2}$.',
      'Peluang muncul mata lebih dari 4 adalah $\frac{1}{3}$.',
      'Peluang muncul mata prima adalah $\frac{1}{2}$.',
      'Peluang muncul mata 7 adalah $\frac{1}{6}$.',
      'Peluang muncul mata 1 adalah $\frac{1}{3}$.'])),
    to_jsonb(array[
      'Peluang muncul mata genap adalah $\frac{1}{2}$.',
      'Peluang muncul mata lebih dari 4 adalah $\frac{1}{3}$.',
      'Peluang muncul mata prima adalah $\frac{1}{2}$.']),
    'Mata genap: 2, 4, 6 $\to \frac{3}{6} = \frac{1}{2}$. Lebih dari 4: 5, 6 $\to \frac{2}{6} = \frac{1}{3}$. Prima: 2, 3, 5 $\to \frac{3}{6} = \frac{1}{2}$. Mata 7 tidak ada, peluangnya 0. Mata 1 peluangnya $\frac{1}{6}$.');
end $seed_main$;

drop function if exists seed_tka_question(uuid, text, text, text, text, jsonb, jsonb, text);

-- Rubrik penguasaan -----------------------------------------------------------
-- Ditanam sebagai default global (subject_id null), bukan khusus Matematika:
-- ini satu-satunya rubrik yang ada, jadi mapel lain ikut memakainya sampai kamu
-- memberi mereka rubrik sendiri lewat baris ber-subject.

insert into mastery_rubrics (subject_id, bands)
values (null, '[
  {"label":"Kurang","min":0},
  {"label":"Memadai","min":50},
  {"label":"Baik","min":70},
  {"label":"Istimewa","min":85}
]'::jsonb)
on conflict do nothing;
