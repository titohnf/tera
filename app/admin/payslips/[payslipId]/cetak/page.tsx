import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import PrintButton from '@/components/admin/invoices/PrintButton'
import { buildClassBreakdown, formatBasePerSession } from '@/lib/salary'
import type { PayslipRow } from '@/lib/types/database'

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export default async function PrintPayslipPage({
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
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { margin: 1.5cm; }
      `}</style>

      <div className="no-print flex justify-end p-4 border-b bg-gray-50">
        <PrintButton />
      </div>

      <div className="max-w-2xl mx-auto p-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-lg font-bold text-gray-900">Tera Learning Center</p>
            <p className="text-xs text-gray-600 mt-0.5">Ruko Depok Bersih Jl. Rawageni No. 9k</p>
            <p className="text-xs text-gray-600">Kel. Ratujaya, Kec. Cipayung, Kota Depok</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Telepon: 0813 1550 2949 &mdash; Email: teralearningcenter.id@gmail.com
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900 tracking-widest">SLIP GAJI</p>
            <p className="text-xs text-gray-600 mt-1 font-mono">{payslip.payslip_number}</p>
          </div>
        </div>

        <hr className="border-gray-800 border-t-2 mb-6" />

        {/* Info tutor */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Diberikan Kepada</p>
            <p className="text-sm font-semibold text-gray-900">{payslip.tutor_name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Periode Gaji</p>
            <p className="text-sm font-semibold text-gray-900">{workMonthLabel}</p>
            <p className="text-xs text-gray-500 mt-1">Tanggal Bayar: {formatDate(payslip.pay_date)}</p>
          </div>
        </div>

        {/* Breakdown table per kelas */}
        {(() => {
          const rows = buildClassBreakdown(payslip.line_items)
          return (
            <table className="w-full border-collapse text-sm mb-2">
              <thead>
                <tr className="border border-gray-800 bg-gray-50">
                  <th className="text-left px-3 py-2 text-xs font-bold text-gray-900 border-r border-gray-800">
                    Nama Kelas
                  </th>
                  <th className="text-center px-3 py-2 text-xs font-bold text-gray-900 border-r border-gray-800 w-32">
                    Jumlah Pertemuan
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-gray-900 border-r border-gray-800 w-32">
                    Base / Pertemuan
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-gray-900 w-32">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.className} className="border-l border-r border-b border-gray-800">
                    <td className="px-3 py-2 font-medium text-gray-900 border-r border-gray-800">{row.className}</td>
                    <td className="px-3 py-2 text-center text-gray-800 border-r border-gray-800">{row.sessionCount}x</td>
                    <td className="px-3 py-2 text-right text-gray-800 border-r border-gray-800">
                      {formatBasePerSession(row, formatRupiah)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">{formatRupiah(row.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border border-gray-800 bg-gray-50">
                  <td className="px-3 py-2 font-bold text-gray-900 border-r border-gray-800" colSpan={3}>
                    Total Gaji {workMonthLabel}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900">
                    {formatRupiah(payslip.grand_total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )
        })()}

        {payslip.bonus_total > 0 && (
          <p className="text-xs text-gray-500 mb-6">
            *Termasuk bonus mengajar {formatRupiah(payslip.bonus_total)}
          </p>
        )}

        {payslip.notes && (
          <div className="border border-gray-300 rounded p-3 mb-6 text-sm text-gray-700">
            <p className="font-semibold text-xs text-gray-500 mb-1">Catatan</p>
            {payslip.notes}
          </div>
        )}

        {/* Signature */}
        <div className="grid grid-cols-2 gap-8 mt-10">
          <div className="text-sm text-center">
            <p className="text-gray-600 mb-1">
              Diterima, Depok, {formatDate(payslip.pay_date)}
            </p>
            <p className="font-semibold text-gray-900">Tutor</p>
            <div className="h-16"></div>
            <p className="text-gray-900">{payslip.tutor_name}</p>
          </div>
          <div className="text-sm text-center">
            <p className="text-gray-600 mb-1">&nbsp;</p>
            <p className="font-semibold text-gray-900">Pimpinan Tera Learning Center</p>
            <div className="h-16"></div>
            <p className="text-gray-900">Suci Purnama Sari, M.Si.</p>
          </div>
        </div>
      </div>
    </>
  )
}
