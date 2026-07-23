'use client'

import { useState, useTransition } from 'react'
import { submitAttendance } from '@/lib/actions/attendance'
import type { AttendanceStatus } from '@/lib/types/database'

type SubmitAction = (sessionId: string, records: unknown) => Promise<{ error?: string; success?: boolean }>

interface Student {
  id: string
  full_name: string
  currentStatus: AttendanceStatus | null
  notes: string
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present', label: 'Hadir', color: 'bg-green-100 text-green-700 border-green-200 data-[active=true]:bg-green-600 data-[active=true]:text-white data-[active=true]:border-green-600' },
  { value: 'late', label: 'Terlambat', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 data-[active=true]:bg-yellow-500 data-[active=true]:text-white data-[active=true]:border-yellow-500' },
  { value: 'absent', label: 'Absen', color: 'bg-red-100 text-red-600 border-red-200 data-[active=true]:bg-red-500 data-[active=true]:text-white data-[active=true]:border-red-500' },
  { value: 'excused', label: 'Izin', color: 'bg-gray-100 text-gray-600 border-gray-200 data-[active=true]:bg-gray-500 data-[active=true]:text-white data-[active=true]:border-gray-500' },
]

export default function AttendanceForm({
  sessionId,
  students,
  sessionStatus,
  submitAction = submitAttendance,
}: {
  sessionId: string
  students: Student[]
  sessionStatus: string
  submitAction?: SubmitAction
}) {
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus | null; notes: string }>>(
    Object.fromEntries(students.map(s => [s.id, { status: s.currentStatus, notes: s.notes }]))
  )
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isDisabled = sessionStatus === 'cancelled'

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRecords(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }))
  }

  function markAll(status: AttendanceStatus) {
    setRecords(prev =>
      Object.fromEntries(Object.keys(prev).map(id => [id, { ...prev[id], status }]))
    )
  }

  function handleSave() {
    startTransition(async () => {
      const rows = Object.entries(records)
        .filter(([, r]) => r.status !== null)
        .map(([student_id, r]) => ({
          student_id,
          status: r.status as AttendanceStatus,
          notes: r.notes,
        }))
      const result = await submitAction(sessionId, rows)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Presensi berhasil disimpan!' })
      }
    })
  }

  const presentCount = Object.values(records).filter(r => r.status === 'present' || r.status === 'late').length

  return (
    <div>
      {isDisabled && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          Sesi dibatalkan — presensi tidak dapat diubah.
        </div>
      )}

      {/* Bulk actions */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-500 mr-1">Tandai semua:</span>
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => markAll(opt.value)}
            disabled={isDisabled}
            className="text-xs px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:opacity-80 transition-opacity"
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">
          <strong className="text-gray-900">{presentCount}</strong> / {students.length} hadir
        </span>
      </div>

      {/* Student list */}
      <div className="space-y-2 mb-6">
        {students.map((student, idx) => {
          const rec = records[student.id]
          return (
            <div key={student.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-4 py-3 flex items-center gap-3">
              <span className="text-xs text-gray-400 w-6 text-center">{idx + 1}</span>
              <p className="text-sm font-medium text-gray-900 flex-1">{student.full_name}</p>
              <div className="flex gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    data-active={rec?.status === opt.value}
                    onClick={() => setStatus(student.id, opt.value)}
                    disabled={isDisabled}
                    className={`text-xs px-3 py-1.5 border rounded-lg font-medium transition-colors disabled:opacity-40 ${opt.color}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-lg mb-4 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isPending || isDisabled}
        className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:cursor-not-allowed transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
      >
        {isPending ? 'Menyimpan...' : 'Simpan Presensi'}
      </button>
    </div>
  )
}
