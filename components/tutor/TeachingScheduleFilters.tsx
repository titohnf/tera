'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SESSION_DISPLAY_STATUS_OPTIONS } from '@/lib/session-status'

interface Props {
  range: string
  from: string
  to: string
  compliance: string
  sessionStatus: string
}

const RANGE_OPTIONS = [
  { key: '', label: 'Semua' },
  { key: 'upcoming', label: 'Yang Akan Datang' },
  { key: 'past', label: 'Yang Sudah Berlangsung' },
  { key: 'custom', label: 'Custom' },
]

const COMPLIANCE_OPTIONS = [
  { key: '', label: 'Semua Kelengkapan' },
  { key: 'complete', label: 'Lengkap' },
  { key: 'incomplete', label: 'Belum Lengkap' },
]

export default function TeachingScheduleFilters({ range, from, to, compliance, sessionStatus }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo] = useState(to)

  function go(overrides: Record<string, string>) {
    const params: Record<string, string> = {
      ...(range ? { range } : {}),
      ...(customFrom ? { from: customFrom } : {}),
      ...(customTo ? { to: customTo } : {}),
      ...(compliance ? { compliance } : {}),
      ...(sessionStatus ? { sessionStatus } : {}),
      ...overrides,
    }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    const qs = new URLSearchParams(params).toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  function selectRange(key: string) {
    if (key === 'custom') {
      go(customFrom && customTo ? { range: 'custom', from: customFrom, to: customTo } : { range: 'custom', from: '', to: '' })
      return
    }
    go({ range: key, from: '', to: '' })
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

      <select value={compliance} onChange={e => go({ compliance: e.target.value })} className={selectCls(!!compliance)}>
        {COMPLIANCE_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
      </select>

      <select value={sessionStatus} onChange={e => go({ sessionStatus: e.target.value })} className={selectCls(!!sessionStatus)}>
        {SESSION_DISPLAY_STATUS_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
      </select>
    </div>
  )
}
