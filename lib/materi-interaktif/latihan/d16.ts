import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { kartesius } from '../gambar'

/**
 * Bahan latihan D-16 (Geometri: transformasi tunggal).
 *
 * Konsep yang diuji bank soal topik ini: translasi (x + a, y + b, termasuk
 * komponen negatif; mencari titik asal atau vektor), refleksi (sumbu-x
 * mengubah tanda y, sumbu-y mengubah tanda x, garis y = x menjadi (y, x),
 * garis y = -x menjadi (-y, -x)), rotasi pusat O (90 berlawanan arah jarum
 * jam (-y, x), 90 searah (y, -x), 180 (-x, -y); pusat, sudut, dan arah wajib
 * diketahui), dilatasi pusat O (kx, ky; k negatif ke sisi berlawanan; k = 1
 * sama persis; 0 < k < 1 memperkecil), sifat (translasi, refleksi, rotasi
 * kongruen; refleksi membalik orientasi; dilatasi sebangun; rotasi 180 =
 * dilatasi k = -1 = refleksi dua sumbu), dan cerita (robot, game, ubin,
 * logo, baling-baling, denah, foto, radar). Salah paham: dilatasi selalu
 * mengubah ukuran, rotasi searah dan berlawanan sama, vektor negatif tidak
 * dijumlah langsung.
 *
 * Jawaban koordinat diketik tanpa spasi, mis. (8,1) atau (-3,-7); bilangan
 * desimal dihindari karena titik dan koma ikut dibuang atau berarti ganda.
 *
 * `GEN.translasiGen`, `GEN.refleksiX`, `GEN.refleksiY`, `GEN.rotasiBerlawanan`,
 * `GEN.rotasiSearah`, `GEN.dilatasiGen`, `GEN.titikAsal`, `GEN.faktorSkala`.
 */
const JS = String.raw`
function kD(p){return '('+p[0]+','+p[1]+')'}
function nz(a,b){var x=rnd(a,b);return x}
GEN.translasiGen=function(){
  var x=nz(-9,9),y=nz(-9,9),a=nz(-7,7),b=nz(-7,7);
  return {t:'isi',q:'Titik P('+x+', '+y+') ditranslasikan oleh vektor ('+a+', '+b+'). Tuliskan koordinat bayangan P’ tanpa spasi, mis. (1,2).',a:[kD([x+a,y+b])],e:'('+x+' + ('+a+'), '+y+' + ('+b+')) = '+kD([x+a,y+b])+'.'};
};
GEN.refleksiX=function(){
  var x=nz(-9,9),y=nz(-9,9)||3;
  return {t:'isi',q:'Titik Q('+x+', '+y+') direfleksikan terhadap sumbu-x. Tuliskan bayangan Q’ tanpa spasi, mis. (1,2).',a:[kD([x,-y])],e:'Sumbu-x: x tetap, y berubah tanda: '+kD([x,-y])+'.',g:{k:'kartesius',r:10,garis:[[-10,0,10,0,'hijau']],titik:[{x:x,y:y,w:'biru',l:'Q'},{x:x,y:-y,w:'merah',l:'Q’'}]}};
};
GEN.refleksiY=function(){
  var x=nz(-9,9)||4,y=nz(-9,9);
  return {t:'isi',q:'Titik R('+x+', '+y+') direfleksikan terhadap sumbu-y. Tuliskan bayangan R’ tanpa spasi, mis. (1,2).',a:[kD([-x,y])],e:'Sumbu-y: y tetap, x berubah tanda: '+kD([-x,y])+'.',g:{k:'kartesius',r:10,garis:[[0,-10,0,10,'hijau']],titik:[{x:x,y:y,w:'biru',l:'R'},{x:-x,y:y,w:'merah',l:'R’'}]}};
};
GEN.rotasiBerlawanan=function(){
  var x=nz(-9,9),y=nz(-9,9);
  return {t:'isi',q:'Titik T('+x+', '+y+') dirotasi 90 derajat berlawanan arah jarum jam terhadap O(0,0) dengan aturan (x,y) menjadi (-y,x). Tuliskan bayangan T’ tanpa spasi, mis. (1,2).',a:[kD([-y,x])],e:'(-y, x) = '+kD([-y,x])+'.'};
};
GEN.rotasiSearah=function(){
  var x=nz(-9,9),y=nz(-9,9);
  return {t:'isi',q:'Titik U('+x+', '+y+') dirotasi 90 derajat searah jarum jam terhadap O(0,0) dengan aturan (x,y) menjadi (y,-x). Tuliskan bayangan U’ tanpa spasi, mis. (1,2).',a:[kD([y,-x])],e:'(y, -x) = '+kD([y,-x])+'.'};
};
GEN.dilatasiGen=function(){
  var x=nz(-6,6),y=nz(-6,6),k=[2,3,4,-2,-3][rnd(0,4)];
  return {t:'isi',q:'Titik V('+x+', '+y+') didilatasi terhadap pusat O(0,0) dengan faktor skala k = '+k+'. Tuliskan bayangan V’ tanpa spasi, mis. (1,2).',a:[kD([k*x,k*y])],e:'('+k+' x '+x+', '+k+' x '+y+') = '+kD([k*x,k*y])+'.'};
};
GEN.titikAsal=function(){
  var x=nz(-8,8),y=nz(-8,8),a=nz(-6,6),b=nz(-6,6);
  return {t:'isi',q:'Bayangan hasil translasi oleh vektor ('+a+', '+b+') adalah X’('+(x+a)+', '+(y+b)+'). Tuliskan titik asal X tanpa spasi, mis. (1,2).',a:[kD([x,y])],e:'X = ('+(x+a)+' - ('+a+'), '+(y+b)+' - ('+b+')) = '+kD([x,y])+'.'};
};
GEN.faktorSkala=function(){
  var x=rnd(2,8),y=rnd(2,8),k=rnd(2,6);
  return {t:'isi',q:'Titik S('+x+', '+y+') didilatasi terhadap pusat O(0,0) menghasilkan bayangan S’('+(k*x)+', '+(k*y)+'). Berapa faktor skala k?',a:[String(k)],e:(k*x)+' : '+x+' = '+k+'.'};
};
`

export const DATA_D16: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Translasi memindahkan titik sejauh jarak dan arah tertentu tanpa mengubah bentuk dan ukuran.', true, 'Pergeseran.'),
    bs('Translasi titik (x, y) oleh vektor (a, b) menghasilkan (x + a, y + b).', true, 'Termasuk komponen negatif.'),
    bs('E(4, 1) ditranslasikan oleh (−3, 2) menghasilkan E′(1, 3).', true, '4 − 3 dan 1 + 2.'),
    bs('Refleksi terhadap sumbu-x mengubah tanda koordinat y dan x tetap.', true, '(x, y) menjadi (x, −y).', kartesius(6, { garis: [[-6, 0, 6, 0, 'hijau']], titik: [{ x: 3, y: 5, w: 'biru', l: 'A' }, { x: 3, y: -5, w: 'merah', l: 'A′' }] })),
    bs('Refleksi terhadap sumbu-y mengubah tanda koordinat x dan y tetap.', true, '(x, y) menjadi (−x, y).'),
    bs('Refleksi terhadap garis y = x mengubah (x, y) menjadi (y, x).', true, 'Koordinat bertukar.'),
    bs('Refleksi terhadap garis y = −x mengubah (x, y) menjadi (−y, −x).', true, 'B(3, 5) menjadi (−5, −3).'),
    bs('Rotasi 90° berlawanan arah jarum jam berpusat O mengubah (x, y) menjadi (−y, x).', true, 'C(2, 6) menjadi (−6, 2).'),
    bs('Rotasi 90° searah jarum jam berpusat O mengubah (x, y) menjadi (y, −x).', true, 'D(5, −3) menjadi (−3, −5).'),
    bs('Rotasi 90° searah dan berlawanan arah jarum jam pada titik yang sama selalu menghasilkan bayangan yang sama.', false, 'Hasilnya berbeda.'),
    bs('Rotasi 180° berpusat O mengubah (x, y) menjadi (−x, −y).', true, 'S(3, 8) menjadi (−3, −8).'),
    bs('Untuk rotasi lengkap, perlu diketahui pusat, besar sudut, dan arah putar.', true, 'Ketiganya wajib.'),
    bs('Dilatasi berpusat O dengan faktor skala k mengubah (x, y) menjadi (kx, ky).', true, 'Dikali k.'),
    bs('Dilatasi dengan k negatif menghasilkan bayangan di sisi berlawanan dari pusat.', true, 'F(2, 3) dengan k = −2 menjadi (−4, −6).'),
    bs('Dilatasi selalu mengubah ukuran bangun.', false, 'k = 1 menghasilkan bayangan sama persis.'),
    bs('Dilatasi dengan k = 0,5 menghasilkan bangun yang lebih kecil tetapi tetap sebangun.', true, 'Bentuk sama.'),
    bs('Translasi, refleksi, dan rotasi selalu menghasilkan bayangan yang kongruen dengan aslinya.', true, 'Jarak dipertahankan.'),
    bs('Refleksi mengubah orientasi bangun walau ukuran dan bentuknya tetap.', true, 'Arah putaran terbalik.'),
    bs('Rotasi 180° sama dengan refleksi terhadap sumbu-x lalu sumbu-y.', true, '(x, −y) lalu (−x, −y).'),
    bs('Dilatasi dengan k = −1 menghasilkan titik yang sama dengan rotasi 180° pada pusat yang sama.', true, '(−x, −y).'),
  ],
  debat: [
    debat('Dedi dan Eka menghitung bayangan A(4, −1) oleh refleksi terhadap y = x.', ['Dedi: "(4, 1)."', 'Eka: "(−1, 4); koordinat bertukar."'], 1, '(x, y) menjadi (y, x).'),
    debat('Gita dan Hadi memutar D(5, −3) 90° searah jarum jam.', ['Gita: "(3, 5)."', 'Hadi: "(−3, −5)."'], 1, 'Aturan (y, −x).'),
    debat('Ira dan Joni menghitung F(2, 3) dilatasi k = −2.', ['Ira: "(4, 6)."', 'Joni: "(−4, −6); berpindah ke sisi berlawanan."'], 1, 'Kalikan dengan −2.'),
    debat('Kiki dan Lani menilai dilatasi k = 1.', ['Kiki: "Selalu mengubah ukuran."', 'Lani: "Bayangannya sama persis."'], 1, 'Faktor skala 1.'),
    debat('Made dan Nia menghitung E(4, 1) oleh vektor (−3, 2).', ['Made: "(1, 3)."', 'Nia: "(7, −1)."'], 0, 'Tambahkan langsung.'),
    debat('Oka dan Putri menentukan rotasi dari P(3, 2) ke P′(−2, 3).', ['Oka: "90° berlawanan arah jarum jam."', 'Putri: "90° searah jarum jam."'], 0, '(−y, x) = (−2, 3).'),
  ],
  bank: [
    isi('Transformasi yang memindahkan titik tanpa mengubah bentuk maupun ukuran disebut ... (translasi / dilatasi)', ['translasi'], 'Pergeseran.'),
    isi('Translasi titik (x, y) oleh vektor (a, b) menghasilkan bayangan (x + ..., y + ...). Isi bagian pertama.', ['a'], 'Komponen pertama.'),
    isi('Dilatasi titik (x, y) pusat O dengan faktor skala k menghasilkan (... × x, ... × y). Isi dengan huruf.', ['k'], 'Faktor skala.'),
    isi('Titik P(6, −4) ditranslasikan oleh vektor (2, 5). Tuliskan bayangan tanpa spasi, mis. (1,2).', ['(8,1)'], '6 + 2 dan −4 + 5.'),
    isi('Titik N(9, −5) ditranslasikan oleh vektor (−4, 6). Tuliskan bayangan tanpa spasi.', ['(5,1)'], '9 − 4 dan −5 + 6.'),
    isi('Titik V(10, −4) ditranslasikan oleh vektor (−6, 3). Tuliskan bayangan tanpa spasi.', ['(4,-1)'], '10 − 6 dan −4 + 3.'),
    isi('Bayangan translasi oleh vektor (5, −3) adalah Q′(9, 1). Tuliskan titik asal Q tanpa spasi.', ['(4,4)'], '9 − 5 dan 1 + 3.'),
    isi('R(2, −5) menjadi R′(−1, 3). Tuliskan vektor translasi tanpa spasi.', ['(-3,8)'], '−1 − 2 dan 3 + 5.'),
    isi('Bayangan translasi oleh vektor (−2, 7) adalah X′(6, 5). Tuliskan titik asal X tanpa spasi.', ['(8,-2)'], '6 + 2 dan 5 − 7.'),
    isi('Robot memindahkan komponen dari (10, 4) ke (3, 4). Tuliskan vektor translasinya tanpa spasi.', ['(-7,0)'], '3 − 10 dan 0.'),
    isi('Karakter game di (2, 3) bergeser vektor (4, −1) sebanyak 3 kali. Tuliskan posisi akhir tanpa spasi.', ['(14,0)'], '2 + 12 dan 3 − 3.'),
    isi('Q(−3, 7) direfleksikan terhadap sumbu-x. Tuliskan bayangan tanpa spasi.', ['(-3,-7)'], 'y berubah tanda.', kartesius(8, { garis: [[-8, 0, 8, 0, 'hijau']], titik: [{ x: -3, y: 7, w: 'biru', l: 'Q' }, { x: -3, y: -7, w: 'merah', l: 'Q′' }] })),
    isi('R(5, −2) direfleksikan terhadap sumbu-y. Tuliskan bayangan tanpa spasi.', ['(-5,-2)'], 'x berubah tanda.'),
    isi('P(−7, 4) direfleksikan terhadap sumbu-y. Tuliskan bayangan tanpa spasi.', ['(7,4)'], 'x berubah tanda.'),
    isi('S(3, 8) dirotasi 180° terhadap O. Tuliskan bayangan tanpa spasi.', ['(-3,-8)'], '(−x, −y).'),
    isi('T(4, −6) dirotasi 90° berlawanan arah jarum jam, aturan (−y, x). Tuliskan bayangan tanpa spasi.', ['(6,4)'], '(6, 4).'),
    isi('U(−2, 5) dirotasi 90° searah jarum jam, aturan (y, −x). Tuliskan bayangan tanpa spasi.', ['(5,2)'], '(5, 2).'),
    isi('S(−3, −9) dirotasi 90° searah jarum jam, aturan (y, −x). Tuliskan bayangan tanpa spasi.', ['(-9,3)'], '(−9, 3).'),
    isi('Ujung bilah baling-baling di (5, 0) berputar 90° berlawanan arah jarum jam. Tuliskan posisi baru tanpa spasi.', ['(0,5)'], '(0, 5).'),
    isi('V(4, −3) didilatasi pusat O dengan k = 3. Tuliskan bayangan tanpa spasi.', ['(12,-9)'], '3 × 4 dan 3 × (−3).'),
    isi('W(6, −9) didilatasi pusat O dengan k = 1/3. Tuliskan bayangan tanpa spasi.', ['(2,-3)'], 'Dibagi 3.'),
    isi('R(8, −12) didilatasi pusat O dengan k = 1/4. Tuliskan bayangan tanpa spasi.', ['(2,-3)'], 'Dibagi 4.'),
    isi('S(4, 6) menjadi S′(10, 15) oleh dilatasi pusat O. Berapa faktor skala? (dengan koma)', ['2,5'], '10 : 4.'),
    isi('Y(5, 8) menjadi Y′(15, 24) oleh dilatasi pusat O. Berapa faktor skala?', '3', '15 : 5.'),
    isi('Denah (3, 2) diperbesar 4 kali dengan dilatasi pusat O. Tuliskan titik baru tanpa spasi.', ['(12,8)'], '4 × (3, 2).'),
    pg('Bayangan A(4, −1) oleh refleksi terhadap y = x adalah ...', ["A′(−1, 4)", "A′(1, −4)", "A′(4, 1)", "A′(−4, 1)"], 0, 'Koordinat bertukar.'),
    pg('Bayangan B(3, 5) oleh refleksi terhadap y = −x adalah ...', ["B′(−5, −3)", "B′(5, 3)", "B′(−3, −5)", "B′(3, −5)"], 0, '(−y, −x).'),
    pg('Bayangan C(2, 6) oleh rotasi 90° berlawanan arah jarum jam pusat O adalah ...', ["C′(−6, 2)", "C′(6, −2)", "C′(−2, −6)", "C′(6, 2)"], 0, '(−y, x).'),
    pg('Bayangan D(5, −3) oleh rotasi 90° searah jarum jam pusat O adalah ...', ["D′(−3, −5)", "D′(3, 5)", "D′(−5, 3)", "D′(5, 3)"], 0, '(y, −x).'),
    pg('Bayangan F(2, 3) oleh dilatasi k = −2 pusat O adalah ...', ["F′(−4, −6)", "F′(4, 6)", "F′(−4, 6)", "F′(−1, −1,5)"], 0, 'Sisi berlawanan pusat.'),
    pg('Bayangan M(2, −8) oleh dilatasi k = −3 pusat O adalah ...', ["M′(−6, 24)", "M′(6, −24)", "M′(−6, −24)", "M′(6, 24)"], 0, '−3 × 2 dan −3 × (−8).'),
    pg('T(6, 2) memiliki bayangan T′(2, 6). Transformasi yang paling mungkin ...', ['Refleksi terhadap y = x', 'Translasi', 'Dilatasi', 'Rotasi 180°'], 0, 'Koordinat bertukar.'),
    pg('Unsur yang wajib diketahui untuk rotasi lengkap ...', ['pusat rotasi, besar sudut, dan arah putar', 'hanya besar sudut', 'hanya pusat', 'hanya arah putar'], 0, 'Ketiganya.'),
    pg('Siswa: "Dilatasi selalu mengubah ukuran bangun." Penilaian ...', ['Salah; k = 1 menghasilkan bayangan sama persis', 'Benar'], 0, 'Faktor skala 1.'),
    pg('Siswa: "Rotasi 180° sama dengan refleksi sumbu-x lalu sumbu-y." Penilaian ...', ['Benar', 'Salah'], 0, '(x, −y) lalu (−x, −y).'),
    pg('Siswa: "Dilatasi k = 0,5 menghasilkan bangun lebih kecil tetapi tetap sebangun." Penilaian ...', ['Benar', 'Salah'], 0, 'Bentuk sama.'),
    pg('Sifat yang benar tentang jarak antar titik ...', ['Translasi mempertahankan jarak', 'Dilatasi mempertahankan jarak', 'Dilatasi k = 2 mempertahankan jarak', 'Refleksi mengubah jarak'], 0, 'Translasi, refleksi, rotasi mempertahankan jarak.'),
    gen('translasiGen'),
    gen('refleksiX'),
    gen('refleksiY'),
    gen('rotasiBerlawanan'),
    gen('rotasiSearah'),
    gen('dilatasiGen'),
    gen('titikAsal'),
    gen('faktorSkala'),
  ],
}
