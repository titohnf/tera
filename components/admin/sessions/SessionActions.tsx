'use client'

import { useState } from 'react'
import SessionStatusButtons from './SessionStatusButtons'
import SessionForm from './SessionForm'

type Status = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

interface Props {
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

export default function SessionActions({
  sessionId,
  status,
  scheduledAt,
  durationMinutes,
  updateAction,
  tutors,
  subjectOptions,
  defaultValues,
}: Props) {
  const [editing, setEditing] = useState(false)

  const canEdit = status !== 'completed' && status !== 'cancelled'

  return (
    <div>
      <div className="flex items-center gap-2">
        {canEdit && (
          <button
            onClick={() => setEditing(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 border text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {editing ? 'Tutup' : 'Edit'}
          </button>
        )}
        <SessionStatusButtons
          sessionId={sessionId}
          currentStatus={status as Status}
          scheduledAt={scheduledAt}
          durationMinutes={durationMinutes}
        />
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Edit Detail Sesi</p>
          <SessionForm
            action={updateAction}
            classes={[]}
            tutors={tutors}
            subjects={subjectOptions}
            readonlyClass
            showRecurrence={false}
            showTopic={false}
            defaultValues={defaultValues}
          />
        </div>
      )}
    </div>
  )
}
