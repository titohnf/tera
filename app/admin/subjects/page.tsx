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

  return <SubjectManager subjects={subjectsWithCount} />
}
