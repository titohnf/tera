'use client'

import { useState, useMemo, useTransition } from 'react'
import { updateSessionTopic } from '@/lib/actions/admin/curriculum'

interface CurriculumTopic {
  id: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string
  learning_outcomes: string | null
}

interface TopicGroup {
  key: string
  semester: number
  theme: string | null
  topicName: string
  representativeId: string
  cpRows: CurriculumTopic[]
}

interface Props {
  sessionId: string
  initialTopicId: string | null
  initialTopic: string | null
  initialCpIds?: string[]
  curriculumTopics: CurriculumTopic[]
  hasSubject?: boolean
}

export default function SessionTopicEditor({
  sessionId,
  initialTopicId,
  initialTopic,
  initialCpIds = [],
  curriculumTopics,
  hasSubject,
}: Props) {
  const [isPending, startTransition] = useTransition()

  // De-duplicate topics: group rows by (semester, theme, topic)
  const topicGroups = useMemo<TopicGroup[]>(() => {
    const map = new Map<string, TopicGroup>()
    for (const t of curriculumTopics) {
      const key = `${t.semester}|${t.theme ?? ''}|${t.topic}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          semester: t.semester,
          theme: t.theme,
          topicName: t.topic,
          representativeId: t.id,
          cpRows: [],
        })
      }
      if (t.learning_outcomes) {
        map.get(key)!.cpRows.push(t)
      }
    }
    return [...map.values()]
  }, [curriculumTopics])

  // Restore selected topic from initialTopicId
  const initialGroup = useMemo(() =>
    topicGroups.find(g => g.representativeId === initialTopicId || g.cpRows.some(r => r.id === initialTopicId)) ?? null
  , [topicGroups, initialTopicId])

  const [selectedGroupKey, setSelectedGroupKey] = useState<string>(initialGroup?.key ?? '')
  const [selectedCpIds, setSelectedCpIds] = useState<Set<string>>(new Set(initialCpIds))

  // Track saved state to detect changes
  const [savedGroupKey, setSavedGroupKey] = useState(initialGroup?.key ?? '')
  const [savedCpIds, setSavedCpIds] = useState<Set<string>>(new Set(initialCpIds))

  const selectedGroup = topicGroups.find(g => g.key === selectedGroupKey) ?? null

  const isDirty =
    selectedGroupKey !== savedGroupKey ||
    ![...selectedCpIds].every(id => savedCpIds.has(id)) ||
    ![...savedCpIds].every(id => selectedCpIds.has(id))

  function toggleCp(id: string) {
    setSelectedCpIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleTopicChange(key: string) {
    setSelectedGroupKey(key)
    setSelectedCpIds(new Set()) // reset CP when topic changes
  }

  function save() {
    if (!isDirty) return
    const group = topicGroups.find(g => g.key === selectedGroupKey)
    startTransition(async () => {
      await updateSessionTopic(sessionId, group?.representativeId ?? null, group?.topicName ?? '', [...selectedCpIds])
      setSavedGroupKey(selectedGroupKey)
      setSavedCpIds(new Set(selectedCpIds))
    })
  }

  // Group topic options by semester for dropdown
  const bySemester = useMemo(() => {
    return topicGroups.reduce<Record<number, Record<string, TopicGroup[]>>>((acc, g) => {
      if (!acc[g.semester]) acc[g.semester] = {}
      const themeKey = g.theme ?? '(Tanpa Tema)'
      if (!acc[g.semester][themeKey]) acc[g.semester][themeKey] = []
      acc[g.semester][themeKey].push(g)
      return acc
    }, {})
  }, [topicGroups])

  if (curriculumTopics.length === 0) {
    return (
      <p className="text-xs text-gray-400">
        {hasSubject === false
          ? 'Sesi ini belum memiliki mata pelajaran — pilih mata pelajaran di bagian edit sesi agar topik kurikulum bisa ditampilkan.'
          : <>Belum ada topik kurikulum untuk mata pelajaran / kelas ini.{' '}
              <a href="/admin/curriculum" className="text-blue-600 hover:underline">Kelola kurikulum</a>
            </>
        }
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Select Topic */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Topik
        </label>
        <select
          value={selectedGroupKey}
          onChange={e => handleTopicChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">— Pilih topik —</option>
          {Object.entries(bySemester).sort(([a], [b]) => Number(a) - Number(b)).map(([sem, byTheme]) =>
            Object.entries(byTheme).map(([theme, groups]) => (
              <optgroup key={`${sem}-${theme}`} label={`Sem ${sem} · ${theme}`}>
                {groups.map(g => (
                  <option key={g.key} value={g.key}>{g.topicName}</option>
                ))}
              </optgroup>
            ))
          )}
        </select>
      </div>

      {/* Step 2: Select CPs (multi-select checkboxes) */}
      {selectedGroup && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Capaian Pembelajaran
            {selectedCpIds.size > 0 && (
              <span className="ml-2 normal-case font-normal text-blue-600">({selectedCpIds.size} dipilih)</span>
            )}
          </label>
          {selectedGroup.cpRows.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Tidak ada CP untuk topik ini.</p>
          ) : (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {selectedGroup.cpRows.map(cp => {
                const checked = selectedCpIds.has(cp.id)
                return (
                  <label
                    key={cp.id}
                    className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      checked ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCp(cp.id)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0"
                    />
                    <span className={`text-sm leading-snug ${checked ? 'text-blue-700' : 'text-gray-700'}`}>
                      {cp.learning_outcomes}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!isDirty || isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Topik'}
        </button>
        {!isDirty && savedGroupKey && (
          <span className="text-xs text-green-600">Tersimpan</span>
        )}
      </div>
    </div>
  )
}
