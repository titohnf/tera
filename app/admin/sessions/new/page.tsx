import { createAdminClient } from '@/lib/supabase/server-admin'
import { createSession } from '@/lib/actions/admin/sessions'
import SessionForm from '@/components/admin/sessions/SessionForm'
import Link from 'next/link'

export default async function NewSessionPage() {
  const admin = createAdminClient()

  const [{ data: classes }, { data: tutors }, { data: subjects }] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, profiles!tutor_id(full_name)')
      .eq('is_active', true)
      .order('name') as unknown as { data: { id: string; name: string; level: string | null; profiles: { full_name: string } | null }[] | null },
    admin
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'tutor')
      .order('full_name') as unknown as { data: { id: string; full_name: string }[] | null },
    admin
      .from('subjects')
      .select('id, name')
      .order('name') as unknown as { data: { id: string; name: string }[] | null },
  ])

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/classes" className="hover:text-blue-600">Kelas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Buat Sesi Baru</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Buat Sesi Baru</h1>
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 max-w-2xl">
        <SessionForm
          action={createSession}
          classes={classes ?? []}
          tutors={tutors ?? []}
          subjects={subjects ?? []}
        />
      </div>
    </div>
  )
}
