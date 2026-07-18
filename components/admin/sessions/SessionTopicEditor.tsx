'use client'

import { useState, useMemo, useTransition } from 'react'

type SaveTopicAction = (
  sessionId: string,
  curriculumTopicId: string | null,
  topicText: string,
  selectedCpIds: string[],
) => Promise<{ error?: string }>

type SaveCustomTopicAction = (
  sessionId: string,
  theme: string,
  topicText: string,
  learningOutcomes: string[],
) => Promise<{ error?: string }>

interface CurriculumTopic {
  id: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string | null
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
  saveAction: SaveTopicAction
  isAdmin?: boolean
  readOnly?: boolean
  isPrivateClass?: boolean
  initialCustomTheme?: string | null
  initialCustomLearningOutcomes?: string[]
  saveCustomAction?: SaveCustomTopicAction
}

export default function SessionTopicEditor({
  sessionId,
  initialTopicId,
  initialTopic,
  initialCpIds = [],
  curriculumTopics,
  hasSubject,
  saveAction,
  isAdmin,
  readOnly = false,
  isPrivateClass = false,
  initialCustomTheme = null,
  initialCustomLearningOutcomes = [],
  saveCustomAction,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // De-duplicate topics: group rows by (semester, theme, topic)
  const topicGroups = useMemo<TopicGroup[]>(() => {
    const map = new Map<string, TopicGroup>()
    for (const t of curriculumTopics) {
      if (!t.topic?.trim()) continue // skip theme-only placeholder rows
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

  const canUseCustom = isPrivateClass && !!saveCustomAction
  const [mode, setMode] = useState<'curriculum' | 'custom'>(() => {
    if (canUseCustom && initialCustomTheme != null) return 'custom'
    if (canUseCustom && topicGroups.length === 0) return 'custom'
    return 'curriculum'
  })

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

  // Custom (kelas privat) tema/topik/CP state
  const initialOutcomes = initialCustomLearningOutcomes.length > 0 ? initialCustomLearningOutcomes : ['']
  const [customTheme, setCustomTheme] = useState(initialCustomTheme ?? '')
  const [customTopic, setCustomTopic] = useState(mode === 'custom' ? (initialTopic ?? '') : '')
  const [customOutcomes, setCustomOutcomes] = useState<string[]>(initialOutcomes)

  const [savedCustomTheme, setSavedCustomTheme] = useState(initialCustomTheme ?? '')
  const [savedCustomTopic, setSavedCustomTopic] = useState(mode === 'custom' ? (initialTopic ?? '') : '')
  const [savedCustomOutcomes, setSavedCustomOutcomes] = useState<string[]>(initialOutcomes)

  const isCustomDirty =
    customTheme !== savedCustomTheme ||
    customTopic !== savedCustomTopic ||
    customOutcomes.length !== savedCustomOutcomes.length ||
    customOutcomes.some((v, i) => v !== savedCustomOutcomes[i])

  function updateOutcome(index: number, value: string) {
    setCustomOutcomes(prev => prev.map((v, i) => (i === index ? value : v)))
  }

  function addOutcome() {
    setCustomOutcomes(prev => [...prev, ''])
  }

  function removeOutcome(index: number) {
    setCustomOutcomes(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

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
    setError(null)
    startTransition(async () => {
      const result = await saveAction(sessionId, group?.representativeId ?? null, group?.topicName ?? '', [...selectedCpIds])
      if (result?.error) {
        setError(result.error)
        return
      }
      setSavedGroupKey(selectedGroupKey)
      setSavedCpIds(new Set(selectedCpIds))
    })
  }

  function saveCustom() {
    if (!isCustomDirty || !saveCustomAction) return
    setError(null)
    const outcomes = customOutcomes.map(o => o.trim()).filter(Boolean)
    startTransition(async () => {
      const result = await saveCustomAction(sessionId, customTheme.trim(), customTopic.trim(), outcomes)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSavedCustomTheme(customTheme)
      setSavedCustomTopic(customTopic)
      setSavedCustomOutcomes(customOutcomes)
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

  return (
    <div className="space-y-4">
      {canUseCustom && (
        <div className="flex gap-2">
          {([{ val: 'curriculum', label: 'Dari Kurikulum' }, { val: 'custom', label: 'Buat Sendiri' }] as const).map(opt => (
            <button
              key={opt.val}
              type="button"
              disabled={readOnly}
              onClick={() => setMode(opt.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:cursor-not-allowed ${
                mode === opt.val
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50 disabled:hover:bg-white'
              }`}
            >{opt.label}</button>
          ))}
        </div>
      )}

      {mode === 'custom' && canUseCustom ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Tema
            </label>
            <input
              type="text"
              value={customTheme}
              onChange={e => setCustomTheme(e.target.value)}
              disabled={readOnly}
              placeholder="Tulis tema sendiri"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Topik
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              disabled={readOnly}
              placeholder="Tulis topik sendiri"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-gray-700 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Capaian Pembelajaran
            </label>
            <div className="space-y-2">
              {customOutcomes.map((value, i) => (
                <div key={i} className="flex items-start gap-2">
                  <textarea
                    value={value}
                    onChange={e => updateOutcome(i, e.target.value)}
                    disabled={readOnly}
                    rows={2}
                    placeholder={`CP ${i + 1}`}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-gray-700 disabled:cursor-not-allowed resize-none"
                  />
                  {!readOnly && customOutcomes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOutcome(i)}
                      className="mt-1.5 text-gray-400 hover:text-red-600 shrink-0"
                      aria-label="Hapus CP"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={addOutcome}
                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                + Tambah CP
              </button>
            )}
          </div>

          {!readOnly && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveCustom}
                disabled={!isCustomDirty || isPending}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Topik'}
              </button>
              {!isCustomDirty && savedCustomTheme && !error && (
                <span className="text-xs text-green-600">Tersimpan</span>
              )}
            </div>
          )}
        </div>
      ) : topicGroups.length === 0 ? (
        <p className="text-xs text-gray-400">
          {hasSubject === false
            ? 'Sesi ini belum memiliki mata pelajaran — pilih mata pelajaran di bagian edit sesi agar topik kurikulum bisa ditampilkan.'
            : isAdmin
              ? <>Belum ada topik kurikulum untuk mata pelajaran / kelas ini.{' '}
                  <a href="/admin/curriculum" className="text-blue-600 hover:underline">Kelola kurikulum</a>
                </>
              : <>Belum ada topik kurikulum untuk mata pelajaran / kelas ini. Hubungi admin untuk menambahkannya via{' '}
                  <a href="https://wa.me/+6281315502949" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">WhatsApp</a>
                </>
          }
        </p>
      ) : (
        <div className="space-y-4">
          {/* Step 1: Select Topic */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Topik
            </label>
            <select
              value={selectedGroupKey}
              onChange={e => handleTopicChange(e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-gray-700 disabled:cursor-not-allowed"
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
                        className={`flex items-start gap-3 px-3 py-2.5 transition-colors ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                          checked ? 'bg-blue-50' : readOnly ? '' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCp(cp.id)}
                          disabled={readOnly}
                          className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0 disabled:cursor-not-allowed"
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
          {!readOnly && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={!isDirty || isPending}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Topik'}
              </button>
              {!isDirty && savedGroupKey && !error && (
                <span className="text-xs text-green-600">Tersimpan</span>
              )}
            </div>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
