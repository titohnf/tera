import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { bangun, bangunDaftar, jaring, pandang, potong, tampak, tumpuk } from '../gambar'

/**
 * Bahan latihan AC-14 (Konstruksi bangun ruang dan visualisasi spasial).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * total kubus satuan pada struktur berlapis (jumlahkan tiap lapisan), menara
 * lurus ke atas hanya tampak satu persegi dari atas, tampak atas atau depan
 * yang sama BELUM TENTU struktur yang sama (tinggi dan kedalaman tersembunyi),
 * jumlah kubus sama belum tentu tampak sama, hasil POTONGAN lurus (balok jadi
 * dua balok, kerucut jadi kerucut kecil dan kerucut terpancung, tabung jadi
 * dua tabung, kubus diagonal jadi dua prisma segitiga), bangun ruang GABUNGAN
 * (sisi yang menempel tidak terlihat, jadi sisi terlihat lebih sedikit),
 * jaring-jaring (juga gabungan: atap prisma butuh 2 segitiga), dan bangun yang
 * diputar tetap sama.
 *
 * `GEN.lapis` membuat soal acak "dua lapisan: bawah r x c, atas t kubus" dengan
 * gambar tumpukan kubusnya.
 */
const JS = String.raw`
GEN.lapis=function(){
  var r=rnd(2,3),c=rnd(2,4),t=rnd(1,r*c-1),h=[],k=0,i,j;
  for(i=0;i<r;i++){var b=[];for(j=0;j<c;j++){b.push(k<t?2:1);k++}h.push(b)}
  return {t:'isi',q:'Struktur kubus satuan terdiri dari 2 lapisan. Lapisan bawah berukuran '+r+' × '+c+' ('+r*c+' kubus) dan lapisan atas berisi '+t+' kubus. Berapa total kubus?',a:[String(r*c+t)],e:r*c+' + '+t+' = '+(r*c+t)+' kubus. Jumlahkan kubus tiap lapisan.',g:{k:'tumpuk',h:h}};
};
`

export const DATA_AC14: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Balok bisa disusun dari beberapa kubus satuan yang diletakkan berjajar dan bertumpuk.', true, '2 × 2 × 2 = 8 kubus menyusun satu balok (di sini berbentuk kubus besar).', tumpuk([[2, 2], [2, 2]])),
    bs('Menara dari 5 kubus satuan yang ditumpuk lurus ke atas terlihat sebagai satu persegi kecil dari atas.', true, 'Semua kubus tepat di atas satu sama lain, jadi dari atas hanya satu persegi.', [tumpuk([[5]]), tampak([[5]], 'atas')]),
    bs('Dua struktur kubus satuan yang tampak atasnya sama persis pasti struktur yang sama.', false, 'Tampak atas hanya menunjukkan kotak yang terisi, bukan tinggi tumpukan.', [tumpuk([[1, 1], [1, 1]]), tumpuk([[3, 1], [1, 1]])]),
    bs('Dua struktur kubus satuan yang tampak depannya sama persis belum tentu struktur yang sama.', true, 'Tampak depan tidak menunjukkan kedalaman.', [tumpuk([[1, 2, 1]]), tumpuk([[1, 2, 1], [1, 2, 1]])]),
    bs('Dua struktur kubus satuan dengan jumlah kubus yang sama pasti tampak depannya sama.', false, 'Susunannya bisa berbeda walau jumlahnya sama.', [tumpuk([[2, 2], [2, 2]]), tumpuk([[1, 3], [3, 1]])]),
    bs('Balok yang dipotong lurus menjadi dua bagian menghasilkan dua bangun ruang yang lebih kecil.', true, 'Kedua potongannya juga berbentuk balok.', potong('balok', 'mendatar', 0.5, 'hijau')),
    bs('Kerucut yang dipotong mendatar sejajar alasnya: bagian atasnya berbentuk kerucut yang lebih kecil.', true, 'Bagian atas tetap punya satu titik puncak, hanya lebih kecil.', potong('kerucut', 'mendatar', 0.55, 'ungu')),
    bs('Tabung yang dipotong mendatar sejajar alasnya: bagian atasnya tetap berbentuk tabung yang lebih pendek.', true, 'Alas dan tutupnya masih lingkaran.', potong('tabung', 'mendatar', 0.5, 'kuning')),
    bs('Memotong kerucut mendatar selalu menghasilkan dua bagian yang sama besar, berapa pun tinggi potongannya.', false, 'Besar tiap bagian bergantung pada tinggi potongan.', [potong('kerucut', 'mendatar', 0.3, 'ungu'), potong('kerucut', 'mendatar', 0.7, 'ungu')]),
    bs('Balok yang diputar atau dimiringkan tetap balok.', true, 'Jumlah sisi, rusuk, dan titik sudutnya tidak berubah.', bangunDaftar([{ b: 'balok', w: 'hijau' }, { b: 'balok', w: 'hijau', r: 40 }])),
    bs('Bangun ruang gabungan balok dan limas memiliki lebih sedikit sisi yang terlihat daripada keduanya saat terpisah.', true, 'Sisi yang saling menempel tidak terlihat dari luar.', bangunDaftar([{ b: 'limas', w: 'kuning' }, { b: 'balok', w: 'hijau' }])),
    bs('Bangun ruang yang terbentuk dari dua bangun ruang sederhana yang digabung disebut bangun ruang gabungan.', true, 'Contohnya rumah mainan: balok dengan atap prisma segitiga.', bangunDaftar([{ b: 'prisma', w: 'merah' }, { b: 'balok', w: 'hijau' }])),
    bs('Susunan bangun datar yang dapat dilipat membentuk bangun ruang disebut jaring-jaring.', true, 'Jaring-jaring kubus: 6 persegi yang tersusun tepat.', jaring('kubus')),
    bs('Memeriksa pandangan dari satu sudut saja bisa menyesatkan untuk menentukan bentuk struktur kubus.', true, 'Tampak atas, depan, dan samping saling melengkapi.', [tampak([[1, 2, 1]], 'depan'), tampak([[1, 2, 1]], 'atas')]),
  ],
  debat: [
    debat('Made dan Beni memiringkan sebuah kubus.', ['Made: "Setelah dimiringkan, kubus berubah menjadi bangun ruang lain."', 'Beni: "Tetap kubus. Sisi, rusuk, dan titik sudutnya tidak berubah."'], 1, 'Memutar atau memiringkan tidak mengubah bangun.', bangunDaftar([{ b: 'kubus', w: 'biru' }, { b: 'kubus', w: 'biru', r: 30 }])),
    debat('Doni dan Sari melihat struktur kubus satuan dari atas: tampak persegi 2 × 2.', ['Doni: "Pasti tepat 4 kubus, tidak mungkin lebih."', 'Sari: "Bisa lebih banyak kalau ada yang bertumpuk."'], 1, 'Dari atas hanya terlihat kotak yang terisi. Kubus bisa bertumpuk ke atas.', [tumpuk([[1, 1], [1, 1]]), tumpuk([[3, 2], [1, 1]])]),
    debat('Kiki dan Dedi membahas kerucut yang dipotong mendatar.', ['Kiki: "Selalu menjadi dua bagian yang sama besar."', 'Dedi: "Besarnya tergantung tinggi potongannya."'], 1, 'Potongan dekat puncak menghasilkan kerucut kecil, potongan dekat alas menghasilkan kerucut besar.', [potong('kerucut', 'mendatar', 0.3, 'ungu'), potong('kerucut', 'mendatar', 0.7, 'ungu')]),
    debat('Budi dan Wati menumpuk sebuah kubus dengan sebuah limas segiempat.', ['Budi: "Sisi yang terlihat jadi lebih banyak daripada saat terpisah."', 'Wati: "Sisi yang menempel tidak terlihat, jadi sisi terlihat lebih sedikit."'], 1, 'Kubus dan limas terpisah punya 11 sisi. Setelah ditumpuk, 2 sisi yang menempel tertutup.', bangunDaftar([{ b: 'limas', w: 'kuning' }, { b: 'kubus', w: 'biru' }])),
    debat('Rani dan Gino memiringkan sebuah limas.', ['Rani: "Setelah dimiringkan, limas berubah menjadi bangun ruang lain."', 'Gino: "Tetap limas. Alasnya dan sisi tegaknya sama."'], 1, 'Posisi berubah, bangunnya tetap.', bangunDaftar([{ b: 'limas', w: 'kuning' }, { b: 'limas', w: 'kuning', r: 35 }])),
    debat('Wati dan Rian membahas sebuah struktur kubus yang tampak persegi panjang dari depan, samping, dan atas.', ['Wati: "Pasti balok utuh tanpa ada kubus yang hilang."', 'Rian: "Belum tentu. Bisa ada kubus yang hilang di bagian dalam."'], 1, 'Tampak dari luar tidak menunjukkan bagian dalam yang tersembunyi.', tampak([[2, 2, 2], [2, 2, 2]], 'depan')),
  ],
  bank: [
    isi('Struktur kubus satuan terdiri dari 3 lapisan: bawah 4 × 4 (16 kubus), tengah 3 × 3 (9 kubus), atas 1 kubus. Berapa total kubus?', '26', '16 + 9 + 1 = 26.', tumpuk([[3, 2, 2, 1], [2, 2, 2, 1], [2, 2, 2, 1], [1, 1, 1, 1]])),
    isi('Struktur kubus satuan terdiri dari 2 lapisan: bawah 2 × 4 (8 kubus) dan atas 3 kubus. Berapa total kubus?', '11', '8 + 3 = 11.', tumpuk([[2, 2, 1, 1], [2, 1, 1, 1]])),
    isi('Sebuah menara disusun dari 4 kubus satuan yang ditumpuk lurus ke atas (1 kubus tiap lapisan). Berapa lapisannya?', '4', '1 kubus tiap lapisan, jadi 4 kubus berarti 4 lapisan.', tumpuk([[4]])),
    isi('Dari atas, sebuah struktur tampak persegi panjang 2 × 3 (6 kotak terisi) dan tingginya 2 lapisan penuh. Berapa total kubus?', '12', '2 × 3 = 6 kubus per lapisan. 6 × 2 = 12.', tumpuk([[2, 2, 2], [2, 2, 2]])),
    isi('Dari atas, sebuah struktur tampak persegi 3 × 3 (9 kotak terisi) dengan total 15 kubus. Berapa kubus yang ada di atas lapisan dasar?', '6', 'Lapisan dasar 9 kubus. 15 − 9 = 6 kubus di atasnya.', tumpuk([[2, 2, 2], [2, 2, 2], [1, 1, 1]])),
    pg('Menara dari 5 kubus satuan ditumpuk lurus ke atas. Dari atas terlihat...', ['1 persegi', '5 persegi', '2 persegi', 'tidak terlihat'], 0, 'Kubus yang tepat bertumpuk hanya terlihat satu persegi dari atas.', tampak([[5]], 'atas')),
    pg('Cara yang tepat untuk menghitung total kubus pada struktur berlapis adalah...', ['hitung kubus tiap lapisan lalu jumlahkan', 'hitung kubus yang terlihat dari depan saja', 'hitung hanya lapisan paling atas', 'tebak jumlahnya'], 0, 'Kubus di bawah juga dihitung walau tidak terlihat.', tumpuk([[2, 2, 1], [2, 3, 1], [1, 1, 1]])),
    pg('Sebuah balok dipotong menjadi dua bagian sama besar dengan potongan tegak lurus panjangnya. Kedua bagian berbentuk...', ['balok', 'kubus', 'tabung', 'limas'], 0, 'Potongan lurus pada balok menghasilkan balok-balok yang lebih kecil.', potong('balok', 'tegak', 0.5, 'hijau')),
    pg('Sebuah kotak kado dipotong lurus sejajar salah satu sisinya. Kedua bagian berbentuk...', ['dua balok', 'dua kubus', 'dua prisma segitiga', 'dua limas'], 0, 'Potongan sejajar sisi menghasilkan dua balok.', potong('balok', 'mendatar', 0.4, 'hijau')),
    pg('Sebuah kerucut dipotong mendatar sejajar alasnya. Bagian atasnya berbentuk...', ['kerucut yang lebih kecil', 'tabung', 'limas', 'bola'], 0, 'Bagian atas masih punya satu titik puncak.', potong('kerucut', 'mendatar', 0.55, 'ungu')),
    pg('Sebuah tabung dipotong mendatar sejajar alasnya. Bagian atasnya berbentuk...', ['tabung yang lebih pendek', 'kerucut', 'kubus', 'bola'], 0, 'Alas dan tutupnya tetap lingkaran.', potong('tabung', 'mendatar', 0.5, 'kuning')),
    pg('Sebuah kubus dipotong lurus dari satu rusuk ke rusuk yang berseberangan. Kedua bagian berbentuk...', ['dua prisma segitiga', 'dua kubus', 'dua limas', 'dua balok'], 0, 'Potongan diagonal membagi kubus menjadi dua prisma segitiga.', potong('kubus', 'miring', 0.5, 'biru')),
    isi('Kamu merancang jaring-jaring rumah mainan: balok dengan atap prisma segitiga. Berapa bangun datar segitiga yang diperlukan?', '2', 'Prisma segitiga punya 2 sisi segitiga, yaitu kedua ujung atap.', bangunDaftar([{ b: 'prisma', w: 'merah' }, { b: 'balok', w: 'hijau' }])),
    pg('Jaring-jaring terdiri dari 1 persegi dan 4 segitiga yang menempel pada tiap sisi persegi. Jika dilipat menjadi...', ['limas segiempat', 'kubus', 'prisma segitiga', 'kerucut'], 0, 'Persegi sebagai alas dan 4 segitiga sebagai sisi tegak.', jaring('limas')),
    pg('Rumah mainan dibuat dari balok sebagai badan dan prisma segitiga sebagai atap. Bentuk ini disebut...', ['bangun ruang gabungan', 'jaring-jaring', 'bangun datar', 'bola'], 0, 'Dua bangun ruang yang digabung menjadi satu bentuk baru.', bangunDaftar([{ b: 'prisma', w: 'merah' }, { b: 'balok', w: 'hijau' }])),
    isi('Kubus (6 sisi) ditumpuk dengan limas segiempat (5 sisi). Sisi yang menempel tidak terlihat. Berapa sisi yang terlihat dari luar?', '9', '6 + 5 = 11, dikurangi 2 sisi yang menempel = 9.', bangunDaftar([{ b: 'limas', w: 'kuning' }, { b: 'kubus', w: 'biru' }])),
    isi('Balok (6 sisi) ditumpuk dengan prisma segitiga (5 sisi) sebagai atap. Berapa sisi yang terlihat dari luar?', '9', '6 + 5 = 11, dikurangi 2 sisi yang menempel = 9.', bangunDaftar([{ b: 'prisma', w: 'merah' }, { b: 'balok', w: 'hijau' }])),
    isi('Kubus (6 sisi) ditumpuk dengan kerucut (2 sisi). Berapa sisi yang terlihat dari luar?', '6', '6 + 2 = 8, dikurangi 2 sisi yang menempel = 6.', bangunDaftar([{ b: 'kerucut', w: 'ungu' }, { b: 'kubus', w: 'biru' }])),
    pg('Kiki melihat sebuah kotak kado dari depan berbentuk persegi panjang, dan dari atas berbentuk persegi panjang dengan ukuran berbeda. Kotak itu kemungkinan...', ['balok', 'kubus', 'bola', 'tabung'], 0, 'Kubus tampak persegi dari semua sisi. Dua persegi panjang yang berbeda menunjukkan balok.', pandang('persegi panjang', 'persegi panjang')),
    pg('Bola diputar dari sudut mana pun. Bola akan terlihat...', ['tetap sama, berupa bulatan', 'berubah menjadi kubus', 'berubah menjadi tabung', 'menghilang'], 0, 'Bola sama dari segala arah.', bangun('bola', 'merah')),
    gen('lapis'),
    gen('lapis'),
    gen('lapis'),
    gen('lapis'),
  ],
}
