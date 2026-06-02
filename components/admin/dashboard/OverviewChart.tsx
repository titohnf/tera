'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

export type OverviewPoint = {
  label: string
  current: number
  secondary?: number
  detail?: string  // shown in tooltip as extra line (e.g. retensi cohort detail)
}

export type OverviewSeriesConfig = {
  points: OverviewPoint[]
  currentLabel: string
  secondaryLabel?: string
  format?: 'rupiah' | 'persen'
  secondaryColor?: string
}

export type OverviewMetricDef = {
  key: string
  label: string
  value: string
  diff: number | null       // absolute difference vs prev period
  diffText?: string         // pre-formatted diff (e.g. "+Rp 1,2jt") — overrides numeric diff
  vsLabel?: string          // e.g. "dari SM1 lalu"
}

export type OverviewSeries = Record<string, OverviewSeriesConfig>

interface Props {
  metrics: OverviewMetricDef[]
  series: OverviewSeries
  period: string
  periodOptions: { key: string; label: string }[]
}

function TrendChip({ diff, diffText, vsLabel }: { diff: number | null; diffText?: string; vsLabel?: string }) {
  if (!vsLabel) return null

  if (diff === null) {
    return <span className="text-xs text-gray-400">—</span>
  }
  if (diff === 0) {
    return <span className="text-xs font-semibold text-gray-500">=</span>
  }
  const up = diff > 0
  const display = diffText ?? String(Math.abs(diff))
  return (
    <span className={`text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? '↑' : '↓'} {display}
    </span>
  )
}

const fmtRupiah = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

export default function OverviewChart({ metrics, series, period, periodOptions }: Props) {
  const [activeMetric, setActiveMetric] = useState(metrics[0]?.key ?? '')
  const pathname = usePathname()

  const config = series[activeMetric]
  const data = config?.points ?? []
  const hasData = data.some(p => p.current > 0 || (p.secondary ?? 0) > 0)

  const allVals = data.flatMap(p => [p.current, p.secondary ?? 0])
  const maxVal = Math.max(...allVals, 1)
  const yMax = Math.ceil(maxVal * 1.2)

  const isPersen = config?.format === 'persen'
  const isRupiah = config?.format === 'rupiah'

  const fmtTick = (v: number) => {
    if (isPersen) return `${v}%`
    if (isRupiah && v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}jt`
    if (isRupiah && v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`
    return String(v)
  }

  const secondaryColor = config?.secondaryColor ?? '#f97316'

  return (
    <div className="space-y-5">
      {/* Period filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {periodOptions.map(opt => {
            const isActive = opt.key === period
            return (
              <Link
                key={opt.key}
                href={`${pathname}?period=${opt.key}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Metric pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => {
          const isActive = m.key === activeMetric
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setActiveMetric(m.key)}
              className={`text-left p-3 rounded-xl border transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {m.label}
              </p>
              <p className={`text-2xl font-bold leading-none mb-1 ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                {m.value}
              </p>
              <TrendChip diff={m.diff} diffText={m.diffText} vsLabel={m.vsLabel} />
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <div className="border-t border-slate-100 pt-4">
        {!hasData ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            Belum ada data untuk periode ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                width={36}
                domain={isPersen ? [0, 100] : [0, yMax]}
                allowDecimals={false}
                tickFormatter={fmtTick}
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
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const point = payload[0]?.payload as OverviewPoint
                  return (
                    <div style={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '8px 12px', background: '#fff' }}>
                      <p style={{ fontWeight: 600, marginBottom: 4, color: '#1e293b' }}>{label}</p>
                      {payload.map((p, i) => {
                        const lbl = p.dataKey === 'current' ? (config?.currentLabel ?? '') : (config?.secondaryLabel ?? '')
                        const v = Number(p.value)
                        const display = isPersen ? `${v}%` : isRupiah ? fmtRupiah(v) : String(v)
                        return (
                          <p key={i} style={{ color: p.color, margin: '2px 0' }}>{lbl}: <strong>{display}</strong></p>
                        )
                      })}
                      {point?.detail && (
                        <p style={{ color: '#6b7280', marginTop: 4, borderTop: '1px solid #f1f5f9', paddingTop: 4 }}>{point.detail}</p>
                      )}
                    </div>
                  )
                }}
              />
              {config?.secondaryLabel && (
                <Line
                  type="linear"
                  dataKey="secondary"
                  stroke={secondaryColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: secondaryColor }}
                />
              )}
              <Line
                type="linear"
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
        {hasData && config && (
          <div className="flex items-center gap-5 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="block w-5 h-0.5 bg-blue-600 rounded-full" />
              <span className="text-xs text-gray-500">{config.currentLabel}</span>
            </div>
            {config.secondaryLabel && (
              <div className="flex items-center gap-1.5">
                <span className="block w-5 h-0.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <span className="text-xs text-gray-500">{config.secondaryLabel}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
