import { rakit } from './bersama'
import { DATA_AC22 } from './latihan/ac22'

/**
 * Materi interaktif AC-22 "Hitung, Bulatkan, Taksir" (operasi hitung bilangan
 * cacah sampai ribuan, pembulatan, dan estimasi). Satu halaman HTML mandiri,
 * ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah
 * Belajar di topik Misi AC-22. Disimpan sebagai string supaya ikut terbundel di
 * build tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-21 (anak kelas 4-5, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Pinjam berantai: 500 - 236, 4.000 - 2.345, 5.000 - 3.456; pinjaman
 *    merambat melewati angka nol (bukan mengurangkan angka kecil dari besar).
 * 2) Perkalian dipecah: 345 x 23 = 345 x 20 + 345 x 3; baris kedua bersusun
 *    harus digeser satu tempat (puluhan).
 * 3) Pembagian dan sisa: geser hasil bagi sampai sisa lebih kecil dari pembagi;
 *    17 : 5 = 3 sisa 2; 1.345 : 4 = 336 sisa 1; truk untuk sisa kotak.
 * 4) Pembulatan: angka acuan di sebelah kanan tempat pembulatan; 5 atau lebih
 *    ke atas, kurang dari 5 ke bawah; bola bergeser di garis bilangan.
 * 5) Estimasi: bulatkan tiap bilangan ke arah terdekat, hitung, bandingkan
 *    dengan hasil sebenarnya; estimasi tidak harus persis; cukup uang atau tidak.
 * Bonus: geser bilangan 0 sampai 9.999, pilih puluhan, ratusan, ribuan.
 *
 * Soal Misi topik ini menguji: tambah-kurang-kali-bagi bilangan besar,
 * meminjam berantai, nilai tempat, pembulatan, estimasi, sisa harus lebih kecil
 * dari pembagi, sifat komutatif dan asosiatif (pengurangan dan pembagian tidak
 * komutatif), serta salah paham (pembulatan selalu ke bawah, lupa menggeser
 * baris kedua, estimasi harus persis, satuan pembulatan lebih kecil selalu
 * lebih akurat).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac22.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-22 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hitung Bulatkan Taksir</title>
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
      <h1>Hitung, Bulatkan, Taksir</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo hitung, bulatkan, dan taksir bilangan besar!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Kurangi dengan meminjam.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="kg" id="s1kol"></div></div>
    <div class="aksi" id="s1mulai"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Pecah perkalian menurut nilai tempat.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Bagi dan cari sisanya.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="tanda" id="s3tampil"></div>
      <input type="range" id="s3geser" min="0" max="30" value="0" aria-label="Hasil bagi"></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Bulatkan ke tempat yang diminta.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4nilai"></div><div class="alat" id="s4garis"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Taksir dulu, baru cocokkan.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="tanda" id="s5tampil"></div></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin pembulat</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: geser bilangan, pilih tempat pembulatan.</p>
    <div class="panel"><div class="baca" id="bNilai"></div><input type="range" id="bGeser" min="0" max="9999" value="3456" aria-label="Bilangan">
      <div class="tmp" id="bTempat"></div><div class="alat" id="bGaris"></div></div>
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
  if(id==='intro')setKata('Ayo hitung, bulatkan, dan taksir bilangan besar!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo hitung, bulatkan, dan taksir bilangan besar!');

/* ---- alat bantu ---- */
function ribu(n){return titikRibu(n)}
function uniq(benar,calon){var o=[String(benar)];calon.forEach(function(x){x=String(x);if(o.length<3&&o.indexOf(x)<0&&x.charAt(0)!=='-')o.push(x)});var t=1;while(o.length<3){var y=String(+benar+t++);if(o.indexOf(y)<0)o.push(y)}return o}
function uniqR(benar,calon){return uniq(ribu(benar),calon.map(function(x){return ribu(x)}))}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(s.lihat)s.lihat();
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Hitung lagi pelan-pelan.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}

/* ---- stasiun 1: pinjam berantai ---- */
var R1=[
  {a:500,b:236,w:[364,274],p:'Satuan butuh pinjaman, tetapi puluhan 0. Pinjam dari ratusan lewat puluhan.'},
  {a:1000,b:645,w:[455,345],p:'Pinjaman merambat dari ribuan melewati ratusan dan puluhan.'},
  {a:4000,b:2345,w:[2655,1745],p:'Pinjaman berantai dari ribuan sampai satuan.',x:{t:'Dari mana pinjaman untuk satuan pada 4.000 berasal?',o:['Dari ribuan, merambat lewat ratusan dan puluhan','Langsung dari puluhan yang bernilai 0'],b:'Dari ribuan, merambat lewat ratusan dan puluhan',p:'Angka 0 tidak bisa dipinjam. Pinjam dari angka pertama yang bukan 0, lalu rambatkan.'}},
  {a:5000,b:3456,w:[2556,1644],p:'Hasilnya 1.544. Jawaban 2.556 muncul bila tiap kolom hanya mengurangkan angka kecil dari yang besar tanpa meminjam.'}
];
var r1=0,jalan1=false;
function digitAng(n,L){var s=String(n);while(s.length<L)s=' '+s;return s.split('')}
function lukis1(dig,d,hasil,pj){
  var w=$('s1kol'),L=dig.length,bd=digitAng(d.b,L),i;clear(w);
  function baris(awal,arr,kls){var r=el('div','rw');r.appendChild(el('span','c op',awal));arr.forEach(function(x,j){r.appendChild(el('span','c'+(kls&&kls(j)?' '+kls(j):''),x===' '?'':String(x)))});w.appendChild(r)}
  baris('',dig,function(j){return pj.indexOf(j)>=0?'pj':''});
  baris('−',bd);
  w.appendChild(el('div','gr'));
  baris('=',hasil,function(j){return hasil[j]!==' '?'hs':''});
}
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1],L=String(d.a).length,dig=String(d.a).split('').map(Number);
  titik('s1dots',R1.length,r1);jalan1=false;
  var t='Hitung '+ribu(d.a)+' − '+ribu(d.b)+'.';$('s1say').textContent=t;setKata(t);
  lukis1(dig,d,new Array(L).fill(' '),[]);
  clear($('s1aksi'));$('s1tanya').textContent='';$('s1next').disabled=true;
  var a=$('s1mulai');clear(a);a.className='aksi';tombol(a,'Pinjam berantai',pinjam1,'utama hint');
  msg('s1msg','','Angka 0 tidak bisa dipinjami. Tekan tombol untuk melihat pinjamannya.');
}
function pinjam1(){
  if(jalan1)return;jalan1=true;clear($('s1mulai'));
  var d=R1[r1],L=String(d.a).length,dig=String(d.a).split('').map(Number),bd=digitAng(d.b,L).map(function(x){return x===' '?0:+x}),k;
  for(k=1;k<L;k++){(function(k){later(function(){
    dig[k-1]--;dig[k]+=10;lukis1(dig,d,new Array(L).fill(' '),[k-1,k]);
    msg('s1msg','','Pinjam 1 dari kolom di kiri: nilainya menjadi 10 di kolom ini.');
  },k*900)})(k)}
  var hasil=new Array(L).fill(' ');
  for(k=L-1;k>=0;k--){(function(k){later(function(){
    hasil[k]=dig[k]-bd[k];lukis1(dig,d,hasil.slice(),[]);
  },(L-1)*900+(L-k)*600)})(k)}
  later(function(){
    var r=d.a-d.b,st=[{t:'Berapa hasil '+ribu(d.a)+' − '+ribu(d.b)+'?',o:uniq(ribu(r),d.w.map(ribu)),b:ribu(r),p:d.p}];
    if(d.x)st.push(d.x);
    msg('s1msg','good','Hasilnya '+ribu(r)+'.');
    ruteSteps('s1aksi','s1tanya','s1msg',st,0,function(){$('s1next').disabled=false});
  },(L-1)*900+L*600+900);
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: perkalian dipecah ---- */
var R2=[{a:345,b:23,pa:20,pb:3},{a:125,b:12,pa:10,pb:2},{a:234,b:12,pa:10,pb:2,geser:true},{a:234,b:15,pa:10,pb:5}];
var r2=0,baris2=[];
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  var t='Hitung '+ribu(d.a)+' × '+d.b+'.';$('s2say').textContent=t;setKata(t);
  baris2=[ribu(d.a)+' × '+d.b+' = '+ribu(d.a)+' × '+d.pa+' + '+ribu(d.a)+' × '+d.pb];barisTeks('s2tampil',baris2);
  $('s2next').disabled=true;clear($('s2aksi'));
  var x1=d.a*d.pa,x2=d.a*d.pb,tot=d.a*d.b;
  var st=[
    {t:'Berapa '+ribu(d.a)+' × '+d.pa+'?',o:uniqR(x1,[x1/10,x1*10]),b:ribu(x1),p:ribu(d.a)+' × '+d.pa+' = '+ribu(x1)+'.',lihat:function(){baris2.push(ribu(d.a)+' × '+d.pa+' = '+ribu(x1));barisTeks('s2tampil',baris2)}},
    {t:'Berapa '+ribu(d.a)+' × '+d.pb+'?',o:uniqR(x2,[x2*10,x2-90]),b:ribu(x2),p:ribu(d.a)+' × '+d.pb+' = '+ribu(x2)+'.',lihat:function(){baris2.push(ribu(d.a)+' × '+d.pb+' = '+ribu(x2));barisTeks('s2tampil',baris2)}},
    {t:'Jumlahkan: '+ribu(x1)+' + '+ribu(x2)+' = ?',o:uniqR(tot,[tot+100,tot-100]),b:ribu(tot),p:ribu(d.a)+' × '+d.b+' = '+ribu(tot)+'.',lihat:function(){baris2.push('Jumlah = '+ribu(tot));barisTeks('s2tampil',baris2)}}
  ];
  if(d.geser)st.push({t:'Wati menulis baris kedua '+ribu(d.a)+' (lupa menggeser satu tempat ke kiri), padahal seharusnya '+ribu(x1)+'. Akibatnya hasil akhir...',o:['jauh lebih kecil dari yang seharusnya','jauh lebih besar dari yang seharusnya','tetap sama'],b:'jauh lebih kecil dari yang seharusnya',p:'Baris kedua bernilai puluhan. Tanpa digeser, nilainya 10 kali lebih kecil, sehingga jumlahnya terlalu kecil.'});
  msg('s2msg','','Kalikan dengan puluhan dulu, lalu satuan, lalu jumlahkan.');
  ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: pembagian dan sisa ---- */
var R3=[
  {n:156,d:7,sl:true},{n:17,d:5,sl:true},{n:84,d:4,sl:true},{n:93,d:6,sl:true},
  {n:1345,d:4,st:[{t:'Berapa 4 × 336?',o:['1.344','1.346','1.244'],b:'1.344',p:'4 × 336 = 1.344. Sisa 1.345 − 1.344 = 1.'},{t:'Hasil 1.345 : 4 ditulis...',o:['336 sisa 1','336','337'],b:'336 sisa 1',p:'Sisa 1 lebih kecil daripada pembagi 4, jadi 336 sisa 1.'}]},
  {n:1248,d:6,st:[{t:'Berapa 1.248 : 6?',o:['208','207','209'],b:'208',p:'6 × 208 = 1.248, tanpa sisa.'},{t:'Jika kotaknya 1.250, 1.250 : 6 = 208 sisa 2. Berapa truk paling sedikit?',o:['209, karena sisa 2 kotak tetap perlu truk','208, sisa dibuang'],b:'209, karena sisa 2 kotak tetap perlu truk',p:'Sisa kotak tidak boleh ditinggal. Tambah satu truk.'}]}
];
var r3=0,sdh3=false;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3],sl=$('s3geser');titik('s3dots',R3.length,r3);sdh3=false;
  var t='Hitung '+ribu(d.n)+' : '+d.d+'.';$('s3say').textContent=t;setKata(t);
  $('s3next').disabled=true;clear($('s3aksi'));$('s3tanya').textContent='';
  if(d.sl){
    sl.style.display='';sl.min='0';sl.max=String(Math.floor(d.n/d.d)+4);sl.step='1';sl.value='0';sl.disabled=false;
    tampil3(0);msg('s3msg','','Geser hasil bagi. Sisa harus kurang dari pembagi.');
  }else{
    sl.style.display='none';barisTeks('s3tampil',[ribu(d.n)+' : '+d.d+' = ?']);msg('s3msg','','Hitung dengan teliti, lalu pilih jawabannya.');
    ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
  }
}
function tampil3(q){
  var d=R3[r3],x=q*d.d,s=d.n-x,l=[q+' × '+d.d+' = '+ribu(x),'sisa = '+ribu(d.n)+' − '+ribu(x)+' = '+ribu(s)];
  l.push(s<0?'Terlalu banyak! Hasil kali melebihi '+ribu(d.n)+'.':(s>=d.d?'Sisa masih '+d.d+' atau lebih. Tambah lagi.':'Sisa kurang dari '+d.d+'. Pas!'));
  barisTeks('s3tampil',l);return s;
}
$('s3geser').oninput=function(){
  if(sdh3)return;var d=R3[r3],q=+$('s3geser').value,s=tampil3(q);
  if(s>=0&&s<d.d){
    sdh3=true;$('s3geser').disabled=true;
    var benar=s>0?q+' sisa '+s:String(q),wr=s>0?[String(q),(q-1)+' sisa '+(s+d.d)]:[q+' sisa 1',String(q+1)];
    var st=[{t:'Tulis hasil '+ribu(d.n)+' : '+d.d+'.',o:uniq(benar,wr),b:benar,p:s>0?'Hasil bagi '+q+' dan sisa '+s+'. Sisa tidak boleh dilupakan.':'Habis dibagi, tanpa sisa.'}];
    if(r3===0)st.push({t:'Sisa pada pembagian harus...',o:['lebih kecil daripada pembagi','sama dengan atau lebih besar dari pembagi'],b:'lebih kecil daripada pembagi',p:'Jika sisa masih sebesar pembagi, bagilah sekali lagi.'});
    later(function(){ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false})},900);
  }else msg('s3msg','',s<0?'Terlalu banyak. Kurangi.':'Belum pas. Sisa masih terlalu besar.');
};
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: pembulatan ---- */
var R4=[
  {n:47,t:'puluhan'},
  {n:6782,t:'ratusan',x:{t:'Kiki berkata: "Selalu bulatkan ke bawah agar aman." Tepatkah?',o:['Tidak. Arahnya ditentukan oleh angka acuan','Ya, ke bawah selalu aman'],b:'Tidak. Arahnya ditentukan oleh angka acuan',p:'Angka acuan 5 atau lebih dibulatkan ke atas, kurang dari 5 ke bawah.'}},
  {n:3456,t:'ratusan'},
  {n:6782,t:'ribuan'},
  {n:2449,t:'ratusan'}
];
var r4=0,gar4=null;
function satuan4(t){return t==='ribuan'?1000:(t==='ratusan'?100:10)}
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4],u=satuan4(d.t),p=Math.round(Math.log(u)/Math.LN10),ac=Math.floor(d.n/Math.pow(10,p-1))%10,tm=Math.floor(d.n/Math.pow(10,p))%10,L=String(d.n).length;
  titik('s4dots',R4.length,r4);
  var t='Bulatkan '+ribu(d.n)+' ke '+d.t+' terdekat.';$('s4say').textContent=t;setKata(t);
  gambarDi('s4nilai',{k:'nilai',n:d.n,d:L,sorot:L-p,ket:false});
  gambarDi('s4garis',{k:'bulat',n:d.n,t:d.t});gar4=$('s4garis').firstChild;
  var lo=Math.floor(d.n/u)*u,r=Math.round(d.n/u)*u,atas=ac>=5;
  var st=[
    {t:'Angka acuan (tepat di kanan tempat '+d.t+') adalah...',o:uniq(String(ac),[tm,(ac+3)%10,(ac+6)%10]),b:String(ac),p:'Angka acuan adalah '+ac+', yang ditandai pada kolom nilai tempat.'},
    {t:'Angka acuan '+ac+'. Dibulatkan ke atas atau ke bawah?',o:['ke atas','ke bawah'],b:atas?'ke atas':'ke bawah',p:atas?'5 atau lebih dibulatkan ke atas.':'Kurang dari 5 dibulatkan ke bawah.'},
    {t:ribu(d.n)+' dibulatkan ke '+d.t+' menjadi...',o:uniqR(r,[atas?lo:lo+u,d.n]),b:ribu(r),p:ribu(d.n)+' ≈ '+ribu(r)+'.',lihat:function(){ayun(gar4,d.n,r,900)}}
  ];
  if(d.x)st.push(d.x);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Lihat kolom yang menyala: itu angka acuan.');
  ruteSteps('s4aksi','s4tanya','s4msg',st,0,function(){$('s4next').disabled=false});
}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: estimasi ---- */
var R5=[
  {a:3456,b:2890,op:'+',t:'ratusan',x:{t:'Estimasi 6.400, hasil sebenarnya 6.346. Apakah estimasi ini gagal karena tidak persis sama?',o:['Tidak. Estimasi hanya perlu mendekati','Ya, estimasi harus persis'],b:'Tidak. Estimasi hanya perlu mendekati',p:'Estimasi adalah perkiraan cepat yang dekat dengan hasil sebenarnya.'}},
  {a:6789,b:2345,op:'−',t:'ribuan'},
  {a:4650,b:3780,op:'+',t:'ribuan',x:{t:'Uangmu Rp10.000. Estimasi total belanja 9.000. Apakah uangmu cukup?',o:['Ya, estimasi 9.000 masih di bawah 10.000','Tidak cukup'],b:'Ya, estimasi 9.000 masih di bawah 10.000',p:'Hasil sebenarnya 8.430, jadi uang cukup.'}},
  {a:6234,b:1789,op:'−',t:'ribuan',x:{t:'Mengapa 1.789 dibulatkan ke 2.000, bukan 1.000?',o:['Angka ratusannya 7, yaitu 5 atau lebih, jadi ke atas','Supaya hasilnya lebih besar'],b:'Angka ratusannya 7, yaitu 5 atau lebih, jadi ke atas',p:'Setiap bilangan dibulatkan menurut angka acuannya sendiri, bukan sembarang arah.'}}
];
var r5=0,baris5=[];
function bul(n,u){return Math.round(n/u)*u}
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5],u=satuan4(d.t),ra=bul(d.a,u),rb=bul(d.b,u),est=d.op==='+'?ra+rb:ra-rb,real=d.op==='+'?d.a+d.b:d.a-d.b,sel=Math.abs(est-real);
  titik('s5dots',R5.length,r5);
  var t='Taksir '+ribu(d.a)+' '+d.op+' '+ribu(d.b)+' dengan membulatkan ke '+d.t+'.';$('s5say').textContent=t;setKata(t);
  baris5=['Taksir: '+ribu(d.a)+' '+d.op+' '+ribu(d.b)];barisTeks('s5tampil',baris5);
  function tambah(x){return function(){baris5.push(x);barisTeks('s5tampil',baris5)}}
  var st=[
    {t:'Bulatkan '+ribu(d.a)+' ke '+d.t+' terdekat.',o:uniqR(ra,[ra+u,ra-u]),b:ribu(ra),p:ribu(d.a)+' ≈ '+ribu(ra)+'.',lihat:tambah(ribu(d.a)+' ≈ '+ribu(ra))},
    {t:'Bulatkan '+ribu(d.b)+' ke '+d.t+' terdekat.',o:uniqR(rb,[rb+u,rb-u]),b:ribu(rb),p:ribu(d.b)+' ≈ '+ribu(rb)+'.',lihat:tambah(ribu(d.b)+' ≈ '+ribu(rb))},
    {t:ribu(ra)+' '+d.op+' '+ribu(rb)+' = ?',o:uniqR(est,[est+u,est-u]),b:ribu(est),p:'Estimasinya '+ribu(est)+'.',lihat:tambah('Estimasi = '+ribu(est))},
    {t:'Hasil sebenarnya '+ribu(real)+'. Berapa selisih dengan estimasi?',o:uniqR(sel,[sel+100,Math.abs(sel-100)||sel+200]),b:ribu(sel),p:'Selisihnya '+ribu(sel)+'. Cukup dekat untuk perkiraan.',lihat:tambah('Sebenarnya '+ribu(real)+', selisih '+ribu(sel))}
  ];
  if(d.x)st.push(d.x);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Bulatkan dulu, baru hitung.');
  ruteSteps('s5aksi','s5tanya','s5msg',st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Hitunganmu rapi, taksiranmu dekat.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-22'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.bulat({n:3456,t:'ratusan'}));w.appendChild(el('div','baca','3.456 ≈ 3.500'));
})();

/* ---- bonus: mesin pembulat ---- */
var bT='ratusan';
function mulaiBonus(){
  $('bGeser').value='3456';bT='ratusan';
  var w=$('bTempat');clear(w);
  ['puluhan','ratusan','ribuan'].forEach(function(t){var b=tombol(w,t,function(){bT=t;gambarBonus()});b.setAttribute('data-t',t)});
  gambarBonus();
}
function gambarBonus(){
  var n=+$('bGeser').value,u=satuan4(bT),p=Math.round(Math.log(u)/Math.LN10),ac=Math.floor(n/Math.pow(10,p-1))%10,r=bul(n,u);
  $('bNilai').textContent='Bilangan '+ribu(n);
  var bs=$('bTempat').children;for(var i=0;i<bs.length;i++)bs[i].classList.toggle('pilih',bs[i].getAttribute('data-t')===bT);
  gambarDi('bGaris',{k:'bulat',n:n,t:bT,ke:true});
  $('bTanda').textContent='Angka acuan '+ac+' → '+(ac>=5?'ke atas':'ke bawah')+' → '+ribu(n)+' ≈ '+ribu(r);
  msg('bmsg',ac===5?'good':'','5 atau lebih ke atas, kurang dari 5 ke bawah. Garis hijau menunjukkan sisi tujuan.');
}
$('bGeser').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC22 = rakit(DASAR, { kode: 'AC-22', data: DATA_AC22 })
