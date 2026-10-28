-- ============================================================
-- Keluarga boleh membaca mapel kelas anaknya
--
-- `class_subjects` hanya punya kebijakan untuk admin, tutor, dan murid
-- (`is_enrolled_in_class` memakai auth.uid(), jadi tidak pernah cocok untuk
-- akun keluarga). Akibatnya profil anak di portal keluarga terpaksa menebak
-- mapel kelas dari sesinya, sementara halaman admin membacanya dari tabel ini.
-- Kebijakannya meniru "Families read own classes" di 076.
-- ============================================================

drop policy if exists "Families read own class subjects" on class_subjects;
create policy "Families read own class subjects" on class_subjects
  for select using (
    is_family() and exists (
      select 1 from class_students cs
      where cs.class_id = class_subjects.class_id
        and cs.student_id in (select my_students())
    )
  );
