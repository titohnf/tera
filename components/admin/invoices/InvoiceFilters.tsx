'use client'

import { useRouter } from 'next/navigation'

interface Props {
  q: string
  statusFilter: string
  month?: string
}

const FILTER_OPTIONS = [
  { label: 'Semua',         value: '' },
  { label: 'Overdue',       value: 'overdue' },
  { label: 'Belum Dibayar', value: 'unpaid' },
  { label: 'Draft',         value: 'draft' },
  { label: 'Lunas',         value: 'paid' },
]

export default function InvoiceFilters({ q, statusFilter, month = '' }: Props) {
  const router = useRouter()

  function buildUrl(newStatus: string, newQ?: string) {
    const params = new URLSearchParams()
    const search = newQ !== undefined ? newQ : q
    if (month) params.set('month', month)
    if (search) params.set('q', search)
    if (newStatus) params.set('status', newStatus)
    const qs = params.toString()
    return qs ? `/admin/invoices?${qs}` : '/admin/invoices'
  }

  const resetUrl = month ? `/admin/invoices?month=${month}` : '/admin/invoices'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          defaultValue={q}
          placeholder="Cari nama siswa..."
          onChange={(e) => {
            const v = e.target.value
            clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>)._invoiceSearchTimer)
            ;(window as unknown as Record<string, ReturnType<typeof setTimeout>>)._invoiceSearchTimer = setTimeout(() => {
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
        {FILTER_OPTIONS.map(opt => (
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
