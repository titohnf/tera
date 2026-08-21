'use client'

import React, { useState, useTransition, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CurriculumForm from './CurriculumForm'

type Topic = {
  id: string
  curriculum: string
  subject_id: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string | null
  learning_outcomes: string | null
  sort_order: number
  subjects: { name: string } | null
}

type ActionState = { error: string } | null

type AddContext = {
  curriculum: string
  subject_id: string
  grade_level: string
  semester: number
  theme?: string
  topic?: string
  nextNum?: number
}

type ThemeCtx = { curriculum: string; subject_id: string; grade_level: string; semester: number; theme: string | null }
type TopicCtx = ThemeCtx & { topic: string }

interface Props {
  topics: Topic[]
  subjects: { id: string; name: string }[]
  curriculumSubjects: { id: string; name: string }[]
  filter: { curriculum: string; grade_level: string; semester: number }
  createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  createThemesAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  createTopicsAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  createCPsAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  updateAction: (id: string, prevState: ActionState, formData: FormData) => Promise<ActionState>
  deleteAction: (id: string) => Promise<ActionState>
  renameThemeAction: (ctx: ThemeCtx, newName: string) => Promise<ActionState>
  deleteThemeAction: (ctx: ThemeCtx) => Promise<ActionState>
  moveThemeAction: (ctx: ThemeCtx, direction: 'up' | 'down') => Promise<ActionState>
  renameTopicAction: (ctx: TopicCtx, newName: string) => Promise<ActionState>
  deleteTopicAction: (ctx: TopicCtx) => Promise<ActionState>
  openThemeKey: string | null
  onToggleTheme: (key: string) => void
  onOpenTheme: (key: string) => void
}

function TextPopover({ text }: { text: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  function handleMouseEnter() {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) setPos({ x: rect.left, y: rect.bottom + 6 })
  }

  return (
    <div
      ref={ref}
      className="line-clamp-2 cursor-default"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setPos(null)}
    >
      {text}
      {pos && (
        <div
          className="fixed z-[9999] w-80 rounded-lg bg-gray-900 px-3 py-2.5 text-xs text-white shadow-xl leading-relaxed pointer-events-none"
          style={{ top: pos.y, left: Math.min(pos.x, window.innerWidth - 340) }}
        >
          {text}
        </div>
      )}
    </div>
  )
}

function toSubjectAnchorId(name: string) {
  return `subject-${name}`.toLowerCase().replace(/\s+/g, '-')
}

function toThemeAnchorId(theme: string) {
  return `theme-${theme}`.toLowerCase().replace(/\s+/g, '-')
}

function groupBySubjectThenTheme(topics: Topic[]) {
  const subjectOrder = new Map<string, number>()
  const themeOrder = new Map<string, number>()
  const subjects = new Map<string, { name: string; byTheme: Map<string, Topic[]> }>()

  for (const t of topics) {
    const subjectName = t.subjects?.name ?? 'Lainnya'
    const themeKey = t.theme ?? 'Lainnya'
    const mapKey = `${subjectName}__${themeKey}`

    if (!subjects.has(subjectName)) subjects.set(subjectName, { name: subjectName, byTheme: new Map() })
    const byTheme = subjects.get(subjectName)!.byTheme
    if (!byTheme.has(themeKey)) byTheme.set(themeKey, [])
    byTheme.get(themeKey)!.push(t)

    // Track minimum sort_order per subject and per theme
    const so = t.sort_order
    if (!subjectOrder.has(subjectName) || so < subjectOrder.get(subjectName)!) subjectOrder.set(subjectName, so)
    if (!themeOrder.has(mapKey) || so < themeOrder.get(mapKey)!) themeOrder.set(mapKey, so)
  }

  // Sort subjects by their min sort_order
  const sortedSubjects = new Map([...subjects.entries()].sort((a, b) =>
    (subjectOrder.get(a[0]) ?? 0) - (subjectOrder.get(b[0]) ?? 0)
  ))

  // Sort themes within each subject by their min sort_order
  for (const [subjectName, { byTheme }] of sortedSubjects) {
    const sortedThemes = new Map([...byTheme.entries()].sort((a, b) =>
      (themeOrder.get(`${subjectName}__${a[0]}`) ?? 0) - (themeOrder.get(`${subjectName}__${b[0]}`) ?? 0)
    ))
    sortedSubjects.get(subjectName)!.byTheme = sortedThemes
  }

  return sortedSubjects
}

const THEME_COLORS: Record<string, string> = {
  'Bilangan':                    'bg-blue-50 text-blue-700',
  'Aljabar':                     'bg-purple-50 text-purple-700',
  'Pengukuran':                  'bg-amber-50 text-amber-700',
  'Geometri':                    'bg-green-50 text-green-700',
  'Analisis Data':               'bg-rose-50 text-rose-700',
  'Analisi Data dan Peluang':    'bg-rose-50 text-rose-700',
  'Analisis Data dan Peluang':   'bg-rose-50 text-rose-700',
}

function themeBadgeClass(theme: string) {
  for (const [key, cls] of Object.entries(THEME_COLORS)) {
    if (theme.toLowerCase().includes(key.toLowerCase())) return cls
  }
  return 'bg-gray-50 text-gray-600'
}

export default function CurriculumTable({ topics, subjects, curriculumSubjects, filter, createAction, createThemesAction, createTopicsAction, createCPsAction, updateAction, deleteAction, renameThemeAction, deleteThemeAction, moveThemeAction, renameTopicAction, deleteTopicAction, openThemeKey, onToggleTheme, onOpenTheme }: Props) {
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [addContext, setAddContext] = useState<AddContext | null>(null)
  const [editingTheme, setEditingTheme] = useState<ThemeCtx | null>(null)
  const [editingTopicName, setEditingTopicName] = useState<TopicCtx | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Hapus CP ini?')) return
    startTransition(async () => { await deleteAction(id) })
  }

  function handleDeleteTheme(ctx: ThemeCtx) {
    const label = ctx.theme ?? 'Lainnya'
    if (!confirm(`Hapus tema "${label}" beserta semua topik dan CP di dalamnya?`)) return
    startTransition(async () => { await deleteThemeAction(ctx) })
  }

  function handleMoveTheme(ctx: ThemeCtx, direction: 'up' | 'down') {
    startTransition(async () => {
      const result = await moveThemeAction(ctx, direction)
      if (result?.error) alert(result.error)
    })
  }

  function handleDeleteTopic(ctx: TopicCtx) {
    if (!confirm(`Hapus topik "${ctx.topic}" beserta semua CP di dalamnya?`)) return
    startTransition(async () => { await deleteTopicAction(ctx) })
  }

  const grouped = groupBySubjectThenTheme(topics)

  return (
    <>
      <div className="space-y-6">
        {curriculumSubjects.map(subject => {
          const subjectName = subject.name
          const subjectData = grouped.get(subjectName)
          const byTheme = subjectData?.byTheme

          if (!byTheme || byTheme.size === 0) {
            return (
              <div key={subjectName} id={toSubjectAnchorId(subjectName)} data-curriculum-anchor>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-sm font-semibold text-gray-700">{subjectName}</h2>
                  <button
                    onClick={() => setAddContext({
                      curriculum: filter.curriculum,
                      subject_id: subject.id,
                      grade_level: filter.grade_level,
                      semester: filter.semester,
                      nextNum: 1,
                    })}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Tema
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4">
                  <p className="text-sm text-gray-400">Belum ada tema untuk pilihan ini.</p>
                </div>
              </div>
            )
          }

          return (
          <div
            key={subjectName}
            id={toSubjectAnchorId(subjectName)}
            data-curriculum-anchor
          >
            {/* Subject header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold text-gray-700">{subjectName}</h2>
              <button
                onClick={() => setAddContext({
                  curriculum: filter.curriculum,
                  subject_id: subject.id,
                  grade_level: filter.grade_level,
                  semester: filter.semester,
                  nextNum: (byTheme?.size ?? 0) + 1,
                })}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Tema
              </button>
            </div>

            <div className="space-y-3">
              {Array.from(byTheme.entries()).map(([theme, items], themeIdx) => {
                const themeKey = `${subjectName}__${theme}`
                const isCollapsed = openThemeKey !== themeKey
                const themeNum = themeIdx + 1
                const themeCtx: ThemeCtx = {
                  curriculum: items[0].curriculum,
                  subject_id: items[0].subject_id,
                  grade_level: items[0].grade_level,
                  semester: items[0].semester,
                  theme: items[0].theme,
                }
                return (
                <div
                  key={theme}
                  id={toThemeAnchorId(theme)}
                  data-curriculum-anchor
                  className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden"
                >
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {/* Theme header row */}
                        <tr className="bg-white border-b border-slate-200">
                          <td
                            onClick={() => onToggleTheme(themeKey)}
                            className="px-4 py-2.5 text-sm text-gray-400 tabular-nums text-center w-14 border-r border-slate-200 cursor-pointer"
                          >
                            {themeNum}.
                          </td>
                          <td
                            onClick={() => onToggleTheme(themeKey)}
                            className="px-4 py-2.5 text-sm font-semibold text-gray-700 cursor-pointer"
                          >
                            {theme}
                          </td>
                          <td className="pr-3 text-right w-36">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const firstItem = items[0]
                                  const existingTopicCount = new Set(items.map(i => i.topic).filter(Boolean)).size
                                  setAddContext({
                                    curriculum: firstItem.curriculum,
                                    subject_id: firstItem.subject_id,
                                    grade_level: firstItem.grade_level,
                                    semester: firstItem.semester,
                                    theme,
                                    nextNum: existingTopicCount + 1,
                                  })
                                }}
                                className="flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap"
                              >
                                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Tambah Topik
                              </button>
                              <div className="w-px h-3 bg-gray-200" />
                              {/* Urutan tema itu turunan dari sort_order baris-barisnya, jadi
                                  memindahkannya berarti menukar angka urut dengan tema tetangga
                                  — lihat moveTheme di lib/actions/admin/curriculum.ts */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveTheme(themeCtx, 'up') }}
                                disabled={isPending || themeIdx === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                                title="Geser tema ke atas"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveTheme(themeCtx, 'down') }}
                                disabled={isPending || themeIdx === byTheme.size - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                                title="Geser tema ke bawah"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingTheme(themeCtx) }}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                title="Edit tema"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTheme(themeCtx) }}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Hapus tema"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              <svg
                                onClick={() => onToggleTheme(themeKey)}
                                className={`w-3.5 h-3.5 text-gray-400 cursor-pointer transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </td>
                        </tr>
                        {isCollapsed ? null : (<>
                        {(() => {
                          const topicGroups = new Map<string, Topic[]>()
                          for (const item of items) {
                            if (!item.topic) continue
                            if (!topicGroups.has(item.topic)) topicGroups.set(item.topic, [])
                            topicGroups.get(item.topic)!.push(item)
                          }
                          return Array.from(topicGroups.entries()).map(([topic, rows], topicIdx) => (
                            <React.Fragment key={topic}>
                              {topicIdx > 0 && (
                                <tr key={`spacer-${topic}`}><td colSpan={2} className="py-1.5" /></tr>
                              )}
                              <tr key={`topic-${topic}`} className="group/topic border-t border-slate-200 bg-slate-50/60">
                                <td className="px-4 py-2.5 text-sm text-gray-400 text-center tabular-nums w-14 border-r border-slate-200 border-b border-b-slate-200">
                                  {themeNum}.{topicIdx + 1}
                                </td>
                                <td className="px-4 py-2.5 text-sm font-medium text-gray-800 border-b border-slate-200 relative" colSpan={2}>
                                  {topic}
                                  <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => { const r = rows[0]; setEditingTopicName({ curriculum: r.curriculum, subject_id: r.subject_id, grade_level: r.grade_level, semester: r.semester, theme: r.theme!, topic }) }}
                                      className="p-1.5 text-gray-400 hover:text-gray-600 bg-slate-50 hover:bg-gray-100 rounded-md transition-colors"
                                      title="Edit topik"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => { const r = rows[0]; handleDeleteTopic({ curriculum: r.curriculum, subject_id: r.subject_id, grade_level: r.grade_level, semester: r.semester, theme: r.theme!, topic }) }}
                                      className="p-1.5 text-gray-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-md transition-colors"
                                      title="Hapus topik"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {rows.filter(item => item.learning_outcomes !== null).map((item, idx) => (
                                <tr key={item.id} className={`group hover:bg-slate-50/60 transition-colors border-b border-slate-100`}>
                                  <td className="px-4 py-2.5 text-sm text-gray-400 text-center align-top tabular-nums w-14 border-r border-slate-100">
                                    {themeNum}.{topicIdx + 1}.{idx + 1}
                                  </td>
                                  <td className="px-4 py-2.5 text-sm text-gray-700 leading-relaxed align-top relative" colSpan={2}>
                                    {item.learning_outcomes ?? <span className="text-gray-300">—</span>}
                                    <div className="absolute top-1.5 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => setEditingTopic(item)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-lg shadow-sm ring-1 ring-gray-900/10 transition-colors"
                                        title="Edit"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg shadow-sm ring-1 ring-gray-900/10 transition-colors"
                                        title="Hapus"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {/* Add CP row */}
                              <tr key={`add-cp-${topic}`} className="border-b border-slate-100">
                                <td className="w-14 border-r border-slate-100" />
                                <td colSpan={2} className="px-4 py-1.5">
                                  <button
                                    onClick={() => {
                                      const ref = rows[0]
                                      const cpCount = rows.filter(item => item.learning_outcomes !== null).length
                                      setAddContext({
                                        curriculum: ref.curriculum,
                                        subject_id: ref.subject_id,
                                        grade_level: ref.grade_level,
                                        semester: ref.semester,
                                        theme: ref.theme ?? undefined,
                                        topic,
                                        nextNum: cpCount + 1,
                                      })
                                    }}
                                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors py-0.5"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Tambah CP
                                  </button>
                                </td>
                              </tr>
                            </React.Fragment>
                          ))
                        })()}
                        </>)}
                      </tbody>
                    </table>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
          )
        })}
      </div>

      {/* Add dialog */}
      <Dialog open={!!addContext} onOpenChange={(open) => { if (!open) setAddContext(null) }}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{addContext?.topic ? 'Tambah CP' : addContext?.theme ? 'Tambah Topik' : 'Tambah Tema'}</DialogTitle>
          </DialogHeader>
          {addContext && (
            <CurriculumForm
              subjects={subjects}
              action={createAction}
              themesAction={createThemesAction}
              topicsAction={createTopicsAction}
              cpsAction={createCPsAction}
              defaultValues={addContext}
              onSuccess={() => {
                if (addContext.theme) {
                  const subjectName = subjects.find(s => s.id === addContext.subject_id)?.name ?? ''
                  onOpenTheme(`${subjectName}__${addContext.theme}`)
                }
                setAddContext(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingTopic} onOpenChange={(open) => { if (!open) setEditingTopic(null) }}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Topik</DialogTitle>
          </DialogHeader>
          {editingTopic && (
            <CurriculumForm
              subjects={subjects}
              action={updateAction.bind(null, editingTopic.id)}
              isEdit
              defaultValues={{
                subject_id: editingTopic.subject_id,
                grade_level: editingTopic.grade_level,
                semester: editingTopic.semester,
                theme: editingTopic.theme,
                topic: editingTopic.topic,
                learning_outcomes: editingTopic.learning_outcomes,
                sort_order: editingTopic.sort_order,
              }}
              onSuccess={() => setEditingTopic(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit tema dialog */}
      <Dialog open={!!editingTheme} onOpenChange={(open) => { if (!open) setEditingTheme(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Tema</DialogTitle>
          </DialogHeader>
          {editingTheme && (
            <RenameForm
              label="Tema"
              defaultValue={editingTheme.theme ?? ''}
              onSave={async (val) => {
                const result = await renameThemeAction(editingTheme, val)
                if (!result) setEditingTheme(null)
                return result
              }}
              onCancel={() => setEditingTheme(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit nama topik dialog */}
      <Dialog open={!!editingTopicName} onOpenChange={(open) => { if (!open) setEditingTopicName(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Topik</DialogTitle>
          </DialogHeader>
          {editingTopicName && (
            <RenameForm
              label="Topik"
              defaultValue={editingTopicName.topic}
              onSave={async (val) => {
                const result = await renameTopicAction(editingTopicName, val)
                if (!result) setEditingTopicName(null)
                return result
              }}
              onCancel={() => setEditingTopicName(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function RenameForm({ label, defaultValue, onSave, onCancel }: {
  label: string
  defaultValue: string
  onSave: (val: string) => Promise<ActionState>
  onCancel: () => void
}) {
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await onSave(value)
    if (result) setError(result.error)
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          required
          autoFocus
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !value.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
        >
          {pending ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border text-sm rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          Batal
        </button>
      </div>
    </form>
  )
}
