import { getUser } from '@/lib/supabase/get-user'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * Satu jawaban untuk "boleh tidak orang ini membaca data murid itu".
 *
 * Dipisahkan dari `lib/api-auth.ts` begitu penjagaan yang sama dibutuhkan di
 * luar route HTTP — server action `getJadwalSessionDetail` memakai aturan yang
 * persis sama, dan menyalinnya ke sana berarti dua definisi "berhak" yang bisa
 * berbeda diam-diam. Yang di api-auth sekarang tinggal pembungkusnya: mengubah
 * jawaban ini jadi pengalihan ke login atau 403.
 *
 * Aturannya: admin boleh semua, keluarga hanya anaknya sendiri. Tutor tidak
 * termasuk — kalau nanti perlu, tambahkan di sini dengan sadar.
 */
export async function bolehBacaMurid(studentId: string): Promise<boolean> {
  const who = await siapa()
  if (!who) return false
  if (who.role === 'admin') return true
  if (who.role !== 'parent') return false

  const admin = createAdminClient()
  const { data } = await admin
    .from('family_students')
    .select('student_id')
    .eq('family_id', who.id)
    .eq('student_id', studentId)
    .maybeSingle()

  return Boolean(data)
}

export async function siapa(): Promise<{ id: string; role: string } | null> {
  const user = await getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role) return null
  return { id: user.id, role: profile.role as string }
}
