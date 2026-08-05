-- ============================================================
-- Akun keluarga: satu login untuk satu keluarga, mencakup semua anaknya
--
-- Sampai sekarang satu baris `profiles` merangkap dua hal: CATATAN MURID (yang
-- ditunjuk class_students, assessment_results, attendances, invoices) dan AKUN
-- LOGIN. Selama satu anak satu akun, rangkap itu tidak terasa. Ia mulai
-- menyulitkan begitu orang tua punya lebih dari satu anak: dari 26 murid, ada
-- 3 pasang kakak-adik, dan email tiap anak berbeda — sehingga satu orang tua
-- harus login dua kali dengan dua alamat untuk melihat dua anaknya.
--
-- Migrasi ini memisahkan keduanya:
--   * Profil murid tetap jadi CATATAN. Ia tidak lagi perlu bisa login.
--   * Profil ber-role `parent` jadi AKUN KELUARGA, ditautkan ke anak-anaknya
--     lewat `family_students`.
--
-- Role `parent` sudah ada di enum sejak 001, dan `002_rls_policies.sql:141`
-- sudah menyiapkan policy untuknya dengan komentar "parent-student link would
-- be added in a future migration". Inilah migrasi itu.
--
-- Yang TIDAK dikerjakan di sini: pemindahan 26 akun yang sudah ada. Itu
-- menyentuh Auth (membebaskan email anak supaya bisa dipakai akun keluarga),
-- jadi dijalankan lewat skrip terpisah setelah dipastikan email mana yang jadi
-- login tiap keluarga.
-- ============================================================

create table if not exists family_students (
  family_id uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (family_id, student_id)
);

create index if not exists family_students_student_idx on family_students(student_id);

alter table family_students enable row level security;

-- Helper -------------------------------------------------------------------
-- `set row_security = off` mengikuti pola get_my_role() di migrasi 004: fungsi
-- ini dipanggil DARI DALAM policy tabel lain, jadi kalau ia sendiri tunduk RLS
-- maka `family_students` butuh policy yang memanggil dirinya sendiri.

create or replace function is_family()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.get_my_role() = 'parent';
$$;

/** Anak-anak yang dicakup akun keluarga yang sedang login. */
create or replace function my_students()
returns setof uuid
language sql
security definer
set row_security = off
stable
set search_path = public
as $$
  select fs.student_id from family_students fs where fs.family_id = auth.uid();
$$;

create or replace function family_covers_student(p_student uuid)
returns boolean
language sql
security definer
set row_security = off
stable
set search_path = public
as $$
  select exists (
    select 1 from family_students fs
    where fs.family_id = auth.uid() and fs.student_id = p_student
  );
$$;

-- Policy -------------------------------------------------------------------
-- Semuanya BACA saja. Portal keluarga menampilkan, tidak mengubah: nilai,
-- laporan, dan tagihan adalah catatan resmi yang hanya boleh ditulis admin dan
-- tutor. Satu-satunya tulisan dari sisi keluarga adalah mengerjakan asesmen,
-- dan itu lewat fungsi security definer di migrasi 075.

create policy "Families read own links" on family_students
  for select using (family_id = auth.uid());

create policy "Families read own children" on profiles
  for select using (is_family() and (id = auth.uid() or family_covers_student(id)));

create policy "Families read own enrolments" on class_students
  for select using (is_family() and family_covers_student(student_id));

create policy "Families read own classes" on classes
  for select using (
    is_family() and exists (
      select 1 from class_students cs
      where cs.class_id = classes.id and cs.student_id in (select my_students())
    )
  );

create policy "Families read own sessions" on sessions
  for select using (
    is_family() and exists (
      select 1 from class_students cs
      where cs.class_id = sessions.class_id and cs.is_active
        and cs.student_id in (select my_students())
    )
  );

create policy "Families read own attendance" on attendances
  for select using (is_family() and family_covers_student(student_id));

create policy "Families read own assessments" on assessment_results
  for select using (is_family() and family_covers_student(student_id));

-- Judul dan bobot asesmennya, supaya nilai punya konteks.
create policy "Families read assessments of own results" on assessments
  for select using (
    is_family() and exists (
      select 1 from assessment_results r
      where r.assessment_id = assessments.id and r.student_id in (select my_students())
    )
  );

create policy "Families read own monthly reports" on monthly_report_notes
  for select using (is_family() and family_covers_student(student_id));

create policy "Families read own invoices" on invoices
  for select using (is_family() and family_covers_student(student_id));

create policy "Families read own payments" on invoice_payments
  for select using (
    is_family() and exists (
      select 1 from invoices i
      where i.id = invoice_payments.invoice_id and i.student_id in (select my_students())
    )
  );

-- Rekap penguasaan dihitung dari jawaban latihan mandiri anaknya.
create policy "Families read own practice answers" on practice_answers
  for select using (
    is_family() and exists (
      select 1 from learners l
      where l.id = practice_answers.learner_id and l.profile_id in (select my_students())
    )
  );

create policy "Families read own learners" on learners
  for select using (is_family() and profile_id in (select my_students()));

-- Materi dan kurikulum tidak bersifat per murid, jadi dibuka apa adanya untuk
-- keluarga — sama seperti tutor. Yang membatasi relevansinya adalah tampilan,
-- bukan RLS.
create policy "Families read curriculum" on curriculum_topics
  for select using (is_family());

create policy "Families read curriculum groups" on curriculum_topic_groups
  for select using (is_family());

create policy "Families read learning resources" on curriculum_resources
  for select using (is_family());

create policy "Families read subjects" on subjects
  for select using (is_family());

create policy "Families read mastery rubrics" on mastery_rubrics
  for select using (is_family());
