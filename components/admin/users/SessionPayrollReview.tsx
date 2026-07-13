'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveSessionPayroll, rejectSessionPayroll } from '@/lib/actions/admin/payroll-review'

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function SessionPayrollReview({
  sessionId,
  payrollStatus,
  rejectionReason,
  rejectionReasonAt,
  tutorNote,
  tutorNoteAt,
}: {
  sessionId: string
  payrollStatus: string
  rejectionReason: string | null
  rejectionReasonAt?: string | null
  tutorNote?: string | null
  tutorNoteAt?: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  function handleApprove(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    startTransition(async () => {
      const result = await approveSessionPayroll(sessionId)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleReject(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!reason.trim()) return
    setError('')
    startTransition(async () => {
      const result = await rejectSessionPayroll(sessionId, reason)
      if (result.error) setError(result.error)
      else {
        setRejecting(false)
        setReason('')
        router.refresh()
      }
    })
  }

  if (rejecting) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3" onClick={e => { e.preventDefault(); e.stopPropagation() }}>
        <label className="block text-xs font-semibold text-red-700 uppercase tracking-wide mb-1.5">
          Alasan Penolakan
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Jelaskan apa yang perlu diperbaiki tutor..."
          rows={2}
          autoFocus
          className="w-full px-2.5 py-1.5 border border-red-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        {error && <p className="text-xs text-red-600 bg-red-100 px-2.5 py-2 rounded-lg mt-2">{error}</p>}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleReject}
            disabled={isPending || !reason.trim()}
            className="px-2.5 py-1 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Mengirim...' : 'Kirim Penolakan'}
          </button>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setRejecting(false); setReason(''); setError('') }}
            disabled={isPending}
            className="px-2.5 py-1 border border-red-300 text-red-700 text-xs font-medium rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    )
  }

  const boxCls = payrollStatus === 'approved' ? 'bg-green-50 border-green-200'
    : payrollStatus === 'rejected' ? 'bg-red-50 border-red-200'
    : 'bg-yellow-50 border-yellow-200'
  const titleCls = payrollStatus === 'approved' ? 'text-green-700'
    : payrollStatus === 'rejected' ? 'text-red-700'
    : 'text-yellow-700'
  const bodyCls = payrollStatus === 'approved' ? 'text-green-700'
    : payrollStatus === 'rejected' ? 'text-red-700'
    : 'text-yellow-700'
  const title = payrollStatus === 'approved' ? 'Disetujui'
    : payrollStatus === 'rejected' ? 'Ditolak'
    : 'Menunggu Review'

  return (
    <div className={`rounded-lg p-3 border ${boxCls}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${titleCls}`}>{title}</p>

      {payrollStatus === 'approved' && (
        <p className={`text-xs ${bodyCls}`}>Sesi ini disetujui dan masuk ke perhitungan gaji tutor.</p>
      )}
      {payrollStatus === 'rejected' && rejectionReason && (
        <p className={`text-xs ${bodyCls}`}>{rejectionReason}</p>
      )}
      {payrollStatus !== 'pending' && rejectionReasonAt && (
        <p className="text-xs text-gray-400 mt-1">{formatTimestamp(rejectionReasonAt)}</p>
      )}

      {payrollStatus === 'pending' && rejectionReason && (
        <div className="bg-white/70 border border-yellow-200/70 rounded-lg p-3 mt-2">
          <p className="text-xs font-semibold text-gray-500 mb-1">Sebelumnya ditolak</p>
          <p className="text-xs text-gray-700">{rejectionReason}</p>
        </div>
      )}

      {payrollStatus === 'pending' && tutorNote && (
        <div className="bg-white/70 border border-yellow-200/70 rounded-lg p-3 mt-2">
          <p className="text-xs font-semibold text-gray-500 mb-1">Catatan tutor</p>
          <p className="text-xs text-gray-700">{tutorNote}</p>
          {tutorNoteAt && <p className="text-xs text-gray-400 mt-1">{formatTimestamp(tutorNoteAt)}</p>}
        </div>
      )}

      {error && <p className="text-xs text-red-600 bg-red-50 px-2.5 py-2 rounded-lg mt-2">{error}</p>}

      <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${
        payrollStatus === 'approved' ? 'border-green-200' : payrollStatus === 'rejected' ? 'border-red-200' : 'border-yellow-200'
      }`}>
        {payrollStatus !== 'approved' && (
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {isPending ? 'Menyimpan...' : 'Setujui'}
          </button>
        )}
        {payrollStatus !== 'rejected' && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setRejecting(true) }}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 border border-red-300 text-red-600 bg-white text-xs font-medium rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Tolak
          </button>
        )}
      </div>
    </div>
  )
}
