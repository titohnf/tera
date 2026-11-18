import { rakit } from './bersama'
import { DATA_AC09 } from './latihan/ac09'

/**
 * Materi interaktif AC-09 "Susun dan Hitung" (Tambah-kurang bilangan cacah
 * sampai 1.000, bersusun). Satu halaman HTML mandiri, ditampilkan lewat iframe
 * sandbox di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-09.
 * Disimpan sebagai string supaya ikut terbundel di build tanpa membaca berkas
 * saat runtime.
 *
 * Bahasa dan pola layar sama dengan AC-08 (anak kelas 3-4), tetapi tiap stasiun
 * BERANIMASI supaya terasa seperti bermain dengan balok, bukan mengerjakan soal:
 * 1) Tambah dan simpan: balok ratusan/puluhan/satuan digabung, 10 satuan
 *    ditukar menjadi 1 puluhan yang melayang ke kolom sebelahnya.
 * 2) Kurang dan pinjam: 1 puluhan dipecah menjadi 10 satuan; bila puluhannya
 *    kosong, ratusan dipecah dulu (soal 704 − 258).
 * 3) Tebak, hitung, periksa: bulatkan, perkirakan, hitung pasti, lalu periksa
 *    dengan operasi kebalikan.
 * 4) Cerita dan kata kunci: kata kunci disorot, bilangan bergulir naik atau turun.
 * Bonus: bilangan sendiri, simpanan dan pinjaman ditandai otomatis.
 *
 * Soal Misi topik ini menguji: menyimpan dan meminjam (termasuk melewati angka
 * nol), "angka atas lebih kecil jadi 0" sebagai salah paham, perkiraan yang
 * bukan jawaban pasti, pemeriksaan dengan kebalikan, kata kunci cerita, cerita
 * dua langkah, dan merancang soal (bilangan yang hilang).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac09.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-09 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Susun dan Hitung</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#fbf6ea; --card:#ffffff; --ink:#2b2a33; --muted:#6b6878;
  --ikat:#d94f3d; --lidi:#e0a93b; --lidi-dark:#b97f12; --ok:#2e9a63; --bad:#d23b4e; --line:#eadfc4; --soft:#fff3d0;
  --rb:#4a7bd0; --pl:#2e9a63; --st:#c78a12;
  --display:'Baloo 2','Trebuchet MS',system-ui,sans-serif; --body:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;
}
@media (prefers-color-scheme: dark){
  :root{--bg:#1f1c17;--card:#2a2620;--ink:#f6efe0;--muted:#b9b09b;--line:#4a4231;--soft:#3a3220;--ok:#5cc990;--bad:#ff7a8a;--lidi:#e7b34a;--ikat:#ef6b59;--rb:#7ea4ea;--pl:#5cc990;--st:#e7b34a}
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
@keyframes goyang{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
@keyframes pop{0%{transform:scale(.3)}70%{transform:scale(1.25)}100%{transform:scale(1)}}
@keyframes pergi{0%{transform:none;opacity:1}100%{transform:translate(-70px,-34px) scale(.2);opacity:0}}
@keyframes pecah{50%{transform:scale(1.5) rotate(8deg)}100%{transform:scale(0);opacity:0}}
@keyframes ambil{to{transform:translateY(-30px) scale(.2);opacity:0}}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.center{text-align:center}
.besar{font-family:var(--display);font-weight:800;font-size:2.4rem;line-height:1.1;text-align:center;font-variant-numeric:tabular-nums}
.besar .o{color:var(--ikat)}
/* balok nilai tempat */
.tray3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.hb-tray{display:flex;flex-direction:column;gap:6px;border:2px solid var(--line);border-radius:14px;padding:6px 4px;background:var(--card);min-height:176px}
.hb-tray.sekarang{border-color:var(--ikat);box-shadow:0 0 0 3px rgba(217,79,61,.22)}
.hb-tray h4{margin:0;font-family:var(--display);font-size:.85rem;color:#fff;border-radius:99px;padding:0 8px;text-align:center}
.hb-isi{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-content:flex-start;flex:1}
.hb-n{font-family:var(--display);font-weight:800;text-align:center;font-size:1.3rem;min-height:1.5em;font-variant-numeric:tabular-nums}
.hb-b{display:block;border:2px solid var(--ink);border-radius:4px}
.hb-b.r{width:28px;height:28px;background:var(--rb)}
.hb-b.p{width:10px;height:32px;background:var(--pl);border-radius:3px}
.hb-b.s{width:12px;height:12px;background:var(--lidi);border-radius:3px}
.hb-b.b2{opacity:.5}
.hb-b.k{animation:pop .5s;box-shadow:0 0 0 3px var(--ikat)}
.hb-b.pergi{animation:pergi .65s forwards}
.hb-b.pecah{animation:pecah .7s forwards}
.hb-b.ambil{animation:ambil .7s forwards}
.hasil-baris{font-family:var(--display);font-weight:800;font-size:1.7rem;text-align:center;font-variant-numeric:tabular-nums}
.hasil-baris .tt{display:inline-block;min-width:1.1em;border-bottom:4px solid var(--ink);margin:0 2px}
.hasil-baris .tt.isi{border-color:var(--ok);color:var(--ok);animation:pop .4s}
.aksi{display:grid;gap:10px}
.aksi.pil3{grid-template-columns:repeat(3,1fr)}
.aksi button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.3rem;min-height:58px;border-radius:16px;border:2px solid var(--ink);background:var(--card);color:var(--ink);cursor:pointer;box-shadow:0 3px 0 var(--ink);touch-action:manipulation;padding:8px}
.aksi button.utama{background:var(--ikat);color:#fff}
.aksi button.right{background:var(--ok);border-color:var(--ok);color:#fff;box-shadow:none}
.aksi button.wrong{background:var(--soft);border-color:var(--ikat);box-shadow:none}
.aksi button.hint{animation:denyut 1s infinite}
.tanya{font-family:var(--display);font-weight:800;font-size:1.25rem;text-align:center}
/* stasiun 3 */
.vis3{display:flex;flex-direction:column;gap:8px;align-items:center}
.cek{font-family:var(--display);font-weight:800;font-size:1.3rem;text-align:center;background:var(--soft);border:2px dashed var(--ok);border-radius:14px;padding:8px 12px}
.cek .ok{color:var(--ok);display:inline-block;animation:pop .5s}
/* stasiun 4 */
.cerita{display:flex;flex-direction:column;gap:10px}
.cerita .kal{background:var(--card);border:2px solid var(--line);border-radius:16px;padding:10px 14px;font-weight:800;font-size:1.1rem}
.cerita mark{background:var(--soft);border-bottom:3px solid var(--ikat);border-radius:4px;padding:0 3px;color:inherit}
.tumpuk{height:26px;border-radius:99px;border:3px solid var(--ink);background:var(--line);overflow:hidden}
.tumpuk i{display:block;height:100%;background:var(--ok);width:0;transition:width .9s ease-out}
.total{font-family:var(--display);font-weight:800;font-size:3rem;text-align:center;line-height:1;font-variant-numeric:tabular-nums}
.total small{font-size:1.1rem;color:var(--muted);display:block;font-weight:600}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
/* bonus */
input[type=range]{width:100%;accent-color:var(--ikat);height:40px}
.chips{display:flex;gap:10px;justify-content:center}
.chip{font:inherit;font-weight:800;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:99px;padding:8px 18px;cursor:pointer;min-height:44px;font-size:1.3rem}
.chip.on{border-color:var(--ikat);background:var(--soft)}
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
      <h1>Susun dan Hitung</h1>
      <div class="panel" style="max-width:300px;margin:0 auto;width:100%"><div id="introKol" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo bermain dengan balok: menyimpan dan meminjam!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: tambah dan simpan -->
  <section class="screen" id="s1">
    <p class="say">Gabungkan balok. Tukar 10 jadi 1 di kolom sebelahnya.</p>
    <div class="dots" id="s1dots"></div>
    <div class="besar" id="s1soal"></div>
    <div class="tray3" id="s1tray"></div>
    <div class="hasil-baris" id="s1hasil"></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: kurang dan pinjam -->
  <section class="screen" id="s2">
    <p class="say">Kurangi balok. Kalau kurang, pinjam dari kolom sebelahnya.</p>
    <div class="dots" id="s2dots"></div>
    <div class="besar" id="s2soal"></div>
    <div class="tray3" id="s2tray"></div>
    <div class="hasil-baris" id="s2hasil"></div>
    <div class="aksi" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: tebak, hitung, periksa -->
  <section class="screen" id="s3">
    <p class="say">Tebak dulu, hitung, lalu periksa.</p>
    <div class="dots" id="s3dots"></div>
    <div class="besar" id="s3soal"></div>
    <div class="vis3" id="s3vis"></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: cerita dan kata kunci -->
  <section class="screen" id="s4">
    <p class="say">Cari kata kuncinya. Tambah atau kurang?</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel" style="display:flex;flex-direction:column;gap:10px">
      <div class="total" id="s4total"></div>
      <div class="tumpuk"><i id="s4isi"></i></div>
    </div>
    <div class="cerita" id="s4cerita"></div>
    <div class="aksi" id="s4aksi" style="grid-template-columns:1fr 1fr"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: bilanganmu sendiri</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih dua bilangan. Lihat simpanan dan pinjamannya.</p>
    <div class="chips"><button class="chip on" id="bPlus">+</button><button class="chip" id="bMin">&#8722;</button></div>
    <div class="panel"><div id="bKol" style="display:flex;justify-content:center"></div></div>
    <label class="sub" for="bA">Bilangan pertama</label>
    <input type="range" id="bA" min="100" max="899" value="356">
    <label class="sub" for="bB">Bilangan kedua</label>
    <input type="range" id="bB" min="10" max="899" value="278">
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
function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
function digs(n){return [Math.floor(n/100)%10,Math.floor(n/10)%10,n%10]}
var NAMA=['Ratusan','Puluhan','Satuan'],KLS=['r','p','s'],WARNA=['#4a7bd0','#2e9a63','#c78a12'];

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
var urut=['intro','s1','s2','s3','s4','akhir'];
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
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')mulaiBonus();
  if(id==='intro')setKata('Ayo bermain dengan balok: menyimpan dan meminjam!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo bermain dengan balok: menyimpan dan meminjam!');
function tombol(wadah,teks,fn,kls){var b=el('button',kls||null,teks);b.onclick=fn;wadah.appendChild(b);return b}
function blokDi(wadah,kls,jum,ekstra){for(var k=0;k<jum;k++)wadah.appendChild(el('span','hb-b '+kls+(ekstra?' '+ekstra:'')))}
function barisHasil(id,teks,h){
  var w=$(id);clear(w);w.appendChild(document.createTextNode(teks+' = '));
  for(var i=0;i<3;i++){var t=el('span','tt'+(h[i]!==''?' isi':''),h[i]!==''?h[i]:' ');w.appendChild(t)}
}

/* ---- stasiun 1: tambah dan simpan dengan balok ---- */
var TS1=[[356,278],[47,38],[275,346]],r1=0,ca=[],cb=[],ck=[],c1=2,fase1=0,jum1=0,sblm1=0,sisa1=[],h1=[],keluar1=false;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var a=TS1[r1][0],b=TS1[r1][1];
  ca=digs(a);cb=digs(b);ck=[0,0,0];c1=2;fase1=0;jum1=0;sisa1=[0,0,0];h1=['','',''];keluar1=false;
  titik('s1dots',TS1.length,r1);
  var so=$('s1soal');so.textContent=a+' ';var op=el('span','o','+');so.appendChild(op);so.appendChild(document.createTextNode(' '+b));
  barisHasil('s1hasil',a+' + '+b,h1);
  gambar1();aksi1();
  msg('s1msg','','Mulai dari kolom satuan, paling kanan.');
  $('s1next').disabled=true;
  setKata('Gabungkan balok. Tukar sepuluh jadi satu di kolom sebelahnya.');
}
function gambar1(){
  var w=$('s1tray');clear(w);
  for(var i=0;i<3;i++){
    var t=el('div','hb-tray'+(i===c1?' sekarang':'')),h=el('h4',null,NAMA[i]);h.style.background=WARNA[i];t.appendChild(h);
    var isi=el('div','hb-isi'),n='';
    if(i>c1){blokDi(isi,KLS[i],sisa1[i]);n=String(sisa1[i])}
    else if(i===c1&&fase1>=1){
      blokDi(isi,KLS[i],jum1,null);n=String(jum1);
      if(keluar1){var bl=isi.children;for(var k=0;k<Math.min(10,bl.length);k++)bl[k].classList.add('pergi')}
    }else{blokDi(isi,KLS[i],ca[i]);blokDi(isi,KLS[i],cb[i],'b2');blokDi(isi,KLS[i],ck[i],'k')}
    t.appendChild(isi);t.appendChild(el('div','hb-n',n));w.appendChild(t);
  }
}
function aksi1(){
  var w=$('s1aksi');clear(w);w.className='aksi';
  var nm=NAMA[c1].toLowerCase(),kiri=c1>0?NAMA[c1-1].toLowerCase():'';
  if(fase1===0){
    tombol(w,'Gabungkan '+nm,function(){
      jum1=ca[c1]+cb[c1]+ck[c1];sblm1=jum1;fase1=jum1>=10&&c1>0?1:2;gambar1();
      var t=ca[c1]+' + '+cb[c1]+(ck[c1]?' + '+ck[c1]+' simpanan':'')+' = '+jum1+' '+nm+'.';
      if(fase1===1)t+=' Ada 10 '+nm+'. Tukar jadi 1 '+kiri+'!';else t+=' Sekarang tulis hasilnya.';
      msg('s1msg','',t);setKata(t);aksi1();
    },'utama');
  }else if(fase1===1){
    tombol(w,'Tukar 10 '+nm+' jadi 1 '+kiri,function(){
      keluar1=true;gambar1();w.innerHTML='';
      later(function(){
        keluar1=false;ck[c1-1]=1;jum1-=10;fase1=2;gambar1();
        var t='Tinggal '+jum1+' '+nm+'. Kolom '+kiri+' mendapat simpanan 1.';msg('s1msg','good',t);setKata(t);aksi1();
      },700);
    },'utama hint');
  }else{
    w.className='aksi pil3';
    var benar=jum1,opsi=[benar];
    [sblm1,benar+1,benar>0?benar-1:2,ck[c1-1]||1].forEach(function(x){if(opsi.length<3&&opsi.indexOf(x)<0&&x>=0)opsi.push(x)});
    $('s1msg').textContent='Tulis berapa di tempat '+nm+'?';
    shuffle(opsi).forEach(function(x){
      var b=tombol(w,String(x),function(){
        if(x===benar){
          b.classList.add('right');h1[c1]=String(benar);sisa1[c1]=benar;barisHasil('s1hasil',TS1[r1][0]+' + '+TS1[r1][1],h1);
          var t='Betul! Tulis '+benar+' di tempat '+nm+(c1>0&&ck[c1-1]?' dan simpan 1.':'.');
          if(c1===0){selesai1();return}
          msg('s1msg','good',t);setKata(t);c1--;fase1=0;
          later(function(){gambar1();aksi1()},700);
        }else{b.classList.add('wrong');var t2='Hampir! Yang ditulis hanya sisa setelah menukar.';msg('s1msg','warn',t2);setKata(t2)}
      });
    });
  }
}
function selesai1(){
  var a=TS1[r1][0],b=TS1[r1][1],t='Selesai! '+a+' + '+b+' = '+(a+b)+'. Simpanan jangan dibuang!';
  msg('s1msg','good',t);setKata(t);clear($('s1aksi'));$('s1next').disabled=false;
}
$('s1next').onclick=function(){if(r1<TS1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: kurang dan pinjam dengan balok ---- */
var TS2=[[630,84],[704,258],[483,159]],r2=0,ta=[],tb=[],c2=2,fase2=0,h2=[],ambil2=false,pecah2=-1,umum2=-1;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var a=TS2[r2][0],b=TS2[r2][1];
  ta=digs(a);tb=digs(b);c2=2;fase2=0;h2=['','',''];ambil2=false;pecah2=-1;umum2=-1;
  titik('s2dots',TS2.length,r2);
  var so=$('s2soal');so.textContent=a+' ';so.appendChild(el('span','o','−'));so.appendChild(document.createTextNode(' '+b));
  barisHasil('s2hasil',a+' − '+b,h2);
  gambar2();aksi2();
  msg('s2msg','','Mulai dari kolom satuan. Bisakah dikurangi?');
  $('s2next').disabled=true;
  setKata('Kurangi balok. Kalau kurang, pinjam dari kolom sebelahnya.');
}
function gambar2(){
  var w=$('s2tray');clear(w);
  for(var i=0;i<3;i++){
    var t=el('div','hb-tray'+(i===c2&&fase2<3?' sekarang':'')),h=el('h4',null,NAMA[i]);h.style.background=WARNA[i];t.appendChild(h);
    var isi=el('div','hb-isi');
    if(i>c2&&h2[i]!==''){blokDi(isi,KLS[i],+h2[i])}
    else{
      blokDi(isi,KLS[i],ta[i]);
      var bl=isi.children;
      if(i===pecah2&&bl.length)bl[bl.length-1].classList.add('pecah');
      if(i===c2&&ambil2){for(var k=0;k<Math.min(tb[i],bl.length);k++)bl[k].classList.add('ambil')}
    }
    t.appendChild(isi);
    t.appendChild(el('div','hb-n',i>c2&&h2[i]!==''?h2[i]:(ta[i]+(tb[i]?' − '+tb[i]:''))));
    w.appendChild(t);
  }
}
function aksi2(){
  var w=$('s2aksi');clear(w);w.className='aksi';
  var nm=NAMA[c2].toLowerCase();
  if(fase2===0){
    if(ta[c2]>=tb[c2]){
      tombol(w,'Kurangi '+tb[c2]+' '+nm,function(){
        ambil2=true;gambar2();clear(w);
        later(function(){ambil2=false;ta[c2]-=tb[c2];fase2=2;gambar2();aksi2()},750);
      },'utama');
    }else{
      var j=c2-1;while(j>=0&&ta[j]===0)j--;
      var t=ta[c2]+' '+nm+' tidak cukup untuk dikurangi '+tb[c2]+'. Pinjam!'+(ta[c2-1]===0?' Puluhan kosong, jadi pinjam dari ratusan dulu.':'');
      if(umum2!==c2){umum2=c2;msg('s2msg','warn',t);setKata(t)}
      tombol(w,'Pinjam dari '+NAMA[j].toLowerCase(),function(){pinjam2(j)},'utama hint');
    }
  }else if(fase2===2){
    w.className='aksi pil3';
    var benar=ta[c2],awal=benar+tb[c2],opsi=[benar];
    [awal,benar+1,benar>0?benar-1:3,tb[c2]].forEach(function(x){if(opsi.length<3&&opsi.indexOf(x)<0&&x>=0)opsi.push(x)});
    msg('s2msg','','Tulis berapa di tempat '+nm+'?');
    shuffle(opsi).forEach(function(x){
      var b=tombol(w,String(x),function(){
        if(x===benar){
          b.classList.add('right');h2[c2]=String(benar);barisHasil('s2hasil',TS2[r2][0]+' − '+TS2[r2][1],h2);
          if(c2===0){selesai2();return}
          var t='Betul! Tulis '+benar+'. Lanjut ke kolom '+NAMA[c2-1].toLowerCase()+'.';msg('s2msg','good',t);setKata(t);
          c2--;fase2=0;later(function(){gambar2();aksi2()},650);
        }else{b.classList.add('wrong');var t2='Hampir! Hitung lagi: sisa balok di kolom ini.';msg('s2msg','warn',t2);setKata(t2)}
      });
    });
  }
}
function pinjam2(j){
  var w=$('s2aksi');clear(w);
  var langkah=[];for(var k=j;k<c2;k++)langkah.push(k);
  langkah.forEach(function(k,i){
    later(function(){
      pecah2=k;gambar2();
      later(function(){
        ta[k]--;ta[k+1]+=10;pecah2=-1;gambar2();
        var t='1 '+NAMA[k].toLowerCase()+' dipecah jadi 10 '+NAMA[k+1].toLowerCase()+'. '+NAMA[k+1]+' sekarang '+ta[k+1]+'.';
        msg('s2msg','good',t);setKata(t);
        if(i===langkah.length-1){later(function(){aksi2()},500)}
      },650);
    },i*1300);
  });
}
function selesai2(){
  var a=TS2[r2][0],b=TS2[r2][1],t='Selesai! '+a+' − '+b+' = '+(a-b)+'. Diperiksa: '+(a-b)+' + '+b+' = '+a+'.';
  msg('s2msg','good',t);setKata(t);clear($('s2aksi'));$('s2next').disabled=false;
}
$('s2next').onclick=function(){if(r2<TS2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: tebak, hitung pasti, periksa ---- */
var TS3=[
  {a:396,b:287,op:'+',ea:400,eb:300,est:700,ex:683},
  {a:398,b:503,op:'+',ea:400,eb:500,est:900,ex:901},
  {a:628,b:359,op:'-',ea:600,eb:400,est:200,ex:269}
];
var r3=0,lang3=0;
function mulaiS3(){r3=0;ronde3()}
function opTeks(o){return o==='+'?'+':'−'}
function ronde3(){
  var d=TS3[r3];lang3=0;titik('s3dots',TS3.length,r3);
  $('s3soal').textContent=d.a+' '+opTeks(d.op)+' '+d.b;
  clear($('s3vis'));$('s3next').disabled=true;
  langkah3();
}
function opsi3(wadah,benar,daftar,salahPesan,fnBenar){
  clear(wadah);wadah.className='aksi pil3';
  shuffle(daftar).forEach(function(x){
    var b=tombol(wadah,fmt(x),function(){
      if(b.disabled)return;
      if(x===benar){b.classList.add('right');fnBenar()}
      else{b.classList.add('wrong');b.disabled=true;var m=salahPesan(x);msg('s3msg','warn',m);setKata(m)}
    });
  });
}
function langkah3(){
  var d=TS3[r3],w=$('s3aksi'),T=$('s3tanya');
  if(lang3===0||lang3===1){
    var angka=lang3===0?d.a:d.b,bulat=lang3===0?d.ea:d.eb;
    T.textContent='Bulatkan '+angka+' ke ratusan terdekat.';
    msg('s3msg','','Lihat garis bilangan: ke ratusan mana '+angka+' lebih dekat?');
    opsi3(w,bulat,[bulat,bulat+100,bulat-100],function(){return 'Hampir! Lihat mana yang lebih dekat dengan '+angka+'.'},function(){
      var v=$('s3vis'),dasar=Math.floor(angka/100)*100;
      var g=GBR.garis(dasar,dasar+100,10,{lab:50,titik:[{v:angka,l:String(angka)}],busur:[{dari:angka,ke:bulat,l:'≈ '+bulat}]});
      var c=el('div');c.appendChild(g);v.appendChild(c);
      var t=angka+' dibulatkan menjadi '+bulat+'.';msg('s3msg','good',t);setKata(t);
      lang3++;later(langkah3,1100);
    });
  }else if(lang3===2){
    T.textContent='Hitung pastinya.';
    var kira=d.ea+' '+opTeks(d.op)+' '+d.eb+' = '+d.est;
    msg('s3msg','good','Perkiraan: '+kira+'. Itu hanya untuk mengecek, belum jawaban pasti.');setKata('Perkiraan '+kira+'. Itu belum jawaban pasti.');
    var daftar=[d.ex];[d.est,d.ex+10,d.ex-10].forEach(function(x){if(daftar.length<3&&daftar.indexOf(x)<0)daftar.push(x)});
    opsi3(w,d.ex,daftar,function(x){return x===d.est?'Perkiraan hanya untuk mengecek. Hitung dulu hasil pastinya.':'Hampir! Periksa lagi simpanan atau pinjamannya.'},function(){
      lang3++;langkah3();
    });
  }else{
    T.textContent='Periksa dengan operasi kebalikan.';clear(w);w.className='aksi';
    var kebalik=d.op==='+'?d.ex+' − '+d.b+' = '+d.a:d.ex+' + '+d.b+' = '+d.a;
    var c=el('div','cek');c.appendChild(document.createTextNode(kebalik+' '));c.appendChild(el('span','ok','✔'));
    $('s3vis').appendChild(c);
    var t=d.a+' '+opTeks(d.op)+' '+d.b+' = '+d.ex+'. Diperiksa dengan kebalikan: '+kebalik+'. Cocok!';
    msg('s3msg','good',t);setKata(t);$('s3next').disabled=false;
  }
}
$('s3next').onclick=function(){if(r3<TS3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: cerita dan kata kunci ---- */
var TS4=[
  {awal:450,sat:'kotak',maks:700,l:[
    {k:'Gudang punya ',n:'450',s:' kotak barang.',op:null},
    {k:'',n:'',s:'Sebanyak 170 kotak ',kata:'dikirim',t:' ke toko.',op:'-',nilai:170,petunjuk:'dikirim: kotaknya pergi, jadi berkurang'},
    {k:'',n:'',s:'Lalu gudang ',kata:'menerima',t:' 220 kotak baru.',op:'+',nilai:220,petunjuk:'menerima: kotaknya datang, jadi bertambah'}]},
  {awal:380,sat:'buku',maks:500,l:[
    {k:'Toko punya ',n:'380',s:' buku.',op:null},
    {k:'',n:'',s:'Sebanyak 145 buku ',kata:'terjual',t:'. Berapa buku sisanya?',op:'-',nilai:145,petunjuk:'terjual: bukunya pergi, jadi berkurang'}]},
  {awal:268,sat:'kartu',maks:450,l:[
    {k:'Andi punya ',n:'268',s:' kartu.',op:null},
    {k:'',n:'',s:'Kakaknya ',kata:'memberi',t:' 135 kartu lagi. Berapa jumlah kartu Andi?',op:'+',nilai:135,petunjuk:'diberi: kartunya datang, jadi bertambah'}]},
  {awal:520,sat:'buku',maks:700,l:[
    {k:'Perpustakaan punya ',n:'520',s:' buku.',op:null},
    {k:'',n:'',s:'Sebanyak 185 buku ',kata:'dipinjam',t:'.',op:'-',nilai:185,petunjuk:'dipinjam: bukunya pergi, jadi berkurang'},
    {k:'',n:'',s:'Lalu datang ',kata:'kiriman',t:' 60 buku baru.',op:'+',nilai:60,petunjuk:'kiriman baru: bukunya datang, jadi bertambah'}]}
];
var r4=0,l4=0,tot4=0,kunci4=false;
function mulaiS4(){r4=0;ronde4()}
function kalimat4(l){
  var d=el('div','kal');
  if(l.op===null){d.appendChild(document.createTextNode(l.k));var b=el('b',null,l.n);d.appendChild(b);d.appendChild(document.createTextNode(l.s))}
  else{d.appendChild(document.createTextNode(l.s));var m=el('mark',null,l.kata);d.appendChild(m);d.appendChild(document.createTextNode(l.t))}
  return d;
}
function gulir(el0,dari,ke){
  var langkah=14;
  for(var i=1;i<=langkah;i++){(function(i){later(function(){el0.firstChild.textContent=fmt(Math.round(dari+(ke-dari)*i/langkah))},i*55)})(i)}
  $('s4isi').style.width=Math.max(2,ke/TS4[r4].maks*100)+'%';
}
function ronde4(){
  var d=TS4[r4];l4=1;tot4=d.awal;kunci4=false;
  titik('s4dots',TS4.length,r4);
  var tt=$('s4total');clear(tt);tt.appendChild(document.createTextNode(fmt(tot4)));tt.appendChild(el('small',null,d.sat));
  $('s4isi').style.transition='none';$('s4isi').style.width=(tot4/d.maks*100)+'%';
  later(function(){$('s4isi').style.transition=''},60);
  var c=$('s4cerita');clear(c);c.appendChild(kalimat4(d.l[0]));
  $('s4next').disabled=true;
  tanya4();
}
function tanya4(){
  var d=TS4[r4],w=$('s4aksi'),c=$('s4cerita');
  clear(w);
  if(l4>=d.l.length){
    var t='Selesai! Sekarang ada '+fmt(tot4)+' '+d.sat+'.';
    msg('s4msg','good',t);setKata(t);$('s4next').disabled=false;return;
  }
  var l=d.l[l4];c.appendChild(kalimat4(l));kunci4=false;
  msg('s4msg','','Kata yang disorot: tambah atau kurang?');setKata(l.s+l.kata+l.t+' Tambah atau kurang?');
  [['+ Tambah','+'],['− Kurang','-']].forEach(function(x){
    var b=tombol(w,x[0],function(){
      if(kunci4)return;
      if(x[1]===l.op){
        kunci4=true;b.classList.add('right');
        var dari=tot4;tot4=l.op==='+'?tot4+l.nilai:tot4-l.nilai;
        gulir($('s4total'),dari,tot4);
        var t=(l.op==='+'?'Ditambah ':'Dikurangi ')+l.nilai+': '+fmt(dari)+(l.op==='+'?' + ':' − ')+l.nilai+' = '+fmt(tot4)+'.';
        msg('s4msg','good',t);setKata(t);l4++;
        later(tanya4,1500);
      }else{b.classList.add('wrong');var t2='Hampir! Lihat kata '+l.kata+' ('+l.petunjuk+').';msg('s4msg','warn',t2);setKata(t2)}
    });
  });
}
$('s4next').onclick=function(){if(r4<TS4.length-1){r4++;ronde4()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu pandai menyimpan dan meminjam.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-09'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){$('introKol').appendChild(GBR.kolom({a:356,b:278,op:'+',hasil:634,tanda:[{kol:2,teks:'1'},{kol:1,teks:'1'}]}))})();

/* ---- bonus: bilangan sendiri, simpanan dan pinjaman ditandai otomatis ---- */
var bOp='+';
function tandaBonus(a,b){
  var da=digs(a),db=digs(b),tanda=[],cat=[];
  if(bOp==='+'){
    var s=da[2]+db[2],k1=s>=10?1:0,p=da[1]+db[1]+k1,k2=p>=10?1:0;
    if(k1)tanda.push({kol:2,teks:'1'});
    if(k2)tanda.push({kol:1,teks:'1'});
    cat.push(k1?'Satuan '+s+': simpan 1 ke puluhan.':'Satuan '+s+': tidak perlu menyimpan.');
    cat.push(k2?'Puluhan '+p+': simpan 1 ke ratusan.':'Puluhan '+p+': tidak perlu menyimpan.');
  }else{
    var t=da.slice(),m={};
    for(var c=2;c>0;c--){
      if(t[c]<db[c]){var j=c-1;while(j>=0&&t[j]===0)j--;if(j<0)break;for(var k=j;k<c;k++){t[k]--;t[k+1]+=10;m[k+1]=(m[k+1]||'')+'+10';m[k]=(m[k]||'')+'−1'}}
      t[c]-=db[c];
    }
    for(var i=1;i<3;i++)if(m[i])tanda.push({kol:i+1,teks:m[i].replace(/(−1)(\+10)/,'$1 $2')});
    cat.push(tanda.length?'Ada pinjaman: kolom yang kurang meminjam dari kolom sebelahnya.':'Tidak ada yang perlu dipinjam.');
  }
  return {tanda:tanda,cat:cat.join(' ')};
}
function renderBonus(){
  var a=+$('bA').value,b=+$('bB').value;
  if(bOp==='-'&&b>a){b=a;$('bB').value=String(b)}
  var r=tandaBonus(a,b),hasil=bOp==='+'?a+b:a-b;
  var w=$('bKol');clear(w);w.appendChild(GBR.kolom({a:a,b:b,op:bOp,hasil:hasil,tanda:r.tanda}));
  msg('bmsg','',r.cat);setKata(a+(bOp==='+'?' tambah ':' kurang ')+b+' sama dengan '+hasil+'.');
}
function mulaiBonus(){renderBonus()}
$('bPlus').onclick=function(){bOp='+';$('bPlus').classList.add('on');$('bMin').classList.remove('on');renderBonus()};
$('bMin').onclick=function(){bOp='-';$('bMin').classList.add('on');$('bPlus').classList.remove('on');renderBonus()};
$('bA').oninput=renderBonus;$('bB').oninput=renderBonus;
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC09 = rakit(DASAR, { kode: 'AC-09', data: DATA_AC09 })
