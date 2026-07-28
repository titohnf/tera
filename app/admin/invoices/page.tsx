import { createAdminClient } from '@/lib/supabase/server-admin'
import InvoicePageFilters from '@/components/admin/invoices/InvoicePageFilters'
import MetricCard from '@/components/dashboard/MetricCard'
import InvoiceEnrollmentTable from '@/components/admin/invoices/InvoiceEnrollmentTable'

type EnrollmentRow = {
  student_id: string
  class_id: string
  profiles: { full_name: string } | null
  classes: { name: string; class_type: string | null; semester: number | null; academic_year: string | null } | null
}

type InvoiceRow = {
  id: string
  student_id: string
  class_id: string | null
  total_due: number
  issued_at: string
  status: string
  payments: { amount: number; paid_at: string }[]
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

// belum_terkirim: no invoice yet, or one exists but is still a draft
// (parent hasn't received anything). menunggu: invoice was sent but
// nothing paid yet — distinct from belum_terkirim so admins can tell
// "haven't billed them" apart from "billed, waiting on payment".
//
// Driven entirely by the most recent invoice's own status (set
// authoritatively by recordPayment/deletePayment) rather than comparing
// against an older invoice's total — a class can now have several
// genuinely independent invoices (e.g. one per month), so an older
// invoice's total is no longer a meaningful "canonical class price".
function computeStatus(invoices: InvoiceRow[]): 'lunas' | 'angsuran' | 'menunggu' | 'belum_terkirim' {
  if (invoices.length === 0) return 'belum_terkirim'
  const latestInv = invoices[0]
  if (latestInv.status === 'draft') return 'belum_terkirim'
  if (latestInv.status === 'paid') return 'lunas'
  if (latestInv.status === 'partially_paid') return 'angsuran'
  return 'menunggu'
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; semester?: string; tahunAjaran?: string }>
}) {
  const { q = '', status: statusFilter = '', semester: semesterFilter = '', tahunAjaran: tahunAjaranFilter = '' } = await searchParams
  const admin = createAdminClient()

  const [enrollmentsRes, invoicesRes] = await Promise.all([
    admin
      .from('class_students')
      .select('student_id, class_id, profiles!student_id(full_name), classes!class_id(name, class_type, semester, academic_year)')
      .eq('is_active', true)
      .order('profiles(full_name)') as unknown as Promise<{ data: EnrollmentRow[] | null }>,
    admin
      .from('invoices')
      .select('id, student_id, class_id, total_due, issued_at, status, invoice_payments(amount, paid_at)')
      .not('student_id', 'is', null)
      .order('issued_at', { ascending: false })
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: (InvoiceRow & { invoice_payments: { amount: number; paid_at: string }[] })[] | null }>,
  ])

  // Yayasan classes never get invoiced (see generateInvoice's rejection in
  // lib/actions/admin/invoices.ts) — keep their students off this list too.
  const enrollments = (enrollmentsRes.data ?? []).filter(e => e.classes?.class_type !== 'yayasan')

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
    totalPaid: number
    status: 'lunas' | 'angsuran' | 'menunggu' | 'belum_terkirim'
    invoiceId: string | null
    bulanLabel: string
    hasExisting: boolean
    semester: number | null
    academicYear: string | null
    lastPaymentMonth: string | null
  }

  const allRows: Row[] = enrollments.map(e => {
    const key = `${e.student_id}__${e.class_id}`
    const invs = invoiceMap.get(key) ?? []
    // Total Invoice / Dibayar / Belum Dibayar must stay internally
    // consistent (Total Invoice − Belum Dibayar = Dibayar), so all three
    // are derived from the SAME set of invoices (every non-cancelled
    // invoice for this student+class, not just the latest) — otherwise
    // deleting a payment on an older invoice moves "Dibayar" without
    // moving "Belum Dibayar", which looks like the totals are out of sync.
    const billedInvs = invs.filter(inv => inv.status !== 'cancelled')
    const classPrice = billedInvs.reduce((sum, inv) => sum + inv.total_due, 0)
    const totalPaid = billedInvs.reduce((sum, inv) => sum + inv.payments.reduce((s, p) => s + p.amount, 0), 0)
    const kekurangan = Math.max(0, classPrice - totalPaid)
    const activeInv = invs.find(inv => inv.status === 'sent' || inv.status === 'partially_paid')

    // Month of the most recent payment actually recorded, for the
    // "Angsuran {bulan}" label — ground truth from paid_at, not a
    // theoretical mapping onto the per-month breakdown.
    const allRowPayments = invs.flatMap(inv => inv.payments)
    const lastPayment = allRowPayments.length > 0
      ? allRowPayments.reduce((latest, p) => new Date(p.paid_at) > new Date(latest.paid_at) ? p : latest)
      : null
    const lastPaymentMonth = lastPayment
      ? new Date(lastPayment.paid_at).toLocaleDateString('id-ID', { month: 'long' })
      : null

    return {
      studentId: e.student_id,
      studentName: e.profiles?.full_name ?? '—',
      classId: e.class_id,
      className: e.classes?.name ?? '—',
      classPrice,
      kekurangan,
      totalPaid,
      status: computeStatus(invs),
      invoiceId: activeInv?.id ?? null,
      bulanLabel: activeInv ? new Date(activeInv.issued_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '',
      hasExisting: invs.length > 0,
      semester: e.classes?.semester ?? null,
      academicYear: e.classes?.academic_year ?? null,
      lastPaymentMonth,
    }
  })

  // Distinct filter options, sorted
  const semesterOptions = [...new Set(allRows.map(r => r.semester).filter((s): s is number => s !== null))].sort((a, b) => a - b)
  const tahunAjaranOptions = [...new Set(allRows.map(r => r.academicYear).filter((y): y is string => !!y))].sort()

  // Filters
  let rows = allRows
  if (q) {
    const lq = q.toLowerCase()
    rows = rows.filter(r => r.studentName.toLowerCase().includes(lq) || r.className.toLowerCase().includes(lq))
  }
  if (statusFilter) {
    rows = rows.filter(r => r.status === statusFilter)
  }
  if (semesterFilter) {
    rows = rows.filter(r => String(r.semester ?? '') === semesterFilter)
  }
  if (tahunAjaranFilter) {
    rows = rows.filter(r => r.academicYear === tahunAjaranFilter)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Invoice</h1>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        {(() => {
          const invoicedRows = allRows.filter(r => r.hasExisting)
          const totalInvoice = invoicedRows.reduce((sum, r) => sum + r.classPrice, 0)
          const totalKekurangan = invoicedRows.reduce((sum, r) => sum + r.kekurangan, 0)
          const totalDibayar = invoicedRows.reduce((sum, r) => sum + r.totalPaid, 0)
          const belumLunasCount = invoicedRows.filter(r => r.kekurangan > 0).length
          return (
            <>
              <MetricCard label="Total Invoice" value={formatRupiah(totalInvoice)} sub={`${invoicedRows.length} siswa`} />
              <MetricCard label="Dibayar" value={formatRupiah(totalDibayar)} valueColor="text-green-600" />
              <MetricCard label="Belum Dibayar" value={formatRupiah(totalKekurangan)} valueColor="text-red-600" sub={`${belumLunasCount} siswa`} />
            </>
          )
        })()}
      </div>

      {/* Search + filter */}
      <InvoicePageFilters
        q={q}
        statusFilter={statusFilter}
        semesterFilter={semesterFilter}
        tahunAjaranFilter={tahunAjaranFilter}
        semesterOptions={semesterOptions}
        tahunAjaranOptions={tahunAjaranOptions}
      />

      {/* Table */}
      <InvoiceEnrollmentTable rows={rows} />
    </div>
  )
}
