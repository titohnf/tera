import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MaterialUploader from '@/components/materials/MaterialUploader'
import MaterialList from '@/components/materials/MaterialList'

export default async function MaterialsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const user = await getUser()
  if (!user) return null
  const supabase = createAdminClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, class_id, topic, classes(name)')
    .eq('id', sessionId)
    .eq('tutor_id', user.id)
    .single()

  if (!session) notFound()

  const { data: materials } = await supabase
    .from('materials')
    .select('id, title, file_path, link_url, mime_type, file_size_bytes, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  const cls = (session.classes as unknown as { name: string } | null)

  return (
    <div>
      <Link
        href={`/tutor/sessions/${sessionId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Detail Sesi
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Materi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cls?.name} — {session.topic ?? 'Topik belum ditentukan'}</p>
        </div>
      </div>

      <MaterialUploader
        sessionId={sessionId}
        tutorId={user.id}
        classId={session.class_id}
      />

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Materi Terupload ({materials?.length ?? 0})
        </h2>
        <MaterialList materials={materials ?? []} sessionId={sessionId} />
      </div>
    </div>
  )
}
