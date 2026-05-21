'use client'

import { useState, useTransition } from 'react'
import { updateSessionTopic } from '@/lib/actions/admin/curriculum'

interface CurriculumTopic {
  id: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string
  learning_outcomes: string | null
}

interface Props {
  sessionId: string
  initialTopicId: string | null
  initialTopic: string | null
  curriculumTopics: CurriculumTopic[]
}

export default function SessionTopicEditor({
  sessionId,
  initialTopicId,
  initialTopic,
  curriculumTopics,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(initialTopicId ?? '')
  const [savedId, setSavedId] = useState<string>(initialTopicId ?? '')
  const [isPending, startTransition] = useTransition()

  const isDirty = selectedId !== savedId
  const selected = curriculumTopics.find(t => t.id === selectedId)

  function save() {
    if (!isDirty) return
    const topic = curriculumTopics.find(t => t.id === selectedId)
    startTransition(async () => {
      await updateSessionTopic(sessionId, selectedId || null, topic?.topic ?? initialTopic ?? '')
      setSavedId(selectedId)
    })
  }

  const grouped = curriculumTopics.reduce<Record<string, Record<number, CurriculumTopic[]>>>((acc, t) => {
    if (!acc[t.grade_level]) acc[t.grade_level] = {}
    if (!acc[t.grade_level][t.semester]) acc[t.grade_level][t.semester] = []
    acc[t.grade_level][t.semester].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {curriculumTopics.length === 0 ? (
        <p className="text-xs text-gray-400">
          Belum ada topik untuk mata pelajaran ini.{' '}
          <a href="/admin/curriculum" className="text-blue-600 hover:underline">Kelola kurikulum</a>
        </p>
      ) : (
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">— Pilih topik —</option>
          {Object.entries(grouped).map(([grade, bySemester]) =>
            Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([semester, items]) => (
              <optgroup key={`${grade}-${semester}`} label={`${grade} · Semester ${semester}`}>
                {items.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.theme ? `${t.theme} — ` : ''}{t.topic}
                  </option>
                ))}
              </optgroup>
            ))
          )}
        </select>
      )}

      {selected?.learning_outcomes && (
        <div className="px-3 py-2 bg-blue-50 rounded-lg">
          <p className="text-xs font-medium text-blue-700 mb-0.5">Capaian Pembelajaran</p>
          <p className="text-xs text-blue-600">{selected.learning_outcomes}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!isDirty || isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Topik'}
        </button>
        {!isDirty && savedId && (
          <span className="text-xs text-green-600">Tersimpan</span>
        )}
      </div>
    </div>
  )
}
