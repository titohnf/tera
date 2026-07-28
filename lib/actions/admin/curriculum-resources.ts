'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type ActionState = { error: string } | null
export type ResourceKind = 'materi' | 'bank_soal'

export type TopicContext = {
  curriculum: string
  subject_id: string
  grade_level: string
  semester: number
  theme: string
  topic: string
}

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function createCurriculumResource(
  ctx_: TopicContext,
  kind: ResourceKind,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const title = (formData.get('title') as string)?.trim()
  const linkUrl = (formData.get('link_url') as string)?.trim()
  if (!title) return { error: 'Judul wajib diisi' }
  if (!linkUrl) return { error: 'Link wajib diisi' }

  const { curriculum, subject_id, grade_level, semester, theme, topic } = ctx_
  const { error } = await ctx.admin.from('curriculum_resources').insert({
    subject_id,
    curriculum,
    grade_level,
    semester,
    theme,
    topic,
    kind,
    title,
    link_url: linkUrl,
    created_by: ctx.user.id,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/materi-bank-soal')
  return null
}

export async function deleteCurriculumResource(id: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin.from('curriculum_resources').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/materi-bank-soal')
  return null
}
