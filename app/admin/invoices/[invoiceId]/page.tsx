import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import InvoiceDetailClient from '@/components/admin/invoices/InvoiceDetailClient'

type LineItem = {
  description: string
  months: number
  amount: number
  is_deduction: boolean
}

type InvoiceRow = {
  id: string
  invoice_number: string
  class_id: string | null
  student_id: string | null
  student_name: string
  parent_name: string
  line_items: LineItem[]
  total_due: number
  payment_method: string
  bank_account: string
  due_date: string | null
  issued_at: string
  status: string
  notes: string | null
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>
}) {
  const { invoiceId } = await params
  const admin = createAdminClient()

  const [invoiceRes, studentsRes, classesRes] = await Promise.all([
    admin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single() as unknown as Promise<{ data: InvoiceRow | null }>,
    admin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'student')
      .order('full_name') as unknown as Promise<{ data: { id: string; full_name: string }[] | null }>,
    admin
      .from('classes')
      .select('id, name, level')
      .eq('is_active', true)
      .order('name') as unknown as Promise<{ data: { id: string; name: string; level: string | null }[] | null }>,
  ])

  if (!invoiceRes.data) notFound()

  const invoice = invoiceRes.data

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/invoices" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
          ← Kembali
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Detail Invoice</h1>
      </div>

      <InvoiceDetailClient
        invoice={invoice}
        classes={classesRes.data ?? []}
        students={studentsRes.data ?? []}
      />
    </div>
  )
}
