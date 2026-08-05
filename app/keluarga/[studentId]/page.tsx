import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { anakOrRedirect, sejakJam, tanggalPanjang } from '@/lib/keluarga'

interface SesiRow {
  id: string
  scheduled_at: string
  status: string
  topic: string | null
  classes: { name: string } | null
}

interface NilaiRow {
  score: number | null
  graded_at: string | null
  assessments: { title: string } | null
}

export default async function AnakBeranda({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)
  const supabase = await createClient()

  // Kelas aktif anak ini. RLS keluarga (migrasi 076) sudah membatasi ke anaknya
  // sendiri, jadi tidak ada filter student_id yang perlu ditulis di sini.
  const { data: kelas } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId)
    .eq('is_active', true)

  const classIds = (kelas ?? []).map((k) => k.class_id)

  const sejak = await sejakJam(2)
  const { data: sesiRows } = classIds.length
    ? await supabase
        .from('sessions')
        .select('id, scheduled_at, status, topic, classes(name)')
        .in('class_id', classIds)
        .gte('scheduled_at', sejak)
        .order('scheduled_at', { ascending: true })
        .limit(5)
    : { data: null }
  const sesi = (sesiRows ?? []) as unknown as SesiRow[]

  const { data: nilaiRows } = await supabase
    .from('assessment_results')
    .select('score, graded_at, assessments(title)')
    .eq('student_id', studentId)
    .not('score', 'is', null)
    .order('graded_at', { ascending: false, nullsFirst: false })
    .limit(5)
  const nilai = (nilaiRows ?? []) as unknown as NilaiRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{anak.full_name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan belajar</p>
      </div>

      <section className="rounded-xl bg-white shadow ring-1 ring-gray-900/5">
        <h2 className="px-5 pt-4 pb-2 text-sm font-medium text-gray-900">Jadwal berikutnya</h2>
        {sesi.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-gray-400">Belum ada sesi terjadwal.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sesi.map((s) => (
              <li key={s.id} className="px-5 py-3">
                <p className="text-sm font-medium text-gray-900">{tanggalPanjang(s.scheduled_at)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {s.classes?.name ?? 'Kelas'}
                  {s.topic ? ` · ${s.topic}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl bg-white shadow ring-1 ring-gray-900/5">
        <h2 className="px-5 pt-4 pb-2 text-sm font-medium text-gray-900">Nilai terakhir</h2>
        {nilai.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-gray-400">Belum ada nilai asesmen.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {nilai.map((n, i) => (
              <li key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {n.assessments?.title ?? 'Asesmen'}
                  </p>
                  {n.graded_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.graded_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold tabular-nums text-gray-900 shrink-0">
                  {Number(n.score)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="grid gap-3 sm:grid-cols-2">
        {[
          { href: `/keluarga/${studentId}/materi`, label: 'Materi', desc: 'Bahan belajar per topik' },
          { href: `/keluarga/${studentId}/penguasaan`, label: 'Penguasaan', desc: 'Kekuatan per topik' },
          { href: `/keluarga/${studentId}/laporan`, label: 'Laporan Bulanan', desc: 'Catatan dari tutor' },
          { href: `/keluarga/${studentId}/tagihan`, label: 'Tagihan', desc: 'Invoice & pembayaran' },
        ].map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5 hover:ring-blue-300 transition"
          >
            <p className="text-sm font-medium text-gray-900">{m.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
          </Link>
        ))}
      </nav>
    </div>
  )
}
