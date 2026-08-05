import { createAdminClient } from '@/lib/supabase/server-admin'
import PracticeAccessManager, {
  type LearnerRow,
  type StudentRow,
} from '@/components/admin/latihan-mandiri/PracticeAccessManager'

export const metadata = { title: 'Latihan Mandiri' }

export default async function LatihanMandiriPage() {
  const admin = createAdminClient()

  const [{ data: learners }, { data: students }, { data: sessions }] = await Promise.all([
    admin.from('learners').select('id, profile_id, name, access_code').order('name'),
    admin
      .from('profiles')
      .select('id, full_name, is_active')
      .eq('role', 'student')
      .order('full_name'),
    admin.from('practice_sessions').select('learner_id, finished_at'),
  ])

  // Berapa sesi yang sudah diselesaikan tiap murid — cukup untuk melihat siapa
  // yang benar-benar memakai kodenya, tanpa membangun dashboard rekap.
  const finishedByLearner: Record<string, number> = {}
  for (const session of sessions ?? []) {
    if (!session.finished_at || !session.learner_id) continue
    finishedByLearner[session.learner_id] = (finishedByLearner[session.learner_id] ?? 0) + 1
  }

  const learnerRows: LearnerRow[] = (learners ?? []).map(l => ({
    id: l.id as string,
    profile_id: l.profile_id as string | null,
    name: l.name as string,
    access_code: l.access_code as string | null,
    finishedSessions: finishedByLearner[l.id as string] ?? 0,
  }))

  const linkedProfileIds = new Set(learnerRows.map(l => l.profile_id).filter(Boolean))

  // Murid Tera yang belum punya akses sama sekali.
  const unlinked: StudentRow[] = (students ?? [])
    .filter(s => !linkedProfileIds.has(s.id as string))
    .map(s => ({
      id: s.id as string,
      full_name: s.full_name as string,
      is_active: (s.is_active as boolean | null) ?? true,
    }))

  return <PracticeAccessManager learners={learnerRows} unlinkedStudents={unlinked} />
}
