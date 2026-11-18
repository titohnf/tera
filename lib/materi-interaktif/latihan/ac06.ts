import { bs, debat, isi, pg, type DataMateri } from '../bersama'
import { neraca, batang, tali, lomba } from '../gambar'

/**
 * Bahan latihan AC-06 (Bandingkan panjang, berat, dan durasi; satuan tidak baku).
 *
 * Konsep yang diuji bank soal topik ini: neraca (sisi turun = lebih berat),
 * sifat TRANSITIF (A > B dan B > C maka A > C), satuan yang dipakai harus SAMA
 * (jengkal besar dan kecil menghasilkan hitungan berbeda), besar tidak sama
 * dengan berat, perbandingan adil (mulai dari titik awal yang sama, kegiatan
 * dimulai bersamaan), panjang tali tidak berubah saat dilengkungkan, hitungan
 * tepukan atau langkah sebagai satuan lama kegiatan, serta hitungan selisih dan
 * jumlah dari hasil ukur.
 */
export const DATA_AC06: DataMateri = {
  fakta: [
    bs('Pada neraca sederhana, sisi yang lebih ringan naik ke atas.', true, 'Sisi yang lebih berat turun. Sisi yang lebih ringan naik.', neraca('\u{1F349}', '\u{1F34E}', 'kiri', 'berat', 'ringan')),
    bs('Jika neraca seimbang, kedua benda sama beratnya.', true, 'Tidak ada yang turun atau naik berarti beratnya sama.', neraca('\u{1F34E}', '\u{1F34E}', null)),
    bs('Tongkat A lebih panjang dari B, dan B lebih panjang dari C. Maka A pasti lebih panjang dari C.', true, 'A > B > C. Jadi A paling panjang.', batang([{ l: 'Tongkat A', n: 8, w: 'merah' }, { l: 'Tongkat B', n: 6, w: 'biru' }, { l: 'Tongkat C', n: 4, w: 'hijau' }], 'jengkal')),
    bs('Benda yang ukurannya lebih besar pasti lebih berat.', false, 'Besar belum tentu berat. Bola plastik besar bisa lebih ringan dari batu kecil.', neraca('\u{1F388}', '\u{1F34E}', 'kanan', 'besar', 'kecil')),
    bs('Tali yang lurus 9 jengkal tetap 9 jengkal walau dilingkarkan, asal tidak dipotong.', true, 'Menekuk tali tidak mengubah panjang sebenarnya.', tali(9)),
    bs('Untuk membandingkan panjang dengan adil, kedua benda harus mulai diukur dari titik awal yang sama.', true, 'Sejajarkan dulu satu ujungnya.', batang([{ l: 'Pita A', n: 6 }, { l: 'Pita B', n: 8, w: 'biru' }], 'jengkal')),
    bs('Untuk membandingkan lama dua kegiatan dengan adil, keduanya harus dimulai bersamaan.', true, 'Mulai bersamaan, lalu lihat siapa yang selesai belakangan.', lomba([{ l: 'Kegiatan A', m: 0, s: 5 }, { l: 'Kegiatan B', m: 0, s: 3, w: 'biru' }])),
    bs('Jengkal ayah dan jengkal anak sama panjang, jadi hasil ukurnya selalu bisa dibandingkan.', false, 'Jengkal ayah lebih besar. Hitungan jengkal berbeda belum tentu berarti panjangnya berbeda.'),
    bs('Hitungan tepukan tangan boleh dipakai sebagai satuan tidak baku untuk lama kegiatan.', true, 'Asal tepukannya dilakukan dengan kecepatan yang sama.', batang([{ l: 'Menyapu', n: 8, w: 'kuning' }, { l: 'Mencuci', n: 5, w: 'biru' }], 'tepukan', false)),
    bs('Kata "lebih lama" dipakai untuk membandingkan waktu.', true, 'Kegiatan yang butuh waktu lebih banyak disebut lebih lama.', lomba([{ l: 'Makan', e: '\u{1F35A}', m: 0, s: 6 }, { l: 'Minum', e: '\u{1F964}', m: 0, s: 2, w: 'biru' }])),
  ],
  debat: [
    debat('Rendi mengukur tongkatnya 10 jengkal dan tongkat Tia 7 jengkal. Jengkal Rendi lebih kecil.', ['Rendi: "Tongkatku pasti lebih panjang, 10 lebih dari 7."', 'Tia: "Belum tentu. Kita harus memakai jengkal yang sama."'], 1, 'Satuannya beda ukuran. Bandingkan harus dengan satuan yang sama.'),
    debat('Rani dan Dika membahas dua batu.', ['Rani: "Batu yang besar pasti lebih berat."', 'Dika: "Belum tentu. Kita timbang dengan neraca."'], 1, 'Besar belum tentu berat. Neraca menunjukkan mana yang lebih berat.', neraca('\u{1F388}', '\u{1F34E}', 'kanan', 'besar', 'kecil')),
    debat('Sari melihat batu kecil.', ['Sari: "Batunya kecil sekali, pasti ringan. Tidak perlu ditimbang."', 'Aldo: "Tetap harus ditimbang. Kecil belum tentu ringan."'], 1, 'Menebak dari tampilan bisa keliru. Timbang untuk memastikan.', neraca('\u{1F34E}', '\u{1F388}', 'kiri', 'kecil', 'besar')),
    debat('Wati dan kakaknya mengukur meja yang sama. Wati dapat 10 jengkal, kakak dapat 7 jengkal.', ['Ani: "Meja yang sama tidak mungkin beda hasilnya. Ada yang salah."', 'Beni: "Bisa. Jengkal kakak lebih besar, jadi hitungannya lebih sedikit."'], 1, 'Satuan yang lebih besar menghasilkan hitungan yang lebih sedikit untuk benda yang sama.'),
    debat('Budi mulai berlari lebih dulu. Sinta menyusul. Mereka berhenti bersamaan.', ['Rini: "Budi berlari lebih lama karena mulainya lebih dulu."', 'Dodi: "Sama lama, karena berhentinya bersamaan."'], 0, 'Yang mulai lebih dulu dan berhenti bersamaan berlari lebih lama.', lomba([{ l: 'Budi', e: '\u{1F3C3}', m: 0, s: 6 }, { l: 'Sinta', e: '\u{1F3C3}', m: 2, s: 4, w: 'biru' }])),
  ],
  bank: [
    pg('Tongkat P lebih panjang dari Q. Tongkat Q lebih panjang dari R. Kesimpulan yang PASTI benar adalah...', ['P lebih panjang dari R', 'R lebih panjang dari P', 'P sama panjang dengan R', 'Q yang paling panjang'], 0, 'P > Q > R. Jadi P paling panjang.', batang([{ l: 'Tongkat P', n: 8, w: 'merah' }, { l: 'Tongkat Q', n: 6, w: 'biru' }, { l: 'Tongkat R', n: 4, w: 'hijau' }], 'jengkal')),
    pg('Batu X lebih berat dari Y. Batu Y lebih berat dari Z. Urutan dari yang paling ringan adalah...', ['Z, Y, X', 'X, Y, Z', 'Y, X, Z', 'Z, X, Y'], 0, 'Z paling ringan, lalu Y, lalu X.'),
    pg('Pada neraca, apel di sisi kiri dan jeruk di sisi kanan. Sisi kanan turun. Mana yang lebih berat?', ['jeruk', 'apel', 'sama berat', 'tidak bisa ditentukan'], 0, 'Sisi yang turun lebih berat.', neraca('\u{1F34E}', '\u{1F34A}', 'kanan', 'apel', 'jeruk')),
    isi('Pita A panjangnya 6 jengkal. Pita B panjangnya 9 jengkal. Berapa jengkal selisih panjangnya?', '3', '9 − 6 = 3 jengkal.', batang([{ l: 'Pita A', n: 6 }, { l: 'Pita B', n: 9, w: 'biru' }], 'jengkal')),
    isi('Tongkat A panjangnya 9 jengkal. Tongkat B lebih panjang 5 jengkal daripada A. Berapa jengkal panjang B?', '14', '9 + 5 = 14 jengkal.', batang([{ l: 'Tongkat A', n: 9 }], 'jengkal')),
    isi('Batu besar beratnya setara 16 kelereng. Batu kecil lebih ringan 6 kelereng daripada batu besar. Batu kecil setara berapa kelereng?', '10', '16 − 6 = 10 kelereng.'),
    isi('Menyapu dihitung 22 langkah. Setelah itu mengepel dihitung 15 langkah. Berapa langkah untuk kedua kegiatan?', '37', '22 + 15 = 37 langkah.'),
    isi('Rak A tingginya 5 jengkal. Rak B tingginya 8 jengkal. Berapa jengkal selisih tinggi kedua rak?', '3', '8 − 5 = 3 jengkal.', batang([{ l: 'Rak A', n: 5, w: 'hijau' }, { l: 'Rak B', n: 8, w: 'biru' }], 'jengkal')),
    pg('Manakah contoh satuan tidak baku untuk mengukur panjang?', ['jengkal', 'meter', 'kilogram', 'jam'], 0, 'Jengkal berbeda-beda tiap orang, jadi tidak baku.'),
    pg('Kakak (jengkal besar) mengukur meja: 6 jengkal. Adik (jengkal kecil) mengukur lemari: 8 jengkal. Apakah pasti lemari lebih panjang dari meja?', ['belum tentu, jengkal mereka berbeda', 'pasti, karena 8 lebih dari 6', 'pasti meja lebih panjang', 'pasti sama panjang'], 0, 'Satuannya tidak sama. Perlu satuan yang sama untuk membandingkan.'),
    pg('Tali yang lurus panjangnya 7 jengkal dibuat melingkar tanpa dipotong. Panjang tali sekarang...', ['tetap 7 jengkal', 'lebih pendek', 'lebih panjang', 'tidak bisa diketahui'], 0, 'Menekuk atau melingkarkan tali tidak mengubah panjangnya.', tali(7)),
    pg('Cara yang adil untuk membandingkan panjang dua tali dengan jengkal adalah...', ['ukur keduanya dengan jengkal yang sama, mulai dari ujung yang sejajar', 'ukur dengan jengkal yang berbeda', 'lihat saja', 'ukur satu tali saja'], 0, 'Satuan sama dan titik awal sejajar membuat perbandingan adil.', batang([{ l: 'Tali A', n: 7 }, { l: 'Tali B', n: 5, w: 'biru' }], 'jengkal')),
    pg('Budi mulai berlari lebih dulu. Sinta mulai menyusul. Mereka berhenti bersamaan. Siapa yang berlari lebih lama?', ['Budi', 'Sinta', 'sama lama', 'tidak bisa ditentukan'], 0, 'Budi memulai lebih awal dan berhenti bersamaan, jadi waktunya lebih lama.', lomba([{ l: 'Budi', e: '\u{1F3C3}', m: 0, s: 6 }, { l: 'Sinta', e: '\u{1F3C3}', m: 2, s: 4, w: 'biru' }])),
  ],
}
