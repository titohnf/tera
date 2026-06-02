import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EditUserForm from '@/components/admin/users/EditUserForm'

export default async function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const admin = createAdminClient()

  const { data: user } = await admin
    .from('profiles')
    .select('id, full_name, phone, role, level, grade, parent_name')
    .eq('id', userId)
    .single()

  if (!user) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/users" className="hover:text-blue-600">Pengguna</Link>
        <span>/</span>
        <Link href={`/admin/users/${userId}`} className="hover:text-blue-600">{user.full_name}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Edit</span>
      </div>

      <div className="max-w-xl">
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
          <h1 className="text-sm font-semibold text-gray-700 mb-4">Edit Data Pengguna</h1>
          <EditUserForm
            userId={userId}
            defaultValues={{
              full_name: user.full_name,
              phone: user.phone,
              role: user.role,
              level: (user as any).level ?? null,
              grade: (user as any).grade ?? null,
              parent_name: (user as any).parent_name ?? null,
            }}
          />
        </div>
      </div>
    </div>
  )
}
