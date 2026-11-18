import { bs, debat, gen, isi, kata, pg, type DataMateri } from '../bersama'
import { bangun, bangunDaftar, jaring, pandang } from '../gambar'

/**
 * Bahan latihan AC-13 (Ciri-ciri bangun datar dan bangun ruang).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * ciri dan nama bangun datar (segitiga dan jenisnya, persegi, persegi panjang,
 * jajar genjang, belah ketupat, trapesium), persegi sebagai persegi panjang
 * KHUSUS (tetapi tidak sebaliknya), jajar genjang tidak sama dengan belah
 * ketupat, empat sisi sama panjang belum tentu persegi, bangun yang DIPUTAR
 * tetap sama, unsur bangun ruang (sisi, rusuk, titik sudut: kubus 6/12/8, limas
 * segiempat 5/8/5, prisma segitiga 5/9/6, kerucut 1 titik puncak), bangun ruang
 * bersisi lengkung (bola tanpa rusuk; tabung dan kerucut punya sisi lengkung
 * dan datar), jaring-jaring, dan menebak benda dari TAMPAK atas dan samping.
 *
 * `GEN.unsur` membuat soal acak "berapa sisi/rusuk/titik sudut" untuk kubus,
 * balok, limas segiempat, dan prisma segitiga, lengkap dengan gambarnya.
 */
const JS = String.raw`
GEN.unsur=function(){
  var T={kubus:{n:'kubus',g:'kubus',sisi:6,rusuk:12,titik:8},balok:{n:'balok',g:'balok',sisi:6,rusuk:12,titik:8},limas:{n:'limas segiempat',g:'limas',sisi:5,rusuk:8,titik:5},prisma:{n:'prisma segitiga',g:'prisma',sisi:5,rusuk:9,titik:6}};
  var s=T[['kubus','balok','limas','prisma'][rnd(0,3)]],u=['sisi','rusuk','titik'][rnd(0,2)];
  var nama=u==='titik'?'titik sudut':u;
  return {t:'isi',q:'Berapa jumlah '+nama+' pada '+s.n+'?',a:[String(s[u])],e:s.n+': '+s.sisi+' sisi, '+s.rusuk+' rusuk, '+s.titik+' titik sudut.',g:{k:'bangun',b:s.g,w:'biru'}};
};
`

export const DATA_AC13: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Segitiga yang diputar atau dibalik tetap disebut segitiga.', true, 'Jumlah sisi dan sudutnya tidak berubah walau arah hadapnya berbeda.', bangunDaftar([{ b: 'segitiga', w: 'merah' }, { b: 'segitiga', w: 'merah', r: 180 }, { b: 'segitiga', w: 'merah', r: 60 }])),
    bs('Persegi termasuk jenis khusus dari persegi panjang.', true, 'Persegi memenuhi semua ciri persegi panjang: 4 sudut siku-siku dan sisi berhadapan sama panjang.', bangunDaftar([{ b: 'persegi', w: 'merah', l: 'persegi' }, { b: 'persegi panjang', w: 'hijau', l: 'persegi panjang' }])),
    bs('Setiap persegi panjang pasti juga persegi.', false, 'Persegi panjang boleh punya sisi panjang dan sisi pendek. Persegi harus 4 sisi sama panjang.', bangun('persegi panjang', 'hijau')),
    bs('Jajar genjang dan belah ketupat adalah bangun yang sama karena sisi berhadapannya sejajar.', false, 'Belah ketupat keempat sisinya sama panjang. Jajar genjang tidak harus.', bangunDaftar([{ b: 'jajargenjang', w: 'biru', l: 'jajar genjang' }, { b: 'belahketupat', w: 'ungu', l: 'belah ketupat' }])),
    bs('Trapesium memiliki tepat satu pasang sisi sejajar.', true, 'Itu yang membedakannya dari jajar genjang yang punya dua pasang.', bangun('trapesium', 'kuning')),
    bs('Bangun datar yang keempat sisinya sama panjang pasti persegi.', false, 'Belah ketupat juga punya 4 sisi sama panjang, tetapi sudutnya tidak siku-siku.', bangunDaftar([{ b: 'persegi', w: 'merah' }, { b: 'belahketupat', w: 'ungu' }])),
    bs('Lingkaran termasuk bangun datar yang tidak memiliki sudut.', true, 'Lingkaran bulat dan tidak punya sudut.', bangun('lingkaran', 'kuning')),
    bs('Titik pertemuan dua rusuk pada bangun ruang disebut titik sudut.', true, 'Titik sudut adalah tempat rusuk-rusuk bertemu.', bangun('kubus', 'biru')),
    bs('Kubus mempunyai 6 sisi, 12 rusuk, dan 8 titik sudut.', true, 'Itu unsur kubus yang perlu diingat.', bangun('kubus', 'biru')),
    bs('Bola tidak mempunyai titik sudut maupun rusuk.', true, 'Seluruh permukaan bola lengkung, tanpa pertemuan bidang datar.', bangun('bola', 'merah')),
    bs('Semua bangun ruang yang memiliki sisi lengkung tidak punya rusuk sama sekali.', false, 'Tabung dan kerucut punya sisi lengkung sekaligus sisi datar, dan ada rusuk di tepi alasnya.', bangunDaftar([{ b: 'tabung', w: 'kuning' }, { b: 'kerucut', w: 'ungu' }])),
    bs('Kerucut punya 1 titik puncak, 1 sisi lengkung, dan 1 sisi berbentuk lingkaran.', true, 'Sisi lingkaran itu alasnya. Sisi lengkungnya selimut.', bangun('kerucut', 'ungu')),
    bs('Jaring-jaring kubus terdiri dari 6 persegi yang sama besar.', true, 'Dilipat, 6 persegi itu menjadi 6 sisi kubus.', jaring('kubus')),
    bs('Untuk mengenali benda 3 dimensi, lebih andal melihatnya dari beberapa sudut pandang sekaligus.', true, 'Satu tampak bisa menipu: tabung dan kerucut sama-sama berbentuk lingkaran dari atas.', pandang('lingkaran', 'persegi panjang')),
  ],
  debat: [
    debat('Dodi bingung melihat segitiga yang puncaknya menghadap ke bawah.', ['Dodi: "Ini bukan segitiga lagi, karena posisinya terbalik."', 'Eka: "Tetap segitiga. Sisinya 3 dan sudutnya 3, tidak berubah."'], 1, 'Memutar atau membalik tidak mengubah sisi dan sudut, jadi namanya tetap.', bangunDaftar([{ b: 'segitiga', w: 'merah' }, { b: 'segitiga', w: 'merah', r: 180 }])),
    debat('Doni dan Sinta membahas persegi panjang.', ['Doni: "Setiap persegi panjang pasti persegi, karena sama-sama punya 4 sudut siku-siku."', 'Sinta: "Tidak. Persegi panjang boleh punya sisi panjang dan sisi pendek."'], 1, 'Persegi harus punya 4 sisi sama panjang. Persegi panjang belum tentu.', bangun('persegi panjang', 'hijau')),
    debat('Wati dan Beni membandingkan dua bangun datar.', ['Wati: "Jajar genjang dan belah ketupat sama saja, sisi berhadapannya sama-sama sejajar."', 'Beni: "Belah ketupat keempat sisinya sama panjang. Jajar genjang tidak harus."'], 1, 'Belah ketupat adalah jajar genjang yang keempat sisinya sama panjang.', bangunDaftar([{ b: 'jajargenjang', w: 'biru' }, { b: 'belahketupat', w: 'ungu' }])),
    debat('Dedi mengukur sebuah bangun datar yang keempat sisinya sama panjang.', ['Dedi: "Pasti persegi."', 'Rani: "Belum tentu. Bisa juga belah ketupat. Cek dulu sudutnya."'], 1, 'Persegi: sisi sama panjang DAN sudut siku-siku.', bangunDaftar([{ b: 'persegi', w: 'merah' }, { b: 'belahketupat', w: 'ungu' }])),
    debat('Made dan Wayan melihat sebuah benda. Dari atas terlihat lingkaran, dari samping terlihat persegi panjang.', ['Made: "Benda itu kerucut."', 'Wayan: "Benda itu tabung."'], 1, 'Kerucut dari samping terlihat segitiga. Persegi panjang dari samping menunjukkan tabung.', pandang('lingkaran', 'persegi panjang')),
    debat('Fani dan Gino memutar persegi panjang 90 derajat.', ['Fani: "Setelah diputar, jadi bangun lain."', 'Gino: "Tetap persegi panjang, hanya arahnya berubah."'], 1, 'Memutar tidak mengubah ciri bangun.', bangunDaftar([{ b: 'persegi panjang', w: 'hijau' }, { b: 'persegi panjang', w: 'hijau', r: 90 }])),
  ],
  bank: [
    pg('Bangun datar yang memiliki 3 sisi dan 3 sudut disebut...', ['segitiga', 'persegi', 'trapesium', 'lingkaran'], 0, '3 sisi dan 3 sudut: segitiga.', bangun('segitiga', 'merah')),
    isi('Berapa jumlah sisi pada bangun datar persegi?', '4', 'Persegi punya 4 sisi sama panjang.', bangun('persegi', 'merah')),
    isi('Berapa jumlah sisi pada bangun datar trapesium?', '4', 'Trapesium punya 4 sisi, dan tepat satu pasang yang sejajar.', bangun('trapesium', 'kuning')),
    pg('Bangun datar dengan keempat sisi sama panjang, tetapi sudutnya BUKAN siku-siku, adalah...', ['belah ketupat', 'persegi', 'persegi panjang', 'trapesium'], 0, 'Persegi juga 4 sisi sama, tetapi sudutnya siku-siku.', bangun('belahketupat', 'ungu')),
    pg('Bangun datar dengan dua pasang sisi sejajar, sisi berhadapan sama panjang, sudut bukan siku-siku, dan sisinya tidak semuanya sama panjang adalah...', ['jajar genjang', 'belah ketupat', 'persegi panjang', 'trapesium'], 0, 'Itu ciri jajar genjang.', bangun('jajargenjang', 'biru')),
    pg('Bangun datar dengan 4 sisi dan tepat satu pasang sisi sejajar adalah...', ['trapesium', 'jajar genjang', 'persegi', 'belah ketupat'], 0, 'Tepat satu pasang sisi sejajar: trapesium.', bangun('trapesium', 'kuning')),
    pg('Segitiga dengan satu sudut TEPAT 90 derajat, tetapi ketiga sisinya tidak sama panjang, adalah segitiga...', ['siku-siku', 'sama sisi', 'sama kaki', 'tumpul'], 0, 'Sudut tepat 90 derajat: siku-siku.', bangun('segitigasiku', 'hijau')),
    kata('Segitiga dengan 3 sisi sama panjang dan 3 sudut sama besar disebut segitiga ___.', ['sama sisi'], 'Tiga sisi sama panjang: segitiga sama sisi.'),
    isi('Sebuah kotak sepatu berbentuk balok. Berapa jumlah titik sudutnya?', '8', 'Balok: 6 sisi, 12 rusuk, 8 titik sudut.', bangun('balok', 'kuning')),
    isi('Sebuah topi ulang tahun berbentuk kerucut. Berapa jumlah titik puncaknya?', '1', 'Kerucut punya 1 titik puncak.', bangun('kerucut', 'ungu')),
    isi('Berapa jumlah rusuk pada limas segiempat?', '8', '4 rusuk di alas dan 4 rusuk ke puncak.', bangun('limas', 'biru')),
    isi('Berapa jumlah sisi pada prisma segitiga?', '5', '2 sisi segitiga dan 3 sisi persegi panjang.', bangun('prisma', 'hijau')),
    isi('Berapa jumlah titik sudut pada prisma segitiga?', '6', '3 titik sudut di alas dan 3 di tutup.', bangun('prisma', 'hijau')),
    pg('Bangun ruang yang memiliki 6 sisi berbentuk persegi yang semuanya sama besar adalah...', ['kubus', 'balok', 'limas', 'tabung'], 0, 'Semua sisinya persegi sama besar: kubus.', bangun('kubus', 'merah')),
    pg('Sebuah jaring-jaring terdiri dari 2 lingkaran dan 1 persegi panjang. Jika dilipat menjadi...', ['tabung', 'kerucut', 'bola', 'kubus'], 0, '2 lingkaran (alas dan tutup) dan 1 persegi panjang (selimut): tabung.', jaring('tabung')),
    pg('Sebuah jaring-jaring terdiri dari 1 persegi dan 4 segitiga. Jika dilipat menjadi...', ['limas segiempat', 'prisma segitiga', 'kubus', 'kerucut'], 0, 'Persegi sebagai alas dan 4 segitiga sebagai sisi tegak: limas segiempat.', jaring('limas')),
    pg('Sebuah jaring-jaring terdiri dari 2 segitiga dan 3 persegi panjang. Jika dilipat menjadi...', ['prisma segitiga', 'limas segiempat', 'balok', 'tabung'], 0, '2 segitiga (alas dan tutup) dan 3 persegi panjang: prisma segitiga.', jaring('prisma')),
    pg('Kamu ingin merancang jaring-jaring limas segiempat. Bangun datar yang diperlukan adalah...', ['1 persegi dan 4 segitiga', '2 persegi dan 4 segitiga', '4 persegi', '5 segitiga'], 0, 'Alasnya satu persegi dan sisi tegaknya 4 segitiga.', jaring('limas')),
    pg('Sebuah benda dilihat dari atas berbentuk persegi dan dari samping berbentuk segitiga. Benda itu kemungkinan...', ['limas segiempat', 'kerucut', 'kubus', 'tabung'], 0, 'Alas persegi dan sisi tegak segitiga: limas segiempat.', pandang('persegi', 'segitiga')),
    pg('Sebuah benda dilihat dari atas berbentuk lingkaran dan dari samping berbentuk segitiga. Benda itu kemungkinan...', ['kerucut', 'tabung', 'bola', 'kubus'], 0, 'Dari atas lingkaran dan dari samping segitiga: kerucut.', pandang('lingkaran', 'segitiga')),
    pg('Perbedaan utama antara persegi dan persegi panjang adalah...', ['semua sisi persegi sama panjang, sedangkan persegi panjang hanya sisi berhadapannya', 'persegi hanya punya 3 sudut siku-siku', 'persegi panjang tidak punya sudut siku-siku', 'persegi tidak punya sisi sejajar'], 0, 'Keduanya punya 4 sudut siku-siku. Beda di panjang sisinya.', bangunDaftar([{ b: 'persegi', w: 'merah' }, { b: 'persegi panjang', w: 'hijau' }])),
    pg('Perbedaan utama antara jajar genjang dan belah ketupat adalah...', ['keempat sisi belah ketupat sama panjang', 'jajar genjang punya 3 sisi', 'belah ketupat tidak punya sisi sejajar', 'semua sudut jajar genjang siku-siku'], 0, 'Belah ketupat: 4 sisi sama panjang. Jajar genjang: hanya sisi berhadapan yang sama.', bangunDaftar([{ b: 'jajargenjang', w: 'biru' }, { b: 'belahketupat', w: 'ungu' }])),
    pg('Ciri utama yang membedakan balok dan kubus adalah...', ['semua sisi kubus berbentuk persegi sama besar', 'balok hanya punya 5 sisi', 'kubus punya 8 rusuk saja', 'balok bersisi lengkung'], 0, 'Kubus: 6 persegi sama besar. Balok: sisinya persegi panjang.', bangunDaftar([{ b: 'kubus', w: 'biru' }, { b: 'balok', w: 'hijau' }])),
    pg('Bangun ruang yang memiliki sisi lengkung DAN sisi datar sekaligus adalah...', ['tabung dan kerucut', 'bola saja', 'kubus dan balok', 'limas dan prisma'], 0, 'Tabung dan kerucut: selimut lengkung dan alas datar (lingkaran).', bangunDaftar([{ b: 'tabung', w: 'kuning' }, { b: 'kerucut', w: 'ungu' }])),
    gen('unsur'),
    gen('unsur'),
    gen('unsur'),
    gen('unsur'),
  ],
}
