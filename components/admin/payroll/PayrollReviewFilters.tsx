'use client'

import { useRouter } from 'next/navigation'

type Option = { value: string; label: string }

const STATUS_OPTIONS: Option[] = [
  { value: 'pending',    label: 'Menunggu Review' },
  { value: 'incomplete', label: 'Jurnal Belum Lengkap' },
  { value: 'rejected',   label: 'Ditolak' },
  { value: 'approved',   label: 'Disetujui' },
  { value: '',           label: 'Semua Status' },
]

export default function PayrollReviewFilters({
  monthOptions,
  month,
  status,
}: {
  monthOptions: Option[]
  month: string
  status: string
}) {
  const router = useRouter()

  function push(nextMonth: string, nextStatus: string) {
    const params = new URLSearchParams()
    params.set('month', nextMonth)
    if (nextStatus) params.set('status', nextStatus)
    router.push(`/admin/payroll-review?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={month}
        onChange={e => push(e.target.value, status)}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {monthOptions.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <select
        value={status}
        onChange={e => push(month, e.target.value)}
        className={`text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          status ? 'border-blue-500 text-blue-700' : 'border-slate-200 text-gray-700'
        }`}
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
