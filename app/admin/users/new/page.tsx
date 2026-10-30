import CreateUserForm from '@/components/admin/users/CreateUserForm'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server-admin'

const FROM_CONFIG: Record<string, { label: string; href: string; title: string; role: string }> = {
  siswa: { label: 'Siswa',     href: '/admin/siswa', title: 'Tambah Siswa Baru',  role: 'student' },
  tutor: { label: 'Tutor',     href: '/admin/tutor', title: 'Tambah Tutor Baru',  role: 'tutor'   },
  admin: { label: 'Admin',     href: '/admin/admin', title: 'Tambah Admin Baru',  role: 'admin'   },
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

  // Akun keluarga yang sudah ada, supaya kakak-adik bisa ditautkan ke satu akun.
  let orangTua: { id: string; nama: string; email: string; anak: string[] }[] = []
  if (initialRole === 'student') {
    const admin = createAdminClient()
    const [{ data: akun }, { data: tautan }, { data: siswa }] = await Promise.all([
      admin.from('profiles').select('id, full_name, email').eq('role', 'parent').order('full_name'),
      admin.from('family_students').select('family_id, student_id'),
      admin.from('profiles').select('id, full_name').eq('role', 'student'),
    ])
    const namaSiswa = new Map((siswa ?? []).map(x => [x.id as string, x.full_name as string]))
    orangTua = (akun ?? []).map(a => ({
      id: a.id as string,
      nama: a.full_name as string,
      email: (a.email as string) ?? '',
      anak: (tautan ?? [])
        .filter(t => t.family_id === a.id)
        .map(t => namaSiswa.get(t.student_id as string))
        .filter((n): n is string => !!n),
    }))
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={breadcrumbHref} className="hover:text-blue-600">{breadcrumbLabel}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{pageTitle}</span>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">{pageTitle}</h1>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 max-w-xl">
        <CreateUserForm initialRole={initialRole} orangTua={orangTua} />
      </div>
    </div>
  )
}
