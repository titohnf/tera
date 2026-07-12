import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import Link from 'next/link'
import MetricCard from '@/components/dashboard/MetricCard'
import ClassFilters from '@/components/tutor/ClassFilters'
import TeachingScheduleFilters from '@/components/tutor/TeachingScheduleFilters'
import SessionStatusChips from '@/components/sessions/SessionStatusChips'
import type { SessionCounts } from '@/components/sessions/SessionStatusChips'
import { getSessionDisplayStatus } from '@/lib/session-status'

type ClassRow = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  class_type: string | null
  status: string
  start_date: string | null
  end_date: string | null
  scope: 'main' | 'substitute'
}

type CountRow = [{ count: number }]

type TeachingSessionRow = {
  id: string
  class_id: string
  scheduled_at: string
  duration_minutes: number
  location: string | null
  status: string
  topic: string | null
  classes: { name: string; level: string | null } | null
  materials: CountRow
  assessments: CountRow
  attendances: CountRow
  performance_notes: CountRow
}

const LEVEL_ORDER = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const TEACHING_PAGE_SIZE = 10

export default async function TutorClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; status?: string; type?: string; q?: string; scope?: string; range?: string; from?: string; to?: string; page?: string; compliance?: string; sessionStatus?: string }>
}) {
  const {
    level: levelFilter = '', status: statusFilter = '', type: typeFilter = '', q = '', scope: scopeFilter = '',
    range: teachingRange = '', from: teachingFrom = '', to: teachingTo = '',
    page: pageParam = '1', compliance: teachingCompliance = '', sessionStatus: sessionStatusFilter = '',
  } = await searchParams
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()

  const now = new Date()
  let rangeStart: Date | null = null
  let rangeEnd: Date | null = null

  if (teachingRange === 'upcoming') {
    rangeStart = now
  } else if (teachingRange === 'past') {
    rangeEnd = now
  } else if (teachingRange === 'custom' && teachingFrom && teachingTo) {
    rangeStart = new Date(`${teachingFrom}T00:00:00`)
    rangeEnd = new Date(`${teachingTo}T23:59:59`)
  }
  // Default (no range): show all sessions, no date bound

  const page = Math.max(1, parseInt(pageParam) || 1)

  const sessionFields = `
    id, class_id, scheduled_at, duration_minutes, location, status, topic,
    classes(name, level),
    materials(count),
    assessments(count),
    attendances(count),
    performance_notes(count)
  `

  let teachingQuery = admin
    .from('sessions')
    .select(sessionFields)
    .eq('tutor_id', user.id)
    .order('scheduled_at', { ascending: teachingRange !== 'past' })

  if (rangeStart) teachingQuery = teachingQuery.gte('scheduled_at', rangeStart.toISOString())
  if (rangeEnd) teachingQuery = teachingQuery.lte('scheduled_at', rangeEnd.toISOString())

  const classFields = 'id, name, level, is_active, class_type, status, start_date, end_date'

  // Batch 1: everything that only depends on user.id / searchParams — no
  // dependency on each other, so fetch them all at once instead of serially.
  const [
    { data: ownSessions },
    { data: pendingSwapRequests },
    { data: mainClassesRaw },
    { data: substituteSessions },
  ] = await Promise.all([
    teachingQuery.limit(500) as unknown as Promise<{ data: TeachingSessionRow[] | null }>,
    // Sessions this tutor has agreed to take over but admin hasn't approved yet —
    // still surfaced here (as "Menunggu Verifikasi Admin") so the tutor can track them.
    admin
      .from('session_change_requests')
      .select('session_id')
      .eq('new_tutor_id', user.id)
      .eq('request_type', 'change_tutor')
      .eq('status', 'pending')
      .eq('new_tutor_confirmed', true) as unknown as Promise<{ data: { session_id: string }[] | null }>,
    admin
      .from('classes')
      .select(classFields)
      .eq('tutor_id', user.id)
      .order('name') as unknown as Promise<{ data: Omit<ClassRow, 'scope'>[] | null }>,
    admin
      .from('sessions')
      .select('class_id')
      .eq('tutor_id', user.id) as unknown as Promise<{ data: { class_id: string }[] | null }>,
  ])

  const pendingSwapSessionIds = (pendingSwapRequests ?? []).map(r => r.session_id)
  const ownSessionIds = new Set((ownSessions ?? []).map(s => s.id))
  const newSwapIds = pendingSwapSessionIds.filter(id => !ownSessionIds.has(id))

  const mainClasses = mainClassesRaw ?? []
  const mainClassIds = new Set(mainClasses.map(c => c.id))
  const substituteClassIds = [...new Set((substituteSessions ?? []).map(s => s.class_id))]
    .filter(id => !mainClassIds.has(id))

  // Batch 2: depends on batch 1's results, but the two queries here don't
  // depend on each other.
  let swapQuery = admin.from('sessions').select(sessionFields).in('id', newSwapIds.length > 0 ? newSwapIds : [''])
  if (rangeStart) swapQuery = swapQuery.gte('scheduled_at', rangeStart.toISOString())
  if (rangeEnd) swapQuery = swapQuery.lte('scheduled_at', rangeEnd.toISOString())

  const [{ data: pendingSwapSessionsRaw }, { data: substituteClassesRaw }] = await Promise.all([
    newSwapIds.length > 0
      ? (swapQuery as unknown as Promise<{ data: TeachingSessionRow[] | null }>)
      : Promise.resolve({ data: [] as TeachingSessionRow[] }),
    substituteClassIds.length > 0
      ? admin
          .from('classes')
          .select(classFields)
          .in('id', substituteClassIds)
          .order('name') as unknown as Promise<{ data: Omit<ClassRow, 'scope'>[] | null }>
      : Promise.resolve({ data: [] as Omit<ClassRow, 'scope'>[] }),
  ])
  const pendingSwapSessions = pendingSwapSessionsRaw ?? []

  const teachingSessionsRaw = [...(ownSessions ?? []), ...pendingSwapSessions].sort((a, b) =>
    teachingRange === 'past'
      ? b.scheduled_at.localeCompare(a.scheduled_at)
      : a.scheduled_at.localeCompare(b.scheduled_at)
  )

  const teachingSessionIds = teachingSessionsRaw.map(s => s.id)

  const allClasses: ClassRow[] = [
    ...mainClasses.map(c => ({ ...c, scope: 'main' as const })),
    ...(substituteClassesRaw ?? []).map(c => ({ ...c, scope: 'substitute' as const })),
  ]
  const classIds = allClasses.map(c => c.id)

  type StudentCountRow = { class_id: string }
  type SessionRow = { class_id: string; scheduled_at: string; status: string }
  type SlotRow = { class_id: string; day_of_week: number | null; subject_ids: string[] }

  // Batch 3: depends on teachingSessionIds/classIds from batches 1-2, but
  // none of these queries depend on each other — one round trip for all.
  const [
    { data: teachingGradedData },
    { data: pendingRequestsRaw },
    { data: students },
    { data: next },
    { data: completed },
    { data: slotsData },
    { data: tutorSlotsData },
    { data: subjectsData },
  ] = await Promise.all([
    teachingSessionIds.length > 0
      ? admin
          .from('assessments')
          .select('session_id, assessment_results(count)')
          .in('session_id', teachingSessionIds) as unknown as Promise<{
            data: { session_id: string; assessment_results: CountRow }[] | null
          }>
      : Promise.resolve({ data: null as { session_id: string; assessment_results: CountRow }[] | null }),
    teachingSessionIds.length > 0
      ? admin
          .from('session_change_requests')
          .select('session_id')
          .in('session_id', teachingSessionIds)
          .eq('status', 'pending') as unknown as Promise<{ data: { session_id: string }[] | null }>
      : Promise.resolve({ data: [] as { session_id: string }[] }),
    classIds.length > 0
      ? admin
          .from('class_students')
          .select('class_id')
          .in('class_id', classIds)
          .eq('is_active', true) as unknown as Promise<{ data: StudentCountRow[] | null }>
      : Promise.resolve({ data: [] as StudentCountRow[] }),
    // Scoped to this tutor's own sessions — this "Sesi" column shows the
    // tutor's involvement in the class, not the class's overall schedule
    // (matters for substitute classes, where they only cover a subset).
    classIds.length > 0
      ? admin
          .from('sessions')
          .select('class_id, scheduled_at, status')
          .in('class_id', classIds)
          .eq('tutor_id', user.id)
          .eq('status', 'scheduled')
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true }) as unknown as Promise<{ data: SessionRow[] | null }>
      : Promise.resolve({ data: [] as SessionRow[] }),
    classIds.length > 0
      ? admin
          .from('sessions')
          .select('class_id, scheduled_at, status')
          .in('class_id', classIds)
          .eq('tutor_id', user.id)
          .eq('status', 'completed') as unknown as Promise<{ data: SessionRow[] | null }>
      : Promise.resolve({ data: [] as SessionRow[] }),
    classIds.length > 0
      ? admin
          .from('class_slots')
          .select('class_id, day_of_week, subject_ids')
          .in('class_id', classIds)
          .order('slot_index', { ascending: true }) as unknown as Promise<{ data: SlotRow[] | null }>
      : Promise.resolve({ data: [] as SlotRow[] }),
    classIds.length > 0
      ? admin
          .from('class_slots')
          .select('class_id, day_of_week, subject_ids')
          .in('class_id', classIds)
          .eq('tutor_id', user.id) as unknown as Promise<{ data: SlotRow[] | null }>
      : Promise.resolve({ data: [] as SlotRow[] }),
    classIds.length > 0
      ? admin
          .from('subjects')
          .select('id, name') as unknown as Promise<{ data: { id: string; name: string }[] | null }>
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const teachingGradedSessionIds = new Set(
    (teachingGradedData ?? [])
      .filter(a => (a.assessment_results[0]?.count ?? 0) > 0)
      .map(a => a.session_id)
  )

  function getTeachingCounts(session: TeachingSessionRow): SessionCounts {
    return {
      topic: session.topic,
      hasMaterials: (session.materials[0]?.count ?? 0) > 0,
      hasAssessments: (session.assessments[0]?.count ?? 0) > 0,
      hasAttendance: (session.attendances[0]?.count ?? 0) > 0,
      hasNotes: (session.performance_notes[0]?.count ?? 0) > 0,
      hasGradedAssessments: teachingGradedSessionIds.has(session.id),
    }
  }

  function isTeachingSessionComplete(session: TeachingSessionRow): boolean {
    if (session.status === 'cancelled') return true
    const counts = getTeachingCounts(session)
    const hasTopic = !!counts.topic
    const baseComplete = hasTopic && counts.hasMaterials && counts.hasAssessments
    if (session.status !== 'completed') return baseComplete
    return baseComplete && counts.hasAttendance && counts.hasNotes
  }

  const pendingRequestSessionIds = new Set((pendingRequestsRaw ?? []).map(r => r.session_id))

  let teachingSessionsFiltered = teachingSessionsRaw ?? []
  if (teachingCompliance === 'complete') {
    teachingSessionsFiltered = teachingSessionsFiltered.filter(isTeachingSessionComplete)
  } else if (teachingCompliance === 'incomplete') {
    teachingSessionsFiltered = teachingSessionsFiltered.filter(s => !isTeachingSessionComplete(s))
  }
  if (sessionStatusFilter === 'on_schedule') {
    teachingSessionsFiltered = teachingSessionsFiltered.filter(s => s.status !== 'cancelled' && !pendingRequestSessionIds.has(s.id))
  } else if (sessionStatusFilter === 'awaiting_admin') {
    teachingSessionsFiltered = teachingSessionsFiltered.filter(s => s.status !== 'cancelled' && pendingRequestSessionIds.has(s.id))
  } else if (sessionStatusFilter === 'cancelled') {
    teachingSessionsFiltered = teachingSessionsFiltered.filter(s => s.status === 'cancelled')
  }

  const teachingTotalCount = teachingSessionsFiltered.length
  const teachingTotalPages = Math.max(1, Math.ceil(teachingTotalCount / TEACHING_PAGE_SIZE))
  const teachingSessions = teachingSessionsFiltered.slice((page - 1) * TEACHING_PAGE_SIZE, page * TEACHING_PAGE_SIZE)

  const studentCounts = students ?? []
  const nextSessions: SessionRow[] = next ?? []
  const completedSessions: SessionRow[] = completed ?? []
  const slots: SlotRow[] = slotsData ?? []
  const tutorSlots: SlotRow[] = tutorSlotsData ?? []
  const subjects = subjectsData ?? []

  const countByClass: Record<string, number> = {}
  for (const s of studentCounts) {
    countByClass[s.class_id] = (countByClass[s.class_id] ?? 0) + 1
  }

  const nextByClass: Record<string, SessionRow> = {}
  for (const s of nextSessions) {
    if (!nextByClass[s.class_id]) nextByClass[s.class_id] = s
  }

  const completedCountByClass: Record<string, number> = {}
  for (const s of completedSessions) {
    completedCountByClass[s.class_id] = (completedCountByClass[s.class_id] ?? 0) + 1
  }

  const slotsPerWeekByClass: Record<string, number> = {}
  for (const slot of tutorSlots) {
    if (slot.day_of_week == null) continue
    slotsPerWeekByClass[slot.class_id] = (slotsPerWeekByClass[slot.class_id] ?? 0) + 1
  }

  const subjectNameMap = new Map(subjects.map(s => [s.id, s.name]))
  const jadwalMap = new Map<string, { day: string; subject: string }[]>()
  for (const slot of slots) {
    if (slot.day_of_week == null) continue
    const dayLabel = DAYS[slot.day_of_week] ?? ''
    const subjectLabel = (slot.subject_ids ?? []).map(id => subjectNameMap.get(id)).filter(Boolean).join(', ') || '—'
    const existing = jadwalMap.get(slot.class_id) ?? []
    existing.push({ day: dayLabel, subject: subjectLabel })
    jadwalMap.set(slot.class_id, existing)
  }

  function getProgress(cls: ClassRow): { completed: number; target: number | null; pct: number | null } {
    const completed = completedCountByClass[cls.id] ?? 0
    const slotsPerWeek = slotsPerWeekByClass[cls.id] ?? 0
    if (!cls.end_date || slotsPerWeek === 0) return { completed, target: null, pct: null }
    const start = new Date(cls.start_date ?? cls.end_date)
    const end = new Date(cls.end_date)
    const totalWeeks = Math.max(1, Math.round((end.getTime() - start.getTime()) / (7 * 86400000)))
    const target = slotsPerWeek * totalWeeks
    const pct = Math.min(100, Math.round((completed / target) * 100))
    return { completed, target, pct }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  let filtered = allClasses
  if (q) {
    const lq = q.toLowerCase()
    filtered = filtered.filter(c => c.name.toLowerCase().includes(lq))
  }
  if (levelFilter) filtered = filtered.filter(c => c.level === levelFilter)
  if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter)
  if (typeFilter === 'group') filtered = filtered.filter(c => c.class_type === 'group')
  else if (typeFilter === 'private') filtered = filtered.filter(c => c.class_type === 'private')
  if (scopeFilter === 'main' || scopeFilter === 'substitute') filtered = filtered.filter(c => c.scope === scopeFilter)

  const availableLevels = LEVEL_ORDER.filter(l => allClasses.some(c => c.level === l))
  const regularCount = allClasses.filter(c => c.class_type === 'group').length
  const privateCount = allClasses.filter(c => c.class_type === 'private').length
  const hasFilter = !!(q || levelFilter || statusFilter || typeFilter || scopeFilter)
  const tableTitle = hasFilter
    ? `Menampilkan ${filtered.length} dari ${allClasses.length} kelas`
    : `${allClasses.length} Kelas`

  function teachingPageUrl(targetPage: number) {
    const params: Record<string, string> = {
      ...(q ? { q } : {}),
      ...(levelFilter ? { level: levelFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(scopeFilter ? { scope: scopeFilter } : {}),
      ...(teachingRange ? { range: teachingRange } : {}),
      ...(teachingFrom ? { from: teachingFrom } : {}),
      ...(teachingTo ? { to: teachingTo } : {}),
      ...(teachingCompliance ? { compliance: teachingCompliance } : {}),
      ...(sessionStatusFilter ? { sessionStatus: sessionStatusFilter } : {}),
      ...(targetPage > 1 ? { page: String(targetPage) } : {}),
    }
    const qs = new URLSearchParams(params).toString()
    return qs ? `/tutor/classes?${qs}` : '/tutor/classes'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kelas Saya</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar kelas yang kamu ampu.</p>
        </div>
        <Link
          href="/tutor/schedule"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-blue-50/50 transition-colors shrink-0"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Kalender
        </Link>
      </div>

      {allClasses.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Grup" value={regularCount} />
          <MetricCard label="Privat" value={privateCount} />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{tableTitle}</h2>
          {allClasses.length > 0 && (
            <ClassFilters
              q={q}
              level={levelFilter}
              type={typeFilter}
              status={statusFilter}
              scope={scopeFilter}
              availableLevels={availableLevels}
            />
          )}
        </div>

        {allClasses.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            Kamu belum ditugaskan ke kelas manapun.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            Tidak ada kelas yang sesuai filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="pl-5 pr-4 py-3 text-left">Nama Kelas</th>
                  <th className="px-4 py-3 text-center">Siswa</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Jadwal</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Sesi</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(cls => {
                  const siswaCount = countByClass[cls.id] ?? 0
                  const progress = getProgress(cls)
                  const next = nextByClass[cls.id]

                  return (
                    <tr key={cls.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="pl-5 pr-4 py-3">
                        <Link href={`/tutor/classes/${cls.id}`} className="block">
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {cls.name}
                            {cls.scope === 'substitute' && (
                              <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                Pengganti
                              </span>
                            )}
                          </p>
                          {cls.level && <span className="text-sm text-gray-400">{cls.level}</span>}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Link href={`/tutor/classes/${cls.id}`} className="block font-semibold text-gray-800">
                          {siswaCount}
                        </Link>
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link href={`/tutor/classes/${cls.id}`} className="block">
                          {(jadwalMap.get(cls.id) ?? []).length === 0 ? (
                            <span className="text-sm text-gray-400">—</span>
                          ) : (
                            (jadwalMap.get(cls.id) ?? []).slice(0, 3).map((j, i) => (
                              <span key={i} className="block text-sm text-gray-600 leading-snug">
                                <span className="font-medium text-gray-700">{j.day}:</span> {j.subject}
                              </span>
                            ))
                          )}
                        </Link>
                      </td>

                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Link href={`/tutor/classes/${cls.id}`} className="block space-y-1.5">
                          {progress.target !== null && progress.pct !== null ? (
                            <div className="w-36">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">{progress.completed}/{progress.target} sesi</span>
                                <span className={`text-sm font-semibold ${
                                  progress.pct >= 80 ? 'text-green-600' :
                                  progress.pct >= 40 ? 'text-yellow-600' : 'text-red-500'
                                }`}>{progress.pct}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    progress.pct >= 80 ? 'bg-green-500' :
                                    progress.pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${progress.pct}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600">{progress.completed} sesi selesai</span>
                          )}
                          <span className="block text-sm text-gray-400">
                            Berikutnya: {next ? fmtDate(next.scheduled_at) : 'Belum ada'}
                          </span>
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <Link href={`/tutor/classes/${cls.id}`} className="block">
                          <span className={`inline-flex text-sm font-medium px-2 py-0.5 rounded-full ${
                            cls.status === 'selesai' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                          }`}>
                            {cls.status === 'selesai' ? 'Selesai' : 'Aktif'}
                          </span>
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link href={`/tutor/classes/${cls.id}`} className="inline-block">
                          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Jadwal Mengajar</h2>
          <TeachingScheduleFilters
            range={teachingRange}
            from={teachingFrom}
            to={teachingTo}
            compliance={teachingCompliance}
            sessionStatus={sessionStatusFilter}
          />
        </div>

        {!teachingSessions || teachingSessions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            Tidak ada sesi ditemukan.
          </p>
        ) : (
          <div className="px-5 pb-5 space-y-2">
            {teachingSessions.map(session => {
              const date = new Date(session.scheduled_at)
              const counts = getTeachingCounts(session)
              const displayStatus = getSessionDisplayStatus(session.status, pendingRequestSessionIds.has(session.id))
              return (
                <Link
                  key={session.id}
                  href={`/tutor/sessions/${session.id}`}
                  className="flex items-center justify-between rounded-xl ring-1 ring-gray-900/5 px-5 py-4 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-center w-12 shrink-0">
                      <p className="text-xs text-gray-500">
                        {date.toLocaleDateString('id-ID', { month: 'short' })}
                      </p>
                      <p className="text-xl font-bold text-gray-900">{date.getDate()}</p>
                      <p className="text-xs text-gray-500">
                        {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{session.classes?.name ?? 'Kelas'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {session.location ? ` • ${session.location}` : ''}
                        {session.topic ? ` • ${session.topic}` : ''}
                      </p>
                      <SessionStatusChips status={session.status} counts={counts} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${displayStatus.color}`}>
                      {displayStatus.label}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {teachingTotalPages > 1 && (
          <div className="flex items-center justify-between px-5 pb-5 pt-1">
            <p className="text-sm text-gray-500">Halaman {page} dari {teachingTotalPages}</p>
            <div className="flex gap-2">
              <Link
                href={teachingPageUrl(page - 1)}
                aria-disabled={page <= 1}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  page <= 1
                    ? 'border-gray-100 text-gray-300 pointer-events-none'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sebelumnya
              </Link>
              <Link
                href={teachingPageUrl(page + 1)}
                aria-disabled={page >= teachingTotalPages}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  page >= teachingTotalPages
                    ? 'border-gray-100 text-gray-300 pointer-events-none'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Berikutnya
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
