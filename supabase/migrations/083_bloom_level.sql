-- ============================================================
-- `bloom_level` — taksonomi Bloom sebagai sumbu kedua tiap soal
--
-- Sampai sekarang satu-satunya penanda sebuah soal adalah topik kurikulumnya.
-- Padahal sepuluh soal untuk satu topik bukan sepuluh soal setara: naskah
-- Tera menyusunnya sebagai tangga C1 → C4, dan tangga itu tidak punya tempat
-- di mana pun. Akibatnya tidak ada yang bisa menjawab "topik ini sudah punya
-- soal menganalisis atau berhenti di menghafal?" tanpa membaca satu per satu.
--
-- Ditaruh di dua tabel karena level melekat pada soalnya, bukan pada paket
-- tempat soal itu kebetulan dipakai: `question_bank_items` untuk korpus
-- bersama, `questions` untuk soal di dalam paket. Sora menyalinnya ke dua arah
-- saat soal berpindah antara Latihan Soal dan paket.
--
-- smallint 1–6, bukan teks 'C1': bisa diurutkan dan dibandingkan tanpa
-- membedah string, dan tangga di dalam satu topik memang punya arah.
--
-- Nullable dengan sengaja. Ratusan soal sudah ada sebelum kolom ini, dan
-- "belum ditetapkan" harus jadi keadaan yang sah — bukan 0 yang menyamar
-- sebagai level, dan bukan default 1 yang akan menandai seluruh soal lama
-- sebagai C1 padahal tidak ada seorang pun yang pernah menilainya.
-- ============================================================

alter table questions
  add column if not exists bloom_level smallint;

alter table question_bank_items
  add column if not exists bloom_level smallint;

alter table questions
  drop constraint if exists questions_bloom_level_check;
alter table questions
  add constraint questions_bloom_level_check
  check (bloom_level is null or bloom_level between 1 and 6);

alter table question_bank_items
  drop constraint if exists question_bank_items_bloom_level_check;
alter table question_bank_items
  add constraint question_bank_items_bloom_level_check
  check (bloom_level is null or bloom_level between 1 and 6);

comment on column questions.bloom_level is
  'Taksonomi Bloom 1-6 (C1 Mengingat .. C6 Mencipta). Null = belum ditetapkan.';
comment on column question_bank_items.bloom_level is
  'Taksonomi Bloom 1-6 (C1 Mengingat .. C6 Mencipta). Null = belum ditetapkan.';

-- Sebaran per topik, untuk memeriksa keseimbangan langsung dari SQL:
--
--   select g.grade_level, g.topic,
--          count(*) filter (where i.bloom_level = 1) as c1,
--          count(*) filter (where i.bloom_level = 2) as c2,
--          count(*) filter (where i.bloom_level = 3) as c3,
--          count(*) filter (where i.bloom_level = 4) as c4,
--          count(*) filter (where i.bloom_level is null) as tanpa_level
--     from question_curriculum_tags t
--     join question_bank_items i on i.id = t.question_bank_item_id
--     join curriculum_topic_groups g on g.id = t.group_id
--    group by g.grade_level, g.topic
--    order by g.grade_level, g.topic;
