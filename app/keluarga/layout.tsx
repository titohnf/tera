import Link from 'next/link'
import { keluargaContext } from '@/lib/keluarga'
import HeaderUser from '@/components/layout/HeaderUser'
import { getUser } from '@/lib/supabase/get-user'

export default async function KeluargaLayout({ children }: { children: React.ReactNode }) {
  const { namaKeluarga } = await keluargaContext()
  const user = await getUser()

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="h-14 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 sm:px-6">
        <Link href="/keluarga" className="text-sm font-semibold text-gray-900">
          Tera <span className="font-normal text-gray-400">· Keluarga</span>
        </Link>
        <HeaderUser
          user={{ email: user?.email ?? '', fullName: namaKeluarga, avatarUrl: null }}
          profileHref="/keluarga"
        />
      </header>
      {/* max-w-5xl mengikuti `app/admin/layout.tsx`: beranda anak memakai
          tata letak tiga kolom yang sama dengan halaman detail siswa admin, dan
          di 3xl kolom kanannya terjepit. Di ponsel gridnya tetap menumpuk. */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
