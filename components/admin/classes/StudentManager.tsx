'use client'

import { useState, useTransition } from 'react'
import { enrollStudent, unenrollStudent, updateEnrollmentWindow } from '@/lib/actions/admin/classes'

type Student = { id: string; full_name: string; email: string }

export type Enrollment = Student & {
  enrolled_at: string
  unenrolled_at: string | null
}

interface StudentManagerProps {
  classId: string
  enrolledStudents: Enrollment[]
  formerStudents: Enrollment[]
  availableStudents: Student[]
  classStartDate: string | null
}

const today = () => new Date().toISOString().slice(0, 10)
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : '')

function formatDay(iso: string | null): string {
  if (!iso) return '—'
  return new Date(`${day(iso)}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function StudentManager({
  classId,
  enrolledStudents,
  formerStudents,
  availableStudents,
  classStartDate,
}: StudentManagerProps) {
  const [selectedId, setSelectedId] = useState('')
  const [enrollDate, setEnrollDate] = useState(classStartDate ?? today())
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [leavingId, setLeavingId] = useState<string | null>(null)
  const [leaveDate, setLeaveDate] = useState(today())
  const [isPending, startTransition] = useTransition()

  function handleEnroll() {
    if (!selectedId) return
    setError(null)
    startTransition(async () => {
      const result = await enrollStudent(classId, selectedId, enrollDate)
      if (result?.error) setError(result.error)
      else setSelectedId('')
    })
  }

  function handleSaveWindow(studentId: string, start: string, end: string) {
    setError(null)
    startTransition(async () => {
      const result = await updateEnrollmentWindow(classId, studentId, start, end || null)
      if (result?.error) setError(result.error)
      else setEditingId(null)
    })
  }

  function handleUnenroll(studentId: string) {
    setError(null)
    startTransition(async () => {
      const result = await unenrollStudent(classId, studentId, leaveDate)
      if (result?.error) setError(result.error)
      else setLeavingId(null)
    })
  }

  function handleRejoin(studentId: string) {
    setError(null)
    startTransition(async () => {
      const result = await enrollStudent(classId, studentId, today())
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-1">Siswa Terdaftar ({enrolledStudents.length})</h2>
      <p className="text-xs text-gray-500 mb-3">
        Tanggal mulai menentukan sesi mana yang jadi miliknya — presensi, laporan bulanan,
        dan perhitungan invoice hanya menghitung sesi di dalam rentang ini.
      </p>

      {error && (
        <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {enrolledStudents.length === 0 ? (
        <p className="text-sm text-gray-400 mb-3">Belum ada siswa terdaftar.</p>
      ) : (
        <div className="space-y-1.5 mb-3">
          {enrolledStudents.map(student => (
            <div key={student.id} className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{student.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{student.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mulai {formatDay(student.enrolled_at)}
                    {student.unenrolled_at && ` — sampai ${formatDay(student.unenrolled_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setEditingId(editingId === student.id ? null : student.id)
                      setLeavingId(null)
                    }}
                    disabled={isPending}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 font-medium transition-colors"
                  >
                    Ubah tanggal
                  </button>
                  <button
                    onClick={() => {
                      setLeavingId(leavingId === student.id ? null : student.id)
                      setLeaveDate(today())
                      setEditingId(null)
                    }}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    Keluarkan
                  </button>
                </div>
              </div>

              {editingId === student.id && (
                <form
                  className="flex flex-wrap items-end gap-2 mt-2 pt-2 border-t border-gray-200"
                  onSubmit={e => {
                    e.preventDefault()
                    const form = new FormData(e.currentTarget)
                    handleSaveWindow(
                      student.id,
                      String(form.get('start') ?? ''),
                      String(form.get('end') ?? ''),
                    )
                  }}
                >
                  <label className="text-xs text-gray-600">
                    <span className="block mb-1">Mulai</span>
                    <input
                      type="date"
                      name="start"
                      defaultValue={day(student.enrolled_at)}
                      required
                      className="px-2 py-1 border rounded-lg text-sm bg-white"
                    />
                  </label>
                  <label className="text-xs text-gray-600">
                    <span className="block mb-1">Sampai (opsional)</span>
                    <input
                      type="date"
                      name="end"
                      defaultValue={day(student.unenrolled_at)}
                      className="px-2 py-1 border rounded-lg text-sm bg-white"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {isPending ? '...' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Batal
                  </button>
                </form>
              )}

              {leavingId === student.id && (
                <div className="flex flex-wrap items-end gap-2 mt-2 pt-2 border-t border-gray-200">
                  <label className="text-xs text-gray-600">
                    <span className="block mb-1">Hari terakhir ikut kelas</span>
                    <input
                      type="date"
                      value={leaveDate}
                      onChange={e => setLeaveDate(e.target.value)}
                      className="px-2 py-1 border rounded-lg text-sm bg-white"
                    />
                  </label>
                  <button
                    onClick={() => handleUnenroll(student.id)}
                    disabled={isPending || !leaveDate}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                  >
                    {isPending ? '...' : 'Keluarkan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeavingId(null)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {availableStudents.length > 0 && (
        <div className="flex flex-wrap items-end gap-2 mt-2">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="flex-1 min-w-[12rem] pl-3 pr-9 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tambah siswa...</option>
            {availableStudents.map(s => (
              <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
            ))}
          </select>
          <label className="text-xs text-gray-600">
            <span className="block mb-1">Mulai</span>
            <input
              type="date"
              value={enrollDate}
              onChange={e => setEnrollDate(e.target.value)}
              className="px-2 py-[7px] border rounded-lg text-sm bg-white"
            />
          </label>
          <button
            onClick={handleEnroll}
            disabled={!selectedId || !enrollDate || isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
          >
            {isPending ? '...' : 'Tambah'}
          </button>
        </div>
      )}

      {formerStudents.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 mb-2">
            Sudah Keluar ({formerStudents.length})
          </h3>
          <div className="space-y-1.5">
            {formerStudents.map(student => (
              <div key={student.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-50/70">
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 truncate">{student.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {formatDay(student.enrolled_at)} — {formatDay(student.unenrolled_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleRejoin(student.id)}
                  disabled={isPending}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 font-medium shrink-0"
                >
                  Daftarkan lagi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
