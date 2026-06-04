import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import PasswordResetButton from '@/components/admin/users/PasswordResetButton'
import UserAvatarUpload from '@/components/admin/users/UserAvatarUpload'
import { getWorkloadLevel, WORKLOAD_CONFIG } from '@/lib/tutorWorkload'
import TutorStatusButton from '@/components/admin/users/TutorStatusButton'

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  tutor: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
  parent: 'bg-yellow-100 text-yellow-700',
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  tutor: 'Tutor',
  student: 'Siswa',
  parent: 'Orang Tua',
}

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function formatSchedule(days: number[], time: string | null): string | null {
  if (days.length === 0 && !time) return null
  const daysStr = days.length > 0 ? days.map(d => DAYS_ID[d] ?? '?').join(', ') : null
  const timeStr = time ? time.slice(0, 5) : null
  if (daysStr && timeStr) return `${daysStr} · ${timeStr}`
  return daysStr ?? timeStr
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function formatMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

type ClassRow = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  schedule_days?: number[]
  schedule_time?: string | null
  class_subjects?: { subjects: { name: string } | null }[]
}

type SessionRow = {
  id: string
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
}

type TutorSessionRow = {
  id: string
  class_id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  topic: string | null
  location: string | null
  selected_cp_ids: string[]
}

type AttendanceRow = {
  session_id: string
  status: string
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

type PerformanceNoteRow = {
  id: string
  body: string
  created_at: string
  session_id: string
  sessions: { scheduled_at: string; topic: string | null; class_id: string } | null
  profiles: { full_name: string } | null
}

type TutorSubjectRow = {
  level: string
  subjects: { id: string; name: string } | null
}

type PayslipRow = {
  id: string
  month: string
  grand_total: number
  status: string
}

type AvailabilityRow = {
  day_of_week: number
  start_time: string
  end_time: string
}

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { userId } = await params
  const { tab = 'jadwal' } = await searchParams
  const admin = createAdminClient()

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: user } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, role, level, grade, parent_name, created_at, avatar_url, is_active')
    .eq('id', userId)
    .single()

  if (!user) notFound()

  if (user.role === 'student') redirect(`/admin/siswa/${userId}`)

  // ─── Tutor data ─────────────────────────────────────────────────────────────
  let taughtClasses: ClassRow[] = []
  let tutorSubjects: TutorSubjectRow[] = []
  let tutorPayslips: PayslipRow[] = []
  let tutorAvailability: AvailabilityRow[] = []
  let tutorRecentSessions: TutorSessionRow[] = []
  let recentAttendanceCounts: Map<string, number> = new Map()
  let recentNotesCountMap: Map<string, number> = new Map()
  let recentAssessmentCountMap: Map<string, number> = new Map()
  let recentMaterialsCountMap: Map<string, number> = new Map()
  let historicalSessionStats: Map<string, { count: number; firstDate: string; lastDate: string }> = new Map()
  let classStudentCountMap: Map<string, number> = new Map()
  let classMonthSessionMap: Map<string, number> = new Map()

  if (user.role === 'tutor') {
    const [classesRes, subjectsRes, payslipsRes, availabilityRes] = await Promise.all([
      admin
        .from('classes')
        .select('id, name, level, is_active, schedule_days, schedule_time, class_subjects(subjects(name))')
        .eq('tutor_id', userId)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false }) as unknown as Promise<{ data: ClassRow[] | null }>,
      admin
        .from('tutor_subjects')
        .select('level, subjects(id, name)')
        .eq('tutor_id', userId) as unknown as Promise<{ data: TutorSubjectRow[] | null }>,
      admin
        .from('payslips')
        .select('id, month, grand_total, status')
        .eq('tutor_id', userId)
        .order('month', { ascending: false }) as unknown as Promise<{ data: PayslipRow[] | null }>,
      admin
        .from('tutor_availability')
        .select('day_of_week, start_time, end_time')
        .eq('tutor_id', userId)
        .order('day_of_week') as unknown as Promise<{ data: AvailabilityRow[] | null }>,
    ])

    taughtClasses = classesRes.data ?? []
    tutorSubjects = subjectsRes.data ?? []
    tutorPayslips = payslipsRes.data ?? []
    tutorAvailability = availabilityRes.data ?? []

    const classIds = taughtClasses.map(c => c.id)

    if (classIds.length > 0) {
      const [csRes, monthSessionsRes, recentSessionsRes] = await Promise.all([
        admin
          .from('class_students')
          .select('class_id, student_id')
          .in('class_id', classIds)
          .eq('is_active', true) as unknown as Promise<{ data: { class_id: string; student_id: string }[] | null }>,
        admin
          .from('sessions')
          .select('class_id')
          .in('class_id', classIds)
          .eq('status', 'completed')
          .gte('scheduled_at', firstOfMonth) as unknown as Promise<{ data: { class_id: string }[] | null }>,
        admin
          .from('sessions')
          .select('id, class_id, scheduled_at, duration_minutes, status, topic, location, selected_cp_ids')
          .eq('tutor_id', userId)
          .eq('status', 'completed')
          .order('scheduled_at', { ascending: false })
          .limit(5) as unknown as Promise<{ data: TutorSessionRow[] | null }>,
      ])

      // Student count per class (deduplicated)
      const classStudentSets = new Map<string, Set<string>>()
      for (const cs of csRes.data ?? []) {
        if (!classStudentSets.has(cs.class_id)) classStudentSets.set(cs.class_id, new Set())
        classStudentSets.get(cs.class_id)!.add(cs.student_id)
      }
      classStudentCountMap = new Map([...classStudentSets.entries()].map(([id, s]) => [id, s.size]))

      // Sessions this month per class
      for (const s of monthSessionsRes.data ?? []) {
        classMonthSessionMap.set(s.class_id, (classMonthSessionMap.get(s.class_id) ?? 0) + 1)
      }

      tutorRecentSessions = recentSessionsRes.data ?? []

      // Checklist data for recent sessions
      if (tutorRecentSessions.length > 0) {
        const recentIds = tutorRecentSessions.map(s => s.id)
        const [attendancesRes, notesRes, assessmentsRes, materialsRes] = await Promise.all([
          admin.from('attendances').select('session_id').in('session_id', recentIds) as unknown as Promise<{ data: { session_id: string }[] | null }>,
          admin.from('performance_notes').select('session_id').in('session_id', recentIds) as unknown as Promise<{ data: { session_id: string }[] | null }>,
          admin.from('assessments').select('session_id').in('session_id', recentIds) as unknown as Promise<{ data: { session_id: string }[] | null }>,
          admin.from('materials').select('session_id').in('session_id', recentIds) as unknown as Promise<{ data: { session_id: string }[] | null }>,
        ])
        for (const a of attendancesRes.data ?? []) {
          recentAttendanceCounts.set(a.session_id, (recentAttendanceCounts.get(a.session_id) ?? 0) + 1)
        }
        for (const n of notesRes.data ?? []) {
          recentNotesCountMap.set(n.session_id, (recentNotesCountMap.get(n.session_id) ?? 0) + 1)
        }
        for (const a of assessmentsRes.data ?? []) {
          recentAssessmentCountMap.set(a.session_id, (recentAssessmentCountMap.get(a.session_id) ?? 0) + 1)
        }
        for (const m of materialsRes.data ?? []) {
          recentMaterialsCountMap.set(m.session_id, (recentMaterialsCountMap.get(m.session_id) ?? 0) + 1)
        }
      }

      // Historical class session stats
      const inactiveClassIds = taughtClasses.filter(c => !c.is_active).map(c => c.id)
      if (inactiveClassIds.length > 0) {
        const { data: histSessions } = await admin
          .from('sessions')
          .select('class_id, scheduled_at')
          .in('class_id', inactiveClassIds)
          .eq('status', 'completed')
          .eq('tutor_id', userId) as unknown as { data: { class_id: string; scheduled_at: string }[] | null }
        for (const s of histSessions ?? []) {
          const existing = historicalSessionStats.get(s.class_id)
          if (!existing) {
            historicalSessionStats.set(s.class_id, { count: 1, firstDate: s.scheduled_at, lastDate: s.scheduled_at })
          } else {
            existing.count++
            if (s.scheduled_at < existing.firstDate) existing.firstDate = s.scheduled_at
            if (s.scheduled_at > existing.lastDate) existing.lastDate = s.scheduled_at
          }
        }
      }
    } else {
      // Fetch recent sessions even if no classes
      const { data } = await admin
        .from('sessions')
        .select('id, class_id, scheduled_at, duration_minutes, status')
        .eq('tutor_id', userId)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false })
        .limit(5) as unknown as { data: TutorSessionRow[] | null }
      tutorRecentSessions = data ?? []
    }
  }

  // ─── Student data ────────────────────────────────────────────────────────────
  let enrolledClasses: ClassRow[] = []
  let studentSessions: SessionRow[] = []
  let studentAttendances: AttendanceRow[] = []
  let studentAssessments: AssessmentRow[] = []
  let studentResults: AssessmentResultRow[] = []
  let studentNotes: PerformanceNoteRow[] = []

  if (user.role === 'student') {
    const { data } = await admin
      .from('class_students')
      .select('classes(id, name, level, is_active)')
      .eq('student_id', userId)
      .eq('is_active', true) as unknown as { data: { classes: ClassRow | null }[] | null }
    enrolledClasses = (data ?? []).map(e => e.classes).filter((c): c is ClassRow => c !== null)

    const classIds = enrolledClasses.map(c => c.id)

    if (classIds.length > 0) {
      const [attendancesRes, notesRes] = await Promise.all([
        admin
          .from('attendances')
          .select('session_id, status')
          .eq('student_id', userId) as unknown as Promise<{ data: AttendanceRow[] | null }>,
        admin
          .from('performance_notes')
          .select('id, body, created_at, session_id, sessions(scheduled_at, topic, class_id), profiles!tutor_id(full_name)')
          .eq('student_id', userId)
          .order('created_at', { ascending: false })
          .limit(10) as unknown as Promise<{ data: PerformanceNoteRow[] | null }>,
      ])

      studentAttendances = attendancesRes.data ?? []
      studentNotes = notesRes.data ?? []

      const now2 = new Date().toISOString()
      const sessionsRes = await admin
        .from('sessions')
        .select('id, class_id, scheduled_at, topic, status')
        .in('class_id', classIds)
        .lte('scheduled_at', now2)
        .order('scheduled_at', { ascending: false }) as unknown as { data: SessionRow[] | null }

      studentSessions = sessionsRes.data ?? []

      const sessionIds = studentSessions.map(s => s.id)
      if (sessionIds.length > 0) {
        studentAssessments = (
          await admin
            .from('assessments')
            .select('id, title, max_score, session_id, sessions(scheduled_at, topic, class_id)')
            .in('session_id', sessionIds) as unknown as { data: AssessmentRow[] | null }
        ).data ?? []

        if (studentAssessments.length > 0) {
          const assessmentIds = studentAssessments.map(a => a.id)
          const { data: resultsData } = await admin
            .from('assessment_results')
            .select('assessment_id, score, feedback')
            .eq('student_id', userId)
            .in('assessment_id', assessmentIds) as { data: AssessmentResultRow[] | null }
          studentResults = resultsData ?? []
        }
      }
    }
  }

  // ─── Computed tutor metrics ──────────────────────────────────────────────────
  const activeTaughtClasses = taughtClasses.filter(c => c.is_active)
  const totalActiveStudents = [...classStudentCountMap.entries()]
    .filter(([cid]) => activeTaughtClasses.find(c => c.id === cid))
    .reduce((s, [, n]) => s + n, 0)

  const sessionsThisMonth = [...classMonthSessionMap.values()].reduce((s, n) => s + n, 0)

  const workloadLevel = getWorkloadLevel(totalActiveStudents, user.is_active ?? true)
  const workloadCfg = WORKLOAD_CONFIG[workloadLevel]

  const joinedDaysAgo = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)
  const joinedMonths = Math.floor(joinedDaysAgo / 30.44)
  const joinedMonthsLabel = (() => {
    if (joinedMonths < 1) return '< 1 bulan'
    if (joinedMonths < 12) return `${joinedMonths} bulan`
    const y = Math.floor(joinedMonths / 12)
    const m = joinedMonths % 12
    return m === 0 ? `${y} tahun` : `${y} tahun ${m} bulan`
  })()

  // Subject → levels mapping
  const subjectLevelMap = new Map<string, string[]>()
  for (const ts of tutorSubjects) {
    const name = ts.subjects?.name
    if (!name) continue
    if (!subjectLevelMap.has(name)) subjectLevelMap.set(name, [])
    if (ts.level) subjectLevelMap.get(name)!.push(ts.level)
  }

  // Pendapatan
  const paidSlips = tutorPayslips.filter(p => p.status === 'sent' || p.status === 'paid')
  const totalPendapatan = paidSlips.reduce((s, p) => s + p.grand_total, 0)
  const avgPendapatanPerBulan = paidSlips.length > 0 ? Math.round(totalPendapatan / paidSlips.length) : 0

  // Availability day names
  const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

  // Class name & subject lookup for session history
  const classNameMap = new Map(taughtClasses.map(c => [c.id, c.name]))
  const classSubjectMap = new Map(taughtClasses.map(c => [c.id, c.class_subjects?.[0]?.subjects?.name ?? null]))

  const PAYSLIP_STATUS_LABEL: Record<string, string> = {
    draft: 'Draft',
    sent: 'Dikirim',
    paid: 'Dibayar',
  }
  const PAYSLIP_STATUS_COLOR: Record<string, string> = {
    draft: 'text-gray-500 bg-gray-100',
    sent: 'text-blue-700 bg-blue-100',
    paid: 'text-green-700 bg-green-100',
  }

  // ─── Schedule grid data ──────────────────────────────────────────────────────
  const DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const SESSION_DURATION_MIN = 90
  const PX_PER_MIN = 1

  const schedAvailByDay = new Map<number, AvailabilityRow>()
  for (const a of tutorAvailability) schedAvailByDay.set(a.day_of_week, a)

  const CLASS_PALETTE = [
    'bg-blue-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500',
    'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
  ]
  const classColorMap = new Map<string, string>()
  taughtClasses.filter(c => c.is_active).forEach((cls, i) => {
    classColorMap.set(cls.id, CLASS_PALETTE[i % CLASS_PALETTE.length])
  })

  const schedClassByDay = new Map<number, { classId: string; subjectName: string; startMin: number | null }[]>()
  for (const cls of taughtClasses.filter(c => c.is_active)) {
    for (const day of cls.schedule_days ?? []) {
      if (!schedClassByDay.has(day)) schedClassByDay.set(day, [])
      const startMin = cls.schedule_time ? timeToMinutes(cls.schedule_time) : null
      const subjectName = cls.class_subjects?.[0]?.subjects?.name ?? cls.name
      schedClassByDay.get(day)!.push({ classId: cls.id, subjectName, startMin })
    }
  }

  const schedDays = [0, 1, 2, 3, 4, 5, 6].filter(
    d => schedAvailByDay.has(d) || schedClassByDay.has(d)
  )

  const schedRangeStart = schedDays.length > 0
    ? Math.floor(Math.min(...schedDays.map(d => {
        const a = schedAvailByDay.get(d)
        return a ? timeToMinutes(a.start_time) : 999
      }).filter(v => v < 999)) / 60) * 60
    : 8 * 60

  const schedRangeEnd = schedDays.length > 0
    ? Math.ceil(Math.max(...schedDays.map(d => {
        const a = schedAvailByDay.get(d)
        const classes = schedClassByDay.get(d) ?? []
        const classEnd = classes.map(c => c.startMin !== null ? c.startMin + SESSION_DURATION_MIN : 0)
        return Math.max(a ? timeToMinutes(a.end_time) : 0, ...classEnd)
      })) / 60) * 60
    : 20 * 60

  const schedHours: number[] = []
  for (let h = schedRangeStart / 60; h <= schedRangeEnd / 60; h++) {
    schedHours.push(h)
  }
  const schedContainerHeight = (schedRangeEnd - schedRangeStart) * PX_PER_MIN

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        {user.role === 'tutor' ? (
          <Link href="/admin/tutor" className="hover:text-blue-600">Tutor</Link>
        ) : (
          <Link href="/admin/users" className="hover:text-blue-600">Pengguna</Link>
        )}
        <span>/</span>
        <span className="text-gray-900 font-medium">{user.full_name}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: profile + content */}
        <div className="col-span-2 space-y-5">

          {/* ── Tutor: profile card ─────────────────────────────────────────── */}
          {user.role === 'tutor' && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
              <div className="flex items-start gap-4">
                <UserAvatarUpload
                  userId={userId}
                  currentUrl={user.avatar_url ?? null}
                  name={user.full_name}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-semibold text-gray-900">{user.full_name}</h1>
                    {workloadLevel === 'inactive' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Tidak Aktif</span>
                    )}
                    {workloadLevel === 'idle' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Idle</span>
                    )}
                    {workloadLevel !== 'inactive' && workloadLevel !== 'idle' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Aktif</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-gray-500">{user.email}</span>
                    {user.phone && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-sm text-gray-500">{user.phone}</span>
                      </>
                    )}
                  </div>
                </div>
                <Link
                  href={`/admin/users/${userId}/edit`}
                  className="shrink-0 px-3 py-1.5 text-sm font-medium text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          )}

          {/* ── Non-tutor: profile header ───────────────────────────────────── */}
          {user.role !== 'tutor' && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 flex items-center gap-4">
                  <UserAvatarUpload
                    userId={userId}
                    currentUrl={user.avatar_url ?? null}
                    name={user.full_name}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-semibold text-gray-900">{user.full_name}</h1>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                    {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                  </div>
                </div>
                <Link
                  href={`/admin/users/${userId}/edit`}
                  className="shrink-0 px-3 py-1.5 text-sm font-medium text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Edit
                </Link>
              </div>
              <p className="text-sm text-gray-400">
                Bergabung {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {/* ── Tutor: tabs ─────────────────────────────────────────────────── */}
          {user.role === 'tutor' && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
              {/* Tab nav */}
              <div className="flex border-b border-slate-100">
                {[
                  { key: 'jadwal', label: 'Jadwal & Kelas', count: taughtClasses.length },
                  { key: 'sesi',   label: 'Sesi',           count: tutorRecentSessions.length },
                  { key: 'slip',   label: 'Slip Gaji',      count: tutorPayslips.length },
                ].map(t => (
                  <Link
                    key={t.key}
                    href={`/admin/users/${userId}?tab=${t.key}`}
                    className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                      tab === t.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                    {t.count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        {t.count}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Tab: Jadwal */}
              {tab === 'jadwal' && (
                schedDays.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-gray-400 mb-2">Belum ada ketersediaan atau jadwal kelas.</p>
                    <Link href={`/admin/users/${userId}/edit`} className="text-sm text-blue-600 hover:underline">
                      Atur Ketersediaan
                    </Link>
                  </div>
                ) : (() => {
                  const totalMin = schedRangeEnd - schedRangeStart
                  const leftPct = (min: number) => `${((min - schedRangeStart) / totalMin) * 100}%`
                  const widthPct = (dur: number) => `${(dur / totalMin) * 100}%`
                  const ROW_H = 44

                  return (
                    <div className="p-5">
                      <div className="overflow-x-auto">
                        <div style={{ minWidth: 480 }}>
                          {/* Time axis header */}
                          <div className="relative ml-20 mb-2" style={{ height: 16 }}>
                            {schedHours.map(h => (
                              <span
                                key={h}
                                className="absolute text-[10px] text-gray-400 -translate-x-1/2"
                                style={{ left: leftPct(h * 60) }}
                              >
                                {h.toString().padStart(2, '0')}:00
                              </span>
                            ))}
                          </div>

                          {/* Day rows */}
                          <div className="space-y-1.5">
                            {schedDays.map(day => {
                              const avail = schedAvailByDay.get(day)
                              const classes = schedClassByDay.get(day) ?? []
                              return (
                                <div key={day} className="flex items-center gap-2">
                                  {/* Day label */}
                                  <div className="w-20 shrink-0 text-right">
                                    <span className="text-sm font-medium text-gray-600">{DAYS_FULL[day]}</span>
                                  </div>

                                  {/* Row track */}
                                  <div className="flex-1 relative rounded overflow-hidden bg-slate-100" style={{ height: ROW_H }}>
                                    {/* Hour grid lines */}
                                    {schedHours.map(h => (
                                      <div
                                        key={h}
                                        className="absolute top-0 bottom-0 border-l border-white/60"
                                        style={{ left: leftPct(h * 60) }}
                                      />
                                    ))}

                                    {/* Availability block */}
                                    {avail && (
                                      <div
                                        className="absolute top-0 bottom-0 bg-green-100 border-x border-green-300"
                                        style={{
                                          left: leftPct(timeToMinutes(avail.start_time)),
                                          width: widthPct(timeToMinutes(avail.end_time) - timeToMinutes(avail.start_time)),
                                        }}
                                      />
                                    )}

                                    {/* Class blocks */}
                                    {classes.map((cls, i) => {
                                      if (cls.startMin === null) return null
                                      const color = classColorMap.get(cls.classId) ?? 'bg-blue-500'
                                      return (
                                        <div
                                          key={i}
                                          className={`absolute top-1 bottom-1 ${color} rounded px-2 flex items-center overflow-hidden`}
                                          style={{
                                            left: leftPct(cls.startMin),
                                            width: widthPct(SESSION_DURATION_MIN),
                                          }}
                                        >
                                          <p className="text-[11px] text-white font-semibold truncate leading-tight">{cls.subjectName}</p>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
                          <span className="text-xs text-gray-500">Tersedia</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-blue-500" />
                          <span className="text-xs text-gray-500">Kelas aktif (90 mnt)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm bg-slate-100" />
                          <span className="text-xs text-gray-500">Tidak tersedia</span>
                        </div>
                      </div>

                      {/* Kelas list */}
                      {taughtClasses.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-slate-100">
                          {/* Active classes */}
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-700">
                              Kelas Aktif
                              <span className="ml-1.5 text-xs font-normal text-gray-400">({activeTaughtClasses.length})</span>
                            </p>
                            <Link href="/admin/classes" className="text-xs text-blue-600 hover:underline">Kelola kelas</Link>
                          </div>

                          {activeTaughtClasses.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">Belum ada kelas aktif.</p>
                          ) : (
                            <div className="overflow-x-auto rounded-lg border border-slate-100">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <th className="pl-4 pr-3 py-2.5 text-left">Nama Kelas</th>
                                    <th className="px-3 py-2.5 text-left hidden sm:table-cell">Mapel</th>
                                    <th className="px-3 py-2.5 text-left hidden md:table-cell">Jadwal</th>
                                    <th className="px-3 py-2.5" />
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {activeTaughtClasses.map(cls => {
                                    const schedule = formatSchedule(cls.schedule_days ?? [], cls.schedule_time ?? null)
                                    const colorCls = classColorMap.get(cls.id)
                                    return (
                                      <tr key={cls.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                                        <td className="pl-4 pr-3 py-2.5">
                                          <Link href={`/admin/classes/${cls.id}`} className="flex items-center gap-2">
                                            {colorCls && <div className={`w-2 h-2 rounded-full shrink-0 ${colorCls}`} />}
                                            <span className="font-medium text-gray-900">{cls.name}</span>
                                          </Link>
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">
                                          <Link href={`/admin/classes/${cls.id}`} className="block">
                                            {cls.class_subjects?.[0]?.subjects?.name ?? '—'}
                                          </Link>
                                        </td>
                                        <td className="px-3 py-2.5 hidden md:table-cell">
                                          <Link href={`/admin/classes/${cls.id}`} className="block text-gray-600">
                                            {schedule ?? '—'}
                                          </Link>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                          <Link href={`/admin/classes/${cls.id}`} className="inline-block">
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

                          {/* Inactive / historical classes */}
                          {taughtClasses.filter(c => !c.is_active).length > 0 && (
                            <div className="mt-5 pt-4 border-t border-slate-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                                Riwayat Kelas ({taughtClasses.filter(c => !c.is_active).length})
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
                                    {taughtClasses.filter(c => !c.is_active).map(cls => {
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
                                              {cls.class_subjects?.[0]?.subjects?.name && (
                                                <p className="text-xs text-gray-400">{cls.class_subjects[0].subjects!.name}</p>
                                              )}
                                            </Link>
                                          </td>
                                          <td className="px-3 py-2.5 text-center">
                                            <Link href={`/admin/classes/${cls.id}`} className="block font-semibold text-gray-700">
                                              {stats?.count ?? 0}
                                            </Link>
                                          </td>
                                          <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">
                                            <Link href={`/admin/classes/${cls.id}`} className="block">
                                              {firstDate}
                                            </Link>
                                          </td>
                                          <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">
                                            <Link href={`/admin/classes/${cls.id}`} className="block">
                                              {lastDate}
                                            </Link>
                                          </td>
                                          <td className="pr-3 pl-2 py-2.5 text-right">
                                            <Link href={`/admin/classes/${cls.id}`} className="inline-block">
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
                    </div>
                  )
                })()
              )}

              {/* Tab: Sesi */}
              {tab === 'sesi' && (
                tutorRecentSessions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">Belum ada sesi terlaksana.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          <th className="pl-5 pr-2 py-3 text-center w-8">#</th>
                          <th className="px-4 py-3 text-left">Tanggal</th>
                          <th className="px-4 py-3 text-left">Kelas</th>
                          <th className="px-4 py-3 text-left hidden sm:table-cell">Status</th>
                          <th className="pr-5 pl-4 py-3 text-left">Ketuntasan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tutorRecentSessions.map((s, idx) => {
                          const hasTopic = !!s.topic && (s.selected_cp_ids ?? []).length > 0
                          const hasPresensi = (recentAttendanceCounts.get(s.id) ?? 0) > 0
                          const hasCatatan = (recentNotesCountMap.get(s.id) ?? 0) > 0
                          const hasMateri = (recentMaterialsCountMap.get(s.id) ?? 0) > 0
                          const hasAsesmen = (recentAssessmentCountMap.get(s.id) ?? 0) > 0
                          const completedCount = [hasTopic, hasPresensi, hasCatatan, hasMateri, hasAsesmen].filter(Boolean).length
                          const sDate = new Date(s.scheduled_at)
                          const sEnd = new Date(sDate.getTime() + s.duration_minutes * 60_000)
                          const nowTs = new Date()
                          const effStatus = (s.status === 'scheduled' || s.status === 'ongoing')
                            ? nowTs < sDate ? 'scheduled' : nowTs <= sEnd ? 'ongoing' : 'overdue'
                            : s.status
                          const displayStatus = effStatus === 'completed' && completedCount < 5 ? 'overdue' : effStatus
                          const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
                            completed: { label: 'Selesai',       cls: 'bg-green-100 text-green-700' },
                            scheduled: { label: 'Terjadwal',     cls: 'bg-blue-100 text-blue-700' },
                            ongoing:   { label: 'Berlangsung',   cls: 'bg-yellow-100 text-yellow-700' },
                            overdue:   { label: 'Belum lengkap', cls: 'bg-orange-100 text-orange-700' },
                            cancelled: { label: 'Dibatalkan',    cls: 'bg-red-100 text-red-600' },
                          }
                          const statusInfo = STATUS_LABEL[displayStatus] ?? { label: displayStatus, cls: 'bg-gray-100 text-gray-500' }
                          const subjectName = classSubjectMap.get(s.class_id)
                          return (
                            <tr
                              key={s.id}
                              className="hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                              <td className="pl-5 pr-2 py-3 text-center text-gray-400 text-xs">
                                <Link href={`/admin/sessions/${s.id}`} className="block">{idx + 1}</Link>
                              </td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                <Link href={`/admin/sessions/${s.id}`} className="block">
                                  {new Date(s.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </Link>
                              </td>
                              <td className="px-4 py-3">
                                <Link href={`/admin/sessions/${s.id}`} className="block">
                                  <p className="text-gray-700">{classNameMap.get(s.class_id) ?? '—'}</p>
                                  {subjectName && <p className="text-xs text-gray-400">{subjectName}</p>}
                                </Link>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <Link href={`/admin/sessions/${s.id}`} className="block">
                                  <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                                    {statusInfo.label}
                                  </span>
                                </Link>
                              </td>
                              <td className="pr-5 pl-4 py-3">
                                <Link href={`/admin/sessions/${s.id}`} className="flex items-center gap-2">
                                  <span className={`text-sm font-semibold ${completedCount === 5 ? 'text-green-600' : completedCount >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>
                                    {completedCount}/5
                                  </span>
                                  <span className="text-xs text-gray-400">selesai</span>
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* Tab: Slip Gaji */}
              {tab === 'slip' && (
                <div>
                  {tutorPayslips.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10">Belum ada slip gaji.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <th className="pl-5 pr-4 py-3 text-left">Periode</th>
                            <th className="px-4 py-3 text-right hidden sm:table-cell">Total</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="pr-5 pl-4 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tutorPayslips.map(slip => (
                            <tr key={slip.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                              <td className="pl-5 pr-4 py-3">
                                <Link href={`/admin/payslips/${slip.id}`} className="block font-medium text-gray-800">
                                  {formatMonth(slip.month)}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-right hidden sm:table-cell">
                                <Link href={`/admin/payslips/${slip.id}`} className="block text-gray-700">
                                  {slip.grand_total > 0 ? formatRupiah(slip.grand_total) : <span className="text-gray-300">—</span>}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Link href={`/admin/payslips/${slip.id}`} className="block">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PAYSLIP_STATUS_COLOR[slip.status] ?? 'text-gray-500 bg-gray-100'}`}>
                                    {PAYSLIP_STATUS_LABEL[slip.status] ?? slip.status}
                                  </span>
                                </Link>
                              </td>
                              <td className="pr-5 pl-4 py-3 text-right">
                                <Link href={`/admin/payslips/${slip.id}`} className="inline-block">
                                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-5 py-3 border-t border-slate-100">
                    <Link
                      href={`/admin/payslips/new?tutorId=${userId}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      + Buat Slip Gaji Baru
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Student sections ───────────────────────────────────────────── */}
          {user.role === 'student' && (() => {
            const attendanceMap = new Map(studentAttendances.map(a => [a.session_id, a.status]))
            const resultMap = new Map(studentResults.map(r => [r.assessment_id, r]))

            return (
              <>
                <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Kelas yang Diikuti ({enrolledClasses.length})</h2>
                  {enrolledClasses.length === 0 ? (
                    <p className="text-sm text-gray-500">Siswa ini belum terdaftar di kelas manapun.</p>
                  ) : (
                    <div className="space-y-2">
                      {enrolledClasses.map(cls => (
                        <Link
                          key={cls.id}
                          href={`/admin/classes/${cls.id}`}
                          className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-800">{cls.name}</span>
                            {cls.level && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{cls.level}</span>}
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {cls.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {enrolledClasses.map(cls => {
                  const classSessions = studentSessions.filter(s => s.class_id === cls.id)
                  const totalPast = classSessions.length
                  const trackedSessions = classSessions.filter(s => attendanceMap.has(s.id))
                  const total = trackedSessions.length
                  const attended = trackedSessions.filter(s => {
                    const st = attendanceMap.get(s.id)
                    return st === 'present' || st === 'late'
                  }).length
                  const absent = trackedSessions.filter(s => attendanceMap.get(s.id) === 'absent').length
                  const excused = trackedSessions.filter(s => attendanceMap.get(s.id) === 'excused').length
                  const attendancePct = total > 0 ? Math.round((attended / total) * 100) : null

                  const classAssessments = studentAssessments.filter(a => a.sessions?.class_id === cls.id)
                  const scoredResults = classAssessments
                    .map(a => resultMap.get(a.id))
                    .filter((r): r is AssessmentResultRow => r !== undefined && r.score !== null)
                  const avgScore = scoredResults.length > 0
                    ? Math.round(scoredResults.reduce((s, r) => s + (r.score ?? 0), 0) / scoredResults.length)
                    : null
                  const avgMaxScore = scoredResults.length > 0
                    ? Math.round(
                        classAssessments
                          .filter(a => resultMap.get(a.id)?.score !== null && resultMap.get(a.id) !== undefined)
                          .reduce((s, a) => s + a.max_score, 0) / scoredResults.length
                      )
                    : null

                  const topics = [...new Set(classSessions.filter(s => s.topic).map(s => s.topic as string))]

                  return (
                    <div key={cls.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
                      <div className="px-5 py-4 bg-slate-50 border-b border-slate-300 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{cls.name}</p>
                          {cls.level && <p className="text-sm text-gray-500">{cls.level}</p>}
                        </div>
                        <Link href={`/admin/classes/${cls.id}`} className="text-sm text-blue-600 hover:underline">Lihat kelas</Link>
                      </div>

                      <div className="p-5 space-y-5">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-sm text-gray-500 mb-1">Kehadiran</p>
                            {total === 0 ? (
                              <p className="text-sm text-gray-400">—</p>
                            ) : (
                              <>
                                <p className={`text-xl font-bold ${
                                  attendancePct !== null && attendancePct >= 80 ? 'text-green-600'
                                  : attendancePct !== null && attendancePct >= 60 ? 'text-yellow-600'
                                  : 'text-red-500'
                                }`}>
                                  {attendancePct}%
                                </p>
                                <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      attendancePct !== null && attendancePct >= 80 ? 'bg-green-500'
                                      : attendancePct !== null && attendancePct >= 60 ? 'bg-yellow-500'
                                      : 'bg-red-400'
                                    }`}
                                    style={{ width: `${attendancePct ?? 0}%` }}
                                  />
                                </div>
                                <p className="text-sm text-gray-400 mt-1">{attended}/{total} sesi · {absent} absen · {excused} izin</p>
                              </>
                            )}
                          </div>

                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-sm text-gray-500 mb-1">Rata-rata Nilai</p>
                            {avgScore === null ? (
                              <p className="text-sm text-gray-400">Belum ada</p>
                            ) : (
                              <>
                                <p className={`text-xl font-bold ${
                                  avgScore >= 75 ? 'text-green-600' : avgScore >= 60 ? 'text-yellow-600' : 'text-red-500'
                                }`}>
                                  {avgScore}
                                  {avgMaxScore !== null && <span className="text-sm font-normal text-gray-400">/{avgMaxScore}</span>}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">{scoredResults.length} asesmen dinilai</p>
                              </>
                            )}
                          </div>

                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-sm text-gray-500 mb-1">Sesi Selesai</p>
                            <p className="text-xl font-bold text-gray-800">{totalPast}</p>
                            <p className="text-sm text-gray-400 mt-1">{classAssessments.length} asesmen</p>
                          </div>
                        </div>

                        {classAssessments.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nilai Asesmen</p>
                            <div className="border border-slate-300 rounded-lg overflow-hidden divide-y divide-slate-300">
                              {classAssessments.map(a => {
                                const result = resultMap.get(a.id)
                                const score = result?.score ?? null
                                const pct = score !== null ? Math.round((score / a.max_score) * 100) : null
                                const sessionDate = a.sessions?.scheduled_at
                                  ? new Date(a.sessions.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                  : null
                                return (
                                  <div key={a.id} className="flex items-center justify-between px-3 py-2.5">
                                    <div>
                                      <p className="text-sm text-gray-800">{a.title}</p>
                                      <p className="text-sm text-gray-400">
                                        {sessionDate && `${sessionDate}`}
                                        {a.sessions?.topic && ` · ${a.sessions.topic}`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      {score !== null ? (
                                        <>
                                          <span className="text-sm font-semibold text-gray-800">{score}/{a.max_score}</span>
                                          {pct !== null && (
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                              pct >= 75 ? 'bg-green-100 text-green-700'
                                              : pct >= 60 ? 'bg-yellow-100 text-yellow-700'
                                              : 'bg-red-100 text-red-600'
                                            }`}>
                                              {pct >= 75 ? 'Tuntas' : 'Belum Tuntas'}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-sm text-gray-400">Belum dinilai</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {topics.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Topik yang Dipelajari</p>
                            <div className="flex flex-wrap gap-1.5">
                              {topics.map((topic, i) => (
                                <span key={i} className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {studentNotes.length > 0 && (
                  <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-300">
                      <p className="text-sm font-semibold text-gray-900">Catatan Tutor</p>
                      <p className="text-sm text-gray-500">Catatan perkembangan terbaru dari tutor</p>
                    </div>
                    <div className="divide-y divide-slate-300">
                      {studentNotes.map(note => {
                        const cls = enrolledClasses.find(c => c.id === note.sessions?.class_id)
                        const date = note.sessions?.scheduled_at
                          ? new Date(note.sessions.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date(note.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        return (
                          <div key={note.id} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                {cls && <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">{cls.name}</span>}
                                {note.sessions?.topic && <span className="text-sm text-gray-500">{note.sessions.topic}</span>}
                              </div>
                              <p className="text-sm text-gray-400">{date}</p>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{note.body}</p>
                            {note.profiles?.full_name && (
                              <p className="text-sm text-gray-400 mt-1.5">— {note.profiles.full_name}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 space-y-4">

            {/* Kontak */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Kontak</p>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-gray-400 shrink-0">Email</span>
                  <span className="text-sm text-gray-700 text-right break-all">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-400 shrink-0">HP</span>
                    <span className="text-sm text-gray-700">{user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tutor-specific */}
            {user.role === 'tutor' && (
              <>
                {/* Beban Kerja */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Beban Kerja</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Beban kerja</span>
                      <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${workloadCfg.bgColor} ${workloadCfg.color}`}>
                        {workloadCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Kelas aktif</span>
                      <span className="text-sm font-semibold text-gray-800">{activeTaughtClasses.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total siswa</span>
                      <span className="text-sm font-semibold text-gray-800">{totalActiveStudents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Sesi bulan ini</span>
                      <span className="text-sm font-semibold text-gray-800">{sessionsThisMonth}</span>
                    </div>
                  </div>
                </div>

                {/* Mengajar */}
                {subjectLevelMap.size > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Mengajar</p>
                    <div className="space-y-1.5">
                      {[...subjectLevelMap.entries()].map(([subject, levels]) => (
                        <div key={subject} className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-gray-800">{subject}</span>
                          <span className="text-sm text-gray-400 text-right">{levels.join(', ') || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ketersediaan */}
                {tutorAvailability.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ketersediaan</p>
                    <div className="space-y-1.5">
                      {tutorAvailability.map(a => (
                        <div key={a.day_of_week} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{DAYS_ID[a.day_of_week]}</span>
                          <span className="text-sm text-gray-400">
                            {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pendapatan */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pendapatan</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {totalPendapatan > 0 ? formatRupiah(totalPendapatan) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Rata-rata/bulan</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {avgPendapatanPerBulan > 0 ? formatRupiah(avgPendapatanPerBulan) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Akun */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Akun</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Bergabung</span>
                  <span className="text-sm text-gray-700">
                    {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Masa bergabung</span>
                  <span className="text-sm text-gray-700">{joinedMonthsLabel}</span>
                </div>
              </div>
              <p className="font-mono text-[11px] text-gray-300 break-all mt-3 leading-relaxed">{userId}</p>
            </div>
          </div>

          {/* Aksi Akun */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Aksi Akun</h2>
            <div className="space-y-2">
              <PasswordResetButton userId={userId} />
              {user.role === 'tutor' && (
                <TutorStatusButton
                  userId={userId}
                  isActive={user.is_active ?? true}
                  tutorName={user.full_name}
                  activeClassCount={activeTaughtClasses.length}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
