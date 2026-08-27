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
