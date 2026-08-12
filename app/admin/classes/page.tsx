import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import MetricCard from '@/components/dashboard/MetricCard'
import ClassFilters from '@/components/admin/classes/ClassFilters'
import { splitClassPrefix } from '@/lib/format-class-name'
import { resolveClassStatus, ALL_CLASS_STATUS } from '@/lib/class-filters'

type ClassRow = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  class_type: string | null
  status: string
  start_date: string | null
  end_date: string | null
  profiles: { full_name: string } | null
  class_subjects: { subjects: { name: string } | null }[]
}

const LEVEL_ORDER = ['Calistung', 'SD', 'SMP', 'SMA', 'Umum']

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; status?: string; type?: string; q?: string }>
}) {
  const { level: levelFilter = '', status: rawStatus, type: typeFilter = '', q = '' } = await searchParams

  const statusFilter = resolveClassStatus(rawStatus)
  const admin = createAdminClient()

  const now = new Date()

  const [{ data: classes }, { data: enrollments }, { data: lastSessionsRaw }, { data: slotsRaw }, { data: subjectsRaw }, { data: completedSessionsRaw }, { data: allSessionsRaw }] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, is_active, class_type, status, start_date, end_date, profiles!tutor_id(full_name), class_subjects(subjects(name))')
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: ClassRow[] | null }>,
    admin
      .from('class_students')
      .select('class_id, is_active, profiles!student_id(nickname, full_name)') as unknown as Promise<{ data: { class_id: string; is_active: boolean; profiles: { nickname: string | null; full_name: string } | null }[] | null }>,
    admin
      .from('sessions')
      .select('class_id, scheduled_at')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(500),
    admin
      .from('class_slots')
      .select('class_id, day_of_week, subject_ids')
      .order('slot_index', { ascending: true }) as unknown as Promise<{ data: { class_id: string; day_of_week: number | null; subject_ids: string[] }[] | null }>,
    admin
      .from('subjects')
      .select('id, name'),
    admin
      .from('sessions')
      .select('class_id')
      .eq('status', 'completed'),
    admin
      .from('sessions')
      .select('class_id'),
  ])

  const allClasses = classes ?? []

  // Kolom Siswa menampilkan anggota yang masih aktif. Kalau tidak ada satu pun
  // yang tersisa — kelas privat yang sudah selesai, atau siswanya sudah
  // dinonaktifkan — kolomnya jatuh ke anggota terakhir yang pernah ada.
  // Menampilkan "—" di situ membuat kelas privat kehilangan satu-satunya
  // penanda siapa pemiliknya, padahal namanya memang ditulis per siswa.
  const activeNamesByClass = new Map<string, string[]>()
  const formerNamesByClass = new Map<string, string[]>()
  for (const e of enrollments ?? []) {
    const label = e.profiles?.nickname || e.profiles?.full_name
    if (!label) continue
    const target = e.is_active ? activeNamesByClass : formerNamesByClass
    const arr = target.get(e.class_id) ?? []
    arr.push(label)
    target.set(e.class_id, arr)
  }
  const studentNamesByClass = new Map<string, string[]>()
  for (const classId of new Set([...activeNamesByClass.keys(), ...formerNamesByClass.keys()])) {
    const active = activeNamesByClass.get(classId) ?? []
    studentNamesByClass.set(classId, active.length > 0 ? active : formerNamesByClass.get(classId) ?? [])
  }

  // Build sesi lookup: last completed per class
  const lastSessionMap = new Map<string, string>()
  for (const s of lastSessionsRaw ?? []) {
    if (!lastSessionMap.has(s.class_id)) lastSessionMap.set(s.class_id, s.scheduled_at)
  }

  const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const subjectNameMap = new Map<string, string>()
  for (const s of subjectsRaw ?? []) subjectNameMap.set(s.id, s.name)

  // jadwalMap: class_id → "Sen: Matematika\nRab: B. Inggris"
  const jadwalMap = new Map<string, { day: string; subject: string }[]>()
  for (const slot of slotsRaw ?? []) {
    if (slot.day_of_week == null) continue
    const dayLabel = DAYS[slot.day_of_week] ?? ''
    const subjectNames = (slot.subject_ids ?? [])
      .map(id => subjectNameMap.get(id))
      .filter(Boolean) as string[]
    const subjectLabel = subjectNames.length > 0 ? subjectNames.join(', ') : '—'
    const existing = jadwalMap.get(slot.class_id) ?? []
    existing.push({ day: dayLabel, subject: subjectLabel })
    jadwalMap.set(slot.class_id, existing)
  }

  // Completed session count per class
  const completedCountMap = new Map<string, number>()
  for (const s of completedSessionsRaw ?? []) {
    completedCountMap.set(s.class_id, (completedCountMap.get(s.class_id) ?? 0) + 1)
  }

  // Total generated sessions per class (all statuses) — this is the actual
  // denominator shown on the class detail page, so use it here too instead
  // of estimating from slotsPerWeek × weeks (which can drift from the real
  // generated count due to rounding).
  const totalSessionCountMap = new Map<string, number>()
  for (const s of allSessionsRaw ?? []) {
    totalSessionCountMap.set(s.class_id, (totalSessionCountMap.get(s.class_id) ?? 0) + 1)
  }

  // Progress: completed / target × 100
  function getProgress(cls: ClassRow): { completed: number; target: number | null; pct: number | null } {
    const completed = completedCountMap.get(cls.id) ?? 0
    const target = totalSessionCountMap.get(cls.id) ?? 0
    if (target === 0) return { completed, target: null, pct: null }
    const pct = Math.min(100, Math.round((completed / target) * 100))
    return { completed, target, pct }
  }

  // Kartu ringkasan mengikuti filter status saja, bukan jenjang/tipe/pencarian.
  // Kalau ia menghitung seluruh kelas, angkanya berselisih dengan tabel di
  // bawahnya sejak halaman pertama kali dibuka; kalau ia ikut filter tipe,
  // memilih "Privat" membuat kartu Grup jadi 0 dan ketiganya kehilangan guna.
  const statusScoped = statusFilter === ALL_CLASS_STATUS
    ? allClasses
    : allClasses.filter(c => c.status === statusFilter)
  const regularCount = statusScoped.filter(c => c.class_type === 'group').length
  const privateCount = statusScoped.filter(c => c.class_type === 'private').length
  const yayasanCount = statusScoped.filter(c => c.class_type === 'yayasan').length

  // Filter
  let filtered = allClasses
  if (q) {
    const lq = q.toLowerCase()
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(lq) || c.profiles?.full_name?.toLowerCase().includes(lq)
    )
  }
  if (levelFilter) filtered = filtered.filter(c => c.level === levelFilter)
  if (statusFilter !== ALL_CLASS_STATUS) filtered = filtered.filter(c => c.status === statusFilter)
  if (typeFilter === 'group') filtered = filtered.filter(c => c.class_type === 'group')
  else if (typeFilter === 'private') filtered = filtered.filter(c => c.class_type === 'private')
  else if (typeFilter === 'yayasan') filtered = filtered.filter(c => c.class_type === 'yayasan')

  const availableLevels = LEVEL_ORDER.filter(l => allClasses.some(c => c.level === l))

  function filterUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    const merged = { q, level: levelFilter, status: statusFilter, type: typeFilter, ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v) })
    const qs = p.toString()
    return qs ? `/admin/classes?${qs}` : '/admin/classes'
  }

  // Judulnya mengikuti apa yang benar-benar tersaring, bukan apakah ada filter
  // yang dipasang. Status default "aktif" sudah menyembunyikan kelas selesai,
  // jadi menyebut total kelas di situ akan berbohong tentang isi tabelnya.
  const tableTitle = filtered.length !== allClasses.length
    ? `Menampilkan ${filtered.length} dari ${allClasses.length} kelas`
    : `${allClasses.length} Kelas`

  return (
    <div className="space-y-5">
      {/* Header */}
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
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Grup" value={regularCount} />
        <MetricCard label="Privat" value={privateCount} />
        <MetricCard label="Yayasan" value={yayasanCount} />
      </div>

      {/* Filter */}
      <ClassFilters
        q={q}
        level={levelFilter}
        type={typeFilter}
        status={statusFilter}
        availableLevels={availableLevels}
      />

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{tableTitle}</h2>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            Tidak ada kelas yang sesuai filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="pl-5 pr-4 py-3 text-left">Nama Kelas</th>
                  <th className="px-4 py-3 text-left">Siswa</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Jadwal</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Sesi</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(cls => {
                  const studentNames = studentNamesByClass.get(cls.id) ?? []
                  const progress = getProgress(cls)
                  const { prefix, rest } = splitClassPrefix(cls.name)

                  return (
                    <tr
                      key={cls.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* Nama */}
                      <td className="pl-5 pr-4 py-3">
                        <Link href={`/admin/classes/${cls.id}`} className="block">
                          {prefix ? (
                            <>
                              <p className="font-semibold text-gray-900">{prefix}</p>
                              {rest && <p className="text-xs text-gray-400 mt-0.5">{rest}</p>}
                            </>
                          ) : (
                            <p className="font-medium text-gray-900">{cls.name}</p>
                          )}
                        </Link>
                      </td>

                      {/* Siswa */}
                      <td className="px-4 py-3">
                        <Link href={`/admin/classes/${cls.id}`} className="block text-gray-700">
                          {studentNames.length === 0 ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            studentNames.join(', ')
                          )}
                        </Link>
                      </td>

                      {/* Jadwal */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link href={`/admin/classes/${cls.id}`} className="block">
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

                      {/* Sesi */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Link href={`/admin/classes/${cls.id}`} className="block space-y-1.5">
                          {progress.target !== null && progress.pct !== null ? (
                            <div className="w-36">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">{progress.completed}/{progress.target} sesi</span>
                                <span className={`text-sm font-semibold ${
                                  progress.pct >= 100 ? 'text-green-600' : 'text-blue-600'
                                }`}>{progress.pct}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    progress.pct >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${progress.pct}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-600">{progress.completed} sesi selesai</span>
                          )}
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Link href={`/admin/classes/${cls.id}`} className="block">
                          <span className={`inline-flex text-sm font-medium px-2 py-0.5 rounded-full ${
                            cls.status === 'selesai'
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {cls.status === 'selesai' ? 'Selesai' : 'Aktif'}
                          </span>
                        </Link>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/classes/${cls.id}`} className="inline-block">
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
