import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClassSessions from '@/components/admin/classes/ClassSessions'
import DeleteClassButton from '@/components/admin/classes/DeleteClassButton'
import CompleteClassButton from '@/components/admin/classes/CompleteClassButton'

const DAY_NAMES: Record<number, string> = {
  1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 0: 'Minggu',
}

type Profile = { id: string; full_name: string; email: string; avatar_url?: string | null }
type CountRow = [{ count: number }]

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const admin = createAdminClient()

  const [
    { data: cls },
    { data: enrolled },
    { data: sessions },
    { data: tutors },
    { data: subjects },
    { data: classSlots },
    { count: pendingSessionCount },
  ] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, class_type, is_active, status, start_date, end_date, created_at, tutor_id, profiles!tutor_id(full_name, email), class_subjects(subject_id, subjects(name))')
      .eq('id', classId)
      .single() as unknown as Promise<{
        data: {
          id: string; name: string; level: string | null; class_type: string | null
          is_active: boolean; created_at: string
          tutor_id: string
          profiles: { full_name: string; email: string } | null
          class_subjects: { subject_id: string; subjects: { name: string } | null }[]
        } | null
      }>,
    admin
      .from('class_students')
      .select('student_id, profiles!student_id(id, full_name, email, grade, avatar_url)')
      .eq('class_id', classId)
      .eq('is_active', true) as unknown as Promise<{
        data: { student_id: string; profiles: (Profile & { grade: number | null; avatar_url: string | null }) | null }[] | null
      }>,
    admin
      .from('sessions')
      .select(`
        id, scheduled_at, duration_minutes, status, location, topic,
        subjects(name),
        profiles!tutor_id(full_name),
        materials(count),
        assessments(count),
        attendances(count),
        performance_notes(count)
      `)
      .eq('class_id', classId)
      .order('scheduled_at', { ascending: true })
      .limit(100) as unknown as Promise<{
        data: {
          id: string; scheduled_at: string; duration_minutes: number
          status: string; location: string | null; topic: string | null
          subjects: { name: string } | null
          profiles: { full_name: string } | null
          materials: CountRow
          assessments: CountRow
          attendances: CountRow
          performance_notes: CountRow
        }[] | null
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
    admin
      .from('class_slots')
      .select('slot_index, day_of_week, start_time, tutor_id, subject_ids, profiles!tutor_id(full_name)')
      .eq('class_id', classId)
      .order('slot_index') as unknown as Promise<{
        data: {
          slot_index: number; day_of_week: number | null; start_time: string | null
          tutor_id: string | null; subject_ids: string[]
          profiles: { full_name: string } | null
        }[] | null
      }>,
    admin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .in('status', ['scheduled', 'ongoing']),
  ])

  if (!cls) notFound()

  // Check which sessions have graded assessments
  const sessionIds = (sessions ?? []).map(s => s.id)
  const subjectIds = (cls.class_subjects ?? []).map(cs => cs.subject_id).filter(Boolean)

  const [{ data: gradedData }, { data: curriculumTopics }] = await Promise.all([
    sessionIds.length > 0
      ? admin
          .from('assessments')
          .select('session_id, assessment_results(count)')
          .in('session_id', sessionIds) as unknown as {
            data: { session_id: string; assessment_results: CountRow }[] | null
          }
      : Promise.resolve({ data: null }),
    subjectIds.length > 0
      ? admin
          .from('curriculum_topics')
          .select('id, subject_id, grade_level, semester, theme, topic')
          .in('subject_id', subjectIds)
          .order('grade_level').order('semester').order('sort_order') as unknown as {
            data: { id: string; subject_id: string; grade_level: string; semester: number; theme: string | null; topic: string | null }[] | null
          }
      : Promise.resolve({ data: null }),
  ])

  const gradedSessionIds = (gradedData ?? [])
    .filter(a => (a.assessment_results[0]?.count ?? 0) > 0)
    .map(a => a.session_id)

  // Derive most common grade from enrolled students
  type ProfileWithGrade = Profile & { grade: number | null; avatar_url?: string | null }
  const enrolledWithGrade = (enrolled ?? [])
    .map(e => e.profiles)
    .filter((p): p is NonNullable<typeof p> => p !== null) as ProfileWithGrade[]
  const grades = enrolledWithGrade.map(p => p.grade).filter((g): g is number => g != null)
  const studentGrade = grades.length > 0
    ? (grades.sort((a, b) =>
        grades.filter(v => v === b).length - grades.filter(v => v === a).length
      )[0] ?? null)
    : null

  const enrolledStudents: ProfileWithGrade[] = enrolledWithGrade

  const classStatus = (cls as any).status ?? (cls.is_active ? 'aktif' : 'selesai')
  const startDate = (cls as any).start_date as string | null
  const endDate = (cls as any).end_date as string | null

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Subject map for slots
  const subjectMap = new Map((subjects ?? []).map(s => [s.id, s.name]))

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
    return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/classes" className="hover:text-blue-600">Kelas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{cls.name}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        {/* Top row: name + actions */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900">{cls.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              classStatus === 'selesai' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
            }`}>
              {classStatus === 'selesai' ? 'Selesai' : 'Aktif'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CompleteClassButton
              classId={classId}
              pendingSessions={pendingSessionCount ?? 0}
              alreadyDone={classStatus === 'selesai'}
            />
            <Link
              href={`/admin/classes/${classId}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <DeleteClassButton classId={classId} className={cls.name} />
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tipe</p>
            <p className="text-sm text-gray-800">
              {cls.class_type === 'group' ? 'Reguler' : cls.class_type === 'private' ? 'Privat' : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Jenjang</p>
            <p className="text-sm text-gray-800">{cls.level ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tanggal Mulai</p>
            <p className="text-sm text-gray-800">{startDate ? fmtDate(startDate) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tanggal Selesai</p>
            <p className="text-sm text-gray-800">{endDate ? fmtDate(endDate) : '—'}</p>
          </div>
        </div>

        {/* Jadwal compact */}
        {(classSlots ?? []).length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Jadwal Mingguan</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {(classSlots ?? []).map(slot => {
                const slotSubject = (slot.subject_ids ?? []).map(id => subjectMap.get(id)).filter(Boolean).join(', ') || '—'
                return (
                  <p key={slot.slot_index} className="text-sm text-gray-700">
                    <span className="font-medium">{slot.day_of_week !== null ? DAY_NAMES[slot.day_of_week] : '—'}</span>
                    {slot.start_time && <span className="text-gray-400"> {slot.start_time.slice(0, 5)}</span>}
                    <span className="text-gray-400"> · </span>
                    {slotSubject}
                    {slot.profiles?.full_name && <span className="text-gray-400"> – {slot.profiles.full_name}</span>}
                  </p>
                )
              })}
            </div>
          </div>
        )}

        {/* Siswa */}
        {enrolledStudents.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Siswa Terdaftar <span className="text-gray-600 font-normal normal-case">({enrolledStudents.length})</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {enrolledStudents.map(s => {
                const avatarUrl = (s as any).avatar_url as string | null
                return (
                  <Link
                    key={s.id}
                    href={`/admin/siswa/${s.id}`}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={s.full_name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-blue-700">{getInitials(s.full_name)}</span>
                      </div>
                    )}
                    <span className="text-sm text-gray-700">{s.full_name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <ClassSessions
          classId={classId}
          sessions={sessions ?? []}
          gradedSessionIds={gradedSessionIds}
          tutors={tutors ?? []}
          subjects={subjects ?? []}
          defaultTutorId={classSlots?.[0]?.tutor_id ?? cls.tutor_id}
          defaultSubjectId={classSlots?.[0]?.subject_ids?.[0] ?? cls.class_subjects?.[0]?.subject_id ?? undefined}
          curriculumTopics={curriculumTopics ?? []}
          studentGrade={studentGrade}
        />
      </div>
    </div>
  )
}
