import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import Link from 'next/link'
import type { PayslipRow } from '@/lib/types/database'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_LABEL: Record<string, string> = { sent: 'Menunggu Pembayaran', paid: 'Dibayar' }
const STATUS_COLOR: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
}

export default async function TutorPayslipsPage() {
  const user = await getUser()
  if (!user) return null

  const supabase = createAdminClient()
  const { data: payslips } = await supabase
    .from('payslips')
    .select('*')
    .eq('tutor_id', user.id)
    .in('status', ['sent', 'paid'])
    .eq('is_deleted', false)
    .order('month', { ascending: false }) as unknown as { data: PayslipRow[] | null }

  const list = payslips ?? []
  const totalPaid = list.filter(p => p.status === 'paid').reduce((s, p) => s + p.grand_total, 0)
  const totalPending = list.filter(p => p.status === 'sent').reduce((s, p) => s + p.grand_total, 0)

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Slip Gaji</h1>
      <p className="text-sm text-gray-500 mb-6">Rincian gaji yang telah dikirim oleh admin.</p>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs font-medium text-green-600">Sudah Dibayar</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatRupiah(totalPaid)}</p>
          <p className="text-xs text-green-500 mt-0.5">{list.filter(p => p.status === 'paid').length} slip</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-medium text-blue-600">Menunggu Pembayaran</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{formatRupiah(totalPending)}</p>
          <p className="text-xs text-blue-500 mt-0.5">{list.filter(p => p.status === 'sent').length} slip</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-12 text-center text-sm text-gray-500">
          Belum ada slip gaji yang dikirimkan admin.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(p => {
            const [year, mon] = p.month.split('-').map(Number)
            const workMonthLabel = new Date(year, mon - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
            return (
              <div key={p.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 flex items-center justify-between hover:bg-blue-50/50 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-gray-900">{workMonthLabel}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {p.total_sessions} sesi · Tanggal bayar: {formatDate(p.pay_date)}
                  </p>
                  <p className="font-mono text-xs text-gray-400 mt-0.5">{p.payslip_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">{formatRupiah(p.grand_total)}</p>
                  {p.bonus_total > 0 && (
                    <p className="text-xs text-green-600">termasuk bonus {formatRupiah(p.bonus_total)}</p>
                  )}
                  <Link
                    href={`/tutor/payslips/${p.id}`}
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Lihat detail →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
