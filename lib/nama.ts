/**
 * Nama pendek seseorang: panggilannya kalau ada, kata pertama kalau tidak.
 *
 * Aturan ini sudah lama dipakai pesan harian WhatsApp — "Fatih & Anka" jauh
 * lebih terbaca daripada dua nama lengkap berjejer — dan sekarang dipakai juga
 * oleh bilah pemilih anak di portal keluarga, yang harus memuat dua sampai tiga
 * nama dalam satu baris selebar 390px.
 *
 * Diangkat ke berkas sendiri supaya keduanya menjawab dengan cara yang sama.
 * Aturan seperti ini yang disalin akan menyimpang pelan-pelan, dan yang
 * menemukan selisihnya adalah orang tua yang membaca "Fatih" di pesan WhatsApp
 * lalu "Muhammad" di tab portal.
 */

/** Kata pertama sebuah nama — cadangan saat profil belum punya panggilan. */
export function kataPertama(namaLengkap: string): string {
  return namaLengkap.trim().split(/\s+/)[0] || namaLengkap
}

export function namaPendek(profil: { full_name: string; nickname?: string | null }): string {
  return profil.nickname?.trim() || kataPertama(profil.full_name)
}
