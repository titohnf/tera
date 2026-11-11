/**
 * Alamat halaman Misi — satu fungsi, supaya jalur keluarga dan jalur pelanggan
 * tidak menulis tautannya sendiri-sendiri.
 *
 * Keluarga bimbel masuk atas nama seorang anak (`/keluarga/<anak>/misi`);
 * pelanggan langganan (`mandiri`) tidak punya anak, jadi `anak` kosong dan
 * alamatnya `/belajar/misi`. Kedua rute merender komponen yang sama
 * (`components/belajar/IsiMisi`, `IsiTopikMisi`), dan `belajarContext()` yang
 * memutuskan atas nama siapa halamannya bekerja.
 */
export function alamatMisi(anak: string | undefined | null, topikId?: string): string {
  const dasar = anak ? `/keluarga/${anak}/misi` : '/belajar/misi'
  return topikId ? `${dasar}/${topikId}` : dasar
}
