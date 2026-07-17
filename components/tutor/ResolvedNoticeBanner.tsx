'use client'

import { useTransition } from 'react'
import { acknowledgeSessionChangeRequest, type SessionRequestType } from '@/lib/actions/tutor/session-requests'

const REQUEST_LABEL: Record<SessionRequestType, string> = {
  cancel: 'Pembatalan Sesi',
  reschedule: 'Reschedule Sesi',
  change_tutor: 'Ganti Tutor',
}

export default function ResolvedNoticeBanner({
  id,
  requestType,
  status,
  adminNote,
}: {
  id: string
  requestType: SessionRequestType
  status: 'approved' | 'rejected'
  adminNote: string | null
}) {
  const [pending, startTransition] = useTransition()

  function dismiss() {
    startTransition(() => { void acknowledgeSessionChangeRequest(id) })
  }

  const isApproved = status === 'approved'

  return (
    <div className={`border rounded-xl p-4 ${isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-medium ${isApproved ? 'text-green-800' : 'text-red-800'}`}>
            Pengajuan {REQUEST_LABEL[requestType]} {isApproved ? 'disetujui' : 'ditolak'}
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
