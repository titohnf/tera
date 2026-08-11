import type { createAdminClient } from './supabase/server-admin'

/**
 * Sesi yang dibayar = sesi yang jadwalnya sudah lewat dan tidak dibatalkan.
 *
 * Kelengkapan jurnal dan persetujuan admin sengaja tidak jadi syarat: tutor
 * dibayar untuk sesi yang sudah dia ajar. Status jurnalnya dibawa terpisah
 * sebagai keterangan, supaya admin tahu slip mana yang belum layak ditransfer.
 *
 * Batas "sudah lewat" penting saat slip dibuat di tengah bulan berjalan — tanpa
 * itu, sesi yang baru akan datang minggu depan ikut terbayar.
 */
export function hasTakenPlace(session: { status: string; scheduled_at: string }, nowIso: string): boolean {
  return session.status !== 'cancelled' && session.scheduled_at <= nowIso
}

export interface JournalStatusCounts {
  total: number
  approved: number
  pending: number
  rejected: number
  /** Jurnalnya belum diisi tuntas tutor — sesi belum berstatus `completed`. */
  incomplete: number
}

export function emptyJournalCounts(): JournalStatusCounts {
  return { total: 0, approved: 0, pending: 0, rejected: 0, incomplete: 0 }
}

/** Semua sesi terbayar sudah lolos review admin? */
export function isFullyApproved(counts: JournalStatusCounts): boolean {
  return counts.total > 0 && counts.approved === counts.total
}

export function countUnapproved(counts: JournalStatusCounts): number {
  return counts.total - counts.approved
}

type SessionStatusRow = {
  tutor_id: string | null
  status: string
  scheduled_at: string
  payroll_status: string
}

function addSession(counts: JournalStatusCounts, session: SessionStatusRow) {
  counts.total++
  if (session.status !== 'completed') counts.incomplete++
  else if (session.payroll_status === 'approved') counts.approved++
  else if (session.payroll_status === 'rejected') counts.rejected++
  else counts.pending++
}

/**
 * Status jurnal per tutor untuk sesi-sesi yang masuk hitungan slip gaji bulan itu.
 *
 * Dihitung ulang saat halaman dibuka, bukan disimpan di dalam slip: admin bisa
 * menyetujui atau menolak jurnal setelah slipnya dibuat, dan angka yang basi
 * justru menyesatkan keputusan transfer.
 */
export async function fetchJournalStatusByTutor(
  admin: ReturnType<typeof createAdminClient>,
  month: string,
): Promise<Record<string, JournalStatusCounts>> {
  const [year, mon] = month.split('-').map(Number)
  const monthStart = new Date(year, mon - 1, 1).toISOString()
  const monthEnd = new Date(year, mon, 1).toISOString()
  const nowIso = new Date().toISOString()

  const { data } = await admin
    .from('sessions')
    .select('tutor_id, status, scheduled_at, payroll_status')
    .neq('status', 'cancelled')
    .gte('scheduled_at', monthStart)
    .lt('scheduled_at', monthEnd)
    .lte('scheduled_at', nowIso) as unknown as { data: SessionStatusRow[] | null }

  const byTutor: Record<string, JournalStatusCounts> = {}
  for (const session of data ?? []) {
    if (!session.tutor_id) continue
    if (!hasTakenPlace(session, nowIso)) continue
    byTutor[session.tutor_id] ??= emptyJournalCounts()
    addSession(byTutor[session.tutor_id], session)
  }
  return byTutor
}
