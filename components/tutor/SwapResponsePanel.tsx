'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { respondToTutorSwapRequest } from '@/lib/actions/tutor/session-requests'

export default function SwapResponsePanel({
  requestId,
  classId,
  requesterName,
  reason,
}: {
  requestId: string
  classId: string
  requesterName: string | null
  reason: string
}) {
  const [pending, startTransition] = useTransition()

  function respond(accept: boolean) {
    startTransition(() => { void respondToTutorSwapRequest(requestId, accept) })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
      <p className="text-sm font-medium text-blue-900">
        {requesterName ?? 'Tutor lain'} mengajukan agar kamu menggantikan sesi ini
      </p>

      <div className="bg-white/70 rounded-lg px-3.5 py-3">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">
          Catatan dari {requesterName ?? 'tutor utama'}
        </p>
        <p className="text-sm text-blue-900">{reason}</p>
      </div>

      <Link
        href={`/tutor/classes/${classId}?previewSwap=${requestId}`}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
      >
        Lihat detail & riwayat kelas ini
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => respond(true)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
        >
          Bersedia
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => respond(false)}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Tidak Bisa
        </button>
      </div>
    </div>
  )
}
