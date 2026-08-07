'use client'

import { useState, useTransition, useRef, useEffect, useMemo } from 'react'
import { createAssessment, submitGrades } from '@/lib/actions/assessments'

type CreateAction = (sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type SubmitGradesAction = (assessmentId: string, sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type DeleteAction = (assessmentId: string, sessionId: string) => Promise<{ error?: string; success?: boolean }>
type UpdateAction = (assessmentId: string, sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>

interface AssessmentItem {
  id: string
  title: string
  description: string | null
  max_score: number
  due_at: string | null
  link_url: string | null
  created_at: string
}

interface Student {
  id: string
  full_name: string
}

interface GradeResult {
  assessment_id: string
  student_id: string
  score: number | null
  feedback: string | null
}

const COMPREHENSION_LEVELS = [
  { value: '',   label: '— Pilih level —',                 bg: 'bg-white',      text: 'text-gray-400' },
  { value: 'L0', label: 'L0: Tidak Paham Sama Sekali',     bg: 'bg-red-200',    text: 'text-red-900' },
  { value: 'L1', label: 'L1: Paham Permukaan/Hafalan',     bg: 'bg-orange-200', text: 'text-orange-900' },
  { value: 'L2', label: 'L2: Paham Konsep Dasar',          bg: 'bg-yellow-200', text: 'text-yellow-900' },
  { value: 'L3', label: 'L3: Paham Pengaplikasian Konsep', bg: 'bg-green-200',  text: 'text-green-900' },
  { value: 'L4', label: 'L4: Sangat Paham',                bg: 'bg-blue-200',   text: 'text-blue-900' },
  { value: 'L5', label: 'L5: Mahir',                       bg: 'bg-purple-200', text: 'text-purple-900' },
]

function buildAutoTitle(
  subjectName: string | null | undefined,
  grade: number | null | undefined,
  topic: string | null | undefined,
  sequence: number,
): string {
  const parts = [
    subjectName,
    grade != null ? `Kelas ${grade}` : null,
    topic,
  ].filter(Boolean)
  return `Asesmen ${sequence}${parts.length > 0 ? ' ' + parts.join(' ') : ''}`
}

export default function AssessmentList({
  sessionId,
  assessments: initialAssessments,
  students,
  results,
  absentStudentIds,
  readOnly = false,
  createAction = createAssessment,
  submitGradesAction = submitGrades,
  deleteAction,
  updateAction,
  subjectName,
  grade,
  topic,
}: {
  sessionId: string
  assessments: AssessmentItem[]
  students: Student[]
  results: GradeResult[]
  /** Siswa yang presensinya bukan hadir/telat — tidak perlu dinilai. */
  absentStudentIds?: string[]
  readOnly?: boolean
  createAction?: CreateAction
  submitGradesAction?: SubmitGradesAction
  deleteAction?: DeleteAction
  updateAction?: UpdateAction
  subjectName?: string | null
  grade?: number | null
  topic?: string | null
}) {
  const [showCreate, setShowCreate] = useState(() => !readOnly && initialAssessments.length === 0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(initialAssessments.map(a => a.id)))
  const [newTitle, setNewTitle] = useState(() => buildAutoTitle(subjectName, grade, topic, initialAssessments.length + 1))
  const [newDescription, setNewDescription] = useState('')
  const [newMaxScore, setNewMaxScore] = useState(100)
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [grades, setGrades] = useState<Record<string, Record<string, { score: string; feedback: string }>>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editLinkUrl, setEditLinkUrl] = useState('')
  const [editMaxScore, setEditMaxScore] = useState(100)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const knownIdsRef = useRef<Set<string>>(new Set(initialAssessments.map(a => a.id)))

  useEffect(() => {
    const newIds = initialAssessments.map(a => a.id).filter(id => !knownIdsRef.current.has(id))
    if (newIds.length > 0) {
      setExpandedIds(prev => new Set([...prev, ...newIds]))
    }
    knownIdsRef.current = new Set(initialAssessments.map(a => a.id))
  }, [initialAssessments])
  const menuRef = useRef<HTMLDivElement>(null)

  const absentIds = useMemo(() => new Set(absentStudentIds ?? []), [absentStudentIds])
  // Hanya siswa yang hadir/telat yang perlu dinilai — sisanya tetap ditampilkan
  // agar tutor tahu kenapa barisnya dilewati.
  const gradableStudents = students.filter(s => !absentIds.has(s.id))

  useEffect(() => {
    if (!menuOpenId) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  function getGrade(assessmentId: string, studentId: string) {
    return grades[assessmentId]?.[studentId] ?? {
      score: String(results.find(r => r.assessment_id === assessmentId && r.student_id === studentId)?.score ?? ''),
      feedback: results.find(r => r.assessment_id === assessmentId && r.student_id === studentId)?.feedback ?? '',
    }
  }

  function setGrade(assessmentId: string, studentId: string, field: 'score' | 'feedback', value: string) {
    setGrades(prev => ({
      ...prev,
      [assessmentId]: {
        ...(prev[assessmentId] ?? {}),
        [studentId]: { ...getGrade(assessmentId, studentId), [field]: value },
      },
    }))
  }

  function handleCreateAssessment() {
    let linkUrl: string | null = newLinkUrl.trim() || null
    if (linkUrl && !/^https?:\/\//i.test(linkUrl)) linkUrl = `https://${linkUrl}`

    startTransition(async () => {
      const result = await createAction(sessionId, {
        title: newTitle,
        description: newDescription || undefined,
        max_score: newMaxScore,
        link_url: linkUrl,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setShowCreate(false)
        setNewTitle('')
        setNewDescription('')
        setNewMaxScore(100)
        setNewLinkUrl('')
        setError('')
      }
    })
  }

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmitGrades(assessmentId: string, maxScore: number) {
    const rows = gradableStudents.map(s => {
      const g = getGrade(assessmentId, s.id)
      const scoreNum = parseFloat(g.score)
      return {
        student_id: s.id,
        score: isNaN(scoreNum) ? null : Math.min(scoreNum, maxScore),
        feedback: g.feedback || undefined,
      }
    })
    startTransition(async () => {
      const result = await submitGradesAction(assessmentId, sessionId, rows)
      if (result.error) {
        setError(result.error)
      } else {
        setError('')
      }
    })
  }

  function handleDelete(assessmentId: string) {
    if (!deleteAction) return
    if (!confirm('Hapus asesmen ini? Semua nilai terkait juga akan dihapus.')) return
    startTransition(async () => {
      const result = await deleteAction(assessmentId, sessionId)
      if (result.error) setError(result.error)
    })
  }

  function startEditing(assessment: AssessmentItem) {
    setEditingId(assessment.id)
    setEditTitle(assessment.title)
    setEditDescription(assessment.description ?? '')
    setEditLinkUrl(assessment.link_url ?? '')
    setEditMaxScore(assessment.max_score)
  }

  function handleSaveEdit(assessment: AssessmentItem) {
    if (!updateAction) return
    const title = editTitle.trim()
    if (!title) return

    let linkUrl: string | null = editLinkUrl.trim() || null
    if (linkUrl && !/^https?:\/\//i.test(linkUrl)) linkUrl = `https://${linkUrl}`

    startTransition(async () => {
      const result = await updateAction(assessment.id, sessionId, {
        title,
        description: editDescription.trim() || undefined,
        max_score: editMaxScore,
        due_at: assessment.due_at ?? null,
        link_url: linkUrl,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setError('')
        setEditingId(null)
      }
    })
  }

  const gradedCountByAssessment = (assessmentId: string) =>
    results.filter(r => r.assessment_id === assessmentId && r.score !== null && !absentIds.has(r.student_id)).length

  return (
    <div className="space-y-3">
      {initialAssessments.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Daftar Asesmen</p>
          <div className="space-y-2">
          {initialAssessments.map(assessment => (
            <div key={assessment.id} className="border border-slate-200 rounded-xl">
              <div
                className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-blue-50/50 rounded-xl ${editingId !== assessment.id && expandedIds.has(assessment.id) ? 'rounded-b-none' : ''}`}
                onClick={() => toggleExpanded(assessment.id)}
              >
                <div className="flex-1 min-w-0">
                  {editingId === assessment.id ? (
                    <div className="space-y-2" onClick={e => e.stopPropagation()}>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Judul Asesmen</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Escape') setEditingId(null) }}
                          autoFocus
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Deskripsi <span className="text-gray-400">(opsional)</span></label>
                        <textarea
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Link Soal <span className="text-gray-400">(opsional)</span></label>
                        <input
                          type="url"
                          value={editLinkUrl}
                          onChange={e => setEditLinkUrl(e.target.value)}
                          placeholder="https://forms.google.com/..."
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-gray-600 shrink-0">Skor Maksimal:</label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={editMaxScore}
                          onChange={e => setEditMaxScore(Number(e.target.value))}
                          className="w-24 px-2 py-1 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSaveEdit(assessment)}
                          disabled={isPending || !editTitle.trim()}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
                        >
                          {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          disabled={isPending}
                          className="px-4 py-2 border border-slate-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-900">{assessment.title}</p>
                      {assessment.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{assessment.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        {(() => {
                          const graded = gradedCountByAssessment(assessment.id)
                          const ungraded = gradableStudents.length - graded
                          return (
                            <span className={`text-xs font-medium ${ungraded > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                              {gradableStudents.length === 0
                                ? 'Tidak ada siswa hadir'
                                : ungraded > 0 ? `${ungraded} siswa belum dinilai` : 'Semua sudah dinilai'}
                            </span>
                          )
                        })()}
                        {assessment.link_url && (
                          <a
                            href={assessment.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Buka link soal
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="shrink-0 ml-3 flex items-center gap-1">
                  {!readOnly && editingId !== assessment.id && (updateAction || deleteAction) && (
                    <div className="relative" ref={menuOpenId === assessment.id ? menuRef : undefined}>
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === assessment.id ? null : assessment.id) }}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Opsi asesmen"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 100-4 2 2 0 000 4zM10 12a2 2 0 100-4 2 2 0 000 4zM10 18a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      </button>
                      {menuOpenId === assessment.id && (
                        <div
                          className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg ring-1 ring-gray-900/10 py-1 z-10"
                          onClick={e => e.stopPropagation()}
                        >
                          {updateAction && (
                            <button
                              onClick={() => { startEditing(assessment); setMenuOpenId(null) }}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              Edit asesmen
                            </button>
                          )}
                          {deleteAction && (
                            <button
                              onClick={() => { handleDelete(assessment.id); setMenuOpenId(null) }}
                              disabled={isPending}
                              className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {editingId !== assessment.id && (
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${expandedIds.has(assessment.id) ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>

              {editingId !== assessment.id && expandedIds.has(assessment.id) && (
                <div className="border-t border-slate-200 px-5 py-4 rounded-b-xl">
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-slate-200">
                        <th className="text-left py-2 pb-3">Siswa</th>
                        <th className="text-center py-2 pb-3 w-28">Nilai (maks {assessment.max_score})</th>
                        <th className="text-left py-2 pb-3 pl-3">Tingkat Pemahaman</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr:first-child>td]:pt-3">
                      {students.map(student => {
                        const g = getGrade(assessment.id, student.id)
                        if (absentIds.has(student.id)) {
                          return (
                            <tr key={student.id}>
                              <td className="py-1.5 font-medium text-gray-400">{student.full_name}</td>
                              <td className="py-1.5 text-center" colSpan={2}>
                                <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                  Tidak hadir — tidak perlu dinilai
                                </span>
                              </td>
                            </tr>
                          )
                        }
                        return (
                          <tr key={student.id}>
                            <td className="py-1.5 font-medium text-gray-900">{student.full_name}</td>
                            <td className="py-1.5 text-center">
                              <input
                                type="number"
                                min={0}
                                max={assessment.max_score}
                                value={g.score}
                                onChange={e => setGrade(assessment.id, student.id, 'score', e.target.value)}
                                placeholder="-"
                                disabled={readOnly}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="py-1.5 pl-3">
                              {(() => {
                                const level = COMPREHENSION_LEVELS.find(l => l.value === g.feedback)
                                return (
                                  <select
                                    value={g.feedback}
                                    onChange={e => setGrade(assessment.id, student.id, 'feedback', e.target.value)}
                                    disabled={readOnly}
                                    className={`w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed ${level ? `${level.bg} ${level.text}` : 'bg-white text-gray-500'}`}
                                  >
                                    {COMPREHENSION_LEVELS.map(l => (
                                      <option key={l.value} value={l.value}>{l.label}</option>
                                    ))}
                                  </select>
                                )
                              })()}
                            </td>
                          </tr>

                        )
                      })}
                    </tbody>
                  </table>
                  {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
                  {!readOnly && (
                    <button
                      onClick={() => handleSubmitGrades(assessment.id, assessment.max_score)}
                      disabled={isPending}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
                    >
                      {isPending ? 'Menyimpan...' : 'Simpan Nilai'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          </div>
        </>
      )}

      {!readOnly && (showCreate ? (
        <div className="border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Asesmen Baru</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Judul Asesmen <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Judul asesmen"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Deskripsi <span className="text-gray-400">(opsional)</span></label>
              <textarea
                placeholder="Deskripsi soal / instruksi"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Link Soal <span className="text-gray-400">(opsional)</span></label>
              <input
                type="url"
                placeholder="https://forms.google.com/..."
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 shrink-0">Skor Maksimal:</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={newMaxScore}
                onChange={e => setNewMaxScore(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateAssessment}
                disabled={isPending || !newTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
              >
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false)
                  setNewDescription('')
                  setNewMaxScore(100)
                  setNewLinkUrl('')
                  setError('')
                }}
                disabled={isPending}
                className="px-4 py-2 border border-slate-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setNewTitle(buildAutoTitle(subjectName, grade, topic, initialAssessments.length + 1))
            setShowCreate(true)
          }}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Asesmen
        </button>
      ))}
    </div>
  )
}
