import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import Link from 'next/link'
import MetricCard from '@/components/dashboard/MetricCard'
import ClassFilters from '@/components/admin/classes/ClassFilters'

type ClassRow = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  class_type: string | null
  status: string
  start_date: string | null
  end_date: string | null
}

const LEVEL_ORDER = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default async function TutorClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; status?: string; type?: string; q?: string }>
}) {
  const { level: levelFilter = '', status: statusFilter = '', type: typeFilter = '', q = '' } = await searchParams
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()

  const { data: classes } = await admin
    .from('classes')
    .select('id, name, level, is_active, class_type, status, start_date, end_date')
    .eq('tutor_id', user.id)
    .order('name') as unknown as { data: ClassRow[] | null }

  const allClasses = classes ?? []
  const classIds = allClasses.map(c => c.id)

  type StudentCountRow = { class_id: string }
  type SessionRow = { class_id: string; scheduled_at: string; status: string }
  type SlotRow = { class_id: string; day_of_week: number | null; subject_ids: string[] }

  let studentCounts: StudentCountRow[] = []
  let nextSessions: SessionRow[] = []
  let completedSessions: SessionRow[] = []
  let slots: SlotRow[] = []
  let subjects: { id: string; name: string }[] = []

  if (classIds.length > 0) {
    const [{ data: students }, { data: next }, { data: completed }, { data: slotsData }, { data: subjectsData }] = await Promise.all([
      admin
        .from('class_students')
        .select('class_id')
        .in('class_id', classIds)
        .eq('is_active', true) as unknown as Promise<{ data: StudentCountRow[] | null }>,
      admin
        .from('sessions')
        .select('class_id, scheduled_at, status')
        .in('class_id', classIds)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true }) as unknown as Promise<{ data: SessionRow[] | null }>,
      admin
        .from('sessions')
        .select('class_id, scheduled_at, status')
        .in('class_id', classIds)
        .eq('status', 'completed') as unknown as Promise<{ data: SessionRow[] | null }>,
      admin
        .from('class_slots')
        .select('class_id, day_of_week, subject_ids')
        .in('class_id', classIds)
        .order('slot_index', { ascending: true }) as unknown as Promise<{ data: SlotRow[] | null }>,
      admin
        .from('subjects')
        .select('id, name') as unknown as Promise<{ data: { id: string; name: string }[] | null }>,
    ])
    studentCounts = students ?? []
    nextSessions = next ?? []
    completedSessions = completed ?? []
    slots = slotsData ?? []
    subjects = subjectsData ?? []
  }

  const countByClass: Record<string, number> = {}
  for (const s of studentCounts) {
    countByClass[s.class_id] = (countByClass[s.class_id] ?? 0) + 1
  }

  const nextByClass: Record<string, SessionRow> = {}
  for (const s of nextSessions) {
    if (!nextByClass[s.class_id]) nextByClass[s.class_id] = s
  }

  const completedCountByClass: Record<string, number> = {}
  const slotsPerWeekByClass: Record<string, number> = {}
  for (const s of completedSessions) {
    completedCountByClass[s.class_id] = (completedCountByClass[s.class_id] ?? 0) + 1
  }

  const subjectNameMap = new Map(subjects.map(s => [s.id, s.name]))
  const jadwalMap = new Map<string, { day: string; subject: string }[]>()
  for (const slot of slots) {
    if (slot.day_of_week == null) continue
    slotsPerWeekByClass[slot.class_id] = (slotsPerWeekByClass[slot.class_id] ?? 0) + 1
    const dayLabel = DAYS[slot.day_of_week] ?? ''
    const subjectLabel = (slot.subject_ids ?? []).map(id => subjectNameMap.get(id)).filter(Boolean).join(', ') || '—'
    const existing = jadwalMap.get(slot.class_id) ?? []
    existing.push({ day: dayLabel, subject: subjectLabel })
    jadwalMap.set(slot.class_id, existing)
  }

  function getProgress(cls: ClassRow): { completed: number; target: number | null; pct: number | null } {
    const completed = completedCountByClass[cls.id] ?? 0
    const slotsPerWeek = slotsPerWeekByClass[cls.id] ?? 0
    if (!cls.end_date || slotsPerWeek === 0) return { completed, target: null, pct: null }
    const start = new Date(cls.start_date ?? cls.end_date)
    const end = new Date(cls.end_date)
    const totalWeeks = Math.max(1, Math.round((end.getTime() - start.getTime()) / (7 * 86400000)))
    const target = slotsPerWeek * totalWeeks
    const pct = Math.min(100, Math.round((completed / target) * 100))
    return { completed, target, pct }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  let filtered = allClasses
  if (q) {
    const lq = q.toLowerCase()
    filtered = filtered.filter(c => c.name.toLowerCase().includes(lq))
  }
  if (levelFilter) filtered = filtered.filter(c => c.level === levelFilter)
  if (statusFilter) filtered = filtered.filter(c => c.status === statusFilter)
  if (typeFilter === 'group') filtered = filtered.filter(c => c.class_type === 'group')
  else if (typeFilter === 'private') filtered = filtered.filter(c => c.class_type === 'private')

  const availableLevels = LEVEL_ORDER.filter(l => allClasses.some(c => c.level === l))
  const regularCount = allClasses.filter(c => c.class_type === 'group').length
  const privateCount = allClasses.filter(c => c.class_type === 'private').length
  const hasFilter = !!(q || levelFilter || statusFilter || typeFilter)
  const tableTitle = hasFilter
    ? `Menampilkan ${filtered.length} dari ${allClasses.length} kelas`
    : `${allClasses.length} Kelas`

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kelas Saya</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar kelas yang kamu ampu.</p>
        </div>
        <Link
          href="/tutor/schedule"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-blue-50/50 transition-colors shrink-0"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Kalender
        </Link>
      </div>

      {allClasses.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Grup" value={regularCount} />
          <MetricCard label="Privat" value={privateCount} />
        </div>
      )}

      {allClasses.length > 0 && (
        <ClassFilters
          q={q}
          level={levelFilter}
          type={typeFilter}
          status={statusFilter}
          availableLevels={availableLevels}
        />
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{tableTitle}</h2>
        </div>

        {allClasses.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            Kamu belum ditugaskan ke kelas manapun.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            Tidak ada kelas yang sesuai filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="pl-5 pr-4 py-3 text-left">Nama Kelas</th>
                  <th className="px-4 py-3 text-center">Siswa</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Jadwal</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Sesi</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(cls => {
                  const siswaCount = countByClass[cls.id] ?? 0
                  const progress = getProgress(cls)
                  const next = nextByClass[cls.id]

                  return (
                    <tr key={cls.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="pl-5 pr-4 py-3">
                        <Link href={`/tutor/classes/${cls.id}`} className="block">
                          <p className="font-medium text-gray-900">{cls.name}</p>
                          {cls.level && <span className="text-sm text-gray-400">{cls.level}</span>}
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Link href={`/tutor/classes/${cls.id}`} className="block font-semibold text-gray-800">
                          {siswaCount}
                        </Link>
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link href={`/tutor/classes/${cls.id}`} className="block">
                          {(jadwalMap.get(cls.id) ?? []).length === 0 ? (
                            <span className="text-sm text-gray-400">—</span>
                          ) : (
                            (jadwalMap.get(cls.id) ?? []).slice(0, 3).map((j, i) => (
                              <span key={i} className="block text-sm text-gray-600 leading-snug">
                                <span className="font-medium text-gray-700">{j.day}:</span> {j.subject}
                              </span>
                            ))
                          )}
                        </Link>
                      </td>

                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Link href={`/tutor/classes/${cls.id}`} className="block space-y-1.5">
                          {progress.target !== null && progress.pct !== null ? (
                            <div className="w-36">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">{progress.completed}/{progress.target} sesi</span>
                                <span className={`text-sm font-semibold ${
                                  progress.pct >= 80 ? 'text-green-600' :
                                  progress.pct >= 40 ? 'text-yellow-600' : 'text-red-500'
                                }`}>{progress.pct}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    progress.pct >= 80 ? 'bg-green-500' :
                                    progress.pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${progress.pct}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600">{progress.completed} sesi selesai</span>
                          )}
                          <span className="block text-sm text-gray-400">
                            Berikutnya: {next ? fmtDate(next.scheduled_at) : 'Belum ada'}
                          </span>
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <Link href={`/tutor/classes/${cls.id}`} className="block">
                          <span className={`inline-flex text-sm font-medium px-2 py-0.5 rounded-full ${
                            cls.status === 'selesai' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                          }`}>
                            {cls.status === 'selesai' ? 'Selesai' : 'Aktif'}
                          </span>
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link href={`/tutor/classes/${cls.id}`} className="inline-block">
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
