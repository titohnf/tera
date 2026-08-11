'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { buildRateMap, resolveAmounts } from '@/lib/salary'
import { hasTakenPlace } from '@/lib/payroll-journal'
import type { SalarySchemeRow, AttendanceRow, PayslipRow, PayslipLineItem } from '@/lib/types/database'

// ─── Internal types ────────────────────────────────────────────────────────────

type SessionWithClass = {
  id: string
  class_id: string
  tutor_id: string
  scheduled_at: string
  status: string
  payroll_status: string
  topic: string | null
  classes: { name: string; class_type: string | null; level: string | null; jenis: string | null } | null
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

// ─── Core computation (reused by both single and batch generation) ──────────────

function computePayslipData(params: {
  tutorId: string
  tutorName: string
  month: string
  adminUserId: string
  sessions: SessionWithClass[]
  schemeByKey: Record<string, SalarySchemeRow>
  attendancesBySession: Record<string, Pick<AttendanceRow, 'session_id' | 'status'>[]>
  studentNamesByClass: Record<string, string[]>
  rateMap: Record<string, number>
}) {
  const { tutorId, tutorName, month, adminUserId, sessions, schemeByKey, attendancesBySession, studentNamesByClass, rateMap } = params

  const [year, mon] = month.split('-').map(Number)
  const payDate = new Date(year, mon, 1)

  const lineItems: PayslipLineItem[] = sessions.map(session => {
    // Keyed by class_id+tutor_id, not class_id alone — a class can have
    // salary_scheme rows for more than one tutor (e.g. after a main-tutor
    // replacement), and picking the wrong one would silently misprice
    // another tutor's sessions in that class.
    const scheme = schemeByKey[`${session.class_id}:${session.tutor_id}`]
    const cls = session.classes
    const attendancesForSession = attendancesBySession[session.id] ?? []
    const studentsPresent = attendancesForSession.filter(
      a => a.status === 'present' || a.status === 'late'
    ).length

    const { baseAmount, bonusAmount } = resolveAmounts({
      scheme,
      cls,
      studentsPresent,
      rateMap,
    })

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
      .select('id, class_id, tutor_id, scheduled_at, status, payroll_status, topic, classes(name, class_type, level, jenis)')
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

  const schemeByKey = Object.fromEntries((schemes ?? []).map(s => [`${s.class_id}:${s.tutor_id}`, s]))

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

  return { sessionsByTutor, schemeByKey, attendancesBySession, studentNamesByClass, rateMap, tutorNameById, tutorIds }
}

// ─── Auto-generate drafts untuk semua tutor di bulan tertentu ──────────────────

export async function autoGenerateDraftPayslips(
  month: string
): Promise<{ generated: number; skipped: number; removed?: number; error?: string }> {
  const adminUser = await getUser()
  if (!adminUser) return { generated: 0, skipped: 0, error: 'Tidak diizinkan' }

  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()

  const { sessionsByTutor, schemeByKey, attendancesBySession, studentNamesByClass, rateMap, tutorNameById, tutorIds } =
    await fetchSharedData(month, supabase)

  // Bersihkan slip nol-sesi peninggalan form manual lama. Slip seperti itu yatim:
  // tutornya tidak punya sesi di bulan ini sehingga tidak pernah masuk daftar di
  // bawah, jadi tidak akan pernah tersentuh kalau tidak disapu di sini.
  const { data: emptyDrafts } = await supabase
    .from('payslips')
    .select('id')
    .eq('month', month)
    .eq('status', 'draft')
    .eq('is_deleted', false)
    .eq('total_sessions', 0) as unknown as { data: { id: string }[] | null }

  let removed = 0
  if (emptyDrafts && emptyDrafts.length > 0) {
    const { error } = await supabase
      .from('payslips')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .in('id', emptyDrafts.map(d => d.id))
    if (!error) removed = emptyDrafts.length
  }

  if (tutorIds.length === 0) {
    revalidatePath('/admin/payslips')
    return { generated: 0, skipped: 0, removed }
  }

  // Cek payslip yang sudah ada (aktif maupun soft-deleted)
  const { data: existingPayslips } = await supabase
    .from('payslips')
    .select('id, tutor_id, is_deleted, status')
    .eq('month', month)
    .in('tutor_id', tutorIds)

  const draftByTutor = new Map<string, string>()
  const lockedTutors = new Set<string>()
  const deletedByTutor = new Map<string, string>()
  for (const p of existingPayslips ?? []) {
    if (p.is_deleted) deletedByTutor.set(p.tutor_id, p.id)
    else if (p.status === 'draft') draftByTutor.set(p.tutor_id, p.id)
    // Slip yang sudah Terkirim/Dibayar tidak boleh berubah diam-diam — angkanya
    // sudah dilihat dan disepakati tutor.
    else lockedTutors.add(p.tutor_id)
  }

  const tutorsToBuild = tutorIds.filter(id => !lockedTutors.has(id))
  if (tutorsToBuild.length === 0) return { generated: 0, skipped: tutorIds.length, removed }

  const toInsert: ReturnType<typeof computePayslipData>[] = []
  const toUpsert: { id: string; data: ReturnType<typeof computePayslipData> }[] = []

  for (const tutorId of tutorsToBuild) {
    const paidSessions = (sessionsByTutor[tutorId] ?? []).filter(s => hasTakenPlace(s, nowIso))
    const data = computePayslipData({
      tutorId,
      tutorName: tutorNameById[tutorId] ?? '',
      month,
      adminUserId: adminUser.id,
      sessions: paidSessions,
      schemeByKey,
      attendancesBySession,
      studentNamesByClass,
      rateMap,
    })
    const existingId = draftByTutor.get(tutorId) ?? deletedByTutor.get(tutorId)
    if (existingId) toUpsert.push({ id: existingId, data })
    else toInsert.push(data)
  }

  const results = await Promise.allSettled([
    toInsert.length > 0 ? supabase.from('payslips').insert(toInsert) : Promise.resolve({ error: null }),
    ...toUpsert.map(({ id, data }) => {
      // Nomor slip yang sudah ada dipertahankan — hanya angkanya yang dihitung
      // ulang, supaya nomor yang mungkin sudah dicatat tidak berubah.
      const recomputed: Record<string, unknown> = { ...data }
      delete recomputed.payslip_number
      return supabase.from('payslips')
        .update({ ...recomputed, is_deleted: false, updated_at: new Date().toISOString() })
        .eq('id', id)
    }),
  ])

  const failed = results.filter(r => r.status === 'rejected').length
  if (failed > 0) return { generated: 0, skipped: tutorIds.length, removed, error: 'Sebagian gagal dibuat' }

  revalidatePath('/admin/payslips')
  return {
    generated: toInsert.length + toUpsert.length,
    skipped: lockedTutors.size,
    removed,
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
      .select('id, class_id, tutor_id, scheduled_at, status, payroll_status, topic, classes(name, class_type, level, jenis)')
      .eq('tutor_id', tutorId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', startDate)
      .lt('scheduled_at', endDate)
      // Aturannya harus sama persis dengan generate massal, kalau tidak dua jalur
      // ini menghasilkan angka berbeda untuk tutor dan bulan yang sama.
      .lte('scheduled_at', new Date().toISOString()) as unknown as Promise<{ data: SessionWithClass[] | null }>,
    supabase
      .from('salary_schemes')
      .select('*')
      .eq('tutor_id', tutorId) as unknown as Promise<{ data: SalarySchemeRow[] | null }>,
    supabase.from('rate_periods').select('id').eq('is_active', true).limit(1).single(),
  ])

  if (!tutorProfile) throw new Error('Tutor tidak ditemukan')

  const sessionList = sessions ?? []
  // Tanpa penjaga ini, form manual membuat slip Rp 0 tanpa satu pun sesi. Slip
  // kosong itu lalu tidak pernah tersentuh generate massal — tutornya tidak
  // punya sesi di bulan itu, jadi tidak masuk daftar — dan mengendap terus.
  if (sessionList.length === 0) {
    throw new Error(`${tutorProfile.full_name} tidak punya sesi yang sudah terlaksana di bulan ini.`)
  }
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
  const schemeByKey = Object.fromEntries((schemes ?? []).map(s => [`${s.class_id}:${s.tutor_id}`, s]))

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
    schemeByKey,
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
