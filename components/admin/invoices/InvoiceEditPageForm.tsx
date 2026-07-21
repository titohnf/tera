'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoice } from '@/lib/actions/admin/invoices'
import DatePicker from '@/components/ui/DatePicker'

interface LineItem {
  description: string
  months: number
  amount: number
  is_deduction: boolean
  unit?: 'bulan' | 'pertemuan'
  show_qty?: boolean
}

interface Props {
  invoice: Record<string, unknown>
  classes: { id: string; name: string; level: string | null }[]
  students: { id: string; full_name: string }[]
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const emptyLine = (): LineItem => ({ description: '', months: 1, amount: 0, is_deduction: false, unit: 'bulan', show_qty: true })

export default function InvoiceEditPageForm({ invoice, classes, students }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [invoiceNumber, setInvoiceNumber] = useState(invoice.invoice_number as string ?? '')
  const [studentName, setStudentName] = useState(invoice.student_name as string ?? '')
  const [parentName, setParentName] = useState(invoice.parent_name as string ?? '')
  const [issuedAt, setIssuedAt] = useState((invoice.issued_at as string ?? '').slice(0, 10))
  const [dueDate, setDueDate] = useState((invoice.due_date as string ?? '').slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState(invoice.payment_method as string ?? '')
  const [bankAccount, setBankAccount] = useState(invoice.bank_account as string ?? '')
  const [notes, setNotes] = useState(invoice.notes as string ?? '')
  const [lineItems, setLineItems] = useState<LineItem[]>(
    (invoice.line_items as LineItem[] | null) ?? [emptyLine()]
  )
  const [error, setError] = useState('')

  const lineSubtotal = (item: LineItem) =>
    item.months === 0 ? item.amount : item.months * item.amount

  const totalDue = lineItems.reduce((sum, item) =>
    item.is_deduction ? sum - lineSubtotal(item) : sum + lineSubtotal(item), 0)

  function updateLineItem(index: number, field: keyof LineItem, value: string | number | boolean) {
    setLineItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function toggleDeduction(index: number) {
    setLineItems(prev => {
      const updated = [...prev]
      const item = updated[index]
      const nextIsDeduction = !item.is_deduction
      updated[index] = {
        ...item,
        is_deduction: nextIsDeduction,
        // Potongan/voucher selalu berupa nominal tetap, tidak terikat jumlah pertemuan/bulan.
        months: nextIsDeduction ? 0 : 1,
      }
      return updated
    })
  }

  // Lets the admin deliberately hide the qty/satuan fields for a special-case
  // charge row (e.g. a lump-sum item) — separate from is_deduction, which
  // always forces flat mode on its own.
  function toggleShowQty(index: number) {
    setLineItems(prev => {
      const updated = [...prev]
      const item = updated[index]
      const nextShowQty = !(item.show_qty ?? true)
      updated[index] = {
        ...item,
        show_qty: nextShowQty,
        months: nextShowQty ? 1 : 0,
      }
      return updated
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await updateInvoice(invoice.id as string, {
        invoice_number: invoiceNumber.trim(),
        class_id: invoice.class_id ?? null,
        student_id: invoice.student_id ?? null,
        student_name: studentName.trim(),
        parent_name: parentName.trim(),
        line_items: lineItems,
        total_due: totalDue,
        payment_method: paymentMethod,
        bank_account: bankAccount,
        due_date: dueDate || null,
        issued_at: issuedAt,
        notes: notes.trim() || null,
        status: invoice.status,
      })
      if (res && 'error' in res) { setError(res.error ?? 'Gagal'); return }
      router.back()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700 border-b pb-3">Informasi Invoice</h2>

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
            <label className="block text-xs font-medium text-gray-600 mb-1">Nama Siswa</label>
            <input
              type="text"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nama Orang Tua</label>
            <input
              type="text"
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

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Catatan</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Rincian Pembayaran</h2>
          <button
            type="button"
            onClick={() => setLineItems(prev => [...prev, emptyLine()])}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Baris
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
            <div className="col-span-3">Keterangan</div>
            <div className="col-span-3 text-center">Qty &amp; Satuan</div>
            <div className="col-span-2 text-right">Biaya/satuan</div>
            <div className="col-span-2 text-right">Jumlah (Rp)</div>
            <div className="col-span-1 text-center">Jenis</div>
            <div className="col-span-1" />
          </div>

          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              {item.is_deduction || item.show_qty === false ? (
                <>
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Keterangan"
                      className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0}
                      value={item.amount}
                      onChange={e => updateLineItem(index, 'amount', Number(e.target.value))}
                      placeholder="Nominal"
                      className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Keterangan"
                      className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={item.months}
                      onChange={e => updateLineItem(index, 'months', Number(e.target.value))}
                      className="w-14 shrink-0 border rounded-lg px-2 py-2 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-1 rounded-md overflow-hidden border border-slate-200 text-[10px] font-medium h-[38px]">
                      <button
                        type="button"
                        onClick={() => updateLineItem(index, 'unit', 'bulan')}
                        className={`flex-1 transition-colors ${(item.unit ?? 'bulan') === 'bulan' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-slate-50'}`}
                      >bln</button>
                      <button
                        type="button"
                        onClick={() => updateLineItem(index, 'unit', 'pertemuan')}
                        className={`flex-1 transition-colors ${item.unit === 'pertemuan' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-slate-50'}`}
                      >pertm</button>
                    </div>
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
              <div className="col-span-1 flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleDeduction(index)}
                  className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${item.is_deduction ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                >
                  {item.is_deduction ? '-' : '+'}
                </button>
                {!item.is_deduction && (
                  <button
                    type="button"
                    onClick={() => toggleShowQty(index)}
                    title={item.show_qty === false ? 'Tampilkan Qty & Satuan' : 'Sembunyikan Qty & Satuan (nominal tetap)'}
                    className="px-1.5 py-0.5 text-[10px] rounded-full font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    {item.show_qty === false ? 'Rinci' : 'Ringkas'}
                  </button>
                )}
              </div>
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => setLineItems(prev => prev.filter((_, i) => i !== index))}
                  disabled={lineItems.length === 1}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t flex justify-end">
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Total Tagihan</p>
            <p className="text-xl font-bold text-gray-900">{formatRupiah(totalDue)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}
