'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import type { SalarySchemeRow, AttendanceRow, PayslipRow, PayslipLineItem } from '@/lib/types/database'

// ─── Internal types ────────────────────────────────────────────────────────────

type SessionWithClass = {
  id: string
  class_id: string
  tutor_id: string
  scheduled_at: string
  status: string
  topic: string | null
  classes: { name: string; class_type: string | null; level: string | null } | null
}

type SessionRate = {
  class_type: string
  jenjang: string
  jenis: string
  rate_per_session: number
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function generatePayslipNumber(month: string): string {
  const [year, mon] = month.split('-')
  const seq = Math.floor(Math.random() * 9000) + 1000
  return `SG/${year}${mon}/${seq}`
}

function buildRateMap(rates: SessionRate[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const r of rates) {
    const key = `${r.class_type}|${r.jenjang}`
    if (r.jenis === 'Reguler' || !(key in map)) map[key] = r.rate_per_session
  }
  return map
}

// ─── Core computation (reused by both single and batch generation) ──────────────

function computePayslipData(params: {
  tutorId: string
  tutorName: string
  month: string
  adminUserId: string
  sessions: SessionWithClass[]
  schemeByClassId: Record<string, SalarySchemeRow>
  attendancesBySession: Record<string, Pick<AttendanceRow, 'session_id' | 'status'>[]>
  studentNamesByClass: Record<string, string[]>
  rateMap: Record<string, number>
}) {
  const { tutorId, tutorName, month, adminUserId, sessions, schemeByClassId, attendancesBySession, studentNamesByClass, rateMap } = params

  const [year, mon] = month.split('-').map(Number)
  const payDate = new Date(year, mon, 1)

  const lineItems: PayslipLineItem[] = sessions.map(session => {
    const scheme = schemeByClassId[session.class_id]
    const cls = session.classes
    const attendancesForSession = attendancesBySession[session.id] ?? []
    const studentsPresent = attendancesForSession.filter(
      a => a.status === 'present' || a.status === 'late'
    ).length

    let baseAmount = 0
    if (scheme && scheme.base_amount > 0) {
      baseAmount = scheme.base_amount
    } else if (cls?.class_type && cls?.level) {
      baseAmount = rateMap[`${cls.class_type}|${cls.level}`] ?? 0
    }

    let bonusAmount = 0
    if (scheme?.bonus_type === 'student_count' && scheme.bonus_threshold !== null) {
      if (studentsPresent >= scheme.bonus_threshold) bonusAmount = scheme.bonus_amount
    }

    const baseName = cls?.name ?? ''
    const studentNames = studentNamesByClass[session.class_id] ?? []
    const studentLabel = studentNames.join(', ')
    const classNameFull = studentLabel && !baseName.toLowerCase().includes(studentLabel.toLowerCase())
      ? `${baseName} (${studentLabel})`
      : baseName

    return {
      sessionId: session.id,
      scheduledAt: session.scheduled_at,
      className: classNameFull,
      topic: session.topic,
      studentsPresent,
      baseAmount,
      bonusAmount,
      totalAmount: baseAmount + bonusAmount,
    }
  })

  return {
    payslip_number: generatePayslipNumber(month),
    tutor_id: tutorId,
    tutor_name: tutorName,
    month,
    pay_date: payDate.toISOString().slice(0, 10),
    total_sessions: lineItems.length,
    base_total: lineItems.reduce((s, i) => s + i.baseAmount, 0),
    bonus_total: lineItems.reduce((s, i) => s + i.bonusAmount, 0),
    grand_total: lineItems.reduce((s, i) => s + i.totalAmount, 0),
    line_items: lineItems,
    status: 'draft' as const,
    created_by: adminUserId,
  }
}

// ─── Shared data fetcher ────────────────────────────────────────────────────────

async function fetchSharedData(month: string, supabase: ReturnType<typeof createAdminClient>) {
  const startDate = `${month}-01T00:00:00.000Z`
  const endDate = new Date(
    new Date(startDate).getFullYear(),
    new Date(startDate).getMonth() + 1,
    1
  ).toISOString()

  const [
    { data: sessions },
    { data: activePeriod },
  ] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, class_id, tutor_id, scheduled_at, status, topic, classes(name, class_type, level)')
      .in('status', ['completed', 'scheduled', 'ongoing'])
      .gte('scheduled_at', startDate)
      .lt('scheduled_at', endDate) as unknown as Promise<{ data: SessionWithClass[] | null }>,

    supabase.from('rate_periods').select('id').eq('is_active', true).limit(1).single(),
  ])

  const sessionList = sessions ?? []
  const sessionIds = sessionList.map(s => s.id)
  const classIds = [...new Set(sessionList.map(s => s.class_id))]
  const tutorIds = [...new Set(sessionList.map(s => s.tutor_id))]

  const [
    { data: activeRates },
    { data: schemes },
    { data: classStudents },
    { data: attendances },
    { data: tutorProfiles },
  ] = await Promise.all([
    activePeriod?.id
      ? supabase
          .from('session_rates')
          .select('class_type, jenjang, jenis, rate_per_session')
          .eq('period_id', activePeriod.id) as unknown as Promise<{ data: SessionRate[] | null }>
      : Promise.resolve({ data: [] as SessionRate[] }),

    tutorIds.length > 0
      ? supabase
          .from('salary_schemes')
          .select('*')
          .in('tutor_id', tutorIds) as unknown as Promise<{ data: SalarySchemeRow[] | null }>
      : Promise.resolve({ data: [] as SalarySchemeRow[] }),

    classIds.length > 0
      ? supabase
          .from('class_students')
          .select('class_id, profiles!student_id(full_name)')
          .in('class_id', classIds)
          .eq('is_active', true) as unknown as Promise<{ data: { class_id: string; profiles: { full_name: string } | null }[] | null }>
      : Promise.resolve({ data: [] as { class_id: string; profiles: { full_name: string } | null }[] }),

    sessionIds.length > 0
      ? supabase
          .from('attendances')
          .select('session_id, status')
          .in('session_id', sessionIds) as unknown as Promise<{ data: Pick<AttendanceRow, 'session_id' | 'status'>[] | null }>
      : Promise.resolve({ data: [] as Pick<AttendanceRow, 'session_id' | 'status'>[] }),

    tutorIds.length > 0
      ? supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', tutorIds) as unknown as Promise<{ data: { id: string; full_name: string }[] | null }>
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ])

  // Build lookup maps
  const rateMap = buildRateMap(activeRates ?? [])

  const schemeByClassId = Object.fromEntries((schemes ?? []).map(s => [s.class_id, s]))

  const studentNamesByClass: Record<string, string[]> = {}
  for (const cs of classStudents ?? []) {
    if (!studentNamesByClass[cs.class_id]) studentNamesByClass[cs.class_id] = []
    if (cs.profiles?.full_name) studentNamesByClass[cs.class_id].push(cs.profiles.full_name)
  }

  const attendancesBySession: Record<string, Pick<AttendanceRow, 'session_id' | 'status'>[]> = {}
  for (const a of attendances ?? []) {
    if (!attendancesBySession[a.session_id]) attendancesBySession[a.session_id] = []
    attendancesBySession[a.session_id].push(a)
  }

  const tutorNameById = Object.fromEntries((tutorProfiles ?? []).map(p => [p.id, p.full_name]))

  // Group sessions by tutor
  const sessionsByTutor: Record<string, SessionWithClass[]> = {}
  for (const s of sessionList) {
    if (!sessionsByTutor[s.tutor_id]) sessionsByTutor[s.tutor_id] = []
    sessionsByTutor[s.tutor_id].push(s)
  }

  return { sessionsByTutor, schemeByClassId, attendancesBySession, studentNamesByClass, rateMap, tutorNameById, tutorIds }
}

// ─── Auto-generate drafts untuk semua tutor di bulan tertentu ──────────────────

export async function autoGenerateDraftPayslips(
  month: string
): Promise<{ generated: number; skipped: number; error?: string }> {
  const adminUser = await getUser()
  if (!adminUser) return { generated: 0, skipped: 0, error: 'Tidak diizinkan' }

  const supabase = createAdminClient()

  const { sessionsByTutor, schemeByClassId, attendancesBySession, studentNamesByClass, rateMap, tutorNameById, tutorIds } =
    await fetchSharedData(month, supabase)

  if (tutorIds.length === 0) return { generated: 0, skipped: 0 }

  // Cek payslip yang sudah ada (aktif maupun soft-deleted)
  const { data: existingPayslips } = await supabase
    .from('payslips')
    .select('id, tutor_id, is_deleted')
    .eq('month', month)
    .in('tutor_id', tutorIds)

  const activeByTutor = new Map<string, string>()
  const deletedByTutor = new Map<string, string>()
  for (const p of existingPayslips ?? []) {
    if (p.is_deleted) deletedByTutor.set(p.tutor_id, p.id)
    else activeByTutor.set(p.tutor_id, p.id)
  }

  const tutorsMissing = tutorIds.filter(id => !activeByTutor.has(id))
  if (tutorsMissing.length === 0) return { generated: 0, skipped: tutorIds.length }

  const toInsert: ReturnType<typeof computePayslipData>[] = []
  const toRestore: { id: string; data: ReturnType<typeof computePayslipData> }[] = []

  for (const tutorId of tutorsMissing) {
    const completedSessions = (sessionsByTutor[tutorId] ?? []).filter(s => s.status === 'completed')
    const data = computePayslipData({
      tutorId,
      tutorName: tutorNameById[tutorId] ?? '',
      month,
      adminUserId: adminUser.id,
      sessions: completedSessions,
      schemeByClassId,
      attendancesBySession,
      studentNamesByClass,
      rateMap,
    })
    const deletedId = deletedByTutor.get(tutorId)
    if (deletedId) toRestore.push({ id: deletedId, data })
    else toInsert.push(data)
  }

  const results = await Promise.allSettled([
    toInsert.length > 0 ? supabase.from('payslips').insert(toInsert) : Promise.resolve({ error: null }),
    ...toRestore.map(({ id, data }) =>
      supabase.from('payslips')
        .update({ ...data, is_deleted: false, updated_at: new Date().toISOString() })
        .eq('id', id)
    ),
  ])

  const failed = results.filter(r => r.status === 'rejected').length
  if (failed > 0) return { generated: 0, skipped: tutorIds.length, error: 'Sebagian gagal dibuat' }

  revalidatePath('/admin/payslips')
  return {
    generated: toInsert.length + toRestore.length,
    skipped: tutorIds.length - tutorsMissing.length,
  }
}

// ─── Generate / regenerate satu payslip (dipakai dari form manual) ─────────────

export async function generatePayslip(tutorId: string, month: string) {
  const adminUser = await getUser()
  if (!adminUser) throw new Error('Unauthorized')

  const supabase = createAdminClient()

  const startDate = `${month}-01T00:00:00.000Z`
  const endDate = new Date(
    new Date(startDate).getFullYear(),
    new Date(startDate).getMonth() + 1,
    1
  ).toISOString()

  const [
    { data: tutorProfile },
    { data: sessions },
    { data: schemes },
    { data: activePeriod },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', tutorId).single(),
    supabase
      .from('sessions')
      .select('id, class_id, tutor_id, scheduled_at, status, topic, classes(name, class_type, level)')
      .eq('tutor_id', tutorId)
      .eq('status', 'completed')
      .gte('scheduled_at', startDate)
      .lt('scheduled_at', endDate) as unknown as Promise<{ data: SessionWithClass[] | null }>,
    supabase
      .from('salary_schemes')
      .select('*')
      .eq('tutor_id', tutorId) as unknown as Promise<{ data: SalarySchemeRow[] | null }>,
    supabase.from('rate_periods').select('id').eq('is_active', true).limit(1).single(),
  ])

  if (!tutorProfile) throw new Error('Tutor tidak ditemukan')

  const sessionList = sessions ?? []
  const classIds = [...new Set(sessionList.map(s => s.class_id))]
  const sessionIds = sessionList.map(s => s.id)

  const [
    { data: activeRates },
    { data: classStudents },
    { data: attendances },
  ] = await Promise.all([
    activePeriod?.id
      ? supabase
          .from('session_rates')
          .select('class_type, jenjang, jenis, rate_per_session')
          .eq('period_id', activePeriod.id) as unknown as Promise<{ data: SessionRate[] | null }>
      : Promise.resolve({ data: [] as SessionRate[] }),

    classIds.length > 0
      ? supabase
          .from('class_students')
          .select('class_id, profiles!student_id(full_name)')
          .in('class_id', classIds)
          .eq('is_active', true) as unknown as Promise<{ data: { class_id: string; profiles: { full_name: string } | null }[] | null }>
      : Promise.resolve({ data: [] as { class_id: string; profiles: { full_name: string } | null }[] }),

    sessionIds.length > 0
      ? supabase
          .from('attendances')
          .select('session_id, status')
          .in('session_id', sessionIds) as unknown as Promise<{ data: Pick<AttendanceRow, 'session_id' | 'status'>[] | null }>
      : Promise.resolve({ data: [] as Pick<AttendanceRow, 'session_id' | 'status'>[] }),
  ])

  const rateMap = buildRateMap(activeRates ?? [])
  const schemeByClassId = Object.fromEntries((schemes ?? []).map(s => [s.class_id, s]))

  const studentNamesByClass: Record<string, string[]> = {}
  for (const cs of classStudents ?? []) {
    if (!studentNamesByClass[cs.class_id]) studentNamesByClass[cs.class_id] = []
    if (cs.profiles?.full_name) studentNamesByClass[cs.class_id].push(cs.profiles.full_name)
  }

  const attendancesBySession: Record<string, Pick<AttendanceRow, 'session_id' | 'status'>[]> = {}
  for (const a of attendances ?? []) {
    if (!attendancesBySession[a.session_id]) attendancesBySession[a.session_id] = []
    attendancesBySession[a.session_id].push(a)
  }

  const payslipData = computePayslipData({
    tutorId,
    tutorName: tutorProfile.full_name,
    month,
    adminUserId: adminUser.id,
    sessions: sessionList,
    schemeByClassId,
    attendancesBySession,
    studentNamesByClass,
    rateMap,
  })

  const { data: existing } = await supabase
    .from('payslips')
    .select('id')
    .eq('tutor_id', tutorId)
    .eq('month', month)
    .single()

  let result
  if (existing) {
    result = await supabase
      .from('payslips')
      .update({ ...payslipData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id')
      .single()
  } else {
    result = await supabase.from('payslips').insert(payslipData).select('id').single()
  }

  if (result.error) throw new Error(result.error.message)

  revalidatePath('/admin/payslips')
  return result.data as { id: string }
}

// ─── Actions lainnya ───────────────────────────────────────────────────────────

export async function sendPayslip(payslipId: string) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('payslips')
    .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', payslipId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/payslips')
  revalidatePath(`/admin/payslips/${payslipId}`)
}

export async function markPayslipPaid(payslipId: string, paymentReference?: string) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('payslips')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_reference: paymentReference ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payslipId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/payslips')
  revalidatePath(`/admin/payslips/${payslipId}`)
}

export async function updatePayslipNotes(payslipId: string, notes: string) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('payslips')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', payslipId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/payslips/${payslipId}`)
}

export async function deletePayslip(payslipId: string) {
  const user = await getUser()
  if (!user) throw new Error('Unauthorized')

  const supabase = createAdminClient()
  // Soft-delete: tandai is_deleted=true agar auto-generate tidak recreate
  const { error } = await supabase
    .from('payslips')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', payslipId)
    .eq('status', 'draft')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/payslips')
}
