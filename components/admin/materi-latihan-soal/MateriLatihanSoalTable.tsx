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
// materi/latihan soal via this page, but assessments are always authored by a
// tutor from the session's own "Asesmen & Latihan Soal" tab.
//
// `bank_soal` juga hanya tampilan, dan asalnya bahkan bukan tabel di database
// ini melainkan cerminan isi Bank Soal Sora per topik. Ia tidak pernah bisa
// ditambah atau dihapus dari halaman ini — `ResourceKind` tetap dua nilai.
export type DisplayKind = ResourceKind | 'asesmen' | 'bank_soal'

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
  // `sora` = cerminan isi aplikasi sebelah: dilabeli Admin seperti baris
  // kurasi admin, tapi tidak punya tombol hapus karena tidak ada baris yang
  // bisa dihapus.
  source: 'admin' | 'tutor' | 'sora'
  tutorName: string | null
  // Session this item came from, so admins can open the session's own
  // journal-completeness checklist and reject it if the tema/topik was
  // never filled in properly. Admin-added curriculum_resources have none.
  sessionId: string | null
  // Whether this link's underlying Google Drive file has already been
  // copied into the shared "Materi dan Latihan Soal" Drive folder.
  isDuplicated: boolean
}

interface Props {
  rows: DisplayRow[]
  allTopics: Topic[]
  allSubjects: { id: string; name: string }[]
  createResourceAction: (ctx: TopicContext, kind: ResourceKind, prevState: ActionState, formData: FormData) => Promise<ActionState>
  deleteResourceAction: (id: string) => Promise<ActionState>
}

const RESOURCE_LABEL: Record<DisplayKind, string> = { materi: 'Materi', latihan_soal: 'Latihan Soal', asesmen: 'Asesmen', bank_soal: 'Bank Soal' }

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
          {(['materi', 'latihan_soal'] as const).map(k => (
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
  topicKey: string
  subjectName: string
  gradeLevel: string | null
  semester: number | null
  theme: string
  topic: string
  topicSource: 'kurikulum' | 'tutor'
  tutorLabel: string
  materi: DisplayRow[]
  latihanSoal: DisplayRow[]
  asesmen: DisplayRow[]
  bankSoal: DisplayRow[]
}

// One row per (topic, contributor) pair — a topic can be touched by several
// tutors (and/or admin) with different materi/latihan soal/asesmen each, so
// splitting rows this way keeps the "Tutor" column unambiguous instead of
// having to merge unrelated contributors' items into one cell.
function groupByTopic(rows: DisplayRow[]): TopicGroup[] {
  const groups = new Map<string, TopicGroup>()
  for (const r of rows) {
    const topicKey = `${r.subjectId}__${r.gradeLevel}__${r.semester}__${r.theme}__${r.topic}`
    // Bank Soal Sora dikurasi admin, jadi ia berdiri di baris Admin yang sama
    // dengan materi kurasi — bukan di baris tutor mana pun.
    const tutorLabel = r.source === 'tutor' ? (r.tutorName ?? 'Tutor') : 'Admin'
    const key = `${topicKey}__${tutorLabel}`
    if (!groups.has(key)) {
      groups.set(key, {
        key, topicKey, subjectName: r.subjectName, gradeLevel: r.gradeLevel, semester: r.semester,
        theme: r.theme, topic: r.topic, topicSource: r.topicSource, tutorLabel, materi: [], latihanSoal: [], asesmen: [], bankSoal: [],
      })
    }
    const g = groups.get(key)!
    if (r.kind === 'materi') g.materi.push(r)
    else if (r.kind === 'latihan_soal') g.latihanSoal.push(r)
    else if (r.kind === 'bank_soal') g.bankSoal.push(r)
    else g.asesmen.push(r)
  }
  return Array.from(groups.values()).sort((a, b) =>
    a.subjectName.localeCompare(b.subjectName) || a.theme.localeCompare(b.theme) || a.topic.localeCompare(b.topic) ||
    (a.tutorLabel === 'Admin' ? -1 : b.tutorLabel === 'Admin' ? 1 : a.tutorLabel.localeCompare(b.tutorLabel))
  )
}

type SortKey = 'subjectName' | 'gradeSemester' | 'theme' | 'topic' | 'topicSource' | 'tutorLabel' | 'materi' | 'asesmen' | 'latihanSoal' | 'bankSoal'
type SortDir = 'asc' | 'desc'

// "Kelas 10" should sort after "Kelas 2" — compare the numeric grade, not
// the raw string (which would put "10" before "2").
function gradeLevelValue(g: string | null): number {
  if (!g) return -1
  const n = parseInt(g.replace('Kelas ', ''), 10)
  return Number.isNaN(n) ? -1 : n
}

function compareGroups(a: TopicGroup, b: TopicGroup, key: SortKey): number {
  switch (key) {
    case 'subjectName': return a.subjectName.localeCompare(b.subjectName)
    case 'gradeSemester': return gradeLevelValue(a.gradeLevel) - gradeLevelValue(b.gradeLevel) || (a.semester ?? -1) - (b.semester ?? -1)
    case 'theme': return a.theme.localeCompare(b.theme)
    case 'topic': return a.topic.localeCompare(b.topic)
    case 'topicSource': return a.topicSource.localeCompare(b.topicSource)
    case 'tutorLabel': return a.tutorLabel.localeCompare(b.tutorLabel)
    case 'materi': return a.materi.length - b.materi.length
    case 'asesmen': return a.asesmen.length - b.asesmen.length
    case 'latihanSoal': return a.latihanSoal.length - b.latihanSoal.length
    case 'bankSoal': return a.bankSoal.length - b.bankSoal.length
  }
}

// Default (subject/tema/topik/tutor) order kept as tie-breaker so sorting by
// a column with lots of repeated values (e.g. SM) doesn't scramble the rest.
function sortGroups(groups: TopicGroup[], key: SortKey, dir: SortDir): TopicGroup[] {
  return [...groups].sort((a, b) => {
    const primary = compareGroups(a, b, key)
    const result = primary !== 0
      ? primary
      : a.subjectName.localeCompare(b.subjectName) || a.theme.localeCompare(b.theme) || a.topic.localeCompare(b.topic) ||
        (a.tutorLabel === 'Admin' ? -1 : b.tutorLabel === 'Admin' ? 1 : a.tutorLabel.localeCompare(b.tutorLabel))
    return dir === 'asc' ? result : -result
  })
}

function SortableHeader({ label, sortKey, activeKey, dir, onSort, first }: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  first?: boolean
}) {
  const isActive = sortKey === activeKey
  return (
    <th className={`text-left py-2.5 ${first ? 'px-5' : 'px-4'}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 hover:text-gray-700 transition-colors ${isActive ? 'text-gray-700' : ''}`}
      >
        {label}
        <svg
          className={`w-3 h-3 shrink-0 transition-transform ${isActive ? 'opacity-100' : 'opacity-30'} ${isActive && dir === 'desc' ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </th>
  )
}

function ResourceCell({ items, onDelete }: { items: DisplayRow[]; onDelete: (id: string) => void }) {
  if (items.length === 0) return <span className="text-gray-300">—</span>
  return (
    <ul className="space-y-1">
      {items.map((r, i) => {
        // Masked label instead of the (often long) real title — "Materi"
        // when it's the only one for this topic/tutor, "Materi 1"/"Materi 2"
        // when there are several. Full title still available on hover.
        const label = items.length > 1 ? `${RESOURCE_LABEL[r.kind]} ${i + 1}` : RESOURCE_LABEL[r.kind]
        return (
        <li key={r.id} className="group flex items-center gap-1.5">
          <a
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            title={r.title}
            className="flex items-center gap-1.5 text-blue-700 hover:underline truncate min-w-0"
          >
            {r.isDuplicated ? (
              <svg className="w-3.5 h-3.5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <title>Sudah di-duplicate ke Drive</title>
                <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.5 12.5l2.5 2.5 4.5-5" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m5.656-5.656l1.5-1.5a4 4 0 015.656 5.656l-3 3a4 4 0 01-5.656 0" />
              </svg>
            )}
            <span className="truncate">{label}</span>
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
          {r.source === 'admin' && (
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
        )
      })}
    </ul>
  )
}

const PAGE_SIZE = 10

export default function MateriLatihanSoalTable({ rows, allTopics, allSubjects, createResourceAction, deleteResourceAction }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('subjectName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [prevRows, setPrevRows] = useState(rows)
  const [, startTransition] = useTransition()

  // Reset to page 1 whenever the filtered row set changes (filters/search
  // in the parent only re-render this component with a new `rows` array
  // when something actually changed) — adjusted during render per React's
  // guidance instead of in a useEffect, to avoid an extra render pass.
  if (rows !== prevRows) {
    setPrevRows(rows)
    setPage(1)
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus ini?')) return
    startTransition(async () => { await deleteResourceAction(id) })
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const groups = sortGroups(groupByTopic(rows), sortKey, sortDir)
  const topicCount = new Set(groups.map(g => g.topicKey)).size
  const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedGroups = groups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-700">{topicCount} topik</p>
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
          Belum ada materi/latihan soal yang cocok dengan filter ini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <SortableHeader label="Mapel" sortKey="subjectName" activeKey={sortKey} dir={sortDir} onSort={handleSort} first />
                <SortableHeader label="Kelas.SM" sortKey="gradeSemester" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Tema" sortKey="theme" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Topik" sortKey="topic" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Tutor" sortKey="tutorLabel" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Materi" sortKey="materi" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Asesmen" sortKey="asesmen" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Latihan Soal" sortKey="latihanSoal" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortableHeader label="Bank Soal" sortKey="bankSoal" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedGroups.map(g => (
                <tr key={g.key} className="hover:bg-slate-50/60 transition-colors align-top">
                  <td className="px-5 py-2.5 text-gray-700 font-medium whitespace-nowrap">{g.subjectName}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                    {g.gradeLevel || g.semester
                      ? `${g.gradeLevel ? g.gradeLevel.replace('Kelas ', '') : '—'}.${g.semester ?? '—'}`
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[12rem]">
                    <span className="line-clamp-2" title={g.theme}>{g.theme}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[12rem]">
                    <span className="flex items-start gap-1.5" title={g.topicSource === 'kurikulum' ? `${g.topic} (dari Kurikulum)` : `${g.topic} (Buatan Tutor)`}>
                      <span
                        className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${g.topicSource === 'kurikulum' ? 'bg-blue-500' : 'bg-amber-400'}`}
                      />
                      <span className="line-clamp-2">{g.topic}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{g.tutorLabel}</td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <ResourceCell items={g.materi} onDelete={handleDelete} />
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <ResourceCell items={g.asesmen} onDelete={handleDelete} />
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <ResourceCell items={g.latihanSoal} onDelete={handleDelete} />
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <ResourceCell items={g.bankSoal} onDelete={handleDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">Halaman {currentPage} dari {totalPages}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors border-gray-200 text-gray-700 hover:bg-gray-50 disabled:border-gray-100 disabled:text-gray-300 disabled:pointer-events-none"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors border-gray-200 text-gray-700 hover:bg-gray-50 disabled:border-gray-100 disabled:text-gray-300 disabled:pointer-events-none"
            >
              Berikutnya
            </button>
          </div>
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
    </>
  )
}
