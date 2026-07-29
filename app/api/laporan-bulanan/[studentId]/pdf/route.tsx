export const runtime = 'nodejs'

import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'
import { getLaporanBulananData, type LaporanBulananData } from '@/lib/reports/laporan-bulanan'

const logoPath = path.join(process.cwd(), 'public', 'logo-tera.png')

const ATTENDANCE_LABEL: Record<string, string> = {
  present: 'Hadir',
  late: 'Terlambat',
  absent: 'Absen',
  excused: 'Izin',
}

Font.register({
  family: 'Helvetica',
  fonts: [],
})

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#111', padding: '2.4cm' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  divider: { borderBottomWidth: 0.75, borderBottomColor: '#999', marginBottom: 10, marginTop: 4 },
  titleBlock: { alignItems: 'center', marginBottom: 12 },
  bold: { fontFamily: 'Helvetica-Bold' },
  section: { marginBottom: 14 },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 7, color: '#888', textTransform: 'uppercase', marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f7f7f7', padding: 8, borderRadius: 3 },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontFamily: 'Helvetica-Bold', fontSize: 13 },
  tableHeader: { flexDirection: 'row', borderWidth: 0.75, borderColor: '#999', backgroundColor: '#f5f5f5', padding: 4 },
  tableRow: { flexDirection: 'row', borderLeftWidth: 0.75, borderRightWidth: 0.75, borderBottomWidth: 0.75, borderColor: '#999', padding: 4 },
  colDate: { width: 60 },
  colMain: { flex: 1 },
  colScore: { width: 50, textAlign: 'center' },
  colStatus: { width: 60, textAlign: 'center' },
})

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function LaporanPDF({ data }: { data: LaporanBulananData }) {
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
          <Text style={[s.bold, { fontSize: 14, letterSpacing: 2 }]}>LAPORAN PEMBELAJARAN BULANAN</Text>
          <Text style={{ fontSize: 9, marginTop: 4, color: '#555' }}>{data.monthLabel}</Text>
        </View>

        {/* Identitas */}
        <View style={[s.row, { marginBottom: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Nama Siswa</Text>
            <Text style={s.bold}>{data.student.full_name}</Text>
            {data.student.grade && <Text style={{ marginTop: 2, color: '#555' }}>Kelas {data.student.grade}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Kelas Diikuti</Text>
            <Text>{data.classes.map(c => c.name).join(', ') || '—'}</Text>
          </View>
        </View>

        {/* Ringkasan kehadiran */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ringkasan Kehadiran</Text>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{data.attendanceSummary.total}</Text>
              <Text style={{ fontSize: 7, color: '#888' }}>Total Sesi</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{data.attendanceSummary.present}</Text>
              <Text style={{ fontSize: 7, color: '#888' }}>Hadir</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{data.attendanceSummary.late}</Text>
              <Text style={{ fontSize: 7, color: '#888' }}>Terlambat</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{data.attendanceSummary.absent}</Text>
              <Text style={{ fontSize: 7, color: '#888' }}>Absen</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{data.attendanceSummary.pct !== null ? `${data.attendanceSummary.pct}%` : '—'}</Text>
              <Text style={{ fontSize: 7, color: '#888' }}>Tingkat Hadir</Text>
            </View>
          </View>
        </View>

        {/* Materi & topik */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Materi &amp; Topik yang Diajarkan</Text>
          {data.sessions.length === 0 ? (
            <Text style={{ color: '#888' }}>Belum ada sesi terlaksana di bulan ini.</Text>
          ) : (
            <>
              <View style={s.tableHeader}>
                <Text style={[s.colDate, s.bold]}>Tanggal</Text>
                <Text style={[s.colMain, s.bold]}>Topik</Text>
                <Text style={[s.colStatus, s.bold]}>Kehadiran</Text>
              </View>
              {data.sessions.map(sess => (
                <View key={sess.id} style={s.tableRow}>
                  <Text style={s.colDate}>{formatDate(sess.scheduled_at)}</Text>
                  <View style={s.colMain}>
                    <Text>{sess.topic ?? sess.custom_theme ?? '—'}</Text>
                    {sess.attitude_note && (
                      <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>Attitude: {sess.attitude_note}</Text>
                    )}
                  </View>
                  <Text style={s.colStatus}>{sess.attendance_status ? ATTENDANCE_LABEL[sess.attendance_status] ?? sess.attendance_status : '—'}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Nilai asesmen */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Nilai Asesmen</Text>
          {data.assessments.length === 0 ? (
            <Text style={{ color: '#888' }}>Belum ada asesmen di bulan ini.</Text>
          ) : (
            <>
              <View style={s.tableHeader}>
                <Text style={[s.colMain, s.bold]}>Asesmen</Text>
                <Text style={[s.colDate, s.bold]}>Tanggal</Text>
                <Text style={[s.colScore, s.bold]}>Nilai</Text>
              </View>
              {data.assessments.map(a => (
                <View key={a.id} style={s.tableRow}>
                  <Text style={s.colMain}>{a.title}</Text>
                  <Text style={s.colDate}>{formatDate(a.scheduled_at)}</Text>
                  <Text style={s.colScore}>{a.score !== null ? `${a.score}/${a.max_score}` : '—'}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Catatan tambahan */}
        {data.reportNotes && (data.reportNotes.mastered || data.reportNotes.needs_practice || data.reportNotes.other_notes) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Catatan Tambahan</Text>
            {data.reportNotes.mastered && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[s.bold, { fontSize: 8, color: '#555' }]}>Yang Sudah Dikuasai</Text>
                <Text style={{ marginTop: 2 }}>{data.reportNotes.mastered}</Text>
              </View>
            )}
            {data.reportNotes.needs_practice && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[s.bold, { fontSize: 8, color: '#555' }]}>Yang Masih Perlu Dilatih</Text>
                <Text style={{ marginTop: 2 }}>{data.reportNotes.needs_practice}</Text>
              </View>
            )}
            {data.reportNotes.other_notes && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[s.bold, { fontSize: 8, color: '#555' }]}>Catatan Lainnya</Text>
                <Text style={{ marginTop: 2 }}>{data.reportNotes.other_notes}</Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params
  const { searchParams } = new URL(req.url)
  const now = new Date()
  const month = searchParams.get('month') ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const data = await getLaporanBulananData(studentId, month)

  if (!data) {
    return new NextResponse('Siswa tidak ditemukan', { status: 404 })
  }

  const buffer = await renderToBuffer(<LaporanPDF data={data} />)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Laporan-${data.student.full_name ?? 'Siswa'}-${month}.pdf"`,
    },
  })
}
