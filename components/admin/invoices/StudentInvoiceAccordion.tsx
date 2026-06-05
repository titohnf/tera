import Link from 'next/link'

type Payment = {
  id: string
  amount: number
  paid_at: string
}

type InvoiceItem = {
  id: string
  invoice_number: string
  class_name: string | null
  total_due: number
  issued_at: string
  due_date: string | null
  eff_status: string
  payments: Payment[]
}

export type StudentGroup = {
  studentId: string
  studentName: string
  invoices: InvoiceItem[]
}

interface Props {
  groups: StudentGroup[]
}

const STATUS_BADGE: Record<string, string> = {
  lunas:    'bg-green-100 text-green-700',
  angsuran: 'bg-yellow-100 text-yellow-700',
  menunggu: 'bg-gray-100 text-gray-500',
  overdue:  'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  lunas:    'Lunas',
  angsuran: 'Angsuran',
  menunggu: 'Menunggu',
  overdue:  'Overdue',
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function computeStudentStatus(group: StudentGroup): string {
  const totalDue = group.invoices.reduce((s, i) => s + i.total_due, 0)
  const totalPaid = group.invoices.reduce(
    (s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0), 0
  )
  const hasOverdue = group.invoices.some(i => i.eff_status === 'overdue')

  if (totalPaid >= totalDue && totalDue > 0) return 'lunas'
  if (totalPaid > 0) return 'angsuran'
  if (hasOverdue) return 'overdue'
  return 'menunggu'
}

export default function StudentInvoiceTable({ groups }: Props) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-10 px-5">
        Tidak ada invoice yang sesuai filter.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="px-5 py-3 text-left">Nama Siswa</th>
            <th className="px-4 py-3 text-center hidden sm:table-cell">Jumlah Invoice</th>
            <th className="px-4 py-3 text-left hidden md:table-cell">Invoice Terakhir</th>
            <th className="px-4 py-3 text-right">Nilai Invoice</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {groups.map(group => {
            const latest = group.invoices[0]
            const totalDue = group.invoices.reduce((s, i) => s + i.total_due, 0)
            const status = computeStudentStatus(group)

            return (
              <tr key={group.studentId} className="hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="px-5 py-3">
                  <Link href={`/admin/invoices/siswa/${group.studentId}`} className="block">
                    <p className="font-medium text-gray-900">{group.studentName}</p>
                  </Link>
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <Link href={`/admin/invoices/siswa/${group.studentId}`} className="block text-gray-600">
                    {group.invoices.length}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Link href={`/admin/invoices/siswa/${group.studentId}`} className="block">
                    {latest ? (
                      <>
                        <p className="text-gray-700 font-mono text-xs">{latest.invoice_number}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{formatDate(latest.issued_at)}</p>
                      </>
                    ) : '—'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/invoices/siswa/${group.studentId}`} className="block font-semibold text-gray-900">
                    {formatRupiah(totalDue)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/invoices/siswa/${group.studentId}`} className="block">
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/invoices/siswa/${group.studentId}`} className="inline-block">
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
  )
}
