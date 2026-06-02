import { createAdminClient } from '@/lib/supabase/server-admin'
import { type NextRequest, NextResponse } from 'next/server'

function escapeCell(value: string | null | undefined): string {
  const s = value ?? ''
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function row(cells: (string | null | undefined)[]): string {
  return cells.map(escapeCell).join(',')
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q           = searchParams.get('q') ?? ''
  const status      = searchParams.get('status') ?? ''
  const jenjang     = searchParams.get('jenjang') ?? ''
  const grade       = searchParams.get('grade') ?? ''
  const tagihan     = searchParams.get('tagihan') ?? ''
  const sort        = searchParams.get('sort') ?? ''
  const activeFilter = searchParams.get('activeFilter') ?? ''

  const admin = createAdminClient()
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfMonthDate = firstOfMonth.toISOString().slice(0, 10)
  const todayDate = now.toISOString().slice(0, 10)

  const [
    { data: studentsRaw },
    { data: allEnrollmentsRaw },
    { data: activeEnrollmentsRaw },
    { data: overdueInvoicesRaw },
    { data: monthInvoicesRaw },
    { data: sessionsRaw },
    classDetailsResult,
    recentSessionsResult,
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, phone, role, level, grade, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(1000),

    admin.from('class_students').select('student_id, class_id'),

    admin.from('class_students').select('student_id, class_id').eq('is_active', true),

    admin
      .from('invoices')
      .select('student_id')
      .neq('status', 'paid')
      .lt('due_date', todayDate)
      .not('due_date', 'is', null),

    admin
      .from('invoices')
      .select('student_id, status')
      .gte('issued_at', firstOfMonthDate),

    admin
      .from('sessions')
      .select('id, class_id')
      .gte('scheduled_at', firstOfMonth.toISOString())
      .in('status', ['scheduled', 'completed']),

    admin
      .from('classes')
      .select('id, name') as unknown as Promise<{ data: { id: string; name: string }[] | null }>,

    admin
      .from('sessions')
      .select('class_id, scheduled_at')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(600) as unknown as Promise<{ data: { class_id: string; scheduled_at: string }[] | null }>,
  ])

  const students = studentsRaw ?? []
  const allEnrollments = allEnrollmentsRaw ?? []
  const activeEnrollments = activeEnrollmentsRaw ?? []
  const overdueInvoices = overdueInvoicesRaw ?? []
  const monthInvoices = monthInvoicesRaw ?? []
  const sessions = sessionsRaw ?? []
  const classDetails = classDetailsResult.data ?? []
  const recentSessions = recentSessionsResult.data ?? []

  // Build lookups
  const anyEnrollmentSet = new Set<string>(allEnrollments.map(e => e.student_id))
  const activeEnrollmentSet = new Set<string>()
  const activeEnrollmentsByStudent = new Map<string, string[]>()
  for (const e of activeEnrollments) {
    activeEnrollmentSet.add(e.student_id)
    const prev = activeEnrollmentsByStudent.get(e.student_id) ?? []
    prev.push(e.class_id)
    activeEnrollmentsByStudent.set(e.student_id, prev)
  }

  const overdueSet = new Set<string>(overdueInvoices.map(i => i.student_id))

  const billedSet = new Set<string>()
  const paidSet = new Set<string>()
  for (const inv of monthInvoices) {
    if (inv.status !== 'draft') {
      billedSet.add(inv.student_id)
      if (inv.status === 'paid') paidSet.add(inv.student_id)
    }
  }

  const sessionClassSet = new Set<string>(sessions.map(s => s.class_id))
  const studentsWithSessionSet = new Set<string>()
  for (const s of students) {
    const classIds = activeEnrollmentsByStudent.get(s.id) ?? []
    if (classIds.some(cid => sessionClassSet.has(cid))) studentsWithSessionSet.add(s.id)
  }

  const classNameMap = new Map<string, string>()
  for (const c of classDetails) classNameMap.set(c.id, c.name)

  const classLastSessionMap = new Map<string, string>()
  for (const s of recentSessions) {
    if (!classLastSessionMap.has(s.class_id)) classLastSessionMap.set(s.class_id, s.scheduled_at)
  }

  function getStatus(id: string): string {
    if (!anyEnrollmentSet.has(id)) return 'Belum di Kelas'
    if (activeEnrollmentSet.has(id)) return 'Aktif'
    return 'Non-aktif'
  }

  function getTagihan(id: string): string {
    if (overdueSet.has(id)) return 'Overdue'
    if (!billedSet.has(id) && activeEnrollmentSet.has(id)) return 'Belum Ditagih'
    if (paidSet.has(id)) return 'Lunas'
    return '—'
  }

  function getKelas(id: string): string {
    const classIds = activeEnrollmentsByStudent.get(id) ?? []
    return classIds.map(cid => classNameMap.get(cid) ?? cid).join('; ')
  }

  function getLastSession(id: string): string {
    const classIds = activeEnrollmentsByStudent.get(id) ?? []
    const dates = classIds.map(cid => classLastSessionMap.get(cid)).filter((d): d is string => !!d)
    if (dates.length === 0) return '—'
    const iso = dates.reduce((a, b) => (a > b ? a : b))
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Apply filters (same logic as list page)
  let filtered = [...students]

  if (q) {
    const lq = q.toLowerCase()
    filtered = filtered.filter(
      s => s.full_name?.toLowerCase().includes(lq) || s.email?.toLowerCase().includes(lq)
    )
  }
  if (jenjang) filtered = filtered.filter(s => s.level === jenjang)
  if (grade) filtered = filtered.filter(s => s.grade === parseInt(grade, 10))
  if (status) {
    filtered = filtered.filter(s => {
      const st = getStatus(s.id)
      const map: Record<string, string> = { aktif: 'Aktif', 'non-aktif': 'Non-aktif', 'tanpa-kelas': 'Belum di Kelas' }
      return st === (map[status] ?? status)
    })
  }
  if (tagihan === 'overdue')        filtered = filtered.filter(s => overdueSet.has(s.id))
  if (tagihan === 'belum-ditagih')  filtered = filtered.filter(s => !billedSet.has(s.id) && activeEnrollmentSet.has(s.id))
  if (tagihan === 'lunas')          filtered = filtered.filter(s => paidSet.has(s.id))
  if (activeFilter === 'tanpa-sesi') {
    filtered = filtered.filter(s => activeEnrollmentSet.has(s.id) && !studentsWithSessionSet.has(s.id))
  }

  if (sort === 'az') filtered.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '', 'id'))
  if (sort === 'za') filtered.sort((a, b) => (b.full_name ?? '').localeCompare(a.full_name ?? '', 'id'))

  // Build CSV
  const header = row(['Nama', 'Email', 'Telepon', 'Jenjang', 'Status', 'Kelas', 'Sesi Terakhir', 'Tagihan', 'Bergabung'])
  const lines = filtered.map(s =>
    row([
      s.full_name,
      s.email,
      s.phone,
      s.level,
      getStatus(s.id),
      getKelas(s.id),
      getLastSession(s.id),
      getTagihan(s.id),
      new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    ])
  )

  const csv = [header, ...lines].join('\r\n')
  const filename = `siswa-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
