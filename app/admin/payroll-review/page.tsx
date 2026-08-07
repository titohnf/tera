import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server-admin'
import MetricCard from '@/components/dashboard/MetricCard'
import PayrollReviewFilters from '@/components/admin/payroll/PayrollReviewFilters'
import PayrollReviewTable, { type PayrollReviewGroup } from '@/components/admin/payroll/PayrollReviewTable'

type SessionRow = {
  id: string
  scheduled_at: string
  duration_minutes: number | null
  topic: string | null
  tutor_id: string | null
  payroll_status: string
  payroll_rejection_reason: string | null
  payroll_tutor_note: string | null
  classes: { id: string; name: string } | null
  profiles: { id: string; full_name: string } | null
}

export default async function PayrollReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string }>
}) {
  const { month, status } = await searchParams
  const now = new Date()
  const selectedMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  // Tanpa parameter status, admin langsung melihat antrean yang perlu dikerjakan.
  const selectedStatus = status === undefined ? 'pending' : status

  const [year, mon] = selectedMonth.split('-').map(Number)
  const monthStart = new Date(year, mon - 1, 1).toISOString()
  const monthEnd = new Date(year, mon, 1).toISOString()
  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    }
  })

  const admin = createAdminClient()
  const { data: sessions } = await admin
    .from('sessions')
    .select('id, scheduled_at, duration_minutes, topic, tutor_id, payroll_status, payroll_rejection_reason, payroll_tutor_note, classes(id, name), profiles!tutor_id(id, full_name)')
    .eq('status', 'completed')
    .gte('scheduled_at', monthStart)
    .lt('scheduled_at', monthEnd)
    .order('scheduled_at', { ascending: true }) as unknown as { data: SessionRow[] | null }

  const allSessions = sessions ?? []
  const counts = {
    total: allSessions.length,
    pending: allSessions.filter(s => s.payroll_status === 'pending').length,
    approved: allSessions.filter(s => s.payroll_status === 'approved').length,
    rejected: allSessions.filter(s => s.payroll_status === 'rejected').length,
  }

  const visible = selectedStatus
    ? allSessions.filter(s => s.payroll_status === selectedStatus)
    : allSessions

  const groupMap = new Map<string, PayrollReviewGroup>()
  for (const s of visible) {
    const tutorId = s.profiles?.id ?? s.tutor_id
    if (!tutorId) continue
    if (!groupMap.has(tutorId)) {
      groupMap.set(tutorId, {
        tutorId,
        tutorName: s.profiles?.full_name ?? 'Tutor tanpa nama',
        sessions: [],
      })
    }
    groupMap.get(tutorId)!.sessions.push({
      id: s.id,
      scheduled_at: s.scheduled_at,
      duration_minutes: s.duration_minutes,
      topic: s.topic,
      classId: s.classes?.id ?? null,
      className: s.classes?.name ?? 'Kelas',
      payrollStatus: s.payroll_status,
      rejectionReason: s.payroll_rejection_reason,
      tutorNote: s.payroll_tutor_note,
    })
  }
  const groups = [...groupMap.values()].sort((a, b) => a.tutorName.localeCompare(b.tutorName, 'id'))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Review Gaji Sesi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sesi terlaksana {monthLabel} — hanya sesi yang disetujui yang masuk hitungan slip gaji.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PayrollReviewFilters monthOptions={monthOptions} month={selectedMonth} status={selectedStatus} />
          <Link
            href={`/admin/payslips/generate?month=${selectedMonth}`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Buat Slip Gaji
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Sesi Terlaksana" value={counts.total} />
        <MetricCard label="Menunggu Review" value={counts.pending} valueColor="text-yellow-600" />
        <MetricCard label="Disetujui" value={counts.approved} valueColor="text-green-600" />
        <MetricCard label="Ditolak" value={counts.rejected} valueColor="text-red-600" />
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 py-16">
          <p className="text-sm text-gray-400 text-center">
            {counts.total === 0
              ? `Belum ada sesi terlaksana di ${monthLabel}.`
              : 'Tidak ada sesi dengan status ini.'}
          </p>
        </div>
      ) : (
        <PayrollReviewTable groups={groups} />
      )}
    </div>
  )
}
