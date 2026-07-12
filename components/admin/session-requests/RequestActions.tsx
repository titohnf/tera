'use client'

import { useTransition } from 'react'
import { approveSessionChangeRequest, rejectSessionChangeRequest } from '@/lib/actions/admin/session-requests'

export default function RequestActions({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition()

  function approve() {
    if (!confirm('Setujui pengajuan ini? Perubahan akan langsung diterapkan ke sesi.')) return
    startTransition(() => { void approveSessionChangeRequest(requestId) })
  }

  function reject() {
    const note = prompt('Catatan untuk tutor (opsional):') ?? ''
    startTransition(() => { void rejectSessionChangeRequest(requestId, note) })
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        type="button"
        disabled={pending}
        onClick={approve}
        className="px-3 py-1.5 text-sm font-medium text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
      >
        Setujui
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={reject}
        className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        Tolak
      </button>
    </div>
  )
}
