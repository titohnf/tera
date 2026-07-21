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
  const base = Math.floor(totalDue / n / 1000) * 1000
  const result: MonthlyInstallment[] = []
  for (let i = 0; i < n; i++) {
    const absoluteMonth = (sm - 1) + i
    const monthIndex = absoluteMonth % 12
    const year = sy + Math.floor(absoluteMonth / 12)
    const amount = i === n - 1 ? totalDue - base * (n - 1) : base
    // Only disambiguate with the year when the span crosses a year boundary.
    const label = ey !== sy ? `${MONTH_NAMES[monthIndex]} ${year}` : MONTH_NAMES[monthIndex]
    result.push({ label, amount })
  }
  return result
}

export function formatPeriodLabel(startDate?: string | null, endDate?: string | null): string {
  if (!startDate || !endDate) return ''
  const [sy, sm] = startDate.split('-').map(Number)
  const [ey, em] = endDate.split('-').map(Number)
  const start = `${MONTH_NAMES[sm - 1]}${sy !== ey ? ` ${sy}` : ''}`
  const end = `${MONTH_NAMES[em - 1]} ${ey}`
  return `${start}-${end}`
}
