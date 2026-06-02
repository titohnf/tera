'use client'

import { useState } from 'react'
import Link from 'next/link'
import SessionForm from '@/components/admin/sessions/SessionForm'
import SessionStatusChips from '@/components/sessions/SessionStatusChips'
import { createSession } from '@/lib/actions/admin/sessions'

type CountRow = [{ count: number }]

type SessionRow = {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  location: string | null
  topic: string | null
  subjects: { name: string } | null
  profiles: { full_name: string } | null
  materials: CountRow
  assessments: CountRow
  attendances: CountRow
  performance_notes: CountRow
}

type TutorOption = { id: string; full_name: string }
type SubjectOption = { id: string; name: string }
type CurriculumTopic = {
  id: string
  subject_id: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string | null
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  overdue: 'bg-orange-100 text-orange-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Terjadwal',
  overdue: 'Belum diselesaikan',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

export default function ClassSessions({
  classId,
  sessions,
  gradedSessionIds,
  tutors,
  subjects,
  defaultTutorId,
  defaultSubjectId,
  curriculumTopics,
  studentGrade,
}: {
  classId: string
  sessions: SessionRow[]
  gradedSessionIds: string[]
  tutors: TutorOption[]
  subjects: SubjectOption[]
  defaultTutorId?: string
  defaultSubjectId?: string
  curriculumTopics?: CurriculumTopic[]
  studentGrade?: number | null
}) {
  const [showForm, setShowForm] = useState(false)
  const gradedSet = new Set(gradedSessionIds)
  const grouped = groupByMonth(sessions)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Sesi Kelas</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Tutup' : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Sesi
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="mb-5 bg-white border border-blue-100 rounded-xl p-5">
          <SessionForm
            action={createSession}
            classes={[]}
            tutors={tutors}
            subjects={subjects}
            readonlyClass
            cancelHref={`/admin/classes/${classId}`}
            redirectTo={`/admin/classes/${classId}`}
            defaultValues={{
              class_id: classId,
              tutor_id: defaultTutorId,
              subject_id: defaultSubjectId,
            }}
            curriculumTopics={curriculumTopics}
            classGrade={studentGrade}
          />
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-8 text-center text-sm text-gray-400">
          Belum ada sesi untuk kelas ini.
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([month, rows]) => (
            <div key={month}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{month}</p>
              <div className="space-y-1.5">
                {rows.map(session => {
                  const date = new Date(session.scheduled_at)
                  const sessionEnd = new Date(date.getTime() + session.duration_minutes * 60_000)
                  const now = new Date()
                  const effectiveStatus =
                    session.status === 'scheduled' || session.status === 'ongoing'
                      ? now < date ? 'scheduled'
                        : now <= sessionEnd ? 'ongoing'
                        : 'overdue'
                      : session.status

                  const counts = {
                    topic: session.topic,
                    hasMaterials: (session.materials[0]?.count ?? 0) > 0,
                    hasAssessments: (session.assessments[0]?.count ?? 0) > 0,
                    hasAttendance: (session.attendances[0]?.count ?? 0) > 0,
                    hasNotes: (session.performance_notes[0]?.count ?? 0) > 0,
                    hasGradedAssessments: gradedSet.has(session.id),
                  }

                  return (
                    <Link
                      key={session.id}
                      href={`/admin/sessions/${session.id}`}
                      className="flex items-center justify-between bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-center w-12 shrink-0">
                          <p className="text-xs text-gray-400">{date.toLocaleDateString('id-ID', { month: 'short' })}</p>
                          <p className="text-xl font-bold text-gray-900 leading-tight">{date.getDate()}</p>
                          <p className="text-xs text-gray-400">{date.toLocaleDateString('id-ID', { weekday: 'short' })}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {session.subjects?.name ?? '—'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {[
                              session.profiles?.full_name,
                              `${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} (${session.duration_minutes} mnt)`,
                              session.location,
                            ].filter(Boolean).join(' · ')}
                          </p>
                          <SessionStatusChips status={effectiveStatus} counts={counts} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[effectiveStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABEL[effectiveStatus] ?? effectiveStatus}
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function groupByMonth(sessions: SessionRow[]): Record<string, SessionRow[]> {
  return sessions.reduce<Record<string, SessionRow[]>>((acc, s) => {
    const label = new Date(s.scheduled_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    if (!acc[label]) acc[label] = []
    acc[label].push(s)
    return acc
  }, {})
}
