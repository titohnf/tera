import { rakit } from './bersama'
import { DATA_AC07 } from './latihan/ac07'

/**
 * Materi interaktif AC-07 "Pilah dan Hitung" (Mengurutkan, menyortir,
 * mengelompokkan, dan menyajikan data dengan piktogram). Satu halaman HTML
 * mandiri, ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai
 * langkah Belajar di topik Misi AC-07. Disimpan sebagai string supaya ikut
 * terbundel di build tanpa membaca berkas saat runtime.
 *
 * Rancangan sama dengan AC-01 sampai AC-06 (anak kelas 1-2, hampir tidak
 * membaca): SATU stasiun per layar, instruksi pendek, sentuh langsung, suara
 * bacaan sebagai tambahan (speechSynthesis, hanya tampil bila ada suara bahasa
 * Indonesia), dan akhir berupa bintang, bukan skor ujian.
 *
 * Lima stasiun (topik ini lebih luas dari yang lain): 1) pilah benda ke dua
 * keranjang menurut ciri, 2) urutkan (paling pendek/panjang/sedikit),
 * 3) baca piktogram (paling banyak, paling sedikit, jumlah satu jenis),
 * 4) buat piktogram dengan mengetuk benda satu per satu, 5) tantangan 4 soal.
 * Bonus: pungutan suara buah favorit yang langsung menjadi piktogram. Satu
 * gambar selalu mewakili satu benda (tidak ada skala), sesuai Fase A.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa; emoji di
 * skrip ditulis sebagai escape \u{...} (tetap utuh di dalam String.raw karena
 * yang menguraikannya mesin JS di halaman, bukan TypeScript).
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-07 di Misi.
 *
 * Stasiun tambahan (sx): piktogram berskala (1 gambar = 2, 5, ...) dan membuatnya.
 *
 * LATIHAN SESUDAH STASIUN PRAKTIK. Tantangan lama diganti tiga stasiun dari mesin
 * bersama (`bersama.ts`): Benar atau salah, Siapa yang benar, dan Tantangan Misi.
 * Bahannya disusun dari konsep yang diuji bank soal topik ini (`latihan/ac07.ts`),
 * supaya anak terbiasa dengan bentuk soal Misi yang sebenarnya.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pilah dan Hitung</title>
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
@keyframes denyut{50%{box-shadow:0 0 0 5px rgba(217,79,61,.45)}}
@keyframes goyang{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
@keyframes pop{0%{transform:scale(.4)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.row{display:flex;gap:10px;flex-wrap:wrap}
.center{text-align:center}
/* stasiun 1: pilah */
.kartuItem{font-size:5rem;line-height:1.1;text-align:center;min-height:100px;display:flex;align-items:center;justify-content:center}
.kartuItem.pop{animation:pop .3s}
.kerj{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.keranjang{font:inherit;color:var(--ink);background:var(--card);border:3px solid var(--ink);border-radius:20px;padding:8px;min-height:140px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;touch-action:manipulation}
.keranjang .nm{font-family:var(--display);font-weight:800;font-size:1.3rem}
.keranjang .isi{display:flex;flex-wrap:wrap;gap:2px;justify-content:center;font-size:1.6rem;line-height:1.1}
.keranjang.bad{animation:goyang .4s;border-color:var(--bad)}
.keranjang.k0{background:#fdecea}.keranjang.k1{background:#fff3d0}
@media (prefers-color-scheme: dark){.keranjang.k0{background:#3b2522}.keranjang.k1{background:#3a3220}}
/* stasiun 2: urut */
.daftar{display:flex;flex-direction:column;gap:10px}
.urutan{font:inherit;color:var(--ink);background:var(--card);border:2px solid var(--line);border-radius:16px;padding:8px 10px;min-height:56px;cursor:pointer;display:flex;align-items:center;gap:10px;text-align:left;touch-action:manipulation;position:relative}
.urutan .bg{height:22px;border-radius:99px;border:3px solid var(--ink);flex:none}
.urutan .em{font-size:1.5rem;line-height:1.1;display:flex;flex-wrap:wrap;gap:2px}
.urutan .no{margin-left:auto;width:34px;height:34px;border-radius:50%;background:var(--ok);color:#fff;font-family:var(--display);font-weight:800;display:none;align-items:center;justify-content:center;flex:none}
.urutan.sudah{opacity:.55;border-color:var(--ok)}
.urutan.sudah .no{display:flex}
.urutan.bad{animation:goyang .4s;border-color:var(--bad)}
/* piktogram */
.pk{display:flex;flex-direction:column;gap:2px}
.pk .br{font:inherit;color:var(--ink);background:transparent;border:2px solid transparent;border-bottom:2px dashed var(--line);border-radius:12px;display:flex;align-items:center;gap:8px;min-height:52px;padding:2px 4px;text-align:left;width:100%}
.pk button.br{cursor:pointer;touch-action:manipulation}
.pk .lb{font-size:2.1rem;width:48px;text-align:center;flex:none;line-height:1}
.pk .ic{display:flex;flex-wrap:wrap;gap:2px;font-size:1.7rem;line-height:1.1;flex:1;min-height:1.7rem}
.pk .ic span{animation:pop .25s}
.pk .ct{font-family:var(--display);font-weight:800;width:1.5em;text-align:right;flex:none;color:var(--muted)}
.pk .br.right{border-color:var(--ok);background:var(--soft)}
.pk .br.bad{border-color:var(--bad);animation:goyang .4s}
.angka{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.angka button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.8rem;min-height:64px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.angka button.right{background:var(--ok);border-color:var(--ok);color:#fff}
.angka button.bad{background:var(--bad);border-color:var(--bad);color:#fff}
/* stasiun 4: kumpulan benda */
.awan{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.awan button{font-size:2.2rem;line-height:1;background:transparent;border:2px solid var(--line);border-radius:14px;width:56px;height:56px;cursor:pointer;touch-action:manipulation;padding:0}
.awan button:disabled{opacity:.2;cursor:default}
/* tantangan */
.q{font-family:var(--display);font-size:1.5rem;font-weight:800}
.opts{display:grid;gap:10px}
.opt{font:inherit;font-family:var(--display);font-weight:800;font-size:1.8rem;min-height:68px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:8px}
.opt.right{background:var(--ok);border-color:var(--ok);color:#fff}
.opt.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
.empat{display:flex;gap:10px;justify-content:center;font-size:3rem;line-height:1}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
/* bonus */
.pilihan3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.pilihan3 button{font-size:2.6rem;line-height:1;background:var(--card);border:2px solid var(--line);border-radius:18px;min-height:72px;cursor:pointer;touch-action:manipulation}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}

/* stasiun tambahan: piktogram berskala */
.sb{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:2px dashed var(--line)}
.sb .lb{font-size:2rem;width:44px;text-align:center;flex:none;line-height:1}
.sb .ik{display:flex;flex-wrap:wrap;gap:4px;flex:1}
.sb .ik button{font-size:2rem;line-height:1;background:transparent;border:2px solid var(--line);border-radius:12px;width:50px;height:50px;cursor:pointer;padding:0;touch-action:manipulation}
.sb .ik button.hit{border-color:var(--ok);background:var(--soft)}
.sb .tt{font-family:var(--display);font-weight:800;font-size:1.4rem;min-width:3.2em;text-align:right;flex:none}
.sk-ctrl{display:flex;align-items:center;justify-content:center;gap:14px}
.sk-ctrl button{width:60px;height:60px;border-radius:50%;border:2px solid var(--ink);background:var(--card);color:var(--ink);font-size:1.8rem;font-family:var(--display);font-weight:800;cursor:pointer}
.sk-ctrl .nn{font-family:var(--display);font-weight:800;font-size:2rem;min-width:3ch;text-align:center}
.sk-pil{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sk-pil button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.4rem;min-height:60px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.sk-pil button.right{background:var(--ok);border-color:var(--ok);color:#fff}
.sk-pil button.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
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
      <h1>Pilah dan Hitung</h1>
      <div class="panel" style="max-width:320px;margin:0 auto;width:100%"><div class="pk" id="introPk"></div></div>
      <p class="say">Ayo pilah, urutkan, dan hitung!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: pilah -->
  <section class="screen" id="s1">
    <p class="say">Masukkan ke keranjang yang tepat.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="kartuItem" id="s1item"></div></div>
    <div class="kerj" id="s1kerj"></div>
    <div class="msg" id="s1msg">Ketuk keranjangnya.</div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: urutkan -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Urutkan.</p>
    <div class="dots" id="s2dots"></div>
    <div class="daftar" id="s2daftar"></div>
    <div class="msg" id="s2msg">Ketuk satu per satu.</div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: baca piktogram -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Baca gambarnya.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="pk" id="s3pk"></div></div>
    <div class="angka" id="s3angka" style="display:none"></div>
    <div class="msg" id="s3msg">Hitung gambarnya.</div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: buat piktogram -->
  <section class="screen" id="s4">
    <p class="say">Ketuk benda. Gambarnya pindah ke bawah.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="awan" id="s4awan"></div></div>
    <div class="panel"><div class="pk" id="s4pk"></div></div>
    <div class="msg" id="s4msg">Ketuk satu benda.</div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 3c: piktogram berskala -->
  <section class="screen" id="sx">
    <p class="say" id="sxsay"></p>
    <div class="dots" id="sxdots"></div>
    <div class="panel"><div id="sxpk"></div></div>
    <div id="sxkontrol"></div>
    <div class="msg" id="sxmsg"></div>
    <div class="cta"><button class="big main" id="sxnext" disabled>Lanjut</button></div>
  </section>

  <!-- 5: tantangan -->
  <section class="screen" id="s5">
    <div class="sub" id="s5n"></div>
    <div id="s5v"></div>
    <p class="q" id="s5q"></p>
    <div class="opts" id="s5o"></div>
    <div class="msg" id="s5fb" style="display:none"></div>
    <div class="cta"><button class="big main" id="s5next" style="display:none">Lanjut</button></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: buah favorit</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: buah apa yang paling kamu suka?</p>
    <div class="pilihan3" id="bPil"></div>
    <div class="panel"><div class="pk" id="bpk"></div></div>
    <div class="msg" id="bmsg">Ketuk buah. Satu ketukan, satu suara.</div>
    <div class="cta">
      <button class="big soft" id="bUlang">Hapus suara</button>
      <button class="big main" id="bonusSelesai">Selesai</button>
    </div>
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
function sekali(b,kelas){b.classList.remove(kelas);void b.offsetWidth;b.classList.add(kelas)}
function angkaPilihan(r){return shuffle([r+1,r-1,r+2,r-2]).filter(function(x){return x>=1&&x!==r}).slice(0,2).map(String).concat([String(r)])}

var BUAH=[{n:'Apel',e:'\u{1F34E}'},{n:'Pisang',e:'\u{1F34C}'},{n:'Anggur',e:'\u{1F347}'},{n:'Jeruk',e:'\u{1F34A}'}];
var HEWAN=[{n:'Anjing',e:'\u{1F436}'},{n:'Kucing',e:'\u{1F431}'},{n:'Ikan',e:'\u{1F41F}'},{n:'Burung',e:'\u{1F426}'},{n:'Kura-kura',e:'\u{1F422}'}];

/* piktogram: satu gambar = satu benda. data = [{e,n,v}]; onRow membuat baris bisa diketuk */
function picto(data,onRow,kosong){
  var w=el('div','pk'),baris=[];
  data.forEach(function(d,i){
    var b=el(onRow?'button':'div','br');
    if(onRow){b.onclick=function(){onRow(i,b)};b.setAttribute('aria-label',d.n)}
    b.appendChild(el('span','lb',d.e));
    var ic=el('span','ic');
    if(!kosong)for(var k=0;k<d.v;k++)ic.appendChild(el('span',null,d.e));
    b.appendChild(ic);b.appendChild(el('span','ct',kosong?'0':String(d.v)));
    w.appendChild(b);baris.push({b:b,ic:ic,ct:b.lastChild});
  });
  return {el:w,baris:baris};
}
function dataAcak(){
  var jenis=shuffle(BUAH).slice(0,3),v=shuffle([1,2,3,4,5,6]).slice(0,3);
  return jenis.map(function(j,i){return {n:j.n,e:j.e,v:v[i]}});
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
var urut=['intro','s1','s2','s3','s4','sx','s5','akhir'];
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
  if(id==='s4')mulaiS4();if(id==='sx')mulaiSx();
  if(id==='s5')mulaiS5();
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')mulaiBonus();
  if(id==='intro')setKata('Ayo pilah, urutkan, dan hitung!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
$('introPk').appendChild(picto([{e:BUAH[0].e,n:'a',v:3},{e:BUAH[1].e,n:'b',v:5},{e:BUAH[2].e,n:'c',v:2}]).el);
setKata('Ayo pilah, urutkan, dan hitung!');

/* ---- stasiun 1: pilah ke dua keranjang ---- */
var SORT=[
  {a:'Hewan',b:'Buah',items:[['\u{1F436}',0],['\u{1F431}',0],['\u{1F41F}',0],['\u{1F34E}',1],['\u{1F34C}',1],['\u{1F347}',1]]},
  {a:'Merah',b:'Kuning',items:[['\u{1F34E}',0],['\u{1F353}',0],['\u{1F345}',0],['\u{1F34C}',1],['\u{1F34B}',1],['\u{1F33B}',1]]},
  {a:'Terbang',b:'Tidak terbang',items:[['\u{1F426}',0],['\u{1F98B}',0],['\u{1F41D}',0],['\u{1F436}',1],['\u{1F422}',1],['\u{1F41F}',1]]}
];
var r1=0,daftar1=[],idx1=0,isi1=[];
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=SORT[r1];daftar1=shuffle(d.items);idx1=0;isi1=[];
  titik('s1dots',SORT.length,r1);
  var k=$('s1kerj');clear(k);
  [d.a,d.b].forEach(function(nama,i){
    var b=el('button','keranjang k'+i);b.setAttribute('aria-label',nama);
    b.appendChild(el('span','nm',nama));
    var isi=el('span','isi');b.appendChild(isi);isi1.push(isi);
    b.onclick=function(){tekan1(i,b)};
    k.appendChild(b);
  });
  $('s1next').disabled=true;
  tampil1();
  msg('s1msg','','Ketuk keranjangnya.');
  setKata('Masukkan ke keranjang yang tepat.');
}
function tampil1(){
  var c=$('s1item');c.classList.remove('pop');
  if(idx1<daftar1.length){c.textContent=daftar1[idx1][0];void c.offsetWidth;c.classList.add('pop')}
  else c.textContent='✅';
}
function tekan1(i,b){
  if(idx1>=daftar1.length)return;
  if(daftar1[idx1][1]===i){
    isi1[i].appendChild(el('span',null,daftar1[idx1][0]));
    idx1++;tampil1();
    if(idx1===daftar1.length){
      var t='Hebat! Semuanya sudah dipilah.';msg('s1msg','good',t);setKata(t);$('s1next').disabled=false;
    }else msg('s1msg','good','Betul!');
  }else{
    sekali(b,'bad');
    var t2='Bukan di situ. Lihat gambarnya lagi.';msg('s1msg','warn',t2);setKata(t2);
  }
}
$('s1next').onclick=function(){if(r1<SORT.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: urutkan ---- */
var URUT=[
  {say:'Urutkan dari yang paling pendek.',naik:true,jenis:'bar'},
  {say:'Urutkan dari yang paling panjang.',naik:false,jenis:'bar'},
  {say:'Urutkan dari yang paling sedikit.',naik:true,jenis:'hitung'}
];
var r2=0,benar2=[],kunci2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=URUT[r2],nilai=shuffle([1,2,3,4,5,6]).slice(0,4);
  benar2=nilai.slice().sort(function(a,b){return d.naik?a-b:b-a});kunci2=0;
  titik('s2dots',URUT.length,r2);
  $('s2say').textContent=d.say;
  var w=$('s2daftar');clear(w);
  nilai.forEach(function(v){
    var b=el('button','urutan');b.setAttribute('aria-label','pilihan');
    if(d.jenis==='bar'){var g=el('span','bg');g.style.width=(v*38)+'px';g.style.background=['#e0a93b','#4a7bd0','#2e9a63','#c75ba0','#d94f3d','#6b6878'][v-1];b.appendChild(g)}
    else{var e=el('span','em');for(var i=0;i<v;i++)e.appendChild(el('span',null,'\u{1F34E}'));b.appendChild(e)}
    b.appendChild(el('span','no'));
    b.onclick=function(){
      if(b.classList.contains('sudah')||kunci2>=benar2.length)return;
      if(v===benar2[kunci2]){
        kunci2++;b.classList.add('sudah');b.querySelector('.no').textContent=String(kunci2);
        if(kunci2===benar2.length){var t='Hebat! Urutannya benar.';msg('s2msg','good',t);setKata(t);$('s2next').disabled=false}
        else msg('s2msg','good','Betul! Berikutnya.');
      }else{
        sekali(b,'bad');
        var t2=d.naik?(d.jenis==='hitung'?'Cari yang lebih sedikit dulu.':'Cari yang lebih pendek dulu.'):'Cari yang lebih panjang dulu.';
        msg('s2msg','warn',t2);setKata(t2);
      }
    };
    w.appendChild(b);
  });
  $('s2next').disabled=true;msg('s2msg','','Ketuk satu per satu.');
  setKata(d.say);
}
$('s2next').onclick=function(){if(r2<URUT.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: baca piktogram ---- */
var JENIS3=['banyak','sedikit','jumlah'],r3=0,data3=[],selesai3=false;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  selesai3=false;data3=dataAcak();titik('s3dots',JENIS3.length,r3);
  var j=JENIS3[r3],host=$('s3pk');clear(host);
  var maks=0,min=0;data3.forEach(function(d,i){if(d.v>data3[maks].v)maks=i;if(d.v<data3[min].v)min=i});
  var angka=$('s3angka');clear(angka);angka.style.display='none';
  var say=j==='banyak'?'Mana yang paling banyak?':j==='sedikit'?'Mana yang paling sedikit?':'';
  var tgt=rnd(0,2);
  if(j==='jumlah')say='Ada berapa '+data3[tgt].n.toLowerCase()+'?';
  $('s3say').textContent=say;
  var p;
  if(j==='jumlah'){
    p=picto(data3,null);
    angkaPilihan(data3[tgt].v).sort(function(){return Math.random()-.5}).forEach(function(x){
      var b=el('button',null,x);
      b.onclick=function(){
        if(selesai3)return;
        if(+x===data3[tgt].v){selesai3=true;b.classList.add('right');var t='Betul! '+x+' '+data3[tgt].n.toLowerCase()+'.';msg('s3msg','good',t);setKata(t);$('s3next').disabled=false}
        else{b.classList.add('bad');var t2='Hampir! Hitung gambarnya satu per satu.';msg('s3msg','warn',t2);setKata(t2)}
      };
      angka.appendChild(b);
    });
    angka.style.display='grid';
  }else{
    var ans=j==='banyak'?maks:min;
    p=picto(data3,function(i,b){
      if(selesai3)return;
      if(i===ans){selesai3=true;b.classList.add('right');var t='Betul! '+data3[i].n+' paling '+j+'.';msg('s3msg','good',t);setKata(t);$('s3next').disabled=false}
      else{sekali(b,'bad');var t2='Hampir! Bandingkan panjang barisnya.';msg('s3msg','warn',t2);setKata(t2)}
    });
  }
  host.appendChild(p.el);
  $('s3next').disabled=true;msg('s3msg','','Hitung gambarnya.');
  setKata(say);
}
$('s3next').onclick=function(){if(r3<JENIS3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: buat piktogram dengan mengetuk benda ---- */
var r4=0,data4=[],tersisa4=0,pk4=null;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  data4=dataAcak();titik('s4dots',2,r4);
  var semua=[];data4.forEach(function(d,i){for(var k=0;k<d.v;k++)semua.push(i)});
  tersisa4=semua.length;
  var aw=$('s4awan');clear(aw);
  shuffle(semua).forEach(function(i){
    var b=el('button',null,data4[i].e);b.setAttribute('aria-label',data4[i].n);
    b.onclick=function(){
      if(b.disabled)return;b.disabled=true;
      var r=pk4.baris[i];r.ic.appendChild(el('span',null,data4[i].e));r.ct.textContent=String(+r.ct.textContent+1);
      tersisa4--;
      if(tersisa4===0){
        var maks=0;data4.forEach(function(d,k){if(d.v>data4[maks].v)maks=k});
        var t='Selesai! Paling banyak: '+data4[maks].n.toLowerCase()+' ('+data4[maks].v+').';
        msg('s4msg','good',t);setKata(t);$('s4next').disabled=false;
      }else msg('s4msg','','Sisa '+tersisa4+' benda.');
    };
    aw.appendChild(b);
  });
  var host=$('s4pk');clear(host);pk4=picto(data4,null,true);host.appendChild(pk4.el);
  $('s4next').disabled=true;msg('s4msg','','Ketuk satu benda.');
  setKata('Ketuk benda. Gambarnya pindah ke bawah.');
}
$('s4next').onclick=function(){if(r4<1){r4++;ronde4()}else show('sx')};

/* ---- stasiun tambahan: piktogram berskala (1 gambar = 2, 5, ...) ---- */
var RX=[
  {tipe:'hitung',say:'Satu gambar = 2 anak. Ketuk tiap gambar untuk menghitung.',baris:[{n:'Kucing',e:'\u{1F431}',g:4,s:2}]},
  {tipe:'hitung',say:'Satu gambar = 5 anak. Ketuk tiap gambar untuk menghitung.',baris:[{n:'Ikan',e:'\u{1F41F}',g:3,s:5}]},
  {tipe:'banding',say:'Skalanya beda! Hitung keduanya. Mana yang lebih banyak anak?',baris:[{n:'A',e:'\u{1F34E}',g:4,s:2},{n:'B',e:'\u{1F34A}',g:4,s:5}]},
  {tipe:'buat',say:'Ada 12 anak suka merah. Satu gambar = 4 anak. Berapa gambar?',total:12,s:4,e:'\u{1F534}'},
  {tipe:'buat',say:'Ada 20 anak suka biru. Satu gambar = 5 anak. Berapa gambar?',total:20,s:5,e:'\u{1F535}'}
];
var rxi=0,hitX=[],doneS=false,nBuat=0;
function msgS(k,t){var m=$('sxmsg');m.className='msg'+(k?' '+k:'');m.textContent=t}
function mulaiSx(){rxi=0;rondeS()}
function rondeS(){
  var d=RX[rxi];doneS=false;hitX=[];nBuat=0;
  titik('sxdots',RX.length,rxi);
  $('sxsay').textContent=d.say;
  $('sxnext').disabled=true;
  var pk=$('sxpk');clear(pk);var kt=$('sxkontrol');clear(kt);
  if(d.tipe==='buat')bangunBuat(d,pk,kt);
  else bangunHitung(d,pk,kt);
  setKata(d.say);
}
function bangunHitung(d,pk,kt){
  d.baris.forEach(function(b,bi){
    hitX[bi]=0;
    var row=el('div','sb');row.appendChild(el('span','lb',b.e));
    var ik=el('div','ik'),tt=el('span','tt','0');
    for(var i=0;i<b.g;i++){
      var t=el('button',null,b.e);t.setAttribute('aria-label','gambar');
      t.onclick=(function(t,bi,b,tt){return function(){
        if(t.classList.contains('hit'))return;
        t.classList.add('hit');hitX[bi]++;tt.textContent=String(hitX[bi]*b.s);
        if(hitX[bi]===b.g){tt.style.color='var(--ok)';cekHitung(d)}
        else msgS('',hitX[bi]+' gambar × '+b.s+' = '+hitX[bi]*b.s+'.');
      }})(t,bi,b,tt);
      ik.appendChild(t);
    }
    row.appendChild(ik);row.appendChild(tt);pk.appendChild(row);
  });
  msgS('','Ketuk gambar satu per satu.');
}
function cekHitung(d){
  var semua=d.baris.every(function(b,i){return hitX[i]===b.g});
  if(!semua){msgS('good',d.baris[0].g+' gambar × '+d.baris[0].s+' = '+d.baris[0].g*d.baris[0].s+'. Hitung baris berikutnya.');return}
  if(d.tipe==='hitung'){
    var b=d.baris[0],t=b.g+' gambar × '+b.s+' = '+b.g*b.s+' anak. Satu gambar tidak selalu satu anak!';
    msgS('good',t);setKata(t);$('sxnext').disabled=false;doneS=true;
  }else{
    var tot=d.baris.map(function(b){return b.g*b.s});
    msgS('','A: '+d.baris[0].g+' × '+d.baris[0].s+' = '+tot[0]+'. B: '+d.baris[1].g+' × '+d.baris[1].s+' = '+tot[1]+'. Mana yang lebih banyak?');
    var kt=$('sxkontrol');clear(kt);var w=el('div','sk-pil');
    ['A','B'].forEach(function(h,i){
      var bt=el('button',null,'Piktogram '+h);
      bt.onclick=function(){
        if(doneS)return;
        var ok=tot[i]===Math.max(tot[0],tot[1]);
        if(ok){doneS=true;bt.classList.add('right');var t='Betul! Piktogram '+h+' mewakili lebih banyak anak, walau jumlah gambarnya sama.';msgS('good',t);setKata(t);$('sxnext').disabled=false}
        else{bt.classList.add('wrong');msgS('warn','Hampir! Bandingkan hasil kali: '+tot[0]+' dan '+tot[1]+'.')}
      };
      w.appendChild(bt);
    });
    kt.appendChild(w);
  }
}
function bangunBuat(d,pk,kt){
  var ctrl=el('div','sk-ctrl'),kurang=el('button',null,'−'),nn=el('span','nn','0'),tambah=el('button',null,'+');
  kurang.setAttribute('aria-label','kurangi gambar');tambah.setAttribute('aria-label','tambah gambar');
  ctrl.appendChild(kurang);ctrl.appendChild(nn);ctrl.appendChild(tambah);kt.appendChild(ctrl);
  var row=el('div','sb');row.appendChild(el('span','lb',d.e));var ik=el('div','ik'),tt=el('span','tt','0');
  row.appendChild(ik);row.appendChild(tt);pk.appendChild(row);
  var gambarB=function(){
    clear(ik);for(var i=0;i<nBuat;i++)ik.appendChild(el('span',null,d.e)).style.fontSize='2rem';
    nn.textContent=String(nBuat);tt.textContent=String(nBuat*d.s);
    if(doneS)return;
    if(nBuat*d.s===d.total){
      doneS=true;tt.style.color='var(--ok)';
      var t=nBuat+' gambar × '+d.s+' = '+d.total+'. Pas! '+d.total+' dibagi '+d.s+' = '+nBuat+'.';
      msgS('good',t);setKata(t);$('sxnext').disabled=false;
    }else msgS('',nBuat+' × '+d.s+' = '+nBuat*d.s+'. Masih kurang dari '+d.total+'.');
  };
  tambah.onclick=function(){if(doneS||nBuat>=10)return;nBuat++;gambarB()};
  kurang.onclick=function(){if(doneS||nBuat<=0)return;nBuat--;gambarB()};
  gambarB();msgS('','Tambah gambar sampai jumlah anaknya pas.');
}
$('sxnext').onclick=function(){if(rxi<RX.length-1){rxi++;rondeS()}else show('s5')};

/* ---- tantangan: 4 soal, balasan langsung ---- */
function bangunSoal(){
  var s=[];
  (function(){var d=dataAcak(),maks=0;d.forEach(function(x,i){if(x.v>d[maks].v)maks=i});
    s.push({vis:function(){return picto(d,null).el},q:'Mana yang paling banyak?',kolom:3,
      opsi:d.map(function(x,i){return {id:String(i),t:x.e}}),a:String(maks),e:d[maks].n+' paling banyak: '+d[maks].v+'.'})})();
  (function(){var d=dataAcak(),t=rnd(0,2);
    s.push({vis:function(){return picto(d,null).el},q:'Ada berapa '+d[t].n.toLowerCase()+'?',kolom:3,
      opsi:angkaPilihan(d[t].v).map(function(x){return {id:x,t:x}}),a:String(d[t].v),e:d[t].n+' ada '+d[t].v+'.'})})();
  (function(){
    var dariBuah=rnd(0,1),tiga=shuffle(dariBuah?BUAH:HEWAN).slice(0,3),asing=(dariBuah?HEWAN:BUAH)[rnd(0,3)];
    var empat=shuffle(tiga.concat([asing]));
    s.push({vis:function(){var w=el('div','empat');empat.forEach(function(x){w.appendChild(el('span',null,x.e))});return w},
      q:'Mana yang tidak sama kelompoknya?',kolom:4,
      opsi:empat.map(function(x){return {id:x.e,t:x.e}}),a:asing.e,e:dariBuah?'Itu hewan. Yang lain buah.':'Itu buah. Yang lain hewan.'});
  })();
  (function(){var d=dataAcak(),tot=d[0].v+d[1].v+d[2].v;
    s.push({vis:function(){return picto(d,null).el},q:'Ada berapa semuanya?',kolom:3,
      opsi:angkaPilihan(tot).map(function(x){return {id:x,t:x}}),a:String(tot),e:d[0].v+' + '+d[1].v+' + '+d[2].v+' = '+tot+'.'})})();
  return s;
}
var soal=[],qi=0,benar=0,terkunci=false;
function mulaiS5(){soal=bangunSoal();qi=0;benar=0;tampilSoal()}
function tampilSoal(){
  terkunci=false;
  var q=soal[qi];
  $('s5n').textContent='Tantangan '+(qi+1)+' dari '+soal.length;
  $('s5q').textContent=q.q;
  var v=$('s5v');clear(v);if(q.vis)v.appendChild(q.vis());
  var o=$('s5o');clear(o);o.style.gridTemplateColumns='repeat('+q.kolom+',1fr)';
  shuffle(q.opsi).forEach(function(x){
    var b=el('button','opt',x.t);b.setAttribute('data-id',x.id);
    b.onclick=function(){
      if(terkunci)return;terkunci=true;
      var ok=x.id===q.a;if(ok)benar++;
      var all=o.children;for(var k=0;k<all.length;k++){if(all[k].getAttribute('data-id')===q.a)all[k].classList.add('right');else if(all[k]===b)all[k].classList.add('wrong')}
      var fb=$('s5fb');fb.style.display='flex';fb.className='msg '+(ok?'good':'warn');
      fb.textContent=(ok?'Benar! ':'Hampir! ')+q.e;
      setKata((ok?'Benar! ':'Hampir! ')+q.e);
      var nx=$('s5next');nx.style.display='';nx.textContent=qi===soal.length-1?'Selesai':'Lanjut';
    };
    o.appendChild(b);
  });
  $('s5fb').style.display='none';$('s5next').style.display='none';
  setKata(q.q);
}
$('s5next').onclick=function(){if(qi<soal.length-1){qi++;tampilSoal()}else show('akhir')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu pandai memilah dan menghitung.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-07'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};

/* ---- bonus: pungutan suara buah favorit ---- */
var suara3=[0,0,0],pkB=null,favorit=BUAH.slice(0,3);
function mulaiBonus(){
  suara3=[0,0,0];
  var p=$('bPil');clear(p);
  favorit.forEach(function(f,i){
    var b=el('button',null,f.e);b.setAttribute('aria-label',f.n);
    b.onclick=function(){
      if(suara3[i]>=10)return;
      suara3[i]++;gambarBonus();
    };
    p.appendChild(b);
  });
  gambarBonus();
  setKata('Buah apa yang paling kamu suka? Ketuk buahnya.');
}
function gambarBonus(){
  var host=$('bpk');clear(host);
  pkB=picto(favorit.map(function(f,i){return {e:f.e,n:f.n,v:suara3[i]}}),null);
  host.appendChild(pkB.el);
  var tot=suara3[0]+suara3[1]+suara3[2];
  if(!tot){msg('bmsg','','Ketuk buah. Satu ketukan, satu suara.');return}
  var maks=0,seri=false;suara3.forEach(function(v,i){if(v>suara3[maks])maks=i});
  suara3.forEach(function(v,i){if(i!==maks&&v===suara3[maks])seri=true});
  var t=seri?'Ada yang sama banyak. Tambah suara lagi!':'Paling banyak: '+favorit[maks].n.toLowerCase()+' ('+suara3[maks]+' suara).';
  msg('bmsg','good',t);setKata(t);
}
$('bUlang').onclick=function(){suara3=[0,0,0];gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC07 = rakit(DASAR, { kode: 'AC-07', tantangan: 's5', data: DATA_AC07 })
