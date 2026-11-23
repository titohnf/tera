import { golonganMapel } from '@/lib/belajar/ikon-mapel'

/**
 * Warna tetap sebuah mapel di seluruh layar siswa. `dasar` untuk isi, `tua`
 * untuk tebing tombol. Dipakai HANYA untuk benda milik mapel itu — warna lain
 * punya arti lain (lihat `docs/desain-siswa.md`).
 */
const WARNA = {
  matematika: { dasar: '#4F46E5', tua: '#3730A3' },
  bahasa: { dasar: '#0284C7', tua: '#075985' },
} as const

const BAWAAN = { dasar: '#475569', tua: '#1E293B' }

export function warnaMapel(mapel: string): { dasar: string; tua: string } {
  const g = golonganMapel(mapel)
  return g in WARNA ? WARNA[g as keyof typeof WARNA] : BAWAAN
}
