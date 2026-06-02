import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClassSessions from '@/components/admin/classes/ClassSessions'
import DeleteClassButton from '@/components/admin/classes/DeleteClassButton'

const DAY_NAMES: Record<number, string> = {
  1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 0: 'Minggu',
}

type Profile = { id: string; full_name: string; email: string }
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
  ] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, class_type, is_active, created_at, tutor_id, profiles!tutor_id(full_name, email), class_subjects(subject_id, subjects(name))')
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
      .select('student_id, profiles!student_id(id, full_name, email, grade)')
      .eq('class_id', classId)
      .eq('is_active', true) as unknown as Promise<{
        data: { student_id: string; profiles: (Profile & { grade: number | null }) | null }[] | null
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
  type ProfileWithGrade = Profile & { grade: number | null }
  const enrolledWithGrade = (enrolled ?? []).map(e => e.profiles).filter((p): p is ProfileWithGrade => p !== null)
  const grades = enrolledWithGrade.map(p => p.grade).filter((g): g is number => g != null)
  const studentGrade = grades.length > 0
    ? (grades.sort((a, b) =>
        grades.filter(v => v === b).length - grades.filter(v => v === a).length
      )[0] ?? null)
    : null

  const enrolledStudents: Profile[] = enrolledWithGrade

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/classes" className="hover:text-blue-600">Kelas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{cls.name}</span>
      </div>

      {/* Class header */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold text-gray-900">{cls.name}</h1>
              {cls.level && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cls.level}</span>
              )}
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                cls.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {cls.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="text-sm text-gray-500 space-y-0.5">
              <p>Mata pelajaran: <span className="text-gray-700">
                {cls.class_subjects?.length > 0
                  ? cls.class_subjects.map(cs => cs.subjects?.name).filter(Boolean).join(', ')
                  : 'Umum'}
              </span></p>
              {cls.class_type && (
                <p>Tipe: <span className="text-gray-700 capitalize">{cls.class_type === 'group' ? 'Grup' : 'Privat'}</span></p>
              )}
            </div>

            {(classSlots ?? []).length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Jadwal Mingguan</p>
                {(classSlots ?? []).map(slot => (
                  <div key={slot.slot_index} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {slot.slot_index + 1}
                    </span>
                    <span className="text-gray-700 font-medium">
                      {slot.day_of_week !== null ? DAY_NAMES[slot.day_of_week] : '—'}
                      {slot.start_time ? ` ${slot.start_time.slice(0, 5)}` : ''}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-600">{slot.profiles?.full_name ?? 'Tutor tidak diset'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/classes/${classId}/edit`}
              className="flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Kelas
            </Link>
            <DeleteClassButton classId={classId} className={cls.name} />
          </div>
        </div>

        {enrolledStudents.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Siswa Terdaftar ({enrolledStudents.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {enrolledStudents.map(s => (
                <span key={s.id} className="text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                  {s.full_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 mt-6">
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
