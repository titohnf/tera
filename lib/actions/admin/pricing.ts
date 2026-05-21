'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type ActionState = { error: string } | { success: string } | null

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function updateClassPrice(classId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const price = Number(formData.get('base_price_per_session'))
  if (isNaN(price) || price < 0) return { error: 'Harga tidak valid' }

  const { error } = await ctx.admin
    .from('classes')
    .update({ base_price_per_session: price, updated_at: new Date().toISOString() })
    .eq('id', classId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/pricing/${classId}`)
  revalidatePath('/admin/pricing')
  return { success: 'Harga berhasil diperbarui' }
}

export async function upsertSalaryScheme(classId: string, tutorId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const baseAmount = Number(formData.get('base_amount'))
  const bonusType = formData.get('bonus_type') as 'none' | 'student_count'
  const bonusThreshold = formData.get('bonus_threshold') ? Number(formData.get('bonus_threshold')) : null
  const bonusAmount = Number(formData.get('bonus_amount') ?? 0)
  const effectiveFrom = formData.get('effective_from') as string

  if (isNaN(baseAmount) || baseAmount < 0) return { error: 'Gaji pokok tidak valid' }
  if (!effectiveFrom) return { error: 'Tanggal berlaku wajib diisi' }
  if (bonusType === 'student_count' && (!bonusThreshold || bonusThreshold < 1)) {
    return { error: 'Minimal kehadiran untuk bonus wajib diisi' }
  }

  const { error } = await ctx.admin
    .from('salary_schemes')
    .upsert({
      class_id: classId,
      tutor_id: tutorId,
      base_amount: baseAmount,
      bonus_type: bonusType,
      bonus_threshold: bonusType === 'student_count' ? bonusThreshold : null,
      bonus_amount: bonusType === 'student_count' ? bonusAmount : 0,
      effective_from: effectiveFrom,
    }, { onConflict: 'class_id,tutor_id' })

  if (error) return { error: error.message }
  revalidatePath(`/admin/pricing/${classId}`)
  revalidatePath('/admin/pricing')
  return { success: 'Skema gaji berhasil disimpan' }
}
