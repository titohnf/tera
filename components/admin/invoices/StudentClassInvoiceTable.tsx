'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteInvoice, deletePayment, updateInvoiceStatus, updatePayment } from '@/lib/actions/admin/invoices'

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
}

export type ClassGroup = {
  classId: string | null
  className: string
  invoices: InvoiceItem[]
}

interface Props {
  groups: ClassGroup[]
  studentName?: string
  studentNickname?: string
  parentPhone?: string
}

const INV_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  sent:  'Terkirim',
}

const INV_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  sent:  'bg-blue-100 text-blue-700',
}

const CLASS_STATUS_BADGE: Record<string, string> = {
  lunas:    'bg-green-100 text-green-700',
  angsuran: 'bg-yellow-100 text-yellow-700',
  menunggu: 'bg-gray-100 text-gray-500',
}

const CLASS_STATUS_LABEL: Record<string, string> = {
  lunas:    'Lunas',
  angsuran: 'Angsuran',
  menunggu: 'Menunggu',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function classStatus(kekurangan: number, latestPaid: number, classPrice: number): 'lunas' | 'angsuran' | 'menunggu' {
  if (kekurangan === 0 && classPrice > 0) return 'lunas'
  if (latestPaid > 0 || kekurangan < classPrice) return 'angsuran'
  return 'menunggu'
}

function formatWaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  return '62' + digits
}

// Class names carry a trailing per-student suffix (e.g. "Privat 2 SD ... Jagad")
// used to keep otherwise-identical class names unique; strip it for messaging.
function stripUniqueSuffix(className: string, ...names: (string | undefined)[]): string {
  for (const name of names) {
    const trimmed = name?.trim()
    if (!trimmed) continue
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\s+${escaped}$`, 'i')
    if (re.test(className)) return className.replace(re, '').trim()
  }
  return className
}

function ClassCard({
  group,
  studentName,
  studentNickname,
  parentPhone,
}: {
  group: ClassGroup
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

  // First (oldest) invoice holds the canonical class price
  const classPrice = group.invoices[group.invoices.length - 1]?.total_due ?? 0

  // All payments across all invoices, sorted chronologically for tahap numbering
  const allPayments = group.invoices
    .flatMap(inv => inv.payments.map(p => ({ ...p, invoiceId: inv.id })))
    .sort((a, b) => {
      const diff = new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime()
      return diff !== 0 ? diff : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

  // Total paid = sum of all payments across every invoice in the chain
  const totalActuallyPaid = allPayments.reduce((s, p) => s + p.amount, 0)
  const kekurangan = Math.max(0, classPrice - totalActuallyPaid)
  const progressPct = classPrice > 0 ? Math.min(100, Math.round((totalActuallyPaid / classPrice) * 100)) : 0
  const status = classStatus(kekurangan, totalActuallyPaid, classPrice)

  function handleKirim(invoiceId: string) {
    const inv = group.invoices.find(i => i.id === invoiceId)
    startTransition(async () => {
      await updateInvoiceStatus(invoiceId, 'sent')
      router.refresh()

      if (parentPhone && inv) {
        const childName = studentNickname || studentName || ''
        const cleanClassName = stripUniqueSuffix(group.className, studentNickname, studentName)
        const pdfUrl = `${window.location.origin}/api/invoices/${inv.id}/pdf`
        const lines = [
          `Assalamu'alaikum Ayah/Bunda.`,
          `Semoga sehat selalu dan diberikan kelancaran dalam aktivitasnya.`,
          '',
          `Berikut kami sampaikan tagihan les Ananda ${childName} untuk kelas ${cleanClassName}:`,
          '',
          `No. Invoice: ${inv.invoice_number}`,
          `Total Tagihan: ${formatRupiah(classPrice)}`,
          `Sudah bayar: ${formatRupiah(totalActuallyPaid)}`,
          `Sisa Tagihan: ${formatRupiah(kekurangan)}`,
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

  function handleDeleteInvoice(invoiceId: string) {
    if (!confirm('Hapus invoice ini?')) return
    startTransition(async () => {
      await deleteInvoice(invoiceId)
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
      {/* Class header */}
      <div className={`hover:bg-slate-50 transition-colors overflow-hidden ${isOpen ? 'rounded-t-2xl' : 'rounded-2xl'}`}>
        <button
          type="button"
          onClick={() => setIsOpen(v => !v)}
          className="w-full px-5 pt-4 pb-3 text-left"
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{group.className}</p>
              {kekurangan > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Kurang <span className="font-medium text-gray-600">{formatRupiah(kekurangan)}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-sm font-semibold text-gray-700">{formatRupiah(classPrice)}</span>
              <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${CLASS_STATUS_BADGE[status]}`}>
                {CLASS_STATUS_LABEL[status]}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${status === 'lunas' ? 'bg-green-400' : status === 'angsuran' ? 'bg-yellow-400' : 'bg-slate-200'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">

          {/* Invoice list */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Invoice</p>
            {group.invoices.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada invoice untuk kelas ini.</p>
            ) : (
            <div className="space-y-2.5">
              {group.invoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-900 truncate">{inv.invoice_number}</span>
                  <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-lg shrink-0 ${inv.status === 'draft' ? INV_STATUS_BADGE.draft : INV_STATUS_BADGE.sent}`}>
                    {inv.status === 'draft' ? INV_STATUS_LABEL.draft : INV_STATUS_LABEL.sent}
                  </span>
                  <span className="flex-1" />
                  <a
                    href={`/admin/invoices/${inv.id}/cetak?preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                  >
                    Lihat
                  </a>
                  <button
                    onClick={() => handleKirim(inv.id)}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors shrink-0"
                  >
                    {inv.status === 'draft' ? 'Kirim' : 'Kirim Ulang'}
                  </button>
                  <a
                    href={`/admin/invoices/${inv.id}/cetak?print=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                  >
                    Cetak Invoice
                  </a>
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)}
                      className="flex items-center justify-center w-7 h-7 text-gray-400 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                    {openMenu === inv.id && (
                      <div className="absolute right-0 top-8 w-32 bg-white rounded-xl shadow-lg ring-1 ring-gray-900/10 py-1 z-20">
                        <a
                          href={`/admin/invoices/${inv.id}/edit`}
                          onClick={() => setOpenMenu(null)}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-slate-50 transition-colors"
                        >
                          Edit
                        </a>
                        <div className="border-t border-slate-100 my-0.5" />
                        <button
                          onClick={() => { setOpenMenu(null); handleDeleteInvoice(inv.id) }}
                          disabled={isPending}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* Payment history */}
          {allPayments.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Riwayat Pembayaran</p>
              <div className="space-y-2.5">
                {[...allPayments].reverse().map((p, displayIdx) => {
                  const tahap = allPayments.length - displayIdx
                  const isLast = tahap === allPayments.length
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
                          href={`/admin/invoices/${p.invoiceId}/kuitansi/${p.id}`}
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

  return (
    <div className="space-y-3">
      {groups.map(group => (
        <div key={group.classId ?? '__no_class__'} className="bg-white border border-slate-200 rounded-2xl">
          <ClassCard group={group} studentName={studentName} studentNickname={studentNickname} parentPhone={parentPhone} />
        </div>
      ))}
    </div>
  )
}
