'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

const AssessmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  max_score: z.number().min(1).max(1000).default(100),
  due_at: z.string().datetime().nullable().optional(),
  link_url: z.string().url().nullable().optional(),
})

export async function createAssessmentAdmin(sessionId: string, data: unknown) {
  const parsed = AssessmentSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }

  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: session } = await ctx.admin.from('sessions').select('id').eq('id', sessionId).single()
  if (!session) return { error: 'Sesi tidak ditemukan' }

  const { error } = await ctx.admin.from('assessments').insert({
    session_id: sessionId,
    created_by: ctx.user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    max_score: parsed.data.max_score,
    due_at: parsed.data.due_at ?? null,
    link_url: parsed.data.link_url ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/tutor/sessions/${sessionId}`)
  return { success: true }
}

const GradesSchema = z.array(z.object({
  student_id: z.string().uuid(),
  score: z.number().min(0).max(9999).nullable(),
  feedback: z.string().max(500).optional(),
}))

export async function submitGradesAdmin(assessmentId: string, sessionId: string, data: unknown) {
  const parsed = GradesSchema.safeParse(data)
  if (!parsed.success) return { error: 'Data nilai tidak valid' }

  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const rows = parsed.data
    .filter(r => r.score !== null)
    .map(r => ({
      assessment_id: assessmentId,
      student_id: r.student_id,
      score: r.score!,
      feedback: r.feedback ?? null,
      graded_by: ctx.user.id,
      graded_at: new Date().toISOString(),
    }))

  if (rows.length === 0) return { error: 'Tidak ada nilai yang diisi' }

  const { error } = await ctx.admin
    .from('assessment_results')
    .upsert(rows, { onConflict: 'assessment_id,student_id' })

  if (error) return { error: error.message }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/tutor/sessions/${sessionId}`)
  return { success: true }
}

export async function deleteAssessmentAdmin(assessmentId: string, sessionId: string) {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('assessments')
    .delete()
    .eq('id', assessmentId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/tutor/sessions/${sessionId}`)
  return { success: true }
}
