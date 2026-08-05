'use client'

import { useActionState, useEffect, useRef, useState, useCallback } from 'react'
import { CURRICULA, gradesFor, hasSemester, TKA_SEMESTER } from '@/lib/curriculum-config'

type ActionState = { error: string } | null

interface DefaultValues {
  curriculum: string
  subject_id: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string | null
  learning_outcomes: string | null
  sort_order: number
  nextNum: number
}

interface Props {
  subjects: { id: string; name: string }[]
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  themesAction?: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  topicsAction?: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  cpsAction?: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<DefaultValues>
  onSuccess?: () => void
  isEdit?: boolean
}

function AddThemesForm({
  themesAction,
  defaultValues,
  subjects,
  onSuccess,
}: {
  themesAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<DefaultValues>
  subjects: { id: string; name: string }[]
  onSuccess?: () => void
}) {
  const startNum = defaultValues?.nextNum ?? 1
  const [themes, setThemes] = useState([''])
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await themesAction(prev, formData)
      if (!result) onSuccess?.()
      return result
    },
    null,
  )
  const lastInputRef = useRef<HTMLInputElement>(null)
  const subjectName = subjects.find(s => s.id === defaultValues?.subject_id)?.name

  function addRow() {
    setThemes(prev => [...prev, ''])
    setTimeout(() => lastInputRef.current?.focus(), 0)
  }

  function updateTheme(i: number, val: string) {
    setThemes(prev => prev.map((t, idx) => idx === i ? val : t))
  }

  function removeTheme(i: number) {
    setThemes(prev => prev.length === 1 ? [''] : prev.filter((_, idx) => idx !== i))
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="curriculum" value={defaultValues?.curriculum ?? 'Kurikulum Merdeka'} />
      <input type="hidden" name="subject_id" value={defaultValues?.subject_id ?? ''} />
      <input type="hidden" name="grade_level" value={defaultValues?.grade_level ?? ''} />
      <input type="hidden" name="semester" value={defaultValues?.semester ?? ''} />

      {/* Context bar */}
      {(defaultValues?.curriculum || subjectName || defaultValues?.grade_level) && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs bg-gray-50 rounded-lg px-3 py-2">
          {defaultValues?.curriculum && <span className="text-gray-500">{defaultValues.curriculum}</span>}
          {subjectName && <><span className="text-gray-300">·</span><span className="text-gray-700 font-medium">{subjectName}</span></>}
          {defaultValues?.grade_level && <><span className="text-gray-300">·</span><span className="text-gray-500">{defaultValues.grade_level}</span></>}
          {defaultValues?.semester && hasSemester(defaultValues?.curriculum ?? '') && <><span className="text-gray-300">·</span><span className="text-gray-500">Semester {defaultValues.semester}</span></>}
        </div>
      )}

      <div className="space-y-2">
        {themes.map((t, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-xs font-medium text-gray-400 tabular-nums w-6 text-right shrink-0">{startNum + i}.</span>
            <input type="hidden" name="sort_order" value={startNum + i} />
            <input
              ref={i === themes.length - 1 ? lastInputRef : undefined}
              name="theme"
              type="text"
              value={t}
              autoFocus={i === 0}
              onChange={e => updateTheme(i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRow() } }}
              placeholder={`Tema ${startNum + i}`}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => removeTheme(i)}
              className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Tambah tema lagi
      </button>

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending || themes.every(t => !t.trim())}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
      >
        {isPending ? 'Menyimpan...' : `Simpan ${themes.filter(t => t.trim()).length > 1 ? `${themes.filter(t => t.trim()).length} Tema` : 'Tema'}`}
      </button>
    </form>
  )
}

function AddTopicsForm({ topicsAction, defaultValues, subjects, onSuccess }: {
  topicsAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<DefaultValues>
  subjects: { id: string; name: string }[]
  onSuccess?: () => void
}) {
  const startNum = defaultValues?.nextNum ?? 1
  const [topics, setTopics] = useState([''])
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await topicsAction(prev, formData)
      if (!result) onSuccess?.()
      return result
    },
    null,
  )
  const lastInputRef = useRef<HTMLInputElement>(null)
  const subjectName = subjects.find(s => s.id === defaultValues?.subject_id)?.name

  function addRow() {
    setTopics(prev => [...prev, ''])
    setTimeout(() => lastInputRef.current?.focus(), 0)
  }

  function updateTopic(i: number, val: string) {
    setTopics(prev => prev.map((t, idx) => idx === i ? val : t))
  }

  function removeTopic(i: number) {
    setTopics(prev => prev.length === 1 ? [''] : prev.filter((_, idx) => idx !== i))
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="curriculum" value={defaultValues?.curriculum ?? 'Kurikulum Merdeka'} />
      <input type="hidden" name="subject_id" value={defaultValues?.subject_id ?? ''} />
      <input type="hidden" name="grade_level" value={defaultValues?.grade_level ?? ''} />
      <input type="hidden" name="semester" value={defaultValues?.semester ?? ''} />
      <input type="hidden" name="theme" value={defaultValues?.theme ?? ''} />

      {(defaultValues?.curriculum || subjectName || defaultValues?.grade_level) && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs bg-gray-50 rounded-lg px-3 py-2">
          {defaultValues?.curriculum && <span className="text-gray-500">{defaultValues.curriculum}</span>}
          {subjectName && <><span className="text-gray-300">·</span><span className="text-gray-700 font-medium">{subjectName}</span></>}
          {defaultValues?.grade_level && <><span className="text-gray-300">·</span><span className="text-gray-500">{defaultValues.grade_level}</span></>}
          {defaultValues?.semester && hasSemester(defaultValues?.curriculum ?? '') && <><span className="text-gray-300">·</span><span className="text-gray-500">Semester {defaultValues.semester}</span></>}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tema</label>
        <p className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">{defaultValues?.theme}</p>
      </div>

      <div className="space-y-2">
        {topics.map((t, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-xs font-medium text-gray-400 tabular-nums w-6 text-right shrink-0">{startNum + i}.</span>
            <input type="hidden" name="sort_order" value={startNum + i} />
            <input
              ref={i === topics.length - 1 ? lastInputRef : undefined}
              name="topic"
              type="text"
              value={t}
              autoFocus={i === 0}
              onChange={e => updateTopic(i, e.target.value)}
              placeholder={`Topik ${startNum + i}`}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="button" onClick={() => removeTopic(i)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Tambah topik lagi
      </button>

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <button type="submit" disabled={isPending || topics.every(t => !t.trim())} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300">
        {isPending ? 'Menyimpan...' : `Simpan ${topics.filter(t => t.trim()).length > 1 ? `${topics.filter(t => t.trim()).length} Topik` : 'Topik'}`}
      </button>
    </form>
  )
}

function AddCPsForm({ cpsAction, defaultValues, subjects, onSuccess }: {
  cpsAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<DefaultValues>
  subjects: { id: string; name: string }[]
  onSuccess?: () => void
}) {
  const startNum = defaultValues?.nextNum ?? 1
  const [cps, setCps] = useState([''])
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await cpsAction(prev, formData)
      if (!result) onSuccess?.()
      return result
    },
    null,
  )
  const lastInputRef = useRef<HTMLTextAreaElement>(null)
  const subjectName = subjects.find(s => s.id === defaultValues?.subject_id)?.name

  function addRow() {
    setCps(prev => [...prev, ''])
    setTimeout(() => lastInputRef.current?.focus(), 0)
  }

  function updateCp(i: number, val: string) {
    setCps(prev => prev.map((c, idx) => idx === i ? val : c))
  }

  function removeCp(i: number) {
    setCps(prev => prev.length === 1 ? [''] : prev.filter((_, idx) => idx !== i))
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="curriculum" value={defaultValues?.curriculum ?? 'Kurikulum Merdeka'} />
      <input type="hidden" name="subject_id" value={defaultValues?.subject_id ?? ''} />
      <input type="hidden" name="grade_level" value={defaultValues?.grade_level ?? ''} />
      <input type="hidden" name="semester" value={defaultValues?.semester ?? ''} />
      <input type="hidden" name="theme" value={defaultValues?.theme ?? ''} />
      <input type="hidden" name="topic" value={defaultValues?.topic ?? ''} />

      {(defaultValues?.curriculum || subjectName || defaultValues?.grade_level) && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs bg-gray-50 rounded-lg px-3 py-2">
          {defaultValues?.curriculum && <span className="text-gray-500">{defaultValues.curriculum}</span>}
          {subjectName && <><span className="text-gray-300">·</span><span className="text-gray-700 font-medium">{subjectName}</span></>}
          {defaultValues?.grade_level && <><span className="text-gray-300">·</span><span className="text-gray-500">{defaultValues.grade_level}</span></>}
          {defaultValues?.semester && hasSemester(defaultValues?.curriculum ?? '') && <><span className="text-gray-300">·</span><span className="text-gray-500">Semester {defaultValues.semester}</span></>}
        </div>
      )}

      {defaultValues?.theme && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tema</label>
          <p className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">{defaultValues.theme}</p>
        </div>
      )}

      {defaultValues?.topic && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Topik</label>
          <p className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">{defaultValues.topic}</p>
        </div>
      )}

      <div className="space-y-2">
        {cps.map((c, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-xs font-medium text-gray-400 tabular-nums w-6 text-right shrink-0 pt-2.5">{startNum + i}.</span>
            <input type="hidden" name="sort_order" value={startNum + i} />
            <textarea
              ref={i === cps.length - 1 ? lastInputRef : undefined}
              name="learning_outcomes"
              rows={2}
              value={c}
              autoFocus={i === 0}
              onChange={e => updateCp(i, e.target.value)}
              placeholder={`Peserta didik mampu... (CP ${startNum + i})`}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button type="button" onClick={() => removeCp(i)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors mt-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Tambah CP lagi
      </button>

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <button type="submit" disabled={isPending || cps.every(c => !c.trim())} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300">
        {isPending ? 'Menyimpan...' : `Simpan ${cps.filter(c => c.trim()).length > 1 ? `${cps.filter(c => c.trim()).length} CP` : 'CP'}`}
      </button>
    </form>
  )
}

export default function CurriculumForm({ subjects, action, themesAction, topicsAction, cpsAction, defaultValues, onSuccess, isEdit = false }: Props) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData)
      if (!result) onSuccess?.()
      return result
    },
    null,
  )

  const formRef = useRef<HTMLFormElement>(null)

  // Edit mode lets the curriculum be changed, and the curriculum decides which
  // grades exist and whether there is a semester at all — so it is tracked here
  // rather than left to the uncontrolled select.
  const [editCurriculum, setEditCurriculum] = useState(defaultValues?.curriculum ?? 'Kurikulum Merdeka')
  const editGrades = gradesFor(editCurriculum)

  useEffect(() => {
    if (state === null && !isEdit) formRef.current?.reset()
  }, [state, isEdit])

  // Context modes for create flow
  const isThemeOnly = !isEdit && !defaultValues?.theme  // Tambah Tema — delegate to AddThemesForm
  const isTopicAdd  = !isEdit && !!defaultValues?.theme && !defaultValues?.topic  // Tambah Topik (tema locked)
  const isCpAdd     = !isEdit && !!defaultValues?.topic  // Tambah CP (tema + topik locked)

  const subjectName = subjects.find(s => s.id === defaultValues?.subject_id)?.name

  if (isThemeOnly && themesAction) {
    return <AddThemesForm themesAction={themesAction} defaultValues={defaultValues} subjects={subjects} onSuccess={onSuccess} />
  }

  if (isTopicAdd && topicsAction) {
    return <AddTopicsForm topicsAction={topicsAction} defaultValues={defaultValues} subjects={subjects} onSuccess={onSuccess} />
  }

  if (isCpAdd && cpsAction) {
    return <AddCPsForm cpsAction={cpsAction} defaultValues={defaultValues} subjects={subjects} onSuccess={onSuccess} />
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">

      {/* Context info bar — show in all create modes when context is known */}
      {!isEdit && (defaultValues?.curriculum || subjectName || defaultValues?.grade_level) && (
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs bg-gray-50 rounded-lg px-3 py-2">
          {defaultValues?.curriculum && <span className="text-gray-500">{defaultValues.curriculum}</span>}
          {subjectName && <><span className="text-gray-300">·</span><span className="text-gray-700 font-medium">{subjectName}</span></>}
          {defaultValues?.grade_level && <><span className="text-gray-300">·</span><span className="text-gray-500">{defaultValues.grade_level}</span></>}
          {defaultValues?.semester && hasSemester(defaultValues?.curriculum ?? '') && <><span className="text-gray-300">·</span><span className="text-gray-500">Semester {defaultValues.semester}</span></>}
        </div>
      )}

      {/* Hidden context fields for create modes */}
      {!isEdit && (
        <>
          <input type="hidden" name="curriculum" value={defaultValues?.curriculum ?? 'Kurikulum Merdeka'} />
          <input type="hidden" name="subject_id" value={defaultValues?.subject_id ?? ''} />
          <input type="hidden" name="grade_level" value={defaultValues?.grade_level ?? ''} />
          <input type="hidden" name="semester" value={defaultValues?.semester ?? ''} />
        </>
      )}

      {/* ── TEMA ── */}
      {isThemeOnly && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tema</label>
          <input
            name="theme"
            type="text"
            required
            autoFocus
            placeholder="Contoh: Bilangan Bulat"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Tema locked (adding topik or CP) */}
      {(isTopicAdd || isCpAdd) && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tema</label>
          <input type="hidden" name="theme" value={defaultValues?.theme ?? ''} />
          <p className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">
            {defaultValues?.theme}
          </p>
        </div>
      )}

      {/* Tema editable (edit mode) */}
      {isEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tema</label>
          <input
            name="theme"
            type="text"
            required
            defaultValue={defaultValues?.theme ?? ''}
            placeholder="Contoh: Bilangan Bulat"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* ── TOPIK ── hidden when tema-only */}
      {!isThemeOnly && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Topik</label>
          {isCpAdd ? (
            <>
              <input type="hidden" name="topic" value={defaultValues?.topic ?? ''} />
              <p className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">
                {defaultValues?.topic}
              </p>
            </>
          ) : (
            <input
              name="topic"
              type="text"
              required
              autoFocus={isTopicAdd}
              defaultValue={defaultValues?.topic ?? ''}
              placeholder="Contoh: Penjumlahan dan Pengurangan"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      )}

      {/* ── CAPAIAN PEMBELAJARAN ── only when topik is known */}
      {(isCpAdd || isEdit) && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Capaian Pembelajaran <span className="font-normal">(opsional)</span>
          </label>
          <textarea
            name="learning_outcomes"
            rows={3}
            defaultValue={defaultValues?.learning_outcomes ?? ''}
            placeholder="Peserta didik mampu..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}

      {/* ── EDIT ONLY: full context selects + sort order ── */}
      {isEdit && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kurikulum</label>
            <select
              name="curriculum"
              required
              value={editCurriculum}
              onChange={e => setEditCurriculum(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CURRICULA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mata Pelajaran</label>
            <select
              name="subject_id"
              required
              defaultValue={defaultValues?.subject_id ?? ''}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>Pilih mata pelajaran</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label>
              <select
                key={editCurriculum}
                name="grade_level"
                required
                defaultValue={editGrades.includes(defaultValues?.grade_level ?? '') ? defaultValues?.grade_level : ''}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="" disabled>Pilih kelas</option>
                {editGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            {hasSemester(editCurriculum) ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Semester</label>
                <select
                  name="semester"
                  required
                  defaultValue={defaultValues?.semester ?? ''}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>Pilih</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
            ) : (
              // TKA has no semesters; the column still needs a value, so the
              // filler is submitted silently instead of being asked for.
              <input type="hidden" name="semester" value={TKA_SEMESTER} />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Urutan</label>
            <input
              name="sort_order"
              type="number"
              min="0"
              defaultValue={defaultValues?.sort_order ?? 0}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {state?.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
      >
        {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan'}
      </button>
    </form>
  )
}
