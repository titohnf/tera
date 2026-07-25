'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { syncPrivateClassDraftInvoices } from './invoices'

export type ActionState = { error: string } | null

export type TutorWithMeta = {
  id: string
  full_name: string
  subjects: { subjectId: string; level: string }[]
  availability: { day_of_week: number; start_time: string; end_time: string }[]
}

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function getTutorsWithMeta(): Promise<TutorWithMeta[]> {
  const ctx = await verifyAdmin()
  if (!ctx) return []

  const [
    { data: tutorRows },
    { data: tutorSubjectRows },
    { data: availabilityRows },
  ] = await Promise.all([
    ctx.admin.from('profiles').select('id, full_name').eq('role', 'tutor').order('full_name'),
    ctx.admin.from('tutor_subjects').select('tutor_id, subject_id, level'),
    ctx.admin.from('tutor_availability').select('tutor_id, day_of_week, start_time, end_time'),
  ])

  const subjectsByTutor = new Map<string, { subjectId: string; level: string }[]>()
  for (const ts of tutorSubjectRows ?? []) {
    const tid = (ts as any).tutor_id
    if (!subjectsByTutor.has(tid)) subjectsByTutor.set(tid, [])
    subjectsByTutor.get(tid)!.push({ subjectId: (ts as any).subject_id, level: (ts as any).level ?? '' })
  }

  const availByTutor = new Map<string, { day_of_week: number; start_time: string; end_time: string }[]>()
  for (const a of availabilityRows ?? []) {
    const tid = (a as any).tutor_id
    if (!availByTutor.has(tid)) availByTutor.set(tid, [])
    availByTutor.get(tid)!.push({ day_of_week: (a as any).day_of_week, start_time: (a as any).start_time, end_time: (a as any).end_time })
  }

  return (tutorRows ?? []).map(t => ({
    id: t.id,
    full_name: t.full_name,
    subjects: subjectsByTutor.get(t.id) ?? [],
    availability: availByTutor.get(t.id) ?? [],
  }))
}

export async function createClass(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  type SlotInput = { subjectIds: string[]; tutorIds: string[]; day: number | null; time: string }

  const name = (formData.get('name') as string)?.trim()
  const level = (formData.get('level') as string)?.trim() || null
  const classType = (formData.get('class_type') as string) || null
  const jenis = (formData.get('jenis') as string)?.trim() || null
  const studentIds = formData.getAll('student_ids') as string[]
  const slotsJson = (formData.get('slots_json') as string) || '[]'
  const fokusTypesJson = (formData.get('fokus_types') as string) || '[]'
  const startDate = (formData.get('start_date') as string) || null
  const endDate = (formData.get('end_date') as string) || null
  const durationMinutes = Number(formData.get('duration_minutes') ?? 90)
  const semester = Number(formData.get('semester')) || null
  const academicYear = (formData.get('academic_year') as string)?.trim() || null

  let slots: SlotInput[] = []
  try { slots = JSON.parse(slotsJson) } catch { return { error: 'Data slot tidak valid' } }
  let fokusTypes: string[] = []
  try { fokusTypes = JSON.parse(fokusTypesJson) } catch { fokusTypes = [] }

  if (!name) return { error: 'Nama kelas wajib diisi' }
  if (slots.length === 0) return { error: 'Minimal 1 pertemuan per minggu harus diisi' }
  if (slots.some(s => !s.subjectIds || s.subjectIds.length === 0)) return { error: 'Setiap sesi harus memiliki mata pelajaran' }
  if (slots.some(s => s.subjectIds.some((_, i) => !s.tutorIds[i]))) return { error: 'Setiap mata pelajaran harus memiliki tutor' }
  if (!startDate || !endDate) return { error: 'Tanggal kelas pertama dan terakhir wajib diisi' }
  if (endDate < startDate) return { error: 'Tanggal terakhir harus setelah tanggal pertama' }
  // jenis (Reguler/Fokus) drives the billing_rates lookup for both parent
  // invoices and tutor payroll — without it, invoices/payslips silently
  // compute a Rp0 rate instead of erroring. Yayasan classes skip parent
  // invoicing entirely, so they're exempt.
  if (classType !== 'yayasan' && jenis !== 'reguler' && jenis !== 'fokus') {
    return { error: 'Jenis kelas (Reguler/Fokus) wajib dipilih' }
  }

  const primaryTutorId = slots[0].tutorIds[0]
  const allSubjectIds = [...new Set(slots.flatMap(s => s.subjectIds))]
  const scheduleDays = [...new Set(slots.map(s => s.day).filter((d): d is number => d !== null))]

  const { data, error } = await ctx.admin
    .from('classes')
    .insert({
      name,
      tutor_id: primaryTutorId,
      level,
      class_type: classType,
      jenis,
      fokus_types: fokusTypes,
      base_price_per_session: 0,
      is_active: true,
      schedule_days: scheduleDays,
      schedule_time: slots[0].time || null,
      start_date: startDate,
      end_date: endDate,
      duration_minutes: durationMinutes,
      semester,
      academic_year: academicYear,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  if (allSubjectIds.length > 0) {
    await ctx.admin.from('class_subjects').insert(
      allSubjectIds.map(sid => ({ class_id: data.id, subject_id: sid }))
    )
  }

  await ctx.admin.from('class_slots').insert(
    slots.map((s, i) => ({
      class_id: data.id,
      slot_index: i,
      day_of_week: s.day,
      start_time: s.time || null,
      tutor_id: s.tutorIds[0] ?? null,
      tutor_ids: s.tutorIds,
      subject_ids: s.subjectIds,
    }))
  )

  // Auto-generate sessions for the date range
  const generatedSessions = generateSessionsFromSlots(slots, startDate, endDate, data.id, durationMinutes)
  if (generatedSessions.length > 0) {
    const { error: sessionError } = await ctx.admin.from('sessions').insert(generatedSessions)
    if (sessionError) return { error: `Kelas berhasil dibuat tapi jadwal gagal di-generate: ${sessionError.message}` }
  }

  if (studentIds.length > 0) {
    await ctx.admin.from('class_students').insert(
      studentIds.map(sid => ({
        class_id: data.id,
        student_id: sid,
        enrolled_at: new Date().toISOString(),
        is_active: true,
      }))
    )
  }

  // Invoices are generated on demand from the student's invoice page
  // (lump-sum or monthly, whichever the parent wants) instead of
  // auto-created here, so a class isn't forced onto the lump-sum model
  // before that decision is made.
  redirect(`/admin/classes/${data.id}`)
}

export async function updateClass(classId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  type SlotInput = { subjectIds: string[]; tutorIds: string[]; day: number | null; time: string }

  const name = (formData.get('name') as string)?.trim()
  const level = (formData.get('level') as string)?.trim() || null
  const classType = (formData.get('class_type') as string) || null
  const jenis = (formData.get('jenis') as string)?.trim() || null
  const status = (formData.get('status') as string) || 'aktif'
  const isActive = status === 'aktif'
  const slotsJson = (formData.get('slots_json') as string) || '[]'
  const fokusTypesJson = (formData.get('fokus_types') as string) || '[]'
  const startDate = (formData.get('start_date') as string) || null
  const endDate = (formData.get('end_date') as string) || null
  const durationMinutes = Number(formData.get('duration_minutes') ?? 90)
  const semester = Number(formData.get('semester')) || null
  const academicYear = (formData.get('academic_year') as string)?.trim() || null

  let slots: SlotInput[] = []
  try { slots = JSON.parse(slotsJson) } catch { return { error: 'Data slot tidak valid' } }
  let fokusTypes: string[] = []
  try { fokusTypes = JSON.parse(fokusTypesJson) } catch { fokusTypes = [] }

  if (!name) return { error: 'Nama kelas wajib diisi' }
  if (slots.length === 0) return { error: 'Minimal 1 pertemuan per minggu harus diisi' }
  if (slots.some(s => !s.subjectIds || s.subjectIds.length === 0)) return { error: 'Setiap sesi harus memiliki mata pelajaran' }
  if (slots.some(s => s.subjectIds.some((_, i) => !s.tutorIds[i]))) return { error: 'Setiap mata pelajaran harus memiliki tutor' }
  if (!startDate || !endDate) return { error: 'Tanggal kelas pertama dan terakhir wajib diisi' }
  if (endDate < startDate) return { error: 'Tanggal terakhir harus setelah tanggal pertama' }
  // jenis (Reguler/Fokus) drives the billing_rates lookup for both parent
  // invoices and tutor payroll — without it, invoices/payslips silently
  // compute a Rp0 rate instead of erroring. Yayasan classes skip parent
  // invoicing entirely, so they're exempt.
  if (classType !== 'yayasan' && jenis !== 'reguler' && jenis !== 'fokus') {
    return { error: 'Jenis kelas (Reguler/Fokus) wajib dipilih' }
  }

  const primaryTutorId = slots[0].tutorIds[0]
  const allSubjectIds = [...new Set(slots.flatMap(s => s.subjectIds))]
  const scheduleDays = [...new Set(slots.map(s => s.day).filter((d): d is number => d !== null))]

  const { error } = await ctx.admin
    .from('classes')
    .update({
      name,
      tutor_id: primaryTutorId,
      level,
      class_type: classType,
      jenis,
      fokus_types: fokusTypes,
      is_active: isActive,
      status,
      schedule_days: scheduleDays,
      schedule_time: slots[0].time || null,
      start_date: startDate,
      end_date: endDate,
      duration_minutes: durationMinutes,
      semester,
      academic_year: academicYear,
      updated_at: new Date().toISOString(),
    })
    .eq('id', classId)

  if (error) return { error: error.message }

  await ctx.admin.from('class_subjects').delete().eq('class_id', classId)
  if (allSubjectIds.length > 0) {
    await ctx.admin.from('class_subjects').insert(
      allSubjectIds.map(sid => ({ class_id: classId, subject_id: sid }))
    )
  }

  await ctx.admin.from('class_slots').delete().eq('class_id', classId)
  await ctx.admin.from('class_slots').insert(
    slots.map((s, i) => ({
      class_id: classId,
      slot_index: i,
      day_of_week: s.day,
      start_time: s.time || null,
      tutor_id: s.tutorIds[0] ?? null,
      tutor_ids: s.tutorIds,
      subject_ids: s.subjectIds,
    }))
  )

  // Completed/cancelled sessions are always preserved. Among the remaining
  // "scheduled" sessions, also preserve any the tutor has already started
  // filling in (topic, attendance, notes, materials, or assessments) even
  // though they aren't marked complete yet — only untouched ones get wiped
  // and regenerated, and generation is now allowed to reach into the past.
  const { data: existingSessions } = await ctx.admin
    .from('sessions')
    .select('id, scheduled_at, status, topic')
    .eq('class_id', classId)
    .eq('status', 'scheduled')

  const scheduledSessions = existingSessions ?? []
  const scheduledIds = scheduledSessions.map(s => s.id)

  const filledSessionIds = new Set<string>()
  for (const s of scheduledSessions) {
    if (s.topic?.trim()) filledSessionIds.add(s.id)
  }
  if (scheduledIds.length > 0) {
    const [{ data: attendanceRows }, { data: materialRows }, { data: assessmentRows }, { data: noteRows }] = await Promise.all([
      ctx.admin.from('attendances').select('session_id').in('session_id', scheduledIds),
      ctx.admin.from('materials').select('session_id').in('session_id', scheduledIds),
      ctx.admin.from('assessments').select('session_id').in('session_id', scheduledIds),
      ctx.admin.from('performance_notes').select('session_id').in('session_id', scheduledIds),
    ])
    for (const rows of [attendanceRows, materialRows, assessmentRows, noteRows]) {
      for (const r of rows ?? []) filledSessionIds.add(r.session_id)
    }
  }

  // Compare dates in WIB regardless of the server's local timezone.
  const localDateKey = (iso: string) =>
    new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const idsToDelete = scheduledSessions.filter(s => !filledSessionIds.has(s.id)).map(s => s.id)
  const preservedDateKeys = new Set(
    scheduledSessions.filter(s => filledSessionIds.has(s.id)).map(s => localDateKey(s.scheduled_at))
  )

  if (idsToDelete.length > 0) {
    await ctx.admin.from('sessions').delete().in('id', idsToDelete)
  }

  // Re-generate sessions across the full new date range (including dates in
  // the past), skipping any date that still has a preserved session so we
  // don't double-book it.
  if (startDate! <= endDate!) {
    const newSessions = generateSessionsFromSlots(slots, startDate!, endDate!, classId, durationMinutes)
      .filter(s => !preservedDateKeys.has(localDateKey(s.scheduled_at)))
    if (newSessions.length > 0) {
      await ctx.admin.from('sessions').insert(newSessions)
    }
  }

  await syncPrivateClassDraftInvoices(classId, ctx.admin)

  revalidatePath(`/admin/classes/${classId}`)
  redirect(`/admin/classes/${classId}`)
}

export async function deleteClass(classId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  // Get all session IDs for this class so we can delete payments first
  const { data: sessionRows } = await ctx.admin
    .from('sessions')
    .select('id')
    .eq('class_id', classId)

  if (sessionRows && sessionRows.length > 0) {
    const sessionIds = sessionRows.map(s => s.id)
    // Delete session_payments (may not cascade automatically)
    await ctx.admin.from('session_payments').delete().in('session_id', sessionIds)
  }

  const { error } = await ctx.admin.from('classes').delete().eq('id', classId)
  if (error) return { error: error.message }

  revalidatePath('/admin/classes')
  redirect('/admin/classes')
}

export async function enrollStudent(classId: string, studentId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin.from('class_students').upsert(
    { class_id: classId, student_id: studentId, is_active: true, enrolled_at: new Date().toISOString() },
    { onConflict: 'class_id,student_id' }
  )

  if (error) return { error: error.message }
  revalidatePath(`/admin/classes/${classId}`)
  return null
}

function generateSessionsFromSlots(
  slots: { subjectIds: string[]; tutorIds: string[]; day: number | null; time: string }[],
  startDate: string,
  endDate: string,
  classId: string,
  durationMinutes: number,
) {
  const sessions: {
    class_id: string
    tutor_id: string
    subject_id: string | null
    scheduled_at: string
    duration_minutes: number
    status: 'scheduled'
    location: null
    topic: null
  }[] = []

  // Parse date components directly to avoid UTC vs local timezone mismatch
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)

  // Use UTC midnight so getUTCDay() returns the correct weekday regardless
  // of the server process's local timezone (e.g. Netlify functions run in
  // UTC, not WIB, so relying on the local Date constructor here would shift
  // weekday matching by up to a day depending on where the code executes).
  const end = new Date(Date.UTC(ey, em - 1, ed))
  const current = new Date(Date.UTC(sy, sm - 1, sd))

  // Counts how many times each slot's weekday has occurred since startDate,
  // so a slot with multiple subjectIds rotates through them (and their
  // paired tutorIds at the same index) in order — occurrence 1 -> index 0,
  // occurrence 2 -> index 1, occurrence 3 -> index 0 again, etc. — e.g.
  // Selasa alternating Bahasa Inggris (Tutor A) / IPAS (Tutor B) week to
  // week while Senin stays fixed on Matematika.
  const occurrenceCounts = new Map<number, number>()

  while (current <= end) {
    const dow = current.getUTCDay() // 0=Sun..6=Sat
    slots.forEach((slot, slotIndex) => {
      if (slot.day === null || slot.day !== dow) return
      const occurrence = occurrenceCounts.get(slotIndex) ?? 0
      occurrenceCounts.set(slotIndex, occurrence + 1)
      const rotationIndex = slot.subjectIds.length > 0 ? occurrence % slot.subjectIds.length : 0
      const subjectId = slot.subjectIds.length > 0 ? slot.subjectIds[rotationIndex] : null
      const tutorId = slot.tutorIds[rotationIndex] ?? slot.tutorIds[0]

      const [hStr, mStr] = (slot.time || '00:00').split(':')
      const h = Number(hStr)
      const m = Number(mStr ?? 0)
      // Slot times are entered in WIB (Asia/Jakarta, UTC+7, no DST); convert
      // explicitly instead of using the server's local timezone.
      const scheduled = new Date(Date.UTC(
        current.getUTCFullYear(),
        current.getUTCMonth(),
        current.getUTCDate(),
        h - 7, m, 0, 0,
      ))
      sessions.push({
        class_id: classId,
        tutor_id: tutorId,
        subject_id: subjectId,
        scheduled_at: scheduled.toISOString(),
        duration_minutes: durationMinutes,
        status: 'scheduled',
        location: null,
        topic: null,
      })
    })
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return sessions
}

export async function completeClass(classId: string): Promise<void> {
  const ctx = await verifyAdmin()
  if (!ctx) return

  // Batalkan semua sesi yang masih terjadwal
  await ctx.admin
    .from('sessions')
    .update({ status: 'cancelled' })
    .eq('class_id', classId)
    .in('status', ['scheduled', 'ongoing'])

  await ctx.admin
    .from('classes')
    .update({ status: 'selesai', is_active: false })
    .eq('id', classId)

  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath('/admin/classes')
  redirect(`/admin/classes/${classId}`)
}

export async function unenrollStudent(classId: string, studentId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('class_students')
    .update({ is_active: false })
    .eq('class_id', classId)
    .eq('student_id', studentId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/classes/${classId}`)
  return null
}
