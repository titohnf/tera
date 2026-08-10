/**
 * Rentang keanggotaan siswa di sebuah kelas.
 *
 * Sebuah kelas hidup lebih lama dari keanggotaan siswanya: ada yang masuk di
 * tengah semester, ada yang berhenti sebelum kelasnya selesai. Rentang itu
 * disimpan di `class_students.enrolled_at` / `unenrolled_at` (lihat migrasi
 * 085) dan dipakai untuk menjawab satu pertanyaan yang muncul di mana-mana:
 * sesi ini miliknya atau bukan?
 *
 * Kedua ujungnya inklusif dan berbutir hari — admin memilih tanggal, bukan
 * jam. Tanggalnya disimpan sebagai tengah malam UTC (lihat `dayToIso`) supaya
 * perbandingan cukup dilakukan sebagai string "YYYY-MM-DD", tanpa aritmetika
 * Date dan tanpa bergantung pada timezone server.
 */

export type EnrollmentWindow = {
  enrolled_at: string | null
  unenrolled_at: string | null
  /**
   * Opsional, tapi selalu ikut di-select oleh pemanggil yang menyaring roster.
   * Baris non-aktif tanpa `unenrolled_at` berarti siswa dikeluarkan oleh kode
   * yang belum mengenal rentang ini — tanggal keluarnya tidak diketahui, jadi
   * rentangnya diperlakukan kosong seperti backfill di migrasi 085. Tanpa ini,
   * siswa yang dikeluarkan lewat versi lama muncul kembali di seluruh sesi
   * kelasnya begitu kode baru dipakai.
   */
  is_active?: boolean
}

function hasUnknownExit(window: EnrollmentWindow): boolean {
  return window.is_active === false && !window.unenrolled_at
}

/**
 * Tanggal (YYYY-MM-DD) dari sebuah timestamp ISO.
 *
 * Jadwal sesi disimpan UTC sementara jamnya diisi dalam WIB (UTC+7). Jam
 * belajar 07:00–21:00 WIB jatuh di 00:00–14:00 UTC pada hari yang sama, jadi
 * memotong bagian tanggalnya aman tanpa konversi timezone.
 */
export function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

/** Tanggal pilihan admin (YYYY-MM-DD) menjadi timestamp yang aman disimpan. */
export function dayToIso(day: string): string {
  return `${day}T00:00:00.000Z`
}

/** Apakah sesi pada `scheduledAt` jatuh di dalam rentang keanggotaan. */
export function coversSession(window: EnrollmentWindow, scheduledAt: string): boolean {
  if (hasUnknownExit(window)) return false
  const day = dayKey(scheduledAt)
  if (window.enrolled_at && day < dayKey(window.enrolled_at)) return false
  if (window.unenrolled_at && day > dayKey(window.unenrolled_at)) return false
  return true
}

/** Apakah rentangnya menyentuh bulan "YYYY-MM" — dipakai saat menagih. */
export function coversMonth(window: EnrollmentWindow, month: string): boolean {
  if (hasUnknownExit(window)) return false
  if (window.enrolled_at && month < dayKey(window.enrolled_at).slice(0, 7)) return false
  if (window.unenrolled_at && month > dayKey(window.unenrolled_at).slice(0, 7)) return false
  return true
}

/**
 * Potong rentang tagihan kelas dengan rentang keanggotaan siswa, supaya siswa
 * yang masuk di tengah jalan tidak ditagih bulan-bulan sebelum ia bergabung.
 *
 * Ujung yang null berarti terbuka — kelas tanpa end_date dan siswa yang masih
 * berjalan sama-sama tidak punya batas akhir. Mengembalikan null hanya bila
 * kedua rentang benar-benar tidak beririsan.
 */
export function billingRange(
  window: EnrollmentWindow,
  classStart: string | null,
  classEnd: string | null,
): { start: string | null; end: string | null } | null {
  if (hasUnknownExit(window)) return null
  const starts = [classStart, window.enrolled_at ? dayKey(window.enrolled_at) : null]
    .filter((d): d is string => !!d)
  const ends = [classEnd, window.unenrolled_at ? dayKey(window.unenrolled_at) : null]
    .filter((d): d is string => !!d)

  const start = starts.length > 0 ? starts.sort().at(-1)! : null
  const end = ends.length > 0 ? ends.sort()[0] : null

  if (start && end && start > end) return null
  return { start, end }
}

/** Saring daftar siswa sebuah kelas menjadi yang benar-benar hadir di sesi itu. */
export function rosterForSession<T extends EnrollmentWindow>(
  enrollments: T[],
  scheduledAt: string | null | undefined,
): T[] {
  if (!scheduledAt) return enrollments.filter(e => !hasUnknownExit(e))
  return enrollments.filter(e => coversSession(e, scheduledAt))
}
