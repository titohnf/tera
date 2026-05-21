'use client'

import { useState, useTransition } from 'react'
import { resetSession } from '@/lib/actions/admin/sessions'

export default function ResetSessionButton({ sessionId }: { sessionId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    startTransition(async () => {
      const result = await resetSession(sessionId)
      if (result?.error) {
        setError(result.error)
        setConfirming(false)
        return
      }
      window.location.reload()
    })
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 text-xs font-medium rounded-lg transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset Sesi
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <span className="text-xs text-gray-500">Yakin reset semua data sesi?</span>
      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Mereset...' : 'Ya, Reset'}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="px-3 py-1.5 border text-xs font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Batal
      </button>
    </div>
  )
}
