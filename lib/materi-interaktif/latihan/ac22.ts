import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { bulat, nilai } from '../gambar'

/**
 * Bahan latihan AC-22 (Operasi hitung bilangan cacah sampai ribuan,
 * pembulatan, dan estimasi).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * nilai tempat, tambah dan kurang bersusun (meminjam berantai melewati nol:
 * 500 - 236, 4.000 - 2.345, 5.000 - 3.456), perkalian dipecah menurut nilai
 * tempat (345 x 23) dan baris kedua bersusun yang harus digeser, pembagian
 * bersusun dengan sisa (sisa harus lebih kecil dari pembagi; 17 : 5 = 3 sisa
 * 2; 1.345 : 4 = 336 sisa 1; truk untuk 1.248 kotak), pembulatan (angka
 * acuan 5 atau lebih ke atas, kurang dari 5 ke bawah), estimasi (bulatkan
 * dulu, hasil tidak harus persis, cukup uang atau tidak), sifat operasi
 * (komutatif dan asosiatif; pengurangan dan pembagian TIDAK komutatif), dan
 * soal rancang bilangan. Salah paham: pembulatan selalu ke bawah, lupa
 * menggeser baris kedua, sisa boleh sebesar pembagi, estimasi harus persis,
 * satuan pembulatan lebih kecil SELALU lebih akurat, pembulatan ke atas
 * pasti memberi estimasi lebih besar dari hasil sebenarnya.
 *
 * Jawaban angka besar ditulis tanpa titik ribuan (titik dibuang saat
 * mencocokkan). Soal sisa menjawab "hasil sisa sisa" (mis. 336 sisa 1).
 *
 * `GEN.kurang` pengurangan melewati nol, `GEN.kali` perkalian 3 angka kali
 * 2 angka, `GEN.bagi` pembagian dengan sisa, `GEN.bulat` pembulatan, `GEN.taksir`
 * estimasi penjumlahan atau pengurangan.
 */
const JS = String.raw`
function bulG(n,u){return Math.round(n/u)*u}
GEN.kurang=function(){
  var A=[500,600,800,1000,2000,3000,4000,5000,6000,9000],a=A[rnd(0,A.length-1)],b=rnd(Math.floor(a/10)+7,Math.floor(a*0.9));
  if(b%10===0)b+=3;
  return {t:'isi',q:'Hitunglah '+titikRibu(a)+' - '+titikRibu(b)+'.',a:[String(a-b)],e:'Pinjam berantai melewati angka nol: '+titikRibu(a)+' - '+titikRibu(b)+' = '+titikRibu(a-b)+'.'};
};
GEN.kali=function(){
  var a=rnd(101,499),b=rnd(11,29);
  return {t:'isi',q:'Hitunglah '+a+' x '+b+'.',a:[String(a*b)],e:a+' x '+b+' = '+a+' x '+(b-b%10)+' + '+a+' x '+(b%10)+' = '+(a*(b-b%10))+' + '+(a*(b%10))+' = '+(a*b)+'.'};
};
GEN.bagi=function(){
  var d=rnd(3,9),q=rnd(12,200),s=rnd(0,d-1),n=q*d+s;
  var jaw=s>0?q+' sisa '+s:String(q);
  return {t:'isi',q:'Hitunglah '+titikRibu(n)+' : '+d+'. (jika ada sisa, tulis "hasil sisa sisa", contoh: 10 sisa 2)',a:[jaw],e:q+' x '+d+' = '+(q*d)+(s>0?', sisanya '+n+' - '+(q*d)+' = '+s+', lebih kecil dari '+d+'.':', tanpa sisa.')};
};
GEN.bulat=function(){
  var T=[['puluhan',10],['ratusan',100],['ribuan',1000]],t=T[rnd(0,2)],n=rnd(t[1]===10?11:(t[1]===100?101:1001),9899),r=bulG(n,t[1]),ac=Math.floor(n/(t[1]/10))%10;
  return {t:'isi',q:'Bulatkan '+titikRibu(n)+' ke '+t[0]+' terdekat.',a:[String(r)],e:'Angka acuan '+ac+': '+(ac>=5?'5 atau lebih, dibulatkan ke atas.':'kurang dari 5, dibulatkan ke bawah.')+' Hasilnya '+titikRibu(r)+'.',g:{k:'bulat',n:n,t:t[0]}};
};
GEN.taksir=function(){
  var T=[['ratusan',100],['ribuan',1000]],t=T[rnd(0,1)],a=rnd(2000,8999),b=rnd(1000,Math.min(a-500,5999)),plus=rnd(0,1)===0,u=t[1];
  var ra=bulG(a,u),rb=bulG(b,u),est=plus?ra+rb:ra-rb;
  if(est<=0)return GEN.taksir();
  return {t:'isi',q:'Taksir '+titikRibu(a)+(plus?' + ':' - ')+titikRibu(b)+' dengan membulatkan masing-masing ke '+t[0]+' terdekat.',a:[String(est)],e:titikRibu(a)+' ≈ '+titikRibu(ra)+' dan '+titikRibu(b)+' ≈ '+titikRibu(rb)+', jadi taksirannya '+titikRibu(est)+'.'};
};
`

export const DATA_AC22: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Pada bilangan 3.456 angka 4 berada pada tempat ratusan.', true, '3 ribuan, 4 ratusan, 5 puluhan, 6 satuan.', nilai(3456, 4, 1)),
    bs('5.000 - 3.456 = 2.556.', false, 'Hasilnya 1.544. 2.556 muncul bila tiap kolom hanya mengurangkan angka kecil dari besar tanpa meminjam.'),
    bs('Pada 4.000 - 2.345, pinjaman merambat dari ribuan lewat ratusan dan puluhan.', true, 'Angka 0 tidak bisa dipinjami, jadi pinjam dari angka bukan nol pertama.'),
    bs('500 - 236 = 264.', true, '500 = 4 ratusan + 9 puluhan + 10 satuan, lalu dikurangi 236.'),
    bs('345 × 23 = 345 × 20 + 345 × 3.', true, 'Pecah 23 menjadi 20 + 3, lalu jumlahkan: 6.900 + 1.035 = 7.935.'),
    bs('Pada perkalian bersusun, baris kedua (dari angka puluhan) harus digeser satu tempat ke kiri.', true, 'Baris kedua bernilai puluhan. Jika tidak digeser, hasilnya jauh lebih kecil.'),
    bs('Pada pembagian bersusun, sisa boleh sama dengan pembagi.', false, 'Sisa harus lebih kecil daripada pembagi. Jika sama atau lebih, bagilah sekali lagi.'),
    bs('17 : 5 = 3 sisa 2.', true, '3 × 5 = 15 dan 17 - 15 = 2, lebih kecil dari 5.'),
    bs('Membulatkan 47 ke puluhan terdekat menghasilkan 50.', true, 'Angka acuan 7 (5 atau lebih), jadi ke atas.', bulat(47, 'puluhan')),
    bs('Jika angka acuan kurang dari 5, bilangan dibulatkan ke bawah.', true, '6.234 ke ratusan: acuan 3, jadi 6.200.', bulat(6234, 'ratusan')),
    bs('Pembulatan sebaiknya selalu ke bawah supaya aman.', false, 'Arah pembulatan ditentukan oleh angka acuan, bukan keinginan.'),
    bs('3.456 dibulatkan ke ratusan terdekat adalah 3.500.', true, 'Angka acuan (puluhan) adalah 5, jadi dibulatkan ke atas.', bulat(3456, 'ratusan')),
    bs('Hasil estimasi harus persis sama dengan hasil sebenarnya.', false, 'Estimasi cukup mendekati nilai sebenarnya.'),
    bs('Estimasi 2.987 + 4.012 ≈ 7.000 gagal karena hasil sebenarnya 6.999.', false, 'Selisihnya hanya 1. Estimasi hanya perlu mendekati.'),
    bs('Penjumlahan bersifat komutatif: 234 + 567 = 567 + 234.', true, 'Urutan bilangan boleh dibalik pada penjumlahan.'),
    bs('Pengurangan bersifat komutatif seperti penjumlahan.', false, '10 - 3 = 7, tetapi 3 - 10 bukan 7.'),
    bs('Pembagian bersifat komutatif seperti perkalian.', false, '12 : 3 = 4, tetapi 3 : 12 bukan 4.'),
  ],
  debat: [
    debat('Made dan Wati menghitung 5.000 - 3.456.', ['Made: "Hasilnya 2.556."', 'Wati: "Hasilnya 1.544. Pinjam berantai melewati nol."'], 1, '3.456 + 1.544 = 5.000.'),
    debat('Rian dan Kiki membulatkan 3.456 ke ratusan.', ['Rian: "3.400, selalu ke bawah."', 'Kiki: "3.500, karena angka puluhan 5 sehingga ke atas."'], 1, 'Angka acuan 5 atau lebih dibulatkan ke atas.', bulat(3456, 'ratusan')),
    debat('Dedi menghitung 17 : 5.', ['Dedi: "Hasilnya 3 saja."', 'Sinta: "3 sisa 2, karena 17 - 15 = 2."'], 1, 'Sisa tidak boleh dilupakan.'),
    debat('Budi dan Ani membahas pengurangan.', ['Budi: "10 - 3 sama dengan 3 - 10."', 'Ani: "Tidak. Pengurangan tidak komutatif."'], 1, '10 - 3 = 7, tetapi 3 - 10 tidak menghasilkan 7.'),
    debat('Eka dan Fajar membahas 234 × 12 bersusun.', ['Eka: "Baris kedua ditulis 234 tanpa digeser."', 'Fajar: "Baris kedua harus 2.340, digeser satu tempat."'], 1, 'Baris kedua bernilai puluhan, jadi 234 × 10 = 2.340.'),
    debat('Gita dan Hadi membahas satuan pembulatan.', ['Gita: "Pembulatan ke puluhan selalu lebih akurat daripada ke ratusan."', 'Hadi: "Biasanya lebih akurat, tetapi tidak selalu, bergantung bilangannya."'], 1, 'Satuan lebih kecil biasanya lebih dekat, tetapi tidak dijamin untuk semua bilangan.'),
  ],
  bank: [
    isi('Hitunglah 500 - 236.', '264', 'Pinjam berantai: 500 - 236 = 264.'),
    isi('Hitunglah 1.000 - 645.', '355', '1.000 - 645 = 355.'),
    isi('Hitunglah 4.000 - 2.345.', '1655', 'Pinjam berantai dari ribuan: hasilnya 1.655.'),
    isi('Hitunglah 345 × 23.', '7935', '345 × 20 = 6.900 dan 345 × 3 = 1.035, jumlahnya 7.935.'),
    isi('Hitunglah 234 × 12.', '2808', '234 × 10 = 2.340 dan 234 × 2 = 468, jumlahnya 2.808.'),
    isi('Hitunglah 345 + 678.', '1023', '345 + 678 = 1.023.'),
    isi('Hitunglah 3.678 + 1.956.', '5634', '3.678 + 1.956 = 5.634.'),
    isi('Hitunglah 1.345 : 4. (tulis "hasil sisa sisa")', ['336 sisa 1'], '4 × 336 = 1.344, sisanya 1.'),
    isi('Hitunglah 84 : 4.', '21', '4 × 21 = 84.'),
    isi('Bulatkan 6.782 ke ratusan terdekat.', '6800', 'Angka acuan 8, ke atas: 6.800.', bulat(6782, 'ratusan')),
    isi('Bulatkan 6.782 ke ribuan terdekat.', '7000', 'Angka acuan 7, ke atas: 7.000.', bulat(6782, 'ribuan')),
    isi('Bulatkan 47 ke puluhan terdekat.', '50', 'Angka acuan 7, ke atas: 50.', bulat(47, 'puluhan')),
    isi('Sebuah toko punya 1.248 kotak. Tiap truk mengangkut 6 kotak. Berapa truk paling sedikit?', '208', '1.248 : 6 = 208 tanpa sisa.'),
    isi('Estimasi 6.789 - 2.345 dengan pembulatan ke ribuan menjadi 7.000 - 2.000 = 5.000. Hasil sebenarnya 4.444. Berapa selisihnya?', '556', '5.000 - 4.444 = 556.'),
    isi('Rancang bilangan yang jika dikurangi 1.234 menghasilkan 2.766.', '4000', '2.766 + 1.234 = 4.000.'),
    isi('Rancang bilangan yang jika ditambah 2.345 menghasilkan 6.000.', '3655', '6.000 - 2.345 = 3.655.'),
    isi('Soal pembagian: hasil bagi 15, sisa 3, pembagi 6. Berapa bilangan yang dibagi?', '93', '15 × 6 + 3 = 93.'),
    pg('Manakah bilangan yang dibulatkan ke ratusan terdekat menjadi 3.500?', ['3.521', '3.399', '3.612', '3.449'], 0, '3.521 berada antara 3.500 dan 3.600. Angka acuan (puluhan) 2, jadi ke bawah menjadi 3.500.', bulat(3521, 'ratusan')),
    pg('Pada bilangan 3.456 angka 4 berada pada tempat...', ['ratusan', 'ribuan', 'puluhan', 'satuan'], 0, 'Ribuan 3, ratusan 4, puluhan 5, satuan 6.', nilai(3456, 4, 1)),
    pg('Estimasi 3.456 + 2.890 dengan membulatkan ke ratusan terdekat adalah...', ['6.400', '6.300', '6.500', '6.000'], 0, '3.500 + 2.900 = 6.400.', bulat(3456, 'ratusan')),
    pg('Rian membagi 156 dengan 7 dan menulis "22 sisa 2". Apakah benar?', ['Benar: 22 × 7 = 154 dan 156 - 154 = 2', 'Salah, sisa harus 0', 'Salah, hasil bagi 23'], 0, 'Periksa: 154 + 2 = 156.'),
    pg('Made menulis 5.000 - 3.456 = 2.556. Apa yang salah?', ['Ia tidak meminjam berantai; hasil yang benar 1.544', 'Hasilnya benar', 'Ia salah menjumlahkan'], 0, '3.456 + 1.544 = 5.000.'),
    pg('Wati lupa menggeser baris kedua pada 234 × 12. Akibatnya hasil akhir...', ['jauh lebih kecil dari yang seharusnya', 'jauh lebih besar', 'tetap sama'], 0, 'Baris kedua seharusnya bernilai puluhan.'),
    pg('Manakah aturan pembulatan yang tepat?', ['Acuan kurang dari 5 ke bawah, 5 atau lebih ke atas', 'Selalu ke bawah', 'Selalu ke atas', 'Acuan 5 ke bawah'], 0, 'Itu aturan dasar pembulatan.'),
    pg('Uangmu Rp10.000. Belanja Rp4.650 dan Rp3.780, estimasi ke ribuan 5.000 + 4.000 = 9.000. Apakah uangmu cukup?', ['Ya, 9.000 di bawah 10.000', 'Tidak cukup', 'Tidak bisa diketahui'], 0, 'Hasil sebenarnya 8.430.'),
    pg('Kamu ingin sepasang bilangan yang hasil kalinya 720. Manakah yang memenuhi?', ['24 dan 30', '20 dan 35', '18 dan 42', '25 dan 28'], 0, '24 × 30 = 720.'),
    pg('Hasil bagi 8 dan sisa 3 dengan pembagi 6. Berapa bilangan yang dibagi?', ['51', '48', '54', '45'], 0, '8 × 6 + 3 = 51.'),
    gen('kurang'),
    gen('kurang'),
    gen('kali'),
    gen('kali'),
    gen('bagi'),
    gen('bagi'),
    gen('bulat'),
    gen('bulat'),
    gen('taksir'),
    gen('taksir'),
  ],
}
