'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { requestPayrollReReview } from '@/lib/actions/tutor/payroll-review'

export default function RequestPayrollReReview({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      const result = await requestPayrollReReview(sessionId, note)
      if (result.error) {
        setError(result.error)
        return
      }
      setDone(true)
      router.refresh()
    })
  }

  if (done) {
    return (
      <p className="text-xs text-red-700 mt-2">
        Peninjauan kembali sudah diajukan — menunggu admin mengecek ulang.
      </p>
    )
  }

  if (!open) {
    return (
      <div className="mt-2">
        <button
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-red-700 border border-red-300 bg-white px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
        >
          Ajukan Peninjauan Kembali
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Jelaskan apa yang sudah diperbaiki..."
        rows={3}
        autoFocus
        className="w-full px-3 py-2 border border-red-300 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending || !note.trim()}
          className="text-xs font-medium text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Mengirim...' : 'Kirim'}
        </button>
        <button
          onClick={() => { setOpen(false); setNote(''); setError('') }}
          disabled={isPending}
          className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          Batal
        </button>
      </div>
    </div>
  )
}
