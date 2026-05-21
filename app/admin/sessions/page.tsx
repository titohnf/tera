import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import SessionCalendar from '@/components/sessions/SessionCalendar'

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const year  = params.year  ? parseInt(params.year)  : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth() // 0-indexed

  const startOfMonth = new Date(year, month, 1).toISOString()
  const endOfMonth   = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  const admin = createAdminClient()
  const { data: sessions } = await admin
    .from('sessions')
    .select('id, scheduled_at, status, classes(name), profiles!tutor_id(full_name)')
    .gte('scheduled_at', startOfMonth)
    .lte('scheduled_at', endOfMonth)
    .order('scheduled_at', { ascending: true }) as unknown as {
      data: {
        id: string
        scheduled_at: string
        status: string
        classes: { name: string } | null
        profiles: { full_name: string } | null
      }[] | null
    }

  const events = (sessions ?? []).map(s => ({
    id: s.id,
    scheduled_at: s.scheduled_at,
    status: s.status,
    className: s.classes?.name ?? 'Kelas',
    tutorName: s.profiles?.full_name ?? null,
  }))

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/classes" className="hover:text-blue-600">Kelas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Kalender Sesi</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Kalender Sesi</h1>
        <Link
          href="/admin/sessions/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Sesi
        </Link>
      </div>

      <SessionCalendar sessions={events} year={year} month={month} />
    </div>
  )
}
