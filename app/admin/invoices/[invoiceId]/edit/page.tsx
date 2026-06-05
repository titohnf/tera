import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import InvoiceEditPageForm from '@/components/admin/invoices/InvoiceEditPageForm'

export default async function InvoiceEditPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>
}) {
  const { invoiceId } = await params
  const admin = createAdminClient()

  const [invoiceRes, classesRes, studentsRes] = await Promise.all([
    admin.from('invoices').select('*').eq('id', invoiceId).single() as unknown as Promise<{ data: Record<string, unknown> | null }>,
    admin.from('classes').select('id, name, level').eq('is_active', true).order('name') as unknown as Promise<{ data: { id: string; name: string; level: string | null }[] | null }>,
    admin.from('profiles').select('id, full_name').eq('role', 'student').order('full_name') as unknown as Promise<{ data: { id: string; full_name: string }[] | null }>,
  ])

  if (!invoiceRes.data) notFound()

  return (
    <div className="space-y-5">
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
          <h1 className="text-xl font-semibold text-gray-900">Edit Invoice</h1>
          <p className="text-sm text-gray-400">{invoiceRes.data.invoice_number as string}</p>
        </div>
      </div>

      <InvoiceEditPageForm
        invoice={invoiceRes.data}
        classes={classesRes.data ?? []}
        students={studentsRes.data ?? []}
      />
    </div>
  )
}
