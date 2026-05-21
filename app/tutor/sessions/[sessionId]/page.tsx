import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SessionTabs from '@/components/sessions/SessionTabs'
import MaterialUploader from '@/components/materials/MaterialUploader'
import { submitAttendance } from '@/lib/actions/attendance'
import { savePerformanceNote } from '@/lib/actions/notes'
import { createAssessment, submitGrades } from '@/lib/actions/assessments'
import { deleteMaterial, getSignedUrl } from '@/lib/actions/materials'
import { updateSessionTopicTutor } from '@/lib/actions/tutor/sessions'
import type { AttendanceStatus } from '@/lib/types/database'

type SessionDetail = {
  id: string
  class_id: string
  scheduled_at: string
  duration_minutes: number
  location: string | null
  status: string
  topic: string | null
  classes: { name: string; level: string | null } | null
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Terjadwal',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
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
    .select('id, class_id, scheduled_at, duration_minutes, location, status, topic, classes(name, level)')
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
  ] = await Promise.all([
    supabase
      .from('class_students')
      .select('student_id, profiles(id, full_name)')
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
  ])

  const enrolledStudents = enrolledResult.data ?? []
  const attendances = attendanceResult.data ?? []
  const existingNotes = notesResult.data ?? []
  const templates = templatesResult.data ?? []
  const materials = materialsResult.data ?? []
  const assessments = assessmentsResult.data ?? []

  const attendanceMap = Object.fromEntries(attendances.map(a => [a.student_id, a]))
  const noteMap = Object.fromEntries(existingNotes.map(n => [n.student_id, n]))

  const students = enrolledStudents.map(cs => {
    const profile = (cs.profiles as unknown as { id: string; full_name: string } | null)
    const sid = profile?.id ?? cs.student_id
    return {
      id: sid,
      full_name: profile?.full_name ?? 'Siswa',
      currentStatus: (attendanceMap[cs.student_id]?.status ?? 'absent') as AttendanceStatus,
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
      <Link href="/tutor/schedule" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Jadwal
      </Link>

      {/* Session header */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-gray-900">{session.classes?.name ?? 'Kelas'}</h1>
              {session.classes?.level && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{session.classes.level}</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{session.topic ?? 'Topik belum ditentukan'}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[session.status] ?? ''}`}>
            {STATUS_LABEL[session.status] ?? session.status}
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

      <SessionTabs
        sessionId={sessionId}
        sessionStatus={session.status}
        topic={session.topic}
        curriculumTopicId={null}
        curriculumTopics={[]}
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
        submitAttendanceAction={submitAttendance}
        saveNoteAction={savePerformanceNote}
        createAssessmentAction={createAssessment}
        submitGradesAction={submitGrades}
        deleteMaterialAction={deleteMaterial}
        signedUrlAction={getSignedUrl}
      />
    </div>
  )
}
