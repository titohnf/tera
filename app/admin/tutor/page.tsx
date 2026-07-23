import { createAdminClient } from '@/lib/supabase/server-admin'
import Image from 'next/image'
import Link from 'next/link'
import MetricCard from '@/components/dashboard/MetricCard'
import TutorSearchFilter from '@/components/admin/tutor/TutorSearchFilter'
import { getWorkloadLevel, WORKLOAD_CONFIG } from '@/lib/tutorWorkload'
import { getAvatarColor } from '@/lib/avatarColor'

type Tutor = {
  id: string
  full_name: string
  email: string
  phone: string | null
  created_at: string
  is_active: boolean
  avatar_url: string | null
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

function TutorAvatar({ name, avatarUrl, dimmed = false }: { name: string; avatarUrl: string | null; dimmed?: boolean }) {
  const fallbackColor = dimmed ? 'bg-gray-100' : getAvatarColor(name)
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${avatarUrl ? '' : fallbackColor}`}>
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name} width={40} height={40} className="w-full h-full object-cover" />
      ) : (
        <span className={`text-sm font-semibold ${dimmed ? 'text-gray-500' : 'text-white'}`}>{getInitials(name)}</span>
      )}
    </div>
  )
}

function getRatioColor(ratio: number): string {
  if (ratio <= 0) return 'text-gray-400'
  if (ratio < 3 || ratio > 15) return 'text-red-600'
  if ((ratio >= 3 && ratio < 5) || (ratio > 12 && ratio <= 15)) return 'text-yellow-600'
  return 'text-green-600'
}

function formatMonthsJoined(createdAt: string, now: Date): string {
  const months = Math.floor((now.getTime() - new Date(createdAt).getTime()) / (30.44 * 86400000))
  if (months < 1) return '< 1 bln'
  if (months < 12) return `${months} bln`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m === 0 ? `${y} thn` : `${y} thn ${m} bln`
}

function SortIcon({ active, desc }: { active: boolean; desc: boolean }) {
  return (
    <svg className={`w-3 h-3 shrink-0 ${active ? 'text-gray-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {active
        ? desc
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      }
    </svg>
  )
}

export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; dir?: string }>
}) {
  const { q = '', status = '', sort = '', dir = 'asc' } = await searchParams
  const admin = createAdminClient()
  const now = new Date()

  const [
    { data: tutors },
    { data: activeClassesRaw },
    { data: allSessionsRaw },
    { data: classStudentsRaw },
    { data: classSlotsRaw },
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, phone, created_at, is_active, avatar_url')
      .eq('role', 'tutor')
      .order('full_name') as unknown as Promise<{ data: Tutor[] | null }>,
    admin
      .from('classes')
      .select('id')
      .eq('is_active', true) as unknown as Promise<{ data: { id: string }[] | null }>,
    admin
      .from('sessions')
      .select('tutor_id')
      .eq('status', 'completed')
      .not('tutor_id', 'is', null),
    admin
      .from('class_students')
      .select('class_id, student_id')
      .eq('is_active', true) as unknown as Promise<{ data: { class_id: string; student_id: string }[] | null }>,
    admin
      .from('class_slots')
      .select('class_id, tutor_id, tutor_ids') as unknown as Promise<{ data: { class_id: string; tutor_id: string; tutor_ids: string[] }[] | null }>,
  ])

  const allTutors = tutors ?? []
  const activeClassIds = new Set((activeClassesRaw ?? []).map(c => c.id))

  // Map class_id -> Set of tutorIds (from all slots, only active classes) —
  // tutor_ids covers every rotating mapel's tutor, not just the primary one,
  // so a tutor who only teaches every other week still counts as active here.
  const classToTutors = new Map<string, Set<string>>()
  for (const slot of classSlotsRaw ?? []) {
    if (!activeClassIds.has(slot.class_id)) continue
    const slotTutorIds = slot.tutor_ids?.length ? slot.tutor_ids : (slot.tutor_id ? [slot.tutor_id] : [])
    if (slotTutorIds.length === 0) continue
    if (!classToTutors.has(slot.class_id)) classToTutors.set(slot.class_id, new Set())
    for (const tutorId of slotTutorIds) classToTutors.get(slot.class_id)!.add(tutorId)
  }

  // Count active classes per tutor (across all slots)
  const tutorActiveClassMap = new Map<string, Set<string>>()
  for (const [classId, tutorIds] of classToTutors) {
    for (const tutorId of tutorIds) {
      if (!tutorActiveClassMap.has(tutorId)) tutorActiveClassMap.set(tutorId, new Set())
      tutorActiveClassMap.get(tutorId)!.add(classId)
    }
  }

  // Count unique students per tutor (students of their active classes)
  const tutorStudentSets = new Map<string, Set<string>>()
  for (const cs of classStudentsRaw ?? []) {
    const tutorIds = classToTutors.get(cs.class_id)
    if (!tutorIds) continue
    for (const tutorId of tutorIds) {
      if (!tutorStudentSets.has(tutorId)) tutorStudentSets.set(tutorId, new Set())
      tutorStudentSets.get(tutorId)!.add(cs.student_id)
    }
  }
  const tutorStudentCountMap = new Map<string, number>()
  for (const [tutorId, students] of tutorStudentSets) {
    tutorStudentCountMap.set(tutorId, students.size)
  }

  const tutorTotalSessionMap = new Map<string, number>()
  for (const s of allSessionsRaw ?? []) {
    if (s.tutor_id) tutorTotalSessionMap.set(s.tutor_id, (tutorTotalSessionMap.get(s.tutor_id) ?? 0) + 1)
  }

  const tutorsWithActiveClass = new Set(tutorActiveClassMap.keys())

  const total = allTutors.length
  const activeTeaching = allTutors.filter(t => t.is_active && tutorsWithActiveClass.has(t.id)).length
  const idleCount = allTutors.filter(t => t.is_active && !tutorsWithActiveClass.has(t.id)).length
  const utilisasiTutor = total > 0 ? Math.round((activeTeaching / total) * 100) : 0

  const allActiveStudents = new Set<string>()
  for (const cs of classStudentsRaw ?? []) {
    if (classToTutors.has(cs.class_id)) allActiveStudents.add(cs.student_id)
  }
  const uniqueSiswaAktif = allActiveStudents.size

  const ratio = activeTeaching > 0 ? uniqueSiswaAktif / activeTeaching : 0
  const ratioStr = activeTeaching > 0 ? `${ratio.toFixed(1)}:1` : '—'
  const ratioColor = getRatioColor(ratio)

  // Filter
  let filtered = q
    ? allTutors.filter(t =>
        t.full_name.toLowerCase().includes(q.toLowerCase()) ||
        t.email?.toLowerCase().includes(q.toLowerCase())
      )
    : [...allTutors]

  if (status === 'active') {
    filtered = filtered.filter(t => t.is_active && tutorsWithActiveClass.has(t.id))
  } else if (status === 'idle') {
    filtered = filtered.filter(t => t.is_active && !tutorsWithActiveClass.has(t.id))
  } else if (status === 'inactive') {
    filtered = filtered.filter(t => !t.is_active)
  }

  // Sort
  const m = dir === 'desc' ? -1 : 1
  function applySort(list: Tutor[]): Tutor[] {
    if (!sort) return list
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'name':     return a.full_name.localeCompare(b.full_name, 'id') * m
        case 'students': return ((tutorStudentCountMap.get(a.id) ?? 0) - (tutorStudentCountMap.get(b.id) ?? 0)) * m
        case 'sessions': return ((tutorTotalSessionMap.get(a.id) ?? 0) - (tutorTotalSessionMap.get(b.id) ?? 0)) * m
        case 'joined':   return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * m
        default: return 0
      }
    })
  }

  const activeTutorsList = applySort(filtered.filter(t => t.is_active))
  const inactiveTutorsList = applySort(filtered.filter(t => !t.is_active))

  const tableTitle = q || status
    ? `Menampilkan ${filtered.length} dari ${total} tutor`
    : `${total} Tutor`

  // Sort link helper
  function sortHref(col: string): string {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (status) p.set('status', status)
    p.set('sort', col)
    p.set('dir', sort === col && dir === 'asc' ? 'desc' : 'asc')
    return `/admin/tutor?${p}`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Tutor</h1>
        <Link
          href="/admin/users/new?from=tutor"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Tutor
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Total Tutor" value={total} />
        <MetricCard
          label="Mengajar Aktif"
          value={activeTeaching}
          sub={`${utilisasiTutor}% dari total · ${idleCount} idle`}
        />
        <MetricCard
          label="Rasio Siswa/Tutor"
          value={ratioStr}
          valueColor={ratioColor}
          sub={`${uniqueSiswaAktif} siswa · ${activeTeaching} tutor aktif mengajar`}
          tooltip="Ideal: 5–12 siswa per tutor. Di bawah 5 beban kurang, di atas 12 beban berlebih."
        />
      </div>

      {/* Search + Filter */}
      <TutorSearchFilter q={q} status={status} sort={sort} dir={dir} />

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{tableTitle}</h2>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            {q || status ? 'Tidak ada tutor yang sesuai.' : 'Belum ada tutor.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="pl-5 pr-4 py-3 text-left">
                    <Link href={sortHref('name')} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                      Nama <SortIcon active={sort === 'name'} desc={dir === 'desc'} />
                    </Link>
                  </th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">
                    <Link href={sortHref('students')} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                      Kelas &amp; Beban <SortIcon active={sort === 'students'} desc={dir === 'desc'} />
                    </Link>
                  </th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">
                    <Link href={sortHref('sessions')} className="flex items-center justify-center gap-1 hover:text-gray-700 transition-colors">
                      Total Sesi <SortIcon active={sort === 'sessions'} desc={dir === 'desc'} />
                    </Link>
                  </th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">
                    <Link href={sortHref('joined')} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                      Bergabung <SortIcon active={sort === 'joined'} desc={dir === 'desc'} />
                    </Link>
                  </th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTutorsList.map(tutor => {
                  const classCount = tutorActiveClassMap.get(tutor.id)?.size ?? 0
                  const totalSessions = tutorTotalSessionMap.get(tutor.id) ?? 0
                  const studentCount = tutorStudentCountMap.get(tutor.id) ?? 0
                  const level = getWorkloadLevel(studentCount, tutor.is_active)
                  const cfg = WORKLOAD_CONFIG[level]
                  const isIdle = level === 'idle'
                  return (
                    <tr key={tutor.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="pl-5 pr-4 py-3">
                        <Link href={`/admin/users/${tutor.id}`} className="flex items-center gap-3">
                          <TutorAvatar name={tutor.full_name} avatarUrl={tutor.avatar_url} />
                          <p className="font-medium text-gray-900">{tutor.full_name}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Link href={`/admin/users/${tutor.id}`} className="block">
                          {classCount > 0 ? (
                            <span className="flex items-center gap-1.5">
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${cfg.bgColor} ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              <span className="text-gray-700">{classCount} kelas · {studentCount} siswa</span>
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <Link href={`/admin/users/${tutor.id}`} className="block">
                          <span className={`font-semibold ${totalSessions > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                            {totalSessions > 0 ? totalSessions : '—'}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Link href={`/admin/users/${tutor.id}`} className="block text-gray-500">
                          {formatMonthsJoined(tutor.created_at, now)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/admin/users/${tutor.id}`} className="block">
                          {isIdle ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Idle</span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Aktif</span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/users/${tutor.id}`} className="inline-block">
                          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  )
                })}

                {inactiveTutorsList.length > 0 && activeTutorsList.length > 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-2 bg-slate-50 border-t border-slate-200">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Tidak Aktif</span>
                    </td>
                  </tr>
                )}
                {inactiveTutorsList.map(tutor => {
                  const totalSessions = tutorTotalSessionMap.get(tutor.id) ?? 0
                  return (
                    <tr key={tutor.id} className="hover:bg-slate-50 transition-colors cursor-pointer opacity-60">
                      <td className="pl-5 pr-4 py-3">
                        <Link href={`/admin/users/${tutor.id}`} className="flex items-center gap-3">
                          <TutorAvatar name={tutor.full_name} avatarUrl={tutor.avatar_url} dimmed />
                          <p className="font-medium text-gray-900">{tutor.full_name}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Link href={`/admin/users/${tutor.id}`} className="block text-gray-300">—</Link>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <Link href={`/admin/users/${tutor.id}`} className="block">
                          <span className={`font-semibold ${totalSessions > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                            {totalSessions > 0 ? totalSessions : '—'}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Link href={`/admin/users/${tutor.id}`} className="block text-gray-500">
                          {formatMonthsJoined(tutor.created_at, now)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/admin/users/${tutor.id}`} className="block">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Tidak Aktif</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/users/${tutor.id}`} className="inline-block">
                          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
