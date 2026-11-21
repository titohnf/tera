import { rakit } from './bersama'
import { DATA_D04 } from './latihan/d04'

/**
 * Materi interaktif D-04 "Data dan Diagram" (pertanyaan statistik, jenis data,
 * cara mengumpulkan, memilih dan membaca diagram, piktogram, diagram yang
 * menyesatkan, sampel, dan kesimpulan yang wajar). Satu halaman HTML mandiri,
 * ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah
 * Belajar di topik Misi D-04. Disimpan sebagai string supaya ikut terbundel.
 *
 * Lima stasiun praktik: 1) piktogram (geser simbol; setengah simbol; 4,5 x 6 =
 * 27), 2) jenis data (kategorik, diskrit, kontinu), observasi lawan angket,
 * pertanyaan bias, 3) memilih diagram dan membaca data (tertinggi, selisih,
 * total, persen), 4) sumbu terpotong yang menyesatkan (dua diagram bersisian),
 * 5) sampel proporsional, persen lawan jumlah, korelasi bukan sebab, jangan
 * menyimpulkan di luar data. Bonus: geser awal sumbu. Lalu tiga stasiun mesin
 * latihan (`bersama.ts`), bahannya di `latihan/d04.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Nama fungsi tidak boleh sama dengan nama di
 * pustaka gambar atau mesin (semuanya satu cakupan).
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Data dan Diagram</title>
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
      <h1>Data dan Diagram</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo baca dan sajikan data!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser simbolnya.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Banyak simbol"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Jenis data dan cara mengumpulkan.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Pilih diagram dan baca data.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Awas diagram yang menyesatkan.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Sampel dan kesimpulan.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: geser awal sumbu</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: geser awal sumbu tegak.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="0" max="40" step="10" value="0" aria-label="Awal sumbu">
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
  if(id==='intro')setKata('Ayo belajar membaca dan menyajikan data!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar membaca dan menyajikan data!');

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

/* ---- stasiun 1: piktogram, satu simbol mewakili banyak ---- */
var R1=[
  {e:'🍎',n:'Apel',per:5,tot:20,t:'Satu 🍎 mewakili 5 apel. Gambar simbol sampai 20 apel.',st:[
    {t:'Berapa simbol untuk 20 apel?',o:['4','5','20'],b:'4',p:'20 : 5 = 4 simbol.'},
    {t:'Penjualan Senin tergambar 4 simbol. Berapa apel?',o:['20 apel','4 apel','9 apel'],b:'20 apel',p:'4 × 5 = 20.'}]},
  {e:'📚',n:'Buku',per:6,tot:18,t:'Satu 📚 mewakili 6 buku. Gambar simbol sampai 18 buku.',st:[
    {t:'Kelas 7A: 3 simbol buku. Berapa buku?',o:['18 buku','9 buku','36 buku'],b:'18 buku',p:'3 × 6 = 18.'},
    {t:'Kelas 8B tergambar 4,5 simbol. Siswa menghitung 4,5 × 6 = 24. Tepatkah?',o:['Keliru. 4,5 × 6 = 27','Benar'],b:'Keliru. 4,5 × 6 = 27',p:'4 × 6 = 24 ditambah setengah simbol 3 = 27.'}]},
  {e:'☂️',n:'Payung',per:4,tot:28,t:'Satu ☂️ mewakili 4 payung. Gambar simbol sampai 28 payung.',st:[
    {t:'Berapa simbol untuk 28 payung?',o:['7','6','8'],b:'7',p:'28 : 4 = 7.'},
    {t:'Hari Senin tergambar 3,5 simbol. Berapa payung?',o:['14 payung','12 payung','15 payung'],b:'14 payung',p:'3 × 4 + 2 = 14.'},
    {t:'Siswa: "Piktogram tak bisa dipakai bila jumlahnya bukan kelipatan 4." Tepatkah?',o:['Salah. Dipakai simbol setengah atau seperempat','Benar'],b:'Salah. Dipakai simbol setengah atau seperempat',p:'Simbol boleh dipotong.'}]},
  {e:'📘',n:'Buku',per:10,tot:60,t:'Satu 📘 mewakili 10 buku. Gambar simbol sampai 60 buku.',st:[
    {t:'Piktogram cocok untuk membedakan tepat 137 dan 138 siswa?',o:['Tidak; kurang tepat untuk selisih satu satuan','Ya'],b:'Tidak; kurang tepat untuk selisih satu satuan',p:'Piktogram memberi gambaran, bukan angka halus.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){var d=R1[r1];gambarDi('s1alat',{k:'baris',baris:[{e:d.e,n:v,l:d.n}]})}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='0';sl.max='10';sl.step='1';sl.value='0';sl.disabled=false;
  $('s1say').textContent=d.t;setKata(d.t);
  gambar1(0);barisTeks('s1tampil',['0 simbol = 0 '+d.n.toLowerCase()]);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Geser untuk menambah simbol. Tiap simbol bernilai '+d.per+'.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;
  gambar1(v);barisTeks('s1tampil',[v+' simbol = '+v+' × '+d.per+' = '+(v*d.per)]);
  if(v*d.per===d.tot){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good',d.tot+' '+d.n.toLowerCase()+' digambar dengan '+v+' simbol.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai jumlahnya '+d.tot+'.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: pertanyaan, jenis data, cara mengumpulkan ---- */
var R2=[
  {say:'Mana yang pertanyaan statistik (jawabannya bervariasi antar orang)?',st:[
    {t:'Pilih pertanyaan statistik.',o:['Berapa lama waktu tiap siswa sampai ke sekolah?','Berapa jumlah siswa kelas 7A hari ini?','Berapa 4 + 5?'],b:'Berapa lama waktu tiap siswa sampai ke sekolah?',p:'Jawabannya berbeda-beda, jadi perlu data.'}]},
  {say:'Warna favorit siswa di kelas.',st:[
    {t:'Jenis datanya...',o:['Kategorik','Numerik diskrit','Numerik kontinu'],b:'Kategorik',p:'Berupa label (warna), bukan angka hasil ukur.'}]},
  {say:'Tinggi badan siswa dalam cm.',st:[
    {t:'Jenis datanya...',o:['Numerik kontinu','Numerik diskrit','Kategorik'],b:'Numerik kontinu',p:'Hasil mengukur, bisa desimal.'}]},
  {say:'Jumlah saudara kandung tiap siswa.',st:[
    {t:'Jenis datanya...',o:['Numerik diskrit','Numerik kontinu','Kategorik'],b:'Numerik diskrit',p:'Hasil menghitung, selalu bilangan bulat.'}]},
  {say:'Jumlah kendaraan yang lewat di depan sekolah tiap 10 menit.',st:[
    {t:'Jenis datanya...',o:['Numerik diskrit','Numerik kontinu','Kategorik'],b:'Numerik diskrit',p:'Dihitung: 0, 1, 2, ...'}]},
  {say:'Mengamati langsung kendaraan yang lewat, tanpa bertanya kepada siapa pun.',st:[
    {t:'Cara mengumpulkan datanya disebut...',o:['observasi','angket','wawancara'],b:'observasi',p:'Mengamati langsung. Angket = daftar pertanyaan tertulis.'},
    {t:'Observasi dan angket adalah cara yang persis sama. Tepatkah?',o:['Salah. Observasi mengamati; angket mengajukan pertanyaan','Benar'],b:'Salah. Observasi mengamati; angket mengajukan pertanyaan',p:'Cara dan hasilnya berbeda.'}]},
  {say:'Pertanyaan survei: "Apakah kamu setuju bahwa kantin yang murah dan enak ini sebaiknya buka lebih lama?"',st:[
    {t:'Pertanyaan ini...',o:['bias: kata "murah dan enak" mengarahkan jawaban','netral dan baik'],b:'bias: kata "murah dan enak" mengarahkan jawaban',p:'Pertanyaan harus jelas dan netral.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Jenis data dan cara mengumpulkan.';setKata(d.say);
  clear($('s2alat'));barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Kategorik: label. Diskrit: dihitung. Kontinu: diukur.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: pilih diagram dan baca data ---- */
var R3=[
  {say:'Membandingkan jumlah siswa pada 4 ekstrakurikuler.',st:[
    {t:'Diagram yang paling sesuai...',o:['Diagram batang','Diagram garis','Diagram lingkaran'],b:'Diagram batang',p:'Batang membandingkan kategori yang terpisah.'}]},
  {say:'Perubahan suhu kota selama 7 hari berturut-turut.',st:[
    {t:'Diagram yang paling sesuai...',o:['Diagram garis','Diagram batang','Diagram lingkaran'],b:'Diagram garis',p:'Garis menunjukkan perubahan dari waktu ke waktu.'}]},
  {say:'Persentase jenis kendaraan ke sekolah dari seluruh siswa.',st:[
    {t:'Diagram yang paling sesuai...',o:['Diagram lingkaran','Diagram garis','Piktogram'],b:'Diagram lingkaran',p:'Lingkaran menunjukkan bagian dari keseluruhan 100%.'}]},
  {say:'Pengunjung pameran buku: Hari 1 = 80, 2 = 95, 3 = 60, 4 = 110, 5 = 100.',g:{k:'diagram',d:[{l:'H1',v:80},{l:'H2',v:95},{l:'H3',v:60},{l:'H4',v:110},{l:'H5',v:100}],lo:0,hi:120,langkah:20,nilai:true},st:[
    {t:'Hari dengan pengunjung tertinggi?',o:['Hari 4','Hari 5','Hari 2'],b:'Hari 4',p:'110 pengunjung.'},
    {t:'Selisih tertinggi dan terendah?',o:['50','30','110'],b:'50',p:'110 − 60 = 50.'},
    {t:'Total pengunjung 5 hari?',o:['445','435','455'],b:'445',p:'80+95+60+110+100 = 445.'}]},
  {say:'Penjualan buku: Senin 15, Selasa 20, Rabu 12, Kamis 25.',g:{k:'diagram',d:[{l:'Sen',v:15},{l:'Sel',v:20},{l:'Rab',v:12},{l:'Kam',v:25}],lo:0,hi:30,langkah:10,nilai:true},st:[
    {t:'Total buku terjual 4 hari?',o:['72','70','62'],b:'72',p:'15+20+12+25 = 72.'},
    {t:'Rabu ke Kamis pengunjung...',o:['naik 13','turun 13','tetap'],b:'naik 13',p:'25 − 12 = 13.'}]},
  {say:'Diagram lingkaran jajanan 100 siswa: Bakso 35%, Mie ayam 30%, Batagor 25%, Es krim 15%.',g:{k:'bar',atas:'100 siswa',bagian:[{l:'Bakso 35%',v:35,w:'biru'},{l:'Mie 30%',v:30,w:'merah'},{l:'Batagor 25%',v:25,w:'hijau'},{l:'Es 15%',v:15,w:'ungu'}]},st:[
    {t:'Siswa yang memilih bakso atau batagor?',o:['60','65','35'],b:'60',p:'35% + 25% = 60% dari 100 siswa.'},
    {t:'Siswa memilih diagram lingkaran untuk pengunjung perpustakaan tiap minggu setahun. Tepatkah?',o:['Kurang tepat. Data berurutan waktu lebih cocok diagram garis','Tepat, angkanya bisa jadi persen'],b:'Kurang tepat. Data berurutan waktu lebih cocok diagram garis',p:'Jenis diagram mengikuti jenis data dan tujuan.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Pilih diagram dan baca data.';setKata(d.say);
  if(d.g)gambarDi('s3alat',d.g);else clear($('s3alat'));
  barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Batang: bandingkan. Garis: perubahan waktu. Lingkaran: bagian dari 100%.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: diagram yang menyesatkan ---- */
var R4=[
  {say:'Penjualan sepatu: A = 45, B = 50, C = 48. Dua diagram, data sama.',lo:40,st:[
    {t:'Diagram atas sumbunya mulai dari 40, diagram bawah mulai dari 0. Mana yang membuat beda tampak besar?',o:['Diagram atas (sumbu mulai dari 40)','Diagram bawah (sumbu mulai dari 0)'],b:'Diagram atas (sumbu mulai dari 40)',p:'Sumbu terpotong membesarkan selisih kecil.'},
    {t:'Selisih nyata penjualan tertinggi dan terendah?',o:['5','10','50'],b:'5',p:'50 − 45 = 5 pasang saja.'},
    {t:'Cara memperbaiki diagram?',o:['Mulai sumbu dari 0 dengan skala konsisten','Mulai dari 40 supaya jelas','Hapus label sumbu'],b:'Mulai sumbu dari 0 dengan skala konsisten',p:'Batang harus sebanding dengan nilainya.'}]},
  {say:'Penjualan online naik dari Rp5 juta (Januari) ke Rp8 juta (Juni).',lo:4,st:[
    {t:'Diagram dengan sumbu mulai dari 4 membuat kenaikan tampak...',o:['lebih dramatis daripada yang sebenarnya','lebih kecil','sama saja'],b:'lebih dramatis daripada yang sebenarnya',p:'Tinggi batang tidak lagi sebanding nilai.'}]},
  {say:'Tiga produk berkisar 92 sampai 98 unit, sumbu mulai dari 90.',lo:90,st:[
    {t:'Penilaian diagram itu...',o:['Berpotensi menyesatkan; selisih kecil tampak besar','Sudah benar'],b:'Berpotensi menyesatkan; selisih kecil tampak besar',p:'Mulai dari 0.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function duaDiagram(d){
  var w=$('s4alat');clear(w);w.style.flexWrap='wrap';w.style.gap='6px';
  var data=r4===0?[{l:'A',v:45},{l:'B',v:50},{l:'C',v:48}]:r4===1?[{l:'Jan',v:5},{l:'Jun',v:8}]:[{l:'P1',v:92},{l:'P2',v:98},{l:'P3',v:95}];
  var hi=r4===0?50:r4===1?8:100;
  w.appendChild(GBR.diagram({d:data,lo:d.lo,hi:hi+(r4===0?5:r4===1?2:2),langkah:r4===0?5:r4===1?1:2,nilai:true,judul:'Sumbu mulai '+d.lo,anim:false}));
  w.appendChild(GBR.diagram({d:data,lo:0,hi:r4===0?60:r4===1?10:100,langkah:r4===0?20:r4===1?2:20,nilai:true,judul:'Sumbu mulai 0',anim:false}));
}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Awas diagram yang menyesatkan.';setKata(d.say);
  duaDiagram(d);barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Lihat awal sumbu tegak sebelum menyimpulkan.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: sampel dan kesimpulan ---- */
var R5=[
  {say:'Peneliti ingin pendapat SELURUH siswa tentang seragam baru, tetapi hanya mewawancarai 10 siswa yang lewat di depan ruang OSIS.',st:[
    {t:'Masalahnya...',o:['Sampel kecil dan mungkin tidak mewakili seluruh siswa','Tidak ada masalah','Sampel terlalu besar'],b:'Sampel kecil dan mungkin tidak mewakili seluruh siswa',p:'Sampel harus mewakili populasi.'}]},
  {say:'Sekolah: 300 siswa kelas 7, 280 kelas 8, 260 kelas 9. Sampel proporsional 10% dari tiap angkatan.',st:[
    {t:'Siswa kelas 7 yang diambil = 10% × 300 = ?',o:['30','28','26'],b:'30',p:'30 siswa; kelas 8: 28; kelas 9: 26.'},
    {t:'Total sampel = 30 + 28 + 26 = ?',o:['84','80','90'],b:'84',p:'10% dari 840 = 84.'}]},
  {say:'Dusun Mekar 240 warga; sampel proporsional 15%.',st:[
    {t:'15% × 240 = ?',o:['36','24','15'],b:'36',p:'0,15 × 240 = 36 warga.'}]},
  {say:'Sekolah A: 80% dari 20 peserta lulus. Sekolah B: 75% dari 200 peserta lulus.',st:[
    {t:'Siswa lulus Sekolah A dan B?',o:['16 dan 150','80 dan 75','16 dan 15'],b:'16 dan 150',p:'80% × 20 = 16; 75% × 200 = 150.'},
    {t:'Siswa: "A pasti punya lulusan lebih banyak karena 80% > 75%." Tepatkah?',o:['Keliru. Persen harus dikalikan jumlah peserta','Benar'],b:'Keliru. Persen harus dikalikan jumlah peserta',p:'Persen besar belum tentu jumlah besar.'}]},
  {say:'Penjualan es krim naik bersama kejadian tenggelam di musim panas.',st:[
    {t:'"Membeli es krim menyebabkan orang tenggelam." Tepatkah?',o:['Keliru. Keduanya naik karena musim panas; berhubungan belum tentu sebab-akibat','Benar'],b:'Keliru. Keduanya naik karena musim panas; berhubungan belum tentu sebab-akibat',p:'Ada faktor ketiga: cuaca panas.'}]},
  {say:'Tiket bioskop 5 hari: Sen 120, Sel 90, Rab 150, Kam 80, Jum 200.',st:[
    {t:'"Jumat tertinggi, jadi setiap akhir pekan pasti terlaku." Tepatkah?',o:['Keliru. Data hanya 5 hari, belum mencakup akhir pekan','Benar'],b:'Keliru. Data hanya 5 hari, belum mencakup akhir pekan',p:'Jangan menyimpulkan di luar data.'}]},
  {say:'OSIS ingin tahu ekstrakurikuler yang diminati.',st:[
    {t:'Pertanyaan survei yang paling tepat...',o:['Ekstrakurikuler apa yang paling ingin kamu ikuti tahun depan? (pilih satu)','Bukankah ekskul pramuka paling seru?','Apa kamu suka sekolah?'],b:'Ekstrakurikuler apa yang paling ingin kamu ikuti tahun depan? (pilih satu)',p:'Jelas, netral, dan datanya bisa dibandingkan.'},
    {t:'Diagram untuk 6 pilihan agar mudah dibandingkan?',o:['Diagram batang','Diagram garis'],b:'Diagram batang',p:'Kategori terpisah.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Sampel dan kesimpulan.';setKata(d.say);
  clear($('s5alat'));barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Wakili semua kelompok, dan jangan menyimpulkan lebih dari yang ditunjukkan data.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Data baik dimulai dari pertanyaan yang baik.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-04'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.diagram({d:[{l:'A',v:4},{l:'B',v:7},{l:'C',v:5}],lo:0,hi:8,langkah:2,nilai:true}));
})();


/* ---- bonus: geser awal sumbu ---- */
function mulaiBonus(){$('bA').value='0';gambarBonus()}
function gambarBonus(){
  var lo=+$('bA').value;
  $('bNA').textContent='Sumbu tegak mulai dari '+lo;
  gambarDi('bGambar',{k:'diagram',d:[{l:'A',v:45},{l:'B',v:50},{l:'C',v:48}],lo:lo,hi:55,langkah:5,nilai:true,anim:false});
  barisTeks('bTanda',['Selisih nyata B dan A: 5 pasang. Tinggi batang B dibanding A: '+(lo===0?'1,11 kali':fm((50-lo)/(45-lo))+' kali')]);
  msg('bmsg',lo===0?'good':'warn',lo===0?'Mulai dari 0: tinggi batang sebanding dengan nilainya.':'Sumbu dipotong: selisih kecil tampak besar.');
}
$('bA').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D04 = rakit(DASAR, { kode: 'D-04', data: DATA_D04 })
