'use client'

import { useActionState } from 'react'
import { markAsPaid } from '@/lib/actions/admin/payments'

export default function MarkPaidForm({ paymentId }: { paymentId: string }) {
  const action = markAsPaid.bind(null, paymentId)
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      {state && 'error' in state && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{state.error}</div>
      )}
      {state && 'success' in state && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{state.success}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">No. Referensi Transfer</label>
        <input
          name="payment_reference"
          type="text"
          placeholder="Contoh: TRF20240501001"
          className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Opsional"
          className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
      >
        {pending ? 'Memproses...' : 'Konfirmasi Pembayaran'}
      </button>
    </form>
  )
}
