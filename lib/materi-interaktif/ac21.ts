import { rakit } from './bersama'
import { DATA_AC21 } from './latihan/ac21'

/**
 * Materi interaktif AC-21 "Saringan dan Pohon Faktor" (bilangan prima,
 * faktorisasi prima, FPB, dan KPK). Satu halaman HTML mandiri, ditampilkan
 * lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah Belajar di
 * topik Misi AC-21. Disimpan sebagai string supaya ikut terbundel di build
 * tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-20 (anak kelas 5-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Saringan: coret 1, lalu kelipatan 2, 3, 5; sisanya bilangan prima.
 *    Prima = tepat dua faktor; 1 bukan prima; 2 satu-satunya prima genap;
 *    15 dan 9 ganjil tetapi komposit.
 * 2) Pohon faktor: ketuk bilangan komposit untuk memecahnya sampai semua
 *    daun prima; 2 x 15 belum lengkap, 4 x 9 bukan faktorisasi prima.
 * 3) FPB lewat daftar faktor: ketuk faktor yang sama-sama, ambil yang
 *    TERBESAR (20 dan 30 FPB-nya 10, bukan 5; 14 dan 21 FPB-nya 7, bukan 1).
 * 4) Kantong rata: geser jumlah kantong, banyak kantong paling banyak tanpa
 *    sisa adalah FPB.
 * 5) KPK lewat dua lampu: kelipatan bersama pertama; KPK dua prima = hasil
 *    kali; kalau satu kelipatan yang lain, KPK = yang besar; FPB x KPK = hasil
 *    kali kedua bilangan.
 * Bonus: pilih dua bilangan, lihat faktorisasi prima, FPB, dan KPK.
 *
 * Soal Misi topik ini menguji: prima dan komposit, faktor dan kelipatan (arah
 * tidak boleh tertukar), faktorisasi prima, FPB dan KPK (daftar dan
 * faktorisasi), cerita pembagian rata dan lampu/bus bersamaan, saling prima,
 * serta salah paham (1 prima, FPB dua bilangan berbeda selalu 1, FPB
 * mengambil faktor terkecil, FPB lebih besar dari bilangan, prima pasti FPB 1).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac21.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, fpbG, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-21 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Saringan dan Pohon Faktor</title>
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
.alat{display:flex;justify-content:center;align-items:center;min-height:100px}
.alat svg{max-width:100%}
.baca{font-family:var(--display);font-weight:800;font-size:1.1rem;text-align:center;min-height:2.4em}
input[type=range]{width:100%;accent-color:var(--ikat);height:40px}
.kel2{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:90px;align-content:flex-start}
.kel2 b{display:flex;flex-wrap:wrap;gap:2px;max-width:150px;padding:4px;border:2px solid var(--ink);border-radius:10px;background:var(--card);animation:pop .3s}
.kel2 b.sisa{border:2px dashed var(--ikat);background:var(--soft)}
.kel2 i{width:14px;height:14px;border-radius:50%;background:var(--rb);border:2px solid var(--ink);display:block}
.kel2 b.sisa i{background:var(--ikat)}
.fak{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:44px}
.fak span,.fak button{border:2px solid var(--ikat);background:var(--soft);border-radius:12px;padding:2px 12px;font-family:var(--display);font-weight:800;font-size:1.1rem;color:var(--ink);animation:pop .35s;font-variant-numeric:tabular-nums}
.fak button{cursor:pointer;touch-action:manipulation;min-height:44px;border-color:var(--line);background:var(--card);animation:none}
.fak button.pilih{border-color:var(--ikat);background:var(--soft)}
.fak button.ok{border-color:var(--ok);background:var(--ok);color:#fff}
.pohon{display:flex;justify-content:center;overflow-x:auto;min-height:120px}
.pn{display:flex;flex-direction:column;align-items:center}
.pn .ks{display:flex;gap:10px;margin-top:8px;position:relative;animation:pop .35s}
.pn .nd{min-width:44px;min-height:44px;border-radius:50%;border:3px solid var(--line);background:var(--card);color:var(--ink);font-family:var(--display);font-weight:800;font-size:1.1rem;padding:0 8px;font-variant-numeric:tabular-nums}
.pn button.nd{cursor:pointer;touch-action:manipulation;border-color:var(--ikat);animation:denyut 1.2s infinite}
.pn .nd.pr{background:var(--ok);border-color:var(--ok);color:#fff}
@keyframes denyut{0%,100%{box-shadow:0 0 0 0 rgba(0,0,0,.18)}50%{box-shadow:0 0 0 6px rgba(0,0,0,0)}}
.kp{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;min-height:60px;align-content:flex-start}
.kp b{border:2px solid var(--ink);border-radius:10px;background:var(--card);padding:1px 6px;font-family:var(--display);font-weight:800;font-size:.8rem;animation:pop .3s}
.kp b.sisa{border:2px dashed var(--ikat);background:var(--soft);color:var(--muted)}
.tanda{font-family:var(--display);font-weight:800;font-size:1.05rem;text-align:center;line-height:1.7}
.tanda em{font-style:normal;color:var(--ikat)}
.nama{font-family:var(--display);font-weight:800;font-size:1.05rem;color:var(--muted);text-align:center}
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
      <h1>Saringan dan Pohon Faktor</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo kenali bilangan prima, FPB, dan KPK!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Saring bilangan 1 sampai 40.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1papan"></div></div>
    <div class="aksi" id="s1mulai"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Pecah bilangan sampai semua daun prima.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="pohon" id="s2pohon"></div><div class="baca" id="s2baca"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Ketuk faktor yang muncul di KEDUA daftar.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="nama" id="s3na"></div><div class="fak" id="s3a"></div><div class="nama" id="s3nb"></div><div class="fak" id="s3b"></div></div>
    <div class="aksi" id="s3periksa"></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Bagi rata ke kantong tanpa sisa.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="kp" id="s4kel"></div><div class="baca" id="s4baca"></div>
      <input type="range" id="s4geser" min="1" max="12" value="1" aria-label="Banyak kantong"></div>
    <div class="nama">Jumlah kantong yang pas</div>
    <div class="fak" id="s4fak"></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Dua lampu berkedip.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="alat" id="s5papan"></div></div>
    <div class="aksi" id="s5mulai"></div>
    <div class="tanya" id="s5tanya"></div>
    <div class="aksi pil3" id="s5aksi"></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin FPB dan KPK</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih dua bilangan, lihat FPB dan KPK-nya.</p>
    <div class="panel"><div class="baca" id="bNilaiA"></div><input type="range" id="bA" min="2" max="40" value="12" aria-label="Bilangan pertama">
      <div class="baca" id="bNilaiB"></div><input type="range" id="bB" min="2" max="40" value="18" aria-label="Bilangan kedua"></div>
    <div class="tanda" id="bTanda"></div>
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
  if(id==='intro')setKata('Ayo kenali bilangan prima, FPB, dan KPK!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo kenali bilangan prima, FPB, dan KPK!');

/* ---- alat bantu bilangan ---- */
function semuaFaktor(n){var f=[];for(var i=1;i<=n;i++)if(n%i===0)f.push(i);return f}
function gcdN(a,b){return b?gcdN(b,a%b):a}
function lcmN(a,b){return a/gcdN(a,b)*b}
function primaDari(n){var r=[],p=2;while(n>1){if(n%p===0){r.push(p);n/=p}else p++}return r}
function gabung(a){return a.join(' × ')}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Pikirkan lagi, lihat gambarnya.')});
}

/* ---- stasiun 1: saringan bilangan prima ---- */
var SARING=[
  {t:'Coret 1',k:1,p:'1 hanya punya satu faktor, jadi bukan bilangan prima. Coret!'},
  {t:'Coret kelipatan 2',k:2,p:'Kelipatan 2 punya faktor 2, jadi komposit. Hanya 2 sendiri yang tersisa.'},
  {t:'Coret kelipatan 3',k:3,p:'Kelipatan 3 (kecuali 3) komposit.'},
  {t:'Coret kelipatan 5',k:5,p:'Kelipatan 5 (kecuali 5) komposit.'}
];
var R1=[
  {t:'Ada berapa bilangan prima dari 1 sampai 40?',o:['12','13','11'],b:'12',p:'2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37: ada 12.'},
  {t:'Satu-satunya bilangan prima yang genap adalah...',o:['2','4','10'],b:'2',p:'Semua bilangan genap lain habis dibagi 2, jadi punya lebih dari dua faktor.'},
  {t:'Apakah 1 termasuk bilangan prima?',o:['Bukan, 1 hanya punya satu faktor','Ya, faktornya 1 dan dirinya sendiri'],b:'Bukan, 1 hanya punya satu faktor',p:'Bilangan prima harus punya TEPAT dua faktor. 1 hanya punya satu.'},
  {t:'Bilangan 15 ikut dicoret. Prima atau komposit?',o:['Komposit, punya faktor 1, 3, 5, dan 15','Prima, karena bilangan ganjil','Prima, karena kurang dari 40'],b:'Komposit, punya faktor 1, 3, 5, dan 15',p:'Komposit = punya lebih dari dua faktor.'},
  {t:'Apakah semua bilangan ganjil adalah bilangan prima?',o:['Tidak. 9, 15, 21, dan 27 ganjil tetapi komposit','Ya, semua ganjil prima'],b:'Tidak. 9, 15, 21, dan 27 ganjil tetapi komposit',p:'Ganjil belum tentu prima. Cek faktornya.'}
];
var sar1=0,jalan1=false;
function mulaiS1(){
  titik('s1dots',1,0);sar1=0;jalan1=false;
  var w=$('s1papan');clear(w);w.appendChild(GBR.papan({n:40,kol:10}));
  clear($('s1aksi'));$('s1tanya').textContent='';$('s1next').disabled=true;
  tombolSaring();msg('s1msg','','Coret bilangan yang bukan prima, satu langkah demi satu langkah.');setKata('Saring bilangan 1 sampai 40.');
}
function tombolSaring(){var a=$('s1mulai');clear(a);a.className='aksi';tombol(a,SARING[sar1].t,saring1,'utama hint')}
function saring1(){
  if(jalan1)return;jalan1=true;
  var s=SARING[sar1],cs=$('s1papan').firstChild.children,i,tunda=0;clear($('s1mulai'));
  if(s.k>1)cs[s.k-1].classList.add('so');
  for(i=1;i<=40;i++){
    if(s.k===1?i===1:(i%s.k===0&&i!==s.k)){(function(i){tunda++;later(function(){cs[i-1].style.opacity='.2';cs[i-1].style.textDecoration='line-through'},tunda*110)})(i)}
  }
  later(function(){
    msg('s1msg','good',s.p);setKata(s.p);sar1++;jalan1=false;
    if(sar1<SARING.length)tombolSaring();
    else{
      for(var j=1;j<=40;j++)if(cs[j-1].style.opacity!=='0.2')cs[j-1].classList.add('ab');
      later(function(){msg('s1msg','good','Yang menyala hijau adalah bilangan prima: punya tepat dua faktor.');ruteSteps('s1aksi','s1tanya','s1msg',R1,0,function(){$('s1next').disabled=false})},900);
    }
  },tunda*110+700);
}
$('s1next').onclick=function(){show('s2')};

/* ---- stasiun 2: pohon faktor ---- */
var R2=[
  {n:12,o:['2 × 2 × 3','2 × 6','3 × 4']},
  {n:30,o:['2 × 3 × 5','2 × 15','5 × 6'],x:{t:'Apakah 2 × 15 sudah faktorisasi prima yang lengkap?',o:['Belum, 15 bukan prima dan masih bisa dipecah','Sudah lengkap'],b:'Belum, 15 bukan prima dan masih bisa dipecah',p:'Semua faktornya harus prima. 15 = 3 × 5, jadi lanjutkan: 2 × 3 × 5.'}},
  {n:18,o:['2 × 3 × 3','2 × 9','3 × 6']},
  {n:36,o:['2 × 2 × 3 × 3','4 × 9','6 × 6'],x:{t:'Apakah ada faktorisasi prima 36 yang lain (selain menukar urutan)?',o:['Tidak. Hanya 2 × 2 × 3 × 3','Ada, 4 × 9 juga'],b:'Tidak. Hanya 2 × 2 × 3 × 3',p:'Faktorisasi prima itu unik. 4 × 9 bukan faktorisasi prima karena 4 dan 9 bukan bilangan prima.'}}
];
var r2=0,pohon2=null;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);pohon2={v:d.n,k:null};
  clear($('s2aksi'));$('s2tanya').textContent='';$('s2next').disabled=true;
  var t='Pecah '+d.n+' sampai semua daun prima.';$('s2say').textContent=t;setKata(t);
  lukis2();msg('s2msg','','Ketuk bilangan yang berdenyut untuk memecahnya.');
}
function daun2(n,a){if(!n.k)a.push(n.v);else{daun2(n.k[0],a);daun2(n.k[1],a)}return a}
function simpul2(n){
  var w=el('div','pn'),ada=n.k===null&&primaDari(n.v).length>1;
  if(ada){var b=el('button','nd',String(n.v));b.onclick=function(){pecah2(n)};w.appendChild(b)}
  else w.appendChild(el('span','nd'+(n.k===null?' pr':''),String(n.v)));
  if(n.k){var ks=el('div','ks');ks.appendChild(simpul2(n.k[0]));ks.appendChild(simpul2(n.k[1]));w.appendChild(ks)}
  return w;
}
function lukis2(){
  var w=$('s2pohon');clear(w);w.appendChild(simpul2(pohon2));
  var l=daun2(pohon2,[]);$('s2baca').textContent=l.join(' × ')+' = '+R2[r2].n;
}
function pecah2(n){
  var p=primaDari(n.v)[0];n.k=[{v:p,k:null},{v:n.v/p,k:null}];lukis2();
  var l=daun2(pohon2,[]);
  if(l.every(function(x){return primaDari(x).length===1})){
    var d=R2[r2],t='Semua daun prima! '+d.n+' = '+gabung(l)+'.';msg('s2msg','good',t);setKata(t);
    var st=[{t:'Faktorisasi prima dari '+d.n+' adalah...',o:d.o,b:d.o[0],p:d.n+' = '+d.o[0]+'. Semua faktornya bilangan prima.',n:'Hampir! Semua faktor harus bilangan prima.'}];
    if(d.x)st.push(d.x);
    later(function(){ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false})},1200);
  }else msg('s2msg','','Masih ada bilangan yang bisa dipecah. Ketuk yang berdenyut.');
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: FPB lewat daftar faktor ---- */
var R3=[
  {a:20,b:30,o:['10','5','60'],p:'Faktor yang sama: 1, 2, 5, 10. Yang TERBESAR adalah 10, bukan 5.'},
  {a:24,b:36,o:['12','6','72'],p:'Faktor yang sama: 1, 2, 3, 4, 6, 12. Terbesar: 12.'},
  {a:14,b:21,o:['7','1','3'],p:'Bukan 1! Keduanya punya faktor 7, dan 7 lebih besar dari 1.'},
  {a:8,b:15,o:['1','8','2'],p:'Hanya 1 yang sama. Dua bilangan yang FPB-nya 1 disebut saling prima.',x:{t:'Dua bilangan yang FPB-nya 1 disebut...',o:['saling prima','sama besar','bilangan komposit'],b:'saling prima',p:'Saling prima: tidak ada faktor sama selain 1. Bilangannya sendiri belum tentu prima (8 dan 15).'}},
  {a:15,b:45,o:['15','45','5'],p:'45 kelipatan 15, jadi FPB-nya 15, yaitu bilangan yang lebih kecil.',x:{t:'FPB dua bilangan boleh lebih besar daripada bilangan yang paling kecil?',o:['Tidak. FPB paling besar sama dengan bilangan yang kecil','Boleh, FPB bisa lebih besar'],b:'Tidak. FPB paling besar sama dengan bilangan yang kecil',p:'FPB adalah faktor dari kedua bilangan, jadi tidak mungkin lebih besar daripada bilangan yang kecil.'}}
];
var r3=0,pil3=[];
function mulaiS3(){r3=0;ronde3()}
function chips3(wadah,n){
  var w=$(wadah);clear(w);
  semuaFaktor(n).forEach(function(v){
    var b=el('button',null,String(v));b.setAttribute('data-v',String(v));
    b.onclick=function(){
      var i=pil3.indexOf(v);if(i>=0)pil3.splice(i,1);else pil3.push(v);
      ['s3a','s3b'].forEach(function(x){var bs=$(x).children;for(var k=0;k<bs.length;k++)if(bs[k].getAttribute('data-v')===String(v))bs[k].classList.toggle('pilih',pil3.indexOf(v)>=0)});
    };
    w.appendChild(b);
  });
}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);pil3=[];
  $('s3na').textContent='Faktor dari '+d.a;$('s3nb').textContent='Faktor dari '+d.b;
  chips3('s3a',d.a);chips3('s3b',d.b);clear($('s3aksi'));$('s3tanya').textContent='';
  var a=$('s3periksa');clear(a);a.className='aksi';tombol(a,'Periksa',periksa3,'utama');
  $('s3next').disabled=true;msg('s3msg','','Ketuk angka yang ada di kedua daftar, lalu tekan Periksa.');setKata('Ketuk faktor yang muncul di kedua daftar.');
}
function periksa3(){
  var d=R3[r3],fa=semuaFaktor(d.a),fb=semuaFaktor(d.b),sama=fa.filter(function(x){return fb.indexOf(x)>=0});
  var benar=pil3.length===sama.length&&sama.every(function(x){return pil3.indexOf(x)>=0});
  if(!benar){
    var kurang=sama.filter(function(x){return pil3.indexOf(x)<0}).length,lebih=pil3.filter(function(x){return sama.indexOf(x)<0}).length;
    msg('s3msg','warn',(kurang?'Masih ada '+kurang+' yang belum dipilih. ':'')+(lebih?lebih+' pilihanmu tidak ada di kedua daftar.':''));return;
  }
  ['s3a','s3b'].forEach(function(x){var bs=$(x).children;for(var k=0;k<bs.length;k++){var v=+bs[k].getAttribute('data-v');bs[k].disabled=true;if(sama.indexOf(v)>=0)bs[k].classList.add('ok')}});
  clear($('s3periksa'));
  var t='Faktor persekutuan '+d.a+' dan '+d.b+': '+sama.join(', ')+'.';msg('s3msg','good',t);setKata(t);
  var st=[{t:'Manakah FPB (faktor persekutuan TERBESAR) dari '+d.a+' dan '+d.b+'?',o:d.o,b:d.o[0],p:d.p}];
  if(d.x)st.push(d.x);
  later(function(){ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false})},1200);
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: kantong rata ---- */
var R4=[{a:16,b:24,x:'pensil',y:'penghapus'},{a:18,b:24,x:'permen',y:'cokelat'},{a:24,b:36,x:'apel',y:'jeruk'},{a:30,b:45,x:'buku',y:'pensil'}];
var r4=0,sdh4=false,ada4=[];
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4],sl=$('s4geser');titik('s4dots',R4.length,r4);sdh4=false;ada4=[];
  sl.min='1';sl.max=String(Math.min(d.a,d.b));sl.step='1';sl.value='1';sl.disabled=false;
  var t='Ada '+d.a+' '+d.x+' dan '+d.b+' '+d.y+'. Bagi rata ke kantong, tanpa sisa. Kantong paling banyak berapa?';$('s4say').textContent=t;setKata(t);
  clear($('s4fak'));clear($('s4aksi'));$('s4tanya').textContent='';$('s4next').disabled=true;
  msg('s4msg','','Geser pegangan untuk mengubah jumlah kantong.');gambar4(1);
}
function gambar4(k){
  var d=R4[r4],qa=Math.floor(d.a/k),qb=Math.floor(d.b/k),sa=d.a%k,sb=d.b%k,w=$('s4kel'),i;
  clear(w);
  for(i=0;i<k;i++)w.appendChild(el('b',null,qa+'+'+qb));
  if(sa>0||sb>0)w.appendChild(el('b','sisa','sisa '+sa+'+'+sb));
  var pas=sa===0&&sb===0;
  $('s4baca').textContent=k+' kantong: '+d.a+' : '+k+' = '+qa+(sa?' sisa '+sa:'')+'; '+d.b+' : '+k+' = '+qb+(sb?' sisa '+sb:'')+(pas?'  (pas!)':'  (ada sisa)');
  return pas;
}
$('s4geser').oninput=function(){
  if(sdh4)return;var d=R4[r4],k=+$('s4geser').value,pas=gambar4(k);
  if(pas&&ada4.indexOf(k)<0){
    ada4.push(k);ada4.sort(function(p,q){return p-q});
    var f=$('s4fak');clear(f);ada4.forEach(function(v){f.appendChild(el('span',null,String(v)))});
  }
  if(pas&&k===gcdN(d.a,d.b)){
    sdh4=true;$('s4geser').disabled=true;
    var t='Pas! '+k+' kantong, tiap kantong '+(d.a/k)+' '+d.x+' dan '+(d.b/k)+' '+d.y+'. Lebih banyak dari '+k+' pasti bersisa.';msg('s4msg','good',t);setKata(t);
    later(function(){ruteSteps('s4aksi','s4tanya','s4msg',[{t:'Jumlah kantong paling banyak ini disebut... dari '+d.a+' dan '+d.b+'?',o:['FPB','KPK','selisih'],b:'FPB',p:'Kantong paling banyak = faktor persekutuan TERBESAR, yaitu FPB.'}],0,function(){$('s4next').disabled=false})},1100);
  }else if(pas)msg('s4msg','good',k+' kantong pas, tetapi apakah ini yang paling banyak? Coba kantong lebih banyak.');
  else msg('s4msg','','Ada sisa. Coba jumlah kantong yang lain.');
};
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: dua lampu, KPK ---- */
var R5=[
  {a:4,b:6,s:[{t:'Pada detik ke berapa kedua lampu PERTAMA kali berkedip bersamaan?',o:['12','24','10'],b:'12',p:'Detik ke-12: kelipatan 4 dan kelipatan 6 pertama yang sama, yaitu KPK.'},
              {t:'FPB 4 dan 6 adalah 2, KPK-nya 12. Berapa FPB × KPK?',o:['24, sama dengan 4 × 6','8','48'],b:'24, sama dengan 4 × 6',p:'2 × 12 = 24 = 4 × 6. FPB × KPK selalu sama dengan hasil kali kedua bilangan.'}]},
  {a:3,b:5,s:[{t:'Pada detik ke berapa kedua lampu PERTAMA kali berkedip bersamaan?',o:['15','8','30'],b:'15',p:'Detik ke-15: 3 × 5.'},
              {t:'3 dan 5 sama-sama prima dan berbeda. KPK-nya...',o:['hasil kali keduanya, 15','jumlah keduanya, 8'],b:'hasil kali keduanya, 15',p:'Dua bilangan prima berbeda tidak punya faktor sama selain 1, jadi KPK = hasil kali.'}]},
  {a:5,b:15,s:[{t:'Pada detik ke berapa kedua lampu PERTAMA kali berkedip bersamaan?',o:['15','75','20'],b:'15',p:'Detik ke-15: 15 kelipatan 5 dan kelipatan 15.'},
              {t:'Mengapa KPK-nya bukan 5 × 15 = 75?',o:['15 sudah kelipatan 5, jadi tidak ada kelipatan bersama lebih kecil dari 15','75 bukan kelipatan 5'],b:'15 sudah kelipatan 5, jadi tidak ada kelipatan bersama lebih kecil dari 15',p:'Jika satu bilangan kelipatan yang lain, KPK-nya adalah bilangan yang lebih besar.'}]},
  {a:6,b:9,s:[{t:'Pada detik ke berapa kedua lampu PERTAMA kali berkedip bersamaan?',o:['18','54','12'],b:'18',p:'Detik ke-18: kelipatan 6 dan kelipatan 9 pertama yang sama. 54 juga sama, tetapi bukan yang terkecil.'},
              {t:'Dengan faktorisasi prima: 6 = 2 × 3 dan 9 = 3 × 3. KPK-nya...',o:['2 × 3 × 3 = 18','2 × 3 × 3 × 3 = 54'],b:'2 × 3 × 3 = 18',p:'Ambil setiap faktor prima sebanyak kemunculan terbanyak: satu 2 dan dua 3 = 18.'}]}
];
var r5=0,jalan5=false;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);jalan5=false;
  var w=$('s5papan');clear(w);w.appendChild(GBR.papan({n:60,kol:10}));
  clear($('s5aksi'));$('s5tanya').textContent='';$('s5next').disabled=true;
  var t='Lampu biru berkedip tiap '+d.a+' detik, lampu kuning tiap '+d.b+' detik.';$('s5say').textContent=t;setKata(t);
  var a=$('s5mulai');clear(a);a.className='aksi';tombol(a,'Nyalakan!',nyala5,'utama hint');
  msg('s5msg','','Biru = kelipatan '+d.a+'. Kuning = kelipatan '+d.b+'. Hijau = berkedip bersamaan.');
}
function nyala5(){
  if(jalan5)return;jalan5=true;
  var d=R5[r5],cs=$('s5papan').firstChild.children;clear($('s5mulai'));
  for(var i=1;i<=60;i++){(function(i){later(function(){
    var a=i%d.a===0,b=i%d.b===0,c=cs[i-1];
    if(a&&b)c.classList.add('ab');else if(a)c.classList.add('a');else if(b)c.classList.add('b');
  },i*70)})(i)}
  later(function(){ruteSteps('s5aksi','s5tanya','s5msg',d.s,0,function(){$('s5next').disabled=false})},60*70+500);
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu paham prima, FPB, dan KPK.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-21'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.faktor({n:12,semua:true}));w.appendChild(el('div','baca','12 = 2 × 2 × 3'));
})();

/* ---- bonus: mesin FPB dan KPK ---- */
function mulaiBonus(){$('bA').value='12';$('bB').value='18';gambarBonus()}
function irisan(pa,pb){var c=pb.slice(),r=[];pa.forEach(function(x){var i=c.indexOf(x);if(i>=0){r.push(x);c.splice(i,1)}});return r}
function gambarBonus(){
  var a=+$('bA').value,b=+$('bB').value,pa=primaDari(a),pb=primaDari(b),ir=irisan(pa,pb),c=pb.slice();
  var un=pa.slice();ir.forEach(function(x){c.splice(c.indexOf(x),1)});un=un.concat(c).sort(function(p,q){return p-q});
  var f=gcdN(a,b),k=lcmN(a,b),w=$('bTanda');
  $('bNilaiA').textContent='Bilangan pertama: '+a;$('bNilaiB').textContent='Bilangan kedua: '+b;
  clear(w);
  [a+' = '+gabung(pa),b+' = '+gabung(pb),
   'FPB = '+(ir.length?gabung(ir)+' = '+f:'1 (tidak ada faktor prima yang sama)'),
   'KPK = '+gabung(un)+' = '+k,
   f+' × '+k+' = '+(f*k)+' = '+a+' × '+b].forEach(function(t,i){w.appendChild(el('div',i===2||i===3?'':null,t))});
  msg('bmsg',f===1?'good':'',f===1?a+' dan '+b+' saling prima: FPB = 1.':'FPB: faktor prima yang SAMA. KPK: semua faktor prima, yang sama dihitung sekali.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC21 = rakit(DASAR, { kode: 'AC-21', data: DATA_AC21 })
