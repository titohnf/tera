export const runtime = 'nodejs'

import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { displayLineItemDescription } from '@/lib/invoice-line-items'
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

const logoPath = path.join(process.cwd(), 'public', 'logo-tera.png')
const signaturePath = path.join(process.cwd(), 'public', 'ttd-stempel.png')

type LineItem = {
  description: string
  months: number
  amount: number
  is_deduction: boolean
  unit?: 'bulan' | 'pertemuan'
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
}

Font.register({
  family: 'Helvetica',
  fonts: [],
})

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#111', padding: '2.9cm' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bold: { fontFamily: 'Helvetica-Bold' },
  label: { fontSize: 7, color: '#888', textTransform: 'uppercase', marginBottom: 3 },
  divider: { borderBottomWidth: 0.75, borderBottomColor: '#999', marginBottom: 10, marginTop: 4 },
  thinDivider: { borderBottomWidth: 0.5, borderBottomColor: '#ccc', marginVertical: 4 },
  tableHeader: { flexDirection: 'row', borderWidth: 0.75, borderColor: '#999', backgroundColor: '#f5f5f5', padding: 4 },
  tableRow: { flexDirection: 'row', borderLeftWidth: 0.75, borderRightWidth: 0.75, borderBottomWidth: 0.75, borderColor: '#999', padding: 4 },
  tableFooter: { flexDirection: 'row', borderWidth: 0.75, borderColor: '#999', backgroundColor: '#f5f5f5', padding: 4 },
  titleBlock: { alignItems: 'center', marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  col1: { flex: 3 },
  col2: { width: 50, textAlign: 'center' },
  col3: { width: 70, textAlign: 'right' },
  col4: { width: 75, textAlign: 'right' },
  signBox: { alignItems: 'center', marginTop: 16 },
  paymentRow: { flexDirection: 'row' },
  paymentLabel: { fontFamily: 'Helvetica-Bold', width: 90 },
})

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function InvoicePDF({ invoice }: { invoice: InvoiceRow }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
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
          <Text style={[s.bold, { fontSize: 16, letterSpacing: 3 }]}>INVOICE</Text>
          <Text style={{ fontFamily: 'Courier', fontSize: 8, marginTop: 4, color: '#555' }}>{invoice.invoice_number}</Text>
        </View>

        {/* Parties */}
        <View style={[s.row, { marginBottom: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.label, s.bold]}>Tagihan Dari</Text>
            <Text style={s.bold}>Bimbel Tera</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.label, s.bold]}>Untuk</Text>
            <Text style={{ color: '#888', fontSize: 8 }}>Nama Siswa :</Text>
            <Text style={s.bold}>{invoice.student_name}</Text>
            <Text style={{ color: '#888', fontSize: 8, marginTop: 4 }}>Nama Orang Tua :</Text>
            <Text style={s.bold}>{invoice.parent_name}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.tableHeader}>
          <Text style={[s.col1, s.bold]}>Rincian Pembayaran</Text>
          <Text style={[s.col2, s.bold]}>Qty</Text>
          <Text style={[s.col3, s.bold]}>Biaya/Satuan</Text>
          <Text style={[s.col4, s.bold]}>Total Harga</Text>
        </View>
        {invoice.line_items.map((item, i) => {
          const subtotal = item.months === 0 ? item.amount : item.months * item.amount
          const subtotalFmt = item.is_deduction ? `-${formatRupiah(subtotal)}` : formatRupiah(subtotal)
          return (
            <View key={i} style={s.tableRow}>
              {item.months === 0 ? (
                <Text style={{ flex: 1 }}>{item.description}</Text>
              ) : (
                <>
                  <Text style={s.col1}>{displayLineItemDescription(item.description)}</Text>
                  <Text style={s.col2}>{item.months} {item.unit === 'pertemuan' ? 'pertm' : 'bln'}</Text>
                  <Text style={s.col3}>{formatRupiah(item.amount)}</Text>
                </>
              )}
              <Text style={s.col4}>{subtotalFmt}</Text>
            </View>
          )
        })}
        <View style={s.tableFooter}>
          <Text style={[s.col1, s.bold]} />
          <Text style={[s.col2, s.bold]} />
          <Text style={[s.col3, s.bold]}>Total Tagihan</Text>
          <Text style={[s.col4, s.bold]}>{formatRupiah(invoice.total_due)}</Text>
        </View>

        {/* Payment info */}
        <View style={{ marginTop: 16, marginBottom: 16 }}>
          <View style={s.paymentRow}>
            <Text style={s.paymentLabel}>Metode Pembayaran</Text>
            <Text>: {invoice.payment_method}</Text>
          </View>
          <View style={[s.paymentRow, { marginTop: 4 }]}>
            <Text style={s.paymentLabel}>Rekening</Text>
            <Text>: {invoice.bank_account}</Text>
          </View>
          {invoice.due_date && (
            <View style={[s.paymentRow, { marginTop: 4 }]}>
              <Text style={s.paymentLabel}>Batas Pembayaran</Text>
              <Text>: {formatDate(invoice.due_date)}</Text>
            </View>
          )}
        </View>

        {/* Signature */}
        <View style={{ alignItems: 'flex-end', marginTop: 24 }}>
          <View style={s.signBox}>
            <Text>Depok, {formatDate(invoice.issued_at)}</Text>
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

  const { data: invoice } = await admin
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single() as unknown as { data: InvoiceRow | null }

  if (!invoice) {
    return new NextResponse('Invoice not found', { status: 404 })
  }

  const buffer = await renderToBuffer(<InvoicePDF invoice={invoice} />)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`,
    },
  })
}
