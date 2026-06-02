import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import MetricCard from '@/components/dashboard/MetricCard'

type ClassRow = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  profiles: { full_name: string } | null
  class_subjects: { subjects: { name: string } | null }[]
}

const LEVEL_ORDER = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum']

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; status?: string }>
}) {
  const { level: levelFilter = '', status: statusFilter = '' } = await searchParams
  const admin = createAdminClient()

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: classes }, { data: enrollments }, { data: monthSessions }] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, is_active, profiles!tutor_id(full_name), class_subjects(subjects(name))')
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: ClassRow[] | null }>,
    admin
      .from('class_students')
      .select('class_id')
      .eq('is_active', true),
    admin
      .from('sessions')
      .select('id, duration_minutes')
      .eq('status', 'completed')
      .gte('scheduled_at', firstOfMonth),
  ])

  const allClasses = classes ?? []

  const countByClass: Record<string, number> = {}
  for (const e of enrollments ?? []) {
    countByClass[e.class_id] = (countByClass[e.class_id] ?? 0) + 1
  }

  const activeClassCount = allClasses.filter(c => c.is_active).length
  const inactiveClassCount = allClasses.filter(c => !c.is_active).length
  const totalStudentsInClass = Object.values(countByClass).reduce((s, n) => s + n, 0)

  const sessionCount = monthSessions?.length ?? 0
  const totalHours = Math.round(
    (monthSessions ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0) / 60
  )

  // Filter
  let filtered = allClasses
  if (levelFilter) filtered = filtered.filter(c => c.level === levelFilter)
  if (statusFilter === 'aktif') filtered = filtered.filter(c => c.is_active)
  else if (statusFilter === 'non-aktif') filtered = filtered.filter(c => !c.is_active)

  // Levels yang ada di data
  const availableLevels = LEVEL_ORDER.filter(l => allClasses.some(c => c.level === l))

  function filterUrl(newLevel: string, newStatus: string) {
    const p = new URLSearchParams()
    if (newLevel) p.set('level', newLevel)
    if (newStatus) p.set('status', newStatus)
    const qs = p.toString()
    return qs ? `/admin/classes?${qs}` : '/admin/classes'
  }

  const hasFilter = !!(levelFilter || statusFilter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Manajemen Kelas</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/sessions"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-blue-50/50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Kalender Sesi
          </Link>
          <Link
            href="/admin/classes/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Kelas
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard label="Kelas Aktif" value={activeClassCount} />
        <MetricCard label="Kelas Non-aktif" value={inactiveClassCount} />
        <MetricCard label="Total Siswa Aktif" value={totalStudentsInClass} />
        <MetricCard label="Sesi Bulan Ini" value={sessionCount} />
        <MetricCard label="Total Jam Mengajar" value={totalHours} />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Jenjang */}
        <div className="flex flex-wrap gap-1.5">
          <a
            href={filterUrl('', statusFilter)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              !levelFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Semua Jenjang
          </a>
          {availableLevels.map(l => (
            <a
              key={l}
              href={filterUrl(l, statusFilter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                levelFilter === l ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {l}
            </a>
          ))}
        </div>

        <div className="h-4 w-px bg-gray-200" />

        {/* Status */}
        <div className="flex gap-1.5">
          {[
            { label: 'Semua', value: '' },
            { label: 'Aktif', value: 'aktif' },
            { label: 'Non-aktif', value: 'non-aktif' },
          ].map(opt => (
            <a
              key={opt.value}
              href={filterUrl(levelFilter, opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                statusFilter === opt.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>

        {hasFilter && (
          <a href="/admin/classes" className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            Reset
          </a>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-gray-500">
          Tidak ada kelas yang sesuai filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(cls => (
            <Link
              key={cls.id}
              href={`/admin/classes/${cls.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-5 py-4 hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{cls.name}</p>
                    {cls.level && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {cls.level}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      cls.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cls.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {cls.class_subjects?.length > 0
                      ? cls.class_subjects.map(cs => cs.subjects?.name).filter(Boolean).join(', ')
                      : 'Mata pelajaran umum'} &bull; Tutor: {cls.profiles?.full_name ?? '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{countByClass[cls.id] ?? 0}</p>
                  <p className="text-xs text-gray-500">siswa</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
