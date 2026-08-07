'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  approveSessionPayroll,
  approveSessionPayrollBulk,
  rejectSessionPayroll,
} from '@/lib/actions/admin/payroll-review'
import { PAYROLL_STATUS_BADGE } from '@/lib/session-status'

export type PayrollReviewSession = {
  id: string
  scheduled_at: string
  duration_minutes: number | null
  topic: string | null
  classId: string | null
  className: string
  payrollStatus: string
  rejectionReason: string | null
  tutorNote: string | null
}

export type PayrollReviewGroup = {
  tutorId: string
  tutorName: string
  sessions: PayrollReviewSession[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function TutorGroup({ group }: { group: PayrollReviewGroup }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null)

  const pendingIds = group.sessions.filter(s => s.payrollStatus === 'pending').map(s => s.id)

  function handleApprove(sessionId: string) {
    setMessage(null)
    startTransition(async () => {
      const result = await approveSessionPayroll(sessionId)
      if (result.error) setMessage({ text: result.error, tone: 'error' })
      else router.refresh()
    })
  }

  function handleApproveAll() {
    setMessage(null)
    startTransition(async () => {
      const result = await approveSessionPayrollBulk(pendingIds)
      if (result.error) {
        setMessage({ text: result.error, tone: 'error' })
        return
      }
      if (result.skipped) {
        setMessage({
          text: `${result.approved} sesi disetujui, ${result.skipped} dilewati karena jurnalnya belum lengkap.`,
          tone: 'info',
        })
      }
      router.refresh()
    })
  }

  function handleReject(sessionId: string) {
    if (!reason.trim()) return
    setMessage(null)
    startTransition(async () => {
      const result = await rejectSessionPayroll(sessionId, reason)
      if (result.error) {
        setMessage({ text: result.error, tone: 'error' })
        return
      }
      setRejectingId(null)
      setReason('')
      router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <Link href={`/admin/users/${group.tutorId}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600">
            {group.tutorName}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">
            {group.sessions.length} sesi
            {pendingIds.length > 0 && ` · ${pendingIds.length} menunggu review`}
          </p>
        </div>
        {pendingIds.length > 0 && (
          <button
            onClick={handleApproveAll}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {isPending ? 'Memproses...' : `Setujui Semua (${pendingIds.length})`}
          </button>
        )}
      </div>

      {message && (
        <p className={`text-xs px-5 py-2.5 ${message.tone === 'error' ? 'text-red-600 bg-red-50' : 'text-blue-700 bg-blue-50'}`}>
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="pl-5 pr-3 py-2.5 text-left">Tanggal</th>
              <th className="px-3 py-2.5 text-left">Kelas & Topik</th>
              <th className="px-3 py-2.5 text-left">Durasi</th>
              <th className="px-3 py-2.5 text-left">Status Gaji</th>
              <th className="px-3 pr-5 py-2.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {group.sessions.map(s => {
              const badge = PAYROLL_STATUS_BADGE[s.payrollStatus] ?? PAYROLL_STATUS_BADGE.pending
              return (
                <tr key={s.id} className="align-top">
                  <td className="pl-5 pr-3 py-3 whitespace-nowrap">
                    <p className="text-gray-900">{formatDate(s.scheduled_at)}</p>
                    <p className="text-xs text-gray-400">{formatTime(s.scheduled_at)}</p>
                  </td>
                  <td className="px-3 py-3">
                    {s.classId ? (
                      <Link href={`/admin/classes/${s.classId}`} className="text-gray-900 hover:text-blue-600">
                        {s.className}
                      </Link>
                    ) : (
                      <span className="text-gray-900">{s.className}</span>
                    )}
                    <p className="text-xs text-gray-400 max-w-[280px]">{s.topic || 'Tanpa topik'}</p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                    {s.duration_minutes ? `${s.duration_minutes} mnt` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                    {s.payrollStatus === 'rejected' && s.rejectionReason && (
                      <p className="text-xs text-gray-400 italic mt-1 max-w-[220px]">{s.rejectionReason}</p>
                    )}
                    {s.payrollStatus === 'pending' && s.tutorNote && (
                      <p className="text-xs text-gray-500 mt-1 max-w-[220px]">Catatan tutor: {s.tutorNote}</p>
                    )}
                  </td>
                  <td className="px-3 pr-5 py-3 text-right">
                    {rejectingId === s.id ? (
                      <div className="inline-block text-left w-56">
                        <textarea
                          value={reason}
                          onChange={e => setReason(e.target.value)}
                          placeholder="Alasan penolakan..."
                          rows={2}
                          autoFocus
                          className="w-full px-2.5 py-1.5 border border-red-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => handleReject(s.id)}
                            disabled={isPending || !reason.trim()}
                            className="px-2.5 py-1 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            Kirim
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setReason('') }}
                            disabled={isPending}
                            className="px-2.5 py-1 border border-slate-300 text-gray-600 text-xs font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {s.payrollStatus !== 'approved' && (
                          <button
                            onClick={() => handleApprove(s.id)}
                            disabled={isPending}
                            className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Setujui
                          </button>
                        )}
                        {s.payrollStatus !== 'rejected' && (
                          <button
                            onClick={() => { setRejectingId(s.id); setReason(''); setMessage(null) }}
                            disabled={isPending}
                            className="px-2.5 py-1 border border-red-300 text-red-600 bg-white text-xs font-medium rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            Tolak
                          </button>
                        )}
                        <Link
                          href={`/admin/sessions/${s.id}`}
                          className="px-2.5 py-1 border border-slate-300 text-gray-600 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors"
                        >
                          Detail
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PayrollReviewTable({ groups }: { groups: PayrollReviewGroup[] }) {
  return (
    <div className="space-y-5">
      {groups.map(g => <TutorGroup key={g.tutorId} group={g} />)}
    </div>
  )
}
