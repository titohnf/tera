import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import StudentClassInvoiceTable, { type ClassGroup } from '@/components/admin/invoices/StudentClassInvoiceTable'
import CreateInvoiceButton, { type GeneratableClass, type MonthlyInvoiceClass } from '@/components/admin/invoices/CreateInvoiceButton'

type InvoiceRow = {
  id: string
  invoice_number: string
  class_id: string | null
  total_due: number
  issued_at: string
  due_date: string | null
  status: string
  line_items: { period?: string }[]
  classes: { name: string; start_date: string | null; end_date: string | null } | null
}

type PaymentRow = {
  id: string
  invoice_id: string
  amount: number
  paid_at: string
  created_at: string
}

function effectiveStatus(inv: InvoiceRow, today: string): string {
  if (inv.status !== 'paid' && inv.status !== 'cancelled' && inv.due_date && inv.due_date < today) {
    return 'overdue'
  }
  return inv.status
}

export default async function StudentInvoiceDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const [profileRes, invoicesRes, enrollmentsRes] = await Promise.all([
    admin.from('profiles').select('id, full_name, nickname, parent_name, parent_phone').eq('id', studentId).single(),
    admin
      .from('invoices')
      .select('id, invoice_number, class_id, total_due, issued_at, due_date, status, line_items, classes!class_id(name, start_date, end_date)')
      .eq('student_id', studentId)
      .order('issued_at', { ascending: false })
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: InvoiceRow[] | null }>,
    admin
      .from('class_students')
      .select('class_id, classes!class_id(name, class_type)')
      .eq('student_id', studentId)
      .eq('is_active', true) as unknown as Promise<{ data: { class_id: string; classes: { name: string; class_type: string | null } | null }[] | null }>,
  ])

  if (!profileRes.data) notFound()

  const profile = profileRes.data
  const invoices = invoicesRes.data ?? []
  const invoiceIds = invoices.map(i => i.id)

  const { data: rawPayments } = invoiceIds.length > 0
    ? await (admin
        .from('invoice_payments')
        .select('id, invoice_id, amount, paid_at, created_at')
        .in('invoice_id', invoiceIds)
        .order('paid_at', { ascending: true })
        .order('created_at', { ascending: true }) as unknown as Promise<{ data: PaymentRow[] | null }>)
    : { data: [] as PaymentRow[] }

  const allPayments = rawPayments ?? []
  const paymentsByInvoice = new Map<string, PaymentRow[]>()
  for (const p of allPayments) {
    if (!paymentsByInvoice.has(p.invoice_id)) paymentsByInvoice.set(p.invoice_id, [])
    paymentsByInvoice.get(p.invoice_id)!.push(p)
  }

  // Group invoices by class
  const classMap = new Map<string, ClassGroup>()
  for (const inv of invoices) {
    const key = inv.class_id ?? '__no_class__'
    const className = inv.classes?.name ?? 'Tanpa Kelas'
    if (!classMap.has(key)) {
      classMap.set(key, {
        classId: inv.class_id,
        className,
        invoices: [],
        classStartDate: inv.classes?.start_date ?? null,
        classEndDate: inv.classes?.end_date ?? null,
      })
    }
    classMap.get(key)!.invoices.push({
      id: inv.id,
      invoice_number: inv.invoice_number,
      total_due: inv.total_due,
      issued_at: inv.issued_at,
      due_date: inv.due_date,
      status: inv.status,
      eff_status: effectiveStatus(inv, today),
      payments: paymentsByInvoice.get(inv.id) ?? [],
      isMonthly: inv.line_items.some(i => i.period),
    })
  }

  const groups = Array.from(classMap.values())

  // Add enrolled classes with no invoices as groups so they show in the table
  const enrollments = enrollmentsRes.data ?? []
  for (const enr of enrollments) {
    if (!classMap.has(enr.class_id)) {
      groups.push({ classId: enr.class_id, className: enr.classes?.name ?? 'Tanpa Nama', invoices: [] })
    }
  }

  // A class already has monthly-billed invoices once any of its line_items
  // carry a `period` (see generateMonthlyInvoiceForStudent).
  const monthlyClassIds = new Set(
    invoices.filter(inv => inv.line_items.some(i => i.period)).map(inv => inv.class_id).filter((id): id is string => !!id)
  )

  // Private classes the student is currently enrolled in bill monthly;
  // everything else (group/reguler classes) bills lump-sum per semester.
  // The billing model is derived from class_type, not chosen by the admin.
  const privateClassIds = new Set(
    enrollments.filter(e => e.classes?.class_type === 'private').map(e => e.class_id)
  )

  // Invoice Persemester — only non-private classes with no invoice yet.
  const generatableClasses: GeneratableClass[] = groups
    .filter(group =>
      group.invoices.length === 0
      && !(group.classId && monthlyClassIds.has(group.classId))
      && !(group.classId && privateClassIds.has(group.classId))
    )
    .map(group => ({
      classId: group.classId,
      className: group.className,
    }))
  const monthlyEligibleClasses: MonthlyInvoiceClass[] = groups
    .filter((group): group is ClassGroup & { classId: string } =>
      !!group.classId
      && privateClassIds.has(group.classId)
      && !(group.invoices.length > 0 && !monthlyClassIds.has(group.classId)) // no existing lump-sum invoice
    )
    .map(group => ({ classId: group.classId, className: group.className }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/invoices"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Riwayat Tagihan dan Pembayaran Siswa</h1>
            <p className="text-sm text-gray-500">{profile.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CreateInvoiceButton studentId={studentId} generatableClasses={generatableClasses} monthlyClasses={monthlyEligibleClasses} />
        </div>
      </div>

      <StudentClassInvoiceTable
        groups={groups}
        studentName={profile.full_name}
        studentNickname={(profile as { nickname?: string | null }).nickname ?? ''}
        parentPhone={(profile as { full_name: string; parent_name?: string | null; parent_phone?: string | null }).parent_phone ?? ''}
      />
    </div>
  )
}
