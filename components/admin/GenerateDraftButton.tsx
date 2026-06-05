'use client'

import { useState, useTransition } from 'react'

interface Props {
  month: string
  monthLabel: string
  action: (month: string) => Promise<{ generated: number; skipped: number; error?: string }>
}

export default function GenerateDraftButton({ month, monthLabel, action }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ generated: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setResult(null)
    setError(null)
    startTransition(async () => {
      const res = await action(month)
      if (res.error) setError(res.error)
      else setResult({ generated: res.generated, skipped: res.skipped })
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {isPending ? 'Membuat draft...' : `Generate Draft ${monthLabel}`}
      </button>

      {result && (
        <p className="text-sm text-gray-500">
          {result.generated > 0
            ? <span className="text-green-600 font-medium">{result.generated} draft dibuat</span>
            : <span className="text-gray-400">Semua sudah ada</span>}
          {result.skipped > 0 && result.generated > 0 && (
            <span className="text-gray-400"> · {result.skipped} dilewati</span>
          )}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
