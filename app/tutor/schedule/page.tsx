import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import Link from 'next/link'
import SessionCalendar from '@/components/sessions/SessionCalendar'

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const params = await searchParams
  const user = await getUser()
  if (!user) return null

  const now = new Date()
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth() // 0-indexed

  const startOfMonth = new Date(year, month, 1).toISOString()
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  const admin = createAdminClient()
  const { data: sessions } = await admin
    .from('sessions')
    .select('id, scheduled_at, status, classes(id, name)')
    .eq('tutor_id', user.id)
    .gte('scheduled_at', startOfMonth)
    .lte('scheduled_at', endOfMonth)
    .order('scheduled_at', { ascending: true }) as unknown as {
      data: {
        id: string
        scheduled_at: string
        status: string
        classes: { id: string; name: string } | null
      }[] | null
    }

  const sessionIds = (sessions ?? []).map(s => s.id)
  const { data: pendingRequests } = sessionIds.length > 0
    ? await admin
        .from('session_change_requests')
        .select('session_id')
        .in('session_id', sessionIds)
        .eq('status', 'pending') as unknown as { data: { session_id: string }[] | null }
    : { data: [] as { session_id: string }[] }
  const pendingSessionIds = new Set((pendingRequests ?? []).map(r => r.session_id))

  const events = (sessions ?? []).map(s => ({
    id: s.id,
    scheduled_at: s.scheduled_at,
    status: s.status,
    classId: s.classes?.id ?? null,
    className: s.classes?.name ?? 'Kelas',
    tutorName: null,
    hasPendingChangeRequest: pendingSessionIds.has(s.id),
  }))

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/tutor/classes" className="hover:text-blue-600">Sesi Kelas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Kalender</span>
      </div>

      <SessionCalendar
        sessions={events}
        year={year}
        month={month}
        navBase="/tutor/schedule"
        sessionHrefBase="/tutor/sessions"
      />
    </div>
  )
}
