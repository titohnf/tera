'use client'

import { useState, useTransition } from 'react'
import {
  createSessionChangeRequest,
  withdrawSessionChangeRequest,
  type SessionRequestType,
} from '@/lib/actions/tutor/session-requests'

type PendingRequest = {
  id: string
  request_type: SessionRequestType
  reason: string
  new_scheduled_at: string | null
  new_tutor_id: string | null
  new_tutor_name: string | null
  new_tutor_confirmed: boolean | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
}

const REQUEST_LABEL: Record<SessionRequestType, string> = {
  cancel: 'Pembatalan Sesi',
  reschedule: 'Reschedule Sesi',
  change_tutor: 'Ganti Tutor',
}

export default function SessionChangeRequestPanel({
  sessionId,
  existingRequest,
  tutors,
}: {
  sessionId: string
  existingRequest: PendingRequest | null
  tutors: { id: string; full_name: string }[]
}) {
  const [mode, setMode] = useState<SessionRequestType | null>(null)
  const [reason, setReason] = useState('')
  const [newScheduledAt, setNewScheduledAt] = useState('')
  const [newTutorId, setNewTutorId] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function reset() {
    setMode(null)
    setReason('')
    setNewScheduledAt('')
    setNewTutorId('')
    setError('')
  }

  function submit() {
    if (!mode) return
    setError('')
    startTransition(async () => {
      const result = await createSessionChangeRequest(sessionId, mode, reason, {
        newScheduledAt: newScheduledAt ? new Date(newScheduledAt).toISOString() : undefined,
        newTutorId: newTutorId || undefined,
      })
      if (result.error) setError(result.error)
      else reset()
    })
  }

  function withdraw() {
    if (!existingRequest) return
    startTransition(() => { void withdrawSessionChangeRequest(existingRequest.id, sessionId) })
  }

  if (existingRequest && existingRequest.status === 'pending') {
    return (
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Pengajuan Perubahan
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-800">{REQUEST_LABEL[existingRequest.request_type]}</span>
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {existingRequest.request_type === 'change_tutor' && existingRequest.new_tutor_confirmed !== true
                ? 'Menunggu Tutor Pengganti'
                : 'Menunggu Admin'}
            </span>
          </div>
          {existingRequest.request_type === 'reschedule' && existingRequest.new_scheduled_at && (
            <p className="text-xs text-gray-600">
              Ke: {new Date(existingRequest.new_scheduled_at).toLocaleString('id-ID', {
                dateStyle: 'long', timeStyle: 'short',
              })}
            </p>
          )}
          {existingRequest.request_type === 'change_tutor' && existingRequest.new_tutor_name && (
            <p className="text-xs text-gray-600">Ke: {existingRequest.new_tutor_name}</p>
          )}
          <p className="text-xs text-gray-600">Alasan: {existingRequest.reason}</p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={withdraw}
          className="mt-3 text-xs text-red-600 hover:underline disabled:opacity-50"
        >
          {pending ? 'Membatalkan...' : 'Batalkan pengajuan ini'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Pengajuan Perubahan
      </p>

      {existingRequest && existingRequest.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 space-y-1">
          <p className="text-xs font-medium text-red-700">
            Pengajuan {REQUEST_LABEL[existingRequest.request_type]} sebelumnya ditolak admin
          </p>
          {existingRequest.admin_note && (
            <p className="text-xs text-gray-600">Catatan: {existingRequest.admin_note}</p>
          )}
        </div>
      )}

      {!mode ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setMode('reschedule')}
            className="text-left text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Ajukan Reschedule
          </button>
          <button
            type="button"
            onClick={() => setMode('change_tutor')}
            className="text-left text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Ajukan Ganti Tutor
          </button>
          <button
            type="button"
            onClick={() => setMode('cancel')}
            className="text-left text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            Ajukan Pembatalan Sesi
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-800">{REQUEST_LABEL[mode]}</p>

          {mode === 'reschedule' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tanggal & waktu baru</label>
              <input
                type="datetime-local"
                value={newScheduledAt}
                onChange={e => setNewScheduledAt(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {mode === 'change_tutor' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tutor pengganti</label>
              <select
                value={newTutorId}
                onChange={e => setNewTutorId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih tutor...</option>
                {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Alasan</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Jelaskan alasan pengajuan ini..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={reset}
              className="px-4 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
