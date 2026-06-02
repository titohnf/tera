'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createInvoice } from '@/lib/actions/admin/invoices'
import DatePicker from '@/components/ui/DatePicker'

interface Student {
  id: string
  full_name: string
  parent_name?: string | null
}

interface ClassItem {
  id: string
  name: string
  level: string | null
  class_type: string | null
  start_date: string | null
  end_date: string | null
}

interface ClassStudent {
  class_id: string
  student_id: string
}

interface LineItem {
  description: string
  months: number
  amount: number
  is_deduction: boolean
}

interface BillingRate {
  id: string
  class_type: string
  jenjang: string
  jenis: string
  amount: number
}

interface InvoiceFormProps {
  students: Student[]
  classes: ClassItem[]
  classStudents: ClassStudent[]
  billingRates: BillingRate[]
  initialStudentId?: string
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

const today = new Date().toISOString().split('T')[0]

const emptyLine = (): LineItem => ({ description: '', months: 1, amount: 0, is_deduction: false })

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function monthsBetween(startStr: string, endStr: string): number {
  const s = new Date(startStr)
  const e = new Date(endStr)
  return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1)
}

export default function InvoiceForm({ students, classes, classStudents, billingRates, initialStudentId }: InvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const initialStudent = initialStudentId ? students.find(s => s.id === initialStudentId) : undefined
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId ?? '')
  const [studentName, setStudentName] = useState(initialStudent?.full_name ?? '')
  const [parentName, setParentName] = useState(initialStudent?.parent_name ?? '')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issuedAt, setIssuedAt] = useState(today)
  const [dueDate, setDueDate] = useState(addDays(today, 7))
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank')
  const [bankAccount, setBankAccount] = useState('BSI - 7296753275 a.n. Suci Purnama Sari')
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()])
  const [error, setError] = useState('')

  const filteredStudents = selectedClassId
    ? students.filter(s =>
        classStudents.some(cs => cs.class_id === selectedClassId && cs.student_id === s.id)
      )
    : students

  const lineSubtotal = (item: LineItem) =>
    item.months === 0 ? item.amount : item.months * item.amount

  const totalDue = lineItems.reduce((sum, item) =>
    item.is_deduction ? sum - lineSubtotal(item) : sum + lineSubtotal(item), 0)

  function handleIssuedAtChange(date: string) {
    setIssuedAt(date)
    setDueDate(addDays(date, 7))
  }

  function handleClassChange(classId: string) {
    setSelectedClassId(classId)
    setSelectedStudentId('')
    setStudentName('')

    if (!classId) {
      setLineItems([emptyLine()])
      return
    }

    const cls = classes.find(c => c.id === classId)
    if (!cls) return

    const months =
      cls.start_date && cls.end_date ? monthsBetween(cls.start_date, cls.end_date) : 1

    const rate = billingRates.find(
      r => r.class_type === cls.class_type && r.jenjang === cls.level
    )

    const typeLabel = cls.class_type === 'private' ? 'Privat' : 'Grup'
    const description = [typeLabel, cls.level, rate?.jenis].filter(Boolean).join(' ')

    setLineItems([{
      description,
      months,
      amount: rate ? Number(rate.amount) : 0,
      is_deduction: false,
    }])
  }

  function handleStudentChange(studentId: string) {
    setSelectedStudentId(studentId)
    const student = students.find(s => s.id === studentId)
    setStudentName(student?.full_name ?? '')
    if (student?.parent_name) setParentName(student.parent_name)
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

    if (!studentName.trim()) {
      setError('Nama siswa wajib diisi.')
      return
    }
    if (!parentName.trim()) {
      setError('Nama orang tua wajib diisi.')
      return
    }
    if (lineItems.length === 0) {
      setError('Minimal satu baris rincian pembayaran.')
      return
    }

    startTransition(async () => {
      const result = await createInvoice({
        invoice_number: invoiceNumber.trim() || undefined,
        class_id: selectedClassId || null,
        student_id: selectedStudentId || null,
        student_name: studentName.trim(),
        parent_name: parentName.trim(),
        line_items: lineItems,
        total_due: totalDue,
        payment_method: paymentMethod,
        bank_account: bankAccount,
        due_date: dueDate || null,
        issued_at: issuedAt,
        status: 'draft',
      })

      if ('error' in result) {
        setError(result.error ?? 'Terjadi kesalahan')
        return
      }

      router.push(`/admin/invoices/${result.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700 border-b pb-3">Informasi Invoice</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nomor Invoice
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              placeholder="akan digenerate otomatis"
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Kelas (opsional)</label>
            <select
              value={selectedClassId}
              onChange={e => handleClassChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.level ? ` (${c.level})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Siswa</label>
            <select
              value={selectedStudentId}
              onChange={e => handleStudentChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Siswa --</option>
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nama Siswa <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="Nama lengkap siswa"
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nama Orang Tua <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              placeholder="Nama lengkap orang tua"
              className="w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Invoice</label>
            <DatePicker value={issuedAt} onChange={handleIssuedAtChange} />
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
      </div>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Rincian Pembayaran</h2>
          <button
            type="button"
            onClick={addLineItem}
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
            <div className="col-span-4">Keterangan</div>
            <div className="col-span-2 text-center">Bulan</div>
            <div className="col-span-2 text-right">Biaya/bulan</div>
            <div className="col-span-2 text-right">Jumlah (Rp)</div>
            <div className="col-span-1 text-center">Jenis</div>
            <div className="col-span-1"></div>
          </div>

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
                  title={item.is_deduction ? 'Pengurangan' : 'Tagihan'}
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
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <a
          href="/admin/invoices"
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Batal
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Invoice'}
        </button>
      </div>
    </form>
  )
}
