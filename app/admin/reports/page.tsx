import { createAdminClient } from '@/lib/supabase/server-admin'
import Link from 'next/link'
import ReportsExport from '@/components/admin/reports/ReportsExport'

type ClassRow = { id: string; name: string; level: string | null; profiles: { full_name: string } | null }
type AssessmentRow = {
  id: string; title: string; max_score: number; due_at: string | null; created_at: string
  sessions: { scheduled_at: string; class_id: string } | null
}
type ResultRow = { assessment_id: string; score: number | null; student_id: string; profiles: { full_name: string } | null }

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string }>
}) {
  const { class_id } = await searchParams
  const admin = createAdminClient()

  const { data: classes } = await admin
    .from('classes')
    .select('id, name, level, profiles!tutor_id(full_name)')
    .eq('is_active', true)
    .order('name') as unknown as { data: ClassRow[] | null }

  let assessments: AssessmentRow[] = []
  let results: ResultRow[] = []

  if (class_id) {
    // Get all session IDs for this class
    const { data: sessions } = await admin
      .from('sessions')
      .select('id')
      .eq('class_id', class_id)
      .eq('status', 'completed')

    const sessionIds = (sessions ?? []).map(s => s.id)

    if (sessionIds.length > 0) {
      const [{ data: assessmentData }, { data: resultData }] = await Promise.all([
        admin
          .from('assessments')
          .select('id, title, max_score, due_at, created_at, sessions(scheduled_at, class_id)')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false }) as unknown as Promise<{ data: AssessmentRow[] | null }>,
        admin
          .from('assessment_results')
          .select('assessment_id, score, student_id, profiles!student_id(full_name)')
          .in('assessment_id', sessionIds.length > 0 ? sessionIds : ['']) as unknown as Promise<{ data: ResultRow[] | null }>,
      ])
      assessments = assessmentData ?? []

      // Fetch results for the actual assessment IDs
      if (assessments.length > 0) {
        const assessmentIds = assessments.map(a => a.id)
        const { data: res } = await admin
          .from('assessment_results')
          .select('assessment_id, score, student_id, profiles!student_id(full_name)')
          .in('assessment_id', assessmentIds) as unknown as { data: ResultRow[] | null }
        results = res ?? []
      } else {
        results = resultData ?? []
      }
    }
  }

  const resultsByAssessment: Record<string, ResultRow[]> = {}
  for (const r of results) {
    if (!resultsByAssessment[r.assessment_id]) resultsByAssessment[r.assessment_id] = []
    resultsByAssessment[r.assessment_id].push(r)
  }

  const selectedClass = (classes ?? []).find(c => c.id === class_id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Laporan Nilai Siswa</h1>
        <p className="text-sm text-gray-500 mt-1">Rekap hasil asesmen dan nilai siswa per kelas.</p>
      </div>

      {/* Class selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/admin/reports"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!class_id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Pilih Kelas
        </Link>
        {(classes ?? []).map(c => (
          <Link
            key={c.id}
            href={`/admin/reports?class_id=${c.id}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${class_id === c.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {!class_id ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center">
          <p className="text-sm text-gray-500">Pilih kelas di atas untuk melihat laporan nilai.</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-10 text-center">
          <p className="text-sm font-medium text-gray-700">{selectedClass?.name}</p>
          <p className="text-sm text-gray-500 mt-1">Belum ada asesmen selesai di kelas ini.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedClass && (() => {
            const exportRows = assessments.flatMap(assessment => {
              const aResults = resultsByAssessment[assessment.id] ?? []
              return aResults.map(r => ({
                kelas: selectedClass.name,
                asesmen: assessment.title,
                skor_maks: assessment.max_score,
                siswa: r.profiles?.full_name ?? '',
                nilai: r.score ?? '',
                persentase: r.score !== null ? Math.round((r.score / assessment.max_score) * 100) : '',
                status: r.score === null ? 'Belum dinilai' : Math.round((r.score / assessment.max_score) * 100) >= 75 ? 'Tuntas' : 'Belum Tuntas',
              }))
            })
            return (
              <div className="flex items-center justify-between bg-white rounded-xl shadow ring-1 ring-gray-900/5 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedClass.name}</p>
                  <p className="text-xs text-gray-500">{selectedClass.profiles?.full_name} · {assessments.length} asesmen</p>
                </div>
                <ReportsExport
                  rows={exportRows}
                  filename={`nilai-${selectedClass.name}.csv`}
                />
              </div>
            )
          })()}

          {assessments.map(assessment => {
            const results = resultsByAssessment[assessment.id] ?? []
            const scored = results.filter(r => r.score !== null)
            const avg = scored.length > 0
              ? Math.round(scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length)
              : null
            const highest = scored.length > 0 ? Math.max(...scored.map(r => r.score ?? 0)) : null
            const lowest = scored.length > 0 ? Math.min(...scored.map(r => r.score ?? 0)) : null
            const sessionDate = assessment.sessions?.scheduled_at
              ? new Date(assessment.sessions.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : null

            return (
              <div key={assessment.id} className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
                {/* Assessment header */}
                <div className="px-5 py-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{assessment.title}</p>
                      <p className="text-xs text-gray-500">
                        Skor maks: {assessment.max_score}
                        {sessionDate ? ` · Sesi: ${sessionDate}` : ''}
                      </p>
                    </div>
                    {avg !== null && (
                      <div className="flex gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-400">Rata-rata</p>
                          <p className={`text-lg font-bold ${avg >= 75 ? 'text-green-600' : avg >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{avg}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Tertinggi</p>
                          <p className="text-lg font-bold text-blue-600">{highest}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Terendah</p>
                          <p className="text-lg font-bold text-orange-500">{lowest}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Results table */}
                {results.length === 0 ? (
                  <div className="px-5 py-6 text-center text-xs text-gray-400">Belum ada nilai yang diinput tutor.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">Siswa</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Nilai</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Persentase</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {results
                        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                        .map(r => {
                          const pct = r.score !== null ? Math.round((r.score / assessment.max_score) * 100) : null
                          return (
                            <tr key={r.student_id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 font-medium text-gray-800">
                                {r.profiles?.full_name ?? '—'}
                              </td>
                              <td className="text-center px-4 py-3">
                                {r.score !== null
                                  ? <span className="font-semibold">{r.score} / {assessment.max_score}</span>
                                  : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="text-center px-4 py-3">
                                {pct !== null
                                  ? <span className={`font-semibold ${pct >= 75 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{pct}%</span>
                                  : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="text-center px-4 py-3">
                                {pct === null ? (
                                  <span className="text-xs text-gray-400">Belum dinilai</span>
                                ) : pct >= 75 ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Tuntas</span>
                                ) : (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Belum Tuntas</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
