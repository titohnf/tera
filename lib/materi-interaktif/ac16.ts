import { rakit } from './bersama'
import { DATA_AC16 } from './latihan/ac16'

/**
 * Materi interaktif AC-16 "Baca Batang" (Interpretasi dan identifikasi
 * kesalahan diagram batang). Satu halaman HTML mandiri, ditampilkan lewat
 * iframe sandbox di `/mandiri/materi` dan sebagai langkah Belajar di topik
 * Misi AC-16. Disimpan sebagai string supaya ikut terbundel di build tanpa
 * membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-15 (anak kelas 3-6, tiap stasiun beranimasi;
 * batang diagram tumbuh dari bawah). Lima stasiun praktik:
 * 1) Nama bagian: judul, sumbu tegak, skala, sumbu datar, kategori, batang;
 *    bagian yang dilingkari merah harus diberi nama.
 * 2) Baca dan hitung: paling banyak, paling sedikit, urutan, selisih, total,
 *    rata-rata; batang yang dimaksud disorot setelah dijawab.
 * 3) Sumbu yang menipu: geser titik awal sumbu tegak, angka data tetap, tetapi
 *    selisih kecil tampak makin besar. Selisih sebenarnya dari angka.
 * 4) Periksa diagram: jarak label tidak sama, tanpa angka, lebar batang
 *    berbeda, diagram baik, dan sumbu tidak dari 0 yang tetap jelas.
 * 5) Rancang sumbu tegak: jarak label = maks : (banyak label - 1); label muncul
 *    satu per satu setelah jawaban benar.
 * Bonus: ubah nilai empat batang dan potong sumbunya untuk melihat tipuannya.
 *
 * Soal Misi topik ini menguji: nama bagian, membaca dan menghitung dari
 * diagram, kesalahan diagram (label tidak konsisten, tanpa angka, lebar batang
 * berbeda, sumbu tidak dari 0), selisih sebenarnya, dan merancang sumbu.
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac16.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId): semuanya satu cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-16 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Baca Batang</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#fbf6ea; --card:#ffffff; --ink:#2b2a33; --muted:#6b6878;
  --ikat:#d94f3d; --lidi:#e0a93b; --lidi-dark:#b97f12; --ok:#2e9a63; --bad:#d23b4e; --line:#eadfc4; --soft:#fff3d0;
  --rb:#4a7bd0;
  --display:'Baloo 2','Trebuchet MS',system-ui,sans-serif; --body:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;
}
@media (prefers-color-scheme: dark){
  :root{--bg:#1f1c17;--card:#2a2620;--ink:#f6efe0;--muted:#b9b09b;--line:#4a4231;--soft:#3a3220;--ok:#5cc990;--bad:#ff7a8a;--lidi:#e7b34a;--ikat:#ef6b59;--rb:#7ea4ea}
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-weight:600;font-size:20px;line-height:1.4;-webkit-tap-highlight-color:transparent}
.app{max-width:560px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;padding:12px 16px 20px;gap:12px}
h1,h2{font-family:var(--display);margin:0;line-height:1.1;text-wrap:balance}
h1{font-size:clamp(2.4rem,11vw,3.4rem);font-weight:800}
h2{font-size:1.7rem;font-weight:800}
p{margin:0}
/* atas */
.top{display:flex;align-items:center;gap:10px;min-height:44px}
.bar{flex:1;height:14px;background:var(--line);border-radius:99px;overflow:hidden}
.bar i{display:block;height:100%;width:0;background:var(--ok);border-radius:99px;transition:width .35s}
.ico{width:44px;height:44px;border-radius:50%;border:2px solid var(--line);background:var(--card);color:var(--ink);font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
.ico[hidden]{display:none}
.ico:focus-visible,button:focus-visible{outline:3px solid var(--ikat);outline-offset:2px}
/* layar */
.screen{display:none;flex:1;flex-direction:column;gap:14px}
.screen.on{display:flex}
.say{font-family:var(--display);font-size:1.55rem;font-weight:800;text-wrap:balance}
.sub{color:var(--muted);font-size:1rem}
.panel{background:var(--card);border:2px solid var(--line);border-radius:22px;padding:14px}
.grow{flex:1}
.cta{display:flex;flex-direction:column;gap:10px;margin-top:auto;padding-top:6px}
button.big{font:inherit;font-family:var(--display);font-weight:800;font-size:1.3rem;min-height:58px;border-radius:18px;border:2px solid var(--ink);background:var(--card);color:var(--ink);box-shadow:0 4px 0 var(--ink);cursor:pointer;padding:10px 18px}
button.big:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink)}
button.big.main{background:var(--ikat);color:#fff}
button.big.soft{box-shadow:none;border-color:var(--line);font-size:1.1rem;min-height:52px}
button.big:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
@keyframes denyut{50%{box-shadow:0 0 0 5px rgba(217,79,61,.45)}}
@keyframes pop{0%{transform:scale(.3)}70%{transform:scale(1.25)}100%{transform:scale(1)}}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.center{text-align:center}
.aksi{display:grid;gap:10px}
.aksi.pil2{grid-template-columns:1fr 1fr}
.aksi.pil3{grid-template-columns:repeat(3,1fr)}
.aksi button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.1rem;line-height:1.25;min-height:58px;border-radius:16px;border:2px solid var(--ink);background:var(--card);color:var(--ink);cursor:pointer;box-shadow:0 3px 0 var(--ink);touch-action:manipulation;padding:8px 10px;display:flex;align-items:center;justify-content:center;gap:4px}
.aksi button.utama{background:var(--ikat);color:#fff;font-size:1.3rem}
.aksi button.right{background:var(--ok);border-color:var(--ok);color:#fff;box-shadow:none}
.aksi button.wrong{background:var(--soft);border-color:var(--ikat);box-shadow:none}
.aksi button.hint{animation:denyut 1s infinite}
.tanya{font-family:var(--display);font-weight:800;font-size:1.25rem;text-align:center}
.cacah{font-family:var(--display);font-weight:800;font-size:1.15rem;text-align:center;min-height:1.6em}
.cacah b{color:var(--ikat)}
.catat{display:flex;flex-direction:column;gap:3px;font-family:var(--display);font-weight:800;font-size:1.05rem;min-height:1.5em}
.catat div{display:flex;align-items:center;gap:8px;animation:pop .4s}
.catat i{display:inline-block;width:16px;height:16px;border-radius:4px;border:2px solid var(--ink)}
.alat{display:flex;justify-content:center;align-items:center;min-height:120px}
.alat svg{max-width:100%}
.baca{font-family:var(--display);font-weight:800;font-size:1.1rem;text-align:center;min-height:2.6em}
input[type=range]{width:100%;accent-color:var(--ikat);height:40px}
.ubah{font:inherit;font-family:var(--display);font-weight:800;font-size:1.05rem;min-height:50px;border-radius:14px;border:2px solid var(--ikat);background:var(--soft);color:var(--ink);cursor:pointer;touch-action:manipulation;padding:6px 10px;width:100%}
.kontrol{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.kontrol div{display:flex;align-items:center;justify-content:space-between;gap:6px;border:2px solid var(--line);border-radius:14px;padding:4px 8px;background:var(--card);font-family:var(--display);font-weight:800;font-size:1.2rem}
.kontrol button{width:40px;height:40px;border-radius:50%;border:2px solid var(--ink);background:var(--card);color:var(--ink);font-size:1.3rem;cursor:pointer;touch-action:manipulation;padding:0}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div class="app">
  <div class="top">
    <button class="ico" id="back" aria-label="Kembali" hidden>&#8592;</button>
    <div class="bar" aria-hidden="true"><i id="prog"></i></div>
    <button class="ico" id="suara" aria-label="Bacakan" hidden>&#128266;</button>
  </div>

  <!-- 0: mulai -->
  <section class="screen on" id="intro">
    <div class="grow" style="display:flex;flex-direction:column;justify-content:center;gap:18px;text-align:center">
      <h1>Baca Batang</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo baca diagram batang dan temukan yang menipu!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: nama bagian -->
  <section class="screen" id="s1">
    <p class="say">Apa nama bagian yang dilingkari merah?</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: baca dan hitung -->
  <section class="screen" id="s2">
    <p class="say">Baca batangnya, lalu hitung.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div></div>
    <div class="catat" id="s2catat"></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: sumbu yang menipu -->
  <section class="screen" id="s3">
    <p class="say">Awas, sumbu bisa menipu mata!</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="baca" id="s3baca"></div>
      <input type="range" id="s3geser" min="0" max="4" value="0" aria-label="Titik awal sumbu"></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: periksa diagram -->
  <section class="screen" id="s4">
    <p class="say">Apa yang salah pada diagram ini?</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div></div>
    <div class="aksi" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5: rancang sumbu -->
  <section class="screen" id="s5">
    <p class="say">Rancang sumbu tegak yang rapi.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="alat" id="s5alat"></div></div>
    <div class="tanya" id="s5tanya"></div>
    <div class="aksi" id="s5aksi"></div>
    <div class="msg" id="s5msg"></div>
    <div class="cta"><button class="big main" id="s5next" disabled>Lanjut</button></div>
  </section>

  <!-- akhir -->
  <section class="screen" id="akhir">
    <div class="grow" style="display:flex;flex-direction:column;justify-content:center;gap:16px">
      <div class="stars" id="bintang"><span>&#11088;</span><span>&#11088;</span><span>&#11088;</span></div>
      <h2 class="center" id="akhirJudul">Hebat!</h2>
      <p class="say center" id="akhirTeks"></p>
    </div>
    <div class="cta">
      <button class="big main" id="berlatih">Ayo berlatih</button>
      <button class="big soft" id="keBonus">Coba Bonus: buat diagram sendiri</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: ubah nilai, lalu potong sumbunya!</p>
    <div class="panel"><div class="alat" id="bDiag"></div></div>
    <div class="kontrol" id="bKontrol"></div>
    <button class="ubah" id="bUbah"></button>
    <div class="msg" id="bmsg"></div>
    <div class="cta"><button class="big main" id="bonusSelesai">Selesai</button></div>
  </section>
</div>

<script>
(function(){
var $=function(id){return document.getElementById(id)};
var rnd=function(a,b){return a+Math.floor(Math.random()*(b-a+1))};
var shuffle=function(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=rnd(0,i),t=a[i];a[i]=a[j];a[j]=t}return a};
var timers=[];function later(fn,ms){timers.push(setTimeout(fn,ms))}
function clearTimers(){timers.forEach(clearTimeout);timers=[]}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function clear(n){while(n.firstChild)n.removeChild(n.firstChild)}
function titik(id,n,aktif){var d=$(id);clear(d);for(var j=0;j<n;j++)d.appendChild(el('i',j<=aktif?'on':''))}
function msg(id,kelas,t){var m=$(id);m.className='msg'+(kelas?' '+kelas:'');m.textContent=t}
function tombol(wadah,teks,fn,kls){var b=el('button',kls||null,teks);b.onclick=fn;wadah.appendChild(b);return b}
function pilihan(wadah,opsi,benar,fnBenar,kolom,fnSalah){
  clear(wadah);wadah.className='aksi'+(kolom?' pil'+kolom:'');
  shuffle(opsi).forEach(function(o){
    var b=tombol(wadah,o,function(){
      if(b.disabled)return;
      if(o===benar){b.classList.add('right');fnBenar()}
      else{b.classList.add('wrong');b.disabled=true;if(fnSalah)fnSalah(o)}
    });
  });
}
/* alat ukur bergerak halus dari nilai dari ke nilai ke */
function ayun(s,dari,ke,ms){
  if(!s||!s._ke)return;var t0=null;
  function f(t){
    if(!document.body.contains(s))return;
    if(t0===null)t0=t;
    var k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);
    s._ke(dari+(ke-dari)*e);
    if(k<1)requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
}

/* ---- suara bacaan (tambahan, hanya bila ada suara Indonesia) ---- */
var punyaSuara=false,kata='';
function cekSuara(){
  if(!('speechSynthesis' in window))return;
  var v=window.speechSynthesis.getVoices()||[];
  punyaSuara=v.some(function(x){return (x.lang||'').toLowerCase().indexOf('id')===0});
  $('suara').hidden=!punyaSuara;
}
if('speechSynthesis' in window){cekSuara();window.speechSynthesis.onvoiceschanged=cekSuara}
function setKata(t){kata=t}
$('suara').onclick=function(){
  if(!punyaSuara||!kata)return;
  try{window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(kata);u.lang='id-ID';u.rate=.9;window.speechSynthesis.speak(u)}catch(e){}
};

/* ---- navigasi ---- */
var urut=['intro','s1','s2','s3','s4','s5','akhir'];
var cur='intro';
function show(id){
  clearTimers();
  try{if('speechSynthesis' in window)window.speechSynthesis.cancel()}catch(e){}
  var all=document.querySelectorAll('.screen');
  for(var i=0;i<all.length;i++)all[i].classList.remove('on');
  $(id).classList.add('on');
  if(id!=='bonus')cur=id;
  var k=urut.indexOf(id);
  $('prog').style.width=(k<0?100:k/(urut.length-1)*100)+'%';
  $('back').hidden=(id==='intro'||id==='akhir'||id==='bonus');
  window.scrollTo(0,0);
  if(id==='s1')mulaiS1();
  if(id==='s2')mulaiS2();
  if(id==='s3')mulaiS3();
  if(id==='s4')mulaiS4();
  if(id==='s5')mulaiS5();
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')mulaiBonus();
  if(id==='intro')setKata('Ayo baca diagram batang dan temukan yang menipu!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo baca diagram batang dan temukan yang menipu!');

/* ---- stasiun 1: nama bagian diagram ---- */
var DB1=[{l:'Apel',v:6},{l:'Jeruk',v:4},{l:'Mangga',v:8},{l:'Pisang',v:5}];
var N1=['judul diagram','sumbu tegak','skala','sumbu datar','kategori','batang'];
var R1=[
  {sorot:'judul',benar:'judul diagram',pesan:'Judul diagram memberi tahu apa isi diagram ini.'},
  {sorot:'tegak',benar:'sumbu tegak',pesan:'Sumbu tegak adalah garis tegak yang menunjukkan angka atau jumlah.'},
  {sorot:'skala',benar:'skala',pesan:'Angka-angka yang berjajar di sumbu tegak disebut skala.'},
  {sorot:'datar',benar:'sumbu datar',pesan:'Sumbu datar adalah garis mendatar di bawah, tempat nama kategori.'},
  {sorot:'kategori',benar:'kategori',pesan:'Kategori adalah hal yang dibandingkan: Apel, Jeruk, Mangga, Pisang.'},
  {sorot:'batang',benar:'batang',pesan:'Batang adalah persegi panjang. Tingginya menunjukkan besar data.'}
];
var r1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1];titik('s1dots',R1.length,r1);
  var w=$('s1alat');clear(w);
  w.appendChild(GBR.diagram({d:DB1,hi:10,langkah:2,judul:'Buah yang terjual',sat:'buah',sorot:d.sorot,nilai:false}));
  $('s1next').disabled=true;msg('s1msg','','Bagian yang dilingkari merah itu namanya apa?');setKata('Bagian yang dilingkari merah itu namanya apa?');
  var lain=shuffle(N1.filter(function(x){return x!==d.benar})).slice(0,2),opsi=[d.benar].concat(lain);
  pilihan($('s1aksi'),opsi,d.benar,function(){
    msg('s1msg','good',d.pesan);setKata(d.pesan);
    $('s1aksi').querySelectorAll('button').forEach(function(b){b.disabled=true});$('s1next').disabled=false;
  },3,function(){msg('s1msg','warn','Hampir! Lihat lagi bagian yang bertanda merah.')});
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: membaca dan menghitung ---- */
var R2=[
  {judul:'Hobi siswa',sat:'siswa',hi:15,st:5,d:[{l:'Membaca',v:9},{l:'Menggambar',v:14},{l:'Menyanyi',v:6},{l:'Menari',v:11}],
    steps:[{t:'Hobi apa yang paling banyak?',o:['Menggambar','Membaca','Menari'],b:'Menggambar',tandai:[1],p:'Batang Menggambar paling tinggi: 14 siswa.'},
           {t:'Berapa selisih hobi terbanyak dan tersedikit?',o:['8','20','5'],b:'8',tandai:[1,2],p:'14 − 6 = 8 siswa.'},
           {t:'Berapa jumlah semua siswa?',o:['40','31','34'],b:'40',tandai:[],p:'9 + 14 + 6 + 11 = 40 siswa.'}]},
  {judul:'Porsi terjual',sat:'porsi',hi:30,st:10,d:[{l:'Sate',v:18},{l:'Bakso',v:24},{l:'Soto',v:12}],
    steps:[{t:'Urutkan dari porsi paling SEDIKIT ke paling BANYAK.',o:['Soto, Sate, Bakso','Bakso, Sate, Soto','Sate, Soto, Bakso'],b:'Soto, Sate, Bakso',tandai:[],p:'Soto 12, Sate 18, Bakso 24.'},
           {t:'Berapa total porsi yang terjual?',o:['54','42','60'],b:'54',tandai:[],p:'18 + 24 + 12 = 54 porsi.'},
           {t:'Berapa rata-rata porsi tiap menu?',o:['18','27','54'],b:'18',tandai:[],p:'Total 54 dibagi 3 menu = 18 porsi.'}]},
  {judul:'Buku dipinjam',sat:'buku',hi:15,st:5,d:[{l:'Senin',v:8},{l:'Selasa',v:12},{l:'Rabu',v:6},{l:'Kamis',v:10}],
    steps:[{t:'Hari apa buku yang dipinjam paling sedikit?',o:['Rabu','Senin','Selasa'],b:'Rabu',tandai:[2],p:'Batang Rabu paling pendek: 6 buku.'},
           {t:'Berapa total buku yang dipinjam?',o:['36','30','32'],b:'36',tandai:[],p:'8 + 12 + 6 + 10 = 36 buku.'},
           {t:'Berapa rata-rata buku per hari?',o:['9','36','12'],b:'9',tandai:[],p:'36 dibagi 4 hari = 9 buku.'}]}
];
var r2=0,l2=0;
function mulaiS2(){r2=0;ronde2()}
function gambarS2(tandai){var d=R2[r2],w=$('s2alat');clear(w);w.appendChild(GBR.diagram({d:d.d,hi:d.hi,langkah:d.st,judul:d.judul,sat:d.sat,nilai:true,tandai:tandai||[],anim:!tandai}))}
function ronde2(){
  titik('s2dots',R2.length,r2);l2=0;gambarS2();clear($('s2catat'));$('s2next').disabled=true;langkahS2();
}
function langkahS2(){
  var d=R2[r2],s=d.steps[l2];
  $('s2tanya').textContent=s.t;setKata(s.t);msg('s2msg','','Pertanyaan '+(l2+1)+' dari '+d.steps.length+'. Baca batangnya.');
  pilihan($('s2aksi'),s.o,s.b,function(){
    gambarS2(s.tandai);
    var c=el('div');c.appendChild(document.createTextNode(s.p));$('s2catat').appendChild(c);
    msg('s2msg','good',s.p);setKata(s.p);clear($('s2aksi'));$('s2tanya').textContent='';
    l2++;
    if(l2<d.steps.length)later(langkahS2,1400);else $('s2next').disabled=false;
  },3,function(){msg('s2msg','warn','Hampir! Lihat angka di atas batang dan hitung pelan-pelan.')});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: sumbu yang menipu ---- */
var R3=[
  {A:'Kelas A',va:70,B:'Kelas B',vb:75,hi:80,los:[0,20,40,60,68],judul:'Nilai rata-rata',sat:'nilai'},
  {A:'Rina',va:150,B:'Tono',vb:153,hi:160,los:[0,100,140,148],judul:'Tinggi badan',sat:'cm'}
];
var r3=0,fase3=0;
function mulaiS3(){r3=0;ronde3()}
function gambarS3(k){
  var d=R3[r3],lo=d.los[k],w=$('s3alat');clear(w);
  w.appendChild(GBR.diagram({d:[{l:d.A,v:d.va},{l:d.B,v:d.vb}],lo:lo,hi:d.hi,langkah:(d.hi-lo)/4,judul:d.judul,sat:d.sat,nilai:true,anim:false}));
  var kali=(d.vb-lo)/(d.va-lo);
  $('s3baca').textContent='Sumbu mulai dari '+lo+'. Batang '+d.B+' tampak '+fmtId(Math.round(kali*10)/10)+' kali batang '+d.A+'.';
}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);fase3=0;
  var sl=$('s3geser');sl.min='0';sl.max=String(d.los.length-1);sl.step='1';sl.value='0';sl.disabled=false;
  gambarS3(0);clear($('s3aksi'));$('s3tanya').textContent='';$('s3next').disabled=true;
  msg('s3msg','','Geser pegangan: sumbu mulai dari angka yang makin besar. Angka datanya tidak berubah!');setKata($('s3msg').textContent);
}
$('s3geser').oninput=function(){
  var d=R3[r3],k=+$('s3geser').value;gambarS3(k);
  if(k===d.los.length-1&&fase3===0){fase3=1;later(tanya3a,900)}
};
function tanya3a(){
  var d=R3[r3],sel=d.vb-d.va,lo=d.los[d.los.length-1];
  $('s3tanya').textContent='Berapa selisih nilai SEBENARNYA '+d.B+' dan '+d.A+'?';setKata($('s3tanya').textContent);
  pilihan($('s3aksi'),[String(sel),String(d.vb-lo),String(d.va-lo)],String(sel),function(){
    var t=d.vb+' − '+d.va+' = '+sel+'. Selisih sebenarnya dihitung dari angka, bukan dari beda tinggi batang.';
    msg('s3msg','good',t);setKata(t);later(tanya3b,1700);
  },3,function(){msg('s3msg','warn','Hampir! Pakai angka data yang sebenarnya, bukan tinggi batang yang terlihat.')});
}
function tanya3b(){
  var t='Bagaimana membaca diagram yang sumbunya tidak mulai dari 0?';
  $('s3tanya').textContent=t;setKata(t);
  var b='Baca angka pada skala dan di batang, jangan hanya melihat tinggi batang';
  pilihan($('s3aksi'),[b,'Percaya tinggi batang saja','Diagram itu pasti salah dan tidak boleh dipakai'],b,function(){
    msg('s3msg','good','Betul! Sumbu boleh tidak mulai dari 0 asal label jelas dan jarak sama. Tetapi pembaca harus membaca angkanya.');
    clear($('s3aksi'));$('s3tanya').textContent='';$('s3next').disabled=false;
  },null,function(){msg('s3msg','warn','Hampir! Diagram seperti itu boleh, tapi harus dibaca dengan cermat.')});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: periksa diagram ---- */
var F4=['Jarak antar label sumbu tegak tidak sama','Sumbu tegak tidak berangka','Lebar batang berbeda-beda','Tidak ada yang salah'];
var DW=[{l:'Sate',v:18},{l:'Bakso',v:24},{l:'Soto',v:12}];
var R4=[
  {g:{d:DW,hi:100,label:[0,10,30,60,100],rata:true,judul:'Porsi terjual',nilai:false},benar:F4[0],pesan:'Label 0, 10, 30, 60, 100 berjarak 10, 20, 30, 40: tidak sama. Jarak label harus konsisten.'},
  {g:{d:DW,hi:30,langkah:10,tanpaAngka:true,judul:'Porsi terjual'},benar:F4[1],pesan:'Tanpa angka pada sumbu tegak, nilai pasti tiap batang tidak bisa dibaca.'},
  {g:{d:DW,hi:30,langkah:10,lebar:[2,1,1],judul:'Porsi terjual'},benar:F4[2],pesan:'Lebar batang yang berbeda membuat mata mengira batang lebar bernilai lebih besar.'},
  {g:{d:DW,hi:30,langkah:10,judul:'Porsi terjual',nilai:true},benar:F4[3],pesan:'Mulai dari 0, jarak label sama, ada angka, batang sama lebar. Diagram ini baik.'},
  {g:{d:[{l:'Ani',v:68},{l:'Budi',v:72}],lo:60,hi:80,langkah:5,judul:'Nilai ulangan',nilai:true},benar:'Tidak salah, asal angka pada sumbu dibaca dengan cermat',lain:['Salah, sumbu harus selalu dimulai dari 0','Salah, batangnya terlalu tinggi'],pesan:'Sumbu tidak dari 0, tetapi label jelas dan jaraknya sama. Aman asal pembaca membaca angkanya.'}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  var w=$('s4alat');clear(w);w.appendChild(GBR.diagram(d.g));
  $('s4next').disabled=true;msg('s4msg','','Periksa diagram ini dengan teliti.');
  var opsi=[d.benar].concat(d.lain||shuffle(F4.filter(function(x){return x!==d.benar})).slice(0,2));
  setKata('Apa yang salah pada diagram ini?');
  pilihan($('s4aksi'),opsi,d.benar,function(){
    msg('s4msg','good',d.pesan);setKata(d.pesan);$('s4aksi').querySelectorAll('button').forEach(function(b){b.disabled=true});$('s4next').disabled=false;
  },null,function(){msg('s4msg','warn','Hampir! Lihat lagi sumbu tegak, lebar batang, dan angkanya.')});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: rancang sumbu tegak ---- */
var R5=[
  {mk:40,n:5,st:10},{mk:70,n:8,st:10},{mk:90,n:4,st:30},{mk:45,n:4,st:15},
  {pilih:true,t:'Nilai ulangan berkisar 62 sampai 96. Sumbu mana yang paling tepat (mulai dari 0, jarak sama)?',lab:[0,20,40,60,80,100],o:['0, 20, 40, 60, 80, 100','0, 10, 30, 60, 100','60, 70, 80, 90, 100']}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function gambarS5(lab,data,hi){var w=$('s5alat');clear(w);w.appendChild(GBR.diagram({d:data,hi:hi,label:lab,nilai:false,anim:false}))}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);$('s5next').disabled=true;
  var hi=d.pilih?100:d.mk,data=d.pilih?[{l:'Ani',v:62},{l:'Budi',v:96}]:[{l:'A',v:Math.round(hi*0.5)},{l:'B',v:Math.round(hi*0.8)}];
  gambarS5([0,hi],data,hi);
  var t=d.pilih?d.t:'Sumbu tegak dari 0 sampai '+d.mk+' dibagi '+d.n+' label berjarak sama. Berapa jarak antar label?';
  $('s5tanya').textContent=t;setKata(t);msg('s5msg','',d.pilih?'Pilih rancangan sumbu yang baik.':d.n+' label punya berapa jarak? Hitung dulu.');
  var benar,opsi;
  if(d.pilih){benar=d.o[0];opsi=d.o}
  else{benar=String(d.st);opsi=[benar,fmtId(Math.round(d.mk/d.n*100)/100),String(d.st*2)]}
  pilihan($('s5aksi'),opsi,benar,function(){
    var lab=d.pilih?d.lab:[],i;
    if(!d.pilih)for(i=0;i<d.n;i++)lab.push(i*d.st);
    clear($('s5aksi'));$('s5tanya').textContent='';
    for(i=1;i<=lab.length;i++){(function(i){later(function(){gambarS5(lab.slice(0,i).concat(i<lab.length?[hi]:[]),data,hi)},i*350)})(i)}
    var tx=d.pilih?'Betul! Mulai dari 0, jarak 20 sama, dan 100 cukup untuk nilai 96.':'Betul! '+d.mk+' : '+(d.n-1)+' = '+d.st+'. '+d.n+' label punya '+(d.n-1)+' jarak.';
    msg('s5msg','good',tx);setKata(tx);later(function(){$('s5next').disabled=false},lab.length*350+200);
  },3,function(){msg('s5msg','warn',d.pilih?'Hampir! Cari yang mulai dari 0 dan berjarak sama.':'Hampir! Banyak jarak lebih sedikit satu daripada banyak label.')});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu pembaca diagram yang teliti.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
  $('akhirJudul').textContent=judul;$('akhirTeks').textContent=teks;
  setKata(judul+' '+teks);
  $('berlatih').style.display=(window.parent!==window)?'':'none';
  if(n>=2)konfeti();
}
function konfeti(){
  var warna=['#d94f3d','#e0a93b','#2e9a63','#4a7bd0','#c75ba0'];
  for(var i=0;i<28;i++){(function(i){later(function(){
    var c=el('span','conf');c.style.left=rnd(2,96)+'%';c.style.background=warna[i%warna.length];
    c.style.animationDuration=(1.8+Math.random()*1.6)+'s';document.body.appendChild(c);
    setTimeout(function(){if(c.parentNode)c.parentNode.removeChild(c)},3800);
  },i*60)})(i)}
}
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-16'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  $('introGambar').appendChild(GBR.diagram({d:[{l:'Apel',v:6},{l:'Jeruk',v:4},{l:'Mangga',v:8},{l:'Pisang',v:5}],hi:10,langkah:2,nilai:true}));
})();

/* ---- bonus: buat diagram sendiri ---- */
var bNilai=[8,10,7,9],bMulai=false;
var bNama=['A','B','C','D'];
function mulaiBonus(){bNilai=[8,10,7,9];bMulai=false;gambarBonus()}
function gambarBonus(){
  var w=$('bDiag');clear(w);
  var lo=bMulai?Math.max(0,Math.floor((Math.min.apply(null,bNilai)-2)/4)*4):0,hi=20;
  w.appendChild(GBR.diagram({d:bNilai.map(function(v,i){return {l:bNama[i],v:v}}),lo:lo,hi:hi,langkah:(hi-lo)/4,nilai:true,anim:false}));
  var p=$('bKontrol');clear(p);
  bNilai.forEach(function(v,i){
    var r=el('div');r.appendChild(el('span',null,bNama[i]));
    var m=el('button',null,'−'),pl=el('button',null,'+');
    m.onclick=function(){bNilai[i]=Math.max(1,bNilai[i]-1);gambarBonus()};
    pl.onclick=function(){bNilai[i]=Math.min(20,bNilai[i]+1);gambarBonus()};
    r.appendChild(m);r.appendChild(el('b',null,String(v)));r.appendChild(pl);p.appendChild(r);
  });
  var tb=$('bUbah');tb.textContent=bMulai?'Sumbu mulai dari '+lo+' (menipu!) - ketuk untuk kembali ke 0':'Sumbu mulai dari 0 - ketuk untuk memotongnya';
  msg('bmsg',bMulai?'warn':'good',bMulai?'Angkanya sama, tetapi selisih tampak lebih besar. Baca angkanya!':'Sumbu dari 0: tinggi batang cocok dengan nilainya.');
}
$('bUbah').onclick=function(){bMulai=!bMulai;gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC16 = rakit(DASAR, { kode: 'AC-16', data: DATA_AC16 })
