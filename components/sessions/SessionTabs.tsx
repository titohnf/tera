'use client'

import { useState } from 'react'
import AttendanceAndNotes from '@/components/tutor/AttendanceAndNotes'
import MaterialList from '@/components/materials/MaterialList'
import AssessmentList from '@/components/assessment/AssessmentList'
import SessionTopicEditor from '@/components/admin/sessions/SessionTopicEditor'
import type { AttendanceStatus } from '@/lib/types/database'

// ── Action types ──────────────────────────────────────────────────────────────
type SubmitAttendanceAction = (sessionId: string, records: unknown) => Promise<{ error?: string; success?: boolean }>
type SaveNoteAction = (sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type CreateAssessmentAction = (sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type SubmitGradesAction = (assessmentId: string, sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type DeleteMaterialAction = (materialId: string, filePath: string | null, sessionId: string) => Promise<{ error?: string }>
type SignedUrlAction = (filePath: string) => Promise<{ error?: string; url?: string }>

// ── Data types ────────────────────────────────────────────────────────────────
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

// ── Tabs definition ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'materials', label: 'Topik & Materi' },
  { key: 'attendance', label: 'Presensi & Catatan' },
  { key: 'assessment', label: 'Asesmen' },
] as const

type TabKey = typeof TABS[number]['key']

// ── Component ─────────────────────────────────────────────────────────────────
interface CurriculumTopic {
  id: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string
  learning_outcomes: string | null
}

export default function SessionTabs({
  sessionId,
  sessionStatus,
  topic,
  curriculumTopicId,
  curriculumTopics,
  students,
  templates,
  materials,
  assessments,
  assessmentStudents,
  results,
  materialUploader,
  submitAttendanceAction,
  saveNoteAction,
  createAssessmentAction,
  submitGradesAction,
  deleteMaterialAction,
  signedUrlAction,
}: {
  sessionId: string
  sessionStatus: string
  topic: string | null
  curriculumTopicId: string | null
  curriculumTopics: CurriculumTopic[]
  students: Student[]
  templates: Template[]
  materials: MaterialItem[]
  assessments: AssessmentItem[]
  assessmentStudents: { id: string; full_name: string }[]
  results: GradeResult[]
  materialUploader: React.ReactNode
  submitAttendanceAction: SubmitAttendanceAction
  saveNoteAction: SaveNoteAction
  createAssessmentAction: CreateAssessmentAction
  submitGradesAction: SubmitGradesAction
  deleteMaterialAction: DeleteMaterialAction
  signedUrlAction: SignedUrlAction
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('materials')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Presensi & Catatan */}
      {activeTab === 'attendance' && (
        <AttendanceAndNotes
          sessionId={sessionId}
          students={students}
          templates={templates}
          sessionStatus={sessionStatus}
          submitAttendanceAction={submitAttendanceAction}
          saveNoteAction={saveNoteAction}
        />
      )}

      {/* Topik & Materi */}
      {activeTab === 'materials' && (
        <div>
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 mb-2">Topik Pembelajaran</p>
            <SessionTopicEditor
              sessionId={sessionId}
              initialTopicId={curriculumTopicId}
              initialTopic={topic}
              curriculumTopics={curriculumTopics}
            />
          </div>

          <div className="border-t pt-5">
            {materialUploader}
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Materi Terupload ({materials.length})
              </h2>
              <MaterialList
                materials={materials}
                sessionId={sessionId}
                deleteAction={deleteMaterialAction}
                signedUrlAction={signedUrlAction}
              />
            </div>
          </div>
        </div>
      )}

      {/* Asesmen */}
      {activeTab === 'assessment' && (
        <AssessmentList
          sessionId={sessionId}
          assessments={assessments}
          students={assessmentStudents}
          results={results}
          createAction={createAssessmentAction}
          submitGradesAction={submitGradesAction}
        />
      )}
    </div>
  )
}
