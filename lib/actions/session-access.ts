import { createAdminClient } from '@/lib/supabase/server-admin'

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * A tutor can act on a session if they're the assigned tutor_id, or if
 * they're the incoming tutor on a swap request that's confirmed but not
 * yet admin-approved (sessions.tutor_id only flips once the admin approves).
 */
export async function isSessionTutor(admin: AdminClient, sessionId: string, userId: string): Promise<boolean> {
  const { data: session } = await admin.from('sessions').select('tutor_id').eq('id', sessionId).single()
  if (!session) return false
  if (session.tutor_id === userId) return true

  const { data: pendingSwap } = await admin
    .from('session_change_requests')
    .select('id')
    .eq('session_id', sessionId)
    .eq('new_tutor_id', userId)
    .eq('status', 'pending')
    .eq('new_tutor_confirmed', true)
    .maybeSingle()

  return !!pendingSwap
}
