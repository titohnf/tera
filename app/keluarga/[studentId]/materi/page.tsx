import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { anakOrRedirect } from '@/lib/keluarga'

/**
 * Materi untuk topik yang benar-benar dipelajari anak ini.
 *
 * Bukan seluruh materi satu mapel: yang berguna bagi keluarga adalah bahan dari
 * topik yang sudah atau akan dibahas di sesinya, bukan katalog kurikulum penuh.
 * Topiknya dikumpulkan dari sesi anak — baik `curriculum_topic_id` (topik
 * utama sesi) maupun `selected_cp_ids` (CP yang dicentang tutor), karena
 * keduanya menunjuk baris `curriculum_topics` yang berbagi `group_id` yang sama.
 *
 * `kind = 'latihan_soal'` sengaja TIDAK ditampilkan. Itu bahan untuk menyusun soal
 * dan bisa memuat kunci jawaban; yang pantas dibuka ke keluarga hanya materi.
 */
export default async function MateriPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { anak } = await anakOrRedirect(studentId)
  const supabase = await createClient()

  const { data: kelas } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId)
    .eq('is_active', true)
  const classIds = (kelas ?? []).map((k) => k.class_id)

  const { data: sesi } = classIds.length
    ? await supabase
        .from('sessions')
        .select('curriculum_topic_id, selected_cp_ids')
        .in('class_id', classIds)
    : { data: null }

  const topicRowIds = new Set<string>()
  for (const s of sesi ?? []) {
    if (s.curriculum_topic_id) topicRowIds.add(s.curriculum_topic_id)
    for (const cp of (s.selected_cp_ids as string[] | null) ?? []) topicRowIds.add(cp)
  }

  const { data: topikRows } = topicRowIds.size
    ? await supabase
        .from('curriculum_topics')
        .select('id, group_id, theme, topic')
        .in('id', [...topicRowIds])
    : { data: null }

  // Beberapa baris (topik utama dan CP-nya) menunjuk group yang sama; yang
  // dipakai adalah group-nya, bukan barisnya.
  const groupLabel = new Map<string, string>()
  for (const t of topikRows ?? []) {
    if (!t.group_id) continue
    groupLabel.set(t.group_id, `${t.theme ? `${t.theme} — ` : ''}${t.topic ?? ''}`.trim())
  }

  const { data: resources } = groupLabel.size
    ? await supabase
        .from('curriculum_resources')
        .select('id, title, link_url, kind, group_id')
        .in('group_id', [...groupLabel.keys()])
        .eq('kind', 'materi')
        .order('title')
    : { data: null }

  const perTopik = new Map<string, { id: string; title: string; link_url: string }[]>()
  for (const r of resources ?? []) {
    if (!r.group_id) continue
    perTopik.set(r.group_id, [...(perTopik.get(r.group_id) ?? []), r])
  }

  const bagian = [...perTopik.entries()]
    .map(([gid, items]) => ({ judul: groupLabel.get(gid) || 'Topik', items }))
    .sort((a, b) => a.judul.localeCompare(b.judul))

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/keluarga/${studentId}`} className="text-xs text-gray-400 hover:text-gray-600">
          ← {anak.full_name}
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-1">Materi</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Bahan belajar untuk topik yang dibahas di sesi {anak.full_name}.
        </p>
      </div>

      {bagian.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
          {topicRowIds.size === 0
            ? 'Belum ada sesi yang mencatat topik kurikulum, jadi materinya belum bisa ditampilkan.'
            : 'Belum ada materi yang diunggah untuk topik yang sudah dibahas.'}
        </p>
      ) : (
        <div className="space-y-4">
          {bagian.map((b) => (
            <section key={b.judul} className="rounded-xl bg-white shadow ring-1 ring-gray-900/5">
              <h2 className="px-5 pt-4 pb-2 text-sm font-medium text-gray-900">{b.judul}</h2>
              <ul className="divide-y divide-gray-100">
                {b.items.map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-900">{r.title}</span>
                      <span className="text-xs text-blue-600 shrink-0">Buka →</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
