'use client'

import { Fragment, useState } from 'react'
import { PAYROLL_STATUS_BADGE } from '@/lib/session-status'

export interface RekapSessionDetail {
  sessionId: string
  scheduledAt: string
  subject: string | null
  baseAmount: number
  totalAmount: number
  payrollStatus: string
  meetingNumber?: number
}

export interface RekapClassBreakdown {
  className: string
  sessionCount: number
  basePerSession: number
  grandTotal: number
  paymentStatus: string
  sessions: RekapSessionDetail[]
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function StatusBadge({ status }: { status: string }) {
  const badge = PAYROLL_STATUS_BADGE[status] ?? PAYROLL_STATUS_BADGE.unavailable
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${badge.color}`}>
      {badge.label}
    </span>
  )
}

export default function RekapDetailTable({ classes }: { classes: RekapClassBreakdown[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(className: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(className)) next.delete(className)
      else next.add(className)
      return next
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="text-left px-5 py-3">Nama Kelas</th>
            <th className="text-center px-4 py-3">Jumlah Pertemuan</th>
            <th className="text-right px-4 py-3">Base</th>
            <th className="text-right px-4 py-3">Total</th>
            <th className="text-center px-5 py-3">Status Pembayaran</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {classes.map(cls => {
            const isOpen = expanded.has(cls.className)
            return (
              <Fragment key={cls.className}>
                <tr
                  onClick={() => toggle(cls.className)}
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
                      {cls.className}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{cls.sessionCount}x</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatRupiah(cls.basePerSession)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatRupiah(cls.grandTotal)}</td>
                  <td className="px-5 py-3 text-center">
                    <StatusBadge status={cls.paymentStatus} />
                  </td>
                </tr>
                {isOpen && cls.sessions.map(s => (
                  <tr key={s.sessionId} className="bg-gray-50/60">
                    <td className="pl-11 pr-5 py-2 text-gray-500">
                      {s.meetingNumber != null && (
                        <span className="inline-block text-xs font-semibold text-gray-400 w-6">#{s.meetingNumber}</span>
                      )}
                      {new Date(s.scheduledAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                      {s.subject && <span className="text-gray-400"> &bull; {s.subject}</span>}
                    </td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2 text-right text-gray-700">{formatRupiah(s.totalAmount)}</td>
                    <td className="px-5 py-2 text-center">
                      <StatusBadge status={s.payrollStatus} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
