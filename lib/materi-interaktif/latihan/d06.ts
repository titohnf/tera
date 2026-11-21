import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { sejajar, sudut } from '../gambar'

/**
 * Bahan latihan D-06 (Geometri: hubungan antar-sudut).
 *
 * Konsep yang diuji bank soal topik ini: jenis sudut (lancip, siku-siku,
 * tumpul, lurus, refleks), berpelurus (180) dan berpenyiku (90), bertolak
 * belakang (sama), pada dua garis sejajar yang dipotong transversal: sehadap
 * (sama), berseberangan dalam (sama), dalam sepihak (jumlah 180), luar
 * sepihak; penomoran standar 1 kanan-atas, 2 kiri-atas, 3 kiri-bawah, 4
 * kanan-bawah di k dan 5 sampai 8 di l; sehadap sama besar berarti garis
 * sejajar (dan sebaliknya); persamaan sudut (berpelurus dijumlah 180,
 * bertolak belakang disamakan, tiga kali, dua kali, selisih). Salah paham:
 * berpelurus disamakan, dalam sepihak pasti sama, sudut yang tampak siku-siku
 * pasti 90, berpelurus pasti ada yang tumpul, sudut refleks punya pelurus.
 *
 * Jawaban angka derajat ditulis tanpa tanda (65 atau 65°).
 *
 * `GEN.pelurus`, `GEN.penyiku`, `GEN.sehadap`, `GEN.sepihak`,
 * `GEN.bertolak`, `GEN.kaliPelurus`, `GEN.aljabarPelurus`, `GEN.selisihPenyiku`.
 */
const JS = String.raw`
GEN.pelurus=function(){
  var a=rnd(20,160);if(a===90)a=65;
  return {t:'isi',q:'Sudut A dan sudut B saling berpelurus. Jika sudut A = '+a+' derajat, berapa derajat sudut B?',a:[String(180-a)],e:'180 - '+a+' = '+(180-a)+'.',g:{k:'sudut',mode:'pelurus',deg:a,labA:a+'°',labB:'?'}};
};
GEN.penyiku=function(){
  var a=rnd(10,80);
  return {t:'isi',q:'Sudut P dan sudut Q saling berpenyiku. Jika sudut P = '+a+' derajat, berapa derajat sudut Q?',a:[String(90-a)],e:'90 - '+a+' = '+(90-a)+'.',g:{k:'sudut',mode:'penyiku',deg:a,labA:a+'°',labB:'?'}};
};
GEN.sehadap=function(){
  var a=rnd(30,150),P=[[1,5],[2,6],[3,7],[4,8],[3,5],[4,6]],p=P[rnd(0,3)];
  var nama='sehadap',l=a;
  return {t:'isi',q:'Dua garis sejajar dipotong garis transversal. Sudut '+p[0]+' dan sudut '+p[1]+' adalah sudut sehadap. Jika sudut '+p[0]+' = '+a+' derajat, berapa derajat sudut '+p[1]+'?',a:[String(a)],e:'Sudut sehadap pada garis sejajar sama besar: '+a+'.'};
};
GEN.sepihak=function(){
  var a=rnd(30,150);if(a===90)a=70;
  return {t:'isi',q:'Dua garis sejajar dipotong garis transversal. Sudut 3 dan sudut 6 adalah sudut dalam sepihak. Jika sudut 3 = '+a+' derajat, berapa derajat sudut 6?',a:[String(180-a)],e:'Dalam sepihak berjumlah 180: 180 - '+a+' = '+(180-a)+'.',g:{k:'sejajar',deg:a,sorot:[3,6],lab:{3:a+'°',6:'?'}}};
};
GEN.bertolak=function(){
  var a=rnd(30,150);if(a===90)a=100;
  return {t:'isi',q:'Dua garis lurus berpotongan membentuk sudut 2 dan sudut 4 yang bertolak belakang. Jika sudut 2 = '+a+' derajat, berapa derajat sudut 4?',a:[String(a)],e:'Bertolak belakang selalu sama besar.',g:{k:'sudut',mode:'silang',deg:a,labA:a+'°',labC:'?'}};
};
GEN.kaliPelurus=function(){
  var k=[2,3,4,5][rnd(0,3)],u=180/(k+1);
  return {t:'isi',q:'Sudut P dan sudut Q berpelurus. Sudut P adalah '+k+' kali sudut Q. Berapa derajat sudut P?',a:[String(u*k)],e:'Q = x, P = '+k+'x. '+(k+1)+'x = 180, x = '+u+'. P = '+(u*k)+'.'};
};
GEN.aljabarPelurus=function(){
  var x=rnd(8,20),a=rnd(2,4),b=rnd(1,3),c=a*x+b*x,A=a,B=180-a*x-b*x;
  var m=rnd(5,25),n=180-(a+b)*x-m;
  return {t:'isi',q:'Sudut A = ('+a+'x + '+m+') derajat dan sudut B = ('+b+'x + '+n+') derajat saling berpelurus. Berapa nilai x?',a:[String(x)],e:'Dijumlah 180: '+(a+b)+'x + '+(m+n)+' = 180, jadi x = '+x+'.'};
};
GEN.selisihPenyiku=function(){
  var n=rnd(15,35),k=2,d=rnd(2,7)*3,m=k*n+d;
  return {t:'isi',q:'Sudut M dan sudut N berpenyiku. Sudut M adalah '+d+' derajat lebih besar dari dua kali sudut N. Berapa derajat sudut N?',a:[String((90-d)/3)],e:'(2N + '+d+') + N = 90, 3N = '+(90-d)+', N = '+((90-d)/3)+'.'};
};
`

export const DATA_D06: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Sudut yang besarnya tepat 90° disebut sudut siku-siku.', true, 'Siku-siku = 90°.'),
    bs('Sudut tumpul lebih dari 90° dan kurang dari 180°.', true, 'Antara siku-siku dan lurus.'),
    bs('Sudut refleks lebih dari 180° dan kurang dari 360°.', true, 'Lebih besar dari sudut lurus.'),
    bs('Dua sudut berpelurus berjumlah 180°.', true, 'Membentuk garis lurus.', sudut('pelurus', { deg: 65, labA: '65°', labB: '115°' })),
    bs('Dua sudut berpenyiku berjumlah 90°.', true, 'Membentuk sudut siku-siku.', sudut('penyiku', { deg: 35, labA: '35°', labB: '55°' })),
    bs('Dua sudut yang bertolak belakang selalu sama besar.', true, 'Terbentuk dari dua garis yang berpotongan.', sudut('silang', { deg: 110, labA: '110°', labC: '110°' })),
    bs('Pada garis sejajar, sudut sehadap selalu sama besar.', true, 'Sudut 1 dan 5 sama.', sejajar(70, { sorot: [1, 5], lab: { 1: '70°', 5: '70°' } })),
    bs('Pada garis sejajar, sudut berseberangan dalam sama besar.', true, 'Sudut 3 dan 5.', sejajar(48, { sorot: [3, 5], lab: { 3: '48°', 5: '48°' } })),
    bs('Pada garis sejajar, sudut dalam sepihak berjumlah 180°.', true, 'Sudut 3 dan 6: 75° + 105°.', sejajar(75, { sorot: [3, 6], lab: { 3: '75°', 6: '105°' } })),
    bs('Pada garis sejajar, sudut dalam sepihak pasti sama besar.', false, 'Jumlahnya 180°; sama besar hanya bila keduanya 90°.'),
    bs('Jika salah satu dari dua sudut berpelurus adalah lancip, sudut lainnya tumpul.', true, '180° dikurangi sudut kurang dari 90° lebih dari 90°.'),
    bs('Dua sudut berpelurus pasti salah satunya tumpul.', false, '90° dan 90° berpelurus dan keduanya siku-siku.'),
    bs('Sudut refleks tidak mungkin punya pasangan berpelurus.', true, 'Pelurusnya akan negatif.'),
    bs('Sudut yang tampak siku-siku pada gambar tanpa tanda siku pasti 90°.', false, 'Gambar bukan bukti ukuran.'),
    bs('Sudut yang tampak lancip pada sketsa tanpa keterangan pasti kurang dari 90°.', false, 'Sketsa tidak selalu sesuai ukuran.'),
    bs('Sudut sehadap yang sama besar (72° dan 72°) menunjukkan kedua garis sejajar.', true, 'Itu syarat sejajar.'),
    bs('Sudut sehadap 88° dan 91° menunjukkan balok kayu itu sejajar.', false, 'Tidak sama, jadi tidak sejajar.', sejajar(88, { tilt: 3, sorot: [1, 5], lab: { 1: '88°', 5: '91°' } })),
    bs('Sudut dalam sepihak 95° dan 84° menunjukkan kedua garis sejajar.', false, 'Jumlahnya 179°, bukan 180°.'),
    bs('Untuk sudut berpelurus, persamaannya menyamakan kedua sudut.', false, 'Dijumlah sama dengan 180°.'),
    bs('Untuk sudut bertolak belakang, persamaannya menyamakan kedua sudut.', true, 'Keduanya sama besar.'),
  ],
  debat: [
    debat('Dedi dan Eka mengerjakan sudut M = (3x+10)° dan N = (2x+20)° berpelurus.', ['Dedi: "3x+10 = 2x+20, x = 10."', 'Eka: "3x+10 + 2x+20 = 180, x = 30."'], 1, 'Berpelurus dijumlah 180°.'),
    debat('Gita dan Hadi menghitung sudut G = (5x−8)° dan H = (3x+12)° bertolak belakang.', ['Gita: "Dijumlah 180: 8x + 4 = 180."', 'Hadi: "Sama besar: 5x−8 = 3x+12, x = 10."'], 1, 'Bertolak belakang sama besar.'),
    debat('Ira dan Joni menilai dua garis dengan sudut sehadap 88° dan 91°.', ['Ira: "Hampir sama, jadi sejajar."', 'Joni: "Tidak sama, jadi tidak sejajar."'], 1, 'Sejajar menuntut sama persis.', sejajar(88, { tilt: 3, sorot: [1, 5], lab: { 1: '88°', 5: '91°' } })),
    debat('Kiki dan Lani membahas sudut dalam sepihak pada garis sejajar.', ['Kiki: "Pasti sama besar."', 'Lani: "Jumlahnya 180°."'], 1, 'Dalam sepihak berjumlah 180°.', sejajar(75, { sorot: [3, 6], lab: { 3: '75°', 6: '?' } })),
    debat('Made dan Nia memandang sudut yang tampak siku-siku tanpa tanda.', ['Made: "Pasti 90°."', 'Nia: "Belum tentu; perlu tanda atau keterangan."'], 1, 'Jangan mengandalkan kesan mata.'),
    debat('Oka dan Putri membahas sudut refleks.', ['Oka: "Pelurusnya adalah sudut negatif, jadi tidak ada."', 'Putri: "Pelurusnya sudut lancip."'], 0, 'Lebih dari 180° tidak bisa dilengkapi sampai 180°.'),
  ],
  bank: [
    isi('Sudut yang besarnya tepat 90° disebut sudut ...', ['siku-siku'], 'Siku-siku.'),
    isi('Sudut yang besarnya tepat 180° disebut sudut ...', ['lurus'], 'Sudut lurus.'),
    isi('Sudut lebih dari 180° dan kurang dari 360° disebut sudut ...', ['refleks'], 'Refleks.'),
    isi('Dua sudut berpelurus berjumlah ... derajat.', '180', 'Garis lurus.'),
    isi('Dua sudut berpenyiku berjumlah ... derajat.', '90', 'Siku-siku.'),
    isi('Dua sudut yang berhadapan pada perpotongan dua garis disebut sudut ...', ['bertolak belakang'], 'Selalu sama besar.'),
    isi('Sudut A dan B berpelurus. A = 65°. Berapa derajat B?', '115', '180 - 65 = 115.', sudut('pelurus', { deg: 65, labA: '65°', labB: '?' })),
    isi('Sudut P dan Q berpenyiku. P = 35°. Berapa derajat Q?', '55', '90 - 35 = 55.'),
    isi('Sudut siku-siku dibagi dua; salah satunya 25°. Berapa derajat yang lain?', '65', '90 - 25 = 65.'),
    isi('Sudut C dan D berpelurus. C = 112°. Berapa derajat D?', '68', '180 - 112 = 68.'),
    isi('Sudut G dan H berpenyiku. G = 28°. Berapa derajat H?', '62', '90 - 28 = 62.'),
    isi('Sudut J dan K berpelurus. J = 98°. Berapa derajat K?', '82', '180 - 98 = 82.'),
    isi('Garis sejajar. Sudut 1 dan 5 sehadap. Sudut 1 = 70°. Berapa derajat sudut 5?', '70', 'Sehadap sama.', sejajar(70, { sorot: [1, 5], lab: { 1: '70°', 5: '?' } })),
    isi('Garis sejajar. Sudut 3 dan 7 sehadap. Sudut 3 = 52°. Berapa derajat sudut 7?', '52', 'Sehadap sama.'),
    isi('Garis sejajar. Sudut 3 dan 5 berseberangan dalam. Sudut 3 = 48°. Berapa derajat sudut 5?', '48', 'Sama.', sejajar(48, { sorot: [3, 5], lab: { 3: '48°', 5: '?' } })),
    isi('Garis sejajar. Sudut 3 dan 6 dalam sepihak. Sudut 3 = 75°. Berapa derajat sudut 6?', '105', '180 - 75 = 105.', sejajar(75, { sorot: [3, 6], lab: { 3: '75°', 6: '?' } })),
    isi('Dua garis berpotongan. Sudut 2 = 110°. Berapa derajat sudut 4 (bertolak belakang)?', '110', 'Sama besar.'),
    isi('Sudut 1 dan 2 berpelurus; sudut 1 tiga kali sudut 2. Berapa derajat sudut 1?', '135', '4x = 180; x = 45; 3x = 135.'),
    isi('Sudut A dan B berpenyiku; A dua kali B. Berapa derajat A?', '60', '3x = 90; x = 30; A = 60.'),
    isi('Sudut P dan Q berpelurus; P dua kali Q. Berapa derajat P?', '120', '3x = 180; x = 60; P = 120.'),
    isi('Sudut M dan N berpenyiku; M 15° lebih besar dari dua kali N. Berapa derajat N?', '25', '3N + 15 = 90; N = 25.'),
    isi('Sudut R dan S berpenyiku; R 30° lebih kecil dari tiga kali S. Berapa derajat S?', '30', '4S - 30 = 90; S = 30.'),
    isi('Sudut A = 4x dan B = 2x + 30 berpelurus. Berapa derajat A?', '100', '6x + 30 = 180; x = 25; A = 100.'),
    isi('Tangga disandarkan ke dinding. Sudut tangga dan lantai 30°. Berapa derajat sudut tangga dan dinding?', '60', '90 - 30 = 60.'),
    pg('Dua sudut berpelurus; yang satu lancip 40°. Yang lain termasuk sudut ...', ['tumpul', 'lancip', 'siku-siku', 'refleks'], 0, '140°.'),
    pg('Sudut 1 dan 5 pada garis sejajar disebut sudut ...', ['sehadap', 'berseberangan dalam', 'dalam sepihak', 'bertolak belakang'], 0, 'Posisi sama pada kedua titik potong.'),
    pg('Sudut 3 dan 5 pada garis sejajar disebut sudut ...', ['berseberangan dalam', 'sehadap', 'dalam sepihak', 'berpelurus'], 0, 'Di antara kedua garis, sisi berlawanan.'),
    pg('Sudut 3 dan 6 pada garis sejajar berhubungan ...', ['jumlahnya 180°', 'sama besar', 'berjumlah 90°', 'tidak berhubungan'], 0, 'Dalam sepihak.'),
    pg('Siswa menyamakan 3x+10 dan 2x+20 untuk sudut berpelurus. Penilaian...', ['Keliru; berpelurus dijumlah 180°', 'Benar'], 0, 'x = 30.'),
    pg('Siswa menjumlahkan (5x−8) dan (3x+12) untuk sudut bertolak belakang. Penilaian...', ['Keliru; bertolak belakang disamakan', 'Benar'], 0, 'x = 10.'),
    pg('Sudut sehadap 88° dan 91° menunjukkan balok ...', ['tidak sejajar', 'sejajar', 'tegak lurus', 'berpotongan tegak'], 0, 'Tidak sama.'),
    pg('Dalam sepihak 95° dan 84°. Kedua garis ...', ['tidak sejajar', 'sejajar', 'tegak lurus', 'sama'], 0, 'Jumlah 179°.'),
    pg('Pada garis sejajar, dalam sepihak ...', ['berjumlah 180°', 'selalu sama', 'selalu 90°', 'selalu tumpul'], 0, 'Jumlah 180°.'),
    pg('Sudut sehadap 72° dan 72° dengan transversal. Kesimpulannya ...', ['garis kedua sejajar', 'garis tidak sejajar', 'sudut berpelurus', 'tidak ada kesimpulan'], 0, 'Sehadap sama membuktikan sejajar.'),
    pg('Sudut yang tampak siku-siku tanpa keterangan ukuran ...', ['belum tentu 90°', 'pasti 90°', 'pasti lancip', 'pasti tumpul'], 0, 'Gambar bukan bukti.'),
    gen('pelurus'),
    gen('penyiku'),
    gen('sehadap'),
    gen('sepihak'),
    gen('bertolak'),
    gen('kaliPelurus'),
    gen('aljabarPelurus'),
    gen('selisihPenyiku'),
  ],
}
