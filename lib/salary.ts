import type { Session, SalaryScheme, Attendance, SessionPayment } from './types/database'

export interface SessionRate {
  class_type: string
  jenjang: string
  jenis: string
  rate_per_session: number
}

export function buildRateMap(rates: SessionRate[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const r of rates) map[`${r.class_type}|${r.jenjang}|${r.jenis}`] = r.rate_per_session
  return map
}

export function resolveAmounts(params: {
  scheme: SalaryScheme | undefined
  cls: { class_type?: string | null; level?: string | null; jenis?: string | null } | null
  studentsPresent: number
  rateMap: Record<string, number>
}): { baseAmount: number; bonusAmount: number } {
  const { scheme, cls, studentsPresent, rateMap } = params

  let baseAmount = 0
  if (scheme && scheme.base_amount > 0) {
    baseAmount = scheme.base_amount
  } else if (cls?.class_type && cls?.level && cls?.jenis) {
    const billingJenis = cls.jenis === 'reguler' ? 'Reguler' : cls.jenis === 'fokus' ? 'Fokus' : null
    baseAmount = billingJenis ? (rateMap[`${cls.class_type}|${cls.level}|${billingJenis}`] ?? 0) : 0
  }

  let bonusAmount = 0
  if (scheme && scheme.bonus_type === 'student_count' && scheme.bonus_threshold !== null) {
    if (studentsPresent >= scheme.bonus_threshold) {
      bonusAmount = scheme.bonus_amount
    }
  }

  return { baseAmount, bonusAmount }
}

export interface SalaryBreakdownItem {
  sessionId: string
  scheduledAt: string
  className: string
  subject: string | null
  topic: string | null
  studentsPresent: number
  studentsEnrolled: number
  baseAmount: number
  bonusAmount: number
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'cancelled' | null
  paidAt: string | null
  payrollStatus: string
}

export interface MonthlySummary {
  month: string // YYYY-MM
  sessionCount: number
  baseTotal: number
  bonusTotal: number
  grandTotal: number
  paidAmount: number
  pendingAmount: number
}

export interface SalaryReport {
  totalSessions: number
  totalEarnings: number
  paidEarnings: number
  pendingEarnings: number
  breakdown: SalaryBreakdownItem[]
  monthly: MonthlySummary[]
}

interface ComputeInput {
  sessions: Array<Session & { classes: { name: string; class_type?: string | null; level?: string | null; jenis?: string | null }; subjects?: { name: string } | null; payroll_status?: string }>
  schemes: SalaryScheme[]
  attendancesBySession: Record<string, Attendance[]>
  enrolledCountBySession: Record<string, number>
  payments: SessionPayment[]
  rateMap?: Record<string, number>
}

export function computeSalary(input: ComputeInput): SalaryReport {
  const { sessions, schemes, attendancesBySession, enrolledCountBySession, payments, rateMap = {} } = input

  const schemeByClassId = Object.fromEntries(
    schemes.map(s => [s.class_id, s])
  )
  const paymentBySessionId = Object.fromEntries(
    payments.map(p => [p.session_id, p])
  )

  const breakdown: SalaryBreakdownItem[] = sessions
    .filter(s => s.status === 'completed')
    .map(session => {
      const scheme = schemeByClassId[session.class_id]
      const attendances = attendancesBySession[session.id] ?? []
      const studentsPresent = attendances.filter(
        a => a.status === 'present' || a.status === 'late'
      ).length
      const studentsEnrolled = enrolledCountBySession[session.id] ?? 0
      const payment = paymentBySessionId[session.id] ?? null

      const { baseAmount, bonusAmount } = resolveAmounts({
        scheme,
        cls: session.classes,
        studentsPresent,
        rateMap,
      })

      return {
        sessionId: session.id,
        scheduledAt: session.scheduled_at,
        className: session.classes?.name ?? '',
        subject: session.subjects?.name ?? null,
        topic: session.topic,
        studentsPresent,
        studentsEnrolled,
        baseAmount: payment?.base_amount ?? baseAmount,
        bonusAmount: payment?.bonus_amount ?? bonusAmount,
        totalAmount: payment?.total_amount ?? baseAmount + bonusAmount,
        paymentStatus: payment?.status ?? null,
        paidAt: payment?.paid_at ?? null,
        payrollStatus: session.payroll_status ?? 'unavailable',
      }
    })

  // Group by month
  const monthlyMap: Record<string, MonthlySummary> = {}
  for (const item of breakdown) {
    const month = item.scheduledAt.slice(0, 7) // YYYY-MM
    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month,
        sessionCount: 0,
        baseTotal: 0,
        bonusTotal: 0,
        grandTotal: 0,
        paidAmount: 0,
        pendingAmount: 0,
      }
    }
    const m = monthlyMap[month]
    m.sessionCount++
    m.baseTotal += item.baseAmount
    m.bonusTotal += item.bonusAmount
    m.grandTotal += item.totalAmount
    if (item.paymentStatus === 'paid') m.paidAmount += item.totalAmount
    else m.pendingAmount += item.totalAmount
  }

  const totalEarnings = breakdown.reduce((sum, i) => sum + i.totalAmount, 0)
  const paidEarnings = breakdown
    .filter(i => i.paymentStatus === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0)

  return {
    totalSessions: breakdown.length,
    totalEarnings,
    paidEarnings,
    pendingEarnings: totalEarnings - paidEarnings,
    breakdown: breakdown.sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    ),
    monthly: Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month)),
  }
}
