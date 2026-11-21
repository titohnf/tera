'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

/**
 * Menautkan percobaan try out ke siswa Tera.
 *
 * Peserta try out lewat tautan bersama mengetik namanya sendiri, jadi percobaan
 * lahir tanpa `learner_id`. Tautan ini yang membuat hasilnya muncul di laporan
 * siswa itu dan di akun keluarganya. Yang ditulis hanya `attempts.learner_id`;
 * tidak ada nilai, jawaban, atau kunci yang disentuh.
 *
 * Siswa yang belum pernah berlatih belum punya baris `learners`; dibuatkan di
 * sini (satu per profil, sesuai indeks unik `learners_profile_id_key`).
 */

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function tautkanPercobaan(formData: FormData): Promise<void> {
  const ctx = await verifyAdmin()
  if (!ctx) return
  const attemptId = String(formData.get('attempt_id') ?? '')
  const studentId = String(formData.get('student_id') ?? '')
  const quizId = String(formData.get('quiz_id') ?? '')
  if (!attemptId || !studentId) return

  const { data: siswa } = await ctx.admin
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', studentId)
    .in('role', ['student', 'mandiri'])
    .maybeSingle()
  if (!siswa) return

  let learnerId: string | null = null
  const { data: ada } = await ctx.admin.from('learners').select('id').eq('profile_id', studentId).maybeSingle()
  if (ada) learnerId = (ada as { id: string }).id
  else {
    const { data: baru } = await ctx.admin
      .from('learners')
      .insert({ profile_id: studentId, name: (siswa as { full_name: string | null }).full_name ?? 'Siswa' })
      .select('id')
      .single()
    learnerId = (baru as { id: string } | null)?.id ?? null
  }
  if (!learnerId) return

  await ctx.admin.from('attempts').update({ learner_id: learnerId }).eq('id', attemptId)
  revalidatePath('/admin/hasil-tryout')
  if (quizId) revalidatePath(`/admin/hasil-tryout?quiz=${quizId}`)
}

export async function lepasTautanPercobaan(formData: FormData): Promise<void> {
  const ctx = await verifyAdmin()
  if (!ctx) return
  const attemptId = String(formData.get('attempt_id') ?? '')
  if (!attemptId) return
  await ctx.admin.from('attempts').update({ learner_id: null }).eq('id', attemptId)
  revalidatePath('/admin/hasil-tryout')
}
