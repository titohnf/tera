import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { lapis, petak } from '../gambar'

/**
 * Bahan latihan AC-25 (Pangkat dua, pangkat tiga, akar kuadrat, akar pangkat
 * tiga).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * pangkat dua = bilangan dikali dirinya sendiri, pangkat tiga = tiga kali,
 * akar kuadrat dan akar pangkat tiga sebagai operasi kebalikan, bilangan
 * pangkat dua dan pangkat tiga sempurna, cerita (luas persegi, volume kubus,
 * sisi dari luas, rusuk dari volume), bilangan desimal ((0,3) pangkat dua =
 * 0,09, akar kuadrat 0,49 = 0,7, akar pangkat tiga 0,125 = 0,5), dan
 * perbandingan (kuadrat bilangan lebih dari 1 membesar, kurang dari 1
 * mengecil; akar kuadrat bilangan lebih dari 1 mengecil, kurang dari 1
 * membesar; pangkat tiga lebih besar dari pangkat dua hanya untuk bilangan di
 * atas 1; akar 0 dan 1 sama dengan dirinya). Salah paham: 5 pangkat dua = 10,
 * 4 pangkat tiga = 12, akar kuadrat 16 = 8, akar pangkat tiga 27 = 9,
 * (0,5) pangkat dua = 1, akar kuadrat 0,25 = 0,125.
 *
 * Jawaban desimal ditulis dengan koma (titik dibuang saat mencocokkan).
 *
 * `GEN.kuadrat` pangkat dua (atau luas persegi), `GEN.kubik` pangkat tiga (atau
 * volume kubus), `GEN.akar2` akar kuadrat (atau sisi dari luas), `GEN.akar3`
 * akar pangkat tiga, `GEN.desKuad` kuadrat desimal, `GEN.desAkar` akar desimal.
 */
const JS = String.raw`
function dua(p){return p<10?'0'+p:String(p)}
GEN.kuadrat=function(){
  var n=rnd(2,15),j=rnd(0,2);
  if(j===0)return {t:'isi',q:'Berapa hasil dari '+n+' pangkat dua ('+n+'^2)?',a:[String(n*n)],e:n+'^2 = '+n+' x '+n+' = '+(n*n)+', bukan '+n+' x 2.',g:n<=12?{k:'petak',n:n}:null};
  if(j===1)return {t:'isi',q:'Sebuah persegi memiliki panjang sisi '+n+' cm. Berapa luasnya (cm persegi)?',a:[String(n*n)],e:'Luas = sisi x sisi = '+n+' x '+n+' = '+(n*n)+'.',g:n<=12?{k:'petak',n:n}:null};
  return {t:'isi',q:'Taman persegi bersisi '+n+' meter. Berapa luas taman (meter persegi)?',a:[String(n*n)],e:n+' x '+n+' = '+(n*n)+'.',g:n<=12?{k:'petak',n:n}:null};
};
GEN.kubik=function(){
  var n=rnd(2,9);
  if(rnd(0,1)===0)return {t:'isi',q:'Berapa hasil dari '+n+' pangkat tiga ('+n+'^3)?',a:[String(n*n*n)],e:n+'^3 = '+n+' x '+n+' x '+n+' = '+(n*n*n)+', bukan '+n+' x 3.',g:n<=6?{k:'lapis',n:n}:null};
  return {t:'isi',q:'Sebuah kubus memiliki panjang rusuk '+n+' cm. Berapa volumenya (cm kubik)?',a:[String(n*n*n)],e:'Volume = rusuk x rusuk x rusuk = '+n+' x '+n+' x '+n+' = '+(n*n*n)+'.',g:n<=6?{k:'lapis',n:n}:null};
};
GEN.akar2=function(){
  var n=rnd(2,15);
  if(rnd(0,1)===0)return {t:'isi',q:'Berapa hasil akar kuadrat dari '+(n*n)+'?',a:[String(n)],e:n+' x '+n+' = '+(n*n)+', jadi akar kuadrat '+(n*n)+' = '+n+', bukan '+(n*n)+' : 2.',g:n<=12?{k:'petak',n:n}:null};
  return {t:'isi',q:'Sebuah persegi memiliki luas '+(n*n)+' cm persegi. Berapa panjang sisinya (cm)?',a:[String(n)],e:'Sisi x sisi = '+(n*n)+', jadi sisi = '+n+'.',g:n<=12?{k:'petak',n:n}:null};
};
GEN.akar3=function(){
  var n=rnd(2,10);
  return {t:'isi',q:'Berapa hasil akar pangkat tiga dari '+(n*n*n)+'?',a:[String(n)],e:n+' x '+n+' x '+n+' = '+(n*n*n)+', jadi akar pangkat tiga '+(n*n*n)+' = '+n+', bukan '+(n*n*n)+' : 3.',g:n<=6?{k:'lapis',n:n}:null};
};
GEN.desKuad=function(){
  var d=rnd(1,9);
  return {t:'isi',q:'Berapa hasil dari (0,'+d+') pangkat dua?',a:['0,'+dua(d*d)],e:'0,'+d+' x 0,'+d+' = 0,'+dua(d*d)+'. Bukan 0,'+d+' x 2.',g:{k:'petak',n:10,isi:d}};
};
GEN.desAkar=function(){
  var d=rnd(1,9);
  return {t:'isi',q:'Berapa hasil akar kuadrat dari 0,'+dua(d*d)+'?',a:['0,'+d],e:'0,'+d+' x 0,'+d+' = 0,'+dua(d*d)+', jadi akar kuadrat 0,'+dua(d*d)+' = 0,'+d+'.',g:{k:'petak',n:10,isi:d}};
};
`

export const DATA_AC25: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('5 pangkat dua (5²) sama dengan 5 × 5 = 25.', true, 'Pangkat dua berarti bilangan dikali dirinya sendiri.', petak(5)),
    bs('5 pangkat dua sama dengan 5 × 2 = 10.', false, 'Bukan dikali 2, tetapi dikali dirinya sendiri: 5 × 5 = 25.', petak(5)),
    bs('4 pangkat tiga (4³) sama dengan 4 × 4 × 4 = 64.', true, 'Tiga faktor 4.', lapis(4)),
    bs('4 pangkat tiga sama dengan 4 × 3 = 12.', false, '4³ = 64, bukan 12.', lapis(4)),
    bs('Akar kuadrat suatu bilangan adalah bilangan yang jika dikalikan dirinya sendiri menghasilkan bilangan itu.', true, '√49 = 7 karena 7 × 7 = 49.'),
    bs('Akar pangkat tiga suatu bilangan adalah bilangan yang jika dikalikan tiga kali dirinya menghasilkan bilangan itu.', true, '∛64 = 4 karena 4 × 4 × 4 = 64.', lapis(4)),
    bs('Akar kuadrat 16 adalah 8 karena 16 : 2 = 8.', false, 'Akar kuadrat 16 adalah 4 karena 4 × 4 = 16.', petak(4)),
    bs('Akar pangkat tiga 27 adalah 9 karena 27 : 3 = 9.', false, 'Akar pangkat tiga 27 adalah 3 karena 3 × 3 × 3 = 27.', lapis(3)),
    bs('Pangkat dua dan akar kuadrat adalah operasi yang saling berkebalikan.', true, '7² = 49 dan √49 = 7.'),
    bs('Kubus berusuk 5 cm memiliki volume 125 cm kubik.', true, '5 × 5 × 5 = 125.', lapis(5)),
    bs('Persegi bersisi 7 m memiliki luas 49 m persegi.', true, '7 × 7 = 49.', petak(7)),
    bs('(0,3) pangkat dua sama dengan 0,09.', true, '0,3 × 0,3 = 0,09.', petak(10, 3)),
    bs('(0,5) pangkat dua sama dengan 1.', false, '0,5 × 0,5 = 0,25.', petak(10, 5)),
    bs('Akar kuadrat 0,49 adalah 0,7.', true, '0,7 × 0,7 = 0,49.', petak(10, 7)),
    bs('Akar kuadrat 0,25 sama dengan 0,125 karena 0,25 : 2.', false, 'Akar kuadrat 0,25 adalah 0,5 karena 0,5 × 0,5 = 0,25.', petak(10, 5)),
    bs('Mengkuadratkan bilangan desimal kurang dari 1 menghasilkan bilangan yang lebih kecil.', true, '0,5² = 0,25 < 0,5.'),
    bs('Mengkuadratkan bilangan yang lebih dari 1 menghasilkan bilangan yang lebih besar.', true, '6² = 36 > 6.'),
    bs('Akar kuadrat bilangan yang lebih dari 1 selalu lebih kecil daripada bilangan itu.', true, '√81 = 9 < 81.'),
    bs('Akar kuadrat suatu bilangan SELALU lebih kecil daripada bilangan itu.', false, '√0,25 = 0,5 lebih besar dari 0,25.'),
  ],
  debat: [
    debat('Made dan Wati menghitung 5 pangkat dua.', ['Made: "10, karena 5 × 2."', 'Wati: "25, karena 5 × 5."'], 1, 'Pangkat dua berarti dikali dirinya sendiri.', petak(5)),
    debat('Wati dan Rian menghitung 4 pangkat tiga.', ['Wati: "12."', 'Rian: "64, karena 4 × 4 × 4."'], 1, 'Tiga faktor 4.', lapis(4)),
    debat('Rian dan Sinta mencari akar kuadrat 16.', ['Rian: "8, dibagi 2."', 'Sinta: "4, karena 4 × 4 = 16."'], 1, 'Akar kuadrat adalah kebalikan pangkat dua.', petak(4)),
    debat('Sinta dan Dedi mencari akar pangkat tiga 27.', ['Sinta: "9, dibagi 3."', 'Dedi: "3, karena 3 × 3 × 3 = 27."'], 1, 'Periksa dengan memangkatkan tiga.', lapis(3)),
    debat('Dedi dan Made menghitung (0,5) pangkat dua.', ['Dedi: "1, karena 0,5 × 2."', 'Made: "0,25, karena 0,5 × 0,5."'], 1, 'Dikali dirinya sendiri, bukan dengan 2.', petak(10, 5)),
    debat('Made dan Kiki membahas "pangkat tiga selalu lebih besar daripada pangkat dua".', ['Made: "Selalu, untuk semua bilangan."', 'Kiki: "Hanya untuk bilangan di atas 1. Untuk 0,5: 0,125 < 0,25."'], 1, 'Untuk bilangan di bawah 1, pangkat tiga justru lebih kecil.'),
  ],
  bank: [
    isi('Berapa hasil dari 3 pangkat dua (3^2)?', '9', '3 × 3 = 9.', petak(3)),
    isi('Berapa hasil dari 6 pangkat dua (6^2)?', '36', '6 × 6 = 36.', petak(6)),
    isi('Berapa hasil dari 8 pangkat dua (8^2)?', '64', '8 × 8 = 64.', petak(8)),
    isi('Berapa hasil dari 9 pangkat dua (9^2)?', '81', '9 × 9 = 81.', petak(9)),
    isi('Berapa hasil dari 2 pangkat tiga (2^3)?', '8', '2 × 2 × 2 = 8.', lapis(2)),
    isi('Berapa hasil akar kuadrat dari 49?', '7', '7 × 7 = 49.', petak(7)),
    isi('Berapa hasil akar kuadrat dari 36?', '6', '6 × 6 = 36.', petak(6)),
    isi('Berapa hasil akar pangkat tiga dari 8?', '2', '2 × 2 × 2 = 8.', lapis(2)),
    isi('Berapa hasil akar pangkat tiga dari 64?', '4', '4 × 4 × 4 = 64.', lapis(4)),
    isi('Berapa hasil akar pangkat tiga dari 125?', '5', '5 × 5 × 5 = 125.', lapis(5)),
    isi('Berapa hasil (0,2) pangkat dua?', ['0,04'], '0,2 × 0,2 = 0,04.', petak(10, 2)),
    isi('Tentukan bilangan desimal x sehingga x pangkat dua sama dengan 0,64.', ['0,8'], '0,8 × 0,8 = 0,64.', petak(10, 8)),
    isi('Taman persegi bersisi 7 meter. Berapa luasnya (meter persegi)?', '49', '7 × 7 = 49.', petak(7)),
    isi('Persegi bersisi 8 cm. Berapa luasnya (cm persegi)?', '64', '8 × 8 = 64.', petak(8)),
    isi('Kubus berusuk 5 cm. Berapa volumenya (cm kubik)?', '125', '5 × 5 × 5 = 125.', lapis(5)),
    isi('Kubus berusuk 6 cm. Berapa volumenya (cm kubik)?', '216', '6 × 6 × 6 = 216.', lapis(6)),
    isi('Persegi memiliki luas 81 cm persegi. Berapa panjang sisinya?', '9', '9 × 9 = 81.', petak(9)),
    isi('Kolam berbentuk kubus bervolume 1.000 dm kubik. Berapa rusuknya (dm)?', '10', '10 × 10 × 10 = 1.000.'),
    isi('Tentukan bilangan cacah n sehingga n pangkat tiga sama dengan 216.', '6', '6 × 6 × 6 = 216.', lapis(6)),
    isi('Tentukan bilangan cacah a sehingga akar pangkat tiga dari a sama dengan 6.', '216', '6³ = 216.'),
    pg('Manakah yang merupakan bilangan pangkat dua sempurna?', ['25', '20', '30', '35'], 0, '25 = 5 × 5.', petak(5)),
    pg('Manakah bilangan yang jika dipangkatkan tiga menghasilkan 125?', ['5', '25', '15', '375'], 0, '5 × 5 × 5 = 125.', lapis(5)),
    pg('Akar kuadrat dari 16 adalah...', ['4, karena 4 × 4 = 16', '8, karena 16 : 2 = 8', '2, karena 16 : 8 = 2', '6'], 0, '4 × 4 = 16.', petak(4)),
    pg('Manakah hasil (0,3) pangkat dua?', ['0,09', '0,6', '0,9', '0,06'], 0, '0,3 × 0,3 = 0,09.', petak(10, 3)),
    pg('Wati menghitung akar pangkat tiga 64 dengan 64 : 3 = 21,3. Apa kesalahannya?', ['Akar pangkat tiga 64 adalah 4 karena 4 × 4 × 4 = 64', 'Tidak ada, 21,3 benar', 'Seharusnya dibagi 2'], 0, 'Akar tidak sama dengan dibagi.', lapis(4)),
    pg('Made menghitung akar kuadrat 0,16 dengan 0,16 : 4 = 0,04. Berapa yang benar?', ['0,4, karena 0,4 × 0,4 = 0,16', '0,04', '0,08'], 0, 'Periksa: 0,4 × 0,4 = 0,16.', petak(10, 4)),
    pg('Untuk akar kuadrat 0,36, manakah cara yang benar?', ['Cari n sehingga n × n = 0,36, yaitu 0,6', 'Bagi 0,36 dengan 2, yaitu 0,18'], 0, '0,6 × 0,6 = 0,36.', petak(10, 6)),
    pg('Wati: "Akar kuadrat suatu bilangan selalu lebih kecil dari bilangannya." Apakah benar?', ['Salah. √0,25 = 0,5 lebih besar dari 0,25', 'Benar untuk semua bilangan'], 0, 'Untuk bilangan di bawah 1, akarnya lebih besar.'),
    pg('Sinta: "n pangkat tiga selalu lebih besar daripada n pangkat dua." Apakah benar?', ['Salah. Untuk 0,5: pangkat tiga 0,125 lebih kecil dari pangkat dua 0,25', 'Benar untuk bilangan positif apa pun'], 0, 'Hanya untuk bilangan di atas 1.'),
    pg('Rian: "Akar kuadrat 0 dan 1 sama dengan bilangannya." Apakah benar?', ['Benar: 0 × 0 = 0 dan 1 × 1 = 1', 'Salah, akar 1 adalah 2'], 0, '0 dan 1 tidak berubah oleh pangkat maupun akar.'),
    pg('Pangkat dua dan akar kuadrat saling membatalkan. Jika 7 dikuadratkan lalu diakarkan, hasilnya...', ['7', '49', '14'], 0, '√49 = 7.'),
    gen('kuadrat'),
    gen('kuadrat'),
    gen('kubik'),
    gen('akar2'),
    gen('akar2'),
    gen('akar3'),
    gen('desKuad'),
    gen('desAkar'),
  ],
}
