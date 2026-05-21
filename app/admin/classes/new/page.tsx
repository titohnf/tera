import { createAdminClient } from '@/lib/supabase/server-admin'
import { createClass } from '@/lib/actions/admin/classes'
import ClassForm, { type TutorWithMeta } from '@/components/admin/classes/ClassForm'
import Link from 'next/link'

export default async function NewClassPage() {
  const admin = createAdminClient()

  const [
    { data: tutorRows },
    { data: subjects },
    { data: students },
    { data: tutorSubjectRows },
    { data: availabilityRows },
  ] = await Promise.all([
    admin.from('profiles').select('id, full_name').eq('role', 'tutor').order('full_name'),
    admin.from('subjects').select('id, name').order('name'),
    admin.from('profiles').select('id, full_name, level, grade').eq('role', 'student').order('full_name'),
    admin.from('tutor_subjects').select('tutor_id, subject_id, level'),
    admin.from('tutor_availability').select('tutor_id, day_of_week, start_time, end_time'),
  ])

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

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/classes" className="hover:text-blue-600">Kelas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Kelas Baru</span>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">Tambah Kelas Baru</h1>

      <div className="max-w-2xl">
        <ClassForm
          action={createClass}
          tutors={tutors}
          subjects={subjects ?? []}
          students={students ?? []}
          showStudentPicker
        />
      </div>
    </div>
  )
}
