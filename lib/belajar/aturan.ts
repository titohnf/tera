/**
 * Aturan bentuk latihan — angka yang harus sama di layar dan di server.
 *
 * Berkas sendiri, dan sengaja TANPA satu pun impor: konstanta ini dipakai oleh
 * komponen browser (`PemilihLatihan`, yang menyebut "10 soal" sebelum tombol
 * mulai ditekan) sekaligus oleh server action (yang membuka sesi lanjutan tanpa
 * bertanya ke browser). Menaruhnya di `sesi.ts` akan menyeret klien Supabase
 * sisi server ikut ke dalam bundel browser.
 */

/**
 * Berapa soal per PAKET — potongan tetap bank soal sebuah topik. Topik berisi
 * 20 soal punya dua paket; yang berisi 11 punya dua juga, yang kedua berisi
 * satu soal saja sampai banknya bertambah.
 *
 * Kembarannya ada di `practice_paket_items()` (migrasi 134), dan di sanalah
 * pembagian yang sesungguhnya terjadi. Yang di sini cuma dipakai menggambar
 * kerangka sebelum datanya datang — kalau keduanya berbeda, yang salah cuma
 * banyaknya kotak abu-abu selama sepersekian detik.
 */
export const SOAL_PER_PAKET = 10
