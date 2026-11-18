import { bs, debat, kata, pg, type DataMateri } from '../bersama'

/**
 * Bahan latihan AC-05 (Pecahan setengah dan seperempat, konkret).
 *
 * Konsep yang diuji bank soal topik ini: bagian harus SAMA BESAR, nama dan
 * lambang 1/2 dan 1/4 (dibaca setengah, seperempat), pecahan adalah SATU nilai
 * (bukan dua angka berdampingan), arti penyebut (banyak bagian sama besar dari
 * utuh) dan pembilang (banyak bagian yang diambil), 2/4 sama dengan 1/2, 1/2
 * lebih besar dari 1/4 pada utuh yang sama, menggabungkan bagian (1/4 + 1/4),
 * dan pecahan hanya bisa dibandingkan bila utuhnya sama besar.
 */
export const DATA_AC05: DataMateri = {
  fakta: [
    bs('Roti dipotong menjadi 2 bagian yang sama besar. Satu bagian disebut setengah (1/2).', true, 'Dua bagian sama besar, diambil satu: setengah.'),
    bs('Lambang 1/4 dibaca "seperempat".', true, '1/4 dibaca juga "satu per empat".'),
    bs('Pecahan 1/2 adalah angka 1 dan angka 2 yang berdiri sendiri-sendiri.', false, '1/2 adalah SATU nilai: satu bagian dari dua bagian sama besar.'),
    bs('Pada pecahan 1/4, angka 4 menunjukkan berapa banyak bagian sama besar dari benda utuh.', true, 'Angka bawah (penyebut) = banyak bagian sama besar. Angka atas (pembilang) = banyak bagian yang diambil.'),
    bs('2/4 kue sama banyaknya dengan 1/2 kue (kuenya sama besar).', true, '2 dari 4 bagian sama dengan 1 dari 2 bagian.'),
    bs('2/4 lebih banyak dari 1/2 karena angka-angkanya lebih besar.', false, 'Jangan hanya melihat angkanya. Gambarkan kuenya: 2/4 dan 1/2 sama banyak.'),
    bs('Dari kue yang sama besar, 1/2 lebih besar daripada 1/4.', true, 'Dibagi 2, potongannya besar. Dibagi 4, potongannya lebih kecil.'),
    bs('Kue dibagi menjadi 2 bagian, satu bagian lebih besar. Satu bagian terkecil disebut setengah.', false, 'Setengah hanya untuk bagian yang SAMA BESAR.'),
    bs('Kue dibagi 4 sama besar, lalu 3 bagian diambil. Itu ditulis 3/4.', true, '3 bagian diambil dari 4 bagian sama besar: 3/4.'),
    bs('1/2 dari kue besar dan 1/2 dari kue kecil sama banyaknya.', false, 'Pecahan hanya bisa dibandingkan jika kuenya sama besar.'),
  ],
  debat: [
    debat('Budi dan Cika membahas pecahan 1/4.', ['Budi: "1/4 cuma angka 1 dan angka 4 yang ditulis berdekatan."', 'Cika: "1/4 satu nilai: 1 bagian dari 4 bagian yang sama besar."'], 1, 'Pecahan menyatakan satu bagian tertentu dari benda utuh, bukan dua angka terpisah.'),
    debat('Wati dan Yoga membandingkan 2/4 dengan 1/2 (kuenya sama besar).', ['Wati: "2/4 lebih banyak karena 2 dan 4 lebih besar dari 1 dan 2."', 'Yoga: "Sama banyak. 2 dari 4 bagian sama dengan setengah."'], 1, 'Bagi kue jadi 4 bagian sama besar. 2 bagian persis memenuhi setengah kue.'),
    debat('Rudi dan Sari membandingkan setengah dan seperempat dari roti yang sama besar.', ['Rudi: "Setengah lebih kecil, karena angkanya lebih kecil."', 'Sari: "Setengah lebih besar. Dibagi 2, potongannya lebih besar daripada dibagi 4."'], 1, 'Semakin banyak bagian, semakin kecil tiap potongnya.'),
    debat('Kue A besar dibagi 4. Kue B kecil dibagi 2.', ['Doni: "Aku 3/4 dari A. Kamu 1/2 dari B. Bagianku pasti lebih banyak."', 'Rina: "Belum tentu. Kue A dan B beda ukuran, jadi tidak bisa dibandingkan begitu."'], 1, 'Pecahan hanya bisa dibandingkan jika utuhnya sama besar.'),
    debat('Sinta dan Beni membandingkan 1/2 dan 3/4 (kuenya sama besar).', ['Sinta: "Lihat angka atasnya saja. 3 lebih besar dari 1."', 'Beni: "Gambar kuenya. 1/2 sama dengan 2/4, jadi 3/4 lebih banyak."'], 1, 'Menyamakan dulu: 1/2 = 2/4. Lalu 3/4 jelas lebih banyak dari 2/4.'),
  ],
  bank: [
    pg('Roti dipotong 4 bagian sama besar. Satu bagian diambil. Bagian itu disebut...', ['seperempat', 'setengah', 'tiga perempat', 'utuh'], 0, '1 dari 4 bagian sama besar: seperempat.'),
    pg('Melon dipotong 2 bagian sama besar. Satu bagian diambil. Bagian itu disebut...', ['setengah', 'seperempat', 'dua', 'utuh'], 0, '1 dari 2 bagian sama besar: setengah.'),
    kata('Pizza dibagi 4 bagian sama besar, lalu 3 bagian dimakan. Tuliskan pecahannya.', ['3/4'], '3 bagian dari 4 bagian sama besar: 3/4.'),
    kata('Donat dibagi 2 bagian sama besar, lalu 1 bagian diambil. Tuliskan pecahannya.', ['1/2'], '1 bagian dari 2 bagian sama besar: 1/2.'),
    kata('Cokelat dibagi 4 bagian sama besar. Kakak makan 2 bagian, lalu adik makan 1 bagian lagi. Tuliskan pecahan yang dimakan seluruhnya.', ['3/4'], '2 + 1 = 3 bagian dari 4: 3/4.'),
    pg('Kue dibagi 4 sama besar. Toni makan 1 bagian pagi hari dan 1 bagian lagi siang hari. Berapa bagian yang dimakan Toni?', ['2/4', '1/4', '3/4', '4/4'], 0, '1 + 1 = 2 bagian dari 4. Itu 2/4, sama dengan 1/2.'),
    pg('Dua kue SAMA BESAR. Kue 1 dibagi 2 dan diambil 1 bagian. Kue 2 dibagi 4 dan diambil 1 bagian. Siapa mendapat bagian lebih besar?', ['kue 1', 'kue 2', 'sama besar', 'tidak bisa dibandingkan'], 0, '1/2 lebih besar dari 1/4 pada kue yang sama besar.'),
    pg('Dua apel SAMA BESAR. Apel 1 dibagi 4 dan diambil 3 bagian. Apel 2 dibagi 2 dan diambil 1 bagian. Siapa mendapat lebih banyak?', ['apel 1', 'apel 2', 'sama banyak', 'tidak bisa dibandingkan'], 0, '3/4 = 3 bagian kecil. 1/2 = 2/4. 3/4 lebih banyak.'),
    pg('Kue A besar dibagi 4. Kue B kecil dibagi 2. Apakah pasti 1/2 dari B lebih besar daripada 1/4 dari A?', ['tidak pasti, ukuran kuenya berbeda', 'pasti, karena 1/2 lebih besar', 'pasti sama besar', 'pasti 1/4 dari A lebih besar'], 0, 'Utuhnya tidak sama besar, jadi tidak bisa dibandingkan hanya dari pecahannya.'),
    pg('Cara membagi kue yang benar untuk mendapat "setengah" adalah...', ['potong jadi 2 bagian sama besar', 'potong jadi 2 bagian, satu lebih besar', 'potong jadi 3 bagian', 'potong jadi 4 bagian tidak sama'], 0, 'Setengah berarti 2 bagian SAMA BESAR.'),
    pg('Pada pecahan 1/4, angka 4 menunjukkan...', ['banyak bagian sama besar dari benda utuh', 'banyak bagian yang diambil', 'banyak kue', 'nilai bilangan satu'], 0, 'Angka bawah menunjukkan banyak bagian sama besar dari benda utuh.'),
    pg('Kamu ingin seseorang mendapat 3/4 kue. Cara yang tepat adalah...', ['bagi 4 sama besar, beri 3 bagian', 'bagi 3 sama besar, beri 4 bagian', 'bagi 2 sama besar, beri 3 bagian', 'bagi 4 tidak sama besar, beri 3 bagian'], 0, '3/4: dibagi 4 bagian sama besar, diambil 3 bagian.'),
    pg('Pecahan 2/4 sama nilainya dengan...', ['1/2', '1/4', '3/4', '4/2'], 0, '2 dari 4 bagian sama besar = setengah.'),
  ],
}
