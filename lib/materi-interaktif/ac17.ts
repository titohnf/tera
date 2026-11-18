import { rakit } from './bersama'
import { DATA_AC17 } from './latihan/ac17'

/**
 * Materi interaktif AC-17 "Loncat dan Bagi" (Kelipatan dan faktor). Satu
 * halaman HTML mandiri, ditampilkan lewat iframe sandbox di `/mandiri/materi`
 * dan sebagai langkah Belajar di topik Misi AC-17. Disimpan sebagai string
 * supaya ikut terbundel di build tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-16 (anak kelas 4, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Lompat kelipatan: katak melompat n langkah di papan 1 sampai 40; petak
 *    yang didarati menyala (kelipatan). Lalu soal kelipatan ke-k dan "kelipatan
 *    tidak ada habisnya".
 * 2) Susun kelompok: sebuah bilangan dibagi ke kelompok berisi r; sisa
 *    ditampilkan merah. Anak mencari semua r yang tanpa sisa (faktor); 17
 *    hanya punya 1 dan 17.
 * 3) Dua lonceng: dua kelipatan menyala di papan 1 sampai 60; yang bertemu
 *    menjadi hijau. Kelipatan bersama pertama (terkecil); hasil kali belum
 *    tentu yang terkecil.
 * 4) Faktor sama-sama: daftar faktor dua bilangan, ketuk yang muncul di kedua
 *    daftar.
 * 5) Hitung faktor: banyak faktor 13, 16, 15, 1, dan 12 (prima tepat dua
 *    faktor, bilangan besar tidak selalu banyak faktor).
 * Bonus: penjelajah bilangan 1 sampai 60 (faktor, banyak faktor, kelipatan).
 *
 * Soal Misi topik ini menguji: arti kelipatan dan faktor, daftar keduanya,
 * pembagian rata tanpa sisa, kelipatan dan faktor persekutuan, banyak faktor,
 * bilangan prima, dan salah paham (faktor sama dengan kelipatan, hasil kali
 * selalu terkecil, 1 prima, bilangan besar pasti banyak faktor).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac17.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId): semuanya satu cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-17 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Loncat dan Bagi</title>
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
      <h1>Loncat dan Bagi</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo temukan kelipatan dan faktor!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: lompat kelipatan -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Katak melompat. Petak mana yang didarati?</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1papan"></div></div>
    <div class="catat" id="s1catat"></div>
    <div class="aksi" id="s1lompat"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: susun kelompok -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Bagi rata tanpa sisa. Cari semua cara!</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="kel2" id="s2kel"></div><div class="baca" id="s2baca"></div>
      <input type="range" id="s2geser" min="1" max="12" value="1" aria-label="Isi tiap kelompok"></div>
    <div class="nama">Faktor yang sudah ditemukan</div>
    <div class="fak" id="s2fak"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: dua lonceng -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Dua lonceng berbunyi.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3papan"></div></div>
    <div class="aksi" id="s3mulai"></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: faktor sama-sama -->
  <section class="screen" id="s4">
    <p class="say">Ketuk faktor yang muncul di KEDUA daftar.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="nama" id="s4na"></div><div class="fak" id="s4a"></div><div class="nama" id="s4nb"></div><div class="fak" id="s4b"></div></div>
    <div class="aksi" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5: hitung faktor -->
  <section class="screen" id="s5">
    <p class="say">Hitung banyak faktornya.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="nama" id="s5nama"></div><div class="alat" id="s5alat"></div></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: penjelajah bilangan</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih bilangan, lihat faktor dan kelipatannya.</p>
    <div class="panel"><div class="baca" id="bNilai"></div><input type="range" id="bGeser" min="1" max="60" value="12" aria-label="Bilangan"></div>
    <div class="nama">Faktor</div><div class="fak" id="bFak"></div>
    <div class="nama">Kelipatan (6 pertama)</div><div class="fak" id="bKel"></div>
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
  if(id==='intro')setKata('Ayo temukan kelipatan dan faktor!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo temukan kelipatan dan faktor!');

/* ---- fungsi bilangan ---- */
function semuaFaktor(n){var f=[];for(var i=1;i<=n;i++)if(n%i===0)f.push(i);return f}
function adaPilihan(a,b,c){var o=[a];[b,c].forEach(function(x){if(o.indexOf(x)<0)o.push(x)});var t=1;while(o.length<3){var y=String(+a+t++);if(o.indexOf(y)<0)o.push(y)}return o}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai,tampil){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },s.o.length===2?null:3,function(){msg(msgId,'warn','Hampir! Pikirkan lagi, boleh lihat papannya.')});
}

/* ---- stasiun 1: lompat kelipatan ---- */
var R1=[
  {n:4,steps:[{t:'Manakah kelipatan 4?',o:['28','30','34'],b:'28',p:'28 = 4 × 7. Kelipatan 4 adalah hasil kali 4 dengan bilangan asli.'},
              {t:'Berapa kelipatan ke-3 dari 4?',o:['12','7','64'],b:'12',p:'Kelipatan ke-3 dari 4 adalah 4 × 3 = 12.'}]},
  {n:6,steps:[{t:'Manakah kelipatan 6?',o:['36','34','26'],b:'36',p:'36 = 6 × 6. Katak bisa mendarat di 36.'},
              {t:'Berapa kelipatan ke-5 dari 6?',o:['30','11','36'],b:'30',p:'6 × 5 = 30.'}]},
  {n:9,steps:[{t:'Manakah kelipatan 9?',o:['27','29','19'],b:'27',p:'27 = 9 × 3.'},
              {t:'Papan berhenti di 40. Apakah kelipatan 9 juga berhenti?',o:['Tidak, kelipatan 9 tidak ada habisnya','Ya, berhenti di 36'],b:'Tidak, kelipatan 9 tidak ada habisnya',p:'Kita bisa mengalikan 9 dengan 10, 11, 12, ... tanpa henti. Kelipatan tidak terbatas.'}]}
];
var r1=0,lit1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1];titik('s1dots',R1.length,r1);lit1=0;
  var w=$('s1papan');clear(w);w.appendChild(GBR.papan({n:40,kol:10}));
  clear($('s1catat'));clear($('s1aksi'));$('s1tanya').textContent='';$('s1next').disabled=true;
  $('s1say').textContent='Katak melompat '+d.n+' langkah sekali lompat.';
  var a=$('s1lompat');clear(a);a.className='aksi';tombol(a,'Lompat!',lompat1,'utama hint');
  msg('s1msg','','Ketuk Lompat! berkali-kali. Petak yang didarati menyala.');setKata($('s1say').textContent);
}
function lompat1(){
  var d=R1[r1],nx=(lit1+1)*d.n;
  if(nx>40)return;
  lit1++;
  var cs=$('s1papan').firstChild.children,i;
  for(i=0;i<cs.length;i++)cs[i].classList.remove('so');
  cs[nx-1].classList.add('a','so');
  var cat=$('s1catat'),c=el('div');c.appendChild(document.createTextNode(d.n+' × '+lit1+' = '+nx));cat.appendChild(c);
  while(cat.children.length>3)cat.removeChild(cat.firstChild);
  if((lit1+1)*d.n>40){
    clear($('s1lompat'));msg('s1msg','good','Selesai! Petak menyala adalah kelipatan '+d.n+'.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.steps,0,function(){$('s1next').disabled=false})},1000);
  }
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: susun kelompok (faktor) ---- */
var R2=[{n:12},{n:16},{n:17}];
var r2=0,ada2=[];
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);ada2=[];
  var sl=$('s2geser');sl.min='1';sl.max=String(d.n);sl.step='1';sl.value='1';sl.disabled=false;
  $('s2say').textContent='Bagi '+d.n+' benda ke kelompok. Cari semua cara tanpa sisa!';setKata($('s2say').textContent);
  clear($('s2fak'));$('s2next').disabled=true;
  msg('s2msg','','Geser pegangan untuk mengubah isi tiap kelompok.');
  ubah2(1);
}
function ubah2(r){
  var d=R2[r2],n=d.n,q=Math.floor(n/r),s=n%r,w=$('s2kel'),i,j;
  clear(w);
  for(i=0;i<q;i++){var g=el('b');for(j=0;j<r;j++)g.appendChild(el('i'));w.appendChild(g)}
  if(s>0){var gs=el('b','sisa');for(j=0;j<s;j++)gs.appendChild(el('i'));w.appendChild(gs)}
  $('s2baca').textContent=n+' : '+r+' = '+q+(s>0?' sisa '+s+' (bukan faktor)':' tanpa sisa (faktor!)');
  if(s===0&&ada2.indexOf(r)<0){
    ada2.push(r);ada2.sort(function(a,b){return a-b});
    var f=$('s2fak');clear(f);ada2.forEach(function(v){f.appendChild(el('span',null,String(v)))});
    var all=semuaFaktor(n);
    if(ada2.length===all.length){
      var t=n===17?'Hanya 1 dan 17! Bilangan yang hanya punya dua faktor itu istimewa.':'Faktor dari '+n+': '+all.join(', ')+'. Faktor jumlahnya terbatas.';
      msg('s2msg','good',t);setKata(t);$('s2next').disabled=false;
    }else msg('s2msg','good','Ketemu faktor '+r+'! Sudah '+ada2.length+' dari '+all.length+'.');
  }else if(s>0)msg('s2msg','','Ada sisa '+s+'. Coba isi kelompok yang lain.');
}
$('s2geser').oninput=function(){ubah2(+$('s2geser').value)};
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: dua lonceng ---- */
var R3=[{a:4,b:6},{a:3,b:5},{a:6,b:9},{a:4,b:10}];
var r3=0,jalan3=false;
function pk(a,b){var m=a;while(m%b!==0)m+=a;return m}
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);jalan3=false;
  var w=$('s3papan');clear(w);w.appendChild(GBR.papan({n:60,kol:10}));
  clear($('s3aksi'));$('s3tanya').textContent='';$('s3next').disabled=true;
  $('s3say').textContent='Lonceng biru tiap '+d.a+' menit, lonceng kuning tiap '+d.b+' menit.';setKata($('s3say').textContent);
  var a=$('s3mulai');clear(a);a.className='aksi';tombol(a,'Bunyikan!',bunyi3,'utama hint');
  msg('s3msg','','Biru = kelipatan '+d.a+'. Kuning = kelipatan '+d.b+'. Hijau = bunyi bersamaan.');
}
function bunyi3(){
  if(jalan3)return;jalan3=true;
  var d=R3[r3],cs=$('s3papan').firstChild.children;clear($('s3mulai'));
  for(var i=1;i<=60;i++){(function(i){later(function(){
    var a=i%d.a===0,b=i%d.b===0,c=cs[i-1];
    if(a&&b)c.classList.add('ab');else if(a)c.classList.add('a');else if(b)c.classList.add('b');
  },i*70)})(i)}
  later(tanya3,60*70+500);
}
function tanya3(){
  var d=R3[r3],m=pk(d.a,d.b),ab=d.a*d.b,steps=[];
  var sal=ab!==m?String(ab):String(d.a+d.b);
  steps.push({t:'Pada menit ke berapa kedua lonceng PERTAMA kali berbunyi bersamaan?',o:[String(m),sal,String(Math.max(d.a,d.b))],b:String(m),p:'Menit ke-'+m+': kelipatan '+d.a+' dan kelipatan '+d.b+' pertama yang sama.'});
  if(ab!==m)steps.push({t:d.a+' × '+d.b+' = '+ab+' juga kelipatan bersama. Apakah itu yang terkecil?',o:['Bukan, yang terkecil adalah '+m,'Ya, selalu hasil kali'],b:'Bukan, yang terkecil adalah '+m,p:'Hasil kali memang kelipatan bersama, tetapi belum tentu yang terkecil. Cek daftar kelipatannya.'});
  ruteSteps('s3aksi','s3tanya','s3msg',steps,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: faktor sama-sama ---- */
var R4=[[18,24],[20,30],[18,27],[16,24]];
var r4=0,pil4=[];
function mulaiS4(){r4=0;ronde4()}
function chips4(wadah,n){
  var w=$(wadah);clear(w);
  semuaFaktor(n).forEach(function(v){
    var b=el('button',null,String(v));b.setAttribute('data-v',String(v));
    b.onclick=function(){
      var i=pil4.indexOf(v);if(i>=0)pil4.splice(i,1);else pil4.push(v);
      ['s4a','s4b'].forEach(function(x){var bs=$(x).children;for(var k=0;k<bs.length;k++)if(bs[k].getAttribute('data-v')===String(v))bs[k].classList.toggle('pilih',pil4.indexOf(v)>=0)});
    };
    w.appendChild(b);
  });
}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);pil4=[];
  $('s4na').textContent='Faktor dari '+d[0];$('s4nb').textContent='Faktor dari '+d[1];
  chips4('s4a',d[0]);chips4('s4b',d[1]);
  var a=$('s4aksi');clear(a);a.className='aksi';tombol(a,'Periksa',periksa4,'utama');
  $('s4next').disabled=true;msg('s4msg','','Ketuk angka yang ada di kedua daftar, lalu tekan Periksa.');setKata('Ketuk faktor yang muncul di kedua daftar.');
}
function periksa4(){
  var d=R4[r4],fa=semuaFaktor(d[0]),fb=semuaFaktor(d[1]),sama=fa.filter(function(x){return fb.indexOf(x)>=0});
  var benar=pil4.length===sama.length&&sama.every(function(x){return pil4.indexOf(x)>=0});
  if(benar){
    ['s4a','s4b'].forEach(function(x){var bs=$(x).children;for(var k=0;k<bs.length;k++){var v=+bs[k].getAttribute('data-v');bs[k].disabled=true;if(sama.indexOf(v)>=0)bs[k].classList.add('ok')}});
    var t='Faktor persekutuan '+d[0]+' dan '+d[1]+': '+sama.join(', ')+'.';msg('s4msg','good',t);setKata(t);clear($('s4aksi'));$('s4next').disabled=false;
  }else{
    var kurang=sama.filter(function(x){return pil4.indexOf(x)<0}).length,lebih=pil4.filter(function(x){return sama.indexOf(x)<0}).length;
    msg('s4msg','warn',(kurang?'Masih ada '+kurang+' yang belum dipilih. ':'')+(lebih?lebih+' pilihanmu tidak ada di kedua daftar.':''));
  }
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: hitung faktor ---- */
var R5=[
  {n:13,x:'Bilangan seperti 13 yang hanya punya tepat dua faktor disebut...',xo:['bilangan prima','bilangan genap','kelipatan 13'],xb:'bilangan prima',xp:'Bilangan prima: tepat dua faktor, 1 dan dirinya sendiri.'},
  {n:16,p:'16 lebih besar daripada 13, tetapi punya lebih banyak faktor (5 lawan 2). Besar bukan berarti banyak faktor.'},
  {n:15,p:'Faktor 15: 1, 3, 5, 15. Tepat 4 faktor.'},
  {n:1,p:'1 hanya punya satu faktor, yaitu 1. Jadi 1 bukan bilangan prima.'},
  {n:12,p:'Faktor 12: 1, 2, 3, 4, 6, 12. Ada 6 faktor.'}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5],c=semuaFaktor(d.n).length;titik('s5dots',R5.length,r5);
  $('s5nama').textContent='Faktor dari '+d.n;
  var w=$('s5alat');clear(w);w.appendChild(GBR.faktor({n:d.n,semua:true}));
  $('s5next').disabled=true;clear($('s5aksi'));
  var steps=[{t:'Ada berapa faktor dari '+d.n+'?',o:adaPilihan(String(c),String(c+1),String(c>1?c-1:c+2)),b:String(c),p:d.p||('Ada '+c+' faktor.')}];
  if(d.x)steps.push({t:d.x,o:d.xo,b:d.xb,p:d.xp});
  msg('s5msg','','Hitung kotak faktor di atas.');setKata('Ada berapa faktor dari '+d.n+'?');
  ruteSteps('s5aksi','s5tanya','s5msg',steps,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu jago kelipatan dan faktor.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-17'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  $('introGambar').appendChild(GBR.papan({n:40,a:4,b:6,kol:10}));
})();

/* ---- bonus: penjelajah bilangan ---- */
function mulaiBonus(){$('bGeser').value='12';gambarBonus()}
function gambarBonus(){
  var n=+$('bGeser').value,f=semuaFaktor(n),i;
  $('bNilai').textContent='Bilangan '+n;
  var a=$('bFak');clear(a);f.forEach(function(v){a.appendChild(el('span',null,String(v)))});
  var k=$('bKel');clear(k);for(i=1;i<=6;i++)k.appendChild(el('span',null,String(n*i)));
  var t=n===1?'1 hanya punya satu faktor, jadi bukan prima.':(f.length===2?n+' punya tepat 2 faktor: bilangan prima!':n+' punya '+f.length+' faktor.');
  msg('bmsg',f.length===2?'good':'',t+' Kelipatannya tidak ada habisnya.');
}
$('bGeser').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC17 = rakit(DASAR, { kode: 'AC-17', data: DATA_AC17 })
