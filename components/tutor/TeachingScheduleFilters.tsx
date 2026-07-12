'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  range: string
  from: string
  to: string
}

const RANGE_TABS = [
  { key: '', label: '10 Berikutnya' },
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
  const [showCustom, setShowCustom] = useState(range === 'custom')

  function go(params: Record<string, string>) {
    const filtered: Record<string, string> = {}
    Object.entries(params).forEach(([k, v]) => { if (v) filtered[k] = v })
    const qs = new URLSearchParams(filtered).toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function selectRange(key: string) {
    if (key === 'custom') {
      setShowCustom(true)
      if (customFrom && customTo) go({ range: 'custom', from: customFrom, to: customTo })
      return
    }
    setShowCustom(false)
    go({ range: key })
  }

  function applyCustom(nextFrom: string, nextTo: string) {
    setCustomFrom(nextFrom)
    setCustomTo(nextTo)
    if (nextFrom && nextTo) go({ range: 'custom', from: nextFrom, to: nextTo })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {RANGE_TABS.map(tab => (
        <button
          key={tab.key}
          type="button"
          onClick={() => selectRange(tab.key)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            (tab.key === 'custom' ? range === 'custom' : range === tab.key)
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}

      {showCustom && (
        <div className="flex items-center gap-1.5 ml-1">
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
