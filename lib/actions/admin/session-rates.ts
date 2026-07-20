'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type SessionRate = {
  id?: string
  class_type: 'group' | 'private' | 'yayasan'
  jenjang: string
  jenis: string
  rate_per_session: number
}

export type RatePeriod = {
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

export async function saveSessionRates(
  rates: SessionRate[],
  periodId: string
): Promise<{ error: string } | null> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Tidak diizinkan' }

  for (const r of rates) {
    if (isNaN(r.rate_per_session) || r.rate_per_session < 0) return { error: 'Tarif tidak valid' }
  }

  const { error: delErr } = await admin
    .from('session_rates')
    .delete()
    .eq('period_id', periodId)
  if (delErr) return { error: delErr.message }

  if (rates.length > 0) {
    const { error: insErr } = await admin.from('session_rates').insert(
      rates.map(({ jenjang, jenis, class_type, rate_per_session }) => ({
        class_type, jenjang, jenis, rate_per_session, period_id: periodId,
      }))
    )
    if (insErr) return { error: insErr.message }
  }

  revalidatePath('/admin/rates')
  return null
}

export async function createRatePeriod(
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
    .from('rate_periods')
    .insert({ name: name.trim(), start_date: startDate, end_date: endDate || null, is_active: false })
    .select('id')
    .single()

  if (periodErr) return { error: periodErr.message }

  if (copyFromPeriodId) {
    const { data: sourceRates } = await admin
      .from('session_rates')
      .select('class_type, jenjang, jenis, rate_per_session')
      .eq('period_id', copyFromPeriodId)

    if (sourceRates && sourceRates.length > 0) {
      await admin.from('session_rates').insert(
        sourceRates.map(r => ({ ...r, period_id: period.id }))
      )
    }
  }

  revalidatePath('/admin/rates')
  return { id: period.id }
}

export async function setActivePeriod(periodId: string): Promise<{ error: string } | null> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Tidak diizinkan' }

  await admin.from('rate_periods').update({ is_active: false }).neq('id', periodId)
  const { error } = await admin.from('rate_periods').update({ is_active: true }).eq('id', periodId)
  if (error) return { error: error.message }

  revalidatePath('/admin/rates')
  return null
}

export async function deleteRatePeriod(periodId: string): Promise<{ error: string } | null> {
  const admin = await verifyAdmin()
  if (!admin) return { error: 'Tidak diizinkan' }

  const { data: period } = await admin.from('rate_periods').select('is_active').eq('id', periodId).single()
  if (period?.is_active) return { error: 'Periode aktif tidak dapat dihapus' }

  const { error } = await admin.from('rate_periods').delete().eq('id', periodId)
  if (error) return { error: error.message }

  revalidatePath('/admin/rates')
  return null
}
