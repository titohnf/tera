import { kelompokkanPeta } from '@/lib/belajar/fringe'
import type { LangkahTopik } from '@/lib/belajar/langkah'
import type { TopikPeta } from '@/lib/belajar/topik-peta'

/**
 * MISI HARI INI = topik pertama menurut urutan sistem yang bisa langsung
 * dikerjakan. Satu-satunya tempat aturan ini ditulis: dipakai peta Misi
 * (`PetaTopik`) dan kartu Misi di beranda siswa, supaya keduanya selalu
 * menunjuk topik yang sama.
 *
 * Dipilih dari `siap` saja — tawaran utama tidak pernah topik yang
 * prasyaratnya belum lengkap atau yang di atas jenjang anak. Tanpa yang siap
 * dikerjakan langsung, jatuh ke topik siap pertama; tanpa itu, null.
 */
export function pilihTopikSekarang(
  topik: TopikPeta[],
  kelas: number | null,
  langkah: LangkahTopik[]
): TopikPeta | null {
  const { siap } = kelompokkanPeta(topik, kelas)
  const perTopik = new Map(langkah.map(l => [l.topikId, l]))
  const bisa = (t: TopikPeta) => {
    const l = perTopik.get(t.id)
    return l != null && l.paketId != null && !l.terkunci
  }
  return siap.find(bisa) ?? siap[0] ?? null
}
