'use client'

import { useState, useTransition } from 'react'
import type { DuplicationRunResult } from '@/lib/actions/admin/curriculum-resource-duplication'

interface Props {
  lastDuplicatedAt: string | null
  pendingCount: number
  runAction: () => Promise<DuplicationRunResult>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
}

export default function DuplicationStatusPanel({ lastDuplicatedAt, pendingCount, runAction }: Props) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<DuplicationRunResult | null>(null)

  function handleRun() {
    setResult(null)
    startTransition(async () => {
      const res = await runAction()
      setResult(res)
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-gray-700">Sinkronisasi ke Google Drive</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Terakhir sinkron: {lastDuplicatedAt ? formatDate(lastDuplicatedAt) : 'Belum pernah'}
            {' · '}
            {pendingCount > 0 ? (
              <span className="text-amber-600 font-medium">{pendingCount} file baru belum di-duplicate</span>
            ) : (
              <span className="text-green-600 font-medium">Semua file sudah tersinkron</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={pending || pendingCount === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
        >
          {pending ? 'Menjalankan...' : 'Jalankan Duplikasi'}
        </button>
      </div>

      {result && (
        <div className="mt-3 text-xs rounded-lg px-3 py-2 bg-slate-50">
          {'error' in result ? (
            <p className="text-red-600">{result.error}</p>
          ) : (
            <>
              <p className="text-gray-700">
                <span className="text-green-600 font-medium">{result.succeeded} berhasil</span>
                {result.failed > 0 && (
                  <> · <span className="text-red-600 font-medium">{result.failed} gagal</span></>
                )}
              </p>
              {result.failedTitles.length > 0 && (
                <ul className="mt-1 text-gray-500 list-disc list-inside">
                  {result.failedTitles.map((title, i) => <li key={i} className="truncate">{title}</li>)}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
