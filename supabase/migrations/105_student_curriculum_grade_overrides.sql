-- ============================================================
-- PENGECUALIAN JENJANG KURIKULUM PER SISWA
--
-- Daftar topik yang bisa dipilih tutor di halaman sesi disaring dengan satu
-- aturan: kelas siswa yang terdaftar di sesi itu. Siswa kelas 8 hanya melihat
-- kurikulum Kelas 8 (lihat app/tutor/sessions/[sessionId]/page.tsx).
--
-- Ada kasus di mana keputusan manajemen menempatkan seorang siswa di kurikulum
-- jenjang lain untuk satu mata pelajaran — misalnya siswa kelas 8 yang untuk
-- IPA belajar dari kurikulum Kelas 7. Tanpa tempat menyimpan keputusan itu,
-- satu-satunya jalan adalah menuliskan nama siswa di dalam kode, yang berarti
-- keputusan berikutnya butuh deploy lagi.
--
-- Tabel ini menyimpannya sebagai data: satu baris = "untuk mapel ini, siswa ini
-- juga boleh memakai kurikulum jenjang itu". Sifatnya MENAMBAH, bukan
-- mengganti: kelas asli siswa tetap muncul di dropdown, jadi sesi kelas
-- reguler yang berisi siswa lain tidak kehilangan pilihan apa pun.
-- ============================================================

create table student_curriculum_grade_overrides (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  grade_level text not null,          -- mis. 'Kelas 7', sama bentuknya dengan curriculum_topics.grade_level
  note text,                          -- alasan, supaya keputusan lama masih bisa dibaca
  created_at timestamptz not null default now(),
  unique (student_id, subject_id, grade_level)
);

create index student_curriculum_grade_overrides_student_idx
  on student_curriculum_grade_overrides(student_id);

alter table student_curriculum_grade_overrides enable row level security;

create policy "Admins manage student curriculum grade overrides"
  on student_curriculum_grade_overrides for all using (is_admin());

-- Tutor perlu membacanya untuk menyusun daftar topik di halaman sesi. Isinya
-- tidak lebih sensitif dari roster kelas yang sudah mereka lihat.
create policy "Tutors read student curriculum grade overrides"
  on student_curriculum_grade_overrides for select using (is_tutor());

-- Kasus yang memicu tabel ini: Fauzan Aiman Akhtar, kelas 8, mapel IPA
-- memakai kurikulum Kelas 7.
do $$
declare
  v_student uuid;
  v_subject uuid;
  v_count int;
begin
  -- Tidak pakai min(id): Postgres tidak punya agregat min() untuk uuid.
  select count(*) into v_count
  from profiles
  where full_name = 'Fauzan Aiman Akhtar';

  if v_count = 0 then
    raise exception 'Siswa "Fauzan Aiman Akhtar" tidak ditemukan di profiles';
  elsif v_count > 1 then
    raise exception 'Ada % profil bernama "Fauzan Aiman Akhtar" — pilih satu secara manual', v_count;
  end if;

  select id into v_student
  from profiles
  where full_name = 'Fauzan Aiman Akhtar';

  select id into v_subject from subjects where name = 'IPA' limit 1;
  if v_subject is null then
    raise exception 'Mata pelajaran IPA tidak ditemukan di subjects';
  end if;

  insert into student_curriculum_grade_overrides (student_id, subject_id, grade_level, note)
  values (v_student, v_subject, 'Kelas 7', 'Keputusan manajemen: IPA diajarkan dari kurikulum Kelas 7 meski siswa duduk di kelas 8.')
  on conflict (student_id, subject_id, grade_level) do nothing;
end $$;
