import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'

type PaymentRow = {
  id: string
  base_amount: number
  bonus_amount: number
  total_amount: number
  status: string
  paid_at: string | null
  payment_reference: string | null
  created_at: string
  sessions: {
    scheduled_at: string
    topic: string | null
    classes: { name: string } | null
  } | null
  profiles: { full_name: string } | null
}

const STATUS_TABS = [
  { key: '', label: 'Semua' },
  { key: 'pending', label: 'Belum Dibayar' },
  { key: 'paid', label: 'Sudah Dibayar' },
  { key: 'cancelled', label: 'Dibatalkan' },
]

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Belum Dibayar',
  paid: 'Dibayar',
  cancelled: 'Dibatalkan',
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = '' } = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('session_payments')
    .select('id, base_amount, bonus_amount, total_amount, status, paid_at, payment_reference, created_at, sessions(scheduled_at, topic, classes(name)), profiles!tutor_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)

  const [{ data: payments }, { data: pendingSummary }] = await Promise.all([
    query as unknown as Promise<{ data: PaymentRow[] | null }>,
    admin.from('session_payments').select('total_amount').eq('status', 'pending'),
  ])

  const totalPending = (pendingSummary ?? []).reduce((sum, p) => sum + p.total_amount, 0)
  const pendingCount = pendingSummary?.length ?? 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Keuangan — Pembayaran Tutor</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola pembayaran gaji tutor per sesi mengajar.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-sm text-amber-600 font-medium">Tagihan Pending</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{formatRp(totalPending)}</p>
          <p className="text-sm text-amber-500 mt-0.5">{pendingCount} sesi belum dibayar</p>
        </div>
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4 col-span-2 flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Konfirmasi semua tagihan pending setelah transfer dilakukan. Masukkan no. referensi transfer di halaman detail pembayaran.
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_TABS.map(tab => (
          <Link
            key={tab.key}
            href={`/admin/payments?status=${tab.key}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === tab.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </Link>
        ))}
      </div>

      {!payments || payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
          Tidak ada pembayaran ditemukan.
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(p => {
            const sessionDate = p.sessions?.scheduled_at ? new Date(p.sessions.scheduled_at) : null
            return (
              <Link
                key={p.id}
                href={`/admin/payments/${p.id}`}
                className="flex items-center justify-between bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4 hover:bg-blue-50/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {p.profiles?.full_name ?? 'Tutor'}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {p.sessions?.classes?.name ?? '-'}
                    {sessionDate ? ` · ${sessionDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    {p.sessions?.topic ? ` · ${p.sessions.topic}` : ''}
                  </p>
                  {p.payment_reference && (
                    <p className="text-sm text-gray-400 mt-0.5">Ref: {p.payment_reference}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{formatRp(p.total_amount)}</p>
                    {p.bonus_amount > 0 && (
                      <p className="text-sm text-green-600">+{formatRp(p.bonus_amount)} bonus</p>
                    )}
                  </div>
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

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}
