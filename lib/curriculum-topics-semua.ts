import type { SupabaseClient } from '@supabase/supabase-js'

export interface BarisTopikKurikulum {
  id: string
  group_id: string | null
  curriculum: string
  grade_level: string
  semester: number
  theme: string | null
  topic: string
  learning_outcomes: string | null
}

const UKURAN_HALAMAN = 1000

/**
 * SELURUH baris `curriculum_topics` satu mapel, bukan 1000 pertama.
 *
 * PostgREST memotong hasil di 1000 baris tanpa memberi tahu. Matematika memuat
 * semua kelas dan semester, ditambah Fondasi Berhitung dan Misi (migrasi 214 dan
 * 216), jadi satu kueri polos membuang sebagian kurikulum diam-diam: topiknya
 * ada di database tetapi tidak pernah sampai ke pilihan tutor. Diurutkan
 * `sort_order` lalu `id` supaya halaman-halamannya tidak saling tumpang tindih.
 */
export async function semuaTopikKurikulum(
  db: SupabaseClient,
  subjectId: string,
): Promise<{ data: BarisTopikKurikulum[] }> {
  const hasil: BarisTopikKurikulum[] = []
  for (let dari = 0; ; dari += UKURAN_HALAMAN) {
    const { data } = await db
      .from('curriculum_topics')
      .select('id, group_id, curriculum, grade_level, semester, theme, topic, learning_outcomes')
      .eq('subject_id', subjectId)
      .order('sort_order')
      .order('id')
      .range(dari, dari + UKURAN_HALAMAN - 1)
    const halaman = (data ?? []) as BarisTopikKurikulum[]
    hasil.push(...halaman)
    if (halaman.length < UKURAN_HALAMAN) break
  }
  return { data: hasil }
}
