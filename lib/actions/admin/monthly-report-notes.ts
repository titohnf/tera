'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const Schema = z.object({
  student_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  mastered: z.string().max(4000),
  needs_practice: z.string().max(4000),
  other_notes: z.string().max(4000),
})

export async function saveMonthlyReportNotes(data: unknown) {
  const parsed = Schema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }

  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Tidak diizinkan' }

  const { student_id, month } = parsed.data
  const mastered = parsed.data.mastered.trim()
  const needsPractice = parsed.data.needs_practice.trim()
  const otherNotes = parsed.data.other_notes.trim()

  const { error } = await admin.from('monthly_report_notes').upsert({
    student_id,
    month,
    mastered: mastered || null,
    needs_practice: needsPractice || null,
    other_notes: otherNotes || null,
    created_by: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'student_id,month' })

  if (error) return { error: error.message }

  revalidatePath('/admin/laporan-bulanan')
  return { success: true }
}
