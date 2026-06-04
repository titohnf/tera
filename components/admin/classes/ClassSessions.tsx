'use client'

import { useState } from 'react'
import Link from 'next/link'
import SessionForm from '@/components/admin/sessions/SessionForm'
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
  overdue:   'bg-orange-100 text-orange-700',
  ongoing:   'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Terjadwal',
  overdue:   'Belum selesai',
  ongoing:   'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

function effectiveStatus(session: SessionRow): string {
  if (session.status !== 'scheduled' && session.status !== 'ongoing') return session.status
  const date = new Date(session.scheduled_at)
  const sessionEnd = new Date(date.getTime() + session.duration_minutes * 60_000)
  const now = new Date()
  if (now < date) return 'scheduled'
  if (now <= sessionEnd) return 'ongoing'
  return 'overdue'
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

  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const sessionPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  return (
    <div>
      {/* Header */}
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

      {/* Progress */}
      {totalSessions > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">{completedSessions} dari {totalSessions} sesi selesai</span>
            <span className={`text-xs font-semibold ${
              sessionPct >= 80 ? 'text-green-600' : sessionPct >= 40 ? 'text-yellow-600' : 'text-red-500'
            }`}>{sessionPct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                sessionPct >= 80 ? 'bg-green-500' : sessionPct >= 40 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${sessionPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Add form */}
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

      {/* Table */}
      {sessions.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">Belum ada sesi untuk kelas ini.</p>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="pl-6 pr-4 py-3 text-center w-10">#</th>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Mapel / Topik</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Tutor</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((session, idx) => {
                const date = new Date(session.scheduled_at)
                const status = effectiveStatus(session)
                return (
                  <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                    <td className="pl-6 pr-4 py-3 text-center text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/sessions/${session.id}`} className="block">
                        <p className="font-medium text-gray-900">
                          {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-400">
                          {date.toLocaleDateString('id-ID', { weekday: 'long' })} · {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Link href={`/admin/sessions/${session.id}`} className="block">
                        <p className="text-gray-800">{session.subjects?.name ?? '—'}</p>
                        {session.topic && (
                          <p className="text-sm text-gray-400 truncate max-w-[200px]">{session.topic}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Link href={`/admin/sessions/${session.id}`} className="block text-gray-600 text-sm">
                        {session.profiles?.full_name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/sessions/${session.id}`} className="block">
                        <span className={`inline-flex text-sm font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABEL[status] ?? status}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/sessions/${session.id}`}>
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
