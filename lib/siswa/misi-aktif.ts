import { createAdminClient } from '@/lib/supabase/server-admin'
import { petaTopik, type TopikPeta } from '@/lib/belajar/topik-peta'
import { langkahSeluruhTopik, paketRingkasSeluruhTopik, type LangkahTopik, type PaketRingkas } from '@/lib/belajar/langkah'
import { MAPEL_AWAL, mapelPerTopik } from '@/lib/belajar/mapel-peta'
import { pilihTopikSekarang } from '@/lib/belajar/topik-sekarang'
import { todayWib } from '@/lib/daily-message'

export interface MisiAktif {
  /** Topik giliran sekarang (aturan yang sama dengan peta Misi). */
  sekarang: TopikPeta
  langkah: LangkahTopik | undefined
  paket: PaketRingkas[]
  /** Kode dan nama seluruh topik Matematika, untuk keterangan prasyarat di lembar topik. */
  namaTopik: [string, string][]
  kelas: number | null
  hariIni: string
  kemajuan: { tuntas: number; total: number }
}

/**
 * Data kartu Misi di beranda siswa: topik yang sedang aktif beserta langkah dan
 * paketnya, plus kemajuan Matematika. Hanya MEMBACA, dan gagal apa pun dijawab
 * null — beranda lalu memakai kartu umum. Pemanggil harus sudah memastikan
 * `studentId` milik pengguna (`anakOrRedirect`), karena kelasnya dibaca dengan
 * klien admin.
 */
export async function misiAktif(studentId: string, learnerId: string): Promise<MisiAktif | null> {
  try {
    const [peta, mapel, langkah, paket, profil] = await Promise.all([
      petaTopik(learnerId),
      mapelPerTopik(),
      langkahSeluruhTopik(learnerId),
      paketRingkasSeluruhTopik(learnerId),
      createAdminClient().from('profiles').select('grade').eq('id', studentId).maybeSingle(),
    ])
    const topik = peta.filter((t) => (mapel.get(t.id) ?? MAPEL_AWAL) === MAPEL_AWAL)
    if (topik.length === 0) return null
    const kelas = (profil.data as { grade: number | null } | null)?.grade ?? null
    const sekarang = pilihTopikSekarang(topik, kelas, langkah)
    if (!sekarang) return null
    // Tanpa langkahnya (kueri gagal atau melewati batas waktu — keduanya dicatat dan menghasilkan daftar kosong),
    // lembar topik tidak punya tombol "Mulai": lebih baik beranda memakai hero umum menuju halaman Misi.
    const langkahSekarang = langkah.find((l) => l.topikId === sekarang.id)
    if (!langkahSekarang) return null
    return {
      sekarang,
      langkah: langkahSekarang,
      paket: paket.filter((p) => p.topikId === sekarang.id),
      namaTopik: topik.map((t) => [t.id, t.nama]),
      kelas,
      hariIni: todayWib(),
      kemajuan: { tuntas: topik.filter((t) => t.status === 'tuntas').length, total: topik.length },
    }
  } catch {
    return null
  }
}
