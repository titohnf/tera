import { createAdminClient } from '@/lib/supabase/server-admin'
import SubjectManager from '@/components/admin/subjects/SubjectManager'

export default async function SubjectsPage() {
  const admin = createAdminClient()

  const [{ data: subjects }, { data: classes }] = await Promise.all([
    admin.from('subjects').select('id, name, level, curriculum').order('name'),
    admin.from('classes').select('subject_id').not('subject_id', 'is', null),
  ])

  const countBySubject: Record<string, number> = {}
  for (const cls of classes ?? []) {
    if (cls.subject_id) countBySubject[cls.subject_id] = (countBySubject[cls.subject_id] ?? 0) + 1
  }

  const subjectsWithCount = (subjects ?? []).map(s => ({
    ...s,
    level: s.level as string[] | null,
    curriculum: s.curriculum as string[] | null,
    classCount: countBySubject[s.id] ?? 0,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Mata Pelajaran</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola daftar mata pelajaran yang tersedia untuk kelas.</p>
      </div>
      <SubjectManager subjects={subjectsWithCount} />
    </div>
  )
}
