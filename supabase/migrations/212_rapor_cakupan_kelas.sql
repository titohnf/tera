-- ============================================================
-- Tangga kelas 1–12 untuk "kemampuan setara kelas Y"
--
-- `rapor_kesetaraan()` (181) memulangkan SATU angka — kelas_setara — dan angka
-- itu kosong untuk setiap anak sampai ada kelas yang SELURUH topiknya (dari
-- kelas 1) tuntas. Kosong itu benar, tapi tidak memberi tahu apa pun tentang
-- sejauh mana anak sudah berjalan menuju klaim pertamanya.
--
-- `cakupan_kelas()` (181) sudah menghitung tangganya: per kelas 1–12, berapa
-- topik yang mestinya dikuasai di kelas itu, berapa yang sudah bisa diukur
-- (punya butir soal), berapa yang tuntas. Tapi haknya dicabut dari semua orang
-- karena `security definer` tanpa gerbang. Berkas ini membangun permukaan
-- bergerbangnya, dengan gerbang yang PERSIS sama dengan `rapor_kesetaraan()`:
-- admin, tutor penanggung jawab, pelajar itu sendiri, atau keluarganya.
--
-- Dipakai kartu kesetaraan di panel admin dan kartu Ketuntasan di rapor
-- keluarga, supaya keduanya menggambar tangga dari satu sumber yang sama
-- dengan angka kelas_setara-nya.
--
-- Jalankan SESUDAH 181.
-- ============================================================

create or replace function rapor_cakupan_kelas(p_learner_id uuid)
returns table (
  kelas smallint,
  topik_total integer,
  topik_terukur integer,
  topik_tuntas integer
)
language sql
stable
security definer
set search_path = public
as $$
  select c.* from cakupan_kelas(p_learner_id) c
  where is_admin()
     or exists (
          select 1 from learners l
          where l.id = p_learner_id and l.tutor_penanggung_jawab_id = auth.uid()
        )
     or exists (
          select 1 from learners l
          where l.id = p_learner_id and l.profile_id = auth.uid()
        )
     or exists (
          select 1 from learners l
          where l.id = p_learner_id
            and l.profile_id is not null
            and family_covers_student(l.profile_id)
        );
$$;

comment on function rapor_cakupan_kelas(uuid) is
  'Permukaan bergerbang untuk cakupan_kelas(): tangga kelas 1–12 (topik total, terukur, tuntas) bagi admin, tutor penanggung jawab, murid itu sendiri, atau keluarganya.';

revoke all on function rapor_cakupan_kelas(uuid) from public, anon;
grant execute on function rapor_cakupan_kelas(uuid) to authenticated;

notify pgrst, 'reload schema';
