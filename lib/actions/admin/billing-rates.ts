'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type BillingRate = {
  id?: string
  class_type: 'group' | 'private'
  jenjang: string
  jenis: string
  amount: number
}

export type BillingRatePeriod = {
  id: string
  name: string
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return admin
}

export async function saveBillingRates(
  rates: BillingRate[],
  periodId: string
): Promise<{ error: string } | null> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Tidak diizinkan' }

  for (const r of rates) {
    if (isNaN(r.amount) || r.amount < 0) return { error: 'Tarif tidak valid' }
  }

  const { error: delErr } = await admin
    .from('billing_rates')
    .delete()
    .eq('period_id', periodId)
  if (delErr) return { error: delErr.message }

  if (rates.length > 0) {
    const { error: insErr } = await admin.from('billing_rates').insert(
      rates.map(({ class_type, jenjang, jenis, amount }) => ({
        class_type, jenjang, jenis, amount, period_id: periodId,
      }))
    )
    if (insErr) return { error: insErr.message }
  }

  revalidatePath('/admin/billing-rates')
  return null
}

export async function createBillingRatePeriod(
  name: string,
  startDate: string,
  endDate: string | null,
  copyFromPeriodId: string | null
): Promise<{ error: string } | { id: string }> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Tidak diizinkan' }

  if (!name.trim()) return { error: 'Nama periode wajib diisi' }
  if (!startDate) return { error: 'Tanggal mulai wajib diisi' }

  const { data: period, error: periodErr } = await admin
    .from('billing_rate_periods')
    .insert({ name: name.trim(), start_date: startDate, end_date: endDate || null, is_active: false })
    .select('id')
    .single()

  if (periodErr) return { error: periodErr.message }

  if (copyFromPeriodId) {
    const { data: sourceRates } = await admin
      .from('billing_rates')
      .select('class_type, jenjang, jenis, amount')
      .eq('period_id', copyFromPeriodId)

    if (sourceRates && sourceRates.length > 0) {
      await admin.from('billing_rates').insert(
        sourceRates.map(r => ({ ...r, period_id: period.id }))
      )
    }
  }

  revalidatePath('/admin/billing-rates')
  return { id: period.id }
}

export async function setActiveBillingPeriod(periodId: string): Promise<{ error: string } | null> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Tidak diizinkan' }

  await admin.from('billing_rate_periods').update({ is_active: false }).neq('id', periodId)
  const { error } = await admin.from('billing_rate_periods').update({ is_active: true }).eq('id', periodId)
  if (error) return { error: error.message }

  revalidatePath('/admin/billing-rates')
  return null
}

export async function deleteBillingRatePeriod(periodId: string): Promise<{ error: string } | null> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Tidak diizinkan' }

  const { data: period } = await admin
    .from('billing_rate_periods')
    .select('is_active')
    .eq('id', periodId)
    .single()
  if (period?.is_active) return { error: 'Periode aktif tidak dapat dihapus' }

  const { error } = await admin.from('billing_rate_periods').delete().eq('id', periodId)
  if (error) return { error: error.message }

  revalidatePath('/admin/billing-rates')
  return null
}
