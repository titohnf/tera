import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import Link from 'next/link'
import MetricCard from '@/components/dashboard/MetricCard'
import ClassFilters from '@/components/admin/classes/ClassFilters'
import TeachingScheduleFilters from '@/components/tutor/TeachingScheduleFilters'
import SessionStatusChips from '@/components/sessions/SessionStatusChips'
import type { SessionCounts } from '@/components/sessions/SessionStatusChips'

type ClassRow = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  class_type: string | null
  status: string
  start_date: string | null
  end_date: string | null
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

const SESSION_STATUS_LABEL: Record<string, string> = {
  scheduled: 'Terjadwal',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

const SESSION_STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const LEVEL_ORDER = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const TEACHING_PAGE_SIZE = 10

export default async function TutorClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; status?: string; type?: string; q?: string; range?: string; from?: string; to?: string; page?: string; compliance?: string }>
}) {
  const {
    level: levelFilter = '', status: statusFilter = '', type: typeFilter = '', q = '',
    range: teachingRange = '', from: teachingFrom = '', to: teachingTo = '',
    page: pageParam = '1', compliance: teachingCompliance = '',
  } = await searchParams
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()

  const now = new Date()
  let rangeStart: Date | null = null
  let rangeEnd: Date | null = null

  if (teachingRange === 'today') {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  } else if (teachingRange === 'tomorrow') {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
    rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999)
  } else if (teachingRange === 'week') {
    const dayOffset = (now.getDay() + 6) % 7 // Monday = 0
    rangeStart = new Date(now)
    rangeStart.setDate(now.getDate() - dayOffset)
    rangeStart.setHours(0, 0, 0, 0)
    rangeEnd = new Date(rangeStart)
    rangeEnd.setDate(rangeStart.getDate() + 6)
    rangeEnd.setHours(23, 59, 59, 999)
  } else if (teachingRange === 'month') {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  } else if (teachingRange === 'next7') {
    rangeStart = new Date(now)
    rangeEnd = new Date(now)
    rangeEnd.setDate(rangeEnd.getDate() + 7)
    rangeEnd.setHours(23, 59, 59, 999)
  } else if (teachingRange === 'custom' && teachingFrom && teachingTo) {
    rangeStart = new Date(`${teachingFrom}T00:00:00`)
    rangeEnd = new Date(`${teachingTo}T23:59:59`)
  }
  // Default (no range): show all sessions, no date bound

  const page = Math.max(1, parseInt(pageParam) || 1)

  let teachingQuery = admin
    .from('sessions')
    .select(`
      id, class_id, scheduled_at, duration_minutes, location, status, topic,
      classes(name, level),
      materials(count),
      assessments(count),
      attendances(count),
      performance_notes(count)
    `)
    .eq('tutor_id', user.id)
    .order('scheduled_at', { ascending: true })

  if (rangeStart) teachingQuery = teachingQuery.gte('scheduled_at', rangeStart.toISOString())
  if (rangeEnd) teachingQuery = teachingQuery.lte('scheduled_at', rangeEnd.toISOString())

  const { data: teachingSessionsRaw } = await teachingQuery.limit(500) as unknown as {
    data: TeachingSessionRow[] | null
  }

  const teachingSessionIds = (teachingSessionsRaw ?? []).map(s => s.id)
  const { data: teachingGradedData } = teachingSessionIds.length > 0
    ? await admin
        .from('assessments')
        .select('session_id, assessment_results(count)')
        .in('session_id', teachingSessionIds) as unknown as {
          data: { session_id: string; assessment_results: CountRow }[] | null
        }
    : { data: null }

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

  let teachingSessionsFiltered = teachingSessionsRaw ?? []
  if (teachingCompliance === 'complete') {
    teachingSessionsFiltered = teachingSessionsFiltered.filter(isTeachingSessionComplete)
  } else if (teachingCompliance === 'incomplete') {
    teachingSessionsFiltered = teachingSessionsFiltered.filter(s => !isTeachingSessionComplete(s))
  }

  const teachingTotalCount = teachingSessionsFiltered.length
  const teachingTotalPages = Math.max(1, Math.ceil(teachingTotalCount / TEACHING_PAGE_SIZE))
  const teachingSessions = teachingSessionsFiltered.slice((page - 1) * TEACHING_PAGE_SIZE, page * TEACHING_PAGE_SIZE)

  const { data: classes } = await admin
    .from('classes')
    .select('id, name, level, is_active, class_type, status, start_date, end_date')
    .eq('tutor_id', user.id)
    .order('name') as unknown as { data: ClassRow[] | null }

  const allClasses = classes ?? []
  const classIds = allClasses.map(c => c.id)

  type StudentCountRow = { class_id: string }
  type SessionRow = { class_id: string; scheduled_at: string; status: string }
  type SlotRow = { class_id: string; day_of_week: number | null; subject_ids: string[] }

  let studentCounts: StudentCountRow[] = []
  let nextSessions: SessionRow[] = []
  let completedSessions: SessionRow[] = []
  let slots: SlotRow[] = []
  let subjects: { id: string; name: string }[] = []

  if (classIds.length > 0) {
    const [{ data: students }, { data: next }, { data: completed }, { data: slotsData }, { data: subjectsData }] = await Promise.all([
      admin
        .from('class_students')
        .select('class_id')
        .in('class_id', classIds)
        .eq('is_active', true) as unknown as Promise<{ data: StudentCountRow[] | null }>,
      admin
        .from('sessions')
        .select('class_id, scheduled_at, status')
        .in('class_id', classIds)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true }) as unknown as Promise<{ data: SessionRow[] | null }>,
      admin
        .from('sessions')
        .select('class_id, scheduled_at, status')
        .in('class_id', classIds)
        .eq('status', 'completed') as unknown as Promise<{ data: SessionRow[] | null }>,
      admin
        .from('class_slots')
        .select('class_id, day_of_week, subject_ids')
        .in('class_id', classIds)
        .order('slot_index', { ascending: true }) as unknown as Promise<{ data: SlotRow[] | null }>,
      admin
        .from('subjects')
        .select('id, name') as unknown as Promise<{ data: { id: string; name: string }[] | null }>,
    ])
    studentCounts = students ?? []
    nextSessions = next ?? []
    completedSessions = completed ?? []
    slots = slotsData ?? []
    subjects = subjectsData ?? []
  }

  const countByClass: Record<string, number> = {}
  for (const s of studentCounts) {
    countByClass[s.class_id] = (countByClass[s.class_id] ?? 0) + 1
  }

  const nextByClass: Record<string, SessionRow> = {}
  for (const s of nextSessions) {
    if (!nextByClass[s.class_id]) nextByClass[s.class_id] = s
  }

  const completedCountByClass: Record<string, number> = {}
  const slotsPerWeekByClass: Record<string, number> = {}
  for (const s of completedSessions) {
    completedCountByClass[s.class_id] = (completedCountByClass[s.class_id] ?? 0) + 1
  }

  const subjectNameMap = new Map(subjects.map(s => [s.id, s.name]))
  const jadwalMap = new Map<string, { day: string; subject: string }[]>()
  for (const slot of slots) {
    if (slot.day_of_week == null) continue
    slotsPerWeekByClass[slot.class_id] = (slotsPerWeekByClass[slot.class_id] ?? 0) + 1
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

  const availableLevels = LEVEL_ORDER.filter(l => allClasses.some(c => c.level === l))
  const regularCount = allClasses.filter(c => c.class_type === 'group').length
  const privateCount = allClasses.filter(c => c.class_type === 'private').length
  const hasFilter = !!(q || levelFilter || statusFilter || typeFilter)
  const tableTitle = hasFilter
    ? `Menampilkan ${filtered.length} dari ${allClasses.length} kelas`
    : `${allClasses.length} Kelas`

  function teachingPageUrl(targetPage: number) {
    const params: Record<string, string> = {
      ...(q ? { q } : {}),
      ...(levelFilter ? { level: levelFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(teachingRange ? { range: teachingRange } : {}),
      ...(teachingFrom ? { from: teachingFrom } : {}),
      ...(teachingTo ? { to: teachingTo } : {}),
      ...(teachingCompliance ? { compliance: teachingCompliance } : {}),
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
                          <p className="font-medium text-gray-900">{cls.name}</p>
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
          <TeachingScheduleFilters range={teachingRange} from={teachingFrom} to={teachingTo} compliance={teachingCompliance} />
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
              const complete = isTeachingSessionComplete(session)
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{session.classes?.name ?? 'Kelas'}</p>
                        {session.classes?.level && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {session.classes.level}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {session.location ? ` • ${session.location}` : ''}
                        {` • ${session.duration_minutes} menit`}
                      </p>
                      <SessionStatusChips status={session.status} counts={counts} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {session.status !== 'cancelled' && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        complete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {complete ? 'Lengkap' : 'Belum Lengkap'}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SESSION_STATUS_COLOR[session.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {SESSION_STATUS_LABEL[session.status] ?? session.status}
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
