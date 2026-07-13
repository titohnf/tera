'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { checkAndCompleteSession } from './session-completion'
import { isSessionTutor } from './session-access'

const AttendanceSchema = z.array(z.object({
  student_id: z.string().uuid(),
  status: z.enum(['present', 'late', 'absent', 'excused']),
  notes: z.string().optional(),
}))

export async function submitAttendance(sessionId: string, records: unknown) {
  const parsed = AttendanceSchema.safeParse(records)
  if (!parsed.success) return { error: 'Data presensi tidak valid' }

  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  // Verify the session belongs to this tutor (or they're a confirmed incoming swap tutor)
  if (!(await isSessionTutor(admin, sessionId, user.id))) return { error: 'Sesi tidak ditemukan' }

  const { data: session } = await admin.from('sessions').select('id, status').eq('id', sessionId).single()
  if (!session) return { error: 'Sesi tidak ditemukan' }
  if (session.status === 'cancelled') return { error: 'Sesi sudah dibatalkan' }

  const rows = parsed.data.map(r => ({
    session_id: sessionId,
    student_id: r.student_id,
    status: r.status,
    notes: r.notes ?? null,
    marked_by: user.id,
    marked_at: new Date().toISOString(),
  }))

  const { error } = await admin
    .from('attendances')
    .upsert(rows, { onConflict: 'session_id,student_id' })

  if (error) return { error: error.message }

  await checkAndCompleteSession(sessionId)

  revalidatePath(`/tutor/sessions/${sessionId}`)
  revalidatePath(`/tutor/sessions/${sessionId}/attendance`)
  revalidatePath(`/admin/sessions/${sessionId}`)
  return { success: true }
}
