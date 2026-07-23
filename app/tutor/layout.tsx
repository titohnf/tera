import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { redirect } from 'next/navigation'
import TutorSidebar from '@/components/layout/TutorSidebar'
import HeaderUser from '@/components/layout/HeaderUser'
import HeaderNotifications from '@/components/layout/HeaderNotifications'
import { getTutorNotifications } from '@/lib/notifications'
import type { UserRole } from '@/lib/types/database'

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single() as { data: { full_name: string; role: UserRole; avatar_url: string | null } | null; error: unknown }

  if (profile?.role !== 'tutor' && profile?.role !== 'admin') {
    redirect('/unauthorized')
  }

  const userData = { email: user.email ?? '', fullName: profile?.full_name ?? '', avatarUrl: profile?.avatar_url ?? null }
  const notifications = await getTutorNotifications(user.id)

  return (
    <div className="flex h-screen bg-slate-100">
      <TutorSidebar />
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 shadow-sm flex items-center justify-end gap-2 px-6 shrink-0">
          <HeaderNotifications items={notifications} />
          <HeaderUser user={userData} profileHref="/tutor/profile" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
