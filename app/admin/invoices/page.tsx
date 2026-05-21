import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import InvoiceStudentList, { type StudentGroup } from '@/components/admin/invoices/InvoiceStudentList'

export default async function InvoicesPage() {
  const admin = createAdminClient()

  const [enrollmentsRes, invoicesRes] = await Promise.all([
    admin
      .from('class_students')
      .select('student_id, class_id, profiles(full_name, parent_name), classes(name, level, class_type)')
      .eq('is_active', true) as unknown as Promise<{
        data: {
          student_id: string
          class_id: string
          profiles: { full_name: string; parent_name: string | null } | null
          classes: { name: string; level: string | null; class_type: string | null } | null
        }[] | null
      }>,
    admin
      .from('invoices')
      .select('id, student_id, class_id, invoice_number, total_due, issued_at, status, created_at')
      .not('student_id', 'is', null)
      .order('issued_at', { ascending: false })
      .order('created_at', { ascending: false }) as unknown as Promise<{
        data: {
          id: string
          student_id: string
          class_id: string | null
          invoice_number: string
          total_due: number
          issued_at: string
          status: string
          created_at: string
        }[] | null
      }>,
  ])

  const invoices = invoicesRes.data ?? []

  // Latest invoice per student+class for action buttons
  const latestInvoiceMap = new Map<string, { id: string; total_due: number; issued_at: string; status: string }>()
  for (const inv of invoices) {
    if (!inv.class_id) continue
    const key = `${inv.student_id}:${inv.class_id}`
    if (!latestInvoiceMap.has(key)) {
      latestInvoiceMap.set(key, { id: inv.id, total_due: inv.total_due, issued_at: inv.issued_at, status: inv.status })
    }
  }

  // Group enrollments by student
  const studentMap = new Map<string, StudentGroup>()

  for (const e of (enrollmentsRes.data ?? [])) {
    if (!e.profiles || !e.classes) continue
    const sid = e.student_id

    if (!studentMap.has(sid)) {
      studentMap.set(sid, {
        student_id: sid,
        student_name: e.profiles.full_name,
        parent_name: e.profiles.parent_name,
        enrollments: [],
        invoices: [],
      })
    }

    const group = studentMap.get(sid)!
    const invKey = `${sid}:${e.class_id}`
    const latest = latestInvoiceMap.get(invKey)

    group.enrollments.push({
      class_id: e.class_id,
      class_name: e.classes.name,
      class_level: e.classes.level,
      class_type: e.classes.class_type,
      latest_invoice_id: latest?.id ?? null,
      latest_invoice_total: latest?.total_due ?? null,
      latest_invoice_date: latest?.issued_at ?? null,
      latest_invoice_status: latest?.status ?? null,
    })
  }

  // Assign invoices to each student group
  for (const inv of invoices) {
    const group = studentMap.get(inv.student_id)
    if (group) group.invoices.push(inv)
  }

  const groups = Array.from(studentMap.values())
    .sort((a, b) => a.student_name.localeCompare(b.student_name, 'id'))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
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

      <InvoiceStudentList groups={groups} />
    </div>
  )
}
