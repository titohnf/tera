'use client'

import { useActionState, useState, useMemo } from 'react'
import DatePicker from '@/components/ui/DatePicker'
import TimePicker from '@/components/ui/TimePicker'

type ClassOption = { id: string; name: string; level: string | null; profiles: { full_name: string } | null }
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
  curriculumTopics?: CurriculumTopic[]
  classGrade?: number | null
}

function detectSemester(dateStr: string): 1 | 2 {
  const month = new Date(dateStr).getMonth() + 1
  return month >= 7 ? 1 : 2
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
  curriculumTopics,
  classGrade,
}: SessionFormProps) {
  const [state, formAction, pending] = useActionState(action, null)
  const [recurring, setRecurring] = useState(false)
  const [recurrenceCount, setRecurrenceCount] = useState(8)
  const [date, setDate] = useState(defaultValues?.date ?? '')
  const [time, setTime] = useState(defaultValues?.time ?? '')
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultValues?.subject_id ?? '')
  const [selectedClassId, setSelectedClassId] = useState(defaultValues?.class_id ?? '')
  const [semester, setSemester] = useState<1 | 2>(() =>
    defaultValues?.date ? detectSemester(defaultValues.date) : detectSemester(new Date().toISOString())
  )
  const [gradeOverride, setGradeOverride] = useState<number | null>(null)
  const [topicId, setTopicId] = useState('')
  const [topicText, setTopicText] = useState(defaultValues?.topic ?? '')

  // Derive available grade numbers from curriculum topics filtered by subject+semester
  const availableGrades = useMemo(() => {
    if (!curriculumTopics || curriculumTopics.length === 0) return []
    const levels = [...new Set(
      curriculumTopics
        .filter(t =>
          t.semester === semester &&
          (!selectedSubjectId || t.subject_id === selectedSubjectId)
        )
        .map(t => t.grade_level)
    )]
    return levels
      .map(l => { const m = l.match(/\d+/); return m ? parseInt(m[0]) : null })
      .filter((g): g is number => g !== null)
      .sort((a, b) => a - b)
  }, [curriculumTopics, semester, selectedSubjectId])

  // If only one grade available, auto-use it; otherwise require explicit selection
  const effectiveGrade = useMemo(() => {
    if (classGrade !== undefined && classGrade !== null) return classGrade
    if (gradeOverride !== null) return gradeOverride
    if (availableGrades.length === 1) return availableGrades[0]
    return null
  }, [classGrade, gradeOverride, availableGrades])

  const needsGradeSelection = classGrade == null && gradeOverride == null && availableGrades.length > 1

  const filteredCurriculumTopics = useMemo(() => {
    if (!curriculumTopics || curriculumTopics.length === 0) return []
    if (needsGradeSelection) return [] // wait for grade selection
    const gradeLevelStr = effectiveGrade != null ? `Kelas ${effectiveGrade}` : null
    return curriculumTopics.filter(t =>
      t.semester === semester &&
      (!selectedSubjectId || t.subject_id === selectedSubjectId) &&
      (!gradeLevelStr || t.grade_level === gradeLevelStr)
    )
  }, [curriculumTopics, semester, selectedSubjectId, effectiveGrade, needsGradeSelection])

  const groupedTopics = useMemo(() => {
    return filteredCurriculumTopics.reduce<Record<string, CurriculumTopic[]>>((acc, t) => {
      const key = t.theme ?? '(Tanpa Tema)'
      if (!acc[key]) acc[key] = []
      acc[key].push(t)
      return acc
    }, {})
  }, [filteredCurriculumTopics])

  const hasCurriculumTopics = (curriculumTopics?.length ?? 0) > 0

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
            value={selectedClassId}
            onChange={e => { setSelectedClassId(e.target.value); setGradeOverride(null); setTopicId(''); setTopicText('') }}
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
            value={selectedSubjectId}
            onChange={e => { setSelectedSubjectId(e.target.value); setTopicId(''); setTopicText('') }}
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
          <DatePicker name="date" required value={date} onChange={v => { setDate(v); setSemester(detectSemester(v)) }} />
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
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Topik Pembelajaran</label>

          {hasCurriculumTopics && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
              {/* Semester pills */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0">Semester:</span>
                {([1, 2] as const).map(s => (
                  <button key={s} type="button" onClick={() => { setSemester(s); setTopicId(''); setTopicText('') }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      semester === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50'
                    }`}
                  >
                    Semester {s}
                  </button>
                ))}
                {date && (
                  <span className="text-xs text-gray-400 ml-1">— otomatis dari tanggal</span>
                )}
              </div>

              {/* Grade pills — shown when classGrade not auto-determined and multiple grades available */}
              {classGrade == null && availableGrades.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 shrink-0">Kelas:</span>
                  {availableGrades.map(g => (
                    <button key={g} type="button"
                      onClick={() => { setGradeOverride(gradeOverride === g ? null : g); setTopicId(''); setTopicText('') }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        gradeOverride === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50'
                      }`}
                    >
                      Kelas {g}
                    </button>
                  ))}
                </div>
              )}

              {needsGradeSelection && (
                <p className="text-xs text-amber-600 font-medium">Pilih kelas terlebih dahulu untuk melihat topik</p>
              )}

              {classGrade != null && (
                <p className="text-xs text-blue-700 font-medium">
                  Kelas {classGrade} — otomatis dari data siswa
                </p>
              )}

              {classGrade == null && availableGrades.length === 1 && (
                <p className="text-xs text-blue-700 font-medium">
                  Kelas {availableGrades[0]} — otomatis dari kurikulum
                </p>
              )}

              {/* Topics dropdown */}
              {!needsGradeSelection && (
                <div>
                  <select
                    value={topicId}
                    onChange={e => {
                      const id = e.target.value
                      setTopicId(id)
                      const found = filteredCurriculumTopics.find(t => t.id === id)
                      setTopicText(found?.topic ?? '')
                    }}
                    className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Pilih topik dari kurikulum —</option>
                    {Object.entries(groupedTopics).map(([theme, items]) => (
                      <optgroup key={theme} label={theme}>
                        {items.filter(t => t.topic).map(t => (
                          <option key={t.id} value={t.id}>{t.topic}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {filteredCurriculumTopics.filter(t => t.topic).length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Belum ada topik kurikulum untuk pilihan ini —{' '}
                      <a href="/admin/curriculum" className="text-blue-600 hover:underline">kelola kurikulum</a>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Custom topic text */}
          <div>
            {hasCurriculumTopics && (
              <label className="block text-xs text-gray-500 mb-1">
                {topicId ? 'Atau tulis topik kustom:' : 'Atau ketik topik bebas:'}
              </label>
            )}
            <input
              name="topic"
              type="text"
              value={topicText}
              onChange={e => { setTopicText(e.target.value); setTopicId('') }}
              placeholder="Contoh: Persamaan linear, Fotosintesis..."
              className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <input type="hidden" name="curriculum_topic_id" value={topicId} />
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
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
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
