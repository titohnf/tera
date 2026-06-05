'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: '',         label: 'Semua Status' },
  { value: 'active',   label: 'Aktif' },
  { value: 'idle',     label: 'Idle' },
  { value: 'inactive', label: 'Tidak Aktif' },
]

export default function TutorSearchFilter({
  q,
  status,
  sort,
  dir,
}: {
  q: string
  status: string
  sort: string
  dir: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(q)

  function navigate(newQ: string, newStatus: string) {
    const params = new URLSearchParams()
    if (newQ) params.set('q', newQ)
    if (newStatus) params.set('status', newStatus)
    if (sort) params.set('sort', sort)
    if (dir && dir !== 'asc') params.set('dir', dir)
    router.push(`/admin/tutor?${params}`)
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); navigate(search, status) }}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau email tutor..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>
      <select
        value={status}
        onChange={e => navigate(search, e.target.value)}
        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </form>
  )
}
