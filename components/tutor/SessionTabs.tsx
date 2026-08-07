'use client'

import { useState } from 'react'
import AttendanceAndNotes from './AttendanceAndNotes'
import MaterialUploader from '@/components/materials/MaterialUploader'
import MaterialList from '@/components/materials/MaterialList'
import AssessmentList from '@/components/assessment/AssessmentList'
import type { AttendanceStatus } from '@/lib/types/database'
import { isAbsentFromSession } from '@/lib/session-status'

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

interface SimpleStudent {
  id: string
  full_name: string
}

const TABS = [
  { key: 'attendance', label: 'Presensi & Catatan' },
  { key: 'materials', label: 'Topik & Materi' },
  { key: 'assessment', label: 'Asesmen' },
] as const

type TabKey = typeof TABS[number]['key']

export default function SessionTabs({
  sessionId,
  tutorId,
  classId,
  sessionStatus,
  topic,
  students,
  templates,
  materials,
  assessments,
  assessmentStudents,
  results,
}: {
  sessionId: string
  tutorId: string
  classId: string
  sessionStatus: string
  topic: string | null
  students: Student[]
  templates: Template[]
  materials: MaterialItem[]
  assessments: AssessmentItem[]
  assessmentStudents: SimpleStudent[]
  results: GradeResult[]
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('attendance')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b mb-5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'attendance' && (
        <AttendanceAndNotes
          sessionId={sessionId}
          students={students}
          templates={templates}
          sessionStatus={sessionStatus}
        />
      )}

      {activeTab === 'materials' && (
        <div>
          {topic && (
            <div className="mb-5 bg-gray-50 border rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Topik Pembelajaran</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{topic}</p>
            </div>
          )}
          <MaterialUploader
            sessionId={sessionId}
            tutorId={tutorId}
            classId={classId}
          />
          <div className="mt-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Materi Terupload ({materials.length})
            </h2>
            <MaterialList materials={materials} sessionId={sessionId} />
          </div>
        </div>
      )}

      {activeTab === 'assessment' && (
        <AssessmentList
          sessionId={sessionId}
          assessments={assessments}
          students={assessmentStudents}
          absentStudentIds={students.filter(s => isAbsentFromSession(s.currentStatus)).map(s => s.id)}
          results={results}
        />
      )}
    </div>
  )
}
