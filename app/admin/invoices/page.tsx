import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import InvoicePageFilters from '@/components/admin/invoices/InvoicePageFilters'
import MetricCard from '@/components/dashboard/MetricCard'
import InvoiceEnrollmentTable from '@/components/admin/invoices/InvoiceEnrollmentTable'

type EnrollmentRow = {
  student_id: string
  class_id: string
  profiles: { full_name: string } | null
  classes: { name: string } | null
}

type InvoiceRow = {
  id: string
  student_id: string
  class_id: string | null
  total_due: number
  issued_at: string
  status: string
  payments: { amount: number }[]
}

const CLASS_STATUS_LABEL: Record<string, string> = {
  lunas:    'Lunas',
  angsuran: 'Angsuran',
  menunggu: 'Menunggu',
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function computeStatus(invoices: InvoiceRow[]): 'lunas' | 'angsuran' | 'menunggu' {
  if (invoices.length === 0) return 'menunggu'
  const classPrice = invoices[invoices.length - 1].total_due
  const latestInv = invoices[0]
  const latestPaid = latestInv.status === 'paid'
    ? latestInv.total_due
    : latestInv.payments.reduce((s, p) => s + p.amount, 0)
  const kekurangan = Math.max(0, latestInv.total_due - latestPaid)
  if (kekurangan === 0 && classPrice > 0) return 'lunas'
  if (latestPaid > 0 || kekurangan < classPrice) return 'angsuran'
  return 'menunggu'
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q = '', status: statusFilter = '' } = await searchParams
  const admin = createAdminClient()

  const [enrollmentsRes, invoicesRes] = await Promise.all([
    admin
      .from('class_students')
      .select('student_id, class_id, profiles!student_id(full_name), classes!class_id(name)')
      .eq('is_active', true)
      .order('profiles(full_name)') as unknown as Promise<{ data: EnrollmentRow[] | null }>,
    admin
      .from('invoices')
      .select('id, student_id, class_id, total_due, issued_at, status, invoice_payments(amount)')
      .not('student_id', 'is', null)
      .order('issued_at', { ascending: false })
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: (InvoiceRow & { invoice_payments: { amount: number }[] })[] | null }>,
  ])

  const enrollments = enrollmentsRes.data ?? []

  // Normalize invoices: attach payments
  const invoices: InvoiceRow[] = (invoicesRes.data ?? []).map(inv => ({
    ...inv,
    class_id: inv.class_id,
    payments: inv.invoice_payments ?? [],
  }))

  // Group invoices by student+class
  const invoiceMap = new Map<string, InvoiceRow[]>()
  for (const inv of invoices) {
    const key = `${inv.student_id}__${inv.class_id ?? ''}`
    if (!invoiceMap.has(key)) invoiceMap.set(key, [])
    invoiceMap.get(key)!.push(inv)
  }

  // Build rows
  type Row = {
    studentId: string
    studentName: string
    classId: string
    className: string
    classPrice: number
    kekurangan: number
    status: 'lunas' | 'angsuran' | 'menunggu'
  }

  const allRows: Row[] = enrollments.map(e => {
    const key = `${e.student_id}__${e.class_id}`
    const invs = invoiceMap.get(key) ?? []
    const classPrice = invs.length > 0 ? invs[invs.length - 1].total_due : 0
    const latestInv = invs[0]
    const latestPaid = latestInv?.status === 'paid'
      ? latestInv.total_due
      : (latestInv?.payments.reduce((s, p) => s + p.amount, 0) ?? 0)
    const kekurangan = latestInv ? Math.max(0, latestInv.total_due - latestPaid) : 0
    return {
      studentId: e.student_id,
      studentName: e.profiles?.full_name ?? '—',
      classId: e.class_id,
      className: e.classes?.name ?? '—',
      classPrice,
      kekurangan,
      status: computeStatus(invs),
    }
  })

  // Filters
  let rows = allRows
  if (q) {
    const lq = q.toLowerCase()
    rows = rows.filter(r => r.studentName.toLowerCase().includes(lq) || r.className.toLowerCase().includes(lq))
  }
  if (statusFilter) {
    rows = rows.filter(r => r.status === statusFilter)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Tagihan & Pembayaran</h1>
        <Link
          href="/admin/invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Invoice
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        {(['menunggu', 'angsuran', 'lunas'] as const).map(s => {
          const filtered = allRows.filter(r => r.status === s)
          const count = filtered.length
          const total = s === 'angsuran'
            ? filtered.reduce((sum, r) => sum + r.kekurangan, 0)
            : filtered.reduce((sum, r) => sum + r.classPrice, 0)
          return (
            <MetricCard
              key={s}
              label={CLASS_STATUS_LABEL[s]}
              value={formatRupiah(total)}
              sub={`${count} siswa`}
            />
          )
        })}
      </div>

      {/* Search + filter */}
      <InvoicePageFilters q={q} statusFilter={statusFilter} />

      {/* Table */}
      <InvoiceEnrollmentTable rows={rows} />
    </div>
  )
}
