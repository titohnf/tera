import { createAdminClient } from '@/lib/supabase/server-admin'
import { updateClass } from '@/lib/actions/admin/classes'
import { notFound } from 'next/navigation'
import ClassForm, { type TutorWithMeta } from '@/components/admin/classes/ClassForm'
import StudentManager, { type Enrollment } from '@/components/admin/classes/StudentManager'
import Link from 'next/link'

type Profile = { id: string; full_name: string; email: string; level: string | null }

type EnrollmentRow = {
  student_id: string
  is_active: boolean
  enrolled_at: string
  unenrolled_at: string | null
  profiles: Profile | null
}

export default async function EditClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const admin = createAdminClient()

  const [
    { data: cls },
    { data: tutorRows },
    { data: subjects },
    { data: tutorSubjectRows },
    { data: availabilityRows },
    { data: classSlotRows },
    { data: enrolledRows },
    { data: allStudentRows },
  ] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, class_type, jenis, fokus_types, is_active, status, start_date, end_date, duration_minutes, semester, academic_year')
      .eq('id', classId)
      .single(),
    admin.from('profiles').select('id, full_name').eq('role', 'tutor').order('full_name'),
    admin.from('subjects').select('id, name').order('name'),
    admin.from('tutor_subjects').select('tutor_id, subject_id, level'),
    admin.from('tutor_availability').select('tutor_id, day_of_week, start_time, end_time'),
    admin.from('class_slots').select('slot_index, day_of_week, start_time, tutor_id, tutor_ids, subject_ids')
      .eq('class_id', classId).order('slot_index'),
    admin.from('class_students')
      .select('student_id, is_active, enrolled_at, unenrolled_at, profiles!student_id(id, full_name, email, level)')
      .eq('class_id', classId) as unknown as Promise<{
        data: EnrollmentRow[] | null
      }>,
    admin.from('profiles').select('id, full_name, email, level').eq('role', 'student').order('full_name') as unknown as Promise<{
      data: Profile[] | null
    }>,
  ])

  if (!cls) notFound()

  const subjectsByTutor = new Map<string, { subjectId: string; level: string }[]>()
  for (const ts of tutorSubjectRows ?? []) {
    const tid = (ts as any).tutor_id
    if (!subjectsByTutor.has(tid)) subjectsByTutor.set(tid, [])
    subjectsByTutor.get(tid)!.push({ subjectId: (ts as any).subject_id, level: (ts as any).level ?? '' })
  }

  const availByTutor = new Map<string, { day_of_week: number; start_time: string; end_time: string }[]>()
  for (const a of availabilityRows ?? []) {
    const tid = (a as any).tutor_id
    if (!availByTutor.has(tid)) availByTutor.set(tid, [])
    availByTutor.get(tid)!.push({ day_of_week: (a as any).day_of_week, start_time: (a as any).start_time, end_time: (a as any).end_time })
  }

  const tutors: TutorWithMeta[] = (tutorRows ?? []).map(t => ({
    id: t.id,
    full_name: t.full_name,
    subjects: subjectsByTutor.get(t.id) ?? [],
    availability: availByTutor.get(t.id) ?? [],
  }))

  const toEnrollment = (rows: EnrollmentRow[]): Enrollment[] =>
    rows
      .filter(r => r.profiles !== null)
      .map(r => ({
        id: r.profiles!.id,
        full_name: r.profiles!.full_name,
        email: r.profiles!.email,
        enrolled_at: r.enrolled_at,
        unenrolled_at: r.unenrolled_at,
      }))

  const allRows = enrolledRows ?? []
  const enrolledStudents = toEnrollment(allRows.filter(r => r.is_active))
  const formerStudents = toEnrollment(allRows.filter(r => !r.is_active))

  // ClassForm memakai jenjang siswa aktif untuk memvalidasi level kelas.
  const enrolledLevels = allRows
    .filter(r => r.is_active && r.profiles)
    .map(r => r.profiles!.level)

  const classStartDate: string | null = (cls as { start_date?: string | null }).start_date ?? null

  const knownIds = new Set(allRows.map(r => r.student_id))
  const availableStudents = (allStudentRows ?? []).filter(s => !knownIds.has(s.id))

  const updateClassWithId = updateClass.bind(null, classId)

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/classes" className="hover:text-blue-600">Kelas</Link>
        <span>/</span>
        <Link href={`/admin/classes/${classId}`} className="hover:text-blue-600">{cls.name}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Edit</span>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">Edit Kelas</h1>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
          <StudentManager
            classId={classId}
            enrolledStudents={enrolledStudents}
            formerStudents={formerStudents}
            availableStudents={availableStudents}
            classStartDate={classStartDate}
          />
        </div>

        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
          <ClassForm
            action={updateClassWithId}
            tutors={tutors}
            subjects={subjects ?? []}
            enrolledCount={enrolledStudents.length}
            enrolledLevels={enrolledLevels}
            defaultValues={{
              name: cls.name,
              level: cls.level,
              class_type: (cls as any).class_type ?? null,
              jenis: (cls as any).jenis ?? null,
              fokus_types: (cls as any).fokus_types ?? null,
              is_active: cls.is_active,
              status: (cls as any).status ?? 'aktif',
              start_date: classStartDate,
              end_date: (cls as any).end_date ?? null,
              duration_minutes: (cls as any).duration_minutes ?? 90,
              semester: (cls as any).semester ?? null,
              academic_year: (cls as any).academic_year ?? null,
              slots: (classSlotRows ?? []).map((r: any) => ({
                subjectIds: r.subject_ids?.length ? r.subject_ids : [null],
                tutorIds: r.tutor_ids?.length ? r.tutor_ids : (r.tutor_id ? [r.tutor_id] : [null]),
                day: r.day_of_week ?? null,
                time: r.start_time ? r.start_time.slice(0, 5) : '',
              })),
            }}
            showActiveToggle
          />
        </div>
      </div>
    </div>
  )
}
