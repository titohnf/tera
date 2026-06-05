'use client'

import { useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  q: string
  level: string
  type: string
  status: string
  availableLevels: string[]
}

export default function ClassFilters({ q, level, type, status, availableLevels }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(q)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(overrides: Record<string, string>) {
    const params: Record<string, string> = {
      ...(q ? { q } : {}),
      ...(level ? { level } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...overrides,
    }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const qs = new URLSearchParams(params).toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleSearch(v: string) {
    setSearchValue(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      router.push(buildUrl({ q: v }))
    }, 300)
  }

  const hasFilter = !!(q || level || type || status)

  const selectCls = (active: boolean) =>
    `text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      active ? 'border-blue-500 text-blue-700' : 'border-gray-200 text-gray-700'
    }`

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Cari nama kelas..."
          className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        />
        {searchValue && (
          <button type="button" onClick={() => handleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <select value={level} onChange={e => router.push(buildUrl({ level: e.target.value }))} className={selectCls(!!level)}>
        <option value="">Semua Jenjang</option>
        {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
      </select>

      <select value={type} onChange={e => router.push(buildUrl({ type: e.target.value }))} className={selectCls(!!type)}>
        <option value="">Semua Tipe</option>
        <option value="group">Reguler</option>
        <option value="private">Privat</option>
      </select>

      <select value={status} onChange={e => router.push(buildUrl({ status: e.target.value }))} className={selectCls(!!status)}>
        <option value="">Semua Status</option>
        <option value="aktif">Aktif</option>
        <option value="selesai">Selesai</option>
      </select>

      {hasFilter && (
        <a href="/admin/classes" className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
          Reset
        </a>
      )}
    </div>
  )
}
