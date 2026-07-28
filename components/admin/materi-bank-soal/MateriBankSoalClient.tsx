'use client'

import { useState } from 'react'
import MateriBankSoalTable, { type DisplayRow, type DisplayKind } from './MateriBankSoalTable'
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

type Resource = {
  id: string
  subject_id: string
  curriculum: string
  grade_level: string
  semester: number
  theme: string
  topic: string
  kind: ResourceKind
  title: string
  link_url: string
  created_at: string
}

type TutorResourceRow = {
  id: string
  kind: DisplayKind
  title: string
  href: string
  sessionId: string
  subjectId: string
  curriculumTopicId: string | null
  customTheme: string | null
  topicText: string | null
  tutorName: string | null
  classGradeLevel: string | null
  classSemester: number | null
}

interface Props {
  topics: Topic[]
  subjects: { id: string; name: string; curriculum: string[]; level: string[] }[]
  resources: Resource[]
  tutorResources: TutorResourceRow[]
  duplicatedFileIds: string[]
  createResourceAction: (ctx: TopicContext, kind: ResourceKind, prevState: ActionState, formData: FormData) => Promise<ActionState>
  deleteResourceAction: (id: string) => Promise<ActionState>
}

const GRADES = Array.from({ length: 12 }, (_, i) => `Kelas ${i + 1}`)
const SEMESTERS = [1, 2]
const CURRICULA = ['Kurikulum Merdeka', 'Kurikulum Cambridge']

// Extracts a Google Drive file id from a docs.google.com/drive.google.com
// link (e.g. .../document/d/FILE_ID/edit, .../file/d/FILE_ID/view). Used to
// check a link against curriculum_resource_duplications regardless of which
// query params/URL shape a particular row happens to use.
function extractDriveFileId(url: string): string | null {
  try {
    const u = new URL(url)
    if (!['docs.google.com', 'drive.google.com'].includes(u.hostname)) return null
    if (u.pathname.includes('/forms/d/e/')) return null
    const m = u.pathname.match(/\/d\/([a-zA-Z0-9_-]{15,})/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

export default function MateriBankSoalClient({ topics, subjects, resources, tutorResources, duplicatedFileIds, createResourceAction, deleteResourceAction }: Props) {
  const [curriculumFilter, setCurriculumFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState<number | ''>('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [tutorFilter, setTutorFilter] = useState('')
  const [search, setSearch] = useState('')

  const subjectNameById = new Map(subjects.map(s => [s.id, s.name]))
  const topicsById = new Map(topics.map(t => [t.id, t]))
  const duplicatedFileIdSet = new Set(duplicatedFileIds)
  const isHrefDuplicated = (href: string) => {
    const fileId = extractDriveFileId(href)
    return fileId ? duplicatedFileIdSet.has(fileId) : false
  }

  // Mapel dropdown offers every subject that has at least one curriculum
  // topic — Kelas/Semester/Kurikulum are optional filters now (not a forced
  // single tab), so there's no single "level" to gate this list by.
  const allSubjectsWithTopics = subjects.filter(s => topics.some(t => t.subject_id === s.id))

  const rows: DisplayRow[] = []

  for (const r of resources) {
    if (curriculumFilter && r.curriculum !== curriculumFilter) continue
    if (gradeFilter && r.grade_level !== gradeFilter) continue
    if (semesterFilter && r.semester !== semesterFilter) continue
    rows.push({
      id: r.id, subjectId: r.subject_id, subjectName: subjectNameById.get(r.subject_id) ?? '—',
      gradeLevel: r.grade_level, semester: r.semester,
      theme: r.theme, topic: r.topic, topicSource: 'kurikulum', kind: r.kind, title: r.title, href: r.link_url,
      source: 'admin', tutorName: null, sessionId: null, isDuplicated: isHrefDuplicated(r.link_url),
    })
  }

  for (const r of tutorResources) {
    if (r.curriculumTopicId) {
      const t = topicsById.get(r.curriculumTopicId)
      if (!t || !t.theme || !t.topic) continue
      if (curriculumFilter && t.curriculum !== curriculumFilter) continue
      if (gradeFilter && t.grade_level !== gradeFilter) continue
      if (semesterFilter && t.semester !== semesterFilter) continue
      rows.push({
        id: r.id, subjectId: t.subject_id, subjectName: subjectNameById.get(t.subject_id) ?? '—',
        gradeLevel: t.grade_level, semester: t.semester,
        theme: t.theme, topic: t.topic, topicSource: 'kurikulum', kind: r.kind, title: r.title, href: r.href,
        source: 'tutor', tutorName: r.tutorName, sessionId: r.sessionId, isDuplicated: isHrefDuplicated(r.href),
      })
    } else if (r.topicText) {
      // Free-typed topic with no formal curriculum link — either a
      // private/yayasan session with its own custom_theme, or a group-class
      // session where the tutor typed a topic without picking a curriculum
      // theme at all (custom_theme stays null there too). There's no
      // Kurikulum tag for these, but Kelas/Semester are still known — they're
      // derived server-side from the session's class (its own `semester`
      // column and the mode grade of its enrolled students).
      if (curriculumFilter) continue
      if (gradeFilter && r.classGradeLevel !== gradeFilter) continue
      if (semesterFilter && r.classSemester !== semesterFilter) continue
      rows.push({
        id: r.id, subjectId: r.subjectId, subjectName: subjectNameById.get(r.subjectId) ?? '—',
        gradeLevel: r.classGradeLevel, semester: r.classSemester,
        theme: r.customTheme ?? 'Tanpa Tema', topic: r.topicText, topicSource: 'tutor', kind: r.kind, title: r.title, href: r.href,
        source: 'tutor', tutorName: r.tutorName, sessionId: r.sessionId, isDuplicated: isHrefDuplicated(r.href),
      })
    } else {
      // Session never had a topic set at all — still surface the entry
      // (grouped together) instead of silently dropping it, since it's
      // real tutor-submitted content with nowhere else to attach to.
      if (curriculumFilter) continue
      if (gradeFilter && r.classGradeLevel !== gradeFilter) continue
      if (semesterFilter && r.classSemester !== semesterFilter) continue
      rows.push({
        id: r.id, subjectId: r.subjectId, subjectName: subjectNameById.get(r.subjectId) ?? '—',
        gradeLevel: r.classGradeLevel, semester: r.classSemester,
        theme: 'Tanpa Tema', topic: 'Tanpa Topik', topicSource: 'tutor', kind: r.kind, title: r.title, href: r.href,
        source: 'tutor', tutorName: r.tutorName, sessionId: r.sessionId, isDuplicated: isHrefDuplicated(r.href),
      })
    }
  }

  const ADMIN_TUTOR_KEY = '__admin__'
  const distinctTutorNames = [...new Set(tutorResources.map(r => r.tutorName).filter((v): v is string => !!v))].sort()

  const lq = search.trim().toLowerCase()
  const filteredRows = rows
    .filter(r => !subjectFilter || r.subjectId === subjectFilter)
    .filter(r => {
      if (!tutorFilter) return true
      if (tutorFilter === ADMIN_TUTOR_KEY) return r.source === 'admin'
      return r.tutorName === tutorFilter
    })
    .filter(r => !lq || r.title.toLowerCase().includes(lq) || r.topic.toLowerCase().includes(lq) || r.theme.toLowerCase().includes(lq))
    .sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName) ||
      (a.gradeLevel ?? '').localeCompare(b.gradeLevel ?? '') ||
      (a.semester ?? 0) - (b.semester ?? 0) ||
      a.theme.localeCompare(b.theme) ||
      a.topic.localeCompare(b.topic) ||
      a.kind.localeCompare(b.kind) ||
      a.title.localeCompare(b.title)
    )

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={curriculumFilter}
            onChange={e => setCurriculumFilter(e.target.value)}
            className="h-9 border border-gray-200 rounded-lg px-2.5 text-xs font-medium text-gray-700 bg-white"
          >
            <option value="">Semua Kurikulum</option>
            {CURRICULA.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="h-9 border border-gray-200 rounded-lg px-2.5 text-xs font-medium text-gray-700 bg-white"
          >
            <option value="">Semua Kelas</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select
            value={semesterFilter}
            onChange={e => setSemesterFilter(e.target.value ? Number(e.target.value) : '')}
            className="h-9 border border-gray-200 rounded-lg px-2.5 text-xs font-medium text-gray-700 bg-white"
          >
            <option value="">Semua Semester</option>
            {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>

          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="h-9 border border-gray-200 rounded-lg px-2.5 text-xs font-medium text-gray-700 bg-white"
          >
            <option value="">Semua Mapel</option>
            {allSubjectsWithTopics.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Tutor filter */}
          <select
            value={tutorFilter}
            onChange={e => setTutorFilter(e.target.value)}
            className="h-9 border border-gray-200 rounded-lg px-2.5 text-xs font-medium text-gray-700 bg-white"
          >
            <option value="">Semua Tutor</option>
            <option value={ADMIN_TUTOR_KEY}>Admin</option>
            {distinctTutorNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul, topik, atau tema..."
              className="w-full h-9 pl-8 pr-3 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <MateriBankSoalTable
        rows={filteredRows}
        allTopics={topics}
        allSubjects={allSubjectsWithTopics}
        createResourceAction={createResourceAction}
        deleteResourceAction={deleteResourceAction}
      />
    </div>
  )
}
