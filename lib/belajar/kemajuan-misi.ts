import { petaTopik } from '@/lib/belajar/topik-peta'
import { MAPEL_AWAL, mapelPerTopik } from '@/lib/belajar/mapel-peta'

/**
 * Kemajuan Misi Matematika seorang pelajar: topik yang tuntas dari seluruhnya.
 * Dibaca dari `petaTopik()`; null bila gagal dibaca atau belum ada topiknya, dan
 * pemanggil menampilkan kartunya tanpa baris kemajuan. Tidak memanggil
 * `belajarContext()` — pemanggil sudah tahu `learnerId`-nya.
 */
export async function kemajuanMisi(learnerId: string): Promise<{ tuntas: number; total: number } | null> {
  try {
    const [peta, mapel] = await Promise.all([petaTopik(learnerId), mapelPerTopik()])
    const topik = peta.filter((t) => (mapel.get(t.id) ?? MAPEL_AWAL) === MAPEL_AWAL)
    if (topik.length === 0) return null
    return { tuntas: topik.filter((t) => t.status === 'tuntas').length, total: topik.length }
  } catch {
    return null
  }
}
