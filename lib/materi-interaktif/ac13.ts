import { rakit } from './bersama'
import { DATA_AC13 } from './latihan/ac13'

/**
 * Materi interaktif AC-13 "Detektif Bentuk" (Ciri-ciri bangun datar dan bangun
 * ruang). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-13. Disimpan
 * sebagai string supaya ikut terbundel di build tanpa membaca berkas saat
 * runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-12 (anak kelas 3-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Putar dan kenali: ketuk tiap sisi dan sudut, lihat sifat yang dihitung dari
 *    koordinat bangun (sisi sama panjang, sudut siku-siku, pasangan sejajar);
 *    bangun DIPUTAR dan sifatnya tetap; lalu beri nama.
 * 2) Keluarga segi empat: nyalakan ciri (4 sisi sama, 4 siku-siku, 2 pasang
 *    sejajar, 1 pasang sejajar) dan lihat bangun mana yang tetap menyala;
 *    persegi ternyata termasuk persegi panjang.
 * 3) Hitung unsur: sisi, rusuk, dan titik sudut dinyalakan satu per satu pada
 *    kubus, limas, prisma, dan balok.
 * 4) Jaring-jaring: geser untuk melipat jaring-jaring kubus menjadi kubus 3D
 *    (CSS 3D), lalu cocokkan jaring-jaring tabung, limas, dan prisma.
 * 5) Tampak: dari atas dan dari samping, benda apa ini?
 * Bonus: benda sehari-hari dan bangun ruangnya.
 *
 * Soal Misi topik ini menguji: ciri dan nama bangun datar (jajar genjang dan
 * belah ketupat, trapesium, jenis segitiga), persegi sebagai persegi panjang
 * khusus, bangun yang diputar tetap sama, sisi-rusuk-titik sudut bangun ruang,
 * sisi lengkung dan datar, jaring-jaring, dan tampak dari beberapa sudut.
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac13.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas): semuanya satu cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-13 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Detektif Bentuk</title>
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
.aksi button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.15rem;line-height:1.25;min-height:58px;border-radius:16px;border:2px solid var(--ink);background:var(--card);color:var(--ink);cursor:pointer;box-shadow:0 3px 0 var(--ink);touch-action:manipulation;padding:8px 10px;display:flex;align-items:center;justify-content:center;gap:4px}
.aksi button.utama{background:var(--ikat);color:#fff;font-size:1.3rem}
.aksi button.right{background:var(--ok);border-color:var(--ok);color:#fff;box-shadow:none}
.aksi button.wrong{background:var(--soft);border-color:var(--ikat);box-shadow:none}
.aksi button.hint{animation:denyut 1s infinite}
.tanya{font-family:var(--display);font-weight:800;font-size:1.25rem;text-align:center}
/* stasiun 1: putar dan kenali */
.bd{display:flex;justify-content:center}
.bd svg{width:240px;height:240px;transition:transform .9s cubic-bezier(.4,1.3,.5,1)}
.bd .sisi{stroke:transparent;stroke-width:16;stroke-linecap:round;cursor:pointer}
.bd .sisi.on{stroke:var(--ikat);stroke-width:7}
.bd .sisi.hint{animation:denyut 1s infinite}
.bd .sdt{fill:var(--card);stroke:var(--ink);stroke-width:3;cursor:pointer}
.bd .sdt.on{fill:var(--lidi);animation:pop .4s}
.sifat{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:2.4em}
.sifat span{background:var(--soft);border:2px solid var(--lidi);border-radius:99px;padding:2px 12px;font-family:var(--display);font-weight:800;font-size:1rem;animation:pop .4s}
.cacah{font-family:var(--display);font-weight:800;font-size:1.1rem;text-align:center;color:var(--muted);min-height:1.5em}
/* stasiun 2: keluarga segi empat */
.ubin{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ubin .u{border:2px solid var(--line);border-radius:14px;background:var(--card);padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;transition:opacity .3s,transform .3s,border-color .3s}
.ubin .u svg{width:64px;height:64px}
.ubin .u span{font-family:var(--display);font-weight:800;font-size:.85rem;text-align:center;line-height:1.1}
.ubin .u.mati{opacity:.18;transform:scale(.9)}
.ubin .u.nyala{border-color:var(--ok);background:var(--soft)}
.ciri{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ciri button{font:inherit;font-family:var(--display);font-weight:800;font-size:1rem;line-height:1.2;min-height:52px;border-radius:14px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:6px;touch-action:manipulation}
.ciri button.on{border-color:var(--ikat);background:var(--soft)}
/* stasiun 3: unsur bangun ruang */
.sol{display:flex;justify-content:center}
.sol svg{width:100%;max-width:300px;height:auto}
.sol .f{fill:transparent;stroke:none}
.sol .f.nyala{fill:rgba(224,169,59,.55);animation:pop .3s;transform-box:fill-box;transform-origin:center}
.sol .e{stroke:var(--ink);stroke-width:2.5;stroke-linecap:round}
.sol .e.tersembunyi{stroke-dasharray:5 4;opacity:.6}
.sol .e.nyala{stroke:var(--ikat);stroke-width:5;opacity:1}
.sol .v{fill:var(--card);stroke:var(--ink);stroke-width:2}
.sol .v.nyala{fill:var(--ikat);r:7;animation:pop .3s;transform-box:fill-box;transform-origin:center}
.unsur{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.unsur button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.05rem;line-height:1.2;min-height:62px;border-radius:14px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:6px;touch-action:manipulation;display:flex;flex-direction:column;align-items:center;justify-content:center}
.unsur button b{font-size:1.6rem;color:var(--ikat);min-height:1.2em}
.unsur button.sudah{border-color:var(--ok);background:var(--soft)}
.unsur button.hint{animation:denyut 1s infinite}
/* stasiun 4: jaring-jaring dan lipatan 3D */
.kubwrap{perspective:700px;height:280px;display:flex;align-items:center;justify-content:center;padding-top:44px}
.sc{position:relative;width:56px;height:56px;transform-style:preserve-3d;transform:rotateX(calc(var(--f,0) * -30deg)) rotateY(calc(var(--f,0) * -32deg))}
.muka{position:absolute;width:56px;height:56px;border:2px solid var(--ink);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:800;font-size:1.3rem;color:#fff;transform-style:preserve-3d;backface-visibility:visible}
.muka.alas{left:0;top:0;background:rgba(74,123,208,.92)}
.muka.kiri{left:-56px;top:0;transform-origin:right center;transform:rotateY(calc(var(--f,0) * 90deg));background:rgba(224,169,59,.92)}
.muka.kanan{left:56px;top:0;transform-origin:left center;transform:rotateY(calc(var(--f,0) * -90deg));background:rgba(46,154,99,.92)}
.muka.depan{left:0;top:56px;transform-origin:center top;transform:rotateX(calc(var(--f,0) * 90deg));background:rgba(217,79,61,.92)}
.muka.belakang{left:0;top:-56px;transform-origin:center bottom;transform:rotateX(calc(var(--f,0) * -90deg));background:rgba(199,91,160,.92)}
.muka.tutup{left:0;top:-56px;transform-origin:center bottom;transform:rotateX(calc(var(--t,0) * -90deg));background:rgba(107,104,120,.92)}
.geser{display:flex;flex-direction:column;gap:2px}
input[type=range]{width:100%;accent-color:var(--ikat);height:40px}
/* stasiun 5 dan bonus */
.besarE{font-size:4.5rem;line-height:1;text-align:center}
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
      <h1>Detektif Bentuk</h1>
      <div class="panel" style="max-width:340px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo selidiki ciri-ciri bentuk di sekitarmu!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: putar dan kenali -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Ketuk setiap sisi dan setiap sudut.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="bd" id="s1bd"></div></div>
    <div class="cacah" id="s1cacah"></div>
    <div class="sifat" id="s1sifat"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: keluarga segi empat -->
  <section class="screen" id="s2">
    <p class="say">Nyalakan ciri. Lihat bangun mana yang tetap menyala.</p>
    <div class="dots" id="s2dots"></div>
    <div class="tanya" id="s2tugas"></div>
    <div class="panel"><div class="ubin" id="s2ubin"></div></div>
    <div class="ciri" id="s2ciri"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: unsur bangun ruang -->
  <section class="screen" id="s3">
    <p class="say">Hitung sisi, rusuk, dan titik sudutnya.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="sol" id="s3sol"></div></div>
    <div class="unsur" id="s3unsur"></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: jaring-jaring -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Geser untuk melipat jaring-jaring ini.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel" id="s4lipat"><div class="kubwrap"><div class="sc" id="s4sc"></div></div><div class="geser"><span class="sub">Geser untuk melipat</span><input type="range" id="s4geser" min="0" max="100" value="0" aria-label="Lipat"></div></div>
    <div class="panel" id="s4jaring" style="display:none"><div id="s4gambar" style="display:flex;justify-content:center"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5: tampak -->
  <section class="screen" id="s5">
    <p class="say">Dilihat dari atas dan dari samping, benda apa ini?</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div id="s5gambar" style="display:flex;justify-content:center"></div></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: benda di sekitarmu</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: benda ini berbentuk bangun ruang apa?</p>
    <div class="dots" id="bDots"></div>
    <div class="panel"><div class="besarE" id="bEmoji"></div><div id="bGambar" style="display:flex;justify-content:center;min-height:104px"></div></div>
    <div class="aksi pil2" id="bAksi"></div>
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
function pilihan(wadah,opsi,benar,fnBenar,kolom){
  clear(wadah);wadah.className='aksi'+(kolom?' pil'+kolom:'');
  shuffle(opsi).forEach(function(o){
    var b=tombol(wadah,o,function(){
      if(b.disabled)return;
      if(o===benar){b.classList.add('right');fnBenar()}
      else{b.classList.add('wrong');b.disabled=true}
    });
  });
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
  if(id==='intro')setKata('Ayo selidiki ciri-ciri bentuk di sekitarmu!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo selidiki ciri-ciri bentuk di sekitarmu!');

/* ---- stasiun 1: putar dan kenali bangun datar ---- */
var BD={
  segitiga:{nama:'segitiga',p:[[60,14],[108,100],[12,100]]},
  jajargenjang:{nama:'jajar genjang',p:[[30,34],[110,34],[90,92],[10,92]]},
  belahketupat:{nama:'belah ketupat',p:[[60,2],[102,60],[60,118],[18,60]]},
  trapesium:{nama:'trapesium',p:[[40,32],[82,32],[112,92],[8,92]]}
};
var R1=[
  {k:'segitiga',opsi:['segitiga','trapesium','jajar genjang']},
  {k:'jajargenjang',opsi:['jajar genjang','belah ketupat','persegi panjang']},
  {k:'belahketupat',opsi:['belah ketupat','jajar genjang','persegi']},
  {k:'trapesium',opsi:['trapesium','jajar genjang','segitiga']}
];
function sifatBD(p){
  var n=p.length,L=[],i,j;
  for(i=0;i<n;i++){var a=p[i],b=p[(i+1)%n];L.push(Math.sqrt(Math.pow(b[0]-a[0],2)+Math.pow(b[1]-a[1],2)))}
  var siku=0;
  for(i=0;i<n;i++){var a2=p[(i+n-1)%n],b2=p[i],c2=p[(i+1)%n];if(Math.abs((a2[0]-b2[0])*(c2[0]-b2[0])+(a2[1]-b2[1])*(c2[1]-b2[1]))<1)siku++}
  var sej=0;
  for(i=0;i<n;i++)for(j=i+1;j<n;j++){
    var v1=[p[(i+1)%n][0]-p[i][0],p[(i+1)%n][1]-p[i][1]],v2=[p[(j+1)%n][0]-p[j][0],p[(j+1)%n][1]-p[j][1]];
    if(Math.abs(v1[0]*v2[1]-v1[1]*v2[0])<1)sej++;
  }
  var sama=true;for(i=1;i<n;i++)if(Math.abs(L[i]-L[0])>1.5)sama=false;
  return {sisi:n,siku:siku,sejajar:sej,sama:sama};
}
var r1=0,fase1=0,sisiOn=[],sudutOn=[],putar1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1],bd=BD[d.k],p=bd.p,n=p.length;
  fase1=0;sisiOn=[];sudutOn=[];putar1=0;titik('s1dots',R1.length,r1);
  var w=$('s1bd');clear(w);
  var svg=sg('svg',{viewBox:'0 0 120 120','aria-label':'bangun datar'});
  var g=sg('g',{id:'s1g'},svg);g.style.transformOrigin='60px 60px';
  garisan(sg('polygon',{points:p.map(function(x){return x.join(',')}).join(' '),fill:PL.kuning,'fill-opacity':.55},g),3);
  p.forEach(function(a,i){
    var b=p[(i+1)%n];
    var l=sg('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],'class':'sisi'+(r1===0&&i===0?' hint':'')},g);
    l.setAttribute('aria-label','sisi '+(i+1));l.onclick=function(){ketukSisi(i,l)};
  });
  p.forEach(function(a,i){
    var c=sg('circle',{cx:a[0],cy:a[1],r:6,'class':'sdt'},g);c.setAttribute('aria-label','sudut '+(i+1));c.onclick=function(){ketukSudut(i,c)};
  });
  w.appendChild(svg);
  clear($('s1sifat'));clear($('s1aksi'));$('s1tanya').textContent='';$('s1next').disabled=true;
  hitung1();
  msg('s1msg','','Ketuk tiap sisi (garis) dan tiap sudut (lingkaran).');setKata('Ketuk setiap sisi dan setiap sudut.');
}
function hitung1(){
  var n=BD[R1[r1].k].p.length;
  $('s1cacah').textContent='Sisi: '+sisiOn.length+' dari '+n+'   Sudut: '+sudutOn.length+' dari '+n;
}
function ketukSisi(i,l){if(fase1>0||sisiOn.indexOf(i)>=0)return;sisiOn.push(i);l.setAttribute('class','sisi on');hitung1();cek1()}
function ketukSudut(i,c){if(fase1>0||sudutOn.indexOf(i)>=0)return;sudutOn.push(i);c.setAttribute('class','sdt on');hitung1();cek1()}
function cek1(){
  var bd=BD[R1[r1].k],n=bd.p.length;
  if(sisiOn.length<n||sudutOn.length<n)return;
  fase1=1;var s=sifatBD(bd.p),w=$('s1sifat');clear(w);
  var daftar=[s.sisi+' sisi',s.sisi+' sudut',s.siku?s.siku+' sudut siku-siku':'tanpa sudut siku-siku',s.sejajar?s.sejajar+' pasang sisi sejajar':'tanpa sisi sejajar'];
  if(n===4)daftar.push(s.sama?'4 sisi sama panjang':'sisinya tidak sama panjang');
  daftar.forEach(function(t,i){later(function(){w.appendChild(el('span',null,t))},i*220)});
  var t='Semua sudah dihitung! Sekarang putar bangunnya.';msg('s1msg','good',t);setKata(t);
  later(function(){var a=$('s1aksi');clear(a);a.className='aksi';tombol(a,'Putar bangun',function(){putarBangun()},'utama hint')},daftar.length*220+200);
}
function putarBangun(){
  if(fase1!==1)return;fase1=2;clear($('s1aksi'));
  var g=$('s1g');g.style.transition='transform .9s ease-in-out';g.style.transform='rotate(120deg)';
  later(function(){
    var n=BD[R1[r1].k].p.length,t='Sudah diputar, tetap '+n+' sisi dan '+n+' sudut. Bentuknya tidak berubah!';
    msg('s1msg','good',t);setKata(t);fase1=3;tanya1();
  },1000);
}
function tanya1(){
  var d=R1[r1],bd=BD[d.k];
  $('s1tanya').textContent='Bangun apa ini?';setKata('Bangun apa ini?');
  pilihan($('s1aksi'),d.opsi,bd.nama,function(){
    var t='Betul! '+bd.nama+'. ';
    if(d.k==='jajargenjang')t+='Dua pasang sisi sejajar, tetapi sisinya tidak sama panjang dan sudutnya tidak siku-siku.';
    else if(d.k==='belahketupat')t+='Keempat sisinya sama panjang dan dua pasang sisinya sejajar, tetapi sudutnya tidak siku-siku.';
    else if(d.k==='trapesium')t+='Tepat satu pasang sisi sejajar.';
    else t+='3 sisi dan 3 sudut.';
    msg('s1msg','good',t);setKata(t);clear($('s1aksi'));$('s1tanya').textContent='';$('s1next').disabled=false;
  },3);
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: keluarga segi empat ---- */
var KELUARGA=[
  {id:'persegi',b:'persegi',n:'persegi',A:1,B:1,C:1,D:0,w:'merah'},
  {id:'persegipanjang',b:'persegi panjang',n:'persegi panjang',A:0,B:1,C:1,D:0,w:'hijau'},
  {id:'jajargenjang',b:'jajargenjang',n:'jajar genjang',A:0,B:0,C:1,D:0,w:'biru'},
  {id:'belahketupat',b:'belahketupat',n:'belah ketupat',A:1,B:0,C:1,D:0,w:'ungu'},
  {id:'trapesium',b:'trapesium',n:'trapesium',A:0,B:0,C:0,D:1,w:'kuning'}
];
var CIRI=[['A','4 sisi sama panjang'],['B','4 sudut siku-siku'],['C','2 pasang sisi sejajar'],['D','tepat 1 pasang sisi sejajar']];
var T2=[
  {tugas:'Nyalakan ciri sampai tinggal PERSEGI saja.',target:['persegi'],pesan:'Persegi: 4 sisi sama panjang DAN 4 sudut siku-siku.'},
  {tugas:'Nyalakan satu ciri sampai tinggal persegi DAN persegi panjang.',target:['persegi','persegipanjang'],pesan:'Persegi memenuhi semua ciri persegi panjang, jadi persegi termasuk persegi panjang yang khusus.'},
  {tugas:'Nyalakan ciri sampai tinggal TRAPESIUM saja.',target:['trapesium'],pesan:'Trapesium: tepat satu pasang sisi sejajar.'},
  {tugas:'Nyalakan dua ciri sampai tinggal persegi DAN belah ketupat.',target:['persegi','belahketupat'],pesan:'Belah ketupat: 4 sisi sama panjang dan sejajar berpasangan, sudutnya tidak harus siku-siku. Persegi adalah belah ketupat yang sudutnya siku-siku.'},
  {tugas:'Nyalakan satu ciri sampai tinggal 4 bangun dengan dua pasang sisi sejajar.',target:['persegi','persegipanjang','jajargenjang','belahketupat'],pesan:'Keempatnya punya dua pasang sisi sejajar. Itulah keluarga jajar genjang.'}
];
var r2=0,pilih2={},selesai2=false;
function mulaiS2(){r2=0;ronde2()}
function cocok2(f){var ok=true;Object.keys(pilih2).forEach(function(k){if(pilih2[k]&&!f[k])ok=false});return ok}
function ronde2(){
  var d=T2[r2];pilih2={};selesai2=false;titik('s2dots',T2.length,r2);
  $('s2tugas').textContent=d.tugas;setKata(d.tugas);
  var u=$('s2ubin');clear(u);
  KELUARGA.forEach(function(f){
    var k=el('div','u'),s=bangunSvg(f.b,f.w);k.id='u-'+f.id;k.appendChild(s);k.appendChild(el('span',null,f.n));u.appendChild(k);
  });
  var c=$('s2ciri');clear(c);
  CIRI.forEach(function(x){
    var b=el('button',null,x[1]);
    b.onclick=function(){if(selesai2)return;pilih2[x[0]]=!pilih2[x[0]];b.classList.toggle('on',!!pilih2[x[0]]);segarkan2()};
    c.appendChild(b);
  });
  $('s2next').disabled=true;segarkan2();msg('s2msg','','Ketuk ciri di bawah.');
}
function segarkan2(){
  var d=T2[r2],ada=[],ps=Object.keys(pilih2).some(function(k){return pilih2[k]});
  KELUARGA.forEach(function(f){
    var on=cocok2(f),k=$('u-'+f.id);
    k.classList.toggle('mati',!on);k.classList.toggle('nyala',on&&ps);
    if(on)ada.push(f.id);
  });
  if(!ps)return;
  var sama=ada.length===d.target.length&&d.target.every(function(x){return ada.indexOf(x)>=0});
  if(sama){selesai2=true;msg('s2msg','good','Betul! '+d.pesan);setKata(d.pesan);$('s2next').disabled=false}
  else msg('s2msg','','Yang menyala: '+(ada.length?ada.map(function(id){return KELUARGA.filter(function(f){return f.id===id})[0].n}).join(', '):'tidak ada')+'. Coba ciri lain.');
}
$('s2next').onclick=function(){if(r2<T2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: sisi, rusuk, titik sudut ---- */
var SOL={
  kubus:{nama:'kubus',v:[[30,112],[90,112],[90,52],[30,52],[55,92],[115,92],[115,32],[55,32]],
    e:[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],h:[4],
    f:[[0,1,2,3],[4,5,6,7],[0,3,7,4],[1,5,6,2],[3,2,6,7],[0,1,5,4]],opsi:['kubus','balok','limas segiempat']},
  limas:{nama:'limas segiempat',v:[[30,104],[100,104],[125,82],[55,82],[78,18]],
    e:[[0,1],[1,2],[2,3],[3,0],[4,0],[4,1],[4,2],[4,3]],h:[3],
    f:[[0,1,2,3],[4,0,1],[4,1,2],[4,2,3],[4,3,0]],opsi:['limas segiempat','prisma segitiga','kerucut']},
  prisma:{nama:'prisma segitiga',v:[[30,104],[90,104],[60,52],[60,78],[120,78],[90,26]],
    e:[[0,1],[1,2],[2,0],[3,4],[4,5],[5,3],[0,3],[1,4],[2,5]],h:[3],
    f:[[0,1,2],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]],opsi:['prisma segitiga','limas segiempat','balok']},
  balok:{nama:'balok',v:[[18,112],[102,112],[102,64],[18,64],[46,90],[130,90],[130,42],[46,42]],
    e:[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],h:[4],
    f:[[0,1,2,3],[4,5,6,7],[0,3,7,4],[1,5,6,2],[3,2,6,7],[0,1,5,4]],opsi:['balok','kubus','tabung']}
};
var R3=['kubus','limas','prisma','balok'],r3=0,lihat3={},sedang3=false;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var s=SOL[R3[r3]];lihat3={};sedang3=false;titik('s3dots',R3.length,r3);
  var w=$('s3sol');clear(w);
  var svg=sg('svg',{viewBox:'0 0 150 130','aria-label':s.nama});
  s.f.forEach(function(f){sg('polygon',{points:f.map(function(i){return s.v[i].join(',')}).join(' '),'class':'f'},svg)});
  s.e.forEach(function(e){
    var tersembunyi=s.h.indexOf(e[0])>=0||s.h.indexOf(e[1])>=0;
    sg('line',{x1:s.v[e[0]][0],y1:s.v[e[0]][1],x2:s.v[e[1]][0],y2:s.v[e[1]][1],'class':'e'+(tersembunyi?' tersembunyi':'')},svg);
  });
  s.v.forEach(function(p){sg('circle',{cx:p[0],cy:p[1],r:4.5,'class':'v'},svg)});
  w.appendChild(svg);
  var u=$('s3unsur');clear(u);
  [['f','Sisi'],['e','Rusuk'],['v','Titik sudut']].forEach(function(x,i){
    var b=el('button',r3===0&&i===0?'hint':null),n=el('b',null,'?');b.appendChild(n);b.appendChild(el('span',null,x[1]));
    b.onclick=function(){nyalakan(x[0],b,n)};u.appendChild(b);
  });
  clear($('s3aksi'));$('s3tanya').textContent='';$('s3next').disabled=true;
  msg('s3msg','','Ketuk Sisi, Rusuk, dan Titik sudut. Lihat yang menyala satu per satu.');setKata('Hitung sisi, rusuk, dan titik sudutnya.');
}
function nyalakan(jenis,b,n){
  if(sedang3||lihat3[jenis])return;
  sedang3=true;b.classList.remove('hint');
  var s=SOL[R3[r3]],svg=$('s3sol').firstChild;
  var daftar=svg.querySelectorAll('.'+jenis),k=daftar.length,i;
  for(i=0;i<k;i++)daftar[i].classList.remove('nyala');
  for(i=0;i<k;i++){(function(i){later(function(){daftar[i].classList.add('nyala');n.textContent=String(i+1)},i*230)})(i)}
  later(function(){
    lihat3[jenis]=true;sedang3=false;b.classList.add('sudah');
    var nm=jenis==='f'?'sisi':jenis==='e'?'rusuk':'titik sudut';
    var t=k+' '+nm+(jenis==='f'?'. Ada sisi yang tersembunyi di belakang.':jenis==='e'?'. Garis putus-putus juga rusuk.':'.');
    msg('s3msg','good',t);setKata(k+' '+nm);
    if(lihat3.f&&lihat3.e&&lihat3.v)later(tanya3,700);
  },k*230+200);
}
function tanya3(){
  var s=SOL[R3[r3]];
  $('s3tanya').textContent='Bangun ruang apa ini?';setKata('Bangun ruang apa ini?');
  pilihan($('s3aksi'),s.opsi,s.nama,function(){
    var t='Betul! '+s.nama+': '+s.f.length+' sisi, '+s.e.length+' rusuk, '+s.v.length+' titik sudut.';
    msg('s3msg','good',t);setKata(t);clear($('s3aksi'));$('s3tanya').textContent='';$('s3next').disabled=false;
  },3);
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: jaring-jaring (lipatan kubus 3D, lalu cocokkan) ---- */
var R4=[
  {jenis:'tabung',nama:'tabung',opsi:['tabung','kubus','kerucut'],pesan:'2 lingkaran (alas dan tutup) dan 1 persegi panjang (selimut) membentuk tabung.'},
  {jenis:'limas',nama:'limas segiempat',opsi:['limas segiempat','kubus','prisma segitiga'],pesan:'1 persegi (alas) dan 4 segitiga membentuk limas segiempat.'},
  {jenis:'prisma',nama:'prisma segitiga',opsi:['prisma segitiga','limas segiempat','balok'],pesan:'2 segitiga (alas dan tutup) dan 3 persegi panjang membentuk prisma segitiga.'}
];
var r4=-1,lipat4=false;
function bangunKubus3d(){
  var sc=$('s4sc');clear(sc);
  var alas=el('div','muka alas','1');
  alas.appendChild(el('div','muka kiri','2'));alas.appendChild(el('div','muka kanan','3'));alas.appendChild(el('div','muka depan','4'));
  var bl=el('div','muka belakang','5');bl.appendChild(el('div','muka tutup','6'));alas.appendChild(bl);
  sc.appendChild(alas);sc.style.setProperty('--f','0');sc.style.setProperty('--t','0');
}
function aturLipat(v){
  var f=Math.min(v/60,1),t=Math.max((v-60)/40,0),sc=$('s4sc');
  sc.style.setProperty('--f',String(f));sc.style.setProperty('--t',String(t));
}
function mulaiS4(){
  r4=-1;lipat4=false;bangunKubus3d();
  $('s4lipat').style.display='';$('s4jaring').style.display='none';
  $('s4geser').value='0';aturLipat(0);titik('s4dots',R4.length+1,0);
  $('s4say').textContent='Geser untuk melipat jaring-jaring ini.';
  clear($('s4aksi'));$('s4tanya').textContent='';$('s4next').disabled=true;
  msg('s4msg','','Jaring-jaring kubus: 6 persegi. Geser sampai terlipat penuh.');setKata('Geser untuk melipat jaring-jaring ini.');
}
$('s4geser').oninput=function(){
  var v=+$('s4geser').value;aturLipat(v);
  if(!lipat4&&v>=98&&r4===-1){
    lipat4=true;var t='Terlipat menjadi kubus! 6 persegi sama besar menjadi 6 sisi kubus.';
    msg('s4msg','good',t);setKata(t);$('s4next').disabled=false;
  }
};
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length+1,r4+1);
  $('s4lipat').style.display='none';$('s4jaring').style.display='';
  $('s4say').textContent='Jaring-jaring ini dilipat jadi apa?';
  var g=$('s4gambar');clear(g);g.appendChild(GBR.jaring({jenis:d.jenis}));
  $('s4next').disabled=true;$('s4tanya').textContent='Jika dilipat, jadi bangun ruang apa?';
  msg('s4msg','','Hitung bentuk-bentuk datarnya.');setKata('Jaring-jaring ini dilipat jadi apa?');
  pilihan($('s4aksi'),d.opsi,d.nama,function(){
    msg('s4msg','good','Betul! '+d.pesan);setKata(d.pesan);clear($('s4aksi'));$('s4tanya').textContent='';$('s4next').disabled=false;
  },3);
}
$('s4next').onclick=function(){
  if(r4===-1){r4=0;ronde4()}
  else if(r4<R4.length-1){r4++;ronde4()}
  else show('s5');
};

/* ---- stasiun 5: tampak dari atas dan dari samping ---- */
var R5=[
  {atas:'lingkaran',samping:'persegi panjang',a:'tabung',b:'tabung',o:['tabung','kerucut','kubus']},
  {atas:'persegi',samping:'persegi panjang',a:'balok',b:'balok',o:['balok','limas segiempat','tabung']},
  {atas:'lingkaran',samping:'segitiga',a:'kerucut',b:'kerucut',o:['kerucut','tabung','bola']},
  {atas:'persegi',samping:'segitiga',a:'limas segiempat',b:'limas',o:['limas segiempat','kerucut','kubus']}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  var g=$('s5gambar');clear(g);g.appendChild(GBR.pandang({atas:d.atas,samping:d.samping}));
  $('s5next').disabled=true;msg('s5msg','','Dari atas terlihat '+d.atas+'. Dari samping terlihat '+d.samping+'.');setKata('Dilihat dari atas dan dari samping, benda apa ini?');
  pilihan($('s5aksi'),d.o,d.a,function(){
    var t='Betul! '+d.a+'. Dari atas '+d.atas+', dari samping '+d.samping+'.';
    msg('s5msg','good',t);setKata(t);clear($('s5aksi'));
    var c=el('div');c.style.cssText='display:flex;justify-content:center';var s=bangunSvg(d.b,'kuning');s.style.width='110px';s.style.height='110px';c.appendChild(s);
    $('s5gambar').appendChild(c);$('s5next').disabled=false;
  },3);
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu detektif bentuk yang jeli.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-13'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){$('introGambar').appendChild(GBR.bangun({daftar:[{b:'persegi',w:'merah'},{b:'trapesium',w:'kuning'},{b:'kubus',w:'biru'},{b:'kerucut',w:'ungu'}]}))})();

/* ---- bonus: benda sehari-hari dan bangun ruangnya ---- */
var BN=[['\u{1F3B2}','kubus','kubus'],['⚽','bola','bola'],['\u{1F96B}','tabung','tabung'],['\u{1F4E6}','balok','balok'],['\u{1F389}','kerucut','kerucut']],bi=0,urutB=[];
var SEMUA_B=['kubus','bola','tabung','balok','kerucut'];
function mulaiBonus(){urutB=shuffle(BN);bi=0;bonusSoal()}
function bonusSoal(){
  var d=urutB[bi];titik('bDots',urutB.length,bi);
  $('bEmoji').textContent=d[0];clear($('bGambar'));
  msg('bmsg','','Benda ini berbentuk apa?');setKata('Benda ini berbentuk bangun ruang apa?');
  var lain=shuffle(SEMUA_B.filter(function(x){return x!==d[1]})).slice(0,3);
  pilihan($('bAksi'),[d[1]].concat(lain),d[1],function(){
    var s=bangunSvg(d[2],'biru');s.style.width='104px';s.style.height='104px';$('bGambar').appendChild(s);
    var t='Betul! '+d[1]+'.';msg('bmsg','good',t);setKata(t);
    later(function(){if(bi<urutB.length-1){bi++;bonusSoal()}else{msg('bmsg','good','Hebat! Semua benda sudah dikenali.')}},1100);
  },2);
}
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC13 = rakit(DASAR, { kode: 'AC-13', data: DATA_AC13 })
