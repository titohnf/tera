'use client'

import { useState, useTransition } from 'react'
import { enrollStudent, unenrollStudent } from '@/lib/actions/admin/classes'

type Student = { id: string; full_name: string; email: string }

interface StudentManagerProps {
  classId: string
  enrolledStudents: Student[]
  availableStudents: Student[]
}

export default function StudentManager({ classId, enrolledStudents, availableStudents }: StudentManagerProps) {
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleEnroll() {
    if (!selectedId) return
    setError(null)
    startTransition(async () => {
      const result = await enrollStudent(classId, selectedId)
      if (result?.error) setError(result.error)
      else setSelectedId('')
    })
  }

  function handleUnenroll(studentId: string) {
    setError(null)
    startTransition(async () => {
      const result = await unenrollStudent(classId, studentId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Siswa Terdaftar ({enrolledStudents.length})</h2>

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
            <div key={student.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{student.full_name}</p>
                <p className="text-xs text-gray-500">{student.email}</p>
              </div>
              <button
                onClick={() => handleUnenroll(student.id)}
                disabled={isPending}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium transition-colors"
              >
                Keluarkan
              </button>
            </div>
          ))}
        </div>
      )}

      {availableStudents.length > 0 && (
        <div className="flex gap-2 mt-2">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="flex-1 pl-3 pr-9 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tambah siswa...</option>
            {availableStudents.map(s => (
              <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
            ))}
          </select>
          <button
            onClick={handleEnroll}
            disabled={!selectedId || isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
          >
            {isPending ? '...' : 'Tambah'}
          </button>
        </div>
      )}
    </div>
  )
}
