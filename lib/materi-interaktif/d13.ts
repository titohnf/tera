import { rakit } from './bersama'
import { DATA_D13 } from './latihan/d13'

/**
 * Materi interaktif D-13 "Relasi, Fungsi, Koordinat" (relasi dan pasangan
 * berurutan, domain, range, fungsi, f(x), koordinat Kartesius dan kuadran,
 * jarak dan titik tengah, fungsi linear dalam keseharian). Satu halaman HTML
 * mandiri, ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai
 * langkah Belajar di topik Misi D-13.
 *
 * Lima stasiun praktik: 1) mesin fungsi dan titik-titiknya di bidang (renderer
 * `kartesius` di gambar.ts), 2) relasi, domain, range, fungsi dengan diagram
 * panah (renderer `panahrelasi`), 3) menghitung f(x), 4) koordinat (urutan
 * (x, y), kuadran, jarak, titik tengah), 5) fungsi dalam keseharian. Bonus:
 * garis f(x) = ax + b. Lalu tiga stasiun mesin latihan, bahannya di
 * `latihan/d13.ts`.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relasi, Fungsi, Koordinat</title>
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
      <h1>Relasi, Fungsi, Koordinat</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo ubah masukan menjadi keluaran!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser nilai x.</p>
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
    <p class="say" id="s2say">Relasi, domain, range, dan fungsi.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Menghitung nilai fungsi.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Koordinat Kartesius.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Fungsi dalam keseharian.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: garis bergerak</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: garis f(x) = ax + b.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="-3" max="3" step="1" value="2" aria-label="a"><div class="baca" id="bNB"></div><input type="range" id="bB" min="-4" max="4" step="1" value="-1" aria-label="b">
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
  if(id==='intro')setKata('Ayo belajar relasi, fungsi, dan koordinat!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar relasi, fungsi, dan koordinat!');

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

/* ---- alat bantu ---- */
function mn(n){return String(n).replace('-','−')}

/* ---- stasiun 1: mesin fungsi dan grafiknya ---- */
var R1=[
  {txt:'f(x) = 2x − 1',f:function(x){return 2*x-1},lo:-2,hi:2,tg:2,r:5,t:'Geser x dari −2 sampai 2 dan lihat titiknya.',st:[
    {t:'Domain {−2, −1, 0, 1, 2}. Range f(x) = 2x − 1?',o:['{−5, −3, −1, 1, 3}','{−2, −1, 0, 1, 2}','{−3, −1, 1, 3, 5}'],b:'{−5, −3, −1, 1, 3}',p:'f(−2) = −5, f(−1) = −3, f(0) = −1, f(1) = 1, f(2) = 3.'},
    {t:'Range adalah himpunan...',o:['hasil (keluaran) yang benar-benar muncul','x yang dimasukkan'],b:'hasil (keluaran) yang benar-benar muncul',p:'Domain = masukan, range = keluaran.'}]},
  {txt:'f(x) = x² − 4',f:function(x){return x*x-4},lo:-2,hi:2,tg:2,r:5,t:'Geser x dari −2 sampai 2 untuk f(x) = x² − 4.',st:[
    {t:'Pasangan: (−2,0), (−1,−3), (0,−4), (1,−3), (2,0). Range?',o:['{−4, −3, 0}','{0, −3, −4, −3, 0}','{−2, −1, 0, 1, 2}'],b:'{−4, −3, 0}',p:'Nilai yang sama ditulis sekali.'},
    {t:'Banyak anggota range lebih sedikit daripada domain. Mungkinkah ini fungsi?',o:['Ya; tiap x tetap punya satu hasil','Tidak'],b:'Ya; tiap x tetap punya satu hasil',p:'Dua x boleh punya hasil yang sama.'}]},
  {txt:'f(x) = 3x + 1',f:function(x){return 3*x+1},lo:-1,hi:2,tg:2,r:8,t:'Geser x dari −1 sampai 2 untuk f(x) = 3x + 1.',st:[
    {t:'Range untuk domain {−1, 0, 1, 2}?',o:['{−2, 1, 4, 7}','{−1, 0, 1, 2}','{−2, 1, 3, 7}'],b:'{−2, 1, 4, 7}',p:'3(−1)+1 = −2; 3(0)+1 = 1; 3(1)+1 = 4; 3(2)+1 = 7.'}]},
  {txt:'f(x) = x² − 1',f:function(x){return x*x-1},lo:-3,hi:3,tg:3,r:9,t:'Geser x dari −3 sampai 3 untuk f(x) = x² − 1.',st:[
    {t:'f(−3) = (−3)² − 1 = ?',o:['8','−10','−7'],b:'8',p:'(−3)² = 9; 9 − 1 = 8.'},
    {t:'f(3) = ?',o:['8','10','6'],b:'8',p:'Sama dengan f(−3).'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){
  var d=R1[r1],t=[],x;
  for(x=d.lo;x<=v;x++)t.push({x:x,y:d.f(x),l:x===v?'('+mn(x)+', '+mn(d.f(x))+')':'',w:x===v?'merah':'biru'});
  gambarDi('s1alat',{k:'kartesius',r:d.r,titik:t});
  barisTeks('s1tampil',['f('+mn(v)+') = '+mn(d.f(v))]);
}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min=String(d.lo);sl.max=String(d.hi);sl.step='1';sl.value=String(d.lo);sl.disabled=false;
  $('s1say').textContent=d.txt+'.';setKata(d.t);
  gambar1(d.lo);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','',d.t);
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v===d.tg){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good','Setiap x menghasilkan tepat satu titik: itu ciri fungsi.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai x = '+d.tg+'.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: relasi, domain, range, fungsi ---- */
var R2=[
  {say:'{(1,2), (2,3), (3,4)}',g:{k:'panahrelasi',a:[1,2,3],b:[2,3,4],pasangan:[[0,0],[1,1],[2,2]]},st:[
    {t:'Domain = himpunan angka pertama. Domain?',o:['{1, 2, 3}','{2, 3, 4}'],b:'{1, 2, 3}',p:'Domain = x, daerah asal.'},
    {t:'Range = angka kedua yang muncul. Range?',o:['{2, 3, 4}','{1, 2, 3}'],b:'{2, 3, 4}',p:'Range = keluaran.'},
    {t:'Apakah fungsi?',o:['Ya; tiap domain punya tepat satu pasangan','Bukan'],b:'Ya; tiap domain punya tepat satu pasangan',p:'Fungsi: setiap anggota domain tepat satu pasangan.'}]},
  {say:'{(1,2), (1,5), (2,6)}',g:{k:'panahrelasi',a:[1,2],b:[2,5,6],pasangan:[[0,0],[0,1],[1,2]]},st:[
    {t:'Apakah fungsi?',o:['Bukan; 1 dipasangkan dengan dua nilai (2 dan 5)','Ya'],b:'Bukan; 1 dipasangkan dengan dua nilai (2 dan 5)',p:'Dua panah keluar dari satu anggota domain.'}]},
  {say:'{(2,7), (4,7), (6,7)}',g:{k:'panahrelasi',a:[2,4,6],b:[7],pasangan:[[0,0],[1,0],[2,0]]},st:[
    {t:'Apakah fungsi?',o:['Ya; tiap domain hanya satu panah (boleh menuju hasil yang sama)','Bukan, hasilnya sama semua'],b:'Ya; tiap domain hanya satu panah (boleh menuju hasil yang sama)',p:'Range yang sama semua tetap fungsi.'},
    {t:'Banyak anggota domain dan range?',o:['3 dan 1','3 dan 3'],b:'3 dan 1',p:'Range {7}.'}]},
  {say:'{(1,1), (2,1), (1,3)}',st:[
    {t:'Apakah fungsi?',o:['Bukan; 1 muncul dengan 1 dan 3','Ya'],b:'Bukan; 1 muncul dengan 1 dan 3',p:'Domain 1 punya dua pasangan.'}]},
  {say:'Istilah.',st:[
    {t:'Domain adalah himpunan nilai keluaran, range nilai masukan. Tepatkah?',o:['Salah; domain masukan, range keluaran','Benar'],b:'Salah; domain masukan, range keluaran',p:'Tertukar.'},
    {t:'Setiap relasi pasangan berurutan pasti fungsi?',o:['Tidak','Ya'],b:'Tidak',p:'Syaratnya: tiap domain tepat satu pasangan.'},
    {t:'Notasi f(x) dibaca...',o:['nilai fungsi f untuk masukan x','f dikali x'],b:'nilai fungsi f untuk masukan x',p:'Bukan perkalian.'}]},
  {say:'Tabel x: 1, 2, 3, 4 dan y: 2, 4, 6, 8.',st:[
    {t:'Apakah fungsi dari x ke y?',o:['Ya; tiap x satu y','Bukan'],b:'Ya; tiap x satu y',p:'y = 2x.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Relasi, domain, range, dan fungsi.';setKata(d.say);
  if(d.g)gambarDi('s2alat',d.g);else clear($('s2alat'));
  barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Fungsi: setiap anggota domain tepat satu pasangan.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: menghitung nilai fungsi ---- */
var R3=[
  {say:'f(x) = 6x − 4. Hitung f(3).',st:[{t:'6 × 3 − 4 = ?',o:['14','22','18'],b:'14',p:'Ganti x dengan 3.'}]},
  {say:'f(x) = x + 9. Hitung f(−3).',st:[{t:'−3 + 9 = ?',o:['6','12','−6'],b:'6',p:'6.'}]},
  {say:'f(x) = 2x + 3 dan f(x) = 4x − 3.',st:[
    {t:'f(4) untuk 2x + 3?',o:['11','14','24'],b:'11',p:'8 + 3.'},
    {t:'f(5) untuk 4x − 3?',o:['17','23','20'],b:'17',p:'20 − 3.'}]},
  {say:'f(x) = 3x + 2, domain {0, 1, 2, 3}.',st:[
    {t:'Banyak anggota range yang berbeda?',o:['4','3','2'],b:'4',p:'2, 5, 8, 11.'}]},
  {say:'Pasangan (1,5), (2,8), (3,11), (4,14) mengikuti f(x) = ax + b.',st:[
    {t:'Selisih tiap langkah 3, jadi a = 3 dan b = 5 − 3 = 2. f(6) = ?',o:['20','18','21'],b:'20',p:'3 × 6 + 2 = 20.'}]},
  {say:'Siswa: "Titik (2, 7) mungkin ada pada grafik f(x) = 3x − 1, jadi f(2) = 7."',st:[
    {t:'Penilaian?',o:['Salah; f(2) = 5, jadi (2, 7) bukan titik grafik','Benar'],b:'Salah; f(2) = 5, jadi (2, 7) bukan titik grafik',p:'Hitung dulu: 3(2) − 1 = 5.'}]},
  {say:'f(x) = x² − 1. Hitung f(−3).',st:[{t:'(−3)² − 1 = ?',o:['8','−10','−7'],b:'8',p:'Kuadrat dulu: 9 − 1.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Menghitung nilai fungsi.';setKata(d.say);
  clear($('s3alat'));barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Ganti x dengan angka yang diminta, lalu hitung.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: koordinat Kartesius ---- */
var R4=[
  {say:'Titik (3, 5) dan titik (5, 3).',g:{k:'kartesius',r:6,bantu:true,titik:[{x:3,y:5,l:'(3, 5)'},{x:5,y:3,l:'(5, 3)',w:'biru'}]},st:[
    {t:'Angka pertama menyatakan posisi...',o:['mendatar (sumbu-x)','tegak (sumbu-y)'],b:'mendatar (sumbu-x)',p:'(x, y): x dulu.'},
    {t:'(3, 5) sama dengan (5, 3)?',o:['Tidak; urutannya penting','Ya'],b:'Tidak; urutannya penting',p:'Dua titik berbeda.'}]},
  {say:'Kuadran: titik (−3, 5), (4, −2), (−7, −2), (5, −9).',g:{k:'kartesius',r:6,kuadran:true,titik:[{x:-3,y:5,l:'P'},{x:4,y:-2,l:'Q',w:'biru'}]},st:[
    {t:'(−3, 5) di kuadran...',o:['II','I','III'],b:'II',p:'x negatif, y positif.'},
    {t:'(4, −2) di kuadran...',o:['IV','II','III'],b:'IV',p:'x positif, y negatif.'},
    {t:'(−7, −2) di kuadran...',o:['III','II','IV'],b:'III',p:'Keduanya negatif.'},
    {t:'(5, −9) di kuadran...',o:['IV','I','II'],b:'IV',p:'x positif, y negatif.'}]},
  {say:'Titik (0, −15) dan (−6, 0).',st:[
    {t:'Jarak (0, −15) ke sumbu-x = |y| = ?',o:['15','−15','0'],b:'15',p:'Jarak selalu positif.'},
    {t:'Jarak (−6, 0) ke sumbu-y = |x| = ?',o:['6','−6','0'],b:'6',p:'6.'},
    {t:'Titik (0, 0) disebut...',o:['titik asal','kuadran I'],b:'titik asal',p:'Perpotongan kedua sumbu.'}]},
  {say:'A(2, 3) dan B(2, 9) memiliki x yang sama.',g:{k:'kartesius',r:10,garis:[[2,3,2,9]],titik:[{x:2,y:3,l:'A'},{x:2,y:9,l:'B'}]},st:[
    {t:'Jarak AB = |9 − 3| = ?',o:['6','12','11'],b:'6',p:'Garis AB sejajar sumbu-y.'},
    {t:'Siswa: jarak (3, 7) dan (3, −2) = −9. Tepatkah?',o:['Salah; jarak positif: |7 − (−2)| = 9','Benar'],b:'Salah; jarak positif: |7 − (−2)| = 9',p:'Jarak tidak negatif.'},
    {t:'Siswa: jarak (1, 2) dan (1, −2) = 0 karena saling meniadakan. Tepatkah?',o:['Salah; jaraknya 4','Benar'],b:'Salah; jaraknya 4',p:'|(−2) − 2| = 4.'}]},
  {say:'C(−4, 5) dan D(3, 5) memiliki y yang sama.',g:{k:'kartesius',r:6,garis:[[-4,5,3,5]],titik:[{x:-4,y:5,l:'C'},{x:3,y:5,l:'D'}]},st:[
    {t:'Jarak CD = |3 − (−4)| = ?',o:['7','1','−7'],b:'7',p:'Garis CD sejajar sumbu-x.'}]},
  {say:'Titik tengah P(2, 4) dan Q(8, 10).',g:{k:'kartesius',r:10,garis:[[2,4,8,10]],titik:[{x:2,y:4,l:'P'},{x:8,y:10,l:'Q'},{x:5,y:7,l:'tengah',w:'hijau'}]},st:[
    {t:'Titik tengah = ((2 + 8)/2, (4 + 10)/2) = ?',o:['(5, 7)','(10, 14)','(6, 6)'],b:'(5, 7)',p:'Rata-rata tiap koordinat.'}]},
  {say:'A(3, 2), B(3, 10), C(9, 2) membentuk segitiga siku-siku di A.',g:{k:'kartesius',r:10,garis:[[3,2,3,10],[3,10,9,2],[9,2,3,2]],titik:[{x:3,y:2,l:'A'},{x:3,y:10,l:'B'},{x:9,y:2,l:'C'}]},st:[
    {t:'AB = 8 dan AC = 6. Luas = ½ × 8 × 6 = ?',o:['24','48','14'],b:'24',p:'24 satuan luas.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Koordinat Kartesius.';setKata(d.say);
  if(d.g)gambarDi('s4alat',d.g);else clear($('s4alat'));
  barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Titik ditulis (x, y): x mendatar, y tegak.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: fungsi dalam keseharian ---- */
var R5=[
  {say:'Ongkos taksi f(x) = 8.000 + 4.000x, x = jarak (km).',st:[
    {t:'Ongkos 12 km = 8.000 + 4.000 × 12 = ?',o:['56.000','60.000','48.000'],b:'56.000',p:'Rp56.000.'}]},
  {say:'Sewa sepeda f(x) = 5.000 + 2.000x, anggaran Rp29.000.',st:[
    {t:'5.000 + 2.000x ≤ 29.000. 2.000x ≤ 24.000. x maksimal?',o:['12 jam','14 jam','24 jam'],b:'12 jam',p:'24.000 : 2.000.'}]},
  {say:'Toko A f(x) = 1.000 + 900x. Toko B g(x) = 1.200 + 850x. Beli 8 paket.',st:[
    {t:'Toko A = 8.200. Toko B = 1.200 + 6.800 = ?',o:['8.000','8.400','7.200'],b:'8.000',p:'Toko B lebih murah.'},
    {t:'Yang lebih murah?',o:['Toko B','Toko A'],b:'Toko B',p:'8.000 < 8.200.'}]},
  {say:'Paket data f(x) = 15.000 + 2.500x, total Rp40.000.',st:[
    {t:'2.500x = 25.000. x = ?',o:['10 GB','16 GB','6 GB'],b:'10 GB',p:'10 GB tambahan.'}]},
  {say:'Percetakan P f(x) = 2.000 + 500x dan Q g(x) = 1.000 + 600x.',st:[
    {t:'Biaya sama saat 2.000 + 500x = 1.000 + 600x. Jadi 1.000 = 100x, x = ?',o:['10 lembar','100 lembar','5 lembar'],b:'10 lembar',p:'Kedua biaya Rp7.000.'}]},
  {say:'Ongkir f(x) = 10.000 + 3.000x dan Rp31.000 dibayar.',st:[
    {t:'3.000x = 21.000. x = ?',o:['7 kg','10 kg','21 kg'],b:'7 kg',p:'7 kg.'}]},
  {say:'Ongkir f(x) = 12.000 + 3.500x dan Rp47.000 dibayar.',st:[
    {t:'3.500x = 35.000. x = ?',o:['10 kg','13 kg','7 kg'],b:'10 kg',p:'10 kg.'}]},
  {say:'Vendor A f(x) = 3.000 + 700x dan Vendor B g(x) = 2.000 + 900x. Pesan 10 unit.',st:[
    {t:'A = 10.000, B = 11.000. Yang lebih murah?',o:['Vendor A','Vendor B'],b:'Vendor A',p:'10.000 < 11.000.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Fungsi dalam keseharian.';setKata(d.say);
  clear($('s5alat'));barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Ganti x dengan angka, atau samakan rumus dan selesaikan.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Fungsi: tiap masukan tepat satu keluaran.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-13'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.kartesius({r:5,titik:[{x:-2,y:-1,l:''},{x:0,y:1,l:''},{x:2,y:3,l:'(2, 3)'}],garis:[[-3,-2,3,4]]}));
})();


/* ---- bonus: garis f(x) = ax + b ---- */
function mulaiBonus(){$('bA').value='2';$('bB').value='-1';gambarBonus()}
function gambarBonus(){
  var a=+$('bA').value,b=+$('bB').value,t=[],x;
  for(x=-6;x<=6;x++){if(Math.abs(a*x+b)<=6)t.push({x:x,y:a*x+b,l:''})}
  $('bNA').textContent='a = '+mn(a);$('bNB').textContent='b = '+mn(b);
  var xa=a===0?-6:(-6-b)/a,xb=a===0?6:(6-b)/a,x1=Math.max(-6,Math.min(xa,xb)),x2=Math.min(6,Math.max(xa,xb)),y1=a*x1+b,y2=a*x2+b;
  gambarDi('bGambar',{k:'kartesius',r:6,titik:t,garis:[[x1,y1,x2,y2]]});
  barisTeks('bTanda',['f(x) = '+mn(a)+'x '+(b<0?'− '+(-b):'+ '+b),'f(0) = '+mn(b)+',  f(1) = '+mn(a+b)]);
  msg('bmsg','good','Setiap x menghasilkan tepat satu titik, sehingga ini fungsi.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D13 = rakit(DASAR, { kode: 'D-13', data: DATA_D13 })
