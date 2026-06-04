import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import MonthSelect from '@/components/admin/attendance/MonthSelect'
import AttendanceExport from '@/components/admin/attendance/AttendanceExport'

type ClassRow = { id: string; name: string; level: string | null; profiles: { full_name: string } | null }
type SessionRow = { id: string; scheduled_at: string; topic: string | null; class_id: string }
type AttendanceRow = { session_id: string; status: string }

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; month?: string }>
}) {
  const { class_id, month } = await searchParams
  const admin = createAdminClient()
  const now = new Date()
  const selectedMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, mon] = selectedMonth.split('-').map(Number)
  const monthStart = new Date(year, mon - 1, 1).toISOString()
  const monthEnd = new Date(year, mon, 1).toISOString()

  const { data: classes } = await admin
    .from('classes')
    .select('id, name, level, profiles!tutor_id(full_name)')
    .eq('is_active', true)
    .order('name') as unknown as { data: ClassRow[] | null }

  let sessionQuery = admin
    .from('sessions')
    .select('id, scheduled_at, topic, class_id')
    .eq('status', 'completed')
    .gte('scheduled_at', monthStart)
    .lt('scheduled_at', monthEnd)
    .order('scheduled_at', { ascending: false })

  if (class_id) sessionQuery = sessionQuery.eq('class_id', class_id)

  const { data: sessions } = await sessionQuery as unknown as { data: SessionRow[] | null }

  const sessionIds = (sessions ?? []).map(s => s.id)
  let attendances: AttendanceRow[] = []
  if (sessionIds.length > 0) {
    const { data } = await admin
      .from('attendances')
      .select('session_id, status')
      .in('session_id', sessionIds) as unknown as { data: AttendanceRow[] | null }
    attendances = data ?? []
  }

  // Group attendance by session
  const bySession: Record<string, { present: number; late: number; absent: number; excused: number }> = {}
  for (const a of attendances) {
    if (!bySession[a.session_id]) bySession[a.session_id] = { present: 0, late: 0, absent: 0, excused: 0 }
    if (a.status in bySession[a.session_id]) bySession[a.session_id][a.status as keyof typeof bySession[string]]++
  }

  // Class summary
  const classById = Object.fromEntries((classes ?? []).map(c => [c.id, c]))
  const classSummary: Record<string, { sessions: number; totalPresent: number; totalStudents: number }> = {}
  for (const s of sessions ?? []) {
    if (!classSummary[s.class_id]) classSummary[s.class_id] = { sessions: 0, totalPresent: 0, totalStudents: 0 }
    const att = bySession[s.id] ?? { present: 0, late: 0, absent: 0, excused: 0 }
    classSummary[s.class_id].sessions++
    classSummary[s.class_id].totalPresent += att.present + att.late
    classSummary[s.class_id].totalStudents += att.present + att.late + att.absent + att.excused
  }

  // Month options (last 6 months)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    }
  })

  const selectedClass = class_id ? classById[class_id] : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Laporan Kehadiran</h1>
        <p className="text-sm text-gray-500 mt-1">Rekap kehadiran siswa per sesi dan per kelas.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <MonthSelect options={monthOptions} value={selectedMonth} />

        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/admin/attendance?month=${selectedMonth}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!class_id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Semua Kelas
          </Link>
          {(classes ?? []).map(c => (
            <Link
              key={c.id}
              href={`/admin/attendance?month=${selectedMonth}&class_id=${c.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${class_id === c.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Overview: all classes */}
      {!class_id && (
        <div className="space-y-3">
          {Object.keys(classSummary).length === 0 ? (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
              Tidak ada sesi selesai di bulan ini.
            </div>
          ) : (
            Object.entries(classSummary).map(([cid, summary]) => {
              const cls = classById[cid]
              const rate = summary.totalStudents > 0 ? Math.round((summary.totalPresent / summary.totalStudents) * 100) : 0
              return (
                <Link
                  key={cid}
                  href={`/admin/attendance?month=${selectedMonth}&class_id=${cid}`}
                  className="flex items-center justify-between bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4 hover:bg-blue-50/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{cls?.name ?? cid}</p>
                      {cls?.level && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{cls.level}</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{cls?.profiles?.full_name} · {summary.sessions} sesi selesai</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Total hadir</p>
                      <p className="text-sm font-semibold text-gray-800">{summary.totalPresent} / {summary.totalStudents}</p>
                    </div>
                    <div className="text-right w-16">
                      <p className="text-sm text-gray-400">Rata-rata</p>
                      <p className={`text-lg font-bold ${rate >= 75 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {rate}%
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}

      {/* Per-class: session breakdown */}
      {class_id && (
        <div>
          {selectedClass && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-4 mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedClass.name}</p>
                <p className="text-sm text-gray-500">{selectedClass.profiles?.full_name}</p>
              </div>
              {classSummary[class_id] && (
                <div className="text-right">
                  <p className="text-sm text-gray-400">{classSummary[class_id].sessions} sesi · rata-rata kehadiran</p>
                  <p className={`text-2xl font-bold ${
                    classSummary[class_id].totalStudents > 0
                      ? Math.round((classSummary[class_id].totalPresent / classSummary[class_id].totalStudents) * 100) >= 75
                        ? 'text-green-600' : 'text-yellow-600'
                      : 'text-gray-400'
                  }`}>
                    {classSummary[class_id].totalStudents > 0
                      ? `${Math.round((classSummary[class_id].totalPresent / classSummary[class_id].totalStudents) * 100)}%`
                      : '—'}
                  </p>
                </div>
              )}
            </div>
          )}

          {(sessions ?? []).length === 0 ? (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center text-sm text-gray-500">
              Tidak ada sesi selesai di bulan ini untuk kelas ini.
            </div>
          ) : (() => {
            const exportRows = (sessions ?? []).map(session => {
              const att = bySession[session.id] ?? { present: 0, late: 0, absent: 0, excused: 0 }
              const total = att.present + att.late + att.absent + att.excused
              const rate = total > 0 ? Math.round(((att.present + att.late) / total) * 100) : null
              return {
                tanggal: new Date(session.scheduled_at).toLocaleDateString('id-ID'),
                topik: session.topic ?? '',
                hadir: att.present,
                terlambat: att.late,
                absen: att.absent,
                izin: att.excused,
                rate: rate !== null ? `${rate}%` : '',
              }
            })
            return (
              <div>
                <div className="flex justify-end mb-2">
                  <AttendanceExport
                    rows={exportRows}
                    filename={`kehadiran-${selectedClass?.name ?? 'kelas'}-${selectedMonth}.csv`}
                  />
                </div>
                <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-5 py-3 text-sm font-semibold text-gray-500">Tanggal & Topik</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-green-600">Hadir</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-yellow-600">Terlambat</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-red-500">Absen</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-400">Izin</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-500">Rate</th>
                        <th className="px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(sessions ?? []).map(session => {
                        const att = bySession[session.id] ?? { present: 0, late: 0, absent: 0, excused: 0 }
                        const total = att.present + att.late + att.absent + att.excused
                        const rate = total > 0 ? Math.round(((att.present + att.late) / total) * 100) : null
                        const date = new Date(session.scheduled_at)
                        return (
                          <tr key={session.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3">
                              <p className="font-medium text-gray-800">
                                {date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </p>
                              <p className="text-sm text-gray-400">{session.topic ?? '—'}</p>
                            </td>
                            <td className="text-center px-4 py-3 font-semibold text-green-600">{att.present}</td>
                            <td className="text-center px-4 py-3 font-semibold text-yellow-600">{att.late}</td>
                            <td className="text-center px-4 py-3 font-semibold text-red-500">{att.absent}</td>
                            <td className="text-center px-4 py-3 text-gray-400">{att.excused}</td>
                            <td className="text-center px-4 py-3">
                              {rate !== null ? (
                                <span className={`font-semibold ${rate >= 75 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                  {rate}%
                                </span>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Link
                                href={`/admin/attendance/${session.id}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Detail
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
