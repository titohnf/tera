import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SessionTabs from '@/components/sessions/SessionTabs'
import SessionInfoCard from '@/components/admin/sessions/SessionInfoCard'
import MaterialUploader from '@/components/materials/MaterialUploader'
import { submitAttendance } from '@/lib/actions/attendance'
import { savePerformanceNote } from '@/lib/actions/notes'
import { createAssessment, submitGrades, deleteAssessment, updateAssessment } from '@/lib/actions/assessments'
import { deleteMaterial, getSignedUrl } from '@/lib/actions/materials'
import { updateSessionTopicTutor, saveSessionCpUrlsTutor, saveCustomTopicTutor } from '@/lib/actions/tutor/sessions'
import { checkAndCompleteSession, getSessionCompletionStatus } from '@/lib/actions/session-completion'
import SessionChangeRequestPanel from '@/components/tutor/SessionChangeRequestPanel'
import SwapResponsePanel from '@/components/tutor/SwapResponsePanel'
import SwapOutcomeBanner from '@/components/tutor/SwapOutcomeBanner'
import ApprovedSwapInfo from '@/components/tutor/ApprovedSwapInfo'
import ResolvedNoticeBanner from '@/components/tutor/ResolvedNoticeBanner'
import RequestPayrollReReview from '@/components/tutor/RequestPayrollReReview'
import { getSessionDisplayStatus } from '@/lib/session-status'
import { rosterForSession } from '@/lib/enrollment'
import { allowedCurriculumGradeLevels } from '@/lib/curriculum-grade'
import { splitClassName } from '@/lib/format-class-name'
import type { AttendanceStatus } from '@/lib/types/database'

function formatPayrollTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

type SessionDetail = {
  id: string
  class_id: string
  subject_id: string | null
  scheduled_at: string
  duration_minutes: number
  location: string | null
  status: string
  topic: string | null
  curriculum_topic_id: string | null
  selected_cp_ids: string[] | null
  cp_urls: Record<string, string> | null
  custom_theme: string | null
  custom_learning_outcomes: string[] | null
  payroll_status: string
  payroll_rejection_reason: string | null
  payroll_reviewed_at: string | null
  payroll_tutor_note: string | null
  payroll_tutor_note_at: string | null
  classes: { name: string; level: string | null; class_type: string | null } | null
  subjects: { name: string } | null
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const user = await getUser()
  if (!user) return null
  const supabase = createAdminClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('id, class_id, subject_id, scheduled_at, duration_minutes, location, status, topic, curriculum_topic_id, selected_cp_ids, cp_urls, custom_theme, custom_learning_outcomes, payroll_status, payroll_rejection_reason, payroll_reviewed_at, payroll_tutor_note, payroll_tutor_note_at, classes(name, level, class_type), subjects(name), tutor_id')
    .eq('id', sessionId)
    .single() as { data: (SessionDetail & { tutor_id: string }) | null; error: unknown }

  if (!session) notFound()

  const isOwnSession = session.tutor_id === user.id
  let isConfirmedSwapTutor = false
  let swapResponseNeeded: { id: string; reason: string; requesterName: string | null } | null = null
  let swapRejectedNotice: { id: string; admin_note: string | null } | null = null
  let approvedSwapInfo: { id: string; fromTutorName: string | null } | null = null

  // Requests where this viewer is the requester and the outcome hasn't been
  // dismissed yet — shown regardless of whether they still teach this session
  // (e.g. their own change_tutor request got approved and the session moved
  // to someone else).
  const { data: ownResolvedNotice } = await supabase
    .from('session_change_requests')
    .select('id, request_type, status, admin_note')
    .eq('session_id', sessionId)
    .eq('requested_by', user.id)
    .in('status', ['approved', 'rejected'])
    .is('acknowledged_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Swap this viewer confirmed as the proposed replacement, now resolved by
  // admin — checked unconditionally since an approval flips session.tutor_id
  // to this viewer, making isOwnSession true and skipping the block below.
  const { data: swapOutcomeRaw } = await supabase
    .from('session_change_requests')
    .select('id, status, admin_note, new_tutor_acknowledged_at, requester:profiles!requested_by(full_name)')
    .eq('session_id', sessionId)
    .eq('new_tutor_id', user.id)
    .eq('request_type', 'change_tutor')
    .in('status', ['approved', 'rejected'])
    .eq('new_tutor_confirmed', true)
    .not('reviewed_by', 'is', null)
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (swapOutcomeRaw?.status === 'approved') {
    // Persistent, non-dismissible — the covering tutor keeps needing this
    // link to the outgoing tutor's history for as long as they're on this
    // session, unlike the one-off rejected notice below.
    approvedSwapInfo = {
      id: swapOutcomeRaw.id,
      fromTutorName: (swapOutcomeRaw.requester as unknown as { full_name: string } | null)?.full_name ?? null,
    }
  } else if (swapOutcomeRaw?.status === 'rejected' && !swapOutcomeRaw.new_tutor_acknowledged_at) {
    swapRejectedNotice = { id: swapOutcomeRaw.id, admin_note: swapOutcomeRaw.admin_note }
  }

  if (!isOwnSession) {
    const [{ data: mySwap }, { data: ownClass }, { count: hasSessionInClass }, { data: otherPendingSwaps }] = await Promise.all([
      // The most recent change_tutor request naming this viewer as the
      // proposed replacement — covers "needs my response", "already
      // confirmed and pending admin", and "confirmed then rejected".
      supabase
        .from('session_change_requests')
        .select('id, status, new_tutor_confirmed, new_tutor_acknowledged_at, reason, admin_note, requester:profiles!requested_by(full_name)')
        .eq('session_id', sessionId)
        .eq('new_tutor_id', user.id)
        .eq('request_type', 'change_tutor')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Main tutor of the class can still view a session a substitute is
      // covering — keeps them in the loop even though they're not teaching it.
      supabase
        .from('classes')
        .select('id')
        .eq('id', session.class_id)
        .eq('tutor_id', user.id)
        .maybeSingle(),
      // A substitute who has taught any session in this class can browse the
      // full class history for context, not just their own sessions.
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', session.class_id)
        .eq('tutor_id', user.id),
      // Same, but for a substitute whose only session in this class is still
      // an unapproved swap (tutor_id hasn't flipped over yet).
      supabase
        .from('session_change_requests')
        .select('session_id, sessions!inner(class_id)')
        .eq('new_tutor_id', user.id)
        .eq('request_type', 'change_tutor')
        .eq('status', 'pending')
        .eq('new_tutor_confirmed', true)
        .eq('sessions.class_id', session.class_id),
    ])
    const hasPendingSwapInClass = (otherPendingSwaps ?? []).length > 0
    const pendingUnconfirmed = mySwap?.status === 'pending' && mySwap.new_tutor_confirmed === null
    const pendingConfirmed = mySwap?.status === 'pending' && mySwap.new_tutor_confirmed === true
    const rejectedUnacknowledged = mySwap?.status === 'rejected' && mySwap.new_tutor_confirmed === true && !mySwap.new_tutor_acknowledged_at

    if (
      !pendingConfirmed && !ownClass && !hasSessionInClass && !hasPendingSwapInClass &&
      !pendingUnconfirmed && !rejectedUnacknowledged && !ownResolvedNotice
    ) notFound()

    isConfirmedSwapTutor = pendingConfirmed
    if (pendingUnconfirmed && mySwap) {
      swapResponseNeeded = {
        id: mySwap.id,
        reason: mySwap.reason,
        requesterName: (mySwap.requester as unknown as { full_name: string } | null)?.full_name ?? null,
      }
    }
  }

  // View-only once payroll is approved (locked, even for the teaching tutor),
  // or when the viewer is the class's main tutor but not the one teaching
  // this particular session (covered by a substitute).
  const isTeachingTutor = isOwnSession || isConfirmedSwapTutor
  const canEdit = isTeachingTutor && session.payroll_status !== 'approved'
  const readOnlyReason: 'not-tutor' | 'approved' | undefined = canEdit
    ? undefined
    : !isTeachingTutor
    ? 'not-tutor'
    : 'approved'

  const [
    enrolledResult,
    attendanceResult,
    notesResult,
    templatesResult,
    materialsResult,
    assessmentsResult,
    profileResult,
    curriculumTopicsResult,
  ] = await Promise.all([
    supabase
      .from('class_students')
      .select('student_id, enrolled_at, unenrolled_at, is_active, profiles(id, full_name, grade)')
      .eq('class_id', session.class_id),
    supabase
      .from('attendances')
      .select('student_id, status, notes')
      .eq('session_id', sessionId),
    supabase
      .from('performance_notes')
      .select('student_id, category, body, template_id')
      .eq('session_id', sessionId),
    supabase
      .from('performance_note_templates')
      .select('id, category, label, body')
      .eq('is_active', true)
      .order('category'),
    supabase
      .from('materials')
      .select('id, title, file_path, link_url, mime_type, file_size_bytes, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false }),
    supabase
      .from('assessments')
      .select('id, title, description, max_score, due_at, link_url, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.tutor_id)
      .single(),
    session.subject_id
      ? supabase
          .from('curriculum_topics')
          .select('id, group_id, grade_level, semester, theme, topic, learning_outcomes')
          .eq('subject_id', session.subject_id)
          .order('sort_order')
      : Promise.resolve({ data: [] }),
  ])

  const isPrivateClass = session.classes?.class_type === 'private'

  const [{ data: latestRequest }, { data: otherTutors }, { data: subjects }] = await Promise.all([
    supabase
      .from('session_change_requests')
      .select('id, request_type, reason, new_scheduled_at, new_tutor_id, new_tutor_confirmed, new_subject_id, status, admin_note, profiles!new_tutor_id(full_name), subjects!new_subject_id(name)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'tutor')
      .eq('is_active', true)
      .neq('id', user.id)
      .order('full_name'),
    isPrivateClass
      ? supabase.from('subjects').select('id, name').order('name')
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const sessionChangeRequest = latestRequest && latestRequest.status === 'pending'
    ? {
        id: latestRequest.id,
        request_type: latestRequest.request_type,
        reason: latestRequest.reason,
        new_scheduled_at: latestRequest.new_scheduled_at,
        new_tutor_id: latestRequest.new_tutor_id,
        new_tutor_name: (latestRequest.profiles as unknown as { full_name: string } | null)?.full_name ?? null,
        new_tutor_confirmed: latestRequest.new_tutor_confirmed,
        new_subject_id: latestRequest.new_subject_id,
        new_subject_name: (latestRequest.subjects as unknown as { name: string } | null)?.name ?? null,
      }
    : null

  // Hanya siswa yang keanggotaannya mencakup tanggal sesi ini — lihat lib/enrollment.ts
  const enrolledStudents = rosterForSession(enrolledResult.data ?? [], session.scheduled_at)
  const attendances = attendanceResult.data ?? []
  const existingNotes = notesResult.data ?? []
  const templates = templatesResult.data ?? []
  const materials = materialsResult.data ?? []
  const assessments = assessmentsResult.data ?? []
  const tutorName = (profileResult.data as { full_name: string } | null)?.full_name ?? null
  const curriculumTopics = (curriculumTopicsResult.data ?? []) as {
    id: string; group_id: string | null; grade_level: string; semester: number
    theme: string | null; topic: string; learning_outcomes: string | null
  }[]

  // Derive grade from enrolled students (mode of their grades)
  const enrolledGrades = enrolledStudents
    .map(cs => (cs.profiles as unknown as { grade: number | null } | null)?.grade)
    .filter((g): g is number => g != null)
  const sessionGrade = enrolledGrades.length > 0
    ? enrolledGrades.sort((a, b) =>
        enrolledGrades.filter(v => v === b).length - enrolledGrades.filter(v => v === a).length
      )[0]
    : null

  // Filter by grade only — semester grouping is shown in the dropdown itself.
  // Selain kelas sesi, jenjang lain ikut terbuka kalau ada siswa di roster ini
  // yang dikecualikan untuk mapel tersebut — lihat lib/curriculum-grade.ts.
  const allowedGradeLevels = await allowedCurriculumGradeLevels(supabase, {
    sessionGrade,
    subjectId: session.subject_id ?? null,
    studentIds: enrolledStudents.map(cs =>
      (cs.profiles as unknown as { id: string } | null)?.id ?? cs.student_id
    ),
  })
  const filteredCurriculumTopics = curriculumTopics.filter(t =>
    allowedGradeLevels == null || allowedGradeLevels.includes(t.grade_level)
  )

  // Auto-complete if all criteria already met (handles sessions filled before this feature existed)
  await checkAndCompleteSession(sessionId)

  // Re-fetch status in case it was just completed + get completion diagnostics
  const [{ data: freshSession }, completionCheck] = await Promise.all([
    supabase.from('sessions').select('status').eq('id', sessionId).single(),
    getSessionCompletionStatus(sessionId),
  ])
  if (freshSession) session.status = freshSession.status

  const attendanceMap = Object.fromEntries(attendances.map(a => [a.student_id, a]))
  const notesByStudent: Record<string, Record<string, { body: string; template_id: string | null }>> = {}
  for (const n of existingNotes) {
    if (!notesByStudent[n.student_id]) notesByStudent[n.student_id] = {}
    notesByStudent[n.student_id][n.category] = { body: n.body, template_id: n.template_id }
  }

  const students = enrolledStudents.map(cs => {
    const profile = (cs.profiles as unknown as { id: string; full_name: string } | null)
    const sid = profile?.id ?? cs.student_id
    return {
      id: sid,
      full_name: profile?.full_name ?? 'Siswa',
      currentStatus: (attendanceMap[cs.student_id]?.status ?? null) as AttendanceStatus | null,
      attendanceNotes: attendanceMap[cs.student_id]?.notes ?? '',
      existingNotes: notesByStudent[sid] ?? {},
    }
  })

  const assessmentIds = assessments.map(a => a.id)
  const { data: results } = assessmentIds.length > 0
    ? await supabase
        .from('assessment_results')
        .select('assessment_id, student_id, score, feedback')
        .in('assessment_id', assessmentIds)
    : { data: [] }

  const date = new Date(session.scheduled_at)
  const allowCustomTopic = session.classes?.class_type === 'private' || session.classes?.class_type === 'yayasan'

  return (
    <div>
      <Link href="/tutor/classes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Sesi Kelas
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Kolom kiri — header + tab konten */}
        <div className="space-y-4 min-w-0">
          {/* Session header */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                {(() => {
                  const { semesterLabel, title } = splitClassName(session.classes?.name ?? 'Kelas')
                  return (
                    <>
                      {semesterLabel && (
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{semesterLabel}</p>
                      )}
                      <h1 className="text-lg font-semibold text-gray-900 mb-1">{title}</h1>
                    </>
                  )
                })()}
                <p className="text-sm text-gray-500">{session.topic ?? 'Topik belum ditentukan'}</p>
              </div>
              {(() => {
                const displayStatus = getSessionDisplayStatus(session.status, !!sessionChangeRequest)
                return (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${displayStatus.color}`}>
                    {displayStatus.label}
                  </span>
                )
              })()}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
            <SessionTabs
              sessionId={sessionId}
              readOnlyReason={readOnlyReason}
              sessionStatus={session.status}
              topic={session.topic}
              curriculumTopicId={session.curriculum_topic_id ?? null}
              curriculumTopics={filteredCurriculumTopics}
              hasSubject={!!session.subject_id}
              selectedCpIds={session.selected_cp_ids ?? []}
              cpUrls={session.cp_urls ?? {}}
              subjectName={session.subjects?.name ?? null}
              grade={sessionGrade}
              students={students}
              templates={templates}
              materials={materials}
              assessments={assessments}
              assessmentStudents={students.map(s => ({ id: s.id, full_name: s.full_name }))}
              results={results ?? []}
              materialUploader={
                <MaterialUploader
                  sessionId={sessionId}
                  tutorId={user.id}
                  classId={session.class_id}
                />
              }
              saveTopicAction={updateSessionTopicTutor}
              saveCpUrlsAction={saveSessionCpUrlsTutor}
              isPrivateClass={allowCustomTopic}
              saveCustomTopicAction={saveCustomTopicTutor}
              customTheme={session.custom_theme}
              customLearningOutcomes={session.custom_learning_outcomes ?? []}
              submitAttendanceAction={submitAttendance}
              saveNoteAction={savePerformanceNote}
              createAssessmentAction={createAssessment}
              submitGradesAction={submitGrades}
              deleteAssessmentAction={deleteAssessment}
              updateAssessmentAction={updateAssessment}
              deleteMaterialAction={deleteMaterial}
              signedUrlAction={getSignedUrl}
            />
          </div>
        </div>

        {/* Kolom kanan — info sesi + syarat penyelesaian */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {(swapResponseNeeded || swapRejectedNotice || approvedSwapInfo || ownResolvedNotice) && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Pemberitahuan
              </p>

              <div className="space-y-3">
                {swapResponseNeeded && (
                  <SwapResponsePanel
                    requestId={swapResponseNeeded.id}
                    classId={session.class_id}
                    requesterName={swapResponseNeeded.requesterName}
                    reason={swapResponseNeeded.reason}
                  />
                )}

                {approvedSwapInfo && (
                  <ApprovedSwapInfo
                    id={approvedSwapInfo.id}
                    classId={session.class_id}
                    fromTutorName={approvedSwapInfo.fromTutorName}
                    toTutorName={tutorName}
                  />
                )}

                {swapRejectedNotice && (
                  <SwapOutcomeBanner
                    id={swapRejectedNotice.id}
                    status="rejected"
                    adminNote={swapRejectedNotice.admin_note}
                  />
                )}

                {ownResolvedNotice && (
                  <ResolvedNoticeBanner
                    id={ownResolvedNotice.id}
                    requestType={ownResolvedNotice.request_type}
                    status={ownResolvedNotice.status}
                    adminNote={ownResolvedNotice.admin_note}
                  />
                )}
              </div>
            </div>
          )}

          {canEdit && session.status !== 'cancelled' && (
            <SessionChangeRequestPanel
              sessionId={sessionId}
              classId={session.class_id}
              existingRequest={sessionChangeRequest}
              tutors={otherTutors ?? []}
              subjects={subjects ?? []}
              currentTutorName={tutorName}
              currentSubjectName={session.subjects?.name ?? null}
              allowSubjectChange={isPrivateClass}
              isPast={Date.now() > date.getTime() + session.duration_minutes * 60_000}
            />
          )}

          <SessionInfoCard
            classLevel={session.classes?.level ?? null}
            tutorName={tutorName}
            date={date}
            durationMinutes={session.duration_minutes}
            location={session.location}
            subjects={session.subjects?.name ?? null}
            displayStatus={session.status}
          />

          {completionCheck && session.status !== 'cancelled' && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Kelengkapan Jurnal
              </p>
              <div className="space-y-1.5">
                {[
                  { label: 'Topik', ok: completionCheck.hasTopic },
                  { label: `Materi (${completionCheck.materialsCount})`, ok: completionCheck.hasMaterials },
                  { label: `Presensi (${completionCheck.attendanceCount}/${completionCheck.studentCount})`, ok: completionCheck.hasAllAttendance },
                  { label: `Catatan (${completionCheck.notesCount}/${completionCheck.presentLateCount})`, ok: completionCheck.hasAllNotes },
                  { label: `Asesmen (${completionCheck.gradedCount}/${completionCheck.gradesRequired})`, ok: completionCheck.hasAssessments },
                ].map(({ label, ok }) => (
                  <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${ok ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                    {ok
                      ? <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    }
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.status === 'completed' && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Status Penyelesaian Sesi
              </p>

              {completionCheck?.canComplete && session.payroll_status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">
                    Menunggu Review
                  </p>
                  <p className="text-xs text-yellow-700">
                    Sesi ini sudah lengkap dan sedang menunggu admin mengecek kelayakannya untuk perhitungan gaji.
                  </p>
                  {session.payroll_tutor_note && (
                    <div className="bg-white/70 border border-yellow-200/70 rounded-lg p-3 mt-2">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Catatan Anda</p>
                      <p className="text-xs text-gray-700">{session.payroll_tutor_note}</p>
                      {session.payroll_tutor_note_at && (
                        <p className="text-xs text-gray-400 mt-1">{formatPayrollTimestamp(session.payroll_tutor_note_at)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {session.payroll_status === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                    Disetujui
                  </p>
                  <p className="text-xs text-green-700">
                    Sesi ini sudah disetujui admin dan masuk ke perhitungan gaji.
                  </p>
                  {session.payroll_reviewed_at && (
                    <p className="text-xs text-gray-400 mt-1">{formatPayrollTimestamp(session.payroll_reviewed_at)}</p>
                  )}
                </div>
              )}

              {session.payroll_status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                    Ditolak
                  </p>
                  <p className="text-xs text-red-700">
                    <span className="font-semibold">Catatan Perbaikan:</span>{' '}
                    {session.payroll_rejection_reason ?? 'Admin menolak sesi ini untuk perhitungan gaji.'}
                  </p>
                  {session.payroll_reviewed_at && (
                    <p className="text-xs text-gray-400 mt-1">{formatPayrollTimestamp(session.payroll_reviewed_at)}</p>
                  )}
                  {canEdit && <RequestPayrollReReview sessionId={sessionId} />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
