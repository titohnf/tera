'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import TimePicker from '@/components/ui/TimePicker'

const DAYS = [
  { value: '1', label: 'Senin' },
  { value: '2', label: 'Selasa' },
  { value: '3', label: 'Rabu' },
  { value: '4', label: 'Kamis' },
  { value: '5', label: 'Jumat' },
  { value: '6', label: 'Sabtu' },
  { value: '0', label: 'Minggu' },
]

const LEVELS = ['SD', 'SMP', 'SMA', 'Umum']

type Subject = { id: string; name: string; level: string[] | null }

export default function AvailabilityFilter({
  subjects,
  initialDays,
  initialSubjectId,
  initialLevel,
  initialTime,
}: {
  subjects: Subject[]
  initialDays: string[]
  initialSubjectId: string
  initialLevel: string
  initialTime: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [day, setDay] = useState(initialDays[0] ?? '')
  const [level, setLevel] = useState(initialLevel)
  const [subjectId, setSubjectId] = useState(initialSubjectId)
  const [time, setTime] = useState(initialTime)

  // When jenjang changes, reset subject if it no longer belongs to this jenjang
  function handleLevelChange(newLevel: string) {
    setLevel(newLevel)
    if (newLevel && subjectId) {
      const subj = subjects.find(s => s.id === subjectId)
      const stillValid = !subj?.level || subj.level.length === 0 || subj.level.includes(newLevel)
      if (!stillValid) setSubjectId('')
    }
  }

  const filteredSubjects = level
    ? subjects.filter(s => !s.level || s.level.length === 0 || s.level.includes(level))
    : subjects

  function handleSearch() {
    const p = new URLSearchParams()
    p.set('q', '1')
    if (level) p.set('level', level)
    if (subjectId) p.set('subject_id', subjectId)
    if (day) p.set('days', day)
    if (time) p.set('time', time)
    startTransition(() => router.push(`/admin/availability?${p.toString()}`))
  }

  function handleReset() {
    setDay('')
    setLevel('')
    setSubjectId('')
    setTime('')
    startTransition(() => router.push('/admin/availability'))
  }

  const hasAnyFilter = day || subjectId || level || time

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 mb-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-700">Filter Ketersediaan</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Jenjang */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">
            Jenjang <span className="text-red-500">*</span>
          </label>
          <select
            value={level}
            onChange={e => handleLevelChange(e.target.value)}
            className="w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" disabled hidden>Pilih jenjang</option>
            {LEVELS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">
            Mata Pelajaran <span className="text-red-500">*</span>
          </label>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            className="w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" disabled hidden>Pilih mata pelajaran</option>
            {filteredSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Day */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Hari</label>
          <select
            value={day}
            onChange={e => setDay(e.target.value)}
            className="w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" disabled hidden>Pilih Hari</option>
            {DAYS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Time */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Jam Mulai (opsional)</label>
          <TimePicker value={time} onChange={setTime} />
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={isPending || !level || !subjectId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
          >
            {isPending ? 'Mencari...' : 'Cek Ketersediaan'}
          </button>
          {hasAnyFilter && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
