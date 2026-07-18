'use client'

import { useEffect, useState } from 'react'

export default function StatCard({ label, value, sub, color, sensitive }: {
  label: string; value: string; sub: string; color: 'blue' | 'green' | 'yellow'; sensitive?: boolean
}) {
  const [hidden, setHidden] = useState(!!sensitive)
  const dots = { blue: 'bg-blue-500', green: 'bg-emerald-500', yellow: 'bg-amber-400' }
  const valueColors = { blue: 'text-blue-600', green: 'text-emerald-600', yellow: 'text-amber-600' }

  useEffect(() => {
    if (!sensitive || hidden) return
    const timer = setTimeout(() => setHidden(true), 5_000)
    return () => clearTimeout(timer)
  }, [sensitive, hidden])

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dots[color]}`} />
          <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
        </div>
        {sensitive && (
          <button
            type="button"
            onClick={() => setHidden(h => !h)}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label={hidden ? 'Tampilkan nilai' : 'Sembunyikan nilai'}
          >
            {hidden ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
      <p className={`text-2xl font-bold ${valueColors[color]}`}>{sensitive && hidden ? '••••••' : value}</p>
      <p className="text-xs text-gray-400 mt-1">{sensitive && hidden ? '••••••••' : sub}</p>
    </div>
  )
}
