'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { getSessionCompletionStatus } from '@/lib/actions/session-completion'

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function approveSessionPayroll(sessionId: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const check = await getSessionCompletionStatus(sessionId)
  if (!check?.canComplete) return { error: 'Sesi belum lengkap — tidak bisa disetujui.' }

  const { data: session } = await ctx.admin.from('sessions').select('tutor_id').eq('id', sessionId).single()
  if (!session) return { error: 'Sesi tidak ditemukan' }

  const { error } = await ctx.admin
    .from('sessions')
    .update({
      payroll_status: 'approved',
      payroll_reviewed_by: ctx.user.id,
      payroll_reviewed_at: new Date().toISOString(),
      payroll_rejection_reason: null,
      payroll_tutor_note: null,
      payroll_tutor_note_at: null,
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/admin/users/${session.tutor_id}`)
  revalidatePath(`/tutor/sessions/${sessionId}`)
  return { success: true }
}

export async function rejectSessionPayroll(sessionId: string, reason: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const trimmedReason = reason.trim()
  if (!trimmedReason) return { error: 'Alasan penolakan wajib diisi' }

  const { data: session } = await ctx.admin.from('sessions').select('tutor_id').eq('id', sessionId).single()
  if (!session) return { error: 'Sesi tidak ditemukan' }

  const { error } = await ctx.admin
    .from('sessions')
    .update({
      payroll_status: 'rejected',
      payroll_reviewed_by: ctx.user.id,
      payroll_reviewed_at: new Date().toISOString(),
      payroll_rejection_reason: trimmedReason,
      payroll_tutor_note: null,
      payroll_tutor_note_at: null,
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/admin/users/${session.tutor_id}`)
  revalidatePath(`/tutor/sessions/${sessionId}`)
  return { success: true }
}
