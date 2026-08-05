'use client'

import { useState, useTransition } from 'react'
import { saveSessionCpUrls } from '@/lib/actions/admin/curriculum'
import { CUSTOM_TOPIC_KEY, groupCpsByTopic, type LatihanSoalCpRow, type LatihanSoalTopic } from '@/lib/latihan-soal-topics'

type CpRow = LatihanSoalCpRow

interface Props {
  sessionId: string
  selectedCpIds: string[]
  cpRows: CpRow[]
  customLearningOutcomes?: string[]
  initialCpUrls: Record<string, string>
  readOnly?: boolean
  saveAction?: (sessionId: string, cpUrls: Record<string, string>) => Promise<{ error?: string }>
}

export default function LatihanSoalTab({ sessionId, selectedCpIds, cpRows, customLearningOutcomes = [], initialCpUrls, readOnly = false, saveAction = saveSessionCpUrls }: Props) {
  const curriculumCps = cpRows.filter(r => selectedCpIds.includes(r.id) && r.learning_outcomes)
  const customOutcomes = customLearningOutcomes.filter(text => text?.trim())

  const topics: LatihanSoalTopic[] = [
    ...groupCpsByTopic(curriculumCps),
    ...(customOutcomes.length > 0
      ? [{ key: CUSTOM_TOPIC_KEY, heading: 'Topik sesi ini', outcomes: customOutcomes }]
      : []),
  ]

  const [urls, setUrls] = useState<Record<string, string>>(initialCpUrls)
  const [savedUrls, setSavedUrls] = useState<Record<string, string>>(initialCpUrls)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const isDirty = JSON.stringify(urls) !== JSON.stringify(savedUrls)

  function setUrl(topicKey: string, value: string) {
    setUrls(prev => ({ ...prev, [topicKey]: value }))
  }

  function save() {
    startTransition(async () => {
      const result = await saveAction(sessionId, urls)
      if (result.error) {
        setError(result.error)
      } else {
        setSavedUrls({ ...urls })
        setError('')
      }
    })
  }

  if (topics.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-gray-400">
        Belum ada CP yang dipilih. Pilih CP di tab{' '}
        <span className="font-medium text-gray-600">Topik &amp; Materi</span> terlebih dahulu.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">URL Latihan Soal per Topik</p>

      <div className="space-y-2">
        {topics.map((topic, idx) => {
          const url = urls[topic.key] ?? ''
          return (
            <div key={topic.key} className="border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{topic.heading}</p>
                  {/* CP-nya tetap ditampilkan sebagai konteks: yang berubah
                      adalah satuan penyimpanannya, bukan apa yang diajarkan. */}
                  {topic.outcomes.length > 0 && (
                    <ul className="list-inside list-disc space-y-0.5 text-xs text-gray-500">
                      {topic.outcomes.map((text, i) => (
                        <li key={i}>{text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(topic.key, e.target.value)}
                placeholder="https://..."
                disabled={readOnly}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-gray-700 disabled:cursor-not-allowed"
              />
              {url && (
                <a
                  href={url.startsWith('http') ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Buka link
                </a>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
          >
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
          {!isDirty && Object.values(savedUrls).some(Boolean) && (
            <span className="text-xs text-green-600">Tersimpan</span>
          )}
        </div>
      )}
    </div>
  )
}
