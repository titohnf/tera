import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: ReactNode
  tooltip?: string
}

export default function MetricCard({ label, value, sub, tooltip }: MetricCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-snug">
          {label}
        </p>
        {tooltip && (
          <div className="relative group shrink-0">
            <button type="button" className="text-gray-300 hover:text-gray-500 transition-colors" aria-label="Info">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="absolute right-0 top-5 w-52 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none leading-relaxed shadow-lg">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold leading-none text-gray-900">
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
