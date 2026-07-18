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
type UpdateAssessmentAction = (assessmentId: string, sessionId: string, data: unknown) => Promise<{ error?: string; success?: boolean }>
type SignedUrlAction = (filePath: string) => Promise<{ error?: string; url?: string }>
type SaveTopicAction = (
  sessionId: string,
  curriculumTopicId: string | null,
  topicText: string,
  selectedCpIds: string[],
) => Promise<{ error?: string }>
type SaveCpUrlsAction = (sessionId: string, cpUrls: Record<string, string>) => Promise<{ error?: string }>
type SaveCustomTopicAction = (
  sessionId: string,
  theme: string,
  topicText: string,
  learningOutcomes: string[],
) => Promise<{ error?: string }>

// ── Data types ────────────────────────────────────────────────────────────────
interface Student {
  id: string
  full_name: string
  currentStatus: AttendanceStatus | null
  attendanceNotes: string
  existingNotes: Record<string, { body: string; template_id: string | null }>
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
  readOnlyReason,
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
  updateAssessmentAction,
  deleteMaterialAction,
  signedUrlAction,
  saveTopicAction,
  saveCpUrlsAction,
  isAdmin,
  isPrivateClass,
  saveCustomTopicAction,
  customTheme,
  customLearningOutcomes,
}: {
  sessionId: string
  readOnlyReason?: 'not-tutor' | 'approved'
  sessionStatus: string
  topic: string | null
  curriculumTopicId: string | null
  curriculumTopics: CurriculumTopic[]
  hasSubject?: boolean
  selectedCpIds?: string[]
  cpUrls?: Record<string, string>
  subjectName?: string | null
  grade?: number | null
  isPrivateClass?: boolean
  saveCustomTopicAction?: SaveCustomTopicAction
  customTheme?: string | null
  customLearningOutcomes?: string[]
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
  updateAssessmentAction?: UpdateAssessmentAction
  deleteMaterialAction: DeleteMaterialAction
  signedUrlAction: SignedUrlAction
  saveTopicAction: SaveTopicAction
  saveCpUrlsAction?: SaveCpUrlsAction
  isAdmin?: boolean
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

      {readOnlyReason && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4 text-xs text-gray-500">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {readOnlyReason === 'approved'
            ? 'Mode lihat saja — sesi ini sudah disetujui admin dan tidak bisa diubah lagi.'
            : 'Mode lihat saja — Anda bukan tutor yang mengajar sesi ini.'}
        </div>
      )}

      <div>
        {/* Presensi & Catatan */}
        {activeTab === 'attendance' && (
          <AttendanceAndNotes
            sessionId={sessionId}
            students={students}
            templates={templates}
            sessionStatus={sessionStatus}
            readOnly={!!readOnlyReason}
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
              isAdmin={isAdmin}
              readOnly={!!readOnlyReason}
              isPrivateClass={isPrivateClass}
              initialCustomTheme={customTheme}
              initialCustomLearningOutcomes={customLearningOutcomes}
              saveCustomAction={saveCustomTopicAction}
            />

            <div className="border-t border-slate-200 my-5" />

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Materi Pembelajaran</p>
            {!readOnlyReason && materialUploader}
            <div className="mt-4">
              <MaterialList
                materials={materials}
                sessionId={sessionId}
                readOnly={!!readOnlyReason}
                deleteAction={deleteMaterialAction}
                signedUrlAction={signedUrlAction}
              />
            </div>
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
              readOnly={!!readOnlyReason}
              createAction={createAssessmentAction}
              submitGradesAction={submitGradesAction}
              deleteAction={deleteAssessmentAction}
              updateAction={updateAssessmentAction}
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
              readOnly={!!readOnlyReason}
              saveAction={saveCpUrlsAction}
            />
          </div>
        )}
      </div>
    </div>
  )
}
