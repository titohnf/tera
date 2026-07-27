import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { getTutorGroupsForDate, buildDailyMessageText, formatDateLabel, todayWib } from '@/lib/daily-message'
import DailyMessageClient from '@/components/admin/pesan-harian/DailyMessageClient'

export default async function DailyMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: dateParam } = await searchParams
  const date = dateParam ?? todayWib()

  const admin = createAdminClient()
  const tutorGroups = await getTutorGroupsForDate(admin, date)
  const message = buildDailyMessageText(formatDateLabel(date), tutorGroups)

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/classes" className="hover:text-blue-600">Kelas</Link>
        <span>/</span>
        <Link href="/admin/sessions" className="hover:text-blue-600">Kalender Sesi</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Pesan Jadwal Harian</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Pesan Jadwal Harian</h1>
      </div>

      <DailyMessageClient date={date} message={message} />
    </div>
  )
}
