'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoiceStatus, deleteInvoice } from '@/lib/actions/admin/invoices'

interface InvoiceStatusActionsProps {
  invoiceId: string
  status: string
}

export default function InvoiceStatusActions({ invoiceId, status }: InvoiceStatusActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleStatusChange(newStatus: 'draft' | 'sent' | 'paid') {
    setError('')
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, newStatus)
      if ('error' in result) {
        setError(result.error ?? 'Terjadi kesalahan')
      }
    })
  }

  function handleDelete() {
    if (!confirm('Hapus invoice ini? Tindakan tidak dapat dibatalkan.')) return
    setError('')
    startTransition(async () => {
      const result = await deleteInvoice(invoiceId)
      if ('error' in result) {
        setError(result.error ?? 'Terjadi kesalahan')
        return
      }
      router.push('/admin/invoices')
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== 'sent' && status !== 'paid' && (
        <button
          onClick={() => handleStatusChange('sent')}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          Tandai Terkirim
        </button>
      )}
      {status !== 'paid' && (
        <button
          onClick={() => handleStatusChange('paid')}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          Tandai Lunas
        </button>
      )}
      {status !== 'draft' && (
        <button
          onClick={() => handleStatusChange('draft')}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          Kembalikan ke Draft
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
      >
        Hapus
      </button>
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </div>
  )
}
