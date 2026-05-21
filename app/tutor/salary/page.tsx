import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { computeSalary } from '@/lib/salary'
import Link from 'next/link'
import type { SalarySchemeRow, SessionPaymentRow, AttendanceRow, SessionRow } from '@/lib/types/database'

type SessionWithClass = SessionRow & { classes: { name: string } | null }
type AttendancePick = Pick<AttendanceRow, 'session_id' | 'status'>

const MONTHS: { value: string; label: string }[] = (() => {
  const result = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    })
  }
  return result
})()

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  paid: { label: 'Dibayar', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-600' },
}

export default async function SalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month = MONTHS[0].value } = await searchParams
  const user = await getUser()
  if (!user) return null
  const supabase = createAdminClient()

  const startDate = `${month}-01T00:00:00.000Z`
  const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 1).toISOString()

  const [
    { data: sessions },
    { data: schemes },
    { data: payments },
  ] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, scheduled_at, topic, status, class_id, classes(name)')
      .eq('tutor_id', user.id)
      .eq('status', 'completed')
      .gte('scheduled_at', startDate)
      .lt('scheduled_at', endDate) as unknown as Promise<{ data: SessionWithClass[] | null }>,

    supabase
      .from('salary_schemes')
      .select('*')
      .eq('tutor_id', user.id) as unknown as Promise<{ data: SalarySchemeRow[] | null }>,

    supabase
      .from('session_payments')
      .select('*')
      .eq('tutor_id', user.id)
      .gte('created_at', startDate)
      .lt('created_at', endDate) as unknown as Promise<{ data: SessionPaymentRow[] | null }>,
  ])

  const sessionIds = (sessions ?? []).map(s => s.id)

  const attendances: AttendancePick[] = sessionIds.length > 0
    ? (((await supabase.from('attendances').select('session_id, status').in('session_id', sessionIds)) as unknown as { data: AttendancePick[] | null }).data ?? [])
    : []

  const attendancesBySession: Record<string, AttendanceRow[]> = {}
  for (const a of attendances) {
    if (!attendancesBySession[a.session_id]) attendancesBySession[a.session_id] = []
    attendancesBySession[a.session_id].push(a as AttendanceRow)
  }

  const report = computeSalary({
    sessions: (sessions ?? []) as Parameters<typeof computeSalary>[0]['sessions'],
    schemes: schemes ?? [],
    attendancesBySession,
    enrolledCountBySession: {},
    payments: payments ?? [],
  })

  const selectedMonth = MONTHS.find(m => m.value === month)

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Rekap Gaji</h1>

      {/* Month selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {MONTHS.map(m => (
          <Link
            key={m.value}
            href={`/tutor/salary?month=${m.value}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              month === m.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {m.label}
          </Link>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Sesi" value={String(report.totalSessions)} sub="sesi selesai" color="blue" />
        <SummaryCard label="Total Estimasi" value={formatRupiah(report.totalEarnings)} sub={selectedMonth?.label ?? ''} color="green" />
        <SummaryCard label="Sudah Dibayar" value={formatRupiah(report.paidEarnings)} sub="lunas" color="green" />
        <SummaryCard label="Belum Dibayar" value={formatRupiah(report.pendingEarnings)} sub="menunggu" color="yellow" />
      </div>

      {/* Breakdown table */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h2 className="text-sm font-semibold text-gray-700">Detail Per Sesi</h2>
        </div>
        {report.breakdown.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">
            Tidak ada sesi selesai di bulan ini.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Tanggal</th>
                <th className="text-left px-5 py-3">Kelas</th>
                <th className="text-left px-5 py-3">Topik</th>
                <th className="text-right px-5 py-3">Hadir</th>
                <th className="text-right px-5 py-3">Base</th>
                <th className="text-right px-5 py-3">Bonus</th>
                <th className="text-right px-5 py-3">Total</th>
                <th className="text-center px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.breakdown.map(item => {
                const statusInfo = item.paymentStatus
                  ? PAYMENT_STATUS[item.paymentStatus]
                  : { label: '-', color: 'bg-gray-100 text-gray-500' }
                return (
                  <tr key={item.sessionId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(item.scheduledAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short'
                      })}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{item.className}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-[150px] truncate">{item.topic ?? '-'}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{item.studentsPresent}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatRupiah(item.baseAmount)}</td>
                    <td className={`px-5 py-3 text-right font-medium ${item.bonusAmount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {item.bonusAmount > 0 ? `+${formatRupiah(item.bonusAmount)}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatRupiah(item.totalAmount)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t font-semibold text-sm">
              <tr>
                <td colSpan={6} className="px-5 py-3 text-right text-gray-600">Total:</td>
                <td className="px-5 py-3 text-right text-gray-900">{formatRupiah(report.totalEarnings)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color }: {
  label: string
  value: string
  sub: string
  color: 'blue' | 'green' | 'yellow'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1 break-all">{value}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  )
}
