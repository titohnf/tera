export const runtime = 'nodejs'

import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

const logoPath = path.join(process.cwd(), 'public', 'logo-tera.png')
const signaturePath = path.join(process.cwd(), 'public', 'ttd-stempel.png')

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
  issued_at: string
}

type PaymentRow = {
  id: string
  amount: number
  paid_at: string
}

Font.register({ family: 'Helvetica', fonts: [] })

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#111', padding: '2.9cm' },
  bold: { fontFamily: 'Helvetica-Bold' },
  label: { fontSize: 7, color: '#888', textTransform: 'uppercase', marginBottom: 3 },
  divider: { borderBottomWidth: 0.75, borderBottomColor: '#999', marginBottom: 10, marginTop: 4 },
  titleBlock: { alignItems: 'center', marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', borderWidth: 0.75, borderColor: '#999' },
  summaryLabel: { flex: 1, padding: 6, color: '#555', borderRightWidth: 0.75, borderRightColor: '#999', backgroundColor: '#f5f5f5' },
  summaryValue: { width: 130, padding: 6, textAlign: 'right' },
  tableHeader: { flexDirection: 'row', borderWidth: 0.75, borderColor: '#999', backgroundColor: '#f5f5f5', padding: 4 },
  tableRow: { flexDirection: 'row', borderLeftWidth: 0.75, borderRightWidth: 0.75, borderBottomWidth: 0.75, borderColor: '#999', padding: 4 },
  col1: { width: 60, textAlign: 'left' },
  col2: { flex: 1, textAlign: 'left' },
  col3: { width: 100, textAlign: 'right' },
  signBox: { alignItems: 'center', marginTop: 16 },
})

function PengingatPDF({ invoice, payments, totalPaid, sisaTagihan, chargeDescription }: {
  invoice: InvoiceRow
  payments: PaymentRow[]
  totalPaid: number
  sisaTagihan: number
  chargeDescription: string
}) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View>
            <Text style={[s.bold, { fontSize: 11 }]}>Bimbel Tera</Text>
            <Text style={{ color: '#555', marginTop: 2 }}>Jl. Rawageni No. 9k, Kel. Ratujaya, Kec. Cipayung, Kota Depok</Text>
            <Text style={{ color: '#555', marginTop: 2 }}>Telp: 0813 1550 2949  &middot;  teralearningcenter.id@gmail.com</Text>
          </View>
          <Image src={logoPath} style={{ width: 60, height: 26 }} />
        </View>

        <View style={s.divider} />

        <View style={s.titleBlock}>
          <Text style={[s.bold, { fontSize: 14, letterSpacing: 2 }]}>PEMBERITAHUAN TAGIHAN</Text>
          <Text style={{ fontFamily: 'Courier', fontSize: 8, marginTop: 4, color: '#555' }}>Referensi Invoice: {invoice.invoice_number}</Text>
        </View>

        <View style={[s.row, { marginBottom: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.label, s.bold]}>Kepada</Text>
            <Text style={{ color: '#888', fontSize: 8 }}>Nama Siswa :</Text>
            <Text style={s.bold}>{invoice.student_name}</Text>
            <Text style={{ color: '#888', fontSize: 8, marginTop: 4 }}>Nama Orang Tua :</Text>
            <Text style={s.bold}>{invoice.parent_name}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[s.label, s.bold]}>Tanggal Invoice Awal</Text>
            <Text style={s.bold}>{formatDate(invoice.issued_at)}</Text>
          </View>
        </View>

        <Text style={{ marginBottom: 12, color: '#333' }}>
          Berikut kami sampaikan status tagihan untuk {chargeDescription}. Mohon dapat ditindaklanjuti sesuai sisa tagihan di bawah ini.
        </Text>

        <View style={{ marginBottom: 4 }}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Total Tagihan (Invoice {invoice.invoice_number})</Text>
            <Text style={s.summaryValue}>{formatRupiah(invoice.total_due)}</Text>
          </View>
          <View style={[s.summaryRow, { borderTopWidth: 0 }]}>
            <Text style={s.summaryLabel}>Sudah Dibayar</Text>
            <Text style={s.summaryValue}>{formatRupiah(totalPaid)}</Text>
          </View>
          <View style={[s.summaryRow, { borderTopWidth: 0, backgroundColor: '#f5f5f5' }]}>
            <Text style={[s.summaryLabel, s.bold, { color: '#111' }]}>Sisa Tagihan</Text>
            <Text style={[s.summaryValue, s.bold]}>{formatRupiah(sisaTagihan)}</Text>
          </View>
        </View>

        {payments.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={[s.label, s.bold]}>Riwayat Pembayaran</Text>
            <View style={s.tableHeader}>
              <Text style={[s.col1, s.bold]}>Tahap</Text>
              <Text style={[s.col2, s.bold]}>Tanggal</Text>
              <Text style={[s.col3, s.bold]}>Jumlah</Text>
            </View>
            {payments.map((p, idx) => (
              <View key={p.id} style={s.tableRow}>
                <Text style={s.col1}>{idx + 1}</Text>
                <Text style={s.col2}>{formatDate(p.paid_at)}</Text>
                <Text style={s.col3}>{formatRupiah(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ alignItems: 'flex-end', marginTop: 24 }}>
          <View style={s.signBox}>
            <Text>Depok, {formatDate(new Date().toISOString())}</Text>
            <Text style={[s.bold, { marginTop: 4 }]}>Pimpinan Bimbel Tera</Text>
            <Image src={signaturePath} style={{ width: 116, height: 48, marginTop: 4 }} />
            <Text style={s.bold}>Suci Purnama Sari, M.Si.</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const { invoiceId } = await params
  const admin = createAdminClient()

  const [invoiceRes, paymentsRes] = await Promise.all([
    admin
      .from('invoices')
      .select('id, invoice_number, student_name, parent_name, line_items, total_due, issued_at')
      .eq('id', invoiceId)
      .single() as unknown as Promise<{ data: InvoiceRow | null }>,
    admin
      .from('invoice_payments')
      .select('id, amount, paid_at')
      .eq('invoice_id', invoiceId)
      .order('paid_at', { ascending: true }) as unknown as Promise<{ data: PaymentRow[] | null }>,
  ])

  if (!invoiceRes.data) {
    return new NextResponse('Invoice not found', { status: 404 })
  }

  const invoice = invoiceRes.data
  const payments = paymentsRes.data ?? []
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const sisaTagihan = Math.max(0, invoice.total_due - totalPaid)
  const chargeDescription = invoice.line_items.find(i => !i.is_deduction)?.description ?? ''

  const buffer = await renderToBuffer(
    <PengingatPDF invoice={invoice} payments={payments} totalPaid={totalPaid} sisaTagihan={sisaTagihan} chargeDescription={chargeDescription} />
  )

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Pengingat-${invoice.invoice_number}.pdf"`,
    },
  })
}
