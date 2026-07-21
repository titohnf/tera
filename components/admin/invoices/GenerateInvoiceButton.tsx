'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateFirstInvoice } from '@/lib/actions/admin/invoices'

// Only classes with no invoice yet — per-class billing is meant to be a
// single invoice document (see "Kirim Pengingat" for ongoing installment
// reminders instead of issuing a new invoice each month).
export type GeneratableClass = {
  classId: string | null
  className: string
  studentId?: string
  studentName?: string
}

interface Props {
  studentId?: string
  generatableClasses: GeneratableClass[]
}

export default function GenerateInvoiceButton({ studentId, generatableClasses }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  const multi = generatableClasses.length > 1

  function handleOpen() {
    setError('')
    setOpen(true)
    if (!multi) handleGenerate(generatableClasses[0])
  }

  function handleClose() {
    setOpen(false)
    setError('')
  }

  function handleGenerate(gc: GeneratableClass) {
    setError('')
    startTransition(async () => {
      const sid = gc.studentId ?? studentId ?? ''
      const classId = gc.classId ?? ''
      const res = await generateFirstInvoice(sid, classId)
      if (res && 'error' in res) { setError(res.error ?? 'Gagal'); return }
      handleClose()
      router.refresh()
    })
  }

  if (generatableClasses.length === 0) return null

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {isPending ? 'Membuat...' : 'Invoice Persemester'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-gray-800">Invoice Persemester</p>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pilih Kelas</p>
              {generatableClasses.map(gc => (
                <button
                  key={`${gc.studentId ?? ''}__${gc.classId ?? '__no_class__'}`}
                  onClick={() => handleGenerate(gc)}
                  disabled={isPending}
                  className="w-full flex items-center justify-between px-4 py-3 text-left border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 transition-colors"
                >
                  <div>
                    {gc.studentName && <p className="text-xs text-gray-400">{gc.studentName}</p>}
                    <p className="text-sm font-medium text-gray-800">{gc.className}</p>
                  </div>
                </button>
              ))}
              {error && <p className="text-xs text-red-600 pt-1">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
