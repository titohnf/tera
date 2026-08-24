'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { rosterForSession } from '@/lib/enrollment'

/**
 * Boleh melihat / memicu penyelesaian sesi ini?
 *
 * Berkas ini `'use server'`, jadi setiap fungsi yang diekspornya adalah titik
 * masuk yang bisa dipanggil siapa pun yang punya sesi login — id server action
 * bukan rahasia dari orang yang bisa memuat bundel halaman. Sebelumnya
 * keduanya berjalan dengan service role tanpa satu pun pemeriksaan, dan
 * `checkAndCompleteSession()` MENGUBAH status sesi. Yang menahannya hanya
 * kebetulan bahwa tidak ada orang tak dikenal yang punya akun — persis asumsi
 * yang gugur begitu pendaftaran mandiri dibuka.
 *
 * Tidak memakai `isSessionTutor()`: fungsi itu mengunci sesi yang payroll-nya
 * sudah disetujui, sedangkan halaman tutor memanggil pemeriksa ini justru untuk
 * MENAMPILKAN keadaan sesi lama. Yang dibutuhkan di sini cuma "sesi ini memang
 * urusanmu".
 */
async function bolehLihatSesi(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
): Promise<boolean> {
  const user = await getUser()
  if (!user) return false

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'admin') return true

  const { data: session } = await admin
    .from('sessions')
    .select('tutor_id')
    .eq('id', sessionId)
    .single()
  return session?.tutor_id === user.id
}

export type CompletionCheck = {
  studentCount: number
  hasTopic: boolean
  attendanceCount: number
  presentLateCount: number
  notesCount: number
  materialsCount: number
  assessmentsCount: number
  gradedCount: number
  /** Jumlah nilai yang wajib terisi = jumlah asesmen × siswa yang hadir/telat */
  gradesRequired: number
  hasAllAttendance: boolean
  hasAllNotes: boolean
  hasMaterials: boolean
  hasAssessments: boolean
  canComplete: boolean
}

export async function getSessionCompletionStatus(sessionId: string): Promise<CompletionCheck | null> {
  const admin = createAdminClient()
  if (!(await bolehLihatSesi(admin, sessionId))) return null

  const { data: session } = await admin
    .from('sessions')
    .select('id, status, topic, class_id, scheduled_at')
    .eq('id', sessionId)
    .single()

  if (!session) return null

  const [
    { data: enrollments },
    { count: attendanceCount },
    { data: presentLateAttendances },
    { data: notedStudents },
    { count: materialsCount },
    { data: assessmentList },
  ] = await Promise.all([
    // Jumlah siswa yang dinilai per sesi ini, bukan seluruh anggota kelas:
    // siswa yang baru bergabung setelah sesi ini tidak boleh ikut menahan
    // penyelesaian sesi karena presensinya kosong.
    admin.from('class_students').select('enrolled_at, unenrolled_at, is_active').eq('class_id', session.class_id),
    admin.from('attendances').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
    admin.from('attendances').select('student_id').eq('session_id', sessionId).in('status', ['present', 'late']),
    // A student may have up to one note per category — count distinct students, not rows
    admin.from('performance_notes').select('student_id').eq('session_id', sessionId),
    admin.from('materials').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
    admin.from('assessments').select('id').eq('session_id', sessionId),
  ])
  const notesCount = new Set((notedStudents ?? []).map(n => n.student_id)).size

  const sc = rosterForSession(enrollments ?? [], session.scheduled_at).length
  const assessmentIds = (assessmentList ?? []).map(a => a.id)
  const assessmentsCount = assessmentIds.length
  const presentLateIds = (presentLateAttendances ?? []).map(a => a.student_id)
  const presentLateCount = presentLateIds.length

  // Only students who actually attended need a score — an absent student has
  // nothing to be assessed on, so their blank row must not block completion.
  let gradedCount = 0
  if (assessmentIds.length > 0 && presentLateCount > 0) {
    const { count } = await admin
      .from('assessment_results')
      .select('*', { count: 'exact', head: true })
      .in('assessment_id', assessmentIds)
      .in('student_id', presentLateIds)
      .not('score', 'is', null)
    gradedCount = count ?? 0
  }
  const gradesRequired = assessmentsCount * presentLateCount

  const hasTopic = !!(session.topic?.trim())
  const hasAllAttendance = (attendanceCount ?? 0) >= sc && sc > 0
  // Notes required for present/late students; skip only if attendance is fully submitted and none are present/late
  const hasAllNotes = !hasAllAttendance
    ? false
    : presentLateCount === 0
      ? true
      : notesCount >= presentLateCount
  const hasMaterials = (materialsCount ?? 0) >= 1
  // Mirrors the notes rule: needs at least 1 assessment with every attending
  // student graded, and is skipped entirely when nobody attended.
  const hasAssessments = !hasAllAttendance
    ? false
    : presentLateCount === 0
      ? true
      : assessmentsCount >= 1 && gradedCount >= gradesRequired
  const canComplete = hasTopic && hasAllAttendance && hasAllNotes && hasMaterials && hasAssessments

  return {
    studentCount: sc,
    hasTopic,
    attendanceCount: attendanceCount ?? 0,
    presentLateCount,
    notesCount,
    materialsCount: materialsCount ?? 0,
    assessmentsCount,
    gradedCount,
    gradesRequired,
    hasAllAttendance,
    hasAllNotes,
    hasMaterials,
    hasAssessments,
    canComplete,
  }
}

/**
 * Auto-complete a session when all required items are filled:
 * topic, attendance for every student, notes for every student,
 * at least 1 material, and at least 1 assessment.
 */
export async function checkAndCompleteSession(sessionId: string) {
  const admin = createAdminClient()
  if (!(await bolehLihatSesi(admin, sessionId))) return

  const check = await getSessionCompletionStatus(sessionId)
  if (!check?.canComplete) return

  const { data: session } = await admin
    .from('sessions')
    .select('status')
    .eq('id', sessionId)
    .single()

  if (!session) return
  if (session.status === 'completed' || session.status === 'cancelled') return

  await admin
    .from('sessions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', sessionId)
}
