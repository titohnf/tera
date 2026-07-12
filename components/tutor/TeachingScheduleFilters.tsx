'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  range: string
  from: string
  to: string
}

const RANGE_OPTIONS = [
  { key: '', label: 'Semua' },
  { key: 'today', label: 'Hari Ini' },
  { key: 'tomorrow', label: 'Besok' },
  { key: 'week', label: 'Minggu Ini' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'next7', label: '7 Hari ke Depan' },
  { key: 'custom', label: 'Custom' },
]

export default function TeachingScheduleFilters({ range, from, to }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo] = useState(to)

  function go(params: Record<string, string>) {
    const filtered: Record<string, string> = {}
    Object.entries(params).forEach(([k, v]) => { if (v) filtered[k] = v })
    const qs = new URLSearchParams(filtered).toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function selectRange(key: string) {
    if (key === 'custom') {
      if (customFrom && customTo) go({ range: 'custom', from: customFrom, to: customTo })
      else go({ range: 'custom' })
      return
    }
    go({ range: key })
  }

  function applyCustom(nextFrom: string, nextTo: string) {
    setCustomFrom(nextFrom)
    setCustomTo(nextTo)
    if (nextFrom && nextTo) go({ range: 'custom', from: nextFrom, to: nextTo })
  }

  const selectCls = (active: boolean) =>
    `text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      active ? 'border-blue-500 text-blue-700' : 'border-gray-200 text-gray-700'
    }`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={range} onChange={e => selectRange(e.target.value)} className={selectCls(!!range)}>
        {RANGE_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
      </select>

      {range === 'custom' && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={customFrom}
            onChange={e => applyCustom(e.target.value, customTo)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">–</span>
          <input
            type="date"
            value={customTo}
            onChange={e => applyCustom(customFrom, e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  )
}
