'use client'

import { useState, useTransition } from 'react'
import { seedCommonSubjects } from '@/lib/actions/admin/seed-subjects'

export default function SeedSubjectsButton() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  function handleSeed() {
    setMessage(null)
    startTransition(async () => {
      const result = await seedCommonSubjects()
      if (result.error) {
        setMessage({ text: result.error, type: 'error' })
      } else if (result.added === 0) {
        setMessage({ text: 'Semua mapel umum sudah ada.', type: 'success' })
      } else {
        setMessage({ text: `${result.added} mata pelajaran berhasil ditambahkan.`, type: 'success' })
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSeed}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 border text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {isPending ? 'Menambahkan...' : 'Tambah Mapel Umum'}
      </button>
      {message && (
        <p className={`text-xs ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
