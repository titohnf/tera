import { rakit } from './bersama'
import { DATA_AC18 } from './latihan/ac18'

/**
 * Materi interaktif AC-18 "Pita Pecahan" (Bandingkan dan urutkan pecahan;
 * pecahan senilai). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox
 * di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-18.
 * Disimpan sebagai string supaya ikut terbundel di build tanpa membaca berkas
 * saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-17 (anak kelas 4-5, tiap stasiun beranimasi;
 * bagian berwarna pada pita melebar dari kiri). Lima stasiun praktik:
 * 1) Satu nilai: pecahan dibaca dari pita (w bagian dari n bagian sama besar),
 *    pembilang dan penyebut, dan "bukan dua angka terpisah".
 * 2) Bandingkan pita: penyebut sama (lihat pembilang) dan pembilang sama
 *    (penyebut lebih kecil berarti potongan lebih besar, jadi pecahan lebih
 *    besar).
 * 3) Belah bagiannya: geser pembelah supaya pita 1/3 menjadi 2/6, 3/9, 4/12;
 *    pembilang dan penyebut sama-sama dikali; menambah 1 tidak menjaga nilai.
 * 4) Gabung bagiannya: pita 8/12 digabung tiap g bagian; hanya pas bila g
 *    membagi pembilang dan penyebut; berhenti di bentuk paling sederhana.
 * 5) Samakan penyebut: dua pecahan berpenyebut beda dipecah sampai penyebutnya
 *    sama, lalu dibandingkan; juga mengurutkan tiga pecahan.
 * Bonus: pilih dua pecahan sendiri, pita dan tanda > < = muncul.
 *
 * Soal Misi topik ini menguji: pembilang dan penyebut, pecahan sebagai satu
 * nilai, membandingkan dan mengurutkan, pecahan senilai, menyederhanakan, dan
 * salah paham (1/5 lebih besar dari 1/3, pembilang besar pasti besar, menambah
 * pada kedua angka, mengalikan hanya pembilang).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac18.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, fpbG): semuanya satu cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-18 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pita Pecahan</title>
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
.baca{font-family:var(--display);font-weight:800;font-size:1.15rem;text-align:center;min-height:2.4em}
input[type=range]{width:100%;accent-color:var(--ikat);height:40px}
.nama{font-family:var(--display);font-weight:800;font-size:1.05rem;color:var(--muted);text-align:center}
.kontrol{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.kontrol div{display:flex;align-items:center;justify-content:space-between;gap:4px;border:2px solid var(--line);border-radius:14px;padding:4px 8px;background:var(--card);font-family:var(--display);font-weight:800;font-size:1.1rem}
.kontrol button{width:38px;height:38px;border-radius:50%;border:2px solid var(--ink);background:var(--card);color:var(--ink);font-size:1.2rem;cursor:pointer;touch-action:manipulation;padding:0}
.tanda{font-family:var(--display);font-weight:800;font-size:2.4rem;text-align:center;color:var(--ikat)}
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
      <h1>Pita Pecahan</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo bandingkan pecahan dengan pita!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Pecahan apa yang diwarnai?</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Mana yang lebih besar?</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Belah tiap bagian pita.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="baca" id="s3baca"></div>
      <input type="range" id="s3geser" min="1" max="6" value="1" aria-label="Belah tiap bagian"></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Gabung bagian pita.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="baca" id="s4baca"></div>
      <input type="range" id="s4geser" min="1" max="7" value="1" aria-label="Gabung tiap bagian"></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Samakan penyebutnya dulu.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="alat" id="s5alat"></div></div>
    <div class="aksi" id="s5samakan"></div>
    <div class="tanya" id="s5tanya"></div>
    <div class="aksi" id="s5aksi"></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: bandingkan sendiri</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih dua pecahan, lihat pitanya!</p>
    <div class="panel"><div class="alat" id="bAlat"></div><div class="tanda" id="bTanda"></div></div>
    <div class="kontrol" id="bKontrol"></div>
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
  if(id==='intro')setKata('Ayo bandingkan pecahan dengan pita!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo bandingkan pecahan dengan pita!');

/* ---- alat bantu ---- */
function fpb(a,b){return b?fpb(b,a%b):a}
function kpk2(a,b){return a/fpb(a,b)*b}
function pec(w,n){return w+'/'+n}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Lihat lagi pitanya.')});
}
function pitaDi(id,baris,sej,anim){var w=$(id);clear(w);w.appendChild(GBR.pita({baris:baris,sejajar:!!sej,anim:anim!==false}))}

/* ---- stasiun 1: satu nilai ---- */
var R1=[
  {n:4,w:3,steps:[{t:'Pecahan bagian yang diwarnai?',o:['3/4','4/3','3/1'],b:'3/4',p:'3 bagian berwarna dari 4 bagian sama besar: 3/4.'},
                  {t:'Angka 3 pada 3/4 disebut...',o:['pembilang','penyebut','bilangan bulat'],b:'pembilang',p:'Pembilang (atas): banyak bagian yang diambil. Penyebut (bawah) 4: banyak bagian seluruhnya.'}]},
  {n:8,w:5,steps:[{t:'Pecahan bagian yang diwarnai?',o:['5/8','8/5','5/3'],b:'5/8',p:'5 dari 8 bagian sama besar: 5/8.'},
                  {t:'Angka 8 pada 5/8 disebut...',o:['penyebut','pembilang','sisa'],b:'penyebut',p:'Penyebut menunjukkan pita dibagi menjadi 8 bagian sama besar.'}]},
  {n:6,w:2,steps:[{t:'Pecahan bagian yang diwarnai?',o:['2/6','6/2','2/4'],b:'2/6',p:'2 dari 6 bagian: 2/6.'},
                  {t:'Apakah 2/6 dua angka yang terpisah?',o:['Bukan, 2/6 adalah satu nilai: 2 bagian dari 6 bagian sama besar','Ya, angka 2 dan 6 tidak berhubungan'],b:'Bukan, 2/6 adalah satu nilai: 2 bagian dari 6 bagian sama besar',p:'Pecahan adalah SATU nilai, dibaca "dua perenam".'}]}
];
var r1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1];titik('s1dots',R1.length,r1);
  pitaDi('s1alat',[{n:d.n,w:d.w,l:'?'}]);
  $('s1next').disabled=true;msg('s1msg','','Hitung bagian berwarna dan seluruh bagian.');setKata('Pecahan apa yang diwarnai?');
  ruteSteps('s1aksi','s1tanya','s1msg',d.steps,0,function(){pitaDi('s1alat',[{n:d.n,w:d.w,l:pec(d.w,d.n)}],false,false);$('s1next').disabled=false});
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: bandingkan pita ---- */
var R2=[
  {a:[3,8],b:[5,8],pesan:'Penyebut sama, jadi bagiannya sama besar. 5 bagian lebih banyak daripada 3 bagian.'},
  {a:[1,3],b:[1,5],pesan:'Pembilang sama. Makin banyak bagian dalam satu pita, tiap bagian makin kecil. Jadi penyebut lebih kecil berarti pecahan lebih besar.'},
  {a:[3,5],b:[3,8],pesan:'Sama-sama 3 bagian, tetapi bagian perlimaan lebih besar daripada bagian perdelapan.'},
  {a:[2,3],b:[2,9],pesan:'Pembilang sama (2). Bagian pertigaan jauh lebih besar daripada bagian persembilan.'}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2],A=pec(d.a[0],d.a[1]),B=pec(d.b[0],d.b[1]);titik('s2dots',R2.length,r2);
  pitaDi('s2alat',[{n:d.a[1],w:d.a[0],l:A},{n:d.b[1],w:d.b[0],l:B}],true);
  $('s2next').disabled=true;msg('s2msg','','Bandingkan panjang bagian berwarna. Garis merah membantu.');
  var benar=d.a[0]*d.b[1]>d.b[0]*d.a[1]?A:B;
  var t='Manakah yang lebih besar, '+A+' atau '+B+'?';setKata(t);
  $('s2tanya').textContent=t;
  pilihan($('s2aksi'),[A,B,'Sama besar'],benar,function(){
    msg('s2msg','good',d.pesan);setKata(d.pesan);$('s2aksi').querySelectorAll('button').forEach(function(b){b.disabled=true});$('s2next').disabled=false;
  },3,function(){msg('s2msg','warn','Hampir! Lihat bagian yang berwarna, jangan hanya angkanya.')});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: belah bagian (pecahan senilai) ---- */
var R3=[{w:1,n:3,k:4},{w:3,n:4,k:4},{w:2,n:5,k:2},{w:5,n:6,k:3},{tambah:true}];
var r3=0,sdh3=false;
function mulaiS3(){r3=0;ronde3()}
function gambarS3(k){
  var d=R3[r3];
  pitaDi('s3alat',[{n:d.n,w:d.w,l:pec(d.w,d.n)},{n:d.n*k,w:d.w*k,tebal:k,l:pec(d.w*k,d.n*k)}],true,false);
  $('s3baca').textContent=k===1?'Belum dibelah.':'Setiap bagian dibelah jadi '+k+': '+d.w+' × '+k+' = '+(d.w*k)+' dan '+d.n+' × '+k+' = '+(d.n*k)+'.';
}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);sdh3=false;
  clear($('s3aksi'));$('s3tanya').textContent='';$('s3next').disabled=true;
  var sl=$('s3geser');
  if(d.tambah){
    sl.style.display='none';$('s3baca').textContent='';$('s3say').textContent='Sinta menambah 1 pada pembilang dan penyebut.';
    pitaDi('s3alat',[{n:2,w:1,l:'1/2'},{n:3,w:2,l:'2/3'}],true);
    msg('s3msg','','Sinta: "1/2 menjadi 2/3 dengan menambah 1 pada keduanya, nilainya tetap."');
    var t='Apakah 1/2 dan 2/3 senilai?';setKata(t);$('s3tanya').textContent=t;
    pilihan($('s3aksi'),['Tidak, 2/3 lebih besar daripada 1/2','Ya, nilainya tetap sama'],'Tidak, 2/3 lebih besar daripada 1/2',function(){
      msg('s3msg','good','Menambah tidak menjaga nilai. Yang menjaga nilai: kalikan pembilang DAN penyebut dengan bilangan yang sama (1/2 = 2/4).');$('s3aksi').querySelectorAll('button').forEach(function(b){b.disabled=true});$('s3next').disabled=false;$('s3tanya').textContent='';
    },null,function(){msg('s3msg','warn','Hampir! Lihat pita: bagian berwarnanya tidak sama panjang.')});
    return;
  }
  sl.style.display='';sl.min='1';sl.max='6';sl.step='1';sl.value='1';
  $('s3say').textContent='Belah tiap bagian pita sampai penyebutnya '+(d.n*d.k)+'.';setKata($('s3say').textContent);
  gambarS3(1);msg('s3msg','','Geser pegangan. Garis tebal menunjukkan bagian aslinya.');
}
$('s3geser').oninput=function(){
  var d=R3[r3];if(d.tambah||sdh3)return;
  var k=+$('s3geser').value;gambarS3(k);
  if(k===d.k){
    sdh3=true;$('s3geser').disabled=true;
    later(function(){
      var N=d.n*d.k,b=String(d.w*d.k),t=pec(d.w,d.n)+' senilai dengan ?/'+N+'. Berapa pembilangnya?';
      $('s3tanya').textContent=t;setKata(t);
      pilihan($('s3aksi'),[b,String(d.w+N-d.n),String(d.w*d.k-1)],b,function(){
        msg('s3msg','good','Penyebut dikali '+d.k+', pembilang juga dikali '+d.k+': '+pec(d.w*d.k,N)+'. Nilainya tetap.');clear($('s3aksi'));$('s3tanya').textContent='';$('s3geser').disabled=false;$('s3next').disabled=false;
      },3,function(){msg('s3msg','warn','Hampir! Pembilang dikali dengan bilangan yang sama seperti penyebut. Lihat pita yang diwarnai.')});
    },700);
  }
};
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: gabung bagian (menyederhanakan) ---- */
var R4=[{w:8,n:12},{w:14,n:21},{w:6,n:8},{w:10,n:15}];
var r4=0,sdh4=false;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);sdh4=false;
  var sl=$('s4geser');sl.min='1';sl.max='7';sl.step='1';sl.value='1';sl.disabled=false;
  $('s4say').textContent='Sederhanakan '+pec(d.w,d.n)+' dengan menggabung bagian.';setKata($('s4say').textContent);
  gambarS4(1);$('s4next').disabled=true;clear($('s4aksi'));$('s4tanya').textContent='';
  msg('s4msg','','Geser pegangan: gabung tiap g bagian jadi satu.');
}
function gambarS4(g){
  var d=R4[r4],m=fpb(d.w,d.n),pas=(d.w%g===0&&d.n%g===0),baris=[{n:d.n,w:d.w,tebal:g,l:pec(d.w,d.n)}];
  if(pas)baris.push({n:d.n/g,w:d.w/g,l:pec(d.w/g,d.n/g)});
  pitaDi('s4alat',baris,true,false);
  var t;
  if(g===1)t='Belum digabung.';
  else if(!pas)t='Tidak pas: '+(d.w%g?d.w:d.n)+' tidak habis dibagi '+g+', ada bagian yang terpotong.';
  else if(g<m)t='Pas! '+pec(d.w,d.n)+' = '+pec(d.w/g,d.n/g)+'. Masih bisa digabung lagi.';
  else t='Pas! '+pec(d.w,d.n)+' = '+pec(d.w/g,d.n/g)+'. Tidak bisa digabung lagi.';
  $('s4baca').textContent=t;
  return pas&&g===m;
}
$('s4geser').oninput=function(){
  if(sdh4)return;var d=R4[r4],g=+$('s4geser').value;
  if(gambarS4(g)){
    sdh4=true;var m=fpb(d.w,d.n),b=pec(d.w/m,d.n/m);
    later(function(){
      $('s4tanya').textContent='Bentuk paling sederhana dari '+pec(d.w,d.n)+' adalah...';setKata($('s4tanya').textContent);
      pilihan($('s4aksi'),[b,pec(d.w/m,d.n),pec(d.w,d.n/m)],b,function(){
        msg('s4msg','good','Bagi pembilang dan penyebut dengan '+m+' (faktor persekutuan terbesar): '+b+'.');clear($('s4aksi'));$('s4tanya').textContent='';$('s4next').disabled=false;
      },3,function(){msg('s4msg','warn','Hampir! Pembilang DAN penyebut dibagi bilangan yang sama.')});
    },600);
  }
};
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: samakan penyebut ---- */
var R5=[
  {f:[[2,3],[5,9]]},{f:[[1,2],[3,8]]},{f:[[2,3],[3,4]]},{f:[[2,3],[3,5],[5,6]]}
];
var r5=0,sama5=false;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);sama5=false;
  pitaDi('s5alat',d.f.map(function(x){return {n:x[1],w:x[0],l:pec(x[0],x[1])}}),false);
  $('s5next').disabled=true;clear($('s5aksi'));$('s5tanya').textContent='';
  var a=$('s5samakan');clear(a);a.className='aksi';tombol(a,'Samakan penyebut',samakan5,'utama hint');
  msg('s5msg','','Penyebutnya berbeda. Tekan "Samakan penyebut" supaya bisa dibandingkan.');
  setKata('Samakan penyebutnya dulu.');
}
function samakan5(){
  if(sama5)return;sama5=true;
  var d=R5[r5],D=d.f.reduce(function(m,x){return kpk2(m,x[1])},1);
  pitaDi('s5alat',d.f.map(function(x){var k=D/x[1];return {n:D,w:x[0]*k,tebal:k,l:pec(x[0]*k,D)}}),true);
  clear($('s5samakan'));
  var t0=d.f.map(function(x){var k=D/x[1];return pec(x[0],x[1])+' = '+pec(x[0]*k,D)}).join(', ');
  msg('s5msg','','Penyebut disamakan menjadi '+D+': '+t0+'.');
  var e=d.f.map(function(x){return {l:pec(x[0],x[1]),v:x[0]*(D/x[1])}}),steps;
  if(e.length===2){
    var A=e[0],B=e[1],benar=A.v>B.v?A.l:B.l;
    steps=[{t:'Manakah yang lebih besar, '+A.l+' atau '+B.l+'?',o:[A.l,B.l,'Sama besar'],b:benar,p:'Penyebut sama ('+D+'), pembilang lebih besar berarti pecahan lebih besar: '+benar+'.'}];
  }else{
    var u=e.slice().sort(function(x,y){return x.v-y.v}),b=u.map(function(x){return x.l}).join(', ');
    var o=[b,u.slice().reverse().map(function(x){return x.l}).join(', '),[u[1],u[0],u[2]].map(function(x){return x.l}).join(', ')];
    steps=[{t:'Urutkan dari yang TERKECIL ke TERBESAR.',o:o,b:b,p:'Dengan penyebut '+D+': '+u.map(function(x){return x.v+'/'+D}).join(' < ')+'. Urutannya '+b+'.'}];
  }
  later(function(){ruteSteps('s5aksi','s5tanya','s5msg',steps,0,function(){$('s5next').disabled=false})},900);
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu jago membandingkan pecahan.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-18'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  $('introGambar').appendChild(GBR.pita({baris:[{n:2,w:1,l:'1/2'},{n:4,w:2,tebal:2,l:'2/4'},{n:8,w:4,tebal:4,l:'4/8'}],sejajar:true}));
})();

/* ---- bonus: bandingkan sendiri ---- */
var bF=[[1,2],[2,3]];
function mulaiBonus(){bF=[[1,2],[2,3]];gambarBonus()}
function gambarBonus(){
  pitaDi('bAlat',bF.map(function(x){return {n:x[1],w:x[0],l:pec(x[0],x[1])}}),true,false);
  var l=bF[0][0]*bF[1][1],r=bF[1][0]*bF[0][1];
  $('bTanda').textContent=pec(bF[0][0],bF[0][1])+(l>r?' > ':(l<r?' < ':' = '))+pec(bF[1][0],bF[1][1]);
  msg('bmsg',l===r?'good':'',l===r?'Senilai! Bagian berwarnanya sama panjang.':(l>r?'Yang atas lebih besar.':'Yang bawah lebih besar.'));
  var p=$('bKontrol');clear(p);
  bF.forEach(function(x,i){
    [['Pembilang',0,0,x[1]],['Penyebut',1,2,12]].forEach(function(c){
      var r=el('div');r.appendChild(el('span',null,(i?'B ':'A ')+(c[1]===0?'atas':'bawah')));
      var m=el('button',null,'−'),pl=el('button',null,'+');
      m.onclick=function(){bF[i][c[1]]=Math.max(c[1]===0?0:2,bF[i][c[1]]-1);if(bF[i][0]>bF[i][1])bF[i][0]=bF[i][1];gambarBonus()};
      pl.onclick=function(){bF[i][c[1]]=Math.min(c[1]===0?bF[i][1]:12,bF[i][c[1]]+1);gambarBonus()};
      r.appendChild(m);r.appendChild(el('b',null,String(x[c[1]])));r.appendChild(pl);p.appendChild(r);
    });
  });
}
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC18 = rakit(DASAR, { kode: 'AC-18', data: DATA_AC18 })
