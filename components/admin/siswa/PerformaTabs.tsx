'use client'

import { useState } from 'react'

const COMPREHENSION_LEVELS: Record<string, { label: string; color: string }> = {
  L0: { label: 'L0 · Tidak Paham Sama Sekali',    color: 'bg-red-100 text-red-700' },
  L1: { label: 'L1 · Paham Permukaan/Hafalan',     color: 'bg-orange-100 text-orange-700' },
  L2: { label: 'L2 · Paham Konsep Dasar',          color: 'bg-yellow-100 text-yellow-700' },
  L3: { label: 'L3 · Paham Pengaplikasian Konsep', color: 'bg-green-100 text-green-700' },
  L4: { label: 'L4 · Sangat Paham',                color: 'bg-blue-100 text-blue-700' },
  L5: { label: 'L5 · Mahir',                       color: 'bg-purple-100 text-purple-700' },
}

export type SubjectStats = {
  subject: string
  totalSessions: number
  attendanceRate: number | null
  avgComprehension: string | null
}

export default function PerformaTabs({ stats }: { stats: SubjectStats[] }) {
  const [active, setActive] = useState(0)

  if (stats.length === 0) return (
    <p className="text-sm text-gray-400">Belum ada data performa.</p>
  )

  const cur = stats[active]
  const comprehension = cur.avgComprehension ? COMPREHENSION_LEVELS[cur.avgComprehension] : null

  return (
    <div>
      <div className="flex border-b border-slate-100 mb-3">
        {stats.map((s, i) => (
          <button
            key={s.subject}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 mb-[-1px] text-sm font-medium whitespace-nowrap transition-colors ${
              active === i
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.subject}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Total sesi</span>
          <span className="text-sm font-semibold text-gray-800">{cur.totalSessions}</span>
        </div>
        {cur.attendanceRate !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Kehadiran</span>
            <span className="text-sm font-semibold text-gray-800">{cur.attendanceRate}%</span>
          </div>
        )}
        {comprehension && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-500 shrink-0">Pemahaman</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full text-right ${comprehension.color}`}>
              {comprehension.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
