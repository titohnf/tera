import { rakit } from './bersama'
import { DATA_AC19 } from './latihan/ac19'

/**
 * Materi interaktif AC-19 "Garis Pecahan" (Representasi pecahan dari bagian
 * objek utuh; pecahan sejati, tidak murni, dan campuran, posisi pada garis
 * bilangan). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-19.
 * Disimpan sebagai string supaya ikut terbundel di build tanpa membaca berkas
 * saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-18 (anak kelas 5-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Bagian harus sama besar: pita dengan bagian sama besar dan tidak; hanya
 *    yang sama besar sah ditulis sebagai pecahan.
 * 2) Taruh di garis: geser titik pada garis bilangan sampai tepat di pecahan
 *    sasaran (3/4 pada 0 sampai 1; 5/4 pada 0 sampai 2; 3/2 pada 0 sampai 3).
 * 3) Dua bentuk satu nilai: campuran menjadi tidak murni (a x d + b) dan
 *    sebaliknya (bagi), dengan pita utuh yang dihitung potongannya.
 * 4) Dua benda dijumlah: bagian dari dua pizza sama besar digabung menjadi
 *    satu utuh dan sisanya (9/8 = 1 1/8).
 * 5) Nilai tiap bagian: garis 0 sampai m dibagi n bagian; tiap bagian m/n
 *    (bukan 1/n), lalu letak nilai campuran pada bagian ke-k.
 * Bonus: atur bilangan bulat, pembilang, dan penyebut; pita dan garis bilangan
 * menunjukkan dua bentuk yang sama.
 *
 * Soal Misi topik ini menguji: syarat bagian sama besar, posisi pada garis
 * bilangan, sejati, tidak murni, campuran, ubah dua arah, dua bentuk satu
 * nilai, menjumlah bagian dari dua objek, dan salah paham (tiap bagian 1/9
 * pada garis 0 sampai 3, bagian tidak perlu sama besar, 3 1/2 dan 7/2 berbeda).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac19.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, fpbG, wholes): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-19 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Garis Pecahan</title>
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
      <h1>Garis Pecahan</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo tempatkan pecahan di garis!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Bisakah ditulis sebagai pecahan?</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Taruh titik di pecahan yang tepat.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="baca" id="s2baca"></div>
      <input type="range" id="s2geser" min="0" max="4" value="0" aria-label="Geser titik"></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Dua bentuk, satu nilai.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Gabungkan dua pizza.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Berapa nilai tiap bagian?</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="alat" id="s5alat"></div></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: pengubah pecahan</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: atur pecahan campuran, lihat pita dan garisnya!</p>
    <div class="panel"><div class="alat" id="bPita"></div><div class="alat" id="bGaris"></div><div class="tanda" id="bTanda"></div></div>
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
  if(id==='intro')setKata('Ayo tempatkan pecahan di garis!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo tempatkan pecahan di garis!');

/* ---- alat bantu ---- */
function fpb(a,b){return b?fpb(b,a%b):a}
function pec(w,n){return w+'/'+n}
/* nilai p/q ditulis paling sederhana; bila lebih dari 1 juga sebagai campuran */
function tulisNilai(p,q){
  var g=fpb(p,q),a=p/g,b=q/g;
  if(b===1)return String(a);
  if(a>b)return pec(a,b)+' = '+Math.floor(a/b)+' '+(a%b)+'/'+b;
  return pec(a,b);
}
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
function barisUtuh(a,d,b){var r=[],i;for(i=0;i<a;i++)r.push({n:d,w:d,l:String(i+1),warna:['biru','kuning','hijau','merah'][i%4]});if(b>0)r.push({n:d,w:b,l:pec(b,d),warna:'ungu'});return r}

/* ---- stasiun 1: bagian harus sama besar ---- */
var R1=[
  {g:[{n:4,w:3}],sah:true,pec:[3,4]},
  {g:[{n:4,w:1,ukuran:[3,1,1,1]}],sah:false},
  {g:[{n:6,w:5}],sah:true,pec:[5,6]},
  {g:[{n:3,w:2,ukuran:[2,1,1]}],sah:false},
  {g:[{n:9,w:4,tebal:3}],sah:true,pec:[4,9],kat:'Persegi 3 × 3 dengan 4 kotak diarsir.'}
];
var r1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1];titik('s1dots',R1.length,r1);
  gambarDi('s1alat',{k:'pita',baris:d.g.map(function(x){var y={};for(var k in x)y[k]=x[k];y.l='?';return y})});
  $('s1next').disabled=true;msg('s1msg','',d.kat||'Perhatikan ukuran tiap bagian.');
  var ya='Ya, semua bagian sama besar',tdk='Tidak, ada bagian yang tidak sama besar',steps=[{t:'Bagian-bagian ini bisa dituliskan sebagai pecahan?',o:[ya,tdk],b:d.sah?ya:tdk,p:d.sah?'Semua bagian sama besar, jadi sah.':'Ada bagian yang lebih besar. Pecahan menuntut SEMUA bagian sama besar.'}];
  if(d.sah){var w=d.pec[0],n=d.pec[1];steps.push({t:'Pecahan bagian yang berwarna?',o:[pec(w,n),pec(n,w),pec(w,n-w)],b:pec(w,n),p:w+' bagian berwarna dari '+n+' bagian sama besar: '+pec(w,n)+'.'})}
  ruteSteps('s1aksi','s1tanya','s1msg',steps,0,function(){$('s1next').disabled=false});
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: taruh titik di garis ---- */
var R2=[
  {m:1,n:4,tw:3,tn:4},{m:1,n:5,tw:2,tn:5},{m:1,n:6,tw:5,tn:6},{m:2,n:8,tw:5,tn:4},{m:3,n:6,tw:3,tn:2}
];
var r2=0,sdh2=false,svg2=null;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);sdh2=false;
  var sl=$('s2geser');sl.min='0';sl.max=String(d.n);sl.step='1';sl.value='0';sl.disabled=false;
  var t='Taruh titik P di '+pec(d.tw,d.tn)+' pada garis 0 sampai '+d.m+'.';
  $('s2say').textContent=t;setKata(t);
  var w=$('s2alat');clear(w);svg2=GBR.garispec({m:d.m,n:d.n,titik:[{k:0,l:'P'}],nomor:true});w.appendChild(svg2);
  bacaS2(0);$('s2next').disabled=true;
  msg('s2msg','','Garis dibagi '+d.n+' bagian sama panjang. Tiap bagian bernilai '+tulisNilai(d.m,d.n)+'. Geser titik P.');
}
function bacaS2(k){
  var d=R2[r2];
  $('s2baca').textContent=k===0?'P di 0':'Bagian ke-'+k+': '+k+' × '+tulisNilai(d.m,d.n).split(' = ')[0]+' = '+tulisNilai(k*d.m,d.n);
}
$('s2geser').oninput=function(){
  if(sdh2)return;var d=R2[r2],k=+$('s2geser').value;
  svg2._ke(k);bacaS2(k);
  if(k*d.m*d.tn===d.tw*d.n){
    sdh2=true;$('s2geser').disabled=true;
    var t='Tepat! P di bagian ke-'+k+', yaitu '+pec(d.tw,d.tn)+'.';msg('s2msg','good',t);setKata(t);$('s2next').disabled=false;
  }
};
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: campuran dan tidak murni ---- */
var R3=[
  {a:4,b:2,d:3,steps:[{t:'Satu utuh berisi berapa potongan sepertiga?',o:['3','4','2'],b:'3',p:'Satu utuh = 3 potongan sepertiga.'},{t:'Berapa potongan sepertiga seluruhnya (4 utuh + 2 potongan)?',o:['14','11','12'],b:'14',p:'4 × 3 = 12, lalu 12 + 2 = 14. Jadi 4 2/3 = 14/3.'}]},
  {a:1,b:2,d:5,steps:[{t:'Satu utuh berisi berapa potongan seperlima?',o:['5','4','2'],b:'5',p:'Satu utuh = 5 potongan seperlima.'},{t:'Berapa potongan seperlima seluruhnya?',o:['7','3','10'],b:'7',p:'1 × 5 = 5, lalu 5 + 2 = 7. Jadi 1 2/5 = 7/5.'}]},
  {a:3,b:2,d:5,steps:[{t:'Satu utuh berisi berapa potongan seperlima?',o:['5','3','2'],b:'5',p:'Satu utuh = 5 potongan seperlima.'},{t:'Berapa potongan seperlima seluruhnya?',o:['17','15','10'],b:'17',p:'3 × 5 = 15, lalu 15 + 2 = 17. Jadi 3 2/5 = 17/5.'}]},
  {a:2,b:3,d:4,balik:true,steps:[{t:'11/4 berisi berapa utuh penuh? (11 : 4)',o:['2','3','1'],b:'2',p:'4 potongan = 1 utuh. 11 potongan cukup untuk 2 utuh.'},{t:'Berapa potongan yang tersisa?',o:['3','2','4'],b:'3',p:'11 − 8 = 3 sisa. Jadi 11/4 = 2 3/4.'}]},
  {a:3,b:2,d:5,balik:true,steps:[{t:'17/5 berisi berapa utuh penuh? (17 : 5)',o:['3','2','4'],b:'3',p:'3 utuh memakai 15 potongan.'},{t:'Berapa potongan yang tersisa?',o:['2','3','1'],b:'2',p:'17 − 15 = 2 sisa. Jadi 17/5 = 3 2/5.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  var kiri=d.balik?pec(d.a*d.d+d.b,d.d):d.a+' '+pec(d.b,d.d),t=d.balik?'Ubah '+kiri+' menjadi pecahan campuran.':'Ubah '+kiri+' menjadi pecahan tidak murni.';
  $('s3say').textContent=t;setKata(t);
  gambarDi('s3alat',{k:'pita',baris:barisUtuh(d.a,d.d,d.b)});
  $('s3next').disabled=true;msg('s3msg','','Setiap pita utuh dipotong menjadi '+d.d+' bagian sama besar.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.steps,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: dua pizza ---- */
var R4=[{a:5,b:4,d:8},{a:4,b:3,d:5},{a:5,b:5,d:7}];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4],tot=d.a+d.b,sisa=tot-d.d;titik('s4dots',R4.length,r4);
  var t='Dua pizza sama besar. Dimakan '+pec(d.a,d.d)+' dan '+pec(d.b,d.d)+'. Berapa totalnya?';
  $('s4say').textContent=t;setKata(t);
  gambarDi('s4alat',{k:'pita',baris:[{n:d.d,w:d.a,l:'pizza 1'},{n:d.d,w:d.b,l:'pizza 2',warna:'kuning'}]});
  $('s4next').disabled=true;msg('s4msg','','Tiap potong bernilai 1/'+d.d+'.');
  var steps=[
    {t:'Berapa potong yang dimakan seluruhnya?',o:[String(tot),String(d.d),String(d.a*d.b)],b:String(tot),p:d.a+' + '+d.b+' = '+tot+' potong. Total '+pec(tot,d.d)+'.',lihat:function(){gambarDi('s4alat',{k:'pita',baris:barisUtuh(1,d.d,0).concat([{n:d.d,w:sisa,l:'sisa',warna:'ungu'}])})}},
    {t:'Tuliskan sebagai pecahan campuran.',o:['1 '+pec(sisa,d.d),pec(tot,d.d*2),'2 '+pec(sisa,d.d)],b:'1 '+pec(sisa,d.d),p:'Satu pizza penuh ('+d.d+' potong) dan sisa '+sisa+' potong: '+pec(tot,d.d)+' = 1 '+pec(sisa,d.d)+'.'}
  ];
  ruteSteps('s4aksi','s4tanya','s4msg',steps,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: nilai tiap bagian ---- */
var R5=[
  {m:2,n:8,k:5,steps:[{t:'Garis 0 sampai 2 dibagi 8 bagian sama panjang. Tiap bagian bernilai...',o:['1/4','1/8','1/2'],b:'1/4',p:'4 bagian membentuk 1 utuh, jadi tiap bagian 1/4 (2/8).'},{t:'Nilai 1 1/4 berada di bagian ke berapa?',o:['5','4','6'],b:'5',p:'1 1/4 = 5/4 = 5 bagian.'}]},
  {m:3,n:9,k:7,steps:[{t:'Rian bilang tiap bagian bernilai 1/9. Menurutmu tiap bagian bernilai...',o:['1/3','1/9','1/6'],b:'1/3',p:'Garisnya sampai 3, bukan sampai 1. 3 bagian = 1 utuh, jadi tiap bagian 1/3.'},{t:'Nilai 7/3 (bagian ke-7) berada di antara bilangan bulat...',o:['2 dan 3','1 dan 2','3 dan 4'],b:'2 dan 3',p:'7/3 = 2 1/3, di antara 2 dan 3.'}]},
  {m:3,n:6,k:3,steps:[{t:'Garis 0 sampai 3 dibagi 6 bagian sama panjang. Tiap bagian bernilai...',o:['1/2','1/6','1/3'],b:'1/2',p:'2 bagian = 1 utuh, jadi tiap bagian 1/2.'},{t:'Nilai 3/2 berada di bagian ke berapa?',o:['3','2','6'],b:'3',p:'3/2 = 3 bagian setengah.'}]},
  {m:3,n:12,k:9,steps:[{t:'Garis 0 sampai 3 dibagi 12 bagian sama panjang. Tiap bagian bernilai...',o:['1/4','1/12','1/3'],b:'1/4',p:'4 bagian = 1 utuh, jadi tiap bagian 1/4.'},{t:'Nilai 2 1/4 berada di bagian ke berapa?',o:['9','8','10'],b:'9',p:'2 1/4 = 9/4, yaitu 9 bagian.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  gambarDi('s5alat',{k:'garispec',m:d.m,n:d.n,nomor:true});
  $('s5next').disabled=true;msg('s5msg','','Hitung: berapa bagian untuk membentuk 1 utuh?');setKata('Berapa nilai tiap bagian?');
  d.steps[1].lihat=function(){gambarDi('s5alat',{k:'garispec',m:d.m,n:d.n,titik:[{k:d.k,l:'P'}],nomor:true})};
  ruteSteps('s5aksi','s5tanya','s5msg',d.steps,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu jago membaca pecahan di garis.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-19'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.appendChild(GBR.pita({baris:[{n:4,w:3,l:'3/4'}]}));w.appendChild(GBR.garispec({m:1,n:4,titik:[{k:3,l:'3/4'}],nomor:true}));
})();

/* ---- bonus: pengubah pecahan ---- */
var bS={a:2,b:1,d:4};
function mulaiBonus(){bS={a:2,b:1,d:4};gambarBonus()}
function gambarBonus(){
  var a=bS.a,b=bS.b,d=bS.d,p=a*d+b;
  gambarDi('bPita',{k:'pita',baris:barisUtuh(a,d,b).length?barisUtuh(a,d,b):[{n:d,w:0,l:'0'}],anim:false});
  var m=Math.max(1,a+(b>0?1:0));
  gambarDi('bGaris',{k:'garispec',m:m,n:m*d,titik:[{k:p,l:p+'/'+d}],nomor:m*d<=16});
  $('bTanda').textContent=(a>0&&b>0?a+' '+pec(b,d):(a>0?String(a):(b>0?pec(b,d):'0')))+' = '+(p>0?pec(p,d):'0');
  msg('bmsg','good',p>0?(b>0?a+' utuh dan '+b+' potong '+d+'an: ('+a+' × '+d+') + '+b+' = '+p+' potong, jadi '+pec(p,d)+'.':a+' utuh = '+pec(p,d)+'.'):'Mulai dengan menambah bilangan.');
  var c=$('bKontrol');clear(c);
  [['bulat','a',0,4],['pembilang','b',0,d-1],['penyebut','d',2,8]].forEach(function(x){
    var r=el('div');r.appendChild(el('span',null,x[0]));
    var mi=el('button',null,'−'),pl=el('button',null,'+');
    mi.onclick=function(){bS[x[1]]=Math.max(x[2],bS[x[1]]-1);if(bS.b>bS.d-1)bS.b=bS.d-1;gambarBonus()};
    pl.onclick=function(){bS[x[1]]=Math.min(x[3],bS[x[1]]+1);if(bS.b>bS.d-1)bS.b=bS.d-1;gambarBonus()};
    r.appendChild(mi);r.appendChild(el('b',null,String(bS[x[1]])));r.appendChild(pl);c.appendChild(r);
  });
}
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC19 = rakit(DASAR, { kode: 'AC-19', data: DATA_AC19 })
