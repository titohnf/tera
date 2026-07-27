'use client'

import { useState } from 'react'
import Avatar from './Avatar'
import TutorScheduleModal from './TutorScheduleModal'

const WEEK_DAYS = [
  { value: '1', label: 'Sen' },
  { value: '2', label: 'Sel' },
  { value: '3', label: 'Rab' },
  { value: '4', label: 'Kam' },
  { value: '5', label: 'Jum' },
  { value: '6', label: 'Sab' },
  { value: '0', label: 'Min' },
]

// Strip the "Reguler/Fokus ... SM <semester> <tahun ajaran>" middle segment
// so long class names read as "Privat 2 SD Jagad" instead of the full
// "Privat 2 SD Reguler SM 1 2026/2027 Jagad".
function simplifyClassName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 4) return name
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[parts.length - 1]}`
}

export type TutorScheduleRow = {
  id: string
  full_name: string
  avatar_url: string | null
  activeClassCount: number
  declared: { name: string; levels: string }[]
  schedule: { day: string; time: string | null; classCount: number; classNames: string[]; outsideSchedule: boolean }[]
  availability: { day: number; startTime: string; endTime: string }[]
  chartClasses: { day: number; classId: string; subjectName: string; startMin: number | null }[]
}

export default function TutorScheduleTable({ tutors }: { tutors: TutorScheduleRow[] }) {
  const [search, setSearch] = useState('')
  const searchTerm = search.trim().toLowerCase()
  const matchesSearch = (name: string) => name.toLowerCase().includes(searchTerm)

  const withSchedule = tutors.filter(t => t.schedule.length > 0 && matchesSearch(t.full_name))
  const withoutSchedule = tutors.filter(t => t.schedule.length === 0 && matchesSearch(t.full_name))

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-base font-semibold text-gray-700">Cek Jadwal Tutor</p>
            <p className="text-xs text-gray-400 mt-0.5">Berdasarkan jadwal yang dideklarasikan tutor di profil mereka</p>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama tutor..."
            className="w-full sm:w-56 px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {withSchedule.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {searchTerm ? 'Tidak ada tutor yang cocok.' : 'Belum ada tutor yang mengisi jadwal ketersediaan.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {withSchedule.map(tutor => {
              const schedMap = new Map(tutor.schedule.map(s => [s.day, s]))
              return (
                <div key={tutor.id} className="px-5 py-5">
                  <div className="flex items-start gap-3.5">
                    <Avatar name={tutor.full_name} avatarUrl={tutor.avatar_url} />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{tutor.full_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tutor.activeClassCount} kelas aktif</p>
                    </div>
                  </div>
                  <p className="text-sm mt-2 pt-2 ml-[54px] border-t border-gray-100">
                    {tutor.declared.length > 0 ? (
                      tutor.declared.map((d, i) => (
                        <span key={d.name}>
                          {i > 0 && <span className="text-gray-400 mx-1.5">•</span>}
                          <span className="text-gray-700">{d.name}</span>
                          {d.levels && <span className="text-gray-400"> ({d.levels})</span>}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 ml-[54px] border-t border-gray-100">
                    {WEEK_DAYS.map(d => {
                      const entry = schedMap.get(d.value)
                      if (!entry) return null
                      const hasClasses = entry.classCount > 0
                      return (
                        <span
                          key={d.value}
                          className={`relative group inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs leading-tight whitespace-nowrap ${
                            entry.outsideSchedule ? 'bg-gray-100 text-gray-500' : hasClasses ? 'bg-green-50 text-green-700' : 'bg-white border border-gray-200 text-gray-600'
                          }`}
                        >
                          <span className="font-semibold">{d.label}</span> {entry.time ?? 'belum dijadwalkan'}
                          {hasClasses && <span className="font-semibold">({entry.classCount})</span>}
                          {hasClasses && (
                            <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-xs rounded-md px-2.5 py-1.5 whitespace-nowrap w-max max-w-[320px] shadow-lg">
                              {entry.outsideSchedule && <p className="text-gray-300 mb-0.5">Di luar jadwal ketersediaan</p>}
                              <ul className="space-y-0.5">
                                {entry.classNames.map((name, i) => (
                                  <li key={i} className="flex gap-1.5">
                                    <span>·</span>
                                    <span>{simplifyClassName(name)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </span>
                      )
                    })}
                  </div>
                  <div className="mt-2 pl-[54px]">
                    <TutorScheduleModal
                      tutorName={tutor.full_name}
                      availability={tutor.availability}
                      classes={tutor.chartClasses}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {withoutSchedule.length > 0 && (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Belum mengisi jadwal ({withoutSchedule.length})</p>
          <div className="flex flex-wrap gap-2">
            {withoutSchedule.map(t => (
              <span key={t.id} className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-1">{t.full_name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
