/**
 * Alamat halaman materi interaktif satu topik — pasangan `alamatMisi`: siswa
 * bimbel lewat `/siswa/<anak>/materi/<kode>`, pelanggan langganan lewat
 * `/belajar/materi/<kode>`. Keduanya merender `components/belajar/IsiMateri`.
 */
export function alamatMateri(anak: string | undefined | null, kode: string): string {
  return anak ? `/siswa/${anak}/materi/${kode}` : `/belajar/materi/${kode}`
}
