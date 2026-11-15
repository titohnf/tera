-- ============================================================
-- Matematika terdaftar di kurikulum 'Misi Matematika'
--
-- Migrasi 214 membuat topik-topiknya, tetapi lupa mendaftarkan kurikulumnya di
-- `subjects.curriculum`. Halaman Admin -> Kurikulum hanya menampilkan mapel yang
-- daftar kurikulumnya memuat kurikulum yang dipilih (sama seperti Fondasi
-- Berhitung di migrasi 200), jadi tab Misi Matematika tampak kosong padahal
-- topiknya ada.
--
-- Aman diulang: yang sudah terdaftar dilewati.
-- ============================================================

update subjects
set curriculum = array_append(coalesce(curriculum, array[]::text[]), 'Misi Matematika')
where name = 'Matematika'
  and not coalesce(curriculum, array[]::text[]) @> array['Misi Matematika'];

notify pgrst, 'reload schema';
