'use client'

import Link from 'next/link'

type SessionEvent = {
  id: string
  scheduled_at: string
  status: string
  className: string
  tutorName: string | null
}

interface SessionCalendarProps {
  sessions: SessionEvent[]
  year: number
  month: number // 0-indexed
  navBase?: string // base URL for prev/next navigation, defaults to /admin/sessions
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  ongoing:   'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-500 line-through',
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const MONTHS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

export default function SessionCalendar({ sessions, year, month, navBase = '/admin/sessions' }: SessionCalendarProps) {
  const today = new Date()

  // Build day grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Group sessions by date string "YYYY-MM-DD"
  const byDate: Record<string, SessionEvent[]> = {}
  for (const s of sessions) {
    const d = new Date(s.scheduled_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(s)
  }

  // Prev / next month links
  const prevMonth = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 }
  const nextMonth = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 }

  // Build cells: leading empty + day numbers
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <Link
          href={`${navBase}?year=${prevMonth.y}&month=${prevMonth.m}`}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-sm font-semibold text-gray-900">
          {MONTHS[month]} {year}
        </h2>
        <Link
          href={`${navBase}?year=${nextMonth.y}&month=${nextMonth.m}`}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="min-h-24 bg-gray-50/40 p-2" />
          }

          const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const daySessions = byDate[key] ?? []
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

          return (
            <div key={key} className="min-h-24 p-2 hover:bg-blue-50/20 transition-colors">
              <p className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                isToday ? 'bg-blue-600 text-white' : 'text-gray-500'
              }`}>
                {day}
              </p>
              <div className="space-y-0.5">
                {daySessions.slice(0, 3).map(s => {
                  const time = new Date(s.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <Link
                      key={s.id}
                      href={`/admin/sessions/${s.id}`}
                      className={`block truncate text-[11px] px-1.5 py-0.5 rounded font-medium leading-tight hover:opacity-80 transition-opacity ${STATUS_COLOR[s.status] ?? 'bg-gray-100 text-gray-500'}`}
                      title={`${s.className} · ${time}${s.tutorName ? ` · ${s.tutorName}` : ''}`}
                    >
                      {time} {s.className}
                    </Link>
                  )
                })}
                {daySessions.length > 3 && (
                  <p className="text-[10px] text-gray-400 px-1.5">+{daySessions.length - 3} lainnya</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
