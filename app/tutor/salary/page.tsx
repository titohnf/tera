import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { computeSalary, buildRateMap, resolveAmounts } from '@/lib/salary'
import type { SalaryBreakdownItem } from '@/lib/salary'
import Link from 'next/link'
import RekapDetailTable, { type RekapClassBreakdown } from '@/components/tutor/RekapDetailTable'
import MonthlyDetailTable, { type RekapMonthBreakdown } from '@/components/tutor/MonthlyDetailTable'
import MonthSelect from '@/components/tutor/MonthSelect'
import MetricCard from '@/components/dashboard/MetricCard'
import type { SalarySchemeRow, SessionPaymentRow, AttendanceRow, SessionRow, PayslipRow } from '@/lib/types/database'
import { summarizePayrollStatus } from '@/lib/session-status'

type SessionWithClass = SessionRow & { classes: { name: string; class_type: string | null; level: string | null; jenis: string | null } | null; subjects: { name: string } | null; payroll_status: string }
type AttendancePick = Pick<AttendanceRow, 'session_id' | 'status'>
type SessionRate = { class_type: string; jenjang: string; jenis: string; rate_per_session: number }

const SEMESTER_START = new Date(2026, 6, 1) // Juli 2026 — awal semester, tidak ada data sebelum ini
const ALL_MONTHS = 'all'

const MONTHS: { value: string; label: string }[] = (() => {
  const result = []
  const now = new Date()
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1)
  while (cursor >= SEMESTER_START) {
    result.push({
      value: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
      label: cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    })
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return result
})()

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const PAYSLIP_STATUS_LABEL: Record<string, string> = { sent: 'Menunggu Pembayaran', paid: 'Dibayar' }
const PAYSLIP_STATUS_COLOR: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
}

export default async function SalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; tab?: string }>
}) {
  const { month = MONTHS[0]?.value ?? ALL_MONTHS, tab = 'rekap' } = await searchParams
  const user = await getUser()
  if (!user) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Gaji</h1>
        <p className="text-sm text-gray-500 mt-1">Rekap dan slip gaji dari sesi yang kamu ajar.</p>
      </div>

      {/* Tabs */}
      <div className="inline-flex gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        <Link
          href="/tutor/salary?tab=rekap"
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
            tab === 'rekap' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Rekap Gaji
        </Link>
        <Link
          href="/tutor/salary?tab=slip"
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
            tab === 'slip' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Slip Gaji
        </Link>
        <Link
          href="/tutor/salary?tab=skema"
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
            tab === 'skema' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Skema Gaji
        </Link>
      </div>

      {tab === 'slip' ? (
        <SlipGajiTab userId={user.id} />
      ) : tab === 'skema' ? (
        <SkemaGajiTab userId={user.id} />
      ) : (
        <RekapGajiTab userId={user.id} month={month} />
      )}
    </div>
  )
}

async function RekapGajiTab({ userId, month }: { userId: string; month: string }) {
  const supabase = createAdminClient()
  const isAllMonths = month === ALL_MONTHS

  const startDate = isAllMonths
    ? SEMESTER_START.toISOString()
    : `${month}-01T00:00:00.000Z`
  const endDate = isAllMonths
    ? null
    : new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 1).toISOString()

  const [
    { data: sessions },
    { data: schemes },
    { data: payments },
    { data: activePeriod },
  ] = await Promise.all([
    (() => {
      let query = supabase
        .from('sessions')
        .select('id, scheduled_at, topic, status, class_id, payroll_status, classes(name, class_type, level, jenis), subjects(name)')
        .eq('tutor_id', userId)
        .eq('status', 'completed')
        .gte('scheduled_at', startDate)
      if (endDate) query = query.lt('scheduled_at', endDate)
      return query as unknown as Promise<{ data: SessionWithClass[] | null }>
    })(),

    supabase
      .from('salary_schemes')
      .select('*')
      .eq('tutor_id', userId) as unknown as Promise<{ data: SalarySchemeRow[] | null }>,

    (() => {
      let query = supabase
        .from('session_payments')
        .select('*')
        .eq('tutor_id', userId)
        .gte('created_at', startDate)
      if (endDate) query = query.lt('created_at', endDate)
      return query as unknown as Promise<{ data: SessionPaymentRow[] | null }>
    })(),

    supabase.from('rate_periods').select('id').eq('is_active', true).limit(1).single(),
  ])

  const { data: activeRates } = activePeriod?.id
    ? await (supabase
        .from('session_rates')
        .select('class_type, jenjang, jenis, rate_per_session')
        .eq('period_id', activePeriod.id) as unknown as Promise<{ data: SessionRate[] | null }>)
    : { data: [] as SessionRate[] }

  const sessionIds = (sessions ?? []).map(s => s.id)

  const attendances: AttendancePick[] = sessionIds.length > 0
    ? (((await supabase.from('attendances').select('session_id, status').in('session_id', sessionIds)) as unknown as { data: AttendancePick[] | null }).data ?? [])
    : []

  const attendancesBySession: Record<string, AttendanceRow[]> = {}
  for (const a of attendances) {
    if (!attendancesBySession[a.session_id]) attendancesBySession[a.session_id] = []
    attendancesBySession[a.session_id].push(a as AttendanceRow)
  }

  const report = computeSalary({
    sessions: (sessions ?? []) as Parameters<typeof computeSalary>[0]['sessions'],
    schemes: schemes ?? [],
    attendancesBySession,
    enrolledCountBySession: {},
    payments: payments ?? [],
    rateMap: buildRateMap(activeRates ?? []),
  })

  const selectedMonth = MONTHS.find(m => m.value === month)

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <MonthSelect months={MONTHS} value={month} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Total Sesi" value={report.totalSessions} sub="sesi selesai" />
        <MetricCard
          label="Total Estimasi"
          value={formatRupiah(report.totalEarnings)}
          sub={isAllMonths ? 'Semua bulan' : selectedMonth?.label ?? ''}
        />
      </div>

      {/* Breakdown table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Detail Per Sesi</h2>
        </div>
        {report.breakdown.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            Tidak ada sesi selesai di bulan ini.
          </p>
        ) : isAllMonths ? (
          <MonthlyDetailTable months={groupByMonth(report.breakdown)} />
        ) : (
          <RekapDetailTable classes={groupByClass(report.breakdown)} />
        )}
      </div>
    </div>
  )
}

function groupByClass(breakdown: SalaryBreakdownItem[]): RekapClassBreakdown[] {
  const byClass = new Map<string, RekapClassBreakdown & { _statuses: string[] }>()
  for (const item of breakdown) {
    let entry = byClass.get(item.className)
    if (!entry) {
      entry = { className: item.className, sessionCount: 0, basePerSession: 0, grandTotal: 0, paymentStatus: 'unavailable', sessions: [], _statuses: [] }
      byClass.set(item.className, entry)
    }
    entry.sessionCount++
    entry.basePerSession += item.baseAmount
    entry.grandTotal += item.totalAmount
    entry._statuses.push(item.payrollStatus)
    entry.sessions.push({
      sessionId: item.sessionId,
      scheduledAt: item.scheduledAt,
      subject: item.subject,
      baseAmount: item.baseAmount,
      totalAmount: item.totalAmount,
      payrollStatus: item.payrollStatus,
    })
  }
  return Array.from(byClass.values()).map(({ _statuses, ...entry }) => {
    const basePerSession = entry.basePerSession / entry.sessionCount
    const sessions = [...entry.sessions]
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .map((s, i) => ({ ...s, meetingNumber: i + 1 }))
    return {
      ...entry,
      sessions,
      basePerSession,
      grandTotal: basePerSession * entry.sessionCount,
      paymentStatus: summarizePayrollStatus(_statuses),
    }
  })
}

function groupByMonth(breakdown: SalaryBreakdownItem[]): RekapMonthBreakdown[] {
  const byMonth = new Map<string, SalaryBreakdownItem[]>()
  for (const item of breakdown) {
    const monthKey = item.scheduledAt.slice(0, 7)
    if (!byMonth.has(monthKey)) byMonth.set(monthKey, [])
    byMonth.get(monthKey)!.push(item)
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, items]) => {
      const [year, mon] = monthKey.split('-').map(Number)
      return {
        monthKey,
        label: new Date(year, mon - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        sessionCount: items.length,
        grandTotal: items.reduce((sum, i) => sum + i.totalAmount, 0),
        classes: groupByClass(items),
      }
    })
}

async function SkemaGajiTab({ userId }: { userId: string }) {
  const supabase = createAdminClient()

  type SalaryClassRow = { id: string; name: string; class_type: string | null; level: string | null; jenis: string | null; is_active: boolean }
  const classFields = 'id, name, class_type, level, jenis, is_active'

  const [
    { data: ownedClasses },
    // Classes where this tutor teaches a subject via class_slots but isn't
    // classes.tutor_id (co-tutors on multi-subject/rotating classes — see
    // the same union pattern in app/tutor/classes/page.tsx)
    { data: assignedSlots },
    { data: schemes },
    { data: activePeriod },
  ] = await Promise.all([
    supabase
      .from('classes')
      .select(classFields)
      .eq('tutor_id', userId)
      .order('name') as unknown as Promise<{ data: SalaryClassRow[] | null }>,
    supabase
      .from('class_slots')
      .select('class_id')
      .contains('tutor_ids', [userId]) as unknown as Promise<{ data: { class_id: string }[] | null }>,
    supabase
      .from('salary_schemes')
      .select('*')
      .eq('tutor_id', userId) as unknown as Promise<{ data: SalarySchemeRow[] | null }>,
    supabase.from('rate_periods').select('id').eq('is_active', true).limit(1).single(),
  ])

  const ownedClassIds = new Set((ownedClasses ?? []).map(c => c.id))
  const assignedClassIds = [...new Set((assignedSlots ?? []).map(s => s.class_id))]
    .filter(id => !ownedClassIds.has(id))

  const { data: assignedClassesRaw } = assignedClassIds.length > 0
    ? await supabase.from('classes').select(classFields).in('id', assignedClassIds) as unknown as { data: SalaryClassRow[] | null }
    : { data: [] as SalaryClassRow[] }

  const classes: SalaryClassRow[] = [...(ownedClasses ?? []), ...(assignedClassesRaw ?? [])]

  const { data: activeRates } = activePeriod?.id
    ? await (supabase
        .from('session_rates')
        .select('class_type, jenjang, jenis, rate_per_session')
        .eq('period_id', activePeriod.id) as unknown as Promise<{ data: SessionRate[] | null }>)
    : { data: [] as SessionRate[] }

  const rateMap = buildRateMap(activeRates ?? [])
  const schemeByClassId = new Map((schemes ?? []).map(s => [s.class_id, s]))

  const rows = (classes ?? []).map(cls => {
    const scheme = schemeByClassId.get(cls.id)
    const { baseAmount } = resolveAmounts({ scheme, cls, studentsPresent: 0, rateMap })
    return { cls, scheme, baseAmount }
  })

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Skema gaji per kelas yang kamu ampu, sesuai pengaturan admin.</p>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Skema Gaji per Kelas</h2>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            Kamu belum ditugaskan di kelas manapun.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map(({ cls, scheme, baseAmount }) => (
              <div key={cls.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-gray-900">
                    {cls.name}
                    {!cls.is_active && (
                      <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full align-middle">Nonaktif</span>
                    )}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">
                    {formatRupiah(baseAmount)} <span className="text-xs font-normal text-gray-400">/ sesi</span>
                  </p>
                </div>
                {scheme?.bonus_type === 'student_count' && scheme.bonus_threshold != null && (
                  <p className="text-xs text-green-600 mt-1">
                    +{formatRupiah(scheme.bonus_amount)} bonus jika ≥{scheme.bonus_threshold} siswa hadir
                  </p>
                )}
                {baseAmount === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Skema gaji belum diatur admin untuk kelas ini.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

async function SlipGajiTab({ userId }: { userId: string }) {
  const supabase = createAdminClient()
  const { data: payslips } = await supabase
    .from('payslips')
    .select('*')
    .eq('tutor_id', userId)
    .in('status', ['sent', 'paid'])
    .eq('is_deleted', false)
    .order('month', { ascending: false }) as unknown as { data: PayslipRow[] | null }

  const list = payslips ?? []

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Rincian gaji yang telah dikirim oleh admin.</p>

      {list.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-sm text-gray-500">
          Belum ada slip gaji yang dikirimkan admin.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map(p => {
            const [year, mon] = p.month.split('-').map(Number)
            const workMonthLabel = new Date(year, mon - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
            return (
              <Link
                key={p.id}
                href={`/tutor/payslips/${p.id}`}
                className="flex items-center justify-between rounded-xl ring-1 ring-gray-900/5 px-5 py-4 hover:bg-blue-50/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-gray-900">{workMonthLabel}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PAYSLIP_STATUS_COLOR[p.status]}`}>
                      {PAYSLIP_STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {p.total_sessions} sesi · Tanggal bayar: {formatDate(p.pay_date)}
                  </p>
                  <p className="font-mono text-xs text-gray-400 mt-0.5">{p.payslip_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">{formatRupiah(p.grand_total)}</p>
                  {p.bonus_total > 0 && (
                    <p className="text-xs text-green-600">termasuk bonus {formatRupiah(p.bonus_total)}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
