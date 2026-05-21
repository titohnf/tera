'use client'

import { useState } from 'react'
import InvoiceEditForm from './InvoiceEditForm'
import InvoiceStatusActions from './InvoiceStatusActions'

interface LineItem {
  description: string
  months: number
  amount: number
  is_deduction: boolean
}

interface Invoice {
  id: string
  invoice_number: string
  class_id: string | null
  student_id: string | null
  student_name: string
  parent_name: string
  line_items: LineItem[]
  total_due: number
  payment_method: string
  bank_account: string
  due_date: string | null
  issued_at: string
  status: string
  notes: string | null
}

interface ClassItem {
  id: string
  name: string
  level: string | null
}

interface Student {
  id: string
  full_name: string
}

interface InvoiceDetailClientProps {
  invoice: Invoice
  classes: ClassItem[]
  students: Student[]
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

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

export default function InvoiceDetailClient({ invoice, classes, students }: InvoiceDetailClientProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-5 border-b pb-3">Edit Invoice</h2>
        <InvoiceEditForm
          invoice={invoice}
          classes={classes}
          students={students}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Nomor Invoice</p>
            <p className="text-base font-semibold text-gray-900 font-mono">{invoice.invoice_number}</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[invoice.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABEL[invoice.status] ?? invoice.status}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Tanggal Invoice</p>
            <p className="font-medium text-gray-900">{formatDate(invoice.issued_at)}</p>
          </div>
          {invoice.due_date && (
            <div>
              <p className="text-xs text-gray-500">Batas Pembayaran</p>
              <p className="font-medium text-gray-900">{formatDate(invoice.due_date)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">Total Tagihan</p>
            <p className="font-bold text-gray-900">{formatRupiah(invoice.total_due)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tagihan Dari</p>
            <p className="text-sm font-semibold text-gray-900">Tera Learning Center</p>
            <p className="text-xs text-gray-500 mt-1">Ruko Depok Bersih Jl. Rawageni No. 9k</p>
            <p className="text-xs text-gray-500">Kel. Ratujaya, Kec. Cipayung, Kota Depok</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Untuk</p>
            <p className="text-xs text-gray-500">Nama Siswa</p>
            <p className="text-sm font-semibold text-gray-900">{invoice.student_name}</p>
            <p className="text-xs text-gray-500 mt-2">Nama Orang Tua</p>
            <p className="text-sm font-medium text-gray-900">{invoice.parent_name}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-slate-300">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">Rincian Pembayaran</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 w-20">Bulan</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 w-36">Biaya/bulan</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 w-40">Jumlah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {invoice.line_items.map((item, i) => {
              const subtotal = item.months === 0 ? item.amount : item.months * item.amount
              return (
                <tr key={i} className={item.is_deduction ? 'bg-red-50/30' : ''}>
                  {item.months === 0 ? (
                    <td className="px-5 py-3 text-gray-800" colSpan={3}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{item.description}</span>
                        <a
                          href={`/admin/invoices/${invoice.id}/kuitansi/${i}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0"
                        >
                          Cetak Kuitansi →
                        </a>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-5 py-3 text-gray-800">{item.description}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{item.months}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatRupiah(item.amount)}</td>
                    </>
                  )}
                  <td className="px-5 py-3 text-right">
                    {item.is_deduction ? (
                      <span className="text-red-600">({formatRupiah(subtotal)})</span>
                    ) : (
                      <span className="text-gray-800">{formatRupiah(subtotal)}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t bg-gray-50">
            <tr>
              <td className="px-5 py-3 font-bold text-gray-900" colSpan={3}>Total Tagihan</td>
              <td className="px-5 py-3 text-right font-bold text-gray-900">{formatRupiah(invoice.total_due)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informasi Pembayaran</p>
        <div className="space-y-1 text-sm">
          <p><span className="text-gray-500">Metode:</span> <span className="font-medium text-gray-900">{invoice.payment_method}</span></p>
          <p><span className="text-gray-500">Rekening:</span> <span className="font-medium text-gray-900">{invoice.bank_account}</span></p>
          {invoice.due_date && (
            <p><span className="text-gray-500">Batas Bayar:</span> <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span></p>
          )}
        </div>
        {invoice.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 mb-1">Catatan</p>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 flex flex-wrap items-center gap-3">
        <a
          href={`/admin/invoices/${invoice.id}/cetak`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak / PDF
        </a>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <InvoiceStatusActions invoiceId={invoice.id} status={invoice.status} />
      </div>
    </div>
  )
}
