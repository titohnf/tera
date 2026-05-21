'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { checkAndCompleteSession } from './session-completion'

const AssessmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  max_score: z.number().min(1).max(1000).default(100),
  due_at: z.string().datetime().nullable().optional(),
  link_url: z.string().url().nullable().optional(),
})

export async function createAssessment(sessionId: string, data: unknown) {
  const parsed = AssessmentSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }

  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  const { data: session } = await admin
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('tutor_id', user.id)
    .single()

  if (!session) return { error: 'Sesi tidak ditemukan' }

  const { error } = await admin.from('assessments').insert({
    session_id: sessionId,
    created_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    max_score: parsed.data.max_score,
    due_at: parsed.data.due_at ?? null,
    link_url: parsed.data.link_url ?? null,
  })

  if (error) return { error: error.message }

  await checkAndCompleteSession(sessionId)

  revalidatePath(`/tutor/sessions/${sessionId}/assessment`)
  revalidatePath(`/tutor/sessions/${sessionId}`)
  revalidatePath(`/admin/sessions/${sessionId}`)
  return { success: true }
}

const GradesSchema = z.array(z.object({
  student_id: z.string().uuid(),
  score: z.number().min(0).max(9999).nullable(),
  feedback: z.string().max(500).optional(),
}))

export async function submitGrades(assessmentId: string, sessionId: string, data: unknown) {
  const parsed = GradesSchema.safeParse(data)
  if (!parsed.success) return { error: 'Data nilai tidak valid' }

  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  const rows = parsed.data
    .filter(r => r.score !== null)
    .map(r => ({
      assessment_id: assessmentId,
      student_id: r.student_id,
      score: r.score!,
      feedback: r.feedback ?? null,
      graded_by: user.id,
      graded_at: new Date().toISOString(),
    }))

  if (rows.length === 0) return { error: 'Tidak ada nilai yang diisi' }

  const { error } = await admin
    .from('assessment_results')
    .upsert(rows, { onConflict: 'assessment_id,student_id' })

  if (error) return { error: error.message }

  revalidatePath(`/tutor/sessions/${sessionId}/assessment`)
  return { success: true }
}
