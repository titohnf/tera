import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import Link from 'next/link'
import { computeSalary, buildRateMap } from '@/lib/salary'
import type { SessionRow, SalarySchemeRow, SessionPaymentRow, AttendanceRow } from '@/lib/types/database'

type SessionWithClass = SessionRow & { classes: { name: string; level: string | null } | null }
type SessionWithClassName = SessionRow & { classes: { name: string; class_type: string | null; level: string | null; jenis: string | null } | null }
type SessionRate = { class_type: string; jenjang: string; jenis: string; rate_per_session: number }

export default async function TutorDashboard() {
  const user = await getUser()
  if (!user) return null
  const supabase = createAdminClient()

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Run all independent queries in parallel
  const [
    { data: upcomingSessions },
    { data: completedSessions },
    { data: schemes },
    { data: payments },
    { data: activePeriod },
  ] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, scheduled_at, topic, status, classes(name, level)')
      .eq('tutor_id', user.id)
      .in('status', ['scheduled', 'ongoing'])
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', in7Days.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5) as unknown as Promise<{ data: SessionWithClass[] | null }>,

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

  const salaryReport = computeSalary({
    sessions: (completedSessions ?? []) as Parameters<typeof computeSalary>[0]['sessions'],
    schemes: schemes ?? [],
    attendancesBySession,
    enrolledCountBySession: {},
    payments: payments ?? [],
    rateMap: buildRateMap(activeRates ?? []),
  })

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Sesi Bulan Ini" value={String(salaryReport.totalSessions)} sub="sesi selesai" color="blue" />
        <StatCard label="Estimasi Gaji" value={formatRupiah(salaryReport.totalEarnings)} sub="bulan ini" color="green" />
        <StatCard label="Sudah Dibayar" value={formatRupiah(salaryReport.paidEarnings)} sub={`menunggu ${formatRupiah(salaryReport.pendingEarnings)}`} color="yellow" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Sesi 7 Hari ke Depan</h2>
          <Link href="/tutor/schedule" className="text-xs text-blue-600 hover:underline">Lihat semua</Link>
        </div>

        {!upcomingSessions || upcomingSessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 text-center text-sm text-gray-500">
            Tidak ada sesi dalam 7 hari ke depan.
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map(session => {
              const date = new Date(session.scheduled_at)
              return (
                <Link
                  key={session.id}
                  href={`/tutor/sessions/${session.id}`}
                  className="flex items-center justify-between bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-4 py-3.5 hover:bg-blue-50/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{session.classes?.name ?? 'Kelas'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{session.topic ?? 'Topik belum ditentukan'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-700">
                      {date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
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

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: 'blue' | 'green' | 'yellow'
}) {
  const dots = { blue: 'bg-blue-500', green: 'bg-emerald-500', yellow: 'bg-amber-400' }
  const valueColors = { blue: 'text-blue-600', green: 'text-emerald-600', yellow: 'text-amber-600' }
  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dots[color]}`} />
        <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueColors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}
