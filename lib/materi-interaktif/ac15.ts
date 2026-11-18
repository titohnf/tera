import { rakit } from './bersama'
import { DATA_AC15 } from './latihan/ac15'

/**
 * Materi interaktif AC-15 "Ukur Tepat" (Satuan baku panjang, volume, dan
 * berat). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-15.
 * Disimpan sebagai string supaya ikut terbundel di build tanpa membaca berkas
 * saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-14 (anak kelas 3-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Satuan yang pas: benda diukur dengan alat (penggaris, timbangan, gelas
 *    takar); pilih satuan baku yang cocok, lalu alat bergerak menunjukkan
 *    hasil ukurnya. Termasuk "15" tanpa satuan belum lengkap.
 * 2) Takar kembar: geser pegangan sampai alat menunjuk sasaran; satuan kecil
 *    dan satuan besar ditampilkan bersamaan (1.500 ml = 1,5 liter).
 * 3) Geser koma: pilih dikali atau dibagi, lalu koma melompat selangkah demi
 *    selangkah; ada yang dua langkah (km ke m ke cm, mm ke cm ke m).
 * 4) Samakan satuan: dua ukuran berbeda satuan dibandingkan; angka besar belum
 *    tentu ukuran besar, batang bergerak setelah satuannya disamakan.
 * 5) Jumlah dan selisih: ubah dulu ke satuan yang sama, baru jumlahkan atau
 *    kurangkan, langkah demi langkah.
 * Bonus: konverter bebas untuk panjang, berat, dan volume.
 *
 * Soal Misi topik ini menguji: satuan yang pas untuk tiap benda, satuan wajib
 * ditulis, faktor ubah (1.000, 100, 10), arah kali atau bagi, cara pintas
 * geser koma, konversi dua langkah, membandingkan setelah menyamakan satuan,
 * menjumlah dan mengurang ukuran, dan merancang soal dari jawabannya.
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac15.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId): semuanya satu cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-15 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ukur Tepat</title>
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
/* alat ukur */
.benda{font-size:3.4rem;line-height:1;text-align:center}
.alat{display:flex;justify-content:center;align-items:center;min-height:110px}
.alat svg{max-width:100%}
.baca{font-family:var(--display);font-weight:800;font-size:1.3rem;text-align:center;min-height:1.7em;font-variant-numeric:tabular-nums}
input[type=range]{width:100%;accent-color:var(--ikat);height:40px}
/* stasiun 3: koma melompat */
.kk{display:flex;justify-content:center;align-items:flex-end;font-family:var(--display);font-weight:800;font-size:2.8rem;min-height:3.6rem;font-variant-numeric:tabular-nums}
.kk .dg{min-width:.64em;text-align:center;border-bottom:3px solid var(--line)}
.kk .dg.nol{opacity:.35}
.kk .kom{color:var(--ikat);font-size:3.2rem;width:.34em;text-align:center;animation:pop .35s}
.kk .kom.hop{animation:lompat .45s}
@keyframes lompat{0%{transform:translateY(-16px)}60%{transform:translateY(3px)}100%{transform:none}}
/* stasiun 4: dua kartu dan batang */
.dua2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.kartu2{border:2px solid var(--line);border-radius:18px;padding:10px 6px;background:var(--card);text-align:center;display:flex;flex-direction:column;gap:2px;align-items:center}
.kartu2 b{font-family:var(--display);font-size:1.15rem;color:var(--ikat)}
.kartu2 .nl{font-family:var(--display);font-weight:800;font-size:1.7rem;font-variant-numeric:tabular-nums;animation:pop .4s}
.kartu2 .ket{font-size:.9rem;color:var(--muted);min-height:1.3em}
.bb{display:grid;grid-template-columns:5.2em 1fr;gap:8px;align-items:center;margin:4px 0}
.bb .lb{font-family:var(--display);font-weight:800;font-size:1rem}
.bb .tr{height:24px;border-radius:99px;background:var(--line);overflow:hidden}
.bb .tr i{display:block;height:100%;width:0;border-radius:99px;border:2px solid var(--ink);transition:width .9s cubic-bezier(.4,1.1,.5,1)}
/* bonus */
.pilih2{display:grid;gap:8px}
.pilih2 button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.05rem;min-height:50px;border-radius:14px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;touch-action:manipulation}
.pilih2 button.on{border-color:var(--ikat);background:var(--soft)}
.hasil2{display:flex;flex-direction:column;gap:6px}
.hasil2 div{display:flex;justify-content:space-between;align-items:center;border:2px solid var(--line);border-radius:14px;padding:8px 14px;background:var(--card);font-family:var(--display);font-weight:800;font-size:1.25rem;font-variant-numeric:tabular-nums}
.hasil2 div.asal{border-color:var(--ikat);background:var(--soft)}
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
      <h1>Ukur Tepat</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:center"></div></div>
      <p class="say">Ayo ukur panjang, berat, dan isi dengan satuan yang tepat!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: satuan yang pas -->
  <section class="screen" id="s1">
    <p class="say">Satuan baku apa yang paling pas?</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="benda" id="s1benda"></div><div class="tanya" id="s1judul"></div><div class="alat" id="s1alat"></div></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: takar kembar -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Geser sampai tepat.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="baca" id="s2baca"></div>
      <input type="range" id="s2geser" min="0" max="100" value="0" aria-label="Geser alat ukur"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: geser koma -->
  <section class="screen" id="s3">
    <p class="say">Ubah satuan dengan menggeser koma.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="kk" id="s3kk"></div><div class="baca" id="s3sat"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: samakan satuan -->
  <section class="screen" id="s4">
    <p class="say">Siapa lebih besar? Perhatikan satuannya.</p>
    <div class="dots" id="s4dots"></div>
    <div class="dua2" id="s4kartu"></div>
    <div class="panel" id="s4bar" style="display:none"></div>
    <div class="aksi" id="s4tombol"></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5: jumlah dan selisih -->
  <section class="screen" id="s5">
    <p class="say">Jumlahkan atau kurangkan. Samakan satuannya dulu.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="tanya" id="s5cerita"></div><div class="alat" id="s5alat"></div></div>
    <div class="catat" id="s5catat"></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: konverter satuan</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: ubah satuan apa saja. Geser angkanya!</p>
    <div class="pilih2" id="bJenis" style="grid-template-columns:repeat(3,1fr)"></div>
    <div class="pilih2" id="bSatuan"></div>
    <div class="panel"><div class="baca" id="bNilai"></div><input type="range" id="bGeser" min="0" max="100" step="0.5" value="1" aria-label="Nilai"></div>
    <div class="hasil2" id="bHasil"></div>
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
  if(id==='intro')setKata('Ayo ukur panjang, berat, dan isi dengan satuan yang tepat!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo ukur panjang, berat, dan isi dengan satuan yang tepat!');

/* ---- stasiun 1: satuan yang pas ---- */
var R1=[
  {e:'✏️',t:'Panjang pensil',alat:{k:'penggaris',n:15,maks:20,sat:'cm',langkah:5,l:'pensil'},opsi:['sentimeter (cm)','kilometer (km)','kilogram (kg)'],benar:'sentimeter (cm)',pesan:'Pensil pendek, jadi diukur dengan sentimeter. Hasilnya 15 cm.'},
  {e:'🍉',t:'Berat semangka',alat:{k:'timbangan',n:3,maks:5,sat:'kg'},opsi:['kilogram (kg)','kilometer (km)','mililiter (ml)'],benar:'kilogram (kg)',pesan:'Berat diukur dengan timbangan, satuannya kilogram. Semangka ini 3 kg.'},
  {e:'🥚',t:'Berat sebutir telur',alat:{k:'timbangan',n:60,maks:100,sat:'gram'},opsi:['gram (g)','ton','liter (l)'],benar:'gram (g)',pesan:'Telur ringan, jadi memakai gram. Telur ini 60 g.'},
  {e:'🚚',t:'Berat muatan truk',alat:{k:'timbangan',n:2,maks:5,sat:'ton'},opsi:['ton','gram (g)','sentimeter (cm)'],benar:'ton',pesan:'Truk membawa muatan sangat berat. 1 ton = 1.000 kg.'},
  {e:'🛣️',t:'Jarak rumah ke sekolah',alat:{k:'penggaris',n:2,maks:5,sat:'km',l:'jarak',w:'hijau'},opsi:['kilometer (km)','sentimeter (cm)','kilogram (kg)'],benar:'kilometer (km)',pesan:'Jarak jauh diukur dengan kilometer. 1 km = 1.000 m.'},
  {e:'🪣',t:'Air dalam ember',alat:{k:'takar',n:10,maks:12,sat:'liter',langkah:3},opsi:['liter (l)','meter (m)','kilogram (kg)'],benar:'liter (l)',pesan:'Air itu cairan. Isinya (volume) diukur dengan liter.'},
  {e:'📏',t:'Rani menulis hasil ukur pensilnya: "15 ..."',alat:null,opsi:['satuannya, misalnya cm','angkanya terlalu kecil','tidak ada yang kurang'],benar:'satuannya, misalnya cm',pesan:'Angka saja belum lengkap. 15 cm, 15 m, dan 15 km sangat berbeda.',nudge:'Lihat lagi tulisan Rani: ada yang belum ditulis.'}
];
var r1=0,svg1=null;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1];titik('s1dots',R1.length,r1);
  $('s1benda').textContent=d.e;$('s1judul').textContent=d.t;
  var w=$('s1alat');clear(w);svg1=null;
  if(d.alat){var g={};for(var k in d.alat)g[k]=d.alat[k];g.n=0;svg1=GBR[g.k](g);w.appendChild(svg1)}
  $('s1next').disabled=true;
  msg('s1msg','',d.alat?'Pilih satuan baku yang cocok untuk alat ukur ini.':'Apa yang kurang?');
  setKata($('s1judul').textContent);
  pilihan($('s1aksi'),d.opsi,d.benar,function(){
    if(svg1)ayun(svg1,0,d.alat.n,1100);
    msg('s1msg','good',d.pesan);setKata(d.pesan);
    $('s1aksi').querySelectorAll('button').forEach(function(b){b.disabled=true});
    $('s1next').disabled=false;
  },3,function(){msg('s1msg','warn',d.nudge||'Hampir! Coba bayangkan alat ukurnya: seberapa besar bendanya?')});
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: takar kembar ---- */
var R2=[
  {k:'takar',maks:2000,langkah:500,sat:'ml',step:50,target:500,kec:'ml',bes:'liter',f:1000,say:'Isi gelas sampai setengah liter.',pesan:'Setengah liter = 500 ml. Satu liter penuh adalah 1.000 ml.'},
  {k:'penggaris',maks:200,langkah:20,sat:'cm',step:5,target:120,kec:'cm',bes:'m',f:100,say:'Ukur pita sampai 1,2 meter.',pesan:'1,2 m = 120 cm. Satu meter adalah 100 cm.',w:'merah',l:'pita'},
  {k:'timbangan',maks:5000,sat:'g',step:100,target:2500,kec:'g',bes:'kg',f:1000,say:'Timbang tepung sampai 2,5 kilogram.',pesan:'2,5 kg = 2.500 g. Satu kilogram adalah 1.000 g.'},
  {k:'takar',maks:3000,langkah:1000,sat:'ml',step:100,target:1500,kec:'ml',bes:'liter',f:1000,say:'Isi gelas sampai 1,5 liter.',pesan:'1,5 liter = 1.500 ml. Satu setengah kali 1.000.'},
  {k:'timbangan',maks:1000,sat:'g',step:50,target:750,kec:'g',bes:'kg',f:1000,say:'Timbang gula sampai 750 gram. Berapa kilogramnya?',pesan:'750 g = 0,75 kg. Tiga perempat dari 1 kg.'}
];
var r2=0,svg2=null,sdh2=false;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);sdh2=false;
  $('s2say').textContent=d.say;setKata(d.say);
  var g={k:d.k,n:0,maks:d.maks,sat:d.sat,langkah:d.langkah,w:d.w,l:d.l};
  var w=$('s2alat');clear(w);svg2=GBR[d.k](g);w.appendChild(svg2);
  var sl=$('s2geser');sl.disabled=false;sl.min='0';sl.max=String(d.maks);sl.step=String(d.step);sl.value='0';
  bacaS2(0);$('s2next').disabled=true;
  msg('s2msg','','Geser pegangan di bawah gambar.');
}
function bacaS2(v){var d=R2[r2];$('s2baca').textContent=fmtId(v)+' '+d.kec+' = '+fmtId(v/d.f)+' '+d.bes}
$('s2geser').oninput=function(){
  if(sdh2)return;
  var d=R2[r2],v=+$('s2geser').value;
  svg2._ke(v);bacaS2(v);
  if(v===d.target){
    sdh2=true;$('s2geser').disabled=true;
    msg('s2msg','good','Tepat! '+d.pesan);setKata('Tepat! '+d.pesan);$('s2next').disabled=false;
  }else msg('s2msg','','Belum tepat. Sasaran: '+fmtId(d.target/d.f)+' '+d.bes+'.');
};
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: geser koma ---- */
/* rantai: [satuan tujuan, langkah koma, arah (1 = kanan = dikali, -1 = kiri = dibagi)] */
var R3=[
  {n:'3',dari:'km',rantai:[['m',3,1]]},
  {n:'2500',dari:'g',rantai:[['kg',3,-1]]},
  {n:'2,5',dari:'liter',rantai:[['ml',3,1]]},
  {n:'500',dari:'cm',rantai:[['m',2,-1]]},
  {n:'1',dari:'km',rantai:[['m',3,1],['cm',2,1]]},
  {n:'7000',dari:'mm',rantai:[['cm',1,-1],['m',2,-1]]}
];
var r3=0,lang3=0,cur3='',sat3='',kom3=null;
function lahirKoma(str){var p=str.indexOf(','),s=str.replace(',','');if(p<0)p=s.length;return {d:s.split(''),nol:s.split('').map(function(){return false}),p:p}}
function lukisKoma(kk,wadah,hop){
  clear(wadah);
  for(var i=0;i<=kk.d.length;i++){
    if(i===kk.p)wadah.appendChild(el('span','kom'+(hop?' hop':''),','));
    if(i<kk.d.length)wadah.appendChild(el('span','dg'+(kk.nol[i]?' nol':''),kk.d[i]));
  }
}
function hasilKoma(kk){
  var a=kk.d.slice(0,kk.p).join('').replace(/^0+/,'')||'0',b=kk.d.slice(kk.p).join('').replace(/0+$/,'');
  return a+(b?','+b:'');
}
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);lang3=0;cur3=d.n;sat3=d.dari;
  $('s3next').disabled=true;langkahS3();
}
function langkahS3(){
  var d=R3[r3],c=d.rantai[lang3],arah=c[2],k=c[1],F=Math.pow(10,k);
  kom3=lahirKoma(cur3);lukisKoma(kom3,$('s3kk'),false);
  var rute=d.dari;d.rantai.forEach(function(x){rute+=' → '+x[0]});
  $('s3sat').textContent=cur3+' '+sat3+'  ('+rute+')';
  var t='Dari '+sat3+' ke '+c[0]+': angkanya...';
  $('s3tanya').textContent=t;setKata(t);
  msg('s3msg','',(arah>0?c[0]+' satuan yang lebih kecil, jadi butuh lebih banyak.':c[0]+' satuan yang lebih besar, jadi butuh lebih sedikit.'));
  var benar=(arah>0?'dikali ':'dibagi ')+fmtId(F);
  var opsi=[benar,(arah>0?'dibagi ':'dikali ')+fmtId(F),(arah>0?'dikali ':'dibagi ')+fmtId(k===1?100:F/10)];
  pilihan($('s3aksi'),opsi,benar,function(){
    clear($('s3aksi'));$('s3tanya').textContent='';
    msg('s3msg','good','Geser koma '+k+' langkah ke '+(arah>0?'kanan':'kiri')+'.');
    geserS3(k,arah,c[0]);
  },3,function(){msg('s3msg','warn','Hampir! Satuan tujuan lebih '+(arah>0?'kecil':'besar')+', jadi angkanya jadi lebih '+(arah>0?'besar':'kecil')+'.')});
}
function geserS3(k,arah,tujuan){
  var kk=kom3,i;
  if(arah>0){while(kk.d.length<kk.p+k){kk.d.push('0');kk.nol.push(true)}}
  else{while(kk.p-k<0){kk.d.unshift('0');kk.nol.unshift(true);kk.p++}}
  lukisKoma(kk,$('s3kk'),false);
  for(i=1;i<=k;i++){(function(i){later(function(){kk.p+=arah;lukisKoma(kk,$('s3kk'),true)},i*600)})(i)}
  later(function(){
    var res=hasilKoma(kk),t=cur3+' '+sat3+' = '+res+' '+tujuan+'.';
    cur3=res;sat3=tujuan;kk.nol=kk.nol.map(function(){return false});lukisKoma(kk,$('s3kk'),false);
    msg('s3msg','good',t);setKata(t);
    lang3++;
    if(lang3<R3[r3].rantai.length)later(langkahS3,1500);
    else{$('s3sat').textContent=t;$('s3next').disabled=false}
  },(k+1)*600);
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: samakan satuan ---- */
var R4=[
  {tanya:'Siapa yang punya gula lebih banyak?',A:{nama:'Made',n:'3',u:'kg'},B:{nama:'Dewi',n:'2.500',u:'g'},ke:'g',va:3000,vb:2500,ka:'3 kg = 3.000 g',kb:''},
  {tanya:'Siapa yang punya tepung lebih banyak?',A:{nama:'Wati',n:'4.500',u:'g'},B:{nama:'Budi',n:'4',u:'kg'},ke:'g',va:4500,vb:4000,ka:'',kb:'4 kg = 4.000 g'},
  {tanya:'Tali mana yang lebih panjang?',A:{nama:'Tali A',n:'1,8',u:'m'},B:{nama:'Tali B',n:'190',u:'cm'},ke:'cm',va:180,vb:190,ka:'1,8 m = 180 cm',kb:''},
  {tanya:'Siapa yang membawa beban lebih berat?',A:{nama:'Eko',n:'2',u:'kg'},B:{nama:'Fira',n:'2.100',u:'g'},ke:'g',va:2000,vb:2100,ka:'2 kg = 2.000 g',kb:''},
  {tanya:'Mana yang lebih jauh?',A:{nama:'Ke sekolah',n:'1,2',u:'km'},B:{nama:'Ke pasar',n:'900',u:'m'},ke:'m',va:1200,vb:900,ka:'1,2 km = 1.200 m',kb:''}
];
var r4=0,sdh4=false;
function mulaiS4(){r4=0;ronde4()}
function kartu4(h,d){
  var k=el('div','kartu2');k.appendChild(el('b',null,h.nama));k.appendChild(el('div','nl',h.n+' '+h.u));k.appendChild(el('div','ket',''));return k;
}
function ronde4(){
  var d=R4[r4];sdh4=false;titik('s4dots',R4.length,r4);
  var w=$('s4kartu');clear(w);w.appendChild(kartu4(d.A,d));w.appendChild(kartu4(d.B,d));
  $('s4bar').style.display='none';clear($('s4bar'));
  var t=$('s4tombol');clear(t);t.className='aksi';
  var sama=tombol(t,'Samakan satuan',function(){samakan4()},'');
  $('s4tanya').textContent=d.tanya;setKata(d.tanya);$('s4next').disabled=true;
  msg('s4msg','','Satuannya berbeda. Tebak dulu, atau tekan "Samakan satuan".');
  var benar=d.va>d.vb?d.A.nama:d.B.nama;
  pilihan($('s4aksi'),[d.A.nama,d.B.nama,'Sama besar'],benar,function(){
    samakan4();
    var tx='Betul! '+(d.ka||d.kb)+', jadi '+benar+' lebih besar ('+fmtId(Math.max(d.va,d.vb))+' '+d.ke+' lawan '+fmtId(Math.min(d.va,d.vb))+' '+d.ke+').';
    msg('s4msg','good',tx);setKata(tx);sdh4=true;clear($('s4tanya'));$('s4tanya').textContent='';
    $('s4aksi').querySelectorAll('button').forEach(function(b){b.disabled=true});
    clear(t);$('s4next').disabled=false;
  },3,function(){
    msg('s4msg','warn','Hampir! Angka yang besar belum tentu ukuran yang besar. Samakan satuannya dulu.');
    sama.classList.add('hint');
  });
}
function samakan4(){
  var d=R4[r4],k=$('s4kartu').children,b=$('s4bar');
  if(b.style.display!=='none')return;
  var ket=[d.ka,d.kb],h=[d.A,d.B],v=[d.va,d.vb];
  for(var i=0;i<2;i++){
    k[i].querySelector('.nl').textContent=fmtId(v[i])+' '+d.ke;
    k[i].querySelector('.ket').textContent=ket[i]||'sudah dalam '+d.ke;
  }
  b.style.display='';clear(b);
  var mx=Math.max(v[0],v[1]),warna=['#4a7bd0','#e0a93b'],isi=[];
  for(var j=0;j<2;j++){
    var r=el('div','bb');r.appendChild(el('div','lb',h[j].nama));
    var tr=el('div','tr'),ib=el('i');ib.style.background=warna[j];tr.appendChild(ib);r.appendChild(tr);b.appendChild(r);isi.push(ib);
  }
  later(function(){for(var m=0;m<2;m++)isi[m].style.width=(v[m]/mx*100)+'%'},60);
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: jumlah dan selisih ---- */
var R5=[
  {cerita:'Ibu membeli 2 kg gula dan 500 g tepung. Berapa gram berat belanjaan?',g:{k:'bar',bagian:[{l:'2 kg',v:2000,w:'biru'},{l:'500 g',v:500,w:'kuning'}],atas:'? g'},
    steps:[{tanya:'Ubah 2 kg menjadi gram.',opsi:['2.000 g','200 g','20 g'],benar:'2.000 g',cat:'2 kg = 2.000 g',pesan:'2 kg = 2 × 1.000 = 2.000 g.'},
           {tanya:'Sekarang jumlahkan.',opsi:['2.500 g','2.050 g','700 g'],benar:'2.500 g',cat:'2.000 g + 500 g = 2.500 g',pesan:'2.000 + 500 = 2.500 g.'}]},
  {cerita:'Rani membeli 1,5 kg gula dan 800 g tepung. Berapa kilogram berat belanjaan?',g:{k:'bar',bagian:[{l:'1,5 kg',v:1500,w:'biru'},{l:'800 g',v:800,w:'kuning'}],atas:'? kg'},
    steps:[{tanya:'Ubah 800 g menjadi kilogram.',opsi:['0,8 kg','8 kg','80 kg'],benar:'0,8 kg',cat:'800 g = 0,8 kg',pesan:'800 : 1.000 = 0,8 kg.'},
           {tanya:'Sekarang jumlahkan.',opsi:['2,3 kg','801,5 kg','2,0 kg'],benar:'2,3 kg',cat:'1,5 kg + 0,8 kg = 2,3 kg',pesan:'1,5 + 0,8 = 2,3 kg.'}]},
  {cerita:'Sebuah truk membawa 3 ton beras. Dibongkar 500 kg. Berapa kilogram beras yang tersisa?',g:{k:'bar',bagian:[{l:'dibongkar 500 kg',v:500,w:'merah'},{l:'sisa ?',v:2500,w:'hijau'}],atas:'3 ton'},
    steps:[{tanya:'Ubah 3 ton menjadi kilogram.',opsi:['3.000 kg','300 kg','30 kg'],benar:'3.000 kg',cat:'3 ton = 3.000 kg',pesan:'3 × 1.000 = 3.000 kg.'},
           {tanya:'Sekarang kurangkan.',opsi:['2.500 kg','2.950 kg','3.500 kg'],benar:'2.500 kg',cat:'3.000 kg − 500 kg = 2.500 kg',pesan:'3.000 − 500 = 2.500 kg.'}]},
  {cerita:'Sebuah pita panjangnya 2 meter. Dipotong 35 cm. Berapa sentimeter pita yang tersisa?',g:{k:'bar',bagian:[{l:'dipotong 35 cm',v:35,w:'merah'},{l:'sisa ?',v:165,w:'hijau'}],atas:'2 m'},
    steps:[{tanya:'Ubah 2 m menjadi sentimeter.',opsi:['200 cm','20 cm','2.000 cm'],benar:'200 cm',cat:'2 m = 200 cm',pesan:'2 × 100 = 200 cm.'},
           {tanya:'Sekarang kurangkan.',opsi:['165 cm','235 cm','175 cm'],benar:'165 cm',cat:'200 cm − 35 cm = 165 cm',pesan:'200 − 35 = 165 cm.'}]},
  {cerita:'Kolam berisi 20 liter air. Ditambah 1.500 ml, lalu diambil 2.000 ml. Berapa liter air di kolam sekarang?',g:{k:'takar',n:20,maks:25,sat:'liter',langkah:5},
    steps:[{tanya:'Ubah 1.500 ml menjadi liter.',opsi:['1,5 liter','15 liter','150 liter'],benar:'1,5 liter',cat:'1.500 ml = 1,5 liter',pesan:'1.500 : 1.000 = 1,5 liter.'},
           {tanya:'Ubah 2.000 ml menjadi liter.',opsi:['2 liter','20 liter','0,2 liter'],benar:'2 liter',cat:'2.000 ml = 2 liter',pesan:'2.000 : 1.000 = 2 liter.'},
           {tanya:'Hitung: 20 + 1,5 − 2 = ...',opsi:['19,5 liter','21,5 liter','18,5 liter'],benar:'19,5 liter',cat:'20 + 1,5 − 2 = 19,5 liter',pesan:'20 + 1,5 = 21,5. Lalu 21,5 − 2 = 19,5 liter.'}]}
];
var r5=0,lang5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);lang5=0;
  $('s5cerita').textContent=d.cerita;setKata(d.cerita);
  var w=$('s5alat');clear(w);w.appendChild(GBR[d.g.k](d.g));
  clear($('s5catat'));$('s5next').disabled=true;langkahS5();
}
function langkahS5(){
  var d=R5[r5],s=d.steps[lang5];
  $('s5tanya').textContent=s.tanya;setKata(s.tanya);
  msg('s5msg','','Langkah '+(lang5+1)+' dari '+d.steps.length+'.');
  pilihan($('s5aksi'),s.opsi,s.benar,function(){
    var c=el('div');c.appendChild(document.createTextNode(s.cat));$('s5catat').appendChild(c);
    msg('s5msg','good',s.pesan);setKata(s.pesan);clear($('s5aksi'));$('s5tanya').textContent='';
    lang5++;
    if(lang5<d.steps.length)later(langkahS5,1300);
    else{msg('s5msg','good','Selesai! '+s.pesan);$('s5next').disabled=false}
  },3,function(){msg('s5msg','warn','Hampir! Ingat: satuannya harus sama dulu, dan lihat faktor ubahnya.')});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Ukuranmu tepat, satuannya pun tepat.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-15'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar'),a=GBR.takar({n:0,maks:2,sat:'liter',langkah:1}),b=GBR.timbangan({n:0,maks:5,sat:'kg'}),c=GBR.penggaris({n:0,maks:10,sat:'cm',l:'pensil'});
  c.style.gridColumn='1 / -1';
  w.appendChild(a);w.appendChild(b);w.appendChild(c);
  setTimeout(function(){ayun(a,0,1.5,1400);ayun(b,0,3,1400);ayun(c,0,8,1400)},400);
})();

/* ---- bonus: konverter satuan ---- */
var SAT={
  panjang:[['km',1000],['m',1],['cm',0.01],['mm',0.001]],
  berat:[['ton',1000],['kg',1],['g',0.001]],
  volume:[['liter',1],['ml',0.001]]
};
var bJenis='panjang',bUnit=1;
function mulaiBonus(){bJenis='panjang';bUnit=1;$('bGeser').value='1';gambarBonus()}
function angkaBonus(x){
  x=Math.round(x*1e6)/1e6;
  if(x>0&&fmtId(x)==='0')return 'kurang dari 0,001';
  return fmtId(x);
}
function gambarBonus(){
  var jw=$('bJenis');clear(jw);
  [['panjang','Panjang'],['berat','Berat'],['volume','Isi']].forEach(function(j){
    var b=el('button',bJenis===j[0]?'on':null,j[1]);
    b.onclick=function(){bJenis=j[0];bUnit=(j[0]==='volume'?0:1);gambarBonus()};
    jw.appendChild(b);
  });
  var u=SAT[bJenis],sw=$('bSatuan');clear(sw);sw.style.gridTemplateColumns='repeat('+u.length+',1fr)';
  u.forEach(function(x,i){
    var b=el('button',bUnit===i?'on':null,x[0]);
    b.onclick=function(){bUnit=i;gambarBonus()};
    sw.appendChild(b);
  });
  var v=+$('bGeser').value;
  $('bNilai').textContent=fmtId(v)+' '+u[bUnit][0]+' sama dengan...';
  var h=$('bHasil');clear(h);
  u.forEach(function(x,i){
    var d=el('div',i===bUnit?'asal':null);
    d.appendChild(el('span',null,x[0]));
    d.appendChild(el('span',null,angkaBonus(v*u[bUnit][1]/x[1])));
    h.appendChild(d);
  });
}
$('bGeser').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC15 = rakit(DASAR, { kode: 'AC-15', data: DATA_AC15 })
