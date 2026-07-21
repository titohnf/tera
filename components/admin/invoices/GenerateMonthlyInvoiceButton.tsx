'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateMonthlyInvoiceForStudent } from '@/lib/actions/admin/invoices'

export type MonthlyInvoiceClass = {
  classId: string
  className: string
  studentId?: string
  studentName?: string
}

interface Props {
  studentId?: string
  classes: MonthlyInvoiceClass[]
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function GenerateMonthlyInvoiceButton({ studentId, classes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<MonthlyInvoiceClass | null>(null)
  const [month, setMonth] = useState(currentMonth())
  const [error, setError] = useState('')

  const multi = classes.length > 1

  function handleOpen() {
    setError('')
    setMonth(currentMonth())
    setSelected(classes.length === 1 ? classes[0] : null)
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    setSelected(null)
    setError('')
  }

  function handleGenerate() {
    if (!selected) return
    setError('')
    startTransition(async () => {
      const sid = selected.studentId ?? studentId ?? ''
      const res = await generateMonthlyInvoiceForStudent(sid, selected.classId, month)
      if (res && 'error' in res) { setError(res.error ?? 'Gagal'); return }
      handleClose()
      router.refresh()
    })
  }

  if (classes.length === 0) return null

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Invoice Bulanan
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-gray-800">Invoice Bulanan</p>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {multi && !selected && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pilih Kelas</p>
                  {classes.map(c => (
                    <button
                      key={`${c.studentId ?? ''}__${c.classId}`}
                      onClick={() => setSelected(c)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <div>
                        {c.studentName && <p className="text-xs text-gray-400">{c.studentName}</p>}
                        <p className="text-sm font-medium text-gray-800">{c.className}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {multi && (
                      <button
                        onClick={() => setSelected(null)}
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bulan Tagihan</label>
                    <input
                      type="month"
                      value={month}
                      onChange={e => setMonth(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                    <p className="text-xs text-gray-400">Jumlah pertemuan dihitung otomatis dari sesi terjadwal di bulan ini.</p>
                  </div>

                  {error && <p className="text-xs text-red-600">{error}</p>}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleGenerate}
                      disabled={isPending}
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-900 disabled:opacity-60 transition-colors"
                    >
                      {isPending ? 'Membuat...' : 'Buat Invoice'}
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
