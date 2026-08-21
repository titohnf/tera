import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Jenjang kurikulum mana yang boleh muncul di dropdown topik sebuah sesi.
 *
 * Aturan dasarnya satu: kelas siswa yang terdaftar di sesi itu (modus kelas
 * roster). Di atasnya ada pengecualian per siswa — tabel
 * `student_curriculum_grade_overrides` (lihat migrasi 105) — untuk kasus
 * seperti siswa kelas 8 yang atas keputusan manajemen belajar IPA dari
 * kurikulum Kelas 7.
 *
 * Pengecualian bersifat MENAMBAH, bukan mengganti: kelas asli sesi tetap ada di
 * daftar, jadi kalau siswa yang dikecualikan duduk sekelas dengan siswa lain,
 * tutor tetap melihat kurikulum kelas reguler dan tinggal memilih yang dipakai.
 *
 * Mengembalikan `null` kalau tidak ada penyaringan sama sekali — tidak ada
 * siswa berkelas di sesi ini, dan menyaring hanya akan menyisakan dropdown
 * kosong.
 */
export async function allowedCurriculumGradeLevels(
  client: SupabaseClient,
  {
    sessionGrade,
    subjectId,
    studentIds,
  }: { sessionGrade: number | null; subjectId: string | null; studentIds: string[] },
): Promise<string[] | null> {
  if (sessionGrade == null) return null

  const levels = [`Kelas ${sessionGrade}`]
  if (!subjectId || studentIds.length === 0) return levels

  const { data } = await (client
    .from('student_curriculum_grade_overrides')
    .select('grade_level')
    .eq('subject_id', subjectId)
    .in('student_id', studentIds) as unknown as Promise<{ data: { grade_level: string }[] | null }>)

  for (const row of data ?? []) {
    if (!levels.includes(row.grade_level)) levels.push(row.grade_level)
  }
  return levels
}
