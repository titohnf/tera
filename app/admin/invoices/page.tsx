import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import MetricCard from '@/components/dashboard/MetricCard'
import InvoiceFilters from '@/components/admin/invoices/InvoiceFilters'

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

const STATUS_LABEL: Record<string, string> = {
  overdue:       'Overdue',
  draft:         'Draft',
  sent:          'Terkirim',
  unpaid:        'Belum Dibayar',
  paid:          'Lunas',
  cancelled:     'Dibatalkan',
}

const STATUS_BADGE: Record<string, string> = {
  overdue:       'bg-red-100 text-red-700',
  draft:         'bg-gray-100 text-gray-500',
  sent:          'bg-blue-100 text-blue-700',
  unpaid:        'bg-yellow-100 text-yellow-700',
  paid:          'bg-green-100 text-green-700',
  cancelled:     'bg-gray-100 text-gray-400',
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q = '', status: statusFilter = '' } = await searchParams
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: rawInvoices },
    { data: paidInvoices },
    { count: activeStudentCount },
  ] = await Promise.all([
    admin
      .from('invoices')
      .select('id, student_id, class_id, invoice_number, total_due, issued_at, due_date, status, profiles!student_id(full_name), classes!class_id(name)')
      .not('student_id', 'is', null)
      .order('issued_at', { ascending: false })
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: InvoiceRow[] | null }>,
    admin
      .from('invoices')
      .select('total_due')
      .eq('status', 'paid') as unknown as Promise<{ data: { total_due: number }[] | null }>,
    admin
      .from('class_students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  const allInvoices = rawInvoices ?? []

  const revenuePaid = (paidInvoices ?? []).reduce((s, i) => s + (i.total_due ?? 0), 0)
  const revenuePerSiswa = (activeStudentCount ?? 0) > 0
    ? Math.round(revenuePaid / (activeStudentCount ?? 1))
    : 0

  // Derived effective status (overdue supersedes sent/unpaid)
  function effectiveStatus(inv: InvoiceRow): string {
    if (inv.status !== 'paid' && inv.status !== 'cancelled' && inv.due_date && inv.due_date < today) {
      return 'overdue'
    }
    return inv.status
  }

  // Summary metrics
  const overdueList = allInvoices.filter(i => effectiveStatus(i) === 'overdue')
  const overdueAmount = overdueList.reduce((s, i) => s + (i.total_due ?? 0), 0)
  const overdueStudentCount = new Set(overdueList.map(i => i.student_id)).size
  const pendingList = allInvoices.filter(i => i.status === 'sent' || i.status === 'unpaid')
  const pendingAmount = pendingList.reduce((s, i) => s + (i.total_due ?? 0), 0)
  const draftCount = allInvoices.filter(i => i.status === 'draft').length

  // Filter
  let filtered = allInvoices

  if (q) {
    const lq = q.toLowerCase()
    filtered = filtered.filter(i => i.profiles?.full_name?.toLowerCase().includes(lq))
  }

  if (statusFilter) {
    filtered = filtered.filter(i => effectiveStatus(i) === statusFilter)
  }

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
          label="Draft"
          value={draftCount}
          sub={draftCount > 0 ? `${draftCount} belum dikirim` : undefined}
        />
        <MetricCard label="Total Invoice" value={allInvoices.length} />
        <MetricCard
          label="Total Revenue"
          value={formatRupiah(revenuePaid)}
          sub={(paidInvoices ?? []).length > 0 ? `${(paidInvoices ?? []).length} invoice lunas` : undefined}
        />
        <MetricCard
          label="Revenue / Siswa"
          value={revenuePerSiswa > 0 ? formatRupiah(revenuePerSiswa) : '—'}
          tooltip="Total revenue lunas dibagi jumlah siswa aktif"
        />
      </div>

      {/* Search + Filter */}
      <InvoiceFilters q={q} statusFilter={statusFilter} />

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            {(q || statusFilter) ? `Menampilkan ${filtered.length} dari ${allInvoices.length} invoice` : `${allInvoices.length} Invoice`}
          </h2>
        </div>

        {filtered.length === 0 ? (
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
                        <Link href={`/admin/invoices/${inv.id}`} className="block text-xs font-mono text-gray-500">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Link href={`/admin/invoices/${inv.id}`} className="block text-xs text-gray-500">
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
                          <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[effStatus] ?? 'bg-gray-100 text-gray-500'}`}>
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
