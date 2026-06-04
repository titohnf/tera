'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateFirstInvoice, generateNextInvoice } from '@/lib/actions/admin/invoices'

export type EnrollmentInfo = {
  class_id: string
  class_name: string
  class_level: string | null
  class_type: string | null
  latest_invoice_id: string | null
  latest_invoice_total: number | null
  latest_invoice_date: string | null
  latest_invoice_status: string | null
}

export type InvoiceInfo = {
  id: string
  invoice_number: string
  class_id: string | null
  total_due: number
  issued_at: string
  status: string
}

export type StudentGroup = {
  student_id: string
  student_name: string
  parent_name: string | null
  enrollments: EnrollmentInfo[]
  invoices: InvoiceInfo[]
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  sent: 'Terkirim',
  paid: 'Lunas',
}

export default function InvoiceStudentList({ groups }: { groups: StudentGroup[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [openStudents, setOpenStudents] = useState<Set<string>>(new Set())
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null)
  const [paymentValues, setPaymentValues] = useState<Record<string, string>>({})
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function toggleStudent(studentId: string) {
    setOpenStudents(prev => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  function eKey(studentId: string, classId: string) {
    return `${studentId}:${classId}`
  }

  function handleFirstInvoice(studentId: string, classId: string) {
    const key = eKey(studentId, classId)
    setLoadingKey(key)
    setErrors(prev => ({ ...prev, [key]: '' }))
    startTransition(async () => {
      const result = await generateFirstInvoice(studentId, classId)
      setLoadingKey(null)
      if ('error' in result) {
        setErrors(prev => ({ ...prev, [key]: result.error ?? 'Terjadi kesalahan' }))
      } else {
        router.push(`/admin/invoices/${result.id}`)
      }
    })
  }

  function handleNextInvoice(studentId: string, classId: string, mode: 'generate' | 'kuitansi' = 'generate') {
    const key = eKey(studentId, classId)
    const payment = Number((paymentValues[key] ?? '').replace(/\D/g, ''))
    if (mode === 'kuitansi' && (!payment || payment <= 0)) {
      setErrors(prev => ({ ...prev, [key]: 'Masukkan jumlah pembayaran untuk mencetak kuitansi' }))
      return
    }
    setLoadingKey(key)
    setErrors(prev => ({ ...prev, [key]: '' }))
    startTransition(async () => {
      const result = await generateNextInvoice(studentId, classId, payment)
      setLoadingKey(null)
      if ('error' in result) {
        setErrors(prev => ({ ...prev, [key]: result.error ?? 'Terjadi kesalahan' }))
      } else if (mode === 'kuitansi' && result.kuitansiItemIndex !== null) {
        window.open(`/admin/invoices/${result.id}/kuitansi/${result.kuitansiItemIndex}`, '_blank')
        router.refresh()
      } else {
        router.push(`/admin/invoices/${result.id}`)
      }
    })
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
        Belum ada siswa dengan kelas aktif.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {groups.map(group => {
        const isOpen = openStudents.has(group.student_id)
        const totalInvoices = group.invoices.length

        return (
          <div key={group.student_id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            {/* Accordion header */}
            <button
              type="button"
              onClick={() => toggleStudent(group.student_id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-blue-50/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{group.student_name}</p>
                {group.parent_name && (
                  <p className="text-xs text-gray-500 mt-0.5">{group.parent_name}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-gray-400">
                  {totalInvoices === 0 ? 'Belum ada invoice' : `${totalInvoices} invoice`}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-300 divide-y divide-slate-300">
                {/* Enrollment action rows */}
                {group.enrollments.map(enrollment => {
                  const key = eKey(group.student_id, enrollment.class_id)
                  const isExpandedPay = expandedPayment === key
                  const isLoading = loadingKey === key
                  const hasInvoice = !!enrollment.latest_invoice_id
                  const error = errors[key]

                  return (
                    <div key={enrollment.class_id} className="bg-blue-50/40 px-5 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800">{enrollment.class_name}</p>
                          {enrollment.class_level && (
                            <p className="text-xs text-gray-500">{enrollment.class_level}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {hasInvoice && enrollment.latest_invoice_total !== null && (
                            <div className="text-right hidden sm:block">
                              <p className="text-sm text-gray-400">Tagihan</p>
                              <p className="text-sm font-semibold text-gray-700">
                                {formatRupiah(enrollment.latest_invoice_total)}
                              </p>
                            </div>
                          )}
                          {!hasInvoice ? (
                            <button
                              type="button"
                              onClick={() => handleFirstInvoice(group.student_id, enrollment.class_id)}
                              disabled={isLoading || isPending}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap"
                            >
                              {isLoading ? 'Membuat...' : 'Buat Invoice Pertama'}
                            </button>
                          ) : enrollment.latest_invoice_status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedPayment(isExpandedPay ? null : key)
                                setErrors(prev => ({ ...prev, [key]: '' }))
                              }}
                              disabled={isLoading || isPending}
                              className="px-3 py-1.5 text-xs font-medium bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-60 transition-colors whitespace-nowrap"
                            >
                              {isExpandedPay ? 'Batal' : 'Buat Invoice Berikutnya'}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpandedPay && (
                        <div className="mt-3 flex items-center gap-2">
                          <p className="text-xs text-gray-500 shrink-0">Cicilan diterima:</p>
                          <div className="relative flex-1 max-w-[180px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                            <input
                              type="number"
                              min={1}
                              placeholder="0"
                              value={paymentValues[key] ?? ''}
                              onChange={e => setPaymentValues(prev => ({ ...prev, [key]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleNextInvoice(group.student_id, enrollment.class_id)}
                              className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleNextInvoice(group.student_id, enrollment.class_id, 'kuitansi')}
                            disabled={isLoading || isPending}
                            className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors whitespace-nowrap"
                          >
                            Buat Kuitansi
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNextInvoice(group.student_id, enrollment.class_id, 'generate')}
                            disabled={isLoading || isPending}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                          >
                            {isLoading ? 'Membuat...' : 'Buat Invoice'}
                          </button>
                        </div>
                      )}

                      {error && (
                        <p className="text-xs text-red-600 mt-2">{error}</p>
                      )}
                    </div>
                  )
                })}

                {/* Invoice history */}
                {group.invoices.length === 0 ? (
                  <div className="px-5 py-4 text-xs text-gray-400 text-center">
                    Belum ada invoice
                  </div>
                ) : (
                  group.invoices.map(inv => (
                    <a
                      key={inv.id}
                      href={`/admin/invoices/${inv.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-blue-50/50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-gray-500 truncate">{inv.invoice_number}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.issued_at)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <p className="text-sm font-semibold text-gray-900">{formatRupiah(inv.total_due)}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[inv.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABEL[inv.status] ?? inv.status}
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </a>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
