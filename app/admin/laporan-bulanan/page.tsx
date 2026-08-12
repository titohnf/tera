import { createAdminClient } from '@/lib/supabase/server-admin'
import StudentSelect from '@/components/admin/laporan-bulanan/StudentSelect'
import MonthSelect from '@/components/admin/attendance/MonthSelect'
import ReportNotesForm from '@/components/admin/laporan-bulanan/ReportNotesForm'
import { getLaporanBulananData } from '@/lib/reports/laporan-bulanan'
import LaporanBulananView from '@/components/laporan/LaporanBulananView'

export default async function LaporanBulananPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; month?: string }>
}) {
  const { student_id, month } = await searchParams
  const now = new Date()
  const selectedMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

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
    .select('id, full_name')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('full_name') as unknown as { data: { id: string; full_name: string | null }[] | null }

  const studentOptions = (students ?? []).map(s => ({ value: s.id, label: s.full_name ?? '(tanpa nama)' }))

  const report = student_id ? await getLaporanBulananData(student_id, selectedMonth) : null

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Laporan Bulanan Siswa</h1>
          <p className="text-sm text-gray-500 mt-1">Rekap pembelajaran siswa per bulan: kehadiran, materi, nilai, dan catatan tutor.</p>
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

      <div className="flex gap-3 mb-6 flex-wrap">
        <StudentSelect options={studentOptions} value={student_id ?? ''} />
        <MonthSelect options={monthOptions} value={selectedMonth} />
      </div>

      {!student_id ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center">
          <p className="text-sm text-gray-500">Pilih siswa di atas untuk membuat laporan bulanan.</p>
        </div>
      ) : !report ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center">
          <p className="text-sm text-gray-500">Siswa tidak ditemukan.</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}
