'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { isSessionTutor } from '@/lib/actions/session-access'

export async function requestPayrollReReview(sessionId: string, note: string) {
  const trimmedNote = note.trim()
  if (!trimmedNote) return { error: 'Jelaskan dulu apa yang sudah diperbaiki' }

  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()
  if (!(await isSessionTutor(admin, sessionId, user.id))) return { error: 'Sesi tidak ditemukan' }

  const { data: session } = await admin.from('sessions').select('payroll_status').eq('id', sessionId).single()
  if (!session) return { error: 'Sesi tidak ditemukan' }
  if (session.payroll_status !== 'rejected') return { error: 'Sesi ini tidak dalam status ditolak' }

  const { error } = await admin
    .from('sessions')
    .update({
      payroll_status: 'pending',
      payroll_tutor_note: trimmedNote,
      payroll_tutor_note_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }

  revalidatePath(`/tutor/sessions/${sessionId}`)
  revalidatePath(`/admin/sessions/${sessionId}`)
  return { success: true }
}
