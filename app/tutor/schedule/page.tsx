import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
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
    .select('id, scheduled_at, status, classes(name)')
    .eq('tutor_id', user.id)
    .gte('scheduled_at', startOfMonth)
    .lte('scheduled_at', endOfMonth)
    .order('scheduled_at', { ascending: true }) as unknown as {
      data: {
        id: string
        scheduled_at: string
        status: string
        classes: { name: string } | null
      }[] | null
    }

  const events = (sessions ?? []).map(s => ({
    id: s.id,
    scheduled_at: s.scheduled_at,
    status: s.status,
    className: s.classes?.name ?? 'Kelas',
    tutorName: null,
  }))

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Jadwal</h1>

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
