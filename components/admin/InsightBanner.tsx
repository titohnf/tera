'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getActiveInsights, type InsightMetrics, type Insight, type InsightSeverity } from '@/lib/insights'

const STORAGE_KEY = 'dismissed_insights'

const STYLE: Record<InsightSeverity, {
  wrapper: string
  actionBtn: string
  icon: React.ReactNode
}> = {
  critical: {
    wrapper: 'border-l-[3px] border-[#7F1D1D] bg-[#FEF2F2]',
    actionBtn: 'border-red-900 text-red-900 hover:bg-red-900 hover:text-white',
    icon: (
      <svg className="w-4 h-4 text-red-800 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  danger: {
    wrapper: 'border-l-[3px] border-[#B91C1C] bg-[#FEF2F2]',
    actionBtn: 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white',
    icon: (
      <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  warning: {
    wrapper: 'border-l-[3px] border-[#B45309] bg-[#FFFBEB]',
    actionBtn: 'border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white',
    icon: (
      <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  info: {
    wrapper: 'border-l-[3px] border-[#1D4ED8] bg-[#EFF6FF]',
    actionBtn: 'border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white',
    icon: (
      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  ok: {
    wrapper: 'border-l-[3px] border-[#15803D] bg-[#F0FDF4]',
    actionBtn: 'border-green-700 text-green-700 hover:bg-green-700 hover:text-white',
    icon: (
      <svg className="w-4 h-4 text-green-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

const TAB_DEFS: { key: InsightSeverity | 'all'; label: string; dot: string }[] = [
  { key: 'all',      label: 'Semua',    dot: 'bg-gray-400' },
  { key: 'critical', label: 'Kritis',   dot: 'bg-red-900' },
  { key: 'danger',   label: 'Bahaya',   dot: 'bg-red-500' },
  { key: 'warning',  label: 'Perhatian',dot: 'bg-amber-500' },
  { key: 'info',     label: 'Info',     dot: 'bg-blue-500' },
  { key: 'ok',       label: 'Baik',     dot: 'bg-green-600' },
]

function InsightCard({ insight, onDismiss }: { insight: Insight; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false)
  const s = STYLE[insight.severity]

  function handleDismiss() {
    setExiting(true)
    setTimeout(onDismiss, 150)
  }

  return (
    <div className={`flex items-center gap-3 rounded-r-xl px-4 py-3 transition-all duration-150 ${s.wrapper} ${exiting ? 'opacity-0 -translate-y-1' : 'opacity-100'}`}>
      <div className="shrink-0">{s.icon}</div>
      <p className="text-sm text-gray-700 flex-1 leading-snug">{insight.message}</p>
      <div className="flex items-center gap-2 shrink-0 ml-1">
        {insight.action && (
          <Link
            href={insight.action.href}
            className={`text-xs font-medium px-2.5 py-1 rounded border transition-colors whitespace-nowrap ${s.actionBtn}`}
          >
            {insight.action.label}
          </Link>
        )}
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
          aria-label="Tutup"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function InsightBanner({ metrics }: { metrics: InsightMetrics }) {
  const allInsights = getActiveInsights(metrics)

  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) setDismissed(new Set(JSON.parse(stored) as string[]))
    } catch {}
  }, [])

  const [activeTab, setActiveTab] = useState<InsightSeverity | 'all'>('all')

  function dismiss(id: string) {
    setDismissed(prev => {
      const next = new Set([...prev, id])
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const visible = allInsights.filter(i => !dismissed.has(i.id))

  if (visible.length === 0) {
    return (
      <div className="flex items-center gap-3 border-l-[3px] border-green-500 bg-green-50 rounded-r-xl px-4 py-3">
        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium text-green-700">
          Semua metrik dalam kondisi baik — tidak ada yang perlu ditindaklanjuti saat ini
        </p>
      </div>
    )
  }

  // Hanya tampilkan tab yang punya insight
  const countBySeverity = visible.reduce<Record<string, number>>((acc, i) => {
    acc[i.severity] = (acc[i.severity] ?? 0) + 1
    return acc
  }, {})

  const availableTabs = TAB_DEFS.filter(
    t => t.key === 'all' || countBySeverity[t.key]
  )

  const shown = activeTab === 'all'
    ? visible
    : visible.filter(i => i.severity === activeTab)

  // Reset tab jika tab aktif sudah tidak punya insight
  const validTab = availableTabs.some(t => t.key === activeTab) ? activeTab : 'all'
  const effectiveTab = validTab

  const shownFinal = effectiveTab === 'all'
    ? visible
    : visible.filter(i => i.severity === effectiveTab)

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {availableTabs.map(tab => {
          const count = tab.key === 'all' ? visible.length : (countBySeverity[tab.key] ?? 0)
          const isActive = effectiveTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
              {tab.label}
              <span className={`text-xs font-bold ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Insight cards */}
      <div className="space-y-2">
        {shownFinal.map(insight => (
          <InsightCard key={insight.id} insight={insight} onDismiss={() => dismiss(insight.id)} />
        ))}
      </div>
    </div>
  )
}
