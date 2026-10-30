-- ============================================================
-- Admin boleh membaca kemajuan latihan siswa lewat fungsi yang sama
--
-- Menu "Laporan Belajar" di panel admin menampilkan Latihan Mandiri dan
-- Ketuntasan Materi seorang siswa dengan tampilan dan ANGKA yang sama dengan
-- portal keluarga. Angka itu dihitung `practice_topic_progress()` (128, 203) dan
-- `topik_kemajuan()` (183), dan keduanya menolak siapa pun yang bukan pemilik
-- kode, orang tua si anak, atau pelanggan itu sendiri — gerbangnya
-- `practice_actor()`.
--
-- Menghitung ulang di sisi admin berarti menulis aturan yang sama dua kali, dan
-- itulah yang dulu membuat dua layar menampilkan angka berbeda untuk anak yang
-- sama. Jadi gerbangnya yang dibuka, bukan angkanya yang disalin.
--
-- Yang ikut terbuka dan perlu disadari: `practice_actor()` juga menjaga fungsi
-- yang MENULIS (membuka sesi, mencatat jawaban). Admin yang memanggilnya
-- langsung lewat API bisa bertindak atas nama siswa. Itu sudah dalam jangkauan
-- admin lewat service role, dan layar admin tidak menyediakan tombolnya; yang
-- baru hanyalah jalurnya.
--
-- Cabang admin sengaja terakhir: pemanggil lain tetap lolos di cabang yang
-- lama dan perilakunya tidak berubah. Kode akses (Sora) tidak tersentuh.
-- ============================================================

create or replace function practice_actor(p_access_code text, p_learner_id uuid default null)
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (
      select l.id from learners l
      where l.access_code = p_access_code
        and coalesce(p_access_code, '') <> ''
    ),
    (
      select l.id from learners l
      where l.id = p_learner_id
        and l.profile_id is not null
        and family_covers_student(l.profile_id)
    ),
    (
      select l.id from learners l
      where l.id = p_learner_id
        and l.profile_id = auth.uid()
        and has_product('sora')
    ),
    (
      select l.id from learners l
      where l.id = p_learner_id
        and l.profile_id is not null
        and is_admin()
    )
  );
$$;

notify pgrst, 'reload schema';
