import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import MetricCard from '@/components/dashboard/MetricCard'
import InvoiceFilters from '@/components/admin/invoices/InvoiceFilters'
import GenerateDraftButton from '@/components/admin/GenerateDraftButton'
import StudentInvoiceTable, { type StudentGroup } from '@/components/admin/invoices/StudentInvoiceAccordion'
import { generateDraftInvoices } from '@/lib/actions/admin/invoices'

type InvoiceRow = {
  id: string
  student_id: string
  class_id: string | null
  invoice_number: string
  total_due: number
  issued_at: string
  due_date: string | null
  status: string
  profiles: { full_name: string } | null
  classes: { name: string } | null
}

type PaymentRow = {
  id: string
  invoice_id: string
  amount: number
  paid_at: string
}

const STATUS_LABEL: Record<string, string> = {
  overdue:          'Overdue',
  draft:            'Draft',
  sent:             'Terkirim',
  partially_paid:   'Sebagian Terbayar',
  paid:             'Lunas',
}

const STATUS_BADGE: Record<string, string> = {
  overdue:          'bg-red-100 text-red-700',
  draft:            'bg-gray-100 text-gray-500',
  sent:             'bg-blue-100 text-blue-700',
  partially_paid:   'bg-yellow-100 text-yellow-700',
  paid:             'bg-green-100 text-green-700',
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function monthUrl(base: URLSearchParams, month: string) {
  const p = new URLSearchParams(base)
  if (month) p.set('month', month)
  else p.delete('month')
  p.delete('q')
  p.delete('status')
  return `/admin/invoices?${p.toString()}`
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; month?: string }>
}) {
  const { q = '', status: statusFilter = '', month = '' } = await searchParams
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const currentYear = new Date().getFullYear()
  const currentMonth = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const activeMonth = month || currentMonth
  const activeMonthLabel = (() => {
    const [y, m] = activeMonth.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  })()

  const [{ data: rawInvoices }, { count: activeStudentCount }, { data: rawPayments }] = await Promise.all([
    admin
      .from('invoices')
      .select('id, student_id, class_id, invoice_number, total_due, issued_at, due_date, status, profiles!student_id(full_name), classes!class_id(name)')
      .not('student_id', 'is', null)
      .order('issued_at', { ascending: false })
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: InvoiceRow[] | null }>,
    admin
      .from('class_students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    admin
      .from('invoice_payments')
      .select('id, invoice_id, amount, paid_at')
      .order('paid_at', { ascending: true }) as unknown as Promise<{ data: PaymentRow[] | null }>,
  ])

  const allInvoices = rawInvoices ?? []
  const allPayments = rawPayments ?? []

  // Build a map: invoiceId → payments
  const paymentsByInvoice = new Map<string, PaymentRow[]>()
  for (const p of allPayments) {
    if (!paymentsByInvoice.has(p.invoice_id)) paymentsByInvoice.set(p.invoice_id, [])
    paymentsByInvoice.get(p.invoice_id)!.push(p)
  }

  function effectiveStatus(inv: InvoiceRow): string {
    if (inv.status !== 'paid' && inv.status !== 'cancelled' && inv.due_date && inv.due_date < today) {
      return 'overdue'
    }
    return inv.status
  }

  // Month tabs: Jan–Des for current year
  const monthTabs = MONTH_LABELS.map((label, i) => ({
    label,
    value: `${currentYear}-${String(i + 1).padStart(2, '0')}`,
  }))

  // Apply month filter to compute stats
  const statsBase = month
    ? allInvoices.filter(i => i.issued_at?.startsWith(month))
    : allInvoices

  const revenuePaid       = statsBase.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_due ?? 0), 0)
  const paidCount         = statsBase.filter(i => i.status === 'paid').length
  const overdueList       = statsBase.filter(i => effectiveStatus(i) === 'overdue')
  const overdueAmount     = overdueList.reduce((s, i) => s + (i.total_due ?? 0), 0)
  const overdueStudentCount = new Set(overdueList.map(i => i.student_id)).size
  const pendingList       = statsBase.filter(i => i.status === 'sent' || i.status === 'partially_paid')
  const pendingAmount     = pendingList.reduce((s, i) => s + (i.total_due ?? 0), 0)
  const partialCount      = statsBase.filter(i => i.status === 'partially_paid').length
  const revenuePerSiswa   = (activeStudentCount ?? 0) > 0 ? Math.round(revenuePaid / (activeStudentCount ?? 1)) : 0

  // Apply all filters
  let filtered = month
    ? allInvoices.filter(i => i.issued_at?.startsWith(month))
    : allInvoices

  if (q) {
    const lq = q.toLowerCase()
    filtered = filtered.filter(i => i.profiles?.full_name?.toLowerCase().includes(lq))
  }
  if (statusFilter) {
    filtered = filtered.filter(i => effectiveStatus(i) === statusFilter)
  }

  // Build student groups for the "Semua" tab
  const studentGroups: StudentGroup[] = (() => {
    if (month) return []
    const map = new Map<string, StudentGroup>()
    for (const inv of filtered) {
      const sid = inv.student_id
      const name = inv.profiles?.full_name ?? '(tanpa nama)'
      if (!map.has(sid)) map.set(sid, { studentId: sid, studentName: name, invoices: [] })
      map.get(sid)!.invoices.push({
        id: inv.id,
        invoice_number: inv.invoice_number,
        class_name: inv.classes?.name ?? null,
        total_due: inv.total_due,
        issued_at: inv.issued_at,
        due_date: inv.due_date,
        eff_status: effectiveStatus(inv),
        payments: paymentsByInvoice.get(inv.id) ?? [],
      })
    }
    return Array.from(map.values()).sort((a, b) => a.studentName.localeCompare(b.studentName, 'id'))
  })()

  const baseParams = new URLSearchParams()
  if (month) baseParams.set('month', month)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Invoice</h1>
        <Link
          href="/admin/invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Manual
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Tagihan Overdue"
          value={overdueStudentCount}
          sub={overdueStudentCount > 0 ? formatRupiah(overdueAmount) : undefined}
        />
        <MetricCard
          label="Belum Dibayar"
          value={formatRupiah(pendingAmount)}
          sub={pendingList.length > 0 ? `${pendingList.length} invoice` : undefined}
        />
        <MetricCard
          label="Sebagian Terbayar"
          value={partialCount}
          sub={partialCount > 0 ? `${partialCount} invoice` : undefined}
        />
        <MetricCard label="Total Invoice" value={statsBase.length} />
        <MetricCard
          label="Total Revenue"
          value={formatRupiah(revenuePaid)}
          sub={paidCount > 0 ? `${paidCount} invoice lunas` : undefined}
        />
        <MetricCard
          label="Revenue / Siswa"
          value={revenuePerSiswa > 0 ? formatRupiah(revenuePerSiswa) : '—'}
          tooltip="Total revenue lunas dibagi jumlah siswa aktif"
        />
      </div>

      {/* Monthly tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex overflow-x-auto">
          {/* Semua */}
          <Link
            href={monthUrl(new URLSearchParams(), '')}
            className={`flex-none px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              !month
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50'
            }`}
          >
            Semua
          </Link>
          {monthTabs.map(tab => (
            <Link
              key={tab.value}
              href={monthUrl(new URLSearchParams(), tab.value)}
              className={`flex-none px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                month === tab.value
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Search + Filter */}
      <InvoiceFilters q={q} statusFilter={statusFilter} month={month} />

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            {!month
              ? (q || statusFilter)
                ? `${studentGroups.length} Siswa · ${filtered.length} invoice`
                : `${studentGroups.length} Siswa`
              : (q || statusFilter)
                ? `Menampilkan ${filtered.length} dari ${statsBase.length} invoice`
                : `${statsBase.length} Invoice`}
          </h2>
          {month && (
            <GenerateDraftButton
              month={activeMonth}
              monthLabel={activeMonthLabel}
              action={generateDraftInvoices}
            />
          )}
        </div>

        {!month ? (
          /* Tab Semua: tabel per siswa */
          <StudentInvoiceTable groups={studentGroups} />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10 px-5">Tidak ada invoice yang sesuai filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Siswa</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Kelas</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">No. Invoice</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Tanggal</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3 text-left">Tagihan</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(inv => {
                  const effStatus = effectiveStatus(inv)
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-5 py-3">
                        <Link href={`/admin/invoices/${inv.id}`} className="block">
                          <p className="font-medium text-gray-900">{inv.profiles?.full_name ?? '—'}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link href={`/admin/invoices/${inv.id}`} className="block text-gray-600 truncate max-w-[160px]">
                          {inv.classes?.name ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Link href={`/admin/invoices/${inv.id}`} className="block text-sm font-mono text-gray-500">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Link href={`/admin/invoices/${inv.id}`} className="block text-sm text-gray-500">
                          {formatDate(inv.issued_at)}
                          {inv.due_date && (
                            <span className="block text-gray-400">jatuh tempo {formatDate(inv.due_date)}</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/invoices/${inv.id}`} className="block font-semibold text-gray-900">
                          {formatRupiah(inv.total_due)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/invoices/${inv.id}`} className="block">
                          <span className={`inline-flex text-sm font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[effStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                            {STATUS_LABEL[effStatus] ?? effStatus}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/invoices/${inv.id}`} className="inline-block">
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
      </div>
    </div>
  )
}
