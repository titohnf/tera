'use client'

import { useState } from 'react'
import AttendanceAndNotes from '@/components/tutor/AttendanceAndNotes'
import MaterialList from '@/components/materials/MaterialList'
import AssessmentList from '@/components/assessment/AssessmentList'
import SessionTopicEditor from '@/components/admin/sessions/SessionTopicEditor'
import BankSoalTab from '@/components/admin/sessions/BankSoalTab'
import type { AttendanceStatus } from '@/lib/types/database'

// ── Action types ──────────────────────────────────────────────────────────────
type SubmitAttendanceAction = (sessionId: string, records: unknown) => Promise<{ error?: string; success?: boolean }>
type SaveNoteAction = (sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type CreateAssessmentAction = (sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type SubmitGradesAction = (assessmentId: string, sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type DeleteMaterialAction = (materialId: string, filePath: string | null, sessionId: string) => Promise<{ error?: string }>
type DeleteAssessmentAction = (assessmentId: string, sessionId: string) => Promise<{ error?: string; success?: boolean }>
type SignedUrlAction = (filePath: string) => Promise<{ error?: string; url?: string }>
type SaveTopicAction = (
  sessionId: string,
  curriculumTopicId: string | null,
  topicText: string,
  selectedCpIds: string[],
) => Promise<{ error?: string }>

// ── Data types ────────────────────────────────────────────────────────────────
interface Student {
  id: string
  full_name: string
  currentStatus: AttendanceStatus | null
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
  { key: 'assessment', label: 'Asesmen & Bank Soal' },
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

// CurriculumTopic is compatible with BankSoalTab's CpRow (same shape)

export default function SessionTabs({
  sessionId,
  sessionStatus,
  topic,
  curriculumTopicId,
  curriculumTopics,
  hasSubject,
  selectedCpIds,
  cpUrls,
  subjectName,
  grade,
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
  deleteAssessmentAction,
  deleteMaterialAction,
  signedUrlAction,
  saveTopicAction,
}: {
  sessionId: string
  sessionStatus: string
  topic: string | null
  curriculumTopicId: string | null
  curriculumTopics: CurriculumTopic[]
  hasSubject?: boolean
  selectedCpIds?: string[]
  cpUrls?: Record<string, string>
  subjectName?: string | null
  grade?: number | null
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
  deleteAssessmentAction?: DeleteAssessmentAction
  deleteMaterialAction: DeleteMaterialAction
  signedUrlAction: SignedUrlAction
  saveTopicAction: SaveTopicAction
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Topik Pembelajaran</p>
          <SessionTopicEditor
            sessionId={sessionId}
            initialTopicId={curriculumTopicId}
            initialTopic={topic}
            initialCpIds={selectedCpIds}
            curriculumTopics={curriculumTopics}
            hasSubject={hasSubject}
            saveAction={saveTopicAction}
          />

          <div className="border-t border-slate-200 my-5" />

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Upload Materi</p>
          {materialUploader}

          <div className="border-t border-slate-200 my-5" />

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Materi ({materials.length})
          </p>
          <MaterialList
            materials={materials}
            sessionId={sessionId}
            deleteAction={deleteMaterialAction}
            signedUrlAction={signedUrlAction}
          />
        </div>
      )}

      {/* Asesmen & Bank Soal */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
          <AssessmentList
            sessionId={sessionId}
            assessments={assessments}
            students={assessmentStudents}
            results={results}
            createAction={createAssessmentAction}
            submitGradesAction={submitGradesAction}
            deleteAction={deleteAssessmentAction}
            subjectName={subjectName}
            grade={grade}
            topic={topic}
          />
          <div className="border-t border-slate-200" />
          <BankSoalTab
            sessionId={sessionId}
            selectedCpIds={selectedCpIds ?? []}
            cpRows={curriculumTopics}
            initialCpUrls={cpUrls ?? {}}
          />
        </div>
      )}
    </div>
  )
}
