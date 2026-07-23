import Image from 'next/image'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server-admin'
import AvailabilityFilter from '@/components/admin/availability/AvailabilityFilter'

const DAY_NAMES: Record<string, string> = {
  '0': 'Minggu', '1': 'Senin', '2': 'Selasa', '3': 'Rabu',
  '4': 'Kamis', '5': 'Jumat', '6': 'Sabtu',
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

function Avatar({ name, avatarUrl, size = 40 }: { name: string | null; avatarUrl: string | null; size?: number }) {
  return (
    <div
      className="rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name ?? ''} width={size} height={size} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-semibold text-blue-700">{getInitials(name)}</span>
      )}
    </div>
  )
}

type TutorResult = {
  id: string
  full_name: string
  avatar_url: string | null
  classSummary: string[]
  declared: string[]
  availableSchedule: { day: string; time: string; startMin: number; endMin: number }[]
  outcome: 'match' | 'time_mismatch' | 'excluded'
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ subject_id?: string; days?: string; time?: string; level?: string; q?: string }>
}) {
  const { subject_id, days: daysParam, time, level, q } = await searchParams
  const admin = createAdminClient()

  const requestedDays = daysParam?.split(',').filter(Boolean) ?? []
  const hasFilter = q === '1'

  // Fetch subjects separately so it's always available
  const { data: subjects } = await admin
    .from('subjects')
    .select('id, name, level')
    .order('name')

  const { data: allTutors } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('role', 'tutor')
    .order('full_name')

  const { data: activeClasses } = await admin
    .from('classes')
    .select('id, tutor_id, name, class_subjects(subject_id, subjects(name, level))')
    .eq('is_active', true)

  // class_slots: per-slot tutor + subject assignment, including rotating tutors (tutor_ids) —
  // a class can rotate multiple subjects across slots, each taught by a different tutor,
  // so eligibility must be scoped to the specific subject(s) a tutor actually teaches in that class
  const { data: classSlotRows } = await admin
    .from('class_slots')
    .select('class_id, tutor_id, tutor_ids, subject_ids')

  const subjectsById = new Map((subjects ?? []).map(s => [s.id, s]))
  const classIdsByTutor = new Map<string, Set<string>>()
  const subjectIdsByTutor = new Map<string, Set<string>>()

  function addTaughtClass(tutorId: string | null | undefined, classId: string) {
    if (!tutorId) return
    if (!classIdsByTutor.has(tutorId)) classIdsByTutor.set(tutorId, new Set())
    classIdsByTutor.get(tutorId)!.add(classId)
  }
  function addTaughtSubjects(tutorId: string | null | undefined, subjectIds: string[]) {
    if (!tutorId) return
    if (!subjectIdsByTutor.has(tutorId)) subjectIdsByTutor.set(tutorId, new Set())
    for (const sid of subjectIds) subjectIdsByTutor.get(tutorId)!.add(sid)
  }

  const classIdsWithSlots = new Set((classSlotRows ?? []).map((s: any) => s.class_id))
  for (const c of activeClasses ?? []) {
    addTaughtClass((c as any).tutor_id, c.id)
    // Fallback for classes with no slot rows: attribute all of the class's subjects to its tutor_id
    if (!classIdsWithSlots.has(c.id)) {
      addTaughtSubjects((c as any).tutor_id, ((c as any).class_subjects ?? []).map((cs: any) => cs.subject_id))
    }
  }
  for (const slot of classSlotRows ?? []) {
    // tutor_ids[i] teaches subject_ids[i] — index-paired, not a cross product
    const tutorIds: (string | null)[] = ((slot as any).tutor_ids ?? []).length > 0
      ? (slot as any).tutor_ids
      : [(slot as any).tutor_id]
    const subjectIds: string[] = (slot as any).subject_ids ?? []
    tutorIds.forEach((tid, i) => {
      if (!tid) return
      addTaughtClass(tid, (slot as any).class_id)
      addTaughtSubjects(tid, subjectIds[i] ? [subjectIds[i]] : subjectIds)
    })
  }
  const activeClassesById = new Map((activeClasses ?? []).map((c: any) => [c.id, c]))

  // tutor_subjects: what tutors have declared they can teach (subject + level combos)
  const { data: tutorSubjectRows } = await admin
    .from('tutor_subjects')
    .select('tutor_id, subject_id, level, subjects(name)')

  // tutor_availability: declared weekly schedule
  const { data: tutorAvailabilityRows } = await admin
    .from('tutor_availability')
    .select('tutor_id, day_of_week, start_time, end_time')

  // Only run expensive session query if we have a filter with at least one day selected
  let sessionRows: { tutor_id: string; scheduled_at: string; duration_minutes: number; class_name: string; subject_name: string }[] = []

  if (hasFilter && requestedDays.length > 0) {
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
    const fromClasses: string[] = []
    for (const [tutorId, subjectIds] of subjectIdsByTutor) {
      const matches = [...subjectIds].some(sid => {
        if (subject_id && sid !== subject_id) return false
        if (level) {
          const lvls = subjectsById.get(sid)?.level ?? null
          if (lvls && lvls.length > 0 && !lvls.includes(level)) return false
        }
        return true
      })
      if (matches) fromClasses.push(tutorId)
    }

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
  for (const [tutorId, classIds] of classIdsByTutor) {
    classesByTutor.set(tutorId, [...classIds].map(id => activeClassesById.get(id)).filter(Boolean))
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
  const availabilityByTutor = new Map<string, { day: string; time: string; startMin: number; endMin: number }[]>()
  for (const row of tutorAvailabilityRows ?? []) {
    const tid = (row as any).tutor_id
    const dayNum = String((row as any).day_of_week)
    const start = ((row as any).start_time as string).slice(0, 5)
    const end = ((row as any).end_time as string).slice(0, 5)
    if (!availabilityByTutor.has(tid)) availabilityByTutor.set(tid, [])
    availabilityByTutor.get(tid)!.push({ day: dayNum, time: `${start}–${end}`, startMin: parseTimeToMinutes(start), endMin: parseTimeToMinutes(end) })
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

    let hasConflict = false
    let hasDayMismatch = false
    let hasTimeMismatch = false

    for (const day of requestedDays) {
      const hasSessionConflict = requestedTimeMinutes === null ? false : sessions.some(s => {
        const d = new Date(s.scheduled_at)
        if (String(d.getDay()) !== day) return false
        const start = d.getHours() * 60 + d.getMinutes()
        const end = start + s.duration_minutes
        return requestedTimeMinutes >= start && requestedTimeMinutes < end
      })

      if (hasSessionConflict) {
        hasConflict = true
        continue
      }

      if (!hasDeclaredSchedule) continue // unknown schedule: treat as no mismatch

      if (!declaredDaySet.has(day)) {
        hasDayMismatch = true
        continue
      }

      if (requestedTimeMinutes !== null) {
        const windows = availableSchedule.filter(s => s.day === day)
        const withinWindow = windows.some(w => requestedTimeMinutes >= w.startMin && requestedTimeMinutes < w.endMin)
        if (!withinWindow) hasTimeMismatch = true
      }
    }

    const outcome: TutorResult['outcome'] =
      hasConflict || hasDayMismatch ? 'excluded'
      : hasTimeMismatch ? 'time_mismatch'
      : 'match'

    return { id: tutor.id, full_name: tutor.full_name, avatar_url: tutor.avatar_url ?? null, classSummary, declared, availableSchedule, outcome }
  })

  const matchResults = results.filter(r => r.outcome === 'match')
  const timeMismatchResults = results.filter(r => r.outcome === 'time_mismatch')
  const byFewestActiveClasses = (a: TutorResult, b: TutorResult) =>
    a.classSummary.length - b.classSummary.length || a.full_name.localeCompare(b.full_name)
  matchResults.sort(byFewestActiveClasses)
  timeMismatchResults.sort(byFewestActiveClasses)

  const availableCount = matchResults.length
  const subjectName = subject_id ? (subjects ?? []).find(s => s.id === subject_id)?.name ?? null : null

  // Build full schedule overview for all tutors (used when no filter)
  const allTutorSchedules = (allTutors ?? []).map(t => ({
    id: t.id,
    full_name: t.full_name,
    avatar_url: t.avatar_url ?? null,
    declared: declaredSubjectsByTutor.get(t.id) ?? [],
    schedule: availabilityByTutor.get(t.id) ?? [],
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Ketersediaan Tutor</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cek tutor yang sesuai jadwal calon siswa baru</p>
      </div>

      <div className="max-w-2xl">
        <AvailabilityFilter
          subjects={(subjects ?? []) as { id: string; name: string; level: string[] | null }[]}
          initialDays={requestedDays}
          initialSubjectId={subject_id ?? ''}
          initialLevel={level ?? ''}
          initialTime={time ?? ''}
        />

        {hasFilter && (
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 mb-8 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-gray-700">Hasil Pencarian</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {level && <>{level} · </>}
                  {subjectName && <>{subjectName} · </>}
                  {requestedDays.length > 0 ? <>Hari {requestedDays.map(d => DAY_NAMES[d]).join(', ')}</> : 'Semua Hari'}
                  {time && <> · jam {time}</>}
                </p>
              </div>
              <span className="inline-flex items-center text-sm font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1 whitespace-nowrap">
                {availableCount} tutor tersedia
              </span>
            </div>

            {results.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400">
                Tidak ada tutor yang mengajar mata pelajaran ini.
              </p>
            ) : matchResults.length === 0 && timeMismatchResults.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400">
                Tidak ada tutor yang tersedia di hari yang dipilih.
              </p>
            ) : (
              <>
                {matchResults.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {matchResults.map(tutor => (
                      <TutorRow key={tutor.id} tutor={tutor} requestedDays={requestedDays} />
                    ))}
                  </div>
                )}
                {timeMismatchResults.length > 0 && (
                  <>
                    <div className="px-5 py-2 bg-gray-50 border-y border-gray-100">
                      <p className="text-xs font-medium text-gray-500">Tersedia di hari ini, tapi jam berbeda</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {timeMismatchResults.map(tutor => (
                        <TutorRow key={tutor.id} tutor={tutor} requestedDays={requestedDays} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        <TutorScheduleTable tutors={allTutorSchedules} />
      </div>
    </div>
  )
}

function TutorRow({ tutor, requestedDays }: { tutor: TutorResult; requestedDays: string[] }) {
  const daySchedules = tutor.availableSchedule.filter(s => requestedDays.includes(s.day))

  return (
    <Link
      href={`/admin/users/${tutor.id}`}
      className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Avatar name={tutor.full_name} avatarUrl={tutor.avatar_url} />
        <div>
          <p className="text-sm font-medium text-gray-900">{tutor.full_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{tutor.classSummary.length} kelas aktif</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {daySchedules.length > 0 && (
          <p className="text-sm text-gray-700 text-right whitespace-nowrap">
            {daySchedules.map(s => s.time.replace('–', ' - ')).join(', ')}
          </p>
        )}
        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
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
  avatar_url: string | null
  declared: string[]
  schedule: { day: string; time: string }[]
}

function TutorScheduleTable({ tutors }: { tutors: TutorScheduleRow[] }) {
  const withSchedule = tutors.filter(t => t.schedule.length > 0)
  const withoutSchedule = tutors.filter(t => t.schedule.length === 0)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <p className="text-base font-semibold text-gray-700">Jadwal Mingguan Tutor</p>
          <p className="text-xs text-gray-400 mt-0.5">Berdasarkan jadwal yang dideklarasikan tutor di profil mereka</p>
        </div>

        {withSchedule.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Belum ada tutor yang mengisi jadwal ketersediaan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
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
                        <div className="flex items-center gap-2.5">
                          <Avatar name={tutor.full_name} avatarUrl={tutor.avatar_url} size={36} />
                          <div>
                            <p className="font-medium text-gray-800">{tutor.full_name}</p>
                            {tutor.declared.length > 0 && (
                              <p className="text-gray-400 mt-0.5 leading-relaxed">{tutor.declared.join(', ')}</p>
                            )}
                          </div>
                        </div>
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
              <span key={t.id} className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-1">{t.full_name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
