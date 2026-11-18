import { rakit } from './bersama'
import { DATA_D01 } from './latihan/d01'

/**
 * Materi interaktif D-01 "Naik Turun di Garis Bilangan" (bilangan bulat:
 * garis bilangan, nilai mutlak, lawan, operasi, urutan operasi, sifat dasar).
 * Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi D-01. Disimpan
 * sebagai string supaya ikut terbundel di build tanpa membaca berkas saat
 * runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-31 (siswa SMP kelas 7, tiap stasiun
 * beranimasi). Lima stasiun praktik:
 * 1) Garis bilangan: letakkan titik; nilai mutlak = jarak ke 0 (|-5| = |5| = 5
 *    tetapi -5 bukan 5); lawan bilangan; makin kiri makin kecil (-17 < -9),
 *    tetapi jaraknya ke 0 makin besar.
 * 2) Lompat di garis: tambah ke kanan, kurang ke kiri; mengurangi bilangan
 *    negatif sama dengan menambah lawannya (5 - (-9) = 14; 7 - 12 = 7 + (-12)).
 * 3) Kali dan bagi: tiap faktor negatif membalik tanda; banyak faktor negatif
 *    genap berarti positif, ganjil berarti negatif; pembagian mengikuti aturan
 *    tanda yang sama.
 * 4) Urutan operasi dan sifat: kali dan bagi dahulu; tanda kurung; sifat
 *    distributif (4 x (5 - 3) = 4 x 5 - 4 x 3) dan jangan mengganti
 *    pengurangan menjadi penjumlahan secara keliru (-4 x (6 - 9) = 12).
 * 5) Cerita dan rancang: kartu poin, selam, pendaki, stok, saldo, dan mencari
 *    pasangan bilangan dari jumlah dan hasil kali.
 * Bonus: pilih dua bilangan bulat dan operasi; lihat hasil dan garis bilangan.
 *
 * Soal Misi topik ini menguji: urutan dan nilai mutlak, lawan, empat operasi,
 * urutan operasi, sifat komutatif, asosiatif, distributif, bilangan bulat vs
 * pecahan, cerita (suhu, selam, saldo, stok, kartu poin, gol), klaim tentang
 * tanda hasil, dan rancang pasangan bilangan.
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/d01.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik D-01 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Naik Turun di Garis Bilangan</title>
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
      <h1>Naik Turun di Garis Bilangan</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo bermain dengan bilangan positif dan negatif!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Letakkan titik di garis bilangan.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="-20" max="20" value="0" aria-label="Letak titik"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Lompat di garis bilangan.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="aksi" id="s2mulai"></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Kali dan bagi: lihat tandanya.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="fak" id="s3data"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="aksi" id="s3mulai"></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Urutan operasi dan sifat.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Cerita dan rancang.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin bilangan bulat</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih dua bilangan dan satu operasi.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="-12" max="12" value="-8" aria-label="Bilangan pertama">
      <div class="baca" id="bNB"></div><input type="range" id="bB" min="-12" max="12" value="3" aria-label="Bilangan kedua"><div class="tmp" id="bOp"></div></div>
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
  if(id==='intro')setKata('Ayo bermain dengan bilangan positif dan negatif!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo bermain dengan bilangan positif dan negatif!');

/* ---- alat bantu ---- */
function uniq(benar,calon){var o=[String(benar)];calon.forEach(function(x){x=String(x);if(o.length<3&&o.indexOf(x)<0)o.push(x)});var t=1;while(o.length<3){var y=ng(+(benar.replace?benar.replace('−','-'):benar)+t++);if(o.indexOf(y)<0)o.push(y)}return o}
function ng(v){return v<0?'−'+(-v):String(v)}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(s.lihat)s.lihat();
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },(s.o.length===2||s.o.some(function(x){return x.length>18}))?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Lihat garis bilangannya dan hitung pelan-pelan.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
function gbl(lo,hi,o){var g={k:'garisbil',lo:lo,hi:hi};if(o)for(var q in o)g[q]=o[q];return g}

/* ---- stasiun 1: garis bilangan ---- */
var R1=[
  {t:-12,st:[
    {t:'Nilai mutlak −12 adalah...',o:['12','−12','0'],b:'12',p:'Nilai mutlak adalah jarak ke 0, dan jarak tidak pernah negatif: |−12| = 12.'},
    {t:'Lawan (invers penjumlahan) dari −12 adalah...',o:['12','−12','0'],b:'12',p:'Lawan −12 adalah 12, karena −12 + 12 = 0.'}]},
  {t:-5,pts:[5],st:[
    {t:'Berapa nilai mutlak −5?',o:['5','−5','0'],b:'5',p:'|−5| = 5, dan |5| = 5 juga.'},
    {t:'Seorang siswa: "|−5| = |5| = 5, jadi −5 = 5." Tepatkah?',o:['Salah. Nilai mutlak sama tidak berarti bilangannya sama; −5 dan 5 ada di sisi berbeda dari 0','Benar, keduanya sama'],b:'Salah. Nilai mutlak sama tidak berarti bilangannya sama; −5 dan 5 ada di sisi berbeda dari 0',p:'−5 dan 5 sama jauh dari 0 tetapi berbeda letak.'}]},
  {t:-10,pts:[-3],st:[
    {t:'Bu Rina: "Karena −10 lebih kecil daripada −3, jarak −10 ke 0 juga lebih kecil." Tepatkah?',o:['Salah. Makin ke kiri bilangan makin kecil, tetapi jaraknya ke 0 makin besar (10 > 3)','Benar'],b:'Salah. Makin ke kiri bilangan makin kecil, tetapi jaraknya ke 0 makin besar (10 > 3)',p:'Urutan dan jarak ke 0 adalah dua hal berbeda.'},
    {t:'Mana yang lebih besar, −20 atau −12?',o:['−12','−20','sama besar'],b:'−12',p:'−12 berada di sebelah kanan −20, jadi −12 lebih besar.'}]},
  {t:-3,pts:[-5,-1],st:[
    {t:'Titik tengah antara −5 dan −1 adalah...',o:['−3','−6','−2'],b:'−3',p:'Jarak −5 ke −3 sama dengan −3 ke −1, yaitu 2.'}]},
  {t:-2,pts:[-7,3,5],st:[
    {t:'Di antara −7, −2, 3, dan 5, mana yang paling dekat dengan 0?',o:['−2','3','5'],b:'−2',p:'|−2| = 2 adalah jarak terkecil.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){var d=R1[r1],tt=[{v:v,w:'merah'}];(d.pts||[]).forEach(function(p){tt.push({v:p,w:'biru'})});gambarDi('s1alat',gbl(-20,20,{titik:tt,mutlak:v}))}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='-20';sl.max='20';sl.step='1';sl.value='0';sl.disabled=false;
  var t='Geser titik merah ke '+ng(d.t)+'.';$('s1say').textContent=t;setKata(t);
  gambar1(0);barisTeks('s1tampil',['Titik merah di 0']);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Lengkung hijau menunjukkan jarak titik ke 0.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;
  gambar1(v);barisTeks('s1tampil',['Titik di '+ng(v),'Jarak ke 0 = |'+ng(v)+'| = '+Math.abs(v)]);
  if(v===d.t){sdh1=true;$('s1geser').disabled=true;later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},800)}
  else msg('s1msg','','Geser terus sampai '+ng(d.t)+'.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: lompat di garis bilangan ---- */
var R2=[
  {s:-8,mv:[{d:15,t:'tambah 15'},{d:-6,t:'kurang 6'}],res:1,ex:'−8 + 15 − 6',x:{t:'Pengurangan 7 − 12 dapat dinyatakan sebagai penjumlahan 7 + ...',o:['−12','12','−5'],b:'−12',p:'Mengurangi 12 sama dengan menambah lawannya, −12.'}},
  {s:5,mv:[{d:9,t:'kurangi (−9) = tambah 9'}],res:14,ex:'5 − (−9)',x:{t:'Mengurangi bilangan negatif sama dengan...',o:['menambah lawannya (bilangan positif)','mengurangi bilangan positif','mengalikan dengan −1'],b:'menambah lawannya (bilangan positif)',p:'5 − (−9) = 5 + 9 = 14.'}},
  {s:-6,mv:[{d:10,t:'naik 10'},{d:-4,t:'turun 4'}],res:0,ex:'suhu −6°C, naik 10, turun 4'},
  {s:-14,mv:[{d:9,t:'tambah 9'},{d:6,t:'kurangi (−6) = tambah 6'}],res:1,ex:'(−14) + 9 − (−6)'}
];
var r2=0,mi2=0,pos2=[],jalan2=false;
function mulaiS2(){r2=0;ronde2()}
function lukis2(v,jej){gambarDi('s2alat',gbl(-20,20,{titik:[{v:v,w:'merah'}],jejak:jej&&jej.length>1?jej:undefined}))}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);mi2=0;pos2=[d.s];jalan2=false;
  var t='Mulai di '+ng(d.s)+'. Hitung '+d.ex+'.';$('s2say').textContent='Lompat di garis bilangan.';setKata(t);
  lukis2(d.s);barisTeks('s2tampil',[t]);
  clear($('s2aksi'));$('s2tanya').textContent='';$('s2next').disabled=true;
  tombolLompat();msg('s2msg','','Ke kanan = tambah, ke kiri = kurang.');
}
function tombolLompat(){var d=R2[r2],a=$('s2mulai');clear(a);a.className='aksi';tombol(a,'Lompat: '+d.mv[mi2].t,lompat2,'utama hint')}
function lompat2(){
  if(jalan2)return;jalan2=true;clear($('s2mulai'));
  var d=R2[r2],a=pos2[pos2.length-1],b=a+d.mv[mi2].d;
  lukis2(a,pos2);var sv=$('s2alat').firstChild;ayun(sv,a,b,900);
  later(function(){
    pos2.push(b);mi2++;lukis2(b,pos2);barisTeks('s2tampil',['Posisi sekarang: '+ng(b)]);jalan2=false;
    if(mi2<d.mv.length)tombolLompat();
    else{
      var st=[{t:'Hasil '+d.ex+' = ?',o:uniq(ng(d.res),[ng(-d.res===0?d.res+5:-d.res),ng(d.res+10)]),b:ng(d.res),p:'Titik berakhir di '+ng(d.res)+'.'}];
      if(d.x)st.push(d.x);
      msg('s2msg','','Titik merah berhenti di '+ng(b)+'.');
      later(function(){ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false})},600);
    }
  },1100);
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: kali dan bagi ---- */
var R3=[
  {f:[-2,-3]},{f:[-2,-3,-1]},{f:[-2,-2,-2,-2]},
  {e:'(−24) : 2',ans:-12,st:[{t:'Bilangan negatif dibagi bilangan positif hasilnya...',o:['negatif','positif'],b:'negatif',p:'Tanda berbeda, hasil negatif.'}]},
  {e:'(−8) × (−5) : 4',ans:10,st:[{t:'(−8) × (−5) = ?',o:['40','−40','13'],b:'40',p:'Negatif kali negatif = positif.'}]},
  {e:'(−4) × 6 : (−3)',ans:8,st:[{t:'(−4) × 6 = ?',o:['−24','24','2'],b:'−24',p:'Negatif kali positif = negatif.'}]}
];
var r3=0,k3=0,p3=1;
function mulaiS3(){r3=0;ronde3()}
function chips3(f,k){var w=$('s3data');clear(w);f.forEach(function(x,i){var c=el('span',null,ng(x));if(i<=k)c.style.background=x<0?'var(--soft)':'var(--ok)';w.appendChild(c)})}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);clear($('s3aksi'));$('s3tanya').textContent='';$('s3next').disabled=true;
  if(d.f){
    k3=0;p3=d.f[0];chips3(d.f,0);
    var t='Kalikan: '+d.f.map(ng).join(' × ');$('s3say').textContent='Kali dan bagi: lihat tandanya.';setKata(t);
    barisTeks('s3tampil',[t,'Hasil sementara: '+ng(p3)]);
    var a=$('s3mulai');clear(a);a.className='aksi';tombol(a,'Kalikan dengan '+ng(d.f[1]),maju3,'utama hint');
    msg('s3msg','','Tiap faktor negatif membalik tanda hasil.');
  }else{
    var t2='Hitung '+d.e+' (kerjakan dari kiri ke kanan).';$('s3say').textContent='Kali dan bagi: lihat tandanya.';setKata(t2);
    clear($('s3data'));clear($('s3mulai'));barisTeks('s3tampil',[t2]);
    var st=d.st.slice();st.push({t:'Hasil '+d.e+' = ?',o:uniq(ng(d.ans),[ng(-d.ans),ng(d.ans+3)]),b:ng(d.ans),p:d.e+' = '+ng(d.ans)+'.'});
    msg('s3msg','','Perhatikan tanda tiap langkah.');
    ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false});
  }
}
function maju3(){
  var d=R3[r3];k3++;p3*=d.f[k3];chips3(d.f,k3);barisTeks('s3tampil',['Kalikan: '+d.f.map(ng).join(' × '),'Hasil sementara: '+ng(p3)+(p3<0?' (negatif)':' (positif)')]);
  if(k3<d.f.length-1){clear($('s3mulai'));tombol($('s3mulai'),'Kalikan dengan '+ng(d.f[k3+1]),maju3,'utama hint')}
  else{
    clear($('s3mulai'));var neg=d.f.filter(function(x){return x<0}).length;
    var st=[
      {t:'Berapa hasilnya?',o:uniq(ng(p3),[ng(-p3),String(Math.abs(p3)+1)]),b:ng(p3),p:'Hasilnya '+ng(p3)+'.'},
      {t:'Ada '+neg+' faktor negatif. Hasil perkalian bertanda...',o:['positif (banyak faktor negatif genap)','negatif (banyak faktor negatif ganjil)'],b:neg%2===0?'positif (banyak faktor negatif genap)':'negatif (banyak faktor negatif ganjil)',p:neg%2===0?'Faktor negatif genap: tanda saling membatalkan, hasil positif.':'Faktor negatif ganjil: hasil negatif.'}
    ];
    ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false});
  }
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: urutan operasi dan sifat ---- */
var R4=[
  {ex:'−12 : (−4) + 3 × (−2)',st:[
    {t:'Mana yang dikerjakan lebih dulu?',o:['kali dan bagi, baru tambah','semua dari kiri ke kanan tanpa memandang jenis operasi'],b:'kali dan bagi, baru tambah',p:'Kali dan bagi didahulukan daripada tambah dan kurang.'},
    {t:'−12 : (−4) = ?',o:['3','−3','48'],b:'3',p:'Negatif dibagi negatif = positif: 3.'},
    {t:'3 × (−2) = ?',o:['−6','6','1'],b:'−6',p:'Positif kali negatif = negatif: −6.'},
    {t:'3 + (−6) = ?',o:['−3','9','3'],b:'−3',p:'Hasil akhirnya −3.'}]},
  {ex:'−5 − 3 × (−4) + 2',st:[
    {t:'3 × (−4) = ?',o:['−12','12','−1'],b:'−12',p:'Perkalian dikerjakan lebih dulu: −12.'},
    {t:'−5 − (−12) = ?',o:['7','−17','17'],b:'7',p:'Mengurangi −12 sama dengan menambah 12: 7.'},
    {t:'7 + 2 = ?',o:['9','5','−15'],b:'9',p:'Hasil akhirnya 9.'},
    {t:'Seorang siswa mendapat −15. Apa kesalahannya?',o:['Ia mengurangi 3 dari −5 lebih dulu padahal perkalian harus didahulukan','Tidak ada kesalahan'],b:'Ia mengurangi 3 dari −5 lebih dulu padahal perkalian harus didahulukan',p:'Urutan operasi menentukan hasil.'}]},
  {ex:'4 × (5 − 3)',st:[
    {t:'Penjabaran distributif 4 × (5 − 3) adalah...',o:['(4 × 5) − (4 × 3)','(4 × 5) − 3','4 − (5 × 3)'],b:'(4 × 5) − (4 × 3)',p:'Kalikan 4 ke setiap suku di dalam kurung.'},
    {t:'20 − 12 = ?',o:['8','32','2'],b:'8',p:'Sama dengan 4 × 2 = 8.'}]},
  {ex:'−3 × (7 − 2)',st:[
    {t:'7 − 2 = ?',o:['5','9','−5'],b:'5',p:'Kurung dikerjakan lebih dulu.'},
    {t:'−3 × 5 = ?',o:['−15','15','−23'],b:'−15',p:'Sama dengan (−3 × 7) − (−3 × 2) = −21 + 6 = −15.'}]},
  {ex:'−4 × (6 − 9)',st:[
    {t:'−4 × 6 = ?',o:['−24','24','2'],b:'−24',p:'−24.'},
    {t:'−4 × 9 = ?',o:['−36','36','5'],b:'−36',p:'−36.'},
    {t:'Karena 6 − 9, hasilnya −24 − (−36) = ?',o:['12','−60','−12'],b:'12',p:'−24 + 36 = 12. Sama dengan −4 × (−3) = 12.'},
    {t:'Seorang siswa menjumlahkan −24 + (−36) = −60. Apa kesalahannya?',o:['Seharusnya dikurangi (karena 6 − 9); hasil benar 12','Tidak ada kesalahan'],b:'Seharusnya dikurangi (karena 6 − 9); hasil benar 12',p:'Tanda minus pada 6 − 9 ikut didistribusikan.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  var t='Hitung '+d.ex+'.';$('s4say').textContent='Urutan operasi dan sifat.';setKata(t);
  barisTeks('s4tampil',[t]);$('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Kurung dan kali-bagi dikerjakan lebih dulu.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: cerita dan rancang ---- */
var R5=[
  {say:'Rian mengambil kartu poin berturut-turut: −4, +7, −9, +12, −3.',jej:[0,-4,3,-6,6,3],st:[
    {t:'Skor akhir Rian?',o:['3','−3','11'],b:'3',p:'−4 + 7 − 9 + 12 − 3 = 3.'},
    {t:'Skor TERTINGGI yang pernah dicapai (setelah tiap kartu)?',o:['6','3','12'],b:'6',p:'Skor berturut-turut: −4, 3, −6, 6, 3. Tertinggi 6.'}]},
  {say:'Penyelam berada 8 meter di bawah permukaan laut (−8), lalu turun lagi 5 meter.',jej:[0,-8,-13],st:[
    {t:'−8 + (−5) = ?',o:['−13','−3','13'],b:'−13',p:'Posisinya −13 meter.'}]},
  {say:'Stok barang: Senin berkurang 15, Selasa bertambah 9, Rabu berkurang 6.',jej:[0,-15,-6,-12],st:[
    {t:'Total perubahan stok Senin sampai Rabu?',o:['−12','−30','12'],b:'−12',p:'−15 + 9 − 6 = −12.'}]},
  {say:'Pendaki di ketinggian +200 m turun 350 m ke lembah, lalu naik 120 m.',st:[
    {t:'200 − 350 + 120 = ?',o:['−30','30','−270'],b:'−30',p:'Ketinggian sekarang −30 meter.'}]},
  {say:'Kapal selam di −120 m naik 45 m, turun 60 m, lalu naik 15 m.',st:[
    {t:'Posisi akhir kapal selam?',o:['−120','−90','−150'],b:'−120',p:'−120 + 45 − 60 + 15 = −120.'}]},
  {say:'Andi berutang Rp15.000 (−15.000), lalu menabung Rp15.000.',st:[
    {t:'Keadaan keuangan Andi sekarang (Rp)?',o:['0','−30.000','30.000'],b:'0',p:'−15.000 + 15.000 = 0 (impas).'}]},
  {say:'Cari pasangan bilangan bulat (a, b) dengan a + b = −3 dan a × b = −10.',st:[
    {t:'Manakah pasangan yang memenuhi KEDUA syarat?',o:['(2, −5)','(5, −8)','(−2, −1)'],b:'(2, −5)',p:'2 + (−5) = −3 dan 2 × (−5) = −10.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Cerita dan rancang.';setKata(d.say);
  if(d.jej){var lo=Math.min.apply(null,d.jej)-2,hi=Math.max.apply(null,d.jej)+2;gambarDi('s5alat',gbl(lo,hi,{jejak:d.jej}))}else clear($('s5alat'));
  barisTeks('s5tampil',[d.say]);$('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Naik = positif, turun = negatif.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Bilangan positif dan negatif sudah akrab.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-01'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.garisbil({lo:-6,hi:6,titik:[{v:-3,w:'merah'}],jejak:[-3,2]}));
})();

/* ---- bonus: mesin bilangan bulat ---- */
var bOp='+';
function mulaiBonus(){
  $('bA').value='-8';$('bB').value='3';bOp='+';
  var w=$('bOp');clear(w);
  ['+','−','×',':'].forEach(function(o){var b=tombol(w,o,function(){bOp=o;gambarBonus()});b.setAttribute('data-o',o)});
  gambarBonus();
}
function gambarBonus(){
  var a=+$('bA').value,b=+$('bB').value,r=null,l=[],bs=$('bOp').children;
  for(var i=0;i<bs.length;i++)bs[i].classList.toggle('pilih',bs[i].getAttribute('data-o')===bOp);
  $('bNA').textContent='Bilangan pertama: '+ng(a);$('bNB').textContent='Bilangan kedua: '+ng(b);
  if(bOp==='+')r=a+b;else if(bOp==='−')r=a-b;else if(bOp==='×')r=a*b;else if(b!==0&&a%b===0)r=a/b;
  var tt=[{v:a,w:'merah'},{v:b,w:'biru'}];
  var lo=-14,hi=14;
  gambarDi('bGambar',gbl(lo,hi,{titik:tt,jejak:(bOp==='+'||bOp==='−')&&r!==null&&Math.abs(r)<=14?[a,r]:undefined}));
  l.push('|'+ng(a)+'| = '+Math.abs(a)+',  lawan '+ng(a)+' adalah '+ng(-a));
  if(bOp===':'&&b===0)l.push('Tidak bisa dibagi dengan 0');
  else if(r===null)l.push(ng(a)+' : '+ng(b)+' bukan bilangan bulat');
  else l.push(ng(a)+' '+bOp+' '+(b<0?'('+ng(b)+')':ng(b))+' = '+ng(r));
  barisTeks('bTanda',l);
  msg('bmsg',r!==null&&r<0?'':'good',bOp==='−'?'Mengurangi sama dengan menambah lawannya.':(bOp==='×'||bOp===':'?'Tanda sama: positif. Tanda berbeda: negatif.':'Bilangan negatif menggeser titik ke kiri.'));
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D01 = rakit(DASAR, { kode: 'D-01', data: DATA_D01 })
