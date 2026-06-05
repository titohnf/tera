'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recordPayment } from '@/lib/actions/admin/invoices'

export type PayableClass = {
  classId: string | null
  className: string
  invoiceId: string
  remaining: number
  bulanLabel: string
}

interface Props {
  payableClasses: PayableClass[]
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function CatatPembayaranButton({ payableClasses }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<PayableClass | null>(null)
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState('')
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const multiClass = payableClasses.length > 1
  const parsed = Number(amount) || 0

  function handleOpen() {
    setError('')
    setAmount('')
    setPaidAt(today)
    if (payableClasses.length === 1) {
      setSelected(payableClasses[0])
    } else {
      setSelected(null)
    }
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setSelected(null)
    setAmount('')
    setPaidAt('')
    setError('')
  }

  function handleRecord() {
    if (!selected || parsed <= 0) { setError('Masukkan jumlah pembayaran'); return }
    if (!paidAt) { setError('Masukkan tanggal pembayaran'); return }
    setError('')
    startTransition(async () => {
      const res = await recordPayment(selected.invoiceId, parsed, paidAt)
      if ('error' in res) { setError(res.error ?? 'Gagal'); return }
      handleClose()
      router.refresh()
    })
  }

  if (payableClasses.length === 0) return null

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Catat Pembayaran
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-gray-800">Catat Pembayaran</p>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">

              {/* Step 1: pick class (only if multiple) */}
              {multiClass && !selected && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pilih Kelas</p>
                  {payableClasses.map(pc => (
                    <button
                      key={pc.classId ?? '__no_class__'}
                      onClick={() => setSelected(pc)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{pc.className}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{pc.bulanLabel}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{formatRupiah(pc.remaining)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: payment form */}
              {selected && (
                <div className="space-y-4">
                  {/* Context labels */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {multiClass && (
                      <button
                        onClick={() => { setSelected(null); setAmount(''); setError('') }}
                        className="flex items-center gap-1 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Ganti kelas
                      </button>
                    )}
                    <span>Kelas: <span className="font-medium text-gray-600">{selected.className}</span></span>
                  </div>

                  {/* Tanggal pembayaran */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tanggal Pembayaran</label>
                    <input
                      type="date"
                      value={paidAt}
                      onChange={e => setPaidAt(e.target.value)}
                      max={today}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>

                  {/* Nominal input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nominal</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none">Rp</span>
                      <input
                        type="number"
                        min={1}
                        max={selected.remaining}
                        placeholder={String(selected.remaining)}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        autoFocus
                        className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAmount(String(selected.remaining))}
                      className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      Isi penuh — {formatRupiah(selected.remaining)}
                    </button>
                  </div>

                  {error && <p className="text-xs text-red-600">{error}</p>}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleRecord}
                      disabled={isPending || parsed <= 0}
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 disabled:opacity-60 transition-colors"
                    >
                      {isPending ? 'Menyimpan...' : parsed >= selected.remaining && selected.remaining > 0 ? 'Tandai Lunas' : 'Catat'}
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
