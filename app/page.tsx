import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import type { UserRole } from '@/lib/types/database'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use admin client to avoid RLS recursion on profiles query
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: UserRole } | null; error: unknown }

  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role === 'tutor') redirect('/tutor')
  if (profile?.role === 'parent') redirect('/keluarga')
  redirect('/unauthorized')
}
