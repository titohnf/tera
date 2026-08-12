import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Laba rugi bimbel per bulan, basis kas.
 *
 * "Basis kas" artinya yang dihitung adalah uang yang benar-benar berpindah di
 * bulan itu, bukan yang baru ditagihkan. Ini disengaja dan penting:
 *
 *   - Pemasukan diambil dari `invoice_payments`, bukan dari `invoices`. Invoice
 *     yang dicicil punya beberapa baris pembayaran di bulan yang berbeda-beda,
 *     dan invoice yang terbit Januari tapi dilunasi Maret adalah pemasukan
 *     Maret. Menjumlahkan `invoices.total_due` yang berstatus 'paid' menurut
 *     `issued_at` — cara lama — salah di kedua kasus itu: cicilan hilang sama
 *     sekali sampai lunas, lalu muncul utuh di bulan invoice diterbitkan.
 *
 *   - Gaji tutor diambil dari `payslips` menurut `pay_date` (tanggal gajian),
 *     bukan menurut `month` (bulan kerja). Slip Mei yang dibayar 1 Juni adalah
 *     uang keluar bulan Juni.
 *
 * Konsekuensinya laba bulan ini bisa berubah kalau ada orang tua yang membayar
 * tunggakan bulan lalu; itu memang perilaku yang benar untuk basis kas dan
 * itulah yang dilihat pemilik di rekeningnya.
 */

export const EXPENSE_CATEGORIES = [
  { value: 'sewa', label: 'Sewa Tempat' },
  { value: 'utilitas', label: 'Listrik, Air & Kebersihan' },
  { value: 'internet', label: 'Internet & Langganan' },
  { value: 'gaji_staf', label: 'Honor Admin & Staf' },
  { value: 'atk', label: 'ATK & Cetak Modul' },
  { value: 'marketing', label: 'Marketing & Promosi' },
  { value: 'peralatan', label: 'Peralatan & Perbaikan' },
  { value: 'transport', label: 'Transport' },
  { value: 'konsumsi', label: 'Konsumsi' },
  { value: 'pajak', label: 'Pajak & Retribusi' },
  { value: 'lainnya', label: 'Lainnya' },
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value']

export const EXPENSE_CATEGORY_VALUES: string[] = EXPENSE_CATEGORIES.map(c => c.value)

export function expenseCategoryLabel(value: string): string {
  return EXPENSE_CATEGORIES.find(c => c.value === value)?.label ?? value
}

export type OperationalExpense = {
  id: string
  incurred_on: string
  category: ExpenseCategory
  description: string
  amount: number
  notes: string | null
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** "2026-08" untuk tanggal WIB hari ini. */
export function currentMonthWib(now = new Date()): string {
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().slice(0, 7)
}

export function isValidMonth(month: string | undefined): month is string {
  return !!month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return d.toISOString().slice(0, 7)
}

/** Daftar bulan menurun, dari `month` mundur sebanyak `count` bulan. */
export function recentMonths(month: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(month, -i))
}

/**
 * Batas bulan dalam UTC untuk kolom timestamptz.
 *
 * Jam disimpan UTC sementara semua tanggal di aplikasi ini dibaca dalam WIB
 * (UTC+7, tanpa DST) — pola yang sama dengan wibDayRangeUtc di lib/daily-message.ts.
 * Tanpa geseran ini, pembayaran yang masuk 1 Agustus jam 06:00 WIB terhitung
 * sebagai pemasukan Juli.
 */
export function monthRangeUtc(month: string): { startIso: string; endIso: string } {
  const [y, m] = month.split('-').map(Number)
  return {
    startIso: new Date(Date.UTC(y, m - 1, 1, -7)).toISOString(),
    endIso: new Date(Date.UTC(y, m, 1, -7)).toISOString(),
  }
}

/** Batas bulan untuk kolom `date` (tanpa jam, jadi tanpa urusan zona waktu). */
export function monthRangeDate(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number)
  const pad = (n: number) => String(n).padStart(2, '0')
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`
  return { start: `${y}-${pad(m)}-01`, end: next }
}

/** Bulan (WIB) dari sebuah timestamptz. */
function monthOfTimestamp(iso: string): string {
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 7)
}

export type MonthlyTotals = {
  month: string
  /** Uang masuk dari pembayaran invoice siswa. */
  cashIn: number
  /** Gaji tutor yang jatuh tempo dibayar bulan ini (slip terkirim + lunas). */
  payroll: number
  /** Bagian dari `payroll` yang slipnya belum ditandai lunas. */
  payrollUnpaid: number
  /** Biaya operasional di luar gaji tutor. */
  operational: number
  /** cashIn − payroll − operational. */
  netProfit: number
}

function emptyTotals(month: string): MonthlyTotals {
  return { month, cashIn: 0, payroll: 0, payrollUnpaid: 0, operational: 0, netProfit: 0 }
}

/** Bentuk select yang harus dipakai bersama `outstandingAmount`. */
export const OUTSTANDING_SELECT = 'total_due, status, invoice_payments(amount)'

export type InvoiceWithPayments = {
  total_due: number
  status: string
  invoice_payments: { amount: number }[] | null
}

/**
 * Piutang: tagihan yang sudah dikirim ke orang tua tapi belum tertutup.
 *
 * Dua hal yang membedakannya dari sekadar menjumlahkan `total_due` invoice
 * yang statusnya bukan 'paid':
 *
 *   - Cicilan yang sudah masuk dikurangkan. Invoice 3 juta yang sudah dibayar
 *     2 juta adalah piutang 1 juta, bukan 3 juta.
 *   - Draft tidak dihitung. Selama belum dikirim, itu belum ditagihkan ke
 *     siapa pun — memasukkannya membuat piutang melonjak hanya karena admin
 *     menyiapkan invoice bulan depan lebih awal.
 */
export function outstandingAmount(rows: InvoiceWithPayments[] | null): number {
  return (rows ?? [])
    .filter(inv => inv.status !== 'draft' && inv.status !== 'cancelled' && inv.status !== 'paid')
    .reduce((sum, inv) => {
      const paid = (inv.invoice_payments ?? []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
      return sum + Math.max(0, (Number(inv.total_due) || 0) - paid)
    }, 0)
}

type PaymentRow = {
  amount: number
  paid_at: string
  invoices: { status: string; student_name: string } | null
}
type PayslipRow = {
  grand_total: number
  pay_date: string
  status: string
  tutor_name: string
  total_sessions: number
}
type ExpenseRow = OperationalExpense

/** Rentang waktu untuk query; `null` berarti seluruh riwayat. */
type Bounds = { startIso: string; endIso: string; startDate: string; endDate: string } | null

function boundsForMonths(months: string[]): Bounds {
  const sorted = [...months].sort()
  const earliest = sorted[0]
  const latest = sorted[sorted.length - 1]
  return {
    startIso: monthRangeUtc(earliest).startIso,
    endIso: monthRangeUtc(latest).endIso,
    startDate: monthRangeDate(earliest).start,
    endDate: monthRangeDate(latest).end,
  }
}

/**
 * Baris mentah penyusun laba rugi.
 *
 * Batasnya opsional supaya mode "Semua Waktu" memakai jalur yang sama persis
 * dengan mode per bulan — kalau tidak, ada dua tempat berbeda yang memutuskan
 * apa yang termasuk pemasukan, dan cepat atau lambat keduanya berselisih.
 *
 * `limit` dipasang eksplisit karena tanpa batas tanggal jumlah barisnya tumbuh
 * terus seiring umur bimbel, sementara PostgREST diam-diam memotong di 1000.
 * Batas yang kelihatan lebih baik daripada total yang salah tanpa peringatan.
 */
async function fetchFinanceRows(admin: SupabaseClient, bounds: Bounds) {
  let paymentQuery = admin
    .from('invoice_payments')
    .select('amount, paid_at, invoices!inner(status, student_name)')
    .limit(5000)
  let payslipQuery = admin
    .from('payslips')
    .select('grand_total, pay_date, status, tutor_name, total_sessions')
    .in('status', ['sent', 'paid'])
    .limit(5000)
  let expenseQuery = admin
    .from('operational_expenses')
    .select('id, incurred_on, category, description, amount, notes')
    .order('incurred_on', { ascending: false })
    .limit(5000)

  if (bounds) {
    paymentQuery = paymentQuery.gte('paid_at', bounds.startIso).lt('paid_at', bounds.endIso)
    payslipQuery = payslipQuery.gte('pay_date', bounds.startDate).lt('pay_date', bounds.endDate)
    expenseQuery = expenseQuery.gte('incurred_on', bounds.startDate).lt('incurred_on', bounds.endDate)
  }

  const [{ data: payments }, { data: payslips }, { data: expenses }] = await Promise.all([
    paymentQuery as unknown as Promise<{ data: PaymentRow[] | null }>,
    payslipQuery as unknown as Promise<{ data: PayslipRow[] | null }>,
    expenseQuery as unknown as Promise<{ data: ExpenseRow[] | null }>,
  ])

  return { payments: payments ?? [], payslips: payslips ?? [], expenses: expenses ?? [] }
}

/**
 * Ringkasan laba rugi untuk beberapa bulan sekaligus, terurut dari bulan
 * terbaru. Dipakai kartu ringkasan (bulan terpilih) sekaligus tabel tren.
 */
export async function getMonthlyTotals(
  admin: SupabaseClient,
  months: string[],
): Promise<MonthlyTotals[]> {
  if (months.length === 0) return []

  const { payments, payslips, expenses } = await fetchFinanceRows(admin, boundsForMonths(months))

  const byMonth = new Map(months.map(m => [m, emptyTotals(m)]))

  for (const p of payments ?? []) {
    // Invoice yang dibatalkan bukan pemasukan walau pembayarannya masih tercatat.
    if (p.invoices?.status === 'cancelled') continue
    const t = byMonth.get(monthOfTimestamp(p.paid_at))
    if (t) t.cashIn += Number(p.amount) || 0
  }

  for (const ps of payslips ?? []) {
    const t = byMonth.get(ps.pay_date.slice(0, 7))
    if (!t) continue
    const amount = Number(ps.grand_total) || 0
    t.payroll += amount
    if (ps.status !== 'paid') t.payrollUnpaid += amount
  }

  for (const e of expenses ?? []) {
    const t = byMonth.get(e.incurred_on.slice(0, 7))
    if (t) t.operational += Number(e.amount) || 0
  }

  for (const t of byMonth.values()) {
    t.netProfit = t.cashIn - t.payroll - t.operational
  }

  return months.map(m => byMonth.get(m) ?? emptyTotals(m))
}

export type PayrollDetail = {
  tutorName: string
  sessions: number
  total: number
  /** 'paid' hanya kalau SEMUA slip tutor ini di rentang tersebut sudah lunas. */
  status: string
  /** Jumlah slip yang diringkas — selalu 1 di mode per bulan. */
  slips: number
}
export type IncomeDetail = { studentName: string; total: number }
export type CategoryDetail = { category: string; total: number }

export type MonthlyBreakdown = {
  payroll: PayrollDetail[]
  income: IncomeDetail[]
  expensesByCategory: CategoryDetail[]
  expenses: OperationalExpense[]
}

/**
 * Periode yang sedang dilihat di halaman Laba Rugi: satu bulan, atau seluruh
 * riwayat. Nilai 'all' dipakai di URL (`?month=all`).
 */
export const ALL_TIME = 'all'
export type FinancePeriod = { kind: 'month'; month: string } | { kind: 'all' }

/**
 * Tanpa parameter, halaman Laba Rugi membuka seluruh riwayat. Bulan berjalan
 * hampir selalu setengah jadi — gaji bulan itu baru dibayar awal bulan
 * berikutnya — sehingga membukanya sebagai tampilan awal memberi kesan laba
 * yang lebih besar daripada kenyataannya.
 */
export function parseFinancePeriod(raw: string | undefined): FinancePeriod {
  if (!raw || raw === ALL_TIME) return { kind: 'all' }
  return { kind: 'month', month: isValidMonth(raw) ? raw : currentMonthWib() }
}

export function financePeriodValue(p: FinancePeriod): string {
  return p.kind === 'all' ? ALL_TIME : p.month
}

export function financePeriodLabel(p: FinancePeriod): string {
  return p.kind === 'all' ? 'Semua Waktu' : formatMonthLabel(p.month)
}

function boundsFor(p: FinancePeriod): Bounds {
  return p.kind === 'all' ? null : boundsForMonths([p.month])
}

/** Ringkasan satu periode — satu bulan atau seluruh riwayat sekaligus. */
export async function getPeriodTotals(
  admin: SupabaseClient,
  period: FinancePeriod,
): Promise<MonthlyTotals> {
  const { payments, payslips, expenses } = await fetchFinanceRows(admin, boundsFor(period))
  const totals = emptyTotals(financePeriodValue(period))

  for (const p of payments) {
    if (p.invoices?.status === 'cancelled') continue
    totals.cashIn += Number(p.amount) || 0
  }
  for (const ps of payslips) {
    const amount = Number(ps.grand_total) || 0
    totals.payroll += amount
    if (ps.status !== 'paid') totals.payrollUnpaid += amount
  }
  for (const e of expenses) {
    totals.operational += Number(e.amount) || 0
  }

  totals.netProfit = totals.cashIn - totals.payroll - totals.operational
  return totals
}

/** Rincian penyusun angka satu periode, untuk tabel di halaman Laba Rugi. */
export async function getPeriodBreakdown(
  admin: SupabaseClient,
  period: FinancePeriod,
): Promise<MonthlyBreakdown> {
  const { payments, payslips, expenses } = await fetchFinanceRows(admin, boundsFor(period))

  const incomeByStudent = new Map<string, number>()
  for (const p of payments) {
    if (p.invoices?.status === 'cancelled') continue
    const name = p.invoices?.student_name ?? 'Tanpa nama'
    incomeByStudent.set(name, (incomeByStudent.get(name) ?? 0) + (Number(p.amount) || 0))
  }

  // Di mode Semua Waktu satu tutor punya banyak slip, jadi dirangkum per tutor
  // — kalau tidak, namanya berulang sebanyak bulan yang pernah ia terima gaji.
  const payrollByTutor = new Map<string, PayrollDetail>()
  for (const p of payslips) {
    const existing = payrollByTutor.get(p.tutor_name)
    const row = existing ?? { tutorName: p.tutor_name, sessions: 0, total: 0, status: 'paid', slips: 0 }
    row.sessions += p.total_sessions ?? 0
    row.total += Number(p.grand_total) || 0
    row.slips += 1
    if (p.status !== 'paid') row.status = p.status
    payrollByTutor.set(p.tutor_name, row)
  }

  const expenseRows = expenses.map(e => ({ ...e, amount: Number(e.amount) || 0 }))
  const byCategory = new Map<string, number>()
  for (const e of expenseRows) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount)
  }

  return {
    payroll: [...payrollByTutor.values()].sort((a, b) => b.total - a.total),
    income: [...incomeByStudent.entries()]
      .map(([studentName, total]) => ({ studentName, total }))
      .sort((a, b) => b.total - a.total),
    expensesByCategory: [...byCategory.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total),
    expenses: expenseRows,
  }
}

/**
 * Pengelompokan baris tabel tren. Default semester, karena bimbel berjalan per
 * semester: itu satuan yang dipakai penamaan kelas, tarif, dan invoice, dan
 * dua belas baris bulanan lebih sulit dibaca daripada dua baris semester saat
 * yang ingin dilihat adalah arah usahanya.
 */
export type TrendGrouping = 'semester' | 'bulan'

export function parseTrendGrouping(raw: string | undefined): TrendGrouping {
  return raw === 'bulan' ? 'bulan' : 'semester'
}

/**
 * Semester akademik sebuah bulan.
 *
 * Mengikuti penamaan kelas di Tera ("SM 1 2026/2027"): SM 1 berjalan Juli–
 * Desember, SM 2 Januari–Juni, dan tahun ajaran menyeberang pergantian tahun —
 * Januari 2027 masih tahun ajaran 2026/2027.
 */
export function semesterOf(month: string): { key: string; label: string } {
  const [year, m] = month.split('-').map(Number)
  const isFirstHalf = m >= 7
  const startYear = isFirstHalf ? year : year - 1
  const academicYear = `${startYear}/${startYear + 1}`
  return {
    key: `${isFirstHalf ? 'sm1' : 'sm2'}-${academicYear}`,
    label: `SM ${isFirstHalf ? 1 : 2} ${academicYear}`,
  }
}

/**
 * Keenam bulan dalam semester yang memuat `month`, terbaru dulu — urutan yang
 * sama dengan recentMonths(), karena buildTrendRows() yang membalik jadi menaik.
 *
 * Selalu enam bulan penuh, termasuk yang belum datang. Semester berjalan adalah
 * satu periode utuh yang sedang ditempuh, jadi bulan yang belum terisi bagian
 * dari gambarannya: ia menunjukkan berapa lama lagi sampai semester ini tutup.
 */
export function semesterMonths(month: string): string[] {
  const [year, m] = month.split('-').map(Number)
  const startMonth = m >= 7 ? 7 : 1
  return Array.from({ length: 6 }, (_, i) =>
    `${year}-${String(startMonth + 5 - i).padStart(2, '0')}`,
  )
}

export type TrendRow = {
  key: string
  label: string
  /** Bulan yang bisa dibuka lewat filter; null untuk baris semester. */
  linkMonth: string | null
  cashIn: number
  payroll: number
  operational: number
  netProfit: number
  /** Ada bulan di dalamnya yang angkanya proyeksi, bukan kejadian nyata. */
  projected: boolean
}

/**
 * Baris tabel tren, dari periode terlama ke terbaru, sesuai pengelompokan yang
 * dipilih. Urutan menaik supaya arah usahanya terbaca dari kiri-atas ke
 * kanan-bawah seperti grafik — `totals` sendiri datang terbaru dulu.
 */
export function buildTrendRows(
  totals: (MonthlyTotals & { projected?: boolean })[],
  grouping: TrendGrouping,
): TrendRow[] {
  const ordered = [...totals].reverse()

  if (grouping === 'bulan') {
    return ordered.map(t => ({
      key: t.month,
      label: formatMonthLabel(t.month),
      linkMonth: t.month,
      cashIn: t.cashIn,
      payroll: t.payroll,
      operational: t.operational,
      netProfit: t.netProfit,
      projected: t.projected ?? false,
    }))
  }

  const byKey = new Map<string, TrendRow>()
  for (const t of ordered) {
    const { key, label } = semesterOf(t.month)
    const row = byKey.get(key) ?? {
      key, label, linkMonth: null, cashIn: 0, payroll: 0, operational: 0, netProfit: 0,
      projected: false,
    }
    row.cashIn += t.cashIn
    row.payroll += t.payroll
    row.operational += t.operational
    row.netProfit += t.netProfit
    if (t.projected) row.projected = true
    byKey.set(key, row)
  }
  // Urutan penyisipan Map mengikuti `ordered`, jadi semester terlama di atas.
  return [...byKey.values()]
}

/**
 * Bulan-bulan yang punya catatan keuangan, terbaru dulu. Dipakai tabel tren di
 * mode Semua Waktu supaya barisnya mengikuti umur data, bukan enam bulan tetap.
 */
export async function getActivityMonths(
  admin: SupabaseClient,
  max = 24,
): Promise<string[]> {
  const { payments, payslips, expenses } = await fetchFinanceRows(admin, null)
  const months = new Set<string>()
  for (const p of payments) months.add(monthOfTimestamp(p.paid_at))
  for (const ps of payslips) months.add(ps.pay_date.slice(0, 7))
  for (const e of expenses) months.add(e.incurred_on.slice(0, 7))
  return [...months].sort().reverse().slice(0, max)
}
