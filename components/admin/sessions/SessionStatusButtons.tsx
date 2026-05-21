'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateSessionStatus, deleteSession } from '@/lib/actions/admin/sessions'

type Status = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

export default function SessionStatusButtons({
  sessionId,
  currentStatus,
  scheduledAt,
  durationMinutes,
}: {
  sessionId: string
  currentStatus: Status
  scheduledAt: string
  durationMinutes: number
}) {
  const [error, setError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const now = new Date()
  const sessionStart = new Date(scheduledAt)
  const sessionEnd = new Date(sessionStart.getTime() + durationMinutes * 60_000)

  const isActive = currentStatus === 'scheduled' || currentStatus === 'ongoing'
  const isOngoing = isActive && now >= sessionStart && now <= sessionEnd

  function handleTransition(newStatus: Status) {
    setError(null)
    startTransition(async () => {
      const result = await updateSessionStatus(sessionId, newStatus)
      if (result?.error) setError(result.error)
    })
  }

  function handleDelete() {
    if (!confirm('Hapus sesi ini? Semua data presensi terkait juga akan dihapus.')) return
    startTransition(async () => {
      const result = await deleteSession(sessionId)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/admin/sessions')
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {isOngoing && (
          <button
            onClick={() => handleTransition('completed')}
            disabled={isPending}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
          >
            {isPending ? '...' : 'Tandai Selesai'}
          </button>
        )}

        {isActive && (
          <button
            onClick={() => setConfirmCancel(true)}
            disabled={isPending}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors disabled:opacity-50"
          >
            Batalkan
          </button>
        )}

        {(currentStatus === 'cancelled' || (currentStatus === 'scheduled' && now < sessionStart)) && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 transition-colors disabled:opacity-50"
          >
            {isPending ? '...' : 'Hapus'}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {/* Konfirmasi batalkan */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmCancel(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Batalkan Sesi?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Sesi ini akan ditandai sebagai dibatalkan. Tindakan ini tidak dapat diurungkan secara otomatis.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmCancel(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={() => { setConfirmCancel(false); handleTransition('cancelled') }}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? '...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
