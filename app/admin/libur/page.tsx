import { createAdminClient } from '@/lib/supabase/server-admin'
import HolidayManager from '@/components/admin/holidays/HolidayManager'
import type { Holiday } from '@/lib/holidays'

export default async function LiburPage() {
  const admin = createAdminClient()

  const { data: holidays } = await admin
    .from('holidays')
    .select('id, holiday_date, name, kind, notes')
    .order('holiday_date', { ascending: false }) as unknown as { data: Holiday[] | null }

  const rows = holidays ?? []

  // Jumlah sesi yang bentrok dihitung sekali untuk semua tanggal sekaligus,
  // bukan satu query per baris. Batas harinya digeser ke WIB dengan cara yang
  // sama seperti di lib/actions/admin/holidays.ts — sesi jam 07:00 WIB jatuh di
  // tanggal UTC sebelumnya dan akan luput kalau dibandingkan mentah-mentah.
  const clashCounts: Record<string, number> = {}
  if (rows.length > 0) {
    const dates = rows.map(r => r.holiday_date).sort()
    const first = dates[0].split('-').map(Number)
    const last = dates[dates.length - 1].split('-').map(Number)
    const rangeStart = new Date(Date.UTC(first[0], first[1] - 1, first[2], -7)).toISOString()
    const rangeEnd = new Date(Date.UTC(last[0], last[1] - 1, last[2] + 1, -7)).toISOString()

    const { data: sessions } = await admin
      .from('sessions')
      .select('scheduled_at')
      .neq('status', 'cancelled')
      .gte('scheduled_at', rangeStart)
      .lt('scheduled_at', rangeEnd)
      .limit(5000) as unknown as { data: { scheduled_at: string }[] | null }

    const countByDay = new Map<string, number>()
    for (const s of sessions ?? []) {
      const wibDay = new Date(new Date(s.scheduled_at).getTime() + 7 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
      countByDay.set(wibDay, (countByDay.get(wibDay) ?? 0) + 1)
    }
    for (const r of rows) {
      clashCounts[r.id] = countByDay.get(r.holiday_date) ?? 0
    }
  }

  return <HolidayManager holidays={rows} clashCounts={clashCounts} />
}
