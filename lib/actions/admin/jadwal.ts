'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'

export type JadwalSessionDetail = {
  tema: string | null
  topik: string | null
  cp_list: { id: string; label: string; bank_soal_url: string | null }[]
  materials: { id: string; title: string; link_url: string | null; file_path: string | null }[]
  assessments: { id: string; title: string; score: number | null; max_score: number; link_url: string | null; level: string | null }[]
  catatan: string | null
  attendance_notes: string | null
}

export async function getJadwalSessionDetail(
  sessionId: string,
  studentId: string,
): Promise<JadwalSessionDetail> {
  const admin = createAdminClient()

  const [sessionRes, attendanceRes, noteRes, materialsRes] = await Promise.all([
    admin
      .from('sessions')
      .select('curriculum_topic_id, selected_cp_ids, topic, custom_theme, custom_learning_outcomes')
      .eq('id', sessionId)
      .maybeSingle() as unknown as Promise<{
        data: {
          curriculum_topic_id: string | null
          selected_cp_ids: string[] | null
          topic: string | null
          custom_theme: string | null
          custom_learning_outcomes: string[] | null
        } | null
        error: unknown
      }>,
    admin
      .from('attendances')
      .select('notes')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .maybeSingle() as unknown as Promise<{ data: { notes: string | null } | null }>,
    admin
      .from('performance_notes')
      .select('body')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .maybeSingle() as unknown as Promise<{ data: { body: string } | null }>,
    admin
      .from('materials')
      .select('id, title, link_url, file_path')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true }) as unknown as Promise<{
        data: { id: string; title: string; link_url: string | null; file_path: string | null }[] | null
      }>,
  ])

  type AssessmentRow = { id: string; title: string; max_score: number; link_url: string | null }
  const assessmentQuery = await (admin
    .from('assessments')
    .select('id, title, max_score, link_url')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true }) as unknown as Promise<{ data: AssessmentRow[] | null }>)
  const assessmentRows = assessmentQuery.data

  const session = sessionRes.data

  // cp_urls may not exist yet (migration 034) — fetch separately and ignore if missing
  let cp_urls: Record<string, string> = {}
  try {
    const { data: urlData, error: urlError } = await (admin
      .from('sessions')
      .select('cp_urls')
      .eq('id', sessionId)
      .maybeSingle() as unknown as Promise<{ data: { cp_urls: Record<string, string> | null } | null; error: unknown }>)
    if (!urlError && urlData?.cp_urls) cp_urls = urlData.cp_urls
  } catch {
    // column not yet migrated — skip silently
  }

  const selectedIds: string[] = session?.selected_cp_ids ?? []

  const allCurriculumIds = [
    ...(session?.curriculum_topic_id ? [session.curriculum_topic_id] : []),
    ...selectedIds,
  ]

  let tema: string | null = null
  let topik: string | null = null
  let cp_list: JadwalSessionDetail['cp_list'] = []

  if (allCurriculumIds.length > 0) {
    const { data: ctRows } = await admin
      .from('curriculum_topics')
      .select('id, theme, topic, learning_outcomes')
      .in('id', allCurriculumIds) as unknown as {
        data: { id: string; theme: string | null; topic: string; learning_outcomes: string | null }[] | null
      }

    const ctMap = new Map((ctRows ?? []).map(r => [r.id, r]))

    const mainId = session?.curriculum_topic_id
    const mainRow = mainId ? ctMap.get(mainId) : null
    const fallbackRow = !mainRow && selectedIds.length > 0 ? ctMap.get(selectedIds[0]) : null
    const sourceRow = mainRow ?? fallbackRow ?? null

    tema  = sourceRow?.theme ?? null
    topik = sourceRow?.topic ?? null

    cp_list = selectedIds.map(id => {
      const row = ctMap.get(id)
      return {
        id,
        label: row?.learning_outcomes ?? row?.topic ?? id,
        bank_soal_url: cp_urls[id] ?? null,
      }
    })
  } else if (session && (session.custom_theme || (session.custom_learning_outcomes?.length ?? 0) > 0)) {
    // Kelas privat — tutor-authored tema/topik/CP, not linked to curriculum_topics
    tema = session.custom_theme
    topik = session.topic
    cp_list = (session.custom_learning_outcomes ?? []).map((text, i) => ({
      id: `custom-${i}`,
      label: text,
      bank_soal_url: null,
    }))
  }

  const assessmentList = assessmentRows ?? []
  let assessments: JadwalSessionDetail['assessments'] = []

  if (assessmentList.length > 0) {
    const aIds = assessmentList.map(a => a.id)
    const { data: results } = await (admin
      .from('assessment_results')
      .select('assessment_id, score, feedback')
      .eq('student_id', studentId)
      .in('assessment_id', aIds) as unknown as Promise<{ data: { assessment_id: string; score: number | null; feedback: string | null }[] | null }>)

    const resultMap = new Map((results ?? []).map((r: { assessment_id: string; score: number | null; feedback: string | null }) => [r.assessment_id, r]))
    assessments = assessmentList.map((a: AssessmentRow) => ({
      id: a.id,
      title: a.title,
      score: resultMap.get(a.id)?.score ?? null,
      max_score: a.max_score,
      link_url: a.link_url,
      level: resultMap.get(a.id)?.feedback ?? null,
    }))
  }

  return {
    tema,
    topik,
    cp_list,
    materials: materialsRes.data ?? [],
    assessments,
    catatan: noteRes.data?.body ?? null,
    attendance_notes: attendanceRes.data?.notes ?? null,
  }
}
