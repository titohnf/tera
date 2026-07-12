import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import Link from 'next/link'
import SessionStatusChips from '@/components/sessions/SessionStatusChips'
import type { SessionCounts } from '@/components/sessions/SessionStatusChips'

type CountRow = [{ count: number }]

type SessionRow = {
  id: string
  scheduled_at: string
  duration_minutes: number
  location: string | null
  status: string
  topic: string | null
  classes: { name: string; level: string | null } | null
  materials: CountRow
  assessments: CountRow
  attendances: CountRow
  performance_notes: CountRow
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

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'upcoming' } = await searchParams
  const user = await getUser()
  if (!user) return null
  const supabase = createAdminClient()

  const now = new Date().toISOString()

  let query = supabase
    .from('sessions')
    .select(`
      id, scheduled_at, duration_minutes, location, status, topic,
      classes(name, level),
      materials(count),
      assessments(count),
      attendances(count),
      performance_notes(count)
    `)
    .eq('tutor_id', user.id)
    .order('scheduled_at', { ascending: filter === 'upcoming' })

  if (filter === 'upcoming') {
    // Includes sessions completed ahead of schedule — they stay "upcoming" until their date passes
    query = query.gte('scheduled_at', now).neq('status', 'cancelled')
  } else if (filter === 'past') {
    query = query.lt('scheduled_at', now).eq('status', 'completed')
  }

  const { data: sessions } = await query.limit(50) as unknown as {
    data: SessionRow[] | null
  }

  // For sessions with assessments: check if any are graded
  const allIds = (sessions ?? []).map(s => s.id)
  const { data: gradedData } = allIds.length > 0
    ? await supabase
        .from('assessments')
        .select('session_id, assessment_results(count)')
        .in('session_id', allIds) as unknown as {
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

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Jadwal Kelas</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'upcoming', label: 'Mendatang' },
          { key: 'past', label: 'Riwayat' },
          { key: 'all', label: 'Semua' },
        ].map(tab => (
          <Link
            key={tab.key}
            href={`/tutor/schedule?filter=${tab.key}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Tidak ada sesi ditemukan.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => {
            const date = new Date(session.scheduled_at)
            const counts = getCounts(session)
            return (
              <Link
                key={session.id}
                href={`/tutor/sessions/${session.id}`}
                className="flex items-center justify-between bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4 hover:bg-blue-50/50 transition-colors"
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{session.classes?.name ?? 'Kelas'}</p>
                      {session.classes?.level && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {session.classes.level}
                        </span>
                      )}
                    </div>
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
  )
}
