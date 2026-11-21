import { rakit } from './bersama'
import { DATA_D10 } from './latihan/d10'

/**
 * Materi interaktif D-10 "Kongruen dan Sebangun" (kongruen lawan sebangun,
 * simbol dan korespondensi, SSS, SAS, AA, faktor skala, foto dan peta,
 * metode bayangan). Satu halaman HTML mandiri, ditampilkan lewat iframe
 * sandbox di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi D-10.
 *
 * Lima stasiun praktik: 1) geser faktor skala (skala 1 berarti kongruen),
 * 2) istilah, simbol, korespondensi, bangun yang pasti sebangun, 3) syarat
 * kongruen dan sebangun, 4) menghitung dengan faktor skala, 5) bayangan,
 * peta, denah, miniatur (renderer `bayangan` di gambar.ts). Bonus: mesin
 * bayangan. Lalu tiga stasiun mesin latihan, bahannya di `latihan/d10.ts`.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kongruen dan Sebangun</title>
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
      <h1>Kongruen dan Sebangun</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo bandingkan bangun yang mirip!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser faktor skala.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Faktor skala"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Kongruen, sebangun, dan simbolnya.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Syarat kongruen dan sebangun.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Menghitung dengan faktor skala.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Bayangan, peta, dan denah.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: ukur pohon</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: mengukur tinggi pohon dengan bayangan.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="8" max="30" step="1" value="20" aria-label="Bayangan pohon"><div class="baca" id="bNB"></div><input type="range" id="bB" min="8" max="20" step="1" value="12" aria-label="Tinggi tongkat">
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
  if(id==='intro')setKata('Ayo belajar kongruen dan sebangun!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar kongruen dan sebangun!');

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

/* ---- stasiun 1: faktor skala ---- */
function segi(k,a0,t0){return {k:'gabungan',jenis:'tri',a:6,t:4,lab:{a:fm(a0*k)+' cm',t:fm(t0*k)+' cm'}}}
var R1=[
  {a0:5,t0:4,tg:2,ket:'AB = 5 cm. DEF sebangun dengan ABC, skala 2.',st:[
    {t:'Panjang DE = 5 × 2 = ?',o:['10 cm','7 cm','2,5 cm'],b:'10 cm',p:'Sisi bersesuaian dikali faktor skala.'},
    {t:'Sudut-sudut bersesuaian kedua segitiga...',o:['sama besar','berbeda','dua kali'],b:'sama besar',p:'Sebangun: sudut sama, sisi sebanding.'}]},
  {a0:14,t0:10,tg:0.5,ket:'Sisi 14 cm diperkecil dengan skala 0,5.',st:[
    {t:'Sisi bersesuaian = 14 × 0,5 = ?',o:['7 cm','28 cm','14,5 cm'],b:'7 cm',p:'Skala 0,5 memperkecil.'},
    {t:'Faktor skala 1/2 sama dengan...',o:['0,5','2','1,5'],b:'0,5',p:'Segitiga hasil lebih kecil.'}]},
  {a0:6,t0:8,tg:1,ket:'AB = 6 cm. Skala 1.',st:[
    {t:'Skala tepat 1. Kedua bangun...',o:['kongruen (bentuk dan ukuran sama)','sebangun saja, ukuran beda'],b:'kongruen (bentuk dan ukuran sama)',p:'Skala 1: sebangun dan kongruen.'},
    {t:'Bangun kongruen pasti sebangun?',o:['Ya','Tidak'],b:'Ya',p:'Sebangun yang berskala 1 adalah kongruen.'},
    {t:'Bangun sebangun pasti kongruen?',o:['Tidak; skala bisa bukan 1','Ya'],b:'Tidak; skala bisa bukan 1',p:'Kongruen adalah kasus khusus.'}]},
  {a0:9,t0:6,tg:3,ket:'AB = 9 cm. Skala 3.',st:[
    {t:'DE = 9 × 3 = ?',o:['27 cm','12 cm','3 cm'],b:'27 cm',p:'27 cm.'},
    {t:'Siswa: "Sisi sebanding skala 3, jadi kongruen." Tepatkah?',o:['Salah; skala bukan 1 berarti sebangun, bukan kongruen','Benar'],b:'Salah; skala bukan 1 berarti sebangun, bukan kongruen',p:'Kongruen menuntut skala 1.'}]},
  {a0:8,t0:5,tg:1.5,ket:'Sisi trapesium 8 cm, skala 1,5.',st:[
    {t:'Sisi bersesuaian = 8 × 1,5 = ?',o:['12 cm','9,5 cm','16 cm'],b:'12 cm',p:'12 cm.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){var d=R1[r1],k=v/2;gambarDi('s1alat',segi(k,d.a0,d.t0));barisTeks('s1tampil',['Skala '+fm(k)+': sisi 1 = '+fm(d.a0*k)+' cm, sisi 2 = '+fm(d.t0*k)+' cm'])}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='1';sl.max='8';sl.step='1';sl.value='2';sl.disabled=false;
  var t='Geser faktor skala sampai '+fm(d.tg)+'.';$('s1say').textContent=t;setKata(t);
  gambar1(2);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','',d.ket);
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v/2===d.tg){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good','Skala '+fm(d.tg)+': bentuk sama, ukuran dikali '+fm(d.tg)+'.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai skala '+fm(d.tg)+'.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: istilah, simbol, korespondensi ---- */
var R2=[
  {say:'Kongruen dan sebangun.',st:[
    {t:'Dua bangun kongruen jika...',o:['bentuk DAN ukurannya sama persis','bentuknya sama, ukuran boleh beda'],b:'bentuk DAN ukurannya sama persis',p:'Kongruen = sama persis.'},
    {t:'Dua bangun sebangun jika...',o:['sudut bersesuaian sama dan sisi bersesuaian sebanding','semua sisi sama panjang'],b:'sudut bersesuaian sama dan sisi bersesuaian sebanding',p:'Ukuran boleh berbeda.'}]},
  {say:'Simbol.',st:[
    {t:'Simbol kongruen?',o:['≅','~'],b:'≅',p:'≅ kongruen; ~ sebangun.'},
    {t:'Simbol sebangun?',o:['~','≅'],b:'~',p:'Tilde.'}]},
  {say:'△MNO ≅ △RST dengan M↔R, N↔S, O↔T.',st:[
    {t:'Sisi yang bersesuaian dengan MN?',o:['RS','ST','RT'],b:'RS',p:'M↔R dan N↔S.'},
    {t:'Urutan huruf pada notasi segitiga...',o:['menentukan pasangan yang bersesuaian','tidak berpengaruh'],b:'menentukan pasangan yang bersesuaian',p:'Huruf ke-1 dengan ke-1, dst.'}]},
  {say:'△DEF ~ △GHI dengan D↔G, E↔H, F↔I.',st:[
    {t:'Sisi yang bersesuaian dengan EF?',o:['HI','GH','GI'],b:'HI',p:'E↔H dan F↔I.'}]},
  {say:'Dua persegi sebarang.',st:[
    {t:'Pasti sebangun?',o:['Ya, semua sudutnya 90° dan sisinya sebanding','Tidak'],b:'Ya, semua sudutnya 90° dan sisinya sebanding',p:'Persegi selalu sebangun.'}]},
  {say:'Dua persegi panjang sebarang.',st:[
    {t:'Pasti sebangun?',o:['Tidak; rasio panjang dan lebar bisa berbeda','Ya'],b:'Tidak; rasio panjang dan lebar bisa berbeda',p:'Contoh 2 × 8 dan 4 × 6.'},
    {t:'Dua persegi panjang berluas sama pasti sebangun?',o:['Tidak','Ya'],b:'Tidak',p:'Luas sama belum berarti rasio sisi sama.'}]},
  {say:'Bangun yang PASTI sebangun, berapa pun ukurannya.',st:[
    {t:'Pilih.',o:['Semua lingkaran','Semua persegi panjang','Semua jajar genjang'],b:'Semua lingkaran',p:'Semua lingkaran sebangun; segitiga sama sisi dan persegi juga.'}]},
  {say:'Foto 4 × 6 cm diperbesar menjadi 8 × 12 cm.',st:[
    {t:'Apakah sebangun?',o:['Ya; rasio 4:6 = 8:12','Tidak'],b:'Ya; rasio 4:6 = 8:12',p:'Skala 2.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Kongruen, sebangun, dan simbolnya.';setKata(d.say);
  clear($('s2alat'));barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Kongruen: sama persis. Sebangun: bentuk sama, ukuran boleh beda.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: syarat kongruen dan sebangun ---- */
var R3=[
  {say:'Segitiga ABC: 5, 6, 7 cm. Segitiga DEF: 5, 6, 7 cm.',st:[
    {t:'Kongruen menurut...',o:['SSS (tiga pasang sisi sama)','SAS','AA'],b:'SSS (tiga pasang sisi sama)',p:'Ketiga sisi bersesuaian sama.'}]},
  {say:'Segitiga 5, 6, 7 cm dan segitiga 5, 6, 8 cm.',st:[
    {t:'Kongruen?',o:['Tidak; sisi ketiga berbeda','Ya'],b:'Tidak; sisi ketiga berbeda',p:'SSS tidak terpenuhi.'}]},
  {say:'Segitiga 9, 10, 11 cm dan 9, 10, 12 cm.',st:[
    {t:'Kongruen?',o:['Tidak','Ya'],b:'Tidak',p:'11 ≠ 12.'}]},
  {say:'Syarat SAS.',st:[
    {t:'SAS membutuhkan...',o:['dua pasang sisi sama dan sudut yang DIAPIT keduanya sama','dua sisi sama dan sudut sebarang'],b:'dua pasang sisi sama dan sudut yang DIAPIT keduanya sama',p:'Sudutnya harus di antara kedua sisi itu.'}]},
  {say:'△KLM: KL = 6, LM = 8, ∠L = 60°. △NOP: NO = 6, OP = 8, ∠O = 60°.',st:[
    {t:'Kedua segitiga...',o:['kongruen (SAS)','hanya sebangun','tidak ada hubungan'],b:'kongruen (SAS)',p:'Sudut 60° diapit kedua sisi.'}]},
  {say:'Dua segitiga memiliki dua sudut yang sama (AA).',st:[
    {t:'Pasti...',o:['sebangun, belum tentu kongruen','kongruen'],b:'sebangun, belum tentu kongruen',p:'AA menjamin sebangun.'},
    {t:'Dua segitiga siku-siku dengan satu sudut lancip sama pasti sebangun?',o:['Ya (AA)','Tidak'],b:'Ya (AA)',p:'Sudut siku-siku dan sudut lancip yang sama.'}]},
  {say:'Keliling dua segitiga sama besar.',st:[
    {t:'Pasti kongruen?',o:['Tidak','Ya'],b:'Tidak',p:'Sisi-sisinya bisa berbeda dengan jumlah sama.'}]},
  {say:'Dua segitiga sama kaki, sudut puncak sama besar.',st:[
    {t:'Pasti sebangun?',o:['Ya; sudut alasnya juga sama','Tidak'],b:'Ya; sudut alasnya juga sama',p:'Sudut alas = (180° − puncak) : 2.'}]},
  {say:'Garis tinggi CD pada segitiga siku-siku ABC (siku di C).',st:[
    {t:'△ACD sebangun dengan...',o:['△CBD dan △ABC','hanya △ABC','tidak ada'],b:'△CBD dan △ABC',p:'Ketiga segitiga saling sebangun.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Syarat kongruen dan sebangun.';setKata(d.say);
  clear($('s3alat'));barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Kongruen: SSS atau SAS. Sebangun: AA atau sisi sebanding.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: menghitung panjang sisi ---- */
var R4=[
  {say:'△PQR ~ △STU. PQ = 4, ST = 12, QR = 6.',g:{k:'tabel',baris:[['','Kecil','Besar'],['Sisi 1','PQ = 4','ST = 12'],['Sisi 2','QR = 6','TU = ?']]},st:[
    {t:'Faktor skala = ST : PQ = ?',o:['3','8','1/3'],b:'3',p:'12 : 4.'},
    {t:'TU = 6 × 3 = ?',o:['18 cm','9 cm','2 cm'],b:'18 cm',p:'18 cm.'}]},
  {say:'AB = 6 cm dan DE = 18 cm; △ABC ~ △DEF.',st:[
    {t:'Faktor skala dari ABC ke DEF?',o:['3','12','1/3'],b:'3',p:'18 : 6.'}]},
  {say:'KL = 8 cm dan NO = 20 cm.',st:[
    {t:'Faktor skala dari KLM ke NOP?',o:['2,5','12','0,4'],b:'2,5',p:'20 : 8.'}]},
  {say:'△PQR ~ △STU, skala 0,25, PQ = 12 cm.',st:[
    {t:'ST = 12 × 0,25 = ?',o:['3 cm','48 cm','12,25 cm'],b:'3 cm',p:'3 cm.'}]},
  {say:'△PQR ~ △STU, skala 1/3, PQ = 18 cm.',st:[
    {t:'ST = ?',o:['6 cm','54 cm','15 cm'],b:'6 cm',p:'18 : 3.'}]},
  {say:'Foto lebar 4 cm dan panjang 6 cm diperbesar sehingga lebarnya 10 cm.',st:[
    {t:'Skala = 10 : 4 = 2,5. Panjang baru?',o:['15 cm','12 cm','16 cm'],b:'15 cm',p:'6 × 2,5 = 15.'}]},
  {say:'Foto 5 × 8 cm diperbesar sehingga lebarnya 15 cm.',st:[
    {t:'Panjang baru?',o:['24 cm','23 cm','20 cm'],b:'24 cm',p:'Skala 3; 8 × 3.'}]},
  {say:'Foto 10 × 15 cm dicetak poster berlebar 40 cm.',st:[
    {t:'Panjang poster?',o:['60 cm','55 cm','50 cm'],b:'60 cm',p:'Skala 4; 15 × 4.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Menghitung dengan faktor skala.';setKata(d.say);
  if(d.g)gambarDi('s4alat',d.g);else clear($('s4alat'));
  barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Faktor skala = sisi bangun baru : sisi bangun lama.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: bayangan, peta, denah ---- */
var R5=[
  {say:'Tongkat 1,2 m bayangannya 1,6 m. Pohon bayangannya 20 m.',g:{k:'bayangan',a:{h:1.2,b:1.6,lh:'1,2 m',lb:'1,6 m'},c:{h:15,b:20,lh:'?',lb:'20 m'},nama:['tongkat','pohon']},st:[
    {t:'Segitiga tongkat dan pohon sebangun. Tinggi pohon : 20 = 1,2 : 1,6. Tinggi pohon = ?',o:['15 m','24 m','12 m'],b:'15 m',p:'20 × 1,2 : 1,6 = 15.'}]},
  {say:'Tongkat 1 m bayangannya 1,5 m. Bayangan tiang lampu 18 m.',st:[
    {t:'Tinggi tiang lampu?',o:['12 m','27 m','18 m'],b:'12 m',p:'18 × 1 : 1,5 = 12.'}]},
  {say:'Surveyor berdiri 2 m dari cermin (tinggi mata 1,6 m). Cermin berjarak 30 m dari gedung.',st:[
    {t:'Tinggi gedung = 1,6 × 30 : 2 = ?',o:['24 m','48 m','12 m'],b:'24 m',p:'Segitiga di kedua sisi cermin sebangun.'}]},
  {say:'Peta berskala 1 : 5.000. Jarak di peta 8 cm.',st:[
    {t:'Jarak sebenarnya = 8 × 5.000 = 40.000 cm = ?',o:['400 m','4 km lebih','40 m'],b:'400 m',p:'40.000 cm = 400 m.'}]},
  {say:'Peta 1 : 10.000, jarak 6 cm.',st:[
    {t:'Jarak sebenarnya?',o:['600 m','60 m','6.000 m'],b:'600 m',p:'60.000 cm = 600 m.'}]},
  {say:'Peta 1 : 2.000, jarak sebenarnya 500 m. Siswa menghitung 500 : 2.000 = 0,25 cm.',st:[
    {t:'Kesalahannya?',o:['Lupa mengubah 500 m menjadi 50.000 cm dulu','Salah membagi'],b:'Lupa mengubah 500 m menjadi 50.000 cm dulu',p:'50.000 : 2.000 = 25 cm.'}]},
  {say:'Denah skala 1 : 100. Kamar di denah 3 cm × 4 cm.',st:[
    {t:'Ukuran sebenarnya 3 m × 4 m. Luas = ?',o:['12 m²','1.200 m²','7 m²'],b:'12 m²',p:'Skala panjang 100: 300 cm × 400 cm = 3 m × 4 m.'}]},
  {say:'Miniatur skala 1 : 50, gedung 25 m.',st:[
    {t:'Tinggi miniatur?',o:['50 cm','5 cm','25 cm'],b:'50 cm',p:'2.500 cm : 50.'}]},
  {say:'Tangga 5 m mencapai tinggi 4 m dan berjarak 3 m dari tembok. Tangga kedua sebangun, tingginya 6,4 m.',st:[
    {t:'Skala = 6,4 : 4 = 1,6. Panjang tangga kedua?',o:['8 m','6,4 m','9,6 m'],b:'8 m',p:'5 × 1,6 = 8.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Bayangan, peta, dan denah.';setKata(d.say);
  if(d.g)gambarDi('s5alat',d.g);else clear($('s5alat'));
  barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Benda dan bayangannya membentuk segitiga sebangun.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Sebangun: sudut sama, sisi sebanding; kongruen: skala 1.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-10'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.gabungan({jenis:'tri',a:6,t:4,lab:{a:'6',t:'4'}}));
})();


/* ---- bonus: mesin bayangan ---- */
function mulaiBonus(){$('bA').value='20';$('bB').value='12';gambarBonus()}
function gambarBonus(){
  var bp=+$('bA').value,ht=+$('bB').value/10,tp=ht*bp/1.6;
  $('bNA').textContent='Bayangan pohon: '+bp+' m';$('bNB').textContent='Tinggi tongkat: '+fm(ht)+' m (bayangan 1,6 m)';
  gambarDi('bGambar',{k:'bayangan',a:{h:ht,b:1.6,lh:fm(ht)+' m',lb:'1,6 m'},c:{h:tp,b:bp,lh:fm(tp)+' m',lb:bp+' m'},nama:['tongkat','pohon']});
  barisTeks('bTanda',['tinggi pohon : '+bp+' = '+fm(ht)+' : 1,6','tinggi pohon = '+fm(tp)+' m']);
  msg('bmsg','good','Perbandingan tinggi dan bayangan sama untuk kedua benda.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D10 = rakit(DASAR, { kode: 'D-10', data: DATA_D10 })
