'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateFirstInvoice, generateNextInvoice } from '@/lib/actions/admin/invoices'

export type EnrollmentRow = {
  student_id: string
  class_id: string
  student_name: string
  parent_name: string | null
  class_name: string
  class_level: string | null
  class_type: string | null
  latest_invoice_id: string | null
  latest_invoice_total: number | null
  latest_invoice_date: string | null
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

export default function GenerateInvoiceList({ rows }: { rows: EnrollmentRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [paymentValues, setPaymentValues] = useState<Record<string, string>>({})
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function rowKey(row: EnrollmentRow) {
    return `${row.student_id}:${row.class_id}`
  }

  function handleFirstInvoice(row: EnrollmentRow) {
    const key = rowKey(row)
    setLoadingKey(key)
    setErrors(prev => ({ ...prev, [key]: '' }))
    startTransition(async () => {
      const result = await generateFirstInvoice(row.student_id, row.class_id)
      setLoadingKey(null)
      if ('error' in result) {
        setErrors(prev => ({ ...prev, [key]: result.error ?? 'Terjadi kesalahan' }))
      } else {
        router.push(`/admin/invoices/${result.id}`)
      }
    })
  }

  function handleNextInvoice(row: EnrollmentRow) {
    const key = rowKey(row)
    const raw = paymentValues[key] ?? ''
    const payment = Number(raw.replace(/\D/g, ''))
    if (!payment || payment <= 0) {
      setErrors(prev => ({ ...prev, [key]: 'Masukkan jumlah pembayaran yang valid' }))
      return
    }
    setLoadingKey(key)
    setErrors(prev => ({ ...prev, [key]: '' }))
    startTransition(async () => {
      const result = await generateNextInvoice(row.student_id, row.class_id, payment)
      setLoadingKey(null)
      if ('error' in result) {
        setErrors(prev => ({ ...prev, [key]: result.error ?? 'Terjadi kesalahan' }))
      } else {
        router.push(`/admin/invoices/${result.id}`)
      }
    })
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
        Tidak ada siswa dengan kelas aktif ditemukan.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rows.map(row => {
        const key = rowKey(row)
        const isExpanded = expandedKey === key
        const isLoading = loadingKey === key
        const hasInvoice = !!row.latest_invoice_id
        const error = errors[key]

        return (
          <div key={key} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{row.student_name}</p>
                {row.parent_name && (
                  <p className="text-xs text-gray-500 mt-0.5">{row.parent_name}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {row.class_name}
                  {row.class_level && <span className="ml-1 text-gray-300">·</span>}
                  {row.class_level && <span className="ml-1">{row.class_level}</span>}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                {hasInvoice && row.latest_invoice_total !== null && (
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-400">Saldo</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatRupiah(row.latest_invoice_total)}
                    </p>
                    {row.latest_invoice_date && (
                      <p className="text-sm text-gray-400">{formatDate(row.latest_invoice_date)}</p>
                    )}
                  </div>
                )}

                {!hasInvoice ? (
                  <button
                    onClick={() => handleFirstInvoice(row)}
                    disabled={isLoading || isPending}
                    className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
                  >
                    {isLoading ? 'Membuat...' : 'Buat Invoice Pertama'}
                  </button>
                ) : (
                  <button
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                    disabled={isLoading || isPending}
                    className="px-4 py-2 text-xs font-medium bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-60 transition-colors whitespace-nowrap"
                  >
                    {isExpanded ? 'Batal' : 'Buat Invoice Berikutnya'}
                  </button>
                )}

                {row.latest_invoice_id && (
                  <a
                    href={`/admin/invoices/${row.latest_invoice_id}`}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                    title="Lihat invoice terakhir"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {isExpanded && hasInvoice && (
              <div className="border-t px-5 py-4 bg-gray-50">
                <p className="text-xs text-gray-600 mb-3">
                  Saldo saat ini:{' '}
                  <span className="font-semibold text-gray-900">
                    {formatRupiah(row.latest_invoice_total ?? 0)}
                  </span>
                  . Masukkan jumlah cicilan yang diterima bulan ini:
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-xs relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                    <input
                      type="number"
                      min={1}
                      max={row.latest_invoice_total ?? undefined}
                      placeholder="0"
                      value={paymentValues[key] ?? ''}
                      onChange={e => setPaymentValues(prev => ({ ...prev, [key]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleNextInvoice(row)}
                      className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => handleNextInvoice(row)}
                    disabled={isLoading || isPending}
                    className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  >
                    {isLoading ? 'Membuat...' : 'Generate Invoice'}
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-red-600 mt-2">{error}</p>
                )}
              </div>
            )}

            {!isExpanded && error && (
              <div className="border-t px-5 py-2 bg-red-50">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
