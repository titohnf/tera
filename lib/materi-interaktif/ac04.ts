import { rakit } from './bersama'
import { DATA_AC04 } from './latihan/ac04'

/**
 * Materi interaktif AC-04 "Ikuti Pola" (Pola bukan bilangan: gambar, warna,
 * suara). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-04. Disimpan
 * sebagai string supaya ikut terbundel di build tanpa membaca berkas saat
 * runtime.
 *
 * Rancangan sama dengan AC-01 sampai AC-03 (anak kelas 1-2, hampir tidak
 * membaca): SATU stasiun per layar, instruksi pendek, sentuh langsung, suara
 * bacaan sebagai tambahan (speechSynthesis, hanya tampil bila ada suara bahasa
 * Indonesia), dan akhir berupa bintang, bukan skor ujian.
 *
 * Stasiun: 1) lanjutkan pola gambar/warna (AB, AABAAB, ABC), 2) dengar lalu
 * tiru pola bunyi "tuk" dan "tak" (WebAudio; bila perangkat tak bisa bersuara,
 * tiap bunyi tetap ditandai dengan kilatan bantalan), 3) cari yang menyimpang
 * dari pola, 4) tantangan 4 soal. Bonus: buat pola sendiri.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-04 di Misi.
 *
 * Stasiun tambahan (sx): cari satuan pola terkecil, lalu isi bagian yang hilang di tengah.
 *
 * LATIHAN SESUDAH STASIUN PRAKTIK. Tantangan lama diganti tiga stasiun dari mesin
 * bersama (`bersama.ts`): Benar atau salah, Siapa yang benar, dan Tantangan Misi.
 * Bahannya disusun dari konsep yang diuji bank soal topik ini (`latihan/ac04.ts`),
 * supaya anak terbiasa dengan bentuk soal Misi yang sebenarnya.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ikuti Pola</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#fbf6ea; --card:#ffffff; --ink:#2b2a33; --muted:#6b6878;
  --ikat:#d94f3d; --lidi:#e0a93b; --lidi-dark:#b97f12; --ok:#2e9a63; --bad:#d23b4e; --line:#eadfc4; --soft:#fff3d0;
  --display:'Baloo 2','Trebuchet MS',system-ui,sans-serif; --body:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;
}
@media (prefers-color-scheme: dark){
  :root{--bg:#1f1c17;--card:#2a2620;--ink:#f6efe0;--muted:#b9b09b;--line:#4a4231;--soft:#3a3220;--ok:#5cc990;--bad:#ff7a8a;--lidi:#e7b34a;--ikat:#ef6b59}
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-weight:600;font-size:20px;line-height:1.4;-webkit-tap-highlight-color:transparent}
.app{max-width:560px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;padding:12px 16px 20px;gap:12px}
h1,h2{font-family:var(--display);margin:0;line-height:1.1;text-wrap:balance}
h1{font-size:clamp(2.6rem,12vw,3.6rem);font-weight:800}
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
button.big{font:inherit;font-family:var(--display);font-weight:800;font-size:1.35rem;min-height:60px;border-radius:18px;border:2px solid var(--ink);background:var(--card);color:var(--ink);box-shadow:0 4px 0 var(--ink);cursor:pointer;padding:10px 18px}
button.big:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink)}
button.big.main{background:var(--ikat);color:#fff}
button.big.soft{box-shadow:none;border-color:var(--line);font-size:1.1rem;min-height:52px}
button.big:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
button.big.hint{animation:denyut 1s infinite}
@keyframes denyut{50%{box-shadow:0 0 0 5px rgba(217,79,61,.45)}}
@keyframes goyang{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.row{display:flex;gap:10px;flex-wrap:wrap}
.center{text-align:center}
svg{color:var(--ink);display:block}
/* barisan pola */
.seq{display:flex;gap:6px;justify-content:center}
.cell{flex:1 1 0;min-width:0;max-width:48px;aspect-ratio:1;border:2px solid transparent;border-radius:12px;background:transparent;display:flex;align-items:center;justify-content:center;padding:3px}
.cell svg{width:100%;height:100%}
.cell.kosong{border:2px dashed var(--ikat);background:var(--soft)}
.cell.isi{animation:pop .3s}
button.cell{cursor:pointer;touch-action:manipulation}
button.cell.right{border-color:var(--ok);background:var(--soft)}
button.cell.bad{border-color:var(--bad);animation:goyang .4s}
@keyframes pop{0%{transform:scale(.5)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
/* pilihan gambar */
.pal{display:flex;gap:10px;justify-content:center}
.pil{width:72px;height:72px;border:2px solid var(--line);background:var(--card);border-radius:18px;padding:8px;cursor:pointer;touch-action:manipulation}
.pil svg{width:100%;height:100%}
.pil.hint{animation:denyut 1s infinite}
.pil.bad{border-color:var(--bad);animation:goyang .4s}
/* bunyi */
.pads{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pad{font:inherit;font-family:var(--display);font-weight:800;font-size:1.7rem;min-height:96px;border-radius:22px;border:3px solid var(--ink);color:#fff;cursor:pointer;box-shadow:0 5px 0 var(--ink);touch-action:manipulation}
.pad.p0{background:#4a7bd0}.pad.p1{background:#d94f3d}
.pad:active{transform:translateY(4px);box-shadow:0 1px 0 var(--ink)}
.pad.nyala{filter:brightness(1.35);transform:scale(1.05)}
.prog{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;min-height:30px}
.prog i{width:26px;height:26px;border-radius:50%;border:3px dashed var(--line)}
.prog i.p0{background:#4a7bd0;border:3px solid #4a7bd0}
.prog i.p1{background:#d94f3d;border:3px solid #d94f3d}
/* tantangan */
.q{font-family:var(--display);font-size:1.5rem;font-weight:800}
.opts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.opt{font:inherit;font-family:var(--display);font-weight:800;font-size:1.5rem;min-height:84px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:8px}
.opt svg{width:56px;height:56px;margin:0 auto}
.opt.right{background:var(--ok);border-color:var(--ok);color:#fff}
.opt.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
.opt.text{grid-column:auto}
.vis{display:flex;flex-direction:column;gap:6px;align-items:center}
.katabunyi{font-family:var(--display);font-size:1.6rem;font-weight:800;text-align:center}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
/* bonus */
.buat{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:360px;margin:0 auto;width:100%}
.slot{aspect-ratio:1;border-radius:50%;border:3px dashed var(--line);background:transparent;cursor:pointer;padding:0;touch-action:manipulation}
.slot.w1{background:#d94f3d;border:3px solid var(--ink)}
.slot.w2{background:#4a7bd0;border:3px solid var(--ink)}
.slot.w3{background:#e0a93b;border:3px solid var(--ink)}
.slot.w4{background:#2e9a63;border:3px solid var(--ink)}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

/* stasiun tambahan: satuan pola dan bagian hilang di tengah */
.sp-grid{display:grid;gap:6px;justify-content:center}
.sp-c{width:44px;height:44px;border-radius:12px;border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:1.7rem;line-height:1;background:var(--card)}
.sp-c.q{border:2px dashed var(--ikat);background:var(--soft);font-family:var(--display);font-weight:800}
.sp-c.isi{animation:pop .3s}
.sp-c.kol{background:var(--soft);border-color:var(--lidi)}
.sp-pil{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.sp-pil button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.2rem;min-height:52px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:6px 14px;touch-action:manipulation}
.sp-pil button.sim{font-size:2rem;min-width:60px;padding:4px 10px}
.sp-pil button.bad{animation:goyang .4s;border-color:var(--bad)}
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
      <h1>Ikuti Pola</h1>
      <div class="seq" id="introPola" style="max-width:340px;margin:0 auto;width:100%"></div>
      <p class="say">Ayo cari apa yang datang berikutnya!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: lanjutkan pola gambar -->
  <section class="screen" id="s1">
    <p class="say">Lanjutkan polanya.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel" style="display:flex;flex-direction:column;gap:16px">
      <div class="seq" id="s1seq"></div>
      <div class="pal" id="s1pal"></div>
    </div>
    <div class="msg" id="s1msg">Ketuk gambar yang cocok.</div>
    <div class="cta">
      <button class="big main" id="s1next" disabled>Lanjut</button>
      <button class="big soft" id="s1ulang">Mulai lagi</button>
    </div>
  </section>

  <!-- 2: pola bunyi -->
  <section class="screen" id="s2">
    <p class="say">Dengar, lalu tiru bunyinya.</p>
    <div class="dots" id="s2dots"></div>
    <button class="big" id="s2dengar">&#128066; Dengar</button>
    <div class="prog" id="s2prog"></div>
    <div class="pads">
      <button class="pad p0" id="s2p0">Tuk</button>
      <button class="pad p1" id="s2p1">Tak</button>
    </div>
    <div class="msg" id="s2msg">Ketuk Dengar.</div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: cari yang beda -->
  <section class="screen" id="s3">
    <p class="say">Satu gambar salah. Ketuk yang beda.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="seq" id="s3seq"></div></div>
    <div class="msg" id="s3msg">Lihat polanya dulu.</div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 3b: satuan pola dan bagian hilang di tengah -->
  <section class="screen" id="sx">
    <p class="say" id="sxsay"></p>
    <div class="dots" id="sxdots"></div>
    <div class="panel" style="display:flex;flex-direction:column;gap:14px">
      <div class="sp-grid" id="sxgrid"></div>
      <div class="sp-pil" id="sxpil"></div>
    </div>
    <div class="msg" id="sxmsg"></div>
    <div class="cta"><button class="big main" id="sxnext" disabled>Lanjut</button></div>
  </section>

  <!-- 4: tantangan -->
  <section class="screen" id="s4">
    <div class="sub" id="s4n"></div>
    <div class="vis" id="s4v"></div>
    <p class="q" id="s4q"></p>
    <div class="opts" id="s4o"></div>
    <div class="msg" id="s4fb" style="display:none"></div>
    <div class="cta"><button class="big main" id="s4next" style="display:none">Lanjut</button></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: buat polamu</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: buat polamu sendiri.</p>
    <div class="panel"><div class="buat" id="bb"></div></div>
    <div class="msg" id="bmsg">Ketuk bulatan untuk memberi warna.</div>
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

/* ---- gambar: tiap benda ditentukan oleh bentuk DAN warna ---- */
var NS='http://www.w3.org/2000/svg';
function sh(tag,attrs){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);return e}
var BANK=[
  {k:'lingkaran',c:'#d94f3d'},{k:'persegi',c:'#4a7bd0'},{k:'segitiga',c:'#e0a93b'},
  {k:'lingkaran',c:'#2e9a63'},{k:'persegi',c:'#c75ba0'}
];
function gambar(it){
  var s=sh('svg',{viewBox:'0 0 100 100','aria-hidden':'true'});
  var a={fill:it.c,stroke:'currentColor','stroke-width':4,'stroke-linejoin':'round'},b;
  if(it.k==='lingkaran')b=sh('circle',{cx:50,cy:50,r:38});
  else if(it.k==='persegi')b=sh('rect',{x:14,y:14,width:72,height:72,rx:4});
  else b=sh('polygon',{points:'50,10 92,86 8,86'});
  for(var k in a)b.setAttribute(k,a[k]);
  s.appendChild(b);return s;
}
function tiga(){return shuffle(BANK).slice(0,3)}
function ulangi(kode,len){var r=[];for(var i=0;i<len;i++)r.push(kode[i%kode.length]);return r}
var KODE=[[0,1],[0,0,1],[0,1,2]];
function sel(it,cls){var c=el('div','cell'+(cls?' '+cls:''));if(it)c.appendChild(gambar(it));return c}

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
var urut=['intro','s1','s2','s3','sx','s4','akhir'];
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
  if(id==='s3')mulaiS3();if(id==='sx')mulaiSx();
  if(id==='s4')mulaiS4();
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')mulaiBonus();
  if(id==='intro')setKata('Ayo cari apa yang datang berikutnya!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
(function(){var it=tiga(),w=$('introPola');[0,1,0,1,0].forEach(function(i){w.appendChild(sel(it[i]))});w.appendChild(sel(null,'kosong'))})();
setKata('Ayo cari apa yang datang berikutnya!');

function titik(id,n,aktif){var d=$(id);clear(d);for(var j=0;j<n;j++)d.appendChild(el('i',j<=aktif?'on':''))}

/* ---- stasiun 1: lanjutkan pola (4 terlihat, 2 kosong) ---- */
var r1=0,items1=[],seq1=[],isi1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var kode=KODE[r1];items1=tiga();seq1=ulangi(kode,6);isi1=4;
  titik('s1dots',KODE.length,r1);
  var row=$('s1seq');clear(row);
  for(var i=0;i<6;i++)row.appendChild(i<4?sel(items1[seq1[i]]):sel(null,'kosong'));
  var pal=$('s1pal');clear(pal);
  var pakai=[];seq1.forEach(function(x){if(pakai.indexOf(x)<0)pakai.push(x)});
  shuffle(pakai).forEach(function(x){
    var b=el('button','pil');b.setAttribute('aria-label','pilihan');b.appendChild(gambar(items1[x]));
    b.setAttribute('data-x',x);
    b.onclick=function(){pilih1(x,b)};
    pal.appendChild(b);
  });
  $('s1next').disabled=true;$('s1msg').className='msg';
  $('s1msg').textContent=r1===0?'Ketuk yang berdenyut.':'Ketuk gambar yang cocok.';
  petunjuk1();setKata('Lanjutkan polanya.');
}
function petunjuk1(){
  var ps=$('s1pal').children;
  for(var i=0;i<ps.length;i++){
    var on=r1===0&&isi1<6&&+ps[i].getAttribute('data-x')===seq1[isi1];
    ps[i].classList.toggle('hint',on);
  }
}
function pilih1(x,b){
  if(isi1>=6)return;
  if(x===seq1[isi1]){
    var cell=$('s1seq').children[isi1];
    cell.className='cell isi';cell.appendChild(gambar(items1[x]));
    isi1++;petunjuk1();
    if(isi1===6){
      $('s1msg').className='msg good';$('s1msg').textContent='Hebat! Polanya berulang.';
      $('s1next').disabled=false;setKata('Hebat! Polanya berulang.');
    }else{
      $('s1msg').className='msg good';$('s1msg').textContent='Betul! Satu lagi.';
    }
  }else{
    b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');
    $('s1msg').className='msg warn';$('s1msg').textContent='Bukan itu. Lihat polanya lagi.';
    setKata('Bukan itu. Lihat polanya lagi.');
  }
}
$('s1ulang').onclick=function(){ronde1()};
$('s1next').onclick=function(){if(r1<KODE.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: dengar lalu tiru bunyi ---- */
var ac=null;
function nada(i){
  try{
    if(!ac){var C=window.AudioContext||window.webkitAudioContext;if(C)ac=new C()}
    if(!ac)return;
    if(ac.state==='suspended')ac.resume();
    var o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;
    o.type='triangle';o.frequency.value=i?660:330;
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.4,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+0.4);
    o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+0.45);
  }catch(e){}
}
function kilat(i){
  var p=$('s2p'+i);p.classList.add('nyala');
  setTimeout(function(){p.classList.remove('nyala')},280);
}
var POLA2=[[0,1,0,1],[0,0,1,0,0,1],[1,0,0,1,0,0]],r2=0,pola2=[],masuk=0,memutar=false;
var NAMA=['tuk','tak'];
function mulaiS2(){POLA2=shuffle(POLA2);r2=0;ronde2()}
function gambarProg(){
  var p=$('s2prog');clear(p);
  for(var i=0;i<pola2.length;i++)p.appendChild(el('i',i<masuk?'p'+pola2[i]:''));
}
function ronde2(){
  pola2=POLA2[r2];masuk=0;memutar=false;
  titik('s2dots',POLA2.length,r2);
  gambarProg();
  $('s2next').disabled=true;
  $('s2dengar').classList.toggle('hint',r2===0);
  $('s2msg').className='msg';$('s2msg').textContent='Ketuk Dengar.';
  setKata('Dengar, lalu tiru bunyinya.');
}
$('s2dengar').onclick=function(){
  if(memutar)return;
  memutar=true;masuk=0;gambarProg();$('s2dengar').classList.remove('hint');
  $('s2msg').className='msg';$('s2msg').textContent='Dengarkan...';
  pola2.forEach(function(x,i){later(function(){nada(x);kilat(x)},i*650+200)});
  later(function(){
    memutar=false;$('s2msg').textContent='Giliranmu! Tiru bunyinya.';
    setKata('Giliranmu. Tiru bunyinya.');
  },pola2.length*650+300);
};
function tekan(x){
  if(memutar)return;
  nada(x);kilat(x);
  if(!pola2.length||masuk>=pola2.length)return;
  if(x===pola2[masuk]){
    masuk++;gambarProg();
    if(masuk===pola2.length){
      $('s2msg').className='msg good';$('s2msg').textContent='Hebat! Polamu sama.';
      $('s2next').disabled=false;setKata('Hebat! Polamu sama.');
    }
  }else{
    masuk=0;gambarProg();
    $('s2msg').className='msg warn';$('s2msg').textContent='Hampir! Dengar lagi, lalu coba lagi.';
    setKata('Hampir. Dengar lagi, lalu coba lagi.');
  }
}
$('s2p0').onclick=function(){tekan(0)};
$('s2p1').onclick=function(){tekan(1)};
$('s2next').onclick=function(){if(r2<POLA2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: cari yang menyimpang ---- */
var r3=0,bad3=0,selesai3=false;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var kode=KODE[r3],items=tiga(),seq=ulangi(kode,7);
  bad3=rnd(3,6);selesai3=false;
  var asli=seq[bad3],pilihanLain=[];
  kode.forEach(function(x){if(pilihanLain.indexOf(x)<0&&x!==asli)pilihanLain.push(x)});
  var pengganti=pilihanLain[rnd(0,pilihanLain.length-1)];
  seq[bad3]=pengganti;
  titik('s3dots',KODE.length,r3);
  var row=$('s3seq');clear(row);
  seq.forEach(function(x,i){
    var b=el('button','cell');b.setAttribute('aria-label','gambar');b.appendChild(gambar(items[x]));
    b.onclick=function(){
      if(selesai3)return;
      if(i===bad3){
        selesai3=true;b.classList.add('right');
        $('s3msg').className='msg good';$('s3msg').textContent='Betul! Yang ini beda.';
        $('s3next').disabled=false;setKata('Betul! Yang ini beda.');
      }else{
        b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');
        $('s3msg').className='msg warn';$('s3msg').textContent='Yang itu sudah cocok. Cari yang beda.';
        setKata('Yang itu sudah cocok. Cari yang beda.');
      }
    };
    row.appendChild(b);
  });
  $('s3next').disabled=true;$('s3msg').className='msg';$('s3msg').textContent='Lihat polanya dulu.';
  setKata('Satu gambar salah. Ketuk yang beda.');
}
$('s3next').onclick=function(){if(r3<KODE.length-1){r3++;ronde3()}else show('sx')};

/* ---- stasiun tambahan: cari satuan pola, lalu isi bagian yang hilang di tengah ---- */
var SIM=['\u{1F534}','\u{1F535}','\u{1F7E2}','\u{1F7E1}'];
var RP=[{kode:[0,1,2],len:9,hilang:4},{kode:[0,0,1],len:9,hilang:5},{kode:[0,1],len:8,hilang:3},{kode:[0,1,1,2],len:12,hilang:6}];
var rpi=0,sim=[],seqP=[],k0=0,fase=0;
function msgP(k,t){var m=$('sxmsg');m.className='msg'+(k?' '+k:'');m.textContent=t}
function mulaiSx(){rpi=0;rondeP()}
function rondeP(){
  var d=RP[rpi],w=$('sxdots');clear(w);for(var j=0;j<RP.length;j++)w.appendChild(el('i',j<=rpi?'on':''));
  sim=shuffle(SIM).slice(0,3);k0=d.kode.length;fase=1;
  seqP=[];for(var i=0;i<d.len;i++)seqP.push(d.kode[i%k0]);
  $('sxsay').textContent='Ada satu yang hilang. Cari satuan polanya dulu.';
  gambarP(0);
  var p=$('sxpil');clear(p);
  [2,3,4].forEach(function(k){
    var b=el('button',null,k+' unsur');
    b.onclick=function(){pilihK(k,b)};
    p.appendChild(b);
  });
  $('sxnext').disabled=true;
  msgP('','Satuan pola ada berapa unsur? Coba pilih.');
  setKata('Ada satu yang hilang. Cari satuan polanya dulu.');
}
function gambarP(k){
  var d=RP[rpi],g=$('sxgrid');clear(g);
  var kol=k||d.len;
  g.style.gridTemplateColumns='repeat('+Math.min(kol,d.len)+',44px)';
  var hl=d.hilang%k0;
  seqP.forEach(function(v,i){
    var c;
    if(i===d.hilang&&fase<3){c=el('div','sp-c q','?')}
    else c=el('div','sp-c'+(fase===3&&k&&i%k===hl?' kol':''),sim[v]);
    g.appendChild(c);
  });
}
function pilihK(k,b){
  if(fase!==1)return;
  var d=RP[rpi],sahih=true;
  for(var i=k;i<seqP.length;i++){if(i===d.hilang||i-k===d.hilang)continue;if(seqP[i]!==seqP[i-k])sahih=false}
  if(k===k0){
    fase=2;gambarP(k);
    var t='Betul! Satuan polanya '+k+' unsur. Sekarang lihat kolom yang sama. Apa yang hilang?';
    msgP('good',t);setKata(t);
    $('sxsay').textContent='Pilih yang hilang.';
    var p=$('sxpil');clear(p);
    var pakai=[];seqP.forEach(function(v){if(pakai.indexOf(v)<0)pakai.push(v)});
    shuffle(pakai).forEach(function(v){
      var bt=el('button','sim',sim[v]);bt.setAttribute('aria-label','pilihan');
      bt.onclick=function(){pilihIsi(v,bt)};
      p.appendChild(bt);
    });
  }else{
    b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');
    var t2=(sahih&&k>k0)?'Itu juga berulang, tapi bukan yang terkecil. Coba yang lebih sedikit.':'Kelompoknya tidak sama. Coba jumlah unsur yang lain.';
    msgP('warn',t2);setKata(t2);
  }
}
function pilihIsi(v,b){
  if(fase!==2)return;
  var d=RP[rpi],benar=seqP[d.hilang];
  if(v===benar){
    fase=3;gambarP(k0);
    var kolom=d.hilang%k0+1;
    var t='Betul! Kolom ke-'+kolom+' selalu berisi '+sim[benar]+'. Tempat kosong ada di urutan ke-'+kolom+' dalam satuan pola.';
    msgP('good',t);setKata('Betul! Tempat kosong ada di urutan ke-'+kolom+' dalam satuan pola.');$('sxnext').disabled=false;
  }else{
    b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');
    var t2='Hampir! Lihat kolom yang sama di baris lain. Jangan menyalin yang sebelumnya.';
    msgP('warn',t2);setKata(t2);
  }
}
$('sxnext').onclick=function(){if(rpi<RP.length-1){rpi++;rondeP()}else show('s4')};

/* ---- tantangan: 4 soal, balasan langsung ---- */
function soalGambar(kode,len){
  var items=tiga(),seq=ulangi(kode,len),ans=seq[len-1];
  var sisa=[0,1,2].filter(function(x){return x!==ans});
  return {
    vis:function(isi){
      var row=el('div','seq');row.style.width='100%';row.style.maxWidth='340px';
      for(var i=0;i<len-1;i++)row.appendChild(sel(items[seq[i]]));
      row.appendChild(isi?sel(items[ans],'isi'):sel(null,'kosong'));row.setAttribute('data-akhir','1');return row;
    },
    q:'Apa yang datang berikutnya?',
    opsi:[ans].concat(sisa).map(function(x){return {id:String(x),item:items[x]}}),
    a:String(ans),
    e:'Polanya berulang. Ini yang berikutnya.'
  };
}
function soalBunyi(){
  var kode=rnd(0,1)?[0,1]:[0,0,1],len=kode.length===2?5:7,seq=ulangi(kode,len),ans=ulangi(kode,len+1)[len];
  var teks=seq.map(function(x){return NAMA[x]}).join(', ')+', ...';
  return {
    teks:cap(teks),
    q:'Bunyi apa berikutnya?',
    opsi:[{id:'0',t:'Tuk'},{id:'1',t:'Tak'}],
    a:String(ans),
    e:'Polanya berulang. Berikutnya '+NAMA[ans]+'.'
  };
}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function bangunSoal(){return [soalGambar([0,1],5),soalGambar([0,0,1],5),soalGambar([0,1,2],5),soalBunyi()]}
var soal=[],qi=0,benar=0,terkunci=false;
function mulaiS4(){soal=bangunSoal();qi=0;benar=0;tampilSoal()}
function tampilSoal(){
  terkunci=false;
  var q=soal[qi];
  $('s4n').textContent='Tantangan '+(qi+1)+' dari '+soal.length;
  $('s4q').textContent=q.q;
  var v=$('s4v');clear(v);
  if(q.vis)v.appendChild(q.vis(false));
  if(q.teks)v.appendChild(el('div','katabunyi',q.teks));
  var o=$('s4o');clear(o);
  o.style.gridTemplateColumns='repeat('+q.opsi.length+',1fr)';
  shuffle(q.opsi).forEach(function(x){
    var b=el('button','opt');
    b.setAttribute('data-id',x.id);
    if(x.item){b.appendChild(gambar(x.item));b.setAttribute('aria-label','pilihan')}else b.textContent=x.t;
    b.onclick=function(){
      if(terkunci)return;terkunci=true;
      var ok=x.id===q.a;if(ok)benar++;
      var all=o.children;for(var k=0;k<all.length;k++){if(all[k].getAttribute('data-id')===q.a)all[k].classList.add('right');else if(all[k]===b)all[k].classList.add('wrong')}
      if(q.vis){clear(v);v.appendChild(q.vis(true))}
      var fb=$('s4fb');fb.style.display='flex';fb.className='msg '+(ok?'good':'warn');
      fb.textContent=(ok?'Benar! ':'Hampir! ')+q.e;
      setKata((ok?'Benar! ':'Hampir! ')+q.e);
      var nx=$('s4next');nx.style.display='';nx.textContent=qi===soal.length-1?'Selesai':'Lanjut';
    };
    o.appendChild(b);
  });
  $('s4fb').style.display='none';$('s4next').style.display='none';
  setKata(q.q);
}
$('s4next').onclick=function(){if(qi<soal.length-1){qi++;tampilSoal()}else show('akhir')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu pandai mengikuti pola.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-04'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};

/* ---- bonus: buat pola sendiri (8 bulatan, 4 warna) ---- */
var buat=[];
function periode(a){
  for(var p=1;p<=4;p++){var ok=true;for(var i=0;i<a.length;i++){if(a[i]!==a[i%p]){ok=false;break}}if(ok)return p}
  return 0;
}
function nilaiBonus(){
  var m=$('bmsg'),penuh=buat.every(function(x){return x>0});
  if(!penuh){m.className='msg';m.textContent='Isi semua bulatan.';return}
  var p=periode(buat);
  if(p===1){m.className='msg warn';m.textContent='Semuanya sama. Coba ganti warna!';setKata('Semuanya sama. Coba ganti warna.')}
  else if(p>1){m.className='msg good';m.textContent='Polamu berulang! Bagus!';setKata('Polamu berulang. Bagus!')}
  else{m.className='msg warn';m.textContent='Belum berulang. Coba lagi!';setKata('Belum berulang. Coba lagi.')}
}
function mulaiBonus(){
  buat=[0,0,0,0,0,0,0,0];
  var b=$('bb');clear(b);
  buat.forEach(function(_,i){
    var s=el('button','slot');s.setAttribute('aria-label','bulatan');
    s.onclick=function(){buat[i]=(buat[i]+1)%5;s.className='slot'+(buat[i]?' w'+buat[i]:'');nilaiBonus()};
    b.appendChild(s);
  });
  $('bmsg').className='msg';$('bmsg').textContent='Ketuk bulatan untuk memberi warna.';
  setKata('Buat polamu sendiri. Ketuk bulatan untuk memberi warna.');
}
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC04 = rakit(DASAR, { kode: 'AC-04', tantangan: 's4', data: DATA_AC04 })
