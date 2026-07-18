import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { KKM, severityOf, SEVERITY_LABEL, SEVERITY_BADGE_CLASS } from '@/lib/academic-status'

type SessionMeta = { id: string; class_id: string; scheduled_at: string; subjects: { name: string } | null }
type AssessmentMeta = { id: string; session_id: string; title: string; max_score: number }

export default async function TutorStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()

  // Access gate: a tutor may only open a student's page if they teach that
  // student in at least one class (main tutor or substitute alike). Once
  // past that gate, the page itself shows the student's FULL academic
  // picture — every class they're enrolled in, not just the ones shared
  // with this tutor — so the tutor gets comprehensive context on the student.
  const { data: taughtSessions } = await admin
    .from('sessions')
    .select('class_id')
    .eq('tutor_id', user.id) as unknown as { data: { class_id: string }[] | null }
  const taughtClassIds = [...new Set((taughtSessions ?? []).map(s => s.class_id))]
  if (taughtClassIds.length === 0) notFound()

  const { data: sharedEnrollments } = await admin
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .in('class_id', taughtClassIds) as unknown as { data: { class_id: string }[] | null }
  if ((sharedEnrollments ?? []).length === 0) notFound()

  const { data: allEnrollments } = await admin
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId)
    .eq('is_active', true) as unknown as { data: { class_id: string }[] | null }
  const allClassIds = [...new Set((allEnrollments ?? []).map(e => e.class_id))]

  const [{ data: student }, { data: classes }, { data: sessions }] = await Promise.all([
    admin.from('profiles').select('id, full_name, nickname, avatar_url, grade').eq('id', studentId).single() as unknown as Promise<{
      data: { id: string; full_name: string; nickname: string | null; avatar_url: string | null; grade: number | null } | null
    }>,
    admin.from('classes').select('id, name, level, class_type').in('id', allClassIds) as unknown as Promise<{
      data: { id: string; name: string; level: string | null; class_type: string | null }[] | null
    }>,
    admin
      .from('sessions')
      .select('id, class_id, scheduled_at, subjects(name)')
      .in('class_id', allClassIds)
      .order('scheduled_at', { ascending: false }) as unknown as Promise<{ data: SessionMeta[] | null }>,
  ])

  if (!student) notFound()

  const sessionIds = (sessions ?? []).map(s => s.id)

  const [{ data: assessments }, { data: attendances }, { data: notes }] = await Promise.all([
    sessionIds.length > 0
      ? admin.from('assessments').select('id, session_id, title, max_score').in('session_id', sessionIds) as unknown as Promise<{ data: AssessmentMeta[] | null }>
      : Promise.resolve({ data: [] as AssessmentMeta[] }),
    sessionIds.length > 0
      ? admin.from('attendances').select('session_id, status').eq('student_id', studentId).in('session_id', sessionIds) as unknown as Promise<{ data: { session_id: string; status: string }[] | null }>
      : Promise.resolve({ data: [] as { session_id: string; status: string }[] }),
    sessionIds.length > 0
      ? admin.from('performance_notes').select('session_id, category, body, created_at').eq('student_id', studentId).in('session_id', sessionIds).order('created_at', { ascending: false }) as unknown as Promise<{ data: { session_id: string; category: string; body: string; created_at: string }[] | null }>
      : Promise.resolve({ data: [] as { session_id: string; category: string; body: string; created_at: string }[] }),
  ])

  const assessmentIds = (assessments ?? []).map(a => a.id)
  const { data: results } = assessmentIds.length > 0
    ? await admin
        .from('assessment_results')
        .select('assessment_id, score')
        .eq('student_id', studentId)
        .in('assessment_id', assessmentIds)
        .not('score', 'is', null) as unknown as { data: { assessment_id: string; score: number }[] | null }
    : { data: [] as { assessment_id: string; score: number }[] }

  const scoreByAssessment = new Map((results ?? []).map(r => [r.assessment_id, r.score]))
  const sessionMap = new Map((sessions ?? []).map(s => [s.id, s]))

  // Group per class: assessment score rows, attendance counts, recent notes
  type ClassGroup = {
    id: string
    name: string
    level: string | null
    scoreRows: { title: string; date: string; score: number; maxScore: number }[]
    attendanceCounts: Record<string, number>
    recentNotes: { category: string; body: string; date: string }[]
  }

  const classGroups = new Map<string, ClassGroup>()
  for (const cls of classes ?? []) {
    classGroups.set(cls.id, {
      id: cls.id, name: cls.name, level: cls.level,
      scoreRows: [], attendanceCounts: {}, recentNotes: [],
    })
  }

  for (const a of assessments ?? []) {
    const score = scoreByAssessment.get(a.id)
    if (score == null) continue
    const session = sessionMap.get(a.session_id)
    if (!session) continue
    const group = classGroups.get(session.class_id)
    if (!group) continue
    group.scoreRows.push({ title: a.title, date: session.scheduled_at, score, maxScore: a.max_score })
  }

  for (const att of attendances ?? []) {
    const session = sessionMap.get(att.session_id)
    if (!session) continue
    const group = classGroups.get(session.class_id)
    if (!group) continue
    group.attendanceCounts[att.status] = (group.attendanceCounts[att.status] ?? 0) + 1
  }

  for (const n of notes ?? []) {
    const session = sessionMap.get(n.session_id)
    if (!session) continue
    const group = classGroups.get(session.class_id)
    if (!group) continue
    if (group.recentNotes.length < 5) group.recentNotes.push({ category: n.category, body: n.body, date: n.created_at })
  }

  for (const group of classGroups.values()) {
    group.scoreRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const displayName = student.nickname?.trim() || student.full_name

  return (
    <div className="space-y-5">
      <Link href="/tutor" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
          {student.avatar_url ? (
            <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-slate-400">
              {student.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{displayName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {student.full_name}{student.grade ? ` · Kelas ${student.grade}` : ''}
          </p>
        </div>
      </div>

      {[...classGroups.values()].map(group => {
        const total = group.scoreRows.length
        const below = group.scoreRows.filter(r => (r.score / r.maxScore) * 100 < KKM).length
        const pctBelow = total > 0 ? (below / total) * 100 : 0
        const severity = total > 0 ? severityOf(pctBelow) : null
        const attendanceTotal = Object.values(group.attendanceCounts).reduce((s, n) => s + n, 0)

        return (
          <div key={group.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{group.name}</h2>
                {group.level && <p className="text-xs text-gray-400 mt-0.5">{group.level}</p>}
              </div>
              {severity && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${SEVERITY_BADGE_CLASS[severity]}`}>
                  {SEVERITY_LABEL[severity]}
                </span>
              )}
            </div>

            {/* Kehadiran */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Kehadiran</p>
              {attendanceTotal === 0 ? (
                <p className="text-sm text-gray-400">Belum ada data presensi.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(group.attendanceCounts).map(([status, count]) => (
                    <span key={status} className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-gray-600">
                      {status === 'present' ? 'Hadir' : status === 'late' ? 'Telat' : status === 'excused' ? 'Izin' : 'Absen'}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Riwayat nilai */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Riwayat Nilai</p>
              {group.scoreRows.length === 0 ? (
                <p className="text-sm text-gray-400">Belum ada nilai asesmen.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                  {group.scoreRows.map((r, i) => {
                    const pct = (r.score / r.maxScore) * 100
                    return (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 truncate">{r.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className={`shrink-0 text-sm font-semibold ${pct < KKM ? 'text-red-600' : 'text-green-600'}`}>
                          {r.score} / {r.maxScore}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Catatan performa terbaru */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Catatan Performa Terbaru</p>
              {group.recentNotes.length === 0 ? (
                <p className="text-sm text-gray-400">Belum ada catatan performa.</p>
              ) : (
                <div className="space-y-2">
                  {group.recentNotes.map((n, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500 capitalize">{n.category}</span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(n.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
