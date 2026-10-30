/**
 * Kontak admin Tera. Satu sumber untuk nomor WhatsApp yang dipakai tautan
 * "Hubungi admin" di seluruh aplikasi (digit internasional, tanpa +).
 */
export const NOMOR_WA_ADMIN = '6281315502949'

export function tautanWaAdmin(pesan: string): string {
  return `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent(pesan)}`
}
