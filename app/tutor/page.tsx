import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import Link from 'next/link'
import { computeSalary, buildRateMap } from '@/lib/salary'
import type { SessionRow, SalarySchemeRow, SessionPaymentRow, AttendanceRow } from '@/lib/types/database'
import StatCard from '@/components/tutor/StatCard'
import InfoTooltip from '@/components/tutor/InfoTooltip'
import { getSessionDisplayStatus } from '@/lib/session-status'
import { splitClassPrefix } from '@/lib/format-class-name'
import { KKM, severityOf, SEVERITY_LABEL, SEVERITY_BADGE_CLASS } from '@/lib/academic-status'

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
    { data: overdueSessions },
    { data: rejectedPayrollSessions },
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

    // Sesi yang jadwalnya sudah lewat tapi jurnalnya belum lengkap (belum berstatus completed)
    supabase
      .from('sessions')
      .select('id, scheduled_at, classes(name)')
      .eq('tutor_id', user.id)
      .in('status', ['scheduled', 'ongoing'])
      .lt('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5) as unknown as Promise<{ data: { id: string; scheduled_at: string; classes: { name: string } | null }[] | null }>,

    // Sesi yang payroll-nya ditolak dan perlu ditinjau ulang oleh tutor
    supabase
      .from('sessions')
      .select('id, scheduled_at, payroll_rejection_reason, classes(name)')
      .eq('tutor_id', user.id)
      .eq('status', 'completed')
      .eq('payroll_status', 'rejected')
      .order('scheduled_at', { ascending: false })
      .limit(5) as unknown as Promise<{ data: { id: string; scheduled_at: string; payroll_rejection_reason: string | null; classes: { name: string } | null }[] | null }>,
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

  // Siswa dengan skor asesmen di bawah standar ketuntasan (KKM 80), dihitung
  // dari seluruh sesi completed yang pernah diajar tutor ini (tidak dibatasi bulan berjalan).
  const { data: allCompletedSessions } = await supabase
    .from('sessions')
    .select('id, class_id')
    .eq('tutor_id', user.id)
    .eq('status', 'completed') as unknown as { data: { id: string; class_id: string }[] | null }

  const allCompletedSessionIds = (allCompletedSessions ?? []).map(s => s.id)
  const sessionClassMap = new Map((allCompletedSessions ?? []).map(s => [s.id, s.class_id]))

  const { data: gradedAssessments } = allCompletedSessionIds.length > 0
    ? await supabase
        .from('assessments')
        .select('id, session_id, max_score')
        .in('session_id', allCompletedSessionIds) as unknown as { data: { id: string; session_id: string; max_score: number }[] | null }
    : { data: [] as { id: string; session_id: string; max_score: number }[] }

  const assessmentIds = (gradedAssessments ?? []).map(a => a.id)
  const assessmentMetaMap = new Map((gradedAssessments ?? []).map(a => [a.id, a]))

  const { data: allResults } = assessmentIds.length > 0
    ? await supabase
        .from('assessment_results')
        .select('assessment_id, student_id, score')
        .in('assessment_id', assessmentIds)
        .not('score', 'is', null) as unknown as { data: { assessment_id: string; student_id: string; score: number }[] | null }
    : { data: [] as { assessment_id: string; student_id: string; score: number }[] }

  const studentStats = new Map<string, { studentId: string; classId: string; total: number; below: number }>()
  for (const r of allResults ?? []) {
    const meta = assessmentMetaMap.get(r.assessment_id)
    if (!meta) continue
    const classId = sessionClassMap.get(meta.session_id)
    if (!classId) continue
    const key = `${r.student_id}|${classId}`
    const entry = studentStats.get(key) ?? { studentId: r.student_id, classId, total: 0, below: 0 }
    entry.total += 1
    const pct = (r.score / meta.max_score) * 100
    if (pct < KKM) entry.below += 1
    studentStats.set(key, entry)
  }

  const strugglingStats = [...studentStats.values()]
    .map(s => ({ ...s, pctBelow: (s.below / s.total) * 100 }))
    .sort((a, b) => b.pctBelow - a.pctBelow)
    .slice(0, 5)

  const strugglingStudentIds = [...new Set(strugglingStats.map(s => s.studentId))]
  const strugglingClassIds = [...new Set(strugglingStats.map(s => s.classId))]

  const [{ data: strugglingProfiles }, { data: strugglingClasses }] = await Promise.all([
    strugglingStudentIds.length > 0
      ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', strugglingStudentIds) as unknown as Promise<{ data: { id: string; full_name: string; avatar_url: string | null }[] | null }>
      : Promise.resolve({ data: [] as { id: string; full_name: string; avatar_url: string | null }[] }),
    strugglingClassIds.length > 0
      ? supabase.from('classes').select('id, name').in('id', strugglingClassIds) as unknown as Promise<{ data: { id: string; name: string }[] | null }>
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  const studentProfileMap = new Map((strugglingProfiles ?? []).map(p => [p.id, p]))
  const classNameMap = new Map((strugglingClasses ?? []).map(c => [c.id, c.name]))

  const strugglingStudents = strugglingStats.map(s => ({
    studentId: s.studentId,
    studentName: studentProfileMap.get(s.studentId)?.full_name ?? 'Siswa',
    avatarUrl: studentProfileMap.get(s.studentId)?.avatar_url ?? null,
    className: classNameMap.get(s.classId) ?? 'Kelas',
    classId: s.classId,
    total: s.total,
    below: s.below,
    severity: severityOf(s.pctBelow),
  }))

  const salaryReport = computeSalary({
    sessions: (completedSessions ?? []) as Parameters<typeof computeSalary>[0]['sessions'],
    schemes: schemes ?? [],
    attendancesBySession,
    enrolledCountBySession: {},
    payments: payments ?? [],
    rateMap: buildRateMap(activeRates ?? []),
  })

  const displayName = profile?.nickname?.trim() || profile?.full_name?.trim().split(' ')[0] || ''

  type ActionItem = { id: string; type: 'incomplete' | 'rejected'; className: string; date: Date; note?: string | null }
  const actionItems: ActionItem[] = [
    ...(overdueSessions ?? []).map(s => ({
      id: s.id,
      type: 'incomplete' as const,
      className: s.classes?.name ?? 'Kelas',
      date: new Date(s.scheduled_at),
    })),
    ...(rejectedPayrollSessions ?? []).map(s => ({
      id: s.id,
      type: 'rejected' as const,
      className: s.classes?.name ?? 'Kelas',
      date: new Date(s.scheduled_at),
      note: s.payroll_rejection_reason,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

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

      <div className="mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Status Akademik Siswa</h2>
            <InfoTooltip text={`Berdasarkan persentase pertemuan bernilai di bawah KKM ${KKM}: Darurat (≥50%), Waspada (20–49%), Aman (<20%).`} />
          </div>
          {strugglingStudents.length === 0 ? (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 text-center text-sm text-gray-500">
              Belum ada data nilai asesmen untuk menilai status akademik siswa.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 divide-y divide-slate-100">
              {strugglingStudents.map(s => (
                <Link
                  key={`${s.studentId}-${s.classId}`}
                  href={`/tutor/siswa/${s.studentId}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center">
                    {s.avatarUrl ? (
                      <img src={s.avatarUrl} alt={s.studentName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        {s.studentName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 grow">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.studentName}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {splitClassPrefix(s.className).prefix || s.className}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${SEVERITY_BADGE_CLASS[s.severity]}`}>
                    {SEVERITY_LABEL[s.severity]}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Perlu Tindakan</h2>
            <InfoTooltip text="Jurnal belum lengkap: sesi yang jadwalnya sudah lewat tapi presensi, catatan, materi, atau asesmennya belum lengkap. Payroll ditolak: sesi selesai yang perlu diperbaiki dan diajukan ulang untuk perhitungan gaji." />
          </div>
          {actionItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6 text-center text-sm text-gray-500">
              Tidak ada yang perlu ditindaklanjuti saat ini.
            </div>
          ) : (
            <div className="space-y-2">
              {actionItems.map(item => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={`/tutor/sessions/${item.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-4 py-3.5 hover:bg-orange-50/50 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${item.type === 'rejected' ? 'bg-red-500' : 'bg-orange-400'}`} />
                  <div className="min-w-0 grow">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.type === 'rejected' ? 'Payroll ditolak' : 'Jurnal belum lengkap'} — {item.className}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {item.type === 'rejected'
                        ? (item.note ?? 'Perbaiki dan ajukan peninjauan ulang')
                        : `Sesi ${item.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — lengkapi presensi, catatan, materi, dan asesmen`}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}
