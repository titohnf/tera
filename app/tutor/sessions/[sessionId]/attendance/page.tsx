import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AttendanceForm from '@/components/attendance/AttendanceForm'
import { rosterForSession } from '@/lib/enrollment'

export default async function AttendancePage({
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

  // Roster diambil apa adanya lalu disaring per rentang keanggotaan: siswa
  // yang baru masuk bulan ini tidak muncul di sesi bulan lalu, dan siswa yang
  // sudah keluar tetap muncul di sesi-sesi sebelum ia keluar.
  const { data: allEnrollments } = await supabase
    .from('class_students')
    .select('student_id, enrolled_at, unenrolled_at, profiles(id, full_name)')
    .eq('class_id', session.class_id)

  const enrolledStudents = rosterForSession(allEnrollments ?? [], session.scheduled_at)

  const { data: existingAttendances } = await supabase
    .from('attendances')
    .select('student_id, status, notes')
    .eq('session_id', sessionId)

  const cls = (session.classes as unknown as { name: string } | null)

  const attendanceMap = Object.fromEntries(
    (existingAttendances ?? []).map(a => [a.student_id, a])
  )

  const students = (enrolledStudents ?? []).map(cs => {
    const profile = (cs.profiles as unknown as { id: string; full_name: string } | null)
    return {
      id: profile?.id ?? cs.student_id,
      full_name: profile?.full_name ?? 'Siswa',
      currentStatus: attendanceMap[cs.student_id]?.status ?? 'absent',
      notes: attendanceMap[cs.student_id]?.notes ?? '',
    }
  })

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
          <h1 className="text-xl font-semibold text-gray-900">Presensi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cls?.name}</p>
        </div>
        <span className="text-sm text-gray-500">
          {students.length} siswa terdaftar
        </span>
      </div>

      <AttendanceForm
        sessionId={sessionId}
        students={students}
        sessionStatus={session.status}
      />
    </div>
  )
}
