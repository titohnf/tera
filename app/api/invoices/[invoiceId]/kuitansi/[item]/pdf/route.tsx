export const runtime = 'nodejs'

import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'
import { getKuitansiNumber } from '@/lib/kuitansi-number'
import { denyUnlessCanReadInvoice } from '@/lib/api-auth'

const logoPath = path.join(process.cwd(), 'public', 'logo-tera.png')
const signaturePath = path.join(process.cwd(), 'public', 'ttd-stempel.png')

type InvoiceRow = {
  id: string
  student_name: string
  parent_name: string
  line_items: { description: string; is_deduction: boolean }[]
  issued_at: string
}

type PaymentRow = {
  id: string
  amount: number
  paid_at: string
  created_at: string
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

Font.register({ family: 'Helvetica', fonts: [] })

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#111', padding: '2.9cm' },
  bold: { fontFamily: 'Helvetica-Bold' },
  label: { fontSize: 7, color: '#888', textTransform: 'uppercase', marginBottom: 3 },
  divider: { borderBottomWidth: 1.5, borderBottomColor: '#333', marginBottom: 20, marginTop: 6 },
  titleBlock: { alignItems: 'center', marginBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  infoRow: { flexDirection: 'row', marginBottom: 2 },
  infoLabel: { width: 130, color: '#555' },
  infoColon: { width: 10, color: '#555' },
  infoValue: { flex: 1, fontFamily: 'Helvetica-Bold' },
  tableHeader: { flexDirection: 'row', borderWidth: 0.75, borderColor: '#333', backgroundColor: '#f5f5f5', padding: 5 },
  tableRow: { flexDirection: 'row', borderLeftWidth: 0.75, borderRightWidth: 0.75, borderBottomWidth: 0.75, borderColor: '#333', padding: 5 },
  col1: { flex: 3 },
  col2: { width: 60, textAlign: 'center' },
  col3: { width: 100, textAlign: 'right' },
  terbilangBox: { borderWidth: 0.75, borderTopWidth: 0, borderColor: '#333', padding: 6, textAlign: 'right', marginBottom: 30 },
  signBox: { alignItems: 'center', marginTop: 16 },
})

function KuitansiPDF({ invoice, payment, kuitansiNumber, tahapNumber, chargeDescription }: {
  invoice: InvoiceRow
  payment: PaymentRow
  kuitansiNumber: string
  tahapNumber: number
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
          <Text style={[s.bold, { fontSize: 14, letterSpacing: 3 }]}>KUITANSI</Text>
          <Text style={{ fontFamily: 'Courier', fontSize: 8, marginTop: 4, color: '#555' }}>{kuitansiNumber}</Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Telah Terima Dari</Text>
            <Text style={s.infoColon}>:</Text>
            <Text style={s.infoValue}>{invoice.parent_name}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Orang Tua Dari</Text>
            <Text style={s.infoColon}>:</Text>
            <Text style={s.infoValue}>{invoice.student_name}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Untuk Pembayaran</Text>
            <Text style={s.infoColon}>:</Text>
            <Text style={s.infoValue}>{chargeDescription}</Text>
          </View>
        </View>

        <View style={s.tableHeader}>
          <Text style={[s.col1, s.bold]}>Rincian Pembayaran</Text>
          <Text style={[s.col2, s.bold]}>Tahap</Text>
          <Text style={[s.col3, s.bold]}>Uang Sejumlah</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={s.col1}>{chargeDescription}</Text>
          <Text style={s.col2}>{tahapNumber}</Text>
          <Text style={s.col3}>Rp{new Intl.NumberFormat('id-ID').format(payment.amount)}</Text>
        </View>

        <View style={s.terbilangBox}>
          <Text>
            <Text style={{ color: '#555' }}>Terbilang: </Text>
            <Text style={s.bold}>{capitalize(terbilang(payment.amount))} Rupiah</Text>
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <View style={s.signBox}>
            <Text>Depok, {formatDate(payment.paid_at)}</Text>
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
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string; item: string }> },
) {
  const { invoiceId, item: paymentId } = await params
  const denied = await denyUnlessCanReadInvoice(invoiceId, req)
  if (denied) return denied

  const admin = createAdminClient()

  const [invoiceRes, paymentRes, allPaymentsRes] = await Promise.all([
    admin
      .from('invoices')
      .select('id, student_name, parent_name, line_items, issued_at')
      .eq('id', invoiceId)
      .single() as unknown as Promise<{ data: InvoiceRow | null }>,
    admin
      .from('invoice_payments')
      .select('id, amount, paid_at, created_at')
      .eq('id', paymentId)
      .single() as unknown as Promise<{ data: PaymentRow | null }>,
    admin
      .from('invoice_payments')
      .select('id')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true }) as unknown as Promise<{ data: { id: string }[] | null }>,
  ])

  if (!invoiceRes.data || !paymentRes.data) {
    return new NextResponse('Kuitansi not found', { status: 404 })
  }

  const invoice = invoiceRes.data
  const payment = paymentRes.data
  const allPayments = allPaymentsRes.data ?? []

  const tahapNumber = (allPayments.findIndex(p => p.id === paymentId) + 1) || 1
  const chargeItems = invoice.line_items.filter(i => !i.is_deduction)
  const chargeDescription = chargeItems[0]?.description ?? ''

  const kuitansiNumber = await getKuitansiNumber(admin, payment.id, payment.created_at)

  const buffer = await renderToBuffer(
    <KuitansiPDF invoice={invoice} payment={payment} kuitansiNumber={kuitansiNumber} tahapNumber={tahapNumber} chargeDescription={chargeDescription} />
  )

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${req.nextUrl.searchParams.get('preview') === '1' ? 'inline' : 'attachment'}; filename="Kuitansi-${kuitansiNumber}.pdf"`,
    },
  })
}
