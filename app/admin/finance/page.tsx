import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import MonthSelect from '@/components/admin/attendance/MonthSelect'

type PaymentRow = {
  id: string
  total_amount: number
  base_amount: number
  bonus_amount: number
  status: string
  sessions: { scheduled_at: string; classes: { name: string; base_price_per_session: number } | null } | null
  profiles: { full_name: string } | null
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  const now = new Date()
  const selectedMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, mon] = selectedMonth.split('-').map(Number)
  const monthStart = new Date(year, mon - 1, 1).toISOString()
  const monthEnd = new Date(year, mon, 1).toISOString()

  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    }
  })

  const admin = createAdminClient()

  // Fetch payments for sessions in this month
  const { data: payments } = await admin
    .from('session_payments')
    .select(`
      id, total_amount, base_amount, bonus_amount, status,
      sessions!inner(scheduled_at, classes(name, base_price_per_session)),
      profiles!tutor_id(full_name)
    `)
    .gte('sessions.scheduled_at', monthStart)
    .lt('sessions.scheduled_at', monthEnd) as unknown as { data: PaymentRow[] | null }

  // Fetch attendances to estimate student income
  const { data: sessions } = await admin
    .from('sessions')
    .select('id, class_id, classes(base_price_per_session)')
    .eq('status', 'completed')
    .gte('scheduled_at', monthStart)
    .lt('scheduled_at', monthEnd) as unknown as { data: { id: string; class_id: string; classes: { base_price_per_session: number } | null }[] | null }

  const sessionIds = (sessions ?? []).map(s => s.id)
  let attendanceCount = 0
  let estimatedIncome = 0

  if (sessionIds.length > 0) {
    const { data: atts } = await admin
      .from('attendances')
      .select('session_id, status')
      .in('session_id', sessionIds)
      .in('status', ['present', 'late'])

    const priceBySession = Object.fromEntries(
      (sessions ?? []).map(s => [s.id, s.classes?.base_price_per_session ?? 0])
    )

    for (const a of atts ?? []) {
      attendanceCount++
      estimatedIncome += priceBySession[a.session_id] ?? 0
    }
  }

  // Aggregate payment data
  const allPayments = payments ?? []
  const totalPaid = allPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.total_amount, 0)
  const totalPending = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.total_amount, 0)
  const totalExpense = totalPaid + totalPending

  // Group by tutor
  const byTutor: Record<string, { name: string; payments: PaymentRow[] }> = {}
  for (const p of allPayments) {
    const name = p.profiles?.full_name ?? 'Unknown'
    if (!byTutor[name]) byTutor[name] = { name, payments: [] }
    byTutor[name].payments.push(p)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Ringkasan Keuangan</h1>
        <p className="text-sm text-gray-500 mt-1">Rekap pendapatan dan pengeluaran per bulan.</p>
      </div>

      <div className="mb-6">
        <MonthSelect options={monthOptions} value={selectedMonth} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 rounded-xl p-5">
          <p className="text-xs font-medium text-green-700 mb-1">Estimasi Pendapatan SPP</p>
          <p className="text-2xl font-bold text-green-700">{formatRupiah(estimatedIncome)}</p>
          <p className="text-xs text-green-600 mt-1">{attendanceCount} kehadiran siswa · {monthLabel}</p>
          <p className="text-xs text-green-500 mt-0.5">Berdasarkan harga per sesi × siswa hadir</p>
        </div>
        <div className="bg-red-50 rounded-xl p-5">
          <p className="text-xs font-medium text-red-700 mb-1">Total Gaji Tutor</p>
          <p className="text-2xl font-bold text-red-700">{formatRupiah(totalExpense)}</p>
          <p className="text-xs text-red-600 mt-1">{allPayments.length} tagihan · {monthLabel}</p>
          <div className="flex gap-3 mt-1">
            <span className="text-xs text-red-500">Lunas: {formatRupiah(totalPaid)}</span>
            <span className="text-xs text-orange-500">Pending: {formatRupiah(totalPending)}</span>
          </div>
        </div>
        <div className={`rounded-xl p-5 col-span-2 ${estimatedIncome - totalExpense >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <p className={`text-xs font-medium mb-1 ${estimatedIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            Selisih (Estimasi)
          </p>
          <p className={`text-2xl font-bold ${estimatedIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatRupiah(estimatedIncome - totalExpense)}
          </p>
          <p className={`text-xs mt-1 ${estimatedIncome - totalExpense >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
            Pendapatan − Gaji Tutor
          </p>
        </div>
      </div>

      {/* Per-tutor breakdown */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Rincian Gaji per Tutor</h2>
      {Object.keys(byTutor).length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Tidak ada data pembayaran di bulan ini.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Tutor</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Sesi</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-green-600">Lunas</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-orange-500">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.values(byTutor).map(({ name, payments: tutorPayments }) => {
                const paid = tutorPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.total_amount, 0)
                const pending = tutorPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.total_amount, 0)
                return (
                  <tr key={name} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{name}</td>
                    <td className="text-center px-4 py-3 text-gray-600">{tutorPayments.length}</td>
                    <td className="text-right px-4 py-3 font-semibold text-gray-800">{formatRupiah(paid + pending)}</td>
                    <td className="text-right px-4 py-3 text-green-600">{formatRupiah(paid)}</td>
                    <td className="text-right px-5 py-3 text-orange-500">{formatRupiah(pending)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td className="px-5 py-3 text-xs font-semibold text-gray-600">Total</td>
                <td className="text-center px-4 py-3 text-xs font-semibold text-gray-600">{allPayments.length}</td>
                <td className="text-right px-4 py-3 text-xs font-semibold text-gray-800">{formatRupiah(totalExpense)}</td>
                <td className="text-right px-4 py-3 text-xs font-semibold text-green-600">{formatRupiah(totalPaid)}</td>
                <td className="text-right px-5 py-3 text-xs font-semibold text-orange-500">{formatRupiah(totalPending)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="mt-4 text-right">
        <Link href="/admin/payments" className="text-xs text-blue-600 hover:underline">
          Kelola pembayaran tutor →
        </Link>
      </div>
    </div>
  )
}
