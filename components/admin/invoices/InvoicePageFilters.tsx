'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  q: string
  statusFilter: string
  semesterFilter: string
  tahunAjaranFilter: string
  semesterOptions: number[]
  tahunAjaranOptions: string[]
}

export default function InvoicePageFilters({
  q,
  statusFilter,
  semesterFilter,
  tahunAjaranFilter,
  semesterOptions,
  tahunAjaranOptions,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/admin/invoices?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          defaultValue={q}
          placeholder="Cari siswa atau kelas..."
          onChange={e => update('q', e.target.value)}
          className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
        />
      </div>
      <select
        value={statusFilter}
        onChange={e => update('status', e.target.value)}
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <option value="">Semua Status</option>
        <option value="menunggu">Menunggu</option>
        <option value="angsuran">Angsuran</option>
        <option value="lunas">Lunas</option>
      </select>
      <select
        value={semesterFilter}
        onChange={e => update('semester', e.target.value)}
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <option value="">Semua Semester</option>
        {semesterOptions.map(s => (
          <option key={s} value={s}>Semester {s}</option>
        ))}
      </select>
      <select
        value={tahunAjaranFilter}
        onChange={e => update('tahunAjaran', e.target.value)}
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <option value="">Semua Tahun Ajaran</option>
        {tahunAjaranOptions.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
