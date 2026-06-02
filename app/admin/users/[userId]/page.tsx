import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import PasswordResetButton from '@/components/admin/users/PasswordResetButton'
import UserAvatarUpload from '@/components/admin/users/UserAvatarUpload'

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  tutor: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
  parent: 'bg-yellow-100 text-yellow-700',
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  tutor: 'Tutor',
  student: 'Siswa',
  parent: 'Orang Tua',
}

type ClassRow = { id: string; name: string; level: string | null; is_active: boolean }

type SessionRow = {
  id: string
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
}

type AttendanceRow = {
  session_id: string
  status: string
}

type AssessmentRow = {
  id: string
  title: string
  max_score: number
  session_id: string
  sessions: { scheduled_at: string; topic: string | null; class_id: string } | null
}

type AssessmentResultRow = {
  assessment_id: string
  score: number | null
  feedback: string | null
}

type PerformanceNoteRow = {
  id: string
  body: string
  created_at: string
  session_id: string
  sessions: { scheduled_at: string; topic: string | null; class_id: string } | null
  profiles: { full_name: string } | null
}

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const admin = createAdminClient()

  const { data: user } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, role, level, grade, parent_name, created_at, avatar_url')
    .eq('id', userId)
    .single()

  if (!user) notFound()

  // Students have a dedicated page
  if (user.role === 'student') redirect(`/admin/siswa/${userId}`)

  // Fetch related data based on role
  let taughtClasses: ClassRow[] = []
  let enrolledClasses: ClassRow[] = []

  // Student progress data
  let studentSessions: SessionRow[] = []
  let studentAttendances: AttendanceRow[] = []
  let studentAssessments: AssessmentRow[] = []
  let studentResults: AssessmentResultRow[] = []
  let studentNotes: PerformanceNoteRow[] = []

  if (user.role === 'tutor') {
    const { data } = await admin
      .from('classes')
      .select('id, name, level, is_active')
      .eq('tutor_id', userId)
      .order('created_at', { ascending: false }) as { data: ClassRow[] | null }
    taughtClasses = data ?? []
  }

  if (user.role === 'student') {
    const { data } = await admin
      .from('class_students')
      .select('classes(id, name, level, is_active)')
      .eq('student_id', userId)
      .eq('is_active', true) as unknown as { data: { classes: ClassRow | null }[] | null }
    enrolledClasses = (data ?? []).map(e => e.classes).filter((c): c is ClassRow => c !== null)

    const classIds = enrolledClasses.map(c => c.id)

    if (classIds.length > 0) {
      // Fetch attendances first — source of truth for which sessions the student was tracked in
      const [attendancesRes, notesRes] = await Promise.all([
        admin
          .from('attendances')
          .select('session_id, status')
          .eq('student_id', userId) as unknown as Promise<{ data: AttendanceRow[] | null }>,
        admin
          .from('performance_notes')
          .select('id, body, created_at, session_id, sessions(scheduled_at, topic, class_id), profiles!tutor_id(full_name)')
          .eq('student_id', userId)
          .order('created_at', { ascending: false })
          .limit(10) as unknown as Promise<{ data: PerformanceNoteRow[] | null }>,
      ])

      studentAttendances = attendancesRes.data ?? []
      studentNotes = notesRes.data ?? []

      // Fetch all sessions for enrolled classes (past sessions, any status)
      const now = new Date().toISOString()
      const sessionsRes = await admin
        .from('sessions')
        .select('id, class_id, scheduled_at, topic, status')
        .in('class_id', classIds)
        .lte('scheduled_at', now)
        .order('scheduled_at', { ascending: false }) as unknown as { data: SessionRow[] | null }

      studentSessions = sessionsRes.data ?? []

      const sessionIds = studentSessions.map(s => s.id)
      if (sessionIds.length > 0) {
        studentAssessments = (
          await admin
            .from('assessments')
            .select('id, title, max_score, session_id, sessions(scheduled_at, topic, class_id)')
            .in('session_id', sessionIds) as unknown as { data: AssessmentRow[] | null }
        ).data ?? []

        if (studentAssessments.length > 0) {
          const assessmentIds = studentAssessments.map(a => a.id)
          const { data: resultsData } = await admin
            .from('assessment_results')
            .select('assessment_id, score, feedback')
            .eq('student_id', userId)
            .in('assessment_id', assessmentIds) as { data: AssessmentResultRow[] | null }
          studentResults = resultsData ?? []
        }
      }
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/users" className="hover:text-blue-600">Pengguna</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{user.full_name}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: profile info + edit form */}
        <div className="col-span-2 space-y-6">
          {/* Profile header */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 flex items-center gap-4">
              <UserAvatarUpload
                userId={userId}
                currentUrl={user.avatar_url ?? null}
                name={user.full_name}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-gray-900">{user.full_name}</h1>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
              </div>
              </div>
              <Link
                href={`/admin/users/${userId}/edit`}
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Edit
              </Link>
            </div>
            <p className="text-xs text-gray-400">
              Bergabung {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Classes for tutor */}
          {user.role === 'tutor' && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Kelas yang Diajar ({taughtClasses.length})</h2>
                <Link href="/admin/classes" className="text-xs text-blue-600 hover:underline">Kelola kelas</Link>
              </div>
              {taughtClasses.length === 0 ? (
                <p className="text-sm text-gray-500">Tutor ini belum mengajar kelas manapun.</p>
              ) : (
                <div className="space-y-2">
                  {taughtClasses.map(cls => (
                    <Link
                      key={cls.id}
                      href={`/admin/classes/${cls.id}`}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-800">{cls.name}</span>
                        {cls.level && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{cls.level}</span>}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {cls.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Student progress */}
          {user.role === 'student' && (() => {
            const attendanceMap = new Map(studentAttendances.map(a => [a.session_id, a.status]))
            const resultMap = new Map(studentResults.map(r => [r.assessment_id, r]))

            return (
              <>
                {/* Enrolled classes */}
                <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Kelas yang Diikuti ({enrolledClasses.length})</h2>
                  {enrolledClasses.length === 0 ? (
                    <p className="text-sm text-gray-500">Siswa ini belum terdaftar di kelas manapun.</p>
                  ) : (
                    <div className="space-y-2">
                      {enrolledClasses.map(cls => (
                        <Link
                          key={cls.id}
                          href={`/admin/classes/${cls.id}`}
                          className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-800">{cls.name}</span>
                            {cls.level && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{cls.level}</span>}
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {cls.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Per-class progress */}
                {enrolledClasses.length > 0 && enrolledClasses.map(cls => {
                  const classSessions = studentSessions.filter(s => s.class_id === cls.id)
                  const totalPast = classSessions.length
                  // Only count sessions where attendance was recorded as denominator
                  const trackedSessions = classSessions.filter(s => attendanceMap.has(s.id))
                  const total = trackedSessions.length
                  const attended = trackedSessions.filter(s => {
                    const status = attendanceMap.get(s.id)
                    return status === 'present' || status === 'late'
                  }).length
                  const absent = trackedSessions.filter(s => attendanceMap.get(s.id) === 'absent').length
                  const excused = trackedSessions.filter(s => attendanceMap.get(s.id) === 'excused').length
                  const attendancePct = total > 0 ? Math.round((attended / total) * 100) : null

                  const classAssessments = studentAssessments.filter(
                    a => a.sessions?.class_id === cls.id
                  )
                  const scoredResults = classAssessments
                    .map(a => resultMap.get(a.id))
                    .filter((r): r is AssessmentResultRow => r !== undefined && r.score !== null)
                  const avgScore = scoredResults.length > 0
                    ? Math.round(scoredResults.reduce((s, r) => s + (r.score ?? 0), 0) / scoredResults.length)
                    : null
                  const avgMaxScore = scoredResults.length > 0
                    ? Math.round(
                        classAssessments
                          .filter(a => resultMap.get(a.id)?.score !== null && resultMap.get(a.id) !== undefined)
                          .reduce((s, a) => s + a.max_score, 0) / scoredResults.length
                      )
                    : null

                  const topics = [...new Set(
                    classSessions
                      .filter(s => s.topic)
                      .map(s => s.topic as string)
                  )]

                  return (
                    <div key={cls.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
                      {/* Class header */}
                      <div className="px-5 py-4 bg-slate-50 border-b border-slate-300 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{cls.name}</p>
                          {cls.level && <p className="text-xs text-gray-500">{cls.level}</p>}
                        </div>
                        <Link href={`/admin/classes/${cls.id}`} className="text-xs text-blue-600 hover:underline">Lihat kelas</Link>
                      </div>

                      <div className="p-5 space-y-5">
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4">
                          {/* Attendance */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Kehadiran</p>
                            {total === 0 ? (
                              <p className="text-sm text-gray-400">—</p>
                            ) : (
                              <>
                                <p className={`text-xl font-bold ${
                                  attendancePct !== null && attendancePct >= 80 ? 'text-green-600'
                                  : attendancePct !== null && attendancePct >= 60 ? 'text-yellow-600'
                                  : 'text-red-500'
                                }`}>
                                  {attendancePct}%
                                </p>
                                <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      attendancePct !== null && attendancePct >= 80 ? 'bg-green-500'
                                      : attendancePct !== null && attendancePct >= 60 ? 'bg-yellow-500'
                                      : 'bg-red-400'
                                    }`}
                                    style={{ width: `${attendancePct ?? 0}%` }}
                                  />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">{attended}/{total} sesi · {absent} absen · {excused} izin</p>
                              </>
                            )}
                          </div>

                          {/* Avg score */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Rata-rata Nilai</p>
                            {avgScore === null ? (
                              <p className="text-sm text-gray-400">Belum ada</p>
                            ) : (
                              <>
                                <p className={`text-xl font-bold ${
                                  avgScore >= 75 ? 'text-green-600' : avgScore >= 60 ? 'text-yellow-600' : 'text-red-500'
                                }`}>
                                  {avgScore}
                                  {avgMaxScore !== null && <span className="text-sm font-normal text-gray-400">/{avgMaxScore}</span>}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">{scoredResults.length} asesmen dinilai</p>
                              </>
                            )}
                          </div>

                          {/* Sessions count */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Sesi Selesai</p>
                            <p className="text-xl font-bold text-gray-800">{totalPast}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{classAssessments.length} asesmen</p>
                          </div>
                        </div>

                        {/* Assessments */}
                        {classAssessments.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nilai Asesmen</p>
                            <div className="border border-slate-300 rounded-lg overflow-hidden divide-y divide-slate-300">
                              {classAssessments.map(a => {
                                const result = resultMap.get(a.id)
                                const score = result?.score ?? null
                                const pct = score !== null ? Math.round((score / a.max_score) * 100) : null
                                const sessionDate = a.sessions?.scheduled_at
                                  ? new Date(a.sessions.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                  : null
                                return (
                                  <div key={a.id} className="flex items-center justify-between px-3 py-2.5">
                                    <div>
                                      <p className="text-sm text-gray-800">{a.title}</p>
                                      <p className="text-xs text-gray-400">
                                        {sessionDate && `${sessionDate}`}
                                        {a.sessions?.topic && ` · ${a.sessions.topic}`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      {score !== null ? (
                                        <>
                                          <span className="text-sm font-semibold text-gray-800">{score}/{a.max_score}</span>
                                          {pct !== null && (
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                              pct >= 75 ? 'bg-green-100 text-green-700'
                                              : pct >= 60 ? 'bg-yellow-100 text-yellow-700'
                                              : 'bg-red-100 text-red-600'
                                            }`}>
                                              {pct >= 75 ? 'Tuntas' : 'Belum Tuntas'}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-xs text-gray-400">Belum dinilai</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Topics */}
                        {topics.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Topik yang Dipelajari</p>
                            <div className="flex flex-wrap gap-1.5">
                              {topics.map((topic, i) => (
                                <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Performance notes */}
                {studentNotes.length > 0 && (
                  <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-300">
                      <p className="text-sm font-semibold text-gray-900">Catatan Tutor</p>
                      <p className="text-xs text-gray-500">Catatan perkembangan terbaru dari tutor</p>
                    </div>
                    <div className="divide-y divide-slate-300">
                      {studentNotes.map(note => {
                        const cls = enrolledClasses.find(c => c.id === note.sessions?.class_id)
                        const date = note.sessions?.scheduled_at
                          ? new Date(note.sessions.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date(note.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        return (
                          <div key={note.id} className="px-5 py-4">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                {cls && <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">{cls.name}</span>}
                                {note.sessions?.topic && <span className="text-xs text-gray-500">{note.sessions.topic}</span>}
                              </div>
                              <p className="text-xs text-gray-400">{date}</p>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{note.body}</p>
                            {note.profiles?.full_name && (
                              <p className="text-xs text-gray-400 mt-1.5">— {note.profiles.full_name}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* Right: actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Aksi Akun</h2>
            <PasswordResetButton userId={userId} />
          </div>

          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Info Akun</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <p>ID: <span className="font-mono text-gray-400 text-[10px]">{userId}</span></p>
              <p>Email terverifikasi: email login aktif</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
