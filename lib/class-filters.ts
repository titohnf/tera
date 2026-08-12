/**
 * Filter status di halaman Kelas.
 *
 * Kelas yang sudah selesai menumpuk tiap semester dan tidak pernah hilang,
 * sementara yang dicari admin hampir selalu kelas yang sedang berjalan — jadi
 * halaman itu default-nya menyaring ke "aktif", bukan menampilkan semua.
 *
 * Karena default-nya bukan "semua", "semua" perlu nilainya sendiri: tanpa itu,
 * memilih "Semua Status" menghasilkan URL tanpa parameter status, yang justru
 * ditafsirkan sebagai default dan menyaring kembali ke aktif.
 */
export const DEFAULT_CLASS_STATUS = 'aktif'
export const ALL_CLASS_STATUS = 'semua'

/** Status efektif dari parameter URL yang boleh saja tidak ada. */
export function resolveClassStatus(raw: string | undefined): string {
  return raw || DEFAULT_CLASS_STATUS
}
