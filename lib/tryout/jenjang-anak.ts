import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * Jenjang (SD/SMP/SMA) seorang anak menurut `profiles.grade`, atau null bila kelasnya belum diisi.
 * Dipakai untuk menampilkan hanya try out yang ditujukan untuknya. Pemanggil harus sudah memastikan
 * `studentId` memang milik pengguna (anakOrRedirect), karena yang dibaca memakai klien admin.
 */
export async function jenjangAnak(studentId: string): Promise<string | null> {
  const { data } = await createAdminClient().from('profiles').select('grade').eq('id', studentId).maybeSingle()
  const kelas = (data as { grade: number | null } | null)?.grade
  if (typeof kelas !== 'number') return null
  if (kelas >= 1 && kelas <= 6) return 'SD'
  if (kelas >= 7 && kelas <= 9) return 'SMP'
  if (kelas >= 10 && kelas <= 12) return 'SMA'
  return null
}
