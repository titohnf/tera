import { createClient } from '@/lib/supabase/server'
import type { KemajuanTopikPeta } from '@/lib/belajar/topik-rapor'

/**
 * Mapel topik peta kompetensi. Peta semula hanya Matematika, jadi topik tanpa mapel (peta lama, atau
 * grup yang tidak punya mapel) dianggap Matematika. Dengan begitu hasil Matematika tidak berubah
 * ketika mapel lain ikut masuk.
 */
export const MAPEL_AWAL = 'Matematika'

/** Nama mapel menurut id (`subjects`). Kosong bila gagal dibaca: topik lalu jatuh ke Matematika. */
export async function namaMapelPerId(): Promise<Map<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase.from('subjects').select('id, name')
  return new Map(((data as { id: string; name: string }[] | null) ?? []).map((m) => [m.id, m.name]))
}

export function mapelTopik(t: Pick<KemajuanTopikPeta, 'subjectId'>, nama: Map<string, string>): string {
  return (t.subjectId && nama.get(t.subjectId)) || MAPEL_AWAL
}

/** Urutan tampil mapel: Matematika dulu, sisanya menurut abjad. */
export function urutMapel(a: string, b: string): number {
  return a === MAPEL_AWAL ? (b === MAPEL_AWAL ? 0 : -1) : b === MAPEL_AWAL ? 1 : a.localeCompare(b, 'id')
}

/** Mapel yang punya topik di peta ini, berurutan. */
export function daftarMapelPeta(peta: KemajuanTopikPeta[], nama: Map<string, string>): string[] {
  return [...new Set(peta.map((t) => mapelTopik(t, nama)))].sort(urutMapel)
}

/**
 * Mapel tiap topik peta (topikId → nama mapel), lewat `topik_grup` dan grupnya. Topik tanpa grup, atau
 * yang grupnya tidak bermapel, dianggap Matematika (peta lama). Satu pertanyaan ringan; tabelnya
 * boleh dibaca semua pengguna masuk. Gagal dibaca berarti kosong, dan semua topik jatuh ke Matematika.
 */
export async function mapelPerTopik(): Promise<Map<string, string>> {
  const supabase = await createClient()
  const [grup, nama] = await Promise.all([
    supabase.from('topik_grup').select('topik_id, curriculum_topic_groups(subject_id)'),
    namaMapelPerId(),
  ])
  const hasil = new Map<string, string>()
  type Baris = { topik_id: string; curriculum_topic_groups: { subject_id: string | null } | { subject_id: string | null }[] | null }
  for (const b of (grup.data as Baris[] | null) ?? []) {
    const g = Array.isArray(b.curriculum_topic_groups) ? b.curriculum_topic_groups[0] : b.curriculum_topic_groups
    const nm = g?.subject_id ? nama.get(g.subject_id) : undefined
    if (nm && !hasil.has(b.topik_id)) hasil.set(b.topik_id, nm)
  }
  return hasil
}
