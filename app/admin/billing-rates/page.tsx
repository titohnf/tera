import { createAdminClient } from '@/lib/supabase/server-admin'
import BillingRatesPageClient from '@/components/admin/billing-rates/BillingRatesPageClient'
import type { BillingRate, BillingRatePeriod } from '@/lib/actions/admin/billing-rates'

export default async function BillingRatesPage() {
  const admin = createAdminClient()

  const [{ data: periods }, { data: allRates }] = await Promise.all([
    admin
      .from('billing_rate_periods')
      .select('id, name, start_date, end_date, is_active, created_at')
      .order('start_date', { ascending: false }) as unknown as Promise<{ data: BillingRatePeriod[] | null }>,
    admin
      .from('billing_rates')
      .select('id, period_id, class_type, jenjang, jenis, amount') as unknown as Promise<{
        data: (BillingRate & { period_id: string })[] | null
      }>,
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Tarif Bimbel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Grup: harga per bulan · Privat: harga per pertemuan
        </p>
      </div>

      <BillingRatesPageClient
        periods={periods ?? []}
        allRates={allRates ?? []}
      />
    </div>
  )
}
