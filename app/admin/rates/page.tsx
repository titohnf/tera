import { createAdminClient } from '@/lib/supabase/server-admin'
import RatesPageClient from '@/components/admin/rates/RatesPageClient'
import type { SessionRate, RatePeriod } from '@/lib/actions/admin/session-rates'

export default async function SessionRatesPage() {
  const admin = createAdminClient()

  const [{ data: periods }, { data: rates }] = await Promise.all([
    admin
      .from('rate_periods')
      .select('id, name, start_date, end_date, is_active, created_at')
      .order('start_date', { ascending: false }),
    admin
      .from('session_rates')
      .select('id, period_id, class_type, jenjang, jenis, rate_per_session'),
  ])

  return (
    <RatesPageClient
      periods={(periods ?? []) as RatePeriod[]}
      allRates={(rates ?? []) as (SessionRate & { period_id: string })[]}
    />
  )
}
