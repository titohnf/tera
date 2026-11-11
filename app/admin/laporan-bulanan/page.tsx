import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server-admin'
import TautanLaporanSiswa from '@/components/admin/laporan-bulanan/TautanLaporanSiswa'
import TabelProgresKelas from '@/components/admin/laporan-bulanan/TabelProgresKelas'
import PemilihPeriode from '@/components/admin/laporan-bulanan/PemilihPeriode'
import ReportNotesForm from '@/components/admin/laporan-bulanan/ReportNotesForm'
import { getLaporanBulananData } from '@/lib/reports/laporan-bulanan'
import LaporanBulananView from '@/components/laporan/LaporanBulananView'
import KartuNilaiSemester from '@/components/admin/laporan-bulanan/KartuNilaiSemester'
import { rangkumanProgresKelas } from '@/lib/reports/ringkasan-laporan'

export default async function LaporanBulananPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; month?: string; periode?: string }>
}) {
  const { student_id, month, periode } = await searchParams
  const now = new Date()
  const selectedMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // "Semua waktu" hanya untuk tabel; laporan satu siswa selalu per bulan.
  const semuaWaktu = !student_id && periode === 'semua'

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    }
  })

  const admin = createAdminClient()
  const { data: students } = await admin
    .from('profiles')
    .select('id, full_name, grade')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('full_name') as unknown as { data: { id: string; full_name: string | null; grade: string | null }[] | null }

  const [selYear, selMon] = selectedMonth.split('-').map(Number)
  const [report, nilai] = student_id
    ? await Promise.all([
        getLaporanBulananData(student_id, selectedMonth),
        rangkumanProgresKelas(student_id, { tahun: selYear, bulan: selMon }),
      ])
    : [null, null]

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5">
            {student_id && (
              <Link
                href={`/admin/laporan-bulanan?month=${selectedMonth}`}
                aria-label="Kembali ke semua siswa"
                title="Semua siswa"
                className="-ml-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <h1 className="text-xl font-semibold text-gray-900">Progres Kelas</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Kehadiran, nilai, dan catatan per bulan, sama seperti yang dilihat orang tua.
          </p>
        </div>
        {report && (
          <a
            href={`/api/laporan-bulanan/${student_id}/pdf?month=${selectedMonth}`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Unduh PDF
          </a>
        )}
      </div>

      {student_id && (
        <div className="mb-3">
          <TautanLaporanSiswa studentId={student_id} aktif="kelas" bimbel bulan={selectedMonth} />
        </div>
      )}

      {student_id && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <PemilihPeriode options={monthOptions} month={selectedMonth} semua={false} />
        </div>
      )}

      {!student_id ? (
        // Di tampilan tabel, pemilih periode dititipkan ke tabel supaya satu
        // baris dengan kolom pencarian.
        <TabelProgresKelas
          students={students ?? []}
          month={selectedMonth}
          semuaWaktu={semuaWaktu}
          pemilihPeriode={<PemilihPeriode options={monthOptions} month={selectedMonth} semua={semuaWaktu} />}
        />
      ) : !report ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center">
          <p className="text-sm text-gray-500">Siswa tidak ditemukan.</p>
        </div>
      ) : (
        <>
        {nilai && (
          <KartuNilaiSemester
            kelas={nilai.kelas}
            bulan={nilai.bulanLabel}
            semesterLabel={nilai.semesterLabel}
          />
        )}
        <LaporanBulananView
          report={report}
          profileHref={`/admin/siswa/${report.student.id}`}
          catatanTambahan={
            <ReportNotesForm
              studentId={report.student.id}
              month={selectedMonth}
              initial={report.reportNotes ?? { mastered: null, needs_practice: null, other_notes: null }}
            />
          }
        />
        </>
      )}
    </div>
  )
}
