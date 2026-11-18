import { bs, debat, isi, kata, pg, type DataMateri } from '../bersama'
import { baris } from '../gambar'

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
    bs('Piktogram menyajikan data dengan gambar atau simbol.', true, 'Tiap gambar mewakili sejumlah data.', baris([{ e: '\u{1F34E}', n: 4, l: 'Apel' }, { e: '\u{1F34C}', n: 2, l: 'Pisang' }], '1 gambar = 1 anak')),
    bs('Memisahkan benda ke dalam kelompok menurut ciri tertentu disebut mengelompokkan.', true, 'Misalnya menurut warna, bentuk, atau ukuran.', baris([{ e: '\u{1F534}', n: 3, l: 'Merah' }, { e: '\u{1F535}', n: 2, l: 'Biru' }])),
    bs('Kelompokkan benda dengan SATU ciri pada satu waktu, misalnya hanya warna.', true, 'Satu kriteria sekali membuat kelompoknya jelas dan tidak tercampur.', baris([{ e: '\u{1F534}', n: 3, l: 'Merah' }, { e: '\u{1F535}', n: 2, l: 'Biru' }])),
    bs('Jika 1 gambar = 1 anak, jumlah gambar sama dengan jumlah anak.', true, 'Satu gambar mewakili satu anak. Hitung gambarnya.', baris([{ e: '\u{1F34E}', n: 5, l: 'Apel' }], '1 gambar = 1 anak')),
    bs('Jika 1 gambar = 2 anak, jumlah gambar sama dengan jumlah anak.', false, 'Kalikan dengan 2. Contoh: 5 gambar = 5 × 2 = 10 anak.', baris([{ e: '\u{1F34E}', n: 5, l: 'Apel' }], '1 gambar = 2 anak')),
    bs('Gambar apel boleh dipakai untuk menunjukkan jumlah anak yang suka jeruk.', false, 'Gambar harus sesuai kategorinya: jeruk dengan gambar jeruk.', baris([{ e: '\u{1F34E}', n: 4, l: 'Jeruk' }])),
    bs('Pada satu piktogram, gambar yang sama harus berukuran sama dan mewakili jumlah yang sama.', true, 'Gambar kecil dan besar yang dicampur membuat jumlahnya membingungkan.'),
    bs('Pada piktogram berskala sama, kategori dengan gambar paling banyak punya data paling banyak.', true, 'Skala sama, jadi gambar yang lebih banyak berarti data yang lebih banyak.', baris([{ e: '\u{1F431}', n: 3, l: 'Kucing' }, { e: '\u{1F436}', n: 6, l: 'Anjing' }], '1 gambar = 1 anak')),
    bs('Dua piktogram memakai skala berbeda. Kita cukup membandingkan jumlah gambarnya.', false, 'Baca skalanya dulu dan kalikan. Gambar yang sama banyak bisa mewakili data yang berbeda.', [baris([{ e: '\u{1F34E}', n: 4, l: 'A' }], '1 gambar = 2 anak'), baris([{ e: '\u{1F34A}', n: 4, l: 'B' }], '1 gambar = 5 anak')]),
    bs('Sebelum membuat piktogram, hitung dulu banyaknya data tiap kategori.', true, 'Dari hitungan itu baru ditentukan banyak gambarnya.'),
    bs('Mengurutkan data berarti menyusun dari yang paling sedikit ke paling banyak, atau sebaliknya.', true, 'Dua arah urutan: naik atau turun.'),
  ],
  debat: [
    debat('Sinta dan Doni mengelompokkan sekumpulan topi.', ['Sinta: "Aku kelompokkan menurut warna sekaligus ukuran."', 'Doni: "Pilih satu ciri dulu, misalnya warna. Baru kelompoknya jelas."'], 1, 'Satu kriteria pada satu waktu membuat kelompok rapi dan tidak tumpang tindih.'),
    debat('Nadia dan Rian membandingkan dua piktogram dengan skala berbeda.', ['Nadia: "Lihat jumlah gambarnya saja."', 'Rian: "Lihat skalanya dan kalikan dulu."'], 1, 'Skala menentukan berapa data yang diwakili satu gambar.', [baris([{ e: '\u{1F34E}', n: 4, l: 'A' }], '1 gambar = 2 anak'), baris([{ e: '\u{1F34A}', n: 4, l: 'B' }], '1 gambar = 5 anak')]),
    debat('Piktogram: Kucing 4 gambar, Ikan 7 gambar. Setiap gambar mewakili 2 siswa.', ['Yoga: "Ikan 7 siswa."', 'Lina: "Ikan 7 × 2 = 14 siswa."'], 1, 'Kalikan jumlah gambar dengan skalanya: 7 × 2 = 14.', baris([{ e: '\u{1F431}', n: 4, l: 'Kucing' }, { e: '\u{1F41F}', n: 7, l: 'Ikan' }], '1 gambar = 2 siswa')),
    debat('Piktogram: Merah 5 gambar. Setiap gambar mewakili 2 siswa.', ['Rian: "Ada 5 siswa suka merah."', 'Tia: "Ada 5 × 2 = 10 siswa suka merah."'], 1, 'Satu gambar bukan satu siswa. Satu gambar = 2 siswa.', baris([{ e: '\u{1F534}', n: 5, l: 'Merah' }], '1 gambar = 2 siswa')),
    debat('Lisa membuat piktogram buah favorit.', ['Lisa: "Aku pakai gambar pisang untuk anak yang suka mangga."', 'Dika: "Jangan. Pakai gambar mangga untuk anak yang suka mangga."'], 1, 'Gambar harus sesuai kategorinya supaya piktogram mudah dibaca.', baris([{ e: '\u{1F34C}', n: 4, l: 'Mangga' }])),
  ],
  bank: [
    isi('Berapa anak yang suka jeruk?', '10', '5 gambar × 2 = 10 anak.', baris([{ e: '🍎', n: 3, l: 'Apel' }, { e: '🍊', n: 5, l: 'Jeruk' }], '1 gambar = 2 anak')),
    isi('Berapa buku cerita yang terjual?', '12', '4 gambar × 3 = 12 buku.', baris([{ e: '📘', n: 4, l: 'Cerita' }, { e: '📙', n: 2, l: 'Komik' }], '1 gambar = 3 buku')),
    isi('Berapa porsi bakso dan es krim seluruhnya?', '40', '4 + 6 = 10 gambar. 10 × 4 = 40 porsi.', baris([{ e: '🍜', n: 4, l: 'Bakso' }, { e: '🍦', n: 6, l: 'Es krim' }], '1 gambar = 4 porsi')),
    isi('Berapa selisih siswa yang suka sepak bola dan renang?', '3', '8 − 5 = 3 siswa.', baris([{ e: '⚽', n: 8, l: 'Sepak bola' }, { e: '🏊', n: 5, l: 'Renang' }], '1 gambar = 1 siswa')),
    isi('Robot terjual lebih banyak daripada boneka. Berapa selisihnya?', '20', '7 − 3 = 4 gambar. 4 × 5 = 20 mainan.', baris([{ e: '🤖', n: 7, l: 'Robot' }, { e: '🧸', n: 3, l: 'Boneka' }], '1 gambar = 5 mainan')),
    isi('Berapa anak yang punya ikan?', '14', '7 gambar × 2 = 14 anak.', baris([{ e: '🐱', n: 4, l: 'Kucing' }, { e: '🐟', n: 7, l: 'Ikan' }], '1 gambar = 2 anak')),
    pg('Hewan apa yang paling banyak disukai?', ['Anjing', 'Kucing', 'Kelinci', 'sama banyak'], 0, 'Anjing punya gambar paling banyak (9). Skalanya sama.', baris([{ e: '🐱', n: 6, l: 'Kucing' }, { e: '🐶', n: 9, l: 'Anjing' }, { e: '🐰', n: 4, l: 'Kelinci' }], '1 gambar = 1 siswa')),
    pg('Bentuk diurutkan dari yang PALING SEDIKIT ke PALING BANYAK. Ada 5 segitiga, 3 lingkaran, dan 7 persegi. Urutan yang benar adalah...', ['lingkaran, segitiga, persegi', 'persegi, segitiga, lingkaran', 'segitiga, lingkaran, persegi', 'lingkaran, persegi, segitiga'], 0, '3 (lingkaran), 5 (segitiga), 7 (persegi).', baris([{ e: '\u{1F53A}', n: 5, l: 'Segitiga' }, { e: '\u26AA', n: 3, l: 'Lingkaran' }, { e: '\u{1F7E6}', n: 7, l: 'Persegi' }])),
    pg('Skalanya 1 gambar = 5 anak. Ada 20 anak suka merah dan 10 anak suka biru. Berapa gambar untuk tiap warna?', ['4 gambar dan 2 gambar', '20 gambar dan 10 gambar', '5 gambar dan 2 gambar', '2 gambar dan 4 gambar'], 0, '20 dibagi 5 = 4 gambar. 10 dibagi 5 = 2 gambar.', baris([{ e: '\u{1F534}', n: 4, l: 'Merah' }, { e: '\u{1F535}', n: 2, l: 'Biru' }], '1 gambar = 5 anak')),
    kata('Cara menyajikan data dengan gambar disebut...', ['piktogram'], 'Piktogram = data yang disajikan dengan gambar.', baris([{ e: '\u{1F34E}', n: 3, l: 'Apel' }, { e: '\u{1F34C}', n: 2, l: 'Pisang' }], '1 gambar = 1 anak')),
    kata('Memisahkan benda ke dalam kelompok menurut ciri tertentu disebut mengelompokkan atau...', ['menyortir', 'sortir', 'mensortir', 'memilah'], 'Mengelompokkan juga disebut menyortir atau memilah.'),
    pg('Piktogram A: 4 gambar, 1 gambar = 2 anak. Piktogram B: 4 gambar, 1 gambar = 5 anak. Mana yang mewakili lebih banyak anak?', ['piktogram B', 'piktogram A', 'sama banyak', 'tidak bisa diketahui'], 0, 'A: 4 × 2 = 8 anak. B: 4 × 5 = 20 anak. Jumlah gambarnya sama, datanya beda.', [baris([{ e: '\u{1F34E}', n: 4, l: 'A' }], '1 gambar = 2 anak'), baris([{ e: '\u{1F34A}', n: 4, l: 'B' }], '1 gambar = 5 anak')]),
    pg('Manakah yang bisa dipakai sebagai ciri untuk mengelompokkan sekumpulan pensil?', ['warna pensil', 'rasa pensil', 'suara pensil', 'bau pensil'], 0, 'Ciri yang bisa dilihat dan dibandingkan, seperti warna, panjang, atau merek.'),
    isi('12 anak suka merah dan 8 anak suka biru. Jika 1 gambar = 4 anak, berapa gambar untuk merah?', '3', '12 dibagi 4 = 3 gambar.'),
  ],
}
