'use client'

import { useState } from 'react'
import MateriLatihanSoalTable, { type DisplayRow, type DisplayKind } from './MateriLatihanSoalTable'
import type { ResourceKind, TopicContext, ActionState } from '@/lib/actions/admin/curriculum-resources'
import { CURRICULA, SEMESTERS, gradesFor, hasSemester } from '@/lib/curriculum-config'

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
  /** Absen berarti dari tutor — lihat `TutorResourceRow` di halamannya. */
  source?: 'tutor' | 'sora'
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
  jumlahSoal?: number
  jumlahPembahasan?: number
}

interface Props {
  topics: Topic[]
  subjects: { id: string; name: string; curriculum: string[]; level: string[] }[]
  resources: Resource[]
  tutorResources: TutorResourceRow[]
  /** Satu entri per berkas sumber yang sudah disalin ke Drive TERA. */
  duplications: { driveFileId: string; copyLink: string | null }[]
  /** Alamat Sora, dipakai tabel untuk menandai tautan mana yang miliknya. */
  soraUrl: string | null
  createResourceAction: (ctx: TopicContext, kind: ResourceKind, prevState: ActionState, formData: FormData) => Promise<ActionState>
  deleteResourceAction: (id: string) => Promise<ActionState>
}


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

export default function MateriLatihanSoalClient({ topics, subjects, resources, tutorResources, duplications, soraUrl, createResourceAction, deleteResourceAction }: Props) {
  const [curriculumFilter, setCurriculumFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState<number | ''>('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [tutorFilter, setTutorFilter] = useState('')
  const [search, setSearch] = useState('')

  const subjectNameById = new Map(subjects.map(s => [s.id, s.name]))
  const topicsById = new Map(topics.map(t => [t.id, t]))
  const salinanByFileId = new Map(duplications.map(d => [d.driveFileId, d.copyLink]))

  /**
   * Tautan yang benar-benar dibuka saat barisnya diklik.
   *
   * Kalau berkasnya sudah disalin ke Drive TERA, yang dibuka salinannya —
   * bukan berkas sumber milik tutor, yang sering meminta izin akses. Baris
   * yang tercatat sudah disalin tapi belum punya tautan salinannya (peninggalan
   * sebelum migrasi 117) tetap ditandai tersalin dan tetap menuju sumbernya:
   * itu keadaan yang sebenarnya, dan menyembunyikannya tidak membuat
   * berkasnya jadi lebih bisa dibuka.
   */
  const tautanUntuk = (href: string): { href: string; isDuplicated: boolean; hrefAsli: string | null } => {
    const fileId = extractDriveFileId(href)
    if (!fileId || !salinanByFileId.has(fileId)) return { href, isDuplicated: false, hrefAsli: null }
    const salinan = salinanByFileId.get(fileId) ?? null
    return { href: salinan ?? href, isDuplicated: true, hrefAsli: salinan ? href : null }
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
      theme: r.theme, topic: r.topic, topicSource: 'kurikulum', kind: r.kind, title: r.title,
      ...tautanUntuk(r.link_url),
      source: 'admin', tutorName: null, sessionId: null,
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
        theme: t.theme, topic: t.topic, topicSource: 'kurikulum', kind: r.kind, title: r.title,
        ...tautanUntuk(r.href),
        source: r.source ?? 'tutor', tutorName: r.tutorName, sessionId: r.sessionId,
        jumlahSoal: r.jumlahSoal, jumlahPembahasan: r.jumlahPembahasan,
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
        theme: r.customTheme ?? 'Tanpa Tema', topic: r.topicText, topicSource: 'tutor', kind: r.kind, title: r.title,
        ...tautanUntuk(r.href),
        source: r.source ?? 'tutor', tutorName: r.tutorName, sessionId: r.sessionId,
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
        theme: 'Tanpa Tema', topic: 'Tanpa Topik', topicSource: 'tutor', kind: r.kind, title: r.title,
        ...tautanUntuk(r.href),
        source: r.source ?? 'tutor', tutorName: r.tutorName, sessionId: r.sessionId,
      })
    }
  }

  // Topik yang belum punya materi, soal, maupun asesmen tidak menghasilkan satu
  // baris pun di atas — dan itulah yang membuat halaman ini dulu tidak bisa
  // dipakai memeriksa kelengkapan: 427 dari 485 topik tidak kelihatan, padahal
  // justru merekalah daftar kerjanya. Kesalahan yang sama pernah ada di Bank
  // Soal Sora dan diperbaiki dengan cara yang sama — barisnya berasal dari
  // TAKSONOMI, bukan dari isinya.
  //
  // `curriculum_topics` datar: satu topik bisa punya banyak baris CP. Yang
  // dipakai di sini kunci gabungannya, sama persis dengan yang dipakai
  // `groupByTopic`, jadi topik yang sudah punya isi tidak pernah dobel.
  const kunciTerisi = new Set(
    rows.map((r) => `${r.subjectId}__${r.gradeLevel}__${r.semester}__${r.theme}__${r.topic}`),
  )
  for (const t of topics) {
    if (!t.theme || !t.topic) continue
    if (curriculumFilter && t.curriculum !== curriculumFilter) continue
    if (gradeFilter && t.grade_level !== gradeFilter) continue
    if (semesterFilter && t.semester !== semesterFilter) continue
    const kunci = `${t.subject_id}__${t.grade_level}__${t.semester}__${t.theme}__${t.topic}`
    if (kunciTerisi.has(kunci)) continue
    kunciTerisi.add(kunci)
    rows.push({
      id: `kosong__${kunci}`, subjectId: t.subject_id, subjectName: subjectNameById.get(t.subject_id) ?? '—',
      gradeLevel: t.grade_level, semester: t.semester,
      theme: t.theme, topic: t.topic, topicSource: 'kurikulum', kind: 'kosong', title: '', href: '',
      source: 'kurikulum', tutorName: null, sessionId: null, isDuplicated: false, hrefAsli: null,
    })
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
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
      {/* Filter bar */}
      <div className="border-b border-gray-100 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={curriculumFilter}
            onChange={e => {
              // A grade or semester left over from the previous curriculum can
              // be one this curriculum does not have, which would silently
              // filter everything away. Reset both on switch.
              setCurriculumFilter(e.target.value)
              setGradeFilter('')
              setSemesterFilter('')
            }}
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
            {gradesFor(curriculumFilter).map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          {hasSemester(curriculumFilter) && (
            <select
              value={semesterFilter}
              onChange={e => setSemesterFilter(e.target.value ? Number(e.target.value) : '')}
              className="h-9 border border-gray-200 rounded-lg px-2.5 text-xs font-medium text-gray-700 bg-white"
            >
              <option value="">Semua Semester</option>
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          )}

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

      <MateriLatihanSoalTable
        rows={filteredRows}
        soraUrl={soraUrl}
        allTopics={topics}
        allSubjects={allSubjectsWithTopics}
        createResourceAction={createResourceAction}
        deleteResourceAction={deleteResourceAction}
      />
    </div>
  )
}
