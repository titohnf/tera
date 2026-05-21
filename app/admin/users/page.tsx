import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'

const ROLE_TABS = [
  { key: '', label: 'Semua' },
  { key: 'tutor', label: 'Tutor' },
  { key: 'student', label: 'Siswa' },
  { key: 'parent', label: 'Orang Tua' },
  { key: 'admin', label: 'Admin' },
]

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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const { role = '', q = '' } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at')
    .order('created_at', { ascending: false })

  if (role) query = query.eq('role', role)
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)

  const { data: users } = await query.limit(100)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Manajemen Pengguna</h1>
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

      {/* Role filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {ROLE_TABS.map(tab => (
          <Link
            key={tab.key}
            href={`/admin/users?role=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              role === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

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
