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
  const [confirmReopen, setConfirmReopen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const now = new Date()
  const sessionStart = new Date(scheduledAt)
  const sessionEnd = new Date(sessionStart.getTime() + durationMinutes * 60_000)

  const isActive = currentStatus === 'scheduled' || currentStatus === 'ongoing'
  const isOngoing = isActive && now >= sessionStart && now <= sessionEnd
  const isCancelled = currentStatus === 'cancelled'
  const sudahLewat = now > sessionEnd

  function handleTransition(newStatus: Status, reason?: string) {
    setError(null)
    startTransition(async () => {
      const result = await updateSessionStatus(sessionId, newStatus, reason)
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
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
          >
            {isPending ? '...' : 'Tandai Selesai'}
          </button>
        )}

        {isCancelled && (
          <button
            onClick={() => setConfirmReopen(true)}
            disabled={isPending}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-colors disabled:opacity-50"
          >
            Buka Kembali Sesi
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

        {currentStatus !== 'completed' && !isOngoing && (
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

      {/* Konfirmasi buka kembali — kebalikan dari pembatalan, dan konsekuensinya
          harus disebutkan: sesi ini kembali dihitung sebagai gaji tutor. */}
      {confirmReopen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmReopen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Buka Kembali Sesi?</h2>
            <p className="text-sm text-gray-500 mb-4">
              Sesi kembali berstatus terjadwal dan alasan pembatalannya dihapus. Sesi ini akan
              dihitung lagi sebagai gaji tutor dan ikut dicocokkan dengan jumlah pertemuan di invoice.
            </p>
            {sudahLewat && (
              <p className="text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-4">
                Jadwalnya sudah lewat, jadi begitu dibuka ia langsung terhitung sebagai sesi yang
                sudah terlaksana. Kalau memang tidak berjalan, jangan dibuka.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmReopen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={() => { setConfirmReopen(false); handleTransition('scheduled') }}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? '...' : 'Ya, Buka Kembali'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi batalkan */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmCancel(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Batalkan Sesi?</h2>
            <p className="text-sm text-gray-500 mb-4">
              Sesi ini akan ditandai sebagai dibatalkan. Tindakan ini tidak dapat diurungkan secara otomatis.
            </p>

            {/* Alasannya menentukan tindakan lanjutan yang berbeda-beda: siswa
                sakit biasanya diganti hari lain dan tetap ditagih, libur
                nasional tidak ditagih dan tutor tidak dibayar. */}
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Alasan pembatalan
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Siswa sakit, libur nasional, tutor berhalangan, ..."
              autoFocus
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-xs text-gray-400 mb-5">
              Boleh dikosongkan, tapi alasannya yang nanti menjelaskan kenapa jumlah pertemuan di
              invoice berbeda dari kalender.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setConfirmCancel(false); setCancelReason('') }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={() => { setConfirmCancel(false); handleTransition('cancelled', cancelReason) }}
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
