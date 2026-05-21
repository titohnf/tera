'use client'

import { useState, useTransition } from 'react'
import { submitAttendance } from '@/lib/actions/attendance'
import { savePerformanceNote } from '@/lib/actions/notes'
import type { AttendanceStatus } from '@/lib/types/database'

type SubmitAttendanceAction = (sessionId: string, records: unknown) => Promise<{ error?: string; success?: boolean }>
type SaveNoteAction = (sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>

interface Student {
  id: string
  full_name: string
  currentStatus: AttendanceStatus
  attendanceNotes: string
  existingNote: { body: string; template_id: string | null } | null
}

interface Template {
  id: string
  category: string
  label: string
  body: string
}

// Per student: { [category]: { templateId, body } }
type StudentNoteState = Record<string, { templateId: string; body: string } | null>

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'present',  label: 'Hadir',      color: 'bg-green-100 text-green-700 border-green-200 data-[active=true]:bg-green-600 data-[active=true]:text-white data-[active=true]:border-green-600' },
  { value: 'late',     label: 'Terlambat',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200 data-[active=true]:bg-yellow-500 data-[active=true]:text-white data-[active=true]:border-yellow-500' },
  { value: 'absent',   label: 'Absen',      color: 'bg-red-100 text-red-600 border-red-200 data-[active=true]:bg-red-500 data-[active=true]:text-white data-[active=true]:border-red-500' },
  { value: 'excused',  label: 'Izin',       color: 'bg-gray-100 text-gray-600 border-gray-200 data-[active=true]:bg-gray-500 data-[active=true]:text-white data-[active=true]:border-gray-500' },
]

function buildNoteBody(categories: Record<string, Template[]>, studentNoteState: StudentNoteState): string {
  return Object.keys(categories)
    .map(cat => studentNoteState[cat]?.body?.trim())
    .filter(Boolean)
    .join('\n\n')
}

export default function AttendanceAndNotes({
  sessionId,
  students,
  templates,
  sessionStatus,
  submitAttendanceAction = submitAttendance,
  saveNoteAction = savePerformanceNote,
}: {
  sessionId: string
  students: Student[]
  templates: Template[]
  sessionStatus: string
  submitAttendanceAction?: SubmitAttendanceAction
  saveNoteAction?: SaveNoteAction
}) {
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; notes: string }>>(
    Object.fromEntries(students.map(s => [s.id, { status: s.currentStatus, notes: s.attendanceNotes }]))
  )

  // noteData: per student → per category → { templateId, body }
  const [noteData, setNoteData] = useState<Record<string, StudentNoteState>>(
    Object.fromEntries(students.map(s => [s.id, {}]))
  )

  const [savedNotes, setSavedNotes] = useState<Set<string>>(
    new Set(students.filter(s => s.existingNote).map(s => s.id))
  )
  const [expandedNote, setExpandedNote] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isDisabled = sessionStatus === 'cancelled'

  const templatesByCategory: Record<string, Template[]> = {}
  for (const t of templates) {
    if (!templatesByCategory[t.category]) templatesByCategory[t.category] = []
    templatesByCategory[t.category].push(t)
  }
  const categories = Object.keys(templatesByCategory)

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRecords(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }))
    if ((status === 'present' || status === 'late') && !savedNotes.has(studentId)) {
      setExpandedNote(studentId)
    } else if (status === 'absent' || status === 'excused') {
      setExpandedNote(prev => prev === studentId ? null : prev)
    }
  }

  function toggleTemplate(studentId: string, category: string, template: Template) {
    setNoteData(prev => {
      const studentState = { ...prev[studentId] }
      const current = studentState[category]
      if (current?.templateId === template.id) {
        studentState[category] = null
      } else {
        const body = template.body.replace(/\{\{student_name\}\}/g, students.find(s => s.id === studentId)?.full_name ?? '')
        studentState[category] = { templateId: template.id, body }
      }
      return { ...prev, [studentId]: studentState }
    })
  }

  function updateCategoryBody(studentId: string, category: string, body: string) {
    setNoteData(prev => {
      const studentState = { ...prev[studentId] }
      if (studentState[category]) {
        studentState[category] = { ...studentState[category]!, body }
      }
      return { ...prev, [studentId]: studentState }
    })
  }

  function handleSave() {
    startTransition(async () => {
      // Save attendance
      const rows = Object.entries(records).map(([student_id, r]) => ({
        student_id,
        status: r.status,
        notes: r.notes,
      }))
      const attendanceResult = await submitAttendanceAction(sessionId, rows)
      if (attendanceResult.error) {
        setSaveMessage({ type: 'error', text: attendanceResult.error })
        return
      }

      // Save notes for present/late students who have note content
      const noteStudents = students.filter(s => {
        const status = records[s.id]?.status
        return status === 'present' || status === 'late'
      })

      const noteResults = await Promise.all(
        noteStudents.map(async s => {
          const studentState = noteData[s.id]
          const body = categories.length > 0
            ? buildNoteBody(templatesByCategory, studentState)
            : Object.values(studentState).find(v => v)?.body ?? ''
          if (!body.trim()) return null
          const firstTemplateId = Object.values(studentState).find(v => v?.templateId)?.templateId ?? null
          return saveNoteAction(sessionId, { student_id: s.id, body, template_id: firstTemplateId })
        })
      )

      const noteError = noteResults.find(r => r?.error)
      if (noteError?.error) {
        setSaveMessage({ type: 'error', text: noteError.error })
        return
      }

      // Mark saved notes
      const newSaved = new Set(savedNotes)
      noteStudents.forEach((s, i) => {
        if (noteResults[i] !== null) newSaved.add(s.id)
      })
      setSavedNotes(newSaved)
      setSaveMessage({ type: 'success', text: 'Presensi dan catatan berhasil disimpan!' })
    })
  }

  const presentCount = Object.values(records).filter(r => r.status === 'present' || r.status === 'late').length

  return (
    <div>
      {isDisabled && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          Sesi dibatalkan — presensi tidak dapat diubah.
        </div>
      )}

      <div className="flex items-center justify-end mb-4">
        <span className="text-sm text-gray-500">
          <strong className="text-gray-900">{presentCount}</strong> / {students.length} hadir
        </span>
      </div>

      {/* Student cards */}
      <div className="space-y-2 mb-5">
        {students.map((student, idx) => {
          const rec = records[student.id]
          const studentState = noteData[student.id]
          const isExpanded = expandedNote === student.id
          const hasSavedNote = savedNotes.has(student.id)
          const noteBody = buildNoteBody(templatesByCategory, studentState)
          const selectedCount = Object.values(studentState).filter(v => v !== null).length

          return (
            <div key={student.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
              {/* Attendance row */}
              <div className="px-4 py-3 flex items-center gap-3">
                <span className="text-xs text-gray-400 w-6 text-center shrink-0">{idx + 1}</span>
                <p className="text-sm font-medium text-gray-900 flex-1">{student.full_name}</p>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      data-active={rec?.status === opt.value}
                      onClick={() => setStatus(student.id, opt.value)}
                      disabled={isDisabled}
                      className={`text-xs px-2.5 py-1.5 border rounded-lg font-medium transition-colors disabled:opacity-40 ${opt.color}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Toggle catatan */}
                <button
                  onClick={() => setExpandedNote(isExpanded ? null : student.id)}
                  className={`ml-2 shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                    isExpanded
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : hasSavedNote
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {hasSavedNote && !isExpanded && (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {selectedCount > 0 && !hasSavedNote && !isExpanded
                    ? `Catatan (${selectedCount})`
                    : 'Catatan'
                  }
                  <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Notes section */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 space-y-4">
                  {categories.length > 0 ? (
                    categories.map(category => {
                      const tmplList = templatesByCategory[category]
                      const selected = studentState[category]
                      return (
                        <div key={category}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{category}</p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {tmplList.map(t => (
                              <button
                                key={t.id}
                                onClick={() => toggleTemplate(student.id, category, t)}
                                className={`text-xs px-2.5 py-1 border rounded-lg transition-colors font-medium ${
                                  selected?.templateId === t.id
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-slate-300 hover:bg-blue-50/50'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                          {selected && (
                            <textarea
                              rows={3}
                              value={selected.body}
                              onChange={e => updateCategoryBody(student.id, category, e.target.value)}
                              placeholder={`Deskripsi ${category.toLowerCase()}...`}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            />
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <textarea
                      rows={3}
                      value={Object.values(studentState).find(v => v)?.body ?? ''}
                      onChange={e => setNoteData(prev => ({
                        ...prev,
                        [student.id]: { '_': { templateId: '', body: e.target.value } },
                      }))}
                      placeholder="Tulis catatan performa siswa..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  )}
                  <p className="text-xs text-gray-400 text-right">{noteBody.length} / 2000 karakter</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {saveMessage && (
        <div className={`text-sm px-4 py-3 rounded-lg mb-4 ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {saveMessage.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isPending || isDisabled}
        className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Menyimpan...' : 'Simpan Presensi dan Catatan'}
      </button>
    </div>
  )
}
