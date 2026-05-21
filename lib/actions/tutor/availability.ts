'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type AvailabilitySlot = {
  day_of_week: number
  start_time: string
  end_time: string
}

export async function updateTutorAvailability(
  slots: AvailabilitySlot[]
): Promise<{ error: string } | null> {
  const user = await getUser()
  if (!user) return { error: 'Tidak diizinkan' }

  for (const s of slots) {
    if (s.start_time >= s.end_time) {
      return { error: 'Jam selesai harus lebih dari jam mulai' }
    }
  }

  const admin = createAdminClient()

  const { error: deleteError } = await admin
    .from('tutor_availability')
    .delete()
    .eq('tutor_id', user.id)

  if (deleteError) return { error: deleteError.message }

  if (slots.length > 0) {
    const { error: insertError } = await admin
      .from('tutor_availability')
      .insert(slots.map(s => ({ tutor_id: user.id, ...s })))

    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/tutor/profile')
  return null
}
