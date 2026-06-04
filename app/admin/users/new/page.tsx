import CreateUserForm from '@/components/admin/users/CreateUserForm'
import Link from 'next/link'

const FROM_CONFIG: Record<string, { label: string; href: string; title: string; role: string }> = {
  siswa: { label: 'Siswa',     href: '/admin/siswa', title: 'Tambah Siswa Baru',  role: 'student' },
  tutor: { label: 'Tutor',     href: '/admin/tutor', title: 'Tambah Tutor Baru',  role: 'tutor'   },
}

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; role?: string }>
}) {
  const { from, role } = await searchParams
  const cfg = from ? FROM_CONFIG[from] : null
  const initialRole = cfg?.role ?? role ?? 'student'

  const breadcrumbLabel = cfg?.label ?? 'Admin'
  const breadcrumbHref  = cfg?.href  ?? '/admin/users'
  const pageTitle       = cfg?.title ?? 'Tambah Pengguna Baru'

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={breadcrumbHref} className="hover:text-blue-600">{breadcrumbLabel}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{pageTitle}</span>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">{pageTitle}</h1>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 max-w-xl">
        <CreateUserForm initialRole={initialRole} />
      </div>
    </div>
  )
}
