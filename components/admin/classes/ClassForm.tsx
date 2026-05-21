'use client'

import { useActionState, useState, useMemo, useEffect, useRef } from 'react'
import type { ActionState } from '@/lib/actions/admin/classes'
import DatePicker from '@/components/ui/DatePicker'
import TimePicker from '@/components/ui/TimePicker'

const DAY_NAMES: Record<number, string> = {
  1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 0: 'Minggu',
}
const DAYS = [1, 2, 3, 4, 5, 6, 0]
const JENJANG_OPTIONS = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum'] as const
const FOKUS_OPTIONS = ['TKA/US', 'UTBK', 'OSN'] as const

export type TutorWithMeta = {
  id: string
  full_name: string
  subjects: { subjectId: string; level: string }[]
  availability: { day_of_week: number; start_time: string; end_time: string }[]
}

type Student = { id: string; full_name: string; level: string | null; grade: number | null }
type Subject = { id: string; name: string }

type SlotState = {
  subjectId: string | null
  day: number | null
  time: string
  tutorId: string
}

type SlotDefault = { subjectId: string | null; day: number | null; time: string; tutorId: string }

type DefaultValues = {
  name?: string
  level?: string | null
  class_type?: string | null
  is_active?: boolean
  slots?: SlotDefault[]
  start_date?: string | null
  end_date?: string | null
  duration_minutes?: number | null
}

interface ClassFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  tutors: TutorWithMeta[]
  subjects: Subject[]
  students?: Student[]
  defaultValues?: DefaultValues
  showActiveToggle?: boolean
  showStudentPicker?: boolean
  enrolledCount?: number
  enrolledLevels?: (string | null)[]
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

function buildClassName(classType: string, jenjang: string, jenis: string, fokusTypes: string[], namaUnik: string) {
  const tipeLabel = classType === 'group' ? 'Grup' : classType === 'private' ? 'Privat' : ''
  const jenisLabel = jenis === 'reguler' ? 'Reguler'
    : jenis === 'fokus' ? (fokusTypes.length > 0 ? `Fokus ${fokusTypes.join('/')}` : 'Fokus')
    : ''
  return [tipeLabel, jenjang, jenisLabel, namaUnik].filter(Boolean).join(' ')
}

function emptySlot(): SlotState {
  return { subjectId: null, day: null, time: '', tutorId: '' }
}

// Returns true if tutor can teach the given subject at the given jenjang
function tutorMatchesSubjectLevel(
  tutorSubjects: { subjectId: string; level: string }[],
  subjectId: string,
  jenjang: string,
): boolean {
  // No level restriction for Umum or unset jenjang — only check subject
  if (!jenjang || jenjang === 'Umum') {
    return tutorSubjects.some(s => s.subjectId === subjectId)
  }
  // Calistung isn't a tutor_subjects level — map to SD
  const target = jenjang === 'Calistung' ? 'SD' : jenjang
  return tutorSubjects.some(
    s => s.subjectId === subjectId && (s.level === target || s.level === 'Umum' || s.level === '')
  )
}

// ── Slot sub-component ──
function SlotSegment({
  index, slot, subjects, tutors, jenjang, onChange,
}: {
  index: number
  slot: SlotState
  subjects: Subject[]
  tutors: TutorWithMeta[]
  jenjang: string
  onChange: (s: SlotState) => void
}) {
  const [subjectSearch, setSubjectSearch] = useState('')
  const [subjectOpen, setSubjectOpen] = useState(false)
  const subjectRef = useRef<HTMLDivElement>(null)
  const [dayOpen, setDayOpen] = useState(false)
  const dayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (subjectRef.current && !subjectRef.current.contains(e.target as Node)) setSubjectOpen(false)
      if (dayRef.current && !dayRef.current.contains(e.target as Node)) setDayOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch) return subjects
    const q = subjectSearch.toLowerCase()
    return subjects.filter(s => s.name.toLowerCase().includes(q))
  }, [subjects, subjectSearch])

  const availableTutors = useMemo(() => {
    return tutors.filter(t => {
      if (slot.subjectId && !tutorMatchesSubjectLevel(t.subjects, slot.subjectId, jenjang)) return false
      if (slot.day !== null) {
        const avail = t.availability.find(a => a.day_of_week === slot.day)
        if (!avail) return false
        if (slot.time) {
          const req = parseTimeToMinutes(slot.time)
          if (req < parseTimeToMinutes(avail.start_time.slice(0, 5)) ||
              req >= parseTimeToMinutes(avail.end_time.slice(0, 5))) return false
        }
      }
      return true
    })
  }, [tutors, slot.subjectId, slot.day, slot.time, jenjang])

  const selectedSubjectName = subjects.find(s => s.id === slot.subjectId)?.name

  return (
    <div className="rounded-xl shadow ring-1 ring-gray-900/5">
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center gap-2 rounded-t-xl">
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <span className="text-sm font-semibold text-blue-800">Sesi {index + 1}</span>
        {selectedSubjectName && (
          <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {selectedSubjectName}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4 bg-white rounded-b-xl">
        {/* Subject — single select */}
        <div ref={subjectRef} className="relative">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Mata Pelajaran <span className="text-red-500">*</span>
          </label>
          <button type="button"
            onClick={() => setSubjectOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-left"
          >
            <span className={selectedSubjectName ? 'text-gray-900' : 'text-gray-400'}>
              {selectedSubjectName ?? 'Pilih mata pelajaran...'}
            </span>
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {subjectOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden">
              <div className="p-2 border-b border-slate-300">
                <input type="text" autoFocus
                  placeholder="Cari mata pelajaran..."
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="divide-y divide-slate-300 max-h-40 overflow-y-auto">
                {filteredSubjects.length === 0
                  ? <p className="px-3 py-3 text-sm text-gray-400">Tidak ditemukan</p>
                  : filteredSubjects.map(s => {
                    const selected = slot.subjectId === s.id
                    return (
                      <div key={s.id}
                        onClick={() => { onChange({ ...slot, subjectId: selected ? null : s.id, tutorId: '' }); setSubjectOpen(false); setSubjectSearch('') }}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-blue-50/50'}`}
                      >
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                          {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className={`text-sm ${selected ? 'text-blue-700 font-medium' : 'text-gray-800'}`}>{s.name}</span>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          )}
          {!slot.subjectId && !subjectOpen && <p className="text-xs text-red-500 mt-1">Wajib pilih mata pelajaran</p>}
        </div>

        {/* Day + Time */}
        <div className="flex gap-3">
          {/* Hari dropdown */}
          <div ref={dayRef} className="relative flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Hari</label>
            <button type="button"
              onClick={() => setDayOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-left"
            >
              <span className={slot.day !== null ? 'text-gray-900' : 'text-gray-400'}>
                {slot.day !== null ? DAY_NAMES[slot.day] : 'Pilih hari...'}
              </span>
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {dayOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden">
                <div className="divide-y divide-slate-300">
                  {DAYS.map(day => (
                    <div key={day}
                      onClick={() => { onChange({ ...slot, day: slot.day === day ? null : day, tutorId: '' }); setDayOpen(false) }}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${slot.day === day ? 'bg-blue-50' : 'hover:bg-blue-50/50'}`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${slot.day === day ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {slot.day === day && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className={`text-sm ${slot.day === day ? 'text-blue-700 font-medium' : 'text-gray-800'}`}>{DAY_NAMES[day]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Jam */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Jam</label>
            <TimePicker
              value={slot.time}
              onChange={t => onChange({ ...slot, time: t, tutorId: '' })}
            />
          </div>
        </div>

        {/* Tutor — filtered list */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Tutor
            {(slot.subjectId || slot.day !== null) && (
              <span className="ml-1 normal-case font-normal text-gray-400">
                — {availableTutors.length} tersedia
              </span>
            )}
          </label>
          {availableTutors.length === 0 ? (
            <div className="border border-slate-300 rounded-lg px-4 py-3 text-sm text-gray-400 bg-gray-50">
              {!slot.subjectId && slot.day === null
                ? 'Pilih mata pelajaran dan jadwal terlebih dahulu'
                : 'Tidak ada tutor yang tersedia untuk pilihan ini'}
            </div>
          ) : (
            <div className="border border-slate-300 rounded-lg divide-y divide-slate-300 max-h-44 overflow-y-auto">
              {availableTutors.map(t => {
                const isSelected = slot.tutorId === t.id
                return (
                  <label key={t.id}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : 'bg-white hover:bg-blue-50/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`tutor-slot-${index}`}
                      checked={isSelected}
                      onChange={() => onChange({ ...slot, tutorId: t.id })}
                      className="shrink-0"
                    />
                    <p className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                      {t.full_name}
                    </p>
                  </label>
                )
              })}
            </div>
          )}
          {slot.tutorId && !availableTutors.find(t => t.id === slot.tutorId) && (
            <p className="text-xs text-amber-600 mt-1">Tutor sebelumnya tidak lagi tersedia, pilih ulang</p>
          )}
          {!slot.tutorId && availableTutors.length > 0 && (
            <p className="text-xs text-red-500 mt-1">Wajib pilih tutor untuk sesi ini</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main form ──
export default function ClassForm({
  action, tutors, subjects, students, defaultValues, showActiveToggle, showStudentPicker, enrolledCount, enrolledLevels,
}: ClassFormProps) {
  const [state, formAction, pending] = useActionState(action, null)

  // Name builder
  const [classType, setClassType] = useState(defaultValues?.class_type ?? '')
  const [jenjang, setJenjang] = useState(defaultValues?.level ?? '')
  const [jenis, setJenis] = useState<'reguler' | 'fokus' | ''>('')
  const [fokusTypes, setFokusTypes] = useState<string[]>([])
  const [namaUnik, setNamaUnik] = useState('')
  const [className, setClassName] = useState(defaultValues?.name ?? '')
  const nameManuallyEdited = useRef(!!defaultValues?.name)

  useEffect(() => {
    if (nameManuallyEdited.current) return
    if (!classType && !jenjang && !jenis) return
    setClassName(buildClassName(classType, jenjang, jenis, fokusTypes, namaUnik))
  }, [classType, jenjang, jenis, fokusTypes, namaUnik])

  function toggleFokus(type: string) {
    setFokusTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  // Dates & duration
  const [startDate, setStartDate] = useState(defaultValues?.start_date ?? '')
  const [endDate, setEndDate] = useState(defaultValues?.end_date ?? '')
  const [durationMinutes, setDurationMinutes] = useState(defaultValues?.duration_minutes ?? 90)

  // Slots
  const defaultSlots: SlotState[] = (defaultValues?.slots ?? []).map(s => ({
    subjectId: s.subjectId,
    day: s.day,
    time: s.time,
    tutorId: s.tutorId,
  }))
  const [slotCount, setSlotCount] = useState(defaultSlots.length)
  const [slots, setSlots] = useState<SlotState[]>(defaultSlots)

  function changeSlotCount(n: number) {
    setSlotCount(n)
    setSlots(prev => {
      if (n > prev.length) return [...prev, ...Array.from({ length: n - prev.length }, emptySlot)]
      return prev.slice(0, n)
    })
  }

  function updateSlot(i: number, s: SlotState) {
    setSlots(prev => prev.map((old, idx) => idx === i ? s : old))
  }

  // Students
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [studentSearch, setStudentSearch] = useState('')

  function toggleStudent(id: string) {
    setSelectedStudentIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students ?? []
    const q = studentSearch.toLowerCase()
    return (students ?? []).filter(s => s.full_name.toLowerCase().includes(q))
  }, [students, studentSearch])

  // Effective count & levels — from picker when showStudentPicker, else from props
  const effectiveCount = showStudentPicker
    ? selectedStudentIds.size
    : (enrolledCount ?? 0)

  const effectiveLevels = useMemo(() => {
    if (showStudentPicker) {
      return (students ?? [])
        .filter(s => selectedStudentIds.has(s.id))
        .map(s => s.level)
    }
    return enrolledLevels ?? []
  }, [showStudentPicker, students, selectedStudentIds, enrolledLevels])

  const suggestedLevel = useMemo(() => {
    const nonNull = effectiveLevels.filter((l): l is string => !!l)
    if (nonNull.length === 0) return null
    const unique = [...new Set(nonNull)]
    return unique.length === 1 ? unique[0] : null
  }, [effectiveLevels])

  // Auto-select jenjang and tipe kelas reactively from student selection
  useEffect(() => {
    if (!defaultValues?.level) {
      setJenjang(suggestedLevel ?? '')
    }
  }, [suggestedLevel]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (effectiveCount === 1) {
      setClassType('private')
      nameManuallyEdited.current = false
    } else if (effectiveCount > 1) {
      setClassType('group')
      nameManuallyEdited.current = false
    }
  }, [effectiveCount])

  // Auto-fill nama unik from selected students (first 3 chars, capitalized)
  useEffect(() => {
    if (!showStudentPicker || !students) return
    const selected = students.filter(s => selectedStudentIds.has(s.id))
    if (selected.length === 0) return
    const generated = selected
      .map(s => {
        const part = s.full_name.slice(0, 3)
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      })
      .join('')
    setNamaUnik(generated)
    nameManuallyEdited.current = false
  }, [selectedStudentIds, students, showStudentPicker])

  const slotsJson = JSON.stringify(slots.map(s => ({
    subjectId: s.subjectId,
    day: s.day,
    time: s.time,
    tutorId: s.tutorId,
  })))

  const canSubmit = slotCount > 0 && slots.every(s => s.tutorId && s.subjectId) && !!startDate && !!endDate && endDate >= startDate

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slots_json" value={slotsJson} />
      {Array.from(selectedStudentIds).map(id => <input key={id} type="hidden" name="student_ids" value={id} />)}

      {state?.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* ── Student picker ── */}
      {showStudentPicker && students && (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Siswa{selectedStudentIds.size > 0 && <span className="ml-1.5 normal-case font-normal text-blue-600">({selectedStudentIds.size} dipilih)</span>}
          </p>
          <input type="text" placeholder="Cari nama siswa..."
            value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
            className="w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="border border-slate-300 rounded-lg divide-y divide-slate-300 max-h-52 overflow-y-auto bg-white">
            {filteredStudents.length === 0
              ? <p className="px-4 py-3 text-sm text-gray-400">Tidak ada siswa.</p>
              : filteredStudents.map(s => {
                const levelLabel = [s.level, s.grade ? `Kelas ${s.grade}` : null].filter(Boolean).join(' · ')
                return (
                  <label key={s.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                    selectedStudentIds.has(s.id) ? 'bg-blue-50' : 'hover:bg-blue-50/50'
                  }`}>
                    <input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => toggleStudent(s.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 shrink-0"
                    />
                    <div>
                      <p className={`text-sm font-medium ${selectedStudentIds.has(s.id) ? 'text-blue-700' : 'text-gray-800'}`}>{s.full_name}</p>
                      {levelLabel
                        ? <p className="text-xs text-gray-400">{levelLabel}</p>
                        : <p className="text-xs text-gray-300 italic">Jenjang belum diisi</p>
                      }
                    </div>
                  </label>
                )
              })
            }
          </div>
        </div>
      )}

      {/* ── Name builder ── */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Identitas Kelas</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Kelas</label>
          <div className="flex gap-2">
            {([{ val: 'group', label: 'Grup' }, { val: 'private', label: 'Privat' }] as const).map(opt => {
              const disabled = effectiveCount > 0 && (
                (opt.val === 'group' && effectiveCount === 1) ||
                (opt.val === 'private' && effectiveCount > 1)
              )
              return (
                <button key={opt.val} type="button"
                  disabled={disabled}
                  onClick={() => { if (!disabled) { setClassType(opt.val); nameManuallyEdited.current = false } }}
                  title={
                    disabled && opt.val === 'group' ? 'Kelas grup membutuhkan lebih dari 1 siswa'
                    : disabled && opt.val === 'private' ? 'Kelas privat hanya untuk 1 siswa'
                    : undefined
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    classType === opt.val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : disabled
                      ? 'bg-gray-50 text-gray-300 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
                  }`}
                >{opt.label}</button>
              )
            })}
          </div>
          {effectiveCount === 1 && (
            <p className="text-xs text-gray-400 mt-1">1 siswa dipilih — hanya tipe Privat yang tersedia</p>
          )}
          {effectiveCount > 1 && (
            <p className="text-xs text-gray-400 mt-1">{effectiveCount} siswa dipilih — hanya tipe Grup yang tersedia</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Jenjang</label>
          <div className="flex flex-wrap gap-2">
            {JENJANG_OPTIONS.map(j => {
              const locked = !!suggestedLevel && j !== suggestedLevel
              return (
                <button key={j} type="button"
                  disabled={locked}
                  onClick={() => { if (!locked) { setJenjang(j); nameManuallyEdited.current = false } }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    jenjang === j
                      ? 'bg-blue-600 text-white border-blue-600'
                      : locked
                      ? 'bg-gray-50 text-gray-300 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
                  }`}
                >{j}</button>
              )
            })}
          </div>
          {suggestedLevel && (
            <p className="text-xs text-gray-400 mt-1">Diisi otomatis dari jenjang siswa terdaftar</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Jenis</label>
          <div className="flex gap-2">
            {[{ val: 'reguler' as const, label: 'Reguler' }, { val: 'fokus' as const, label: 'Fokus' }].map(opt => (
              <button key={opt.val} type="button"
                onClick={() => { setJenis(opt.val); nameManuallyEdited.current = false }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  jenis === opt.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
                }`}
              >{opt.label}</button>
            ))}
          </div>
          {jenis === 'fokus' && (
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {FOKUS_OPTIONS.map(f => (
                <label key={f} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                  fokusTypes.includes(f) ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-300 text-gray-600 hover:bg-blue-50/50'
                }`}>
                  <input type="checkbox" className="sr-only" checked={fokusTypes.includes(f)}
                    onChange={() => { toggleFokus(f); nameManuallyEdited.current = false }}
                  />
                  {f}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nama Unik <span className="text-gray-400 font-normal text-xs">(singkatan nama siswa)</span>
          </label>
          <input type="text" value={namaUnik}
            onChange={e => { setNamaUnik(e.target.value); nameManuallyEdited.current = false }}
            placeholder="mis. AulRas, BudSan"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="pt-1 border-t border-slate-300">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nama Kelas <span className="text-red-500">*</span>
            <span className="ml-2 text-xs font-normal text-gray-400">— bisa diedit manual</span>
          </label>
          <input name="name" required value={className}
            onChange={e => { setClassName(e.target.value); nameManuallyEdited.current = true }}
            placeholder="Otomatis diisi dari pilihan di atas"
            className="w-full pl-3 pr-9 py-2.5 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {nameManuallyEdited.current && (
            <button type="button"
              onClick={() => { nameManuallyEdited.current = false; setClassName(buildClassName(classType, jenjang, jenis, fokusTypes, namaUnik)) }}
              className="text-xs text-gray-400 hover:text-blue-600 mt-1 transition-colors"
            >↺ Reset ke nama otomatis</button>
          )}
        </div>
      </div>

      <input type="hidden" name="level" value={jenjang || (defaultValues?.level ?? '')} />
      <input type="hidden" name="class_type" value={classType} />

      {/* ── Pertemuan per minggu ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pertemuan per Minggu <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => changeSlotCount(n)}
              className={`w-12 h-12 rounded-xl text-sm font-bold border transition-colors ${
                slotCount === n
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
              }`}
            >{n}×</button>
          ))}
        </div>
      </div>

      {/* ── Slot segments ── */}
      {slots.length > 0 && (
        <div className="space-y-4">
          {slots.map((slot, i) => (
            <SlotSegment key={i} index={i} slot={slot} subjects={subjects} tutors={tutors}
              jenjang={jenjang}
              onChange={s => updateSlot(i, s)}
            />
          ))}
        </div>
      )}

      {/* ── Tanggal & Durasi ── */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Periode & Durasi Kelas</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tanggal Kelas Pertama <span className="text-red-500">*</span>
            </label>
            <DatePicker name="start_date" required value={startDate} onChange={v => {
              setStartDate(v)
              if (endDate && v > endDate) setEndDate('')
            }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tanggal Kelas Terakhir <span className="text-red-500">*</span>
            </label>
            <DatePicker name="end_date" required value={endDate} onChange={setEndDate} min={startDate || undefined} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Durasi per Sesi (menit)</label>
          <div className="flex gap-2">
            {[60, 90, 120, 150].map(d => (
              <button key={d} type="button" onClick={() => setDurationMinutes(d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  durationMinutes === d
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-slate-300 hover:bg-blue-50/50'
                }`}
              >{d}</button>
            ))}
          </div>
          <input type="hidden" name="duration_minutes" value={durationMinutes} />
        </div>
        {startDate && endDate && slots.length > 0 && (
          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            Jadwal akan otomatis di-generate dari <strong>{startDate}</strong> sampai <strong>{endDate}</strong>.
          </div>
        )}
      </div>

      {/* ── Active toggle ── */}
      {showActiveToggle && (
        <div className="flex items-center gap-3">
          <input name="is_active" type="checkbox" id="is_active"
            defaultChecked={defaultValues?.is_active ?? true}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Kelas aktif</label>
        </div>
      )}


      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending || !canSubmit}
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Menyimpan...' : 'Simpan Kelas'}
        </button>
        <a href="/admin/classes" className="px-5 py-2.5 border text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Batal
        </a>
      </div>
    </form>
  )
}
