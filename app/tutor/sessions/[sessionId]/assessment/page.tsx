import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AssessmentList from '@/components/assessment/AssessmentList'
import { isAbsentFromSession } from '@/lib/session-status'
import { rosterForSession } from '@/lib/enrollment'

export default async function AssessmentPage({
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
    .select('id, status, class_id, scheduled_at, classes(name)')
    .eq('id', sessionId)
    .eq('tutor_id', user.id)
    .single()

  if (!session) notFound()

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, title, description, max_score, due_at, link_url, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  const { data: allEnrollments } = await supabase
    .from('class_students')
    .select('student_id, enrolled_at, unenrolled_at, profiles(id, full_name)')
    .eq('class_id', session.class_id)

  const enrolledStudents = rosterForSession(allEnrollments ?? [], session.scheduled_at)

  const { data: attendances } = await supabase
    .from('attendances')
    .select('student_id, status')
    .eq('session_id', sessionId)

  const absentStudentIds = (attendances ?? [])
    .filter(a => isAbsentFromSession(a.status))
    .map(a => a.student_id)

  const assessmentIds = (assessments ?? []).map(a => a.id)
  const { data: results } = assessmentIds.length > 0
    ? await supabase
        .from('assessment_results')
        .select('assessment_id, student_id, score, feedback')
        .in('assessment_id', assessmentIds)
    : { data: [] }

  const cls = (session.classes as unknown as { name: string } | null)

  return (
    <div>
      <Link
        href={`/tutor/sessions/${sessionId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Detail Sesi
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Asesmen</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cls?.name}</p>
        </div>
      </div>

      <AssessmentList
        sessionId={sessionId}
        assessments={assessments ?? []}
        students={(enrolledStudents ?? []).map(cs => ({
          id: (cs.profiles as unknown as { id: string; full_name: string } | null)?.id ?? cs.student_id,
          full_name: (cs.profiles as unknown as { id: string; full_name: string } | null)?.full_name ?? 'Siswa',
        }))}
        results={results ?? []}
        absentStudentIds={absentStudentIds}
      />
    </div>
  )
}
