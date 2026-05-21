import { createClient } from '@/lib/supabase/server'

type AnnouncementRow = {
  id: string
  title: string
  body: string
  target_roles: string[] | null
  published_at: string
  profiles: { full_name: string } | null
}

export default async function TutorAnnouncementsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('announcements')
    .select('id, title, body, target_roles, published_at, profiles!created_by(full_name)')
    .eq('is_active', true)
    .order('published_at', { ascending: false }) as unknown as { data: AnnouncementRow[] | null }

  const announcements = data ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Pengumuman</h1>
        <p className="text-sm text-gray-500 mt-1">Informasi dan pengumuman terbaru dari admin.</p>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Belum ada pengumuman.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{a.title}</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(a.published_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                    {a.profiles?.full_name ? ` · ${a.profiles.full_name}` : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
