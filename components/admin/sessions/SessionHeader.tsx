'use client'

import { useState } from 'react'
import SessionStatusButtons from './SessionStatusButtons'
import SessionForm from './SessionForm'

type Status = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

interface Props {
  subject: string | null
  dateStr: string
  displayStatus: { label: string; color: string }
  sessionId: string
  status: string
  scheduledAt: string
  durationMinutes: number
  updateAction: (prevState: { error: string } | null, formData: FormData) => Promise<{ error: string } | null>
  tutors: { id: string; full_name: string }[]
  subjectOptions: { id: string; name: string }[]
  defaultValues: {
    class_id: string
    tutor_id: string
    subject_id: string | null
    date: string
    time: string
    duration_minutes: number
    location: string | null
  }
}

export default function SessionHeader({
  subject,
  dateStr,
  displayStatus,
  sessionId,
  status,
  scheduledAt,
  durationMinutes,
  updateAction,
  tutors,
  subjectOptions,
  defaultValues,
}: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const canEdit = status !== 'completed' && status !== 'cancelled'

  return (
    <>
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-gray-900">{subject ?? '—'}</p>
            <p className="text-sm text-gray-500">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${displayStatus.color}`}>
              {displayStatus.label}
            </span>
            {canEdit && (
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            <SessionStatusButtons
              sessionId={sessionId}
              currentStatus={status as Status}
              scheduledAt={scheduledAt}
              durationMinutes={durationMinutes}
            />
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Edit Detail Sesi</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SessionForm
              action={async (prev, formData) => {
                const result = await updateAction(prev, formData)
                if (!result) setEditOpen(false)
                return result
              }}
              classes={[]}
              tutors={tutors}
              subjects={subjectOptions}
              readonlyClass
              showRecurrence={false}
              showTopic={false}
              defaultValues={defaultValues}
            />
          </div>
        </div>
      )}
    </>
  )
}
