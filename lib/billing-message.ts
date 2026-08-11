const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** `month` adalah kunci "YYYY-MM", dipakai mencocokkan bulan pembayaran. */
export type MonthlyInstallment = { label: string; month: string; amount: number }

// Splits a total evenly across the calendar months a class spans (so
// parents always know a flat "bayar segini per bulan" figure instead of
// having to think in pertemuan or ask what this month's amount is). Any
// rounding remainder is absorbed into the last month so the sum stays exact.
export function getMonthlyBreakdown(totalDue: number, startDate?: string | null, endDate?: string | null): MonthlyInstallment[] {
  return splitAcrossMonths(totalDue, billingMonths(startDate, endDate))
}

/** Bulan-bulan kalender yang dilewati sebuah rentang tagihan, berurutan. */
export function billingMonths(startDate?: string | null, endDate?: string | null): BillingMonth[] {
  if (!startDate || !endDate) return []
  const [sy, sm] = startDate.split('-').map(Number)
  const [ey, em] = endDate.split('-').map(Number)
  const n = Math.max(1, (ey - sy) * 12 + (em - sm) + 1)
  const months: BillingMonth[] = []
  for (let i = 0; i < n; i++) {
    const absoluteMonth = (sm - 1) + i
    const monthIndex = absoluteMonth % 12
    const year = sy + Math.floor(absoluteMonth / 12)
    months.push({
      // Only disambiguate with the year when the span crosses a year boundary.
      label: ey !== sy ? `${MONTH_NAMES[monthIndex]} ${year}` : MONTH_NAMES[monthIndex],
      month: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    })
  }
  return months
}

export type BillingMonth = Omit<MonthlyInstallment, 'amount'>

// Spreads an amount evenly over the given months, rounded down to the
// nearest thousand with the remainder absorbed into the last month so the
// sum stays exact.
export function splitAcrossMonths(total: number, months: BillingMonth[]): MonthlyInstallment[] {
  const n = months.length
  if (n === 0) return []
  const base = Math.max(0, Math.floor(total / n / 1000) * 1000)
  return months.map((m, i) => ({
    ...m,
    amount: i === n - 1 ? total - base * (n - 1) : base,
  }))
}

export type BillingLineItem = {
  months: number
  amount: number
  is_deduction: boolean
  unit?: 'bulan' | 'pertemuan'
}

/**
 * Rencana cicilan bulanan sebuah invoice kelas grup.
 *
 * Membagi rata `total_due` ke seluruh bulan tidak selalu benar: siswa yang
 * bergabung di tengah bulan pertama ditagih beberapa pertemuan pro-rata di
 * bulan itu, lalu tarif bulanan penuh sesudahnya. Angka rata-rata tidak cocok
 * dengan invoice cetaknya, dan orang tua yang membandingkan keduanya akan
 * bingung.
 *
 * Bulan bertarif penuh diambil dari ujung belakang rentang sebanyak `months`
 * pada baris satuan "bulan", dan sisa tagihannya jatuh ke bulan-bulan di
 * depannya. Sengaja tidak membaca teks deskripsi untuk menebak bulan — teks itu
 * diketik tangan dan sudah terbukti bisa salah (ada baris Juli yang tertulis
 * "Juni"). Kalau bentuknya tidak dikenali, kembali ke pembagian rata.
 */
export function getInstallmentPlan(
  totalDue: number,
  lineItems: BillingLineItem[],
  startDate?: string | null,
  endDate?: string | null,
): MonthlyInstallment[] {
  const months = billingMonths(startDate, endDate)
  if (months.length === 0) return []

  const monthly = lineItems.find(i => !i.is_deduction && i.unit === 'bulan')
  if (!monthly || monthly.months <= 0 || monthly.months >= months.length) {
    return splitAcrossMonths(totalDue, months)
  }

  const leading = months.slice(0, months.length - monthly.months)
  const remainder = totalDue - monthly.months * monthly.amount
  // Tidak ada sisa untuk dibagi ke bulan-bulan depan — mencantumkannya sebagai
  // Rp 0 lebih membingungkan daripada membaginya rata seperti biasa.
  if (remainder <= 0) return splitAcrossMonths(totalDue, months)

  return [
    ...splitAcrossMonths(remainder, leading),
    ...months.slice(leading.length).map(m => ({ ...m, amount: monthly.amount })),
  ]
}

/**
 * Nama bulan Indonesia untuk sebuah tanggal/timestamp ISO. Dipakai melabeli
 * pembayaran yang jatuh di luar rentang tagihan, yang tidak punya baris di
 * `getMonthlyBreakdown` untuk diambil labelnya.
 */
export function monthNameOf(iso: string): string {
  return MONTH_NAMES[Number(iso.slice(5, 7)) - 1] ?? ''
}

export function formatPeriodLabel(startDate?: string | null, endDate?: string | null): string {
  if (!startDate || !endDate) return ''
  const [sy, sm] = startDate.split('-').map(Number)
  const [ey, em] = endDate.split('-').map(Number)
  const start = `${MONTH_NAMES[sm - 1]}${sy !== ey ? ` ${sy}` : ''}`
  const end = `${MONTH_NAMES[em - 1]} ${ey}`
  return `${start}-${end}`
}
