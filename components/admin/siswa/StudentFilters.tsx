'use client'

import { useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  status: string
  jenjang: string
  grade: string
  sort: string
  q: string
  activeFilter: string
}

export default function StudentFilters({ status, jenjang, grade, sort, q, activeFilter }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(q)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(overrides: Record<string, string>) {
    const params: Record<string, string> = {
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
      ...(jenjang ? { jenjang } : {}),
      ...(grade ? { grade } : {}),
      ...(sort ? { sort } : {}),
      ...(activeFilter ? { activeFilter } : {}),
      ...overrides,
    }
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
    const qs = new URLSearchParams(params).toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleSearch(v: string) {
    setSearchValue(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params: Record<string, string> = {
        ...(v ? { q: v } : {}),
        ...(status ? { status } : {}),
        ...(jenjang ? { jenjang } : {}),
        ...(grade ? { grade } : {}),
        ...(sort ? { sort } : {}),
        ...(activeFilter ? { activeFilter } : {}),
      }
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
      const qs = new URLSearchParams(params).toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    }, 300)
  }

  const hasActiveFilter = !!(q || status || jenjang || grade || sort || activeFilter)

  const statusOptions = [
    { label: 'Semua Status', value: '' },
    { label: 'Aktif', value: 'aktif' },
    { label: 'Menunggu', value: 'menunggu' },
    { label: 'Non-aktif', value: 'non-aktif' },
  ]

  const jenjangOptions = [
    { label: 'Semua Jenjang', value: '' },
    { label: 'Calistung', value: 'Calistung' },
    { label: 'SD', value: 'SD' },
    { label: 'SMP', value: 'SMP' },
    { label: 'SMA', value: 'SMA' },
    { label: 'Umum', value: 'Umum' },
  ]

  const gradeRanges: Record<string, number[]> = {
    SD: [1, 2, 3, 4, 5, 6],
    SMP: [7, 8, 9],
    SMA: [10, 11, 12],
  }

  const gradeNums = jenjang && gradeRanges[jenjang]
    ? gradeRanges[jenjang]
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  const gradeLabel = (n: number) => {
    if (n <= 6) return `SD Kelas ${n}`
    if (n <= 9) return `SMP Kelas ${n - 6}`
    return `SMA Kelas ${n - 9}`
  }

  const showGradeFilter = !jenjang || !!gradeRanges[jenjang]

  function selectCls(active: boolean) {
    return `text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      active ? 'border-blue-500 text-blue-700' : 'border-gray-200 text-gray-700'
    }`
  }

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Cari nama siswa..."
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => handleSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <select value={status} onChange={(e) => router.push(buildUrl({ status: e.target.value, activeFilter: '' }))} className={selectCls(!!status)}>
        {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select value={jenjang} onChange={(e) => router.push(buildUrl({ jenjang: e.target.value, grade: '' }))} className={selectCls(!!jenjang)}>
        {jenjangOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {showGradeFilter && (
        <select value={grade} onChange={(e) => router.push(buildUrl({ grade: e.target.value }))} className={selectCls(!!grade)}>
          <option value="">Semua Kelas</option>
          {gradeNums.map(n => (
            <option key={n} value={String(n)}>
              {jenjang && gradeRanges[jenjang]
                ? `Kelas ${n - (jenjang === 'SMP' ? 6 : jenjang === 'SMA' ? 9 : 0)}`
                : gradeLabel(n)
              }
            </option>
          ))}
        </select>
      )}

      {hasActiveFilter && (
        <a href="/admin/siswa" className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
          Reset
        </a>
      )}
    </div>
  )
}
