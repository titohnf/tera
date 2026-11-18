import { rakit } from './bersama'
import { DATA_AC25 } from './latihan/ac25'

/**
 * Materi interaktif AC-25 "Petak, Kubus, dan Akar" (pangkat dua, pangkat tiga,
 * akar kuadrat, akar pangkat tiga). Satu halaman HTML mandiri, ditampilkan
 * lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah Belajar di
 * topik Misi AC-25. Disimpan sebagai string supaya ikut terbundel di build
 * tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-24 (anak kelas 5-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Pangkat dua: geser sisi persegi petak; n pangkat dua = n x n (5 pangkat
 *    dua = 25, bukan 10); luas taman 7 m x 7 m.
 * 2) Pangkat tiga: kubus tersusun dari n lapisan n x n; n pangkat tiga =
 *    n x n x n (4 pangkat tiga = 64, bukan 12); volume kubus rusuk 5 cm.
 * 3) Akar kuadrat: dari luas persegi cari sisinya; akar kuadrat 16 = 4, bukan
 *    16 : 2; akar kuadrat 25 = 5, bukan 12,5.
 * 4) Akar pangkat tiga: dari volume kubus cari rusuk; akar pangkat tiga 64 = 4,
 *    bukan 64 : 3; kolam 1.000 dm kubik berusuk 10 dm.
 * 5) Bilangan desimal: papan 10 x 10; (0,5) pangkat dua = 0,25 dan lebih kecil
 *    dari 0,5; akar kuadrat 0,25 = 0,5 (lebih besar dari 0,25).
 * Bonus: geser bilangan 1 sampai 30; lihat kuadrat, pangkat tiga, dan akarnya.
 *
 * Soal Misi topik ini menguji: arti pangkat dua dan pangkat tiga, akar sebagai
 * operasi kebalikan, bilangan kuadrat dan kubik sempurna, cerita (luas
 * persegi, volume kubus, sisi dari luas), desimal, perbandingan (kuadrat
 * bilangan di atas dan di bawah 1), dan salah paham (kali dengan 2 atau 3,
 * bagi dengan 2 atau 3, akar selalu lebih kecil, pangkat tiga selalu lebih
 * besar dari pangkat dua).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac25.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-25 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Petak Kubus dan Akar</title>
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
      <h1>Petak, Kubus, dan Akar</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo kenali pangkat dua, pangkat tiga, dan akar!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Susun persegi petak.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="1" max="10" value="1" aria-label="Panjang sisi"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Susun kubus lapis demi lapis.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div>
      <input type="range" id="s2geser" min="1" max="6" value="1" aria-label="Panjang sisi"></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Dari luas cari sisinya.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div>
      <input type="range" id="s3geser" min="1" max="12" value="1" aria-label="Panjang sisi"></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Dari volume cari rusuknya.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div>
      <input type="range" id="s4geser" min="1" max="10" value="1" aria-label="Panjang sisi"></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Pangkat dan akar pada desimal.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin pangkat dan akar</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: geser bilangan, lihat pangkat dan akarnya.</p>
    <div class="panel"><div class="baca" id="bNilai"></div><input type="range" id="bX" min="1" max="30" value="9" aria-label="Bilangan"></div>
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
  if(id==='intro')setKata('Ayo kenali pangkat dua, pangkat tiga, dan akar!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo kenali pangkat dua, pangkat tiga, dan akar!');

/* ---- alat bantu ---- */
function ribu(n){return titikRibu(n)}
function uniq(benar,calon){var o=[String(benar)];calon.forEach(function(x){x=String(x);if(o.length<3&&o.indexOf(x)<0)o.push(x)});var t=1;while(o.length<3){var y=String(+benar+t++);if(o.indexOf(y)<0)o.push(y)}return o}
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
var sdh={};
/* pasang pegangan geser untuk stasiun k: gamb(v) menggambar, tampil(v) memberi baris teks, cocok(v) true bila tepat */
function pasang(k,gamb,tampil,cocok,steps){
  var sl=$('s'+k+'geser');
  sl.oninput=function(){
    if(sdh[k])return;var v=+sl.value;gamb(v);barisTeks('s'+k+'tampil',tampil(v));
    if(cocok(v)){
      sdh[k]=true;sl.disabled=true;
      later(function(){ruteSteps('s'+k+'aksi','s'+k+'tanya','s'+k+'msg',steps(),0,function(){$('s'+k+'next').disabled=false})},900);
    }else msg('s'+k+'msg','','Geser pegangan sampai cocok.');
  };
}
function siapGeser(k,maks,awal){
  var sl=$('s'+k+'geser');sdh[k]=false;sl.min='1';sl.max=String(maks);sl.step='1';sl.value=String(awal||1);sl.disabled=false;
  $('s'+k+'next').disabled=true;clear($('s'+k+'aksi'));$('s'+k+'tanya').textContent='';
}

/* ---- stasiun 1: pangkat dua ---- */
var R1=[
  {n:5,x:{t:'Made menulis 5² = 5 × 2 = 10. Tepatkah?',o:['Tidak. 5² berarti 5 × 5 = 25','Ya, 5 × 2 = 10'],b:'Tidak. 5² berarti 5 × 5 = 25',p:'Pangkat dua berarti dikalikan dengan DIRINYA SENDIRI, bukan dengan 2.'}},
  {n:6},
  {n:7,q:'Taman berbentuk persegi, sisinya 7 meter. Berapa luasnya (meter persegi)?'},
  {n:8,q:'Persegi bersisi 8 cm. Berapa luasnya (cm persegi)?'}
];
var r1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1];titik('s1dots',R1.length,r1);siapGeser(1,10,1);
  var t=d.q||'Susun persegi '+d.n+' × '+d.n+' petak.';$('s1say').textContent=d.q?'Susun persegi sesuai sisinya.':t;setKata(t);
  gambarDi('s1alat',{k:'petak',n:1});barisTeks('s1tampil',[d.q||'Geser sampai sisinya '+d.n+'.']);
  msg('s1msg','','Banyak petak dalam persegi = sisi × sisi.');
  pasang(1,function(v){gambarDi('s1alat',{k:'petak',n:v})},function(v){return [v+' × '+v+' = '+(v*v)+' petak']},function(v){return v===d.n},function(){
    var st=[{t:d.q?'Berapa luasnya?':'Berapa '+d.n+' pangkat dua ('+d.n+'²)?',o:uniq(d.n*d.n,[d.n*2,d.n*3]),b:String(d.n*d.n),p:d.n+'² = '+d.n+' × '+d.n+' = '+(d.n*d.n)+'.'}];
    if(d.x)st.push(d.x);return st;
  });
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: pangkat tiga ---- */
var R2=[
  {n:4,x:{t:'Wati menulis 4³ = 4 × 3 = 12. Tepatkah?',o:['Tidak. 4³ berarti 4 × 4 × 4 = 64','Ya, 4 × 3 = 12'],b:'Tidak. 4³ berarti 4 × 4 × 4 = 64',p:'Pangkat tiga berarti dikalikan dengan dirinya sendiri sebanyak TIGA kali.'}},
  {n:2},
  {n:3,x:{t:'Rian menulis 3³ = 3 × 3 = 9. Apa yang salah?',o:['Itu hasil 3 pangkat DUA; 3³ = 3 × 3 × 3 = 27','Tidak ada yang salah'],b:'Itu hasil 3 pangkat DUA; 3³ = 3 × 3 × 3 = 27',p:'Ada tiga faktor 3, bukan dua.'}},
  {n:5,q:'Kubus berusuk 5 cm. Berapa volumenya (cm kubik)?'}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);siapGeser(2,6,1);
  var t=d.q||'Susun kubus '+d.n+' × '+d.n+' × '+d.n+'.';$('s2say').textContent=d.q?'Susun kubus sesuai rusuknya.':t;setKata(t);
  gambarDi('s2alat',{k:'lapis',n:1});barisTeks('s2tampil',[d.q||'Geser sampai rusuknya '+d.n+'.']);
  msg('s2msg','','Kubus tersusun dari lapisan-lapisan yang sama.');
  pasang(2,function(v){gambarDi('s2alat',{k:'lapis',n:v})},function(v){return [v+' lapisan, tiap lapisan '+v+' × '+v+' = '+(v*v),v+' × '+v+' × '+v+' = '+(v*v*v)+' kubus kecil']},function(v){return v===d.n},function(){
    var st=[{t:d.q?'Berapa volumenya?':'Berapa '+d.n+' pangkat tiga ('+d.n+'³)?',o:uniq(d.n*d.n*d.n,[d.n*3,d.n*d.n]),b:String(d.n*d.n*d.n),p:d.n+'³ = '+d.n+' × '+d.n+' × '+d.n+' = '+(d.n*d.n*d.n)+'.'}];
    if(d.x)st.push(d.x);return st;
  });
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: akar kuadrat ---- */
var R3=[
  {a:16,s:4,w:'8',x:{t:'Rian membagi 16 dengan 2 dan mendapat 8. Tepatkah?',o:['Tidak. 8 × 8 = 64, bukan 16; akar kuadrat 16 adalah 4','Ya, akar kuadrat adalah dibagi 2'],b:'Tidak. 8 × 8 = 64, bukan 16; akar kuadrat 16 adalah 4',p:'Akar kuadrat adalah bilangan yang dikali dirinya sendiri menghasilkan 16, bukan hasil bagi dengan 2.'}},
  {a:49,s:7,w:'24,5'},{a:81,s:9,w:'40,5'},
  {a:25,s:5,w:'12,5',x:{t:'Sinta menjawab 12,5 untuk akar kuadrat 25. Mengapa salah?',o:['Karena 12,5 × 12,5 bukan 25','Karena 12,5 bukan bilangan bulat'],b:'Karena 12,5 × 12,5 bukan 25',p:'Periksa dengan mengalikan hasilnya dengan dirinya sendiri.'}},
  {a:100,s:10,w:'50',q:'Taman persegi luasnya 100 meter persegi. Berapa panjang sisinya (meter)?'}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);siapGeser(3,12,1);
  var t=d.q||'Persegi luasnya '+d.a+' petak. Cari sisinya.';$('s3say').textContent=t;setKata(t);
  gambarDi('s3alat',{k:'petak',n:1});barisTeks('s3tampil',['Target luas: '+d.a]);
  msg('s3msg','','Cari sisi yang jika dikali dirinya sendiri sama dengan '+d.a+'.');
  pasang(3,function(v){gambarDi('s3alat',{k:'petak',n:v})},function(v){var h=v*v;return ['Target luas: '+d.a,v+' × '+v+' = '+h+(h<d.a?' (kurang)':(h>d.a?' (terlalu besar)':' (pas!)'))]},function(v){return v*v===d.a},function(){
    var st=[{t:'Berapa akar kuadrat dari '+d.a+' (√'+d.a+')?',o:uniq(d.s,[d.w,d.s*2]),b:String(d.s),p:'√'+d.a+' = '+d.s+', karena '+d.s+' × '+d.s+' = '+d.a+'.'}];
    if(d.x)st.push(d.x);return st;
  });
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: akar pangkat tiga ---- */
var R4=[
  {v:8,s:2,w:'2,67'},{v:27,s:3,w:'9',x:{t:'Sinta membagi 27 dengan 3 dan mendapat 9. Tepatkah?',o:['Tidak. 9 × 9 × 9 bukan 27; akar pangkat tiga 27 adalah 3','Ya, dibagi 3'],b:'Tidak. 9 × 9 × 9 bukan 27; akar pangkat tiga 27 adalah 3',p:'Akar pangkat tiga adalah bilangan yang dikalikan tiga kali dirinya menghasilkan 27.'}},
  {v:64,s:4,w:'21,3'},{v:125,s:5,w:'41,7'},
  {v:1000,s:10,w:'333,3',q:'Kolam berbentuk kubus bervolume 1.000 dm kubik. Berapa panjang rusuknya (dm)?'}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);siapGeser(4,10,1);
  var t=d.q||'Kubus bervolume '+d.v+' kubus kecil. Cari rusuknya.';$('s4say').textContent=t;setKata(t);
  gambarDi('s4alat',{k:'lapis',n:1});barisTeks('s4tampil',['Target volume: '+ribu(d.v)]);
  msg('s4msg','','Cari rusuk yang jika dikali tiga kali dirinya sama dengan '+ribu(d.v)+'.');
  pasang(4,function(v){if(v<=6)gambarDi('s4alat',{k:'lapis',n:v});else clear($('s4alat'))},function(v){var h=v*v*v;return ['Target volume: '+ribu(d.v),v+' × '+v+' × '+v+' = '+ribu(h)+(h<d.v?' (kurang)':(h>d.v?' (terlalu besar)':' (pas!)'))]},function(v){return v*v*v===d.v},function(){
    var st=[{t:'Berapa akar pangkat tiga dari '+ribu(d.v)+'?',o:uniq(d.s,[d.w,d.s*3]),b:String(d.s),p:'∛'+ribu(d.v)+' = '+d.s+', karena '+d.s+' × '+d.s+' × '+d.s+' = '+ribu(d.v)+'.'}];
    if(d.x)st.push(d.x);return st;
  });
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: desimal ---- */
var R5=[
  {isi:5,say:'Papan 10 × 10 petak dianggap 1. Warnai 0,5 × 0,5.',steps:[
    {t:'Berapa (0,5) pangkat dua?',o:['0,25','1','0,55'],b:'0,25',p:'Blok 5 × 5 = 25 dari 100 petak, yaitu 0,25. Bukan 0,5 × 2 = 1.'},
    {t:'Hasil (0,5)² dibandingkan 0,5 adalah...',o:['lebih kecil dari 0,5','lebih besar dari 0,5'],b:'lebih kecil dari 0,5',p:'Bilangan di bawah 1 jika dikuadratkan menjadi lebih kecil.'}]},
  {isi:3,say:'Warnai 0,3 × 0,3 pada papan.',steps:[{t:'Berapa (0,3) pangkat dua?',o:['0,09','0,6','0,9'],b:'0,09',p:'Blok 3 × 3 = 9 dari 100 petak = 0,09.'}]},
  {isi:5,say:'Blok 25 petak tersusun dari sisi berapa? Cari akar kuadrat 0,25.',steps:[
    {t:'Berapa akar kuadrat dari 0,25?',o:['0,5','0,125','0,05'],b:'0,5',p:'0,5 × 0,5 = 0,25. Bukan 0,25 : 2 = 0,125.'},
    {t:'Akar kuadrat 0,25 (yaitu 0,5) dibandingkan 0,25 adalah...',o:['lebih besar dari 0,25','lebih kecil dari 0,25'],b:'lebih besar dari 0,25',p:'Untuk bilangan di bawah 1, akar kuadrat justru lebih besar.'}]},
  {isi:7,say:'Blok 49 petak. Cari akar kuadrat 0,49.',steps:[{t:'Berapa akar kuadrat dari 0,49?',o:['0,7','0,245','0,07'],b:'0,7',p:'0,7 × 0,7 = 0,49.'}]},
  {isi:4,say:'Blok 16 petak. Cari akar kuadrat 0,16.',steps:[{t:'Berapa akar kuadrat dari 0,16?',o:['0,4','0,04','0,08'],b:'0,4',p:'0,4 × 0,4 = 0,16.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent=d.say;setKata(d.say);
  gambarDi('s5alat',{k:'petak',n:10,isi:d.isi});barisTeks('s5tampil',['Blok '+d.isi+' × '+d.isi+' = '+(d.isi*d.isi)+' petak dari 100']);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Satu papan 10 × 10 bernilai 1. Tiap petak 0,01.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.steps,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Pangkat dan akar sudah akrab.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-25'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.petak({n:5}));w.appendChild(el('div','baca','5² = 25'));
})();

/* ---- bonus: mesin pangkat dan akar ---- */
function mulaiBonus(){$('bX').value='9';gambarBonus()}
function gambarBonus(){
  var x=+$('bX').value,a=Math.floor(Math.sqrt(x)),c=Math.round(Math.pow(x,1/3)),l=[];
  $('bNilai').textContent='Bilangan '+x;
  l.push(x+'² = '+x+' × '+x+' = '+ribu(x*x));
  l.push(x+'³ = '+x+' × '+x+' × '+x+' = '+ribu(x*x*x));
  l.push(a*a===x?'√'+x+' = '+a+' (pangkat dua sempurna)':'√'+x+' di antara '+a+' dan '+(a+1)+' (bukan pangkat dua sempurna)');
  l.push(c*c*c===x?'∛'+x+' = '+c+' (pangkat tiga sempurna)':'∛'+x+' bukan bilangan bulat');
  barisTeks('bTanda',l);
  msg('bmsg',a*a===x||c*c*c===x?'good':'',a*a===x?x+' adalah '+a+' × '+a+'.':'Coba geser ke 16, 25, 27, atau 64.');
}
$('bX').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC25 = rakit(DASAR, { kode: 'AC-25', data: DATA_AC25 })
