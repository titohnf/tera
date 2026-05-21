'use client'

import { useState, useTransition } from 'react'
import { deleteClass } from '@/lib/actions/admin/classes'

export default function DeleteClassButton({ classId, className }: { classId: string; className: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Hapus kelas "${className}"? Semua data sesi, presensi, dan materi terkait juga akan dihapus.`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteClass(classId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {isPending ? 'Menghapus...' : 'Hapus Kelas'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  )
}
