import type { Dari } from '@/lib/belajar/permukaan'

/**
 * Alamat halaman materi interaktif satu topik — pasangan `alamatMisi`: keluarga
 * bimbel lewat `/keluarga/<anak>/materi/<kode>`, pelanggan langganan lewat
 * `/belajar/materi/<kode>`. Keduanya merender `components/belajar/IsiMateri`.
 */
export function alamatMateri(anak: string | undefined | null, kode: string, dari?: Dari): string {
  if (!anak) return `/belajar/materi/${kode}`
  // `dari: 'siswa'` = siswa bimbel yang masuk dengan kode: tetap di tampilan siswa.
  return dari === 'siswa' ? `/siswa/${anak}/materi/${kode}` : `/keluarga/${anak}/materi/${kode}`
}
