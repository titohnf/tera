import { rakit } from './bersama'
import { DATA_D06 } from './latihan/d06'

/**
 * Materi interaktif D-06 "Hubungan Antar-Sudut" (berpelurus, berpenyiku,
 * bertolak belakang, sehadap, berseberangan dalam, dalam sepihak, syarat dua
 * garis sejajar, dan aljabar sudut). Satu halaman HTML mandiri, ditampilkan
 * lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah Belajar di
 * topik Misi D-06.
 *
 * Lima stasiun praktik: 1) geser sudut 1 pada dua garis sejajar dan lihat
 * kedelapan sudut (hanya dua ukuran), 2) berpelurus dan berpenyiku (termasuk
 * aljabar, refleks), 3) nama pasangan sudut dan nilainya, 4) sejajar atau
 * tidak (sehadap tidak sama berarti tidak sejajar; gambar bukan bukti ukuran),
 * 5) cerita dan aljabar (sehadap sama, bertolak belakang sama, berpelurus
 * dijumlah). Bonus: miringkan garis l. Penomoran sudut: 1 kanan-atas, 2
 * kiri-atas, 3 kiri-bawah, 4 kanan-bawah di k; 5 sampai 8 di l dengan pola
 * sama (renderer `sejajar` di gambar.ts). Lalu tiga stasiun mesin latihan,
 * bahannya di `latihan/d06.ts`.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hubungan Antar-Sudut</title>
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
      <h1>Hubungan Antar-Sudut</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo temukan sudut yang sama besar!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser sudutnya.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Sudut 1"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Berpelurus dan berpenyiku.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Sehadap, berseberangan, sepihak.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Sejajar atau tidak?</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Cerita dan aljabar sudut.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: miringkan garis l</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: miringkan garis l.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="20" max="160" step="5" value="70" aria-label="Sudut 1"><div class="baca" id="bNB"></div><input type="range" id="bB" min="0" max="15" step="1" value="0" aria-label="Kemiringan">
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
  if(id==='intro')setKata('Ayo belajar hubungan antar-sudut!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar hubungan antar-sudut!');

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

/* ---- alat bantu sudut ---- */
function labSemua(th,tl){tl=tl||0;var a=th,b=180-th,c=th-tl,d=180-th+tl,o={};o[1]=a+'°';o[2]=b+'°';o[3]=a+'°';o[4]=b+'°';o[5]=c+'°';o[6]=d+'°';o[7]=c+'°';o[8]=d+'°';return o}

/* ---- stasiun 1: geser sudut, lihat kedelapan sudut ---- */
var R1=[
  {th:70,sorot:[1,5],t:'Geser sampai sudut 1 = 70°.',st:[
    {t:'Sudut 1 dan sudut 5 menempati posisi yang sama di kedua titik potong. Namanya...',o:['sehadap','berseberangan dalam','dalam sepihak'],b:'sehadap',p:'Sehadap, dan besarnya sama (70°).'},
    {t:'Sudut 1 = 70° pada garis sejajar. Sudut 5 = ?',o:['70°','110°','20°'],b:'70°',p:'Sudut sehadap selalu sama pada garis sejajar.'}]},
  {th:50,sorot:[3,5],t:'Geser sampai sudut 3 = 50°.',st:[
    {t:'Sudut 3 dan sudut 5 berada di antara kedua garis, di sisi berlawanan. Namanya...',o:['berseberangan dalam','sehadap','bertolak belakang'],b:'berseberangan dalam',p:'Berseberangan dalam: sama besar.'},
    {t:'Sudut 3 = 50°. Sudut 5 = ?',o:['50°','130°','40°'],b:'50°',p:'Sama besar.'}]},
  {th:75,sorot:[3,6],t:'Geser sampai sudut 3 = 75°.',st:[
    {t:'Sudut 3 dan sudut 6 berada di antara kedua garis, di sisi yang sama. Namanya...',o:['dalam sepihak','sehadap','berseberangan dalam'],b:'dalam sepihak',p:'Dalam sepihak: jumlahnya 180°.'},
    {t:'Sudut 3 = 75°. Sudut 6 = ?',o:['105°','75°','15°'],b:'105°',p:'180° − 75° = 105°.'},
    {t:'Pada garis sejajar, sudut dalam sepihak pasti sama besar. Tepatkah?',o:['Salah. Jumlahnya 180°, belum tentu sama','Benar'],b:'Salah. Jumlahnya 180°, belum tentu sama',p:'Sama besar hanya bila keduanya 90°.'}]},
  {th:110,sorot:[2,4],t:'Geser sampai sudut 4 = 70° (sudut 2 = 110°).',st:[
    {t:'Dua garis lurus berpotongan. Sudut 2 dan sudut 4 saling berhadapan. Namanya...',o:['bertolak belakang','berpelurus','sehadap'],b:'bertolak belakang',p:'Bertolak belakang: selalu sama besar.'},
    {t:'Sudut 2 = 110°, jadi sudut 4 = ?',o:['110°','70°','180°'],b:'110°',p:'Pada gambar sudut 2 = 110° dan sudut 4 = 110°.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){var d=R1[r1];gambarDi('s1alat',{k:'sejajar',deg:v,lab:labSemua(v),sorot:d.sorot})}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='20';sl.max='160';sl.step='5';sl.value=String(d.th===110?60:40);sl.disabled=false;
  var tg=d.th===110?60:d.th;d.tg=tg;
  $('s1say').textContent=d.th===110?'Geser sampai sudut 1 = 70° (sudut 2 = 110°).':d.t;setKata(d.t);
  gambar1(+sl.value);barisTeks('s1tampil',['Garis k sejajar garis l']);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Geser sudut 1. Hanya ada dua ukuran: θ dan 180° − θ.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value,tg=d.th===110?70:d.th;
  gambar1(v);
  if(v===tg){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good','Delapan sudut hanya punya dua ukuran: '+v+'° dan '+(180-v)+'°.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai sudut 1 = '+tg+'°.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: berpelurus dan berpenyiku ---- */
var R2=[
  {say:'Sudut A dan B berpelurus. Sudut A = 65°.',g:{k:'sudut',mode:'pelurus',deg:65,labA:'65°',labB:'?'},st:[
    {t:'Berpelurus: jumlah kedua sudut = ?',o:['180°','90°','360°'],b:'180°',p:'Membentuk garis lurus.'},
    {t:'Sudut B = 180° − 65° = ?',o:['115°','25°','125°'],b:'115°',p:'115°.'}]},
  {say:'Sudut P dan Q berpenyiku. Sudut P = 35°.',g:{k:'sudut',mode:'penyiku',deg:35,labA:'35°',labB:'?'},st:[
    {t:'Berpenyiku: jumlah kedua sudut = ?',o:['90°','180°','45°'],b:'90°',p:'Membentuk sudut siku-siku.'},
    {t:'Sudut Q = 90° − 35° = ?',o:['55°','145°','65°'],b:'55°',p:'55°.'}]},
  {say:'Sudut siku-siku dibagi menjadi dua; salah satunya 25°.',st:[
    {t:'Sudut yang lain?',o:['65°','155°','75°'],b:'65°',p:'90° − 25° = 65°.'}]},
  {say:'Sudut X dan Y berpelurus. Sudut X lancip 40°.',st:[
    {t:'Sudut Y termasuk jenis...',o:['tumpul','lancip','siku-siku'],b:'tumpul',p:'Y = 140°, lebih dari 90°.'},
    {t:'Dua sudut berpelurus pasti salah satunya tumpul. Tepatkah?',o:['Salah. 90° dan 90° berpelurus tetapi siku-siku','Benar'],b:'Salah. 90° dan 90° berpelurus tetapi siku-siku',p:'Contoh penyangkal.'}]},
  {say:'Sudut 1 dan 2 berpelurus; sudut 1 tiga kali sudut 2.',st:[
    {t:'Sudut 2 = x, sudut 1 = 3x. x + 3x = 180°, jadi x = ?',o:['45°','60°','30°'],b:'45°',p:'4x = 180°.'},
    {t:'Sudut 1 = 3 × 45° = ?',o:['135°','45°','90°'],b:'135°',p:'135°.'}]},
  {say:'Sudut A = 4x dan B = 2x + 30 berpelurus.',st:[
    {t:'4x + 2x + 30 = 180, jadi x = ?',o:['25','30','20'],b:'25',p:'6x = 150.'},
    {t:'Sudut A = 4 × 25 = ?',o:['100°','80°','120°'],b:'100°',p:'100°.'}]},
  {say:'Sudut M = (3x+10)° dan N = (2x+20)° berpelurus. Siswa menulis 3x+10 = 2x+20.',st:[
    {t:'Penilaian?',o:['Keliru; berpelurus berarti dijumlah = 180°, bukan disamakan','Benar'],b:'Keliru; berpelurus berarti dijumlah = 180°, bukan disamakan',p:'3x + 10 + 2x + 20 = 180, x = 30.'}]},
  {say:'Sudut P adalah sudut refleks (lebih dari 180°).',st:[
    {t:'Apakah P bisa punya pasangan berpelurus?',o:['Tidak; pelurusnya akan negatif','Bisa'],b:'Tidak; pelurusnya akan negatif',p:'180° dikurangi lebih dari 180° adalah negatif.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Berpelurus dan berpenyiku.';setKata(d.say);
  if(d.g)gambarDi('s2alat',d.g);else clear($('s2alat'));
  barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Berpelurus = 180°. Berpenyiku = 90°.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: nama pasangan sudut dan nilainya ---- */
var R3=[
  {say:'Dua garis berpotongan. Sudut 2 dan sudut 4 berhadapan; sudut 2 = 110°.',g:{k:'sudut',mode:'silang',deg:110,labA:'110°',labB:'',labC:'?'},st:[
    {t:'Sudut 4 = ?',o:['110°','70°','90°'],b:'110°',p:'Bertolak belakang selalu sama.'}]},
  {say:'Garis sejajar. Sudut 1 dan sudut 5, sudut 1 = 70°.',g:{k:'sejajar',deg:70,sorot:[1,5],lab:{1:'70°',5:'?'}},st:[
    {t:'Sudut 5 = ?',o:['70°','110°','20°'],b:'70°',p:'Sehadap: sama.'}]},
  {say:'Garis sejajar. Sudut 3 = 48° dan sudut 5.',g:{k:'sejajar',deg:48,sorot:[3,5],lab:{3:'48°',5:'?'}},st:[
    {t:'Sudut 5 = ?',o:['48°','132°','42°'],b:'48°',p:'Berseberangan dalam: sama.'}]},
  {say:'Garis sejajar. Sudut 3 = 75° dan sudut 6.',g:{k:'sejajar',deg:75,sorot:[3,6],lab:{3:'75°',6:'?'}},st:[
    {t:'Sudut 6 = ?',o:['105°','75°','15°'],b:'105°',p:'Dalam sepihak: jumlah 180°.'}]},
  {say:'Garis sejajar. Sudut 1 = 112° (jadi sudut 2 = 68°).',g:{k:'sejajar',deg:112,sorot:[2,7],lab:{2:'68°',7:'?'}},st:[
    {t:'Sudut 2 dan sudut 7 luar sepihak. Sudut 7 = ?',o:['112°','68°','22°'],b:'112°',p:'Sudut 7 sehadap dengan 3, besarnya 112°; luar sepihak 2 + 7 = 180°.'}]},
  {say:'Rangka atap: sudut 4 (kanan-bawah di k) dan sudut 5 (kanan-atas di l).',g:{k:'sejajar',deg:60,sorot:[4,5],lab:{4:'(4x+10)°',5:'(2x+20)°'}},st:[
    {t:'Sudut 4 dan 5 dalam sepihak: (4x+10) + (2x+20) = 180. x = ?',o:['25','30','20'],b:'25',p:'6x + 30 = 180, x = 25.'},
    {t:'Sudut 4 = 4 × 25 + 10 = ?',o:['110°','100°','70°'],b:'110°',p:'Sudut 5 = 70°.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Sehadap, berseberangan, sepihak.';setKata(d.say);
  gambarDi('s3alat',d.g);barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Sehadap dan berseberangan dalam: sama. Dalam sepihak: jumlah 180°.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: sejajar atau tidak? ---- */
var R4=[
  {say:'Tukang memasang dua balok yang seharusnya sejajar. Sepasang sudut sehadap: 88° dan 91°.',g:{k:'sejajar',deg:88,tilt:3,sorot:[1,5],lab:{1:'88°',5:'91°'}},st:[
    {t:'Penilaian?',o:['Balok tidak sejajar; sudut sehadap yang tidak sama menunjukkan tidak sejajar','Sejajar, selisih 3° kecil saja'],b:'Balok tidak sejajar; sudut sehadap yang tidak sama menunjukkan tidak sejajar',p:'Syarat sejajar: sudut sehadap sama persis.'}]},
  {say:'Sudut dalam sepihak 95° dan 84°.',st:[
    {t:'Apakah kedua garis sejajar?',o:['Tidak; jumlahnya 179°, bukan 180°','Ya'],b:'Tidak; jumlahnya 179°, bukan 180°',p:'Pada garis sejajar jumlah dalam sepihak 180°.'}]},
  {say:'Sudut 1 dan 5 (sehadap) sama-sama 72°; belum diketahui sejajar atau tidak.',g:{k:'sejajar',deg:72,sorot:[1,5],lab:{1:'72°',5:'72°'}},st:[
    {t:'Siswa: "Karena sehadap sama besar, garis k pasti sejajar l." Tepatkah?',o:['Benar; sehadap sama besar membuktikan garis sejajar','Salah, perlu ukuran lain'],b:'Benar; sehadap sama besar membuktikan garis sejajar',p:'Kesamaan sudut sehadap adalah syarat dan bukti sejajar.'}]},
  {say:'Garis k TIDAK sejajar l. Pernyataan: "Sudut sehadapnya pasti tidak sama."',st:[
    {t:'Penilaian?',o:['Benar; sama besar hanya terjadi bila sejajar','Salah; bisa sama kebetulan'],b:'Benar; sama besar hanya terjadi bila sejajar',p:'Sehadap sama berarti sejajar, jadi tidak sejajar berarti tidak sama.'}]},
  {say:'Sudut yang TAMPAK siku-siku pada gambar, tanpa tanda siku-siku atau keterangan 90°.',st:[
    {t:'Apakah pasti 90°?',o:['Tidak; gambar bukan bukti ukuran','Ya'],b:'Tidak; gambar bukan bukti ukuran',p:'Gunakan keterangan, bukan tampilan.'}]},
  {say:'Sudut yang tampak lancip pada sketsa, tanpa keterangan ukuran.',st:[
    {t:'Apakah pasti kurang dari 90°?',o:['Tidak pasti','Ya, pasti'],b:'Tidak pasti',p:'Sketsa tidak selalu sesuai skala.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Sejajar atau tidak?';setKata(d.say);
  if(d.g)gambarDi('s4alat',d.g);else clear($('s4alat'));
  barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Percayai ukuran dan tanda pada gambar, bukan kesan mata.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: cerita dan aljabar ---- */
var R5=[
  {say:'Rel kereta: dua garis sejajar dipotong jalan. Sudut 1 = (2x+15)° dan sudut 5 (sehadap) = (3x−5)°.',g:{k:'sejajar',deg:55,sorot:[1,5],lab:{1:'(2x+15)°',5:'(3x−5)°'}},st:[
    {t:'Sehadap sama besar: 2x + 15 = 3x − 5. x = ?',o:['20','10','5'],b:'20',p:'15 + 5 = 3x − 2x.'},
    {t:'Sudut 1 = 2 × 20 + 15 = ?',o:['55°','45°','65°'],b:'55°',p:'55°.'}]},
  {say:'Sudut G = (5x−8)° dan H = (3x+12)° bertolak belakang.',st:[
    {t:'Bertolak belakang sama besar: 5x − 8 = 3x + 12. x = ?',o:['10','2','20'],b:'10',p:'2x = 20.'},
    {t:'Siswa menjumlahkan keduanya menjadi 180. Tepatkah?',o:['Keliru; bertolak belakang SAMA besar, bukan dijumlah 180°','Benar'],b:'Keliru; bertolak belakang SAMA besar, bukan dijumlah 180°',p:'Sudut G = 42°.'}]},
  {say:'Tangga disandarkan ke dinding. Dinding tegak lurus lantai; sudut W (tangga dan lantai) = 30°.',st:[
    {t:'Sudut Z (tangga dan dinding) = 90° − 30° = ?',o:['60°','150°','30°'],b:'60°',p:'Z dan W berpenyiku.'}]},
  {say:'Rangka atap: dua balok sejajar dan penyangga miring. Sudut 1 = 50°. Berapa sudut 8 (kanan-bawah di l)?',g:{k:'sejajar',deg:50,sorot:[1,8],lab:{1:'50°',8:'?'}},st:[
    {t:'Sudut 8 (kanan-bawah di l) berpelurus dengan sudut 5 (= sehadap 1 = 50°). Sudut 8 = ?',o:['130°','50°','40°'],b:'130°',p:'180° − 50° = 130°.'}]},
  {say:'Sudut M dan N berpenyiku; M adalah 15° lebih besar dari dua kali N.',st:[
    {t:'(2N + 15) + N = 90. N = ?',o:['25°','30°','35°'],b:'25°',p:'3N = 75.'}]},
  {say:'Sudut R dan S berpenyiku; R adalah 30° lebih kecil dari tiga kali S.',st:[
    {t:'(3S − 30) + S = 90. S = ?',o:['30°','45°','60°'],b:'30°',p:'4S = 120.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Cerita dan aljabar sudut.';setKata(d.say);
  if(d.g)gambarDi('s5alat',d.g);else clear($('s5alat'));
  barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Pilih hubungannya dulu: sama (=) atau jumlah (90° / 180°).');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Sehadap dan berseberangan sama; sepihak berjumlah 180.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-06'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.sejajar({deg:65,sorot:[1,5]}));
})();


/* ---- bonus: miringkan garis l ---- */
function mulaiBonus(){$('bA').value='70';$('bB').value='0';gambarBonus()}
function gambarBonus(){
  var th=+$('bA').value,tl=+$('bB').value;
  $('bNA').textContent='Sudut 1 = '+th+'°';$('bNB').textContent='Kemiringan garis l: '+tl+'°';
  gambarDi('bGambar',{k:'sejajar',deg:th,tilt:tl,lab:labSemua(th,tl),sorot:[1,5]});
  barisTeks('bTanda',[tl===0?'Garis sejajar: sehadap sama ('+th+'° = '+th+'°)':'Tidak sejajar: sehadap tidak sama ('+th+'° lawan '+(th-tl)+'°)']);
  msg('bmsg',tl===0?'good':'warn',tl===0?'Sudut sehadap sama besar membuktikan sejajar.':'Begitu garis l dimiringkan, sudut sehadap tidak lagi sama.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D06 = rakit(DASAR, { kode: 'D-06', data: DATA_D06 })
