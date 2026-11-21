import { rakit } from './bersama'
import { DATA_D03 } from './latihan/d03'

/**
 * Materi interaktif D-03 "Rasio dan Perbandingan" (rasio, membagi menurut
 * rasio, perbandingan senilai dan berbalik nilai, skala peta dan maket, serta
 * cerita campuran). Satu halaman HTML mandiri, ditampilkan lewat iframe
 * sandbox di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi D-03.
 * Disimpan sebagai string supaya ikut terbundel di build.
 *
 * Gaya sama dengan D-02 (siswa SMP kelas 7, tiap stasiun beranimasi). Lima
 * stasiun praktik:
 * 1) Rasio sebagai perbandingan: geser kelompok (3 : 4 jadi 15 : 20); rasio
 *    bukan selisih; urutan menentukan; menyederhanakan.
 * 2) Bagi menurut rasio: jumlah bagian, satu bagian, hasil (2 : 3 : 5 dari
 *    Rp200.000; keliling dan luas dari rasio sisi; umur).
 * 3) Senilai atau berbalik nilai: harga satuan, kecepatan, pekerja kali hari
 *    tetap (setengah pekerja bukan setengah hari).
 * 4) Skala: 1 : 500.000 berarti 1 cm = 5 km; cm ke km dibagi 100.000; maket;
 *    skala luas = kuadrat skala panjang.
 * 5) Campuran dan cerita: beras campuran, untung : modal, resep diperbanyak.
 * Bonus: mesin skala peta.
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/d03.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Nama fungsi di halaman ini tidak boleh sama
 * dengan nama di pustaka gambar atau mesin (mis. sg, el, belah, kanvas, fmtId,
 * titikRibu, koma2): semuanya satu cakupan.
 *
 * Tombol "Ayo berlatih" mengirim pesan `ayo-berlatih` ke halaman induk
 * (`PenampilMateri`), yang berpindah ke topik D-03 di Misi.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rasio dan Perbandingan</title>
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
      <h1>Rasio dan Perbandingan</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo bandingkan, bagi, dan perkecil!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser kelompoknya.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Banyak kelompok"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Bagi menurut rasio.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Senilai atau berbalik nilai?</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Skala peta dan maket.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Campuran dan cerita.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin skala peta</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih jarak di peta dan skalanya.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="1" max="12" step="1" value="6" aria-label="Jarak di peta (cm)">
      <div class="baca" id="bNB"></div><div class="tmp" id="bOp"></div></div>
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
  if(id==='intro')setKata('Ayo belajar membandingkan dengan rasio!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar membandingkan dengan rasio!');

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

/* ---- stasiun 1: rasio sebagai perbandingan ---- */
var R1=[
  {a:3,b:4,ea:'🔴',eb:'🔵',na:'Merah',nb:'Biru',k:5,t:'Geser sampai kelereng merah ada 15.',st:[
    {t:'Kelereng merah 15. Berapa kelereng biru kalau rasionya tetap 3 : 4?',o:['20','19','12'],b:'20',p:'Ada 5 kelompok: 5 × 4 = 20 biru.'},
    {t:'Rasio merah : biru sekarang 15 : 20. Bentuk paling sederhana?',o:['3 : 4','4 : 3','5 : 4'],b:'3 : 4',p:'15 : 20 dibagi 5 menjadi 3 : 4.'}]},
  {a:2,b:5,ea:'🍯',eb:'💧',na:'Sirup',nb:'Air',k:4,t:'Geser sampai sirup ada 8 gelas kecil.',st:[
    {t:'Sirup 8. Berapa air agar rasa sirup : air tetap 2 : 5?',o:['20','16','12'],b:'20',p:'4 kelompok: 4 × 5 = 20 air.'},
    {t:'Berapa bagian dari seluruh minuman yang berupa sirup?',o:['2/7','2/5','8/20'],b:'2/7',p:'Total 7 bagian, sirup 2 bagian: 2/7 (8/28 sama dengan 2/7).'}]},
  {a:5,b:3,ea:'🪙',eb:'🪙',na:'Rani',nb:'Adik',k:4,t:'Tiap koin Rp1.000. Geser sampai uang Rani 20 koin.',st:[
    {t:'Rasio uang Rani : adik = 5 : 3. Sekarang Rani 20 koin, adik berapa koin?',o:['12','18','15'],b:'12',p:'4 × 3 = 12 koin.'},
    {t:'Dedi: "Rasio 5 : 3 berarti Rani selalu hanya Rp2.000 lebih banyak." Tepatkah?',o:['Salah. Rasio hanya perbandingan; selisih bisa berubah (sekarang 8 koin)','Benar'],b:'Salah. Rasio hanya perbandingan; selisih bisa berubah (sekarang 8 koin)',p:'Rasio bukan selisih. Uang Rani 5 bagian, adik 3 bagian.'}]},
  {a:2,b:3,ea:'🟥',eb:'🟦',na:'Merah',nb:'Biru',k:6,t:'Geser sampai ada 12 petak merah.',st:[
    {t:'12 merah dan 18 biru. Rasio 12 : 18 paling sederhana?',o:['2 : 3','3 : 2','6 : 9'],b:'2 : 3',p:'Bagi dua-duanya dengan 6.'},
    {t:'Rasio biru : merah ditulis...',o:['3 : 2','2 : 3'],b:'3 : 2',p:'Urutan menentukan: yang disebut dulu ditulis dulu.'}]},
  {a:5,b:2,ea:'🌾',eb:'🍬',na:'Tepung',nb:'Gula',k:3,t:'Geser sampai tepung ada 15 sendok.',st:[
    {t:'Tepung 15 sendok. Berapa sendok gula (rasio tetap 5 : 2)?',o:['6','5','10'],b:'6',p:'3 kelompok: 3 × 2 = 6 gula.'},
    {t:'Rasio 5 : 2 dibaca...',o:['5 berbanding 2','5 dikurangi 2','5 lebih banyak 3'],b:'5 berbanding 2',p:'Tanda : dibaca "berbanding".'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){var d=R1[r1];gambarDi('s1alat',{k:'baris',baris:[{e:d.ea,n:d.a*v,l:d.na},{e:d.eb,n:d.b*v,l:d.nb}]})}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='1';sl.max='8';sl.step='1';sl.value='1';sl.disabled=false;
  $('s1say').textContent=d.t;setKata(d.t);
  gambar1(1);barisTeks('s1tampil',[d.na+' : '+d.nb+' = '+d.a+' : '+d.b]);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Geser kelompoknya. Bagian sebanyak itu selalu bertambah bersama.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;
  gambar1(v);barisTeks('s1tampil',[(d.a*v)+' : '+(d.b*v)+'  (sama dengan '+d.a+' : '+d.b+')']);
  if(v===d.k){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good',(d.a*v)+' : '+(d.b*v)+' tetap senilai '+d.a+' : '+d.b+'.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai kelompoknya pas.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: membagi menurut rasio ---- */
var R2=[
  {say:'Uang Ani, Budi, dan Citra berbanding 2 : 3 : 5. Total Rp200.000.',g:{k:'bar',atas:'Rp200.000',bagian:[{l:'Ani 2',v:2,w:'biru'},{l:'Budi 3',v:3,w:'merah'},{l:'Citra 5',v:5,w:'hijau'}]},st:[
    {t:'Total bagian = 2 + 3 + 5 = ?',o:['10','8','15'],b:'10',p:'10 bagian.'},
    {t:'Satu bagian = 200.000 : 10 = ?',o:['20.000','10.000','40.000'],b:'20.000',p:'Rp20.000 per bagian.'},
    {t:'Uang Citra (5 bagian) = ?',o:['100.000','60.000','50.000'],b:'100.000',p:'5 × 20.000 = 100.000.'},
    {t:'Selisih uang Citra dan Ani = 3 bagian = ?',o:['60.000','80.000','30.000'],b:'60.000',p:'3 × 20.000 = 60.000.'}]},
  {say:'Tabungan Sinta : Rina = 3 : 4. Total Rp140.000.',g:{k:'bar',atas:'Rp140.000',bagian:[{l:'Sinta 3',v:3,w:'biru'},{l:'Rina 4',v:4,w:'merah'}]},st:[
    {t:'Satu bagian = 140.000 : 7 = ?',o:['20.000','35.000','14.000'],b:'20.000',p:'Rp20.000.'},
    {t:'Tabungan Rina = 4 × 20.000 = ?',o:['80.000','60.000','70.000'],b:'80.000',p:'Rp80.000. Sinta Rp60.000.'}]},
  {say:'Panjang : lebar persegi panjang = 5 : 3, kelilingnya 64 cm.',g:{k:'bar',atas:'setengah keliling 32 cm',bagian:[{l:'p = 5',v:5,w:'biru'},{l:'l = 3',v:3,w:'merah'}]},st:[
    {t:'Panjang + lebar = keliling : 2 = ?',o:['32','64','16'],b:'32',p:'32 cm untuk 8 bagian.'},
    {t:'Satu bagian = 32 : 8 = 4. Panjang dan lebarnya?',o:['20 cm dan 12 cm','15 cm dan 9 cm','25 cm dan 7 cm'],b:'20 cm dan 12 cm',p:'5 × 4 = 20 dan 3 × 4 = 12.'},
    {t:'Luasnya = 20 × 12 = ?',o:['240 cm²','64 cm²','96 cm²'],b:'240 cm²',p:'Luas 240 cm².'}]},
  {say:'Uang Wati : Yuni = 5 : 8. Uang Wati Rp75.000.',g:{k:'bar',bagian:[{l:'Wati 5',v:5,w:'biru'},{l:'Yuni 8',v:8,w:'merah'}]},st:[
    {t:'Satu bagian = 75.000 : 5 = ?',o:['15.000','5.000','25.000'],b:'15.000',p:'Rp15.000.'},
    {t:'Uang Yuni = 8 × 15.000 = ?',o:['120.000','100.000','135.000'],b:'120.000',p:'Rp120.000.'}]},
  {say:'Umur Andi : Bella : Caca = 3 : 4 : 5. Total 48 tahun.',g:{k:'bar',atas:'48 tahun',bagian:[{l:'Andi 3',v:3,w:'biru'},{l:'Bella 4',v:4,w:'merah'},{l:'Caca 5',v:5,w:'hijau'}]},st:[
    {t:'Satu bagian = 48 : 12 = ?',o:['4','6','3'],b:'4',p:'4 tahun per bagian.'},
    {t:'Umur Caca dan selisihnya dengan Andi?',o:['20 tahun; selisih 8 tahun','15 tahun; selisih 6 tahun','20 tahun; selisih 2 tahun'],b:'20 tahun; selisih 8 tahun',p:'Caca 5 × 4 = 20, Andi 12; selisih 2 bagian = 8.'}]},
  {say:'Sirup dan air = 2 : 5 untuk 490 ml minuman.',g:{k:'bar',atas:'490 ml',bagian:[{l:'Sirup 2',v:2,w:'merah'},{l:'Air 5',v:5,w:'biru'}]},st:[
    {t:'Satu bagian = 490 : 7 = ?',o:['70 ml','98 ml','49 ml'],b:'70 ml',p:'70 ml.'},
    {t:'Sirup = 2 × 70 = ?',o:['140 ml','350 ml','98 ml'],b:'140 ml',p:'140 ml sirup, 350 ml air.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Bagi menurut rasio.';setKata(d.say);
  gambarDi('s2alat',d.g);barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Jumlahkan bagian, cari satu bagian, lalu kalikan.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: senilai dan berbalik nilai ---- */
var R3=[
  {say:'Mobil menempuh 180 km dalam 3 jam. Berapa jam untuk 300 km (kecepatan tetap)?',g:{k:'tabel',baris:[['Jarak (km)','Waktu (jam)'],['180','3'],['300','?']]},st:[
    {t:'Makin jauh jaraknya, waktunya makin lama. Hubungan ini...',o:['senilai','berbalik nilai'],b:'senilai',p:'Keduanya naik bersama dengan perbandingan tetap.'},
    {t:'Kecepatan = 180 : 3 = ?',o:['60 km/jam','540 km/jam','177 km/jam'],b:'60 km/jam',p:'60 km tiap jam.'},
    {t:'Waktu untuk 300 km = 300 : 60 = ?',o:['5 jam','4 jam','6 jam'],b:'5 jam',p:'5 jam.'}]},
  {say:'Toko A: 3 pensil Rp7.500. Toko B: 5 pensil Rp11.500.',g:{k:'tabel',baris:[['Toko','Banyak','Harga'],['A','3','7.500'],['B','5','11.500']]},st:[
    {t:'Harga satu pensil di Toko A = 7.500 : 3 = ?',o:['2.500','2.300','3.000'],b:'2.500',p:'Rp2.500.'},
    {t:'Harga satu pensil di Toko B = 11.500 : 5 = ?',o:['2.300','2.500','2.800'],b:'2.300',p:'Rp2.300.'},
    {t:'Yang lebih murah per pensil?',o:['Toko B','Toko A','Sama'],b:'Toko B',p:'Bandingkan harga satuan.'},
    {t:'Pedagang: "150.000 lebih murah daripada 240.000, jadi tokoku (3 kaos) pasti lebih murah daripada toko sebelah (5 kaos)." Tepatkah?',o:['Keliru. Banyak barangnya berbeda; bandingkan harga per kaos (50.000 lawan 48.000)','Benar'],b:'Keliru. Banyak barangnya berbeda; bandingkan harga per kaos (50.000 lawan 48.000)',p:'Selalu cari harga satuan.'}]},
  {say:'6 pekerja menyelesaikan proyek dalam 10 hari. Berapa hari jika 12 pekerja?',g:{k:'tabel',baris:[['Pekerja','Hari'],['6','10'],['12','?']]},st:[
    {t:'Makin banyak pekerja, harinya makin sedikit. Hubungan ini...',o:['berbalik nilai','senilai'],b:'berbalik nilai',p:'Satu naik, yang lain turun.'},
    {t:'Pekerja × hari tetap: 6 × 10 = ?',o:['60','16','4'],b:'60',p:'60 pekerja-hari.'},
    {t:'Untuk 12 pekerja: 60 : 12 = ?',o:['5 hari','20 hari','6 hari'],b:'5 hari',p:'Pekerja dua kali lipat, harinya separuh.'}]},
  {say:'8 pekerja menyelesaikan proyek dalam 6 hari. Berapa hari jika tinggal 4 pekerja?',g:{k:'tabel',baris:[['Pekerja','Hari'],['8','6'],['4','?']]},st:[
    {t:'Pekerja × hari = 8 × 6 = ?',o:['48','14','2'],b:'48',p:'48 pekerja-hari.'},
    {t:'Dengan 4 pekerja: 48 : 4 = ?',o:['12 hari','3 hari','24 hari'],b:'12 hari',p:'Pekerja separuh, harinya dua kali lipat.'},
    {t:'Siswa: "10 pekerja 6 hari, jadi 5 pekerja (setengah) 3 hari (setengah)." Tepatkah?',o:['Salah. Berbalik nilai: 5 pekerja butuh 12 hari','Benar'],b:'Salah. Berbalik nilai: 5 pekerja butuh 12 hari',p:'Pekerja separuh berarti hari dua kali lipat.'}]},
  {say:'Kereta menempuh 240 km dalam 4 jam. Berapa km dalam 7 jam (kecepatan sama)?',g:{k:'tabel',baris:[['Waktu (jam)','Jarak (km)'],['4','240'],['7','?']]},st:[
    {t:'Kecepatan = 240 : 4 = ?',o:['60 km/jam','4 km/jam','236 km/jam'],b:'60 km/jam',p:'60 km/jam.'},
    {t:'Jarak 7 jam = 60 × 7 = ?',o:['420 km','247 km','280 km'],b:'420 km',p:'420 km.'}]},
  {say:'4 pekerja menyelesaikan pekerjaan dalam 15 hari.',g:{k:'tabel',baris:[['Pekerja','Hari'],['4','15'],['6','?']]},st:[
    {t:'Pasangan mana yang KONSISTEN dengan aturan berbalik nilai ini?',o:['6 pekerja, 10 hari','6 pekerja, 20 hari','6 pekerja, 5 hari'],b:'6 pekerja, 10 hari',p:'4 × 15 = 60 = 6 × 10.'},
    {t:'Siswa: "Dua besaran yang sama-sama naik pasti senilai." Tepatkah?',o:['Salah. Harus berbanding tetap; tinggi badan dan umur sama-sama naik tetapi tidak senilai','Benar'],b:'Salah. Harus berbanding tetap; tinggi badan dan umur sama-sama naik tetapi tidak senilai',p:'Senilai berarti hasil bagi tetap.'}]},
  {say:'Toko C: 4 buku Rp20.000. Toko D: 7 buku Rp38.500.',g:{k:'tabel',baris:[['Toko','Banyak','Harga'],['C','4','20.000'],['D','7','38.500']]},st:[
    {t:'Harga per buku di C dan D?',o:['5.000 dan 5.500','5.500 dan 5.000','5.000 dan 5.000'],b:'5.000 dan 5.500',p:'20.000 : 4 = 5.000; 38.500 : 7 = 5.500.'},
    {t:'Lebih murah?',o:['Toko C','Toko D'],b:'Toko C',p:'Bandingkan harga satuan, bukan jumlah totalnya.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Senilai atau berbalik nilai?';setKata(d.say);
  gambarDi('s3alat',d.g);barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Senilai: hasil bagi tetap. Berbalik nilai: hasil kali tetap.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: skala peta dan maket ---- */
var R4=[
  {say:'Peta berskala 1 : 500.000.',g:{k:'tabel',baris:[['Di peta','Sebenarnya'],['1 cm','500.000 cm']]},st:[
    {t:'Skala 1 : 500.000 artinya 1 cm di peta mewakili ... di lapangan.',o:['500.000 cm','500.000 km','50.000 cm'],b:'500.000 cm',p:'Satu bagian di peta, 500.000 bagian sama di lapangan.'},
    {t:'500.000 cm = ... km (1 km = 100.000 cm)',o:['5 km','50 km','500 km'],b:'5 km',p:'500.000 : 100.000 = 5.'}]},
  {say:'Peta berskala 1 : 50.000. Jarak di peta 6 cm.',g:{k:'tabel',baris:[['Di peta','Sebenarnya'],['6 cm','?']]},st:[
    {t:'Langkah 1: 6 × 50.000 = ?',o:['300.000 cm','56.000 cm','8.333 cm'],b:'300.000 cm',p:'300.000 cm.'},
    {t:'Siswa: "300.000 cm = 30 km." Tepatkah?',o:['Keliru. 300.000 : 100.000 = 3 km','Benar'],b:'Keliru. 300.000 : 100.000 = 3 km',p:'Dari cm ke km dibagi 100.000.'}]},
  {say:'Peta berskala 1 : 2.000.000. Jarak dua kota di peta 4 cm.',g:{k:'tabel',baris:[['Di peta','Sebenarnya'],['4 cm','?']]},st:[
    {t:'4 × 2.000.000 = ? cm',o:['8.000.000','2.000.004','500.000'],b:'8.000.000',p:'8.000.000 cm.'},
    {t:'8.000.000 cm = ... km',o:['80 km','800 km','8 km'],b:'80 km',p:'8.000.000 : 100.000 = 80.'}]},
  {say:'Peta berskala 1 : 1.000.000. Jarak di peta 5 cm.',g:{k:'tabel',baris:[['Di peta','Sebenarnya'],['5 cm','?']]},st:[
    {t:'5 × 1.000.000 = 5.000.000 cm = ... km',o:['50 km','500 km','5 km'],b:'50 km',p:'5.000.000 : 100.000 = 50 km.'}]},
  {say:'Maket gedung berskala 1 : 200. Tinggi gedung asli 24 meter.',g:{k:'tabel',baris:[['Maket','Gedung'],['?','24 m = 2.400 cm']]},st:[
    {t:'Tinggi maket = 2.400 : 200 = ?',o:['12 cm','48 cm','2 cm'],b:'12 cm',p:'12 cm.'},
    {t:'Panjang gedung 40 m = 4.000 cm. Panjang maket?',o:['20 cm','40 cm','8 cm'],b:'20 cm',p:'4.000 : 200 = 20 cm.'}]},
  {say:'Arsitek: "Skala 1:100 berarti luas pada gambar 100 kali lebih kecil."',g:{k:'tabel',baris:[['','Skala panjang','Skala luas'],['1 : 100','100 kali','10.000 kali']]},st:[
    {t:'Tepatkah klaim itu?',o:['Keliru. Panjang 100 kali lebih kecil, tetapi luas 100 × 100 = 10.000 kali lebih kecil','Benar'],b:'Keliru. Panjang 100 kali lebih kecil, tetapi luas 100 × 100 = 10.000 kali lebih kecil',p:'Luas adalah panjang × lebar.'}]},
  {say:'Tinggi maket harus antara 8 cm dan 15 cm untuk gedung 24 m (2.400 cm). Skala 1:200 menghasilkan 12 cm.',g:{k:'tabel',baris:[['Skala','Tinggi maket'],['1 : 200','12 cm'],['1 : 150','?']]},st:[
    {t:'Skala 1:150: 2.400 : 150 = ?',o:['16 cm','12 cm','8 cm'],b:'16 cm',p:'16 cm, di luar rentang.'},
    {t:'Penyebut yang lebih kecil membuat maket...',o:['lebih besar','lebih kecil'],b:'lebih besar',p:'Dibagi bilangan yang lebih kecil, hasilnya lebih besar.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Skala peta dan maket.';setKata(d.say);
  gambarDi('s4alat',d.g);barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Jarak sebenarnya = jarak di peta × penyebut skala. 1 km = 100.000 cm.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: campuran dan cerita ---- */
var R5=[
  {say:'Pak Herman mencampur beras A (Rp10.000/kg) dan B (Rp14.000/kg) dengan rasio 3 : 2 menjadi 25 kg.',g:{k:'bar',atas:'25 kg',bagian:[{l:'A 3',v:3,w:'biru'},{l:'B 2',v:2,w:'merah'}]},st:[
    {t:'Satu bagian = 25 : 5 = 5 kg. Beras A (3 bagian) dan B (2 bagian)?',o:['15 kg dan 10 kg','10 kg dan 15 kg','12 kg dan 13 kg'],b:'15 kg dan 10 kg',p:'3 × 5 = 15 dan 2 × 5 = 10.'},
    {t:'Biaya bahan = 15 × 10.000 + 10 × 14.000 = ?',o:['290.000','250.000','240.000'],b:'290.000',p:'150.000 + 140.000 = 290.000.'},
    {t:'Biaya per kg = 290.000 : 25 = ?',o:['11.600','12.000','10.000'],b:'11.600',p:'Rp11.600 per kg.'},
    {t:'Dijual dengan untung Rp1.000 per kg. Harga jual per kg?',o:['12.600','11.000','13.600'],b:'12.600',p:'11.600 + 1.000 = 12.600.'}]},
  {say:'Penjual: "Rasio untung : modal = 1 : 4, jadi untungku selalu 25% dari harga jual."',g:{k:'bar',bagian:[{l:'Untung 1',v:1,w:'hijau'},{l:'Modal 4',v:4,w:'biru'}]},st:[
    {t:'Harga jual = modal + untung = 4 + 1 = ?',o:['5 bagian','4 bagian','3 bagian'],b:'5 bagian',p:'Harga jual 5 bagian.'},
    {t:'Untung terhadap harga jual = 1/5 = ?',o:['20%','25%','4%'],b:'20%',p:'1/5 = 20%.'},
    {t:'Untung terhadap MODAL = 1/4 = ?',o:['25%','20%','75%'],b:'25%',p:'25% dari modal, bukan dari harga jual.'}]},
  {say:'Resep untuk 4 orang: 300 gram beras dan 2 butir telur. Dibuat untuk 10 orang.',g:{k:'tabel',baris:[['Orang','Beras (g)','Telur'],['4','300','2'],['10','?','?']]},st:[
    {t:'Faktor pengali = 10 : 4 = ?',o:['2,5','6','40'],b:'2,5',p:'Semua bahan dikali 2,5.'},
    {t:'Beras dan telur untuk 10 orang?',o:['750 gram dan 5 butir','600 gram dan 4 butir','750 gram dan 4 butir'],b:'750 gram dan 5 butir',p:'300 × 2,5 = 750; 2 × 2,5 = 5.'}]},
  {say:'Dua resep: A tepung : gula = 6 : 2, B = 9 : 3.',g:{k:'tabel',baris:[['Resep','Tepung','Gula'],['A','6','2'],['B','9','3']]},st:[
    {t:'6 : 2 dan 9 : 3 disederhanakan menjadi...',o:['sama-sama 3 : 1','3 : 1 dan 2 : 1','2 : 3 dan 3 : 2'],b:'sama-sama 3 : 1',p:'Rasio senilai, jadi proporsinya sama.'}]},
  {say:'Warung mencampur sirup dan air 2 : 5 untuk 490 ml. Untuk 700 ml dengan rasa lebih kuat (sirup lebih dari 2/7 tetapi tidak lebih dari separuh).',g:{k:'bar',atas:'700 ml',bagian:[{l:'Sirup ?',v:3,w:'merah'},{l:'Air ?',v:7,w:'biru'}]},st:[
    {t:'Rasio awal 2 : 5 berarti sirup = 2/7 = 0,286 dari seluruhnya. Rasio mana yang lebih kuat tetapi tidak melebihi separuh?',o:['3 : 7 (sirup 3/10)','1 : 3 (sirup 1/4)','2 : 1 (sirup 2/3)'],b:'3 : 7 (sirup 3/10)',p:'3/10 = 0,3 lebih besar dari 0,286 dan kurang dari 0,5. 1 : 3 = 0,25 lebih lemah; 2 : 1 > 0,5.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Campuran dan cerita.';setKata(d.say);
  gambarDi('s5alat',d.g);barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Ubah rasio menjadi bagian; cari satu bagian lebih dulu.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Rasio membandingkan bagian, bukan selisih.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-03'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.bar({atas:'perbandingan',bagian:[{l:'3',v:3,w:'biru'},{l:'4',v:4,w:'merah'}]}));w.appendChild(el('div','baca','3 : 4'));
})();


/* ---- bonus: mesin skala peta ---- */
var bSk=500000;
function mulaiBonus(){
  $('bA').value='6';bSk=500000;
  var w=$('bOp');clear(w);
  [[50000,'1 : 50.000'],[100000,'1 : 100.000'],[500000,'1 : 500.000'],[1000000,'1 : 1.000.000']].forEach(function(o){var b=tombol(w,o[1],function(){bSk=o[0];gambarBonus()});b.setAttribute('data-o',String(o[0]))});
  gambarBonus();
}
function gambarBonus(){
  var a=+$('bA').value,cm=a*bSk,km=cm/100000,bt=$('bOp').children;
  for(var i=0;i<bt.length;i++)bt[i].classList.toggle('pilih',bt[i].getAttribute('data-o')===String(bSk));
  $('bNA').textContent='Jarak di peta: '+a+' cm';$('bNB').textContent='Skala 1 : '+rb(bSk);
  gambarDi('bGambar',{k:'penggaris',n:a,maks:12,sat:'cm'});
  barisTeks('bTanda',[a+' × '+rb(bSk)+' = '+rb(cm)+' cm','1 km = 100.000 cm, jadi '+rb(cm)+' : 100.000 = '+fm(km)+' km']);
  msg('bmsg','good','Jarak sebenarnya = jarak di peta × penyebut skala, lalu ubah cm ke km.');
}
$('bA').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D03 = rakit(DASAR, { kode: 'D-03', data: DATA_D03 })
