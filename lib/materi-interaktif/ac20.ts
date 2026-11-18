import { rakit } from './bersama'
import { DATA_AC20 } from './latihan/ac20'

/**
 * Materi interaktif AC-20 "Tiga Wajah, Satu Nilai" (Mengurutkan bilangan
 * bentuk berbeda: pecahan, desimal, persen). Satu halaman HTML mandiri,
 * ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah
 * Belajar di topik Misi AC-20. Disimpan sebagai string supaya ikut terbundel di
 * build tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-19 (anak kelas 5-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Papan seratus: warnai petak sampai 1/2, 1/4, 3/4, 1/5, 3/20 dari papan;
 *    pecahan, persen, dan desimal muncul bersamaan (persen = per seratus).
 * 2) Tempat desimal: persepuluhan, perseratusan, perseribuan; 0,4 bukan 4; 0,45
 *    dibaca 45 perseratusan; 0,7 lebih besar dari 0,65.
 * 3) Pecahan ke persen: kalikan sampai penyebut 100 (3/20 = 15/100) atau bagi
 *    (1/8 = 0,125 = 12,5%, 3/8 = 0,375 = 37,5%).
 * 4) Geser koma: persen ke desimal (dibagi 100, dua langkah ke kiri) dan
 *    desimal ke persen (dua langkah ke kanan); 5% adalah 0,05.
 * 5) Urutkan: tiga bilangan berbentuk beda disamakan bentuknya (batang
 *    sepanjang seribu bagian), lalu diurutkan atau dicari yang terbesar.
 * Bonus: geser persen 0 sampai 100, lihat pecahan, desimal, persen, dan papan.
 *
 * Soal Misi topik ini menguji: tempat desimal, ubah antarbentuk, membandingkan
 * dan mengurutkan bentuk berbeda, diskon, dan salah paham (5/8 ditulis 0,58,
 * 1/8 ditulis 8%, 5% ditulis 0,5, 0,3 sama dengan 3, banyak digit berarti
 * besar).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac20.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, fpbG, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-20 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tiga Wajah Satu Nilai</title>
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
.kk{display:flex;justify-content:center;align-items:flex-end;font-family:var(--display);font-weight:800;font-size:2.8rem;min-height:3.6rem;font-variant-numeric:tabular-nums}
.kk .dg{min-width:.64em;text-align:center;border-bottom:3px solid var(--line)}
.kk .dg.nol{opacity:.35}
.kk .kom{color:var(--ikat);font-size:3.2rem;width:.34em;text-align:center;animation:pop .35s}
.kk .kom.hop{animation:lompat .45s}
@keyframes lompat{0%{transform:translateY(-16px)}60%{transform:translateY(3px)}100%{transform:none}}
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
      <h1>Tiga Wajah, Satu Nilai</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo kenali pecahan, desimal, dan persen!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Warnai papan seratus.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="baca" id="s1baca"></div>
      <input type="range" id="s1geser" min="0" max="100" step="5" value="0" aria-label="Banyak petak"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Baca tempat desimalnya.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="alat" id="s2alat2"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Ubah pecahan menjadi persen.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Geser koma dua langkah.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="kk" id="s4kk"></div><div class="baca" id="s4sat"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Samakan bentuknya, lalu bandingkan.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin tiga wajah</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: geser persen, lihat tiga wajahnya!</p>
    <div class="panel"><div class="alat" id="bSeratus"></div><div class="tanda" id="bTanda"></div></div>
    <input type="range" id="bGeser" min="0" max="100" step="1" value="25" aria-label="Persen">
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
  if(id==='intro')setKata('Ayo kenali pecahan, desimal, dan persen!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo kenali pecahan, desimal, dan persen!');

/* ---- alat bantu ---- */
function fpb(a,b){return b?fpb(b,a%b):a}
function pec(w,n){return w+'/'+n}
function desDari(p){return p===100?'1':(p===0?'0':(p%10===0?'0,'+(p/10):(p<10?'0,0'+p:'0,'+p)))}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(s.lihat)s.lihat();
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Lihat lagi gambarnya.')});
}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}

/* ---- stasiun 1: papan seratus ---- */
var R1=[{t:'1/2',p:50},{t:'1/4',p:25},{t:'3/4',p:75},{t:'1/5',p:20},{t:'3/20',p:15}];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1];titik('s1dots',R1.length,r1);sdh1=false;
  var sl=$('s1geser');sl.value='0';sl.disabled=false;
  var t='Warnai '+d.t+' dari papan seratus.';$('s1say').textContent=t;setKata(t);
  gambarS1(0);$('s1next').disabled=true;msg('s1msg','','Papan punya 100 petak. Geser pegangan untuk mewarnai.');
}
function gambarS1(v){
  gambarDi('s1alat',{k:'seratus',p:v});
  var g=fpb(v,100);
  $('s1baca').textContent=v===0?'Belum ada petak berwarna.':v+'/100 = '+(v/g===1&&100/g===1?'1':pec(v/g,100/g))+' = '+v+'% = '+desDari(v);
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambarS1(v);
  if(v===d.p){
    sdh1=true;$('s1geser').disabled=true;
    var t='Tepat! '+d.t+' = '+d.p+'/100 = '+d.p+'% = '+desDari(d.p)+'. Persen artinya per seratus.';msg('s1msg','good',t);setKata(t);$('s1next').disabled=false;
  }
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: tempat desimal ---- */
var R2=[
  {s:'0,4',steps:[{t:'Pada 0,4 angka 4 berada pada tempat...',o:['persepuluhan','perseratusan','satuan'],b:'persepuluhan',p:'Angka pertama setelah koma: persepuluhan. 0,4 = 4/10.'},
                 {t:'Apakah 0,4 sama nilainya dengan 4?',o:['Bukan. 0,4 kurang dari 1, sedangkan 4 jauh lebih besar','Ya, sama saja'],b:'Bukan. 0,4 kurang dari 1, sedangkan 4 jauh lebih besar',p:'Koma sangat penting: 0,4 = 4/10 dan 4 = 40/10.'}]},
  {s:'0,45',steps:[{t:'Bilangan 0,45 dibaca...',o:['45 perseratusan','45 persepuluhan','4,5 perseratusan'],b:'45 perseratusan',p:'Dua angka di belakang koma berarti perseratusan. 0,45 = 45/100.'}]},
  {s:'0,375',steps:[{t:'Angka 5 pada 0,375 berada pada tempat...',o:['perseribuan','perseratusan','persepuluhan'],b:'perseribuan',p:'Tiga angka di belakang koma: perseribuan. 0,375 = 375/1000.'}]},
  {s:'0,7',cmp:[70,'0,7',65,'0,65'],steps:[{t:'Manakah yang lebih besar, 0,7 atau 0,65?',o:['0,7','0,65','Sama besar'],b:'0,7',p:'0,7 = 0,70, dan 70 perseratusan lebih banyak daripada 65. Banyak angka belum tentu besar.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  gambarDi('s2alat',{k:'desimal',s:d.s});
  if(d.cmp)gambarDi('s2alat2',{k:'pita',baris:[{n:100,w:d.cmp[0],l:d.cmp[1]},{n:100,w:d.cmp[2],l:d.cmp[3]}],sejajar:true});else clear($('s2alat2'));
  $('s2next').disabled=true;msg('s2msg','','Setiap kolom punya nama tempat.');setKata('Baca tempat desimalnya.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.steps,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: pecahan ke persen ---- */
var R3=[
  {w:3,d:20,steps:[{t:'Agar penyebut 20 menjadi 100, dikali berapa?',o:['5','10','20'],b:'5',p:'20 × 5 = 100.'},{t:'Pembilang 3 juga dikali 5 menjadi...',o:['15','8','35'],b:'15',p:'3 × 5 = 15, jadi 3/20 = 15/100.'},{t:'15/100 sama dengan berapa persen?',o:['15%','3%','20%'],b:'15%',p:'15/100 = 15% = 0,15.'}],pct:150},
  {w:4,d:5,steps:[{t:'Agar penyebut 5 menjadi 100, dikali berapa?',o:['20','10','5'],b:'20',p:'5 × 20 = 100.'},{t:'Pembilang 4 juga dikali 20 menjadi...',o:['80','24','40'],b:'80',p:'4 × 20 = 80, jadi 4/5 = 80/100.'},{t:'80/100 sama dengan berapa persen?',o:['80%','4%','20%'],b:'80%',p:'80/100 = 80% = 0,8.'}],pct:800},
  {w:9,d:25,steps:[{t:'Agar penyebut 25 menjadi 100, dikali berapa?',o:['4','5','25'],b:'4',p:'25 × 4 = 100.'},{t:'Pembilang 9 juga dikali 4 menjadi...',o:['36','13','45'],b:'36',p:'9 × 4 = 36, jadi 9/25 = 36/100.'},{t:'36/100 sama dengan berapa persen?',o:['36%','9%','25%'],b:'36%',p:'36/100 = 36% = 0,36.'}],pct:360},
  {w:1,d:8,steps:[{t:'Penyebut 8 tidak habis untuk jadi 100. Hitung 1 : 8 =',o:['0,125','0,8','0,18'],b:'0,125',p:'1 : 8 = 0,125. (Bukan 0,18: menulis 1 dan 8 berdampingan salah.)'},{t:'0,125 sama dengan berapa persen?',o:['12,5%','8%','1,25%'],b:'12,5%',p:'0,125 = 12,5/100 = 12,5%. Persen tidak selalu bilangan bulat.'}],pct:125},
  {w:3,d:8,steps:[{t:'Hitung 3 : 8 =',o:['0,375','0,38','0,83'],b:'0,375',p:'3 : 8 = 0,375.'},{t:'0,375 sama dengan berapa persen?',o:['37,5%','3,75%','375%'],b:'37,5%',p:'0,375 = 37,5/100 = 37,5%.'}],pct:375}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  var t='Ubah '+pec(d.w,d.d)+' menjadi persen.';$('s3say').textContent=t;setKata(t);
  gambarDi('s3alat',{k:'pita',baris:[{n:d.d,w:d.w,l:pec(d.w,d.d)}]});
  $('s3next').disabled=true;msg('s3msg','','Persen berarti per seratus.');
  var last=d.steps[d.steps.length-1];
  last.lihat=function(){gambarDi('s3alat',{k:'pita',baris:[{n:d.d,w:d.w,l:pec(d.w,d.d)},{n:1000,w:d.pct,l:'%',warna:'kuning'}],sejajar:true})};
  ruteSteps('s3aksi','s3tanya','s3msg',d.steps,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: geser koma persen dan desimal ---- */
var R4=[{n:'5',dari:'persen',arah:-1},{n:'12',dari:'persen',arah:-1},{n:'0,6',dari:'desimal',arah:1},{n:'0,08',dari:'desimal',arah:1},{n:'0,75',dari:'desimal',arah:1}];
var r4=0,kom4=null;
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
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  kom4=lahirKoma(d.n);lukisKoma(kom4,$('s4kk'),false);
  var ke=d.dari==='persen'?'desimal':'persen';
  $('s4sat').textContent=d.n+(d.dari==='persen'?'%':'')+'  ('+d.dari+' → '+ke+')';
  var t=d.dari==='persen'?'Ubah '+d.n+'% menjadi desimal.':'Ubah '+d.n+' menjadi persen.';$('s4say').textContent=t;setKata(t);
  $('s4next').disabled=true;msg('s4msg','','Persen berarti per seratus: pindah dua tempat.');
  var kiri='dibagi 100 (koma 2 langkah ke kiri)',kanan='dikali 100 (koma 2 langkah ke kanan)',benar=d.arah<0?kiri:kanan;
  var opsi=[benar,d.arah<0?kanan:kiri,d.arah<0?'dibagi 10 (koma 1 langkah ke kiri)':'dikali 10 (koma 1 langkah ke kanan)'];
  $('s4tanya').textContent='Caranya...';
  pilihan($('s4aksi'),opsi,benar,function(){
    clear($('s4aksi'));$('s4tanya').textContent='';geser4(d);
  },3,function(){msg('s4msg','warn','Hampir! Persen = per seratus, jadi koma pindah dua tempat.')});
}
function geser4(d){
  var kk=kom4,k=2,arah=d.arah,i;
  if(arah>0){while(kk.d.length<kk.p+k){kk.d.push('0');kk.nol.push(true)}}
  else{while(kk.p-k<0){kk.d.unshift('0');kk.nol.unshift(true);kk.p++}}
  lukisKoma(kk,$('s4kk'),false);
  for(i=1;i<=k;i++){(function(i){later(function(){kk.p+=arah;lukisKoma(kk,$('s4kk'),true)},i*600)})(i)}
  later(function(){
    var res=hasilKoma(kk);kk.nol=kk.nol.map(function(){return false});lukisKoma(kk,$('s4kk'),false);
    var t=d.dari==='persen'?d.n+'% = '+res+'.':d.n+' = '+res+'%.';
    msg('s4msg','good',t);setKata(t);$('s4sat').textContent=t;$('s4next').disabled=false;
  },(k+1)*600);
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: urutkan bentuk berbeda ---- */
/* nilai per seribu: untuk panjang batang */
var R5=[
  {f:[['0,3',300],['1/4',250],['28%',280]],q:'urut'},
  {f:[['0,4',400],['3/8',375],['38%',380]],q:'urut'},
  {f:[['0,35',350],['3/10',300],['32%',320]],q:'urut'},
  {f:[['0,6',600],['5/8',625],['60%',600]],q:'besar'}
];
var r5=0,sama5=false;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);sama5=false;
  gambarDi('s5alat',{k:'pita',baris:d.f.map(function(x){return {n:2,w:0,l:x[0]}}),anim:false});
  $('s5next').disabled=true;clear($('s5aksi'));$('s5tanya').textContent='';
  var a=$('s5samakan');clear(a);a.className='aksi';tombol(a,'Samakan bentuk',samakan5,'utama hint');
  msg('s5msg','','Bentuknya berbeda-beda. Samakan dulu menjadi desimal.');setKata('Samakan bentuknya, lalu bandingkan.');
}
function samakan5(){
  if(sama5)return;sama5=true;
  var d=R5[r5];
  gambarDi('s5alat',{k:'pita',baris:d.f.map(function(x){return {n:1000,w:x[1],l:x[0]}}),sejajar:false});
  clear($('s5samakan'));
  msg('s5msg','',d.f.map(function(x){return x[0]+' = '+fmtId(x[1]/1000)}).join('; ')+'.');
  var steps;
  if(d.q==='urut'){
    var u=d.f.slice().sort(function(x,y){return x[1]-y[1]}),b=u.map(function(x){return x[0]}).join(', ');
    var o=[b,u.slice().reverse().map(function(x){return x[0]}).join(', '),[u[1],u[0],u[2]].map(function(x){return x[0]}).join(', ')];
    steps=[{t:'Urutkan dari yang TERKECIL ke TERBESAR.',o:o,b:b,p:'Dalam desimal: '+u.map(function(x){return fmtId(x[1]/1000)}).join(' < ')+'. Urutannya '+b+'.'}];
  }else{
    var mx=d.f.slice().sort(function(x,y){return y[1]-x[1]})[0][0];
    steps=[{t:'Manakah yang PALING BESAR?',o:d.f.map(function(x){return x[0]}),b:mx,p:'5/8 = 0,625, lebih besar daripada 0,6 dan 60% (keduanya 0,6).'}];
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
  var teks=n===3?'Kamu kenal tiga wajah satu nilai.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-20'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.seratus({p:25}));var c=el('div','baca','1/4 = 0,25 = 25%');w.appendChild(c);
})();

/* ---- bonus: mesin tiga wajah ---- */
function mulaiBonus(){$('bGeser').value='25';gambarBonus()}
function gambarBonus(){
  var p=+$('bGeser').value,g=fpb(p,100);
  gambarDi('bSeratus',{k:'seratus',p:p});
  $('bTanda').textContent=(p===0?'0':(100/g===1?String(p/g):pec(p/g,100/g)))+' = '+desDari(p)+' = '+p+'%';
  msg('bmsg',p===100?'good':'',p+' dari 100 petak berwarna: '+p+'/100 = '+desDari(p)+' = '+p+'%.');
}
$('bGeser').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC20 = rakit(DASAR, { kode: 'AC-20', data: DATA_AC20 })
