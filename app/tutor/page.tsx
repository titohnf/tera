import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import Link from 'next/link'
import { computeSalary, buildRateMap } from '@/lib/salary'
import type { SessionRow, SalarySchemeRow, SessionPaymentRow, AttendanceRow } from '@/lib/types/database'
import StatCard from '@/components/tutor/StatCard'
import { getSessionDisplayStatus } from '@/lib/session-status'

type SessionWithClass = SessionRow & { classes: { name: string; level: string | null } | null; subjects: { name: string } | null }
type SessionWithClassName = SessionRow & { classes: { name: string; class_type: string | null; level: string | null; jenis: string | null } | null }
type SessionRate = { class_type: string; jenjang: string; jenis: string; rate_per_session: number }

export default async function TutorDashboard() {
  const user = await getUser()
  if (!user) return null
  const supabase = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Run all independent queries in parallel
  const [
    { data: profile },
    { data: upcomingSessions },
    { data: completedSessions },
    { data: schemes },
    { data: payments },
    { data: activePeriod },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, nickname')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { full_name: string | null; nickname: string | null } | null }>,

    supabase
      .from('sessions')
      .select('id, scheduled_at, topic, status, classes(name, level), subjects(name)')
      .eq('tutor_id', user.id)
      .in('status', ['scheduled', 'ongoing'])
      .gte('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(3) as unknown as Promise<{ data: SessionWithClass[] | null }>,

    supabase
      .from('sessions')
      .select('id, scheduled_at, topic, status, class_id, classes(name, class_type, level, jenis)')
      .eq('tutor_id', user.id)
      .eq('status', 'completed')
      .gte('scheduled_at', startOfMonth) as unknown as Promise<{ data: SessionWithClassName[] | null }>,

    supabase
      .from('salary_schemes')
      .select('*')
      .eq('tutor_id', user.id) as unknown as Promise<{ data: SalarySchemeRow[] | null }>,

    supabase
      .from('session_payments')
      .select('*')
      .eq('tutor_id', user.id)
      .gte('created_at', startOfMonth) as unknown as Promise<{ data: SessionPaymentRow[] | null }>,

    supabase.from('rate_periods').select('id').eq('is_active', true).limit(1).single(),
  ])

  const { data: activeRates } = activePeriod?.id
    ? await (supabase
        .from('session_rates')
        .select('class_type, jenjang, jenis, rate_per_session')
        .eq('period_id', activePeriod.id) as unknown as Promise<{ data: SessionRate[] | null }>)
    : { data: [] as SessionRate[] }

  const sessionIds = (completedSessions ?? []).map(s => s.id)
  type AttendancePick = Pick<AttendanceRow, 'session_id' | 'status'>
  const attendances: AttendancePick[] = sessionIds.length > 0
    ? (((await supabase.from('attendances').select('session_id, status').in('session_id', sessionIds)) as unknown as { data: AttendancePick[] | null }).data ?? [])
    : []

  const attendancesBySession: Record<string, AttendanceRow[]> = {}
  for (const a of attendances) {
    if (!attendancesBySession[a.session_id]) attendancesBySession[a.session_id] = []
    attendancesBySession[a.session_id].push(a as AttendanceRow)
  }

  const upcomingSessionIds = (upcomingSessions ?? []).map(s => s.id)
  const { data: pendingRequestsRaw } = upcomingSessionIds.length > 0
    ? await supabase
        .from('session_change_requests')
        .select('session_id')
        .in('session_id', upcomingSessionIds)
        .eq('status', 'pending') as unknown as { data: { session_id: string }[] | null }
    : { data: [] as { session_id: string }[] }
  const pendingRequestSessionIds = new Set((pendingRequestsRaw ?? []).map(r => r.session_id))

  const salaryReport = computeSalary({
    sessions: (completedSessions ?? []) as Parameters<typeof computeSalary>[0]['sessions'],
    schemes: schemes ?? [],
    attendancesBySession,
    enrolledCountBySession: {},
    payments: payments ?? [],
    rateMap: buildRateMap(activeRates ?? []),
  })

  const displayName = profile?.nickname?.trim() || profile?.full_name?.trim().split(' ')[0] || ''

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        {displayName ? `Hai, Kak ${displayName} 👋` : 'Dashboard'}
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Sesi Bulan Ini" value={String(salaryReport.totalSessions)} sub="sesi selesai" color="blue" />
        <StatCard label="Estimasi Gaji" value={formatRupiah(salaryReport.totalEarnings)} sub="bulan ini" color="green" sensitive />
        <StatCard label="Total Pemasukan" value={formatRupiah(salaryReport.paidEarnings)} sub={`menunggu ${formatRupiah(salaryReport.pendingEarnings)}`} color="yellow" sensitive />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Sesi Kelas yang Akan Datang</h2>
          <Link href="/tutor/classes" className="text-xs text-blue-600 hover:underline">Lihat semua</Link>
        </div>

        {!upcomingSessions || upcomingSessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 text-center text-sm text-gray-500">
            Tidak ada sesi kelas yang akan datang.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map(session => {
              const date = new Date(session.scheduled_at)
              const displayStatus = getSessionDisplayStatus(session.status, pendingRequestSessionIds.has(session.id))
              return (
                <Link
                  key={session.id}
                  href={`/tutor/sessions/${session.id}`}
                  className="group flex items-stretch rounded-xl ring-1 ring-gray-900/5 bg-white hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-stretch pl-5 pr-4 py-4 grow">
                    <div className="w-16 shrink-0 flex flex-col justify-center">
                      <p className="text-xs text-gray-400">
                        {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
                        <span className="text-xs font-normal text-gray-400">·{' '}
                          {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                    </div>

                    <div className="w-px bg-gray-100 mx-4 shrink-0" />

                    <div className="flex flex-col justify-center min-w-0">
                      <p className="text-sm font-normal text-gray-900 truncate">{session.classes?.name ?? 'Kelas'}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {session.subjects?.name ?? 'Mapel'}{session.topic ? ` • ${session.topic}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-4 pr-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${displayStatus.color}`}>
                      {displayStatus.label}
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

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}
