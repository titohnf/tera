import { rakit } from './bersama'
import { DATA_AC11 } from './latihan/ac11'

/**
 * Materi interaktif AC-11 "Si Kotak Misterius" (Mengisi nilai yang belum
 * diketahui; pra-aljabar). Satu halaman HTML mandiri, ditampilkan lewat iframe
 * sandbox di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-11.
 * Disimpan sebagai string supaya ikut terbundel di build tanpa membaca berkas
 * saat runtime.
 *
 * Gaya sama dengan AC-09 dan AC-10 (anak kelas 3-4, tiap stasiun beranimasi).
 * Gagasan utamanya TIMBANGAN SEIMBANG: apa pun yang dilakukan pada satu sisi
 * harus dilakukan pada sisi lain.
 * 1) Timbangan satu langkah: kantong "?" ditimbang dengan butir; kurangi/tambah/
 *    bagi di KEDUA sisi sampai kantong sendirian (operasi kebalikan). Memilih
 *    "hanya sisi kiri" membuat timbangan miring.
 * 2) Timbangan dua langkah: 3 x kotak + 4 = 19 (kurangi dulu, baru bagi).
 * 3) Pola: pilih aturan, panah aturan muncul, lalu isi bilangan yang hilang
 *    (aturan bukan selalu "tambah": dikali 2, dikali 2 lalu tambah 1).
 * 4) Cerita "mula-mula": pilih kalimat matematikanya, lalu cari kotaknya.
 * Bonus: buat soalmu; geser nilai kotak dan lihat kalimat serta timbangannya.
 *
 * Soal Misi topik ini menguji: arti kotak (bilangan yang belum diketahui, di
 * awal, tengah, atau akhir kalimat), operasi kebalikan untuk tiap bentuk,
 * kalimat dua langkah, memeriksa nilai kotak dengan memasukkannya, pola
 * bilangan beserta aturannya, cerita mula-mula, membuat soal dari nilai kotak,
 * dan salah paham: kotak selalu 0, kotak sama dengan bilangan di sebelahnya,
 * menebak yang "mendekati".
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac11.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Kotak
 * ditulis dengan U+25A1 (□) karena tersedia di hampir semua huruf.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-11 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Si Kotak Misterius</title>
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
@keyframes pergi{0%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-26px) scale(.2)}}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.center{text-align:center}
.besar{font-family:var(--display);font-weight:800;font-size:2.4rem;line-height:1.1;text-align:center;font-variant-numeric:tabular-nums}
.besar .k{display:inline-block;min-width:1.1em;border:3px dashed var(--ikat);border-radius:10px;color:var(--ikat);font-size:.85em;line-height:1.1;padding:0 4px}
.besar .k.buka{border-style:solid;border-color:var(--ok);color:var(--ok);animation:pop .5s}
.aksi{display:grid;gap:10px}
.aksi.pil3{grid-template-columns:repeat(3,1fr)}
.aksi button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.15rem;line-height:1.25;min-height:58px;border-radius:16px;border:2px solid var(--ink);background:var(--card);color:var(--ink);cursor:pointer;box-shadow:0 3px 0 var(--ink);touch-action:manipulation;padding:8px 10px}
.aksi button.utama{background:var(--ikat);color:#fff;font-size:1.3rem}
.aksi button.right{background:var(--ok);border-color:var(--ok);color:#fff;box-shadow:none}
.aksi button.wrong{background:var(--soft);border-color:var(--ikat);box-shadow:none}
.aksi button.hint{animation:denyut 1s infinite}
.tanya{font-family:var(--display);font-weight:800;font-size:1.25rem;text-align:center}
/* timbangan */
.tim{padding-top:6px}
.tim .beam{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:8px solid var(--ink);border-radius:4px;transform-origin:50% 100%;transform:rotate(var(--r,0deg));transition:transform .8s cubic-bezier(.3,1.4,.5,1);padding:0 4px;min-height:112px}
.tim .pan{display:flex;flex-wrap:wrap;gap:4px;align-items:flex-end;justify-content:center;align-content:flex-end;width:46%;min-height:96px;padding:4px 2px;transform:rotate(calc(var(--r,0deg) * -1));transition:transform .8s cubic-bezier(.3,1.4,.5,1)}
.tim .tiang{width:0;height:0;margin:0 auto;border-left:26px solid transparent;border-right:26px solid transparent;border-bottom:44px solid var(--lidi-dark)}
.kt{width:34px;height:38px;border:3px solid var(--ink);border-radius:10px 10px 12px 12px;background:var(--lidi-dark);color:#fff;font-family:var(--display);font-weight:800;font-size:1.3rem;display:flex;align-items:center;justify-content:center}
.kt.buka{background:var(--ok);animation:pop .5s}
.tk{width:18px;height:18px;border-radius:50%;border:3px solid var(--ink);background:var(--ikat)}
.tk.mn{background:transparent;border:3px dashed var(--ikat);position:relative}
.tk.mn::after{content:"\2212";position:absolute;inset:-3px 0 0 0;font-size:.8rem;line-height:16px;text-align:center;color:var(--ikat);font-weight:800}
.tk.baru,.kt.baru{animation:pop .5s}
.tk.pergi,.kt.pergi{animation:pergi .65s forwards}
.chipn{min-width:46px;height:46px;border-radius:50%;border:3px solid var(--ink);background:var(--soft);font-family:var(--display);font-weight:800;font-size:1.3rem;display:flex;align-items:center;justify-content:center}
.chipn.baru{animation:pop .5s}
.chipn.pergi{animation:pergi .65s forwards}
/* pola */
.pol{display:flex;align-items:center;justify-content:center;gap:2px;flex-wrap:nowrap}
.pol .c{width:40px;height:44px;border-radius:12px;border:2px solid var(--ink);background:var(--card);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:800;font-size:1.15rem;flex:none}
.pol .c.q{border:2px dashed var(--ikat);background:var(--soft);color:var(--ikat)}
.pol .c.ok{border-color:var(--ok);color:var(--ok);animation:pop .5s}
.pol .p{width:18px;text-align:center;color:var(--muted);flex:none;opacity:0;transition:opacity .3s}
.pol .p.on{opacity:1;animation:pop .4s}
.aturan{font-family:var(--display);font-weight:800;font-size:1.3rem;text-align:center;color:var(--ikat);min-height:1.6em}
/* cerita */
.cer{background:var(--card);border:2px solid var(--line);border-radius:16px;padding:10px 14px;font-weight:800;font-size:1.1rem}
.cek{font-family:var(--display);font-weight:800;font-size:1.25rem;text-align:center;background:var(--soft);border:2px dashed var(--ok);border-radius:14px;padding:8px 12px}
.cek .ok{color:var(--ok);display:inline-block;animation:pop .5s}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
/* bonus */
input[type=range]{width:100%;accent-color:var(--ikat);height:40px}
.chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.chip{font:inherit;font-weight:800;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:99px;padding:8px 16px;cursor:pointer;min-height:44px;font-size:1.15rem}
.chip.on{border-color:var(--ikat);background:var(--soft)}
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
      <h1>Si Kotak Misterius</h1>
      <div class="panel" style="max-width:340px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo cari bilangan yang bersembunyi di dalam kotak!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: timbangan satu langkah -->
  <section class="screen" id="s1">
    <p class="say">Buat kantong "?" sendirian. Lakukan di kedua sisi!</p>
    <div class="dots" id="s1dots"></div>
    <div class="besar" id="s1soal"></div>
    <div class="panel"><div class="tim"><div class="beam" id="s1beam"><div class="pan" id="s1kiri"></div><div class="pan" id="s1kanan"></div></div><div class="tiang"></div></div></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: timbangan dua langkah -->
  <section class="screen" id="s2">
    <p class="say">Dua langkah: kurangi dulu, baru bagi.</p>
    <div class="dots" id="s2dots"></div>
    <div class="besar" id="s2soal"></div>
    <div class="panel"><div class="tim"><div class="beam" id="s2beam"><div class="pan" id="s2kiri"></div><div class="pan" id="s2kanan"></div></div><div class="tiang"></div></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: pola -->
  <section class="screen" id="s3">
    <p class="say">Temukan aturan polanya, lalu isi yang hilang.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="pol" id="s3pol"></div></div>
    <div class="aturan" id="s3aturan"></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: cerita mula-mula -->
  <section class="screen" id="s4">
    <p class="say">Cerita dengan kotak: berapa mula-mula?</p>
    <div class="dots" id="s4dots"></div>
    <div class="cer" id="s4cerita"></div>
    <div class="panel"><div id="s4bar" style="display:flex;justify-content:center"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi" id="s4aksi"></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: buat soalmu</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih bentuk dan nilai kotak. Lihat kalimatnya.</p>
    <div class="chips" id="bBentuk"></div>
    <div class="panel"><div id="bGambar" style="display:flex;justify-content:center"></div></div>
    <label class="sub" for="bX">Nilai kotak</label>
    <input type="range" id="bX" min="1" max="12" value="7">
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
var KOTAK='□',KALI='×',MIN='−';

/* ---- suara bacaan (tambahan, hanya bila ada suara Indonesia) ---- */
var punyaSuara=false,kata='';
function cekSuara(){
  if(!('speechSynthesis' in window))return;
  var v=window.speechSynthesis.getVoices()||[];
  punyaSuara=v.some(function(x){return (x.lang||'').toLowerCase().indexOf('id')===0});
  $('suara').hidden=!punyaSuara;
}
if('speechSynthesis' in window){cekSuara();window.speechSynthesis.onvoiceschanged=cekSuara}
function setKata(t){kata=t.split(KOTAK).join('kotak')}
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
  if(id==='s1')tim1.mulai();
  if(id==='s2')tim2.mulai();
  if(id==='s3')mulaiS3();
  if(id==='s4')mulaiS4();
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')mulaiBonus();
  if(id==='intro')setKata('Ayo cari bilangan yang bersembunyi di dalam kotak!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo cari bilangan yang bersembunyi di dalam kotak!');

/* ---- timbangan: kalimat dengan kotak diselesaikan dengan operasi kebalikan di KEDUA sisi ---- */
function bangunRonde(f){
  var r={f:f.f,x:0,st:{k:1,p:0,m:0,n:0},langkah:[],teks:''};
  if(f.f==='plus'){r.x=f.b-f.a;r.st={k:1,p:f.a,m:0,n:f.b};r.langkah=[{op:'kurang',v:f.a}];r.teks=KOTAK+' + '+f.a+' = '+f.b}
  else if(f.f==='plusK'){r.x=f.b-f.a;r.st={k:1,p:f.a,m:0,n:f.b};r.langkah=[{op:'kurang',v:f.a}];r.teks=f.a+' + '+KOTAK+' = '+f.b}
  else if(f.f==='minus'){r.x=f.b+f.a;r.st={k:1,p:0,m:f.a,n:f.b};r.langkah=[{op:'tambah',v:f.a}];r.teks=KOTAK+' '+MIN+' '+f.a+' = '+f.b}
  else if(f.f==='kali'){r.x=f.n/f.k;r.st={k:f.k,p:0,m:0,n:f.n};r.langkah=[{op:'bagi',v:f.k}];r.teks=f.k+' '+KALI+' '+KOTAK+' = '+f.n}
  else if(f.f==='kaliTambah'){r.x=(f.n-f.p)/f.k;r.st={k:f.k,p:f.p,m:0,n:f.n};r.langkah=[{op:'kurang',v:f.p},{op:'bagi',v:f.k}];r.teks=f.k+' '+KALI+' '+KOTAK+' + '+f.p+' = '+f.n}
  else if(f.f==='kaliKurang'){r.x=(f.n+f.m)/f.k;r.st={k:f.k,p:0,m:f.m,n:f.n};r.langkah=[{op:'tambah',v:f.m},{op:'bagi',v:f.k}];r.teks=f.k+' '+KALI+' '+KOTAK+' '+MIN+' '+f.m+' = '+f.n}
  r.awal=JSON.parse(JSON.stringify(r.st));
  return r;
}
function bagiTim(id,daftar,lanjut){
  var ri=0,R=null,st=null,li=0,kunci=false,buka=false,jalan=false;
  function bobot(s,x){return s.k*x+s.p-s.m}
  function miring(s,tambahan){
    var L=bobot(s,R.x)+(tambahan||0),d=L-s.n;
    return d===0?0:(d>0?-9:9);
  }
  function gambar(a){
    a=a||{};
    $(id+'beam').style.setProperty('--r',(a.miring!==undefined?a.miring:miring(st))+'deg');
    var kiri=$(id+'kiri'),kanan=$(id+'kanan'),i;clear(kiri);clear(kanan);
    for(i=0;i<st.k;i++){var b=el('span','kt'+(a.pergiBag&&i>=1?' pergi':'')+(buka?' buka':''),buka?String(R.x):'?');kiri.appendChild(b)}
    for(i=0;i<st.p;i++)kiri.appendChild(el('span','tk'+(a.pergiP&&i>=st.p-a.pergiP?' pergi':'')));
    for(i=0;i<st.m;i++)kiri.appendChild(el('span','tk mn'+(a.pergiM?' pergi':'')));
    if(st.n>14){kanan.appendChild(el('span','chipn'+(a.pergiN?' pergi':'')+(a.baruN?' baru':''),String(st.n)))}
    else for(i=0;i<st.n;i++)kanan.appendChild(el('span','tk'+(a.pergiN&&i>=st.n-a.pergiN?' pergi':'')+(a.baruN&&i>=st.n-a.baruN?' baru':'')));
  }
  function mulaiRonde(){
    R=bangunRonde(daftar[ri]);st=JSON.parse(JSON.stringify(R.awal));li=0;kunci=false;buka=false;jalan=false;
    var w=$(id+'dots');clear(w);for(var j=0;j<daftar.length;j++)w.appendChild(el('i',j<=ri?'on':''));
    var so=$(id+'soal');clear(so);
    var bagian=R.teks.split(KOTAK);so.appendChild(document.createTextNode(bagian[0]));so.appendChild(el('span','k',KOTAK));so.appendChild(document.createTextNode(bagian[1]));
    $(id+'next').disabled=true;gambar();tanyaLangkah();
    msg(id+'msg','','Timbangan seimbang. Di dalam kantong ada bilangan misterius.');
  }
  function teksOp(l,kedua){
    var nm=l.op==='kurang'?'Kurangi':l.op==='tambah'?'Tambah':'Bagi';
    return nm+' '+l.v+(kedua?' di kedua sisi':' hanya di sisi kiri');
  }
  function tanyaLangkah(){
    var w=$(id+'aksi'),T=$(id+'tanya');clear(w);w.className='aksi';
    if(li>=R.langkah.length){
      T.textContent='Kantong sudah sendirian. Buka kantongnya!';
      tombol(w,'Buka kantong!',function(){
        buka=true;gambar();
        var so=$(id+'soal').querySelector('.k');so.textContent=String(R.x);so.classList.add('buka');
        var t=KOTAK+' = '+R.x+'. Periksa: '+periksa()+' Cocok!';
        msg(id+'msg','good',t);setKata(t);clear(w);T.textContent='';$(id+'next').disabled=false;
      },'utama hint');
      return;
    }
    var l=R.langkah[li];
    T.textContent=li===0?'Apa yang harus dilakukan agar kantong sendirian?':'Langkah berikutnya?';
    setKata(T.textContent);
    var salahArah=l.op==='kurang'?'Tambah '+l.v+' di kedua sisi':l.op==='tambah'?'Kurangi '+l.v+' di kedua sisi':'Kali '+l.v+' di kedua sisi';
    var opsi=[{t:teksOp(l,true),j:'benar'},{t:teksOp(l,false),j:'miring'},{t:salahArah,j:'arah'}];
    shuffle(opsi).forEach(function(o){
      var b=tombol(w,o.t,function(){
        if(kunci||jalan)return;
        if(o.j==='benar'){kunci=true;b.classList.add('right');terapkan(l)}
        else if(o.j==='miring'){
          jalan=true;b.classList.add('wrong');
          var d=l.op==='kurang'?-l.v:l.op==='tambah'?l.v:0;
          var L=l.op==='bagi'?bobot(st,R.x)/l.v:bobot(st,R.x)+d;
          $(id+'beam').style.setProperty('--r',(L===st.n?0:(L>st.n?-12:12))+'deg');
          var t='Timbangan miring! Kedua sisi harus diperlakukan sama.';msg(id+'msg','warn',t);setKata(t);
          later(function(){gambar();jalan=false},1500);
        }else{
          b.classList.add('wrong');
          var t2='Timbangan tetap seimbang, tetapi kantong belum sendirian. Coba cara lain.';msg(id+'msg','warn',t2);setKata(t2);
        }
      });
    });
  }
  function terapkan(l){
    clear($(id+'aksi'));
    if(l.op==='kurang')gambar({pergiP:l.v,pergiN:l.v});
    else if(l.op==='tambah')gambar({pergiM:true});
    else gambar({pergiBag:true,pergiN:st.n>14?1:st.n-st.n/l.v});
    later(function(){
      if(l.op==='kurang'){st.p-=l.v;st.n-=l.v;gambar()}
      else if(l.op==='tambah'){st.m-=l.v;st.n+=l.v;gambar({baruN:l.v})}
      else{st.k=st.k/l.v;st.n=st.n/l.v;gambar({baruN:st.n<=14?st.n:1})}
      var t=teksOp(l,true)+'. Timbangan tetap seimbang.';
      msg(id+'msg','good',t);setKata(t);li++;kunci=false;
      later(tanyaLangkah,900);
    },700);
  }
  function periksa(){
    var f=daftar[ri];
    if(f.f==='plus')return R.x+' + '+f.a+' = '+f.b+'.';
    if(f.f==='plusK')return f.a+' + '+R.x+' = '+f.b+'.';
    if(f.f==='minus')return R.x+' '+MIN+' '+f.a+' = '+f.b+'.';
    if(f.f==='kali')return f.k+' '+KALI+' '+R.x+' = '+f.n+'.';
    if(f.f==='kaliTambah')return f.k+' '+KALI+' '+R.x+' + '+f.p+' = '+f.n+'.';
    return f.k+' '+KALI+' '+R.x+' '+MIN+' '+f.m+' = '+f.n+'.';
  }
  $(id+'next').onclick=function(){if(ri<daftar.length-1){ri++;mulaiRonde()}else show(lanjut)};
  return {mulai:function(){ri=0;mulaiRonde()}};
}
var tim1=bagiTim('s1',[{f:'plus',a:5,b:12},{f:'plusK',a:9,b:15},{f:'minus',a:4,b:9},{f:'kali',k:6,n:42}],'s2');
var tim2=bagiTim('s2',[{f:'kaliTambah',k:3,p:4,n:19},{f:'kaliTambah',k:2,p:7,n:15},{f:'kaliKurang',k:4,m:3,n:17}],'s3');

/* ---- stasiun 3: pola dan aturannya ---- */
var T3=[
  {s:[5,10,15,null,25],ans:20,aturan:'bertambah 5',lab:'+5',opsi:['bertambah 5','bertambah 4','dikali 2'],salah:[21,30]},
  {s:[50,44,38,32,null],ans:26,aturan:'berkurang 6',lab:'−6',opsi:['berkurang 6','berkurang 5','dibagi 2'],salah:[27,28]},
  {s:[3,6,12,24,null],ans:48,aturan:'dikali 2',lab:'×2',opsi:['dikali 2','ditambah 6','ditambah 3'],salah:[30,36]},
  {s:[2,5,11,23,null],ans:47,aturan:'dikali 2 lalu ditambah 1',lab:'×2 + 1',opsi:['dikali 2 lalu ditambah 1','ditambah 3 terus','dikali 3'],salah:[46,35]}
];
var r3=0,fase3=0;
function mulaiS3(){r3=0;ronde3()}
function gambarPola(isiHilang){
  var d=T3[r3],w=$('s3pol');clear(w);
  d.s.forEach(function(v,i){
    if(i>0)w.appendChild(el('span','p'+(fase3>=1?' on':''),'→'));
    var c=el('span','c'+(v===null&&!isiHilang?' q':'')+(v===null&&isiHilang?' ok':''),v===null?(isiHilang?String(d.ans):'?'):String(v));
    w.appendChild(c);
  });
}
function ronde3(){
  var d=T3[r3];fase3=0;
  titik('s3dots',T3.length,r3);gambarPola(false);
  $('s3aturan').textContent='';$('s3next').disabled=true;
  msg('s3msg','','Lihat dari satu bilangan ke bilangan berikutnya.');
  tanya3();
}
function tanya3(){
  var d=T3[r3],w=$('s3aksi'),T=$('s3tanya');clear(w);w.className='aksi';
  if(fase3===0){
    T.textContent='Apa aturan polanya?';setKata(T.textContent);
    shuffle(d.opsi).forEach(function(o){
      var b=tombol(w,o,function(){
        if(o===d.aturan){
          b.classList.add('right');fase3=1;
          $('s3aturan').textContent='Aturan: '+d.aturan+' ('+d.lab+')';
          var p=$('s3pol').querySelectorAll('.p');
          for(var i=0;i<p.length;i++){(function(i){later(function(){p[i].classList.add('on')},i*250)})(i)}
          var t='Betul! '+d.aturan+'. Sekarang cari bilangan yang hilang.';msg('s3msg','good',t);setKata(t);
          later(tanya3,1100);
        }else{b.classList.add('wrong');var t2='Hampir! Coba hitung dari dua bilangan yang bersebelahan.';msg('s3msg','warn',t2);setKata(t2)}
      });
    });
  }else{
    w.className='aksi pil3';T.textContent='Bilangan yang hilang adalah...';setKata(T.textContent);
    shuffle([d.ans].concat(d.salah)).forEach(function(v){
      var b=tombol(w,String(v),function(){
        if(v===d.ans){
          b.classList.add('right');gambarPola(true);clear(w);T.textContent='';
          var t='Betul! Bilangan yang hilang '+d.ans+'. Pola ini '+d.aturan+'.';msg('s3msg','good',t);setKata(t);$('s3next').disabled=false;
        }else{b.classList.add('wrong');var t2='Hampir! Terapkan aturan "'+d.aturan+'" pada bilangan sebelum kotak.';msg('s3msg','warn',t2);setKata(t2)}
      });
    });
  }
}
$('s3next').onclick=function(){if(r3<T3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: cerita mula-mula ---- */
var T4=[
  {c:'Sebuah tas berisi kelereng. Setelah ditambah 9 kelereng, jumlahnya menjadi 25.',bar:{bagian:[{l:'?',v:16,w:'abu'},{l:'+9',v:9,w:'hijau'}],atas:'25'},eq:[KOTAK+' + 9 = 25',KOTAK+' '+MIN+' 9 = 25','9 '+MIN+' '+KOTAK+' = 25'],ans:16,salah:[34,25],cek:'16 + 9 = 25'},
  {c:'Seorang penjual punya sejumlah apel. Setelah terjual 15 buah, sisanya 23 buah.',bar:{bagian:[{l:'terjual 15',v:15,w:'merah'},{l:'sisa 23',v:23}],atas:'?'},eq:[KOTAK+' '+MIN+' 15 = 23',KOTAK+' + 15 = 23','15 '+MIN+' '+KOTAK+' = 23'],ans:38,salah:[8,28],cek:'38 '+MIN+' 15 = 23'},
  {c:'Made punya sejumlah kelereng. Dibagi rata ke 4 teman, masing-masing dapat 6, dan sisa 2 untuk Made.',bar:{bagian:[{l:'4 '+KALI+' 6 = 24',v:24},{l:'sisa 2',v:2,w:'merah'}],atas:'?'},eq:['4 '+KALI+' 6 + 2 = '+KOTAK,'4 '+KALI+' 6 '+MIN+' 2 = '+KOTAK,'4 + 6 + 2 = '+KOTAK],ans:26,salah:[22,12],cek:'4 '+KALI+' 6 + 2 = 26'},
  {c:'Sebuah tas berisi apel. Setelah dimakan 8 apel, sisanya 14. Berapa apel mula-mula?',bar:{bagian:[{l:'dimakan 8',v:8,w:'merah'},{l:'sisa 14',v:14}],atas:'?'},eq:[KOTAK+' '+MIN+' 8 = 14',KOTAK+' + 8 = 14','8 '+MIN+' '+KOTAK+' = 14'],ans:22,salah:[6,14],cek:'22 '+MIN+' 8 = 14'}
];
var r4=0,fase4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=T4[r4];fase4=0;titik('s4dots',T4.length,r4);
  $('s4cerita').textContent=d.c;setKata(d.c);
  var b=$('s4bar');clear(b);b.appendChild(GBR.bar(d.bar));
  $('s4next').disabled=true;msg('s4msg','','Pilih kalimat matematika yang cocok dengan ceritanya.');
  tanya4();
}
function tanya4(){
  var d=T4[r4],w=$('s4aksi'),T=$('s4tanya');clear(w);w.className='aksi';
  if(fase4===0){
    T.textContent='Kalimat matematikanya?';
    shuffle(d.eq.map(function(x,i){return {x:x,ok:i===0}})).forEach(function(o){
      var b=tombol(w,o.x,function(){
        if(o.ok){b.classList.add('right');fase4=1;var t='Betul! '+o.x+'. Sekarang cari nilai kotaknya.';msg('s4msg','good',t);setKata(t);later(tanya4,900)}
        else{b.classList.add('wrong');var t2='Hampir! Baca ceritanya lagi: bertambah atau berkurang?';msg('s4msg','warn',t2);setKata(t2)}
      });
    });
  }else{
    w.className='aksi pil3';T.textContent='Nilai kotak adalah...';
    shuffle([d.ans].concat(d.salah)).forEach(function(v){
      var b=tombol(w,String(v),function(){
        if(v===d.ans){
          b.classList.add('right');clear(w);T.textContent='';
          var c=el('div','cek');c.appendChild(document.createTextNode('Periksa: '+d.cek+' '));c.appendChild(el('span','ok','✔'));
          w.className='';w.appendChild(c);
          var t=KOTAK+' = '+d.ans+'. '+d.cek+'. Cocok!';msg('s4msg','good',t);setKata(t);$('s4next').disabled=false;
        }else{b.classList.add('wrong');var t2='Hampir! Masukkan angkanya ke kalimat dan periksa.';msg('s4msg','warn',t2);setKata(t2)}
      });
    });
  }
}
$('s4next').onclick=function(){if(r4<T4.length-1){r4++;ronde4()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu pandai mencari bilangan misterius.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-11'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){$('introGambar').appendChild(GBR.timbang({kantong:1,plus:5,minus:0,kanan:12}))})();

/* ---- bonus: buat soalmu ---- */
var BENTUK=[
  {n:KOTAK+' + 5',f:function(x){return {sisi:x+5,kiri:'x + 5',g:{kantong:1,plus:5,minus:0,kanan:x+5}}}},
  {n:'15 + '+KOTAK,f:function(x){return {sisi:15+x,kiri:'15 + x'}}},
  {n:KOTAK+' '+MIN+' 3',f:function(x){return {sisi:x-3,kiri:'x '+MIN+' 3',g:{kantong:1,plus:0,minus:3,kanan:Math.max(0,x-3)}}}},
  {n:'3 '+KALI+' '+KOTAK,f:function(x){return {sisi:3*x,kiri:'3 '+KALI+' x',g:{kantong:3,plus:0,minus:0,kanan:3*x}}}},
  {n:'2 '+KALI+' '+KOTAK+' + 1',f:function(x){return {sisi:2*x+1,kiri:'2 '+KALI+' x + 1',g:{kantong:2,plus:1,minus:0,kanan:2*x+1}}}}
];
var bi=0;
function mulaiBonus(){
  bi=0;var c=$('bBentuk');clear(c);
  BENTUK.forEach(function(b,i){
    var ch=el('button','chip'+(i===0?' on':''),b.n);
    ch.onclick=function(){bi=i;var all=c.children;for(var k=0;k<all.length;k++)all[k].classList.toggle('on',k===i);renderBonus()};
    c.appendChild(ch);
  });
  renderBonus();
}
function renderBonus(){
  if(bi===2&&+$('bX').value<4)$('bX').value='4';
  var x=+$('bX').value,b=BENTUK[bi],r=b.f(x);
  var g=$('bGambar');clear(g);
  if(bi===1){var d=el('div','besar',b.n+' = '+r.sisi);g.appendChild(d)}
  else g.appendChild(GBR.timbang(r.g));
  var tulis=b.n+' = '+r.sisi;
  var t='Kalau nilai kotak '+x+', kalimatnya '+tulis+'. Sebaliknya, dari kalimat itu kamu bisa mencari kotak dengan operasi kebalikan.';
  msg('bmsg','good',t);setKata(t);
}
$('bX').oninput=renderBonus;
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC11 = rakit(DASAR, { kode: 'AC-11', data: DATA_AC11 })
