/**
 * Kategori nilai try out, sama dengan rumus di spreadsheet "Db Nilai TO" (kolom kategori di samping
 * rata-rata skor): >= 85 Istimewa, >= 70 Baik, >= 55 Memadai, di bawah itu Kurang.
 */
export type KategoriNilai = 'Istimewa' | 'Baik' | 'Memadai' | 'Kurang'

export function kategoriNilai(nilai: number | null): KategoriNilai | null {
  if (nilai === null) return null
  if (nilai >= 85) return 'Istimewa'
  if (nilai >= 70) return 'Baik'
  if (nilai >= 55) return 'Memadai'
  return 'Kurang'
}

/** Warna lencana tiap kategori (kelas Tailwind). */
export const WARNA_KATEGORI: Record<KategoriNilai, string> = {
  Istimewa: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Baik: 'bg-sky-100 text-sky-800 ring-sky-200',
  Memadai: 'bg-amber-100 text-amber-800 ring-amber-200',
  Kurang: 'bg-red-100 text-red-700 ring-red-200',
}
