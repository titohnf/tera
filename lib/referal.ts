/**
 * Kode referal keluarga — diturunkan, bukan disimpan.
 *
 * Belum ada kolomnya di basis data, dan untuk sekarang itu cukup: akun keluarga
 * dibuat admin, pendaftaran teman pun lewat admin, jadi kode ini tidak pernah
 * dicocokkan oleh mesin. Ia cuma perlu (a) tetap sama setiap kali halaman
 * dibuka, dan (b) berbeda antar keluarga — dua hal yang bisa dipenuhi fungsi
 * murni dari id akun tanpa migrasi apa pun.
 *
 * Kalau nanti kodenya perlu dicari admin atau dimasukkan di formulir
 * pendaftaran, barulah ia pantas jadi kolom sungguhan. Saat itu terjadi, nilai
 * yang sudah beredar di WhatsApp orang tua harus ikut dipindahkan — jangan
 * sekadar mengganti fungsi ini, karena kode lama sudah terlanjur dibagikan.
 */

// Tanpa 0/O, 1/I, 5/S, 8/B: kode ini dibaca orang lalu diketik ulang oleh orang
// lain, dan huruf yang kembar bentuknya adalah satu-satunya cara kode sependek
// ini bisa salah sampai ke admin.
const ABJAD = 'ACDEFGHJKLMNPQRTUVWXYZ23469'
const PANJANG = 6

/** FNV-1a 32-bit — cukup untuk menyebar, tidak dipakai untuk apa pun yang rahasia. */
function fnv1a(teks: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < teks.length; i++) {
    h ^= teks.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * Kode referal untuk sebuah akun keluarga, mis. `TERA-K7QMDX`.
 *
 * Sama untuk id yang sama, selamanya.
 */
export function kodeReferal(profileId: string): string {
  let huruf = ''
  for (let i = 0; i < PANJANG; i++) {
    huruf += ABJAD[fnv1a(`${profileId}:${i}`) % ABJAD.length]
  }
  return `TERA-${huruf}`
}

/**
 * Pesan yang sudah tertulis di WhatsApp orang tua saat tombol bagikan diketuk.
 *
 * Ditulis sebagai pesan dari orang tua ke temannya, bukan dari bimbel ke
 * siapa-siapa — yang mengirimnya adalah orang tua, dan pesan yang berbunyi
 * seperti brosur akan dihapus sebelum dikirim.
 *
 * Kurung siku di kalimat pertama disengaja: alasan tiap keluarga berbeda, dan
 * satu alasan yang kami karang sendiri akan terbaca palsu oleh yang menerimanya.
 * Bentuk kurungnya harus tetap mencolok supaya tidak ada yang mengirimkannya
 * apa adanya tanpa sadar.
 */
export function pesanAjakan(kode: string): string {
  return [
    'Hai! Aku lagi belajar di Bimbel Tera dan ngerasa puas banget karena [Tuliskan apa yang membuat kamu puas belajar di bimbel Tera..]',
    '',
    `Pakai kode ${kode} pas daftar ya, nanti kita berdua dapat bonus voucher Rp50.000.`,
    '',
    'Daftar di: https://bit.ly/DaftarBimbelTera',
  ].join('\n')
}
