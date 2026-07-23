'use client'

import { useState, useTransition } from 'react'
import { savePerformanceNote } from '@/lib/actions/notes'

interface Student {
  id: string
  full_name: string
  existingNote: { body: string; template_id: string | null } | null
}

interface Template {
  id: string
  category: string
  label: string
  body: string
}

export default function NoteEditor({
  sessionId,
  students,
  templates,
}: {
  sessionId: string
  students: Student[]
  templates: Template[]
}) {
  const [activeStudentId, setActiveStudentId] = useState<string>(students[0]?.id ?? '')
  const [notes, setNotes] = useState<Record<string, { body: string; template_id: string | null }>>(
    Object.fromEntries(students.map(s => [
      s.id,
      { body: s.existingNote?.body ?? '', template_id: s.existingNote?.template_id ?? null }
    ]))
  )
  const [isPending, startTransition] = useTransition()
  const [savedStudents, setSavedStudents] = useState<Set<string>>(
    new Set(students.filter(s => s.existingNote).map(s => s.id))
  )
  const [error, setError] = useState('')

  const activeStudent = students.find(s => s.id === activeStudentId)
  const activeNote = notes[activeStudentId] ?? { body: '', template_id: null }

  // Group templates by category
  const templatesByCategory: Record<string, Template[]> = {}
  for (const t of templates) {
    if (!templatesByCategory[t.category]) templatesByCategory[t.category] = []
    templatesByCategory[t.category].push(t)
  }

  function applyTemplate(template: Template) {
    const body = template.body.replace(/\{\{student_name\}\}/g, activeStudent?.full_name ?? 'Siswa')
    setNotes(prev => ({
      ...prev,
      [activeStudentId]: { body, template_id: template.id },
    }))
  }

  function handleSave() {
    startTransition(async () => {
      const category = templates.find(t => t.id === activeNote.template_id)?.category ?? '_'
      const result = await savePerformanceNote(sessionId, {
        student_id: activeStudentId,
        category,
        body: activeNote.body,
        template_id: activeNote.template_id,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setError('')
        setSavedStudents(prev => new Set(prev).add(activeStudentId))
        // Move to next unsaved student
        const unsaved = students.filter(s => !savedStudents.has(s.id) && s.id !== activeStudentId)
        if (unsaved.length > 0) setActiveStudentId(unsaved[0].id)
      }
    })
  }

  return (
    <div className="flex gap-4">
      {/* Student list sidebar */}
      <div className="w-48 shrink-0">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Siswa</p>
        <div className="space-y-1">
          {students.map(student => (
            <button
              key={student.id}
              onClick={() => setActiveStudentId(student.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                activeStudentId === student.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="truncate">{student.full_name}</span>
              {savedStudents.has(student.id) && (
                <svg className="w-3.5 h-3.5 text-green-500 shrink-0 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
        {activeStudent ? (
          <>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              {activeStudent.full_name}
            </h3>

            {/* Template selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Pilih Template</label>
              <div className="space-y-2">
                {Object.entries(templatesByCategory).map(([category, tmplList]) => (
                  <div key={category}>
                    <p className="text-xs text-gray-400 mb-1">{category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tmplList.map(t => (
                        <button
                          key={t.id}
                          onClick={() => applyTemplate(t)}
                          className={`text-xs px-2.5 py-1 border rounded-lg transition-colors ${
                            activeNote.template_id === t.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Text area */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Catatan</label>
              <textarea
                rows={5}
                value={activeNote.body}
                onChange={e => setNotes(prev => ({
                  ...prev,
                  [activeStudentId]: { ...prev[activeStudentId], body: e.target.value, template_id: null },
                }))}
                placeholder="Tulis catatan performa siswa..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {activeNote.body.length} / 2000 karakter
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isPending || !activeNote.body.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:cursor-not-allowed transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
              >
                {isPending ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
              {savedStudents.has(activeStudentId) && (
                <span className="flex items-center gap-1 text-xs text-green-600 px-3">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Tersimpan
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">Pilih siswa untuk mulai menulis catatan.</p>
        )}
      </div>
    </div>
  )
}
