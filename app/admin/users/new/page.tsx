import CreateUserForm from '@/components/admin/users/CreateUserForm'
import Link from 'next/link'

export default function NewUserPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/users" className="hover:text-blue-600">Pengguna</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Pengguna Baru</span>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">Tambah Pengguna Baru</h1>

      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 max-w-xl">
        <CreateUserForm />
      </div>
    </div>
  )
}
