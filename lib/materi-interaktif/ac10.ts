import { rakit } from './bersama'
import { DATA_AC10 } from './latihan/ac10'

/**
 * Materi interaktif AC-10 "Kali dan Bagi" (Operasi kali-bagi bilangan cacah).
 * Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-10. Disimpan
 * sebagai string supaya ikut terbundel di build tanpa membaca berkas saat
 * runtime.
 *
 * Gaya sama dengan AC-09 (anak kelas 3-4, tiap stasiun beranimasi):
 * 1) Larik: ketuk tiap baris titik, jumlahnya bertambah sebesar satu baris
 *    (perkalian = penjumlahan berulang); lalu larik DIPUTAR (3 x 5 = 5 x 3).
 * 2) Bagi rata: kue dibagikan satu putaran demi satu putaran ke piring; yang
 *    tidak kebagian menjadi SISA (29 : 4 = 7 sisa 1), diperiksa dengan
 *    hasil bagi x pembagi + sisa.
 * 3) Keluarga fakta: pilih semua kalimat yang benar dari satu larik
 *    (kali dan bagi saling berkebalikan).
 * 4) Uraikan: 34 x 6 = 30 x 6 + 4 x 6 dan 96 : 8 = 80 : 8 + 16 : 8, langkah
 *    demi langkah, persamaan tumbuh di layar.
 * Bonus: tabel perkalian; ketuk satu kotak, pasangan tukarnya ikut menyala.
 *
 * Soal Misi topik ini menguji: istilah (kali, bagi, hasil kali, hasil bagi),
 * perkalian sebagai penjumlahan berulang, tukar urutan, bagi sama rata,
 * kebalikan, pembagian dengan sisa dan memeriksanya, habis dibagi, x0 dan x1,
 * perkalian dan pembagian bertingkat, perkiraan, cerita dua langkah, dan salah
 * paham "45 : 5 = 8 karena 5 x 8 = 40 mendekati 45".
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac10.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-10 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kali dan Bagi</title>
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
@keyframes goyang{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
@keyframes pop{0%{transform:scale(.3)}70%{transform:scale(1.25)}100%{transform:scale(1)}}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.center{text-align:center}
.besar{font-family:var(--display);font-weight:800;font-size:2.4rem;line-height:1.1;text-align:center;font-variant-numeric:tabular-nums}
.besar .o{color:var(--ikat)}
.aksi{display:grid;gap:10px}
.aksi.pil3{grid-template-columns:repeat(3,1fr)}
.aksi button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.3rem;min-height:58px;border-radius:16px;border:2px solid var(--ink);background:var(--card);color:var(--ink);cursor:pointer;box-shadow:0 3px 0 var(--ink);touch-action:manipulation;padding:8px}
.aksi button.utama{background:var(--ikat);color:#fff}
.aksi button.right{background:var(--ok);border-color:var(--ok);color:#fff;box-shadow:none}
.aksi button.wrong{background:var(--soft);border-color:var(--ikat);box-shadow:none}
.aksi button.hint{animation:denyut 1s infinite}
.tanya{font-family:var(--display);font-weight:800;font-size:1.25rem;text-align:center}
/* stasiun 1: larik */
.larik{display:flex;flex-direction:column;gap:6px;align-items:center;transition:transform .7s ease-in-out}
.larik.putar{transform:rotate(90deg) scale(.85)}
.larik .br{display:flex;align-items:center;gap:8px;cursor:pointer;padding:3px 6px;border-radius:14px;border:2px solid transparent;touch-action:manipulation}
.larik .br .titik{display:grid;gap:4px}
.larik .br .dt{width:24px;height:24px;border-radius:50%;border:2px solid var(--ink);background:var(--line)}
.larik .br.on{border-color:var(--ok);background:var(--soft)}
.larik .br.on .dt{background:var(--ikat);animation:pop .35s}
.larik .br.on:nth-child(even) .dt{background:var(--rb)}
.larik .br.hint{animation:denyut 1s infinite}
.larik .nbar{font-family:var(--display);font-weight:800;font-size:1.2rem;min-width:2.4em;text-align:right;color:var(--ok)}
.hit{font-family:var(--display);font-weight:800;text-align:center;font-size:1.3rem;min-height:1.6em;color:var(--muted);font-variant-numeric:tabular-nums}
/* stasiun 2: bagi rata */
.tas{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;font-size:1.5rem;line-height:1.1;min-height:2.4em;align-items:center}
.tas .cap{width:100%;text-align:center;font-family:var(--display);font-weight:800;font-size:1rem;color:var(--muted)}
.piringan{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pir{border:3px solid var(--ink);border-radius:50%;aspect-ratio:1;background:var(--soft);display:flex;flex-wrap:wrap;gap:1px;justify-content:center;align-content:center;padding:6px;font-size:1.15rem;line-height:1.1;position:relative}
.pir b{font-family:var(--display);font-size:1.7rem}
.pir .baru{animation:pop .5s}
.pir.sisa{border-style:dashed}
/* stasiun 3: keluarga fakta */
.fakta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fakta-grid button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.25rem;min-height:62px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:6px;touch-action:manipulation}
.fakta-grid button.pilih{border-color:var(--ikat);background:var(--soft)}
.fakta-grid button.right{background:var(--ok);border-color:var(--ok);color:#fff}
.fakta-grid button.wrong{background:var(--soft);border-color:var(--ikat);text-decoration:line-through}
/* stasiun 4: uraikan */
.pers{font-family:var(--display);font-weight:800;font-size:1.35rem;text-align:center;line-height:1.5;min-height:3.2em;font-variant-numeric:tabular-nums}
.pers span{display:inline-block;animation:pop .45s}
.pers .ok{color:var(--ok)}
/* bonus: tabel kali */
.tabel{display:grid;grid-template-columns:repeat(13,1fr);gap:2px;font-family:var(--display);font-weight:800;font-size:.72rem}
.tabel button{aspect-ratio:1;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:4px;padding:0;font:inherit;cursor:pointer;min-width:0}
.tabel .h{background:var(--ikat);color:#fff;border-color:var(--ikat);cursor:default}
.tabel button.on{background:var(--ikat);color:#fff;border-color:var(--ikat)}
.tabel button.kembar{background:var(--soft);border-color:var(--lidi);color:var(--ink)}
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
      <h1>Kali dan Bagi</h1>
      <div class="panel" style="max-width:300px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo kelompokkan dan bagikan sama rata!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: larik -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Ketuk tiap baris. Jumlahnya bertambah.</p>
    <div class="dots" id="s1dots"></div>
    <div class="besar" id="s1soal"></div>
    <div class="panel" style="display:flex;flex-direction:column;gap:10px;align-items:center;overflow:hidden">
      <div class="larik" id="s1larik"></div>
    </div>
    <div class="hit" id="s1hit"></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: bagi rata dan sisa -->
  <section class="screen" id="s2">
    <p class="say">Bagikan kue sama rata ke semua piring.</p>
    <div class="dots" id="s2dots"></div>
    <div class="besar" id="s2soal"></div>
    <div class="panel"><div class="tas" id="s2tas"></div></div>
    <div class="piringan" id="s2pir"></div>
    <div class="aksi" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: keluarga fakta -->
  <section class="screen" id="s3">
    <p class="say">Satu larik, banyak kalimat benar. Pilih semuanya!</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div id="s3gambar" style="display:flex;justify-content:center"></div></div>
    <div class="fakta-grid" id="s3pil"></div>
    <div class="aksi" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: uraikan -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Uraikan, hitung bagian-bagiannya, lalu gabungkan.</p>
    <div class="dots" id="s4dots"></div>
    <div class="besar" id="s4soal"></div>
    <div class="panel"><div id="s4gambar" style="display:flex;justify-content:center"></div></div>
    <div class="pers" id="s4pers"></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: tabel perkalian</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: ketuk satu kotak. Pasangan tukarnya ikut menyala.</p>
    <div class="panel"><div class="tabel" id="bTabel"></div></div>
    <div class="panel"><div id="bGambar" style="display:flex;justify-content:center"></div></div>
    <div class="msg" id="bmsg">Ketuk kotak di tabel.</div>
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
function soalTeks(id,a,op,b){var w=$(id);clear(w);w.appendChild(document.createTextNode(a+' '));w.appendChild(el('span','o',op));w.appendChild(document.createTextNode(' '+b))}
var KALI='×',BAGI=':';

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
var urut=['intro','s1','s2','s3','s4','akhir'];
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
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')mulaiBonus();
  if(id==='intro')setKata('Ayo kelompokkan dan bagikan sama rata!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo kelompokkan dan bagikan sama rata!');

/* ---- stasiun 1: larik, kali = tambah berulang, lalu diputar ---- */
var T1=[[3,5],[4,6],[7,8]],r1=0,a1=0,b1=0,hit1=[],urutHit=0,fase1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  a1=T1[r1][0];b1=T1[r1][1];hit1=[];urutHit=0;fase1=0;
  titik('s1dots',T1.length,r1);
  soalTeks('s1soal',a1,KALI,b1);
  gambar1(false);clear($('s1aksi'));$('s1next').disabled=true;
  $('s1hit').textContent='';
  msg('s1msg','','Ketuk satu baris. Tiap baris ada '+b1+' titik.');
  setKata('Ketuk tiap baris. Tiap baris ada '+b1+' titik.');
}
function gambar1(rot){
  var w=$('s1larik');clear(w);w.className='larik'+(rot?' putar':'');
  for(var i=0;i<a1;i++){
    var row=el('div','br'+(hit1[i]?' on':'')+(urutHit===0&&i===0&&fase1===0?' hint':''));
    row.setAttribute('role','button');row.setAttribute('aria-label','baris '+(i+1));
    var tt=el('div','titik');tt.style.gridTemplateColumns='repeat('+b1+',24px)';
    for(var j=0;j<b1;j++)tt.appendChild(el('span','dt'));
    row.appendChild(tt);row.appendChild(el('span','nbar',hit1[i]?String(hit1[i]*b1):''));
    row.onclick=(function(i){return function(){ketukBaris(i)}})(i);
    w.appendChild(row);
  }
}
function ketukBaris(i){
  if(hit1[i]||fase1!==0)return;
  urutHit++;hit1[i]=urutHit;gambar1(false);
  var jum=[];for(var k=1;k<=urutHit;k++)jum.push(k*b1);
  $('s1hit').textContent=jum.join(', ');
  if(urutHit<a1){msg('s1msg','',urutHit+' baris × '+b1+' = '+urutHit*b1+'. Lanjut ketuk baris lain.')}
  else{
    fase1=1;var t=a1+' '+KALI+' '+b1+' = '+a1*b1+'. Sama dengan '+b1+' ditambah '+b1+' sebanyak '+a1+' kali.';
    msg('s1msg','good',t);setKata(t);
    var w=$('s1aksi');clear(w);tombol(w,'Putar larik',function(){putar1()},'utama hint');
  }
}
function putar1(){
  fase1=2;clear($('s1aksi'));
  $('s1larik').classList.add('putar');
  later(function(){
    var t=a1;a1=b1;b1=t;hit1=[];for(var i=0;i<a1;i++)hit1[i]=i+1;urutHit=a1;
    soalTeks('s1soal',a1,KALI,b1);gambar1(false);
    var s=a1+' '+KALI+' '+b1+' = '+a1*b1+' juga! Urutan boleh ditukar.';
    msg('s1msg','good',s);setKata(s);$('s1hit').textContent='';$('s1next').disabled=false;
  },800);
}
$('s1next').onclick=function(){if(r1<T1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: bagi rata, yang tidak kebagian menjadi sisa ---- */
var T2=[[24,6],[29,4],[38,5]],r2=0,n2=0,k2=0,pir2=[],tersisa2=0,putaran2=0,fase2=0;
var KUE='\u{1F36A}';
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  n2=T2[r2][0];k2=T2[r2][1];pir2=[];for(var i=0;i<k2;i++)pir2.push(0);
  tersisa2=n2;putaran2=0;fase2=0;
  titik('s2dots',T2.length,r2);soalTeks('s2soal',n2,BAGI,k2);
  gambar2(-1);aksi2();
  msg('s2msg','','Ada '+n2+' kue dan '+k2+' piring. Bagikan satu putaran.');
  $('s2next').disabled=true;setKata('Bagikan kue sama rata ke semua piring.');
}
function isiKue(wadah,n){for(var i=0;i<n;i++)wadah.appendChild(el('span',null,KUE))}
function gambar2(baru){
  var tas=$('s2tas');clear(tas);
  tas.appendChild(el('div','cap','Kue yang belum dibagi: '+tersisa2));isiKue(tas,tersisa2);
  var w=$('s2pir');clear(w);
  pir2.forEach(function(n,i){
    var p=el('div','pir');
    if(n>8)p.appendChild(el('b',null,String(n)));
    else for(var j=0;j<n;j++){var s=el('span',baru===i&&j===n-1?'baru':null,KUE);p.appendChild(s)}
    if(baru>=0&&n>8)p.firstChild.className='baru';
    w.appendChild(p);
  });
}
function aksi2(){
  var w=$('s2aksi');clear(w);w.className='aksi';
  if(fase2===0){
    tombol(w,'Bagikan 1 putaran',function(){
      if(tersisa2<k2)return;
      putaran2++;
      for(var i=0;i<k2;i++)pir2[i]++;
      tersisa2-=k2;gambar2(0);
      for(var j=0;j<k2;j++){(function(j){later(function(){var p=$('s2pir').children[j];if(p&&p.lastChild)p.lastChild.className='baru'},j*60)})(j)}
      if(tersisa2<k2){
        fase2=1;
        var t='Putaran '+putaran2+' selesai. Setiap piring dapat '+putaran2+'. Kue yang tersisa tidak cukup untuk semua piring.';
        msg('s2msg','good',t);setKata(t);aksi2();
      }else msg('s2msg','','Putaran '+putaran2+': setiap piring dapat '+putaran2+'. Sisa kue '+tersisa2+'. Bagikan lagi.');
    },'utama'+(r2===0&&putaran2===0?' hint':''));
  }else if(fase2===1){
    w.className='aksi pil3';
    var benar=tersisa2,opsi=[benar];
    [benar+1,benar+2,benar>0?benar-1:3].forEach(function(x){if(opsi.length<3&&opsi.indexOf(x)<0)opsi.push(x)});
    $('s2msg').textContent='Berapa kue yang tidak kebagian (sisa)?';
    shuffle(opsi).forEach(function(x){
      var b=tombol(w,String(x),function(){
        if(x===benar){
          b.classList.add('right');
          var t=n2+' : '+k2+' = '+putaran2+(benar?' sisa '+benar:', habis dibagi')+'. Periksa: '+putaran2+' '+KALI+' '+k2+(benar?' + '+benar:'')+' = '+n2+'.';
          msg('s2msg','good',t);setKata(t);clear(w);$('s2next').disabled=false;
        }else{b.classList.add('wrong');var t2='Hampir! Hitung kue yang masih tersisa di atas.';msg('s2msg','warn',t2);setKata(t2)}
      });
    });
  }
}
$('s2next').onclick=function(){if(r2<T2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: keluarga fakta ---- */
var T3=[[5,6],[4,9],[7,8]],r3=0,benar3=[],pilih3=[],kunci3=false;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var a=T3[r3][0],b=T3[r3][1],c=a*b;kunci3=false;pilih3=[];
  titik('s3dots',T3.length,r3);
  var g=$('s3gambar');clear(g);g.appendChild(GBR.larik({r:a,c:b}));
  var daftar=[
    {t:a+' '+KALI+' '+b+' = '+c,ok:true},{t:b+' '+KALI+' '+a+' = '+c,ok:true},
    {t:c+' '+BAGI+' '+b+' = '+a,ok:true},{t:c+' '+BAGI+' '+a+' = '+b,ok:true},
    {t:a+' '+BAGI+' '+b+' = '+c,ok:false},{t:c+' '+BAGI+' '+c+' = '+a,ok:false}
  ];
  benar3=daftar.filter(function(x){return x.ok}).length;
  var w=$('s3pil');clear(w);
  shuffle(daftar).forEach(function(d){
    var bt=el('button',null,d.t);bt.setAttribute('data-ok',d.ok?'1':'0');
    bt.onclick=function(){if(kunci3)return;bt.classList.toggle('pilih');var i=pilih3.indexOf(bt);if(i>=0)pilih3.splice(i,1);else pilih3.push(bt)};
    w.appendChild(bt);
  });
  var ak=$('s3aksi');clear(ak);tombol(ak,'Periksa',function(){periksa3()},'utama');
  $('s3next').disabled=true;
  msg('s3msg','','Ketuk semua kalimat yang benar, lalu tekan Periksa.');
  setKata('Satu larik, banyak kalimat benar. Pilih semuanya.');
}
function periksa3(){
  if(kunci3)return;
  var semua=$('s3pil').children,salah=0;
  for(var i=0;i<semua.length;i++){
    var b=semua[i],ok=b.getAttribute('data-ok')==='1',dipilih=b.classList.contains('pilih');
    if(ok!==dipilih)salah++;
  }
  if(!salah){
    kunci3=true;
    for(var j=0;j<semua.length;j++){semua[j].classList.remove('pilih');semua[j].classList.add(semua[j].getAttribute('data-ok')==='1'?'right':'wrong')}
    var a=T3[r3][0],b2=T3[r3][1];
    var t='Betul! Kali dan bagi berkeluarga: '+a+' '+KALI+' '+b2+' = '+a*b2+' membawa '+a*b2+' '+BAGI+' '+b2+' = '+a+' dan '+a*b2+' '+BAGI+' '+a+' = '+b2+'.';
    msg('s3msg','good',t);setKata(t);clear($('s3aksi'));$('s3next').disabled=false;
  }else{
    var t2='Hampir! Ada '+salah+' kalimat yang belum tepat. Coba periksa lagi dengan larik.';
    msg('s3msg','warn',t2);setKata(t2);
  }
}
$('s3next').onclick=function(){if(r3<T3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: uraikan, hitung bagian, gabungkan ---- */
var T4=[
  {op:'k',a:34,b:6,bagian:[30,4],jawab:[180,24],hasil:204,
   langkah:[
     {t:'Uraikan 34 menjadi...',o:['30 dan 4','30 dan 40','3 dan 4'],b:0,p:'34 = 30 + 4'},
     {t:'Berapa 30 × 6?',o:['180','18','120'],b:0,p:'30 × 6 = 180'},
     {t:'Berapa 4 × 6?',o:['24','10','20'],b:0,p:'4 × 6 = 24'},
     {t:'Jumlahkan kedua hasilnya.',o:['204','184','214'],b:0,p:'180 + 24 = 204'}]},
  {op:'k',a:45,b:8,bagian:[40,5],jawab:[320,40],hasil:360,
   langkah:[
     {t:'Uraikan 45 menjadi...',o:['40 dan 5','40 dan 50','4 dan 5'],b:0,p:'45 = 40 + 5'},
     {t:'Berapa 40 × 8?',o:['320','32','360'],b:0,p:'40 × 8 = 320'},
     {t:'Berapa 5 × 8?',o:['40','13','35'],b:0,p:'5 × 8 = 40'},
     {t:'Jumlahkan kedua hasilnya.',o:['360','330','280'],b:0,p:'320 + 40 = 360'}]},
  {op:'b',a:96,b:8,bagian:[80,16],jawab:[10,2],hasil:12,
   langkah:[
     {t:'Uraikan 96 menjadi dua bagian yang mudah dibagi 8.',o:['80 dan 16','90 dan 6','60 dan 36'],b:0,p:'96 = 80 + 16'},
     {t:'Berapa 80 : 8?',o:['10','8','100'],b:0,p:'80 : 8 = 10'},
     {t:'Berapa 16 : 8?',o:['2','8','4'],b:0,p:'16 : 8 = 2'},
     {t:'Jumlahkan kedua hasil bagi.',o:['12','10','102'],b:0,p:'10 + 2 = 12'}]},
  {op:'b',a:84,b:7,bagian:[70,14],jawab:[10,2],hasil:12,
   langkah:[
     {t:'Uraikan 84 menjadi dua bagian yang mudah dibagi 7.',o:['70 dan 14','80 dan 4','50 dan 34'],b:0,p:'84 = 70 + 14'},
     {t:'Berapa 70 : 7?',o:['10','7','100'],b:0,p:'70 : 7 = 10'},
     {t:'Berapa 14 : 7?',o:['2','7','4'],b:0,p:'14 : 7 = 2'},
     {t:'Jumlahkan kedua hasil bagi.',o:['12','10','102'],b:0,p:'10 + 2 = 12'}]}
];
var r4=0,l4=0,kunci4=false;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=T4[r4];l4=0;kunci4=false;titik('s4dots',T4.length,r4);
  soalTeks('s4soal',d.a,d.op==='k'?KALI:BAGI,d.b);
  var g=$('s4gambar');clear(g);g.appendChild(GBR.blok({n:d.a,label:String(d.a)}));
  clear($('s4pers'));$('s4next').disabled=true;
  tanya4();
}
function tanya4(){
  var d=T4[r4],w=$('s4aksi'),l=d.langkah[l4];
  clear(w);
  if(!l){
    var t=d.a+' '+(d.op==='k'?KALI:BAGI)+' '+d.b+' = '+d.hasil+'. Dibagi dua bagian, lebih mudah!';
    msg('s4msg','good',t);setKata(t);$('s4tanya').textContent='';$('s4next').disabled=false;return;
  }
  $('s4tanya').textContent=l.t;msg('s4msg','','Pilih jawabannya.');setKata(l.t);
  shuffle(l.o.map(function(x,i){return {x:x,ok:i===l.b}})).forEach(function(o){
    var b=tombol(w,o.x,function(){
      if(kunci4)return;
      if(o.ok){
        kunci4=true;b.classList.add('right');
        var s=el('span',l4===d.langkah.length-1?'ok':null,l.p);
        var pe=$('s4pers');if(pe.childNodes.length)pe.appendChild(document.createTextNode('  '));pe.appendChild(s);
        msg('s4msg','good','Betul! '+l.p+'.');setKata(l.p);
        l4++;kunci4=false;later(tanya4,900);
      }else{b.classList.add('wrong');var t2='Hampir! Hitung lagi pelan-pelan.';msg('s4msg','warn',t2);setKata(t2)}
    });
  });
}
$('s4next').onclick=function(){if(r4<T4.length-1){r4++;ronde4()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu pandai mengali dan membagi.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-10'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){$('introGambar').appendChild(GBR.kelompok({e:'\u{1F36A}',jumlah:4,n:6,plus:true}))})();

/* ---- bonus: tabel perkalian 1-12 ---- */
var bA=0,bB=0;
function mulaiBonus(){
  var t=$('bTabel');clear(t);
  t.appendChild(el('button','h',KALI));t.lastChild.disabled=true;
  for(var j=1;j<=12;j++){var h=el('button','h',String(j));h.disabled=true;t.appendChild(h)}
  for(var i=1;i<=12;i++){
    var hh=el('button','h',String(i));hh.disabled=true;t.appendChild(hh);
    for(var k=1;k<=12;k++){
      var c=el('button',null,String(i*k));c.setAttribute('aria-label',i+' kali '+k);
      c.onclick=(function(i,k){return function(){pilihBonus(i,k)}})(i,k);
      t.appendChild(c);
    }
  }
  bA=0;bB=0;clear($('bGambar'));msg('bmsg','','Ketuk kotak di tabel.');
}
function pilihBonus(a,b){
  var kotak=$('bTabel').querySelectorAll('button:not(.h)');
  kotak.forEach(function(x,idx){
    var i=Math.floor(idx/12)+1,k=idx%12+1;
    x.classList.toggle('on',i===a&&k===b);
    x.classList.toggle('kembar',i===b&&k===a&&a!==b);
  });
  var g=$('bGambar');clear(g);g.appendChild(GBR.larik({r:a,c:b}));
  var t=a+' '+KALI+' '+b+' = '+a*b+(a!==b?'. Pasangannya: '+b+' '+KALI+' '+a+' = '+a*b+'.':'.')+' Bagi: '+a*b+' '+BAGI+' '+a+' = '+b+'.';
  msg('bmsg','good',t);setKata(t);
}
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC10 = rakit(DASAR, { kode: 'AC-10', data: DATA_AC10 })
