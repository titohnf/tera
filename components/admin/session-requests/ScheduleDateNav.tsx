'use client'

import { useRouter } from 'next/navigation'

function shiftDate(date: string, deltaDays: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + deltaDays)
  return dt.toISOString().slice(0, 10)
}

export default function ScheduleDateNav({ date, today }: { date: string; today: string }) {
  const router = useRouter()

  function goTo(newDate: string) {
    router.push(newDate === today ? '/admin/session-requests' : `/admin/session-requests?date=${newDate}`)
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => goTo(shiftDate(date, -1))}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        aria-label="Hari sebelumnya"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <input
        type="date"
        value={date}
        onChange={e => e.target.value && goTo(e.target.value)}
        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700"
      />
      <button
        type="button"
        onClick={() => goTo(shiftDate(date, 1))}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        aria-label="Hari berikutnya"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {date !== today && (
        <button
          type="button"
          onClick={() => goTo(today)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Hari ini
        </button>
      )}
    </div>
  )
}
