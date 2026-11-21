import { rakit } from './bersama'
import { DATA_D11 } from './latihan/d11'

/**
 * Materi interaktif D-11 "Jaring-Jaring Bangun Ruang" (jaring-jaring kubus,
 * balok, prisma segitiga, limas, unsur bangun ruang dan rumus Euler, luas
 * permukaan). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi D-11.
 *
 * Lima stasiun praktik: 1) geser sisi kubus (luas satu persegi dan luas
 * permukaan), 2) valid atau bukan jaring-jaring kubus (renderer `netpetak` di
 * gambar.ts; 5 dan 7 persegi, blok 2x3, enam berjejer, dua menempel di sisi
 * yang sama), 3) jaring-jaring bangun ruang lain, 4) sisi, rusuk, titik
 * sudut, Euler, 5) luas permukaan (balok, prisma, limas, kemasan). Bonus:
 * luas permukaan balok. Lalu tiga stasiun mesin latihan, bahannya di
 * `latihan/d11.ts`.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jaring-Jaring Bangun Ruang</title>
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
      <h1>Jaring-Jaring Bangun Ruang</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo lipat bangun datar menjadi bangun ruang!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser sisi kubus.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Sisi kubus"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Jaring-jaring kubus: valid atau bukan?</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Jaring-jaring bangun ruang.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Sisi, rusuk, dan titik sudut.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Luas permukaan dari jaring-jaring.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: balok bergerak</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: luas permukaan balok.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="2" max="12" step="1" value="8" aria-label="Panjang"><input type="range" id="bB" min="2" max="12" step="1" value="5" aria-label="Lebar"><input type="range" id="bC" min="2" max="12" step="1" value="3" aria-label="Tinggi">
    </div>
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
  if(id==='intro')setKata('Ayo belajar jaring-jaring bangun ruang!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar jaring-jaring bangun ruang!');

/* ---- alat bantu ---- */
function uniq(benar,calon){var o=[String(benar)];calon.forEach(function(x){x=String(x);if(o.length<3&&o.indexOf(x)<0)o.push(x)});var t=1;while(o.length<3){var y=String(+benar+t++);if(o.indexOf(y)<0)o.push(y)}return o}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(s.lihat)s.lihat();
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },(s.o.length===2||s.o.some(function(x){return x.length>18}))?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Ubah ke bentuk yang sama dan hitung lagi.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
function fm(x){return String(Math.round(x*1000)/1000).replace('.',',')}
function rb(n){return titikRibu(n)}
function gcdQ(a,b){return b?gcdQ(b,a%b):a}
function bentukSed(p){if(p%1!==0)return fm(p/100);var g=gcdQ(p,100);return p===0?'0':(100/g===1?String(p/g):(p/g)+'/'+(100/g))}

/* ---- alat bantu jaring ---- */
var NETS={
  salib:[[1,0],[0,1],[1,1],[2,1],[3,1],[1,2]],
  empat:[[0,0],[0,1],[1,1],[2,1],[3,1],[3,2]],
  blok:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]],
  lima:[[1,0],[0,1],[1,1],[2,1],[1,2]],
  tujuh:[[1,0],[0,1],[1,1],[2,1],[3,1],[1,2],[1,3]],
  tangga:[[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]],
  baris:[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]],
  dua:[[1,0],[2,0],[0,1],[1,1],[2,1],[3,1]]
};

/* ---- stasiun 1: sisi kubus, luas persegi, luas permukaan ---- */
var R1=[
  {a:4,mode:'luas',t:'Geser sisi kubus sampai 4 cm.',st:[
    {t:'Kubus punya 6 sisi (persegi) kongruen. Luas satu persegi = 4 × 4 = ?',o:['16 cm²','8 cm²','24 cm²'],b:'16 cm²',p:'Luas persegi = sisi × sisi.'},
    {t:'Jumlah persegi pada jaring-jaring kubus harus tepat...',o:['6','5','8'],b:'6',p:'Sama dengan jumlah sisi kubus.'}]},
  {a:5,mode:'luas',t:'Geser sisi kubus sampai 5 cm.',st:[
    {t:'Luas satu persegi?',o:['25 cm²','20 cm²','10 cm²'],b:'25 cm²',p:'5 × 5.'},
    {t:'Semua persegi pada jaring-jaring kubus harus berukuran...',o:['sama persis (kongruen)','boleh berbeda'],b:'sama persis (kongruen)',p:'Sisi kubus semuanya sama.'}]},
  {a:8,mode:'luas',t:'Geser sisi kubus sampai 8 cm.',st:[
    {t:'Luas satu persegi 64 cm². Jika diketahui luasnya 64 cm², sisi kubus = ?',o:['8 cm','32 cm','16 cm'],b:'8 cm',p:'√64 = 8.'},
    {t:'Luas satu persegi 36 cm². Sisi kubus?',o:['6 cm','18 cm','9 cm'],b:'6 cm',p:'√36 = 6.'}]},
  {a:7,mode:'lp',t:'Geser sisi kubus sampai 7 cm.',st:[
    {t:'Luas permukaan = 6 × 49 = ?',o:['294 cm²','42 cm²','343 cm²'],b:'294 cm²',p:'6 persegi × 49.'},
    {t:'Kubus 12 cm dicat dengan harga Rp50/cm². Biaya = 6 × 144 × 50 = ?',o:['Rp43.200','Rp7.200','Rp14.400'],b:'Rp43.200',p:'864 × 50.'}]},
  {a:9,mode:'lp',t:'Geser sisi kubus sampai 9 cm.',st:[
    {t:'Luas satu persegi = ?',o:['81 cm²','18 cm²','27 cm²'],b:'81 cm²',p:'9 × 9.'},
    {t:'Kubus 9 cm lawan balok 10 × 9 × 8 cm: luas permukaan kubus 486 dan balok 484. Mana lebih banyak karton?',o:['Kubus','Balok'],b:'Kubus',p:'486 > 484.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){
  var d=R1[r1],w=$('s1alat');clear(w);
  w.appendChild(GBR.netpetak({sel:NETS.salib,lab:String(v*v)}));
  barisTeks('s1tampil',['Sisi '+v+' cm: satu persegi = '+(v*v)+' cm²'+(d.mode==='lp'?',  6 persegi = '+(6*v*v)+' cm²':'')]);
}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='1';sl.max='10';sl.step='1';sl.value='2';sl.disabled=false;
  $('s1say').textContent=d.t;setKata(d.t);
  gambar1(2);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Jaring-jaring kubus: 6 persegi yang sama. Luas permukaan = 6 × luas satu persegi.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v===d.a){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good','Sisi '+v+' cm: persegi '+(v*v)+' cm², luas permukaan '+(6*v*v)+' cm².');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai sisi '+d.a+' cm.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: valid atau bukan jaring-jaring kubus? ---- */
var R2=[
  {net:NETS.salib,say:'Empat persegi berjejer, satu di atas dan satu di bawah persegi ke-2 (pola salib).',st:[
    {t:'Jaring-jaring kubus yang valid?',o:['Valid','Tidak valid'],b:'Valid',p:'Bisa dilipat membentuk kubus tanpa tumpang tindih.'}]},
  {net:NETS.empat,say:'Empat persegi berjejer, satu di atas persegi pertama, satu di bawah persegi keempat.',st:[
    {t:'Valid?',o:['Valid','Tidak valid'],b:'Valid',p:'Semua pola 4 berjejer + 1 di atas + 1 di bawah valid.'}]},
  {net:NETS.blok,say:'Dua baris tiga kolom penuh (blok 2 × 3).',st:[
    {t:'Valid?',o:['Tidak valid','Valid'],b:'Tidak valid',p:'Saat dilipat ada sisi yang bertumpuk dan sisi lain kosong.'}]},
  {net:NETS.lima,say:'Lima persegi (salib kecil).',st:[
    {t:'Valid?',o:['Tidak valid; hanya 5 persegi','Valid'],b:'Tidak valid; hanya 5 persegi',p:'Kubus butuh tepat 6 persegi.'}]},
  {net:NETS.tujuh,say:'Tujuh persegi.',st:[
    {t:'Valid?',o:['Tidak valid; terlalu banyak persegi','Valid'],b:'Tidak valid; terlalu banyak persegi',p:'Harus tepat 6.'}]},
  {net:NETS.tangga,say:'Tangga: dua persegi, bergeser, dua persegi, bergeser, dua persegi.',st:[
    {t:'Valid?',o:['Valid','Tidak valid'],b:'Valid',p:'Pola 2-2-2 adalah salah satu dari 11 jaring-jaring kubus.'}]},
  {net:NETS.baris,say:'Enam persegi berjejer dalam satu baris.',st:[
    {t:'Valid?',o:['Tidak valid; sisinya saling menumpuk','Valid'],b:'Tidak valid; sisinya saling menumpuk',p:'Persegi ke-1 dan ke-5 menempati sisi yang sama.'}]},
  {net:NETS.dua,say:'Empat persegi berjejer dan dua persegi menempel di atas persegi ke-2 dan ke-3 (berdampingan).',st:[
    {t:'Valid?',o:['Tidak valid; dua persegi menempati sisi yang sama','Valid'],b:'Tidak valid; dua persegi menempati sisi yang sama',p:'Keduanya akan menumpuk saat dilipat.'},
    {t:'6 persegi kongruen pasti jaring-jaring kubus apa pun susunannya?',o:['Tidak; susunannya juga harus tepat','Ya'],b:'Tidak; susunannya juga harus tepat',p:'Jumlah dan jenis benar belum cukup.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Jaring-jaring kubus: valid atau bukan?';setKata(d.say);
  gambarDi('s2alat',{k:'netpetak',sel:d.net});barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Bayangkan melipat: tidak boleh ada sisi yang bertumpuk.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: jaring-jaring bangun ruang lain ---- */
var R3=[
  {say:'Limas segiempat beralas persegi.',g:{k:'jaring',jenis:'limas'},st:[
    {t:'Jaring-jaringnya tersusun dari...',o:['1 persegi dan 4 segitiga','4 segitiga','1 persegi dan 3 segitiga'],b:'1 persegi dan 4 segitiga',p:'Alas persegi dan 4 sisi tegak segitiga.'},
    {t:'Semua sisi limas segiempat berbentuk segitiga?',o:['Tidak; alasnya persegi','Ya'],b:'Tidak; alasnya persegi',p:'Satu sisi persegi.'}]},
  {say:'Prisma segitiga.',st:[
    {t:'Jaring-jaringnya tersusun dari...',o:['2 segitiga dan 3 persegi panjang','3 segitiga dan 2 persegi panjang','5 segitiga'],b:'2 segitiga dan 3 persegi panjang',p:'Alas dan tutup segitiga; 3 sisi tegak.'},
    {t:'Jumlah seluruh bangun datar pada jaring-jaring prisma segitiga?',o:['5','6','4'],b:'5',p:'2 + 3.'}]},
  {say:'Limas segitiga (bidang empat).',st:[
    {t:'Jaring-jaringnya tersusun dari...',o:['4 segitiga','3 segitiga','1 segitiga dan 3 persegi'],b:'4 segitiga',p:'Semua sisinya segitiga.'},
    {t:'Jaring-jaring 6 segitiga bisa membentuk limas segiempat?',o:['Tidak','Ya'],b:'Tidak',p:'Limas segiempat butuh 1 persegi + 4 segitiga.'}]},
  {say:'Balok.',st:[
    {t:'Jaring-jaring balok tersusun dari...',o:['6 persegi panjang (3 pasang kongruen)','6 persegi panjang yang semuanya berbeda','4 persegi panjang'],b:'6 persegi panjang (3 pasang kongruen)',p:'Sisi berhadapan kongruen.'},
    {t:'Jika ketiga pasang persegi panjangnya kebetulan sama semua, bangunnya...',o:['kubus','balok biasa'],b:'kubus',p:'Sisi sama semua: kubus.'}]},
  {say:'Jaring-jaring balok dengan pasangan 6×4, 6×3, dan 4×3 cm.',st:[
    {t:'Ukuran balok (p × l × t)?',o:['6 × 4 × 3 cm','6 × 6 × 4 cm','4 × 3 × 3 cm'],b:'6 × 4 × 3 cm',p:'Tiga ukuran berbeda muncul pada pasangan sisi.'}]},
  {say:'Jaring-jaring: 2 segitiga + 3 persegi panjang rangkaian yang jumlah dan jenisnya benar.',st:[
    {t:'Apakah pasti membentuk prisma segitiga?',o:['Tidak; susunan penempelannya juga harus benar','Ya, pasti'],b:'Tidak; susunan penempelannya juga harus benar',p:'Urutan menempel menentukan.'}]},
  {say:'Jaring-jaring balok bersisi enam persegi panjang yang semuanya berbeda ukuran.',st:[
    {t:'Bisa membentuk balok?',o:['Tidak; harus ada 3 pasang kongruen','Ya'],b:'Tidak; harus ada 3 pasang kongruen',p:'Sisi balok berhadapan sama.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Jaring-jaring bangun ruang.';setKata(d.say);
  if(d.g)gambarDi('s3alat',d.g);else clear($('s3alat'));
  barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Jaring-jaring: bangun datar yang dilipat jadi bangun ruang.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: sisi, rusuk, titik sudut, Euler ---- */
var R4=[
  {say:'Bagian bangun ruang.',st:[
    {t:'Permukaan datar disebut...',o:['sisi','rusuk','titik sudut'],b:'sisi',p:'Sisi (bidang).'},
    {t:'Garis pertemuan dua sisi disebut...',o:['rusuk','sisi','diagonal'],b:'rusuk',p:'Rusuk.'},
    {t:'Titik pertemuan beberapa rusuk disebut...',o:['titik sudut','rusuk','sisi'],b:'titik sudut',p:'Titik sudut.'}]},
  {say:'Rumus Euler: V − E + F = 2 (titik sudut − rusuk + sisi).',st:[
    {t:'6 titik sudut dan 5 sisi. Rusuk E = V + F − 2 = ?',o:['9','11','13'],b:'9',p:'6 + 5 − 2 = 9.'},
    {t:'4 titik sudut dan 4 sisi. Rusuk?',o:['6','8','4'],b:'6',p:'4 + 4 − 2 = 6.'}]},
  {say:'Limas segiempat.',st:[
    {t:'Titik sudut, rusuk, sisi...',o:['5, 8, 5','5, 9, 5','4, 8, 5'],b:'5, 8, 5',p:'5 − 8 + 5 = 2. Rusuk: 4 di alas + 4 tegak.'},
    {t:'Siswa menghitung E = 9. Kesalahannya?',o:['E seharusnya 8','V seharusnya 6'],b:'E seharusnya 8',p:'5 − 9 + 5 = 1 ≠ 2, jadi ada kesalahan hitung.'}]},
  {say:'Prisma segitiga.',st:[
    {t:'Titik sudut, rusuk, sisi...',o:['6, 9, 5','6, 10, 5','5, 9, 6'],b:'6, 9, 5',p:'6 − 9 + 5 = 2. Rusuk: 3 + 3 + 3.'}]},
  {say:'Kubus dan balok.',st:[
    {t:'Jumlah sisi kubus?',o:['6','8','12'],b:'6',p:'Rusuk 12, titik sudut 8.'},
    {t:'Limas segiempat dan limas segitiga punya jumlah rusuk sama?',o:['Tidak (8 lawan 6)','Ya'],b:'Tidak (8 lawan 6)',p:'Nama sama, bangun berbeda.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Sisi, rusuk, dan titik sudut.';setKata(d.say);
  clear($('s4alat'));barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','V − E + F = 2 berlaku untuk bangun ruang bersisi datar.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: luas permukaan dari jaring-jaring ---- */
var R5=[
  {say:'Balok 8 × 5 × 3 cm.',g:{k:'balok',p:8,l:5,t:3},st:[
    {t:'Tiga pasang sisi: pl + pt + lt = 40 + 24 + 15 = ?',o:['79','158','120'],b:'79',p:'Itu baru separuh.'},
    {t:'Luas permukaan = 2 × 79 = ?',o:['158 cm²','79 cm²','316 cm²'],b:'158 cm²',p:'Tiap pasangan ada dua sisi. Siswa yang menjawab 79 lupa mengalikan 2.'}]},
  {say:'Balok 9 × 4 × 2 cm.',st:[
    {t:'Luas permukaan = 2(36 + 18 + 8) = ?',o:['124 cm²','62 cm²','72 cm²'],b:'124 cm²',p:'2 × 62.'}]},
  {say:'Kado balok 20 × 15 × 10 cm.',st:[
    {t:'Kertas minimal = 2(300 + 200 + 150) = ?',o:['1.300 cm²','650 cm²','3.000 cm²'],b:'1.300 cm²',p:'2 × 650.'}]},
  {say:'Prisma segitiga siku-siku 3, 4, 5 cm; tinggi prisma 10 cm.',st:[
    {t:'2 segitiga: 2 × (½ × 3 × 4) = ?',o:['12','6','24'],b:'12',p:'12 cm².'},
    {t:'3 persegi panjang: (3 + 4 + 5) × 10 = ?',o:['120','60','150'],b:'120',p:'Keliling alas × tinggi.'},
    {t:'Luas permukaan = 12 + 120 = ?',o:['132 cm²','72 cm²','240 cm²'],b:'132 cm²',p:'132 cm².'}]},
  {say:'Kotak cokelat prisma, alas segitiga siku-siku 6, 8, 10 cm; panjang kotak 15 cm.',st:[
    {t:'Alas 2 × 24 = 48; sisi tegak (6 + 8 + 10) × 15 = 360. Total?',o:['408 cm²','384 cm²','432 cm²'],b:'408 cm²',p:'48 + 360.'}]},
  {say:'Limas segiempat beralas persegi 6 cm, tinggi sisi tegak 5 cm.',st:[
    {t:'Alas 36; 4 segitiga 4 × (½ × 6 × 5) = 60. Total?',o:['96 cm²','66 cm²','126 cm²'],b:'96 cm²',p:'36 + 60.'}]},
  {say:'Tenda limas segiempat beralas persegi 4 m, tinggi sisi tegak 3 m. Alas tidak perlu kain.',st:[
    {t:'Kain = 4 × (½ × 4 × 3) = ?',o:['24 m²','40 m²','12 m²'],b:'24 m²',p:'Hanya 4 sisi tegak.'}]},
  {say:'Balok luas permukaan 280 cm², panjang 10, lebar 6.',st:[
    {t:'2(60 + 10t + 6t) = 280 → 16t = 80. Tinggi t = ?',o:['5 cm','8 cm','10 cm'],b:'5 cm',p:'80 : 16.'}]},
  {say:'Bola berdiameter 10 cm dikemas dalam kubus yang pas.',st:[
    {t:'Karton = 6 × 10 × 10 = ?',o:['600 cm²','100 cm²','1.000 cm²'],b:'600 cm²',p:'Sisi kubus 10 cm.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Luas permukaan dari jaring-jaring.';setKata(d.say);
  if(d.g)gambarDi('s5alat',d.g);else clear($('s5alat'));
  barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Luas permukaan = jumlah luas semua bangun datar pada jaring-jaring.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Jaring-jaring kubus: 6 persegi kongruen, susunannya tidak boleh bertumpuk.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-11'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.jaring({jenis:'kubus'}));
})();


/* ---- bonus: luas permukaan balok ---- */
function mulaiBonus(){$('bA').value='8';$('bB').value='5';$('bC').value='3';gambarBonus()}
function gambarBonus(){
  var p=+$('bA').value,l=+$('bB').value,t=+$('bC').value,a=p*l,b=p*t,c=l*t;
  $('bNA').textContent='Panjang '+p+', lebar '+l+', tinggi '+t+' (cm)';
  gambarDi('bGambar',{k:'balok',p:p,l:l,t:t});
  barisTeks('bTanda',['pl + pt + lt = '+a+' + '+b+' + '+c+' = '+(a+b+c),'Luas permukaan = 2 × '+(a+b+c)+' = '+(2*(a+b+c))+' cm²']);
  msg('bmsg','good','Tiga pasang sisi kongruen: kalikan 2.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bC').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D11 = rakit(DASAR, { kode: 'D-11', data: DATA_D11 })
