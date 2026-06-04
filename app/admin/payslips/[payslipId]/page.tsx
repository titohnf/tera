import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PayslipActions from '@/components/admin/payslips/PayslipActions'
import MetricCard from '@/components/dashboard/MetricCard'
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
  sent:  'bg-blue-100 text-blue-700',
  paid:  'bg-green-100 text-green-700',
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

  // Breakdown per kelas
  const byClass: Record<string, { sessionCount: number; baseTotal: number; grandTotal: number }> = {}
  for (const item of payslip.line_items) {
    if (!byClass[item.className]) byClass[item.className] = { sessionCount: 0, baseTotal: 0, grandTotal: 0 }
    byClass[item.className].sessionCount++
    byClass[item.className].baseTotal += item.baseAmount
    byClass[item.className].grandTotal += item.totalAmount
  }
  const classRows = Object.entries(byClass)

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/payslips" className="hover:text-blue-600">Slip Gaji</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{payslip.payslip_number}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-semibold text-gray-900">{payslip.payslip_number}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[payslip.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABEL[payslip.status] ?? payslip.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {payslip.tutor_name} · Gaji {workMonthLabel}
            </p>
          </div>
          <Link
            href={`/admin/payslips/${payslipId}/cetak`}
            target="_blank"
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak
          </Link>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <MetricCard label="Total Gaji" value={formatRupiah(payslip.grand_total)} />
          <MetricCard label="Sesi Mengajar" value={payslip.total_sessions} sub={`bulan ${workMonthLabel}`} />
          <MetricCard label="Tanggal Bayar" value={formatDate(payslip.pay_date)} />
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <PayslipActions payslip={payslip} />
      </div>

      {/* Breakdown per kelas */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Rincian per Kelas</h2>
        </div>

        {classRows.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8 px-5">Tidak ada sesi di bulan ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="pl-5 pr-4 py-3 text-left">Nama Kelas</th>
                  <th className="px-4 py-3 text-center">Pertemuan</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Base</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classRows.map(([className, data]) => (
                  <tr key={className} className="hover:bg-slate-50 transition-colors">
                    <td className="pl-5 pr-4 py-3 font-medium text-gray-900">{className}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{data.sessionCount}x</td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">{formatRupiah(data.baseTotal)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatRupiah(data.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-100 bg-slate-50">
                <tr>
                  <td className="pl-5 pr-4 py-3 text-sm font-semibold text-gray-600">Total</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-gray-600">{payslip.total_sessions}x</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600 hidden sm:table-cell">{formatRupiah(payslip.base_total)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{formatRupiah(payslip.grand_total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      {payslip.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Catatan Admin</p>
          <p className="text-sm text-amber-800">{payslip.notes}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Riwayat</p>
        <div className="space-y-1.5 text-sm text-gray-500">
          <p>Dibuat: <span className="text-gray-700">{formatDate(payslip.created_at)}</span></p>
          {payslip.sent_at && <p>Dikirim: <span className="text-gray-700">{formatDate(payslip.sent_at)}</span></p>}
          {payslip.paid_at && <p>Dibayar: <span className="text-gray-700">{formatDate(payslip.paid_at)}</span></p>}
          {payslip.payment_reference && <p>Referensi: <span className="font-mono text-gray-700">{payslip.payment_reference}</span></p>}
        </div>
      </div>
    </div>
  )
}
