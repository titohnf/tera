import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_KODE } from '@/lib/umum'
import { tampilanDariHost } from '@/lib/tampilan'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import type { UserRole } from '@/lib/types/database'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const h = await headers()
  const diSora = tampilanDariHost(h.get('x-forwarded-host') ?? h.get('host')) === 'sora'

  if (!user) {
    // Peserta umum hanya membawa cookie kode, tanpa sesi akun.
    if (diSora && (await cookies()).get(COOKIE_KODE)) redirect('/umum')
    redirect('/login')
  }

  // Use admin client to avoid RLS recursion on profiles query
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: UserRole } | null; error: unknown }

  // Alamat sora: siswa bimbel yang masuk dengan kode memakai sesi akun keluarga, tujuannya
  // tampilan siswa. (Admin dan tutor tetap diantar proxy ke alamat app.)
  if (diSora && profile?.role === 'parent') {
    const { data: anak } = await admin
      .from('family_students')
      .select('student_id')
      .eq('family_id', user.id)
      .order('created_at')
      .limit(1)
    const studentId = (anak as { student_id: string }[] | null)?.[0]?.student_id
    if (studentId) redirect(`/siswa/${studentId}`)
  }

  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role === 'tutor') redirect('/tutor')
  if (profile?.role === 'parent') redirect('/keluarga')
  if (profile?.role === 'mandiri') redirect('/mandiri')
  redirect('/unauthorized')
}
