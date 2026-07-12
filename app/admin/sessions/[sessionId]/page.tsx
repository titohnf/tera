import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { updateSession } from '@/lib/actions/admin/sessions'
import { updateSessionTopic } from '@/lib/actions/admin/curriculum'
import { checkAndCompleteSession, getSessionCompletionStatus } from '@/lib/actions/session-completion'
import { submitAttendanceAdmin } from '@/lib/actions/admin/attendance'
import { savePerformanceNoteAdmin } from '@/lib/actions/admin/notes'
import { createAssessmentAdmin, submitGradesAdmin, deleteAssessmentAdmin } from '@/lib/actions/admin/assessments'
import { deleteMaterialAdmin, getSignedUrlAdmin } from '@/lib/actions/admin/materials'
import SessionInfoCard from '@/components/admin/sessions/SessionInfoCard'
import SessionHeader from '@/components/admin/sessions/SessionHeader'
import ResetSessionButton from '@/components/admin/sessions/ResetSessionButton'
import SessionTabs from '@/components/sessions/SessionTabs'
import MaterialUploaderAdmin from '@/components/materials/MaterialUploaderAdmin'
import type { AttendanceStatus } from '@/lib/types/database'

export default async function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const admin = createAdminClient()

  const [
    { data: session },
    { data: tutors },
    { data: subjects },
  ] = await Promise.all([
    admin
      .from('sessions')
      .select('*, classes(id, name, level), profiles!tutor_id(full_name, email), subjects(name)')
      .eq('id', sessionId)
      .single() as unknown as Promise<{
        data: {
          id: string; scheduled_at: string; duration_minutes: number
          location: string | null; status: string; topic: string | null
          curriculum_topic_id: string | null
          selected_cp_ids: string[]
          cp_urls: Record<string, string>
          class_id: string; tutor_id: string; subject_id: string | null
          classes: { id: string; name: string; level: string | null } | null
          profiles: { full_name: string; email: string } | null
          subjects: { name: string } | null
        } | null
      }>,
    admin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'tutor')
      .order('full_name') as unknown as Promise<{ data: { id: string; full_name: string }[] | null }>,
    admin
      .from('subjects')
      .select('id, name')
      .order('name') as unknown as Promise<{ data: { id: string; name: string }[] | null }>,
  ])

  if (!session) notFound()

  const [
    { data: classStudents },
    { data: attendances },
    { data: existingNotes },
    { data: templates },
    { data: materials },
    { data: assessments },
    { data: curriculumTopics },
  ] = await Promise.all([
    admin
      .from('class_students')
      .select('student_id, profiles(id, full_name, grade, avatar_url)')
      .eq('class_id', session.class_id)
      .eq('is_active', true) as unknown as Promise<{
        data: { student_id: string; profiles: { id: string; full_name: string; grade: number | null; avatar_url: string | null } | null }[] | null
      }>,
    admin
      .from('attendances')
      .select('student_id, status, notes')
      .eq('session_id', sessionId),
    admin
      .from('performance_notes')
      .select('student_id, body, template_id')
      .eq('session_id', sessionId),
    admin
      .from('performance_note_templates')
      .select('id, category, label, body')
      .eq('is_active', true)
      .order('category'),
    admin
      .from('materials')
      .select('id, title, file_path, link_url, mime_type, file_size_bytes, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false }),
    admin
      .from('assessments')
      .select('id, title, description, max_score, due_at, link_url, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false }),
    session.subject_id
      ? admin
          .from('curriculum_topics')
          .select('id, grade_level, semester, theme, topic, learning_outcomes')
          .eq('subject_id', session.subject_id)
          .order('sort_order') as unknown as Promise<{
            data: {
              id: string; grade_level: string; semester: number
              theme: string | null; topic: string; learning_outcomes: string | null
            }[] | null
          }>
      : Promise.resolve({ data: [] }),
  ])

  // Auto-complete if all criteria already met (handles sessions filled before this feature existed)
  await checkAndCompleteSession(sessionId)

  // Re-fetch status in case it was just completed + get completion diagnostics
  const [{ data: freshSession }, completionCheck] = await Promise.all([
    admin.from('sessions').select('status').eq('id', sessionId).single(),
    getSessionCompletionStatus(sessionId),
  ])
  if (freshSession) session.status = freshSession.status

  const date = new Date(session.scheduled_at)

  // Derive grade from enrolled students (mode of their grades)
  const enrolledGrades = (classStudents ?? [])
    .map(cs => cs.profiles?.grade)
    .filter((g): g is number => g != null)
  const sessionGrade = enrolledGrades.length > 0
    ? enrolledGrades.sort((a, b) =>
        enrolledGrades.filter(v => v === b).length - enrolledGrades.filter(v => v === a).length
      )[0]
    : null

  // Filter by grade only — semester grouping is shown in the dropdown itself
  const filteredCurriculumTopics = (curriculumTopics ?? []).filter(t =>
    sessionGrade == null || t.grade_level === `Kelas ${sessionGrade}`
  )
  const dateStr = date.toISOString().split('T')[0]
  const timeStr = date.toTimeString().slice(0, 5)
  const updateWithId = updateSession.bind(null, sessionId)
  const sessionEnd = new Date(date.getTime() + session.duration_minutes * 60_000)
  const now = new Date()
  const effectiveStatus =
    session.status === 'scheduled' || session.status === 'ongoing'
      ? now < date ? 'scheduled'
        : now <= sessionEnd ? 'ongoing'
        : 'overdue'
      : session.status

  const attendanceMap = Object.fromEntries((attendances ?? []).map(a => [a.student_id, a]))
  const noteMap = Object.fromEntries((existingNotes ?? []).map(n => [n.student_id, n]))

  const students = (classStudents ?? []).map(cs => {
    const profile = cs.profiles
    const sid = profile?.id ?? cs.student_id
    return {
      id: sid,
      full_name: profile?.full_name ?? 'Siswa',
      avatar_url: profile?.avatar_url ?? null,
      currentStatus: (attendanceMap[cs.student_id]?.status ?? null) as AttendanceStatus | null,
      attendanceNotes: attendanceMap[cs.student_id]?.notes ?? '',
      existingNote: noteMap[sid] ?? null,
    }
  })

  const assessmentIds = (assessments ?? []).map(a => a.id)
  const { data: results } = assessmentIds.length > 0
    ? await admin
        .from('assessment_results')
        .select('assessment_id, student_id, score, feedback')
        .in('assessment_id', assessmentIds)
    : { data: [] }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/classes" className="hover:text-blue-600">Kelas</Link>
        <span>/</span>
        {session.classes && (
          <>
            <Link href={`/admin/classes/${session.class_id}`} className="hover:text-blue-600">
              {session.classes.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 font-medium">
          {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Kolom kiri — judul + tab konten */}
        <div className="space-y-4">
          <SessionHeader
            subject={session.subjects?.name ?? null}
            dateStr={date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            displayStatus={effectiveStatus}
            sessionId={sessionId}
            status={session.status}
            scheduledAt={session.scheduled_at}
            durationMinutes={session.duration_minutes}
            updateAction={updateWithId}
            tutors={tutors ?? []}
            subjectOptions={subjects ?? []}
            defaultValues={{
              class_id: session.class_id,
              tutor_id: session.tutor_id,
              subject_id: session.subject_id,
              date: dateStr,
              time: timeStr,
              duration_minutes: session.duration_minutes,
              location: session.location,
            }}
          />

          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
            <SessionTabs
            sessionId={sessionId}
            sessionStatus={session.status}
            topic={session.topic}
            students={students}
            templates={templates ?? []}
            materials={materials ?? []}
            assessments={assessments ?? []}
            assessmentStudents={students.map(s => ({ id: s.id, full_name: s.full_name }))}
            results={results ?? []}
            curriculumTopicId={session.curriculum_topic_id ?? null}
            curriculumTopics={filteredCurriculumTopics}
            hasSubject={!!session.subject_id}
            selectedCpIds={session.selected_cp_ids ?? []}
            cpUrls={session.cp_urls ?? {}}
            subjectName={session.subjects?.name ?? null}
            grade={sessionGrade}
            materialUploader={<MaterialUploaderAdmin sessionId={sessionId} />}
            saveTopicAction={updateSessionTopic}
            submitAttendanceAction={submitAttendanceAdmin}
            saveNoteAction={savePerformanceNoteAdmin}
            createAssessmentAction={createAssessmentAdmin}
            submitGradesAction={submitGradesAdmin}
            deleteAssessmentAction={deleteAssessmentAdmin}
            deleteMaterialAction={deleteMaterialAdmin}
            signedUrlAction={getSignedUrlAdmin}
          />
          </div>
        </div>

        {/* Kolom kanan — info sesi + syarat */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <SessionInfoCard
            classLevel={session.classes?.level ?? null}
            tutorName={session.profiles?.full_name ?? null}
            date={date}
            durationMinutes={session.duration_minutes}
            location={session.location}
            subjects={session.subjects?.name ?? null}
            displayStatus={effectiveStatus}
          />

          {/* Syarat penyelesaian otomatis */}
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

          <div className="flex justify-end">
            <ResetSessionButton sessionId={sessionId} />
          </div>
        </div>
      </div>
    </div>
  )
}
