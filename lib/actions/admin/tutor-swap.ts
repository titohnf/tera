'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

// Midnight WIB (Asia/Jakarta, UTC+7, no DST) for a given YYYY-MM-DD, as a UTC ISO string.
function wibMidnightIso(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, -7, 0, 0)).toISOString()
}

export async function replaceMainTutor(
  classId: string,
  oldTutorId: string,
  newTutorId: string,
  effectiveDate: string,
): Promise<{ error?: string; movedCount?: number }> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  const { admin } = ctx

  if (!oldTutorId || !newTutorId) return { error: 'Tutor lama dan tutor pengganti wajib dipilih' }
  if (oldTutorId === newTutorId) return { error: 'Tutor pengganti harus berbeda dari tutor lama' }
  if (!effectiveDate || isNaN(new Date(effectiveDate).getTime())) return { error: 'Tanggal berlaku wajib diisi' }

  const [{ data: newTutorProfile }, { data: cls }, { data: slots }] = await Promise.all([
    admin.from('profiles').select('id, role, is_active').eq('id', newTutorId).maybeSingle(),
    admin.from('classes').select('id, tutor_id').eq('id', classId).maybeSingle(),
    admin.from('class_slots').select('slot_index, tutor_id, tutor_ids').eq('class_id', classId),
  ])

  if (!cls) return { error: 'Kelas tidak ditemukan' }
  if (!newTutorProfile || newTutorProfile.role !== 'tutor') return { error: 'Tutor pengganti tidak valid' }
  if (!newTutorProfile.is_active) return { error: 'Tutor pengganti berstatus nonaktif' }

  const isAssignedHere =
    cls.tutor_id === oldTutorId ||
    (slots ?? []).some(s => s.tutor_id === oldTutorId || (s.tutor_ids ?? []).includes(oldTutorId))
  if (!isAssignedHere) return { error: 'Tutor lama tidak terdaftar mengajar di kelas ini' }

  // 1. Reassign class_slots (per-mapel tutor assignments) that point to the old tutor.
  for (const slot of slots ?? []) {
    const nextTutorId = slot.tutor_id === oldTutorId ? newTutorId : slot.tutor_id
    const nextTutorIds = (slot.tutor_ids ?? []).map((t: string) => (t === oldTutorId ? newTutorId : t))
    const tutorIdChanged = nextTutorId !== slot.tutor_id
    const tutorIdsChanged = JSON.stringify(nextTutorIds) !== JSON.stringify(slot.tutor_ids ?? [])
    if (tutorIdChanged || tutorIdsChanged) {
      await admin
        .from('class_slots')
        .update({ tutor_id: nextTutorId, tutor_ids: nextTutorIds })
        .eq('class_id', classId)
        .eq('slot_index', slot.slot_index)
    }
  }

  // 2. classes.tutor_id itself, if it was the old tutor.
  if (cls.tutor_id === oldTutorId) {
    await admin
      .from('classes')
      .update({ tutor_id: newTutorId, updated_at: new Date().toISOString() })
      .eq('id', classId)
  }

  // 3. Move the old tutor's untouched scheduled sessions from the effective
  // date onward to the new tutor. Sessions before that date are left with
  // the old tutor (e.g. they're still teaching up to their last day even
  // though the class is already reassigned going forward). Completed/
  // cancelled sessions, and scheduled sessions that already have a topic/
  // attendance/materials/assessments/notes, are also left alone so history
  // and payroll attribution for what already happened stay with the tutor
  // who actually did it. Sessions with an in-flight per-session swap request
  // are skipped too so this bulk action doesn't race with that.
  const { data: scheduledSessions } = await admin
    .from('sessions')
    .select('id, topic')
    .eq('class_id', classId)
    .eq('tutor_id', oldTutorId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', wibMidnightIso(effectiveDate))

  const candidateIds = (scheduledSessions ?? []).map(s => s.id)
  const untouchedIds = new Set(candidateIds)
  for (const s of scheduledSessions ?? []) {
    if (s.topic?.trim()) untouchedIds.delete(s.id)
  }

  if (candidateIds.length > 0) {
    const [{ data: attendanceRows }, { data: materialRows }, { data: assessmentRows }, { data: noteRows }, { data: pendingRequests }] = await Promise.all([
      admin.from('attendances').select('session_id').in('session_id', candidateIds),
      admin.from('materials').select('session_id').in('session_id', candidateIds),
      admin.from('assessments').select('session_id').in('session_id', candidateIds),
      admin.from('performance_notes').select('session_id').in('session_id', candidateIds),
      admin.from('session_change_requests').select('session_id').in('session_id', candidateIds).eq('status', 'pending'),
    ])
    for (const rows of [attendanceRows, materialRows, assessmentRows, noteRows, pendingRequests]) {
      for (const r of rows ?? []) untouchedIds.delete(r.session_id)
    }
  }

  const idsToMove = [...untouchedIds]
  if (idsToMove.length > 0) {
    const { error: moveError } = await admin
      .from('sessions')
      .update({ tutor_id: newTutorId, updated_at: new Date().toISOString() })
      .in('id', idsToMove)
    if (moveError) return { error: moveError.message }
  }

  // 4. Make sure the new tutor has a salary scheme for this class, so their
  // upcoming sessions here don't silently fall out of payroll — copy the old
  // tutor's scheme if the new tutor doesn't already have one.
  const [{ data: oldScheme }, { data: newScheme }] = await Promise.all([
    admin.from('salary_schemes').select('*').eq('class_id', classId).eq('tutor_id', oldTutorId).maybeSingle(),
    admin.from('salary_schemes').select('id').eq('class_id', classId).eq('tutor_id', newTutorId).maybeSingle(),
  ])
  if (oldScheme && !newScheme) {
    await admin.from('salary_schemes').insert({
      class_id: classId,
      tutor_id: newTutorId,
      base_amount: oldScheme.base_amount,
      bonus_type: oldScheme.bonus_type,
      bonus_threshold: oldScheme.bonus_threshold,
      bonus_amount: oldScheme.bonus_amount,
      effective_from: effectiveDate,
    })
  }

  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath('/admin/classes')
  revalidatePath('/admin/sessions')
  revalidatePath(`/admin/pricing/${classId}`)

  return { movedCount: idsToMove.length }
}
