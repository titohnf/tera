/**
 * Materi kurikulum untuk topik sebuah sesi.
 *
 * Satu penelusuran yang dipakai dua tempat — rincian sesi di portal keluarga
 * dan jurnal tutor — supaya keduanya tidak pernah menjawab berbeda untuk sesi
 * yang sama. Kalau keluarga melihat materi tetapi tutor tetap disodori kolom
 * kosong untuk menempel tautan, yang terjadi persis pekerjaan ganda yang sedang
 * dihapuskan.
 *
 * Topiknya datang dari dua kolom sekaligus: `curriculum_topic_id` (topik utama
 * sesi) dan `selected_cp_ids` (CP yang dicentang tutor). Keduanya menunjuk baris
 * `curriculum_topics` yang berbagi `group_id`, dan sebuah sesi sering hanya
 * mengisi salah satunya.
 *
 * Hanya yang `readable_at`-nya terisi (migrasi 127). Yang belum terjangkau tidak
 * pantas disebut kepada siapa pun: bagi keluarga ia tautan yang berakhir di
 * layar "Anda memerlukan akses", dan bagi tutor ia alasan palsu untuk berhenti
 * melampirkan bahan yang memang belum ada.
 *
 * Menerima klien apa pun — pemanggil di portal keluarga memakai service role
 * (haknya sudah diperiksa `bolehBacaMurid`), pemanggil di jurnal tutor memakai
 * klien sesi. Yang memutuskan tetap pemanggilnya, bukan fungsi ini.
 */
/**
 * Sengaja longgar.
 *
 * Fungsi ini dipanggil dengan dua klien yang generic-nya berbeda — klien sesi
 * dan service role — dan menuliskan bentuk kueri Supabase sebagai tipe
 * struktural membuat TypeScript menyerah dengan "type instantiation is
 * excessively deep". Yang dijaga di sini kebenaran DATANYA, dan itu ditegakkan
 * di bawah lewat cast eksplisit pada hasilnya, bukan lewat tipe parameternya.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Klien = { from: (tabel: string) => any }

export interface MateriSesi {
  id: string
  title: string
  groupId: string
}

export async function materiKurikulumSesi(
  db: Klien,
  curriculumTopicId: string | null,
  selectedCpIds: string[] | null,
): Promise<MateriSesi[]> {
  const cpIds = [...new Set([...(curriculumTopicId ? [curriculumTopicId] : []), ...(selectedCpIds ?? [])])]
  if (cpIds.length === 0) return []

  const { data: cpRows } = await db.from('curriculum_topics').select('group_id').in('id', cpIds)
  const grup = [
    ...new Set(
      ((cpRows as { group_id: string | null }[] | null) ?? [])
        .map((r) => r.group_id)
        .filter((g): g is string => !!g),
    ),
  ]
  if (grup.length === 0) return []

  const { data } = await db
    .from('curriculum_resources')
    .select('id, title, group_id')
    .in('group_id', grup)
    .eq('kind', 'materi')
    .not('readable_at', 'is', null)
    .order('title')

  return ((data as { id: string; title: string; group_id: string | null }[] | null) ?? [])
    .filter((r) => r.group_id)
    .map((r) => ({ id: r.id, title: r.title, groupId: r.group_id as string }))
}

/**
 * Sesi mana saja yang topiknya sudah bermateri kurikulum — untuk banyak sesi
 * sekaligus.
 *
 * `materiKurikulumSesi()` menjawab satu sesi dan mengembalikan materinya;
 * daftar sesi di halaman kelas hanya perlu tahu ADA atau TIDAK, untuk ratusan
 * sesi, dan memanggil fungsi itu sekali per sesi berarti ratusan bolak-balik ke
 * basis data. Yang ini menjawab seluruh daftar dengan dua kueri.
 *
 * Aturannya sengaja sama persis dengan `materiKurikulumSesi()` — kind 'materi'
 * dan `readable_at` terisi — supaya lencana "Materi" di daftar kelas tidak
 * pernah berselisih dengan yang dilihat tutor di dalam sesinya.
 */
export async function sesiBermateriKurikulum(
  db: Klien,
  sesi: { id: string; curriculum_topic_id?: string | null; selected_cp_ids?: string[] | null }[],
): Promise<Set<string>> {
  const cpPerSesi = new Map<string, string[]>()
  for (const s of sesi) {
    const ids = [...new Set([...(s.curriculum_topic_id ? [s.curriculum_topic_id] : []), ...(s.selected_cp_ids ?? [])])]
    if (ids.length > 0) cpPerSesi.set(s.id, ids)
  }
  const semuaCp = [...new Set([...cpPerSesi.values()].flat())]
  if (semuaCp.length === 0) return new Set()

  const { data: cpRows } = await db.from('curriculum_topics').select('id, group_id').in('id', semuaCp)
  const grupPerCp = new Map<string, string>()
  for (const r of ((cpRows as { id: string; group_id: string | null }[] | null) ?? [])) {
    if (r.group_id) grupPerCp.set(r.id, r.group_id)
  }
  const grup = [...new Set([...grupPerCp.values()])]
  if (grup.length === 0) return new Set()

  const { data: resRows } = await db
    .from('curriculum_resources')
    .select('group_id')
    .in('group_id', grup)
    .eq('kind', 'materi')
    .not('readable_at', 'is', null)
  const grupBermateri = new Set(
    ((resRows as { group_id: string | null }[] | null) ?? []).map((r) => r.group_id).filter((g): g is string => !!g),
  )

  const hasil = new Set<string>()
  for (const [sesiId, cpIds] of cpPerSesi) {
    if (cpIds.some((cp) => { const g = grupPerCp.get(cp); return g && grupBermateri.has(g) })) hasil.add(sesiId)
  }
  return hasil
}
