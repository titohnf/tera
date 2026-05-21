import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PayslipActions from '@/components/admin/payslips/PayslipActions'
import type { PayslipRow } from '@/lib/types/database'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_LABEL: Record<string, string> = { draft: 'Draft', sent: 'Terkirim', paid: 'Dibayar' }
const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
}

export default async function PayslipDetailPage({
  params,
}: {
  params: Promise<{ payslipId: string }>
}) {
  const { payslipId } = await params
  const admin = createAdminClient()

  const { data: payslip } = await admin
    .from('payslips')
    .select('*')
    .eq('id', payslipId)
    .single() as unknown as { data: PayslipRow | null }

  if (!payslip) notFound()

  const [year, mon] = payslip.month.split('-').map(Number)
  const workMonthLabel = new Date(year, mon - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin/payslips" className="text-sm text-gray-500 hover:text-gray-700">← Slip Gaji</Link>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{payslip.payslip_number}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {payslip.tutor_name} · Gaji {workMonthLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[payslip.status]}`}>
            {STATUS_LABEL[payslip.status]}
          </span>
          <Link
            href={`/admin/payslips/${payslipId}/cetak`}
            target="_blank"
            className="text-sm border px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cetak
          </Link>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4">
          <p className="text-xs text-gray-500">Total Gaji</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatRupiah(payslip.grand_total)}</p>
        </div>
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4">
          <p className="text-xs text-gray-500">Tanggal Bayar</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{formatDate(payslip.pay_date)}</p>
        </div>
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4">
          <p className="text-xs text-gray-500">Sesi Mengajar</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{payslip.total_sessions}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4 mb-6">
        <PayslipActions payslip={payslip} />
      </div>

      {/* Breakdown per kelas */}
      {(() => {
        const byClass: Record<string, { sessionCount: number; baseTotal: number; grandTotal: number }> = {}
        for (const item of payslip.line_items) {
          if (!byClass[item.className]) byClass[item.className] = { sessionCount: 0, baseTotal: 0, grandTotal: 0 }
          byClass[item.className].sessionCount++
          byClass[item.className].baseTotal += item.baseAmount
          byClass[item.className].grandTotal += item.totalAmount
        }
        const rows = Object.entries(byClass)
        return (
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden mb-6">
            <div className="px-5 py-3 border-b">
              <h2 className="text-sm font-semibold text-gray-700">Rincian Gaji per Kelas</h2>
            </div>
            {rows.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Tidak ada sesi di bulan ini.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Nama Kelas</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Jumlah Pertemuan</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Base</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map(([className, data]) => (
                    <tr key={className} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{className}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{data.sessionCount}x</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatRupiah(data.baseTotal)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatRupiah(data.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-gray-50">
                  <tr>
                    <td className="px-5 py-2.5 text-xs font-semibold text-gray-600">Total</td>
                    <td className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600">{payslip.total_sessions}x</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700">{formatRupiah(payslip.base_total)}</td>
                    <td className="px-5 py-2.5 text-right text-xs font-bold text-gray-900">{formatRupiah(payslip.grand_total)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )
      })()}

      {/* Notes */}
      {payslip.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold text-xs text-amber-600 mb-1">Catatan Admin</p>
          {payslip.notes}
        </div>
      )}

      {/* Timeline */}
      <div className="mt-6 text-xs text-gray-400 space-y-1">
        <p>Dibuat: {formatDate(payslip.created_at)}</p>
        {payslip.sent_at && <p>Dikirim: {formatDate(payslip.sent_at)}</p>}
        {payslip.paid_at && <p>Dibayar: {formatDate(payslip.paid_at)}</p>}
        {payslip.payment_reference && <p>Referensi: {payslip.payment_reference}</p>}
      </div>
    </div>
  )
}
