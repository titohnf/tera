import { rakit } from './bersama'
import { DATA_AC08 } from './latihan/ac08'

/**
 * Materi interaktif AC-08 "Bilangan Ribuan" (Bilangan cacah sampai 10.000).
 * Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-08. Disimpan
 * sebagai string supaya ikut terbundel di build tanpa membaca berkas saat
 * runtime.
 *
 * Anak kelas 3 sudah membaca, jadi bahasanya sedikit lebih lengkap daripada
 * AC-01 sampai AC-07, tetapi pola layarnya sama: SATU stasiun per layar,
 * sentuh langsung, suara bacaan sebagai tambahan (speechSynthesis, hanya tampil
 * bila ada suara bahasa Indonesia), dan akhir berupa bintang.
 *
 * Lima stasiun praktik, masing-masing menjawab satu kelompok soal bank:
 * 1) Susun bilangan: empat kolom nilai tempat, dibaca dan diuraikan seketika;
 *    angka 0 sebagai penjaga tempat. 2) Baca dan tulis: kata ke angka dan
 *    sebaliknya, dengan jebakan 820/270/45. 3) Bandingkan: kolom demi kolom dari
 *    kiri sampai ketemu yang berbeda. 4) Urutkan empat bilangan. 5) Kartu angka:
 *    susun bilangan terbesar atau terkecil (angka pertama bukan 0).
 *
 * Setelah itu tiga stasiun mesin latihan (lihat `bersama.ts`), bahannya di
 * `latihan/ac08.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-08 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bilangan Ribuan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#fbf6ea; --card:#ffffff; --ink:#2b2a33; --muted:#6b6878;
  --ikat:#d94f3d; --lidi:#e0a93b; --lidi-dark:#b97f12; --ok:#2e9a63; --bad:#d23b4e; --line:#eadfc4; --soft:#fff3d0;
  --rb:#4a7bd0; --rt:#d94f3d; --pl:#2e9a63; --st:#c78a12;
  --display:'Baloo 2','Trebuchet MS',system-ui,sans-serif; --body:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;
}
@media (prefers-color-scheme: dark){
  :root{--bg:#1f1c17;--card:#2a2620;--ink:#f6efe0;--muted:#b9b09b;--line:#4a4231;--soft:#3a3220;--ok:#5cc990;--bad:#ff7a8a;--lidi:#e7b34a;--ikat:#ef6b59;--rb:#7ea4ea;--rt:#ef6b59;--pl:#5cc990;--st:#e7b34a}
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
button.big{font:inherit;font-family:var(--display);font-weight:800;font-size:1.35rem;min-height:60px;border-radius:18px;border:2px solid var(--ink);background:var(--card);color:var(--ink);box-shadow:0 4px 0 var(--ink);cursor:pointer;padding:10px 18px}
button.big:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink)}
button.big.main{background:var(--ikat);color:#fff}
button.big.soft{box-shadow:none;border-color:var(--line);font-size:1.1rem;min-height:52px}
button.big:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
@keyframes denyut{50%{box-shadow:0 0 0 5px rgba(217,79,61,.45)}}
@keyframes goyang{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
@keyframes pop{0%{transform:scale(.6)}70%{transform:scale(1.12)}100%{transform:scale(1)}}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.center{text-align:center}
/* kolom nilai tempat */
.kol4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.kol{display:flex;flex-direction:column;align-items:center;gap:6px;border-radius:16px;padding:8px 4px;border:2px solid var(--line);background:var(--card)}
.kol .nm{font-family:var(--display);font-weight:800;font-size:.95rem;color:#fff;border-radius:99px;padding:1px 8px}
.kol .nl{font-size:.85rem;color:var(--muted)}
.kol .dg{font-family:var(--display);font-weight:800;font-size:3rem;line-height:1;font-variant-numeric:tabular-nums;min-width:1ch}
.kol button{width:100%;min-height:46px;border-radius:12px;border:2px solid var(--line);background:var(--card);color:var(--ink);font-size:1.3rem;cursor:pointer;touch-action:manipulation}
.kol button:active{background:var(--soft)}
.c0 .nm{background:var(--rb)}.c1 .nm{background:var(--rt)}.c2 .nm{background:var(--pl)}.c3 .nm{background:var(--st)}
.kol.ok{border-color:var(--ok);background:var(--soft)}
.besar{font-family:var(--display);font-weight:800;font-size:2.6rem;line-height:1.1;font-variant-numeric:tabular-nums;text-align:center}
.kata{text-align:center;font-weight:800;font-size:1.1rem}
.uraian{text-align:center;color:var(--muted);font-size:1.05rem;font-variant-numeric:tabular-nums}
.target{font-family:var(--display);font-weight:800;font-size:1.5rem;text-align:center;background:var(--soft);border:2px dashed var(--lidi);border-radius:16px;padding:10px}
/* stasiun 2 */
.opsi4{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.opsi4 button,.opsiK button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.5rem;min-height:64px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:8px;touch-action:manipulation}
.opsiK{display:grid;gap:10px}
.opsiK button{font-size:1.15rem;line-height:1.25}
.opsi4 button.right,.opsiK button.right{background:var(--ok);border-color:var(--ok);color:#fff}
.opsi4 button.wrong,.opsiK button.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
/* stasiun 3: tabel bandingkan */
.tabel{display:grid;grid-template-columns:auto repeat(4,1fr);gap:6px;align-items:center}
.tabel .h{font-family:var(--display);font-weight:800;font-size:.8rem;color:#fff;text-align:center;border-radius:99px;padding:1px 2px}
.tabel .b{font-family:var(--display);font-weight:800;font-size:.95rem;color:var(--muted)}
.tabel .s{font-family:var(--display);font-weight:800;font-size:2.4rem;line-height:1;text-align:center;border-radius:12px;border:2px solid var(--line);padding:6px 0;background:var(--card);font-variant-numeric:tabular-nums}
.tabel .s.sama{background:var(--soft);border-color:var(--ok);color:var(--ok)}
.tabel .s.beda{border-color:var(--ikat);background:var(--soft);animation:pop .3s}
.tabel .s.cek{border-color:var(--lidi)}
.tanda{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.tanda button{font:inherit;font-family:var(--display);font-weight:800;font-size:2rem;min-height:64px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.tanda button.right{background:var(--ok);border-color:var(--ok);color:#fff}
.tanda button.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
/* stasiun 4: urutkan */
.daftar{display:flex;flex-direction:column;gap:10px}
.urut{font:inherit;font-family:var(--display);font-weight:800;font-size:1.7rem;color:var(--ink);background:var(--card);border:2px solid var(--line);border-radius:16px;min-height:60px;padding:6px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;touch-action:manipulation;font-variant-numeric:tabular-nums}
.urut .no{width:34px;height:34px;border-radius:50%;background:var(--ok);color:#fff;font-size:1.1rem;display:none;align-items:center;justify-content:center}
.urut.sudah{opacity:.55;border-color:var(--ok)}
.urut.sudah .no{display:flex}
.urut.bad{animation:goyang .4s;border-color:var(--bad)}
/* stasiun 5: kartu angka */
.slot4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.slot4 button{aspect-ratio:1;font-family:var(--display);font-weight:800;font-size:2.4rem;border-radius:16px;border:3px dashed var(--line);background:transparent;color:var(--ink);cursor:pointer}
.slot4 button.isi{border-style:solid;border-color:var(--ink);background:var(--card)}
.kartu4{display:flex;gap:10px;justify-content:center}
.kartu4 button{width:68px;height:84px;font-family:var(--display);font-weight:800;font-size:2.4rem;border-radius:14px;border:3px solid var(--ink);background:var(--soft);color:var(--ink);cursor:pointer;box-shadow:0 4px 0 var(--ink);touch-action:manipulation}
.kartu4 button:disabled{opacity:.25;box-shadow:none;cursor:default}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
/* bonus */
input[type=range]{width:100%;accent-color:var(--ikat);height:40px}
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
      <h1>Bilangan Ribuan</h1>
      <div class="panel" style="max-width:340px;margin:0 auto;width:100%">
        <div class="kol4" id="introKol"></div>
      </div>
      <p class="say">Ayo kenali bilangan sampai sepuluh ribu!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: susun bilangan -->
  <section class="screen" id="s1">
    <p class="say">Susun bilangan ini:</p>
    <div class="dots" id="s1dots"></div>
    <div class="target" id="s1target"></div>
    <div class="panel" style="display:flex;flex-direction:column;gap:10px">
      <div class="kol4" id="s1kol"></div>
      <div class="besar" id="s1besar"></div>
      <div class="kata" id="s1kata"></div>
      <div class="uraian" id="s1uraian"></div>
    </div>
    <div class="msg" id="s1msg">Ketuk panah untuk mengubah angka.</div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: baca dan tulis -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Pilih yang benar.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="besar" id="s2soal" style="font-size:1.8rem"></div></div>
    <div id="s2opsi"></div>
    <div class="msg" id="s2msg" style="display:none"></div>
    <div class="cta"><button class="big main" id="s2next" style="display:none">Lanjut</button></div>
  </section>

  <!-- 3: bandingkan -->
  <section class="screen" id="s3">
    <p class="say">Mana yang lebih besar? Periksa dari kiri.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel" style="display:flex;flex-direction:column;gap:12px">
      <div class="tabel" id="s3tabel"></div>
    </div>
    <button class="big" id="s3cek">Periksa kolom berikutnya</button>
    <div class="tanda" id="s3tanda" style="display:none"></div>
    <div class="msg" id="s3msg">Mulai dari ribuan.</div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: urutkan -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Urutkan.</p>
    <div class="dots" id="s4dots"></div>
    <div class="daftar" id="s4daftar"></div>
    <div class="msg" id="s4msg">Ketuk satu per satu.</div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5: kartu angka -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Susun bilangan.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel" style="display:flex;flex-direction:column;gap:14px">
      <div class="slot4" id="s5slot"></div>
      <div class="kartu4" id="s5kartu"></div>
    </div>
    <div class="msg" id="s5msg">Ketuk kartu untuk menaruhnya.</div>
    <div class="cta">
      <button class="big main" id="s5next" disabled>Lanjut</button>
      <button class="big soft" id="s5ulang">Ulangi</button>
    </div>
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
      <button class="big soft" id="keBonus">Coba Bonus: bilangan sampai 10.000</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: geser garis bilangan.</p>
    <div class="besar" id="bn">5.000</div>
    <input type="range" id="br" min="0" max="10000" step="50" value="5000" aria-label="Pilih bilangan">
    <div class="panel"><div class="kata" id="bkata"></div><div class="uraian" id="buraian" style="margin-top:6px"></div></div>
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
function msg(id,kelas,t){var m=$(id);m.style.display='';m.className='msg'+(kelas?' '+kelas:'');m.textContent=t}
function sekali(b,kelas){b.classList.remove(kelas);void b.offsetWidth;b.classList.add(kelas)}

/* ---- bilangan: format titik ribuan dan terbilang ---- */
function fmt(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
var SAT=['nol','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan'];
function duaDigit(p){
  if(p<10)return SAT[p];
  if(p===10)return 'sepuluh';
  if(p===11)return 'sebelas';
  if(p<20)return SAT[p-10]+' belas';
  return SAT[Math.floor(p/10)]+' puluh'+(p%10?' '+SAT[p%10]:'');
}
function terbilang(n){
  if(n===0)return 'nol';
  if(n===10000)return 'sepuluh ribu';
  var r=Math.floor(n/1000),h=Math.floor(n%1000/100),p=n%100,k=[];
  if(r)k.push(r===1?'seribu':SAT[r]+' ribu');
  if(h)k.push(h===1?'seratus':SAT[h]+' ratus');
  if(p)k.push(duaDigit(p));
  return k.join(' ');
}
var NAMA=['Ribuan','Ratusan','Puluhan','Satuan'],NILAI=[1000,100,10,1];
function digit4(n){return [Math.floor(n/1000)%10,Math.floor(n/100)%10,Math.floor(n/10)%10,n%10]}
function uraian(n){
  var d=digit4(n),t=[];
  d.forEach(function(x,i){if(x)t.push(fmt(x*NILAI[i]))});
  return t.length?t.join(' + '):'0';
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
  if(id==='intro')setKata('Ayo kenali bilangan sampai sepuluh ribu!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
(function(){
  var w=$('introKol'),d=digit4(4058);
  NAMA.forEach(function(n,i){
    var k=el('div','kol c'+i);k.appendChild(el('span','nm',n));k.appendChild(el('span','dg',String(d[i])));k.appendChild(el('span','nl',fmt(d[i]*NILAI[i])));w.appendChild(k);
  });
})();
setKata('Ayo kenali bilangan sampai sepuluh ribu!');

/* ---- stasiun 1: susun bilangan dengan kolom nilai tempat ---- */
var T1=[3526,4809,2007,8020],r1=0,dg1=[0,0,0,0],selesai1=false,kolEl=[];
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var t=T1[r1];dg1=[0,0,0,0];selesai1=false;
  titik('s1dots',T1.length,r1);
  $('s1target').textContent=terbilang(t);
  var w=$('s1kol');clear(w);kolEl=[];
  NAMA.forEach(function(n,i){
    var k=el('div','kol c'+i);k.appendChild(el('span','nm',n));
    var naik=el('button',null,'▲');naik.setAttribute('aria-label',n+' tambah');
    var dg=el('span','dg','0');
    var turun=el('button',null,'▼');turun.setAttribute('aria-label',n+' kurang');
    k.appendChild(naik);k.appendChild(dg);k.appendChild(turun);k.appendChild(el('span','nl',fmt(NILAI[i])));
    naik.onclick=function(){ubah1(i,1)};turun.onclick=function(){ubah1(i,-1)};
    w.appendChild(k);kolEl.push({k:k,dg:dg});
  });
  gambar1();
  $('s1next').disabled=true;
  msg('s1msg','','Ketuk panah untuk mengubah angka.');
  setKata('Susun bilangan ini: '+terbilang(t));
}
function nilai1(){return dg1[0]*1000+dg1[1]*100+dg1[2]*10+dg1[3]}
function gambar1(){
  var n=nilai1();
  kolEl.forEach(function(c,i){c.dg.textContent=String(dg1[i])});
  $('s1besar').textContent=fmt(n);
  $('s1kata').textContent=terbilang(n);
  $('s1uraian').textContent=uraian(n);
}
function ubah1(i,d){
  if(selesai1)return;
  dg1[i]=(dg1[i]+d+10)%10;gambar1();
  if(nilai1()===T1[r1]){
    selesai1=true;kolEl.forEach(function(c){c.k.classList.add('ok')});
    var t=T1[r1],d4=digit4(t),nol=d4.some(function(x,k){return x===0&&d4.slice(0,k).some(function(y){return y>0})});
    var s='Betul! '+fmt(t)+' = '+uraian(t)+'.'+(nol?' Angka 0 menjaga tempatnya. Tanpa 0, bilangannya berubah.':'');
    msg('s1msg','good',s);setKata(s);$('s1next').disabled=false;
  }else msg('s1msg','','Sekarang: '+fmt(nilai1())+'.');
}
$('s1next').onclick=function(){if(r1<T1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: baca dan tulis ---- */
var S2=[
  {s:'Tulis dengan angka:',q:'delapan ribu dua puluh',a:'8.020',w:['820','8.200','8.002']},
  {s:'Tulis dengan angka:',q:'dua ribu tujuh',a:'2.007',w:['270','2.700','2.070']},
  {s:'Tulis dengan angka:',q:'empat ribu lima',a:'4.005',w:['45','4.050','4.500']},
  {s:'Tulis dengan angka:',q:'tujuh ribu sembilan puluh',a:'7.090',w:['790','7.900','7.009']},
  {s:'Bagaimana membacanya?',q:'6.708',a:'enam ribu tujuh ratus delapan',w:['enam ribu tujuh ratus delapan puluh','enam ribu tujuh puluh delapan','enam ratus tujuh ribu delapan']},
  {s:'Bagaimana membacanya?',q:'5.060',a:'lima ribu enam puluh',w:['lima ribu enam ratus','lima ribu enam','lima ribu enam ratus enam puluh']}
];
var r2=0,kunci2=false;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=S2[r2];kunci2=false;titik('s2dots',S2.length,r2);
  $('s2say').textContent=d.s;$('s2soal').textContent=d.q;
  var o=$('s2opsi');clear(o);o.className=d.a.length>8?'opsiK':'opsi4';
  shuffle([d.a].concat(d.w)).forEach(function(x){
    var b=el('button',null,x);
    b.onclick=function(){
      if(kunci2)return;kunci2=true;
      var ok=x===d.a,sem=o.children;
      for(var k=0;k<sem.length;k++){if(sem[k].textContent===d.a)sem[k].classList.add('right');else if(sem[k]===b)sem[k].classList.add('wrong')}
      var angka=d.a.indexOf('.')>=0||/^[0-9]/.test(d.a)?d.a:d.q;
      var t=(ok?'Benar! ':'Hampir! ')+fmt(+String(angka).replace(/\./g,''))+' = '+uraian(+String(angka).replace(/\./g,''))+'.';
      msg('s2msg',ok?'good':'warn',t);setKata(t);
      var nx=$('s2next');nx.style.display='';nx.textContent='Lanjut';
    };
    o.appendChild(b);
  });
  $('s2msg').style.display='none';$('s2next').style.display='none';
  setKata(d.s+' '+d.q);
}
$('s2next').onclick=function(){if(r2<S2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: bandingkan kolom demi kolom ---- */
var P3=[[4560,4605],[3099,3100],[8245,8425],[8500,8050]],r3=0,pair3=[],kol3=0,beda3=-1,sel3=[];
function mulaiS3(){P3=shuffle(P3);r3=0;ronde3()}
function ronde3(){
  pair3=rnd(0,1)?P3[r3].slice().reverse():P3[r3].slice();kol3=0;beda3=-1;
  titik('s3dots',P3.length,r3);
  var t=$('s3tabel');clear(t);sel3=[[],[]];
  t.appendChild(el('span'));
  NAMA.forEach(function(n,i){var h=el('span','h',n);h.style.background='var(--'+['rb','rt','pl','st'][i]+')';t.appendChild(h)});
  pair3.forEach(function(n,b){
    t.appendChild(el('span','b',String.fromCharCode(65+b)));
    digit4(n).forEach(function(x){var c=el('span','s',String(x));t.appendChild(c);sel3[b].push(c)});
  });
  $('s3cek').style.display='';$('s3cek').disabled=false;
  var tn=$('s3tanda');tn.style.display='none';clear(tn);
  $('s3next').disabled=true;
  msg('s3msg','','Mulai dari ribuan. Ketuk Periksa.');
  setKata('Mana yang lebih besar? Periksa dari kiri.');
}
$('s3cek').onclick=function(){
  if(kol3>=4)return;
  var a=digit4(pair3[0])[kol3],b=digit4(pair3[1])[kol3],nm=NAMA[kol3].toLowerCase();
  if(a===b){
    sel3[0][kol3].classList.add('sama');sel3[1][kol3].classList.add('sama');
    var t=NAMA[kol3]+': '+a+' dan '+b+' sama. Lanjut ke kolom berikutnya.';
    kol3++;
    if(kol3===4){
      msg('s3msg','good','Semua kolom sama. Kedua bilangan sama besar.');tampilTanda();
    }else{msg('s3msg','',t);setKata(t)}
  }else{
    beda3=kol3;sel3[0][kol3].classList.add('beda');sel3[1][kol3].classList.add('beda');
    var t2=NAMA[kol3]+': '+a+' dan '+b+' berbeda. Cukup lihat sampai sini. Mana yang lebih besar?';
    kol3=4;msg('s3msg','warn',t2);setKata(t2);tampilTanda();
  }
};
function tampilTanda(){
  $('s3cek').style.display='none';
  var tn=$('s3tanda');tn.style.display='grid';clear(tn);
  var A=pair3[0],B=pair3[1],tepat=A>B?'>':A<B?'<':'=';
  ['>','<','='].forEach(function(x){
    var b=el('button',null,'A '+x+' B');
    b.onclick=function(){
      if(!$('s3next').disabled)return;
      if(x===tepat){
        b.classList.add('right');
        var s='Betul! '+fmt(A)+(A>B?' lebih besar dari ':A<B?' lebih kecil dari ':' sama dengan ')+fmt(B)+'.';
        msg('s3msg','good',s);setKata(s);$('s3next').disabled=false;
      }else{b.classList.add('wrong');var s2='Hampir! Lihat kolom yang berbeda tadi.';msg('s3msg','warn',s2);setKata(s2)}
    };
    tn.appendChild(b);
  });
}
$('s3next').onclick=function(){if(r3<P3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: urutkan empat bilangan ---- */
var S4=[
  {say:'Urutkan dari yang TERKECIL.',naik:true,n:[2980,2890,2908,2809]},
  {say:'Urutkan dari yang TERBESAR.',naik:false,n:[4532,4352,4523,4325]},
  {say:'Urutkan dari yang TERKECIL.',naik:true,n:[6021,6201,6102,6012]}
];
var r4=0,benar4=[],kunci4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=S4[r4];benar4=d.n.slice().sort(function(a,b){return d.naik?a-b:b-a});kunci4=0;
  titik('s4dots',S4.length,r4);$('s4say').textContent=d.say;
  var w=$('s4daftar');clear(w);
  shuffle(d.n).forEach(function(v){
    var b=el('button','urut');b.appendChild(el('span',null,fmt(v)));b.appendChild(el('span','no'));
    b.onclick=function(){
      if(b.classList.contains('sudah')||kunci4>=benar4.length)return;
      if(v===benar4[kunci4]){
        kunci4++;b.classList.add('sudah');b.querySelector('.no').textContent=String(kunci4);
        if(kunci4===benar4.length){var t='Hebat! Mulai dari ribuan, lalu ratusan, puluhan, dan satuan.';msg('s4msg','good',t);setKata(t);$('s4next').disabled=false}
        else msg('s4msg','good','Betul! Berikutnya.');
      }else{
        sekali(b,'bad');
        var t2=d.naik?'Masih ada yang lebih kecil. Bandingkan dari ribuan, lalu ratusan.':'Masih ada yang lebih besar. Bandingkan dari ribuan, lalu ratusan.';
        msg('s4msg','warn',t2);setKata(t2);
      }
    };
    w.appendChild(b);
  });
  $('s4next').disabled=true;msg('s4msg','','Ketuk satu per satu.');setKata(d.say);
}
$('s4next').onclick=function(){if(r4<S4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: kartu angka (terbesar atau terkecil) ---- */
var S5=[
  {say:'Susun bilangan TERBESAR.',besar:true,k:[2,7,0,5]},
  {say:'Susun bilangan TERKECIL.',besar:false,k:[3,9,1,6]},
  {say:'Susun bilangan TERKECIL. Angka pertama tidak boleh 0.',besar:false,k:[0,4,8,1]},
  {say:'Susun bilangan TERBESAR.',besar:true,k:[5,0,9,2]}
];
var r5=0,kartu5=[],pakai5=[],tujuan5=0;
function mulaiS5(){r5=0;ronde5()}
function hitungTujuan(d){
  var a=d.k.slice().sort(function(x,y){return y-x});
  if(d.besar)return +a.join('');
  a.reverse();
  if(a[0]===0){for(var i=1;i<a.length;i++){if(a[i]>0){var t=a[i];a.splice(i,1);a.unshift(t);break}}}
  return +a.join('');
}
function ronde5(){
  var d=S5[r5];kartu5=shuffle(d.k.map(function(v,i){return {v:v,i:i}}));pakai5=[];tujuan5=hitungTujuan(d);
  titik('s5dots',S5.length,r5);$('s5say').textContent=d.say;
  $('s5next').disabled=true;msg('s5msg','','Ketuk kartu untuk menaruhnya.');
  gambar5();setKata(d.say);
}
function gambar5(){
  var s=$('s5slot');clear(s);
  for(var i=0;i<4;i++){
    var b=el('button',pakai5[i]?'isi':'');b.textContent=pakai5[i]?String(pakai5[i].v):'';
    b.setAttribute('aria-label','tempat '+(i+1));
    if(pakai5[i])(function(i){b.onclick=function(){if(!$('s5next').disabled)return;pakai5.splice(i,1);gambar5();msg('s5msg','','Ketuk kartu untuk menaruhnya.')}})(i);
    s.appendChild(b);
  }
  var k=$('s5kartu');clear(k);
  kartu5.forEach(function(c){
    var b=el('button',null,String(c.v));b.disabled=pakai5.some(function(p){return p.i===c.i});
    b.onclick=function(){if(pakai5.length>=4||!$('s5next').disabled)return;pakai5.push(c);gambar5();if(pakai5.length===4)periksa5()};
    k.appendChild(b);
  });
}
function periksa5(){
  var d=S5[r5],n=+pakai5.map(function(p){return p.v}).join('');
  if(pakai5[0].v===0){msg('s5msg','warn','Angka pertama tidak boleh 0. Ketuk kotak untuk menukar.');setKata('Angka pertama tidak boleh nol.');return}
  if(n===tujuan5){
    var s='Betul! '+fmt(n)+' adalah bilangan '+(d.besar?'terbesar':'terkecil')+'.';
    msg('s5msg','good',s);setKata(s);$('s5next').disabled=false;
  }else{
    var s2=d.besar?'Belum yang terbesar. Taruh angka terbesar di ribuan dulu.':'Belum yang terkecil. Taruh angka terkecil (bukan 0) di ribuan dulu.';
    msg('s5msg','warn',s2);setKata(s2);
  }
}
$('s5ulang').onclick=function(){pakai5=[];$('s5next').disabled=true;gambar5();msg('s5msg','','Ketuk kartu untuk menaruhnya.')};
$('s5next').onclick=function(){if(r5<S5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu paham bilangan sampai sepuluh ribu.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-08'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};

/* ---- bonus: geser garis bilangan sampai 10.000 ---- */
function renderBonus(){
  var n=+$('br').value;
  $('bn').textContent=fmt(n);
  $('bkata').textContent=terbilang(n);
  $('buraian').textContent=uraian(n);
  var d=digit4(n);
  var t=n===10000?'10.000 adalah bilangan pertama yang punya lima angka. Setelah 9.999.':n===0?'Mulai dari nol.':'Ribuan: '+d[0]+'. Ratusan: '+d[1]+'. Puluhan: '+d[2]+'. Satuan: '+d[3]+'.';
  msg('bmsg','',t);setKata(terbilang(n));
}
function mulaiBonus(){renderBonus()}
$('br').oninput=renderBonus;
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC08 = rakit(DASAR, { kode: 'AC-08', data: DATA_AC08 })
