import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const admin = createAdminClient()

  type AdminRow = { id: string; full_name: string; email: string; phone: string | null; created_at: string }
  const { data: admins } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, created_at')
    .eq('role', 'admin')
    .order('full_name') as unknown as { data: AdminRow[] | null }

  const allAdmins = admins ?? []

  const filtered = q
    ? allAdmins.filter(a =>
        a.full_name.toLowerCase().includes(q.toLowerCase()) ||
        a.email?.toLowerCase().includes(q.toLowerCase())
      )
    : allAdmins

  const tableTitle = q
    ? `Menampilkan ${filtered.length} dari ${allAdmins.length} admin`
    : `${allAdmins.length} Admin`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
        <Link
          href="/admin/users/new?from=admin"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Admin
        </Link>
      </div>

      {/* Search */}
      <form method="get" action="/admin/admin">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Cari nama atau email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{tableTitle}</h2>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10 px-5">
            {q ? 'Tidak ada admin yang sesuai pencarian.' : 'Belum ada admin.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="pl-5 pr-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Email / HP</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Bergabung</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="pl-5 pr-4 py-3">
                      <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-purple-700">
                            {getInitials(user.full_name)}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Link href={`/admin/users/${user.id}`} className="block">
                        <p className="text-gray-700">{user.email}</p>
                        {user.phone && <p className="text-sm text-gray-400 mt-0.5">{user.phone}</p>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Link href={`/admin/users/${user.id}`} className="block text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/users/${user.id}`} className="inline-block">
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
