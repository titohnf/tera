'use client'

import { useActionState, useState } from 'react'
import DatePicker from '@/components/ui/DatePicker'
import TimePicker from '@/components/ui/TimePicker'

type ClassOption = { id: string; name: string; level: string | null; profiles: { full_name: string } | null }
type TutorOption = { id: string; full_name: string }
type SubjectOption = { id: string; name: string }

interface SessionFormProps {
  action: (prevState: { error: string } | null, formData: FormData) => Promise<{ error: string } | null>
  classes: ClassOption[]
  tutors: TutorOption[]
  subjects: SubjectOption[]
  defaultValues?: {
    class_id?: string
    tutor_id?: string
    subject_id?: string | null
    date?: string
    time?: string
    duration_minutes?: number
    location?: string | null
    topic?: string | null
  }
  readonlyClass?: boolean
  cancelHref?: string
  redirectTo?: string
  showRecurrence?: boolean
  showTopic?: boolean
}

const RECURRENCE_LABELS: Record<string, string> = {
  weekly: 'Mingguan (setiap 7 hari)',
  biweekly: 'Dua Mingguan (setiap 14 hari)',
  monthly: 'Bulanan (setiap 1 bulan)',
}

export default function SessionForm({
  action,
  classes,
  tutors,
  subjects,
  defaultValues,
  readonlyClass,
  cancelHref = '/admin/sessions',
  redirectTo,
  showRecurrence = true,
  showTopic = true,
}: SessionFormProps) {
  const [state, formAction, pending] = useActionState(action, null)
  const [recurring, setRecurring] = useState(false)
  const [recurrenceCount, setRecurrenceCount] = useState(8)
  const [date, setDate] = useState(defaultValues?.date ?? '')
  const [time, setTime] = useState(defaultValues?.time ?? '')

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{state.error}</div>
      )}

      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}

      {readonlyClass && defaultValues?.class_id && (
        <input type="hidden" name="class_id" value={defaultValues.class_id} />
      )}

      {!readonlyClass && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Kelas <span className="text-red-500">*</span>
          </label>
          <select
            name="class_id"
            required
            defaultValue={defaultValues?.class_id ?? ''}
            className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Pilih kelas --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.level ? ` (${c.level})` : ''} — {c.profiles?.full_name ?? '-'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tutor <span className="text-red-500">*</span>
          </label>
          <select
            name="tutor_id"
            required
            defaultValue={defaultValues?.tutor_id ?? ''}
            className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Pilih tutor --</option>
            {tutors.map(t => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mata Pelajaran</label>
          <select
            name="subject_id"
            defaultValue={defaultValues?.subject_id ?? ''}
            className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Pilih mata pelajaran --</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tanggal <span className="text-red-500">*</span>
          </label>
          <DatePicker name="date" required value={date} onChange={setDate} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Waktu <span className="text-red-500">*</span>
          </label>
          <input type="hidden" name="time" value={time} required />
          <TimePicker value={time} onChange={setTime} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Durasi (menit)</label>
          <select
            name="duration_minutes"
            defaultValue={defaultValues?.duration_minutes ?? 90}
            className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[30, 45, 60, 90, 120, 150, 180].map(d => (
              <option key={d} value={d}>{d} menit</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi</label>
          <input
            name="location"
            type="text"
            defaultValue={defaultValues?.location ?? ''}
            placeholder="Contoh: Ruang A, Online"
            className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {showTopic && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Topik Pembelajaran</label>
          <input
            name="topic"
            type="text"
            defaultValue={defaultValues?.topic ?? ''}
            placeholder="Contoh: Persamaan linear, Fotosintesis..."
            className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {showRecurrence && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recurring}
              onChange={e => setRecurring(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Sesi berulang</span>
          </label>

          {recurring && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Pola Pengulangan</label>
                <select
                  name="recurrence_pattern"
                  defaultValue="weekly"
                  className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(RECURRENCE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Jumlah Pertemuan</label>
                <input
                  name="recurrence_count"
                  type="number"
                  min={2}
                  max={52}
                  value={recurrenceCount}
                  onChange={e => setRecurrenceCount(Number(e.target.value))}
                  className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {!recurring && <input type="hidden" name="recurrence_pattern" value="none" />}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Menyimpan...' : recurring ? `Buat ${recurrenceCount} Sesi` : 'Simpan Sesi'}
        </button>
        <a
          href={cancelHref}
          className="px-5 py-2.5 border text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Batal
        </a>
      </div>
    </form>
  )
}
