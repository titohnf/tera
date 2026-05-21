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
  issued_at: string
}

function terbilang(n: number): string {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima',
    'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']
  if (n < 12) return satuan[n]
  if (n < 20) return satuan[n - 10] + ' belas'
  if (n < 100) {
    const t = Math.floor(n / 10)
    return satuan[t] + ' puluh' + (n % 10 ? ' ' + terbilang(n % 10) : '')
  }
  if (n < 200) return 'seratus' + (n % 100 ? ' ' + terbilang(n % 100) : '')
  if (n < 1_000) return satuan[Math.floor(n / 100)] + ' ratus' + (n % 100 ? ' ' + terbilang(n % 100) : '')
  if (n < 2_000) return 'seribu' + (n % 1_000 ? ' ' + terbilang(n % 1_000) : '')
  if (n < 1_000_000) return terbilang(Math.floor(n / 1_000)) + ' ribu' + (n % 1_000 ? ' ' + terbilang(n % 1_000) : '')
  if (n < 1_000_000_000) return terbilang(Math.floor(n / 1_000_000)) + ' juta' + (n % 1_000_000 ? ' ' + terbilang(n % 1_000_000) : '')
  return terbilang(Math.floor(n / 1_000_000_000)) + ' miliar' + (n % 1_000_000_000 ? ' ' + terbilang(n % 1_000_000_000) : '')
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export default async function KuitansiPage({
  params,
}: {
  params: Promise<{ invoiceId: string; item: string }>
}) {
  const { invoiceId, item } = await params
  const itemIndex = Number(item)

  const admin = createAdminClient()
  const { data: invoice } = await admin
    .from('invoices')
    .select('id, invoice_number, student_name, parent_name, line_items, issued_at')
    .eq('id', invoiceId)
    .single() as unknown as { data: InvoiceRow | null }

  if (!invoice) notFound()

  const lineItems = invoice.line_items ?? []
  const deductionItem = lineItems[itemIndex]

  if (!deductionItem || !deductionItem.is_deduction || deductionItem.months !== 0) notFound()

  // Extract tahap number from description e.g. "Pembayaran Tahap 1 (1 Mei 2026)"
  const tahapMatch = deductionItem.description.match(/Tahap\s+(\d+)/i)
  const tahapNumber = tahapMatch ? tahapMatch[1] : String(itemIndex)

  // Charge line items for description
  const chargeItems = lineItems.filter(it => !it.is_deduction)
  const chargeDescription = chargeItems.map(it => it.description).join(', ')

  // Kuitansi number: replace INVOICE with KUITANSI in invoice number
  const kuitansiNumber = invoice.invoice_number
    .replace(/INVOICE/gi, 'KUITANSI')
    .replace(/(\d+)\s*\/\s*(\d+)\s*\//, `${tahapNumber.padStart(2, '0')} / $2 /`)

  const paymentAmount = deductionItem.amount

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { size: A4; margin: 1.5cm; }
      `}</style>

      <div className="no-print flex justify-end p-4 border-b bg-gray-50">
        <PrintButton />
      </div>

      <div className="max-w-2xl mx-auto p-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-base font-bold text-gray-900">Tera Learning Center</p>
            <p className="text-xs text-gray-600 mt-0.5">Ruko Depok Bersih Jl. Rawageni No. 9k</p>
            <p className="text-xs text-gray-600">Kel. Ratujaya, Kec. Cipayung, Kota Depok</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Telepon: 0813 1550 2949 &mdash; Email: teralearningcenter.id@gmail.com
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tracking-widest text-teal-600">TLC</p>
            <p className="text-xs text-gray-500">Tera Learning Center</p>
          </div>
        </div>

        <hr className="border-gray-800 border-t-2 mb-6" />

        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-lg font-bold text-gray-900 tracking-widest">KUITANSI</p>
          <p className="text-sm text-gray-600 mt-1 font-mono">{kuitansiNumber}</p>
        </div>

        {/* Info fields */}
        <table className="w-full text-sm mb-8">
          <tbody>
            <tr>
              <td className="py-1.5 text-gray-600 w-44">Telah Terima Dari</td>
              <td className="py-1.5 text-gray-600 w-4">:</td>
              <td className="py-1.5 font-medium text-gray-900">{invoice.parent_name}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-gray-600">Orang Tua Dari</td>
              <td className="py-1.5 text-gray-600">:</td>
              <td className="py-1.5 font-medium text-gray-900">{invoice.student_name}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-gray-600">Untuk Pembayaran</td>
              <td className="py-1.5 text-gray-600">:</td>
              <td className="py-1.5 font-medium text-gray-900">{chargeDescription}</td>
            </tr>
          </tbody>
        </table>

        {/* Payment table */}
        <table className="w-full border-collapse text-sm mb-2">
          <thead>
            <tr className="border border-gray-800">
              <th className="text-left px-3 py-2 text-xs font-bold text-gray-900 border-r border-gray-800 bg-gray-50">
                Rincian Pembayaran
              </th>
              <th className="text-center px-3 py-2 text-xs font-bold text-gray-900 border-r border-gray-800 w-20 bg-gray-50">
                Tahap
              </th>
              <th className="text-right px-3 py-2 text-xs font-bold text-gray-900 w-40 bg-gray-50">
                Uang Sejumlah
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-l border-r border-b border-gray-800">
              <td className="px-3 py-2 text-gray-800 border-r border-gray-800">{chargeDescription}</td>
              <td className="px-3 py-2 text-center text-gray-800 border-r border-gray-800">{tahapNumber}</td>
              <td className="px-3 py-2 text-right text-gray-800 font-medium">
                Rp{new Intl.NumberFormat('id-ID').format(paymentAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Terbilang */}
        <div className="border border-t-0 border-gray-800 px-3 py-2 text-right text-sm mb-10">
          <span className="text-gray-600">Terbilang: </span>
          <span className="font-bold italic text-gray-900">
            {capitalize(terbilang(paymentAmount))} Rupiah
          </span>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8">
          <div className="text-sm text-center">
            <p className="text-gray-600 mb-1">Mengetahui,</p>
            <p className="font-semibold text-gray-900">Orang Tua Siswa</p>
            <div className="h-16"></div>
            <p className="text-gray-900">{invoice.parent_name}</p>
          </div>
          <div className="text-sm text-center">
            <p className="text-gray-600 mb-1">Depok, {formatDate(invoice.issued_at)}</p>
            <p className="font-semibold text-gray-900">Pimpinan Tera Learning Center</p>
            <div className="h-16"></div>
            <p className="text-gray-900">Suci Purnama Sari, M.Si.</p>
          </div>
        </div>
      </div>
    </>
  )
}
