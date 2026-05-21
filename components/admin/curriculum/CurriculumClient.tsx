'use client'

import { useState, useRef, useEffect } from 'react'
import CurriculumTable from './CurriculumTable'
import CurriculumNav from './CurriculumNav'

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

interface Props {
  topics: Topic[]
  subjects: { id: string; name: string; curriculum: string[]; level: string[] }[]
  createAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  createThemesAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  createTopicsAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  createCPsAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  renameThemeAction: (ctx: { curriculum: string; subject_id: string; grade_level: string; semester: number; theme: string | null }, newName: string) => Promise<ActionState>
  deleteThemeAction: (ctx: { curriculum: string; subject_id: string; grade_level: string; semester: number; theme: string | null }) => Promise<ActionState>
  renameTopicAction: (ctx: { curriculum: string; subject_id: string; grade_level: string; semester: number; theme: string | null; topic: string }, newName: string) => Promise<ActionState>
  deleteTopicAction: (ctx: { curriculum: string; subject_id: string; grade_level: string; semester: number; theme: string | null; topic: string }) => Promise<ActionState>
  updateAction: (id: string, prevState: ActionState, formData: FormData) => Promise<ActionState>
  deleteAction: (id: string) => Promise<ActionState>
}

const GRADES = Array.from({ length: 12 }, (_, i) => `Kelas ${i + 1}`)
const SEMESTERS = [1, 2]
const CURRICULA = ['Kurikulum Merdeka', 'Kurikulum Cambridge'] as const
type Curriculum = typeof CURRICULA[number]

function gradeToLevel(grade: string): string {
  const num = parseInt(grade.replace('Kelas ', ''), 10)
  if (num <= 6) return 'SD'
  if (num <= 9) return 'SMP'
  return 'SMA'
}

export default function CurriculumClient({ topics, subjects, createAction, createThemesAction, createTopicsAction, createCPsAction, updateAction, deleteAction, renameThemeAction, deleteThemeAction, renameTopicAction, deleteTopicAction }: Props) {
  const [curriculum, setCurriculum] = useState<Curriculum>('Kurikulum Merdeka')
  const [curriculumOpen, setCurriculumOpen] = useState(false)
  const curriculumRef = useRef<HTMLDivElement>(null)
  const [grade, setGrade] = useState('Kelas 1')
  const [semester, setSemester] = useState(1)
  const [openThemeKey, setOpenThemeKey] = useState<string | null>(null)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (curriculumRef.current && !curriculumRef.current.contains(e.target as Node)) {
        setCurriculumOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleToggleTheme(key: string) {
    setOpenThemeKey(prev => prev === key ? null : key)
  }

  function handleOpenTheme(key: string) {
    setOpenThemeKey(key)
  }

  function handleNavThemeClick(subjectName: string, theme: string) {
    setOpenThemeKey(`${subjectName}__${theme}`)
  }

  const filtered = topics.filter(t =>
    t.curriculum === curriculum &&
    t.grade_level === grade &&
    t.semester === semester
  )

  const activeLevel = gradeToLevel(grade)
  const curriculumSubjects = subjects.filter(s =>
    s.curriculum.includes(curriculum) && s.level.includes(activeLevel)
  )

  const themeMap = new Map<string, Set<string>>()
  for (const t of filtered) {
    const name = t.subjects?.name ?? ''
    if (!name) continue
    if (!themeMap.has(name)) themeMap.set(name, new Set())
    if (t.theme) themeMap.get(name)!.add(t.theme)
  }
  const navSubjects = curriculumSubjects.map(s => ({
    name: s.name,
    themes: Array.from(themeMap.get(s.name) ?? []),
  }))

  return (
    <div className="space-y-0">
      {/* Sticky bar — full width covering sidebar + content */}
      <div className="sticky top-0 z-10 bg-slate-100 py-4">
        <div className="flex gap-6 items-center">
          {/* Curriculum dropdown — same width as sidebar */}
          <div ref={curriculumRef} className="relative w-44 shrink-0">
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-2 h-9 flex items-center">
              <button
                onClick={() => setCurriculumOpen(o => !o)}
                className="w-full h-full flex items-center justify-between gap-1 px-2.5 text-xs font-medium text-gray-700 rounded-md"
              >
                <span>{curriculum}</span>
                <svg className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${curriculumOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {curriculumOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg ring-1 ring-gray-900/5 py-1 z-50">
                {CURRICULA.map(c => (
                  <button
                    key={c}
                    onClick={() => { setCurriculum(c); setCurriculumOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                      curriculum === c ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grade + semester tabs */}
          <div className="flex-1 min-w-0 flex items-center gap-2 bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-2 h-9 overflow-x-auto relative">
            <div className="flex items-center gap-0.5">
              <span className="px-2 text-xs font-medium text-gray-400 shrink-0">Kelas:</span>
              {GRADES.map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    grade === g
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {g.replace('Kelas ', '')}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-0.5">
              {SEMESTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setSemester(s)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    semester === s
                      ? 'bg-gray-700 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Sem {s}
                </button>
              ))}
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {openThemeKey && (
                <button
                  onClick={() => setOpenThemeKey(null)}
                  className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Tutup Semua
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content — sidebar + table */}
      <div className="flex gap-6 items-start">
        <div className="w-44 shrink-0 sticky top-[68px] self-start">
          <CurriculumNav subjects={navSubjects} onThemeClick={handleNavThemeClick} openThemeKey={openThemeKey} />
        </div>

        <div className="flex-1 min-w-0">
          <CurriculumTable
            topics={filtered}
            subjects={subjects}
            curriculumSubjects={curriculumSubjects}
            filter={{ curriculum, grade_level: grade, semester }}
            createAction={createAction}
            createThemesAction={createThemesAction}
            createTopicsAction={createTopicsAction}
            createCPsAction={createCPsAction}
            renameThemeAction={renameThemeAction}
            deleteThemeAction={deleteThemeAction}
            renameTopicAction={renameTopicAction}
            deleteTopicAction={deleteTopicAction}
            updateAction={updateAction}
            deleteAction={deleteAction}
            openThemeKey={openThemeKey}
            onToggleTheme={handleToggleTheme}
            onOpenTheme={handleOpenTheme}
          />
        </div>
      </div>

    </div>
  )
}
