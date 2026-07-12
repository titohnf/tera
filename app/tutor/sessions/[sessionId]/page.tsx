import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SessionTabs from '@/components/sessions/SessionTabs'
import SessionInfoCard from '@/components/admin/sessions/SessionInfoCard'
import MaterialUploader from '@/components/materials/MaterialUploader'
import { submitAttendance } from '@/lib/actions/attendance'
import { savePerformanceNote } from '@/lib/actions/notes'
import { createAssessment, submitGrades } from '@/lib/actions/assessments'
import { deleteMaterial, getSignedUrl } from '@/lib/actions/materials'
import { updateSessionTopicTutor } from '@/lib/actions/tutor/sessions'
import { checkAndCompleteSession, getSessionCompletionStatus } from '@/lib/actions/session-completion'
import SessionChangeRequestPanel from '@/components/tutor/SessionChangeRequestPanel'
import type { AttendanceStatus } from '@/lib/types/database'

type SessionDetail = {
  id: string
  class_id: string
  subject_id: string | null
  scheduled_at: string
  duration_minutes: number
  location: string | null
  status: string
  topic: string | null
  curriculum_topic_id: string | null
  selected_cp_ids: string[] | null
  cp_urls: Record<string, string> | null
  classes: { name: string; level: string | null } | null
  subjects: { name: string } | null
}

const STATUS_LABEL: Record<string, string> = {
  cancelled: 'Dibatalkan',
}

const STATUS_COLOR: Record<string, string> = {
  cancelled: 'bg-red-100 text-red-600',
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const user = await getUser()
  if (!user) return null
  const supabase = createAdminClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('id, class_id, subject_id, scheduled_at, duration_minutes, location, status, topic, curriculum_topic_id, selected_cp_ids, cp_urls, classes(name, level), subjects(name)')
    .eq('id', sessionId)
    .eq('tutor_id', user.id)
    .single() as { data: SessionDetail | null; error: unknown }

  if (!session) notFound()

  const [
    enrolledResult,
    attendanceResult,
    notesResult,
    templatesResult,
    materialsResult,
    assessmentsResult,
    profileResult,
    curriculumTopicsResult,
  ] = await Promise.all([
    supabase
      .from('class_students')
      .select('student_id, profiles(id, full_name, grade)')
      .eq('class_id', session.class_id)
      .eq('is_active', true),
    supabase
      .from('attendances')
      .select('student_id, status, notes')
      .eq('session_id', sessionId),
    supabase
      .from('performance_notes')
      .select('student_id, body, template_id')
      .eq('session_id', sessionId),
    supabase
      .from('performance_note_templates')
      .select('id, category, label, body')
      .eq('is_active', true)
      .order('category'),
    supabase
      .from('materials')
      .select('id, title, file_path, link_url, mime_type, file_size_bytes, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false }),
    supabase
      .from('assessments')
      .select('id, title, description, max_score, due_at, link_url, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single(),
    session.subject_id
      ? supabase
          .from('curriculum_topics')
          .select('id, grade_level, semester, theme, topic, learning_outcomes')
          .eq('subject_id', session.subject_id)
          .order('sort_order')
      : Promise.resolve({ data: [] }),
  ])

  const [{ data: latestRequest }, { data: otherTutors }] = await Promise.all([
    supabase
      .from('session_change_requests')
      .select('id, request_type, reason, new_scheduled_at, new_tutor_id, new_tutor_confirmed, status, admin_note, profiles!new_tutor_id(full_name)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'tutor')
      .eq('is_active', true)
      .neq('id', user.id)
      .order('full_name'),
  ])

  const sessionChangeRequest = latestRequest && latestRequest.status !== 'approved'
    ? {
        id: latestRequest.id,
        request_type: latestRequest.request_type,
        reason: latestRequest.reason,
        new_scheduled_at: latestRequest.new_scheduled_at,
        new_tutor_id: latestRequest.new_tutor_id,
        new_tutor_name: (latestRequest.profiles as unknown as { full_name: string } | null)?.full_name ?? null,
        new_tutor_confirmed: latestRequest.new_tutor_confirmed,
        status: latestRequest.status,
        admin_note: latestRequest.admin_note,
      }
    : null

  const enrolledStudents = enrolledResult.data ?? []
  const attendances = attendanceResult.data ?? []
  const existingNotes = notesResult.data ?? []
  const templates = templatesResult.data ?? []
  const materials = materialsResult.data ?? []
  const assessments = assessmentsResult.data ?? []
  const tutorName = (profileResult.data as { full_name: string } | null)?.full_name ?? null
  const curriculumTopics = (curriculumTopicsResult.data ?? []) as {
    id: string; grade_level: string; semester: number
    theme: string | null; topic: string; learning_outcomes: string | null
  }[]

  // Derive grade from enrolled students (mode of their grades)
  const enrolledGrades = enrolledStudents
    .map(cs => (cs.profiles as unknown as { grade: number | null } | null)?.grade)
    .filter((g): g is number => g != null)
  const sessionGrade = enrolledGrades.length > 0
    ? enrolledGrades.sort((a, b) =>
        enrolledGrades.filter(v => v === b).length - enrolledGrades.filter(v => v === a).length
      )[0]
    : null

  // Filter by grade only — semester grouping is shown in the dropdown itself
  const filteredCurriculumTopics = curriculumTopics.filter(t =>
    sessionGrade == null || t.grade_level === `Kelas ${sessionGrade}`
  )

  // Auto-complete if all criteria already met (handles sessions filled before this feature existed)
  await checkAndCompleteSession(sessionId)

  // Re-fetch status in case it was just completed + get completion diagnostics
  const [{ data: freshSession }, completionCheck] = await Promise.all([
    supabase.from('sessions').select('status').eq('id', sessionId).single(),
    getSessionCompletionStatus(sessionId),
  ])
  if (freshSession) session.status = freshSession.status

  const attendanceMap = Object.fromEntries(attendances.map(a => [a.student_id, a]))
  const noteMap = Object.fromEntries(existingNotes.map(n => [n.student_id, n]))

  const students = enrolledStudents.map(cs => {
    const profile = (cs.profiles as unknown as { id: string; full_name: string } | null)
    const sid = profile?.id ?? cs.student_id
    return {
      id: sid,
      full_name: profile?.full_name ?? 'Siswa',
      currentStatus: (attendanceMap[cs.student_id]?.status ?? null) as AttendanceStatus | null,
      attendanceNotes: attendanceMap[cs.student_id]?.notes ?? '',
      existingNote: noteMap[sid] ?? null,
    }
  })

  const assessmentIds = assessments.map(a => a.id)
  const { data: results } = assessmentIds.length > 0
    ? await supabase
        .from('assessment_results')
        .select('assessment_id, student_id, score, feedback')
        .in('assessment_id', assessmentIds)
    : { data: [] }

  const presentCount = attendances.filter(a => a.status === 'present' || a.status === 'late').length
  const date = new Date(session.scheduled_at)

  return (
    <div>
      <Link href="/tutor/classes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kelas Saya
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Kolom kiri — header + tab konten */}
        <div className="space-y-4">
          {/* Session header */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 mb-1">{session.classes?.name ?? 'Kelas'}</h1>
                <p className="text-sm text-gray-500">{session.topic ?? 'Topik belum ditentukan'}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[session.status] ?? 'bg-blue-100 text-blue-700'}`}>
                {STATUS_LABEL[session.status] ?? 'Sesuai Jadwal'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Tanggal & Waktu</p>
                <p className="font-medium">
                  {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-gray-500 text-xs">
                  {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  {' '}({session.duration_minutes} menit)
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Lokasi</p>
                <p className="font-medium">{session.location ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Kehadiran</p>
                <p className="font-medium">
                  {presentCount} / {enrolledStudents.length} siswa
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
            <SessionTabs
              sessionId={sessionId}
              sessionStatus={session.status}
              topic={session.topic}
              curriculumTopicId={session.curriculum_topic_id ?? null}
              curriculumTopics={filteredCurriculumTopics}
              hasSubject={!!session.subject_id}
              selectedCpIds={session.selected_cp_ids ?? []}
              cpUrls={session.cp_urls ?? {}}
              subjectName={session.subjects?.name ?? null}
              grade={sessionGrade}
              students={students}
              templates={templates}
              materials={materials}
              assessments={assessments}
              assessmentStudents={students.map(s => ({ id: s.id, full_name: s.full_name }))}
              results={results ?? []}
              materialUploader={
                <MaterialUploader
                  sessionId={sessionId}
                  tutorId={user.id}
                  classId={session.class_id}
                />
              }
              saveTopicAction={updateSessionTopicTutor}
              submitAttendanceAction={submitAttendance}
              saveNoteAction={savePerformanceNote}
              createAssessmentAction={createAssessment}
              submitGradesAction={submitGrades}
              deleteMaterialAction={deleteMaterial}
              signedUrlAction={getSignedUrl}
            />
          </div>
        </div>

        {/* Kolom kanan — info sesi + syarat penyelesaian */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <SessionInfoCard
            classLevel={session.classes?.level ?? null}
            tutorName={tutorName}
            date={date}
            durationMinutes={session.duration_minutes}
            location={session.location}
            subjects={session.subjects?.name ?? null}
            displayStatus={session.status}
          />

          {completionCheck && session.status !== 'cancelled' && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Syarat Penyelesaian Otomatis
              </p>
              <div className="space-y-1.5">
                {[
                  { label: 'Topik', ok: completionCheck.hasTopic },
                  { label: `Materi (${completionCheck.materialsCount})`, ok: completionCheck.hasMaterials },
                  { label: `Presensi (${completionCheck.attendanceCount}/${completionCheck.studentCount})`, ok: completionCheck.hasAllAttendance },
                  { label: `Catatan (${completionCheck.notesCount}/${completionCheck.presentLateCount})`, ok: completionCheck.hasAllNotes },
                  { label: `Asesmen & Nilai (${completionCheck.gradedCount}/${completionCheck.assessmentsCount * completionCheck.studentCount})`, ok: completionCheck.hasAssessments },
                ].map(({ label, ok }) => (
                  <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${ok ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                    {ok
                      ? <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    }
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.status !== 'cancelled' && (
            <SessionChangeRequestPanel
              sessionId={sessionId}
              existingRequest={sessionChangeRequest}
              tutors={otherTutors ?? []}
            />
          )}
        </div>
      </div>
    </div>
  )
}
