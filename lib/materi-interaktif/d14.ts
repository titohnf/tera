import { rakit } from './bersama'
import { DATA_D14 } from './latihan/d14'

/**
 * Materi interaktif D-14 "Sistem Persamaan Linear" (SPLDV: istilah, memeriksa
 * pasangan, grafik, eliminasi langsung dan dengan perkalian, substitusi,
 * soal cerita). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox
 * di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi D-14.
 *
 * Lima stasiun praktik: 1) geser x sampai dua garis bertemu (renderer
 * `kartesius` dengan dua garis berwarna), 2) istilah dan memeriksa pasangan
 * pada KEDUA persamaan, 3) eliminasi langsung (sama tanda: kurang; berlawanan:
 * jumlah), 4) eliminasi dengan mengalikan kedua ruas, 5) substitusi dan cerita
 * (buku dan pensil, umur, uang, kaos dan celana). Bonus: pilih penyelesaian
 * dan lihat sistemnya. Lalu tiga stasiun mesin latihan, bahannya di
 * `latihan/d14.ts`.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sistem Persamaan Linear</title>
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
      <h1>Sistem Persamaan Linear</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo temukan titik temu dua garis!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser x.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Nilai x"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Istilah dan memeriksa pasangan.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Eliminasi langsung.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Eliminasi dengan mengalikan.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Substitusi dan soal cerita.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: dua garis bertemu</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih penyelesaian, lihat sistemnya.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="1" max="9" step="1" value="5" aria-label="x"><div class="baca" id="bNB"></div><input type="range" id="bB" min="1" max="9" step="1" value="3" aria-label="y">
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
  if(id==='intro')setKata('Ayo belajar sistem persamaan linear!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar sistem persamaan linear!');

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

/* ---- alat bantu garis ---- */
function mn(n){return String(n).replace('-','−')}
function garisPot(m,c,r,w){
  var xa=m===0?-r:(-r-c)/m,xb=m===0?r:(r-c)/m,x1=Math.max(-r,Math.min(xa,xb)),x2=Math.min(r,Math.max(xa,xb));
  if(m===0){x1=-r;x2=r}
  return [x1,m*x1+c,x2,m*x2+c,w];
}

/* ---- stasiun 1: geser x sampai kedua garis bertemu ---- */
var R1=[
  {e1:'x + y = 5',e2:'2x − y = 1',m1:-1,c1:5,m2:2,c2:-1,tg:2,r:6,mx:5,t:'Geser x sampai kedua garis bertemu.',st:[
    {t:'Kedua garis bertemu di (2, 3). Apakah (2, 3) memenuhi x + y = 5 dan 2x − y = 1?',o:['Ya, kedua-duanya (2+3 = 5 dan 4−3 = 1)','Hanya yang pertama'],b:'Ya, kedua-duanya (2+3 = 5 dan 4−3 = 1)',p:'Penyelesaian SPLDV memenuhi KEDUA persamaan.'},
    {t:'Apakah (1, 4) penyelesaian sistem ini?',o:['Bukan; hanya memenuhi persamaan pertama (1+4 = 5, tetapi 2−4 = −2 ≠ 1)','Ya'],b:'Bukan; hanya memenuhi persamaan pertama (1+4 = 5, tetapi 2−4 = −2 ≠ 1)',p:'Titik itu ada pada satu garis saja.'}]},
  {e1:'x + y = 10',e2:'x − y = 2',m1:-1,c1:10,m2:1,c2:-2,tg:6,r:10,mx:10,t:'Geser x sampai kedua garis bertemu.',st:[
    {t:'Titik temunya (6, 4). Jadi x dan y?',o:['x = 6, y = 4','x = 4, y = 6','x = 8, y = 2'],b:'x = 6, y = 4',p:'6 + 4 = 10 dan 6 − 4 = 2.'},
    {t:'SPLDV yang penyelesaiannya satu pasangan berarti kedua garis...',o:['berpotongan di satu titik','sejajar','berimpit'],b:'berpotongan di satu titik',p:'Titik potong tunggal.'}]},
  {e1:'y = 2x + 1',e2:'3x + y = 16',m1:2,c1:1,m2:-3,c2:16,tg:3,r:8,mx:6,t:'Geser x sampai kedua garis bertemu.',st:[
    {t:'Titik temunya (3, 7). Periksa pada y = 2x + 1: 2(3) + 1 = ?',o:['7','6','8'],b:'7',p:'Cocok dengan y = 7.'}]},
  {e1:'2x + y = 11',e2:'x + y = 7',m1:-2,c1:11,m2:-1,c2:7,tg:4,r:8,mx:7,t:'Geser x sampai kedua garis bertemu.',st:[
    {t:'Titik temunya (4, 3). Periksa 2(4) + 3 = ?',o:['11','10','12'],b:'11',p:'Dan 4 + 3 = 7.'},
    {t:'Metode grafik dilakukan dengan...',o:['menggambar kedua garis dan mencari titik potongnya','menghitung luas daerah'],b:'menggambar kedua garis dan mencari titik potongnya',p:'Titik potong = penyelesaian.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){
  var d=R1[r1],y1=d.m1*v+d.c1,y2=d.m2*v+d.c2;
  gambarDi('s1alat',{k:'kartesius',r:d.r,garis:[garisPot(d.m1,d.c1,d.r,'biru'),garisPot(d.m2,d.c2,d.r,'merah')],titik:[{x:v,y:y1,w:'biru',l:''},{x:v,y:y2,w:'merah',l:''}]});
  barisTeks('s1tampil',['x = '+v+':  '+d.e1+' → y = '+mn(y1)+',   '+d.e2+' → y = '+mn(y2)+(y1===y2?'  (bertemu!)':'')]);
}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='0';sl.max=String(d.mx);sl.step='1';sl.value='0';sl.disabled=false;
  $('s1say').textContent=d.e1+'  dan  '+d.e2;setKata(d.t);
  gambar1(0);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','',d.t);
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v===d.tg){
    sdh1=true;$('s1geser').disabled=true;
    var y=d.m1*v+d.c1;msg('s1msg','good','Kedua garis bertemu di ('+v+', '+y+'): itulah penyelesaiannya.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai kedua titik berimpit.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: istilah dan memeriksa pasangan ---- */
var R2=[
  {say:'SPLDV.',st:[
    {t:'SPLDV adalah...',o:['gabungan dua persamaan linear yang masing-masing memuat dua variabel','satu persamaan dengan dua pangkat'],b:'gabungan dua persamaan linear yang masing-masing memuat dua variabel',p:'Sistem Persamaan Linear Dua Variabel.'},
    {t:'Bentuk umum persamaan linear dua variabel: ax + by = ...',o:['c','x','0'],b:'c',p:'a, b, c konstanta.'},
    {t:'Penyelesaian SPLDV memenuhi...',o:['kedua persamaan sekaligus','salah satu persamaan'],b:'kedua persamaan sekaligus',p:'Bukan hanya satu.'}]},
  {say:'Sistem x + y = 12 dan x − y = 4.',st:[
    {t:'Apakah (8, 4) penyelesaiannya?',o:['Ya; 8 + 4 = 12 dan 8 − 4 = 4','Tidak'],b:'Ya; 8 + 4 = 12 dan 8 − 4 = 4',p:'Kedua persamaan terpenuhi.'},
    {t:'Apakah (9, 3) penyelesaiannya?',o:['Bukan; 9 + 3 = 12 tetapi 9 − 3 = 6 ≠ 4','Ya'],b:'Bukan; 9 + 3 = 12 tetapi 9 − 3 = 6 ≠ 4',p:'Hanya memenuhi satu persamaan.'}]},
  {say:'Sistem 2x + y = 13 dan x − y = 2.',st:[
    {t:'Apakah (5, 3) penyelesaiannya?',o:['Ya; 10 + 3 = 13 dan 5 − 3 = 2','Tidak'],b:'Ya; 10 + 3 = 13 dan 5 − 3 = 2',p:'Periksa dua-duanya.'}]},
  {say:'Metode substitusi dan eliminasi.',st:[
    {t:'Substitusi: ...',o:['mengubah satu persamaan menjadi x = ... atau y = ..., lalu memasukkannya ke persamaan lain','menjumlahkan semua persamaan'],b:'mengubah satu persamaan menjadi x = ... atau y = ..., lalu memasukkannya ke persamaan lain',p:'Ganti variabel.'},
    {t:'Eliminasi: ...',o:['menghilangkan satu variabel dengan menjumlah atau mengurangkan persamaan','mengganti variabel dengan angka'],b:'menghilangkan satu variabel dengan menjumlah atau mengurangkan persamaan',p:'Hilangkan satu variabel.'}]},
  {say:'Dari x + y = 7.',st:[
    {t:'Menyatakan y dalam x: y = ...',o:['7 − x','7 + x','x − 7'],b:'7 − x',p:'Pindah ruas membalik operasi.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Istilah dan memeriksa pasangan.';setKata(d.say);
  clear($('s2alat'));barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Penyelesaian harus memenuhi KEDUA persamaan.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: eliminasi langsung ---- */
var R3=[
  {say:'x + y = 16 dan x − y = 4.',st:[
    {t:'Koefisien y berlawanan tanda (+1 dan −1). Operasi?',o:['jumlahkan','kurangkan'],b:'jumlahkan',p:'y hilang: 2x = 20.'},
    {t:'x = ?',o:['10','20','6'],b:'10',p:'20 : 2.'},
    {t:'y = 16 − 10 = ?',o:['6','26','4'],b:'6',p:'Periksa: 10 − 6 = 4.'}]},
  {say:'x + y = 10 dan x − y = 2.',st:[
    {t:'Dijumlahkan: 2x = 12. x dan y?',o:['6 dan 4','5 dan 5','8 dan 2'],b:'6 dan 4',p:'y = 10 − 6 = 4.'}]},
  {say:'2x + y = 11 dan x + y = 7.',st:[
    {t:'Koefisien y sama tanda dan sama besar. Operasi?',o:['kurangkan','jumlahkan'],b:'kurangkan',p:'Dikurang: x = 4.'},
    {t:'y = 7 − 4 = ?',o:['3','11','4'],b:'3',p:'(4, 3).'}]},
  {say:'3x + y = 19 dan x + y = 9.',st:[
    {t:'Dikurangkan: 2x = 10. x dan y?',o:['5 dan 4','4 dan 5','9 dan 0'],b:'5 dan 4',p:'y = 9 − 5 = 4.'}]},
  {say:'Siswa menjumlahkan 4x + 2y = 14 dan x + 2y = 5 untuk menghilangkan y.',st:[
    {t:'Tepatkah?',o:['Tidak; koefisien y sama tanda, seharusnya DIKURANGKAN','Tepat'],b:'Tidak; koefisien y sama tanda, seharusnya DIKURANGKAN',p:'Dijumlah malah menjadi 4y.'}]},
  {say:'5x + 3y = 29 dan 5x − 3y = 1; siswa mengurangkan untuk menghilangkan y.',st:[
    {t:'Tepatkah?',o:['Tidak; koefisien y berlawanan tanda, seharusnya DIJUMLAHKAN','Tepat'],b:'Tidak; koefisien y berlawanan tanda, seharusnya DIJUMLAHKAN',p:'Dikurang justru menggandakan 3y menjadi 6y.'}]},
  {say:'Aturan tanda.',st:[
    {t:'Koefisien SAMA tanda dan sama besar: ...',o:['kurangkan','jumlahkan'],b:'kurangkan',p:'Sama tanda: kurang.'},
    {t:'Koefisien BERLAWANAN tanda dan sama besar: ...',o:['jumlahkan','kurangkan'],b:'jumlahkan',p:'Berlawanan tanda: jumlah.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Eliminasi langsung.';setKata(d.say);
  clear($('s3alat'));barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Sama tanda: kurangkan. Berlawanan tanda: jumlahkan.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: eliminasi dengan mengalikan ---- */
var R4=[
  {say:'2x + 3y = 16 dan x + 2y = 9.',st:[
    {t:'Koefisien x berbeda (2 dan 1). Langkah tepat?',o:['kalikan persamaan kedua dengan 2: 2x + 4y = 18','kurangkan langsung'],b:'kalikan persamaan kedua dengan 2: 2x + 4y = 18',p:'Samakan koefisien x dulu.'},
    {t:'(2x + 4y = 18) dikurangi (2x + 3y = 16): y = ?',o:['2','34','1'],b:'2',p:'y = 2.'},
    {t:'x = 9 − 2(2) = ?',o:['5','7','4'],b:'5',p:'(5, 2).'}]},
  {say:'3x + 4y = 25 dan 2x + y = 10.',st:[
    {t:'Samakan koefisien y: kalikan persamaan kedua dengan 4: 8x + 4y = 40. Kurangkan 3x + 4y = 25: 5x = ?',o:['15','65','5'],b:'15',p:'x = 3.'},
    {t:'y = 10 − 2(3) = ?',o:['4','16','6'],b:'4',p:'(3, 4).'}]},
  {say:'3x + 5y = 31 dan x + 2y = 12.',st:[
    {t:'Kalikan persamaan kedua dengan 3: 3x + 6y = 36. Dikurangi 3x + 5y = 31: y = ?',o:['5','67','1'],b:'5',p:'y = 5.'},
    {t:'x = 12 − 2(5) = ?',o:['2','22','7'],b:'2',p:'(2, 5).'}]},
  {say:'4x + 3y = 23 dan x + y = 6.',st:[
    {t:'Kalikan persamaan kedua dengan 3: 3x + 3y = 18. Dikurangi: x = ?',o:['5','41','1'],b:'5',p:'4x − 3x = 23 − 18 = 5.'},
    {t:'y = 6 − 5 = ?',o:['1','11','5'],b:'1',p:'(5, 1).'}]},
  {say:'Siswa mengalikan HANYA ruas kiri persamaan kedua dengan 2 (2x + 4y), ruas kanan tetap 9.',st:[
    {t:'Penilaian?',o:['Keliru; kedua ruas harus dikalikan (menjadi 18)','Benar'],b:'Keliru; kedua ruas harus dikalikan (menjadi 18)',p:'Persamaan tetap seimbang bila kedua ruas dikalikan.'}]},
  {say:'5x + 2y = 19 dan 3x + 2y = 13 (koefisien y sudah sama).',st:[
    {t:'Pendekatan paling efisien?',o:['langsung kurangkan untuk menghilangkan y','kalikan dulu agar x sama'],b:'langsung kurangkan untuk menghilangkan y',p:'2x = 6, x = 3, y = 2.'},
    {t:'Memilih variabel yang koefisiennya sudah sama membuat penyelesaian lebih cepat?',o:['Benar','Salah'],b:'Benar',p:'Tidak perlu perkalian.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Eliminasi dengan mengalikan.';setKata(d.say);
  clear($('s4alat'));barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Samakan dulu koefisien variabel yang dihilangkan. Kalikan KEDUA ruas.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: substitusi dan cerita ---- */
var R5=[
  {say:'y = 2x + 1 dan 3x + y = 16.',st:[
    {t:'Ganti y: 3x + (2x + 1) = 16. 5x = ?',o:['15','17','16'],b:'15',p:'x = 3.'},
    {t:'y = 2(3) + 1 = ?',o:['7','6','5'],b:'7',p:'(3, 7).'}]},
  {say:'y = 3x − 2 dan 2x + y = 13.',st:[
    {t:'2x + (3x − 2) = 13, jadi x = ?',o:['3','2','5'],b:'3',p:'5x = 15.'},
    {t:'y = ?',o:['7','11','1'],b:'7',p:'3(3) − 2.'}]},
  {say:'3x + 2y = 18 dan x = 4.',st:[
    {t:'Ganti x = 4: 12 + 2y = 18. y = ?',o:['3','6','15'],b:'3',p:'2y = 6.'}]},
  {say:'2 buku + 1 pensil = Rp17.000; 1 buku + 3 pensil = Rp21.000.',st:[
    {t:'Kalikan persamaan kedua dengan 2 (2b + 6p = 42.000), lalu kurangkan persamaan pertama (2b + p = 17.000). 5p = ?',o:['25.000','59.000','5.000'],b:'25.000',p:'42.000 − 17.000 = 25.000, p = 5.000.'},
    {t:'Harga satu buku?',o:['6.000','5.000','7.000'],b:'6.000',p:'2b + 5.000 = 17.000 → b = 6.000.'}]},
  {say:'Jumlah umur ayah dan anak 50 tahun; selisihnya 30 tahun.',st:[
    {t:'Dijumlahkan: 2a = 80. Umur ayah?',o:['40','50','30'],b:'40',p:'a = 40.'},
    {t:'Umur anak?',o:['10','20','80'],b:'10',p:'50 − 40.'}]},
  {say:'Jumlah uang Andi dan Budi Rp150.000; selisih Rp30.000.',st:[
    {t:'Uang Andi (yang lebih banyak)?',o:['90.000','120.000','60.000'],b:'90.000',p:'(150.000 + 30.000) : 2.'},
    {t:'Uang Budi?',o:['60.000','30.000','120.000'],b:'60.000',p:'150.000 − 90.000.'}]},
  {say:'3 kaos + 2 celana = Rp410.000; 1 kaos + 2 celana = Rp230.000.',st:[
    {t:'Dikurangkan (celana sama): 2k = 180.000. Harga kaos?',o:['90.000','180.000','60.000'],b:'90.000',p:'k = 90.000.'},
    {t:'Harga celana: 90.000 + 2c = 230.000. c = ?',o:['70.000','140.000','35.000'],b:'70.000',p:'2c = 140.000.'}]},
  {say:'2 pulpen + 1 penghapus = Rp13.000; 1 pulpen + 1 penghapus = Rp8.000.',st:[
    {t:'Dikurangkan: 1 pulpen = ? Lalu penghapus?',o:['5.000 dan 3.000','3.000 dan 5.000','8.000 dan 0'],b:'5.000 dan 3.000',p:'p = 13.000 − 8.000 = 5.000; h = 3.000.'}]},
  {say:'Jumlah dua bilangan 45 dan selisihnya 15.',st:[
    {t:'Bilangan yang lebih besar?',o:['30','15','60'],b:'30',p:'(45 + 15) : 2.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Substitusi dan soal cerita.';setKata(d.say);
  clear($('s5alat'));barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Tulis model dengan dua huruf, lalu pilih substitusi atau eliminasi.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Penyelesaian memenuhi kedua persamaan sekaligus.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-14'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.kartesius({r:6,garis:[[-1,6,5,0,'biru'],[0,-1,3.5,6,'merah']],titik:[{x:2,y:3,l:'(2, 3)',w:'hijau'}]}));
})();


/* ---- bonus: pilih penyelesaian, lihat sistemnya ---- */
function mulaiBonus(){$('bA').value='5';$('bB').value='3';gambarBonus()}
function gambarBonus(){
  var x=+$('bA').value,y=+$('bB').value,sj=x+y,d=x-y;
  $('bNA').textContent='x = '+x;$('bNB').textContent='y = '+y;
  gambarDi('bGambar',{k:'kartesius',r:10,garis:[garisPot(-1,sj,10,'biru'),garisPot(1,-d,10,'merah')],titik:[{x:x,y:y,w:'hijau',l:'('+x+', '+y+')'}]});
  barisTeks('bTanda',['x + y = '+sj+'   dan   x − y = '+mn(d),'Dijumlahkan: 2x = '+(sj+d)+', x = '+x+';  y = '+sj+' − '+x+' = '+y]);
  msg('bmsg','good','Kedua garis berpotongan tepat di titik penyelesaian.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D14 = rakit(DASAR, { kode: 'D-14', data: DATA_D14 })
