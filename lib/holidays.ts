/**
 * Bentuk data dan pilihan jenis hari libur.
 *
 * Sengaja terpisah dari lib/actions/admin/holidays.ts. File itu bertanda
 * `'use server'`, dan Next mengubah SETIAP export di file semacam itu menjadi
 * rujukan server action — termasuk konstanta biasa. HOLIDAY_KINDS yang diimpor
 * komponen klien dari sana sampai sebagai fungsi, bukan array, dan halaman
 * Kalender Libur langsung mati dengan "find is not a function" begitu barisnya
 * dirender. Konstanta yang dipakai dua sisi harus tinggal di modul netral.
 */

export type HolidayKind = 'nasional' | 'cuti_bersama' | 'internal'

export const HOLIDAY_KINDS: { value: HolidayKind; label: string }[] = [
  { value: 'nasional', label: 'Libur Nasional' },
  { value: 'cuti_bersama', label: 'Cuti Bersama' },
  { value: 'internal', label: 'Libur Bimbel' },
]

export type Holiday = {
  id: string
  holiday_date: string
  name: string
  kind: HolidayKind
  notes: string | null
}

/** Sesi yang jatuh di tanggal libur dan belum dibatalkan. */
export type ClashingSession = {
  id: string
  scheduled_at: string
  className: string
  tutorName: string
}
