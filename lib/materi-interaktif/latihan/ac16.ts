import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { diagram } from '../gambar'

/**
 * Bahan latihan AC-16 (Interpretasi dan identifikasi kesalahan diagram batang).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * nama bagian diagram (batang, sumbu tegak, sumbu datar, kategori, skala,
 * judul), membaca nilai, membandingkan (paling banyak, paling sedikit, urutan),
 * menghitung dari diagram (selisih, total, rata-rata, sisa menuju target),
 * dan KESALAHAN diagram: jarak label sumbu tegak tidak sama (0, 10, 30, 60),
 * tanpa label angka, lebar batang berbeda-beda, serta sumbu tegak yang tidak
 * dimulai dari 0 (selisih kecil tampak besar; selisih SEBENARNYA dibaca dari
 * angka). Salah paham yang diuji: sumbu tidak dari 0 selalu salah, warna
 * cerah mencegah menyesatkan, kategori wajib A-Z, dua skala berbeda pasti ada
 * yang salah, dan sumbu dari 0 pasti benar. Ada pula "kamu merancang" (jarak
 * label dari 0 sampai maks dalam n label = maks : (n - 1)).
 *
 * `GEN.baca` soal baca-hitung acak pada diagram, `GEN.langkah` jarak label.
 */
const JS = String.raw`
GEN.baca=function(){
  var N=[['Apel','Jeruk','Mangga','Pisang'],['Senin','Selasa','Rabu','Kamis'],['Kucing','Ikan','Burung','Kelinci']],ns=N[rnd(0,2)],sat=['buah','orang','siswa'][rnd(0,2)];
  var m=rnd(6,14)*2,a=rnd(1,3),b=rnd(4,6),v=shuffle([m+a,m-a,m+b,m-b]),jenis=rnd(0,3),hi=Math.ceil((m+b+1)/5)*5,d=[],i,q,x,e;
  for(i=0;i<4;i++)d.push({l:ns[i],v:v[i]});
  if(jenis===0){x=4*m;q='Perhatikan diagram. Berapa total semua batang ('+sat+')?';e=v.join(' + ')+' = '+x+'.'}
  else if(jenis===1){x=2*b;q='Berapa selisih batang tertinggi dan batang terendah?';e=(m+b)+' − '+(m-b)+' = '+x+'.'}
  else if(jenis===2){x=m;q='Berapa rata-rata dari keempat batang?';e='Total '+(4*m)+' dibagi 4 kategori = '+x+'.'}
  else{x=m+b;q='Berapa nilai batang yang paling tinggi?';e='Batang tertinggi menunjukkan '+x+'.'}
  return {t:'isi',q:q,a:[String(x)],e:e,g:{k:'diagram',d:d,hi:hi,langkah:5,nilai:true,sat:sat}};
};
GEN.langkah=function(){
  var n=rnd(4,8),st=[5,10,15,20,25][rnd(0,4)],mk=st*(n-1);
  return {t:'isi',q:'Sumbu tegak berlabel dari 0 sampai '+mk+' dalam '+n+' label dengan jarak sama. Berapa jarak antar label?',a:[String(st)],e:mk+' : '+(n-1)+' = '+st+'. '+n+' label hanya punya '+(n-1)+' jarak, jadi bagi dengan '+(n-1)+'.',g:{k:'diagram',d:[{l:'A',v:Math.round(mk*0.6)},{l:'B',v:Math.round(mk*0.9)}],hi:mk,label:[0,mk]}};
};
`

const buah = [{ l: 'Apel', v: 6 }, { l: 'Jeruk', v: 4 }, { l: 'Mangga', v: 8 }, { l: 'Pisang', v: 5 }]
const warung = [{ l: 'Sate', v: 18 }, { l: 'Bakso', v: 24 }, { l: 'Soto', v: 12 }]

export const DATA_AC16: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Pada diagram batang, makin tinggi batangnya, makin besar nilai yang ditunjukkannya.', true, 'Tinggi batang menunjukkan besar data.', diagram(buah, { hi: 10, langkah: 2, nilai: true })),
    bs('Sumbu tegak diagram batang menunjukkan angka atau jumlah.', true, 'Angka-angka di sepanjang sumbu tegak disebut skala.', diagram(buah, { hi: 10, langkah: 2, sorot: 'tegak' })),
    bs('Nama-nama seperti Apel dan Jeruk ditulis pada sumbu datar sebagai kategori.', true, 'Sumbu datar memuat kategori.', diagram(buah, { hi: 10, langkah: 2, sorot: 'kategori' })),
    bs('Batang yang paling tinggi menunjukkan nilai yang paling besar.', true, 'Mangga paling tinggi, yaitu 8.', diagram(buah, { hi: 10, langkah: 2, nilai: true, tandai: [2] })),
    bs('Dua batang yang sama tingginya menunjukkan nilai yang sama.', true, 'Sama tinggi berarti sama nilainya.', diagram([{ l: 'Made', v: 15 }, { l: 'Wayan', v: 12 }, { l: 'Kadek', v: 15 }], { hi: 20, langkah: 5, nilai: true })),
    bs('Batang yang lebih lebar pasti menunjukkan nilai yang lebih besar.', false, 'Nilai ditentukan oleh TINGGI batang. Semua batang seharusnya sama lebar.', diagram(warung, { hi: 30, langkah: 10, lebar: [2, 1, 1], nilai: true })),
    bs('Label sumbu tegak 0, 10, 20, 30, 40 berjarak sama, jadi konsisten.', true, 'Setiap label naik 10.', diagram(warung, { hi: 40, langkah: 10 })),
    bs('Label sumbu tegak 0, 10, 30, 60, 100 sudah konsisten.', false, 'Jaraknya 10, 20, 30, 40: tidak sama.', diagram(warung, { hi: 100, label: [0, 10, 30, 60, 100], rata: true })),
    bs('Diagram batang tanpa angka pada sumbu tegak tetap menunjukkan nilai pasti tiap batang.', false, 'Tanpa angka, pembaca hanya bisa membandingkan tinggi dengan kira-kira.', diagram(warung, { hi: 30, langkah: 10, tanpaAngka: true })),
    bs('Sumbu tegak yang tidak dimulai dari 0 bisa membuat selisih kecil tampak sangat besar.', true, 'Bagian bawah batang terpotong, jadi perbandingan tinggi batang menipu.', diagram([{ l: 'A', v: 70 }, { l: 'B', v: 75 }], { lo: 60, hi: 80, langkah: 5, nilai: true })),
    bs('Selisih sebenarnya dua data dihitung dari angkanya, bukan dari seberapa beda tinggi batangnya.', true, 'Pada diagram di atas, 75 − 70 = 5.', diagram([{ l: 'A', v: 70 }, { l: 'B', v: 75 }], { lo: 60, hi: 80, langkah: 5, nilai: true })),
    bs('Diagram batang yang sumbu tegaknya tidak dimulai dari 0 selalu salah dan tidak boleh dipakai.', false, 'Boleh, asal label angkanya jelas dan jaraknya sama, lalu pembaca membaca angkanya dengan cermat.', diagram([{ l: 'Budi', v: 65 }, { l: 'Ani', v: 70 }], { lo: 60, hi: 75, langkah: 5, nilai: true })),
    bs('Rata-rata tiga batang bernilai 10, 20, dan 30 adalah 20.', true, 'Total 60 dibagi 3 kategori sama dengan 20.', diagram([{ l: 'A', v: 10 }, { l: 'B', v: 20 }, { l: 'C', v: 30 }], { hi: 40, langkah: 10, nilai: true })),
    bs('Batang yang diberi warna cerah membuat diagram tidak mungkin menyesatkan.', false, 'Warna tidak mengubah skala. Yang menentukan: label, jarak, dan titik awal sumbu.', diagram(warung, { hi: 30, langkah: 10 })),
  ],
  debat: [
    debat('Ayu dan Bima melihat diagram dengan sumbu mulai dari 60. Batang B tampak dua kali batang A.', ['Bima: "Berarti nilai B dua kali nilai A."', 'Ayu: "Belum tentu. Baca dulu angkanya: A = 70 dan B = 75."'], 1, 'Sumbu tidak mulai dari 0, jadi tinggi batang bukan perbandingan nilai yang sebenarnya.', diagram([{ l: 'A', v: 70 }, { l: 'B', v: 75 }], { lo: 60, hi: 80, langkah: 5, nilai: true })),
    debat('Doni dan Eka menyusun kategori hari pada sumbu datar.', ['Doni: "Kategori harus selalu diurutkan A sampai Z."', 'Eka: "Boleh diurutkan menurut waktu, misalnya Senin sampai Jumat."'], 1, 'Urutan kategori boleh disusun sesuai kebutuhan: waktu, nilai, atau lainnya.', diagram([{ l: 'Senin', v: 8 }, { l: 'Selasa', v: 12 }, { l: 'Rabu', v: 6 }], { hi: 15, langkah: 5, nilai: true })),
    debat('Fani dan Gilang melihat diagram yang batang pertamanya jauh lebih lebar.', ['Fani: "Itu menyesatkan, mata kita menganggap batang lebar bernilai lebih besar."', 'Gilang: "Tidak masalah, lebar batang tidak boleh dilihat."'], 0, 'Lebar batang seharusnya sama supaya perbandingan hanya dilihat dari tinggi.', diagram(warung, { hi: 30, langkah: 10, lebar: [2, 1, 1], nilai: true })),
    debat('Hana dan Indra menghitung rata-rata dari 4 batang.', ['Hana: "Jumlahkan semua batang, lalu bagi 4."', 'Indra: "Jumlahkan semua batang, lalu bagi 2."'], 0, 'Rata-rata = total dibagi banyaknya data. Ada 4 batang, jadi dibagi 4.', diagram([{ l: 'A', v: 12 }, { l: 'B', v: 16 }, { l: 'C', v: 20 }, { l: 'D', v: 8 }], { hi: 25, langkah: 5, nilai: true })),
    debat('Joko dan Kiki melihat diagram yang sumbu tegaknya tanpa angka.', ['Joko: "Kita tetap tahu nilai pasti tiap batang."', 'Kiki: "Tidak. Kita hanya tahu batang mana yang lebih tinggi."'], 1, 'Tanpa angka, nilai pasti tidak bisa dibaca.', diagram(warung, { hi: 30, langkah: 10, tanpaAngka: true })),
    debat('Lina dan Mira memeriksa sumbu tegak berlabel 0, 5, 20, 50.', ['Lina: "Konsisten, angkanya naik terus."', 'Mira: "Tidak. Jaraknya 5, 15, 30, tidak sama."'], 1, 'Konsisten berarti jarak antar label sama, bukan sekadar naik.', diagram(warung, { hi: 50, label: [0, 5, 20, 50], rata: true })),
  ],
  bank: [
    isi('Perhatikan diagram. Berapa selisih nilai Dewi dan Rina?', '14', '92 − 78 = 14.', diagram([{ l: 'Rina', v: 78 }, { l: 'Dewi', v: 92 }], { hi: 100, langkah: 20, nilai: true })),
    isi('Perhatikan diagram buku yang dipinjam. Berapa total buku selama 4 hari?', '43', '12 + 7 + 15 + 9 = 43.', diagram([{ l: 'Senin', v: 12 }, { l: 'Selasa', v: 7 }, { l: 'Rabu', v: 15 }, { l: 'Kamis', v: 9 }], { hi: 20, langkah: 5, nilai: true })),
    isi('Perhatikan diagram penjualan. Berapa rata-rata penjualan per bulan?', '24', '18 + 24 + 30 = 72, lalu 72 : 3 = 24.', diagram([{ l: 'Jan', v: 18 }, { l: 'Feb', v: 24 }, { l: 'Mar', v: 30 }], { hi: 40, langkah: 10, nilai: true })),
    isi('Perhatikan diagram nilai ulangan. Berapa selisih nilai tertinggi dan terendah?', '23', '91 − 68 = 23.', diagram([{ l: 'Ani', v: 76 }, { l: 'Budi', v: 91 }, { l: 'Citra', v: 83 }, { l: 'Dedi', v: 68 }], { hi: 100, langkah: 20, nilai: true })),
    isi('Pohon yang ditanam dalam 3 minggu ditunjukkan diagram. Targetnya 60 pohon. Berapa pohon lagi yang harus ditanam?', '16', '14 + 19 + 11 = 44. Lalu 60 − 44 = 16.', diagram([{ l: 'Mg 1', v: 14 }, { l: 'Mg 2', v: 19 }, { l: 'Mg 3', v: 11 }], { hi: 20, langkah: 5, nilai: true })),
    isi('Sumbu tegak diagram ini dimulai dari 70. Toko A = 80 dan Toko B = 84. Berapa selisih SEBENARNYA?', '4', '84 − 80 = 4, walau batang B tampak jauh lebih tinggi.', diagram([{ l: 'Toko A', v: 80 }, { l: 'Toko B', v: 84 }], { lo: 70, hi: 90, langkah: 5, nilai: true })),
    isi('Kamu merancang sumbu tegak dari 0 sampai 120 dalam 5 label berjarak sama. Berapa jarak antar label?', '30', '120 : 4 = 30. Lima label hanya punya empat jarak.', diagram([{ l: 'A', v: 70 }, { l: 'B', v: 110 }], { hi: 120, label: [0, 120] })),
    isi('Kamu merancang sumbu tegak dari 0 sampai 50 dalam 6 label berjarak sama. Berapa jarak antar label?', '10', '50 : 5 = 10. Enam label punya lima jarak.', diagram([{ l: 'A', v: 30 }, { l: 'B', v: 45 }], { hi: 50, label: [0, 50] })),
    pg('Angka-angka yang berjajar pada sumbu tegak disebut...', ['skala', 'kategori', 'batang', 'judul'], 0, 'Skala menunjukkan nilai yang diukur.', diagram(buah, { hi: 10, langkah: 2, sorot: 'skala' })),
    pg('Nama-nama yang ditulis di bawah tiap batang (Apel, Jeruk, ...) disebut...', ['kategori', 'skala', 'batang', 'sumbu tegak'], 0, 'Kategori adalah hal yang dibandingkan.', diagram(buah, { hi: 10, langkah: 2, sorot: 'kategori' })),
    pg('Garis mendatar di bagian bawah diagram disebut...', ['sumbu datar', 'sumbu tegak', 'skala', 'judul'], 0, 'Sumbu datar memuat kategori.', diagram(buah, { hi: 10, langkah: 2, sorot: 'datar' })),
    pg('Diagram ini sumbunya mulai dari 70, dan batang B tampak tiga kali batang A. Apa dampaknya?', ['selisih yang kecil tampak sangat besar', 'diagram menjadi lebih akurat', 'tidak ada dampak apa pun'], 0, 'Potongan bawah batang hilang, jadi tinggi batang menipu. Baca angkanya.', diagram([{ l: 'A', v: 74 }, { l: 'B', v: 82 }], { lo: 70, hi: 85, langkah: 5, nilai: true })),
    pg('Beni berkata: "Diagram yang batangnya diberi gambar lucu pasti tidak menyesatkan." Apakah tepat?', ['Tidak tepat, gambar lucu tidak mengubah skala dan label yang bisa menyesatkan', 'Tepat, gambar lucu membuat diagram jujur', 'Tepat, tetapi hanya untuk anak kecil'], 0, 'Menyesatkan tidaknya diagram ditentukan label, jarak, dan titik awal sumbu.'),
    pg('Lia berkata: "Kategori pada sumbu datar wajib diurutkan A sampai Z." Apakah tepat?', ['Tidak tepat, urutan boleh menurut waktu atau besar nilai', 'Tepat, kalau tidak diagramnya salah', 'Tepat, hanya untuk nama orang'], 0, 'Urutan kategori boleh disesuaikan dengan tujuan diagram.'),
    pg('Sinta berkata: "Dua diagram dengan data sama tetapi skala berbeda, salah satunya pasti salah." Apakah tepat?', ['Tidak tepat, keduanya bisa benar asal label jelas dan jaraknya sama', 'Tepat, hanya boleh satu skala', 'Tepat, skala yang kecil selalu salah'], 0, 'Skala boleh berbeda. Yang penting konsisten dan berlabel.'),
    pg('Nilai ulangan terendah 62 dan tertinggi 96. Rancangan sumbu tegak mana yang paling tepat (dimulai dari 0, jarak sama)?', ['0, 20, 40, 60, 80, 100', '0, 10, 30, 60, 100', '60, 70, 80, 90, 100', '0, 25, 50, 80, 100'], 0, 'Dimulai dari 0, jaraknya sama (20), dan 100 cukup untuk nilai 96.', diagram([{ l: 'A', v: 62 }, { l: 'B', v: 96 }], { hi: 100, label: [0, 20, 40, 60, 80, 100] })),
    pg('Temanmu menggambar batang untuk nilai 70 di antara label 40 dan 80 (sumbu berlabel 0, 40, 80). Apakah itu bisa diterima?', ['Bisa, tinggi batang boleh berada di antara dua label', 'Tidak, batang harus tepat di garis label', 'Tidak, nilai 70 tidak boleh digambar'], 0, 'Batang menunjukkan nilai sebenarnya, tidak harus tepat di garis label.', diagram([{ l: 'Jeruk', v: 70 }], { hi: 80, label: [0, 40, 80] })),
    pg('Urutkan dari porsi TERBANYAK ke TERSEDIKIT menurut diagram.', ['Bakso, Sate, Soto', 'Soto, Sate, Bakso', 'Sate, Bakso, Soto', 'Bakso, Soto, Sate'], 0, 'Bakso 24, Sate 18, Soto 12.', diagram(warung, { hi: 30, langkah: 10, nilai: true })),
    pg('Semua batang di diagram ini berbeda lebar. Apa masalah utamanya?', ['lebar yang berbeda membuat batang lebar tampak bernilai lebih besar', 'tinggi batang menjadi salah', 'tidak ada masalah'], 0, 'Nilai ditentukan tinggi. Lebar yang sama menjaga perbandingan tetap adil.', diagram(warung, { hi: 30, langkah: 10, lebar: [2, 1, 1] })),
    pg('Sumbu tegak diagram ini tidak diberi angka. Apa akibatnya bagi pembaca?', ['nilai pasti tiap batang tidak bisa diketahui', 'diagram menjadi lebih mudah dibaca', 'tidak ada akibat apa pun'], 0, 'Tanpa angka, kita hanya tahu batang mana yang lebih tinggi.', diagram(warung, { hi: 30, langkah: 10, tanpaAngka: true })),
    gen('baca'),
    gen('baca'),
    gen('baca'),
    gen('baca'),
    gen('baca'),
    gen('langkah'),
    gen('langkah'),
    gen('langkah'),
  ],
}
