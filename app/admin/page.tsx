import { createAdminClient } from '@/lib/supabase/server-admin'
import { fetchCriticalEvaluationData } from '@/lib/supabase/studentCriticalQueries'
import { evaluateBatchCritical } from '@/lib/studentCritical'
import Link from 'next/link'
import InsightBanner from '@/components/admin/InsightBanner'
import StatusSummary from '@/components/dashboard/StatusSummary'
import { getDateRange, formatPeriodLabel, VALID_PERIODS, PERIODS, type Period } from '@/lib/dateRange'
import { MetricGridSkeleton } from '@/components/dashboard/MetricSkeleton'
import OverviewChart, { type OverviewMetricDef, type OverviewSeries, type OverviewSeriesConfig } from '@/components/admin/dashboard/OverviewChart'
import SessionCalendar from '@/components/sessions/SessionCalendar'
import { getTutorGroupsForDate, buildDailyMessageText, buildWhatsappShareUrl, formatDateLabel, todayWib } from '@/lib/daily-message'
import { outstandingAmount, OUTSTANDING_SELECT, type InvoiceWithPayments } from '@/lib/finance/laba-rugi'

type RecentSession = {
  id: string
  scheduled_at: string
  topic: string | null
  status: string
  classes: { name: string } | null
  profiles: { full_name: string } | null
}

type AssessmentResultWithDate = {
  score: number
  assessments: { max_score: number; sessions: { scheduled_at: string } | null } | null
}

type CashPaymentRow = { amount: number; paid_at: string; invoices: { status: string } | null }

/** Pembayaran atas invoice yang dibatalkan bukan pemasukan. */
function sumCash(rows: CashPaymentRow[] | null): number {
  return (rows ?? [])
    .filter(p => p.invoices?.status !== 'cancelled')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0)
}

function formatRupiah(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

// Laba bisa minus, jadi besarannya diringkas dari nilai mutlak lalu tandanya
// dipasang kembali — tanpa ini "−2 juta" tampil sebagai "-2000000".
function formatKas(n: number) {
  const sign = n < 0 ? '−' : ''
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} jt`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)} rb`
  return `${sign}${abs}`
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">{title}</h2>
}


export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; year?: string; month?: string }>
}) {
  const { period: rawPeriod, year: rawYear, month: rawMonth } = await searchParams
  const period: Period = (VALID_PERIODS as string[]).includes(rawPeriod ?? '')
    ? (rawPeriod as Period)
    : 'ytd'

  const admin = createAdminClient()
  const now = new Date()

  const calYear = rawYear ? parseInt(rawYear, 10) : now.getFullYear()
  const calMonth = rawMonth ? parseInt(rawMonth, 10) : now.getMonth()
  const calFrom = new Date(calYear, calMonth, 1).toISOString()
  const calTo = new Date(calYear, calMonth + 1, 0, 23, 59, 59).toISOString()

  const today = todayWib()
  const todayGroups = await getTutorGroupsForDate(admin, today)
  const todayMessage = buildDailyMessageText(formatDateLabel(today), todayGroups)
  const whatsappHref = buildWhatsappShareUrl(todayMessage)

  const dateRange = getDateRange(period, now)
  const fromISO = dateRange.from.toISOString()
  const toISO = dateRange.to.toISOString()
  // Kolom `date` (pay_date, incurred_on) dibandingkan sebagai tanggal polos,
  // bukan timestamp, supaya batasnya tidak bergeser sehari karena zona waktu.
  const toLocalDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const fromDate = toLocalDate(dateRange.from)
  const toDate = toLocalDate(dateRange.to)

  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const firstOfPrevPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString()
  const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000).toISOString()
  const chartWideFrom = new Date(now.getFullYear() - 2, 0, 1).toISOString()

  const [
    { count: tutorCount },
    { count: newStudentsThisMonth },
    { count: newStudentsLastMonth },
    { count: newStudentsPrevMonth },
    { data: periodSessions },
    { count: activeEnrollments },
    { count: totalEverEnrolled },
    { data: invoicesPaidPeriod },
    { data: invoicesPendingRaw },
    { data: oldestPendingInvoice },
    { data: assessmentResultsRaw },
    { data: tutorSessionsInPeriod },
    { count: assessmentCount },
    { count: endedClassCount },
    { count: draftInvoiceCount },
    { data: billingRates },
    { data: allActiveStudents },
    { data: invoicesInPeriod },
    { data: inactiveEnrollments },
    { data: allUnpaidInvoices },
    { data: earliestStudent },
    { data: recentSessions },
    { data: allStudentsForChart },
    { data: calendarSessionsRaw },
    { data: allPayslipsForChart },
    { data: tutorProfilesRaw },
    { data: activeClassesForWorkload },
    { data: classEnrollmentsForWorkload },
    { data: paymentsInPeriod },
    { data: payslipsInPeriod },
    { data: expensesInPeriod },
    { data: allPaymentsForChart },
    { data: allExpensesForChart },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', firstOfThisMonth),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', firstOfLastMonth).lt('created_at', firstOfThisMonth),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', firstOfPrevPrevMonth).lt('created_at', firstOfLastMonth),
    admin.from('sessions').select('id, duration_minutes').eq('status', 'completed').gte('scheduled_at', fromISO).lte('scheduled_at', toISO),
    admin.from('class_students').select('*', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('class_students').select('*', { count: 'exact', head: true }),
    admin.from('invoices').select('total_due').eq('status', 'paid').gte('issued_at', fromISO).lte('issued_at', toISO),
    admin.from('invoices').select(`${OUTSTANDING_SELECT}, student_id`).neq('status', 'paid') as unknown as Promise<{ data: (InvoiceWithPayments & { student_id: string })[] | null }>,
    admin.from('invoices').select('issued_at').neq('status', 'paid').order('issued_at', { ascending: true }).limit(1),
    admin.from('assessment_results').select('score, assessments!inner(max_score, sessions!inner(scheduled_at))').not('score', 'is', null) as unknown as Promise<{ data: AssessmentResultWithDate[] | null }>,
    admin.from('sessions').select('tutor_id').eq('status', 'completed').gte('scheduled_at', fromISO).lte('scheduled_at', toISO).not('tutor_id', 'is', null),
    admin.from('assessments').select('*', { count: 'exact', head: true }),
    admin.from('classes').select('*', { count: 'exact', head: true }).eq('is_active', false),
    admin.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'draft').lt('created_at', threeDaysAgo),
    admin.from('billing_rates').select('amount'),
    admin.from('class_students').select('student_id').eq('is_active', true),
    admin.from('invoices').select('student_id').gte('issued_at', fromISO).lte('issued_at', toISO).neq('status', 'draft'),
    admin.from('class_students').select('student_id').eq('is_active', false),
    admin.from('invoices').select(`${OUTSTANDING_SELECT}, student_id`).neq('status', 'paid') as unknown as Promise<{ data: (InvoiceWithPayments & { student_id: string })[] | null }>,
    admin.from('profiles').select('created_at').eq('role', 'student').order('created_at', { ascending: true }).limit(1),
    admin.from('sessions')
      .select('id, scheduled_at, topic, status, classes(name), profiles!tutor_id(full_name)')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(5) as unknown as Promise<{ data: RecentSession[] | null }>,
    admin.from('profiles').select('id, created_at').eq('role', 'student').gte('created_at', chartWideFrom).order('created_at', { ascending: true }).limit(1000),
    admin.from('sessions')
      .select('id, scheduled_at, status, classes(id, name), profiles!tutor_id(full_name)')
      .gte('scheduled_at', calFrom)
      .lte('scheduled_at', calTo)
      .in('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])
      .order('scheduled_at', { ascending: true })
      .limit(200) as unknown as Promise<{ data: { id: string; scheduled_at: string; status: string; classes: { id: string; name: string } | null; profiles: { full_name: string } | null }[] | null }>,
    admin.from('payslips').select('grand_total, pay_date').in('status', ['sent', 'paid']).gte('pay_date', chartWideFrom).limit(500),
    admin.from('profiles').select('id, full_name, is_active').eq('role', 'tutor') as unknown as Promise<{ data: { id: string; full_name: string; is_active: boolean }[] | null }>,
    admin.from('classes').select('id, tutor_id').eq('is_active', true) as unknown as Promise<{ data: { id: string; tutor_id: string }[] | null }>,
    admin.from('class_students').select('class_id, student_id').eq('is_active', true) as unknown as Promise<{ data: { class_id: string; student_id: string }[] | null }>,
    // Uang yang benar-benar masuk, keluar untuk gaji, dan keluar untuk biaya
    // operasional. Lihat lib/finance/laba-rugi.ts untuk alasan pemasukan
    // diambil dari invoice_payments dan bukan dari invoices.
    admin.from('invoice_payments').select('amount, paid_at, invoices!inner(status)')
      .gte('paid_at', fromISO).lte('paid_at', toISO) as unknown as Promise<{ data: CashPaymentRow[] | null }>,
    admin.from('payslips').select('grand_total').in('status', ['sent', 'paid'])
      .gte('pay_date', fromDate).lte('pay_date', toDate) as unknown as Promise<{ data: { grand_total: number }[] | null }>,
    admin.from('operational_expenses').select('amount')
      .gte('incurred_on', fromDate).lte('incurred_on', toDate) as unknown as Promise<{ data: { amount: number }[] | null }>,
    admin.from('invoice_payments').select('amount, paid_at, invoices!inner(status)')
      .gte('paid_at', chartWideFrom).limit(2000) as unknown as Promise<{ data: CashPaymentRow[] | null }>,
    admin.from('operational_expenses').select('amount, incurred_on')
      .gte('incurred_on', chartWideFrom.slice(0, 10)).limit(1000) as unknown as Promise<{ data: { amount: number; incurred_on: string }[] | null }>,
  ])

  // ── Attendances (sequential) ───────────────────────────────────────────────
  const sessionIds = (periodSessions ?? []).map(s => s.id)
  let attendances: { status: string; session_id: string; student_id: string }[] = []
  if (sessionIds.length > 0) {
    const { data } = await admin.from('attendances').select('status, session_id, student_id').in('session_id', sessionIds)
    attendances = (data ?? []) as typeof attendances
  }

  // ── Computed values ────────────────────────────────────────────────────────

  const presentCount = attendances.filter(a => a.status === 'present' || a.status === 'late').length
  const attendanceRate = attendances.length > 0 ? Math.round((presentCount / attendances.length) * 100) : null
  const attendanceSessionCount = new Set(attendances.map(a => a.session_id)).size
  const activeTutorIds = new Set((tutorSessionsInPeriod ?? []).map(s => s.tutor_id).filter(Boolean))
  const utilisasiTutor = tutorCount ? Math.round((activeTutorIds.size / tutorCount) * 100) : 0
  const totalHours = Math.round((periodSessions ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / 60)
  const revenuePaid = sumCash(paymentsInPeriod)
  const payrollPeriod = (payslipsInPeriod ?? []).reduce((s, p) => s + (Number(p.grand_total) || 0), 0)
  const operationalPeriod = (expensesInPeriod ?? []).reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const netProfit = revenuePaid - payrollPeriod - operationalPeriod
  const invoicesPending = invoicesPendingRaw ?? []
  const revenuePending = outstandingAmount(invoicesPending)
  const revenuePerSiswa = (activeEnrollments ?? 0) > 0 ? Math.round(revenuePaid / (activeEnrollments ?? 1)) : 0
  const churned = (totalEverEnrolled ?? 0) - (activeEnrollments ?? 0)
  const churnRate = (totalEverEnrolled ?? 0) > 0 ? Math.round((churned / (totalEverEnrolled ?? 1)) * 100) : 0
  const retentionRate = 100 - churnRate

  const monthlyScores: Record<string, number[]> = {}
  for (const r of assessmentResultsRaw ?? []) {
    const scheduledAt = r.assessments?.sessions?.scheduled_at
    if (!scheduledAt || !r.assessments?.max_score) continue
    const key = scheduledAt.substring(0, 7)
    if (!monthlyScores[key]) monthlyScores[key] = []
    monthlyScores[key].push((r.score / r.assessments.max_score) * 100)
  }
  const avgScoreHistory = Object.entries(monthlyScores).sort(([a], [b]) => b.localeCompare(a)).slice(0, 3)
    .map(([, scores]) => Math.round(scores.reduce((a, b) => a + b, 0) / scores.length))

  const resultsFlat = (assessmentResultsRaw ?? []).filter(r => {
    if (!r.score || !r.assessments?.max_score) return false
    const sessionDate = r.assessments?.sessions?.scheduled_at
    return sessionDate ? sessionDate >= fromISO && sessionDate <= toISO : false
  })
  const passingRate = resultsFlat.length > 0
    ? Math.round(resultsFlat.filter(r => (r.score / r.assessments!.max_score) * 100 >= 75).length / resultsFlat.length * 100)
    : null

  const overdueInvoiceDays = oldestPendingInvoice?.[0]?.issued_at
    ? Math.floor((now.getTime() - new Date(oldestPendingInvoice[0].issued_at).getTime()) / 86_400_000) : 0

  const activeStudentSet = new Set((allActiveStudents ?? []).map(s => s.student_id))
  const studentsInSessionSet = new Set(attendances.map(a => a.student_id))
  const studentsWithoutSession = [...activeStudentSet].filter(id => !studentsInSessionSet.has(id)).length
  const invoicedStudentSet = new Set((invoicesInPeriod ?? []).map(i => i.student_id))
  const studentsWithoutInvoice = [...activeStudentSet].filter(id => !invoicedStudentSet.has(id)).length
  const inactiveStudentSet = new Set((inactiveEnrollments ?? []).map(s => s.student_id))
  const inactiveUnpaid = (allUnpaidInvoices ?? []).filter(i => inactiveStudentSet.has(i.student_id))
  const inactiveStudentOutstanding = outstandingAmount(inactiveUnpaid)
  const inactiveStudentsWithBalance = new Set(inactiveUnpaid.map(i => i.student_id)).size
  const baseRate = (billingRates ?? []).length > 0 ? Math.min(...(billingRates ?? []).map(r => r.amount)) : 0
  const hasPaidInvoices = (invoicesPaidPeriod ?? []).length > 0
  const allInvoicesPaid = hasPaidInvoices && invoicesPending.length === 0
  const earliestDate = earliestStudent?.[0]?.created_at ? new Date(earliestStudent[0].created_at) : now
  const bimbelAgeMonths = Math.max(0, Math.floor((now.getTime() - earliestDate.getTime()) / (30 * 86_400_000)))
  const cycleCompleted = (endedClassCount ?? 0) > 0
  const studentTutorRatio = (activeEnrollments ?? 0) > 0 && (tutorCount ?? 0) > 0
    ? (activeEnrollments ?? 0) / (tutorCount ?? 1) : 0

  // ── Tutor workload (untuk TI insights) ───────────────────────────────────────
  const classToTutorMap = new Map<string, string>()
  for (const c of activeClassesForWorkload ?? []) {
    if (c.id && c.tutor_id) classToTutorMap.set(c.id, c.tutor_id)
  }
  const tutorStudentSetsForInsight = new Map<string, Set<string>>()
  for (const cs of classEnrollmentsForWorkload ?? []) {
    const tutorId = classToTutorMap.get(cs.class_id)
    if (!tutorId) continue
    if (!tutorStudentSetsForInsight.has(tutorId)) tutorStudentSetsForInsight.set(tutorId, new Set())
    tutorStudentSetsForInsight.get(tutorId)!.add(cs.student_id)
  }
  const tutorWorkloads = (tutorProfilesRaw ?? []).map(t => ({
    id: t.id,
    name: t.full_name,
    studentCount: tutorStudentSetsForInsight.get(t.id)?.size ?? 0,
    isActive: t.is_active,
  }))

  const criticalInputs = await fetchCriticalEvaluationData()
  const { summary: criticalSummary } = evaluateBatchCritical(criticalInputs)

  // ── Overview chart data ────────────────────────────────────────────────────

  const periodStart = dateRange.from
  const periodEnd = dateRange.to
  // Sebulan penuh yang dipetakan per bulan hanya menghasilkan satu batang,
  // jadi periode pendek dipecah per minggu.
  const chartGranularity: 'weekly' | 'monthly' =
    period === 'bulan' || period === 'sm1' || period === 'sm2' ? 'weekly' : 'monthly'

  function buildBuckets(): { key: string; label: string }[] {
    const fmtDate = (d: Date) =>
      chartGranularity === 'weekly'
        ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        : d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
    const buckets: { key: string; label: string }[] = []
    if (chartGranularity === 'weekly') {
      const cur = new Date(periodStart); let w = 0
      while (cur <= periodEnd) { buckets.push({ key: String(w), label: fmtDate(cur) }); cur.setDate(cur.getDate() + 7); w++ }
    } else {
      const end = period === 'all' ? now : periodEnd
      const cur = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1)
      while (cur <= end) { buckets.push({ key: `${cur.getFullYear()}-${String(cur.getMonth()).padStart(2, '0')}`, label: fmtDate(cur) }); cur.setMonth(cur.getMonth() + 1) }
    }
    return buckets
  }

  function dateToBucketKey(d: Date): string {
    return chartGranularity === 'weekly'
      ? String(Math.floor((d.getTime() - periodStart.getTime()) / (7 * 86400000)))
      : `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
  }

  const buckets = buildBuckets()

  function buildSiswaBaru(): OverviewSeriesConfig {
    const counts = new Map(buckets.map(b => [b.key, 0]))
    for (const s of allStudentsForChart ?? []) {
      const d = new Date(s.created_at)
      if (d >= periodStart && d <= periodEnd) { const k = dateToBucketKey(d); if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1) }
    }
    return { points: buckets.map(b => ({ label: b.label, current: counts.get(b.key) ?? 0 })), currentLabel: 'Siswa Baru' }
  }

  function buildSiswaAktif(): OverviewSeriesConfig {
    const raw = buildSiswaBaru(); let run = 0
    return { points: raw.points.map(p => { run += p.current; return { label: p.label, current: run } }), currentLabel: 'Kumulatif Siswa' }
  }

  function buildRetensi(): OverviewSeriesConfig {
    const total = new Map(buckets.map(b => [b.key, 0]))
    const active = new Map(buckets.map(b => [b.key, 0]))
    for (const s of allStudentsForChart ?? []) {
      const d = new Date(s.created_at)
      if (d >= periodStart && d <= periodEnd) {
        const k = dateToBucketKey(d)
        if (!total.has(k)) continue
        total.set(k, (total.get(k) ?? 0) + 1)
        if (activeStudentSet.has(s.id)) active.set(k, (active.get(k) ?? 0) + 1)
      }
    }
    return {
      points: buckets.map(b => {
        const t = total.get(b.key) ?? 0
        const a = active.get(b.key) ?? 0
        return {
          label: b.label,
          current: t > 0 ? Math.round((a / t) * 100) : 0,
          detail: t > 0 ? `${a} aktif dari ${t} yang daftar` : 'Belum ada data',
        }
      }),
      currentLabel: 'Retensi per Cohort (%)',
      format: 'persen',
    }
  }

  function buildKas(): OverviewSeriesConfig {
    const pem = new Map(buckets.map(b => [b.key, 0]))
    const pen = new Map(buckets.map(b => [b.key, 0]))
    for (const p of allPaymentsForChart ?? []) {
      if (!p.paid_at || p.invoices?.status === 'cancelled') continue
      const d = new Date(p.paid_at)
      if (d >= periodStart && d <= periodEnd) { const k = dateToBucketKey(d); if (pem.has(k)) pem.set(k, (pem.get(k) ?? 0) + (Number(p.amount) || 0)) }
    }
    for (const ps of allPayslipsForChart ?? []) {
      if (!ps.pay_date) continue
      const d = new Date(ps.pay_date)
      if (d >= periodStart && d <= periodEnd) { const k = dateToBucketKey(d); if (pen.has(k)) pen.set(k, (pen.get(k) ?? 0) + (ps.grand_total ?? 0)) }
    }
    // Biaya operasional masuk ke sisi pengeluaran yang sama dengan gaji tutor:
    // grafik ini membandingkan uang masuk dengan seluruh uang keluar.
    for (const e of allExpensesForChart ?? []) {
      if (!e.incurred_on) continue
      const d = new Date(e.incurred_on)
      if (d >= periodStart && d <= periodEnd) { const k = dateToBucketKey(d); if (pen.has(k)) pen.set(k, (pen.get(k) ?? 0) + (Number(e.amount) || 0)) }
    }
    return {
      points: buckets.map(b => ({ label: b.label, current: pem.get(b.key) ?? 0, secondary: pen.get(b.key) ?? 0 })),
      currentLabel: 'Pemasukan',
      secondaryLabel: 'Pengeluaran',
      secondaryColor: '#ef4444',
      format: 'rupiah',
    }
  }

  const newInPeriod = (allStudentsForChart ?? []).filter(s => { const d = new Date(s.created_at); return d >= periodStart && d <= periodEnd }).length

  // Prev period: untuk SM gunakan semester SEBELUMNYA (bukan tahun yang sama)
  // SM1 (Jul–Des) → prev = SM2 tahun ini (Jan–Jun)
  // SM2 (Jan–Jun) → prev = SM1 tahun lalu (Jul–Des)
  // YTD           → prev = YTD tahun lalu
  // Bulan Ini     → prev = bulan lalu, penuh
  const prevStart: Date | null =
    period === 'bulan' ? new Date(now.getFullYear(), now.getMonth() - 1, 1) :
    period === 'sm1' ? new Date(now.getFullYear(), 0, 1) :
    period === 'sm2' ? new Date(now.getFullYear() - 1, 6, 1) :
    period === 'ytd' ? new Date(now.getFullYear() - 1, 0, 1) :
    null

  const prevEnd: Date | null =
    period === 'bulan' ? new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) :
    period === 'sm1' ? new Date(now.getFullYear(), 5, 30, 23, 59, 59) :
    period === 'sm2' ? new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59) :
    period === 'ytd' ? new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59) :
    null

  const vsLabel =
    period === 'bulan' ? 'dari bulan lalu' :
    period === 'sm1' ? 'dari SM2 ini' :
    period === 'sm2' ? 'dari SM1 lalu' :
    period === 'ytd' ? 'dari tahun lalu' :
    undefined

  const studentsArr = allStudentsForChart ?? []

  const newInPrevPeriod = prevStart && prevEnd
    ? studentsArr.filter(s => { const d = new Date(s.created_at); return d >= prevStart! && d <= prevEnd! }).length
    : null

  // Siswa aktif: cohort aktif periode ini vs periode sebelumnya
  const activeCohortCurrent = studentsArr.filter(s => {
    const d = new Date(s.created_at)
    return d >= periodStart && d <= periodEnd && activeStudentSet.has(s.id)
  }).length
  const activeCohortPrev = prevStart && prevEnd
    ? studentsArr.filter(s => { const d = new Date(s.created_at); return d >= prevStart! && d <= prevEnd! && activeStudentSet.has(s.id) }).length
    : null

  // Retensi cohort: % aktif dari yang daftar periode ini vs sebelumnya
  const retCurrTotal = newInPeriod
  const retCurrActive = activeCohortCurrent
  const retCurrPct = retCurrTotal > 0 ? Math.round((retCurrActive / retCurrTotal) * 100) : 0

  const retPrevTotal = newInPrevPeriod ?? 0
  const retPrevActive = activeCohortPrev ?? 0
  const retPrevPct = retPrevTotal > 0 ? Math.round((retPrevActive / retPrevTotal) * 100) : null

  // Laba periode sebelumnya dihitung dari data grafik yang sudah diambil
  // (dua tahun ke belakang), jadi tidak perlu query tambahan.
  const inPrev = (dateStr: string | null | undefined) => {
    if (!dateStr || !prevStart || !prevEnd) return false
    const d = new Date(dateStr)
    return d >= prevStart && d <= prevEnd
  }

  const netProfitPrevPeriod = prevStart && prevEnd
    ? sumCash((allPaymentsForChart ?? []).filter(p => inPrev(p.paid_at)))
      - (allPayslipsForChart ?? []).filter(p => inPrev(p.pay_date)).reduce((s, p) => s + (p.grand_total ?? 0), 0)
      - (allExpensesForChart ?? []).filter(e => inPrev(e.incurred_on)).reduce((s, e) => s + (Number(e.amount) || 0), 0)
    : null

  const kasDiff = netProfitPrevPeriod !== null ? netProfit - netProfitPrevPeriod : null
  const kasDiffText = kasDiff !== null
    ? (kasDiff >= 0 ? `+${formatRupiah(kasDiff)}` : formatRupiah(kasDiff))
    : undefined

  const overviewMetrics: OverviewMetricDef[] = [
    {
      key: 'siswa-aktif',
      label: 'Total Siswa Aktif',
      value: String(activeEnrollments ?? 0),
      diff: activeCohortPrev !== null ? activeCohortCurrent - activeCohortPrev : null,
      vsLabel,
    },
    {
      key: 'siswa-baru',
      label: 'Siswa Baru',
      value: String(newInPeriod),
      diff: newInPrevPeriod !== null ? newInPeriod - newInPrevPeriod : null,
      vsLabel,
    },
    {
      key: 'retensi',
      label: 'Retensi Siswa',
      value: `${retCurrPct}%`,
      diff: retPrevPct !== null ? retCurrPct - retPrevPct : null,
      diffText: retPrevPct !== null
        ? (retCurrPct - retPrevPct >= 0 ? `+${retCurrPct - retPrevPct}pp` : `${retCurrPct - retPrevPct}pp`)
        : undefined,
      vsLabel,
    },
    {
      key: 'kas',
      label: 'Laba Bersih',
      value: formatKas(netProfit),
      diff: kasDiff,
      diffText: kasDiffText,
      vsLabel,
    },
  ]

  const overviewSeries: OverviewSeries = {
    'siswa-aktif': buildSiswaAktif(),
    'siswa-baru': buildSiswaBaru(),
    'retensi': buildRetensi(),
    'kas': buildKas(),
  }

  // ── Insights ──────────────────────────────────────────────────────────────
  const insightMetrics = {
    period,
    tutorCount: tutorCount ?? 0,
    activeTutorCount: activeTutorIds.size,
    utilizationRate: utilisasiTutor,
    sessionCountThisMonth: periodSessions?.length ?? 0,
    currentDayOfMonth: now.getDate(),
    attendanceRate,
    attendanceSessionCount,
    assessmentCount: assessmentCount ?? 0,
    passingRate,
    avgScoreHistory,
    studentTutorRatio,
    studentsWithoutSession,
    churnRate,
    churnRateLastMonth: -1,
    revenueThisMonth: revenuePaid,
    outstandingAmount: revenuePending,
    maxOverdueDays: overdueInvoiceDays,
    draftInvoiceCount: draftInvoiceCount ?? 0,
    studentsWithoutInvoice,
    avgRevenuePerStudent: revenuePerSiswa,
    baseRate,
    allInvoicesPaid,
    inactiveStudentOutstanding,
    newStudentsThisMonth: newStudentsThisMonth ?? 0,
    newStudentsLastMonth: newStudentsLastMonth ?? 0,
    newStudentsPrevMonth: newStudentsPrevMonth ?? 0,
    retentionRate,
    retentionRateLastMonth: -1,
    cycleCompleted,
    referralTrackingEnabled: false,
    inactiveStudentsWithBalance,
    bimbelAgeMonths,
    criticalStudentCount: criticalSummary.totalCritical,
    tutorWorkloads,
  }

  const calendarSessions = (calendarSessionsRaw ?? []).map(s => ({
    id: s.id,
    scheduled_at: s.scheduled_at,
    status: s.status,
    classId: s.classes?.id ?? null,
    className: s.classes?.name ?? 'Kelas',
    tutorName: s.profiles?.full_name ?? null,
  }))

  const lastUpdatedAt = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-5">
      {/* Header */}
      <StatusSummary lastUpdatedAt={lastUpdatedAt} />

      {/* Insights */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <InsightBanner metrics={insightMetrics} />
      </div>

      {/* Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <SectionTitle title="Overview" />
        <OverviewChart
          metrics={overviewMetrics}
          series={overviewSeries}
          period={period}
          periodOptions={PERIODS}
        />
      </div>

      {/* Kalender Sesi */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Kalender Sesi</h2>
          <div className="flex items-center gap-2">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
              </svg>
              Pesan Jadwal Harian
            </a>
            <Link
              href="/admin/sessions"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Kelola sesi
            </Link>
          </div>
        </div>
        <div className="p-5 pt-3">
          <SessionCalendar
            sessions={calendarSessions}
            year={calYear}
            month={calMonth}
            navBase="/admin"
          />
        </div>
      </div>
    </div>
  )
}
