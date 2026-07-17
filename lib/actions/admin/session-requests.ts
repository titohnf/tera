'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function approveSessionChangeRequest(requestId: string): Promise<{ error?: string }> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  const { user, admin } = ctx

  const { data: request } = await admin
    .from('session_change_requests')
    .select('id, session_id, request_type, new_scheduled_at, new_tutor_id, new_tutor_confirmed, status')
    .eq('id', requestId)
    .single()
  if (!request) return { error: 'Pengajuan tidak ditemukan' }
  if (request.status !== 'pending') return { error: 'Pengajuan ini sudah diproses' }
  if (request.request_type === 'change_tutor' && request.new_tutor_confirmed !== true) {
    return { error: 'Tutor pengganti belum konfirmasi kesediaannya' }
  }

  if (request.request_type === 'cancel') {
    await admin.from('sessions').update({ status: 'cancelled' }).eq('id', request.session_id)
  } else if (request.request_type === 'reschedule') {
    await admin.from('sessions').update({ scheduled_at: request.new_scheduled_at }).eq('id', request.session_id)
  } else if (request.request_type === 'change_tutor') {
    await admin.from('sessions').update({ tutor_id: request.new_tutor_id }).eq('id', request.session_id)
  }

  const { error } = await admin
    .from('session_change_requests')
    .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId)
  if (error) return { error: error.message }

  revalidatePath('/admin/session-requests')
  revalidatePath(`/tutor/sessions/${request.session_id}`)
  revalidatePath(`/admin/sessions/${request.session_id}`)
  revalidatePath('/tutor', 'layout')
  revalidatePath('/admin', 'layout')
  return {}
}

export async function rejectSessionChangeRequest(requestId: string, adminNote: string): Promise<{ error?: string }> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  const { user, admin } = ctx

  const { data: request } = await admin
    .from('session_change_requests')
    .select('id, session_id, status')
    .eq('id', requestId)
    .single()
  if (!request) return { error: 'Pengajuan tidak ditemukan' }
  if (request.status !== 'pending') return { error: 'Pengajuan ini sudah diproses' }

  const { error } = await admin
    .from('session_change_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote.trim() || null,
    })
    .eq('id', requestId)
  if (error) return { error: error.message }

  revalidatePath('/admin/session-requests')
  revalidatePath(`/tutor/sessions/${request.session_id}`)
  revalidatePath('/tutor', 'layout')
  revalidatePath('/admin', 'layout')
  return {}
}
