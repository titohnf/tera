import { rakit } from './bersama'
import { DATA_AC06 } from './latihan/ac06'

/**
 * Materi interaktif AC-06 "Siapa Lebih?" (Membandingkan panjang, berat, dan
 * durasi dengan satuan tidak baku). Satu halaman HTML mandiri, ditampilkan lewat
 * iframe sandbox di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi
 * AC-06. Disimpan sebagai string supaya ikut terbundel di build tanpa membaca
 * berkas saat runtime.
 *
 * Rancangan sama dengan AC-01 sampai AC-05 (anak kelas 1-2, hampir tidak
 * membaca): SATU stasiun per layar, instruksi pendek, sentuh langsung, suara
 * bacaan sebagai tambahan (speechSynthesis, hanya tampil bila ada suara bahasa
 * Indonesia), dan akhir berupa bintang, bukan skor ujian.
 *
 * Stasiun: 1) panjang: ukur benda dengan klip (satuan tidak baku) lalu
 * bandingkan hitungannya, 2) berat: pilih yang lebih berat, neraca miring
 * sebagai pembuktian, 3) durasi: dua kegiatan "berlomba", yang selesai
 * belakangan lebih lama, 4) tantangan 4 soal. Bonus: benda yang sama diukur
 * dengan satuan berbeda, hitungannya berbeda (alasan perlu satuan yang sama).
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa; emoji di
 * skrip ditulis sebagai escape \u{...} (tetap utuh di dalam String.raw karena
 * yang menguraikannya mesin JS di halaman, bukan TypeScript).
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-06 di Misi.
 *
 * Stasiun tambahan (sx): dua petunjuk lalu urutkan tiga benda (sifat transitif).
 *
 * LATIHAN SESUDAH STASIUN PRAKTIK. Tantangan lama diganti tiga stasiun dari mesin
 * bersama (`bersama.ts`): Benar atau salah, Siapa yang benar, dan Tantangan Misi.
 * Bahannya disusun dari konsep yang diuji bank soal topik ini (`latihan/ac06.ts`),
 * supaya anak terbiasa dengan bentuk soal Misi yang sebenarnya.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Siapa Lebih?</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#fbf6ea; --card:#ffffff; --ink:#2b2a33; --muted:#6b6878;
  --ikat:#d94f3d; --lidi:#e0a93b; --lidi-dark:#b97f12; --ok:#2e9a63; --bad:#d23b4e; --line:#eadfc4; --soft:#fff3d0;
  --display:'Baloo 2','Trebuchet MS',system-ui,sans-serif; --body:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;
}
@media (prefers-color-scheme: dark){
  :root{--bg:#1f1c17;--card:#2a2620;--ink:#f6efe0;--muted:#b9b09b;--line:#4a4231;--soft:#3a3220;--ok:#5cc990;--bad:#ff7a8a;--lidi:#e7b34a;--ikat:#ef6b59}
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-weight:600;font-size:20px;line-height:1.4;-webkit-tap-highlight-color:transparent}
.app{max-width:560px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;padding:12px 16px 20px;gap:12px}
h1,h2{font-family:var(--display);margin:0;line-height:1.1;text-wrap:balance}
h1{font-size:clamp(2.6rem,12vw,3.6rem);font-weight:800}
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
button.big{font:inherit;font-family:var(--display);font-weight:800;font-size:1.35rem;min-height:60px;border-radius:18px;border:2px solid var(--ink);background:var(--card);color:var(--ink);box-shadow:0 4px 0 var(--ink);cursor:pointer;padding:10px 18px}
button.big:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink)}
button.big.main{background:var(--ikat);color:#fff}
button.big.soft{box-shadow:none;border-color:var(--line);font-size:1.1rem;min-height:52px}
button.big:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
button.big.hint{animation:denyut 1s infinite}
@keyframes denyut{50%{box-shadow:0 0 0 5px rgba(217,79,61,.45)}}
@keyframes goyang{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.row{display:flex;gap:10px;flex-wrap:wrap}
.center{text-align:center}
.num{font-family:var(--display);font-weight:800;font-size:3rem;line-height:1;font-variant-numeric:tabular-nums}
/* stasiun 1: ukur dengan klip */
.skala{overflow-x:auto;padding:2px 0 6px}
.skala .in{width:max-content;min-width:100%}
.namaobj{font-family:var(--display);font-weight:800;font-size:1.2rem;margin-bottom:4px}
.objek{height:34px;border-radius:8px;border:3px solid var(--ink)}
.rel{display:flex;margin-top:10px;min-height:22px}
.klip{width:34px;height:22px;flex:none;border-radius:6px;border:3px solid var(--ink);background:var(--lidi);margin:0;animation:pop .25s}
@keyframes pop{0%{transform:scale(.4)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
.ctrl{display:grid;grid-template-columns:1fr 2fr;gap:10px}
/* stasiun 2: neraca */
.neraca{position:relative;padding:10px 0 0}
.beam{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:8px solid var(--ink);border-radius:4px;transform-origin:50% 100%;transform:rotate(var(--r,0deg));transition:transform .8s cubic-bezier(.3,1.4,.5,1);padding:0 4px}
.brg{font:inherit;background:transparent;border:3px solid transparent;border-radius:18px;padding:6px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--ink);transform:rotate(calc(var(--r,0deg) * -1));transition:transform .8s cubic-bezier(.3,1.4,.5,1);touch-action:manipulation}
.brg .em{font-size:3.2rem;line-height:1}
.brg .nm{font-family:var(--display);font-weight:800;font-size:1.1rem}
.brg.right{border-color:var(--ok);background:var(--soft)}
.brg.bad{border-color:var(--bad)}
.brg.hint{animation:denyut 1s infinite}
.tiang{width:0;height:0;margin:0 auto;border-left:26px solid transparent;border-right:26px solid transparent;border-bottom:44px solid var(--ink)}
/* stasiun 3: lomba durasi */
.lajur{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}
.lajur .nm{font-family:var(--display);font-weight:800;font-size:1.2rem}
.jalur{height:22px;border-radius:99px;background:var(--line);overflow:hidden}
.jalur i{display:block;height:100%;width:0;background:var(--ok);border-radius:99px}
.pilih2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.kartu{font:inherit;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:18px;padding:10px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;touch-action:manipulation}
.kartu .em{font-size:2.6rem;line-height:1}
.kartu .nm{font-family:var(--display);font-weight:800;font-size:1.05rem}
.kartu:disabled{opacity:.4;cursor:not-allowed}
.kartu.right{border-color:var(--ok);background:var(--soft)}
.kartu.bad{border-color:var(--bad);animation:goyang .4s}
/* tantangan */
.q{font-family:var(--display);font-size:1.5rem;font-weight:800}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.opt{font:inherit;font-family:var(--display);font-weight:800;font-size:1.35rem;min-height:68px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:8px}
.opt.right{background:var(--ok);border-color:var(--ok);color:#fff}
.opt.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
.vis{display:flex;flex-direction:column;gap:8px}
.tali{display:flex;align-items:center;gap:8px}
.tali b{font-family:var(--display);width:3.4em;flex:none}
.tali i{display:block;height:20px;border-radius:99px;border:3px solid var(--ink)}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
/* bonus */
.chip{font:inherit;font-weight:800;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:99px;padding:8px 14px;cursor:pointer;min-height:44px}
.chip.on{border-color:var(--ikat);background:var(--soft)}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

/* stasiun tambahan: sifat transitif (A > B dan B > C) */
.tr-petunjuk{display:flex;flex-direction:column;gap:8px}
.tr-petunjuk div{background:var(--soft);border:2px solid var(--lidi);border-radius:14px;padding:10px 12px;font-family:var(--display);font-weight:800;font-size:1.2rem}
.tr-daftar{display:flex;flex-direction:column;gap:10px}
.tr-opt{font:inherit;font-family:var(--display);font-weight:800;font-size:1.4rem;color:var(--ink);background:var(--card);border:2px solid var(--line);border-radius:16px;min-height:58px;padding:6px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;touch-action:manipulation}
.tr-opt .no{width:34px;height:34px;border-radius:50%;background:var(--ok);color:#fff;font-size:1.1rem;display:none;align-items:center;justify-content:center}
.tr-opt.sudah{opacity:.6;border-color:var(--ok)}
.tr-opt.sudah .no{display:flex}
.tr-opt.bad{animation:goyang .4s;border-color:var(--bad)}
.tr-bar{height:20px;border-radius:99px;border:3px solid var(--ink)}
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
      <h1>Siapa Lebih?</h1>
      <div style="font-size:3.6rem;line-height:1" aria-hidden="true">&#128024; &#128045;</div>
      <p class="say">Ayo bandingkan panjang, berat, dan lama!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: ukur panjang dengan klip -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Ukur pakai klip.</p>
    <div class="row" style="align-items:center;justify-content:space-between">
      <div class="num" id="s1n">0</div>
      <div class="dots" id="s1dots"></div>
    </div>
    <div class="panel"><div class="skala"><div class="in">
      <div class="namaobj" id="s1nama"></div>
      <div class="objek" id="s1objek"></div>
      <div class="rel" id="s1rel"></div>
    </div></div></div>
    <div class="ctrl">
      <button class="big" id="s1kurang" aria-label="Kurangi klip">&#8722;</button>
      <button class="big" id="s1tambah">+ Klip</button>
    </div>
    <div class="msg" id="s1msg">Ketuk + Klip sampai ujung.</div>
    <div class="cta">
      <button class="big main" id="s1next" disabled>Lanjut</button>
      <button class="big soft" id="s1ulang">Mulai lagi</button>
    </div>
  </section>

  <!-- 2: berat -->
  <section class="screen" id="s2">
    <p class="say">Mana yang lebih berat?</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="neraca"><div class="beam" id="s2beam"></div><div class="tiang"></div></div></div>
    <div class="msg" id="s2msg">Ketuk yang lebih berat.</div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: durasi -->
  <section class="screen" id="s3">
    <p class="say">Mana yang lebih lama?</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel" id="s3lomba"></div>
    <button class="big" id="s3mulai">Mulai!</button>
    <div class="pilih2" id="s3pilih"></div>
    <div class="msg" id="s3msg">Ketuk Mulai, lihat siapa selesai belakangan.</div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 3b: sifat transitif -->
  <section class="screen" id="sx">
    <p class="say" id="sxsay"></p>
    <div class="dots" id="sxdots"></div>
    <div class="tr-petunjuk" id="sxpet"></div>
    <div class="tr-daftar" id="sxdaftar"></div>
    <div class="msg" id="sxmsg"></div>
    <div class="cta"><button class="big main" id="sxnext" disabled>Lanjut</button></div>
  </section>

  <!-- 4: tantangan -->
  <section class="screen" id="s4">
    <div class="sub" id="s4n"></div>
    <div class="vis" id="s4v"></div>
    <p class="q" id="s4q"></p>
    <div class="opts" id="s4o"></div>
    <div class="msg" id="s4fb" style="display:none"></div>
    <div class="cta"><button class="big main" id="s4next" style="display:none">Lanjut</button></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: satuan berbeda</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: ukur meja dengan alat berbeda.</p>
    <div class="row" id="bChip" style="justify-content:center"></div>
    <div class="panel"><div class="skala"><div class="in">
      <div class="namaobj">Meja</div>
      <div class="objek" id="bobjek" style="width:240px;background:var(--soft)"></div>
      <div class="rel" id="brel"></div>
    </div></div></div>
    <div class="msg" id="bmsg">Pilih alat ukur.</div>
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
var urut=['intro','s1','s2','s3','sx','s4','akhir'];
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
  if(id==='s3')mulaiS3();if(id==='sx')mulaiSx();
  if(id==='s4')mulaiS4();
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')mulaiBonus();
  if(id==='intro')setKata('Ayo bandingkan panjang, berat, dan lama!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo bandingkan panjang, berat, dan lama!');

/* ---- stasiun 1: ukur dengan klip ---- */
var U=34;
var BENDA=[
  {n:'Pensil',len:5,c:'#e0a93b'},
  {n:'Buku',len:8,c:'#4a7bd0'},
  {n:'Penghapus',len:3,c:'#d94f3d'}
];
var r1=0,klip=0,hasil1=[];
function mulaiS1(){r1=0;hasil1=[];ronde1()}
function ronde1(){
  var b=BENDA[r1];klip=0;
  titik('s1dots',BENDA.length,r1);
  $('s1nama').textContent=b.n;
  var o=$('s1objek');o.style.width=(b.len*U)+'px';o.style.background=b.c;
  $('s1say').textContent='Ukur '+b.n.toLowerCase()+' pakai klip.';
  $('s1tambah').classList.toggle('hint',r1===0);
  $('s1next').disabled=true;
  gambar1();
  msg('s1msg','','Ketuk + Klip sampai ujung.');
  setKata('Ukur '+b.n.toLowerCase()+' pakai klip. Ketuk tambah klip sampai ujung.');
}
function gambar1(){
  var b=BENDA[r1],rel=$('s1rel');clear(rel);
  for(var i=0;i<klip;i++){var k=el('div','klip');if(i!==klip-1)k.style.animation='none';rel.appendChild(k)}
  $('s1n').textContent=klip;
  var sk=$('s1objek').parentNode.parentNode;
  try{sk.scrollTo({left:Math.max(0,klip*U-sk.clientWidth+40),behavior:'smooth'})}catch(e){}
}
function nilai1(){
  var b=BENDA[r1];
  if(klip===b.len){
    hasil1[r1]=b.len;
    var t=b.n+' panjangnya '+b.len+' klip.';
    if(r1===BENDA.length-1){
      var maks=0,min=0;BENDA.forEach(function(x,i){if(x.len>BENDA[maks].len)maks=i;if(x.len<BENDA[min].len)min=i});
      t+=' Paling panjang: '+BENDA[maks].n.toLowerCase()+'. Paling pendek: '+BENDA[min].n.toLowerCase()+'.';
    }
    msg('s1msg','good',t);setKata(t);$('s1next').disabled=false;
  }else{
    $('s1next').disabled=true;
    msg('s1msg',klip>b.len?'warn':'',klip>b.len?'Kelebihan. Kurangi satu klip.':(klip===0?'Ketuk + Klip sampai ujung.':'Belum sampai ujung. Tambah lagi.'));
  }
}
$('s1tambah').onclick=function(){
  var b=BENDA[r1];if(klip>=b.len+2)return;
  klip++;$('s1tambah').classList.remove('hint');gambar1();nilai1();
};
$('s1kurang').onclick=function(){if(klip<=0)return;klip--;gambar1();nilai1()};
$('s1ulang').onclick=function(){ronde1()};
$('s1next').onclick=function(){if(r1<BENDA.length-1){r1++;ronde1()}else show('s2')};

/* ---- pasangan benda berat dan kegiatan lama (dipakai juga di tantangan) ---- */
var BERAT=[
  [{n:'Gajah',e:'\u{1F418}',v:9},{n:'Tikus',e:'\u{1F42D}',v:1}],
  [{n:'Semangka',e:'\u{1F349}',v:6},{n:'Apel',e:'\u{1F34E}',v:2}],
  [{n:'Mobil',e:'\u{1F697}',v:9},{n:'Bola',e:'⚽',v:2}],
  [{n:'Buku',e:'\u{1F4D6}',v:4},{n:'Balon',e:'\u{1F388}',v:1}]
];
var LAMA=[
  [{n:'Tepuk tangan',e:'\u{1F44F}',v:1.5},{n:'Makan nasi',e:'\u{1F35A}',v:4.5}],
  [{n:'Cuci tangan',e:'\u{1F9FC}',v:2.5},{n:'Tidur siang',e:'\u{1F634}',v:5.5}],
  [{n:'Mengedip',e:'\u{1F440}',v:1},{n:'Mandi',e:'\u{1F6C1}',v:4}]
];

/* ---- stasiun 2: neraca ---- */
var PAS2=[],r2=0,selesai2=false;
function mulaiS2(){PAS2=shuffle(BERAT).slice(0,3).map(function(p){return shuffle(p)});r2=0;ronde2()}
function ronde2(){
  selesai2=false;titik('s2dots',PAS2.length,r2);
  var beam=$('s2beam');beam.style.setProperty('--r','0deg');clear(beam);
  var p=PAS2[r2],berat=p[0].v>p[1].v?0:1;
  p.forEach(function(x,i){
    var b=el('button','brg'+(r2===0&&i===berat?' hint':''));
    b.setAttribute('aria-label',x.n);
    b.appendChild(el('span','em',x.e));b.appendChild(el('span','nm',x.n));
    b.onclick=function(){
      if(selesai2)return;
      beam.style.setProperty('--r',(berat===0?-11:11)+'deg');
      if(i===berat){
        selesai2=true;b.classList.remove('hint');b.classList.add('right');
        var t='Betul! '+x.n+' lebih berat. Neracanya turun.';
        msg('s2msg','good',t);setKata(t);$('s2next').disabled=false;
      }else{
        b.classList.add('bad');
        var t2='Hampir! Lihat neraca: '+p[berat].n+' turun, jadi lebih berat.';
        msg('s2msg','warn',t2);setKata(t2);
      }
    };
    beam.appendChild(b);
  });
  $('s2next').disabled=true;
  msg('s2msg','',r2===0?'Ketuk yang berdenyut.':'Ketuk yang lebih berat.');
  setKata('Mana yang lebih berat?');
}
$('s2next').onclick=function(){if(r2<PAS2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: lomba durasi ---- */
var PAS3=[],r3=0,jalan3=false,selesai3=false;
function mulaiS3(){PAS3=shuffle(LAMA).map(function(p){return shuffle(p)});r3=0;ronde3()}
function ronde3(){
  jalan3=false;selesai3=false;titik('s3dots',PAS3.length,r3);
  var p=PAS3[r3],lama=p[0].v>p[1].v?0:1;
  var lm=$('s3lomba');clear(lm);
  p.forEach(function(x){
    var l=el('div','lajur');
    l.appendChild(el('div','nm',x.e+' '+x.n));
    var j=el('div','jalur');j.appendChild(el('i'));l.appendChild(j);
    lm.appendChild(l);
  });
  var pl=$('s3pilih');clear(pl);
  p.forEach(function(x,i){
    var k=el('button','kartu');k.disabled=true;k.setAttribute('aria-label',x.n);
    k.appendChild(el('span','em',x.e));k.appendChild(el('span','nm',x.n));
    k.onclick=function(){
      if(selesai3)return;
      if(i===lama){
        selesai3=true;k.classList.add('right');
        var t='Betul! '+x.n+' lebih lama. Selesainya belakangan.';
        msg('s3msg','good',t);setKata(t);$('s3next').disabled=false;
      }else{
        k.classList.remove('bad');void k.offsetWidth;k.classList.add('bad');
        var t2='Hampir! Yang selesai belakangan lebih lama.';
        msg('s3msg','warn',t2);setKata(t2);
      }
    };
    pl.appendChild(k);
  });
  $('s3mulai').disabled=false;$('s3mulai').classList.toggle('hint',r3===0);
  $('s3next').disabled=true;
  msg('s3msg','','Ketuk Mulai, lihat siapa selesai belakangan.');
  setKata('Mana yang lebih lama? Ketuk mulai.');
}
$('s3mulai').onclick=function(){
  if(jalan3)return;jalan3=true;
  $('s3mulai').disabled=true;$('s3mulai').classList.remove('hint');
  msg('s3msg','','Lihat...');
  var p=PAS3[r3],js=$('s3lomba').querySelectorAll('.jalur i'),maks=0;
  p.forEach(function(x,i){
    maks=Math.max(maks,x.v);
    js[i].style.transition='width '+x.v+'s linear';
    later(function(){js[i].style.width='100%'},40);
  });
  later(function(){
    var ks=$('s3pilih').children;for(var i=0;i<ks.length;i++)ks[i].disabled=false;
    msg('s3msg','','Mana yang lebih lama? Ketuk.');setKata('Mana yang lebih lama? Ketuk.');
  },maks*1000+250);
};
$('s3next').onclick=function(){if(r3<PAS3.length-1){r3++;ronde3()}else show('sx')};

/* ---- stasiun tambahan: dua petunjuk, urutkan tiga benda (transitif) ---- */
var TR=[
  {nama:['Tongkat A','Tongkat B','Tongkat C'],kata:'panjang'},
  {nama:['Batu P','Batu Q','Batu R'],kata:'berat'},
  {nama:['Kegiatan 1','Kegiatan 2','Kegiatan 3'],kata:'lama'}
];
var tri=0,urutT=[],kunciT=0;
function msgT(k,t){var m=$('sxmsg');m.className='msg'+(k?' '+k:'');m.textContent=t}
function mulaiSx(){TR=shuffle(TR);tri=0;rondeT()}
function rondeT(){
  var d=TR[tri],w=$('sxdots');clear(w);for(var j=0;j<TR.length;j++)w.appendChild(el('i',j<=tri?'on':''));
  urutT=shuffle(d.nama);kunciT=0;
  var terbesar=urutT[0],tengah=urutT[1],terkecil=urutT[2];
  $('sxsay').textContent='Urutkan dari yang paling '+d.kata+'.';
  var p=$('sxpet');clear(p);
  shuffle([terbesar+' lebih '+d.kata+' dari '+tengah+'.',tengah+' lebih '+d.kata+' dari '+terkecil+'.']).forEach(function(t){p.appendChild(el('div',null,t))});
  var l=$('sxdaftar');clear(l);
  shuffle(d.nama).forEach(function(n){
    var b=el('button','tr-opt');b.appendChild(el('span',null,n));b.appendChild(el('span','no'));
    b.onclick=function(){
      if(b.classList.contains('sudah')||kunciT>=3)return;
      if(n===urutT[kunciT]){
        kunciT++;b.classList.add('sudah');b.querySelector('.no').textContent=String(kunciT);
        if(kunciT===3)selesaiT();else msgT('good','Betul! Berikutnya.');
      }else{
        b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');
        var t='Cari yang paling '+d.kata+' dulu: ia lebih '+d.kata+' dari yang lain di petunjuk.';
        msgT('warn',t);setKata(t);
      }
    };
    l.appendChild(b);
  });
  $('sxnext').disabled=true;msgT('','Baca dua petunjuk, lalu ketuk satu per satu.');
  setKata($('sxsay').textContent);
}
function selesaiT(){
  var d=TR[tri];
  var t=urutT[0]+' > '+urutT[1]+' > '+urutT[2]+'. Jadi '+urutT[0]+' juga lebih '+d.kata+' dari '+urutT[2]+', walau tidak ada petunjuk langsungnya.';
  msgT('good',t);setKata(t);$('sxnext').disabled=false;
}
$('sxnext').onclick=function(){if(tri<TR.length-1){tri++;rondeT()}else show('s4')};

/* ---- tantangan: 4 soal, balasan langsung ---- */
function namaPasang(p){return p.e+' '+p.n}
function bangunSoal(){
  var s=[];
  (function(){
    var a=rnd(3,8),b=rnd(3,8);while(b===a)b=rnd(3,8);
    var panjang=rnd(0,1)?true:false,nama=['Tali A','Tali B'],n=[a,b];
    var ans=panjang?(a>b?0:1):(a<b?0:1);
    s.push({
      vis:function(){
        var w=el('div','vis');
        n.forEach(function(x,i){var t=el('div','tali');t.appendChild(el('b',null,nama[i]));var bar=el('i');bar.style.width=(x*28)+'px';bar.style.background=i?'#4a7bd0':'#e0a93b';t.appendChild(bar);w.appendChild(t)});
        return w;
      },
      q:panjang?'Mana yang lebih panjang?':'Mana yang lebih pendek?',
      opsi:[{id:'0',t:nama[0]},{id:'1',t:nama[1]}],a:String(ans),
      e:nama[ans]+(panjang?' lebih panjang.':' lebih pendek.')
    });
  })();
  (function(){
    var p=BERAT[rnd(0,BERAT.length-1)],ans=p[0].v>p[1].v?0:1;
    s.push({q:'Mana yang lebih berat?',opsi:[{id:'0',t:namaPasang(p[0])},{id:'1',t:namaPasang(p[1])}],a:String(ans),e:p[ans].n+' lebih berat.'});
  })();
  (function(){
    var p=LAMA[rnd(0,LAMA.length-1)],ans=p[0].v>p[1].v?0:1;
    s.push({q:'Mana yang lebih lama?',opsi:[{id:'0',t:namaPasang(p[0])},{id:'1',t:namaPasang(p[1])}],a:String(ans),e:p[ans].n+' lebih lama.'});
  })();
  (function(){
    var nama=shuffle(['Pensil','Sapu','Tali','Buku','Sendok']).slice(0,2),a=rnd(2,9),b=rnd(2,9);while(b===a)b=rnd(2,9);
    var panjang=rnd(0,1)?true:false,ans=panjang?(a>b?0:1):(a<b?0:1);
    s.push({
      q:nama[0]+' '+a+' klip. '+nama[1]+' '+b+' klip. Mana yang lebih '+(panjang?'panjang':'pendek')+'?',
      opsi:[{id:'0',t:nama[0]},{id:'1',t:nama[1]}],a:String(ans),
      e:nama[ans]+' '+(ans?b:a)+' klip. Lebih '+(panjang?'panjang':'pendek')+'.'
    });
  })();
  return s;
}
var soal=[],qi=0,benar=0,terkunci=false;
function mulaiS4(){soal=bangunSoal();qi=0;benar=0;tampilSoal()}
function tampilSoal(){
  terkunci=false;
  var q=soal[qi];
  $('s4n').textContent='Tantangan '+(qi+1)+' dari '+soal.length;
  $('s4q').textContent=q.q;
  var v=$('s4v');clear(v);if(q.vis)v.appendChild(q.vis());
  var o=$('s4o');clear(o);
  shuffle(q.opsi).forEach(function(x){
    var b=el('button','opt',x.t);b.setAttribute('data-id',x.id);
    b.onclick=function(){
      if(terkunci)return;terkunci=true;
      var ok=x.id===q.a;if(ok)benar++;
      var all=o.children;for(var k=0;k<all.length;k++){if(all[k].getAttribute('data-id')===q.a)all[k].classList.add('right');else if(all[k]===b)all[k].classList.add('wrong')}
      var fb=$('s4fb');fb.style.display='flex';fb.className='msg '+(ok?'good':'warn');
      fb.textContent=(ok?'Benar! ':'Hampir! ')+q.e;
      setKata((ok?'Benar! ':'Hampir! ')+q.e);
      var nx=$('s4next');nx.style.display='';nx.textContent=qi===soal.length-1?'Selesai':'Lanjut';
    };
    o.appendChild(b);
  });
  $('s4fb').style.display='none';$('s4next').style.display='none';
  setKata(q.q);
}
$('s4next').onclick=function(){if(qi<soal.length-1){qi++;tampilSoal()}else show('akhir')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu pandai membandingkan.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-06'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};

/* ---- bonus: meja yang sama, satuan berbeda ---- */
var SATUAN=[{n:'Tutup botol',u:24,c:'#c75ba0'},{n:'Klip',u:30,c:'#e0a93b'},{n:'Balok',u:60,c:'#4a7bd0'}];
var pakai=1,sudahDicoba={};
function mulaiBonus(){pakai=1;sudahDicoba={};chipBonus();gambarBonus(true)}
function chipBonus(){
  var c=$('bChip');clear(c);
  SATUAN.forEach(function(s,i){
    var b=el('button','chip'+(i===pakai?' on':''),s.n);
    b.onclick=function(){pakai=i;chipBonus();gambarBonus(false)};
    c.appendChild(b);
  });
}
function gambarBonus(awal){
  var s=SATUAN[pakai],n=240/s.u,rel=$('brel');clear(rel);
  for(var i=0;i<n;i++){var k=el('div','klip');k.style.width=s.u+'px';k.style.background=s.c;k.style.animation='none';rel.appendChild(k)}
  if(awal){msg('bmsg','','Pilih alat ukur.');return}
  sudahDicoba[pakai]=n;
  var t='Meja = '+n+' '+s.n.toLowerCase()+'.';
  if(Object.keys(sudahDicoba).length>=2)t+=' Alatnya beda, hitungannya beda. Saat membandingkan, pakai alat yang sama!';
  msg('bmsg','good',t);setKata(t);
}
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC06 = rakit(DASAR, { kode: 'AC-06', tantangan: 's4', data: DATA_AC06 })
