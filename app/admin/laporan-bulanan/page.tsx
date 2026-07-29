import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import StudentSelect from '@/components/admin/laporan-bulanan/StudentSelect'
import MonthSelect from '@/components/admin/attendance/MonthSelect'
import ReportNotesForm from '@/components/admin/laporan-bulanan/ReportNotesForm'
import { getLaporanBulananData, groupNotesByCategory } from '@/lib/reports/laporan-bulanan'

const ATTENDANCE_STATUS: Record<string, { label: string; cls: string }> = {
  present: { label: 'Hadir', cls: 'bg-green-50 text-green-600' },
  late: { label: 'Terlambat', cls: 'bg-yellow-50 text-yellow-600' },
  absent: { label: 'Absen', cls: 'bg-red-50 text-red-400' },
  excused: { label: 'Izin', cls: 'bg-gray-100 text-gray-400' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

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
        <div className="space-y-6">
          {/* Identitas */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{report.student.full_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {report.student.nickname && `${report.student.nickname} · `}
                  {report.student.grade ? `Kelas ${report.student.grade}` : report.student.level ?? ''}
                  {' · '}Periode {report.monthLabel}
                </p>
              </div>
              <Link href={`/admin/siswa/${report.student.id}`} className="text-xs text-blue-600 hover:underline">
                Lihat profil siswa →
              </Link>
            </div>
            {report.classes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                {report.classes.map(c => (
                  <span key={c.id} className="text-xs bg-slate-50 text-gray-600 px-2.5 py-1 rounded-full">
                    {c.name}{c.tutor_name ? ` · ${c.tutor_name}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Ringkasan kehadiran */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan Kehadiran</h2>
            <div className="grid grid-cols-5 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-gray-800">{report.attendanceSummary.total}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total Sesi</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">{report.attendanceSummary.present}</p>
                <p className="text-xs text-gray-400 mt-0.5">Hadir</p>
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-600">{report.attendanceSummary.late}</p>
                <p className="text-xs text-gray-400 mt-0.5">Terlambat</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-500">{report.attendanceSummary.absent}</p>
                <p className="text-xs text-gray-400 mt-0.5">Absen</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-400">{report.attendanceSummary.excused}</p>
                <p className="text-xs text-gray-400 mt-0.5">Izin</p>
              </div>
            </div>
            {report.attendanceSummary.pct !== null && (
              <p className="text-xs text-gray-500 mt-3 text-center">Tingkat kehadiran: <span className="font-semibold text-gray-700">{report.attendanceSummary.pct}%</span></p>
            )}
          </div>

          {/* Materi & topik */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            <h2 className="text-sm font-semibold text-gray-700 px-5 pt-4 pb-3">Materi &amp; Topik yang Diajarkan</h2>
            {report.sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada sesi terlaksana di bulan ini.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-t border-b bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Topik / Tema</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.sessions.map(s => {
                    const att = s.attendance_status ? ATTENDANCE_STATUS[s.attendance_status] : null
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(s.scheduled_at)}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {s.topic ?? s.custom_theme ?? <span className="text-gray-300">—</span>}
                          {s.custom_learning_outcomes && s.custom_learning_outcomes.length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">{s.custom_learning_outcomes.join(', ')}</p>
                          )}
                          {s.attitude_note && (
                            <p className="text-xs text-gray-500 mt-1"><span className="font-medium text-gray-400">Attitude:</span> {s.attitude_note}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {att ? (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${att.cls}`}>{att.label}</span>
                          ) : (
                            <span className="text-xs text-gray-300">Belum ditandai</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Nilai asesmen */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            <h2 className="text-sm font-semibold text-gray-700 px-5 pt-4 pb-3">Nilai Asesmen</h2>
            {report.assessments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada asesmen di bulan ini.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-t border-b bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Asesmen</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nilai</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.assessments.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{a.title}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(a.scheduled_at)}</td>
                      <td className="px-4 py-3 text-center">
                        {a.score !== null ? <span className="font-semibold">{a.score} / {a.max_score}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{a.feedback ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Catatan performa tutor (Progress & Rekomendasi) — web saja, tidak tampil di PDF */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Catatan Performa Tutor</h2>
              <span className="text-xs text-gray-400">Tidak tampil di PDF</span>
            </div>
            {report.performanceNotes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Belum ada catatan performa di bulan ini.</p>
            ) : (
              <div className="border-t divide-y">
                {groupNotesByCategory(report.performanceNotes).map(({ category, notes }) => (
                  <div key={category} className="px-5 py-4">
                    {category !== '_' && (
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{category}</p>
                    )}
                    <div className="space-y-3">
                      {notes.map(n => (
                        <div key={n.id}>
                          <p className="text-sm text-gray-800 leading-relaxed">{n.body}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {n.tutor_name ?? 'Tutor'}{n.scheduled_at ? ` · ${formatDate(n.scheduled_at)}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catatan tambahan — diisi admin */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Catatan Tambahan</h2>
            <ReportNotesForm
              studentId={report.student.id}
              month={selectedMonth}
              initial={report.reportNotes ?? { mastered: null, needs_practice: null, other_notes: null }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
