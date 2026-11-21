import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { balok, netPetak } from '../gambar'

/**
 * Bahan latihan D-11 (Geometri: jaring-jaring bangun ruang).
 *
 * Konsep yang diuji bank soal topik ini: jaring-jaring (bentuk datar yang
 * dilipat menjadi bangun ruang), jumlah dan jenis bangun datar penyusun
 * (kubus 6 persegi kongruen; balok 6 persegi panjang, 3 pasang kongruen;
 * prisma segitiga 2 segitiga dan 3 persegi panjang = 5; limas segiempat 1
 * persegi dan 4 segitiga; limas segitiga 4 segitiga), susunan yang valid
 * (jumlah dan jenis benar belum cukup; 5 atau 7 persegi gagal; blok 2 x 3
 * gagal; salib valid), sisi, rusuk, titik sudut dan rumus Euler V - E + F = 2,
 * luas permukaan (kubus 6 s^2; balok 2(pl + pt + lt); prisma; limas), dan
 * kemasan (kado, cat, tenda, kotak cokelat). Salah paham: luas balok = pl +
 * pt + lt tanpa dikali 2, rusuk limas segiempat 9, jumlah dan jenis benar
 * pasti valid, semua limas punya rusuk sama.
 *
 * Jawaban angka tanpa satuan atau titik ribuan.
 *
 * `GEN.luasKubus`, `GEN.sisiDariLuas`, `GEN.lpKubus`, `GEN.lpBalok`,
 * `GEN.euler`, `GEN.lpPrisma`.
 */
const JS = String.raw`
GEN.luasKubus=function(){
  var a=rnd(2,12);
  return {t:'isi',q:'Jaring-jaring kubus tersusun dari 6 persegi bersisi '+a+' cm. Berapa cm² luas satu persegi?',a:[String(a*a)],e:a+' x '+a+' = '+(a*a)+'.',g:{k:'netpetak',sel:[[1,0],[0,1],[1,1],[2,1],[3,1],[1,2]],lab:String(a)}};
};
GEN.sisiDariLuas=function(){
  var a=rnd(3,12);
  return {t:'isi',q:'Luas satu persegi pada jaring-jaring sebuah kubus adalah '+(a*a)+' cm². Berapa cm sisi kubus?',a:[String(a)],e:a+' x '+a+' = '+(a*a)+', jadi sisinya '+a+' cm.'};
};
GEN.lpKubus=function(){
  var a=rnd(2,15);
  return {t:'isi',q:'Berapa cm² luas permukaan kubus bersisi '+a+' cm?',a:[String(6*a*a)],e:'6 x '+a+' x '+a+' = '+(6*a*a)+'.'};
};
GEN.lpBalok=function(){
  var p=rnd(4,12),l=rnd(3,p),t=rnd(2,l),ls=2*(p*l+p*t+l*t);
  return {t:'isi',q:'Balok berukuran '+p+' cm x '+l+' cm x '+t+' cm. Berapa cm² luas permukaannya?',a:[String(ls)],e:'2(pl + pt + lt) = 2('+(p*l)+' + '+(p*t)+' + '+(l*t)+') = '+ls+'.',g:{k:'balok',p:p,l:l,t:t}};
};
GEN.euler=function(){
  var Q=[[4,4],[5,5],[6,5],[6,6],[8,6],[6,8],[10,7]],q=Q[rnd(0,Q.length-1)],V=q[0],F=q[1];
  return {t:'isi',q:'Sebuah bangun ruang bersisi datar memiliki '+V+' titik sudut dan '+F+' sisi. Berapa jumlah rusuknya (V - E + F = 2)?',a:[String(V+F-2)],e:'E = V + F - 2 = '+V+' + '+F+' - 2 = '+(V+F-2)+'.'};
};
GEN.lpPrisma=function(){
  var T=[[3,4,5],[6,8,10],[5,12,13]],q=T[rnd(0,2)],t=rnd(4,12),ls=q[0]*q[1]+(q[0]+q[1]+q[2])*t;
  return {t:'isi',q:'Prisma tegak beralas segitiga siku-siku bersisi '+q[0]+' cm, '+q[1]+' cm, dan '+q[2]+' cm (miring), tinggi prisma '+t+' cm. Berapa cm² luas permukaannya?',a:[String(ls)],e:'2 segitiga: '+(q[0]*q[1])+'. Sisi tegak: ('+q[0]+' + '+q[1]+' + '+q[2]+') x '+t+' = '+((q[0]+q[1]+q[2])*t)+'. Total '+ls+'.'};
};
`

export const DATA_D11: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Jaring-jaring adalah bentuk datar yang jika dilipat menjadi bangun ruang.', true, 'Dilipat mengikuti garis rusuk.'),
    bs('Jaring-jaring kubus tersusun dari tepat 6 persegi.', true, 'Sama dengan jumlah sisi kubus.'),
    bs('Semua persegi pada jaring-jaring kubus harus kongruen.', true, 'Semua sisi kubus sama.'),
    bs('Jaring-jaring kubus bisa tersusun dari 5 persegi.', false, 'Harus tepat 6.', netPetak([[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]])),
    bs('Jaring-jaring kubus bisa tersusun dari 7 persegi.', false, 'Harus tepat 6.'),
    bs('Susunan 4 persegi berjejer, satu di atas dan satu di bawah persegi ke-2, adalah jaring-jaring kubus.', true, 'Pola salib valid.', netPetak([[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]])),
    bs('Dua baris tiga kolom penuh (blok 2 × 3) adalah jaring-jaring kubus.', false, 'Saat dilipat ada sisi yang bertumpuk.', netPetak([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]])),
    bs('Enam persegi kongruen pasti jaring-jaring kubus apa pun susunannya.', false, 'Susunannya juga harus tepat.'),
    bs('Jaring-jaring balok tersusun dari 6 persegi panjang yang membentuk 3 pasang kongruen.', true, 'Sisi berhadapan sama.'),
    bs('Jaring-jaring balok dengan 6 persegi panjang yang semuanya berbeda ukuran masih bisa membentuk balok.', false, 'Harus ada 3 pasang kongruen.'),
    bs('Jaring-jaring prisma segitiga tersusun dari 2 segitiga dan 3 persegi panjang.', true, 'Total 5 bangun datar.'),
    bs('Jaring-jaring limas segiempat beralas persegi tersusun dari 1 persegi dan 4 segitiga.', true, 'Alas persegi, 4 sisi tegak segitiga.'),
    bs('Semua sisi limas segiempat berbentuk segitiga.', false, 'Alasnya persegi.'),
    bs('Jaring-jaring limas segitiga tersusun dari 4 segitiga.', true, 'Semua sisinya segitiga.'),
    bs('Enam segitiga dapat membentuk limas segiempat.', false, 'Limas segiempat perlu 1 persegi dan 4 segitiga.'),
    bs('Jika ketiga pasang persegi panjang jaring-jaring balok sama ukuran, bangunnya kubus.', true, 'Semua sisi sama.'),
    bs('Rumus Euler V − E + F = 2 berlaku untuk bangun ruang bersisi datar.', true, 'Kubus: 8 − 12 + 6 = 2.'),
    bs('Limas segiempat memiliki 5 titik sudut, 8 rusuk, dan 5 sisi.', true, '5 − 8 + 5 = 2.'),
    bs('Luas permukaan balok 8 × 5 × 3 adalah 79 cm².', false, '2 × 79 = 158 cm².', balok(8, 5, 3)),
    bs('Luas permukaan kubus bersisi 7 cm adalah 294 cm².', true, '6 × 49.'),
  ],
  debat: [
    debat('Dedi dan Eka menghitung luas permukaan balok 8 × 5 × 3 cm.', ['Dedi: "40 + 24 + 15 = 79 cm²."', 'Eka: "2 × (40 + 24 + 15) = 158 cm²."'], 1, 'Tiap pasang ada dua sisi.', balok(8, 5, 3)),
    debat('Gita dan Hadi menilai blok 2 × 3 enam persegi.', ['Gita: "Pasti jaring-jaring kubus, ada 6 persegi."', 'Hadi: "Bukan; saat dilipat ada yang bertumpuk."'], 1, 'Susunan harus tepat.', netPetak([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]])),
    debat('Ira dan Joni menghitung rusuk limas segiempat.', ['Ira: "9 rusuk."', 'Joni: "8 rusuk; 5 − 8 + 5 = 2."'], 1, 'Gunakan Euler untuk memeriksa.'),
    debat('Kiki dan Lani membahas jaring-jaring prisma segitiga.', ['Kiki: "3 segitiga dan 2 persegi panjang."', 'Lani: "2 segitiga dan 3 persegi panjang."'], 1, 'Alas dan tutup segitiga.'),
    debat('Made dan Nia menilai jaring-jaring dengan 6 persegi panjang berukuran berbeda semua.', ['Made: "Bisa jadi balok."', 'Nia: "Tidak; harus ada 3 pasang kongruen."'], 1, 'Sisi berhadapan balok sama.'),
    debat('Oka dan Putri menghitung kain tenda limas beralas persegi 4 m, tinggi sisi tegak 3 m (alas tidak dipakai).', ['Oka: "16 + 24 = 40 m²."', 'Putri: "Hanya 4 segitiga: 24 m²."'], 1, 'Alas menyentuh tanah.'),
  ],
  bank: [
    isi('Sebuah kubus memiliki jaring-jaring dari ... persegi.', '6', 'Sama dengan jumlah sisi.'),
    isi('Balok memiliki jaring-jaring dari ... persegi panjang.', '6', 'Tiga pasang kongruen.'),
    isi('Prisma segitiga memiliki jaring-jaring dari ... persegi panjang.', '3', 'Dan 2 segitiga.'),
    isi('Prisma segitiga memiliki jaring-jaring dari ... bangun datar secara total.', '5', '2 + 3.'),
    isi('Limas segiempat beralas persegi memiliki ... segitiga pada jaring-jaringnya.', '4', 'Sisi tegak.'),
    isi('Jumlah sisi sebuah kubus adalah ...', '6', 'Enam persegi.'),
    isi('Jaring-jaring kubus bersisi 4 cm. Berapa cm² luas satu persegi?', '16', '4 × 4.'),
    isi('Jaring-jaring kubus bersisi 5 cm. Berapa cm² luas satu persegi?', '25', '5 × 5.'),
    isi('Jaring-jaring kubus bersisi 9 cm. Berapa cm² luas satu persegi?', '81', '9 × 9.'),
    isi('Luas satu persegi pada jaring-jaring kubus 64 cm². Berapa cm sisi kubus?', '8', '√64.'),
    isi('Luas satu persegi pada jaring-jaring kubus 36 cm². Berapa cm sisi kubus?', '6', '√36.'),
    isi('Satu pasang persegi panjang pada jaring-jaring balok berukuran 10 cm × 6 cm. Berapa cm² luas satu persegi panjang?', '60', '10 × 6.'),
    isi('Berapa cm² luas permukaan kubus bersisi 7 cm?', '294', '6 × 49.'),
    isi('Balok 8 × 5 × 3 cm. Berapa cm² luas permukaannya?', '158', '2(40 + 24 + 15).', balok(8, 5, 3)),
    isi('Balok 9 × 4 × 2 cm. Berapa cm² luas permukaannya?', '124', '2(36 + 18 + 8).'),
    isi('Kado balok 20 × 15 × 10 cm. Berapa cm² kertas minimal?', '1300', '2 × 650.'),
    isi('Kado balok 25 × 12 × 8 cm. Berapa cm² kertas minimal?', '1192', '2(300 + 200 + 96).'),
    isi('Kubus bersisi 12 cm dicat, Rp50 per cm². Berapa rupiah biayanya?', '43200', '864 × 50.'),
    isi('Prisma segitiga siku-siku 3, 4, 5 cm dan tinggi prisma 10 cm. Berapa cm² luas permukaannya?', '132', '12 + 120.'),
    isi('Kotak cokelat prisma, alas segitiga siku-siku 6, 8, 10 cm; panjang 15 cm. Berapa cm² karton?', '408', '48 + 360.'),
    isi('Limas segiempat beralas persegi 6 cm, tinggi sisi tegak 5 cm. Berapa cm² luas permukaannya?', '96', '36 + 60.'),
    isi('Tenda limas beralas persegi 4 m, tinggi sisi tegak 3 m, tanpa alas. Berapa m² kain?', '24', '4 × 6.'),
    isi('Balok luas permukaan 280 cm², panjang 10, lebar 6. Berapa cm tingginya?', '5', '16t = 80.'),
    isi('Bola berdiameter 10 cm dikemas dalam kubus yang pas. Berapa cm² karton?', '600', '6 × 100.'),
    isi('Bangun ruang bersisi datar memiliki 6 titik sudut dan 5 sisi. Berapa rusuknya?', '9', '6 + 5 − 2.'),
    isi('Bangun ruang bersisi datar memiliki 4 titik sudut dan 4 sisi. Berapa rusuknya?', '6', '4 + 4 − 2.'),
    pg('Jaring-jaring bangun ruang adalah ...', ['bentuk datar yang jika dilipat membentuk bangun ruang', 'bangun ruang yang dipotong', 'gambar bangun ruang dari samping', 'daftar rusuk bangun ruang'], 0, 'Dilipat mengikuti rusuk.'),
    pg('Prisma segitiga memiliki jaring-jaring dari ...', ['2 segitiga dan 3 persegi panjang', '3 segitiga dan 2 persegi panjang', '5 segitiga', '1 segitiga dan 4 persegi panjang'], 0, 'Alas dan tutup segitiga.'),
    pg('Limas segiempat beralas persegi memiliki jaring-jaring dari ...', ['1 persegi dan 4 segitiga', '4 segitiga', '2 persegi dan 4 segitiga', '1 persegi dan 3 segitiga'], 0, 'Alas persegi.'),
    pg('Pasangan bangun ruang dan jumlah sisinya yang sesuai ...', ['Prisma segitiga − 5 sisi', 'Prisma segitiga − 6 sisi', 'Limas segiempat − 4 sisi', 'Balok − 8 sisi'], 0, '2 + 3 = 5.'),
    pg('Pasangan bangun ruang dan penyusun jaring-jaringnya ...', ['Limas segitiga − seluruhnya segitiga', 'Kubus − segitiga', 'Balok − persegi saja', 'Prisma segitiga − seluruhnya persegi'], 0, '4 segitiga.'),
    pg('Susunan 4 persegi berjejer plus satu persegi di atas dan satu di bawah persegi ke-2 ...', ['jaring-jaring kubus yang valid', 'bukan jaring-jaring kubus', 'jaring-jaring balok', 'tidak dapat dinilai'], 0, 'Pola salib.'),
    pg('Rangkaian 2 segitiga dan 3 persegi panjang tetap bisa gagal membentuk prisma karena ...', ['susunan penempelannya juga harus benar', 'jumlahnya terlalu banyak', 'segitiga tidak boleh dipakai', 'persegi panjang harus kongruen'], 0, 'Jumlah dan jenis benar belum cukup.'),
    pg('Rumus Euler untuk bangun ruang bersisi datar adalah ...', ['V − E + F = 2', 'V + E + F = 2', 'V − E − F = 2', 'V + E − F = 2'], 0, 'Titik sudut − rusuk + sisi.'),
    pg('Siswa: "Limas segiempat V = 5, E = 9, F = 5." Kesalahannya ...', ['E seharusnya 8', 'V seharusnya 6', 'F seharusnya 4', 'Tidak ada kesalahan'], 0, '5 − 8 + 5 = 2.'),
    pg('Siswa: "Luas balok 8 × 5 × 3 = 40 + 24 + 15 = 79 cm²." Kesalahannya ...', ['Lupa mengalikan 2', 'Salah menjumlah', 'Harus dikalikan 3', 'Tidak ada'], 0, '158 cm².'),
    pg('Kotak B (12 × 6 × 6 cm) dan kotak A (10 × 8 × 5 cm). Yang butuh lebih banyak karton ...', ['Kotak B (360 cm² vs 340 cm²)', 'Kotak A', 'Sama', 'Tidak dapat dihitung'], 0, 'LP B = 2(72 + 72 + 36) = 360.'),
    pg('Kubus bersisi 9 cm dan balok 10 × 9 × 8 cm. Yang butuh lebih banyak karton ...', ['Kubus (486 cm² vs 484 cm²)', 'Balok', 'Sama', 'Tidak dapat dihitung'], 0, '486 > 484.'),
    pg('Balok dengan pasangan 6 × 4, 6 × 3, dan 4 × 3 cm berukuran ...', ['6 × 4 × 3 cm', '6 × 6 × 4 cm', '4 × 3 × 3 cm', '6 × 3 × 3 cm'], 0, 'Tiga ukuran dari tiga pasang.'),
    gen('luasKubus'),
    gen('sisiDariLuas'),
    gen('lpKubus'),
    gen('lpBalok'),
    gen('euler'),
    gen('lpPrisma'),
  ],
}
