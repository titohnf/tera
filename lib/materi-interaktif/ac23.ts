import { rakit } from './bersama'
import { DATA_AC23 } from './latihan/ac23'

/**
 * Materi interaktif AC-23 "Bulat Bertemu Pecahan" (pecahan campuran dan
 * operasi bilangan bulat dengan pecahan). Satu halaman HTML mandiri,
 * ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah
 * Belajar di topik Misi AC-23. Disimpan sebagai string supaya ikut terbundel di
 * build tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-22 (anak kelas 5-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Campuran ke pecahan biasa: (bulat x penyebut) + pembilang, penyebut tetap;
 *    bagian bulat tidak boleh dibuang (2 1/3 bukan 2/3).
 * 2) Pecahan biasa ke campuran: bagi pembilang dengan penyebut, sisa menjadi
 *    pembilang (9/4 = 2 1/4, bukan 4 1/4); bilangan bulat = n/1.
 * 3) Bulat x pecahan: hanya pembilang dikali (2 x 3/5 = 6/5, bukan 6/10);
 *    pecahan kurang dari 1 memberi hasil lebih kecil.
 * 4) Bulat : pecahan: kerjakan dengan menghitung potongan (6 : 1/2 = 12);
 *    10 : 1/5 = 50, bukan 2; hasil lebih besar dari bilangan bulatnya.
 * 5) Tambah dan kurang: pinjam satu utuh (5 - 2 3/4 = 2 1/4, bukan 3 3/4);
 *    2 + 3/4 = 2 3/4, bukan 5/4.
 * Bonus: geser pembilang dan penyebut, lihat bentuk biasa dan campurannya.
 *
 * Soal Misi topik ini menguji: istilah (campuran, tidak wajar, bagian bulat),
 * ubah antarbentuk, kali, bagi, tambah dan kurang bulat dengan pecahan, soal
 * cerita (gelas jus, tali, kain, tepung), sifat (kali komutatif, bagi tidak),
 * dan salah paham di atas.
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac23.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-23 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bulat Bertemu Pecahan</title>
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
.kg{display:flex;flex-direction:column;gap:4px;align-items:center;font-family:var(--display);font-weight:800;font-size:1.8rem;min-height:150px;justify-content:center}
.kg .rw{display:flex;gap:6px;justify-content:center;align-items:center}
.kg .c{min-width:2.1em;text-align:center;border-radius:8px;padding:2px 0;font-variant-numeric:tabular-nums;transition:background .3s}
.kg .c.pj{background:var(--soft);color:var(--ikat)}
.kg .c.hs{background:var(--ok);color:#fff;animation:pop .35s}
.kg .gr{height:3px;background:var(--ink);width:100%}
.kg .op{min-width:1.2em;text-align:center;color:var(--muted)}
.tanda{font-family:var(--display);font-weight:800;font-size:1.1rem;text-align:center;line-height:1.8;min-height:3em}
.tanda b{color:var(--ikat)}
.tmp{display:flex;gap:6px;justify-content:center}
.tmp button{border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:12px;padding:6px 12px;font-family:var(--display);font-weight:800;font-size:1rem;cursor:pointer;touch-action:manipulation;min-height:44px}
.tmp button.pilih{border-color:var(--ikat);background:var(--soft)}
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
      <h1>Bulat Bertemu Pecahan</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo kerjakan pecahan campuran dan bilangan bulat!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Ubah campuran menjadi pecahan biasa.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Ubah pecahan biasa menjadi campuran.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Kalikan bilangan bulat dengan pecahan.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Bagi bilangan bulat dengan pecahan.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Tambah dan kurang dengan pecahan.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="alat" id="s5alat"></div><div class="tanda" id="s5tampil"></div></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin campuran</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: geser pembilang dan penyebut.</p>
    <div class="panel"><div class="baca" id="bNilaiA"></div><input type="range" id="bA" min="1" max="30" value="11" aria-label="Pembilang">
      <div class="baca" id="bNilaiB"></div><input type="range" id="bB" min="2" max="6" value="4" aria-label="Penyebut"><div class="alat" id="bGambar"></div></div>
    <div class="tanda" id="bTanda"></div>
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
  if(id==='intro')setKata('Ayo kerjakan pecahan campuran dan bilangan bulat!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo kerjakan pecahan campuran dan bilangan bulat!');

/* ---- alat bantu ---- */
function uniq(benar,calon){var o=[String(benar)];calon.forEach(function(x){x=String(x);if(o.length<3&&o.indexOf(x)<0)o.push(x)});var t=1;while(o.length<3){var y=String(+benar+t++);if(o.indexOf(y)<0)o.push(y)}return o}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(s.lihat)s.lihat();
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Lihat gambarnya dan hitung lagi.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
function pec(w,d){return w+'/'+d}
function camp(q,w,d){return q>0?(w>0?q+' '+w+'/'+d:String(q)):w+'/'+d}
function utuhan(total,d){
  var rows=[],sisa=total,i=0;
  while(sisa>0){var w=Math.min(d,sisa);rows.push({n:d,w:w,l:sisa>=d?String(i+1):pec(w,d),warna:sisa>=d?'biru':'hijau'});sisa-=w;i++}
  return rows;
}
function gbUtuhan(id,total,d){if(total>0)gambarDi(id,{k:'pita',baris:utuhan(total,d)});else clear($(id))}

/* ---- stasiun 1: campuran ke pecahan biasa ---- */
var R1=[{a:2,b:1,d:3},{a:1,b:1,d:2},{a:3,b:1,d:4},{a:2,b:3,d:4}];
var r1=0;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1],ad=d.a*d.d,tot=ad+d.b,cm=d.a+' '+d.b+'/'+d.d;titik('s1dots',R1.length,r1);
  var t='Ubah '+cm+' menjadi pecahan biasa.';$('s1say').textContent=t;setKata(t);
  gbUtuhan('s1alat',d.a*d.d,d.d);gambarDi('s1alat',{k:'pita',baris:utuhan(ad,d.d).concat([{n:d.d,w:d.b,l:pec(d.b,d.d),warna:'hijau'}])});
  barisTeks('s1tampil',[cm+' = '+d.a+' utuh + '+pec(d.b,d.d)]);
  var st=[
    {t:'Tiap utuh dibagi '+d.d+' bagian. Ada '+d.a+' utuh. Berapa bagian di bagian utuh? ('+d.a+' × '+d.d+')',o:uniq(ad,[d.a+d.d,ad+d.b]),b:String(ad),p:d.a+' × '+d.d+' = '+ad+' bagian.',lihat:function(){barisTeks('s1tampil',[cm,d.a+' × '+d.d+' = '+ad])}},
    {t:'Tambahkan '+d.b+' bagian dari pecahan. Jumlah bagian seluruhnya?',o:uniq(tot,[ad,d.a+d.b]),b:String(tot),p:ad+' + '+d.b+' = '+tot+' bagian.',lihat:function(){barisTeks('s1tampil',[cm,d.a+' × '+d.d+' = '+ad,ad+' + '+d.b+' = '+tot])}},
    {t:'Pecahan biasa dari '+cm+' adalah...',o:uniq(pec(tot,d.d),[pec(d.b,d.d),pec(d.a+d.b,d.d)]),b:pec(tot,d.d),p:cm+' = '+pec(tot,d.d)+'. Bagian bulat tidak boleh dibuang.',lihat:function(){gbUtuhan('s1alat',tot,d.d);barisTeks('s1tampil',[cm+' = '+pec(tot,d.d)])}}
  ];
  if(r1===1)st.push({t:'Pada pecahan biasa itu, penyebutnya...',o:['tetap '+d.d+', sama dengan penyebut awal','menjadi '+(d.a*d.d)],b:'tetap '+d.d+', sama dengan penyebut awal',p:'Ukuran tiap bagian tidak berubah, hanya jumlahnya.'});
  $('s1next').disabled=true;clear($('s1aksi'));msg('s1msg','','Hitung dulu semua bagian sebesar 1/'+d.d+'.');
  ruteSteps('s1aksi','s1tanya','s1msg',st,0,function(){$('s1next').disabled=false});
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: pecahan biasa ke campuran ---- */
var R2=[{n:7,d:2},{n:9,d:4},{n:11,d:4},{n:17,d:5,x:{t:'Bilangan bulat 6 dapat ditulis sebagai pecahan...',o:['6/1','1/6','0/6'],b:'6/1',p:'Setiap bilangan bulat sama dengan dirinya dibagi 1.'}}];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2],q=Math.floor(d.n/d.d),s=d.n%d.d,pc=pec(d.n,d.d);titik('s2dots',R2.length,r2);
  var t='Ubah '+pc+' menjadi pecahan campuran.';$('s2say').textContent=t;setKata(t);
  gbUtuhan('s2alat',d.n,d.d);barisTeks('s2tampil',[pc+' = '+d.n+' bagian sebesar 1/'+d.d]);
  var st=[
    {t:'Hitung '+d.n+' : '+d.d+'.',o:uniq(q+' sisa '+s,[d.d+' sisa '+s,s+' sisa '+q]),b:q+' sisa '+s,p:d.d+' × '+q+' = '+(d.d*q)+', sisanya '+s+'.',lihat:function(){barisTeks('s2tampil',[pc,d.n+' : '+d.d+' = '+q+' sisa '+s])}},
    {t:'Hasil bagi menjadi bilangan bulat, sisa menjadi pembilang. Pecahan campurannya...',o:uniq(camp(q,s,d.d),[d.d+' '+s+'/'+d.d,q+' '+s+'/'+q]),b:camp(q,s,d.d),p:pc+' = '+camp(q,s,d.d)+'. Penyebutnya tetap '+d.d+'.',lihat:function(){barisTeks('s2tampil',[pc+' = '+camp(q,s,d.d)])}}
  ];
  if(d.x)st.push(d.x);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Satu utuh berisi '+d.d+' bagian. Berapa utuh yang terbentuk?');
  ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: bulat x pecahan ---- */
var R3=[
  {k:3,w:1,d:4},{k:2,w:3,d:5},{k:5,w:2,d:5},
  {k:9,w:2,d:3,x:{t:'Hasilnya 6, lebih kecil daripada 9. Mengapa?',o:['Karena 2/3 kurang dari 1, jadi kita hanya mengambil sebagian dari 9','Karena perkalian selalu membuat bilangan lebih besar'],b:'Karena 2/3 kurang dari 1, jadi kita hanya mengambil sebagian dari 9',p:'Bilangan dikali pecahan kurang dari 1 menjadi lebih kecil.'}}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3],p=d.k*d.w,pc=pec(d.w,d.d),utuh=p%d.d===0,hasil=utuh?String(p/d.d):pec(p,d.d);titik('s3dots',R3.length,r3);
  var t='Hitung '+d.k+' × '+pc+'.';$('s3say').textContent=t;setKata(t);
  gambarDi('s3alat',{k:'pita',baris:[{n:d.d,w:d.w,l:pc}]});barisTeks('s3tampil',[d.k+' kelompok, tiap kelompok '+pc]);
  var st=[
    {t:'Ada '+d.k+' kelompok '+pc+'. Berapa pembilang baru ('+d.k+' × '+d.w+')?',o:uniq(p,[d.k+d.w,p*d.d]),b:String(p),p:d.k+' × '+d.w+' = '+p+' bagian.',lihat:function(){barisTeks('s3tampil',[d.k+' × '+pc,'pembilang: '+d.k+' × '+d.w+' = '+p])}},
    {t:'Dan penyebutnya...',o:['tetap '+d.d,'ikut dikali '+d.k+' menjadi '+(d.k*d.d)],b:'tetap '+d.d,p:'Ukuran bagiannya tetap 1/'+d.d+'. Hanya banyaknya yang bertambah.'},
    {t:d.k+' × '+pc+' = ?',o:uniq(hasil,utuh?[p,pec(d.k+d.w,d.d)]:[pec(p,d.k*d.d),pec(d.k+d.w,d.d)]),b:hasil,p:d.k+' × '+pc+' = '+pec(p,d.d)+(utuh?' = '+hasil:(p>d.d?' = '+camp(Math.floor(p/d.d),p%d.d,d.d):''))+'.',lihat:function(){gbUtuhan('s3alat',p,d.d);barisTeks('s3tampil',[d.k+' × '+pc+' = '+pec(p,d.d)+(utuh?' = '+hasil:'')])}}
  ];
  if(d.x)st.push(d.x);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Hitung pembilangnya saja, bagiannya tetap sama besar.');
  ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: bulat : pecahan ---- */
var R4=[{k:6,d:2},{k:8,d:4},{k:4,d:2,cerita:true},{k:10,d:5,made:true}];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4],h=d.k*d.d,pc=pec(1,d.d);titik('s4dots',R4.length,r4);
  var t=d.cerita?'Ada 4 liter jus. Tiap gelas berisi 1/2 liter. Berapa gelas?':'Hitung '+d.k+' : '+pc+'.';$('s4say').textContent=t;setKata(t);
  gambarDi('s4alat',{k:'pita',baris:[{n:d.d,w:d.d,l:'1 utuh'}]});barisTeks('s4tampil',['Satu utuh dibagi menjadi '+d.d+' bagian sebesar '+pc]);
  var st=[
    {t:'Dalam 1 utuh ada berapa potong sebesar '+pc+'?',o:uniq(d.d,[1,d.d+1]),b:String(d.d),p:'Dalam 1 utuh ada '+d.d+' potong '+pc+'.',lihat:function(){barisTeks('s4tampil',['1 utuh = '+d.d+' potong '+pc])}},
    {t:'Dalam '+d.k+' utuh ada berapa potong '+pc+'?',o:uniq(h,[d.k+d.d,Math.round(d.k/d.d)+1]),b:String(h),p:d.k+' × '+d.d+' = '+h+'. Jadi '+d.k+' : '+pc+' = '+h+'.',lihat:function(){barisTeks('s4tampil',[d.k+' × '+d.d+' = '+h+' potong','Jadi '+d.k+' : '+pc+' = '+h])}}
  ];
  if(d.made)st.push({t:'Made mengira '+d.k+' : '+pc+' sama dengan '+d.k+' : '+d.d+' = '+(d.k/d.d)+'. Tepatkah?',o:['Tidak. Membagi dengan '+pc+' sama dengan mengalikan dengan '+d.d,'Ya, sama saja'],b:'Tidak. Membagi dengan '+pc+' sama dengan mengalikan dengan '+d.d,p:d.k+' : '+pc+' = '+d.k+' × '+d.d+' = '+h+', bukan '+(d.k/d.d)+'.'});
  else st.push({t:'Hasil '+h+' lebih besar atau lebih kecil daripada '+d.k+'?',o:['lebih besar daripada '+d.k,'lebih kecil daripada '+d.k],b:'lebih besar daripada '+d.k,p:'Membagi dengan pecahan yang kurang dari 1 menghasilkan bilangan yang lebih besar.'});
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Hitung ada berapa potongan kecil dalam semua utuh.');
  ruteSteps('s4aksi','s4tanya','s4msg',st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: tambah dan kurang ---- */
var R5=[{a:4,m:0,w:1,d:3},{a:5,m:2,w:3,d:4},{a:3,m:1,w:3,d:4},{tambah:true,a:3,w:1,d:4}];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5],pc=pec(d.w,d.d),st;titik('s5dots',R5.length,r5);
  if(d.tambah){
    var tt=d.a+' + '+pc;$('s5say').textContent='Hitung '+tt+'.';setKata('Hitung '+tt+'.');
    gbUtuhan('s5alat',d.a*d.d+d.w,d.d);barisTeks('s5tampil',[tt+' = ?']);
    st=[
      {t:'Rian menulis '+tt+' = ('+d.a+' + '+d.w+')/'+d.d+' = '+pec(d.a+d.w,d.d)+'. Tepatkah?',o:['Tidak. Bilangan bulat tidak dijumlahkan ke pembilang','Ya, tepat'],b:'Tidak. Bilangan bulat tidak dijumlahkan ke pembilang',p:'Bilangan bulat dan pecahan hanya digabung: '+d.a+' utuh dan '+pc+'.'},
      {t:tt+' = ?',o:uniq(camp(d.a,d.w,d.d),[pec(d.a+d.w,d.d),pec(d.a*d.d+d.w+d.d,d.d)]),b:camp(d.a,d.w,d.d),p:tt+' = '+camp(d.a,d.w,d.d)+'.',lihat:function(){barisTeks('s5tampil',[tt+' = '+camp(d.a,d.w,d.d)])}}
    ];
  }else{
    var m=d.m,q=d.a-m-1,r=d.d-d.w,cm=m>0?m+' '+pc:pc,tt2=d.a+' − '+cm;
    $('s5say').textContent='Hitung '+tt2+'.';setKata('Hitung '+tt2+'.');
    gbUtuhan('s5alat',d.a*d.d,d.d);barisTeks('s5tampil',[tt2+' = ?']);
    st=[
      {t:pc+' tidak bisa dikurangkan dari 0 bagian. Pinjam 1 utuh dari '+d.a+'. Bentuknya menjadi...',o:uniq((d.a-1)+' '+d.d+'/'+d.d,[d.a+' '+d.d+'/'+d.d,(d.a-1)+' 1/'+d.d]),b:(d.a-1)+' '+d.d+'/'+d.d,p:'1 utuh = '+d.d+'/'+d.d+', jadi '+d.a+' = '+(d.a-1)+' '+d.d+'/'+d.d+'.',lihat:function(){barisTeks('s5tampil',[d.a+' = '+(d.a-1)+' '+d.d+'/'+d.d])}},
      {t:(d.a-1)+' '+d.d+'/'+d.d+' − '+cm+' = ?',o:uniq(camp(q,r,d.d),[(d.a-m)+' '+d.w+'/'+d.d,camp(q,d.w,d.d)]),b:camp(q,r,d.d),p:tt2+' = '+camp(q,r,d.d)+'.'+(m>0?' Jawaban '+(d.a-m)+' '+pc+' muncul bila tidak meminjam.':''),lihat:function(){barisTeks('s5tampil',[tt2+' = '+camp(q,r,d.d)]);gbUtuhan('s5alat',q*d.d+r,d.d)}}
    ];
    if(m===0)st.push({t:'Nyatakan '+camp(q,r,d.d)+' sebagai pecahan biasa.',o:uniq(pec(q*d.d+r,d.d),[pec(r,d.d),pec(q+r,d.d)]),b:pec(q*d.d+r,d.d),p:'('+q+' × '+d.d+') + '+r+' = '+(q*d.d+r)+', jadi '+pec(q*d.d+r,d.d)+'.'});
  }
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','',d.tambah?'Bilangan bulat dan pecahan hanya digabung.':'Pinjam 1 utuh bila pecahannya tidak cukup.');
  ruteSteps('s5aksi','s5tanya','s5msg',st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Bulat dan pecahan sudah akrab.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-23'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.pita({baris:[{n:4,w:4,l:'1'},{n:4,w:4,l:'2'},{n:4,w:1,l:'1/4',warna:'hijau'}]}));w.appendChild(el('div','baca','2 1/4 = 9/4'));
})();

/* ---- bonus: mesin campuran ---- */
function mulaiBonus(){$('bA').value='11';$('bB').value='4';gambarBonus()}
function gambarBonus(){
  var n=+$('bA').value,d=+$('bB').value,q=Math.floor(n/d),s=n%d,pc=pec(n,d);
  $('bNilaiA').textContent='Pembilang: '+n;$('bNilaiB').textContent='Penyebut: '+d;
  gbUtuhan('bGambar',n,d);
  var t=n<d?pc+' adalah pecahan biasa (pembilang kurang dari penyebut).':(s===0?pc+' = '+q+' (bilangan bulat).':pc+' = '+q+' '+s+'/'+d+' (pecahan campuran).');
  $('bTanda').textContent=t;
  msg('bmsg',s===0&&n>=d?'good':'',n>=d?n+' : '+d+' = '+q+' sisa '+s+'.':'Belum cukup untuk 1 utuh.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC23 = rakit(DASAR, { kode: 'AC-23', data: DATA_AC23 })
