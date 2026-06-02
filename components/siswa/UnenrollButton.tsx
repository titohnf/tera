'use client'

import { useState, useTransition } from 'react'
import { unenrollStudent } from '@/lib/actions/admin/classes'

interface Props {
  classId: string
  studentId: string
  className?: string
}

export default function UnenrollButton({ classId, studentId, className }: Props) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm) { setConfirm(true); return }
    setError(null)
    startTransition(async () => {
      const result = await unenrollStudent(classId, studentId)
      if (result?.error) { setError(result.error); setConfirm(false) }
    })
  }

  return (
    <div className={className} onClick={e => e.stopPropagation()}>
      {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 whitespace-nowrap ${
          confirm
            ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
            : 'border-slate-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
        }`}
      >
        {isPending ? 'Memproses...' : confirm ? 'Yakin nonaktifkan?' : 'Nonaktifkan'}
      </button>
      {confirm && !isPending && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setConfirm(false) }}
          className="ml-1 text-xs text-gray-400 hover:text-gray-600"
        >
          Batal
        </button>
      )}
    </div>
  )
}
