'use client'

import { useState } from 'react'
import { stripClassUniqueTag } from '@/lib/format-class-name'
import { getMonthlyBreakdown } from '@/lib/billing-message'

export type PengingatClass = {
  classId: string | null
  className: string
  invoiceId: string
  invoiceNumber: string
  totalDue: number
  payments: { amount: number; paid_at: string }[]
  classStartDate: string | null
  classEndDate: string | null
  remaining: number
  studentName?: string
}

interface Props {
  studentName?: string
  studentNickname?: string
  parentPhone?: string
  pengingatClasses: PengingatClass[]
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatWaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  return '62' + digits
}

export default function KirimPengingatButton({ studentName, studentNickname, parentPhone, pengingatClasses }: Props) {
  const [open, setOpen] = useState(false)

  const multi = pengingatClasses.length > 1

  function send(pc: PengingatClass) {
    if (!parentPhone) return
    const childName = studentNickname || studentName || pc.studentName || ''
    const cleanClassName = stripClassUniqueTag(pc.className)
    const payments = [...pc.payments].sort((a, b) => new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime())
    const paidForInvoice = payments.reduce((s, p) => s + p.amount, 0)
    const sisa = Math.max(0, pc.totalDue - paidForInvoice)
    const pengingatUrl = `${window.location.origin}/api/invoices/${pc.invoiceId}/pengingat/pdf`
    const breakdown = getMonthlyBreakdown(pc.totalDue, pc.classStartDate, pc.classEndDate)

    const billingLines = breakdown.length > 0
      ? [
          ...payments.map((p, i) => `Sudah dibayar Tahap ${i + 1} - ${breakdown[i]?.label ?? `Bulan ${i + 1}`}: ${formatRupiah(p.amount)}`),
          '',
          `Sisa Pembayaran: ${formatRupiah(sisa)}`,
          '',
          `Pembayaran dapat dilakukan bertahap secara bertahap setiap bulannya sebesar:`,
          ...breakdown.slice(payments.length).map(m => `${m.label} : ${formatRupiah(m.amount)}`),
        ]
      : [
          `Sudah dibayar: ${formatRupiah(paidForInvoice)}`,
          '',
          `Sisa Pembayaran: ${formatRupiah(sisa)}`,
        ]

    const lines = [
      `Assalamu'alaikum Ayah/Bunda.`,
      '',
      `Izin mengingatkan untuk sisa tagihan les Ananda ${childName} untuk kelas ${cleanClassName} sebagai berikut:`,
      '',
      `Referensi No. Invoice: ${pc.invoiceNumber}`,
      `Total Tagihan: ${formatRupiah(pc.totalDue)}`,
      '',
      ...billingLines,
      '',
      `Terlampir surat pemberitahuan tagihan (${pengingatUrl}).`,
      '',
      `Terima kasih atas kepercayaannya kepada Bimbel Tera.`,
    ].join('\n')
    const waUrl = `https://wa.me/${formatWaPhone(parentPhone)}?text=${encodeURIComponent(lines)}`
    window.open(waUrl, '_blank')
  }

  function handleOpen() {
    if (!multi) { send(pengingatClasses[0]); return }
    setOpen(true)
  }

  if (pengingatClasses.length === 0) return null

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Kirim Pengingat
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-gray-800">Kirim Pengingat</p>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pilih Kelas</p>
              {pengingatClasses.map(pc => (
                <button
                  key={pc.invoiceId}
                  onClick={() => { send(pc); setOpen(false) }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <div>
                    {pc.studentName && <p className="text-xs text-gray-400">{pc.studentName}</p>}
                    <p className="text-sm font-medium text-gray-800">{pc.className}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{formatRupiah(pc.remaining)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
