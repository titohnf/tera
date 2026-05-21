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

export async function markAsPaid(paymentId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const reference = (formData.get('payment_reference') as string)?.trim() || null
  const notes = (formData.get('notes') as string)?.trim() || null

  const { error } = await ctx.admin
    .from('session_payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_reference: reference,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)

  if (error) return { error: error.message }
  revalidatePath('/admin/payments')
  revalidatePath(`/admin/payments/${paymentId}`)
  return { success: 'Pembayaran berhasil dikonfirmasi' }
}

export async function cancelPayment(paymentId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('session_payments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', paymentId)

  if (error) return { error: error.message }
  revalidatePath('/admin/payments')
  revalidatePath(`/admin/payments/${paymentId}`)
  return { success: 'Pembayaran dibatalkan' }
}

export async function bulkMarkAsPaid(paymentIds: string[]): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('session_payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in('id', paymentIds)
    .eq('status', 'pending')

  if (error) return { error: error.message }
  revalidatePath('/admin/payments')
  return { success: `${paymentIds.length} pembayaran dikonfirmasi` }
}
