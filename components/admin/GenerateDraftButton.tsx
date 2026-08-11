'use client'

import { useState, useTransition } from 'react'

interface Props {
  month: string
  monthLabel: string
  action: (month: string) => Promise<{ generated: number; skipped: number; removed?: number; error?: string }>
  label?: string
  variant?: 'primary' | 'secondary'
}

export default function GenerateDraftButton({ month, monthLabel, action, label, variant = 'secondary' }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ generated: number; skipped: number; removed?: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setResult(null)
    setError(null)
    startTransition(async () => {
      const res = await action(month)
      if (res.error) setError(res.error)
      else setResult({ generated: res.generated, skipped: res.skipped, removed: res.removed })
    })
  }

  const buttonCls = variant === 'primary'
    ? 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent'
    : 'border border-slate-200 text-gray-700 hover:bg-slate-50'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap ${buttonCls}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {isPending ? 'Menghitung slip gaji...' : (label ?? `Generate Draft ${monthLabel}`)}
      </button>

      {result && (
        <p className="text-sm text-gray-500">
          {result.generated > 0
            ? <span className="text-green-600 font-medium">{result.generated} slip dibuat / diperbarui</span>
            : <span className="text-gray-400">Tidak ada slip yang bisa dibuat</span>}
          {result.skipped > 0 && (
            <span className="text-gray-400"> · {result.skipped} dilewati (sudah terkirim/dibayar)</span>
          )}
          {result.removed !== undefined && result.removed > 0 && (
            <span className="text-gray-400"> · {result.removed} slip tanpa sesi dibersihkan</span>
          )}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
