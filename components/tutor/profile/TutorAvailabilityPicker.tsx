'use client'

import { useState, useTransition } from 'react'
import { updateTutorAvailability, type AvailabilitySlot } from '@/lib/actions/tutor/availability'
import TimePicker from '@/components/ui/TimePicker'

const DAYS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
]

type DayState = {
  enabled: boolean
  start_time: string
  end_time: string
}

function buildInitialState(slots: AvailabilitySlot[]): Record<number, DayState> {
  const map: Record<number, DayState> = {}
  for (const d of DAYS) {
    const slot = slots.find(s => s.day_of_week === d.value)
    map[d.value] = slot
      ? { enabled: true, start_time: slot.start_time.slice(0, 5), end_time: slot.end_time.slice(0, 5) }
      : { enabled: false, start_time: '08:00', end_time: '17:00' }
  }
  return map
}

export default function TutorAvailabilityPicker({
  slots,
  onSave = updateTutorAvailability,
}: {
  slots: AvailabilitySlot[]
  onSave?: (slots: AvailabilitySlot[]) => Promise<{ error: string } | null>
}) {
  const [days, setDays] = useState<Record<number, DayState>>(buildInitialState(slots))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function toggleDay(day: number) {
    setSaved(false)
    setDays(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }))
  }

  function updateTime(day: number, field: 'start_time' | 'end_time', value: string) {
    setSaved(false)
    setDays(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    const slots: AvailabilitySlot[] = DAYS
      .filter(d => days[d.value].enabled)
      .map(d => ({
        day_of_week: d.value,
        start_time: days[d.value].start_time,
        end_time: days[d.value].end_time,
      }))

    startTransition(async () => {
      const result = await onSave(slots)
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  const enabledCount = DAYS.filter(d => days[d.value].enabled).length

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Ketersediaan Waktu Mengajar</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Centang hari dan atur jam yang kamu bisa mengajar setiap minggunya.
          </p>
        </div>
        <span className="text-xs text-gray-400">{enabledCount} hari aktif</span>
      </div>

      <div className="space-y-2">
        {DAYS.map(d => {
          const state = days[d.value]
          return (
            <div
              key={d.value}
              className={`rounded-lg border transition-colors ${
                state.enabled ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
                    state.enabled ? 'bg-blue-600' : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      state.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                {/* Day label */}
                <span className={`w-16 text-sm font-medium select-none ${state.enabled ? 'text-gray-900' : 'text-gray-600'}`}>
                  {d.label}
                </span>

                {/* Time inputs */}
                {state.enabled ? (
                  <div className="flex items-center gap-2">
                    <TimePicker value={state.start_time} onChange={v => updateTime(d.value, 'start_time', v)} />
                    <span className="text-xs text-gray-400">s/d</span>
                    <TimePicker value={state.end_time} onChange={v => updateTime(d.value, 'end_time', v)} />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Tidak tersedia</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Jadwal'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Tersimpan</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
