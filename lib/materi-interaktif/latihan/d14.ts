import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { kartesius } from '../gambar'

/**
 * Bahan latihan D-14 (Aljabar: Sistem Persamaan Linear Dua Variabel, SPLDV).
 *
 * Konsep yang diuji bank soal topik ini: SPLDV (dua persamaan linear dengan
 * dua variabel), penyelesaian memenuhi KEDUA persamaan (memeriksa pasangan),
 * metode grafik (titik potong), substitusi (ubah ke y = ... lalu masukkan),
 * eliminasi (menghilangkan variabel: koefisien sama tanda dikurangkan,
 * berlawanan tanda dijumlahkan, berbeda dikalikan lebih dulu pada KEDUA
 * ruas), memilih variabel yang koefisiennya sudah sama, dan soal cerita
 * (buku dan pensil, umur, uang, kaos dan celana, dua bilangan). Salah paham:
 * menjumlahkan padahal sama tanda, mengurangkan padahal berlawanan tanda,
 * hanya mengalikan ruas kiri, hanya memeriksa satu persamaan.
 *
 * Jawaban angka tanpa titik ribuan.
 *
 * `GEN.jumlahSelisih`, `GEN.elimSama`, `GEN.substitusiY`, `GEN.cerita2`.
 */
const JS = String.raw`
GEN.jumlahSelisih=function(){
  var x=rnd(4,15),y=rnd(1,x-1),u=rnd(0,1);
  return {t:'isi',q:'Diketahui sistem x + y = '+(x+y)+' dan x - y = '+(x-y)+'. Dengan metode eliminasi, berapakah nilai '+(u?'y':'x')+'?',a:[String(u?y:x)],e:'Dijumlahkan: 2x = '+(2*x)+', x = '+x+'. y = '+(x+y)+' - '+x+' = '+y+'.'};
};
GEN.elimSama=function(){
  var x=rnd(2,9),y=rnd(2,9),a=rnd(2,5),b=rnd(1,3),c=a-b,d=rnd(2,5),u=rnd(0,1);
  return {t:'isi',q:'Diketahui sistem '+a+'x + '+d+'y = '+(a*x+d*y)+' dan '+b+'x + '+d+'y = '+(b*x+d*y)+' (koefisien y sudah sama). Berapakah nilai '+(u?'y':'x')+'?',a:[String(u?y:x)],e:'Dikurangkan: '+c+'x = '+(c*x)+', x = '+x+'. y = '+y+'.'};
};
GEN.substitusiY=function(){
  var x=rnd(2,8),m=rnd(2,4),c=rnd(1,5),y=m*x+c,k=rnd(2,4),u=rnd(0,1);
  return {t:'isi',q:'Diketahui y = '+m+'x + '+c+' dan '+k+'x + y = '+(k*x+y)+'. Dengan substitusi, berapakah nilai '+(u?'y':'x')+'?',a:[String(u?y:x)],e:k+'x + ('+m+'x + '+c+') = '+(k*x+y)+'; '+(k+m)+'x = '+((k+m)*x)+'; x = '+x+'; y = '+y+'.'};
};
GEN.cerita2=function(){
  var b=rnd(3,9)*1000,p=rnd(2,7)*1000,u=rnd(0,1),m1=2,m2=3;
  return {t:'isi',q:'Harga 2 buku ditambah 1 pensil adalah Rp'+titikRibu(2*b+p)+', sedangkan harga 1 buku ditambah 1 pensil adalah Rp'+titikRibu(b+p)+'. Berapa rupiah harga satu '+(u?'pensil':'buku')+'?',a:[String(u?p:b)],e:'Dikurangkan: 1 buku = '+titikRibu(b)+'. Pensil = '+titikRibu(b+p)+' - '+titikRibu(b)+' = '+titikRibu(p)+'.'};
};
`

export const DATA_D14: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('SPLDV adalah gabungan dua persamaan linear yang masing-masing memuat dua variabel.', true, 'Sistem Persamaan Linear Dua Variabel.'),
    bs('Bentuk umum persamaan linear dua variabel adalah ax + by = c.', true, 'a, b, c konstanta.'),
    bs('Penyelesaian SPLDV hanya perlu memenuhi salah satu persamaan.', false, 'Harus memenuhi kedua persamaan.'),
    bs('(8, 4) adalah penyelesaian x + y = 12 dan x − y = 4.', true, '12 dan 4.'),
    bs('(9, 3) adalah penyelesaian x + y = 12 dan x − y = 4.', false, '9 − 3 = 6, bukan 4.'),
    bs('(2, 3) adalah penyelesaian x + y = 5 dan 2x − y = 1.', true, '5 dan 1.', kartesius(6, { garis: [[-1, 6, 5, 0, 'biru'], [0, -1, 3.5, 6, 'merah']], titik: [{ x: 2, y: 3, l: '(2, 3)', w: 'hijau' }] })),
    bs('(1, 4) adalah penyelesaian x + y = 5 dan 2x − y = 1.', false, 'Hanya persamaan pertama yang terpenuhi.'),
    bs('Pada metode grafik, penyelesaian adalah titik potong kedua garis.', true, 'Titik yang ada di kedua garis.'),
    bs('SPLDV berpenyelesaian tunggal berarti kedua garis berpotongan di tepat satu titik.', true, 'Satu pasangan (x, y).'),
    bs('Metode substitusi mengubah satu persamaan menjadi x = ... atau y = ... lalu memasukkannya ke persamaan lain.', true, 'Mengganti variabel.'),
    bs('Metode eliminasi menghilangkan satu variabel dengan menjumlah atau mengurangkan persamaan.', true, 'Setelah koefisiennya sama.'),
    bs('Koefisien yang sama tanda dan sama besar dieliminasi dengan mengurangkan.', true, 'x + y dan x + 2y: kurangkan.'),
    bs('Koefisien yang berlawanan tanda dan sama besar dieliminasi dengan menjumlahkan.', true, '+y dan −y.'),
    bs('Koefisien berlawanan tanda sama besar dieliminasi dengan mengurangkan.', false, 'Dikurang malah menggandakan.'),
    bs('Sistem dengan koefisien berbeda tidak bisa diselesaikan dengan eliminasi.', false, 'Kalikan dulu hingga sama.'),
    bs('Dari x + y = 7, y dapat dinyatakan sebagai y = 7 − x.', true, 'Pindah ruas.'),
    bs('Saat mengalikan persamaan, cukup mengalikan ruas kiri.', false, 'Kedua ruas harus dikalikan.'),
    bs('Variabel yang koefisiennya sudah sama lebih cepat dieliminasi lebih dulu.', true, 'Tidak perlu perkalian.'),
    bs('Jumlah dua bilangan 45 dan selisihnya 15; bilangan terbesar adalah 30.', true, '(45 + 15) : 2.'),
    bs('Jumlah umur 50 dan selisih 30 tahun: umur yang lebih tua 40 tahun.', true, '(50 + 30) : 2.'),
    bs('Dari 2x + 3y = 16 dan x + 2y = 9, y = 2 dan x = 5.', true, '10 + 6 = 16 dan 5 + 4 = 9.'),
  ],
  debat: [
    debat('Dedi dan Eka menghilangkan y dari 4x + 2y = 14 dan x + 2y = 5.', ['Dedi: "Dijumlahkan."', 'Eka: "Dikurangkan, karena y sama tanda."'], 1, 'Sama tanda: kurangkan.'),
    debat('Gita dan Hadi menghilangkan y dari 5x + 3y = 29 dan 5x − 3y = 1.', ['Gita: "Dikurangkan."', 'Hadi: "Dijumlahkan, karena y berlawanan tanda."'], 1, 'Berlawanan tanda: jumlahkan.'),
    debat('Ira dan Joni mengalikan persamaan x + 2y = 9 dengan 2.', ['Ira: "2x + 4y = 9."', 'Joni: "2x + 4y = 18."'], 1, 'Kedua ruas dikalikan.'),
    debat('Kiki dan Lani memeriksa (1, 4) untuk x + y = 5 dan 2x − y = 1.', ['Kiki: "Penyelesaian, 1 + 4 = 5."', 'Lani: "Bukan; 2 − 4 = −2 ≠ 1."'], 1, 'Periksa keduanya.'),
    debat('Made dan Nia memilih variabel yang dieliminasi pada 6x + 5y = 38 dan 2x + 5y = 18.', ['Made: "y, koefisiennya sudah sama."', 'Nia: "x, harus dikalikan dulu."'], 0, 'Lebih efisien memilih yang sudah sama.'),
    debat('Oka dan Putri mencari umur ayah (jumlah 50, selisih 30).', ['Oka: "Ayah 40, anak 10."', 'Putri: "Ayah 30, anak 20."'], 0, '40 + 10 = 50 dan 40 − 10 = 30.'),
  ],
  bank: [
    isi('Bentuk umum persamaan linear dua variabel ax + by = ...', ['c'], 'Konstanta c.'),
    isi('Sistem 2x + y = 8 dan x − y = 1 disebut sistem persamaan linear ... variabel.', ['dua'], 'Dua variabel.'),
    isi('x + y = 16 dan x − y = 4. Berapa x?', '10', '2x = 20.'),
    isi('x + y = 16 dan x − y = 4. Berapa y?', '6', '16 − 10.'),
    isi('x + y = 10 dan x − y = 2. Berapa x?', '6', '2x = 12.'),
    isi('x + y = 10 dan x − y = 2. Berapa y?', '4', '10 − 6.'),
    isi('x + y = 14 dan x − y = 6. Berapa x?', '10', '2x = 20.'),
    isi('x + y = 14 dan x − y = 6. Berapa y?', '4', '14 − 10.'),
    isi('2x + y = 11 dan x + y = 7. Berapa x?', '4', 'Dikurangkan.'),
    isi('2x + y = 11 dan x + y = 7. Berapa y?', '3', '7 − 4.'),
    isi('3x + y = 19 dan x + y = 9. Berapa x?', '5', '2x = 10.'),
    isi('3x + y = 19 dan x + y = 9. Berapa y?', '4', '9 − 5.'),
    isi('2x + 3y = 16 dan x + 2y = 9. Berapa y?', '2', 'Kalikan kedua dengan 2 lalu kurangkan.'),
    isi('2x + 3y = 16 dan x + 2y = 9. Berapa x?', '5', '9 − 4.'),
    isi('3x + 4y = 25 dan 2x + y = 10. Berapa x?', '3', 'Kalikan kedua dengan 4.'),
    isi('3x + 4y = 25 dan 2x + y = 10. Berapa y?', '4', '10 − 6.'),
    isi('3x + 5y = 31 dan x + 2y = 12. Berapa x?', '2', 'y = 5.'),
    isi('y = 2x + 1 dan 3x + y = 16. Berapa x?', '3', '5x + 1 = 16.'),
    isi('y = 2x + 1 dan 3x + y = 16. Berapa y?', '7', '2(3) + 1.'),
    isi('y = 3x − 2 dan 2x + y = 13. Berapa y?', '7', 'x = 3.'),
    isi('3x + 2y = 18 dan x = 4. Berapa y?', '3', '12 + 2y = 18.'),
    isi('2 buku + 1 pensil Rp17.000; 1 buku + 3 pensil Rp21.000. Berapa rupiah satu buku?', '6000', 'p = 5.000.'),
    isi('2 buku + 1 pensil Rp17.000; 1 buku + 3 pensil Rp21.000. Berapa rupiah satu pensil?', '5000', '5p = 25.000.'),
    isi('Jumlah umur ayah dan anak 50 tahun, selisihnya 30. Berapa tahun umur ayah?', '40', '(50 + 30) : 2.'),
    isi('Jumlah umur ayah dan anak 50 tahun, selisihnya 30. Berapa tahun umur anak?', '10', '50 − 40.'),
    isi('Jumlah uang Andi dan Budi Rp150.000, selisih Rp30.000. Berapa rupiah uang Andi?', '90000', '(150.000 + 30.000) : 2.'),
    isi('Jumlah uang Andi dan Budi Rp150.000, selisih Rp30.000. Berapa rupiah uang Budi?', '60000', '150.000 − 90.000.'),
    isi('3 kaos + 2 celana Rp410.000; 1 kaos + 2 celana Rp230.000. Berapa rupiah satu kaos?', '90000', '2k = 180.000.'),
    isi('3 kaos + 2 celana Rp410.000; 1 kaos + 2 celana Rp230.000. Berapa rupiah satu celana?', '70000', '2c = 140.000.'),
    isi('2 pulpen + 1 penghapus Rp13.000; 1 pulpen + 1 penghapus Rp8.000. Berapa rupiah satu penghapus?', '3000', 'p = 5.000.'),
    isi('Jumlah dua bilangan 45 dan selisihnya 15. Berapa bilangan yang lebih besar?', '30', '(45 + 15) : 2.'),
    pg('Penyelesaian SPLDV berupa ...', ['sepasang nilai (x, y) yang memenuhi kedua persamaan', 'nilai x saja', 'pasangan yang memenuhi satu persamaan', 'sebuah garis'], 0, 'Memenuhi keduanya.'),
    pg('Untuk mengeliminasi x dari 2x + 3y = 16 dan x + 2y = 9, langkah pertama...', ['Kalikan persamaan kedua dengan 2 (2x + 4y = 18) lalu kurangkan', 'Kurangkan langsung', 'Jumlahkan langsung', 'Kalikan persamaan pertama dengan 3'], 0, 'Samakan koefisien x.'),
    pg('Untuk mengeliminasi y dari 3x + 4y = 25 dan 2x + y = 10...', ['Kalikan persamaan kedua dengan 4 (8x + 4y = 40) lalu kurangkan', 'Jumlahkan langsung', 'Kurangkan langsung', 'Kalikan persamaan pertama dengan 4'], 0, 'Samakan koefisien y.'),
    pg('Untuk 5x + 2y = 19 dan 3x + 2y = 13 pendekatan paling efisien...', ['Langsung mengurangkan untuk menghilangkan y', 'Kalikan dulu', 'Substitusi', 'Menjumlahkan'], 0, 'Koefisien y sudah sama.'),
    pg('Untuk 3x + 2y = 16 dan −3x + y = 2, mengeliminasi x dengan ...', ['menjumlahkan (koefisien berlawanan tanda)', 'mengurangkan', 'mengalikan 3', 'membagi 3'], 0, '+3x dan −3x.'),
    pg('Untuk 5x + 4y = 29 dan 5x + y = 14, mengeliminasi x dengan ...', ['mengurangkan (koefisien sama dan sama tanda)', 'menjumlahkan', 'mengalikan', 'membagi'], 0, '3y = 15.'),
    pg('Dari x + y = 7, y dinyatakan ...', ['7 − x', '7 + x', 'x − 7', '7x'], 0, 'Pindah ruas.'),
    pg('Siswa menjumlahkan 4x + 2y = 14 dan x + 2y = 5 untuk menghilangkan y. Penilaian ...', ['Tidak tepat; seharusnya dikurangkan', 'Tepat'], 0, 'Sama tanda.'),
    pg('Siswa mengurangkan 5x + 3y = 29 dan 5x − 3y = 1 untuk menghilangkan y. Penilaian ...', ['Tidak tepat; seharusnya dijumlahkan', 'Tepat'], 0, 'Berlawanan tanda.'),
    pg('Siswa mengalikan hanya ruas kiri x + 2y = 9 dengan 2. Kesalahannya ...', ['Ruas kanan tidak ikut dikalikan', 'Salah mengalikan x', 'Tidak ada kesalahan', 'Seharusnya dibagi'], 0, 'Menjadi 2x + 4y = 18.'),
    pg('Metode grafik pada SPLDV dilakukan dengan ...', ['menggambar kedua garis dan mencari titik potongnya', 'menjumlahkan koefisien', 'mengalikan kedua persamaan', 'mencari luas daerah'], 0, 'Titik potong.'),
    gen('jumlahSelisih'),
    gen('elimSama'),
    gen('substitusiY'),
    gen('cerita2'),
  ],
}
