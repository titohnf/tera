'use client'

import { useState, useTransition } from 'react'
import { updateInvoice } from '@/lib/actions/admin/invoices'
import DatePicker from '@/components/ui/DatePicker'

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

interface InvoiceEditFormProps {
  invoice: Invoice
  classes: ClassItem[]
  students: Student[]
  onCancel: () => void
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

const emptyLine = (): LineItem => ({ description: '', months: 1, amount: 0, is_deduction: false })

export default function InvoiceEditForm({ invoice, classes, students, onCancel }: InvoiceEditFormProps) {
  const [isPending, startTransition] = useTransition()
  const [invoiceNumber, setInvoiceNumber] = useState(invoice.invoice_number)
  const [classId, setClassId] = useState(invoice.class_id ?? '')
  const [studentId, setStudentId] = useState(invoice.student_id ?? '')
  const [studentName, setStudentName] = useState(invoice.student_name)
  const [parentName, setParentName] = useState(invoice.parent_name)
  const [issuedAt, setIssuedAt] = useState(invoice.issued_at)
  const [dueDate, setDueDate] = useState(invoice.due_date ?? '')
  const [paymentMethod, setPaymentMethod] = useState(invoice.payment_method)
  const [bankAccount, setBankAccount] = useState(invoice.bank_account)
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice.line_items.length > 0 ? invoice.line_items : [emptyLine()]
  )
  const [error, setError] = useState('')

  const lineSubtotal = (item: LineItem) =>
    item.months === 0 ? item.amount : item.months * item.amount

  const totalDue = lineItems.reduce((sum, item) =>
    item.is_deduction ? sum - lineSubtotal(item) : sum + lineSubtotal(item), 0)

  function handleStudentChange(sid: string) {
    setStudentId(sid)
    const s = students.find(st => st.id === sid)
    if (s) setStudentName(s.full_name)
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number | boolean) {
    setLineItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function addLineItem() {
    setLineItems(prev => [...prev, emptyLine()])
  }

  function removeLineItem(index: number) {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const result = await updateInvoice(invoice.id, {
        invoice_number: invoiceNumber,
        class_id: classId || null,
        student_id: studentId || null,
        student_name: studentName,
        parent_name: parentName,
        line_items: lineItems,
        total_due: totalDue,
        payment_method: paymentMethod,
        bank_account: bankAccount,
        due_date: dueDate || null,
        issued_at: issuedAt,
      })

      if ('error' in result) {
        setError(result.error ?? 'Terjadi kesalahan')
        return
      }

      onCancel()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nomor Invoice</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Kelas</label>
          <select
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Pilih Kelas --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.level ? ` (${c.level})` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Siswa</label>
          <select
            value={studentId}
            onChange={e => handleStudentChange(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Pilih Siswa --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nama Siswa</label>
          <input
            type="text"
            required
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nama Orang Tua</label>
          <input
            type="text"
            required
            value={parentName}
            onChange={e => setParentName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Invoice</label>
          <DatePicker value={issuedAt} onChange={setIssuedAt} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Batas Pembayaran</label>
          <DatePicker value={dueDate} onChange={setDueDate} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Metode Pembayaran</label>
          <input
            type="text"
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">No. Rekening</label>
          <input
            type="text"
            value={bankAccount}
            onChange={e => setBankAccount(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-700">Rincian Pembayaran</h3>
          <button
            type="button"
            onClick={addLineItem}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            + Tambah Baris
          </button>
        </div>

        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1 mb-2">
          <div className="col-span-4">Keterangan</div>
          <div className="col-span-2 text-center">Bulan</div>
          <div className="col-span-2 text-right">Biaya/bulan</div>
          <div className="col-span-2 text-right">Jumlah (Rp)</div>
          <div className="col-span-1 text-center">Jenis</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-2">
          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              {item.months === 0 ? (
                <div className="col-span-8">
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateLineItem(index, 'description', e.target.value)}
                    placeholder="Keterangan"
                    className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <>
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Keterangan"
                      className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0}
                      value={item.months}
                      onChange={e => updateLineItem(index, 'months', Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0}
                      value={item.amount}
                      onChange={e => updateLineItem(index, 'amount', Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              <div className="col-span-2 text-right text-sm text-gray-700 font-medium pr-1">
                {formatRupiah(lineSubtotal(item))}
              </div>
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => updateLineItem(index, 'is_deduction', !item.is_deduction)}
                  className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                    item.is_deduction
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {item.is_deduction ? '-' : '+'}
                </button>
              </div>
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t flex justify-end">
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">Total Tagihan</p>
            <p className="text-lg font-bold text-gray-900">{formatRupiah(totalDue)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
      </div>
    </form>
  )
}
