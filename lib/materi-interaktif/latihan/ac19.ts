import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { garispec, pita } from '../gambar'

/**
 * Bahan latihan AC-19 (Representasi pecahan dari bagian objek utuh).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * syarat pecahan yang sah (SEMUA bagian sama besar; bentuk boleh beda), posisi
 * pada garis bilangan (bagian ke-k dari n bagian sama besar adalah k/n bila
 * garisnya 0 sampai 1; pada garis 0 sampai m tiap bagian bernilai m/n), pecahan
 * sejati (kurang dari 1), tidak murni (lebih dari atau sama dengan 1), dan
 * campuran, ubah campuran dan tidak murni dua arah (a b/d = (a x d + b)/d),
 * dua bentuk satu nilai dan satu posisi, menjumlahkan bagian dari dua objek
 * utuh (5/8 + 4/8 = 9/8 = 1 1/8), dan salah paham: bagian tidak perlu sama
 * besar, tiap bagian pada garis 0 sampai 3 dibagi 9 bernilai 1/9, 3 1/2 dan
 * 7/2 dua nilai berbeda, jumlah bagian wajib sama dengan penyebut, dan
 * pecahan campuran lebih besar daripada bentuk tidak murni senilainya.
 *
 * `GEN.garis` posisi atau nilai tiap bagian pada garis bilangan, `GEN.campur`
 * ubah campuran dan tidak murni, `GEN.jumlah` jumlah dua bagian objek utuh.
 * Jawaban campuran ditulis dengan spasi ("2 3/4"); penilai membuang spasi.
 */
const JS = String.raw`
GEN.garis=function(){
  if(rnd(0,1)===0){
    var n=rnd(4,9),k=rnd(2,n-1);
    return {t:'isi',q:'Garis bilangan dari 0 sampai 1 dibagi menjadi '+n+' bagian sama besar. Titik P pada bagian ke-'+k+' dari 0. Tuliskan pecahan yang ditunjukkan P.',a:[k+'/'+n],e:'Bagian ke-'+k+' dari '+n+' bagian sama besar adalah '+k+'/'+n+'.',g:{k:'garispec',m:1,n:n,titik:[{k:k,l:'P'}],nomor:true}};
  }
  var m=rnd(2,3),j=rnd(2,5),nn=m*j;
  return {t:'isi',q:'Garis bilangan dari 0 sampai '+m+' dibagi menjadi '+nn+' bagian sama besar. Berapa nilai tiap bagian? (tulis pecahan)',a:['1/'+j],e:'Tiap '+j+' bagian membentuk 1 utuh, jadi tiap bagian bernilai 1/'+j+'. Cara lain: '+m+'/'+nn+' = 1/'+j+'.',g:{k:'garispec',m:m,n:nn,nomor:true}};
};
function wholes(a,d,b){var r=[],i;for(i=0;i<a;i++)r.push({n:d,w:d,l:String(i+1)});r.push({n:d,w:b,l:b+'/'+d,warna:'hijau'});return r}
GEN.campur=function(){
  var d=rnd(2,9),a=rnd(1,4),b=rnd(1,d-1);
  if(rnd(0,1)===0)return {t:'isi',q:'Ubah pecahan campuran '+a+' '+b+'/'+d+' menjadi pecahan tidak murni.',a:[(a*d+b)+'/'+d],e:'('+a+' × '+d+') + '+b+' = '+(a*d+b)+', jadi '+(a*d+b)+'/'+d+'.',g:{k:'pita',baris:wholes(a,d,b)}};
  var p=a*d+b;
  return {t:'isi',q:'Ubah pecahan tidak murni '+p+'/'+d+' menjadi pecahan campuran (contoh bentuk: 2 1/3).',a:[a+' '+b+'/'+d],e:p+' : '+d+' = '+a+' sisa '+b+', jadi '+a+' '+b+'/'+d+'.'};
};
GEN.jumlah=function(){
  var d=rnd(3,9),a=rnd(Math.floor(d/2)+1,d-1),b=rnd(d-a+1,d-1);
  return {t:'isi',q:'Dua pizza sama besar, masing-masing dipotong '+d+' sama besar. Ani memakan '+a+' potong dari pizza pertama dan '+b+' potong dari pizza kedua. Tuliskan total pizza yang dimakan sebagai pecahan tidak murni.',a:[(a+b)+'/'+d],e:a+' + '+b+' = '+(a+b)+' potong, tiap potong 1/'+d+'. Jadi '+(a+b)+'/'+d+'.',g:{k:'pita',baris:[{n:d,w:a,l:'pizza 1'},{n:d,w:b,l:'pizza 2'}]}};
};
`

export const DATA_AC19: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Suatu pembagian bisa dituliskan sebagai pecahan hanya bila semua bagiannya sama besar.', true, 'Pecahan menyatakan bagian yang sama besar dari satu keseluruhan.', pita([{ n: 4, w: 3, l: '3/4' }])),
    bs('Sehelai kertas dipotong 3 bagian yang tidak sama besar. Satu bagian boleh disebut 1/3.', false, 'Bagian tidak sama besar, jadi tidak sah dituliskan sebagai pecahan.', pita([{ n: 3, w: 1, ukuran: [3, 1, 1] }])),
    bs('Bagian-bagian yang bentuknya berbeda tetap sah sebagai pecahan asal luasnya sama besar.', true, 'Yang penting ukurannya sama, bukan bentuknya.'),
    bs('Pada garis 0 sampai 1 yang dibagi 5 bagian, titik di tanda ke-3 dari 0 menunjukkan 3/5.', true, 'Tanda ke-3 berarti sudah melewati 3 bagian dari 5.', garispec(1, 5, { titik: [{ k: 3, l: 'R' }], nomor: true })),
    bs('Pada garis 0 sampai 2 yang dibagi 8 bagian sama panjang, tiap bagian bernilai 1/4.', true, '2 : 8 = 1/4. Empat bagian membentuk satu utuh.', garispec(2, 8, { nomor: true })),
    bs('Pada garis 0 sampai 3 yang dibagi 9 bagian sama panjang, tiap bagian bernilai 1/9.', false, 'Tiap 3 bagian membentuk 1 utuh, jadi tiap bagian 1/3.', garispec(3, 9, { nomor: true })),
    bs('Pecahan tidak murni adalah pecahan yang pembilangnya lebih besar atau sama dengan penyebutnya.', true, 'Misalnya 7/4. Nilainya sama dengan atau lebih dari satu utuh.'),
    bs('Pecahan 3/7 adalah pecahan sejati.', true, 'Pembilang lebih kecil daripada penyebut, nilainya kurang dari 1.'),
    bs('Pecahan campuran terdiri atas bilangan bulat dan pecahan sekaligus.', true, 'Contoh: 2 1/3.'),
    bs('Pecahan campuran 2 1/4 dan pecahan tidak murni 9/4 bernilai sama.', true, '2 × 4 + 1 = 9, jadi 2 1/4 = 9/4.', pita([{ n: 4, w: 4, l: '1' }, { n: 4, w: 4, l: '2', warna: 'kuning' }, { n: 4, w: 1, l: '1/4', warna: 'hijau' }])),
    bs('Pecahan tidak murni 11/4 sama dengan pecahan campuran 2 3/4.', true, '11 : 4 = 2 sisa 3.'),
    bs('Mengubah 3 2/5 menjadi pecahan tidak murni: (3 × 5) + 2 = 17, jadi 17/5.', true, 'Satu utuh berisi 5 potongan lima, jadi 3 utuh = 15 potongan, ditambah 2.'),
    bs('Pecahan campuran selalu lebih besar daripada bentuk tidak murni yang senilai dengannya.', false, 'Keduanya bernilai sama: hanya ditulis dengan bentuk berbeda.'),
    bs('Pada garis bilangan, titik yang lebih ke kanan bernilai lebih besar.', true, 'Garis bilangan tersusun dari nilai kecil di kiri ke nilai besar di kanan.'),
  ],
  debat: [
    debat('Ayu dan Beno melihat selembar kertas yang dipotong menjadi 4 bagian tidak sama besar.', ['Ayu: "Bagian yang paling besar itu 1/4."', 'Beno: "Tidak sah. Pecahan butuh bagian yang sama besar."'], 1, 'Penyebut 4 hanya berlaku bila keempat bagian sama besar.', pita([{ n: 4, w: 1, ukuran: [3, 1, 1, 1] }])),
    debat('Cici dan Dedi mengubah 4 2/3 menjadi pecahan tidak murni.', ['Cici: "(4 × 3) + 2 = 14, jadi 14/3."', 'Dedi: "(4 × 2) + 3 = 11, jadi 11/3."'], 0, 'Penyebut tetap 3. Satu utuh berisi 3 potongan, jadi 4 utuh = 12 potongan, ditambah 2.', pita([{ n: 3, w: 3, l: '1' }, { n: 3, w: 3, l: '2', warna: 'kuning' }, { n: 3, w: 3, l: '3', warna: 'hijau' }, { n: 3, w: 3, l: '4', warna: 'merah' }, { n: 3, w: 2, l: '2/3' }])),
    debat('Eka dan Fajar membaca garis bilangan 0 sampai 3 yang dibagi 9 bagian sama panjang.', ['Eka: "Tiap bagian bernilai 1/9."', 'Fajar: "Tiap bagian bernilai 1/3, karena 3 bagian membentuk 1 utuh."'], 1, 'Garisnya sampai 3, bukan sampai 1.', garispec(3, 9, { nomor: true })),
    debat('Gita dan Hadi membahas 3 1/2 dan 7/2.', ['Gita: "Itu dua nilai yang berbeda."', 'Hadi: "Itu satu nilai yang sama, hanya bentuk tulisnya berbeda."'], 1, '3 × 2 + 1 = 7, jadi 3 1/2 = 7/2.'),
    debat('Ira dan Joni menandai 3/4 pada garis 0 sampai 1.', ['Ira: "Garis harus dibagi tepat 4 bagian, tidak boleh jumlah lain."', 'Joni: "Boleh dibagi 8 bagian: 3/4 jatuh di bagian ke-6."'], 1, '3/4 = 6/8. Jumlah bagian boleh kelipatan penyebut.', garispec(1, 8, { titik: [{ k: 6, l: '3/4' }], nomor: true })),
    debat('Kiki dan Lala membahas posisi 4/6 pada garis bilangan, yang sama dengan 2/3.', ['Kiki: "4/6 harus selalu ditulis 2/3, tidak boleh 4/6."', 'Lala: "Boleh keduanya. Nilai dan posisinya sama."'], 1, 'Bentuk sederhana boleh dipakai bila diminta, tetapi 4/6 tetap benar.', garispec(1, 6, { titik: [{ k: 4, l: '4/6' }], nomor: true })),
  ],
  bank: [
    isi('Garis bilangan dari 0 sampai 1 dibagi 8 bagian sama panjang. Titik berada pada bagian ke-5. Tuliskan pecahannya.', ['5/8'], 'Bagian ke-5 dari 8: 5/8.', garispec(1, 8, { titik: [{ k: 5, l: '?' }], nomor: true })),
    isi('Garis bilangan dari 0 sampai 1 dibagi 6 bagian sama panjang. Titik pada bagian ke-2. Tuliskan pecahan yang paling sederhana.', ['1/3'], '2/6 disederhanakan menjadi 1/3.', garispec(1, 6, { titik: [{ k: 2, l: '?' }], nomor: true })),
    isi('Ubah 2 4/5 menjadi pecahan tidak murni.', ['14/5'], '(2 × 5) + 4 = 14, jadi 14/5.', pita([{ n: 5, w: 5, l: '1' }, { n: 5, w: 5, l: '2', warna: 'kuning' }, { n: 5, w: 4, l: '4/5', warna: 'hijau' }])),
    isi('Ubah 5 1/3 menjadi pecahan tidak murni.', ['16/3'], '(5 × 3) + 1 = 16, jadi 16/3.'),
    isi('Ubah 23/6 menjadi pecahan campuran (contoh bentuk: 2 1/3).', ['3 5/6'], '23 : 6 = 3 sisa 5, jadi 3 5/6.'),
    isi('Ubah 9/2 menjadi pecahan campuran (contoh bentuk: 2 1/3).', ['4 1/2'], '9 : 2 = 4 sisa 1, jadi 4 1/2.'),
    isi('Pecahan campuran 3 2/7 diubah menjadi pecahan tidak murni ?/7. Berapa pembilangnya?', '23', '(3 × 7) + 2 = 23.'),
    isi('Ina memakan 3/4 dari pizza pertama dan 2/4 dari pizza kedua (kedua pizza sama besar). Tuliskan total pizza yang ia makan sebagai pecahan tidak murni.', ['5/4'], '3/4 + 2/4 = 5/4.', pita([{ n: 4, w: 3, l: 'pizza 1' }, { n: 4, w: 2, l: 'pizza 2' }])),
    isi('Garis bilangan dari 0 sampai 2 dibagi 10 bagian sama panjang. Berapa nilai tiap bagian? (tulis pecahan)', ['1/5'], '10 bagian untuk 2 utuh: tiap 5 bagian = 1 utuh, jadi 1/5.', garispec(2, 10, { nomor: true })),
    isi('Garis bilangan dari 0 sampai 3 dibagi 12 bagian sama panjang. Titik pada bagian ke-7. Tuliskan nilainya sebagai pecahan campuran.', ['1 3/4'], 'Tiap bagian 1/4. Tujuh bagian = 7/4 = 1 3/4.', garispec(3, 12, { titik: [{ k: 7, l: '?' }], nomor: true })),
    isi('Kamu merancang pecahan tidak murni yang jika diubah menjadi campuran menghasilkan 3 2/5. Tuliskan pecahan tidak murninya.', ['17/5'], '(3 × 5) + 2 = 17.'),
    isi('Kamu merancang pecahan campuran yang jika diubah menjadi tidak murni menghasilkan 22/7. Tuliskan pecahan campurannya (contoh bentuk: 2 1/3).', ['3 1/7'], '22 : 7 = 3 sisa 1.'),
    isi('Kamu ingin menempatkan 2/3 tepat pada salah satu tanda di garis 0 sampai 1. Berapa jumlah bagian paling sedikit?', '3', 'Dengan 3 bagian, 2/3 jatuh di tanda ke-2.', garispec(1, 3, { titik: [{ k: 2, l: '2/3' }], nomor: true })),
    isi('Kamu ingin menempatkan 3/2 tepat pada salah satu tanda di garis 0 sampai 2. Berapa jumlah bagian paling sedikit?', '4', 'Dengan 4 bagian tiap bagian 1/2, dan 3/2 jatuh di bagian ke-3.', garispec(2, 4, { titik: [{ k: 3, l: '3/2' }], nomor: true })),
    pg('Syarat utama agar suatu pembagian bisa dituliskan sebagai pecahan adalah semua bagiannya...', ['sama besar', 'berwarna sama', 'berbentuk bulat', 'berjumlah genap'], 0, 'Ukuran bagian harus sama.', pita([{ n: 6, w: 5, l: '5/6' }])),
    pg('Pecahan yang nilainya lebih dari 1 (pembilang lebih besar daripada penyebut) disebut pecahan...', ['tidak murni', 'sejati', 'senilai', 'desimal'], 0, 'Contohnya 7/4.'),
    pg('Pecahan yang nilainya kurang dari 1 disebut pecahan...', ['sejati', 'tidak murni', 'campuran', 'senilai'], 0, 'Contohnya 3/7.'),
    pg('Manakah pasangan yang bernilai SAMA?', ['3 1/4 dan 13/4', '3 1/4 dan 12/4', '3 1/4 dan 13/3', '3 1/4 dan 14/4'], 0, '(3 × 4) + 1 = 13, jadi 3 1/4 = 13/4.'),
    pg('Kue A dipotong 8 sama besar (5 potong diambil). Kue B dipotong 3 tidak sama besar (2 potong besar diambil). Manakah yang sah dituliskan sebagai pecahan?', ['kue A: 5/8', 'kue B: 2/3', 'kedua-duanya', 'tidak keduanya'], 0, 'Hanya kue A yang bagiannya sama besar.', pita([{ n: 8, w: 5, l: 'A' }, { n: 3, w: 2, ukuran: [2, 1, 1], l: 'B' }])),
    pg('Pada garis 0 sampai 4 yang dibagi 8 bagian sama panjang, titik 5/2 berada pada bagian ke...', ['5', '4', '3', '8'], 0, 'Tiap bagian bernilai 4/8 = 1/2. 5/2 = 5 bagian.', garispec(4, 8, { titik: [{ k: 5, l: '5/2' }], nomor: true })),
    pg('Rian berkata tiap bagian pada garis 0 sampai 4 yang dibagi 8 bernilai 1/8. Apakah tepat?', ['Tidak, tiap bagian bernilai 4/8 = 1/2', 'Tepat, tiap bagian selalu 1/8', 'Tidak, tiap bagian bernilai 1/4', 'Tepat, karena ada 8 bagian'], 0, 'Garisnya sampai 4, jadi tiap bagian 4/8 = 1/2.', garispec(4, 8, { nomor: true })),
    pg('Sinta berkata pecahan campuran selalu lebih besar daripada bentuk tidak murni senilainya. Apakah tepat?', ['Tidak, keduanya bernilai sama', 'Tepat, campuran selalu lebih besar', 'Tidak, tidak murni selalu lebih besar', 'Tepat, tetapi hanya untuk penyebut genap'], 0, '2 1/3 dan 7/3 adalah nilai yang sama.'),
    pg('Kiki berkata bagian pecahan tidak perlu sama besar asalkan jumlah bagiannya sesuai penyebut. Apakah tepat?', ['Salah, bagian harus sama besar', 'Benar, yang penting jumlahnya', 'Salah, bagian harus berbentuk persegi', 'Benar, asalkan penyebutnya genap'], 0, 'Syarat mutlak pecahan: semua bagian sama besar.'),
    pg('Dedi memakan 4/5 dari pizza pertama dan 3/5 dari pizza kedua (sama besar). Total pizza yang dimakan dalam pecahan campuran adalah...', ['1 2/5', '7/10', '1 3/5', '2 2/5'], 0, '4/5 + 3/5 = 7/5 = 1 2/5.', pita([{ n: 5, w: 4, l: 'pizza 1' }, { n: 5, w: 3, l: 'pizza 2' }])),
    pg('Rian berkata jumlah bagian garis bilangan harus sama dengan penyebut pecahan yang ditandai. Apakah tepat?', ['Tidak, boleh kelipatan penyebut, misalnya 3/4 pada garis dibagi 8', 'Tepat, tidak boleh jumlah lain', 'Tidak, boleh berapa pun jumlah bagian', 'Tepat, tetapi hanya pada garis 0 sampai 1'], 0, 'Selama 3/4 jatuh tepat pada tanda, jumlah bagian boleh kelipatan penyebut.', garispec(1, 8, { titik: [{ k: 6, l: '3/4' }], nomor: true })),
    gen('garis'),
    gen('garis'),
    gen('garis'),
    gen('campur'),
    gen('campur'),
    gen('campur'),
    gen('jumlah'),
    gen('jumlah'),
  ],
}
