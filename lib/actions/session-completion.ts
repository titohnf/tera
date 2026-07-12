'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'

export type CompletionCheck = {
  studentCount: number
  hasTopic: boolean
  attendanceCount: number
  presentLateCount: number
  notesCount: number
  materialsCount: number
  assessmentsCount: number
  gradedCount: number
  hasAllAttendance: boolean
  hasAllNotes: boolean
  hasMaterials: boolean
  hasAssessments: boolean
  canComplete: boolean
}

export async function getSessionCompletionStatus(sessionId: string): Promise<CompletionCheck | null> {
  const admin = createAdminClient()

  const { data: session } = await admin
    .from('sessions')
    .select('id, status, topic, class_id')
    .eq('id', sessionId)
    .single()

  if (!session) return null

  const [
    { count: studentCount },
    { count: attendanceCount },
    { data: presentLateAttendances },
    { count: notesCount },
    { count: materialsCount },
    { data: assessmentList },
  ] = await Promise.all([
    admin.from('class_students').select('*', { count: 'exact', head: true }).eq('class_id', session.class_id).eq('is_active', true),
    admin.from('attendances').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
    admin.from('attendances').select('student_id').eq('session_id', sessionId).in('status', ['present', 'late']),
    admin.from('performance_notes').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
    admin.from('materials').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
    admin.from('assessments').select('id').eq('session_id', sessionId),
  ])

  const sc = studentCount ?? 0
  const assessmentIds = (assessmentList ?? []).map(a => a.id)
  const assessmentsCount = assessmentIds.length

  // Count how many students have a score (not null) across all assessments for this session
  let gradedCount = 0
  if (assessmentIds.length > 0 && sc > 0) {
    const { count } = await admin
      .from('assessment_results')
      .select('*', { count: 'exact', head: true })
      .in('assessment_id', assessmentIds)
      .not('score', 'is', null)
    gradedCount = count ?? 0
  }

  const presentLateCount = (presentLateAttendances ?? []).length
  const hasTopic = !!(session.topic?.trim())
  const hasAllAttendance = (attendanceCount ?? 0) >= sc && sc > 0
  // Notes required for present/late students; skip only if attendance is fully submitted and none are present/late
  const hasAllNotes = !hasAllAttendance
    ? false
    : presentLateCount === 0
      ? true
      : (notesCount ?? 0) >= presentLateCount
  const hasMaterials = (materialsCount ?? 0) >= 1
  // Requires at least 1 assessment AND all students graded in every assessment
  const hasAssessments = assessmentsCount >= 1 && gradedCount >= assessmentsCount * sc
  const canComplete = hasTopic && hasAllAttendance && hasAllNotes && hasMaterials && hasAssessments

  return {
    studentCount: sc,
    hasTopic,
    attendanceCount: attendanceCount ?? 0,
    presentLateCount,
    notesCount: notesCount ?? 0,
    materialsCount: materialsCount ?? 0,
    assessmentsCount,
    gradedCount,
    hasAllAttendance,
    hasAllNotes,
    hasMaterials,
    hasAssessments,
    canComplete,
  }
}

/**
 * Auto-complete a session when all required items are filled:
 * topic, attendance for every student, notes for every student,
 * at least 1 material, and at least 1 assessment.
 */
export async function checkAndCompleteSession(sessionId: string) {
  const admin = createAdminClient()

  const check = await getSessionCompletionStatus(sessionId)
  if (!check?.canComplete) return

  const { data: session } = await admin
    .from('sessions')
    .select('status')
    .eq('id', sessionId)
    .single()

  if (!session) return
  if (session.status === 'completed' || session.status === 'cancelled') return

  await admin
    .from('sessions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', sessionId)
}
