import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClassSessions from '@/components/admin/classes/ClassSessions'
import DeleteClassButton from '@/components/admin/classes/DeleteClassButton'
import CompleteClassButton from '@/components/admin/classes/CompleteClassButton'
import ReplaceMainTutorButton from '@/components/admin/classes/ReplaceMainTutorButton'
import ClassDetailLayout from '@/components/classes/ClassDetailLayout'

type Profile = { id: string; full_name: string; email: string; avatar_url?: string | null }
type CountRow = [{ count: number }]

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const admin = createAdminClient()

  const [
    { data: cls },
    { data: enrolled },
    { data: sessions },
    { data: tutors },
    { data: subjects },
    { data: classSlots },
    { count: pendingSessionCount },
  ] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, class_type, jenis, fokus_types, is_active, status, start_date, end_date, semester, academic_year, created_at, tutor_id, profiles!tutor_id(full_name, email), class_subjects(subject_id, subjects(name))')
      .eq('id', classId)
      .single() as unknown as Promise<{
        data: {
          id: string; name: string; level: string | null; class_type: string | null
          jenis: string | null; fokus_types: string[] | null
          is_active: boolean; created_at: string
          semester: number | null; academic_year: string | null
          tutor_id: string
          profiles: { full_name: string; email: string } | null
          class_subjects: { subject_id: string; subjects: { name: string } | null }[]
        } | null
      }>,
    admin
      .from('class_students')
      .select('student_id, profiles!student_id(id, full_name, email, grade, avatar_url)')
      .eq('class_id', classId)
      .eq('is_active', true) as unknown as Promise<{
        data: { student_id: string; profiles: (Profile & { grade: number | null; avatar_url: string | null }) | null }[] | null
      }>,
    admin
      .from('sessions')
      .select(`
        id, scheduled_at, duration_minutes, status, payroll_status, location, topic, subject_id, tutor_id,
        subjects(name),
        profiles!tutor_id(full_name, avatar_url),
        materials(count),
        assessments(count),
        attendances(count),
        performance_notes(count)
      `)
      .eq('class_id', classId)
      .order('scheduled_at', { ascending: true })
      .limit(100) as unknown as Promise<{
        data: {
          id: string; scheduled_at: string; duration_minutes: number
          status: string; payroll_status: string; location: string | null; topic: string | null
          subject_id: string | null; tutor_id: string | null
          subjects: { name: string } | null
          profiles: { full_name: string; avatar_url: string | null } | null
          materials: CountRow
          assessments: CountRow
          attendances: CountRow
          performance_notes: CountRow
        }[] | null
      }>,
    admin
      .from('profiles')
      .select('id, full_name, avatar_url, is_active')
      .eq('role', 'tutor')
      .order('full_name') as unknown as Promise<{ data: { id: string; full_name: string; avatar_url: string | null; is_active: boolean }[] | null }>,
    admin
      .from('subjects')
      .select('id, name')
      .order('name') as unknown as Promise<{ data: { id: string; name: string }[] | null }>,
    admin
      .from('class_slots')
      .select('slot_index, day_of_week, start_time, tutor_id, tutor_ids, subject_ids')
      .eq('class_id', classId)
      .order('slot_index') as unknown as Promise<{
        data: {
          slot_index: number; day_of_week: number | null; start_time: string | null
          tutor_id: string | null; tutor_ids: string[]; subject_ids: string[]
        }[] | null
      }>,
    admin
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .in('status', ['scheduled', 'ongoing']),
  ])

  if (!cls) notFound()

  // Check which sessions have graded assessments
  const sessionIds = (sessions ?? []).map(s => s.id)
  const subjectIds = (cls.class_subjects ?? []).map(cs => cs.subject_id).filter(Boolean)

  const [{ data: gradedData }, { data: curriculumTopics }, { data: pendingRequestsData }] = await Promise.all([
    sessionIds.length > 0
      ? admin
          .from('assessments')
          .select('session_id, assessment_results(count)')
          .in('session_id', sessionIds) as unknown as {
            data: { session_id: string; assessment_results: CountRow }[] | null
          }
      : Promise.resolve({ data: null }),
    subjectIds.length > 0
      ? admin
          .from('curriculum_topics')
          .select('id, subject_id, grade_level, semester, theme, topic')
          .in('subject_id', subjectIds)
          .order('grade_level').order('semester').order('sort_order') as unknown as {
            data: { id: string; subject_id: string; grade_level: string; semester: number; theme: string | null; topic: string | null }[] | null
          }
      : Promise.resolve({ data: null }),
    sessionIds.length > 0
      ? admin
          .from('session_change_requests')
          .select('session_id')
          .in('session_id', sessionIds)
          .eq('status', 'pending') as unknown as { data: { session_id: string }[] | null }
      : Promise.resolve({ data: null as { session_id: string }[] | null }),
  ])

  const gradedSessionIds = (gradedData ?? [])
    .filter(a => (a.assessment_results[0]?.count ?? 0) > 0)
    .map(a => a.session_id)

  const pendingSessionIds = (pendingRequestsData ?? []).map(r => r.session_id)

  // Derive most common grade from enrolled students
  type ProfileWithGrade = Profile & { grade: number | null; avatar_url?: string | null }
  const enrolledWithGrade = (enrolled ?? [])
    .map(e => e.profiles)
    .filter((p): p is NonNullable<typeof p> => p !== null) as ProfileWithGrade[]
  const grades = enrolledWithGrade.map(p => p.grade).filter((g): g is number => g != null)
  const studentGrade = grades.length > 0
    ? (grades.sort((a, b) =>
        grades.filter(v => v === b).length - grades.filter(v => v === a).length
      )[0] ?? null)
    : null

  const enrolledStudents: ProfileWithGrade[] = enrolledWithGrade

  const classStatus = (cls as any).status ?? (cls.is_active ? 'aktif' : 'selesai')
  const startDate = (cls as any).start_date as string | null
  const endDate = (cls as any).end_date as string | null

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const jenisLabel = cls.jenis === 'reguler'
    ? 'Reguler'
    : cls.jenis === 'fokus'
    ? (cls.fokus_types && cls.fokus_types.length > 0 ? `Fokus ${cls.fokus_types.join('/')}` : 'Fokus')
    : '—'

  // Subject map for slots
  const subjectMap = new Map((subjects ?? []).map(s => [s.id, s.name]))
  // tutor_ids[i] pairs with subject_ids[i] (rotating mapel can each have a
  // different tutor) — resolve names from the tutors list already fetched
  // for the tutor-assignment dropdown above.
  const tutorNameMap = new Map((tutors ?? []).map(t => [t.id, t.full_name]))
  const tutorAvatarMap = new Map((tutors ?? []).map(t => [t.id, t.avatar_url]))
  const tutorActiveMap = new Map((tutors ?? []).map(t => [t.id, t.is_active]))

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

  // How many sessions each tutor has actually taught per subject — used
  // below to keep a former main tutor labeled "Utama" (not "Pengganti")
  // after a tutor swap moves class_slots to someone else. A one-off
  // substitute covering a single session is still "Pengganti"; someone who
  // taught the bulk of a subject's sessions keeps the "Utama" label even
  // once class_slots no longer points at them.
  const sessionCountBySubjectTutor = new Map<string, number>()
  for (const s of sessions ?? []) {
    if (!s.subject_id || !s.tutor_id) continue
    const key = `${s.subject_id}:${s.tutor_id}`
    sessionCountBySubjectTutor.set(key, (sessionCountBySubjectTutor.get(key) ?? 0) + 1)
  }

  // One row per distinct (subject, tutor) pair — seeded from this class's
  // official slot assignments, then supplemented with whoever has actually
  // taught a session, since ad-hoc swaps never update class_slots.
  const classOwnerTutorId = cls.tutor_id
  const tutorSubjectSeen = new Set<string>()
  const tutorsBySubject: { subjectName: string; tutorName: string; tutorAvatarUrl: string | null; isMainTutor: boolean; tutorIsActive: boolean }[] = []
  function addTutorSubject(subjectId: string | null, tutorId: string | null, tutorName: string | null, tutorAvatarUrl: string | null, tutorIsActive: boolean) {
    if (!subjectId || !tutorId) return
    const key = `${subjectId}:${tutorId}`
    if (tutorSubjectSeen.has(key)) return
    tutorSubjectSeen.add(key)
    const assignedTutorId = assignedTutorBySubject.get(subjectId)
    const isCurrentlyAssigned = assignedTutorId ? tutorId === assignedTutorId : tutorId === classOwnerTutorId
    const taughtSubstantially = (sessionCountBySubjectTutor.get(key) ?? 0) > 1
    tutorsBySubject.push({
      subjectName: subjectMap.get(subjectId) ?? 'Mapel',
      tutorName: tutorName ?? 'Tutor',
      tutorAvatarUrl,
      isMainTutor: isCurrentlyAssigned || taughtSubstantially,
      tutorIsActive,
    })
  }
  for (const slot of classSlots ?? []) {
    slot.subject_ids?.forEach((subjectId, i) => {
      const tutorId = slot.tutor_ids?.[i] ?? slot.tutor_id
      addTutorSubject(subjectId, tutorId, tutorId ? tutorNameMap.get(tutorId) ?? null : null, tutorId ? tutorAvatarMap.get(tutorId) ?? null : null, tutorId ? tutorActiveMap.get(tutorId) ?? true : true)
    })
  }
  for (const s of sessions ?? []) {
    addTutorSubject(s.subject_id, s.tutor_id, s.profiles?.full_name ?? null, s.profiles?.avatar_url ?? null, s.tutor_id ? tutorActiveMap.get(s.tutor_id) ?? true : true)
  }

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Link href="/admin/classes" className="hover:text-blue-600">Kelas</Link>
      <span>/</span>
      <span className="text-gray-900 font-medium">{cls.name}</span>
    </div>
  )

  // Everyone currently assigned to teach this class (class_slots, plus the
  // class's own tutor_id as a fallback for classes without slots), deduped —
  // these are the selectable "tutor yang diganti" options.
  const currentTutorIds = new Set<string>()
  for (const slot of classSlots ?? []) {
    if (slot.tutor_id) currentTutorIds.add(slot.tutor_id)
    for (const t of slot.tutor_ids ?? []) currentTutorIds.add(t)
  }
  if (currentTutorIds.size === 0 && cls.tutor_id) currentTutorIds.add(cls.tutor_id)
  const currentTutors = [...currentTutorIds]
    .map(id => ({ id, full_name: tutorNameMap.get(id) ?? 'Tutor' }))
  const activeTutors = (tutors ?? []).filter(t => t.is_active).map(t => ({ id: t.id, full_name: t.full_name }))

  const actions = (
    <div className="space-y-2">
      <Link
        href={`/admin/classes/${classId}/edit`}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 border border-slate-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-slate-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </Link>
      <ReplaceMainTutorButton
        classId={classId}
        className={cls.name}
        currentTutors={currentTutors}
        allTutors={activeTutors}
      />
      <CompleteClassButton
        classId={classId}
        pendingSessions={pendingSessionCount ?? 0}
        alreadyDone={classStatus === 'selesai'}
      />
      <DeleteClassButton classId={classId} className={cls.name} />
    </div>
  )

  return (
    <ClassDetailLayout
      breadcrumb={breadcrumb}
      className={cls.name}
      level={cls.level}
      classType={cls.class_type}
      isActive={classStatus !== 'selesai'}
      jenisLabel={jenisLabel}
      semester={cls.semester}
      academicYear={cls.academic_year}
      startDate={startDate}
      endDate={endDate}
      fmtDate={fmtDate}
      classSlots={classSlots ?? []}
      subjectMap={subjectMap}
      tutorsBySubject={tutorsBySubject}
      enrolledStudents={enrolledStudents.map(s => ({
        id: s.id,
        full_name: s.full_name,
        avatar_url: (s as any).avatar_url as string | null,
        href: `/admin/siswa/${s.id}`,
      }))}
      actions={actions}
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <ClassSessions
          classId={classId}
          sessions={sessions ?? []}
          gradedSessionIds={gradedSessionIds}
          pendingSessionIds={pendingSessionIds}
          tutors={tutors ?? []}
          subjects={subjects ?? []}
          defaultTutorId={classSlots?.[0]?.tutor_ids?.[0] ?? classSlots?.[0]?.tutor_id ?? cls.tutor_id}
          defaultSubjectId={classSlots?.[0]?.subject_ids?.[0] ?? cls.class_subjects?.[0]?.subject_id ?? undefined}
          curriculumTopics={curriculumTopics ?? []}
          studentGrade={studentGrade}
        />
      </div>
    </ClassDetailLayout>
  )
}
