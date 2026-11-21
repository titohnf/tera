import { rakit } from './bersama'
import { DATA_D05 } from './latihan/d05'

/**
 * Materi interaktif D-05 "Mean, Median, Modus" (ukuran pemusatan dan
 * jangkauan, nilai ekstrem, data yang hilang, memilih ukuran). Satu halaman
 * HTML mandiri, ditampilkan lewat iframe sandbox di `/mandiri/materi` dan
 * sebagai langkah Belajar di topik Misi D-05.
 *
 * Lima stasiun praktik: 1) geser nilai ekstrem (mean dan jangkauan terseret,
 * median bertahan), 2) median (urutkan dulu; ganjil dan genap), 3) modus
 * (bimodal, tidak ada modus) dan jangkauan, 4) mean dan data yang hilang
 * (jumlah = mean x banyak), 5) memilih ukuran dan kesimpulan. Bonus: tambah
 * satu nilai. Lalu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/d05.ts`.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mean, Median, Modus</title>
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
      <h1>Mean, Median, Modus</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo pilih ukuran data yang tepat!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser nilai ekstremnya.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Nilai terakhir"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Mencari median.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Modus dan jangkauan.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Mean dan data yang hilang.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Pilih ukuran yang tepat.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: tambah satu nilai</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: tambah satu nilai ke data.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="30" max="150" step="5" value="45" aria-label="Nilai kelima">
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
  if(id==='intro')setKata('Ayo belajar ukuran pemusatan dan sebaran data!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar ukuran pemusatan dan sebaran data!');

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

/* ---- alat hitung data ---- */
function sMean(a){var s=0;a.forEach(function(x){s+=x});return s/a.length}
function sUrut(a){return a.slice().sort(function(x,y){return x-y})}
function sMed(a){var u=sUrut(a),n=u.length;return n%2?u[(n-1)/2]:(u[n/2-1]+u[n/2])/2}
function sJk(a){var u=sUrut(a);return u[u.length-1]-u[0]}
function sNice(m){return Math.ceil(m/20)*20}

/* ---- stasiun 1: geser nilai yang ekstrem ---- */
var R1=[
  {nama:'Gaji (juta)',dasar:[5,5,6,6,6],lo:5,hi:60,step:5,x:50,t:'Geser gaji pemilik sampai 50 juta.',st:[
    {t:'Mana yang berubah paling jauh saat satu nilai ekstrem muncul?',o:['Mean (naik dari 5,6 jadi 13)','Median (tetap sekitar 6)','Keduanya sama jauh'],b:'Mean (naik dari 5,6 jadi 13)',p:'Mean ikut terseret nilai ekstrem; median hampir tetap.'},
    {t:'Ukuran yang lebih mewakili gaji TIPIKAL karyawan?',o:['Median','Mean','Jangkauan'],b:'Median',p:'Median 6 juta menggambarkan kebanyakan karyawan.'}]},
  {nama:'Uang saku (ribu)',dasar:[20,20,25,30,35],lo:20,hi:120,step:10,x:120,t:'Geser uang saku siswa terakhir sampai 120 ribu.',st:[
    {t:'Median data 20, 20, 25, 30, 35, 120 = (25 + 30) : 2 = ?',o:['27,5','30','50'],b:'27,5',p:'Data genap: rata-rata dua nilai tengah.'},
    {t:'Mean data itu sekitar 41,7. Mean lebih mencerminkan uang saku tipikal?',o:['Tidak; median lebih mencerminkan','Ya, mean selalu terbaik'],b:'Tidak; median lebih mencerminkan',p:'Mean sensitif terhadap nilai ekstrem.'}]},
  {nama:'Suhu (°C)',dasar:[30,32,29,35,31],lo:30,hi:45,step:1,x:40,t:'Geser suhu hari ke-6 sampai 40 °C.',st:[
    {t:'Jangkauan sebelumnya 35 − 29 = 6. Sesudah ada 40 °C?',o:['11','6','40'],b:'11',p:'40 − 29 = 11.'},
    {t:'Jangkauan paling terpengaruh oleh...',o:['nilai terbesar dan terkecil saja','semua nilai sama rata'],b:'nilai terbesar dan terkecil saja',p:'Jangkauan hanya memakai dua nilai ujung.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){
  var d=R1[r1],a=d.dasar.concat([v]),m=sMean(a);
  gambarDi('s1alat',{k:'diagram',d:a.map(function(x,i){return {l:'D'+(i+1),v:x,w:i===a.length-1?'merah':'biru'}}),lo:0,hi:sNice(Math.max(v,m)+2),langkah:sNice(Math.max(v,m)+2)/4,anim:false,garis:[{v:m,l:'mean'}]});
  barisTeks('s1tampil',['Mean = '+fm(m)+' | Median = '+fm(sMed(a))+' | Jangkauan = '+sJk(a)]);
}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min=String(d.lo);sl.max=String(d.hi);sl.step=String(d.step);sl.value=String(d.lo);sl.disabled=false;
  $('s1say').textContent=d.t;setKata(d.t);
  gambar1(d.lo);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Perhatikan mean, median, dan jangkauan saat nilai terakhir bergeser.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v===d.x){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good','Satu nilai ekstrem menarik mean dan jangkauan, tetapi median hampir diam.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai '+d.x+'.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: median ---- */
var R2=[
  {say:'Data 7, 2, 9, 4, 5.',g:{k:'tabel',baris:[['Data asli','7','2','9','4','5']]},st:[
    {t:'Langkah PERTAMA menentukan median?',o:['Urutkan data dari kecil ke besar','Ambil angka di tengah tulisan','Jumlahkan semua'],b:'Urutkan data dari kecil ke besar',p:'Urutan: 2, 4, 5, 7, 9.'},
    {t:'Banyak data 5 (ganjil). Mediannya?',o:['5','4','7'],b:'5',p:'Nilai tengah tunggal setelah diurutkan.'}]},
  {say:'Siswa mencari median 8, 3, 6 dengan mengambil angka tengah tulisan asli (3).',g:{k:'tabel',baris:[['Urut asli','8','3','6'],['Urut benar','3','6','8']]},st:[
    {t:'Kesalahannya?',o:['Tidak mengurutkan data dulu','Salah menjumlahkan','Tidak ada kesalahan'],b:'Tidak mengurutkan data dulu',p:'Median 8, 3, 6 adalah 6.'}]},
  {say:'Data 4, 8, 6, 10 (banyak genap).',g:{k:'tabel',baris:[['Urut','4','6','8','10']]},st:[
    {t:'Median data genap dihitung dengan...',o:['merata-ratakan dua nilai tengah','mengambil salah satu nilai tengah','mengambil nilai terbesar'],b:'merata-ratakan dua nilai tengah',p:'Dua nilai tengah 6 dan 8.'},
    {t:'(6 + 8) : 2 = ?',o:['7','6','8'],b:'7',p:'Median = 7.'}]},
  {say:'Data 12, 7, 15, 9, 10.',st:[
    {t:'Setelah diurutkan 7, 9, 10, 12, 15, median = ?',o:['10','12','9'],b:'10',p:'Nilai ketiga dari lima.'}]},
  {say:'Tinggi 5 siswa: 142, 138, 150, 145, 140.',st:[
    {t:'Median tinggi badan?',o:['142','145','140'],b:'142',p:'138, 140, 142, 145, 150: tengah 142.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Mencari median.';setKata(d.say);
  if(d.g)gambarDi('s2alat',d.g);else clear($('s2alat'));
  barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Urutkan dulu. Ganjil: nilai tengah. Genap: rata-rata dua nilai tengah.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: modus dan jangkauan ---- */
var R3=[
  {say:'Nilai ulangan: 70, 80, 70, 90, 70, 85.',g:{k:'diagram',d:[{l:'70',v:3},{l:'80',v:1},{l:'85',v:1},{l:'90',v:1}],lo:0,hi:4,langkah:1,nilai:true,sat:'banyak'},st:[
    {t:'Modus adalah nilai yang...',o:['paling sering muncul','paling besar','di tengah'],b:'paling sering muncul',p:'70 muncul 3 kali.'},
    {t:'Modus data ini?',o:['70','90','80'],b:'70',p:'Bukan yang terbesar, tetapi yang tersering.'}]},
  {say:'Data 4, 4, 5, 6, 6, 7. Siswa: "Modusnya 4, karena angka pertama yang berulang."',g:{k:'diagram',d:[{l:'4',v:2},{l:'5',v:1},{l:'6',v:2},{l:'7',v:1}],lo:0,hi:3,langkah:1,nilai:true,sat:'banyak'},st:[
    {t:'Penilaian yang tepat?',o:['Keliru; ada dua modus, 4 dan 6 (bimodal)','Benar'],b:'Keliru; ada dua modus, 4 dan 6 (bimodal)',p:'Dua nilai sama-sama paling sering.'},
    {t:'Data bimodal berarti datanya salah. Tepatkah?',o:['Salah; bimodal hasil yang sah','Benar'],b:'Salah; bimodal hasil yang sah',p:'Wajar terjadi.'}]},
  {say:'Data 3, 5, 7, 9, 11.',st:[
    {t:'Modus data ini?',o:['Tidak ada, semua muncul sekali','3','11'],b:'Tidak ada, semua muncul sekali',p:'Modus bisa tidak ada.'}]},
  {say:'Toko sepatu: ukuran 38, 39, 38, 40, 37, 38, 41, 39, 38, 40.',st:[
    {t:'Ukuran yang paling perlu distok lebih banyak?',o:['Ukuran 38 (modus)','Ukuran 39 (mean)','Ukuran 41 (terbesar)'],b:'Ukuran 38 (modus)',p:'Modus menunjukkan yang paling sering terjual.'}]},
  {say:'Suhu 5 hari: 25, 19, 30, 22, 27.',st:[
    {t:'Jangkauan = nilai terbesar − terkecil = ?',o:['11','5','30'],b:'11',p:'30 − 19 = 11.'}]},
  {say:'Lima nilai yang semuanya 6: 6, 6, 6, 6, 6.',st:[
    {t:'Jangkauannya?',o:['0','6','30'],b:'0',p:'Terbesar dan terkecil sama.'},
    {t:'Jangkauan 0 berarti semua nilai sama persis. Tepatkah?',o:['Ya, terbesar sama dengan terkecil','Tidak'],b:'Ya, terbesar sama dengan terkecil',p:'Tidak ada selisih sama sekali.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Modus dan jangkauan.';setKata(d.say);
  if(d.g)gambarDi('s3alat',d.g);else clear($('s3alat'));
  barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Modus: paling sering. Jangkauan: terbesar dikurangi terkecil.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: mean dan data yang hilang ---- */
var R4=[
  {say:'Data 5, 7, 9, 11, 13.',st:[
    {t:'Mean = jumlah semua data dibagi ...',o:['banyak data','data terbesar','data tengah'],b:'banyak data',p:'45 : 5.'},
    {t:'Mean = 45 : 5 = ?',o:['9','11','8'],b:'9',p:'Mean 9.'}]},
  {say:'Rata-rata 5 bilangan adalah 20. Empat di antaranya: 15, 18, 22, 25.',st:[
    {t:'Jumlah kelima bilangan = 5 × 20 = ?',o:['100','80','25'],b:'100',p:'Mean × banyak data.'},
    {t:'Bilangan kelima = 100 − (15+18+22+25) = ?',o:['20','25','15'],b:'20',p:'100 − 80 = 20.'}]},
  {say:'Rata-rata tinggi 4 siswa 155 cm. Tiga siswa: 150, 158, 152.',st:[
    {t:'Jumlah 4 tinggi = 4 × 155 = 620. Siswa keempat?',o:['160 cm','150 cm','155 cm'],b:'160 cm',p:'620 − 460 = 160.'}]},
  {say:'Mean 4 data adalah 25. Tiga data: 20, 22, 28.',st:[
    {t:'Data keempat?',o:['30','25','35'],b:'30',p:'100 − 70 = 30.'}]},
  {say:'Toko roti 4 minggu: 40, 45, 42, 48. Rata-rata 5 minggu minimal 45 (minggu ke-5 = X).',st:[
    {t:'Jumlah minimal 5 minggu = 5 × 45 = ?',o:['225','180','200'],b:'225',p:'225.'},
    {t:'X minimal = 225 − 175 = ?',o:['50','45','55'],b:'50',p:'Jumlah 4 minggu 175; X ≥ 50.'}]},
  {say:'Data 4, 4, 5, 6, 6, 7 ditambah satu nilai.',st:[
    {t:'Mean tidak selalu bilangan bulat walau datanya bulat. Benar?',o:['Benar, mis. mean 2, 3 = 2,5','Salah'],b:'Benar, mis. mean 2, 3 = 2,5',p:'Hasil bagi bisa desimal.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Mean dan data yang hilang.';setKata(d.say);
  clear($('s4alat'));barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Jumlah data = mean × banyak data.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: pilih ukuran dan kesimpulan ---- */
var R5=[
  {say:'Median gaji Rp5 juta, mean Rp8 juta. Analis: "Sebagian besar karyawan bergaji sekitar Rp8 juta."',st:[
    {t:'Penilaian?',o:['Keliru; mean tertarik gaji tinggi, kebanyakan sekitar 5 juta','Benar'],b:'Keliru; mean tertarik gaji tinggi, kebanyakan sekitar 5 juta',p:'Mean lebih besar daripada median: ada nilai besar yang menarik.'}]},
  {say:'Kepala sekolah melaporkan nilai TIPIKAL. Ada beberapa siswa bernilai 0 karena sakit.',st:[
    {t:'Ukuran yang cocok?',o:['Median','Mean','Jangkauan'],b:'Median',p:'Tidak terlalu terpengaruh nilai 0.'}]},
  {say:'Kelas A: 70, 75, 80, 85, 90. Kelas B: 60, 70, 80, 90, 100.',g:{k:'tabel',baris:[['','Mean','Median','Jangkauan'],['A','80','80','20'],['B','80','80','40']]},st:[
    {t:'Pernyataan yang benar?',o:['Mean dan median sama, jangkauan B lebih besar','Jangkauan kedua kelas sama','Mean A lebih kecil dari B'],b:'Mean dan median sama, jangkauan B lebih besar',p:'B lebih menyebar.'},
    {t:'Dua kelas berjangkauan sama pasti sebarannya identik. Tepatkah?',o:['Salah; jangkauan hanya melihat nilai terbesar dan terkecil','Benar'],b:'Salah; jangkauan hanya melihat nilai terbesar dan terkecil',p:'Nilai di antaranya bisa berbeda.'}]},
  {say:'Mean = 10 dan modus = 8 untuk 5 bilangan.',st:[
    {t:'Himpunan yang memenuhi keduanya?',o:['8, 8, 9, 11, 14','8, 9, 10, 11, 12','8, 8, 10, 12, 12'],b:'8, 8, 9, 11, 14',p:'Jumlah 50 dan modus 8.'}]},
  {say:'Mean = median: lima bilangan.',st:[
    {t:'Yang mean-nya sama dengan mediannya?',o:['10, 20, 30, 40, 50','1, 2, 3, 4, 100','5, 5, 5, 5, 50'],b:'10, 20, 30, 40, 50',p:'Keduanya 30.'}]},
  {say:'Nilai 60, 70, 72, 74, 150. Nilai 150 keliru input.',st:[
    {t:'Jangkauan sekarang 150 − 60 = ?',o:['90','80','74'],b:'90',p:'Nilai ekstrem membesarkan jangkauan.'},
    {t:'Ganti 150 dengan 79: jangkauan dan mean?',o:['19 dan 71','90 dan 85','19 dan 85'],b:'19 dan 71',p:'79 − 60 = 19; jumlah 355, mean 71.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Pilih ukuran yang tepat.';setKata(d.say);
  if(d.g)gambarDi('s5alat',d.g);else clear($('s5alat'));
  barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Nilai ekstrem: median lebih tahan. Pemusatan dan sebaran itu berbeda.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Satu nilai ekstrem menarik mean, bukan median.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-05'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.diagram({d:[{l:'A',v:4},{l:'B',v:7},{l:'C',v:5}],lo:0,hi:8,langkah:2,nilai:true,garis:[{v:5.3,l:'mean'}]}));
})();


/* ---- bonus: tambah satu nilai ---- */
function mulaiBonus(){$('bA').value='45';gambarBonus()}
function gambarBonus(){
  var x=+$('bA').value,a=[40,45,42,48,x];
  $('bNA').textContent='Nilai kelima: '+x;
  gambarDi('bGambar',{k:'diagram',d:a.map(function(v,i){return {l:'D'+(i+1),v:v,w:i===4?'merah':'biru'}}),lo:0,hi:sNice(Math.max(x,50)+2),langkah:sNice(Math.max(x,50)+2)/4,anim:false,garis:[{v:sMean(a),l:'mean'}]});
  barisTeks('bTanda',['Mean = '+fm(sMean(a))+' | Median = '+fm(sMed(a))+' | Jangkauan = '+sJk(a)]);
  msg('bmsg','good','Coba geser sangat besar: mean ikut naik, median bertahan.');
}
$('bA').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D05 = rakit(DASAR, { kode: 'D-05', data: DATA_D05 })
