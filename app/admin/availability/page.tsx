import { createAdminClient } from '@/lib/supabase/server-admin'
import AvailabilityFilter from '@/components/admin/availability/AvailabilityFilter'

const DAY_NAMES: Record<string, string> = {
  '0': 'Minggu', '1': 'Senin', '2': 'Selasa', '3': 'Rabu',
  '4': 'Kamis', '5': 'Jumat', '6': 'Sabtu',
}

type TutorResult = {
  id: string
  full_name: string
  classSummary: string[]
  declared: string[]
  availableSchedule: { day: string; time: string }[]
  conflictDays: string[]
  unavailableDays: string[]
  freeDays: string[]
  conflictDetails: { day: string; time: string; className: string; subject: string }[]
  status: 'available' | 'partial' | 'busy'
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ subject_id?: string; days?: string; time?: string; level?: string }>
}) {
  const { subject_id, days: daysParam, time, level } = await searchParams
  const admin = createAdminClient()

  const requestedDays = daysParam?.split(',').filter(Boolean) ?? []
  const hasFilter = requestedDays.length > 0

  // Fetch subjects separately so it's always available
  const { data: subjects } = await admin
    .from('subjects')
    .select('id, name, level')
    .order('name')

  const { data: allTutors } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'tutor')
    .order('full_name')

  const { data: activeClasses } = await admin
    .from('classes')
    .select('id, tutor_id, name, class_subjects(subject_id, subjects(name, level))')
    .eq('is_active', true)

  // tutor_subjects: what tutors have declared they can teach (subject + level combos)
  const { data: tutorSubjectRows } = await admin
    .from('tutor_subjects')
    .select('tutor_id, subject_id, level, subjects(name)')

  // tutor_availability: declared weekly schedule
  const { data: tutorAvailabilityRows } = await admin
    .from('tutor_availability')
    .select('tutor_id, day_of_week, start_time, end_time')

  // Only run expensive session query if we have a filter
  let sessionRows: { tutor_id: string; scheduled_at: string; duration_minutes: number; class_name: string; subject_name: string }[] = []

  if (hasFilter) {
    const until = new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString()
    const { data: rawSessions } = await admin
      .from('sessions')
      .select('tutor_id, scheduled_at, duration_minutes, classes(name)')
      .in('status', ['scheduled', 'ongoing'])
      .gte('scheduled_at', new Date().toISOString())
      .lte('scheduled_at', until)
      .order('scheduled_at')

    sessionRows = (rawSessions ?? []).map((s: any) => ({
      tutor_id: s.tutor_id,
      scheduled_at: s.scheduled_at,
      duration_minutes: s.duration_minutes ?? 90,
      class_name: s.classes?.name ?? '—',
      subject_name: '—',
    }))
  }

  // Determine which tutors to show based on subject and/or jenjang
  // Sources: active class assignments AND tutor's own declared subjects
  let eligibleTutorIds: Set<string> | null = null
  if (subject_id || level) {
    const fromClasses = (activeClasses ?? [])
      .filter((c: any) => {
        const classSubjects: any[] = c.class_subjects ?? []
        if (subject_id && !classSubjects.some((cs: any) => cs.subject_id === subject_id)) return false
        if (level) {
          const hasLevel = classSubjects.some((cs: any) => {
            const lvls: string[] | null = cs.subjects?.level ?? null
            return !lvls || lvls.length === 0 || lvls.includes(level)
          })
          if (!hasLevel) return false
        }
        return true
      })
      .map((c: any) => c.tutor_id)

    const fromTutorSubjects = (tutorSubjectRows ?? [])
      .filter((ts: any) => {
        if (subject_id && ts.subject_id !== subject_id) return false
        if (level && ts.level && ts.level !== level) return false
        return true
      })
      .map((ts: any) => ts.tutor_id)

    eligibleTutorIds = new Set([...fromClasses, ...fromTutorSubjects])
  }

  const tutors = (allTutors ?? []).filter(t =>
    eligibleTutorIds === null || eligibleTutorIds.has(t.id)
  )

  const sessionsByTutor = new Map<string, typeof sessionRows>()
  for (const s of sessionRows) {
    if (!sessionsByTutor.has(s.tutor_id)) sessionsByTutor.set(s.tutor_id, [])
    sessionsByTutor.get(s.tutor_id)!.push(s)
  }

  const classesByTutor = new Map<string, any[]>()
  for (const c of activeClasses ?? []) {
    if (!classesByTutor.has((c as any).tutor_id)) classesByTutor.set((c as any).tutor_id, [])
    classesByTutor.get((c as any).tutor_id)!.push(c)
  }

  // Map tutor declared subjects for display (e.g. "Matematika (SMP)")
  const declaredSubjectsByTutor = new Map<string, string[]>()
  for (const ts of tutorSubjectRows ?? []) {
    const tid = (ts as any).tutor_id
    const name = (ts as any).subjects?.name
    if (!name) continue
    if (!declaredSubjectsByTutor.has(tid)) declaredSubjectsByTutor.set(tid, [])
    const label = (ts as any).level ? `${name} (${(ts as any).level})` : name
    declaredSubjectsByTutor.get(tid)!.push(label)
  }

  // Map tutor declared availability per day
  const availabilityByTutor = new Map<string, { day: string; time: string }[]>()
  for (const row of tutorAvailabilityRows ?? []) {
    const tid = (row as any).tutor_id
    const dayNum = String((row as any).day_of_week)
    const start = ((row as any).start_time as string).slice(0, 5)
    const end = ((row as any).end_time as string).slice(0, 5)
    if (!availabilityByTutor.has(tid)) availabilityByTutor.set(tid, [])
    availabilityByTutor.get(tid)!.push({ day: dayNum, time: `${start}–${end}` })
  }

  const requestedTimeMinutes = time ? parseTimeToMinutes(time) : null

  const results: TutorResult[] = tutors.map(tutor => {
    const sessions = sessionsByTutor.get(tutor.id) ?? []
    const classes = classesByTutor.get(tutor.id) ?? []
    const declared = declaredSubjectsByTutor.get(tutor.id) ?? []
    const availableSchedule = availabilityByTutor.get(tutor.id) ?? []

    const classSummary = [...new Set(classes.map((c: any) => {
      const subjectNames = (c.class_subjects ?? []).map((cs: any) => cs.subjects?.name).filter(Boolean)
      return subjectNames.length > 0 ? `${c.name} (${subjectNames.join(', ')})` : c.name
    }))]

    const declaredDaySet = new Set(availableSchedule.map(s => s.day))
    const hasDeclaredSchedule = availableSchedule.length > 0

    const conflictDays: string[] = []
    const conflictDetails: TutorResult['conflictDetails'] = []

    for (const day of requestedDays) {
      const daySessions = sessions.filter(s => {
        const d = new Date(s.scheduled_at)
        if (String(d.getDay()) !== day) return false
        if (requestedTimeMinutes !== null) {
          const start = d.getHours() * 60 + d.getMinutes()
          const end = start + s.duration_minutes
          return requestedTimeMinutes >= start && requestedTimeMinutes < end
        }
        return true
      })

      if (daySessions.length > 0) {
        conflictDays.push(day)
        for (const s of daySessions) {
          conflictDetails.push({
            day,
            time: new Date(s.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            className: s.class_name,
            subject: s.subject_name,
          })
        }
      }
    }

    const unavailableDays = hasDeclaredSchedule
      ? requestedDays.filter(d => !declaredDaySet.has(d) && !conflictDays.includes(d))
      : []

    const blockedDays = new Set([...conflictDays, ...unavailableDays])
    const freeDays = requestedDays.filter(d => !blockedDays.has(d))
    const status: TutorResult['status'] =
      blockedDays.size === 0 ? 'available'
      : blockedDays.size === requestedDays.length ? 'busy'
      : 'partial'

    return { id: tutor.id, full_name: tutor.full_name, classSummary, declared, availableSchedule, conflictDays, unavailableDays, freeDays, conflictDetails, status }
  })

  const ORDER = { available: 0, partial: 1, busy: 2 }
  if (hasFilter) results.sort((a, b) => ORDER[a.status] - ORDER[b.status])

  const availableCount = results.filter(r => r.status === 'available').length
  const partialCount = results.filter(r => r.status === 'partial').length

  // Build full schedule overview for all tutors (used when no filter)
  const allTutorSchedules = (allTutors ?? []).map(t => ({
    id: t.id,
    full_name: t.full_name,
    declared: declaredSubjectsByTutor.get(t.id) ?? [],
    schedule: availabilityByTutor.get(t.id) ?? [],
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Ketersediaan Tutor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cek tutor yang sesuai jadwal calon siswa baru</p>
      </div>

      <AvailabilityFilter
        subjects={(subjects ?? []) as { id: string; name: string; level: string[] | null }[]}
        initialDays={requestedDays}
        initialSubjectId={subject_id ?? ''}
        initialLevel={level ?? ''}
        initialTime={time ?? ''}
      />

      {hasFilter && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-2.5 text-sm">
              <span className="font-semibold text-green-700">{availableCount}</span>
              <span className="text-green-600 ml-1">tutor tersedia</span>
            </div>
            {partialCount > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-sm">
                <span className="font-semibold text-amber-700">{partialCount}</span>
                <span className="text-amber-600 ml-1">sebagian hari tersedia</span>
              </div>
            )}
            <div className="bg-gray-50 border rounded-lg px-4 py-2.5 text-sm text-gray-500">
              {level && <span className="font-medium text-blue-600 mr-2">{level}</span>}
              Hari: <span className="font-medium text-gray-700">{requestedDays.map(d => DAY_NAMES[d]).join(', ')}</span>
              {time && <span className="ml-2">· jam <span className="font-medium text-gray-700">{time}</span></span>}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-8 text-center text-sm text-gray-400">
              Tidak ada tutor yang mengajar mata pelajaran ini.
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {results.map(tutor => (
                <TutorCard key={tutor.id} tutor={tutor} requestedDays={requestedDays} />
              ))}
            </div>
          )}
        </>
      )}

      <TutorScheduleTable tutors={allTutorSchedules} />
    </div>
  )
}

function TutorCard({ tutor, requestedDays }: { tutor: TutorResult; requestedDays: string[] }) {
  const STATUS_CONFIG = {
    available: { label: 'Tersedia', color: 'bg-green-100 text-green-700', border: 'border-green-100' },
    partial: { label: 'Sebagian Tersedia', color: 'bg-amber-100 text-amber-700', border: 'border-amber-100' },
    busy: { label: 'Semua Hari Sibuk', color: 'bg-red-100 text-red-600', border: 'border-red-100' },
  }
  const cfg = STATUS_CONFIG[tutor.status]

  return (
    <div className={`bg-white border ${cfg.border} rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900">{tutor.full_name}</p>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {tutor.classSummary.length > 0 && (
        <p className="text-xs text-gray-400 mb-1">
          Kelas aktif: {tutor.classSummary.join(' · ')}
        </p>
      )}
      {tutor.declared.length > 0 && (
        <p className="text-xs text-gray-400 mb-1">
          Mapel: {tutor.declared.join(', ')}
        </p>
      )}
      {tutor.availableSchedule.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {tutor.availableSchedule.map((s, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                requestedDays.includes(s.day)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {DAY_NAMES[s.day]} {s.time}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap mt-2">
        {requestedDays.map(day => {
          const isBusy = tutor.conflictDays.includes(day)
          const isUnavailable = tutor.unavailableDays.includes(day)
          const conflicts = tutor.conflictDetails.filter(c => c.day === day)
          return (
            <div
              key={day}
              className={`rounded-lg px-3 py-2 text-xs border ${
                isBusy ? 'bg-red-50 border-red-100'
                : isUnavailable ? 'bg-gray-50 border-gray-200'
                : 'bg-green-50 border-green-100'
              }`}
            >
              <p className={`font-semibold mb-0.5 ${
                isBusy ? 'text-red-700'
                : isUnavailable ? 'text-gray-500'
                : 'text-green-700'
              }`}>
                {DAY_NAMES[day]}
              </p>
              {isBusy
                ? conflicts.map((c, i) => (
                    <p key={i} className="text-red-500">
                      Sudah ada sesi {c.time}{c.className !== '—' ? ` · ${c.className}` : ''}
                    </p>
                  ))
                : isUnavailable
                  ? <p className="text-gray-400">Tidak tersedia</p>
                  : <p className="text-green-600">Tidak ada sesi</p>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

const WEEK_DAYS = [
  { value: '1', label: 'Sen' },
  { value: '2', label: 'Sel' },
  { value: '3', label: 'Rab' },
  { value: '4', label: 'Kam' },
  { value: '5', label: 'Jum' },
  { value: '6', label: 'Sab' },
  { value: '0', label: 'Min' },
]

type TutorScheduleRow = {
  id: string
  full_name: string
  declared: string[]
  schedule: { day: string; time: string }[]
}

function TutorScheduleTable({ tutors }: { tutors: TutorScheduleRow[] }) {
  const withSchedule = tutors.filter(t => t.schedule.length > 0)
  const withoutSchedule = tutors.filter(t => t.schedule.length === 0)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-gray-50">
          <p className="text-sm font-medium text-gray-700">Jadwal Mingguan Tutor</p>
          <p className="text-xs text-gray-400 mt-0.5">Berdasarkan jadwal yang dideklarasikan tutor di profil mereka</p>
        </div>

        {withSchedule.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Belum ada tutor yang mengisi jadwal ketersediaan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500 w-48">Tutor</th>
                  {WEEK_DAYS.map(d => (
                    <th key={d.value} className="px-2 py-2.5 font-medium text-gray-500 text-center w-20">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {withSchedule.map(tutor => {
                  const schedMap = new Map(tutor.schedule.map(s => [s.day, s.time]))
                  return (
                    <tr key={tutor.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 align-top">
                        <p className="font-medium text-gray-800">{tutor.full_name}</p>
                        {tutor.declared.length > 0 && (
                          <p className="text-gray-400 mt-0.5 leading-relaxed">{tutor.declared.join(', ')}</p>
                        )}
                      </td>
                      {WEEK_DAYS.map(d => {
                        const time = schedMap.get(d.value)
                        return (
                          <td key={d.value} className="px-2 py-3 text-center align-top">
                            {time ? (
                              <span className="inline-block bg-blue-50 text-blue-700 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap">
                                {time}
                              </span>
                            ) : (
                              <span className="text-gray-200">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {withoutSchedule.length > 0 && (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Belum mengisi jadwal ({withoutSchedule.length})</p>
          <div className="flex flex-wrap gap-2">
            {withoutSchedule.map(t => (
              <span key={t.id} className="text-xs text-gray-400 bg-gray-50 border rounded px-2 py-1">{t.full_name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
