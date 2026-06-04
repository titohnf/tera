import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { evaluateStudentCritical } from '@/lib/studentCritical'
import CriticalDetailCard from '@/components/siswa/CriticalDetailCard'
import UnenrollButton from '@/components/siswa/UnenrollButton'
import StudentStatusButton from '@/components/admin/siswa/StudentStatusButton'
import JadwalTable from '@/components/admin/siswa/JadwalTable'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  level: string | null
  grade: string | null
  parent_name: string | null
  created_at: string
  avatar_url: string | null
  is_active: boolean
}

type EnrolledClass = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  tutor: { full_name: string } | null
  schedule_days: number[]
  schedule_time: string | null
  subject_name: string | null
}

type SessionRow = {
  id: string
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
}

type AttendanceRow = {
  session_id: string
  status: string
}

type InvoiceRow = {
  id: string
  invoice_number: string
  total_due: number
  status: string
  due_date: string | null
  issued_at: string | null
  notes: string | null
}

type AssessmentRow = {
  id: string
  title: string
  max_score: number
  session_id: string
  sessions: { scheduled_at: string; topic: string | null; class_id: string } | null
}

type AssessmentResultRow = {
  assessment_id: string
  score: number | null
  feedback: string | null
}

type NoteRow = {
  id: string
  body: string
  created_at: string
  session_id: string
  sessions: { scheduled_at: string; topic: string | null; class_id: string } | null
  profiles: { full_name: string } | null
}

type Tab = 'ringkasan' | 'jadwal' | 'tagihan' | 'catatan'

const TABS: { key: Tab; label: string }[] = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'jadwal',    label: 'Jadwal' },
  { key: 'tagihan',   label: 'Tagihan' },
  { key: 'catatan',   label: 'Catatan' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

const DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const STATUS_SESSION: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Terjadwal', cls: 'bg-blue-100 text-blue-700' },
  completed:  { label: 'Selesai',   cls: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Dibatalkan', cls: 'bg-red-100 text-red-600' },
}

const STATUS_INVOICE: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Draft',      cls: 'bg-gray-100 text-gray-500' },
  sent:      { label: 'Terkirim',   cls: 'bg-blue-100 text-blue-700' },
  paid:      { label: 'Lunas',      cls: 'bg-green-100 text-green-700' },
  overdue:   { label: 'Overdue',    cls: 'bg-red-100 text-red-600' },
  cancelled: { label: 'Dibatalkan', cls: 'bg-gray-100 text-gray-400' },
}

const ATTENDANCE_STATUS: Record<string, { label: string; cls: string }> = {
  present: { label: 'Hadir',      cls: 'bg-green-100 text-green-700' },
  late:    { label: 'Terlambat',  cls: 'bg-yellow-100 text-yellow-700' },
  absent:  { label: 'Absen',      cls: 'bg-red-100 text-red-600' },
  excused: { label: 'Izin',       cls: 'bg-gray-100 text-gray-500' },
}

function toSlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SiswaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab: rawTab } = await searchParams
  const activeTab: Tab = (TABS.some(t => t.key === rawTab) ? rawTab : 'ringkasan') as Tab

  const admin = createAdminClient()

  let student: Profile | null = null

  if (isUUID(id)) {
    const { data } = await admin
      .from('profiles')
      .select('id, full_name, email, phone, level, grade, parent_name, created_at, avatar_url, is_active')
      .eq('id', id)
      .eq('role', 'student')
      .single()
    student = data as Profile | null
  } else {
    const { data: all } = await admin
      .from('profiles')
      .select('id, full_name, email, phone, level, grade, parent_name, created_at, avatar_url, is_active')
      .eq('role', 'student')
    student = (all as Profile[] | null)?.find(s => toSlug(s.full_name ?? '') === id) ?? null
  }

  if (!student) notFound()
  const profile = student
  const studentId = profile.id
  const urlSlug = toSlug(profile.full_name ?? '') || studentId

  type RawEnroll = {
    is_active: boolean
    classes: {
      id: string
      name: string
      level: string | null
      is_active: boolean
      schedule_days: number[] | null
      schedule_time: string | null
      profiles: { full_name: string } | null
      class_subjects: { subjects: { name: string } | null }[]
    } | null
  }

  const allEnrollResult = await (admin
    .from('class_students')
    .select('is_active, classes(id, name, level, is_active, schedule_days, schedule_time, profiles!tutor_id(full_name), class_subjects(subjects(name)))')
    .eq('student_id', studentId) as unknown as Promise<{ data: RawEnroll[] | null }>)

  const allEnrollRaw: RawEnroll[] = allEnrollResult.data ?? []

  const toClass = (e: RawEnroll): EnrolledClass | null => {
    if (!e.classes) return null
    return {
      id: e.classes.id,
      name: e.classes.name,
      level: e.classes.level,
      is_active: e.classes.is_active,
      tutor: e.classes.profiles ? { full_name: e.classes.profiles.full_name } : null,
      schedule_days: e.classes.schedule_days ?? [],
      schedule_time: e.classes.schedule_time ?? null,
      subject_name: e.classes.class_subjects?.[0]?.subjects?.name ?? null,
    }
  }

  const enrolledClasses: EnrolledClass[] = allEnrollRaw.filter(e => e.is_active).map(toClass).filter((c): c is EnrolledClass => c !== null)
  const historicalClasses: EnrolledClass[] = allEnrollRaw.filter(e => !e.is_active).map(toClass).filter((c): c is EnrolledClass => c !== null)

  const allClassIds = allEnrollRaw.map(e => e.classes?.id).filter((cid): cid is string => !!cid)
  const activeClassIds = enrolledClasses.map(c => c.id)

  const [sessionsRes, attendancesRes, invoicesRes, notesRes] = await Promise.all([
    allClassIds.length > 0
      ? admin.from('sessions').select('id, class_id, scheduled_at, topic, status').in('class_id', allClassIds).lte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: false }).limit(100) as unknown as Promise<{ data: SessionRow[] | null }>
      : Promise.resolve({ data: [] as SessionRow[] }),
    admin.from('attendances').select('session_id, status').eq('student_id', studentId) as unknown as Promise<{ data: AttendanceRow[] | null }>,
    admin.from('invoices').select('id, invoice_number, total_due, status, due_date, issued_at, notes').eq('student_id', studentId).order('issued_at', { ascending: false }).limit(24) as unknown as Promise<{ data: InvoiceRow[] | null }>,
    admin.from('performance_notes').select('id, body, created_at, session_id, sessions(scheduled_at, topic, class_id), profiles!tutor_id(full_name)').eq('student_id', studentId).order('created_at', { ascending: false }).limit(30) as unknown as Promise<{ data: NoteRow[] | null }>,
  ])

  const sessions: SessionRow[] = sessionsRes.data ?? []
  const attendances: AttendanceRow[] = attendancesRes.data ?? []
  const invoices: InvoiceRow[] = invoicesRes.data ?? []
  const notes: NoteRow[] = notesRes.data ?? []

  const sessionIds = sessions.map(s => s.id)
  let assessments: AssessmentRow[] = []
  let assessmentResults: AssessmentResultRow[] = []

  if (sessionIds.length > 0) {
    const assessRes = await admin.from('assessments').select('id, title, max_score, session_id, sessions(scheduled_at, topic, class_id)').in('session_id', sessionIds) as unknown as { data: AssessmentRow[] | null }
    assessments = assessRes.data ?? []
    if (assessments.length > 0) {
      const aIds = assessments.map(a => a.id)
      const resRes = await admin.from('assessment_results').select('assessment_id, score, feedback').eq('student_id', studentId).in('assessment_id', aIds) as unknown as { data: AssessmentResultRow[] | null }
      assessmentResults = resRes.data ?? []
    }
  }

  type UpcomingSession = { id: string; class_id: string; scheduled_at: string; topic: string | null; status: string }

  let upcomingSessions: UpcomingSession[] = []
  let nextScheduledSessionDate: Date | null = null

  if (activeClassIds.length > 0) {
    const nowIso = new Date().toISOString()
    const { data: allSessionsData } = await admin
      .from('sessions')
      .select('id, class_id, scheduled_at, topic, status')
      .in('class_id', activeClassIds)
      .order('scheduled_at', { ascending: false }) as unknown as { data: UpcomingSession[] | null }
    upcomingSessions = allSessionsData ?? []
    const firstUpcoming = upcomingSessions.find(s => s.status === 'scheduled' && s.scheduled_at >= nowIso)
    if (firstUpcoming) nextScheduledSessionDate = new Date(firstUpcoming.scheduled_at)
  }

  const historicalClassIds = historicalClasses.map(c => c.id)
  const historicalSessionStats = new Map<string, { count: number; firstDate: string; lastDate: string }>()
  if (historicalClassIds.length > 0) {
    const { data: histData } = await admin
      .from('sessions')
      .select('class_id, scheduled_at')
      .in('class_id', historicalClassIds)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: true }) as unknown as { data: { class_id: string; scheduled_at: string }[] | null }
    for (const s of histData ?? []) {
      const existing = historicalSessionStats.get(s.class_id)
      if (!existing) {
        historicalSessionStats.set(s.class_id, { count: 1, firstDate: s.scheduled_at, lastDate: s.scheduled_at })
      } else {
        existing.count++
        if (s.scheduled_at > existing.lastDate) existing.lastDate = s.scheduled_at
      }
    }
  }

  const attendanceMap = new Map<string, string>()
  for (const a of attendances) attendanceMap.set(a.session_id, a.status)

  const classNameMap = new Map<string, string>()
  for (const c of enrolledClasses) classNameMap.set(c.id, c.name)

  const resultMap = new Map<string, AssessmentResultRow>()
  for (const r of assessmentResults) resultMap.set(r.assessment_id, r)

  const today = new Date().toISOString().slice(0, 10)
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const hadirCount = completedSessions.filter(s => { const st = attendanceMap.get(s.id); return st === 'present' || st === 'late' }).length
  const hadirPct = completedSessions.length > 0 ? Math.round((hadirCount / completedSessions.length) * 100) : null
  const overdueInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.due_date && inv.due_date < today)
  const unpaidTotal = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((s, i) => s + i.total_due, 0)

  const now2 = new Date()
  const startOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1)
  const sessionsThisMonth = completedSessions.filter(s => new Date(s.scheduled_at) >= startOfMonth)
  const hadirThisMonth = sessionsThisMonth.filter(s => { const st = attendanceMap.get(s.id); return st === 'present' || st === 'late' }).length
  const attendanceRateThisMonth = sessionsThisMonth.length >= 4 ? Math.round((hadirThisMonth / sessionsThisMonth.length) * 100) : null

  const sortedAssessmentScores = assessments.filter(a => resultMap.get(a.id)?.score != null).sort((a, b) => (b.sessions?.scheduled_at ?? '').localeCompare(a.sessions?.scheduled_at ?? '')).map(a => resultMap.get(a.id)!.score as number)

  const tutorIsActive = enrolledClasses.length === 0 || enrolledClasses.some(c => c.tutor !== null)
  const lastSessionDate = completedSessions.length > 0 ? new Date(completedSessions[0].scheduled_at) : null
  const enrolledAt = new Date(profile.created_at)
  const daysBetween = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / 86_400_000)

  const criticalInput = {
    studentId: profile.id,
    studentName: profile.full_name ?? '',
    isActive: true,
    enrolledAt,
    attendanceRateThisMonth,
    sessionCountThisMonth: sessionsThisMonth.length,
    latestScore: sortedAssessmentScores[0] ?? null,
    previousScore: sortedAssessmentScores[1] ?? null,
    scoreHistory: sortedAssessmentScores.slice(0, 6),
    lastSessionDate,
    hasActiveClass: enrolledClasses.length > 0,
    daysSinceEnrollment: daysBetween(enrolledAt, now2),
    nextScheduledSessionDate,
    tutorIsActive,
    maxOverdueDays: overdueInvoices.length > 0 ? Math.max(...overdueInvoices.map(inv => daysBetween(new Date(inv.due_date!), now2))) : 0,
    totalOutstanding: unpaidTotal,
    monthlyBaseRate: 500_000,
  }

  const criticalResult = evaluateStudentCritical(criticalInput)
  const tabUrl = (t: Tab) => `/admin/siswa/${urlSlug}?tab=${t}`

  // ─── Schedule table ───────────────────────────────────────────────────────────
  const CLASS_PALETTE = [
    'bg-blue-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500',
    'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
  ]
  const classColorMap = new Map<string, string>()
  enrolledClasses.forEach((cls, i) => classColorMap.set(cls.id, CLASS_PALETTE[i % CLASS_PALETTE.length]))

  const schedClassByDay = new Map<number, { classId: string }[]>()
  for (const cls of enrolledClasses) {
    for (const day of cls.schedule_days) {
      if (!schedClassByDay.has(day)) schedClassByDay.set(day, [])
      schedClassByDay.get(day)!.push({ classId: cls.id })
    }
  }

  const schedDays = [0, 1, 2, 3, 4, 5, 6].filter(d => schedClassByDay.has(d))

  const tabCounts: Partial<Record<Tab, number>> = {
    jadwal: enrolledClasses.length + historicalClasses.length,
    tagihan: invoices.length,
    catatan: notes.length,
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/siswa" className="hover:text-blue-600 transition-colors">Siswa</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{profile.full_name ?? '(tanpa nama)'}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="col-span-2 space-y-5">

          {/* Profile card */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-base font-semibold text-blue-700">{getInitials(profile.full_name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900">{profile.full_name ?? '(tanpa nama)'}</h1>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-sm text-gray-500">{profile.email ?? '—'}</span>
                  {profile.phone && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500">{profile.phone}</span>
                    </>
                  )}
                </div>
                {profile.parent_name && (
                  <p className="text-sm text-gray-400 mt-0.5">Ortu: {profile.parent_name}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.level && (
                    <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
                      {profile.level}
                    </span>
                  )}
                  {profile.grade && (
                    <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                      Kelas {profile.grade}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/admin/users/${studentId}/edit`}
                className="shrink-0 px-3 py-1.5 text-sm font-medium text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Edit
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            {/* Tab nav */}
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {TABS.map(t => {
                const count = tabCounts[t.key]
                return (
                  <Link
                    key={t.key}
                    href={tabUrl(t.key)}
                    className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === t.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                    {count !== undefined && count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        {count}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Tab: Jadwal */}
            {activeTab === 'jadwal' && (
              <div className="p-5 space-y-6">
                <div>
                  <JadwalTable
                    sessions={upcomingSessions}
                    enrolledClasses={enrolledClasses.map(c => ({ id: c.id, subject_name: c.subject_name, tutor: c.tutor }))}
                    attendanceMap={Object.fromEntries(attendanceMap)}
                    studentId={studentId}
                  />
                </div>

                {/* Historical classes */}
                {historicalClasses.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                      Riwayat Kelas ({historicalClasses.length})
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <th className="pl-4 pr-3 py-2.5 text-left">Kelas</th>
                            <th className="px-3 py-2.5 text-center">Total Sesi</th>
                            <th className="px-3 py-2.5 text-left hidden sm:table-cell">Mulai</th>
                            <th className="px-3 py-2.5 text-left hidden sm:table-cell">Selesai</th>
                            <th className="pr-3 pl-2 py-2.5" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {historicalClasses.map(cls => {
                            const stats = historicalSessionStats.get(cls.id)
                            const firstDate = stats?.firstDate
                              ? new Date(stats.firstDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'
                            const lastDate = stats?.lastDate
                              ? new Date(stats.lastDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'
                            return (
                              <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                                <td className="pl-4 pr-3 py-2.5">
                                  <Link href={`/admin/classes/${cls.id}`} className="block">
                                    <p className="font-medium text-gray-700">{cls.name}</p>
                                    {cls.subject_name && <p className="text-xs text-gray-400">{cls.subject_name}</p>}
                                  </Link>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <Link href={`/admin/classes/${cls.id}`} className="block font-semibold text-gray-700">
                                    {stats?.count ?? 0}
                                  </Link>
                                </td>
                                <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">
                                  <Link href={`/admin/classes/${cls.id}`} className="block">{firstDate}</Link>
                                </td>
                                <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">
                                  <Link href={`/admin/classes/${cls.id}`} className="block">{lastDate}</Link>
                                </td>
                                <td className="pr-3 pl-2 py-2.5 text-right">
                                  <Link href={`/admin/classes/${cls.id}`}>
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
                  </div>
                )}
              </div>
            )}

            {/* Tab: Ringkasan */}
            {activeTab === 'ringkasan' && (
              <div className="p-5 space-y-4">
                <CriticalDetailCard result={criticalResult} input={criticalInput} />

                {/* Kelas aktif */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Kelas Aktif ({enrolledClasses.length})
                  </p>
                  {enrolledClasses.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">Tidak ada kelas aktif saat ini.</p>
                  ) : (
                    <div className="space-y-2">
                      {enrolledClasses.map(cls => (
                        <div key={cls.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                          <Link href={`/admin/classes/${cls.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                            <p className="text-sm font-semibold text-gray-800">{cls.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {cls.tutor ? cls.tutor.full_name : 'Belum ada tutor'}
                              {cls.level && ` · ${cls.level}`}
                            </p>
                          </Link>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <UnenrollButton classId={cls.id} studentId={studentId} />
                            <Link href={`/admin/classes/${cls.id}`}>
                              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Riwayat kelas */}
                {historicalClasses.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Riwayat Kelas ({historicalClasses.length})
                    </p>
                    <div className="space-y-1.5">
                      {historicalClasses.map(cls => (
                        <Link key={cls.id} href={`/admin/classes/${cls.id}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="text-sm text-gray-500">{cls.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{cls.tutor ? cls.tutor.full_name : 'Belum ada tutor'}{cls.level && ` · ${cls.level}`}</p>
                          </div>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-3">Non-aktif</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Tagihan */}
            {activeTab === 'tagihan' && (
              <div>
                {invoices.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">Belum ada tagihan.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <th className="px-5 py-3 text-left">Deskripsi</th>
                          <th className="px-4 py-3 text-left hidden sm:table-cell">Tanggal</th>
                          <th className="px-4 py-3 text-left hidden sm:table-cell">Jatuh Tempo</th>
                          <th className="px-4 py-3 text-right">Nominal</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map(inv => {
                          const isOverdue = inv.status !== 'paid' && inv.due_date && inv.due_date < today
                          const invSt = isOverdue ? { label: 'Overdue', cls: 'bg-red-100 text-red-600' } : (STATUS_INVOICE[inv.status] ?? { label: inv.status, cls: 'bg-gray-100 text-gray-500' })
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3 text-gray-700">{inv.invoice_number ?? inv.notes ?? '—'}</td>
                              <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatDateShort(inv.issued_at)}</td>
                              <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatDateShort(inv.due_date)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(inv.total_due)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${invSt.cls}`}>{invSt.label}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Link href={`/admin/invoices/${inv.id}`}>
                                  <svg className="w-4 h-4 text-gray-300 hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="px-5 py-3 border-t border-slate-100">
                  <Link href={`/admin/invoices/new?student_id=${studentId}`} className="text-sm font-medium text-blue-600 hover:underline">
                    + Buat Tagihan
                  </Link>
                </div>
              </div>
            )}

            {/* Tab: Catatan */}
            {activeTab === 'catatan' && (
              notes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Belum ada catatan performa.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notes.map(note => (
                    <div key={note.id} className="px-5 py-4">
                      <p className="text-sm text-gray-800 leading-relaxed">{note.body}</p>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {note.profiles?.full_name ?? 'Tutor'}
                        {note.sessions && ` · ${formatDateShort(note.sessions.scheduled_at)}`}
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Info</h3>
            <div className="space-y-4">

              {/* Kontak */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Kontak</p>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-gray-400 shrink-0">Email</span>
                    <span className="text-sm text-gray-700 text-right break-all">{profile.email ?? '—'}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-400 shrink-0">HP</span>
                      <span className="text-sm text-gray-700">{profile.phone}</span>
                    </div>
                  )}
                  {profile.parent_name && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-400 shrink-0">Ortu</span>
                      <span className="text-sm text-gray-700">{profile.parent_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ringkasan */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ringkasan</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Kelas aktif</span>
                    <span className="text-sm font-semibold text-gray-800">{enrolledClasses.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total sesi</span>
                    <span className="text-sm font-semibold text-gray-800">{completedSessions.length}</span>
                  </div>
                  {hadirPct !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Kehadiran</span>
                      <span className={`text-sm font-semibold ${hadirPct >= 80 ? 'text-green-600' : hadirPct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {hadirPct}%
                      </span>
                    </div>
                  )}
                  {unpaidTotal > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Belum bayar</span>
                      <span className={`text-sm font-semibold ${overdueInvoices.length > 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {formatCurrency(unpaidTotal)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Akun */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Akun</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Bergabung</span>
                  <span className="text-sm text-gray-700">
                    {new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-gray-300 break-all mt-3 leading-relaxed">{studentId}</p>
              </div>
            </div>
          </div>

          {/* Aksi */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Aksi</h2>
            <div className="space-y-2">
              <Link
                href={`/admin/invoices/new?student_id=${studentId}`}
                className="flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Buat Tagihan
              </Link>
              <Link
                href={`/admin/sessions/new?studentId=${studentId}`}
                className="flex items-center justify-center w-full px-4 py-2.5 border border-slate-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                + Jadwalkan Sesi
              </Link>
              <StudentStatusButton
                userId={studentId}
                isActive={profile.is_active ?? true}
                studentName={profile.full_name ?? 'Siswa'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
