'use client'

import { useState, useTransition } from 'react'
import { createAssessment, submitGrades } from '@/lib/actions/assessments'

type CreateAction = (sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type SubmitGradesAction = (assessmentId: string, sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type DeleteAction = (assessmentId: string, sessionId: string) => Promise<{ error?: string; success?: boolean }>

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
  createAction = createAssessment,
  submitGradesAction = submitGrades,
  deleteAction,
  subjectName,
  grade,
  topic,
}: {
  sessionId: string
  assessments: AssessmentItem[]
  students: Student[]
  results: GradeResult[]
  createAction?: CreateAction
  submitGradesAction?: SubmitGradesAction
  deleteAction?: DeleteAction
  subjectName?: string | null
  grade?: number | null
  topic?: string | null
}) {
  const [showCreate, setShowCreate] = useState(() => initialAssessments.length === 0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(initialAssessments.map(a => a.id)))
  const [newTitle, setNewTitle] = useState(() => buildAutoTitle(subjectName, grade, topic, initialAssessments.length + 1))
  const [newDescription, setNewDescription] = useState('')
  const [newMaxScore, setNewMaxScore] = useState(100)
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [grades, setGrades] = useState<Record<string, Record<string, { score: string; feedback: string }>>>({})

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
    const rows = students.map(s => {
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

  const gradedCountByAssessment = (assessmentId: string) =>
    results.filter(r => r.assessment_id === assessmentId && r.score !== null).length

  return (
    <div className="space-y-3">
      {initialAssessments.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Daftar Asesmen</p>
          <div className="space-y-2">
          {initialAssessments.map(assessment => (
            <div key={assessment.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-blue-50/50"
                onClick={() => toggleExpanded(assessment.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{assessment.title}</p>
                  {assessment.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{assessment.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {(() => {
                      const graded = gradedCountByAssessment(assessment.id)
                      const ungraded = students.length - graded
                      return (
                        <span className={`text-xs font-medium ${ungraded > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                          {ungraded > 0 ? `${ungraded} siswa belum dinilai` : 'Semua sudah dinilai'}
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
                    {deleteAction && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(assessment.id) }}
                        disabled={isPending}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors inline-flex items-center gap-1"
                        title="Hapus asesmen"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
                <div className="shrink-0 ml-3">
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedIds.has(assessment.id) ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expandedIds.has(assessment.id) && (
                <div className="border-t border-slate-200 px-5 py-4">
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-slate-200">
                        <th className="text-left py-2 pb-3">Siswa</th>
                        <th className="text-center py-2 pb-3 w-28">Nilai (maks {assessment.max_score})</th>
                        <th className="text-left py-2 pb-3 pl-3">Komentar</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr:first-child>td]:pt-3">
                      {students.map(student => {
                        const g = getGrade(assessment.id, student.id)
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
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-1.5 pl-3">
                              <input
                                type="text"
                                value={g.feedback}
                                onChange={e => setGrade(assessment.id, student.id, 'feedback', e.target.value)}
                                placeholder="Komentar (opsional)"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          </tr>

                        )
                      })}
                    </tbody>
                  </table>
                  {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
                  <button
                    onClick={() => handleSubmitGrades(assessment.id, assessment.max_score)}
                    disabled={isPending}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                  >
                    {isPending ? 'Menyimpan...' : 'Simpan Nilai'}
                  </button>
                </div>
              )}
            </div>
          ))}
          </div>
        </>
      )}

      {showCreate ? (
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
            <button
              onClick={handleCreateAssessment}
              disabled={isPending || !newTitle.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </button>
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
      )}
    </div>
  )
}
