import { rakit } from './bersama'
import { DATA_AC31 } from './latihan/ac31'

/**
 * Materi interaktif AC-31 "Baca Data, Pilih Ukuran" (diagram batang, skala
 * sumbu, rata-rata, median, modus, jangkauan, dan pencilan). Satu halaman
 * HTML mandiri, ditampilkan lewat iframe sandbox di `/mandiri/materi` dan
 * sebagai langkah Belajar di topik Misi AC-31. Disimpan sebagai string supaya
 * ikut terbundel di build tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-30 (anak kelas 5-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Baca diagram batang: sumbu mendatar = kategori, sumbu tegak = nilai;
 *    paling banyak, paling sedikit, total, selisih, dan rata-rata.
 * 2) Rata-rata: jumlah dibagi BANYAK data (bukan n + 1 atau n - 1); garis
 *    rata-rata pada diagram.
 * 3) Median, modus, jangkauan: urutkan dulu; median data genap = rata-rata dua
 *    nilai tengah; modus = paling sering; jangkauan = terbesar - terkecil.
 * 4) Skala jujur: sumbu mulai dari 0, interval konsisten, rentang sesuai data;
 *    sumbu mulai 50 membesar-besarkan beda; interval 100 mengecilkan data.
 * 5) Pencilan dan rancang: satu nilai ekstrem mengubah rata-rata banyak tetapi
 *    median sedikit; median lebih tahan; rancang nilai yang hilang.
 * Bonus: atur lima nilai; lihat rata-rata, median, modus, dan jangkauan.
 *
 * Soal Misi topik ini menguji: membaca diagram, pembagian rata-rata, median
 * setelah mengurutkan, modus, jangkauan, skala sumbu, pencilan, rancang
 * (nilai ke-n untuk rata-rata tertentu, nilai tengah, modus, jangkauan), dan
 * salah paham (bagi dengan n + 1, median tanpa urut, sumbu bukan 0, interval
 * tidak konsisten, rata-rata sama berarti sebaran sama, rata-rata selalu salah
 * satu nilai data).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac31.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-31 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Baca Data Pilih Ukuran</title>
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
      <h1>Baca Data, Pilih Ukuran</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo baca data dan pilih ukuran yang tepat!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Baca diagram batang.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Cari rata-rata.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Median, modus, jangkauan.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="fak" id="s3data"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Pilih skala yang jujur.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Pencilan dan rancang.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin data</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: atur lima nilai ulangan.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bN0"></div><input type="range" id="bV0" min="0" max="100" value="70" aria-label="Data 1">
      <div class="baca" id="bN1"></div><input type="range" id="bV1" min="0" max="100" value="70" aria-label="Data 2">
      <div class="baca" id="bN2"></div><input type="range" id="bV2" min="0" max="100" value="70" aria-label="Data 3">
      <div class="baca" id="bN3"></div><input type="range" id="bV3" min="0" max="100" value="70" aria-label="Data 4">
      <div class="baca" id="bN4"></div><input type="range" id="bV4" min="0" max="100" value="70" aria-label="Data 5">
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
  if(id==='intro')setKata('Ayo baca data dan pilih ukuran yang tepat!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo baca data dan pilih ukuran yang tepat!');

/* ---- alat bantu ---- */
function uniq(benar,calon){var o=[String(benar)];calon.forEach(function(x){x=String(x);if(o.length<3&&o.indexOf(x)<0&&x.charAt(0)!=='-')o.push(x)});var t=1;while(o.length<3){var y=String(+benar+t++);if(o.indexOf(y)<0)o.push(y)}return o}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(s.lihat)s.lihat();
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },(s.o.length===2||s.o.some(function(x){return x.length>18}))?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Lihat datanya lagi dan hitung pelan-pelan.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
function fm(x){return String(Math.round(x*100)/100).replace('.',',')}
function jml(a){var s=0;a.forEach(function(x){s+=x});return s}
function terurut(a){return a.slice().sort(function(p,q){return p-q})}
function medianDari(a){var u=terurut(a),n=u.length;return n%2?u[(n-1)/2]:(u[n/2-1]+u[n/2])/2}
function modusDari(a){var c={},b=0,r=null;a.forEach(function(x){c[x]=(c[x]||0)+1});for(var k in c)if(c[k]>b){b=c[k];r=+k}var banyak=0;for(var k2 in c)if(c[k2]===b)banyak++;return banyak===1&&b>1?r:null}
function skalaDari(mx){var st=mx<=10?2:(mx<=20?5:(mx<=50?10:(mx<=100?20:50)));return {st:st,hi:Math.ceil((mx+1)/st)*st}}
function dgm(nama,nil,o){
  var sk=skalaDari(Math.max.apply(null,nil)),g={k:'diagram',d:nil.map(function(v,i){return {l:nama?nama[i]:'S'+(i+1),v:v}}),lo:0,hi:sk.hi,langkah:sk.st,nilai:true,anim:false};
  if(o)for(var q in o)g[q]=o[q];return g;
}
function chips(id,arr,tandai){var w=$(id);clear(w);arr.forEach(function(x,i){w.appendChild(el('span',null,String(x)))});if(tandai!==undefined&&w.children[tandai])w.children[tandai].style.background='var(--ok)'}

/* ---- stasiun 1: baca diagram batang ---- */
var R1=[
  {j:'Kelereng 4 anak',n:['Ali','Budi','Citra','Doni'],v:[6,9,4,7],st:[
    {t:'Sumbu mendatar (bawah) pada diagram batang menampilkan...',o:['kategori (nama anak)','nilai (jumlah kelereng)','judul diagram'],b:'kategori (nama anak)',p:'Sumbu mendatar memuat kategori, sumbu tegak memuat nilai.'},
    {t:'Sumbu tegak (kiri) menampilkan...',o:['nilai atau frekuensi','kategori','sumber data'],b:'nilai atau frekuensi',p:'Tinggi batang dibaca pada sumbu tegak.'},
    {t:'Siapa yang memiliki kelereng paling sedikit?',o:['Citra','Ali','Budi'],b:'Citra',p:'Batang Citra paling pendek: 4.'},
    {t:'Berapa total kelereng keempat anak?',o:['26','22','30'],b:'26',p:'6 + 9 + 4 + 7 = 26.'}]},
  {j:'Buku dibaca sebulan',n:['Ani','Budi','Citra','Doni'],v:[5,8,3,6],st:[
    {t:'Siapa yang membaca buku paling banyak?',o:['Budi','Ani','Doni'],b:'Budi',p:'Batang Budi paling tinggi: 8.'},
    {t:'Selisih buku Budi dan Citra?',o:['5','11','3'],b:'5',p:'8 − 3 = 5.'},
    {t:'Total buku keempat siswa?',o:['22','21','24'],b:'22',p:'5 + 8 + 3 + 6 = 22.'}]},
  {j:'Panen mangga (kg)',n:['Hari 1','Hari 2','Hari 3'],v:[12,15,18],st:[
    {t:'Total panen tiga hari?',o:['45','33','48'],b:'45',p:'12 + 15 + 18 = 45 kg.'},
    {t:'Rata-rata panen per hari?',o:['15','45','12'],b:'15',p:'45 : 3 = 15 kg. Garis putus-putus menunjukkan rata-rata.',lihat:function(){gambarDi('s1alat',dgm(['Hari 1','Hari 2','Hari 3'],[12,15,18],{garis:[{v:15,l:'rata-rata 15'}],judul:'Panen mangga (kg)'}))}}]}
];
var r1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1];titik('s1dots',R1.length,r1);
  var t='Baca diagram: '+d.j+'.';$('s1say').textContent='Baca diagram batang.';setKata(t);
  gambarDi('s1alat',dgm(d.n,d.v,{judul:d.j}));barisTeks('s1tampil',[t]);
  $('s1next').disabled=true;clear($('s1aksi'));msg('s1msg','','Tinggi batang menunjukkan nilai data.');
  ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false});
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: rata-rata ---- */
var R2=[
  {v:[60,70,70,80,90]},
  {v:[60,70,80],x:{t:'Wati membagi 210 dengan 4 dan mendapat 52,5. Apa kesalahannya?',o:['Banyak datanya 3, bukan 4','Tidak ada kesalahan'],b:'Banyak datanya 3, bukan 4',p:'Bagilah dengan BANYAK data yang sebenarnya.'}},
  {v:[80,90,70,60],x:{t:'Sinta membagi 300 dengan 5 dan mendapat 60. Apa kesalahannya?',o:['Banyak datanya 4, bukan 5','Tidak ada kesalahan'],b:'Banyak datanya 4, bukan 5',p:'Ada 4 nilai, jadi dibagi 4: 75.'}},
  {v:[70,85,70,90,75]},{v:[65,75,85,95]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2],n=d.v.length,sum=jml(d.v),mean=sum/n;titik('s2dots',R2.length,r2);
  var t='Nilai ulangan '+n+' siswa: '+d.v.join(', ')+'. Cari rata-ratanya.';$('s2say').textContent='Cari rata-rata.';setKata(t);
  gambarDi('s2alat',dgm(null,d.v));barisTeks('s2tampil',[t]);
  var st=[
    {t:'Jumlah semua nilai = ?',o:uniq(sum,[sum-10,sum+10]),b:String(sum),p:d.v.join(' + ')+' = '+sum+'.'},
    {t:'Ada berapa data?',o:uniq(n,[n+1,n-1]),b:String(n),p:'Ada '+n+' data.'},
    {t:'Rata-rata = '+sum+' : '+n+' = ?',o:uniq(fm(mean),[fm(sum/(n+1)),fm(sum/(n-1))]),b:fm(mean),p:'Rata-rata = '+fm(mean)+'.',lihat:function(){gambarDi('s2alat',dgm(null,d.v,{garis:[{v:mean,l:'rata-rata '+fm(mean)}]}));barisTeks('s2tampil',[sum+' : '+n+' = '+fm(mean)])}}
  ];
  if(d.x)st.push(d.x);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Rata-rata = jumlah semua data : banyaknya data.');
  ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: median, modus, jangkauan ---- */
var R3=[{v:[60,70,70,80,90]},{v:[70,85,70,90,75]},{v:[9,4,6,2]},{v:[50,60,60,70,80,90]}];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3],v=d.v,n=v.length,u=terurut(v),med=medianDari(v),mod=modusDari(v),rg=u[n-1]-u[0];titik('s3dots',R3.length,r3);
  var t='Data: '+v.join(', ')+'.';$('s3say').textContent='Median, modus, jangkauan.';setKata(t);
  chips('s3data',v);gambarDi('s3alat',dgm(null,v));barisTeks('s3tampil',[t]);
  var asal=v[Math.floor(n/2)];
  var st=[
    {t:'Langkah PERTAMA mencari median adalah...',o:['mengurutkan data dari terkecil','langsung mengambil angka di tengah urutan penulisan','menjumlahkan semua data'],b:'mengurutkan data dari terkecil',p:'Median adalah nilai tengah SETELAH data diurutkan.',lihat:function(){chips('s3data',u);barisTeks('s3tampil',['Data terurut: '+u.join(', ')])}},
    {t:n%2?'Median = nilai paling tengah = ?':'Data genap: median = rata-rata dua nilai tengah ('+u[n/2-1]+' dan '+u[n/2]+') = ?',o:uniq(fm(med),[fm(asal),fm(jml(v)/n)]),b:fm(med),p:'Median = '+fm(med)+'.'}
  ];
  if(mod!==null)st.push({t:'Modus (nilai yang paling sering muncul) = ?',o:uniq(mod,[u[n-1],med]),b:String(mod),p:'Modus = '+mod+', muncul paling sering.'});
  st.push({t:'Jangkauan = terbesar − terkecil = '+u[n-1]+' − '+u[0]+' = ?',o:uniq(rg,[u[n-1]+u[0],u[n-1]]),b:String(rg),p:'Jangkauan = '+rg+'.'});
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Urutkan dulu sebelum mencari median.');
  ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: skala yang jujur ---- */
var R4=[
  {j:'mulai',st:[
    {t:'Diagram bawah dimulai dari 50. Perbedaan antar batang terlihat...',o:['lebih besar daripada sebenarnya','lebih kecil daripada sebenarnya','sama saja'],b:'lebih besar daripada sebenarnya',p:'Sumbu yang tidak dimulai dari 0 membesar-besarkan perbedaan.'},
    {t:'Sumbu tegak diagram batang sebaiknya dimulai dari...',o:['0','50','angka sembarang'],b:'0',p:'Dimulai dari 0 agar tinggi batang sebanding dengan nilai.'},
    {t:'Apakah skala mengubah nilai data sebenarnya?',o:['Tidak, hanya kesan visualnya','Ya, nilainya ikut berubah'],b:'Tidak, hanya kesan visualnya',p:'Nilai tetap, tetapi kesan beda bisa menipu.'}]},
  {j:'rata',st:[
    {t:'Skala 0, 10, 30, 100 berjarak sama padahal selisih angkanya berbeda. Masalahnya...',o:['jarak garis tidak sebanding dengan selisih angka, sehingga menyesatkan','tidak ada masalah'],b:'jarak garis tidak sebanding dengan selisih angka, sehingga menyesatkan',p:'Interval skala harus konsisten.'}]},
  {j:'besar',st:[
    {t:'Skala per 100 (0, 100, 200, 300) untuk data 5 sampai 25 membuat...',o:['batang sangat pendek dan sulit dibaca','batang sangat tinggi','nilai data berubah'],b:'batang sangat pendek dan sulit dibaca',p:'Skala harus sesuai rentang data.'},
    {t:'Skala yang paling sesuai untuk data 8 sampai 45 adalah...',o:['0, 10, 20, 30, 40, 50','0, 100, 200, 300','40, 45, 50'],b:'0, 10, 20, 30, 40, 50',p:'Dimulai dari 0, interval 10 konsisten, dan mencakup data.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4],w=$('s4alat');titik('s4dots',R4.length,r4);clear(w);w.style.flexDirection='column';
  var data=[55,60,65,70],nm=['Sen','Sel','Rab','Kam'];
  if(d.j==='mulai'){
    w.appendChild(GBR.diagram({d:data.map(function(v,i){return {l:nm[i],v:v}}),lo:0,hi:80,langkah:20,nilai:true,anim:false,judul:'Mulai dari 0'}));
    w.appendChild(GBR.diagram({d:data.map(function(v,i){return {l:nm[i],v:v}}),lo:50,hi:70,langkah:5,nilai:true,anim:false,judul:'Mulai dari 50'}));
    barisTeks('s4tampil',['Data penjualan buah yang sama, skala sumbu berbeda.']);
  }else if(d.j==='rata'){
    w.appendChild(GBR.diagram({d:[{l:'A',v:10},{l:'B',v:30},{l:'C',v:100}],lo:0,hi:100,label:[0,10,30,100],rata:true,nilai:true,anim:false,judul:'Skala tidak konsisten'}));
    barisTeks('s4tampil',['Jarak antar garis sama, tetapi selisih angkanya tidak.']);
  }else{
    w.appendChild(GBR.diagram({d:[{l:'A',v:5},{l:'B',v:15},{l:'C',v:25}],lo:0,hi:300,langkah:100,nilai:true,anim:false,judul:'Interval 100'}));
    barisTeks('s4tampil',['Data 5 sampai 25 dengan skala per 100.']);
  }
  $('s4say').textContent='Pilih skala yang jujur.';setKata('Pilih skala yang jujur.');
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Bandingkan tinggi batang dan angka pada sumbunya.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: pencilan dan rancang ---- */
var R5=[
  {say:'Nilai 5 siswa: 75, 78, 80, 82, dan 200 (200 seharusnya 82 karena salah input).',v:[75,78,80,82,200],st:[
    {t:'Rata-rata dengan nilai 200 = (75 + 78 + 80 + 82 + 200) : 5 = ?',o:['103','79','95'],b:'103',p:'515 : 5 = 103. Satu nilai ekstrem menarik rata-rata jauh.'},
    {t:'Setelah 200 diperbaiki menjadi 82, rata-ratanya?',o:['79,4','103','80'],b:'79,4',p:'397 : 5 = 79,4.'},
    {t:'Median data dengan 200 (terurut: 75, 78, 80, 82, 200) = ?',o:['80','103','82'],b:'80',p:'Nilai tengah tetap 80, hampir tidak terpengaruh.'},
    {t:'Ukuran mana yang lebih tahan terhadap pencilan?',o:['median','rata-rata','jumlah'],b:'median',p:'Pencilan mengubah rata-rata banyak, tetapi median sedikit.'}]},
  {say:'Rancang 4 nilai dengan rata-rata tepat 75. Tiga nilai pertama: 70, 80, 75.',st:[
    {t:'Jumlah yang dibutuhkan = 4 × 75 = ?',o:['300','225','79'],b:'300',p:'Rata-rata × banyak data = jumlah.'},
    {t:'Nilai keempat = 300 − (70 + 80 + 75) = ?',o:['75','225','70'],b:'75',p:'300 − 225 = 75.'}]},
  {say:'Rancang 5 data dengan median tepat 60. Empat data lain: 40, 50, 70, 80.',st:[
    {t:'Nilai tengah harus berada di urutan ke-3. Berapa nilainya?',o:['60','50','70'],b:'60',p:'Urutan: 40, 50, 60, 70, 80. Median = 60.'}]},
  {say:'Rancang 6 nilai dengan rata-rata tepat 70. Jumlah lima nilai pertama 340.',st:[
    {t:'Jumlah seluruhnya = 6 × 70 = ?',o:['420','340','76'],b:'420',p:'6 × 70 = 420.'},
    {t:'Nilai keenam = 420 − 340 = ?',o:['80','76','70'],b:'80',p:'420 − 340 = 80.'}]},
  {say:'Rancang 4 nilai dengan jangkauan tepat 35. Nilai terkecil 45.',st:[
    {t:'Nilai terbesar = terkecil + jangkauan = 45 + 35 = ?',o:['80','10','35'],b:'80',p:'Jangkauan = terbesar − terkecil, jadi terbesar = 80.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Pencilan dan rancang.';setKata(d.say);
  if(d.v)gambarDi('s5alat',dgm(null,d.v));else clear($('s5alat'));
  barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Rata-rata × banyak data = jumlah seluruh data.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Datamu dibaca dengan tepat.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-31'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.petak({n:5}));w.appendChild(el('div','baca','5² = 31'));
})();

/* ---- bonus: mesin data ---- */
function mulaiBonus(){var a=[60,70,70,80,90];for(var i=0;i<5;i++)$('bV'+i).value=String(a[i]);gambarBonus()}
function gambarBonus(){
  var v=[],i;for(i=0;i<5;i++){v.push(+$('bV'+i).value);$('bN'+i).textContent='Data '+(i+1)+': '+v[i]}
  var mean=jml(v)/5,med=medianDari(v),mod=modusDari(v),u=terurut(v),rg=u[4]-u[0];
  gambarDi('bGambar',dgm(null,v,{garis:[{v:mean,l:'rata-rata '+fm(mean)}]}));
  barisTeks('bTanda',['Rata-rata = '+jml(v)+' : 5 = '+fm(mean),'Median = '+fm(med)+' (terurut: '+u.join(', ')+')','Modus = '+(mod===null?'tidak ada':mod),'Jangkauan = '+u[4]+' − '+u[0]+' = '+rg]);
  msg('bmsg',rg>=60?'good':'',rg>=60?'Jangkauan besar: data tersebar lebar.':'Coba ubah satu nilai menjadi 0 atau 100 untuk melihat pengaruh pencilan.');
}
for(var bi=0;bi<5;bi++){(function(i){$('bV'+i).oninput=function(){gambarBonus()}})(bi)}
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC31 = rakit(DASAR, { kode: 'AC-31', data: DATA_AC31 })
