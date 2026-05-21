'use client'

import { useState, useEffect } from 'react'

interface NavSubject {
  name: string
  themes: string[]
}

interface Props {
  subjects: NavSubject[]
  openThemeKey: string | null
  onThemeClick: (subjectName: string, theme: string) => void
}

function toSubjectAnchorId(name: string) {
  return `subject-${name}`.toLowerCase().replace(/\s+/g, '-')
}

function toThemeAnchorId(theme: string) {
  return `theme-${theme}`.toLowerCase().replace(/\s+/g, '-')
}

export default function CurriculumNav({ subjects, openThemeKey, onThemeClick }: Props) {
  const [expanded, setExpanded] = useState<string | null>(subjects[0]?.name ?? null)

  const subjectKey = subjects.map(s => s.name).join('|')
  useEffect(() => {
    setExpanded(prev => subjects.find(s => s.name === prev) ? prev : (subjects[0]?.name ?? null))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectKey])

  const activeSubject = openThemeKey ? openThemeKey.split('__')[0] : null
  const activeTheme = openThemeKey ? openThemeKey.split('__')[1] : null

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }


  if (subjects.length === 0) return null

  return (
    <nav>
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Mata Pelajaran</p>
        <ul className="space-y-0.5">
          {subjects.map(({ name, themes }) => {
            const subjectId = toSubjectAnchorId(name)
            const isSubjectActive = activeSubject === name
            const isOpen = expanded === name
            return (
              <li key={name}>
                <button
                  onClick={() => {
                    scrollTo(subjectId)
                    setExpanded(name)
                  }}
                  className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors leading-snug flex items-center justify-between gap-1 ${
                    isSubjectActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>{name}</span>
                  <svg
                    className={`w-3 h-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && themes.length > 0 && (
                  <ul className="mt-0.5 ml-2 space-y-0.5 border-l border-gray-100 pl-2">
                    {themes.map(theme => {
                      const isThemeActive = isSubjectActive && activeTheme === theme
                      return (
                        <li key={theme}>
                          <button
                            onClick={() => {
                              onThemeClick(name, theme)
                              scrollTo(toThemeAnchorId(theme))
                            }}
                            className={`w-full text-left px-2 py-1 text-[11px] rounded-md transition-colors leading-snug ${
                              isThemeActive
                                ? 'text-blue-600 font-medium bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {theme}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
