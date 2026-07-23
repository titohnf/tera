'use client'

import { useState, useTransition } from 'react'
import { saveSessionCpUrls, updateSessionTopic } from '@/lib/actions/admin/curriculum'
import SessionTopicEditor from './SessionTopicEditor'
import MaterialUploaderAdmin from '@/components/materials/MaterialUploaderAdmin'
import MaterialList from '@/components/materials/MaterialList'
import AttendanceForm from '@/components/attendance/AttendanceForm'
import AssessmentList from '@/components/assessment/AssessmentList'
import { deleteMaterialAdmin, getSignedUrlAdmin } from '@/lib/actions/admin/materials'
import { submitAttendanceAdmin } from '@/lib/actions/admin/attendance'
import { createAssessmentAdmin, submitGradesAdmin } from '@/lib/actions/admin/assessments'
import type { AttendanceStatus } from '@/lib/types/database'

interface Student {
  id: string
  full_name: string
  currentStatus: AttendanceStatus
  notes: string
}

interface MaterialItem {
  id: string
  title: string
  file_path: string | null
  link_url: string | null
  mime_type: string | null
  file_size_bytes: number | null
  created_at: string
}

interface AssessmentItem {
  id: string
  title: string
  description: string | null
  max_score: number
  due_at: string | null
  link_url: string | null
  created_at: string
}

interface GradeResult {
  assessment_id: string
  student_id: string
  score: number | null
  feedback: string | null
}

const TABS = [
  { key: 'topic-materials', label: 'Topik & Materi' },
  { key: 'attendance', label: 'Kehadiran' },
  { key: 'assessment', label: 'Asesmen' },
] as const

type TabKey = typeof TABS[number]['key']

interface CurriculumTopic {
  id: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string
  learning_outcomes: string | null
}

export default function AdminSessionTabs({
  sessionId,
  initialTopic,
  curriculumTopicId,
  curriculumTopics,
  selectedCpIds,
  cpUrls,
  hasSubject,
  materials,
  students,
  sessionStatus,
  assessments,
  assessmentStudents,
  results,
}: {
  sessionId: string
  initialTopic: string | null
  curriculumTopicId: string | null
  curriculumTopics: CurriculumTopic[]
  selectedCpIds: string[]
  cpUrls: Record<string, string>
  hasSubject: boolean
  materials: MaterialItem[]
  students: Student[]
  sessionStatus: string
  assessments: AssessmentItem[]
  assessmentStudents: { id: string; full_name: string }[]
  results: GradeResult[]
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('topic-materials')
  const [localCpUrls, setLocalCpUrls] = useState<Record<string, string>>(cpUrls)
  const [savedCpUrls, setSavedCpUrls] = useState<Record<string, string>>(cpUrls)
  const [isSavingUrls, startSavingUrls] = useTransition()

  const selectedCpRows = curriculumTopics.filter(t => selectedCpIds.includes(t.id) && t.learning_outcomes)
  const cpUrlsDirty = selectedCpRows.some(cp => (localCpUrls[cp.id] ?? '') !== (savedCpUrls[cp.id] ?? ''))

  function saveCpUrls() {
    const urlsToSave = Object.fromEntries(
      selectedCpRows.map(cp => [cp.id, (localCpUrls[cp.id] ?? '').trim()]).filter(([, v]) => v)
    )
    startSavingUrls(async () => {
      await saveSessionCpUrls(sessionId, urlsToSave)
      setSavedCpUrls(prev => ({ ...prev, ...urlsToSave }))
    })
  }

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b px-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Topik & Materi */}
        {activeTab === 'topic-materials' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Topik Pembelajaran</h2>
              <SessionTopicEditor
                sessionId={sessionId}
                initialTopicId={curriculumTopicId}
                initialTopic={initialTopic}
                initialCpIds={selectedCpIds}
                curriculumTopics={curriculumTopics}
                hasSubject={hasSubject}
                saveAction={updateSessionTopic}
              />
            </div>
            <div className="border-t pt-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Materi Pembelajaran
                {materials.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">({materials.length} file)</span>
                )}
              </h2>
              <MaterialUploaderAdmin sessionId={sessionId} />
              <div className="mt-5">
                <MaterialList
                  materials={materials}
                  sessionId={sessionId}
                  deleteAction={deleteMaterialAdmin}
                  signedUrlAction={getSignedUrlAdmin}
                />
              </div>
            </div>
          </div>
        )}

        {/* Kehadiran */}
        {activeTab === 'attendance' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Kehadiran</h2>
              <span className="text-sm text-gray-500">{students.length} siswa terdaftar</span>
            </div>
            {students.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada siswa terdaftar di kelas ini.</p>
            ) : (
              <AttendanceForm
                sessionId={sessionId}
                students={students}
                sessionStatus={sessionStatus}
                submitAction={submitAttendanceAdmin}
              />
            )}
          </div>
        )}

        {/* Asesmen & Bank Soal */}
        {activeTab === 'assessment' && (
          <div className="space-y-8">
            <AssessmentList
              sessionId={sessionId}
              assessments={assessments}
              students={assessmentStudents}
              results={results}
              createAction={createAssessmentAdmin}
              submitGradesAction={submitGradesAdmin}
            />

            {selectedCpRows.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Bank Soal per CP</h2>
                <div className="space-y-3">
                  {selectedCpRows.map(cp => (
                    <div key={cp.id} className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 truncate">{cp.learning_outcomes}</p>
                      <input
                        type="url"
                        value={localCpUrls[cp.id] ?? ''}
                        onChange={e => setLocalCpUrls(prev => ({ ...prev, [cp.id]: e.target.value }))}
                        placeholder="URL Bank Soal"
                        className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={saveCpUrls}
                    disabled={!cpUrlsDirty || isSavingUrls}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
                  >
                    {isSavingUrls ? 'Menyimpan...' : 'Simpan Bank Soal'}
                  </button>
                  {!cpUrlsDirty && Object.values(savedCpUrls).some(v => v) && (
                    <span className="text-xs text-green-600">Tersimpan</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
