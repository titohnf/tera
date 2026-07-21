'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteInvoice, deletePayment, recordPayment, updateInvoiceStatus, updatePayment } from '@/lib/actions/admin/invoices'
import { stripClassUniqueTag } from '@/lib/format-class-name'
import { getMonthlyBreakdown, formatPeriodLabel } from '@/lib/billing-message'

export type Payment = {
  id: string
  amount: number
  paid_at: string
  created_at: string
}

export type InvoiceItem = {
  id: string
  invoice_number: string
  total_due: number
  issued_at: string
  due_date: string | null
  status: string
  eff_status: string
  payments: Payment[]
  isMonthly: boolean
}

export type ClassGroup = {
  classId: string | null
  className: string
  invoices: InvoiceItem[]
  classStartDate?: string | null
  classEndDate?: string | null
}

interface Props {
  groups: ClassGroup[]
  studentName?: string
  studentNickname?: string
  parentPhone?: string
}

const INV_STATUS_LABEL: Record<string, string> = {
  draft:           'Draft',
  sent:            'Terkirim',
  partially_paid:  'Angsuran',
  paid:            'Lunas',
}

const INV_STATUS_BADGE: Record<string, string> = {
  draft:           'bg-gray-100 text-gray-500',
  sent:            'bg-blue-100 text-blue-700',
  partially_paid:  'bg-yellow-100 text-yellow-700',
  paid:            'bg-green-100 text-green-700',
}

const PROGRESS_BAR_COLOR: Record<string, string> = {
  draft:           'bg-slate-200',
  sent:            'bg-blue-300',
  partially_paid:  'bg-yellow-400',
  paid:            'bg-green-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
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

// One card = one invoice (a class can have several invoices over time,
// especially with monthly billing, and each is its own independent
// document with its own total/progress/status — bundling them into a
// single class-level card made the progress bar and status meaningless
// once a class had more than one invoice).
function InvoiceCard({
  group,
  invoice,
  studentName,
  studentNickname,
  parentPhone,
}: {
  group: ClassGroup
  invoice: InvoiceItem | null
  studentName?: string
  studentNickname?: string
  parentPhone?: string
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => { setIsOpen(true) }, [])
  const [isPending, startTransition] = useTransition()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [editingPayment, setEditingPayment] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editPaidAt, setEditPaidAt] = useState('')
  const [editError, setEditError] = useState('')
  const openMenuRef = useRef<HTMLDivElement>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    if (!openMenu) return
    function handleClickOutside(e: MouseEvent) {
      if (openMenuRef.current && !openMenuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenu])

  const today = new Date().toISOString().slice(0, 10)

  if (!invoice) {
    return (
      <div className="px-5 py-4">
        <p className="text-sm font-medium text-gray-900">{group.className}</p>
        <p className="text-sm text-gray-400 mt-1">Belum ada invoice untuk kelas ini.</p>
      </div>
    )
  }

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const kekurangan = Math.max(0, invoice.total_due - totalPaid)
  const progressPct = invoice.total_due > 0 ? Math.min(100, Math.round((totalPaid / invoice.total_due) * 100)) : 0
  const isPaidOff = invoice.status === 'paid'
  const badgeKey = INV_STATUS_BADGE[invoice.status] ? invoice.status : 'sent'

  const invPayments = [...invoice.payments].sort((a, b) => {
    const diff = new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime()
    return diff !== 0 ? diff : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  function handleKirim() {
    startTransition(async () => {
      await updateInvoiceStatus(invoice!.id, 'sent')
      router.refresh()

      if (parentPhone) {
        const childName = studentNickname || studentName || ''
        const cleanClassName = stripClassUniqueTag(group.className)
        const pdfUrl = `${window.location.origin}/api/invoices/${invoice!.id}/pdf`

        let billingLines: string[]
        if (invoice!.isMonthly) {
          // Monthly invoices already cover just this one month — no
          // semester breakdown, that would misrepresent it as the whole
          // enrollment's total.
          billingLines = [`Total Tagihan: ${formatRupiah(invoice!.total_due)}`]
        } else {
          const breakdown = getMonthlyBreakdown(invoice!.total_due, group.classStartDate, group.classEndDate)
          const periodLabel = formatPeriodLabel(group.classStartDate, group.classEndDate)
          billingLines = breakdown.length > 0
            ? [
                `Total Tagihan 1 Semester${periodLabel ? ` (${periodLabel})` : ''} sebesar ${formatRupiah(invoice!.total_due)}.`,
                '',
                `Pembayaran dapat dilakukan secara bertahap setiap bulannya sebesar:`,
                ...breakdown.map(m => `${m.label} : ${formatRupiah(m.amount)}`),
              ]
            : [`Total Tagihan: ${formatRupiah(invoice!.total_due)}`]
        }

        const lines = [
          `Assalamu'alaikum Ayah/Bunda.`,
          `Semoga sehat selalu dan diberikan kelancaran dalam aktivitasnya.`,
          '',
          `Berikut kami sampaikan tagihan les Ananda ${childName} untuk kelas ${cleanClassName}:`,
          '',
          `No. Invoice: ${invoice!.invoice_number}`,
          ...billingLines,
          '',
          `Terlampir file PDF invoice (${pdfUrl}).`,
          '',
          `Terima kasih atas kepercayaannya kepada Bimbel Tera.`,
          `Semoga ilmu yang didapat memberikan manfaat dan kebaikan pada Ananda.`,
        ].join('\n')
        const waUrl = `https://wa.me/${formatWaPhone(parentPhone)}?text=${encodeURIComponent(lines)}`
        window.open(waUrl, '_blank')
      }
    })
  }

  function handleKirimPengingat() {
    if (!parentPhone) return
    const childName = studentNickname || studentName || ''
    const cleanClassName = stripClassUniqueTag(group.className)
    const sisa = kekurangan
    const pengingatUrl = `${window.location.origin}/api/invoices/${invoice!.id}/pengingat/pdf`
    const breakdown = invoice!.isMonthly ? [] : getMonthlyBreakdown(invoice!.total_due, group.classStartDate, group.classEndDate)

    const billingLines = breakdown.length > 0
      ? [
          `Sudah dibayar:`,
          ...invPayments.map((p, i) => `- Tahap ${i + 1} - ${breakdown[i]?.label ?? `Bulan ${i + 1}`}: ${formatRupiah(p.amount)}`),
          '',
          `Sisa Pembayaran: ${formatRupiah(sisa)}`,
          '',
          `Pembayaran dapat dilakukan secara bertahap setiap bulannya sebesar:`,
          ...breakdown.slice(invPayments.length).map(m => `${m.label} : ${formatRupiah(m.amount)}`),
        ]
      : [
          ...invPayments.map((p, i) => `Sudah dibayar Tahap ${i + 1} (${formatDate(p.paid_at)}): ${formatRupiah(p.amount)}`),
          '',
          `Sisa Pembayaran: ${formatRupiah(sisa)}`,
        ]

    const lines = [
      `Assalamu'alaikum Ayah/Bunda.`,
      '',
      `Izin mengingatkan untuk sisa tagihan les Ananda ${childName} untuk kelas ${cleanClassName} sebagai berikut:`,
      '',
      `Referensi No. Invoice: ${invoice!.invoice_number}`,
      `Total Tagihan: ${formatRupiah(invoice!.total_due)}`,
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

  function handleRecordPayment() {
    const parsed = Number(paymentAmount) || 0
    if (parsed <= 0) { setPaymentError('Masukkan jumlah pembayaran'); return }
    if (!paymentDate) { setPaymentError('Masukkan tanggal pembayaran'); return }
    setPaymentError('')
    startTransition(async () => {
      const res = await recordPayment(invoice!.id, parsed, paymentDate)
      if (res && 'error' in res) { setPaymentError(res.error ?? 'Gagal'); return }
      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentDate('')
      router.refresh()
    })
  }

  function handleKirimKuitansi(payment: Payment, tahap: number) {
    if (!parentPhone) return
    const childName = studentNickname || studentName || ''
    const cleanClassName = stripClassUniqueTag(group.className)
    const kuitansiUrl = `${window.location.origin}/api/invoices/${invoice!.id}/kuitansi/${payment.id}/pdf`
    const lines = [
      `Assalamu'alaikum Ayah/Bunda.`,
      '',
      `Terlampir kuitansi pembayaran les Ananda ${childName} untuk kelas ${cleanClassName}, Tahap ${tahap}${isPaidOff ? ' (Lunas)' : ''} sebesar ${formatRupiah(payment.amount)}.`,
      '',
      kuitansiUrl,
      '',
      `Terima kasih atas kepercayaannya kepada Bimbel Tera.`,
    ].join('\n')
    const waUrl = `https://wa.me/${formatWaPhone(parentPhone)}?text=${encodeURIComponent(lines)}`
    window.open(waUrl, '_blank')
  }

  function handleDeleteInvoice() {
    if (!confirm('Hapus invoice ini?')) return
    startTransition(async () => {
      const res = await deleteInvoice(invoice!.id)
      if (res && 'error' in res) { alert(res.error); return }
      router.refresh()
    })
  }

  function handleUpdatePayment(paymentId: string) {
    const parsed = Number(editAmount) || 0
    if (parsed <= 0) { setEditError('Masukkan jumlah'); return }
    if (!editPaidAt) { setEditError('Masukkan tanggal'); return }
    setEditError('')
    startTransition(async () => {
      const res = await updatePayment(paymentId, parsed, editPaidAt)
      if (res && 'error' in res) { setEditError(res.error ?? 'Gagal'); return }
      setEditingPayment(null)
      router.refresh()
    })
  }

  function handleDeletePayment(paymentId: string) {
    if (!confirm('Hapus pembayaran ini?')) return
    startTransition(async () => {
      await deletePayment(paymentId)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Invoice number (dominant, class name as its label) + actions — always visible */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <div className="min-w-0 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 font-mono truncate">{invoice.invoice_number}</span>
            <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-lg shrink-0 ${INV_STATUS_BADGE[badgeKey]}`}>
              {INV_STATUS_LABEL[badgeKey]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{group.className}</p>
        </div>
        <span className="flex-1" />
        <span className="text-sm font-semibold text-gray-700 shrink-0">{formatRupiah(invoice.total_due)}</span>
        <a
          href={`/admin/invoices/${invoice.id}/cetak?preview=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
        >
          Lihat
        </a>
        {!isPaidOff && (
          <div className="relative shrink-0" ref={openMenu === invoice.id ? openMenuRef : null}>
            <button
              onClick={() => setOpenMenu(openMenu === invoice.id ? null : invoice.id)}
              className="flex items-center justify-center w-7 h-7 text-gray-400 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {openMenu === invoice.id && (
              <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg ring-1 ring-gray-900/10 py-1 z-20">
                <button
                  onClick={() => { setOpenMenu(null); handleKirimPengingat() }}
                  disabled={invoice.status === 'draft' || !parentPhone}
                  title={invoice.status === 'draft' ? 'Kirim invoice ini dulu' : !parentPhone ? 'Nomor WhatsApp orang tua belum ada' : undefined}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Kirim Pengingat
                </button>
                <button
                  onClick={() => { setOpenMenu(null); setPaymentAmount(''); setPaymentDate(today); setPaymentError(''); setShowPaymentModal(true) }}
                  disabled={invoice.status === 'draft'}
                  title={invoice.status === 'draft' ? 'Kirim invoice ini dulu' : undefined}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 013 18V6.75A2.25 2.25 0 015.25 4.5h9a2.25 2.25 0 012.25 2.25v.75z" />
                  </svg>
                  Catat Pembayaran
                </button>
                <div className="border-t border-slate-100 my-0.5" />
                <button
                  onClick={() => { setOpenMenu(null); handleKirim() }}
                  disabled={isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  {invoice.status === 'draft' ? 'Kirim Invoice' : 'Kirim Ulang Invoice'}
                </button>
                <a
                  href={`/admin/invoices/${invoice.id}/cetak?print=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenMenu(null)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659" />
                  </svg>
                  Cetak Invoice
                </a>
                <div className="border-t border-slate-100 my-0.5" />
                <a
                  href={`/admin/invoices/${invoice.id}/edit`}
                  onClick={() => setOpenMenu(null)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                  Edit
                </a>
                <div className="border-t border-slate-100 my-0.5" />
                <button
                  onClick={() => { setOpenMenu(null); handleDeleteInvoice() }}
                  disabled={isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Hapus
                </button>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(v => !v)}
          className="w-7 h-7 flex items-center justify-center text-gray-400 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs text-gray-400">
                {kekurangan > 0 ? (
                  <>Kurang <span className="font-medium text-gray-600">{formatRupiah(kekurangan)}</span></>
                ) : (
                  'Lunas'
                )}
              </span>
              <span className="text-xs font-medium text-gray-500 shrink-0">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${PROGRESS_BAR_COLOR[badgeKey]}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Payment history */}
          {invPayments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Riwayat Pembayaran</p>
              <div className="space-y-2.5">
                {[...invPayments].reverse().map((p, displayIdx) => {
                  const tahap = invPayments.length - displayIdx
                  const isLast = tahap === invPayments.length
                  return (
                    <div key={p.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`shrink-0 inline-block rounded-full ${isLast ? 'animate-pulse bg-gray-500' : 'bg-gray-300'}`}
                          style={{ width: '8px', height: '8px' }}
                        />
                        <span className="text-[14px] text-gray-700">Tahap {tahap}</span>
                        <span className="text-xs text-gray-400">{formatDate(p.paid_at)}</span>
                        <span className="flex-1" />
                        <span className="text-sm font-medium text-gray-800 shrink-0">{formatRupiah(p.amount)}</span>
                        <a
                          href={`/admin/invoices/${invoice.id}/kuitansi/${p.id}?preview=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                        >
                          Lihat
                        </a>
                        <div className="relative shrink-0" ref={openMenu === p.id ? openMenuRef : null}>
                          <button
                            onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                            className="flex items-center justify-center w-7 h-7 text-gray-400 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>
                          {openMenu === p.id && (
                            <div className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-lg ring-1 ring-gray-900/10 py-1 z-20">
                              <button
                                onClick={() => { setOpenMenu(null); handleKirimKuitansi(p, tahap) }}
                                disabled={isPending}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                                Kirim
                              </button>
                              <a
                                href={`/admin/invoices/${invoice.id}/kuitansi/${p.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenMenu(null)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659" />
                                </svg>
                                Cetak Kuitansi
                              </a>
                              <div className="border-t border-slate-100 my-0.5" />
                              <button
                                onClick={() => {
                                  setOpenMenu(null)
                                  setEditingPayment(p.id)
                                  setEditAmount(String(p.amount))
                                  setEditPaidAt(p.paid_at.slice(0, 10))
                                  setEditError('')
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                </svg>
                                Edit
                              </button>
                              <div className="border-t border-slate-100 my-0.5" />
                              <button
                                onClick={() => { setOpenMenu(null); handleDeletePayment(p.id) }}
                                disabled={isPending}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                              >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Inline edit form */}
                      {editingPayment === p.id && (
                        <div className="ml-4 pl-3 border-l-2 border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="date"
                              value={editPaidAt}
                              onChange={e => setEditPaidAt(e.target.value)}
                              max={today}
                              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">Rp</span>
                              <input
                                type="number"
                                min={1}
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                autoFocus
                                className="border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400 w-36"
                              />
                            </div>
                            <button
                              onClick={() => handleUpdatePayment(p.id)}
                              disabled={isPending}
                              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors"
                            >
                              {isPending ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            <button
                              onClick={() => { setEditingPayment(null); setEditError('') }}
                              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                          {editError && <p className="text-xs text-red-600">{editError}</p>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Catat Pembayaran</p>
              <button
                onClick={() => { setShowPaymentModal(false); setPaymentAmount(''); setPaymentDate(''); setPaymentError('') }}
                className="w-7 h-7 flex items-center justify-center text-gray-400 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tanggal Bayar</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  max={today}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Jumlah</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">Rp</span>
                  <input
                    type="number"
                    min={1}
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                {kekurangan > 0 && (
                  <button
                    onClick={() => setPaymentAmount(String(kekurangan))}
                    className="mt-1.5 text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Isi penuh — {formatRupiah(kekurangan)}
                  </button>
                )}
              </div>
              {paymentError && <p className="text-xs text-red-600">{paymentError}</p>}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowPaymentModal(false); setPaymentAmount(''); setPaymentDate(''); setPaymentError('') }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={isPending || (Number(paymentAmount) || 0) <= 0}
                className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {isPending ? 'Menyimpan...' : (Number(paymentAmount) || 0) >= kekurangan && kekurangan > 0 ? 'Tandai Lunas' : 'Catat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentClassInvoiceTable({ groups, studentName, studentNickname, parentPhone }: Props) {
  if (groups.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-10">Belum ada invoice untuk siswa ini.</p>
  }

  const cards = groups.flatMap(group =>
    group.invoices.length > 0
      ? group.invoices.map(inv => ({ key: inv.id, group, invoice: inv as InvoiceItem | null }))
      : [{ key: group.classId ?? '__no_class__', group, invoice: null as InvoiceItem | null }]
  )

  return (
    <div className="space-y-3">
      {cards.map(({ key, group, invoice }) => (
        <div key={key} className="bg-white border border-slate-200 rounded-2xl">
          <InvoiceCard group={group} invoice={invoice} studentName={studentName} studentNickname={studentNickname} parentPhone={parentPhone} />
        </div>
      ))}
    </div>
  )
}
