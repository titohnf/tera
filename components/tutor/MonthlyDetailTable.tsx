'use client'

import { Fragment, useState } from 'react'
import RekapDetailTable, { type RekapClassBreakdown } from './RekapDetailTable'

export interface RekapMonthBreakdown {
  monthKey: string
  label: string
  sessionCount: number
  grandTotal: number
  classes: RekapClassBreakdown[]
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function MonthlyDetailTable({ months }: { months: RekapMonthBreakdown[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(monthKey: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(monthKey)) next.delete(monthKey)
      else next.add(monthKey)
      return next
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="text-left px-5 py-3">Bulan</th>
            <th className="text-center px-4 py-3">Jumlah Sesi</th>
            <th className="text-right px-5 py-3">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {months.map(m => {
            const isOpen = expanded.has(m.monthKey)
            return (
              <Fragment key={m.monthKey}>
                <tr
                  onClick={() => toggle(m.monthKey)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                      {m.label}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{m.sessionCount}x</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatRupiah(m.grandTotal)}</td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={3} className="p-0 bg-gray-50/60">
                      <RekapDetailTable classes={m.classes} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
