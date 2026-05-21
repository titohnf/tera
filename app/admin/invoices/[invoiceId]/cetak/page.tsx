import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import PrintButton from '@/components/admin/invoices/PrintButton'

type LineItem = {
  description: string
  months: number
  amount: number
  is_deduction: boolean
}

type InvoiceRow = {
  id: string
  invoice_number: string
  student_name: string
  parent_name: string
  line_items: LineItem[]
  total_due: number
  payment_method: string
  bank_account: string
  due_date: string | null
  issued_at: string
  status: string
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export default async function PrintInvoicePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>
}) {
  const { invoiceId } = await params
  const admin = createAdminClient()

  const { data: invoice } = await admin
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single() as unknown as { data: InvoiceRow | null }

  if (!invoice) notFound()

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { margin: 1cm; }
      `}</style>

      <div className="no-print flex justify-end p-4 border-b bg-gray-50">
        <PrintButton />
      </div>

      <div className="max-w-2xl mx-auto p-12">
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
            <p className="text-xl font-bold text-gray-900 tracking-widest">INVOICE</p>
            <p className="text-xs text-gray-600 mt-1 font-mono">{invoice.invoice_number}</p>
          </div>
        </div>

        <hr className="border-gray-800 border-t-2 mb-6" />

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tagihan Dari</p>
            <p className="text-sm font-semibold text-gray-900">Tera Learning Center</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Untuk</p>
            <p className="text-xs text-gray-500">Nama Siswa :</p>
            <p className="text-sm font-semibold text-gray-900">{invoice.student_name}</p>
            <p className="text-xs text-gray-500 mt-1">Nama Orang Tua :</p>
            <p className="text-sm text-gray-900">{invoice.parent_name}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm mb-8">
          <thead>
            <tr className="border border-gray-800">
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-900 border-r border-gray-800 bg-gray-50">
                Rincian Pembayaran
              </th>
              <th className="text-center px-3 py-2 text-xs font-bold text-gray-900 border-r border-gray-800 w-16 bg-gray-50">
                Bulan
              </th>
              <th className="text-right px-3 py-2 text-xs font-bold text-gray-900 border-r border-gray-800 w-32 bg-gray-50">
                Biaya/Bulan
              </th>
              <th className="text-right px-3 py-2 text-xs font-bold text-gray-900 w-36 bg-gray-50">
                Total Harga
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((item, i) => {
              const subtotal = item.months === 0 ? item.amount : item.months * item.amount
              return (
                <tr key={i} className="border-l border-r border-b border-gray-800">
                  {item.months === 0 ? (
                    <td className="px-3 py-2 text-gray-800 border-r border-gray-800" colSpan={3}>
                      {item.description}
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-gray-800 border-r border-gray-800">{item.description}</td>
                      <td className="px-3 py-2 text-center text-gray-800 border-r border-gray-800">{item.months}</td>
                      <td className="px-3 py-2 text-right text-gray-800 border-r border-gray-800">{formatRupiah(item.amount)}</td>
                    </>
                  )}
                  <td className="px-3 py-2 text-right text-gray-800">
                    {item.is_deduction ? `(${formatRupiah(subtotal)})` : formatRupiah(subtotal)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border border-gray-800 bg-gray-50">
              <td className="px-3 py-2 font-bold text-gray-900 border-r border-gray-800" colSpan={3}>
                Total Tagihan
              </td>
              <td className="px-3 py-2 text-right font-bold text-gray-900">
                {formatRupiah(invoice.total_due)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mb-10 text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-semibold">Metode Pembayaran</span> : {invoice.payment_method}
          </p>
          <p>
            <span className="font-semibold">Rekening</span> : {invoice.bank_account}
          </p>
          {invoice.due_date && (
            <p>
              <span className="font-semibold">Batas Pembayaran</span> : {formatDate(invoice.due_date)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8 mt-8">
          <div className="text-sm text-center">
            <p className="text-gray-600 mb-1">
              Mengetahui, Depok, {formatDate(invoice.issued_at)}
            </p>
            <p className="font-semibold text-gray-900">Orang Tua Siswa</p>
            <div className="h-16"></div>
            <p className="text-gray-900">{invoice.parent_name}</p>
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
