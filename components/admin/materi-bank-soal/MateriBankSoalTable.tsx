'use client'

import React, { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ResourceKind, TopicContext, ActionState } from '@/lib/actions/admin/curriculum-resources'

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

// Asesmen (from the `assessments` table) is display-only here — admins add
// materi/bank soal via this page, but assessments are always authored by a
// tutor from the session's own "Asesmen & Bank Soal" tab.
export type DisplayKind = ResourceKind | 'asesmen'

export type DisplayRow = {
  id: string
  subjectId: string
  subjectName: string
  gradeLevel: string | null
  semester: number | null
  theme: string
  topic: string
  // Whether this row's tema/topik is a real Kurikulum entry (curriculum_topics)
  // or something a tutor typed freehand for a session with no formal CP.
  topicSource: 'kurikulum' | 'tutor'
  kind: DisplayKind
  title: string
  href: string
  source: 'admin' | 'tutor'
  tutorName: string | null
  // Session this item came from, so admins can open the session's own
  // journal-completeness checklist and reject it if the tema/topik was
  // never filled in properly. Admin-added curriculum_resources have none.
  sessionId: string | null
}

interface Props {
  rows: DisplayRow[]
  allTopics: Topic[]
  allSubjects: { id: string; name: string }[]
  createResourceAction: (ctx: TopicContext, kind: ResourceKind, prevState: ActionState, formData: FormData) => Promise<ActionState>
  deleteResourceAction: (id: string) => Promise<ActionState>
}

const RESOURCE_LABEL: Record<DisplayKind, string> = { materi: 'Materi', bank_soal: 'Bank Soal', asesmen: 'Asesmen' }

function AddResourceForm({ subjects, allTopics, onSubmit, onCancel }: {
  subjects: { id: string; name: string }[]
  allTopics: Topic[]
  onSubmit: (ctx: TopicContext, kind: ResourceKind, title: string, linkUrl: string) => Promise<ActionState>
  onCancel: () => void
}) {
  const [subjectId, setSubjectId] = useState('')
  const [curriculum, setCurriculum] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [semester, setSemester] = useState<number | ''>('')
  const [theme, setTheme] = useState('')
  const [topic, setTopic] = useState('')
  const [kind, setKind] = useState<ResourceKind>('materi')
  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const topicsForSubject = allTopics.filter(t => t.subject_id === subjectId)
  const curricula = [...new Set(topicsForSubject.map(t => t.curriculum))]
  const topicsForCurriculum = topicsForSubject.filter(t => t.curriculum === curriculum)
  const gradeLevels = [...new Set(topicsForCurriculum.map(t => t.grade_level))]
  const topicsForGrade = topicsForCurriculum.filter(t => t.grade_level === gradeLevel)
  const semesters = [...new Set(topicsForGrade.map(t => t.semester))].sort()
  const topicsForSemester = topicsForGrade.filter(t => t.semester === semester)
  const themes = [...new Set(topicsForSemester.map(t => t.theme).filter((v): v is string => !!v))]
  const topicsForTheme = [...new Set(
    topicsForSemester.filter(t => t.theme === theme).map(t => t.topic).filter((v): v is string => !!v)
  )]

  function handleSubjectChange(id: string) {
    setSubjectId(id)
    setCurriculum('')
    setGradeLevel('')
    setSemester('')
    setTheme('')
    setTopic('')
  }

  function handleCurriculumChange(val: string) {
    setCurriculum(val)
    setGradeLevel('')
    setSemester('')
    setTheme('')
    setTopic('')
  }

  function handleGradeChange(val: string) {
    setGradeLevel(val)
    setSemester('')
    setTheme('')
    setTopic('')
  }

  function handleSemesterChange(val: number | '') {
    setSemester(val)
    setTheme('')
    setTopic('')
  }

  function handleThemeChange(val: string) {
    setTheme(val)
    setTopic('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectId || !curriculum || !gradeLevel || !semester || !theme || !topic) return
    setPending(true)
    setError(null)
    const ctx: TopicContext = {
      curriculum, subject_id: subjectId, grade_level: gradeLevel, semester, theme, topic,
    }
    const result = await onSubmit(ctx, kind, title, linkUrl)
    if (result) setError(result.error)
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Mapel</label>
        <select
          value={subjectId}
          onChange={e => handleSubjectChange(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Pilih mapel...</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Kurikulum</label>
          <select
            value={curriculum}
            onChange={e => handleCurriculumChange(e.target.value)}
            required
            disabled={!subjectId}
            className="w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Pilih...</option>
            {curricula.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label>
          <select
            value={gradeLevel}
            onChange={e => handleGradeChange(e.target.value)}
            required
            disabled={!curriculum}
            className="w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Pilih...</option>
            {gradeLevels.map(g => <option key={g} value={g}>{g.replace('Kelas ', '')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Semester</label>
          <select
            value={semester}
            onChange={e => handleSemesterChange(e.target.value ? Number(e.target.value) : '')}
            required
            disabled={!gradeLevel}
            className="w-full px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Pilih...</option>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tema</label>
        <select
          value={theme}
          onChange={e => handleThemeChange(e.target.value)}
          required
          disabled={!semester}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">{semester ? 'Pilih tema...' : 'Pilih semester dulu'}</option>
          {themes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Topik</label>
        <select
          value={topic}
          onChange={e => setTopic(e.target.value)}
          required
          disabled={!theme}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">{theme ? 'Pilih topik...' : 'Pilih tema dulu'}</option>
          {topicsForTheme.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Jenis</label>
        <div className="flex gap-2">
          {(['materi', 'bank_soal'] as const).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                kind === k ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {RESOURCE_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Judul</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Link</label>
        <input
          type="url"
          value={linkUrl}
          onChange={e => setLinkUrl(e.target.value)}
          placeholder="https://..."
          required
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !subjectId || !curriculum || !gradeLevel || !semester || !theme || !topic || !title.trim() || !linkUrl.trim()}
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

type TopicGroup = {
  key: string
  subjectName: string
  gradeLevel: string | null
  semester: number | null
  theme: string
  topic: string
  topicSource: 'kurikulum' | 'tutor'
  materi: DisplayRow[]
  bankSoal: DisplayRow[]
  asesmen: DisplayRow[]
}

function groupByTopic(rows: DisplayRow[]): TopicGroup[] {
  const groups = new Map<string, TopicGroup>()
  for (const r of rows) {
    const key = `${r.subjectId}__${r.gradeLevel}__${r.semester}__${r.theme}__${r.topic}`
    if (!groups.has(key)) {
      groups.set(key, {
        key, subjectName: r.subjectName, gradeLevel: r.gradeLevel, semester: r.semester,
        theme: r.theme, topic: r.topic, topicSource: r.topicSource, materi: [], bankSoal: [], asesmen: [],
      })
    }
    const g = groups.get(key)!
    if (r.kind === 'materi') g.materi.push(r)
    else if (r.kind === 'bank_soal') g.bankSoal.push(r)
    else g.asesmen.push(r)
  }
  return Array.from(groups.values()).sort((a, b) =>
    a.subjectName.localeCompare(b.subjectName) || a.theme.localeCompare(b.theme) || a.topic.localeCompare(b.topic)
  )
}

function ResourceCell({ items, onDelete }: { items: DisplayRow[]; onDelete: (id: string) => void }) {
  if (items.length === 0) return <span className="text-gray-300">—</span>
  return (
    <ul className="space-y-1">
      {items.map(r => (
        <li key={r.id} className="group flex items-center gap-1.5">
          <a
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-blue-700 hover:underline truncate min-w-0"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m5.656-5.656l1.5-1.5a4 4 0 015.656 5.656l-3 3a4 4 0 01-5.656 0" />
            </svg>
            <span className="truncate">{r.title}</span>
          </a>
          {r.sessionId && (
            <a
              href={`/admin/sessions/${r.sessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-0.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              title="Buka sesi sumber"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </a>
          )}
          {r.source === 'tutor' ? (
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0" title={r.tutorName ? `Diinput oleh ${r.tutorName}` : 'Diinput oleh tutor'}>
              {r.tutorName ?? 'Tutor'}
            </span>
          ) : (
            <button
              onClick={() => onDelete(r.id)}
              className="p-0.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              title="Hapus"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function MateriBankSoalTable({ rows, allTopics, allSubjects, createResourceAction, deleteResourceAction }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Hapus ini?')) return
    startTransition(async () => { await deleteResourceAction(id) })
  }

  const groups = groupByTopic(rows)

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-700">{groups.length} topik</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Materi/Soal
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10 px-5">
          Belum ada materi/bank soal yang cocok dengan filter ini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-2.5">Mapel</th>
                <th className="text-left px-4 py-2.5">Kelas</th>
                <th className="text-left px-4 py-2.5">Semester</th>
                <th className="text-left px-4 py-2.5">Tema</th>
                <th className="text-left px-4 py-2.5">Topik</th>
                <th className="text-left px-4 py-2.5">Asal Topik</th>
                <th className="text-left px-4 py-2.5">Materi</th>
                <th className="text-left px-4 py-2.5">Bank Soal</th>
                <th className="text-left px-4 py-2.5">Asesmen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map(g => (
                <tr key={g.key} className="hover:bg-slate-50/60 transition-colors align-top">
                  <td className="px-5 py-2.5 text-gray-700 font-medium whitespace-nowrap">{g.subjectName}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                    {g.gradeLevel ? g.gradeLevel.replace('Kelas ', '') : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                    {g.semester ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{g.theme}</td>
                  <td className="px-4 py-2.5 text-gray-600">{g.topic}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {g.topicSource === 'kurikulum' ? (
                      <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Kurikulum</span>
                    ) : (
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Buatan Tutor</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <ResourceCell items={g.materi} onDelete={handleDelete} />
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <ResourceCell items={g.bankSoal} onDelete={handleDelete} />
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <ResourceCell items={g.asesmen} onDelete={handleDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Tambah Materi/Soal</DialogTitle>
          </DialogHeader>
          <AddResourceForm
            subjects={allSubjects}
            allTopics={allTopics}
            onSubmit={async (ctx, kind, title, linkUrl) => {
              const fd = new FormData()
              fd.set('title', title)
              fd.set('link_url', linkUrl)
              const result = await createResourceAction(ctx, kind, null, fd)
              if (!result) setShowAdd(false)
              return result
            }}
            onCancel={() => setShowAdd(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
