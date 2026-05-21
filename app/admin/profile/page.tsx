import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/admin/profile/ProfileForm'

export default async function ProfilePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, phone, email')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi akun dan keamanan.</p>
      </div>
      <ProfileForm
        fullName={profile?.full_name ?? ''}
        phone={profile?.phone ?? ''}
        email={profile?.email ?? user.email ?? ''}
      />
    </div>
  )
}
