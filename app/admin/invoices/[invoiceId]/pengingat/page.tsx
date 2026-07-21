import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PrintButton from '@/components/admin/invoices/PrintButton'

type LineItem = {
  description: string
  is_deduction: boolean
}

type InvoiceRow = {
  id: string
  invoice_number: string
  student_name: string
  parent_name: string
  line_items: LineItem[]
  total_due: number
  due_date: string | null
  issued_at: string
}

type PaymentRow = {
  id: string
  amount: number
  paid_at: string
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export async function generateMetadata({
  params,
}: {
  params: Promise<{ invoiceId: string }>
}): Promise<Metadata> {
  const { invoiceId } = await params
  const admin = createAdminClient()
  const { data: invoice } = await admin
    .from('invoices')
    .select('invoice_number')
    .eq('id', invoiceId)
    .single() as unknown as { data: { invoice_number: string } | null }

  return { title: invoice ? `Pengingat - ${invoice.invoice_number}` : 'Pengingat Tagihan' }
}

export default async function PengingatPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { invoiceId } = await params
  const { preview } = await searchParams
  const isPreview = preview === '1'
  const admin = createAdminClient()

  const [invoiceRes, paymentsRes] = await Promise.all([
    admin
      .from('invoices')
      .select('id, invoice_number, student_name, parent_name, line_items, total_due, due_date, issued_at')
      .eq('id', invoiceId)
      .single() as unknown as Promise<{ data: InvoiceRow | null }>,
    admin
      .from('invoice_payments')
      .select('id, amount, paid_at')
      .eq('invoice_id', invoiceId)
      .order('paid_at', { ascending: true }) as unknown as Promise<{ data: PaymentRow[] | null }>,
  ])

  if (!invoiceRes.data) notFound()

  const invoice = invoiceRes.data
  const payments = paymentsRes.data ?? []
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const sisaTagihan = Math.max(0, invoice.total_due - totalPaid)
  const chargeDescription = invoice.line_items.find(i => !i.is_deduction)?.description ?? ''

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { margin: 1cm; }
        body { background: white; }
      `}</style>

      {!isPreview && (
        <div className="no-print flex justify-end p-4 border-b bg-gray-50">
          <PrintButton />
        </div>
      )}

      <div className="max-w-2xl mx-auto p-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold text-gray-900">Bimbel Tera</p>
            <p className="text-xs text-gray-600 mt-0.5">Jl. Rawageni No. 9k, Kel. Ratujaya, Kec. Cipayung, Kota Depok</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Telepon: 0813 1550 2949 &middot; Email: teralearningcenter.id@gmail.com
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-tera.png" alt="Tera Bimbel" className="h-10 w-auto" />
        </div>

        <hr className="border-gray-300 mb-4" />

        <div className="text-center mb-6">
          <p className="text-xl font-bold text-gray-900 tracking-widest">PEMBERITAHUAN TAGIHAN</p>
          <p className="text-xs text-gray-600 mt-1 font-mono">Referensi Invoice: {invoice.invoice_number}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Kepada</p>
            <p className="text-xs text-gray-500">Nama Siswa :</p>
            <p className="text-sm font-semibold text-gray-900">{invoice.student_name}</p>
            <p className="text-xs text-gray-500 mt-1">Nama Orang Tua :</p>
            <p className="text-sm font-semibold text-gray-900">{invoice.parent_name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tanggal Invoice Awal</p>
            <p className="text-sm font-semibold text-gray-900">{formatDate(invoice.issued_at)}</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-6">
          Berikut kami sampaikan status tagihan untuk <span className="font-medium">{chargeDescription}</span>. Mohon dapat ditindaklanjuti sesuai sisa tagihan di bawah ini.
        </p>

        <table className="w-full border-collapse text-sm mb-2">
          <tbody>
            <tr className="border border-gray-300">
              <td className="px-3 py-2 text-gray-600 border-r border-gray-300 bg-gray-50 w-56">Total Tagihan (Invoice {invoice.invoice_number})</td>
              <td className="px-3 py-2 text-right font-medium text-gray-900">{formatRupiah(invoice.total_due)}</td>
            </tr>
            <tr className="border-l border-r border-b border-gray-300">
              <td className="px-3 py-2 text-gray-600 border-r border-gray-300 bg-gray-50">Sudah Dibayar</td>
              <td className="px-3 py-2 text-right font-medium text-gray-900">{formatRupiah(totalPaid)}</td>
            </tr>
            <tr className="border-l border-r border-b border-gray-300 bg-gray-50">
              <td className="px-3 py-2 text-gray-900 font-semibold border-r border-gray-300">Sisa Tagihan</td>
              <td className="px-3 py-2 text-right font-bold text-gray-900">{formatRupiah(sisaTagihan)}</td>
            </tr>
          </tbody>
        </table>

        {payments.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 mt-6">Riwayat Pembayaran</p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border border-gray-300">
                  <th className="text-left px-3 py-1.5 text-xs font-bold text-gray-900 border-r border-gray-300 bg-gray-50 w-20">Tahap</th>
                  <th className="text-left px-3 py-1.5 text-xs font-bold text-gray-900 border-r border-gray-300 bg-gray-50">Tanggal</th>
                  <th className="text-right px-3 py-1.5 text-xs font-bold text-gray-900 bg-gray-50">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr key={p.id} className="border-l border-r border-b border-gray-300">
                    <td className="px-3 py-1.5 text-gray-800 border-r border-gray-300">{idx + 1}</td>
                    <td className="px-3 py-1.5 text-gray-800 border-r border-gray-300">{formatDate(p.paid_at)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-800">{formatRupiah(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-8">
          <div className="text-sm text-center">
            <p className="text-gray-600 mb-1">
              Depok, {formatDate(new Date().toISOString())}
            </p>
            <p className="font-semibold text-gray-900">Pimpinan Bimbel Tera</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ttd-stempel.png" alt="Tanda tangan dan stempel" className="h-24 w-auto mx-auto" />
            <p className="font-semibold text-gray-900">Suci Purnama Sari, M.Si.</p>
          </div>
        </div>
      </div>
    </>
  )
}
