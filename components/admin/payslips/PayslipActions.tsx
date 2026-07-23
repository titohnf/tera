'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendPayslip, markPayslipPaid, deletePayslip } from '@/lib/actions/admin/payslips'
import type { PayslipRow } from '@/lib/types/database'

export default function PayslipActions({ payslip }: { payslip: PayslipRow }) {
  const [ref, setRef] = useState(payslip.payment_reference ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function run(action: () => Promise<void>) {
    setError(null)
    startTransition(async () => {
      try {
        await action()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      }
    })
  }

  if (payslip.status === 'sent') {
    return (
      <div className="text-sm text-green-700 flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Slip sudah dikirim ke tutor
        {payslip.payment_reference && (
          <span className="text-gray-500 text-xs ml-1">· Ref: {payslip.payment_reference}</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {payslip.status === 'draft' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={ref}
              onChange={e => setRef(e.target.value)}
              placeholder="No. referensi transfer (opsional)"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() => run(() => markPayslipPaid(payslip.id, ref || undefined))}
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Tandai Dibayar
            </button>
          </div>
          <button
            onClick={() => {
              if (!confirm('Hapus slip gaji draft ini?')) return
              run(async () => {
                await deletePayslip(payslip.id)
                router.push('/admin/payslips')
              })
            }}
            disabled={isPending}
            className="text-sm text-red-600 hover:underline"
          >
            Hapus draft
          </button>
        </div>
      )}

      {payslip.status === 'paid' && (
        <div className="space-y-2">
          <button
            onClick={() => run(() => sendPayslip(payslip.id))}
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Kirim Slip ke Tutor
          </button>
          <p className="text-xs text-gray-400">Gaji sudah dibayarkan. Kirim slip sebagai bukti ke tutor.</p>
        </div>
      )}
    </div>
  )
}
