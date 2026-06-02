import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { evaluateStudentCritical } from '@/lib/studentCritical'
import CriticalDetailCard from '@/components/siswa/CriticalDetailCard'
import UnenrollButton from '@/components/siswa/UnenrollButton'

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
}

type EnrolledClass = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  tutor: { full_name: string } | null
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

type Tab = 'ringkasan' | 'sesi' | 'nilai' | 'tagihan' | 'catatan'

const TABS: { key: Tab; label: string }[] = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'sesi',      label: 'Sesi' },
  { key: 'nilai',     label: 'Nilai' },
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

const STATUS_SESSION: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Terjadwal', cls: 'bg-blue-100 text-blue-700' },
  completed:  { label: 'Selesai',    cls: 'bg-green-100 text-green-700' },
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
  present: { label: 'Hadir',  cls: 'bg-green-100 text-green-700' },
  late:    { label: 'Terlambat', cls: 'bg-yellow-100 text-yellow-700' },
  absent:  { label: 'Absen', cls: 'bg-red-100 text-red-600' },
  excused: { label: 'Izin',  cls: 'bg-gray-100 text-gray-500' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

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
      .select('id, full_name, email, phone, level, grade, parent_name, created_at, avatar_url')
      .eq('id', id)
      .eq('role', 'student')
      .single()
    student = data as Profile | null
  } else {
    // Slug-based lookup — ambil semua siswa, cari yang namanya cocok
    const { data: all } = await admin
      .from('profiles')
      .select('id, full_name, email, phone, level, grade, parent_name, created_at, avatar_url')
      .eq('role', 'student')
    student = (all as Profile[] | null)?.find(s => toSlug(s.full_name ?? '') === id) ?? null
  }

  if (!student) notFound()
  const profile = student
  const studentId = profile.id
  // Slug untuk URL yang tampil di browser — pakai nama jika ada, fallback ke UUID
  const urlSlug = toSlug(profile.full_name ?? '') || studentId

  // Semua enrollment — aktif maupun historis
  type RawEnroll = {
    is_active: boolean
    classes: { id: string; name: string; level: string | null; is_active: boolean; profiles: { full_name: string } | null } | null
  }

  const allEnrollResult = await (admin
    .from('class_students')
    .select('is_active, classes(id, name, level, is_active, profiles!tutor_id(full_name))')
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
    }
  }

  const enrolledClasses: EnrolledClass[] = allEnrollRaw
    .filter(e => e.is_active)
    .map(toClass)
    .filter((c): c is EnrolledClass => c !== null)

  const historicalClasses: EnrolledClass[] = allEnrollRaw
    .filter(e => !e.is_active)
    .map(toClass)
    .filter((c): c is EnrolledClass => c !== null)

  // All class IDs ever (for sessions / assessments)
  const allClassIds = allEnrollRaw.map(e => e.classes?.id).filter((cid): cid is string => !!cid)
  const activeClassIds = enrolledClasses.map(c => c.id)

  // Parallel data fetches
  const [sessionsRes, attendancesRes, invoicesRes, notesRes] = await Promise.all([
    allClassIds.length > 0
      ? admin
          .from('sessions')
          .select('id, class_id, scheduled_at, topic, status')
          .in('class_id', allClassIds)
          .lte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: false })
          .limit(100) as unknown as Promise<{ data: SessionRow[] | null }>
      : Promise.resolve({ data: [] as SessionRow[] }),

    admin
      .from('attendances')
      .select('session_id, status')
      .eq('student_id', studentId) as unknown as Promise<{ data: AttendanceRow[] | null }>,

    admin
      .from('invoices')
      .select('id, invoice_number, total_due, status, due_date, issued_at, notes')
      .eq('student_id', studentId)
      .order('issued_at', { ascending: false })
      .limit(24) as unknown as Promise<{ data: InvoiceRow[] | null }>,

    admin
      .from('performance_notes')
      .select('id, body, created_at, session_id, sessions(scheduled_at, topic, class_id), profiles!tutor_id(full_name)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(30) as unknown as Promise<{ data: NoteRow[] | null }>,
  ])

  const sessions: SessionRow[] = sessionsRes.data ?? []
  const attendances: AttendanceRow[] = attendancesRes.data ?? []
  const invoices: InvoiceRow[] = invoicesRes.data ?? []
  const notes: NoteRow[] = notesRes.data ?? []

  // Fetch assessments via session IDs (sequential — depends on sessions result)
  const sessionIds = sessions.map(s => s.id)
  let assessments: AssessmentRow[] = []
  let assessmentResults: AssessmentResultRow[] = []

  if (sessionIds.length > 0) {
    const assessRes = await admin
      .from('assessments')
      .select('id, title, max_score, session_id, sessions(scheduled_at, topic, class_id)')
      .in('session_id', sessionIds) as unknown as { data: AssessmentRow[] | null }
    assessments = assessRes.data ?? []

    if (assessments.length > 0) {
      const aIds = assessments.map(a => a.id)
      const resRes = await admin
        .from('assessment_results')
        .select('assessment_id, score, feedback')
        .eq('student_id', studentId)
        .in('assessment_id', aIds) as unknown as { data: AssessmentResultRow[] | null }
      assessmentResults = resRes.data ?? []
    }
  }

  // Fetch next scheduled session for critical evaluation
  let nextScheduledSessionDate: Date | null = null
  if (activeClassIds.length > 0) {
    const { data: upcomingData } = await admin
      .from('sessions')
      .select('scheduled_at')
      .in('class_id', activeClassIds)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
    if (upcomingData?.[0]) nextScheduledSessionDate = new Date(upcomingData[0].scheduled_at)
  }

  // Build lookup maps
  const attendanceMap = new Map<string, string>()
  for (const a of attendances) attendanceMap.set(a.session_id, a.status)

  const classNameMap = new Map<string, string>()
  for (const c of enrolledClasses) classNameMap.set(c.id, c.name)

  const resultMap = new Map<string, AssessmentResultRow>()
  for (const r of assessmentResults) resultMap.set(r.assessment_id, r)

  // Computed stats
  const today = new Date().toISOString().slice(0, 10)
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const hadirCount = completedSessions.filter(s => {
    const st = attendanceMap.get(s.id)
    return st === 'present' || st === 'late'
  }).length
  const hadirPct = completedSessions.length > 0 ? Math.round((hadirCount / completedSessions.length) * 100) : null
  const overdueInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.due_date && inv.due_date < today)
  const unpaidTotal = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((s, i) => s + i.total_due, 0)

  // Critical student evaluation
  const now2 = new Date()
  const startOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1)
  const sessionsThisMonth = completedSessions.filter(s => new Date(s.scheduled_at) >= startOfMonth)
  const hadirThisMonth = sessionsThisMonth.filter(s => {
    const st = attendanceMap.get(s.id)
    return st === 'present' || st === 'late'
  }).length
  const attendanceRateThisMonth = sessionsThisMonth.length >= 4
    ? Math.round((hadirThisMonth / sessionsThisMonth.length) * 100)
    : null

  // Sort assessments by session date descending to get score history
  const sortedAssessmentScores = assessments
    .filter(a => resultMap.get(a.id)?.score != null)
    .sort((a, b) => {
      const da = a.sessions?.scheduled_at ?? ''
      const db = b.sessions?.scheduled_at ?? ''
      return db.localeCompare(da)
    })
    .map(a => resultMap.get(a.id)!.score as number)

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
    maxOverdueDays: overdueInvoices.length > 0
      ? Math.max(...overdueInvoices.map(inv => daysBetween(new Date(inv.due_date!), now2)))
      : 0,
    totalOutstanding: unpaidTotal,
    monthlyBaseRate: 500_000,
  }

  const criticalResult = evaluateStudentCritical(criticalInput)

  const tabUrl = (t: Tab) => `/admin/siswa/${urlSlug}?tab=${t}`

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/siswa" className="hover:text-blue-600 transition-colors">Siswa</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{profile.full_name ?? '(tanpa nama)'}</span>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-lg font-semibold text-blue-700">{getInitials(profile.full_name)}</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{profile.full_name ?? '(tanpa nama)'}</h1>
              <p className="text-sm text-gray-500">{profile.email ?? '—'}</p>
              {profile.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin/sessions/new?studentId=${studentId}`}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              + Sesi
            </Link>
            <Link
              href={`/admin/invoices/new?student_id=${studentId}`}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Tagihan
            </Link>
            <Link
              href={`/admin/users/${studentId}/edit`}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Jenjang</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{profile.level ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kelas / Grade</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{profile.grade ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nama Ortu</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{profile.parent_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bergabung</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(profile.created_at)}</p>
          </div>
        </div>

        {/* Stats chips */}
        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-xs text-gray-600 font-medium border border-slate-200">
            {enrolledClasses.length} kelas aktif
          </span>
          {hadirPct !== null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-xs text-gray-600 font-medium border border-slate-200">
              Kehadiran {hadirPct}%
              <span className="text-gray-400">({hadirCount}/{completedSessions.length})</span>
            </span>
          )}
          {overdueInvoices.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full text-xs text-red-700 font-medium border border-red-200">
              {overdueInvoices.length} tagihan overdue
            </span>
          )}
          {unpaidTotal > 0 && overdueInvoices.length === 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 rounded-full text-xs text-yellow-700 font-medium border border-yellow-200">
              Belum dibayar {formatCurrency(unpaidTotal)}
            </span>
          )}
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
        {TABS.map(t => (
          <Link
            key={t.key}
            href={tabUrl(t.key)}
            className={`flex-1 text-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Tab: Ringkasan ─────────────────────────────────────────────────── */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-4">
        <CriticalDetailCard result={criticalResult} input={criticalInput} />
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Kelas Aktif ({enrolledClasses.length})
          </h2>
          {enrolledClasses.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Tidak ada kelas aktif saat ini.</p>
          ) : (
            <div className="space-y-2">
              {enrolledClasses.map(cls => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3"
                >
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
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Riwayat kelas non-aktif */}
          {historicalClasses.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Riwayat Kelas ({historicalClasses.length})
              </h3>
              <div className="space-y-1.5">
                {historicalClasses.map(cls => (
                  <Link
                    key={cls.id}
                    href={`/admin/classes/${cls.id}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-gray-500">{cls.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {cls.tutor ? cls.tutor.full_name : 'Belum ada tutor'}
                        {cls.level && ` · ${cls.level}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 ml-3">
                      Non-aktif
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* ── Tab: Sesi ──────────────────────────────────────────────────────── */}
      {activeTab === 'sesi' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Riwayat Sesi ({sessions.length})
            </h2>
          </div>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Belum ada sesi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Topik</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Kelas</th>
                    <th className="px-4 py-3 text-left">Kehadiran</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map(s => {
                    const attendance = attendanceMap.get(s.id)
                    const sessionSt = STATUS_SESSION[s.status] ?? { label: s.status, cls: 'bg-gray-100 text-gray-500' }
                    const attendanceSt = attendance ? (ATTENDANCE_STATUS[attendance] ?? { label: attendance, cls: 'bg-gray-100 text-gray-500' }) : null
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{formatDateShort(s.scheduled_at)}</td>
                        <td className="px-4 py-3 text-gray-600 hidden sm:table-cell max-w-[200px] truncate">{s.topic ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{classNameMap.get(s.class_id) ?? '—'}</td>
                        <td className="px-4 py-3">
                          {attendanceSt ? (
                            <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${attendanceSt.cls}`}>{attendanceSt.label}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${sessionSt.cls}`}>{sessionSt.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/sessions/${s.id}`}>
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
        </div>
      )}

      {/* ── Tab: Nilai ─────────────────────────────────────────────────────── */}
      {activeTab === 'nilai' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Hasil Asesmen ({assessments.length})
            </h2>
          </div>
          {assessments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Belum ada asesmen.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Asesmen</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Tanggal</th>
                    <th className="px-4 py-3 text-right">Nilai</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Catatan Tutor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assessments.map(a => {
                    const result = resultMap.get(a.id)
                    const pct = result?.score != null ? Math.round((result.score / a.max_score) * 100) : null
                    const scoreCls = pct == null ? 'text-gray-400' : pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{a.title}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                          {a.sessions ? formatDateShort(a.sessions.scheduled_at) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {result?.score != null ? (
                            <span className={`font-semibold ${scoreCls}`}>
                              {result.score}/{a.max_score}
                              <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">Belum dinilai</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell max-w-[240px] truncate">
                          {result?.feedback ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Tagihan ───────────────────────────────────────────────────── */}
      {activeTab === 'tagihan' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Tagihan ({invoices.length})
            </h2>
            <Link
              href={`/admin/invoices/new?student_id=${studentId}`}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              + Buat tagihan
            </Link>
          </div>
          {invoices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Belum ada tagihan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                    const invSt = isOverdue
                      ? { label: 'Overdue', cls: 'bg-red-100 text-red-600' }
                      : (STATUS_INVOICE[inv.status] ?? { label: inv.status, cls: 'bg-gray-100 text-gray-500' })
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
        </div>
      )}

      {/* ── Tab: Catatan ───────────────────────────────────────────────────── */}
      {activeTab === 'catatan' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            Catatan Performa ({notes.length})
          </h2>
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada catatan performa.</p>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-800 leading-relaxed">{note.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {note.profiles?.full_name ?? 'Tutor'}
                    {note.sessions && ` · ${formatDateShort(note.sessions.scheduled_at)}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
