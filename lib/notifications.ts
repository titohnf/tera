import { createAdminClient } from '@/lib/supabase/server-admin'
import type { NotificationItem } from '@/components/layout/HeaderNotifications'

const REQUEST_LABEL: Record<string, string> = {
  cancel: 'Pembatalan Sesi',
  reschedule: 'Reschedule Sesi',
  change_tutor: 'Ganti Tutor',
}

function classSubjectLabel(classes: { name: string } | null, subjects: { name: string } | null): string {
  const className = classes?.name ?? 'Kelas'
  return subjects?.name ? `${className} — ${subjects.name}` : className
}

export async function getTutorNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = createAdminClient()

  const [{ data: swapRequestsRaw }, { data: resolvedNoticesRaw }, { data: swapOutcomeRaw }] = await Promise.all([
    supabase
      .from('session_change_requests')
      .select('id, session_id, created_at, sessions(classes(name), subjects(name)), requester:profiles!requested_by(full_name)')
      .eq('new_tutor_id', userId)
      .eq('status', 'pending')
      .is('new_tutor_confirmed', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('session_change_requests')
      .select('id, session_id, request_type, status, reviewed_at, created_at, sessions(classes(name), subjects(name))')
      .eq('requested_by', userId)
      .in('status', ['approved', 'rejected'])
      .is('acknowledged_at', null)
      .order('reviewed_at', { ascending: true }),
    supabase
      .from('session_change_requests')
      .select('id, session_id, status, reviewed_at, created_at, sessions(classes(name), subjects(name))')
      .eq('new_tutor_id', userId)
      .in('status', ['approved', 'rejected'])
      .eq('new_tutor_confirmed', true)
      .not('reviewed_by', 'is', null)
      .is('new_tutor_acknowledged_at', null)
      .order('reviewed_at', { ascending: true }),
  ])

  const items: NotificationItem[] = []

  for (const r of (swapRequestsRaw ?? []) as unknown as {
    id: string; session_id: string; created_at: string
    sessions: { classes: { name: string } | null; subjects: { name: string } | null } | null
    requester: { full_name: string } | null
  }[]) {
    items.push({
      id: `swap-${r.id}`,
      title: `${r.requester?.full_name ?? 'Tutor lain'} mengajukan agar kamu menggantikan sesi`,
      subtitle: classSubjectLabel(r.sessions?.classes ?? null, r.sessions?.subjects ?? null),
      createdAt: r.created_at,
      href: `/tutor/sessions/${r.session_id}`,
    })
  }

  for (const r of (resolvedNoticesRaw ?? []) as unknown as {
    id: string; session_id: string; created_at: string; reviewed_at: string | null
    request_type: 'cancel' | 'reschedule' | 'change_tutor'; status: 'approved' | 'rejected'
    sessions: { classes: { name: string } | null; subjects: { name: string } | null } | null
  }[]) {
    items.push({
      id: `resolved-${r.id}`,
      title: `Pengajuan ${REQUEST_LABEL[r.request_type]} ${r.status === 'approved' ? 'disetujui' : 'ditolak'}`,
      subtitle: classSubjectLabel(r.sessions?.classes ?? null, r.sessions?.subjects ?? null),
      createdAt: r.reviewed_at ?? r.created_at,
      href: `/tutor/sessions/${r.session_id}`,
    })
  }

  for (const r of (swapOutcomeRaw ?? []) as unknown as {
    id: string; session_id: string; status: 'approved' | 'rejected'; created_at: string; reviewed_at: string | null
    sessions: { classes: { name: string } | null; subjects: { name: string } | null } | null
  }[]) {
    items.push({
      id: `swap-outcome-${r.id}`,
      title: r.status === 'approved'
        ? 'Admin menyetujui pengajuan ganti tutor yang sebelumnya kamu setujui'
        : 'Admin menolak pengajuan ganti tutor yang sebelumnya kamu setujui',
      subtitle: classSubjectLabel(r.sessions?.classes ?? null, r.sessions?.subjects ?? null),
      createdAt: r.reviewed_at ?? r.created_at,
      href: `/tutor/sessions/${r.session_id}`,
    })
  }

  return items
}

export async function getAdminNotifications(): Promise<NotificationItem[]> {
  const supabase = createAdminClient()

  // A change_tutor request isn't actionable by admin until the proposed
  // tutor has confirmed — cancel/reschedule requests have no such step and
  // are always actionable once pending.
  const { data } = await supabase
    .from('session_change_requests')
    .select('id, request_type, created_at, sessions(classes(name), subjects(name)), requester:profiles!requested_by(full_name)')
    .eq('status', 'pending')
    .or('request_type.neq.change_tutor,new_tutor_confirmed.eq.true')
    .order('created_at', { ascending: true })
    .limit(20)

  return ((data ?? []) as unknown as {
    id: string; request_type: 'cancel' | 'reschedule' | 'change_tutor'; created_at: string
    sessions: { classes: { name: string } | null; subjects: { name: string } | null } | null
    requester: { full_name: string } | null
  }[]).map(r => ({
    id: r.id,
    title: `${r.requester?.full_name ?? 'Tutor'} mengajukan ${REQUEST_LABEL[r.request_type]}`,
    subtitle: classSubjectLabel(r.sessions?.classes ?? null, r.sessions?.subjects ?? null),
    createdAt: r.created_at,
    href: '/admin/session-requests?status=pending',
  }))
}
