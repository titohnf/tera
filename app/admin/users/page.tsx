import { createAdminClient } from '@/lib/supabase/server-admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  tutor: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
  parent: 'bg-yellow-100 text-yellow-700',
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  tutor: 'Tutor',
  student: 'Siswa',
  parent: 'Orang Tua',
}

const LEVEL_ORDER = ['SD', 'SMP', 'SMA']

type StudentStats = {
  total: number
  newThisMonth: number
  activeInClass: number
  noClass: number
  attendanceRate: number | null
  byLevel: Record<string, number>
}

type TutorStats = {
  total: number
  newThisMonth: number
  activeTeaching: number
  noClass: number
  sessionsThisMonth: number
  utilisasiTutor: number
  siswaAktif: number
}

function StudentSummary({ stats }: { stats: StudentStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Total Siswa</p>
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Baru Bulan Ini</p>
        <p className="text-2xl font-bold text-blue-600">{stats.newThisMonth}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Aktif di Kelas</p>
        <p className="text-2xl font-bold text-green-600">{stats.activeInClass}</p>
        <p className="text-xs text-gray-400 mt-0.5">dari {stats.total} siswa</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Kehadiran Bulan Ini</p>
        <p className={`text-2xl font-bold ${stats.attendanceRate === null ? 'text-gray-300' : stats.attendanceRate >= 80 ? 'text-green-600' : stats.attendanceRate >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
          {stats.attendanceRate !== null ? `${stats.attendanceRate}%` : '—'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">hadir + terlambat</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Belum di Kelas</p>
        <p className={`text-2xl font-bold ${stats.noClass === 0 ? 'text-gray-900' : 'text-orange-500'}`}>
          {stats.noClass}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">siswa tanpa kelas aktif</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-2">Per Jenjang</p>
        <div className="flex flex-col gap-0.5">
          {LEVEL_ORDER.filter(l => stats.byLevel[l]).map(l => (
            <div key={l} className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{l}</span>
              <span className="font-semibold text-gray-800">{stats.byLevel[l]}</span>
            </div>
          ))}
          {Object.keys(stats.byLevel).length === 0 && <span className="text-xs text-gray-400">—</span>}
        </div>
      </div>
    </div>
  )
}

function TutorSummary({ stats }: { stats: TutorStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Total Tutor</p>
        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Baru Bulan Ini</p>
        <p className="text-2xl font-bold text-blue-600">{stats.newThisMonth}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Mengajar Aktif</p>
        <p className="text-2xl font-bold text-green-600">{stats.activeTeaching}</p>
        <p className="text-xs text-gray-400 mt-0.5">dari {stats.total} tutor</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Tidak Ada Kelas</p>
        <p className={`text-2xl font-bold ${stats.noClass === 0 ? 'text-gray-900' : 'text-orange-500'}`}>
          {stats.noClass}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">tutor tanpa kelas aktif</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Utilisasi Tutor</p>
        <p className="text-2xl font-bold text-indigo-600">{stats.utilisasiTutor}%</p>
        <p className="text-xs text-gray-400 mt-0.5">{stats.activeTeaching} dari {stats.total} tutor</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Rasio Siswa/Tutor</p>
        <p className="text-2xl font-bold text-teal-600">
          {stats.total > 0 ? `${(stats.siswaAktif / stats.total).toFixed(1)}:1` : '—'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{stats.siswaAktif} siswa aktif</p>
      </div>
    </div>
  )
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const { role = '', q = '' } = await searchParams

  // Siswa punya halaman tersendiri
  if (role === 'student') redirect('/admin/siswa')

  const admin = createAdminClient()

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  let query = admin
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at')
    .order('created_at', { ascending: false })

  if (role) query = query.eq('role', role)
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)

  const [{ data: users }, studentStats, tutorStats] = await Promise.all([
    query.limit(100),
    role === 'student'
      ? Promise.all([
          admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', firstOfMonth),
          admin.from('class_students').select('student_id').eq('is_active', true),
          admin.from('profiles').select('level').eq('role', 'student').not('level', 'is', null),
          admin.from('profiles').select('id').eq('role', 'student'),
          admin.from('sessions').select('id').eq('status', 'completed').gte('scheduled_at', firstOfMonth),
        ]).then(async ([
          { count: total },
          { count: newThisMonth },
          { data: activeEnrollments },
          { data: byLevelRows },
          { data: allStudents },
          { data: monthSessions },
        ]): Promise<StudentStats> => {
          const byLevel: Record<string, number> = {}
          for (const row of byLevelRows ?? []) {
            if (row.level) byLevel[row.level] = (byLevel[row.level] ?? 0) + 1
          }

          const enrolledIds = new Set((activeEnrollments ?? []).map(e => e.student_id))
          const noClass = (allStudents ?? []).filter(s => !enrolledIds.has(s.id)).length

          const sessionIds = (monthSessions ?? []).map(s => s.id)
          let attendanceRate: number | null = null
          if (sessionIds.length > 0) {
            const { data: attendances } = await admin
              .from('attendances')
              .select('status')
              .in('session_id', sessionIds)
            const tot = attendances?.length ?? 0
            const present = (attendances ?? []).filter(a => a.status === 'present' || a.status === 'late').length
            attendanceRate = tot > 0 ? Math.round((present / tot) * 100) : null
          }

          return {
            total: total ?? 0,
            newThisMonth: newThisMonth ?? 0,
            activeInClass: activeEnrollments?.length ?? 0,
            noClass,
            attendanceRate,
            byLevel,
          }
        })
      : Promise.resolve(null),
    role === 'tutor'
      ? Promise.all([
          admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),
          admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tutor').gte('created_at', firstOfMonth),
          admin.from('classes').select('tutor_id').eq('is_active', true),
          admin.from('profiles').select('id').eq('role', 'tutor'),
          admin.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('scheduled_at', firstOfMonth),
          admin.from('class_students').select('*', { count: 'exact', head: true }).eq('is_active', true),
        ]).then(([{ count: total }, { count: newThisMonth }, { data: activeClasses }, { data: allTutors }, { count: sessionsThisMonth }, { count: siswaAktifCount }]): TutorStats => {
          const activeTutorIds = new Set((activeClasses ?? []).map(c => c.tutor_id).filter(Boolean))
          const noClass = (allTutors ?? []).filter(t => !activeTutorIds.has(t.id)).length
          return {
            total: total ?? 0,
            newThisMonth: newThisMonth ?? 0,
            activeTeaching: activeTutorIds.size,
            noClass,
            sessionsThisMonth: sessionsThisMonth ?? 0,
            utilisasiTutor: total ? Math.round((activeTutorIds.size / total) * 100) : 0,
            siswaAktif: siswaAktifCount ?? 0,
          }
        })
      : Promise.resolve(null),
  ])

  const pageTitle =
    role === 'student' ? 'Siswa'
    : role === 'tutor' ? 'Tutor'
    : role === 'admin' ? 'Admin'
    : 'Semua Pengguna'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Pengguna
        </Link>
      </div>

      {studentStats && <StudentSummary stats={studentStats} />}
      {tutorStats && <TutorSummary stats={tutorStats} />}

      {/* Search */}
      <form method="get" action="/admin/users" className="mb-5">
        {role && <input type="hidden" name="role" value={role} />}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Cari nama atau email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </form>

      {!users || users.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Tidak ada pengguna ditemukan.
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="flex items-center justify-between bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-3.5 hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-blue-600">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {user.email}
                    {user.phone ? ` · ${user.phone}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">
                  {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
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
