'use client'

import { useTransition } from 'react'
import { acknowledgeTutorSwapOutcome } from '@/lib/actions/tutor/session-requests'

export default function SwapOutcomeBanner({
  id,
  status,
  adminNote,
}: {
  id: string
  status: 'approved' | 'rejected'
  adminNote: string | null
}) {
  const [pending, startTransition] = useTransition()

  function dismiss() {
    startTransition(() => { void acknowledgeTutorSwapOutcome(id) })
  }

  const isApproved = status === 'approved'

  return (
    <div className={`border rounded-xl p-4 ${isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-medium ${isApproved ? 'text-green-800' : 'text-red-800'}`}>
            {isApproved
              ? 'Admin menyetujui pengajuan ganti tutor untuk sesi ini, yang sebelumnya kamu setujui untuk gantikan'
              : 'Admin menolak pengajuan ganti tutor untuk sesi ini, yang sebelumnya kamu setujui untuk gantikan'}
          </p>
          {adminNote && (
            <p className="text-xs text-gray-600 mt-1">Catatan: {adminNote}</p>
          )}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={dismiss}
          className="text-xs text-gray-500 hover:text-gray-700 shrink-0 disabled:opacity-50"
        >
          Tutup
        </button>
      </div>
    </div>
  )
}
