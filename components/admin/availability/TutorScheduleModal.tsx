'use client'

import { useState } from 'react'
import WeeklyScheduleChart, { type WeeklyScheduleChartProps } from './WeeklyScheduleChart'

export default function TutorScheduleModal({
  tutorName,
  availability,
  classes,
}: {
  tutorName: string
} & WeeklyScheduleChartProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
      >
        Lihat Jadwal Lengkap
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-semibold text-gray-800">Jadwal Mingguan — {tutorName}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <WeeklyScheduleChart availability={availability} classes={classes} />
          </div>
        </div>
      )}
    </>
  )
}
