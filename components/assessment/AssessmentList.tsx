'use client'

import { useState, useTransition } from 'react'
import { createAssessment, submitGrades } from '@/lib/actions/assessments'

type CreateAction = (sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type SubmitGradesAction = (assessmentId: string, sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>

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

export default function AssessmentList({
  sessionId,
  assessments: initialAssessments,
  students,
  results,
  createAction = createAssessment,
  submitGradesAction = submitGrades,
}: {
  sessionId: string
  assessments: AssessmentItem[]
  students: Student[]
  results: GradeResult[]
  createAction?: CreateAction
  submitGradesAction?: SubmitGradesAction
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [activeAssessment, setActiveAssessment] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
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
        setActiveAssessment(null)
        setError('')
      }
    })
  }

  const gradedCountByAssessment = (assessmentId: string) =>
    results.filter(r => r.assessment_id === assessmentId && r.score !== null).length

  return (
    <div>
      <button
        onClick={() => setShowCreate(true)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Buat Asesmen Baru
      </button>

      {showCreate && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Asesmen Baru</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Judul asesmen *"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Deskripsi (opsional)"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <input
              type="url"
              placeholder="Link soal / Google Forms (opsional)"
              value={newLinkUrl}
              onChange={e => setNewLinkUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600">Skor Maksimal:</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={newMaxScore}
                onChange={e => setNewMaxScore(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50/50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleCreateAssessment}
                disabled={isPending || !newTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={() => { setShowCreate(false); setError('') }}
                className="px-4 py-2 bg-white border text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {initialAssessments.length === 0 && !showCreate ? (
        <div className="text-center py-10 text-sm text-gray-500 bg-white rounded-xl shadow ring-1 ring-gray-900/5">
          Belum ada asesmen. Klik tombol di atas untuk membuat asesmen baru.
        </div>
      ) : (
        <div className="space-y-3">
          {initialAssessments.map(assessment => (
            <div key={assessment.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-blue-50/50"
                onClick={() => setActiveAssessment(
                  activeAssessment === assessment.id ? null : assessment.id
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{assessment.title}</p>
                  {assessment.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{assessment.description}</p>
                  )}
                  {assessment.link_url && (
                    <a
                      href={assessment.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:underline mt-0.5 inline-flex items-center gap-1"
                    >
                      🔗 Buka link soal
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{gradedCountByAssessment(assessment.id)} / {students.length} dinilai</span>
                  <span>Maks: {assessment.max_score}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${activeAssessment === assessment.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {activeAssessment === assessment.id && (
                <div className="border-t px-5 py-4">
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b">
                        <th className="text-left py-2">Siswa</th>
                        <th className="text-center py-2 w-28">Nilai (maks {assessment.max_score})</th>
                        <th className="text-left py-2 pl-3">Komentar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {students.map(student => {
                        const g = getGrade(assessment.id, student.id)
                        return (
                          <tr key={student.id}>
                            <td className="py-2.5 font-medium text-gray-900">{student.full_name}</td>
                            <td className="py-2.5 text-center">
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
                            <td className="py-2.5 pl-3">
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
      )}
    </div>
  )
}
