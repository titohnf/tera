'use client'

import { useTransition } from 'react'
import { completeClass } from '@/lib/actions/admin/classes'

interface Props {
  classId: string
  pendingSessions: number
  alreadyDone: boolean
}

export default function CompleteClassButton({ classId, pendingSessions, alreadyDone }: Props) {
  const [pending, startTransition] = useTransition()

  if (alreadyDone) {
    return (
      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-400 border border-gray-200 rounded-lg bg-gray-50 cursor-default">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Selesai
      </span>
    )
  }

  if (pendingSessions > 0) {
    return (
      <button
        type="button"
        disabled
        title={`${pendingSessions} sesi belum diselesaikan`}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Selesaikan Kelas
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Tandai kelas ini sebagai selesai? Status tidak bisa diubah kembali ke Aktif dari sini.')) return
        startTransition(() => completeClass(classId))
      }}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-60"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {pending ? 'Menyimpan...' : 'Selesaikan Kelas'}
    </button>
  )
}
