import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import {
  getMonthlyTotals,
  outstandingAmount,
  currentMonthWib,
  formatMonthLabel,
  OUTSTANDING_SELECT,
  type InvoiceWithPayments,
} from '@/lib/finance/laba-rugi'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function MetricCard({
  label, value, sub, color = 'default', unavailable = false,
}: {
  label: string
  value: string
  sub?: string
  color?: 'default' | 'green' | 'yellow' | 'red' | 'blue' | 'orange'
  unavailable?: boolean
}) {
  const valueColor = unavailable ? 'text-gray-300' : {
    default: 'text-gray-900',
    green: 'text-green-600',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    blue: 'text-blue-600',
    orange: 'text-orange-500',
  }[color]

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-sm text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function UnavailableCard({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 opacity-60">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-200">—</p>
      <p className="text-sm text-gray-400 mt-0.5">{reason}</p>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{title}</h2>
  )
}

export default async function AnalyticsPage() {
  const admin = createAdminClient()
  const now = new Date()
  const month = currentMonthWib(now)
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalStudents },
    { count: newStudentsThisMonth },
    { count: totalTutors },
    { count: completedSessionsThisMonth },
    { data: monthSessions },
    { count: totalActiveEnrollments },
    { count: totalEverEnrolled },
    { data: unpaidInvoices },
    { data: assessmentResults },
    { data: tutorSessions },
    monthlyTotals,
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', firstOfMonth),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'tutor'),
    admin.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('scheduled_at', firstOfMonth),
    admin.from('sessions').select('id, duration_minutes').eq('status', 'completed').gte('scheduled_at', firstOfMonth),
    admin.from('class_students').select('*', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('class_students').select('*', { count: 'exact', head: true }),
    admin.from('invoices').select(OUTSTANDING_SELECT).neq('status', 'paid') as unknown as Promise<{
      data: InvoiceWithPayments[] | null
    }>,
    admin.from('assessment_results').select('score, assessments!inner(max_score)') as unknown as Promise<{
      data: { score: number | null; assessments: { max_score: number } | null }[] | null
    }>,
    admin.from('sessions').select('tutor_id').eq('status', 'completed').gte('scheduled_at', firstOfMonth).not('tutor_id', 'is', null),
    // Angka keuangan diambil dari modul yang sama dengan halaman Laba Rugi dan
    // dashboard, supaya ketiganya tidak pernah menyebut angka yang berbeda
    // untuk bulan yang sama.
    getMonthlyTotals(admin, [month]),
  ])

  // Attendance rate this month
  const sessionIds = (monthSessions ?? []).map(s => s.id)
  let attendanceRate: number | null = null
  if (sessionIds.length > 0) {
    const { data: attendances } = await admin
      .from('attendances')
      .select('status')
      .in('session_id', sessionIds)
    const tot = attendances?.length ?? 0
    const present = (attendances ?? []).filter(a => a.status === 'present' || a.status === 'late').length
    attendanceRate = tot > 0 ? Math.round((present / tot) * 100) : null
  }

  // Total jam mengajar bulan ini
  const totalMinutes = (monthSessions ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0)
  const totalHours = Math.round(totalMinutes / 60)

  // Rasio siswa / tutor
  const ratioSiswaPerTutor = totalTutors ? ((totalActiveEnrollments ?? 0) / totalTutors).toFixed(1) : null

  // Keuangan bulan ini — basis kas, lihat lib/finance/laba-rugi.ts
  const pnl = monthlyTotals[0]
  const revenuePending = outstandingAmount(unpaidInvoices)
  const revenuePerSiswa = (totalActiveEnrollments ?? 0) > 0
    ? Math.round(pnl.cashIn / (totalActiveEnrollments ?? 1))
    : 0
  const marginPct = pnl.cashIn > 0 ? Math.round((pnl.netProfit / pnl.cashIn) * 100) : null

  // Utilisasi tutor bulan ini
  const activeTutorIdsThisMonth = new Set((tutorSessions ?? []).map(s => s.tutor_id).filter(Boolean))
  const utilisasiTutor = totalTutors
    ? Math.round((activeTutorIdsThisMonth.size / totalTutors) * 100)
    : null

  // Churn rate (proxy: inactive / total pernah daftar)
  const churned = (totalEverEnrolled ?? 0) - (totalActiveEnrollments ?? 0)
  const churnRate = (totalEverEnrolled ?? 0) > 0
    ? Math.round((churned / (totalEverEnrolled ?? 1)) * 100)
    : null

  // Passing rate & rata-rata nilai
  const resultsWithScore = (assessmentResults ?? []).filter(
    r => r.score !== null && r.assessments?.max_score
  )
  let passingRate: number | null = null
  let avgScore: number | null = null
  if (resultsWithScore.length > 0) {
    const pctScores = resultsWithScore.map(r => (r.score! / r.assessments!.max_score) * 100)
    avgScore = Math.round(pctScores.reduce((a, b) => a + b, 0) / pctScores.length)
    const passing = pctScores.filter(s => s >= 75).length
    passingRate = Math.round((passing / pctScores.length) * 100)
  }

  function attendanceColor(rate: number | null) {
    if (rate === null) return 'default'
    if (rate >= 80) return 'green'
    if (rate >= 60) return 'yellow'
    return 'red'
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Analitik &amp; Metrik</h1>

      {/* Operasional */}
      <div className="mb-7">
        <SectionHeader title="Operasional" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Sesi Selesai Bulan Ini"
            value={String(completedSessionsThisMonth ?? 0)}
            sub="sesi terlaksana"
          />
          <MetricCard
            label="Tingkat Kehadiran"
            value={attendanceRate !== null ? `${attendanceRate}%` : '—'}
            sub="hadir + terlambat"
            color={attendanceColor(attendanceRate)}
          />
          <MetricCard
            label="Total Jam Mengajar"
            value={`${totalHours} jam`}
            sub="bulan ini"
          />
          <MetricCard
            label="Utilisasi Tutor"
            value={utilisasiTutor !== null ? `${utilisasiTutor}%` : '—'}
            sub={`${activeTutorIdsThisMonth.size} dari ${totalTutors ?? 0} tutor mengajar`}
            color={attendanceColor(utilisasiTutor)}
          />
        </div>
      </div>

      {/* Siswa & Akademik */}
      <div className="mb-7">
        <SectionHeader title="Siswa &amp; Akademik" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Total Siswa Aktif"
            value={String(totalActiveEnrollments ?? 0)}
            sub={`dari ${totalStudents ?? 0} terdaftar`}
          />
          <MetricCard
            label="Siswa Baru Bulan Ini"
            value={String(newStudentsThisMonth ?? 0)}
            color="blue"
          />
          <MetricCard
            label="Rasio Siswa / Tutor"
            value={ratioSiswaPerTutor ? `${ratioSiswaPerTutor}:1` : '—'}
            sub="siswa aktif per tutor"
          />
          <MetricCard
            label="Churn (Proxy)"
            value={churnRate !== null ? `${churnRate}%` : '—'}
            sub={`${churned} dari ${totalEverEnrolled ?? 0} pernah daftar tidak aktif`}
            color={churnRate === null ? 'default' : churnRate <= 10 ? 'green' : churnRate <= 25 ? 'yellow' : 'red'}
          />
          <MetricCard
            label="Rata-rata Nilai Asesmen"
            value={avgScore !== null ? `${avgScore}` : '—'}
            sub="dari skala 100"
            color={avgScore === null ? 'default' : avgScore >= 75 ? 'green' : avgScore >= 60 ? 'yellow' : 'red'}
          />
          <MetricCard
            label="Passing Rate"
            value={passingRate !== null ? `${passingRate}%` : '—'}
            sub="nilai ≥ 75 dari maks"
            color={passingRate === null ? 'default' : passingRate >= 75 ? 'green' : passingRate >= 50 ? 'yellow' : 'red'}
          />
          <UnavailableCard label="Progres Nilai per Siswa" reason="lihat di halaman laporan" />
          <UnavailableCard label="NPS Siswa / Orang Tua" reason="perlu fitur survei" />
        </div>
      </div>

      {/* Keuangan */}
      <div className="mb-7">
        <SectionHeader title="Keuangan" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Uang Masuk Bulan Ini"
            value={formatRupiah(pnl.cashIn)}
            sub="pembayaran yang diterima"
            color="green"
          />
          <MetricCard
            label="Gaji Tutor"
            value={formatRupiah(pnl.payroll)}
            sub={pnl.payrollUnpaid > 0 ? `${formatRupiah(pnl.payrollUnpaid)} belum dibayar` : 'slip gaji bulan ini'}
            color={pnl.payroll > 0 ? 'red' : 'default'}
          />
          <MetricCard
            label="Biaya Operasional"
            value={formatRupiah(pnl.operational)}
            sub="di luar gaji tutor"
            color={pnl.operational > 0 ? 'orange' : 'default'}
          />
          <MetricCard
            label="Laba Bersih"
            value={formatRupiah(pnl.netProfit)}
            sub={marginPct !== null ? `margin ${marginPct}%` : 'belum ada pemasukan'}
            color={pnl.netProfit >= 0 ? 'blue' : 'red'}
          />
          <MetricCard
            label="Uang Masuk per Siswa"
            value={revenuePerSiswa > 0 ? formatRupiah(revenuePerSiswa) : '—'}
            sub="rata-rata per siswa aktif"
          />
          <MetricCard
            label="Piutang"
            value={formatRupiah(revenuePending)}
            sub="tagihan terkirim yang belum lunas"
            color={revenuePending > 0 ? 'orange' : 'default'}
          />
          <UnavailableCard label="MRR (Recurring Revenue)" reason="perlu model langganan" />
          <UnavailableCard label="LTV (Lifetime Value)" reason="perlu histori billing lengkap" />
          <UnavailableCard label="CAC (Biaya Akuisisi)" reason="perlu tracking leads/marketing" />
          <UnavailableCard label="Rasio LTV:CAC" reason="perlu LTV & CAC" />
          <UnavailableCard label="Referral Rate" reason="perlu sistem referral" />
        </div>
      </div>

      {/* Growth */}
      <div className="mb-7">
        <SectionHeader title="Growth &amp; Retensi" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Siswa Baru Bulan Ini"
            value={String(newStudentsThisMonth ?? 0)}
            color="blue"
            sub="pendaftaran baru"
          />
          <MetricCard
            label="Retensi Pendaftaran"
            value={churnRate !== null ? `${100 - churnRate}%` : '—'}
            sub="siswa yang masih aktif"
            color={churnRate === null ? 'default' : (100 - churnRate) >= 80 ? 'green' : (100 - churnRate) >= 60 ? 'yellow' : 'red'}
          />
          <UnavailableCard label="Conversion Rate" reason="perlu tracking leads" />
          <UnavailableCard label="Re-enrollment Rate" reason="perlu konsep periode/siklus kelas" />
        </div>
      </div>

      <p className="text-sm text-gray-400 mt-2">
        Data operasional &amp; akademik dihitung secara real-time. Metrik keuangan memakai basis kas untuk{' '}
        {formatMonthLabel(month)} — sumber angkanya sama persis dengan{' '}
        <Link href="/admin/finance" className="text-blue-500 hover:underline">halaman Laba Rugi</Link>,
        tempat rinciannya bisa dibuka per bulan. Kartu abu-abu menunjukkan metrik yang membutuhkan
        fitur atau data tambahan untuk diaktifkan.
      </p>
    </div>
  )
}
