import { createAdminClient } from '@/lib/supabase/server-admin'
import { fetchCriticalEvaluationData } from '@/lib/supabase/studentCriticalQueries'
import { evaluateBatchCritical, getCriticalStudentIds } from '@/lib/studentCritical'
import Link from 'next/link'
import StudentFilters from '@/components/admin/siswa/StudentFilters'
import CriticalBadge from '@/components/siswa/CriticalBadge'

// ─── Types ────────────────────────────────────────────────────────────────────

type StudentProfile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  role: string | null
  level: string | null
  grade: string | null
  nickname: string | null
  created_at: string
  is_active: boolean
}

type ClassStudentRow = {
  student_id: string
  class_id: string
}

type InvoiceOverdueRow = {
  student_id: string
}


type SessionRow = {
  id: string
  class_id: string
}

type ClassDetailRow = {
  id: string
  name: string
  level: string | null
  profiles: { full_name: string } | null
}

type RecentSessionRow = {
  class_id: string
  scheduled_at: string
}


// ─── Inline components ────────────────────────────────────────────────────────

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

function studentHref(id: string, name: string | null): string {
  const slug = name ? toSlug(name) : ''
  return `/admin/siswa/${slug || id}`
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SiswaPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    status?: string
    jenjang?: string
    grade?: string
    sort?: string
    filter?: string
    activeFilter?: string
    sp?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const q = params.q ?? ''
  const status = params.status ?? ''
  const jenjang = params.jenjang ?? ''
  const grade = params.grade ?? ''
  const sort = params.sort ?? ''
  const activeFilter = params.activeFilter ?? params.filter ?? ''
  const summaryPeriod = (params.sp ?? 'bulan') as 'all' | 'tahun' | 'semester' | 'bulan'
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const PAGE_SIZE = 10

  const admin = createAdminClient()
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfMonthDate = firstOfMonth.toISOString().slice(0, 10)
  const todayDate = now.toISOString().slice(0, 10)

  const periodStart: Date =
    summaryPeriod === 'all'      ? new Date(0) :
    summaryPeriod === 'tahun'    ? new Date(now.getFullYear(), 0, 1) :
    summaryPeriod === 'semester' ? new Date(now.getFullYear(), now.getMonth() - 5, 1) :
    firstOfMonth

  const [
    { data: studentsRaw },
    { data: allEnrollmentsRaw },
    { data: activeEnrollmentsRaw },
    { data: overdueInvoicesRaw },
    { data: sessionsRaw },
    classDetailsResult,
    recentSessionsResult,
    firstSessionsResult,
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, phone, role, level, grade, nickname, created_at, is_active')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(300),

    admin.from('class_students').select('student_id, class_id'),

    admin
      .from('class_students')
      .select('student_id, class_id')
      .eq('is_active', true),

    admin
      .from('invoices')
      .select('student_id')
      .neq('status', 'paid')
      .lt('due_date', todayDate)
      .not('due_date', 'is', null),

    admin
      .from('sessions')
      .select('id, class_id')
      .gte('scheduled_at', periodStart.toISOString())
      .in('status', ['scheduled', 'completed']) as unknown as Promise<{ data: SessionRow[] | null }>,

    admin
      .from('classes')
      .select('id, name, level, profiles!tutor_id(full_name)') as unknown as Promise<{ data: ClassDetailRow[] | null }>,

    admin
      .from('sessions')
      .select('class_id, scheduled_at')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(5000) as unknown as Promise<{ data: RecentSessionRow[] | null }>,

    admin
      .from('sessions')
      .select('class_id, scheduled_at')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: true })
      .limit(5000) as unknown as Promise<{ data: RecentSessionRow[] | null }>,

  ])

  // Critical student evaluation
  const criticalInputs = await fetchCriticalEvaluationData()
  const { results: criticalResults } = evaluateBatchCritical(criticalInputs)
  const criticalStudentIds = new Set(getCriticalStudentIds(criticalResults))
  const criticalResultMap = new Map(criticalResults.map(r => [r.studentId, r]))

  // Per-student session data from critical inputs (Change 4)
  const studentLastSessionMap = new Map<string, Date | null>()
  const studentNextSessionMap = new Map<string, Date | null>()
  for (const input of criticalInputs) {
    studentLastSessionMap.set(input.studentId, input.lastSessionDate)
    studentNextSessionMap.set(input.studentId, input.nextScheduledSessionDate)
  }

  const students: StudentProfile[] = (studentsRaw ?? []) as StudentProfile[]
  const allEnrollments: ClassStudentRow[] = (allEnrollmentsRaw ?? []) as ClassStudentRow[]
  const activeEnrollments: ClassStudentRow[] = (activeEnrollmentsRaw ?? []) as ClassStudentRow[]
  const overdueInvoices: InvoiceOverdueRow[] = (overdueInvoicesRaw ?? []) as InvoiceOverdueRow[]
  const sessions: SessionRow[] = (sessionsRaw ?? []) as SessionRow[]
  const classDetailsRaw: ClassDetailRow[] = classDetailsResult.data ?? []
  const recentSessionsRaw: RecentSessionRow[] = recentSessionsResult.data ?? []
  const firstSessionsRaw: RecentSessionRow[] = firstSessionsResult.data ?? []

  // ── Build lookup structures ─────────────────────────────────────────────────

  const activeEnrollmentSet = new Set<string>()
  const anyEnrollmentSet = new Set<string>()
  const activeEnrollmentsByStudent = new Map<string, string[]>()

  const allEnrollmentsByStudent = new Map<string, string[]>()

  for (const e of allEnrollments) {
    anyEnrollmentSet.add(e.student_id)
    const existing = allEnrollmentsByStudent.get(e.student_id) ?? []
    existing.push(e.class_id)
    allEnrollmentsByStudent.set(e.student_id, existing)
  }
  for (const e of activeEnrollments) {
    activeEnrollmentSet.add(e.student_id)
    const existing = activeEnrollmentsByStudent.get(e.student_id) ?? []
    existing.push(e.class_id)
    activeEnrollmentsByStudent.set(e.student_id, existing)
  }

  const overdueStudentSet = new Set<string>(overdueInvoices.map((i) => i.student_id))
  const sessionClassSet = new Set<string>(sessions.map((s) => s.class_id))

  const studentsWithSessionSet = new Set<string>()
  for (const s of students) {
    if (!activeEnrollmentSet.has(s.id)) continue
    const classIds = activeEnrollmentsByStudent.get(s.id) ?? []
    if (classIds.some((cid) => sessionClassSet.has(cid))) studentsWithSessionSet.add(s.id)
  }

  const classDetailMap = new Map<string, { name: string; level: string | null; tutorName: string | null }>()
  for (const cls of classDetailsRaw) {
    classDetailMap.set(cls.id, { name: cls.name, level: cls.level, tutorName: cls.profiles?.full_name ?? null })
  }

  const classLastSessionMap = new Map<string, string>()
  for (const s of recentSessionsRaw) {
    if (!classLastSessionMap.has(s.class_id)) classLastSessionMap.set(s.class_id, s.scheduled_at)
  }

  const classFirstSessionMap = new Map<string, string>()
  for (const s of firstSessionsRaw) {
    if (!classFirstSessionMap.has(s.class_id)) classFirstSessionMap.set(s.class_id, s.scheduled_at)
  }

  // ── Compute metrics ─────────────────────────────────────────────────────────

  const totalStudents = students.length
  const activeCount = students.filter((s) => activeEnrollmentSet.has(s.id)).length
  const noClassCount = students.filter((s) => !anyEnrollmentSet.has(s.id)).length
  const newInPeriod = students.filter((s) => s.created_at >= periodStart.toISOString()).length

  const prevPeriodStart: Date | null =
    summaryPeriod === 'all'      ? null :
    summaryPeriod === 'tahun'    ? new Date(now.getFullYear() - 1, 0, 1) :
    summaryPeriod === 'semester' ? new Date(now.getFullYear(), now.getMonth() - 11, 1) :
    new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const newInPrevPeriod = prevPeriodStart
    ? students.filter((s) =>
        s.created_at >= prevPeriodStart.toISOString() &&
        s.created_at < periodStart.toISOString()
      ).length
    : 0
  const overdueCount = overdueStudentSet.size
  const withoutSessionCount = students.filter(
    (s) => activeEnrollmentSet.has(s.id) && !studentsWithSessionSet.has(s.id)
  ).length

  const totalEverEnrolled = anyEnrollmentSet.size
  const retentionRate = totalEverEnrolled > 0 ? Math.round((activeCount / totalEverEnrolled) * 100) : 0
  const churnRate = 100 - retentionRate

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function getStudentLastSession(id: string): string | null {
    const classIds = allEnrollmentsByStudent.get(id) ?? []
    const dates = classIds.map(cid => classLastSessionMap.get(cid)).filter((d): d is string => !!d)
    if (dates.length === 0) return null
    return dates.reduce((a, b) => (a > b ? a : b))
  }

  function getStudentStatus(id: string): 'aktif' | 'non-aktif' | 'menunggu' {
    const student = students.find(s => s.id === id)
    if (!student?.is_active) return 'non-aktif'
    if (activeEnrollmentSet.has(id)) return 'aktif'
    return 'menunggu'
  }

  function getStudentClassInfo(id: string): { name: string; level: string | null; tutorName: string | null } | null {
    const classIds = activeEnrollmentsByStudent.get(id) ?? []
    if (classIds.length === 0) return null
    return classDetailMap.get(classIds[0]) ?? null
  }

  function formatShortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  function getStudentMonthsJoined(id: string): string | null {
    const classIds = allEnrollmentsByStudent.get(id) ?? []
    const dates = classIds.map(cid => classFirstSessionMap.get(cid)).filter((d): d is string => !!d)
    if (dates.length === 0) return null
    const first = dates.reduce((a, b) => (a < b ? a : b))
    const months = Math.floor((now.getTime() - new Date(first).getTime()) / (30.44 * 86400000))
    if (months < 1) return '< 1 bln'
    if (months < 12) return `${months} bln`
    const y = Math.floor(months / 12)
    const m = months % 12
    return m === 0 ? `${y} thn` : `${y} thn ${m} bln`
  }

  // ── Status counts ────────────────────────────────────────────────────────────

  const statusCounts = {
    aktif:     students.filter(s => getStudentStatus(s.id) === 'aktif').length,
    menunggu:  students.filter(s => getStudentStatus(s.id) === 'menunggu').length,
    'non-aktif': students.filter(s => getStudentStatus(s.id) === 'non-aktif').length,
  }

  // ── Filter ──────────────────────────────────────────────────────────────────

  let filtered = [...students]

  if (q) {
    const lq = q.toLowerCase()
    filtered = filtered.filter(
      (s) => s.full_name?.toLowerCase().includes(lq) || s.email?.toLowerCase().includes(lq)
    )
  }
  if (jenjang) filtered = filtered.filter((s) => s.level === jenjang)
  if (grade) filtered = filtered.filter((s) => String(s.grade) === grade)
  if (status) filtered = filtered.filter((s) => getStudentStatus(s.id) === status)
  if (activeFilter === 'tanpa-sesi') {
    filtered = filtered.filter((s) => activeEnrollmentSet.has(s.id) && !studentsWithSessionSet.has(s.id))
  }
  if (activeFilter === 'kritis') {
    filtered = filtered.filter((s) => criticalStudentIds.has(s.id))
  }

  // ── Sort & paginate ─────────────────────────────────────────────────────────

  // Kritis selalu di atas
  const criticalSorted = filtered
    .filter(s => criticalStudentIds.has(s.id))
    .sort((a, b) => {
      const ra = criticalResultMap.get(a.id)
      const rb = criticalResultMap.get(b.id)
      const levelA = ra?.highestLevel ?? 99
      const levelB = rb?.highestLevel ?? 99
      if (levelA !== levelB) return levelA - levelB
      const urgA = ra?.primaryCondition?.urgency === 'today' ? 0 : 1
      const urgB = rb?.primaryCondition?.urgency === 'today' ? 0 : 1
      return urgA - urgB
    })

  // Sort non-kritis berdasarkan kolom yang dipilih
  const nonCritical = filtered.filter(s => !criticalStudentIds.has(s.id))
  const [sortCol, sortDir] = sort.split('_') // e.g. 'nama_asc' → ['nama','asc']
  if (sortCol === 'nama') {
    nonCritical.sort((a, b) => {
      const cmp = (a.full_name ?? '').localeCompare(b.full_name ?? '', 'id')
      return sortDir === 'desc' ? -cmp : cmp
    })
  } else if (sortCol === 'kelas') {
    nonCritical.sort((a, b) => {
      const cmp = (getStudentClassInfo(a.id)?.name ?? '').localeCompare(getStudentClassInfo(b.id)?.name ?? '', 'id')
      return sortDir === 'desc' ? -cmp : cmp
    })
  } else if (sortCol === 'jenjang') {
    nonCritical.sort((a, b) => {
      const ja = [a.grade, a.level].filter(Boolean).join(' ')
      const jb = [b.grade, b.level].filter(Boolean).join(' ')
      const cmp = ja.localeCompare(jb, 'id')
      return sortDir === 'desc' ? -cmp : cmp
    })
  } else if (sortCol === 'bergabung') {
    nonCritical.sort((a, b) => {
      const getFirst = (id: string) => {
        const classIds = allEnrollmentsByStudent.get(id) ?? []
        const dates = classIds.map(cid => classFirstSessionMap.get(cid)).filter((d): d is string => !!d)
        return dates.length > 0 ? dates.reduce((x, y) => (x < y ? x : y)) : ''
      }
      const fa = getFirst(a.id)
      const fb = getFirst(b.id)
      return sortDir === 'desc' ? fb.localeCompare(fa) : fa.localeCompare(fb)
    })
  } else if (sortCol === 'status') {
    nonCritical.sort((a, b) => {
      const cmp = getStudentStatus(a.id).localeCompare(getStudentStatus(b.id))
      return sortDir === 'desc' ? -cmp : cmp
    })
  }
  // default (no sort): terbaru dari DB

  const menungguSorted = nonCritical.filter(s => getStudentStatus(s.id) === 'menunggu')
  const restSorted = nonCritical.filter(s => getStudentStatus(s.id) !== 'menunggu')

  filtered = [...criticalSorted, ...restSorted, ...menungguSorted]

  const totalFiltered = filtered.length
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Derived render values ────────────────────────────────────────────────────

  const hasAnyFilter = !!(q || status || jenjang || grade || sort || activeFilter)

  const tableTitle = hasAnyFilter
    ? `Menampilkan ${totalFiltered} dari ${totalStudents} siswa`
    : `${totalStudents} Siswa`

  // Helper: URL untuk sort kolom (reset ke page 1)
  function sortUrl(col: string): string {
    const nextDir = sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (status) p.set('status', status)
    if (jenjang) p.set('jenjang', jenjang)
    if (grade) p.set('grade', grade)
    if (activeFilter) p.set('activeFilter', activeFilter)
    if (summaryPeriod !== 'bulan') p.set('sp', summaryPeriod)
    p.set('sort', `${col}_${nextDir}`)
    return `/admin/siswa?${p.toString()}`
  }

  // Helper: URL untuk pindah halaman
  function pageUrl(p: number): string {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    if (status) u.set('status', status)
    if (jenjang) u.set('jenjang', jenjang)
    if (grade) u.set('grade', grade)
    if (activeFilter) u.set('activeFilter', activeFilter)
    if (summaryPeriod !== 'bulan') u.set('sp', summaryPeriod)
    if (sort) u.set('sort', sort)
    if (p > 1) u.set('page', String(p))
    return `/admin/siswa?${u.toString()}`
  }

  function buildStatusUrl(s: string): string {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    u.set('status', s)
    if (jenjang) u.set('jenjang', jenjang)
    if (grade) u.set('grade', grade)
    if (summaryPeriod !== 'bulan') u.set('sp', summaryPeriod)
    return `/admin/siswa?${u.toString()}`
  }

  // Icon sort
  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <span className="ml-1 text-gray-300">↕</span>
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Siswa</h1>
        <div className="flex items-center gap-2">
          <a
            href={`/admin/siswa/export?${new URLSearchParams(
              Object.fromEntries(
                Object.entries({ q, status, jenjang, grade, sort, activeFilter }).filter(([, v]) => !!v)
              )
            ).toString()}`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </a>
          <Link
            href="/admin/users/new?from=siswa"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Siswa
          </Link>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: 'aktif',      label: 'Aktif',      dot: 'bg-green-500', tooltip: 'Terdaftar di kelas aktif dan memiliki sesi' },
          { key: 'menunggu',   label: 'Menunggu',   dot: 'bg-yellow-400', tooltip: 'Belum ada kelas atau sesi aktif' },
          { key: 'non-aktif',  label: 'Non-aktif',  dot: 'bg-gray-400',  tooltip: 'Dinonaktifkan oleh admin' },
        ] as const).map(({ key, label, dot, tooltip }) => (
          <a
            key={key}
            href={buildStatusUrl(key)}
            title={tooltip}
            className="bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-snug">{label}</p>
            </div>
            <p className="text-2xl font-semibold leading-none text-gray-900">{statusCounts[key]}</p>
            <p className="text-xs text-gray-500 mt-1">dari {totalStudents} siswa</p>
          </a>
        ))}
      </div>

      {/* Search + Filters */}
      <StudentFilters
        status={status}
        jenjang={jenjang}
        grade={grade}
        sort={sort}
        q={q}
        activeFilter={activeFilter}
      />

      {/* Student list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          {/* Change 6A: dynamic title */}
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
            {tableTitle}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            Tidak ada siswa yang sesuai filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="pl-[17px] pr-4 py-3 text-left">
                    <a href={sortUrl('nama')} className="inline-flex items-center hover:text-gray-700">
                      Nama<SortIcon col="nama" />
                    </a>
                  </th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">
                    <a href={sortUrl('jenjang')} className="inline-flex items-center hover:text-gray-700">
                      Jenjang<SortIcon col="jenjang" />
                    </a>
                  </th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">
                    <a href={sortUrl('kelas')} className="inline-flex items-center hover:text-gray-700">
                      Kelompok<SortIcon col="kelas" />
                    </a>
                  </th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">
                    <a href={sortUrl('bergabung')} className="inline-flex items-center hover:text-gray-700">
                      Bergabung<SortIcon col="bergabung" />
                    </a>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <a href={sortUrl('status')} className="inline-flex items-center hover:text-gray-700">
                      Status<SortIcon col="status" />
                    </a>
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((s) => {
                  const isCritical = criticalStudentIds.has(s.id)
                  const studentStatus = getStudentStatus(s.id)
                  const classInfo = getStudentClassInfo(s.id)
                  const lastSession = getStudentLastSession(s.id)
                  const monthsJoined = getStudentMonthsJoined(s.id)

                  const isActive = activeEnrollmentSet.has(s.id)
                  const hasSessionThisMonth = studentsWithSessionSet.has(s.id)
                  const lastDateFromCritical = studentLastSessionMap.get(s.id) ?? null
                  const nextDate = studentNextSessionMap.get(s.id) ?? null

                  const STATUS_BADGE = {
                    aktif:       'bg-green-100 text-green-700',
                    menunggu:    'bg-yellow-100 text-yellow-700',
                    'non-aktif': 'bg-gray-100 text-gray-500',
                  }
                  const STATUS_LABEL = {
                    aktif:       'Aktif',
                    menunggu:    'Menunggu',
                    'non-aktif': 'Non-aktif',
                  }

                  return (
                    <tr
                      key={s.id}
                      className={`transition-colors cursor-pointer border-l-[3px] ${
                        isCritical
                          ? 'bg-red-50/40 hover:bg-red-50 border-l-[#DC2626]'
                          : 'hover:bg-slate-50 border-l-transparent'
                      }`}
                    >
                      {/* Nama */}
                      <td className="pl-3 pr-4 py-3">
                        <Link href={studentHref(s.id, s.full_name)} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-blue-700">
                              {getInitials(s.full_name)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {s.full_name ?? '(tanpa nama)'}
                            </p>
                            {s.nickname && (
                              <p className="text-xs text-gray-400 truncate">{s.nickname}</p>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* Jenjang */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Link href={studentHref(s.id, s.full_name)} className="block text-sm text-gray-700">
                          {[s.grade, s.level].filter(Boolean).join(' ') || '—'}
                        </Link>
                      </td>

                      {/* Kelompok */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link href={studentHref(s.id, s.full_name)} className="block">
                          <span className="text-gray-700 truncate block max-w-[180px]">
                            {classInfo?.name ?? '—'}
                          </span>
                        </Link>
                      </td>

                      {/* Bergabung */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Link href={studentHref(s.id, s.full_name)} className="block text-sm text-gray-600">
                          {monthsJoined ?? '—'}
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Link href={studentHref(s.id, s.full_name)} className="block">
                          <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[studentStatus]}`}>
                            {STATUS_LABEL[studentStatus]}
                          </span>
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link href={studentHref(s.id, s.full_name)} className="inline-block">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-sm text-gray-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalFiltered)} dari {totalFiltered} siswa
            </p>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <a href={pageUrl(page - 1)} className="px-2 py-1 text-xs rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                  ←
                </a>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '…')[]>((acc, p, i, arr) => {
                  if (i > 0 && (arr[i - 1] as number) !== p - 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">…</span>
                  ) : (
                    <a
                      key={p}
                      href={pageUrl(p as number)}
                      className={`w-7 h-7 flex items-center justify-center text-xs rounded-lg transition-colors ${
                        p === page ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </a>
                  )
                )}
              {page < totalPages && (
                <a href={pageUrl(page + 1)} className="px-2 py-1 text-xs rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                  →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
