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

  const [selectedDays, setSelectedDays] = useState<string[]>(initialDays)
  const [level, setLevel] = useState(initialLevel)
  const [subjectId, setSubjectId] = useState(initialSubjectId)
  const [time, setTime] = useState(initialTime)

  // When jenjang changes, reset subject if it no longer belongs to this jenjang
  function handleLevelChange(val: string) {
    const newLevel = val === level ? '' : val
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

  function toggleDay(val: string) {
    setSelectedDays(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    )
  }

  function handleSearch() {
    const p = new URLSearchParams()
    if (level) p.set('level', level)
    if (subjectId) p.set('subject_id', subjectId)
    if (selectedDays.length > 0) p.set('days', selectedDays.join(','))
    if (time) p.set('time', time)
    startTransition(() => router.push(`/admin/availability?${p.toString()}`))
  }

  function handleReset() {
    setSelectedDays([])
    setLevel('')
    setSubjectId('')
    setTime('')
    startTransition(() => router.push('/admin/availability'))
  }

  const hasAnyFilter = selectedDays.length > 0 || subjectId || level || time

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 mb-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">Filter Ketersediaan</h2>

      {/* Jenjang pills */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Jenjang</p>
        <div className="flex gap-2 flex-wrap">
          {LEVELS.map(l => (
            <button
              key={l}
              type="button"
              onClick={() => handleLevelChange(l)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                level === l
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Subject */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Mata Pelajaran</label>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            className="w-full pl-3 pr-9 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Semua mata pelajaran</option>
            {filteredSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Time */}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Jam Mulai (opsional)</label>
          <TimePicker value={time} onChange={setTime} />
          <p className="text-xs text-gray-400 mt-1">Cek bentrokan di jam ini</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col justify-end gap-2">
          <button
            onClick={handleSearch}
            disabled={isPending || selectedDays.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Mencari...' : 'Cek Ketersediaan'}
          </button>
          {hasAnyFilter && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Days */}
      <div>
        <p className="text-xs text-gray-500 mb-2">
          Hari yang Dibutuhkan <span className="text-red-500">*</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(d => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDay(d.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedDays.includes(d.value)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        {selectedDays.length === 0 && (
          <p className="text-xs text-gray-400 mt-1.5">Pilih minimal satu hari</p>
        )}
      </div>
    </div>
  )
}
