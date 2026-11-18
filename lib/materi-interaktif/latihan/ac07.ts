import { bs, debat, isi, kata, pg, type DataMateri } from '../bersama'

/**
 * Bahan latihan AC-07 (Urutkan, sortir, kelompokkan, sajikan data: piktogram).
 *
 * Konsep yang diuji bank soal topik ini, dan ini lebih luas dari yang tampak:
 * istilah (mengelompokkan atau menyortir, piktogram), kelompokkan dengan SATU
 * kriteria sekali, mengurutkan, membaca piktogram, SELISIH dan JUMLAH dari
 * piktogram, dan terutama PIKTOGRAM BERSKALA (1 gambar = 2, 3, 4, 5): jumlah
 * data sebenarnya = jumlah gambar x skala, dan piktogram dengan skala berbeda
 * tidak bisa dibandingkan hanya dari jumlah gambar.
 *
 * Soal dengan gambar dituliskan sebagai baris emoji pada kolom `v`.
 */
export const DATA_AC07: DataMateri = {
  fakta: [
    bs('Piktogram menyajikan data dengan gambar atau simbol.', true, 'Tiap gambar mewakili sejumlah data.'),
    bs('Memisahkan benda ke dalam kelompok menurut ciri tertentu disebut mengelompokkan.', true, 'Misalnya menurut warna, bentuk, atau ukuran.'),
    bs('Kelompokkan benda dengan SATU ciri pada satu waktu, misalnya hanya warna.', true, 'Satu kriteria sekali membuat kelompoknya jelas dan tidak tercampur.'),
    bs('Jika 1 gambar = 1 anak, jumlah gambar sama dengan jumlah anak.', true, 'Satu gambar mewakili satu anak. Hitung gambarnya.'),
    bs('Jika 1 gambar = 2 anak, jumlah gambar sama dengan jumlah anak.', false, 'Kalikan dengan 2. Contoh: 5 gambar = 5 × 2 = 10 anak.'),
    bs('Gambar apel boleh dipakai untuk menunjukkan jumlah anak yang suka jeruk.', false, 'Gambar harus sesuai kategorinya: jeruk dengan gambar jeruk.'),
    bs('Pada satu piktogram, gambar yang sama harus berukuran sama dan mewakili jumlah yang sama.', true, 'Gambar kecil dan besar yang dicampur membuat jumlahnya membingungkan.'),
    bs('Pada piktogram berskala sama, kategori dengan gambar paling banyak punya data paling banyak.', true, 'Skala sama, jadi gambar yang lebih banyak berarti data yang lebih banyak.'),
    bs('Dua piktogram memakai skala berbeda. Kita cukup membandingkan jumlah gambarnya.', false, 'Baca skalanya dulu dan kalikan. Gambar yang sama banyak bisa mewakili data yang berbeda.'),
    bs('Sebelum membuat piktogram, hitung dulu banyaknya data tiap kategori.', true, 'Dari hitungan itu baru ditentukan banyak gambarnya.'),
    bs('Mengurutkan data berarti menyusun dari yang paling sedikit ke paling banyak, atau sebaliknya.', true, 'Dua arah urutan: naik atau turun.'),
  ],
  debat: [
    debat('Sinta dan Doni mengelompokkan sekumpulan topi.', ['Sinta: "Aku kelompokkan menurut warna sekaligus ukuran."', 'Doni: "Pilih satu ciri dulu, misalnya warna. Baru kelompoknya jelas."'], 1, 'Satu kriteria pada satu waktu membuat kelompok rapi dan tidak tumpang tindih.'),
    debat('Nadia dan Rian membandingkan dua piktogram dengan skala berbeda.', ['Nadia: "Lihat jumlah gambarnya saja."', 'Rian: "Lihat skalanya dan kalikan dulu."'], 1, 'Skala menentukan berapa data yang diwakili satu gambar.'),
    debat('Piktogram: Kucing 4 gambar, Ikan 7 gambar. Setiap gambar mewakili 2 siswa.', ['Yoga: "Ikan 7 siswa."', 'Lina: "Ikan 7 × 2 = 14 siswa."'], 1, 'Kalikan jumlah gambar dengan skalanya: 7 × 2 = 14.'),
    debat('Piktogram: Merah 5 gambar. Setiap gambar mewakili 2 siswa.', ['Rian: "Ada 5 siswa suka merah."', 'Tia: "Ada 5 × 2 = 10 siswa suka merah."'], 1, 'Satu gambar bukan satu siswa. Satu gambar = 2 siswa.'),
    debat('Lisa membuat piktogram buah favorit.', ['Lisa: "Aku pakai gambar pisang untuk anak yang suka mangga."', 'Dika: "Jangan. Pakai gambar mangga untuk anak yang suka mangga."'], 1, 'Gambar harus sesuai kategorinya supaya piktogram mudah dibaca.'),
  ],
  bank: [
    isi('Berapa anak yang suka jeruk?', '10', '5 gambar × 2 = 10 anak.', 'Buah favorit (1 gambar = 2 anak)\nApel: 🍎🍎🍎\nJeruk: 🍊🍊🍊🍊🍊'),
    isi('Berapa buku cerita yang terjual?', '12', '4 gambar × 3 = 12 buku.', 'Buku terjual (1 gambar = 3 buku)\nCerita: 📘📘📘📘\nKomik: 📙📙'),
    isi('Berapa porsi bakso dan es krim seluruhnya?', '40', '4 + 6 = 10 gambar. 10 × 4 = 40 porsi.', 'Jajanan terjual (1 gambar = 4 porsi)\nBakso: 🍜🍜🍜🍜\nEs krim: 🍦🍦🍦🍦🍦🍦'),
    isi('Berapa selisih siswa yang suka sepak bola dan renang?', '3', '8 − 5 = 3 siswa.', 'Olahraga favorit (1 gambar = 1 siswa)\nSepak bola: ⚽⚽⚽⚽⚽⚽⚽⚽\nRenang: 🏊🏊🏊🏊🏊'),
    isi('Robot terjual lebih banyak daripada boneka. Berapa selisihnya?', '20', '7 − 3 = 4 gambar. 4 × 5 = 20 mainan.', 'Mainan terjual (1 gambar = 5 mainan)\nRobot: 🤖🤖🤖🤖🤖🤖🤖\nBoneka: 🧸🧸🧸'),
    isi('Berapa anak yang punya ikan?', '14', '7 gambar × 2 = 14 anak.', 'Hewan peliharaan (1 gambar = 2 anak)\nKucing: 🐱🐱🐱🐱\nIkan: 🐟🐟🐟🐟🐟🐟🐟'),
    pg('Hewan apa yang paling banyak disukai?', ['Anjing', 'Kucing', 'Kelinci', 'sama banyak'], 0, 'Anjing punya gambar paling banyak (9). Skalanya sama.', 'Hewan favorit (1 gambar = 1 siswa)\nKucing: 🐱🐱🐱🐱🐱🐱\nAnjing: 🐶🐶🐶🐶🐶🐶🐶🐶🐶\nKelinci: 🐰🐰🐰🐰'),
    pg('Bentuk diurutkan dari yang PALING SEDIKIT ke PALING BANYAK. Ada 5 segitiga, 3 lingkaran, dan 7 persegi. Urutan yang benar adalah...', ['lingkaran, segitiga, persegi', 'persegi, segitiga, lingkaran', 'segitiga, lingkaran, persegi', 'lingkaran, persegi, segitiga'], 0, '3 (lingkaran), 5 (segitiga), 7 (persegi).'),
    pg('Skalanya 1 gambar = 5 anak. Ada 20 anak suka merah dan 10 anak suka biru. Berapa gambar untuk tiap warna?', ['4 gambar dan 2 gambar', '20 gambar dan 10 gambar', '5 gambar dan 2 gambar', '2 gambar dan 4 gambar'], 0, '20 dibagi 5 = 4 gambar. 10 dibagi 5 = 2 gambar.'),
    kata('Cara menyajikan data dengan gambar disebut...', ['piktogram'], 'Piktogram = data yang disajikan dengan gambar.'),
    kata('Memisahkan benda ke dalam kelompok menurut ciri tertentu disebut mengelompokkan atau...', ['menyortir', 'sortir', 'mensortir', 'memilah'], 'Mengelompokkan juga disebut menyortir atau memilah.'),
    pg('Piktogram A: 4 gambar, 1 gambar = 2 anak. Piktogram B: 4 gambar, 1 gambar = 5 anak. Mana yang mewakili lebih banyak anak?', ['piktogram B', 'piktogram A', 'sama banyak', 'tidak bisa diketahui'], 0, 'A: 4 × 2 = 8 anak. B: 4 × 5 = 20 anak. Jumlah gambarnya sama, datanya beda.'),
    pg('Manakah yang bisa dipakai sebagai ciri untuk mengelompokkan sekumpulan pensil?', ['warna pensil', 'rasa pensil', 'suara pensil', 'bau pensil'], 0, 'Ciri yang bisa dilihat dan dibandingkan, seperti warna, panjang, atau merek.'),
    isi('12 anak suka merah dan 8 anak suka biru. Jika 1 gambar = 4 anak, berapa gambar untuk merah?', '3', '12 dibagi 4 = 3 gambar.'),
  ],
}
