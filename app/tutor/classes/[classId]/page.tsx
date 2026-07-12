import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SessionStatusChips from '@/components/sessions/SessionStatusChips'
import type { SessionCounts } from '@/components/sessions/SessionStatusChips'

const DAY_NAMES: Record<number, string> = {
  1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 0: 'Minggu',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Terjadwal',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

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
  subjects: { name: string } | null
  materials: CountRow
  assessments: CountRow
  attendances: CountRow
  performance_notes: CountRow
}

export default async function TutorClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ filter?: string }>
}) {
  const { classId } = await params
  const { filter = 'upcoming' } = await searchParams
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const now = new Date().toISOString()

  let sessionsQuery = admin
    .from('sessions')
    .select(`
      id, scheduled_at, duration_minutes, location, status, topic,
      subjects(name),
      materials(count),
      assessments(count),
      attendances(count),
      performance_notes(count)
    `)
    .eq('class_id', classId)
    .eq('tutor_id', user.id)
    .order('scheduled_at', { ascending: filter !== 'past' })

  if (filter === 'upcoming') {
    sessionsQuery = sessionsQuery.gte('scheduled_at', now).neq('status', 'cancelled')
  } else if (filter === 'past') {
    sessionsQuery = sessionsQuery.lt('scheduled_at', now).eq('status', 'completed')
  }

  const [
    { data: cls },
    { data: classSlots },
    { data: enrolled },
    { data: sessions },
    { data: subjects },
  ] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, class_type, is_active, start_date, end_date, class_subjects(subject_id, subjects(name))')
      .eq('id', classId)
      .eq('tutor_id', user.id)
      .single() as unknown as Promise<{
        data: {
          id: string; name: string; level: string | null; class_type: string | null
          is_active: boolean; start_date: string | null; end_date: string | null
          class_subjects: { subject_id: string; subjects: { name: string } | null }[]
        } | null
      }>,
    admin
      .from('class_slots')
      .select('slot_index, day_of_week, start_time, subject_ids')
      .eq('class_id', classId)
      .order('slot_index') as unknown as Promise<{
        data: { slot_index: number; day_of_week: number | null; start_time: string | null; subject_ids: string[] }[] | null
      }>,
    admin
      .from('class_students')
      .select('student_id, profiles!student_id(id, full_name, grade, avatar_url)')
      .eq('class_id', classId)
      .eq('is_active', true) as unknown as Promise<{
        data: { student_id: string; profiles: StudentProfile | null }[] | null
      }>,
    sessionsQuery.limit(100) as unknown as Promise<{ data: SessionRow[] | null }>,
    admin
      .from('subjects')
      .select('id, name') as unknown as Promise<{ data: { id: string; name: string }[] | null }>,
  ])

  if (!cls) notFound()

  const sessionIds = (sessions ?? []).map(s => s.id)
  const { data: gradedData } = sessionIds.length > 0
    ? await admin
        .from('assessments')
        .select('session_id, assessment_results(count)')
        .in('session_id', sessionIds) as unknown as {
          data: { session_id: string; assessment_results: CountRow }[] | null
        }
    : { data: null }

  const gradedSessionIds = new Set(
    (gradedData ?? [])
      .filter(a => (a.assessment_results[0]?.count ?? 0) > 0)
      .map(a => a.session_id)
  )

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

  const subjectMap = new Map((subjects ?? []).map(s => [s.id, s.name]))
  const enrolledStudents = (enrolled ?? [])
    .map(e => e.profiles)
    .filter((p): p is StudentProfile => p !== null)

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
    return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/tutor/classes" className="hover:text-blue-600">Kelas Saya</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{cls.name}</span>
      </div>

      <div className="bg-white rounded-2xl shadow ring-1 ring-gray-900/5 p-6">
        <div className="flex items-center gap-2.5 flex-wrap mb-5">
          <h1 className="text-xl font-semibold text-gray-900">{cls.name}</h1>
          {cls.level && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{cls.level}</span>
          )}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            cls.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {cls.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tipe</p>
            <p className="text-sm text-gray-800">
              {cls.class_type === 'group' ? 'Reguler' : cls.class_type === 'private' ? 'Privat' : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Mapel</p>
            <p className="text-sm text-gray-800">
              {cls.class_subjects?.map(cs => cs.subjects?.name).filter(Boolean).join(', ') || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tanggal Mulai</p>
            <p className="text-sm text-gray-800">{cls.start_date ? fmtDate(cls.start_date) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tanggal Selesai</p>
            <p className="text-sm text-gray-800">{cls.end_date ? fmtDate(cls.end_date) : '—'}</p>
          </div>
        </div>

        {(classSlots ?? []).length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Jadwal Mingguan</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {(classSlots ?? []).map(slot => {
                const slotSubject = (slot.subject_ids ?? []).map(id => subjectMap.get(id)).filter(Boolean).join(', ') || '—'
                return (
                  <p key={slot.slot_index} className="text-sm text-gray-700">
                    <span className="font-medium">{slot.day_of_week !== null ? DAY_NAMES[slot.day_of_week] : '—'}</span>
                    {slot.start_time && <span className="text-gray-400"> {slot.start_time.slice(0, 5)}</span>}
                    <span className="text-gray-400"> · </span>
                    {slotSubject}
                  </p>
                )
              })}
            </div>
          </div>
        )}

        {enrolledStudents.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Siswa Terdaftar <span className="text-gray-600 font-normal normal-case">({enrolledStudents.length})</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {enrolledStudents.map(s => (
                <div key={s.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt={s.full_name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-blue-700">{getInitials(s.full_name)}</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-700">{s.full_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow ring-1 ring-gray-900/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sesi Kelas Ini</p>
          <div className="flex gap-2">
            {[
              { key: 'upcoming', label: 'Mendatang' },
              { key: 'past', label: 'Riwayat' },
              { key: 'all', label: 'Semua' },
            ].map(tab => (
              <Link
                key={tab.key}
                href={`/tutor/classes/${classId}?filter=${tab.key}`}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {!sessions || sessions.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">Belum ada sesi untuk kelas ini.</div>
        ) : (
          <div className="space-y-2">
            {sessions.map(session => {
              const date = new Date(session.scheduled_at)
              const counts = getCounts(session)
              return (
                <Link
                  key={session.id}
                  href={`/tutor/sessions/${session.id}`}
                  className="flex items-center justify-between rounded-xl ring-1 ring-gray-900/5 px-5 py-4 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-center w-12 shrink-0">
                      <p className="text-xs text-gray-500">
                        {date.toLocaleDateString('id-ID', { month: 'short' })}
                      </p>
                      <p className="text-xl font-bold text-gray-900">{date.getDate()}</p>
                      <p className="text-xs text-gray-500">
                        {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{session.subjects?.name ?? 'Sesi'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {session.location ? ` • ${session.location}` : ''}
                        {` • ${session.duration_minutes} menit`}
                      </p>
                      <SessionStatusChips status={session.status} counts={counts} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[session.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[session.status] ?? session.status}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
