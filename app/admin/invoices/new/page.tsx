import { createAdminClient } from '@/lib/supabase/server-admin'
import InvoiceForm from '@/components/admin/invoices/InvoiceForm'

type StudentRow = {
  id: string
  full_name: string
  parent_name?: string | null
  class_id?: string | null
}

type ClassRow = {
  id: string
  name: string
  level: string | null
  class_type: string | null
  jenis: string | null
  start_date: string | null
  end_date: string | null
}

type ClassStudentRow = {
  class_id: string
  student_id: string
}

type BillingRateRow = {
  id: string
  class_type: string
  jenjang: string
  jenis: string
  amount: number
}

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>
}) {
  const { student_id: initialStudentId } = await searchParams
  const admin = createAdminClient()

  const [studentsRes, classesRes, classStudentsRes, billingRatesRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, parent_name')
      .eq('role', 'student')
      .order('full_name') as unknown as Promise<{ data: StudentRow[] | null }>,
    admin
      .from('classes')
      .select('id, name, level, class_type, jenis, start_date, end_date')
      .eq('is_active', true)
      .order('name') as unknown as Promise<{ data: ClassRow[] | null }>,
    admin
      .from('class_students')
      .select('class_id, student_id')
      .eq('is_active', true) as unknown as Promise<{ data: ClassStudentRow[] | null }>,
    admin
      .from('billing_rates')
      .select('id, class_type, jenjang, jenis, amount, billing_rate_periods!inner(is_active)')
      .eq('billing_rate_periods.is_active', true) as unknown as Promise<{ data: BillingRateRow[] | null }>,
  ])

  const students = studentsRes.data ?? []
  const classes = classesRes.data ?? []
  const classStudents = classStudentsRes.data ?? []
  const billingRates = billingRatesRes.data ?? []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/invoices" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
          ← Kembali
        </a>
        <h1 className="text-xl font-semibold text-gray-900">Buat Invoice</h1>
      </div>
      <InvoiceForm students={students} classes={classes} classStudents={classStudents} billingRates={billingRates} initialStudentId={initialStudentId} />
    </div>
  )
}
