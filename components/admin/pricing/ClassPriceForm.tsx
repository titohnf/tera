'use client'

import { useActionState } from 'react'
import { updateClassPrice } from '@/lib/actions/admin/pricing'

interface ClassPriceFormProps {
  classId: string
  currentPrice: number
}

export default function ClassPriceForm({ classId, currentPrice }: ClassPriceFormProps) {
  const action = updateClassPrice.bind(null, classId)
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Harga per Sesi (Rp) <span className="text-red-500">*</span>
        </label>
        <input
          name="base_price_per_session"
          type="number"
          required
          min={0}
          step={1000}
          defaultValue={currentPrice}
          className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Harga yang dikenakan kepada siswa per pertemuan.</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
      >
        {pending ? 'Menyimpan...' : 'Simpan Harga'}
      </button>
    </form>
  )
}
