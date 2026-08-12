import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { coversSession } from '@/lib/enrollment'
import { evaluateStudentCritical } from '@/lib/studentCritical'
import CriticalDetailCard from '@/components/siswa/CriticalDetailCard'
import UnenrollButton from '@/components/siswa/UnenrollButton'
import StudentStatusButton from '@/components/admin/siswa/StudentStatusButton'
import DeleteStudentButton from '@/components/admin/siswa/DeleteStudentButton'
import JadwalTable from '@/components/admin/siswa/JadwalTable'
import ProfileAccordion from '@/components/admin/siswa/ProfileAccordion'
import PerformaTabs, { type SubjectStats } from '@/components/admin/siswa/PerformaTabs'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  full_name: string | null
  nickname: string | null
  email: string | null
  phone: string | null
  level: string | null
  grade: string | null
  birth_date: string | null
  parent_name: string | null
  parent_phone: string | null
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
  subject_names: string[]
  enrolled_at: string | null
}

type SessionRow = {
  id: string
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
  subject_id: string | null
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
  category: string
  body: string
  created_at: string
  session_id: string
  sessions: { scheduled_at: string; topic: string | null; class_id: string } | null
  profiles: { full_name: string } | null
}

type Tab = 'jadwal' | 'tagihan' | 'catatan'

const TABS: { key: Tab; label: string }[] = [
  { key: 'jadwal',    label: 'Kelas' },
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
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const STATUS_SESSION: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Terjadwal',  cls: 'bg-blue-50 text-blue-500' },
  completed:  { label: 'Selesai',   cls: 'bg-green-50 text-green-600' },
  cancelled:  { label: 'Dibatalkan', cls: 'bg-red-50 text-red-400' },
}

const STATUS_INVOICE: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Draft',      cls: 'bg-gray-100 text-gray-400' },
  sent:      { label: 'Terkirim',   cls: 'bg-blue-50 text-blue-500' },
  paid:      { label: 'Lunas',      cls: 'bg-green-50 text-green-600' },
  overdue:   { label: 'Overdue',    cls: 'bg-red-50 text-red-500' },
  cancelled: { label: 'Dibatalkan', cls: 'bg-gray-100 text-gray-400' },
}

const ATTENDANCE_STATUS: Record<string, { label: string; cls: string }> = {
  present: { label: 'Hadir',      cls: 'bg-green-50 text-green-600' },
  late:    { label: 'Terlambat',  cls: 'bg-yellow-50 text-yellow-600' },
  absent:  { label: 'Absen',      cls: 'bg-red-50 text-red-400' },
  excused: { label: 'Izin',       cls: 'bg-gray-100 text-gray-400' },
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
  const activeTab: Tab = (TABS.some(t => t.key === rawTab) ? rawTab : 'jadwal') as Tab

  const admin = createAdminClient()

  let student: Profile | null = null

  if (isUUID(id)) {
    const { data } = await admin
      .from('profiles')
      .select('id, full_name, nickname, email, phone, level, grade, birth_date, parent_name, parent_phone, created_at, avatar_url, is_active')
      .eq('id', id)
      .eq('role', 'student')
      .single()
    student = data as Profile | null
  } else {
    const { data: all } = await admin
      .from('profiles')
      .select('id, full_name, nickname, email, phone, level, grade, birth_date, parent_name, parent_phone, created_at, avatar_url, is_active')
      .eq('role', 'student')
    student = (all as Profile[] | null)?.find(s => toSlug(s.full_name ?? '') === id) ?? null
  }

  if (!student) notFound()
  const profile = student
  const studentId = profile.id
  const urlSlug = toSlug(profile.full_name ?? '') || studentId

  type RawEnroll = {
    is_active: boolean
    enrolled_at: string | null
    unenrolled_at: string | null
    classes: {
      id: string
      name: string
      level: string | null
      is_active: boolean
      schedule_days: number[] | null
      schedule_time: string | null
      profiles: { full_name: string } | null
    } | null
  }

  const allEnrollResult = await (admin
    .from('class_students')
    .select('is_active, enrolled_at, unenrolled_at, classes(id, name, level, is_active, schedule_days, schedule_time, profiles!tutor_id(full_name))')
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
      subject_names: [],
      enrolled_at: e.enrolled_at ?? null,
    }
  }

  const enrolledClasses: EnrolledClass[] = allEnrollRaw.filter(e => e.is_active).map(toClass).filter((c): c is EnrolledClass => c !== null)
  const historicalClasses: EnrolledClass[] = allEnrollRaw.filter(e => !e.is_active).map(toClass).filter((c): c is EnrolledClass => c !== null)

  const allClassIds = allEnrollRaw.map(e => e.classes?.id).filter((cid): cid is string => !!cid)
  const activeClassIds = enrolledClasses.map(c => c.id)

  // Rentang keanggotaan per kelas, dipakai membuang sesi di luar masa siswa
  // ikut kelas itu — siswa yang baru masuk Agustus tidak boleh melihat jadwal
  // Juli kelasnya di tab Kelas, ikut terhitung di statistik, atau muncul di
  // riwayat nilainya.
  const windowByClass = new Map(
    allEnrollRaw.filter(e => e.classes).map(e => [e.classes!.id, e] as const),
  )
  const inWindow = (s: { class_id: string; scheduled_at: string }) => {
    const window = windowByClass.get(s.class_id)
    return window ? coversSession(window, s.scheduled_at) : false
  }

  // Fetch class subjects via two explicit queries (avoids FK join ambiguity in PostgREST)
  if (allClassIds.length > 0) {
    const { data: csRows } = await admin
      .from('class_subjects')
      .select('class_id, subject_id')
      .in('class_id', allClassIds) as unknown as { data: { class_id: string; subject_id: string }[] | null }

    const subjIdsForClasses = [...new Set((csRows ?? []).map(r => r.subject_id))]
    const subjNameMapForClasses = new Map<string, string>()
    if (subjIdsForClasses.length > 0) {
      const { data: subjRows } = await admin
        .from('subjects')
        .select('id, name')
        .in('id', subjIdsForClasses) as unknown as { data: { id: string; name: string }[] | null }
      for (const r of subjRows ?? []) subjNameMapForClasses.set(r.id, r.name)
    }

    const csMap = new Map<string, string[]>()
    for (const row of csRows ?? []) {
      const name = subjNameMapForClasses.get(row.subject_id)
      if (name) {
        const arr = csMap.get(row.class_id) ?? []
        arr.push(name)
        csMap.set(row.class_id, arr)
      }
    }
    for (const cls of [...enrolledClasses, ...historicalClasses]) {
      cls.subject_names = csMap.get(cls.id) ?? []
    }
  }

  const [sessionsRes, attendancesRes, invoicesRes, notesRes] = await Promise.all([
    allClassIds.length > 0
      ? admin.from('sessions').select('id, class_id, scheduled_at, topic, status, subject_id').in('class_id', allClassIds).eq('status', 'completed').order('scheduled_at', { ascending: false }).limit(200) as unknown as Promise<{ data: SessionRow[] | null }>
      : Promise.resolve({ data: [] as SessionRow[] }),
    admin.from('attendances').select('session_id, status').eq('student_id', studentId) as unknown as Promise<{ data: AttendanceRow[] | null }>,
    admin.from('invoices').select('id, invoice_number, total_due, status, due_date, issued_at, notes').eq('student_id', studentId).order('issued_at', { ascending: false }).limit(24) as unknown as Promise<{ data: InvoiceRow[] | null }>,
    admin.from('performance_notes').select('id, category, body, created_at, session_id, sessions(scheduled_at, topic, class_id), profiles!tutor_id(full_name)').eq('student_id', studentId).order('created_at', { ascending: false }).limit(30) as unknown as Promise<{ data: NoteRow[] | null }>,
  ])

  const sessions: SessionRow[] = (sessionsRes.data ?? []).filter(inWindow)
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

  type UpcomingSession = { id: string; class_id: string; scheduled_at: string; topic: string | null; status: string; subject_id: string | null; profiles: { full_name: string } | null }

  let upcomingSessions: UpcomingSession[] = []
  let nextScheduledSessionDate: Date | null = null

  if (activeClassIds.length > 0) {
    const nowIso = new Date().toISOString()
    const { data: allSessionsData } = await admin
      .from('sessions')
      .select('id, class_id, scheduled_at, topic, status, subject_id, profiles!tutor_id(full_name)')
      .in('class_id', activeClassIds)
      .order('scheduled_at', { ascending: false }) as unknown as { data: UpcomingSession[] | null }
    upcomingSessions = (allSessionsData ?? []).filter(inWindow)
    const firstUpcoming = upcomingSessions.find(s => s.status === 'scheduled' && s.scheduled_at >= nowIso)
    if (firstUpcoming) nextScheduledSessionDate = new Date(firstUpcoming.scheduled_at)
  }

  const sessionSubjectIds = [...new Set([
    ...sessions.map(s => s.subject_id),
    ...upcomingSessions.map(s => s.subject_id),
  ].filter((id): id is string => !!id))]
  const subjectNameMap = new Map<string, string>()
  if (sessionSubjectIds.length > 0) {
    const { data: subjectRows } = await admin
      .from('subjects')
      .select('id, name')
      .in('id', sessionSubjectIds) as unknown as { data: { id: string; name: string }[] | null }
    for (const s of subjectRows ?? []) subjectNameMap.set(s.id, s.name)
  }

  // Patch enrolled + historical classes: fill missing subject_name from session-level subject_id
  const classSubjectFromSessionsMap = new Map<string, string>()
  for (const s of [...sessions, ...upcomingSessions]) {
    if (!classSubjectFromSessionsMap.has(s.class_id) && s.subject_id) {
      const name = subjectNameMap.get(s.subject_id)
      if (name) classSubjectFromSessionsMap.set(s.class_id, name)
    }
  }
  for (const cls of [...enrolledClasses, ...historicalClasses]) {
    if (cls.subject_names.length === 0) {
      const name = classSubjectFromSessionsMap.get(cls.id)
      if (name) cls.subject_names = [name]
    }
  }

  // Build session-level tutor map (session_id → first name)
  const sessionTutorMap: Record<string, string> = {}
  for (const s of upcomingSessions) {
    if (s.profiles?.full_name) {
      sessionTutorMap[s.id] = s.profiles.full_name
    }
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
    for (const s of (histData ?? []).filter(inWindow)) {
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

  const sessionComprehensionMap: Record<string, string> = {}
  for (const a of assessments) {
    const result = resultMap.get(a.id)
    if (result?.feedback && /^L[0-5]$/.test(result.feedback ?? '') && a.session_id) {
      sessionComprehensionMap[a.session_id] = result.feedback
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const hadirCount = completedSessions.filter(s => { const st = attendanceMap.get(s.id); return st === 'present' || st === 'late' }).length
  const hadirPct = completedSessions.length > 0 ? Math.round((hadirCount / completedSessions.length) * 100) : null
  const overdueInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.due_date && inv.due_date < today)
  const unpaidTotal = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((s, i) => s + i.total_due, 0)
  const paidTotal = invoices.filter(inv => inv.status === 'paid').reduce((s, i) => s + i.total_due, 0)

  const now2 = new Date()
  const startOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1)
  const sessionsThisMonth = completedSessions.filter(s => new Date(s.scheduled_at) >= startOfMonth)
  const hadirThisMonth = sessionsThisMonth.filter(s => { const st = attendanceMap.get(s.id); return st === 'present' || st === 'late' }).length
  const attendanceRateThisMonth = sessionsThisMonth.length >= 4 ? Math.round((hadirThisMonth / sessionsThisMonth.length) * 100) : null

  const sortedAssessmentScores = assessments.filter(a => resultMap.get(a.id)?.score != null).sort((a, b) => (b.sessions?.scheduled_at ?? '').localeCompare(a.sessions?.scheduled_at ?? '')).map(a => resultMap.get(a.id)!.score as number)

  const comprehensionLevels = assessmentResults.map(r => r.feedback).filter((f): f is string => /^L[0-5]$/.test(f ?? ''))
  const avgComprehensionLevel = comprehensionLevels.length > 0
    ? `L${Math.round(comprehensionLevels.reduce((sum, l) => sum + parseInt(l[1]), 0) / comprehensionLevels.length)}`
    : null

  const classAllSubjectsMap = new Map<string, string[]>()
  for (const c of [...enrolledClasses, ...historicalClasses]) {
    if (c.subject_names.length > 0) classAllSubjectsMap.set(c.id, c.subject_names)
  }

  const sessionsBySubject = new Map<string, SessionRow[]>()
  for (const s of completedSessions) {
    const subj =
      (s.subject_id && subjectNameMap.get(s.subject_id)) ||
      classAllSubjectsMap.get(s.class_id)?.[0] ||
      'Lainnya'
    if (!sessionsBySubject.has(subj)) sessionsBySubject.set(subj, [])
    sessionsBySubject.get(subj)!.push(s)
  }

  const subjectStats: SubjectStats[] = Array.from(sessionsBySubject.entries()).map(([subject, subSessions]) => {
    const hadir = subSessions.filter(s => { const st = attendanceMap.get(s.id); return st === 'present' || st === 'late' }).length
    const subSessionIds = new Set(subSessions.map(s => s.id))
    const subLevels = assessments
      .filter(a => subSessionIds.has(a.session_id))
      .map(a => resultMap.get(a.id)?.feedback)
      .filter((f): f is string => /^L[0-5]$/.test(f ?? ''))
    return {
      subject,
      totalSessions: subSessions.length,
      attendanceRate: subSessions.length > 0 ? Math.round((hadir / subSessions.length) * 100) : null,
      avgComprehension: subLevels.length > 0
        ? `L${Math.round(subLevels.reduce((sum, l) => sum + parseInt(l[1]), 0) / subLevels.length)}`
        : null,
    }
  })

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
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.full_name ?? ''} width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-semibold text-blue-700">{getInitials(profile.full_name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-semibold text-gray-900">{profile.full_name ?? '(tanpa nama)'}</h1>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${profile.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {profile.is_active ? 'Aktif' : 'Non-aktif'}
                  </span>
                </div>
                {(profile.nickname || profile.grade) && (
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {profile.nickname && (
                      <span className="text-sm text-gray-500">{profile.nickname}</span>
                    )}
                    {profile.grade && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        Kelas {profile.grade}
                      </span>
                    )}
                  </div>
                )}
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
                    enrolledClasses={enrolledClasses.map(c => ({ id: c.id, name: c.name, is_active: c.is_active, subject_name: c.subject_names[0] ?? null, tutor: c.tutor }))}
                    subjectNameMap={Object.fromEntries(subjectNameMap)}
                    attendanceMap={Object.fromEntries(attendanceMap)}
                    sessionTutorMap={sessionTutorMap}
                    sessionComprehensionMap={sessionComprehensionMap}
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
                                    {cls.subject_names.length > 0 && <p className="text-xs text-gray-400">{cls.subject_names.join(', ')}</p>}
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


                {/* Catatan performa */}
                {notes.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Catatan Performa ({notes.length})
                    </p>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                      {notes.map(note => (
                        <div key={note.id} className="px-4 py-4">
                          {note.category !== '_' && (
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{note.category}</p>
                          )}
                          <p className="text-sm text-gray-800 leading-relaxed">{note.body}</p>
                          <p className="text-xs text-gray-400 mt-1.5">
                            {note.profiles?.full_name ?? 'Tutor'}
                            {note.sessions && ` · ${formatDateShort(note.sessions.scheduled_at)}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <div className="space-y-4">

              {/* Profil + Orang Tua (accordion) */}
              <ProfileAccordion>
                <div className="space-y-2">
                  {profile.level && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500 shrink-0">Level</span>
                      <span className="text-sm text-gray-700">{profile.level}</span>
                    </div>
                  )}
                  {profile.grade && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500 shrink-0">Kelas</span>
                      <span className="text-sm text-gray-700">{profile.grade}</span>
                    </div>
                  )}
                  {profile.birth_date && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500 shrink-0">Tgl Lahir</span>
                      <span className="text-sm text-gray-700">{formatDate(profile.birth_date)}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-gray-500 shrink-0">Email</span>
                    <span className="text-sm text-gray-700 text-right break-all">{profile.email ?? '—'}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500 shrink-0">HP</span>
                      <span className="text-sm text-gray-700">{profile.phone}</span>
                    </div>
                  )}
                </div>

                {(profile.parent_name || profile.parent_phone) && (
                  <div className="border-t border-slate-100 mt-3 pt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Orang Tua</p>
                    <div className="space-y-2">
                      {profile.parent_name && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500 shrink-0">Nama</span>
                          <span className="text-sm text-gray-700 text-right">{profile.parent_name}</span>
                        </div>
                      )}
                      {profile.parent_phone && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500 shrink-0">HP</span>
                          <span className="text-sm text-gray-700">{profile.parent_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </ProfileAccordion>

              {/* Kelas Aktif */}
              {enrolledClasses.filter(c => c.is_active).length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Kelas Aktif</p>
                  <div className="space-y-3">
                    {enrolledClasses.filter(c => c.is_active).map(cls => (
                      <Link key={cls.id} href={`/admin/classes/${cls.id}`} className="block hover:opacity-80 transition-opacity">
                        <p className="text-sm font-medium text-gray-700">{cls.name}</p>
                        {(() => {
                          const rows = Math.max(cls.schedule_days.length, cls.subject_names.length, 1)
                          return (
                            <div className="mt-2 space-y-0.5">
                              {Array.from({ length: rows }, (_, i) => {
                                const day = cls.schedule_days[i]
                                const subj = cls.subject_names[i]
                                return (
                                  <div key={i} className="flex items-center justify-between gap-2">
                                    <span className="text-sm text-gray-500">
                                      {day !== undefined ? DAYS_SHORT[day] : '—'}
                                      {cls.schedule_time && `, ${cls.schedule_time.slice(0, 5)}`}
                                    </span>
                                    {subj && (
                                      <span className="text-sm font-medium text-gray-700 shrink-0">{subj}</span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Performa */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Performa</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total sesi</span>
                    <span className="text-sm font-semibold text-gray-800">{completedSessions.length}</span>
                  </div>
                  {hadirPct !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Kehadiran</span>
                      <span className="text-sm font-semibold text-gray-800">{hadirPct}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pembayaran */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pembayaran</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Sudah bayar</span>
                    <span className="text-sm font-semibold text-gray-800">{formatCurrency(paidTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Belum bayar</span>
                    <span className={`text-sm font-semibold ${unpaidTotal > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {formatCurrency(unpaidTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Akun */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Akun</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Bergabung</span>
                    <span className="text-sm text-gray-700">
                      {new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Masa bergabung</span>
                    <span className="text-sm text-gray-700">
                      {(() => {
                        const months = (now2.getFullYear() - enrolledAt.getFullYear()) * 12 + (now2.getMonth() - enrolledAt.getMonth())
                        return months <= 0 ? '< 1 bulan' : `${months} bulan`
                      })()}
                    </span>
                  </div>
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
              <Link
                href={`/admin/laporan-bulanan?student_id=${studentId}`}
                className="flex items-center justify-center w-full px-4 py-2.5 border border-slate-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Laporan Bulanan
              </Link>
              <StudentStatusButton
                userId={studentId}
                isActive={profile.is_active ?? true}
                studentName={profile.full_name ?? 'Siswa'}
              />
              {/* Dipisah garis supaya tidak tertekan saat yang dimaksud
                  sebenarnya "nonaktifkan" — yang ini tidak bisa dibatalkan. */}
              <div className="pt-2 mt-2 border-t border-slate-100">
                <DeleteStudentButton
                  userId={studentId}
                  studentName={profile.full_name ?? 'Siswa'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
