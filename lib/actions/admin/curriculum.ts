'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type ActionState = { error: string } | null

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

function parseTopicFormData(formData: FormData) {
  return {
    curriculum: (formData.get('curriculum') as string)?.trim() || 'Kurikulum Merdeka',
    subject_id: formData.get('subject_id') as string,
    grade_level: (formData.get('grade_level') as string)?.trim(),
    semester: Number(formData.get('semester')),
    theme: (formData.get('theme') as string)?.trim() || null,
    topic: (formData.get('topic') as string)?.trim() || null,
    learning_outcomes: (formData.get('learning_outcomes') as string)?.trim() || null,
    sort_order: Number(formData.get('sort_order') ?? 0),
  }
}

export async function createCurriculumThemes(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const curriculum = (formData.get('curriculum') as string)?.trim() || 'Kurikulum Merdeka'
  const subject_id = formData.get('subject_id') as string
  const grade_level = (formData.get('grade_level') as string)?.trim()
  const semester = Number(formData.get('semester'))
  const themes = (formData.getAll('theme') as string[]).map(t => t.trim()).filter(Boolean)
  const sortOrders = (formData.getAll('sort_order') as string[]).map(Number)

  if (!subject_id || !grade_level || ![1, 2].includes(semester)) {
    return { error: 'Konteks tidak lengkap' }
  }
  if (themes.length === 0) return { error: 'Minimal satu tema harus diisi' }

  const rows = themes.map((theme, i) => ({ curriculum, subject_id, grade_level, semester, theme, topic: null, learning_outcomes: null, sort_order: sortOrders[i] ?? i + 1 }))
  const { error } = await ctx.admin.from('curriculum_topics').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/admin/curriculum')
  return null
}

export async function createCurriculumTopics(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const curriculum = (formData.get('curriculum') as string)?.trim() || 'Kurikulum Merdeka'
  const subject_id = formData.get('subject_id') as string
  const grade_level = (formData.get('grade_level') as string)?.trim()
  const semester = Number(formData.get('semester'))
  const theme = (formData.get('theme') as string)?.trim() || null
  const topics = (formData.getAll('topic') as string[]).map(t => t.trim()).filter(Boolean)
  const sortOrders = (formData.getAll('sort_order') as string[]).map(Number)

  if (!subject_id || !grade_level || !theme || ![1, 2].includes(semester)) {
    return { error: 'Konteks tidak lengkap' }
  }
  if (topics.length === 0) return { error: 'Minimal satu topik harus diisi' }

  const rows = topics.map((topic, i) => ({ curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes: null, sort_order: sortOrders[i] ?? i + 1 }))
  const { error } = await ctx.admin.from('curriculum_topics').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/admin/curriculum')
  return null
}

export async function createCurriculumCPs(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const curriculum = (formData.get('curriculum') as string)?.trim() || 'Kurikulum Merdeka'
  const subject_id = formData.get('subject_id') as string
  const grade_level = (formData.get('grade_level') as string)?.trim()
  const semester = Number(formData.get('semester'))
  const theme = (formData.get('theme') as string)?.trim() || null
  const topic = (formData.get('topic') as string)?.trim() || null
  const learningOutcomes = (formData.getAll('learning_outcomes') as string[]).map(s => s.trim()).filter(Boolean)
  const sortOrders = (formData.getAll('sort_order') as string[]).map(Number)

  if (!subject_id || !grade_level || !theme || !topic || ![1, 2].includes(semester)) {
    return { error: 'Konteks tidak lengkap' }
  }
  if (learningOutcomes.length === 0) return { error: 'Minimal satu CP harus diisi' }

  const rows = learningOutcomes.map((learning_outcomes, i) => ({ curriculum, subject_id, grade_level, semester, theme, topic, learning_outcomes, sort_order: sortOrders[i] ?? i + 1 }))
  const { error } = await ctx.admin.from('curriculum_topics').insert(rows)
  if (error) return { error: error.message }
  revalidatePath('/admin/curriculum')
  return null
}

export async function createCurriculumTopic(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const data = parseTopicFormData(formData)
  if (!data.subject_id || !data.grade_level || !data.theme || ![1, 2].includes(data.semester)) {
    return { error: 'Mata pelajaran, kelas, semester, dan tema wajib diisi' }
  }

  const { error } = await ctx.admin.from('curriculum_topics').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin/curriculum')
  return null
}

export async function updateCurriculumTopic(id: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const data = parseTopicFormData(formData)
  if (!data.subject_id || !data.grade_level || !data.theme || ![1, 2].includes(data.semester)) {
    return { error: 'Mata pelajaran, kelas, semester, dan tema wajib diisi' }
  }

  const { error } = await ctx.admin.from('curriculum_topics').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/curriculum')
  return null
}

export async function deleteCurriculumTopic(id: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin.from('curriculum_topics').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/curriculum')
  return null
}

type ThemeContext = { curriculum: string; subject_id: string; grade_level: string; semester: number; theme: string | null }
type TopicContext = ThemeContext & { topic: string }

export async function renameTheme(ctx_: ThemeContext, newTheme: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  if (!newTheme.trim()) return { error: 'Nama tema tidak boleh kosong' }
  const { curriculum, subject_id, grade_level, semester, theme } = ctx_
  let query = ctx.admin.from('curriculum_topics')
    .update({ theme: newTheme.trim() })
    .eq('curriculum', curriculum).eq('subject_id', subject_id)
    .eq('grade_level', grade_level).eq('semester', semester)
  const { error } = theme === null ? await query.is('theme', null) : await query.eq('theme', theme)
  if (error) return { error: error.message }
  revalidatePath('/admin/curriculum')
  return null
}

export async function deleteTheme(ctx_: ThemeContext): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  const { curriculum, subject_id, grade_level, semester, theme } = ctx_
  let query = ctx.admin.from('curriculum_topics')
    .delete()
    .eq('curriculum', curriculum).eq('subject_id', subject_id)
    .eq('grade_level', grade_level).eq('semester', semester)
  const { error } = theme === null ? await query.is('theme', null) : await query.eq('theme', theme)
  if (error) return { error: error.message }
  revalidatePath('/admin/curriculum')
  return null
}

export async function renameTopic(ctx_: TopicContext, newTopic: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  if (!newTopic.trim()) return { error: 'Nama topik tidak boleh kosong' }
  const { curriculum, subject_id, grade_level, semester, theme, topic } = ctx_
  let query = ctx.admin.from('curriculum_topics')
    .update({ topic: newTopic.trim() })
    .eq('curriculum', curriculum).eq('subject_id', subject_id)
    .eq('grade_level', grade_level).eq('semester', semester)
    .eq('topic', topic)
  const { error } = theme === null ? await query.is('theme', null) : await query.eq('theme', theme)
  if (error) return { error: error.message }
  revalidatePath('/admin/curriculum')
  return null
}

export async function deleteTopic(ctx_: TopicContext): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  const { curriculum, subject_id, grade_level, semester, theme, topic } = ctx_
  let query = ctx.admin.from('curriculum_topics')
    .delete()
    .eq('curriculum', curriculum).eq('subject_id', subject_id)
    .eq('grade_level', grade_level).eq('semester', semester)
    .eq('topic', topic)
  const { error } = theme === null ? await query.is('theme', null) : await query.eq('theme', theme)
  if (error) return { error: error.message }
  revalidatePath('/admin/curriculum')
  return null
}

export async function saveSessionCpUrls(
  sessionId: string,
  cpUrls: Record<string, string>,
): Promise<{ error?: string }> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('sessions')
    .update({ cp_urls: cpUrls })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/sessions/${sessionId}`)
  return {}
}

export async function updateSessionTopic(
  sessionId: string,
  curriculumTopicId: string | null,
  topicText: string,
  selectedCpIds: string[] = [],
): Promise<{ error?: string }> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('sessions')
    .update({
      curriculum_topic_id: curriculumTopicId,
      topic: topicText,
      selected_cp_ids: selectedCpIds,
      custom_theme: null,
      custom_learning_outcomes: [],
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/sessions/${sessionId}`)
  return {}
}

export async function saveCustomTopicAdmin(
  sessionId: string,
  theme: string,
  topicText: string,
  learningOutcomes: string[] = [],
): Promise<{ error?: string }> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('sessions')
    .update({
      custom_theme: theme || null,
      topic: topicText,
      custom_learning_outcomes: learningOutcomes.filter(Boolean),
      curriculum_topic_id: null,
      selected_cp_ids: [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/sessions/${sessionId}`)
  return {}
}
