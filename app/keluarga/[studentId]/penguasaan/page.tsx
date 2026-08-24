import { createClient } from '@/lib/supabase/server'
import { anakOrRedirect } from '@/lib/keluarga'
import { masteryLabel, type MasteryBand } from '@/lib/reports/mastery-recap'

/**
 * Penguasaan per topik untuk satu anak.
 *
 * Sengaja TIDAK memakai getMasteryRecap(): fungsi itu memakai
 * createAdminClient() dan mengembalikan rekap satu kelas penuh — semua murid.
 * Dipakai di sini, ia akan menyodorkan data anak keluarga lain. Yang dipakai
 * ulang hanya masteryLabel(), yang murni perhitungan.
 */
export default async function PenguasaanPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)
  const supabase = await createClient()

  const { data: learner } = await supabase
    .from('learners')
    .select('id')
    .eq('profile_id', studentId)
    .maybeSingle()

  const { data: jawaban } = learner
    ? await supabase
        .from('practice_answers')
        .select('question_bank_item_id, score, max_score')
        .eq('learner_id', learner.id)
    : { data: null }

  const { data: tags } = await supabase
    .from('question_curriculum_tags')
    .select('question_bank_item_id, group_id')

  const { data: groups } = await supabase
    .from('curriculum_topic_groups')
    .select('id, theme, topic')

  const { data: rubrics } = await supabase
    .from('mastery_rubrics')
    .select('bands')
    .is('subject_id', null)
    .maybeSingle()

  const groupOf = new Map((tags ?? []).map((t) => [t.question_bank_item_id, t.group_id]))
  const namaGroup = new Map(
    (groups ?? []).map((g) => [g.id, `${g.theme ? `${g.theme} — ` : ''}${g.topic}`]),
  )

  const perTopik = new Map<string, { skor: number; maks: number; jumlah: number }>()
  for (const a of jawaban ?? []) {
    const gid = groupOf.get(a.question_bank_item_id)
    if (!gid) continue
    const cur = perTopik.get(gid) ?? { skor: 0, maks: 0, jumlah: 0 }
    cur.skor += Number(a.score ?? 0)
    cur.maks += Number(a.max_score ?? 0)
    cur.jumlah += 1
    perTopik.set(gid, cur)
  }

  const bands = ((rubrics?.bands ?? null) as MasteryBand[] | null)
  const baris = [...perTopik.entries()]
    .map(([gid, v]) => ({
      nama: namaGroup.get(gid) ?? 'Topik',
      persen: v.maks > 0 ? Math.round((v.skor / v.maks) * 100) : 0,
      jumlah: v.jumlah,
    }))
    .sort((a, b) => a.persen - b.persen)

  return (
    <div className="space-y-6">
      {/* Judul dan panah kembalinya ada di bilah atas (`HeaderKeluarga`). */}
      <p className="text-sm text-gray-500">
        Dihitung dari latihan mandiri, diurutkan dari yang paling perlu dikuatkan.
      </p>

      {baris.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
          Belum ada latihan mandiri yang dikerjakan, jadi penguasaannya belum bisa dihitung.
        </p>
      ) : (
        <ul className="rounded-xl bg-white shadow ring-1 ring-gray-900/5 divide-y divide-gray-100">
          {baris.map((b) => {
            const label = masteryLabel(bands, b.persen)
            return (
              <li key={b.nama} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm text-gray-900">{b.nama}</p>
                  <span className="text-sm font-semibold tabular-nums shrink-0">{b.persen}%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${b.persen}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {label ? `${label} · ` : ''}
                  {b.jumlah} soal dikerjakan
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
