import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TeachingScheduleFilters from '@/components/tutor/TeachingScheduleFilters'
import ClassDetailLayout from '@/components/classes/ClassDetailLayout'
import HorizontalScrollShadow from '@/components/classes/HorizontalScrollShadow'
import type { SessionCounts } from '@/components/sessions/SessionStatusChips'
import { getSessionDisplayStatus } from '@/lib/session-status'
import { getSessionCompletionStatus } from '@/lib/actions/session-completion'

const PAYROLL_BADGE: Record<string, { label: string; cls: string }> = {
  unavailable: { label: 'Belum Tersedia', cls: 'bg-gray-100 text-gray-500' },
  incomplete: { label: 'Belum Lengkap', cls: 'bg-orange-100 text-orange-700' },
  pending: { label: 'Menunggu Review', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Disetujui', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
  paid: { label: 'Dibayar', cls: 'bg-blue-100 text-blue-700' },
}

const TEACHING_PAGE_SIZE = 10

type CountRow = [{ count: number }]

type StudentProfile = {
  id: string
  full_name: string
  grade: number | null
  avatar_url: string | null
}

type SessionRow = {
  id: string
  scheduled_at: string
  duration_minutes: number
  location: string | null
  status: string
  topic: string | null
  payroll_status: string
  tutor_id: string
  subject_id: string | null
  subjects: { name: string } | null
  materials: CountRow
  assessments: CountRow
  attendances: CountRow
  performance_notes: CountRow
  profiles?: { full_name: string } | null
}

export default async function TutorClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{
    range?: string; from?: string; to?: string
    compliance?: string; sessionStatus?: string; payrollStatus?: string; page?: string
    previewSwap?: string
  }>
}) {
  const { classId } = await params
  const {
    range: teachingRange = '', from: teachingFrom = '', to: teachingTo = '',
    compliance: teachingCompliance = '', sessionStatus: sessionStatusFilter = '',
    payrollStatus: payrollStatusFilter = '', page: pageParam = '1',
    previewSwap,
  } = await searchParams
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()

  const { data: cls } = await admin
    .from('classes')
    .select('id, name, level, class_type, jenis, fokus_types, is_active, start_date, end_date, semester, academic_year, tutor_id, class_subjects(subject_id, subjects(name))')
    .eq('id', classId)
    .single() as unknown as {
      data: {
        id: string; name: string; level: string | null; class_type: string | null
        jenis: string | null; fokus_types: string[] | null
        is_active: boolean; start_date: string | null; end_date: string | null
        semester: number | null; academic_year: string | null
        tutor_id: string
        class_subjects: { subject_id: string; subjects: { name: string } | null }[]
      } | null
    }

  if (!cls) notFound()

  const sessionSelect = `
    id, scheduled_at, duration_minutes, location, status, topic, payroll_status, tutor_id, subject_id,
    subjects(name),
    materials(count),
    assessments(count),
    attendances(count),
    performance_notes(count)
  `

  const [{ data: classSlots }, { data: enrolled }, { data: subjects }, { data: ownSlots }] = await Promise.all([
    admin
      .from('class_slots')
      .select('slot_index, day_of_week, start_time, subject_ids, tutor_id, tutor_ids')
      .eq('class_id', classId)
      .order('slot_index') as unknown as Promise<{
        data: {
          slot_index: number; day_of_week: number | null; start_time: string | null; subject_ids: string[]
          tutor_id: string | null; tutor_ids: string[]
        }[] | null
      }>,
    admin
      .from('class_students')
      .select('student_id, profiles!student_id(id, full_name, grade, avatar_url)')
      .eq('class_id', classId)
      .eq('is_active', true) as unknown as Promise<{
        data: { student_id: string; profiles: StudentProfile | null }[] | null
      }>,
    admin
      .from('subjects')
      .select('id, name') as unknown as Promise<{ data: { id: string; name: string }[] | null }>,
    // Which subjects this tutor is actually assigned to teach in this class —
    // used to scope the main tutor's session list to their own subject(s).
    admin
      .from('class_slots')
      .select('subject_ids')
      .eq('class_id', classId)
      .contains('tutor_ids', [user.id]) as unknown as Promise<{ data: { subject_ids: string[] }[] | null }>,
  ])

  // tutor_ids[i] pairs with subject_ids[i] (rotating mapel can each have a
  // different tutor) — resolve names separately since a join can't follow an
  // array FK column the way `profiles!tutor_id(...)` follows the scalar one.
  const slotTutorIds = [...new Set((classSlots ?? []).flatMap(s => s.tutor_ids?.length ? s.tutor_ids : (s.tutor_id ? [s.tutor_id] : [])))]
  const { data: slotTutorProfiles } = slotTutorIds.length > 0
    ? await admin.from('profiles').select('id, full_name').in('id', slotTutorIds) as unknown as { data: { id: string; full_name: string }[] | null }
    : { data: [] as { id: string; full_name: string }[] }
  const tutorNameMap = new Map((slotTutorProfiles ?? []).map(t => [t.id, t.full_name]))

  // Empty means no explicit slot assignment was found (e.g. an older class
  // predating per-slot tutor assignment) — fall back to not filtering rather
  // than hiding everything.
  const ownSubjectIds = new Set((ownSlots ?? []).flatMap(s => s.subject_ids ?? []))

  // A tutor gets the full "main tutor" experience — filters, editable
  // sessions, no subject scoping fallback — if they own the class outright
  // OR are officially assigned to teach a subject in it via class_slots.
  // Classes can have multiple co-equal subject tutors (e.g. one for Bahasa
  // Indonesia, another for Matematika); classes.tutor_id is just whichever
  // slot was entered first when the class was created, not sole ownership.
  const isMainTutor = cls.tutor_id === user.id || ownSubjectIds.size > 0

  const subjectMap = new Map((subjects ?? []).map(s => [s.id, s.name]))
  const enrolledStudents = (enrolled ?? [])
    .map(e => e.profiles)
    .filter((p): p is StudentProfile => p !== null)
    .map(p => ({ ...p, href: `/tutor/siswa/${p.id}` }))

  // The tutor officially assigned to teach each subject, per class_slots —
  // this is the "regular" tutor for that subject, independent of who happens
  // to be classes.tutor_id (which is just whichever slot was entered first
  // when the class was created, not a meaningful "owner" across subjects).
  const assignedTutorBySubject = new Map<string, string>()
  for (const slot of classSlots ?? []) {
    slot.subject_ids?.forEach((subjectId, i) => {
      const tutorId = slot.tutor_ids?.[i] ?? slot.tutor_id
      if (subjectId && tutorId && !assignedTutorBySubject.has(subjectId)) assignedTutorBySubject.set(subjectId, tutorId)
    })
  }

  // One row per distinct (subject, tutor) pair — seeded from this class's
  // official slot assignments, then supplemented below (per POV branch) with
  // whoever has actually taught a session, since ad-hoc swaps never update
  // class_slots and would otherwise be invisible here.
  const classOwnerTutorId = cls.tutor_id
  const tutorSubjectSeen = new Set<string>()
  const tutorsBySubject: { subjectName: string; tutorName: string; isMainTutor: boolean }[] = []
  function addTutorSubject(subjectId: string | null, tutorId: string | null, tutorName: string | null) {
    if (!subjectId || !tutorId) return
    const key = `${subjectId}:${tutorId}`
    if (tutorSubjectSeen.has(key)) return
    tutorSubjectSeen.add(key)
    const assignedTutorId = assignedTutorBySubject.get(subjectId)
    tutorsBySubject.push({
      subjectName: subjectMap.get(subjectId) ?? 'Mapel',
      tutorName: tutorName ?? 'Tutor',
      isMainTutor: assignedTutorId ? tutorId === assignedTutorId : tutorId === classOwnerTutorId,
    })
  }
  for (const slot of classSlots ?? []) {
    slot.subject_ids?.forEach((subjectId, i) => {
      const tutorId = slot.tutor_ids?.[i] ?? slot.tutor_id
      addTutorSubject(subjectId, tutorId, tutorId ? tutorNameMap.get(tutorId) ?? null : null)
    })
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const jenisLabel = cls.jenis === 'reguler'
    ? 'Reguler'
    : cls.jenis === 'fokus'
    ? (cls.fokus_types && cls.fokus_types.length > 0 ? `Fokus ${cls.fokus_types.join('/')}` : 'Fokus')
    : '—'

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Link href="/tutor/classes" className="hover:text-blue-600">Sesi Kelas</Link>
      <span>/</span>
      <span className="text-gray-900 font-medium">{cls.name}</span>
    </div>
  )

  // ── Swap preview: deciding whether to accept a proposed swap ──
  // Arrived here from a specific pending swap request via the session page.
  // Regardless of whether this tutor also happens to teach another subject
  // in this class, they only want the outgoing tutor's history for the
  // subject in question — not their own unrelated sessions.
  if (previewSwap) {
    const { data: swapRequest } = await admin
      .from('session_change_requests')
      .select('id, sessions(class_id, subject_id)')
      .eq('id', previewSwap)
      .eq('new_tutor_id', user.id)
      .eq('request_type', 'change_tutor')
      .in('status', ['pending', 'approved'])
      .maybeSingle() as unknown as {
        data: { id: string; sessions: { class_id: string; subject_id: string | null } | null } | null
      }

    const previewSubjectId = swapRequest?.sessions?.class_id === classId
      ? swapRequest.sessions.subject_id
      : null

    if (previewSubjectId) {
      const { data: previewSessions } = await admin
        .from('sessions')
        .select(`${sessionSelect}, profiles!tutor_id(full_name)`)
        .eq('class_id', classId)
        .eq('subject_id', previewSubjectId)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false })
        .limit(100) as unknown as { data: SessionRow[] | null }

      const subjectName = previewSessions?.[0]?.subjects?.name ?? subjectMap.get(previewSubjectId) ?? 'Mapel'
      const outgoingTutorName = previewSessions?.[0]?.profiles?.full_name ?? 'tutor sebelumnya'

      return (
        <ClassDetailLayout
          breadcrumb={breadcrumb}
          className={cls.name}
          level={cls.level}
          classType={cls.class_type}
          isActive={cls.is_active}
          jenisLabel={jenisLabel}
          semester={cls.semester}
          academicYear={cls.academic_year}
          startDate={cls.start_date}
          endDate={cls.end_date}
          fmtDate={fmtDate}
          classSlots={classSlots ?? []}
          subjectMap={subjectMap}
          tutorsBySubject={tutorsBySubject}
          enrolledStudents={enrolledStudents}
        >
          <div className="bg-white rounded-2xl shadow ring-1 ring-gray-900/5 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Riwayat Sesi {subjectName}
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Sesi yang sudah berjalan, sebelumnya diajar oleh {outgoingTutorName}
            </p>

            {!previewSessions || previewSessions.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-8">
                Belum ada sesi {subjectName} yang selesai untuk kelas ini.
              </div>
            ) : (
              <div className="space-y-2">
                {previewSessions.map(session => {
                  const date = new Date(session.scheduled_at)
                  return (
                    <Link
                      key={session.id}
                      href={`/tutor/sessions/${session.id}`}
                      className="flex items-center gap-4 rounded-xl ring-1 ring-gray-900/5 hover:bg-blue-50/50 transition-colors px-5 py-4"
                    >
                      <div className="w-16 shrink-0">
                        <p className="text-xs text-gray-400">
                          {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">
                          {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
                          <span className="text-xs font-normal text-gray-400">·
                            {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      </div>

                      <div className="w-px bg-gray-100 self-stretch shrink-0" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-normal text-gray-900">{session.subjects?.name ?? 'Sesi'}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {session.location ? session.location : ''}
                          {session.topic ? `${session.location ? ' • ' : ''}${session.topic}` : ''}
                        </p>
                      </div>

                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </ClassDetailLayout>
      )
    }
    // Invalid/mismatched previewSwap param — fall through to the normal view.
  }

  // ── Main tutor: full "Informasi Sesi" experience, same as Kelas Saya ──
  if (isMainTutor) {
    const nowDate = new Date()
    let rangeStart: Date | null = null
    let rangeEnd: Date | null = null
    if (teachingRange === 'upcoming') {
      rangeStart = nowDate
    } else if (teachingRange === 'past') {
      rangeEnd = nowDate
    } else if (teachingRange === 'custom' && teachingFrom && teachingTo) {
      rangeStart = new Date(`${teachingFrom}T00:00:00`)
      rangeEnd = new Date(`${teachingTo}T23:59:59`)
    }

    const page = Math.max(1, parseInt(pageParam) || 1)

    let sessionsQuery = admin
      .from('sessions')
      .select(`${sessionSelect}, profiles!tutor_id(full_name)`)
      .eq('class_id', classId)
      .order('scheduled_at', { ascending: teachingRange !== 'past' })
    if (rangeStart) sessionsQuery = sessionsQuery.gte('scheduled_at', rangeStart.toISOString())
    if (rangeEnd) sessionsQuery = sessionsQuery.lte('scheduled_at', rangeEnd.toISOString())

    const { data: sessionsRaw } = await (sessionsQuery.limit(500) as unknown as Promise<{ data: SessionRow[] | null }>)
    // Supplement the slot-based tutor list with whoever has actually taught
    // a session — catches ad-hoc swaps that never touched class_slots.
    for (const s of sessionsRaw ?? []) {
      addTutorSubject(s.subject_id, s.tutor_id, s.profiles?.full_name ?? null)
    }
    const sessions = ownSubjectIds.size > 0
      ? (sessionsRaw ?? []).filter(s => s.subject_id && ownSubjectIds.has(s.subject_id))
      : sessionsRaw ?? []
    const sessionIds = sessions.map(s => s.id)

    const coveredByTutorName = new Map(
      sessions.filter(s => s.tutor_id !== user.id).map(s => [s.id, s.profiles?.full_name ?? 'Tutor lain'])
    )

    const tutorIds = [...new Set(sessions.map(s => s.tutor_id))]
    const { data: paidPayslips } = tutorIds.length > 0
      ? await admin
          .from('payslips')
          .select('line_items')
          .in('tutor_id', tutorIds)
          .eq('status', 'paid') as unknown as { data: { line_items: { sessionId: string }[] }[] | null }
      : { data: [] as { line_items: { sessionId: string }[] }[] }
    const paidSessionIds = new Set((paidPayslips ?? []).flatMap(p => (p.line_items ?? []).map(li => li.sessionId)))

    const { data: gradedData } = sessionIds.length > 0
      ? await admin
          .from('assessments')
          .select('session_id, assessment_results(count)')
          .in('session_id', sessionIds) as unknown as {
            data: { session_id: string; assessment_results: CountRow }[] | null
          }
      : { data: null }
    const gradedSessionIds = new Set(
      (gradedData ?? []).filter(a => (a.assessment_results[0]?.count ?? 0) > 0).map(a => a.session_id)
    )

    const { data: pendingRequestsRaw } = sessionIds.length > 0
      ? await admin
          .from('session_change_requests')
          .select('session_id')
          .in('session_id', sessionIds)
          .eq('status', 'pending') as unknown as { data: { session_id: string }[] | null }
      : { data: [] as { session_id: string }[] }
    const pendingRequestSessionIds = new Set((pendingRequestsRaw ?? []).map(r => r.session_id))

    function getCounts(session: SessionRow): SessionCounts {
      return {
        topic: session.topic,
        hasMaterials: (session.materials[0]?.count ?? 0) > 0,
        hasAssessments: (session.assessments[0]?.count ?? 0) > 0,
        hasAttendance: (session.attendances[0]?.count ?? 0) > 0,
        hasNotes: (session.performance_notes[0]?.count ?? 0) > 0,
        hasGradedAssessments: gradedSessionIds.has(session.id),
      }
    }

    function isSessionComplete(session: SessionRow): boolean {
      if (session.status === 'cancelled') return true
      const counts = getCounts(session)
      const baseComplete = !!counts.topic && counts.hasMaterials && counts.hasGradedAssessments
      if (session.status !== 'completed') return baseComplete
      return baseComplete && counts.hasAttendance && counts.hasNotes
    }

    let filtered = sessions
    if (teachingCompliance === 'complete') {
      filtered = filtered.filter(isSessionComplete)
    } else if (teachingCompliance === 'incomplete') {
      filtered = filtered.filter(s => !isSessionComplete(s))
    }
    if (sessionStatusFilter === 'on_schedule') {
      filtered = filtered.filter(s => s.status !== 'cancelled' && !pendingRequestSessionIds.has(s.id))
    } else if (sessionStatusFilter === 'awaiting_admin') {
      filtered = filtered.filter(s => s.status !== 'cancelled' && pendingRequestSessionIds.has(s.id))
    } else if (sessionStatusFilter === 'cancelled') {
      filtered = filtered.filter(s => s.status === 'cancelled')
    }
    if (payrollStatusFilter === 'unavailable') {
      filtered = filtered.filter(s => s.status !== 'completed')
    } else if (payrollStatusFilter === 'paid') {
      filtered = filtered.filter(s => s.status === 'completed' && s.payroll_status === 'approved' && paidSessionIds.has(s.id))
    } else if (payrollStatusFilter === 'approved') {
      filtered = filtered.filter(s => s.status === 'completed' && s.payroll_status === 'approved' && !paidSessionIds.has(s.id))
    } else if (payrollStatusFilter) {
      filtered = filtered.filter(s => s.status === 'completed' && s.payroll_status === payrollStatusFilter)
    }

    const totalCount = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalCount / TEACHING_PAGE_SIZE))
    const sessionsPage = filtered.slice((page - 1) * TEACHING_PAGE_SIZE, page * TEACHING_PAGE_SIZE)

    const pendingReviewIds = sessionsPage.filter(s => s.status === 'completed' && s.payroll_status === 'pending').map(s => s.id)
    const pendingReviewChecks = await Promise.all(pendingReviewIds.map(id => getSessionCompletionStatus(id)))
    const stillCompleteMap = new Map(pendingReviewIds.map((id, i) => [id, pendingReviewChecks[i]?.canComplete ?? false]))

    function pageUrl(targetPage: number) {
      const params: Record<string, string> = {
        ...(teachingRange ? { range: teachingRange } : {}),
        ...(teachingFrom ? { from: teachingFrom } : {}),
        ...(teachingTo ? { to: teachingTo } : {}),
        ...(teachingCompliance ? { compliance: teachingCompliance } : {}),
        ...(sessionStatusFilter ? { sessionStatus: sessionStatusFilter } : {}),
        ...(payrollStatusFilter ? { payrollStatus: payrollStatusFilter } : {}),
        ...(targetPage > 1 ? { page: String(targetPage) } : {}),
      }
      const qs = new URLSearchParams(params).toString()
      return qs ? `/tutor/classes/${classId}?${qs}` : `/tutor/classes/${classId}`
    }

    return (
      <ClassDetailLayout
        breadcrumb={breadcrumb}
        className={cls.name}
        level={cls.level}
        classType={cls.class_type}
        isActive={cls.is_active}
        jenisLabel={jenisLabel}
        semester={cls.semester}
        academicYear={cls.academic_year}
        startDate={cls.start_date}
        endDate={cls.end_date}
        fmtDate={fmtDate}
        classSlots={classSlots ?? []}
        subjectMap={subjectMap}
        tutorsBySubject={tutorsBySubject}
        enrolledStudents={enrolledStudents}
      >
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Informasi Sesi</h2>
            <TeachingScheduleFilters
              range={teachingRange}
              from={teachingFrom}
              to={teachingTo}
              compliance={teachingCompliance}
              sessionStatus={sessionStatusFilter}
              payrollStatus={payrollStatusFilter}
            />
          </div>

          {sessions.length > 0 && (() => {
            const totalSessions = sessions.length
            const completedSessions = sessions.filter(s => s.status === 'completed').length
            const sessionPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
            return (
              <div className="px-5 pt-3 pb-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">{completedSessions} dari {totalSessions} sesi selesai</span>
                  <span className={`text-xs font-semibold ${
                    sessionPct >= 80 ? 'text-green-600' : sessionPct >= 40 ? 'text-yellow-600' : 'text-red-500'
                  }`}>{sessionPct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      sessionPct >= 80 ? 'bg-green-500' : sessionPct >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${sessionPct}%` }}
                  />
                </div>
              </div>
            )
          })()}

          {sessionsPage.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10 px-5">
              Tidak ada sesi ditemukan.
            </p>
          ) : (
            <HorizontalScrollShadow className="px-5 pb-5 space-y-2 overflow-x-auto">
              {sessionsPage.map(session => {
                const date = new Date(session.scheduled_at)
                const isComplete = isSessionComplete(session)
                const displayStatus = getSessionDisplayStatus(session.status, pendingRequestSessionIds.has(session.id))
                const coveredBy = coveredByTutorName.get(session.id)
                return (
                  <Link
                    key={session.id}
                    href={`/tutor/sessions/${session.id}`}
                    className="group flex items-stretch rounded-xl ring-1 ring-gray-900/5 hover:bg-blue-50/50 transition-colors min-w-max"
                  >
                    <div className="sticky-col-shadow sticky left-0 z-10 flex items-stretch bg-white rounded-l-xl pl-5 pr-4 py-4 shrink-0">
                      <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 rounded-l-xl pointer-events-none" />
                      <div className="relative w-16 shrink-0 flex flex-col justify-center">
                        <p className="text-xs text-gray-400">
                          {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">
                          {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
                          <span className="text-xs font-normal text-gray-400">· 
                            {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      </div>

                      <div className="w-px bg-gray-100 mx-4 shrink-0" />

                      <div className="relative w-40 shrink-0 flex flex-col justify-center">
                        <p className="text-sm font-normal text-gray-900">{session.subjects?.name ?? 'Sesi'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {session.location ? session.location : ''}
                          {session.topic ? `${session.location ? ' • ' : ''}${session.topic}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-stretch py-4 pr-8">
                    {!coveredBy && (
                      <>
                        <div className="w-px bg-gray-100 mx-4 shrink-0" />

                        <div className="w-32 shrink-0 flex flex-col items-start justify-center px-1">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Jadwal</p>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${displayStatus.color}`}>
                            {displayStatus.label}
                          </span>
                        </div>

                        <div className="w-px bg-gray-100 mx-4 shrink-0" />

                        <div className="w-32 shrink-0 flex flex-col items-start justify-center px-1">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Kelengkapan</p>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                            isComplete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {isComplete ? 'Lengkap' : 'Belum Lengkap'}
                          </span>
                        </div>

                        {(() => {
                          const key = session.status !== 'completed'
                            ? 'unavailable'
                            : session.payroll_status === 'pending' && stillCompleteMap.get(session.id) === false
                            ? 'incomplete'
                            : session.payroll_status === 'approved' && paidSessionIds.has(session.id)
                            ? 'paid'
                            : session.payroll_status
                          const badge = PAYROLL_BADGE[key] ?? PAYROLL_BADGE.pending
                          return (
                            <>
                              <div className="w-px bg-gray-100 mx-4 shrink-0" />
                              <div className="w-32 shrink-0 flex flex-col items-start justify-center px-1">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Payroll</p>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              </div>
                            </>
                          )
                        })()}
                      </>
                    )}

                    {coveredBy && (
                      <div className="shrink-0 flex items-center pl-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          Digantikan oleh: {coveredBy}
                        </span>
                      </div>
                    )}

                    <div className="shrink-0 flex items-center pl-4">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    </div>
                  </Link>
                )
              })}
            </HorizontalScrollShadow>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 pb-5 pt-1">
              <p className="text-sm text-gray-500">Halaman {page} dari {totalPages}</p>
              <div className="flex gap-2">
                <Link
                  href={pageUrl(page - 1)}
                  aria-disabled={page <= 1}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    page <= 1
                      ? 'border-gray-100 text-gray-300 pointer-events-none'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Sebelumnya
                </Link>
                <Link
                  href={pageUrl(page + 1)}
                  aria-disabled={page >= totalPages}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    page >= totalPages
                      ? 'border-gray-100 text-gray-300 pointer-events-none'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Berikutnya
                </Link>
              </div>
            </div>
          )}
        </div>
      </ClassDetailLayout>
    )
  }

  // ── Substitute tutor: history-only view, no filters, no Jadwal/Payroll ──
  // Shows completed sessions for the subject(s) this tutor covers — either
  // their own past sessions, or (for a subject they've been proposed to take
  // over but don't teach yet) the outgoing tutor's history, so they can see
  // where the class left off before deciding whether to accept.
  const now = new Date().toISOString()
  const [
    { data: allHistorySessions },
    { data: ownSubjectRows },
    { count: substituteSessionCount },
    // A tutor proposed for a swap — whether they've already confirmed or are
    // still deciding — doesn't have sessions.tutor_id updated yet, but still
    // needs access to the class page (and its subject-scoped history) to see
    // the roster/context for the session they're being asked to cover.
    { data: pendingSwapRequests },
  ] = await Promise.all([
    admin
      .from('sessions')
      .select(`${sessionSelect}, profiles!tutor_id(full_name)`)
      .eq('class_id', classId)
      .lt('scheduled_at', now)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(100) as unknown as Promise<{ data: SessionRow[] | null }>,
    // Subject(s) of this tutor's own sessions in this class — determines
    // which subject's history they're allowed to browse.
    admin
      .from('sessions')
      .select('subject_id')
      .eq('class_id', classId)
      .eq('tutor_id', user.id) as unknown as Promise<{ data: { subject_id: string | null }[] | null }>,
    admin
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('tutor_id', user.id),
    admin
      .from('session_change_requests')
      .select('session_id')
      .eq('new_tutor_id', user.id)
      .eq('request_type', 'change_tutor')
      .eq('status', 'pending') as unknown as Promise<{ data: { session_id: string }[] | null }>,
  ])

  const swapCandidateIds = [...new Set((pendingSwapRequests ?? []).map(r => r.session_id))]

  // Narrow the tutor's pending swaps (which may span other classes) down to
  // the ones that actually belong to this class.
  const { data: swapSessionsForClass, count: swapSessionCountForClass } = swapCandidateIds.length > 0
    ? await admin
        .from('sessions')
        .select('subject_id', { count: 'exact' })
        .eq('class_id', classId)
        .in('id', swapCandidateIds) as unknown as { data: { subject_id: string | null }[] | null; count: number | null }
    : { data: [] as { subject_id: string | null }[], count: 0 }
  if (!substituteSessionCount && !swapSessionCountForClass) notFound()

  const substituteSubjectIds = new Set(
    [...(ownSubjectRows ?? []), ...(swapSessionsForClass ?? [])]
      .map(s => s.subject_id)
      .filter((id): id is string => !!id)
  )

  // Supplement the slot-based tutor list with whoever has actually taught a
  // session — catches ad-hoc swaps that never touched class_slots.
  for (const s of allHistorySessions ?? []) {
    addTutorSubject(s.subject_id, s.tutor_id, s.profiles?.full_name ?? null)
  }

  const sessions = substituteSubjectIds.size > 0
    ? (allHistorySessions ?? []).filter(s => s.subject_id && substituteSubjectIds.has(s.subject_id))
    : allHistorySessions ?? []
  const coveredByTutorName = new Map(
    sessions.filter(s => s.tutor_id !== user.id).map(s => [s.id, s.profiles?.full_name ?? 'Tutor lain'])
  )

  return (
    <ClassDetailLayout
      breadcrumb={breadcrumb}
      className={cls.name}
      level={cls.level}
      classType={cls.class_type}
      isActive={cls.is_active}
      jenisLabel={jenisLabel}
        semester={cls.semester}
        academicYear={cls.academic_year}
      startDate={cls.start_date}
      endDate={cls.end_date}
      fmtDate={fmtDate}
      classSlots={classSlots ?? []}
      subjectMap={subjectMap}
      tutorsBySubject={tutorsBySubject}
      enrolledStudents={enrolledStudents}
    >
      <div className="bg-white rounded-2xl shadow ring-1 ring-gray-900/5 p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Riwayat Sesi</p>

        {sessions.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            Belum ada sesi untuk kelas ini.
          </div>
        ) : (
          <HorizontalScrollShadow className="space-y-2 overflow-x-auto">
            {sessions.map(session => {
              const date = new Date(session.scheduled_at)
              const coveredBy = coveredByTutorName.get(session.id)
              return (
                <Link
                  key={session.id}
                  href={`/tutor/sessions/${session.id}`}
                  className="group flex items-stretch rounded-xl ring-1 ring-gray-900/5 hover:bg-blue-50/50 transition-colors min-w-max"
                >
                  <div className="sticky-col-shadow sticky left-0 z-10 flex items-stretch bg-white rounded-l-xl pl-5 pr-4 py-4 shrink-0">
                    <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 rounded-l-xl pointer-events-none" />
                    <div className="relative w-16 shrink-0 flex flex-col justify-center">
                      <p className="text-xs text-gray-400">
                        {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
                        <span className="text-xs font-normal text-gray-400">· 
                          {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                    </div>

                    <div className="w-px bg-gray-100 mx-4 shrink-0" />

                    <div className="relative w-40 shrink-0 flex flex-col justify-center">
                      <p className="text-sm font-normal text-gray-900">{session.subjects?.name ?? 'Sesi'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.location ? session.location : ''}
                        {session.topic ? `${session.location ? ' • ' : ''}${session.topic}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-stretch py-4 pr-8">
                  {coveredBy && (
                    <div className="shrink-0 flex items-center pl-4">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        Diajar oleh: {coveredBy}
                      </span>
                    </div>
                  )}

                  <div className="shrink-0 flex items-center pl-4">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  </div>
                </Link>
              )
            })}
          </HorizontalScrollShadow>
        )}
      </div>
    </ClassDetailLayout>
  )
}
