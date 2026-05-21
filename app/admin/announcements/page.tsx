import { createAdminClient } from '@/lib/supabase/server-admin'
import AnnouncementManager from '@/components/admin/announcements/AnnouncementManager'

type AnnouncementRow = {
  id: string
  title: string
  body: string
  target_roles: string[] | null
  is_active: boolean
  published_at: string
  profiles: { full_name: string } | null
}

export default async function AnnouncementsPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('announcements')
    .select('id, title, body, target_roles, is_active, published_at, profiles!created_by(full_name)')
    .order('published_at', { ascending: false }) as unknown as { data: AnnouncementRow[] | null }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Pengumuman</h1>
        <p className="text-sm text-gray-500 mt-1">Buat dan kelola pengumuman untuk tutor dan siswa.</p>
      </div>
      <AnnouncementManager announcements={data ?? []} />
    </div>
  )
}
