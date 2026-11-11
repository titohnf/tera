import type { Nada } from '@/components/admin/laporan-bulanan/TabelLatihanSiswa'

/**
 * Warna sel tabel laporan belajar. Ambangnya sama dengan matriks rekap tutor
 * (`MasteryRecapTable`): dipetakan dari PERSEN, bukan dari label rubrik, karena
 * rubrik bisa punya berapa pun tingkatan dengan nama apa pun.
 */
export function nadaPersen(persen: number): Nada {
  if (persen >= 85) return 'hijau'
  if (persen >= 70) return 'biru'
  if (persen >= 50) return 'kuning'
  return 'merah'
}

/** Terakhir berlatih: > 30 hari merah, > 14 hari kuning, selebihnya tanpa warna. */
export function nadaTerakhir(hari: number): Nada | undefined {
  if (hari > 30) return 'merah'
  if (hari > 14) return 'kuning'
  return undefined
}
