import { rakit } from './bersama'
import { DATA_AC29 } from './latihan/ac29'

/**
 * Materi interaktif AC-29 "Putar dan Ukur Sudut" (jenis sudut, busur derajat,
 * sudut berpenyiku, berpelurus, bertolak belakang, jumlah sudut segitiga dan
 * segiempat, satu putaran penuh). Satu halaman HTML mandiri, ditampilkan lewat
 * iframe sandbox di `/mandiri/materi` dan sebagai langkah Belajar di topik
 * Misi AC-29. Disimpan sebagai string supaya ikut terbundel di build tanpa
 * membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-28 (anak kelas 4-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Busur derajat: putar kaki sudut; lancip (< 90), siku-siku (90), tumpul
 *    (90 sampai 180), lurus (180), refleks (> 180); pilih skala yang tepat
 *    (50 bukan 130); jangan menilai dengan mata (88 bukan siku-siku); panjang
 *    kaki tidak mengubah besar sudut.
 * 2) Penyiku dan pelurus: jumlah 90 dan 180 (65 pasangannya 115, 35
 *    pasangannya 55).
 * 3) Dua garis berpotongan: bertolak belakang sama besar, bersebelahan
 *    berjumlah 180; keempat sudut tidak selalu sama.
 * 4) Segitiga dan segiempat: jumlah 180 dan 360 (segiempat = dua segitiga).
 * 5) Satu putaran dan rancang: sudut mengelilingi titik 360, di satu sisi garis
 *    180; rancang sudut ketiga atau keempat dan tanjakan.
 * Bonus: putar sudut 0 sampai 359, lihat jenis, penyiku, pelurus, dan pelengkap.
 *
 * Soal Misi topik ini menguji: jenis sudut, alat ukur, jumlah sudut segitiga
 * dan segiempat, penyiku, pelurus, bertolak belakang, satu putaran, cerita
 * (jarum jam, tangga, tanjakan), rancang, dan salah paham (kaki lebih panjang
 * berarti sudut lebih besar, membaca skala salah, menilai dengan mata, keempat
 * sudut perpotongan sama, penyiku selalu sama, jumlah segiempat 180).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac29.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-29 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Putar dan Ukur Sudut</title>
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
.kg{display:flex;flex-direction:column;gap:4px;align-items:center;font-family:var(--display);font-weight:800;font-size:1.8rem;min-height:150px;justify-content:center}
.kg .rw{display:flex;gap:6px;justify-content:center;align-items:center}
.kg .c{min-width:2.1em;text-align:center;border-radius:8px;padding:2px 0;font-variant-numeric:tabular-nums;transition:background .3s}
.kg .c.pj{background:var(--soft);color:var(--ikat)}
.kg .c.hs{background:var(--ok);color:#fff;animation:pop .35s}
.kg .gr{height:3px;background:var(--ink);width:100%}
.kg .op{min-width:1.2em;text-align:center;color:var(--muted)}
.tanda{font-family:var(--display);font-weight:800;font-size:1.1rem;text-align:center;line-height:1.8;min-height:3em}
.tanda b{color:var(--ikat)}
.tmp{display:flex;gap:6px;justify-content:center}
.tmp button{border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:6px 12px;font-family:var(--display);font-weight:800;font-size:1rem;cursor:pointer;touch-action:manipulation;min-height:44px}
.tmp button.pilih{border-color:var(--ikat);background:var(--soft)}
.mesin{display:flex;align-items:center;justify-content:center;gap:8px;font-family:var(--display);font-weight:800;font-size:1.6rem;min-height:70px}
.mesin .kt{min-width:54px;height:54px;border-radius:12px;border:3px solid var(--ink);display:flex;align-items:center;justify-content:center;background:var(--card)}
.mesin .ar{display:flex;flex-direction:column;align-items:center;font-size:1rem;color:var(--muted);min-width:76px}
.mesin .ar.balik{color:var(--ok);animation:pop .4s}
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
      <h1>Putar dan Ukur Sudut</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo putar, ukur, dan hitung sudut!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Putar sudutnya.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="180" value="0" aria-label="Besar sudut"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Cari pasangan sudutnya.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Dua garis berpotongan.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Jumlah sudut bangun.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Satu putaran dan rancang.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="alat" id="s5alat"></div><div class="tanda" id="s5tampil"></div></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin sudut</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: putar sudutnya.</p>
    <div class="panel"><div class="alat" id="bGambar"></div><div class="baca" id="bNilai"></div>
      <input type="range" id="bX" min="0" max="359" value="50" aria-label="Besar sudut"></div>
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
  if(id==='intro')setKata('Ayo putar, ukur, dan hitung sudut!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo putar, ukur, dan hitung sudut!');

/* ---- alat bantu ---- */
function uniq(benar,calon){var o=[String(benar)];calon.forEach(function(x){x=String(x);if(o.length<3&&o.indexOf(x)<0&&x.charAt(0)!=='-'&&x!=='0')o.push(x)});var t=1;while(o.length<3){var y=String(+benar+t++);if(o.indexOf(y)<0)o.push(y)}return o}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(s.lihat)s.lihat();
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Lihat gambarnya dan hitung lagi.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
function sd(mode,o){var g={k:'sudut',mode:mode};if(o)for(var q in o)g[q]=o[q];return g}
function jenisSudut(d){return d<90?'lancip':(d===90?'siku-siku':(d<180?'tumpul':(d===180?'lurus':'refleks')))}
function dg(x){return x+'°'}

/* ---- stasiun 1: busur derajat ---- */
var R1=[
  {t:40,x:{t:'Made menggambar dua sudut 50°: satu berkaki panjang, satu berkaki pendek. Mana yang lebih besar?',o:['Sama besar. Panjang kaki tidak mengubah besar sudut','Yang berkaki panjang lebih besar'],b:'Sama besar. Panjang kaki tidak mengubah besar sudut',p:'Besar sudut hanya bergantung pada putaran di antara kedua kaki.'}},
  {t:95,x:{t:'Sinta mengira 95° adalah sudut lancip karena "tidak terlalu besar". Tepatkah?',o:['Tidak. Lebih dari 90° berarti tumpul, apa pun kesan mata','Ya, lancip'],b:'Tidak. Lebih dari 90° berarti tumpul, apa pun kesan mata',p:'Gunakan ukuran: 95° > 90°, jadi tumpul.'}},
  {t:88,x:{t:'Dedi melihat sudut itu dan yakin siku-siku, tetapi terukur 88°. Mengapa Dedi keliru?',o:['Sudut harus diukur dengan busur derajat; 88° kurang dari 90°, jadi lancip','88° tetap siku-siku'],b:'Sudut harus diukur dengan busur derajat; 88° kurang dari 90°, jadi lancip',p:'Mata bisa salah. Hanya 90° tepat yang siku-siku.'}},
  {t:50,x:{t:'Wati membaca 130°, padahal sudutnya lancip. Apa kesalahannya?',o:['Ia membaca skala yang salah; sudut lancip kurang dari 90°, jadi 50°','Bacaannya benar']  ,b:'Ia membaca skala yang salah; sudut lancip kurang dari 90°, jadi 50°',p:'Mulailah dari angka 0 pada kaki yang berimpit dengan garis dasar.'}},
  {t:180,x:{t:'Sudut lebih dari 180° dan kurang dari 360° disebut sudut...',o:['refleks','tumpul','lurus'],b:'refleks',p:'Refleks: antara 180° dan 360°.'}}
];
var r1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='0';sl.max='180';sl.step='1';sl.value='0';sl.disabled=false;
  var t='Putar kaki sudut sampai '+d.t+'°.';$('s1say').textContent=t;setKata(t);
  gambarDi('s1alat',sd('busur',{deg:0}));barisTeks('s1tampil',['0° : '+jenisSudut(0)]);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Baca skala yang dimulai dari 0 pada garis dasar.');
}
var sdh1=false;
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;
  gambarDi('s1alat',sd('busur',{deg:v,lab:v+'°'}));barisTeks('s1tampil',[v+'° : sudut '+jenisSudut(v)]);
  if(v===d.t){
    sdh1=true;$('s1geser').disabled=true;
    var o=d.t===180?['lurus','tumpul','refleks']:['lancip','siku-siku','tumpul'],st=[{t:'Sudut '+d.t+'° termasuk sudut...',o:o,b:jenisSudut(d.t),p:d.t+'° adalah sudut '+jenisSudut(d.t)+'.'}];
    if(d.x)st.push(d.x);
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Putar terus sampai '+d.t+'°.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: penyiku dan pelurus ---- */
var R2=[{j:'pelurus',a:65},{j:'pelurus',a:75},{j:'penyiku',a:35},{j:'penyiku',a:42},{j:'pelurus',a:110}];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2],tot=d.j==='pelurus'?180:90,b=tot-d.a,nm=d.j==='pelurus'?'berpelurus':'berpenyiku';titik('s2dots',R2.length,r2);
  var t='Dua sudut saling '+nm+'. Satu sudut '+d.a+'°. Cari yang satunya.';$('s2say').textContent='Cari pasangan sudutnya.';setKata(t);
  gambarDi('s2alat',sd(d.j,{deg:d.a,labA:d.a+'°',labB:'?'}));barisTeks('s2tampil',[t]);
  var st=[
    {t:'Dua sudut saling '+nm+' jumlahnya...',o:uniq(dg(tot),[dg(tot===180?90:180),'360°']),b:dg(tot),p:(d.j==='pelurus'?'Berpelurus: bersebelahan membentuk garis lurus, jumlah 180°.':'Berpenyiku: bersama membentuk siku-siku, jumlah 90°.')},
    {t:'Berapa sudut yang satunya? ('+tot+' − '+d.a+')',o:uniq(b,[d.a,tot+d.a]),b:String(b),p:tot+' − '+d.a+' = '+b+'°.',lihat:function(){gambarDi('s2alat',sd(d.j,{deg:d.a,labA:d.a+'°',labB:b+'°'}));barisTeks('s2tampil',[d.a+'° + '+b+'° = '+tot+'°'])}}
  ];
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Garis lurus = 180°, sudut siku-siku = 90°.');
  ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: dua garis berpotongan ---- */
var R3=[{A:72,x:true},{A:48},{A:115}];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3],B=180-d.A;titik('s3dots',R3.length,r3);
  var t='Dua garis berpotongan membentuk sudut A = '+d.A+'°.';$('s3say').textContent='Dua garis berpotongan.';setKata(t);
  gambarDi('s3alat',sd('silang',{deg:d.A,labA:'A='+d.A+'°',labB:'B=?',labC:'C=?',labD:'D=?'}));barisTeks('s3tampil',[t,'B bersebelahan dengan A. C bertolak belakang dengan A.']);
  function lab(b,c,dd){return function(){gambarDi('s3alat',sd('silang',{deg:d.A,labA:'A='+d.A+'°',labB:'B='+b,labC:'C='+c,labD:'D='+dd}))}}
  var st=[
    {t:'Sudut B bersebelahan dengan A (berpelurus). B = 180 − '+d.A+' = ?',o:uniq(B,[d.A,B+d.A]),b:String(B),p:'B = '+B+'°.',lihat:lab(B+'°','?','?')},
    {t:'Sudut C bertolak belakang dengan A. C = ?',o:uniq(d.A,[B,360-d.A]),b:String(d.A),p:'Sudut bertolak belakang sama besar: C = '+d.A+'°.',lihat:lab(B+'°',d.A+'°',B+'°')}
  ];
  if(d.x)st.push({t:'Apakah keempat sudut hasil perpotongan selalu sama besar?',o:['Tidak. Hanya sudut yang bertolak belakang yang sama besar','Ya, selalu sama besar'],b:'Tidak. Hanya sudut yang bertolak belakang yang sama besar',p:'Sudut bersebelahan berjumlah 180°, bukan sama besar (kecuali 90°).'});
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Sudut berhadapan sama besar. Sudut bersebelahan berjumlah 180°.');
  ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: segitiga dan segiempat ---- */
var R4=[
  {j:'tri',a:50,b:60},{j:'tri',a:90,b:25},{j:'tri',a:45,b:55},
  {j:'quad',s:[100,85,95]},{j:'quad',s:[80,100,90]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4],st;titik('s4dots',R4.length,r4);
  if(d.j==='tri'){
    var c=180-d.a-d.b,t='Segitiga dengan dua sudut '+d.a+'° dan '+d.b+'°. Cari sudut ketiga.';$('s4say').textContent='Jumlah sudut segitiga.';setKata(t);
    gambarDi('s4alat',sd('segitiga',{a:d.a,b:d.b,labA:d.a+'°',labB:d.b+'°',labC:'?'}));barisTeks('s4tampil',[t]);
    st=[
      {t:'Jumlah ketiga sudut dalam sebarang segitiga adalah...',o:['180°','90°','360°'],b:'180°',p:'Segitiga besar atau kecil, lancip atau tumpul: jumlahnya selalu 180°.'},
      {t:'Sudut ketiga = 180 − '+d.a+' − '+d.b+' = ?',o:uniq(c,[d.a+d.b,180-d.a]),b:String(c),p:'180 − '+d.a+' − '+d.b+' = '+c+'°.',lihat:function(){gambarDi('s4alat',sd('segitiga',{a:d.a,b:d.b,labA:d.a+'°',labB:d.b+'°',labC:c+'°'}));barisTeks('s4tampil',[d.a+' + '+d.b+' + '+c+' = 180'])}}
    ];
  }else{
    var q=d.s,sum=q[0]+q[1]+q[2],e=360-sum,rect=q[0]===90&&q[1]===90&&q[2]===90,t2='Segiempat dengan tiga sudut '+q[0]+'°, '+q[1]+'°, dan '+q[2]+'°. Cari sudut keempat.';$('s4say').textContent='Jumlah sudut segiempat.';setKata(t2);
    gambarDi('s4alat',sd('segiempat',{labA:q[0]+'°',labB:q[1]+'°',labC:q[2]+'°',labD:'?'}));barisTeks('s4tampil',[t2,'(gambar tidak berskala)']);
    st=[
      {t:'Garis diagonal membagi segiempat menjadi dua segitiga. Jumlah sudut segiempat adalah...',o:['360°','180°','270°'],b:'360°',p:'Dua segitiga: 180° + 180° = 360°.',lihat:function(){gambarDi('s4alat',sd('segiempat',{labA:q[0]+'°',labB:q[1]+'°',labC:q[2]+'°',labD:'?',diagonal:true}))}},
      {t:'Sudut keempat = 360 − '+sum+' = ?',o:uniq(e,[180-sum>0?180-sum:sum,sum]),b:String(e),p:'360 − '+sum+' = '+e+'°.',lihat:function(){gambarDi('s4alat',sd('segiempat',{labA:q[0]+'°',labB:q[1]+'°',labC:q[2]+'°',labD:e+'°'}));barisTeks('s4tampil',[q.join(' + ')+' + '+e+' = 360'])}}
    ];
  }
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Segitiga 180°, segiempat 360°.');
  ruteSteps('s4aksi','s4tanya','s4msg',st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: satu putaran dan rancang ---- */
var R5=[
  {j:'putaran',v:[120,150],tot:360,ans:90},
  {j:'putaran',v:[50,80],tot:180,ans:50},
  {j:'tri',a:90,b:35,ans:55},
  {j:'tri',a:100,b:35,ans:45},
  {j:'penyiku',a:62,ans:28}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5],st,t;titik('s5dots',R5.length,r5);
  if(d.j==='putaran'){
    t=d.tot===360?'Tiga sudut mengelilingi satu titik penuh: '+d.v[0]+'°, '+d.v[1]+'°, dan satu lagi.':'Tiga sudut pada satu sisi garis lurus: '+d.v[0]+'°, '+d.v[1]+'°, dan satu lagi.';
    gambarDi('s5alat',sd('putaran',{sudut:[{v:d.v[0],l:dg(d.v[0])},{v:d.v[1],l:dg(d.v[1])},{v:d.ans,l:'?'}]}));
    st=[
      {t:d.tot===360?'Sudut yang mengelilingi satu titik penuh berjumlah...':'Sudut pada satu sisi garis lurus berjumlah...',o:uniq(dg(d.tot),[dg(d.tot===360?180:360),'90°']),b:dg(d.tot),p:d.tot===360?'Satu putaran penuh = 360°.':'Garis lurus = 180°.'},
      {t:'Sudut ketiga = '+d.tot+' − '+d.v[0]+' − '+d.v[1]+' = ?',o:uniq(d.ans,[d.v[0]+d.v[1],d.tot-d.v[0]]),b:String(d.ans),p:d.tot+' − '+(d.v[0]+d.v[1])+' = '+d.ans+'°.',lihat:function(){gambarDi('s5alat',sd('putaran',{sudut:[{v:d.v[0],l:dg(d.v[0])},{v:d.v[1],l:dg(d.v[1])},{v:d.ans,l:dg(d.ans)}]}))}}
    ];
  }else if(d.j==='tri'){
    t='Rancang segitiga: sudut pertama '+d.a+'° dan kedua '+d.b+'°. Berapa sudut ketiga agar jumlahnya tepat 180°?';
    gambarDi('s5alat',sd('segitiga',{a:d.a,b:d.b,labA:d.a+'°',labB:d.b+'°',labC:'?'}));
    st=[
      {t:'Jumlah sudut segitiga adalah...',o:['180°','90°','360°'],b:'180°',p:'Selalu 180°.'},
      {t:'Sudut ketiga = 180 − '+d.a+' − '+d.b+' = ?',o:uniq(d.ans,[d.a+d.b,180-d.a]),b:String(d.ans),p:'180 − '+(d.a+d.b)+' = '+d.ans+'°.',lihat:function(){gambarDi('s5alat',sd('segitiga',{a:d.a,b:d.b,labA:d.a+'°',labB:d.b+'°',labC:d.ans+'°'}))}}
    ];
  }else{
    t='Rancang tanjakan yang membentuk sudut berpenyiku dengan sudut '+d.a+'°, dan harus lancip.';
    gambarDi('s5alat',sd('penyiku',{deg:d.a,labA:d.a+'°',labB:'?'}));
    st=[
      {t:'Dua sudut berpenyiku berjumlah...',o:['90°','180°','360°'],b:'90°',p:'Berpenyiku: 90°.'},
      {t:'Sudut tanjakan = 90 − '+d.a+' = ?',o:uniq(d.ans,[180-d.a,d.a]),b:String(d.ans),p:'90 − '+d.a+' = '+d.ans+'°.',lihat:function(){gambarDi('s5alat',sd('penyiku',{deg:d.a,labA:d.a+'°',labB:d.ans+'°'}))}},
      {t:'Sudut '+d.ans+'° termasuk sudut...',o:['lancip','tumpul','siku-siku'],b:'lancip',p:d.ans+'° kurang dari 90°, jadi lancip.'}
    ];
  }
  $('s5say').textContent='Satu putaran dan rancang.';setKata(t);barisTeks('s5tampil',[t]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Gunakan jumlah yang berlaku: 90°, 180°, atau 360°.');
  ruteSteps('s5aksi','s5tanya','s5msg',st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Sudutmu diukur dengan tepat.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-29'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.petak({n:5}));w.appendChild(el('div','baca','5² = 29'));
})();

/* ---- bonus: mesin sudut ---- */
function mulaiBonus(){$('bX').value='50';gambarBonus()}
function gambarBonus(){
  var v=+$('bX').value,l=[];
  $('bNilai').textContent='Sudut '+v+'°';
  gambarDi('bGambar',sd('satu',{deg:Math.max(v,0.5),lab:v+'°'}));
  l.push('Jenis: sudut '+jenisSudut(v));
  l.push(v<90?'Penyiku: 90° − '+v+'° = '+(90-v)+'°':'Tidak punya penyiku (sudut sudah 90° atau lebih)');
  l.push(v<180?'Pelurus: 180° − '+v+'° = '+(180-v)+'°':'Tidak punya pelurus');
  l.push('Pelengkap satu putaran: 360° − '+v+'° = '+(360-v)+'°');
  barisTeks('bTanda',l);
  msg('bmsg',v===90?'good':'',v===90?'Tepat 90°: sudut siku-siku.':'Putar ke 90° untuk melihat sudut siku-siku.');
}
$('bX').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC29 = rakit(DASAR, { kode: 'AC-29', data: DATA_AC29 })
