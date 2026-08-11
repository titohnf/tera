'use client'

import { useRouter } from 'next/navigation'

interface Props {
  q: string
  statusFilter: string
  month: string
  monthOptions: { value: string; label: string }[]
}

const STATUS_OPTIONS = [
  { label: 'Semua Status', value: '' },
  { label: 'Draft',        value: 'draft' },
  { label: 'Terkirim',     value: 'sent' },
  { label: 'Dibayar',      value: 'paid' },
]

export default function PayslipFilters({ q, statusFilter, month, monthOptions }: Props) {
  const router = useRouter()

  function buildUrl(newStatus: string, newQ?: string, newMonth?: string) {
    const params = new URLSearchParams()
    const activeMonth = newMonth ?? month
    if (activeMonth) params.set('month', activeMonth)
    const search = newQ !== undefined ? newQ : q
    if (search) params.set('q', search)
    if (newStatus) params.set('status', newStatus)
    return `/admin/payslips?${params.toString()}`
  }

  const resetUrl = `/admin/payslips?month=${month}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Bulan */}
      <select
        value={month}
        onChange={(e) => router.push(buildUrl(statusFilter, undefined, e.target.value))}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {monthOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          defaultValue={q}
          placeholder="Cari nama tutor..."
          onChange={(e) => {
            const v = e.target.value
            clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>)._payslipSearchTimer)
            ;(window as unknown as Record<string, ReturnType<typeof setTimeout>>)._payslipSearchTimer = setTimeout(() => {
              router.push(buildUrl(statusFilter, v))
            }, 300)
          }}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => router.push(buildUrl(e.target.value))}
        className={`text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          statusFilter ? 'border-blue-500 text-blue-700' : 'border-slate-200 text-gray-700'
        }`}
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {(q || statusFilter) && (
        <a
          href={resetUrl}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
        >
          Reset
        </a>
      )}
    </div>
  )
}
