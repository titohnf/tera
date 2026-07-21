'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteInvoice, deletePayment, updateInvoiceStatus, updatePayment } from '@/lib/actions/admin/invoices'
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

  function handleKirimKuitansi(payment: Payment, tahap: number) {
    if (!parentPhone) return
    const childName = studentNickname || studentName || ''
    const cleanClassName = stripClassUniqueTag(group.className)
    const kuitansiUrl = `${window.location.origin}/api/invoices/${invoice!.id}/kuitansi/${payment.id}/pdf`
    const lines = [
      `Assalamu'alaikum Ayah/Bunda.`,
      '',
      `Terlampir kuitansi pembayaran les Ananda ${childName} untuk kelas ${cleanClassName}, Tahap ${tahap} sebesar ${formatRupiah(payment.amount)}.`,
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
      await deleteInvoice(invoice!.id)
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
        <a
          href={`/admin/invoices/${invoice.id}/cetak?preview=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
        >
          Lihat
        </a>
        <div className="relative shrink-0">
          <button
            onClick={() => setOpenMenu(openMenu === invoice.id ? null : invoice.id)}
            className="flex items-center justify-center w-7 h-7 text-gray-400 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {openMenu === invoice.id && (
            <div className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-lg ring-1 ring-gray-900/10 py-1 z-20">
              <button
                onClick={() => { setOpenMenu(null); handleKirim() }}
                disabled={isPending || isPaidOff}
                title={isPaidOff ? 'Invoice sudah lunas' : undefined}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {invoice.status === 'draft' ? 'Kirim' : 'Kirim Ulang'}
              </button>
              {!isPaidOff && (
                <a
                  href={`/admin/invoices/${invoice.id}/cetak?print=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenMenu(null)}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
                >
                  Cetak Invoice
                </a>
              )}
              <a
                href={`/admin/invoices/${invoice.id}/edit`}
                onClick={() => setOpenMenu(null)}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
              >
                Edit
              </a>
              <div className="border-t border-slate-100 my-0.5" />
              <button
                onClick={() => { setOpenMenu(null); handleDeleteInvoice() }}
                disabled={isPending}
                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress segment — its own block, toggles payment history */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={`w-full px-5 py-4 text-left border-t-[0.5px] border-slate-100 hover:bg-slate-50 transition-colors ${isOpen ? '' : 'rounded-b-2xl'}`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-xs text-gray-400">
            {kekurangan > 0 ? (
              <>Kurang <span className="font-medium text-gray-600">{formatRupiah(kekurangan)}</span></>
            ) : (
              'Lunas'
            )}
          </span>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-sm font-semibold text-gray-700">{formatRupiah(invoice.total_due)}</span>
            <span className="w-7 h-7 flex items-center justify-center shrink-0">
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${PROGRESS_BAR_COLOR[badgeKey]}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">

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
                        <button
                          onClick={() => handleKirimKuitansi(p, tahap)}
                          disabled={isPending}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                        >
                          Kirim
                        </button>
                        <a
                          href={`/admin/invoices/${invoice.id}/kuitansi/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                        >
                          Cetak Kuitansi
                        </a>
                        <div className="relative shrink-0">
                          <button
                            onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                            className="flex items-center justify-center w-7 h-7 text-gray-400 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>
                          {openMenu === p.id && (
                            <div className="absolute right-0 top-8 w-28 bg-white rounded-xl shadow-lg ring-1 ring-gray-900/10 py-1 z-20">
                              <button
                                onClick={() => {
                                  setOpenMenu(null)
                                  setEditingPayment(p.id)
                                  setEditAmount(String(p.amount))
                                  setEditPaidAt(p.paid_at.slice(0, 10))
                                  setEditError('')
                                }}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
                              >
                                Edit
                              </button>
                              <div className="border-t border-slate-100 my-0.5" />
                              <button
                                onClick={() => { setOpenMenu(null); handleDeletePayment(p.id) }}
                                disabled={isPending}
                                className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                              >
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
        <div key={key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <InvoiceCard group={group} invoice={invoice} studentName={studentName} studentNickname={studentNickname} parentPhone={parentPhone} />
        </div>
      ))}
    </div>
  )
}
