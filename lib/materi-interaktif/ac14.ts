import { rakit } from './bersama'
import { DATA_AC14 } from './latihan/ac14'

/**
 * Materi interaktif AC-14 "Arsitek Kubus" (Konstruksi bangun ruang dan
 * visualisasi spasial). Satu halaman HTML mandiri, ditampilkan lewat iframe
 * sandbox di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-14.
 * Disimpan sebagai string supaya ikut terbundel di build tanpa membaca berkas
 * saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-13 (anak kelas 3-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Lapisan demi lapisan: kubus satuan diletakkan lapisan demi lapisan
 *    (isometrik, jatuh satu per satu), jumlah tiap lapisan dijumlahkan; tampak
 *    atasnya tetap kecil walau kubusnya banyak.
 * 2) Tampak yang menyesatkan: dua struktur berbeda bisa tampak sama dari atas
 *    atau dari depan; satu sudut pandang tidak cukup.
 * 3) Potong!: potongan lurus pada balok, kerucut, tabung, dan kubus; dua
 *    potongan menjauh setelah dugaan benar.
 * 4) Gabungkan: dua bangun ruang ditumpuk menjadi bangun ruang gabungan; sisi
 *    yang saling menempel tidak lagi terlihat.
 * 5) Putar: balok dan kubus 3D diputar dengan geseran; bentuknya tetap.
 * Bonus: bangun struktur sendiri di kotak 3 x 3; tampak atas dan jumlah kubus
 * dihitung otomatis.
 *
 * Soal Misi topik ini menguji: total kubus pada struktur berlapis, tampak atas
 * dan depan yang bisa menyesatkan, hasil potongan bangun ruang, bangun ruang
 * gabungan (jumlah sisi yang terlihat), jaring-jaring gabungan, bangun yang
 * diputar tetap sama, dan membayangkan lipatan jaring-jaring.
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac14.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, potongSvg): semuanya satu cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-14 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Arsitek Kubus</title>
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
/* stasiun 2: dua struktur */
.dua{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.dua .kol{display:flex;flex-direction:column;align-items:center;gap:6px;border:2px solid var(--line);border-radius:18px;padding:8px 4px;background:var(--card)}
.dua .kol b{font-family:var(--display);font-size:1.2rem;color:var(--ikat)}
.dua .iso{min-height:120px;width:100%;display:flex;align-items:center;justify-content:center}
.dua .tp{min-height:96px;display:flex;align-items:flex-end;justify-content:center}
.lihat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.lihat button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.05rem;min-height:50px;border-radius:14px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;touch-action:manipulation}
.lihat button.on{border-color:var(--ikat);background:var(--soft)}
.lihat button.hint{animation:denyut 1s infinite}
/* stasiun 3 dan 4 */
.pentas{display:flex;justify-content:center;align-items:center;min-height:170px}
.pentas svg{width:100%;max-width:300px;height:auto}
.gab{display:flex;flex-direction:column;align-items:center;min-height:240px;justify-content:flex-end}
.gab .atas{transition:transform .9s cubic-bezier(.4,1.35,.5,1);transform:translateY(-86px)}
.gab.tumpuk .atas{transform:none}
.gab svg{width:130px;height:130px;display:block}
.gab .atas svg{margin-bottom:-18px}
/* stasiun 5: balok 3D */
.ruangR{perspective:700px;height:230px;display:flex;align-items:center;justify-content:center}
.bk{position:relative;transform-style:preserve-3d;transform:rotateX(var(--rx,-20deg)) rotateY(var(--ry,-30deg))}
.bk .m{position:absolute;display:flex;align-items:center;justify-content:center;border:2px solid var(--ink);font-family:var(--display);font-weight:800;color:#fff;font-size:1.1rem;backface-visibility:visible}
.geser2{display:flex;flex-direction:column;gap:0}
input[type=range]{width:100%;accent-color:var(--ikat);height:36px}
/* bonus */
.petak{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:240px;margin:0 auto}
.petak button{aspect-ratio:1;border-radius:14px;border:2px solid var(--line);background:var(--card);color:var(--ink);font-family:var(--display);font-weight:800;font-size:1.5rem;cursor:pointer;touch-action:manipulation}
.petak button.isi{background:var(--soft);border-color:var(--lidi)}
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
      <h1>Arsitek Kubus</h1>
      <div class="panel" style="max-width:340px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo bangun, potong, dan putar bangun ruang!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: lapisan demi lapisan -->
  <section class="screen" id="s1">
    <p class="say">Letakkan kubus lapisan demi lapisan. Berapa totalnya?</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div id="s1iso" style="display:flex;justify-content:center;min-height:170px"></div></div>
    <div class="catat" id="s1catat"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: tampak yang menyesatkan -->
  <section class="screen" id="s2">
    <p class="say">Dua struktur. Lihat dari beberapa sisi.</p>
    <div class="dots" id="s2dots"></div>
    <div class="dua">
      <div class="kol"><b>A</b><div class="iso" id="s2isoA"></div><div class="tp" id="s2tpA"></div></div>
      <div class="kol"><b>B</b><div class="iso" id="s2isoB"></div><div class="tp" id="s2tpB"></div></div>
    </div>
    <div class="lihat" id="s2lihat"></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: potong -->
  <section class="screen" id="s3">
    <p class="say">Bangun ini dipotong lurus. Jadi apa dua potongannya?</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="pentas" id="s3pentas"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: gabungkan -->
  <section class="screen" id="s4">
    <p class="say">Tumpuk dua bangun ruang. Hitung sisi yang terlihat.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="gab" id="s4gab"></div></div>
    <div class="aksi" id="s4tumpuk"></div>
    <div class="cacah" id="s4cacah"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5: putar -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Putar bendanya. Apakah bentuknya berubah?</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="ruangR"><div class="bk" id="s5bk"></div></div>
      <div class="geser2"><span class="sub">Putar mendatar</span><input type="range" id="s5ry" min="-180" max="180" value="-30" aria-label="Putar mendatar"><span class="sub">Putar tegak</span><input type="range" id="s5rx" min="-70" max="70" value="-20" aria-label="Putar tegak"></div></div>
    <div class="cacah" id="s5cacah"></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: bangun sendiri</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: ketuk kotak untuk menumpuk kubus (sampai 4).</p>
    <div class="panel"><div id="bIso" style="display:flex;justify-content:center;min-height:170px"></div></div>
    <div class="petak" id="bPetak"></div>
    <div class="tampak-bonus mq-tampak" id="bTampak" style="display:flex;gap:14px;justify-content:center"></div>
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
function pilihan(wadah,opsi,benar,fnBenar,kolom){
  clear(wadah);wadah.className='aksi'+(kolom?' pil'+kolom:'');
  shuffle(opsi).forEach(function(o){
    var b=tombol(wadah,o,function(){
      if(b.disabled)return;
      if(o===benar){b.classList.add('right');fnBenar()}
      else{b.classList.add('wrong');b.disabled=true}
    });
  });
}
function banyakLapis(h,z){var n=0;h.forEach(function(r){r.forEach(function(v){if(v>z)n++})});return n}
function tinggiMaks(h){var m=0;h.forEach(function(r){r.forEach(function(v){m=Math.max(m,v)})});return m}

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
  if(id==='intro')setKata('Ayo bangun, potong, dan putar bangun ruang!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo bangun, potong, dan putar bangun ruang!');

/* ---- stasiun 1: lapisan demi lapisan ---- */
var R1=[
  {h:[[2,2,1],[2,3,1],[1,1,1]]},
  {h:[[2,2,1,1],[2,1,1,1]]},
  {h:[[2,2],[2,1]]},
  {h:[[4]]}
];
var r1=0,lap1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1];lap1=0;titik('s1dots',R1.length,r1);
  gambarS1(0);clear($('s1catat'));$('s1tanya').textContent='';$('s1next').disabled=true;
  var a=$('s1aksi');clear(a);a.className='aksi';
  tombol(a,'Letakkan lapisan 1',function(){tambahLapis()},'utama hint');
  msg('s1msg','','Ketuk tombol untuk meletakkan lapisan paling bawah.');setKata('Letakkan kubus lapisan demi lapisan.');
}
function gambarS1(baru){
  var d=R1[r1],w=$('s1iso');clear(w);
  if(lap1===0){w.appendChild(el('div','sub','(belum ada kubus)'));return}
  w.appendChild(GBR.tumpuk({h:d.h,lapisan:lap1,baru:baru}));
}
function tambahLapis(){
  var d=R1[r1],mz=tinggiMaks(d.h);
  if(lap1>=mz)return;
  lap1++;gambarS1(lap1-1);
  var n=banyakLapis(d.h,lap1-1),c=el('div'),k=el('i');k.style.background=LAPIS[(lap1-1)%5];
  c.appendChild(k);c.appendChild(document.createTextNode('Lapisan '+lap1+': '+n+' kubus'));$('s1catat').appendChild(c);
  var a=$('s1aksi');clear(a);
  if(lap1<mz){tombol(a,'Letakkan lapisan '+(lap1+1),function(){tambahLapis()},'utama');msg('s1msg','','Lapisan '+lap1+' ada '+n+' kubus. Letakkan lapisan berikutnya.')}
  else{later(tanyaS1,700);msg('s1msg','good','Semua lapisan sudah diletakkan.')}
}
function tanyaS1(){
  var d=R1[r1],mz=tinggiMaks(d.h),per=[],tot=0;
  for(var z=0;z<mz;z++){var n=banyakLapis(d.h,z);per.push(n);tot+=n}
  $('s1tanya').textContent='Berapa total kubus satuan?';setKata('Berapa total kubus satuan?');
  var sal=[per[0],tot+per[mz-1],tot-1].filter(function(x){return x!==tot&&x>0});
  var opsi=[String(tot)];sal.forEach(function(x){if(opsi.length<3&&opsi.indexOf(String(x))<0)opsi.push(String(x))});
  while(opsi.length<3)opsi.push(String(tot+opsi.length));
  pilihan($('s1aksi'),opsi,String(tot),function(){
    clear($('s1aksi'));$('s1tanya').textContent='';
    var t=per.join(' + ')+' = '+tot+' kubus. Dari atas hanya terlihat '+per[0]+' persegi, padahal kubusnya '+tot+'!';
    msg('s1msg','good',t);setKata(t);
    var g=$('s1iso');var c=el('div');c.style.cssText='display:flex;justify-content:center';c.appendChild(GBR.tampak({h:d.h,dari:'atas'}));g.appendChild(c);
    $('s1next').disabled=false;
  },3);
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: tampak yang menyesatkan ---- */
var R2=[
  {A:[[1,1],[1,1]],B:[[3,1],[1,1]],lihat:'atas',tanya:'Dari atas keduanya tampak sama. Apakah A dan B pasti struktur yang sama?',opsi:['Tidak, tinggi tumpukannya bisa berbeda','Ya, pasti sama persis'],benar:'Tidak, tinggi tumpukannya bisa berbeda',pesan:'Tampak atas hanya menunjukkan kotak yang terisi, bukan tinggi tumpukan. A punya 4 kubus, B punya 6 kubus.'},
  {A:[[1,2,1]],B:[[1,2,1],[1,2,1]],lihat:'depan',tanya:'Dari depan keduanya tampak sama. Apakah A dan B pasti struktur yang sama?',opsi:['Tidak, kedalamannya bisa berbeda','Ya, pasti sama persis'],benar:'Tidak, kedalamannya bisa berbeda',pesan:'Tampak depan tidak menunjukkan kedalaman. A punya 4 kubus, B punya 8 kubus.'},
  {A:[[2,2],[2,2]],B:[[1,3],[3,1]],lihat:'depan',tanya:'A dan B sama-sama 8 kubus. Apakah tampak depannya pasti sama?',opsi:['Tidak, jumlah kubus sama belum tentu tampaknya sama','Ya, jumlah sama berarti tampak sama'],benar:'Tidak, jumlah kubus sama belum tentu tampaknya sama',pesan:'Tampak depan A: 2 kotak tinggi. Tampak depan B: 3 kotak tinggi. Jumlah kubus sama, tampak berbeda.'},
  {A:[[5]],B:[[1,1],[1,1]],lihat:'atas',tanya:'Menara A berisi 5 kubus. Dari atas terlihat berapa persegi?',opsi:['1 persegi','5 persegi','2 persegi'],benar:'1 persegi',pesan:'Kubus yang ditumpuk lurus ke atas hanya terlihat satu persegi dari atas.'}
];
var r2=0,lihat2={},dipilih2='';
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];lihat2={};dipilih2='';titik('s2dots',R2.length,r2);
  var a=$('s2isoA'),b=$('s2isoB');clear(a);clear(b);a.appendChild(GBR.tumpuk({h:d.A,u:16}));b.appendChild(GBR.tumpuk({h:d.B,u:16}));
  clear($('s2tpA'));clear($('s2tpB'));
  var l=$('s2lihat');clear(l);
  [['atas','Dari atas'],['depan','Dari depan'],['samping','Dari samping']].forEach(function(x){
    var bt=el('button',r2===0&&x[0]==='atas'?'hint':null,x[1]);
    bt.onclick=function(){
      dipilih2=x[0];lihat2[x[0]]=true;
      var ch=l.children;for(var k=0;k<ch.length;k++)ch[k].classList.remove('on','hint');bt.classList.add('on');
      var ta=$('s2tpA'),tb=$('s2tpB');clear(ta);clear(tb);
      ta.appendChild(GBR.tampak({h:d.A,dari:x[0]}));tb.appendChild(GBR.tampak({h:d.B,dari:x[0]}));
      if(lihat2[d.lihat]&&!$('s2aksi').children.length)tanyaS2();
    };
    l.appendChild(bt);
  });
  clear($('s2aksi'));$('s2tanya').textContent='';$('s2next').disabled=true;
  msg('s2msg','','Ketuk "Dari '+d.lihat+'" untuk melihat keduanya.');setKata('Dua struktur. Lihat dari beberapa sisi.');
}
function tanyaS2(){
  var d=R2[r2];
  $('s2tanya').textContent=d.tanya;setKata(d.tanya);
  pilihan($('s2aksi'),d.opsi,d.benar,function(){
    msg('s2msg','good',d.pesan);setKata(d.pesan);clear($('s2aksi'));$('s2tanya').textContent='';$('s2next').disabled=false;
  },d.opsi.length===3?3:null);
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: potong ---- */
var R3=[
  {b:'balok',arah:'mendatar',pos:.5,w:'hijau',opsi:['dua balok yang lebih pendek','dua kubus','dua limas'],benar:'dua balok yang lebih pendek',pesan:'Potongan lurus pada balok menghasilkan dua balok yang lebih kecil.'},
  {b:'kerucut',arah:'mendatar',pos:.55,w:'ungu',opsi:['kerucut kecil dan kerucut terpancung','dua kerucut sama besar','dua tabung'],benar:'kerucut kecil dan kerucut terpancung',pesan:'Bagian atas menjadi kerucut yang lebih kecil. Bagian bawah menjadi kerucut terpancung, bukan kerucut.'},
  {b:'tabung',arah:'mendatar',pos:.5,w:'kuning',opsi:['dua tabung yang lebih pendek','dua kerucut','dua bola'],benar:'dua tabung yang lebih pendek',pesan:'Tabung yang dipotong sejajar alasnya menjadi dua tabung yang lebih pendek.'},
  {b:'kubus',arah:'miring',pos:.5,w:'biru',opsi:['dua prisma segitiga','dua kubus','dua balok'],benar:'dua prisma segitiga',pesan:'Potongan dari satu rusuk ke rusuk berseberangan membelah kubus menjadi dua prisma segitiga.'}
];
var r3=0,s3svg=null;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  var w=$('s3pentas');clear(w);s3svg=potongSvg(d.b,d.arah,d.pos,0,d.w,true);w.appendChild(s3svg);
  $('s3next').disabled=true;$('s3tanya').textContent='Dipotong di garis merah. Dua potongan berbentuk...';setKata($('s3tanya').textContent);
  msg('s3msg','','Bayangkan memotong di garis putus-putus merah.');
  pilihan($('s3aksi'),d.opsi,d.benar,function(){
    s3svg._geser(14);if(s3svg._garis)s3svg._garis.style.display='none';
    msg('s3msg','good',d.pesan);setKata(d.pesan);clear($('s3aksi'));$('s3tanya').textContent='';
    later(function(){$('s3next').disabled=false},700);
  },3);
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: gabungkan ---- */
var R4=[
  {bawah:'kubus',atas:'limas',sb:6,sa:5,nb:'kubus',na:'limas segiempat',wb:'biru',wa:'kuning'},
  {bawah:'balok',atas:'prisma',sb:6,sa:5,nb:'balok',na:'prisma segitiga',wb:'hijau',wa:'merah'},
  {bawah:'kubus',atas:'kerucut',sb:6,sa:2,nb:'kubus',na:'kerucut',wb:'biru',wa:'ungu'}
];
var r4=0,ditumpuk=false;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];ditumpuk=false;titik('s4dots',R4.length,r4);
  var g=$('s4gab');clear(g);g.className='gab';
  var at=el('div','atas'),sa=bangunSvg(d.atas,d.wa);at.appendChild(sa);g.appendChild(at);
  g.appendChild(bangunSvg(d.bawah,d.wb));
  $('s4cacah').innerHTML='';clear($('s4aksi'));$('s4next').disabled=true;
  var t=$('s4tumpuk');clear(t);t.className='aksi';tombol(t,'Tumpuk!',function(){tumpuk4()},'utama hint');
  msg('s4msg','','Terpisah: '+d.nb+' punya '+d.sb+' sisi, '+d.na+' punya '+d.sa+' sisi. Total '+(d.sb+d.sa)+'.');setKata('Tumpuk dua bangun ruang. Hitung sisi yang terlihat.');
}
function tumpuk4(){
  if(ditumpuk)return;ditumpuk=true;
  var d=R4[r4];$('s4gab').classList.add('tumpuk');clear($('s4tumpuk'));
  later(function(){
    var c=$('s4cacah');c.textContent='';c.appendChild(document.createTextNode('Sisi yang menempel (2) tidak terlihat dari luar. Berapa sisi yang terlihat?'));
    var tot=d.sb+d.sa,benar=tot-2;
    var opsi=[String(benar),String(tot),String(tot-4)];
    pilihan($('s4aksi'),opsi,String(benar),function(){
      var t=tot+' '+'−'+' 2 = '+benar+' sisi terlihat. Lebih sedikit daripada saat terpisah ('+tot+').';
      msg('s4msg','good',t);setKata(t);clear($('s4aksi'));$('s4cacah').textContent='';$('s4next').disabled=false;
    },3);
  },950);
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: putar (balok dan kubus 3D) ---- */
var R5=[{W:90,H:52,D:52,nama:'balok',pilih:['tetap balok','menjadi kubus','menjadi tabung']},{W:60,H:60,D:60,nama:'kubus',pilih:['tetap kubus','menjadi balok','menjadi limas']}];
var r5=0,putar5={x:false,y:false};
var WARNA5=['rgba(74,123,208,.9)','rgba(46,154,99,.9)','rgba(224,169,59,.9)','rgba(217,79,61,.9)','rgba(199,91,160,.9)','rgba(107,104,120,.9)'];
function bangunBk(d){
  var bk=$('s5bk');clear(bk);bk.style.width=d.W+'px';bk.style.height=d.H+'px';
  var spec=[
    [d.W,d.H,0,0,'translateZ('+d.D/2+'px)','1'],
    [d.W,d.H,0,0,'rotateY(180deg) translateZ('+d.D/2+'px)','2'],
    [d.D,d.H,(d.W-d.D)/2,0,'rotateY(90deg) translateZ('+d.W/2+'px)','3'],
    [d.D,d.H,(d.W-d.D)/2,0,'rotateY(-90deg) translateZ('+d.W/2+'px)','4'],
    [d.W,d.D,0,(d.H-d.D)/2,'rotateX(90deg) translateZ('+d.H/2+'px)','5'],
    [d.W,d.D,0,(d.H-d.D)/2,'rotateX(-90deg) translateZ('+d.H/2+'px)','6']
  ];
  spec.forEach(function(s,i){
    var m=el('div','m',s[5]);m.style.width=s[0]+'px';m.style.height=s[1]+'px';m.style.left=s[2]+'px';m.style.top=s[3]+'px';
    m.style.transform=s[4];m.style.background=WARNA5[i];bk.appendChild(m);
  });
}
function aturBk(){$('s5bk').style.setProperty('--rx',$('s5rx').value+'deg');$('s5bk').style.setProperty('--ry',$('s5ry').value+'deg')}
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);putar5={x:false,y:false};
  bangunBk(d);$('s5ry').value='-30';$('s5rx').value='-20';aturBk();
  $('s5say').textContent='Putar '+d.nama+' ini. Apakah bentuknya berubah?';
  $('s5cacah').textContent='6 sisi, 12 rusuk, 8 titik sudut';
  clear($('s5aksi'));$('s5tanya').textContent='';$('s5next').disabled=true;
  msg('s5msg','','Geser kedua pegangan di bawah gambar.');setKata($('s5say').textContent);
}
function cekPutar5(){
  if(!(putar5.x&&putar5.y)||$('s5aksi').children.length)return;
  var d=R5[r5];
  $('s5tanya').textContent='Setelah diputar, '+d.nama+' ini...';
  var t='Diputar ke arah mana pun, jumlah sisi, rusuk, dan titik sudutnya tetap sama.';msg('s5msg','good',t);setKata(t);
  pilihan($('s5aksi'),d.pilih,d.pilih[0],function(){
    var t2='Betul! '+d.pilih[0]+'. Memutar tidak mengubah bangun.';msg('s5msg','good',t2);setKata(t2);clear($('s5aksi'));$('s5tanya').textContent='';$('s5next').disabled=false;
  },3);
}
$('s5ry').oninput=function(){aturBk();if(Math.abs(+$('s5ry').value+30)>25)putar5.y=true;cekPutar5()};
$('s5rx').oninput=function(){aturBk();if(Math.abs(+$('s5rx').value+20)>20)putar5.x=true;cekPutar5()};
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu arsitek kubus yang andal.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-14'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){$('introGambar').appendChild(GBR.tumpuk({h:[[3,2,1],[2,2,1],[1,1,1]]}))})();

/* ---- bonus: bangun struktur sendiri ---- */
var hb=[[0,0,0],[0,0,0],[0,0,0]];
function mulaiBonus(){
  hb=[[0,0,0],[0,0,0],[0,0,0]];
  var p=$('bPetak');clear(p);
  for(var i=0;i<3;i++)for(var j=0;j<3;j++){
    var b=el('button',null,'0');b.setAttribute('aria-label','kotak '+(i*3+j+1));
    b.onclick=(function(i,j,b){return function(){hb[i][j]=(hb[i][j]+1)%5;b.textContent=String(hb[i][j]);b.classList.toggle('isi',hb[i][j]>0);gambarBonus()}})(i,j,b);
    p.appendChild(b);
  }
  gambarBonus();
}
function gambarBonus(){
  var w=$('bIso');clear(w);var tot=jumlahTumpuk(hb);
  if(tot>0)w.appendChild(GBR.tumpuk({h:hb}));else w.appendChild(el('div','sub','(belum ada kubus)'));
  var t=$('bTampak');clear(t);
  if(tot>0){t.appendChild(GBR.tampak({h:hb,dari:'atas'}));t.appendChild(GBR.tampak({h:hb,dari:'depan'}))}
  var terisi=0;hb.forEach(function(r){r.forEach(function(v){if(v>0)terisi++})});
  var s=tot?'Total '+tot+' kubus. Dari atas terlihat '+terisi+' persegi.':'Ketuk kotak untuk menambah kubus.';
  msg('bmsg',tot?'good':'',s);setKata(s);
}
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC14 = rakit(DASAR, { kode: 'AC-14', data: DATA_AC14 })
