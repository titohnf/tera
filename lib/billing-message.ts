const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export type MonthlyInstallment = { label: string; amount: number }

// Splits a total evenly across the calendar months a class spans (so
// parents always know a flat "bayar segini per bulan" figure instead of
// having to think in pertemuan or ask what this month's amount is). Any
// rounding remainder is absorbed into the last month so the sum stays exact.
export function getMonthlyBreakdown(totalDue: number, startDate?: string | null, endDate?: string | null): MonthlyInstallment[] {
  if (!startDate || !endDate) return []
  const [sy, sm] = startDate.split('-').map(Number)
  const [ey, em] = endDate.split('-').map(Number)
  const n = Math.max(1, (ey - sy) * 12 + (em - sm) + 1)
  const labels: string[] = []
  for (let i = 0; i < n; i++) {
    const absoluteMonth = (sm - 1) + i
    const monthIndex = absoluteMonth % 12
    const year = sy + Math.floor(absoluteMonth / 12)
    // Only disambiguate with the year when the span crosses a year boundary.
    labels.push(ey !== sy ? `${MONTH_NAMES[monthIndex]} ${year}` : MONTH_NAMES[monthIndex])
  }
  return splitAcrossMonths(totalDue, labels)
}

// Spreads an amount evenly over the given months, rounded down to the
// nearest thousand with the remainder absorbed into the last month so the
// sum stays exact.
export function splitAcrossMonths(total: number, labels: string[]): MonthlyInstallment[] {
  const n = labels.length
  if (n === 0) return []
  const base = Math.max(0, Math.floor(total / n / 1000) * 1000)
  return labels.map((label, i) => ({
    label,
    amount: i === n - 1 ? total - base * (n - 1) : base,
  }))
}

export function formatPeriodLabel(startDate?: string | null, endDate?: string | null): string {
  if (!startDate || !endDate) return ''
  const [sy, sm] = startDate.split('-').map(Number)
  const [ey, em] = endDate.split('-').map(Number)
  const start = `${MONTH_NAMES[sm - 1]}${sy !== ey ? ` ${sy}` : ''}`
  const end = `${MONTH_NAMES[em - 1]} ${ey}`
  return `${start}-${end}`
}
