import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { anakOrRedirect } from '@/lib/keluarga'

function namaBulan(month: string) {
  const [y, m] = month.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

export default async function LaporanPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)
  const supabase = await createClient()

  const { data: laporan } = await supabase
    .from('monthly_report_notes')
    .select('month, mastered, needs_practice, other_notes')
    .eq('student_id', studentId)
    .order('month', { ascending: false })

  const bagian = [
    { key: 'mastered' as const, judul: 'Sudah dikuasai' },
    { key: 'needs_practice' as const, judul: 'Masih perlu latihan' },
    { key: 'other_notes' as const, judul: 'Catatan lain' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/keluarga/${studentId}`} className="text-xs text-gray-400 hover:text-gray-600">
          ← {anak.full_name}
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-1">Laporan Bulanan</h1>
      </div>

      {(laporan ?? []).length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
          Belum ada laporan bulanan yang diterbitkan.
        </p>
      ) : (
        <div className="space-y-4">
          {(laporan ?? []).map((l) => (
            <section key={l.month} className="rounded-xl bg-white p-5 shadow ring-1 ring-gray-900/5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-gray-900">{namaBulan(l.month)}</h2>
                {/* Pengganti tautan PDF yang dulu terbuka tanpa login: di sini
                    orang tua sudah masuk, dan route-nya kini memeriksa bahwa
                    murid ini memang anaknya. */}
                <a
                  href={`/api/laporan-bulanan/${studentId}/pdf?month=${l.month}`}
                  className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
                >
                  Unduh PDF
                </a>
              </div>
              <div className="mt-3 space-y-3">
                {bagian.map((b) =>
                  l[b.key] ? (
                    <div key={b.key}>
                      <p className="text-xs font-medium text-gray-400">{b.judul}</p>
                      <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-line">{l[b.key]}</p>
                    </div>
                  ) : null,
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
