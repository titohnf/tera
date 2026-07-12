'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type SessionRequestType = 'cancel' | 'reschedule' | 'change_tutor'

async function verifyTutorSession(sessionId: string) {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: session } = await admin
    .from('sessions')
    .select('id, status')
    .eq('id', sessionId)
    .eq('tutor_id', user.id)
    .single()
  if (!session) return null
  return { user, admin, session }
}

export async function createSessionChangeRequest(
  sessionId: string,
  requestType: SessionRequestType,
  reason: string,
  options: { newScheduledAt?: string; newTutorId?: string } = {}
): Promise<{ error?: string }> {
  const ctx = await verifyTutorSession(sessionId)
  if (!ctx) return { error: 'Sesi tidak ditemukan' }
  const { user, admin, session } = ctx

  if (session.status === 'cancelled' || session.status === 'completed') {
    return { error: 'Sesi ini sudah selesai atau dibatalkan, tidak bisa diajukan perubahan' }
  }
  if (!reason.trim()) return { error: 'Alasan wajib diisi' }
  if (requestType === 'reschedule' && !options.newScheduledAt) {
    return { error: 'Tanggal & waktu baru wajib diisi' }
  }
  if (requestType === 'change_tutor' && !options.newTutorId) {
    return { error: 'Tutor pengganti wajib dipilih' }
  }

  const { data: existing } = await admin
    .from('session_change_requests')
    .select('id')
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .maybeSingle()
  if (existing) return { error: 'Sudah ada pengajuan yang menunggu persetujuan admin untuk sesi ini' }

  const { error } = await admin.from('session_change_requests').insert({
    session_id: sessionId,
    requested_by: user.id,
    request_type: requestType,
    reason: reason.trim(),
    new_scheduled_at: requestType === 'reschedule' ? options.newScheduledAt : null,
    new_tutor_id: requestType === 'change_tutor' ? options.newTutorId : null,
  })
  if (error) return { error: error.message }

  revalidatePath(`/tutor/sessions/${sessionId}`)
  revalidatePath('/admin/session-requests')
  return {}
}

export async function withdrawSessionChangeRequest(
  requestId: string,
  sessionId: string
): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }
  const admin = createAdminClient()

  const { error } = await admin
    .from('session_change_requests')
    .delete()
    .eq('id', requestId)
    .eq('requested_by', user.id)
    .eq('status', 'pending')
  if (error) return { error: error.message }

  revalidatePath(`/tutor/sessions/${sessionId}`)
  revalidatePath('/admin/session-requests')
  return {}
}
