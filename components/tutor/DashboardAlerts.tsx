'use client'

import { useTransition } from 'react'
import {
  respondToTutorSwapRequest,
  acknowledgeSessionChangeRequest,
  type SessionRequestType,
} from '@/lib/actions/tutor/session-requests'

const REQUEST_LABEL: Record<SessionRequestType, string> = {
  cancel: 'Pembatalan Sesi',
  reschedule: 'Reschedule Sesi',
  change_tutor: 'Ganti Tutor',
}

export type SwapRequestAlert = {
  id: string
  className: string
  scheduledAt: string
  requesterName: string
  reason: string
}

export type ResolvedNoticeAlert = {
  id: string
  requestType: SessionRequestType
  status: 'approved' | 'rejected'
  className: string
  adminNote: string | null
}

function SwapRequestCard({ alert }: { alert: SwapRequestAlert }) {
  const [pending, startTransition] = useTransition()

  function respond(accept: boolean) {
    startTransition(() => { void respondToTutorSwapRequest(alert.id, accept) })
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <p className="text-sm font-medium text-blue-900">
        {alert.requesterName} mengajukan agar kamu menggantikan sesi <strong>{alert.className}</strong>
      </p>
      <p className="text-xs text-blue-700 mt-0.5">
        {new Date(alert.scheduledAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
      </p>
      <p className="text-xs text-blue-800 mt-2 bg-white/60 rounded-lg px-3 py-2">{alert.reason}</p>
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => respond(true)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

function ResolvedNoticeCard({ alert }: { alert: ResolvedNoticeAlert }) {
  const [pending, startTransition] = useTransition()

  function dismiss() {
    startTransition(() => { void acknowledgeSessionChangeRequest(alert.id) })
  }

  const isApproved = alert.status === 'approved'

  return (
    <div className={`border rounded-xl p-4 ${isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-medium ${isApproved ? 'text-green-800' : 'text-red-800'}`}>
            Pengajuan {REQUEST_LABEL[alert.requestType]} untuk {alert.className} {isApproved ? 'disetujui' : 'ditolak'}
          </p>
          {alert.adminNote && (
            <p className="text-xs text-gray-600 mt-1">Catatan: {alert.adminNote}</p>
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

export default function DashboardAlerts({
  swapRequests,
  resolvedNotices,
}: {
  swapRequests: SwapRequestAlert[]
  resolvedNotices: ResolvedNoticeAlert[]
}) {
  if (swapRequests.length === 0 && resolvedNotices.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {swapRequests.map(alert => <SwapRequestCard key={alert.id} alert={alert} />)}
      {resolvedNotices.map(alert => <ResolvedNoticeCard key={alert.id} alert={alert} />)}
    </div>
  )
}
