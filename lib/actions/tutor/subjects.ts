'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export async function updateTutorSubjects(
  selections: { subject_id: string; level: string }[]
): Promise<{ error: string } | null> {
  const user = await getUser()
  if (!user) return { error: 'Tidak diizinkan' }

  const admin = createAdminClient()

  const { error: deleteError } = await admin
    .from('tutor_subjects')
    .delete()
    .eq('tutor_id', user.id)

  if (deleteError) return { error: deleteError.message }

  if (selections.length > 0) {
    const { error: insertError } = await admin
      .from('tutor_subjects')
      .insert(selections.map(s => ({ tutor_id: user.id, subject_id: s.subject_id, level: s.level })))

    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/tutor/profile')
  return null
}
