'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ActionState = { error: string } | null

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function createSession(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const classId = formData.get('class_id') as string
  const tutorId = formData.get('tutor_id') as string
  const subjectId = (formData.get('subject_id') as string) || null
  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const duration = Number(formData.get('duration_minutes') ?? 90)
  const location = (formData.get('location') as string)?.trim() || null
  const topic = (formData.get('topic') as string)?.trim() || null
  const curriculumTopicId = (formData.get('curriculum_topic_id') as string) || null
  const recurrencePattern = (formData.get('recurrence_pattern') as string) || 'none'
  const recurrenceCount = Math.min(Math.max(Number(formData.get('recurrence_count') ?? 1), 1), 52)
  const redirectTo = (formData.get('redirect_to') as string) || null

  if (!classId) return { error: 'Kelas wajib dipilih' }
  if (!tutorId) return { error: 'Tutor wajib dipilih' }
  if (!date || !time) return { error: 'Tanggal dan waktu wajib diisi' }

  const baseDate = new Date(`${date}T${time}:00`)
  const count = recurrencePattern === 'none' ? 1 : recurrenceCount

  const sessionsToInsert = Array.from({ length: count }, (_, i) => {
    const d = new Date(baseDate)
    if (i > 0) {
      if (recurrencePattern === 'weekly') d.setDate(d.getDate() + i * 7)
      else if (recurrencePattern === 'biweekly') d.setDate(d.getDate() + i * 14)
      else if (recurrencePattern === 'monthly') d.setMonth(d.getMonth() + i)
    }
    return {
      class_id: classId,
      tutor_id: tutorId,
      subject_id: subjectId || null,
      curriculum_topic_id: curriculumTopicId || null,
      topic: topic || null,
      scheduled_at: d.toISOString(),
      duration_minutes: duration,
      location,
      status: 'scheduled' as const,
    }
  })

  if (count === 1) {
    const { data, error } = await ctx.admin
      .from('sessions')
      .insert(sessionsToInsert[0])
      .select('id')
      .single()

    if (error) return { error: error.message }
    revalidatePath('/admin/sessions')
    revalidatePath(`/admin/classes/${classId}`)
    redirect(redirectTo || `/admin/sessions/${data.id}`)
  } else {
    const { error } = await ctx.admin.from('sessions').insert(sessionsToInsert)
    if (error) return { error: error.message }
    revalidatePath('/admin/sessions')
    revalidatePath(`/admin/classes/${classId}`)
    redirect(redirectTo || `/admin/classes/${classId}`)
  }
}

export async function updateSession(sessionId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const tutorId = formData.get('tutor_id') as string
  const subjectId = (formData.get('subject_id') as string) || null
  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const duration = Number(formData.get('duration_minutes') ?? 90)
  const location = (formData.get('location') as string)?.trim() || null
  const topic = (formData.get('topic') as string)?.trim() || null

  if (!date || !time) return { error: 'Tanggal dan waktu wajib diisi' }
  if (!tutorId) return { error: 'Tutor wajib dipilih' }

  const scheduledAt = new Date(`${date}T${time}:00`).toISOString()

  const { error } = await ctx.admin
    .from('sessions')
    .update({
      tutor_id: tutorId,
      subject_id: subjectId,
      scheduled_at: scheduledAt,
      duration_minutes: duration,
      location,
      topic,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath('/admin/sessions')
  redirect(`/admin/sessions/${sessionId}`)
}

export async function updateSessionTopic(sessionId: string, topic: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('sessions')
    .update({ topic: topic.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/sessions/${sessionId}`)
  return null
}

export async function updateSessionStatus(sessionId: string, newStatus: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('sessions')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) return { error: error.message }

  // When session completes, create payment record (fallback if edge function not deployed)
  if (newStatus === 'completed') {
    const { data: session } = await ctx.admin
      .from('sessions')
      .select('class_id, tutor_id')
      .eq('id', sessionId)
      .single()

    if (session) {
      const { data: scheme } = await ctx.admin
        .from('salary_schemes')
        .select('*')
        .eq('class_id', session.class_id)
        .eq('tutor_id', session.tutor_id)
        .single()

      if (scheme) {
        const { count: presentCount } = await ctx.admin
          .from('attendances')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .in('status', ['present', 'late'])

        let bonusAmount = 0
        if (scheme.bonus_type === 'student_count' && scheme.bonus_threshold !== null && (presentCount ?? 0) >= scheme.bonus_threshold) {
          bonusAmount = scheme.bonus_amount
        }

        await ctx.admin.from('session_payments').upsert({
          session_id: sessionId,
          tutor_id: session.tutor_id,
          base_amount: scheme.base_amount,
          bonus_amount: bonusAmount,
          status: 'pending',
        }, { onConflict: 'session_id,tutor_id' })
      }
    }
  }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath('/admin/sessions')
  revalidatePath('/admin/payments')
  return null
}

export async function rescheduleSession(sessionId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const date = formData.get('date') as string
  const time = formData.get('time') as string
  if (!date || !time) return { error: 'Tanggal dan waktu wajib diisi.' }

  const scheduledAt = new Date(`${date}T${time}:00`).toISOString()
  if (new Date(scheduledAt) < new Date()) return { error: 'Jadwal baru harus di masa depan.' }

  const { data: session } = await ctx.admin.from('sessions').select('status').eq('id', sessionId).single()
  if (!session) return { error: 'Sesi tidak ditemukan.' }
  if (session.status === 'completed') return { error: 'Sesi yang sudah selesai tidak dapat dijadwalkan ulang.' }

  const { error } = await ctx.admin
    .from('sessions')
    .update({
      scheduled_at: scheduledAt,
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath('/admin/sessions')
  return null
}

export async function resetSession(sessionId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { admin } = ctx

  await Promise.all([
    admin.from('attendances').delete().eq('session_id', sessionId),
    admin.from('performance_notes').delete().eq('session_id', sessionId),
    admin.from('materials').delete().eq('session_id', sessionId),
    admin.from('assessments').delete().eq('session_id', sessionId),
  ])

  const { error } = await admin
    .from('sessions')
    .update({ topic: null, status: 'scheduled', updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath('/admin/sessions')
  return null
}

export async function deleteSession(sessionId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: session } = await ctx.admin
    .from('sessions')
    .select('status')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: 'Sesi tidak ditemukan' }
  if (session.status === 'completed') return { error: 'Sesi yang sudah selesai tidak dapat dihapus.' }

  const { error } = await ctx.admin.from('sessions').delete().eq('id', sessionId)
  if (error) return { error: error.message }

  revalidatePath('/admin/sessions')
  return null
}
