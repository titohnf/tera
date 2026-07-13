'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const NoteSchema = z.object({
  student_id: z.string().uuid(),
  category: z.string().min(1),
  body: z.string().max(2000),
  template_id: z.string().uuid().nullable().optional(),
})

export async function savePerformanceNoteAdmin(sessionId: string, data: unknown) {
  const parsed = NoteSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }

  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Tidak diizinkan' }

  const { data: session } = await admin.from('sessions').select('id, tutor_id').eq('id', sessionId).single()
  if (!session) return { error: 'Sesi tidak ditemukan' }

  const body = parsed.data.body.trim()

  if (!body) {
    const { error } = await admin
      .from('performance_notes')
      .delete()
      .eq('session_id', sessionId)
      .eq('student_id', parsed.data.student_id)
      .eq('category', parsed.data.category)
    if (error) return { error: error.message }
    revalidatePath(`/admin/sessions/${sessionId}`)
    revalidatePath(`/tutor/sessions/${sessionId}`)
    return { success: true }
  }

  const { error } = await admin.from('performance_notes').upsert({
    session_id: sessionId,
    student_id: parsed.data.student_id,
    category: parsed.data.category,
    tutor_id: session.tutor_id,
    template_id: parsed.data.template_id ?? null,
    body,
  }, { onConflict: 'session_id,student_id,category' })

  if (error) return { error: error.message }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/tutor/sessions/${sessionId}`)
  return { success: true }
}
