export type Period = 'bulan' | 'sm1' | 'sm2' | 'ytd' | 'all'

export const PERIODS: { key: Period; label: string }[] = [
  { key: 'bulan', label: 'Bulan Ini' },
  { key: 'sm2', label: 'SM 2 (Jan–Jun)' },
  { key: 'sm1', label: 'SM 1 (Jul–Des)' },
  { key: 'ytd', label: 'YTD' },
  { key: 'all', label: 'All Time' },
]

export const VALID_PERIODS = PERIODS.map(p => p.key)

export interface DateRange {
  from: Date
  to: Date
  period: Period
}

export function getDateRange(period: Period, now = new Date()): DateRange {
  const year = now.getFullYear()

  switch (period) {
    case 'bulan':
      return {
        from: new Date(year, now.getMonth(), 1),
        to: new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999),
        period,
      }
    case 'sm2':
      return {
        from: new Date(year, 0, 1),
        to: new Date(year, 5, 30, 23, 59, 59, 999),
        period,
      }
    case 'sm1':
      return {
        from: new Date(year, 6, 1),
        to: new Date(year, 11, 31, 23, 59, 59, 999),
        period,
      }
    case 'ytd':
      return {
        from: new Date(year, 0, 1),
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
        period,
      }
    case 'all':
      return {
        from: new Date(2020, 0, 1),
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
        period,
      }
  }
}

export function formatPeriodLabel(period: Period, now = new Date()): string {
  const year = now.getFullYear()
  switch (period) {
    case 'bulan': return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    case 'sm2': return `SM 2 ${year} (Jan–Jun)`
    case 'sm1': return `SM 1 ${year} (Jul–Des)`
    case 'ytd': return `YTD ${year} (Jan – ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`
    case 'all': return 'Semua waktu'
  }
}

export function isCurrentPeriod(period: Period): boolean {
  const month = new Date().getMonth()
  if (period === 'sm1') return month >= 6
  if (period === 'sm2') return month < 6
  return false
}
