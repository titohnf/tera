import { bs, debat, kata, pg, type DataMateri } from '../bersama'
import { bangun, bangunDaftar, antri, meja, dalam, susun, hadap } from '../gambar'

/**
 * Bahan latihan AC-02 (Bangun datar/ruang dasar; posisi benda).
 *
 * Konsep yang diuji bank soal topik ini: ciri bangun datar (sisi, sudut),
 * persegi dibanding persegi panjang (semua sisi sama atau tidak), lingkaran
 * dibanding bola (datar dibanding ruang), ciri bangun ruang (menggelinding,
 * alas lingkaran pada tabung dan kerucut, kubus dibanding balok), posisi
 * (atas, bawah, dalam, luar, samping), SUDUT PANDANG (dua anak berhadapan,
 * kiri dibalik jadi kanan) dan urutan susunan (A di atas B, B di atas C).
 */
export const DATA_AC02: DataMateri = {
  fakta: [
    bs('Persegi punya 4 sisi yang semuanya sama panjang.', true, 'Itulah ciri persegi: 4 sisi sama panjang dan 4 sudut.', bangun('persegi', 'biru')),
    bs('Bangun dengan 2 sisi panjang dan 2 sisi pendek disebut persegi.', false, 'Itu persegi panjang. Persegi harus punya semua sisi sama panjang.', bangun('persegi panjang', 'hijau')),
    bs('Lingkaran punya sudut.', false, 'Lingkaran bulat dan tidak punya sudut.', bangun('lingkaran', 'kuning')),
    bs('Segitiga punya 3 sisi dan 3 sudut.', true, 'Nama segitiga berasal dari 3 sudutnya.', bangun('segitiga', 'merah')),
    bs('Lingkaran dan bola adalah bangun yang sama karena sama-sama bulat.', false, 'Lingkaran bangun datar (gambar di kertas). Bola bangun ruang: punya isi dan bisa dipegang.', bangunDaftar([{ b: 'lingkaran', w: 'kuning', l: 'lingkaran' }, { b: 'bola', w: 'merah', l: 'bola' }])),
    bs('Bola bisa menggelinding ke segala arah.', true, 'Bola bulat penuh, jadi bisa menggelinding ke mana saja.', bangun('bola', 'merah')),
    bs('Alas tabung berbentuk lingkaran.', true, 'Tabung punya alas dan tutup berbentuk lingkaran. Kaleng susu contohnya.', bangun('tabung', 'kuning')),
    bs('Kerucut punya dua alas berbentuk lingkaran.', false, 'Kerucut hanya punya satu alas lingkaran dan satu titik puncak.', bangun('kerucut', 'ungu')),
    bs('Kubus dan balok sama saja karena sama-sama punya 6 sisi.', false, 'Semua sisi kubus persegi sama besar. Sisi balok berupa persegi panjang.', bangunDaftar([{ b: 'kubus', w: 'biru', l: 'kubus' }, { b: 'balok', w: 'hijau', l: 'balok' }])),
    bs('Dua anak yang berdiri berhadapan sama-sama ada "di depan" satu sama lain.', true, 'Berhadapan: yang satu ada di depan yang lain, begitu juga sebaliknya.', hadap()),
    bs('Jika Dea berdiri di kiri Eko, maka Eko berdiri di kiri Dea juga.', false, 'Eko ada di KANAN Dea. Kiri dan kanan saling berbalik.', susun([{ l: 'Dea' }, { l: 'Eko' }], 'datar')),
    bs('Buku di atas meja dan meja di atas lantai. Jadi buku juga di atas lantai.', true, 'Yang di atas meja pasti lebih tinggi dari lantai juga.', meja('\u{1F4D6}', '')),
  ],
  debat: [
    debat('Hana dan Dika membahas kubus dan balok.', ['Hana: "Kubus dan balok sama saja, sama-sama punya 6 sisi."', 'Dika: "Beda. Semua sisi kubus persegi sama besar. Sisi balok persegi panjang."'], 1, 'Kubus: 6 sisi persegi sama besar. Balok: sisinya persegi panjang.', bangunDaftar([{ b: 'kubus', w: 'biru', l: 'kubus' }, { b: 'balok', w: 'hijau', l: 'balok' }])),
    debat('Fira dan Gilang melihat kaleng susu.', ['Fira: "Kaleng susu itu lingkaran, karena alasnya bulat."', 'Gilang: "Kaleng susu itu tabung, benda ruang. Lingkaran hanya alasnya."'], 1, 'Kaleng punya isi dan bisa dipegang: itu bangun ruang (tabung). Alasnya saja yang lingkaran.', bangun('tabung', 'biru', 'kaleng susu')),
    debat('Rio berkata Sinta ada di kirinya.', ['Rio: "Jadi aku pasti di kiri Sinta juga."', 'Sinta: "Bukan. Kalau aku di kirimu, kamu ada di kananku."'], 1, 'Kiri dan kanan berbalik kalau sudut pandangnya berbalik.', susun([{ l: 'Sinta' }, { l: 'Rio' }], 'datar')),
    debat('Rani duduk berhadapan dengan Dodi.', ['Rani: "Dari tempat Dodi, aku ada di belakangnya."', 'Dodi: "Kita berhadapan. Rani ada di depanku."'], 1, 'Orang yang berhadapan sama-sama berada di depan satu sama lain.', hadap()),
    debat('Dina melihat papan catur dan kotak lain.', ['Dina: "Semua yang tampak seperti kotak itu persegi."', 'Eka: "Persegi harus punya 4 sisi sama panjang. Kalau ada sisi panjang dan pendek, itu persegi panjang."'], 1, 'Cek sisinya satu per satu. Semua sama panjang: persegi. Tidak semua sama: persegi panjang.', bangunDaftar([{ b: 'persegi', w: 'abu', l: 'papan catur' }, { b: 'persegi panjang', w: 'hijau', l: 'kotak lain' }])),
  ],
  bank: [
    pg('Rambu "awas" berbentuk bangun datar dengan 3 sisi dan 3 sudut. Namanya...', ['segitiga', 'persegi', 'lingkaran', 'persegi panjang'], 0, '3 sisi dan 3 sudut: segitiga.', bangun('segitiga', 'kuning', 'rambu awas')),
    pg('Jam dinding bulat dan pipih. Bangun datar apakah ini?', ['lingkaran', 'bola', 'tabung', 'persegi'], 0, 'Bulat, pipih, tanpa sudut: lingkaran.', bangun('lingkaran', 'biru', 'jam dinding')),
    pg('Dadu punya 6 sisi persegi yang sama besar. Bangun ruang apakah ini?', ['kubus', 'balok', 'tabung', 'kerucut'], 0, 'Semua sisinya persegi sama besar: kubus.', bangun('kubus', 'merah', 'dadu')),
    pg('Kardus sepatu berbentuk kotak panjang. Sisi-sisinya persegi panjang. Bangun ruang apakah ini?', ['balok', 'kubus', 'bola', 'tabung'], 0, 'Sisinya persegi panjang: balok.', bangun('balok', 'kuning', 'kardus sepatu')),
    pg('Topi ulang tahun berbentuk kerucut. Alasnya berbentuk...', ['lingkaran', 'persegi', 'segitiga', 'persegi panjang'], 0, 'Alas kerucut berbentuk lingkaran.', bangun('kerucut', 'ungu', 'topi ulang tahun')),
    pg('Buah jeruk bulat dan bisa digelindingkan ke segala arah. Bangun ruang yang paling sesuai adalah...', ['bola', 'lingkaran', 'kubus', 'balok'], 0, 'Jeruk punya isi dan bulat penuh: bola. Lingkaran adalah bangun datar.', bangun('bola', 'oranye', 'jeruk')),
    pg('Buku ada di ATAS meja. Tas ada di BAWAH meja. Buku dibandingkan tas...', ['buku di atas tas', 'buku di bawah tas', 'buku sejajar dengan tas', 'tidak bisa diketahui'], 0, 'Atas meja lebih tinggi dari bawah meja, jadi buku di atas tas.', meja('\u{1F4D6}', '\u{1F392}')),
    pg('Bola ada DI DALAM kotak. Pensil ada DI LUAR kotak. Pernyataan yang benar adalah...', ['bola tidak terlihat dari luar, pensil terlihat', 'keduanya terlihat dari luar', 'pensil ada di dalam kotak', 'bola ada di luar kotak'], 0, 'Yang di dalam kotak tertutup. Yang di luar terlihat langsung.', dalam('\u26BD', '\u270F\uFE0F')),
    pg('Tiga buku ditata: A harus di atas B, dan B harus di atas C. Urutan dari paling atas adalah...', ['A, B, C', 'C, B, A', 'B, A, C', 'A, C, B'], 0, 'A di atas B, B di atas C. Jadi A paling atas, lalu B, lalu C.', susun([{ l: 'Buku A' }, { l: 'Buku B' }, { l: 'Buku C' }])),
    pg('Andi berdiri di depan Beni. Beni berdiri di depan Citra (satu barisan menghadap arah yang sama). Andi dibandingkan Citra...', ['Andi di depan Citra', 'Andi di belakang Citra', 'Andi di samping Citra', 'tidak bisa diketahui'], 0, 'Andi di depan Beni, Beni di depan Citra. Jadi Andi paling depan.', antri(['Andi', 'Beni', 'Citra'])),
    pg('Nina berdiri DI SAMPING Lira. Pernyataan yang paling tepat adalah...', ['Nina bersebelahan dengan Lira, bukan di depan atau belakangnya', 'Nina di depan Lira', 'Nina di belakang Lira', 'Nina di atas Lira'], 0, 'Di samping artinya bersebelahan.', antri(['Nina', 'Lira'], true)),
    pg('Merah harus di kiri Biru, dan Biru harus di kiri Hijau. Urutan dari kiri ke kanan adalah...', ['Merah, Biru, Hijau', 'Hijau, Biru, Merah', 'Biru, Merah, Hijau', 'Merah, Hijau, Biru'], 0, 'Merah paling kiri, Biru di tengah, Hijau paling kanan.'),
    kata('Dea berdiri di KIRI Eko. Maka Eko berdiri di ___ Dea. (kiri / kanan)', ['kanan'], 'Kalau Dea di kiri Eko, Eko ada di kanan Dea.', susun([{ l: 'Dea' }, { l: 'Eko' }], 'datar')),
    kata('Kaleng cat berbentuk bulat panjang. Alas dan tutupnya lingkaran. Bangun ruang ini disebut...', ['tabung'], 'Alas dan tutup lingkaran, sisi tegak melengkung: tabung.', bangun('tabung', 'merah', 'kaleng cat')),
    kata('Papan catur berbentuk kotak dengan 4 sisi sama panjang. Bangun datar apakah ini?', ['persegi'], '4 sisi sama panjang dan 4 sudut: persegi.', bangun('persegi', 'abu', 'papan catur')),
  ],
}
