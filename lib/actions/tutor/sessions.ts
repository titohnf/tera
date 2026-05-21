'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { checkAndCompleteSession } from '@/lib/actions/session-completion'

export async function updateSessionTopicTutor(sessionId: string, topic: string) {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  const { data: session } = await admin
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('tutor_id', user.id)
    .single()

  if (!session) return { error: 'Sesi tidak ditemukan' }

  const { error } = await admin
    .from('sessions')
    .update({ topic: topic.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) return { error: error.message }

  await checkAndCompleteSession(sessionId)

  revalidatePath(`/tutor/sessions/${sessionId}`)
  revalidatePath(`/admin/sessions/${sessionId}`)
  return { success: true }
}
