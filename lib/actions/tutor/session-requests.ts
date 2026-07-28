'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type SessionRequestType = 'cancel' | 'reschedule' | 'change_tutor' | 'change_subject'

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
  options: { newScheduledAt?: string; newTutorId?: string; newSubjectId?: string } = {}
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
  if (requestType === 'change_subject' && !options.newSubjectId) {
    return { error: 'Mapel baru wajib dipilih' }
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
    new_subject_id: requestType === 'change_subject' ? options.newSubjectId : null,
  })
  if (error) return { error: error.message }

  revalidatePath(`/tutor/sessions/${sessionId}`)
  revalidatePath('/admin/session-requests')
  revalidatePath('/admin', 'layout')
  revalidatePath('/tutor', 'layout')
  return {}
}

export async function withdrawSessionChangeRequest(
  requestId: string,
  sessionId: string
): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }
  const admin = createAdminClient()

  const { data: request } = await admin
    .from('session_change_requests')
    .select('id, request_type, new_tutor_confirmed')
    .eq('id', requestId)
    .eq('requested_by', user.id)
    .eq('status', 'pending')
    .maybeSingle()
  if (!request) return { error: 'Pengajuan tidak ditemukan' }
  // Once the proposed substitute has confirmed, they're relying on this
  // arrangement — don't let it get silently deleted out from under them.
  if (request.request_type === 'change_tutor' && request.new_tutor_confirmed === true) {
    return { error: 'Tutor pengganti sudah menyetujui — tidak bisa dibatalkan sendiri, hubungi admin untuk menolaknya' }
  }

  const { error } = await admin
    .from('session_change_requests')
    .delete()
    .eq('id', requestId)
    .eq('requested_by', user.id)
    .eq('status', 'pending')
  if (error) return { error: error.message }

  revalidatePath(`/tutor/sessions/${sessionId}`)
  revalidatePath('/admin/session-requests')
  revalidatePath('/admin', 'layout')
  return {}
}

// Called by the proposed replacement tutor (new_tutor_id), before the request
// ever reaches admin. Declining auto-rejects the request; accepting just marks
// it confirmed so it becomes actionable by admin.
export async function respondToTutorSwapRequest(
  requestId: string,
  accept: boolean
): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }
  const admin = createAdminClient()

  const { data: request } = await admin
    .from('session_change_requests')
    .select('id, session_id, status, new_tutor_id, new_tutor_confirmed, request_type')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Pengajuan tidak ditemukan' }
  if (request.new_tutor_id !== user.id) return { error: 'Tidak diizinkan' }
  if (request.request_type !== 'change_tutor') return { error: 'Pengajuan tidak valid' }
  if (request.status !== 'pending' || request.new_tutor_confirmed !== null) {
    return { error: 'Pengajuan ini sudah direspons' }
  }

  const { error } = await admin
    .from('session_change_requests')
    .update(
      accept
        ? { new_tutor_confirmed: true }
        : {
            new_tutor_confirmed: false,
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            admin_note: 'Ditolak oleh tutor pengganti yang diajukan.',
          }
    )
    .eq('id', requestId)
  if (error) return { error: error.message }

  revalidatePath('/tutor')
  revalidatePath(`/tutor/sessions/${request.session_id}`)
  revalidatePath('/admin/session-requests')
  // The admin notification bell lives in the shared admin layout, not just
  // the session-requests page — revalidate the whole layout so it refreshes
  // regardless of which admin page is currently open.
  revalidatePath('/admin', 'layout')
  return {}
}

// Called by the requesting tutor to dismiss a resolved (approved/rejected)
// notice, shown on the session detail page.
export async function acknowledgeSessionChangeRequest(requestId: string): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('session_change_requests')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('requested_by', user.id)
    .select('session_id')
    .single()
  if (error) return { error: error.message }

  revalidatePath('/tutor')
  if (data) revalidatePath(`/tutor/sessions/${data.session_id}`)
  return {}
}

// Called by the proposed tutor to dismiss a notice that admin approved or
// rejected the swap request after they had already agreed to take it on.
export async function acknowledgeTutorSwapOutcome(requestId: string): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('session_change_requests')
    .update({ new_tutor_acknowledged_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('new_tutor_id', user.id)
    .select('session_id')
    .single()
  if (error) return { error: error.message }

  revalidatePath('/tutor')
  if (data) revalidatePath(`/tutor/sessions/${data.session_id}`)
  return {}
}
