/**
 * Alamat halaman Misi — satu fungsi, supaya jalur siswa dan jalur pelanggan
 * tidak menulis tautannya sendiri-sendiri.
 *
 * Siswa bimbel yang masuk dengan kode mengerjakan Misi di tampilan siswanya
 * (`/siswa/<anak>/misi`); tampilan keluarga hanya untuk memantau dan tidak lagi
 * punya Misi. Pelanggan langganan (`mandiri`) tidak punya anak, jadi `anak`
 * kosong dan alamatnya `/belajar/misi`. Kedua rute merender komponen yang sama
 * (`components/belajar/IsiMisi`, `IsiTopikMisi`), dan `belajarContext()` yang
 * memutuskan atas nama siapa halamannya bekerja.
 */
export function alamatMisi(anak: string | undefined | null, topikId?: string): string {
  const dasar = anak ? `/siswa/${anak}/misi` : '/belajar/misi'
  return topikId ? `${dasar}/${topikId}` : dasar
}
