/**
 * Nama pendek seseorang: satu kata — panggilannya kalau ada, kata pertama nama
 * lengkapnya kalau tidak. Panggilan yang terdiri dari dua kata pun dipangkas
 * ke kata pertamanya.
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

/** Kata pertama sebuah nama. */
export function kataPertama(namaLengkap: string): string {
  return namaLengkap.trim().split(/\s+/)[0] || namaLengkap
}

export function namaPendek(profil: { full_name: string; nickname?: string | null }): string {
  // Panggilan pun dipangkas ke satu kata. Sebagian profil mengisi kolom
  // panggilan dengan dua kata — "Nadia Putri", kadang "Kak Fatih" — dan di
  // tempat-tempat yang memakai nama ini ruangnya selalu sempit: tombol pemilih
  // anak selebar 96px, sapaan di sebelah avatar, deret nama di pesan harian.
  // Satu nama dua kata di antara nama-nama satu kata membuat barisnya terlihat
  // seperti salah muat, dan yang terpotong di tombol malah lebih buruk lagi.
  const panggilan = profil.nickname?.trim()
  return panggilan ? kataPertama(panggilan) : kataPertama(profil.full_name)
}
