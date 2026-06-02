'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export type ChartPoint = {
  label: string   // X-axis label (tanggal/bulan)
  current: number
  previous: number
}

export type ChartMetric = {
  key: 'siswa-baru' | 'total-siswa'
  label: string
  value: number
  prevValue: number
}

interface Props {
  metrics: ChartMetric[]
  chartData: ChartPoint[]
  activeMetric: string
  period: string
}

function formatChange(curr: number, prev: number) {
  if (prev === 0) return null
  const pct = ((curr - prev) / prev) * 100
  const up = pct >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={up ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
      </svg>
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

const PERIOD_LABELS: Record<string, string> = {
  sm1: 'SM 1 (Jul–Des)',
  sm2: 'SM 2 (Jan–Jun)',
  ytd: 'Tahun ini',
  all: 'Semua waktu',
}

const PREV_LABELS: Record<string, string> = {
  sm1: 'SM 1 tahun lalu',
  sm2: 'SM 2 tahun lalu',
  ytd: 'Tahun lalu',
  all: '',
}

export default function SiswaChart({ metrics, chartData, activeMetric, period }: Props) {
  const hasData = chartData.some(p => p.current > 0 || p.previous > 0)
  const maxVal = Math.max(...chartData.flatMap(p => [p.current, p.previous]), 1)
  const yMax = Math.ceil(maxVal * 1.2)

  return (
    <div className="space-y-4">
      {/* Metric pills */}
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {metrics.map((m) => {
          const isActive = m.key === activeMetric
          return (
            <div key={m.key} className={`flex flex-col gap-0.5 pb-2 border-b-2 transition-colors ${isActive ? 'border-blue-600' : 'border-transparent'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                {m.label}
              </p>
              <p className={`text-2xl font-bold leading-none ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                {m.value}
              </p>
              <div className="mt-0.5">
                {formatChange(m.value, m.prevValue) ?? (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="border-t border-slate-100 pt-4">
        {!hasData ? (
          <div className="flex items-center justify-center h-36 text-sm text-gray-400">
            Belum ada data untuk periode ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                width={28}
                domain={[0, yMax]}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  padding: '8px 12px',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4, color: '#1e293b' }}
                formatter={(value, name) => [
                  value,
                  name === 'current' ? PERIOD_LABELS[period] : PREV_LABELS[period],
                ]}
              />
              <Line
                type="monotone"
                dataKey="previous"
                stroke="#93c5fd"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, fill: '#93c5fd' }}
              />
              <Line
                type="monotone"
                dataKey="current"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        {hasData && (
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="block w-6 h-0.5 bg-blue-600 rounded-full" />
              <span className="text-xs text-gray-500">{PERIOD_LABELS[period]}</span>
            </div>
            {PREV_LABELS[period] && (
              <div className="flex items-center gap-1.5">
                <svg width="24" height="2" viewBox="0 0 24 2">
                  <line x1="0" y1="1" x2="24" y2="1" stroke="#93c5fd" strokeWidth="2" strokeDasharray="5 4" />
                </svg>
                <span className="text-xs text-gray-500">{PREV_LABELS[period]}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
