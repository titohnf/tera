-- ============================================================
-- TKA: pindah dari grade_level 'SMP' ke sumbu kelas Tera
--
-- Seed 062 menulis grade_level = 'SMP', padahal seluruh kolom grade_level di
-- Tera memakai format 'Kelas 1'..'Kelas 12' (lihat komentar di 028_curriculum).
-- Akibatnya baris TKA tidak pernah lolos filter halaman Kurikulum, yang
-- membandingkan grade_level dengan pilihan 'Kelas N'. TKA sekarang difilekan di
-- kelas yang menempuh ujiannya: SD -> Kelas 6, SMP -> Kelas 9, SMA -> Kelas 12.
--
-- Perhatikan artinya: 'Kelas 9' di sini berarti "TKA yang ditempuh murid kelas
-- 9", bukan "materi kelas 9" — cakupan elemennya satu jenjang penuh.
--
-- Ini UPDATE, bukan re-seed. Menjalankan ulang 062 akan `delete from
-- curriculum_topic_groups` lebih dulu, dan cascade-nya ikut menghapus
-- question_curriculum_tags — 14 soal contoh QuizCraft kehilangan tag topiknya.
-- Dengan update di tempat, id group tidak berubah sehingga tag tetap utuh, dan
-- trigger sync_curriculum_topic_group (migrasi 060) mendorong nilai barunya ke
-- curriculum_topics + curriculum_resources.
--
-- Semester dibiarkan apa adanya: TKA tidak mengenal semester, tapi kolomnya
-- `not null check (semester in (1, 2))` dan ikut jadi kunci unik group, jadi
-- angka 1 tetap dipakai sebagai pengisi. UI menyembunyikan kontrol semester
-- untuk TKA (lihat lib/curriculum-config.ts) supaya angka itu tidak terlihat.
-- ============================================================

update curriculum_topic_groups
set grade_level = 'Kelas 9'
where curriculum = 'TKA' and grade_level = 'SMP';

-- Baris tema (topic null) tidak punya group_id, jadi trigger di atas tidak
-- menjangkaunya — perlu diperbarui sendiri.
update curriculum_topics
set grade_level = 'Kelas 9'
where curriculum = 'TKA' and grade_level = 'SMP';

-- Mapel yang punya topik TKA harus mencantumkan 'TKA' di subjects.curriculum,
-- kalau tidak sidebar halaman Kurikulum kosong: sidebar-nya dibangun dari
-- daftar mapel yang memuat kurikulum aktif, bukan dari topik yang ada.
update subjects s
set curriculum = array_append(coalesce(s.curriculum, array[]::text[]), 'TKA')
where not coalesce(s.curriculum, array[]::text[]) @> array['TKA']
  and exists (
    select 1 from curriculum_topics ct
    where ct.subject_id = s.id and ct.curriculum = 'TKA'
  );

-- Sidebar yang sama juga menyaring mapel per jenjang, diturunkan dari nomor
-- kelas ('Kelas 9' -> SMP). Isi TKA yang ada sekarang hanya SMP; kalau nanti
-- Kelas 6 / Kelas 12 diisi, jenjang SD / SMA ditambahkan lewat Admin -> Mapel.
update subjects s
set level = array_append(coalesce(s.level, array[]::text[]), 'SMP')
where not coalesce(s.level, array[]::text[]) @> array['SMP']
  and exists (
    select 1 from curriculum_topics ct
    where ct.subject_id = s.id and ct.curriculum = 'TKA' and ct.grade_level = 'Kelas 9'
  );
