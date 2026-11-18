import { rakit } from './bersama'
import { DATA_AC24 } from './latihan/ac24'

/**
 * Materi interaktif AC-24 "Neraca Persamaan" (persamaan satu langkah dan
 * operasi kebalikan). Satu halaman HTML mandiri, ditampilkan lewat iframe
 * sandbox di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi
 * AC-24. Disimpan sebagai string supaya ikut terbundel di build tanpa membaca
 * berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-23 (anak kelas 4-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Neraca: ambil jumlah yang sama dari kedua sisi (n + 7 = 15) atau bagi
 *    sama banyak (3 x n = 21); neraca tetap seimbang.
 * 2) Operasi kebalikan: penjumlahan lawannya pengurangan, kali lawannya bagi;
 *    n - 3 = 9 jadi n = 9 + 3, n : 5 = 3 jadi n = 3 x 5 (bukan 0,6).
 * 3) Dari cerita ke persamaan: dikurangi (n - 5 = 12, bukan n + 5), ditambah,
 *    harga satuan, dibagi rata; lalu cari n.
 * 4) Periksa dan rancang: substitusi nilai n kembali; pilih persamaan yang n-nya
 *    6; cari b atau a agar n tertentu menjadi solusi.
 * 5) Neraca tetap seimbang? Tambah atau kali kedua sisi seimbang, satu sisi
 *    saja miring; menukar ruas tidak mengubah n.
 * Bonus: pilih n, a, dan jenis operasi; lihat persamaan dan cara
 * menyelesaikannya.
 *
 * Soal Misi topik ini menguji: istilah (persamaan, variabel, kotak), operasi
 * kebalikan keempat operasi, cerita ke persamaan, cerita (kelereng, tangki,
 * pensil, uang), memeriksa dengan substitusi, rancang persamaan, sifat
 * kesetaraan, dan salah paham (n + 5 = 12 dijumlah jadi 17, 4 x n = 20 jadi 80,
 * n : 5 = 3 jadi 0,6, semua persamaan dikurangi, makin besar a makin besar n).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac24.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-24 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Neraca Persamaan</title>
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
.mesin{display:flex;align-items:center;justify-content:center;gap:8px;font-family:var(--display);font-weight:800;font-size:1.6rem;min-height:70px}
.mesin .kt{min-width:54px;height:54px;border-radius:12px;border:3px solid var(--ink);display:flex;align-items:center;justify-content:center;background:var(--card)}
.mesin .ar{display:flex;flex-direction:column;align-items:center;font-size:1rem;color:var(--muted);min-width:76px}
.mesin .ar.balik{color:var(--ok);animation:pop .4s}
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
      <h1>Neraca Persamaan</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo cari nilai n yang membuat neraca seimbang!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Cari n dengan neraca.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div></div>
    <div class="aksi" id="s1mulai"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Pakai operasi kebalikan.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="mesin" id="s2mesin"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Ubah cerita menjadi persamaan.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Periksa dan rancang persamaan.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="tanda" id="s4tampil"></div><div class="fak" id="s4chip"></div></div>
    <div class="aksi" id="s4periksa"></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Seimbang atau miring?</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="alat" id="s5alat"></div><div class="tanda" id="s5tampil"></div></div>
    <div class="aksi" id="s5mulai"></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin persamaan</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: atur n, a, dan jenis operasi.</p>
    <div class="panel"><div class="baca" id="bNilaiA"></div><input type="range" id="bA" min="1" max="12" value="7" aria-label="Nilai n">
      <div class="baca" id="bNilaiB"></div><input type="range" id="bB" min="2" max="9" value="3" aria-label="Nilai a"><div class="tmp" id="bOp"></div></div>
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
  if(id==='intro')setKata('Ayo cari nilai n yang membuat neraca seimbang!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo cari nilai n yang membuat neraca seimbang!');

/* ---- alat bantu ---- */
function ribu(n){return titikRibu(n)}
function uniq(benar,calon){var o=[String(benar)];calon.forEach(function(x){x=String(x);if(o.length<3&&o.indexOf(x)<0)o.push(x)});var t=1;while(o.length<3){var y=String(+benar+t++);if(o.indexOf(y)<0)o.push(y)}return o}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(s.lihat)s.lihat();
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Pikirkan lagi, boleh lihat gambarnya.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}

/* ---- stasiun 1: neraca ---- */
var R1=[{t:'+',a:4,b:10},{t:'+',a:7,b:15,x:true},{t:'x',a:3,b:21}];
var r1=0,jalan1=false;
function mulaiS1(){r1=0;ronde1()}
function neraca1(d,ku,kn,kel){
  if(d.t==='+')gambarDi('s1alat',{k:'setara',kb:1,ku:ku,kn:kn});
  else gambarDi('s1alat',{k:'setara',kb:d.a,kn:d.b,kel:kel||0,sorot:!!kel});
}
function ronde1(){
  var d=R1[r1],eq=d.t==='+'?'n + '+d.a+' = '+d.b:d.a+' × n = '+d.b;titik('s1dots',R1.length,r1);jalan1=false;
  var t='Cari n pada '+eq+'.';$('s1say').textContent=t;setKata(t);
  neraca1(d,d.a,d.b);barisTeks('s1tampil',[eq]);
  clear($('s1aksi'));$('s1tanya').textContent='';$('s1next').disabled=true;
  var a=$('s1mulai');clear(a);a.className='aksi';
  tombol(a,d.t==='+'?'Ambil '+d.a+' dari kedua sisi':'Bagi menjadi '+d.a+' kelompok sama banyak',lakukan1,'utama hint');
  msg('s1msg','','Kotak n menyembunyikan sebuah bilangan. Neraca sedang seimbang.');
}
function lakukan1(){
  if(jalan1)return;jalan1=true;clear($('s1mulai'));
  var d=R1[r1],i,st;
  if(d.t==='+'){
    for(i=1;i<=d.a;i++){(function(i){later(function(){neraca1(d,d.a-i,d.b-i)},i*500)})(i)}
    later(function(){
      barisTeks('s1tampil',['n + '+d.a+' = '+d.b,'n = '+d.b+' − '+d.a]);
      st=[{t:'Yang tersisa di kanan sama dengan n. Berapa n?',o:uniq(d.b-d.a,[d.a+d.b,d.b]),b:String(d.b-d.a),p:'n = '+d.b+' − '+d.a+' = '+(d.b-d.a)+'. Kedua sisi diambil sama banyak, neraca tetap seimbang.'}];
      if(d.x)st.push({t:'Untuk mencari n pada n + '+d.a+' = '+d.b+', kita memakai...',o:['pengurangan: '+d.b+' − '+d.a,'penjumlahan: '+d.b+' + '+d.a],b:'pengurangan: '+d.b+' − '+d.a,p:'Kebalikan dari penjumlahan adalah pengurangan. Menjumlahkan '+d.b+' + '+d.a+' = '+(d.a+d.b)+' adalah salah.'});
      ruteSteps('s1aksi','s1tanya','s1msg',st,0,function(){$('s1next').disabled=false});
    },d.a*500+700);
  }else{
    neraca1(d,0,d.b,d.a);
    later(function(){
      barisTeks('s1tampil',[d.a+' × n = '+d.b,'n = '+d.b+' : '+d.a]);
      st=[{t:'Satu kotak n sama dengan satu kelompok. Berapa n?',o:uniq(d.b/d.a,[d.b*d.a,d.b-d.a]),b:String(d.b/d.a),p:'n = '+d.b+' : '+d.a+' = '+(d.b/d.a)+'. Mengalikan '+d.b+' × '+d.a+' bukan cara yang benar.'}];
      ruteSteps('s1aksi','s1tanya','s1msg',st,0,function(){$('s1next').disabled=false});
    },900);
  }
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: operasi kebalikan ---- */
var NAMA={'+':'penjumlahan','−':'pengurangan','×':'perkalian',':':'pembagian'},KEB={'+':'−','−':'+','×':':',':':'×'};
var R2=[
  {eq:'n + 9 = 14',n:5,op:'+',a:9,b:14,w:'23'},{eq:'n − 8 = 11',n:19,op:'−',a:8,b:11,w:'3'},
  {eq:'6 × n = 48',n:8,op:'×',a:6,b:48,w:'288'},{eq:'n : 3 = 7',n:21,op:':',a:3,b:7,w:'2,33'},
  {eq:'n : 5 = 3',n:15,op:':',a:5,b:3,w:'0,6'},{eq:'n − 3 = 9',n:12,op:'−',a:3,b:9,w:'6'}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function mesin2(balik){
  var d=R2[r2],w=$('s2mesin');clear(w);
  w.appendChild(el('span','kt',balik?String(d.n):'n'));
  var ar=el('span','ar'+(balik?' balik':''));ar.appendChild(el('span',null,balik?'←':'→'));ar.appendChild(el('small',null,(balik?KEB[d.op]:d.op)+' '+d.a));w.appendChild(ar);
  w.appendChild(el('span','kt',ribu(d.b)));
}
function ronde2(){
  var d=R2[r2],inv=NAMA[KEB[d.op]],same=NAMA[d.op];titik('s2dots',R2.length,r2);
  var t='Cari n pada '+d.eq+'.';$('s2say').textContent=t;setKata(t);
  mesin2(false);barisTeks('s2tampil',[d.eq]);
  var lain=['penjumlahan','pengurangan','perkalian','pembagian'].filter(function(x){return x!==inv&&x!==same})[0];
  var st=[
    {t:'Operasi kebalikan untuk mencari n pada '+d.eq+' adalah...',o:[inv,same,lain],b:inv,p:'Lawan dari '+same+' adalah '+inv+'.',lihat:function(){mesin2(true);barisTeks('s2tampil',[d.eq,'n = '+d.b+' '+KEB[d.op]+' '+d.a])}},
    {t:'Hitung n = '+d.b+' '+KEB[d.op]+' '+d.a+'.',o:uniq(String(d.n),[d.w]),b:String(d.n),p:'n = '+d.n+'. Hasil '+d.w+' muncul bila memakai operasi yang sama.',lihat:function(){barisTeks('s2tampil',[d.eq,'n = '+d.b+' '+KEB[d.op]+' '+d.a+' = '+d.n])}}
  ];
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Untuk kembali ke n, jalankan mesin ke arah sebaliknya.');
  ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: cerita ke persamaan ---- */
var R3=[
  {q:'Made punya n kelereng. Ia memberikan 5 kelereng kepada temannya, tersisa 12.',eq:'n − 5 = 12',w:['n + 5 = 12','5 × n = 12'],n:17,s:7},
  {q:'Sebuah tangki berisi n liter. Setelah ditambah 15 liter, isinya 40 liter.',eq:'n + 15 = 40',w:['n − 15 = 40','15 × n = 40'],n:25,s:55},
  {q:'Harga 6 pensil yang sama adalah Rp18.000. Harga satu pensil n rupiah.',eq:'6 × n = 18.000',w:['6 + n = 18.000','n : 6 = 18.000'],n:3000,s:108000},
  {q:'Uang n dibagi rata kepada 4 anak. Masing-masing mendapat Rp25.000.',eq:'n : 4 = 25.000',w:['4 × n = 25.000','n − 4 = 25.000'],n:100000,s:6250},
  {q:'Toko punya n buku. Setelah terjual 15 buku, tersisa 32 buku.',eq:'n − 15 = 32',w:['n + 15 = 32','15 × n = 32'],n:47,s:17},
  {q:'Wati punya n kelereng. Diberi 6 lagi, kini 14.',eq:'n + 6 = 14',w:['n − 6 = 14','6 × n = 14'],n:8,s:20}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  var t='Ubah cerita menjadi persamaan.';$('s3say').textContent=t;setKata(d.q);
  barisTeks('s3tampil',[d.q]);
  var st=[
    {t:'Persamaan yang tepat untuk cerita ini adalah...',o:[d.eq].concat(d.w),b:d.eq,p:'Persamaannya '+d.eq+'.',lihat:function(){barisTeks('s3tampil',[d.q,d.eq])}},
    {t:'Berapa nilai n?',o:uniq(ribu(d.n),[ribu(d.s)]),b:ribu(d.n),p:'n = '+ribu(d.n)+'. Jawaban '+ribu(d.s)+' berasal dari operasi yang salah arah.'}
  ];
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Baca ceritanya: apakah n bertambah, berkurang, atau dibagi?');
  ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: periksa dan rancang ---- */
var R4=[
  {say:'Pilih semua persamaan yang n-nya 6.',multi:[['n + 4 = 10',true,'6 + 4 = 10'],['n − 4 = 10',false,'6 − 4 = 2'],['3 × n = 18',true,'3 × 6 = 18'],['n : 2 = 3',true,'6 : 2 = 3'],['n : 3 = 3',false,'6 : 3 = 2']]},
  {say:'Pilih semua pasangan yang membuat n : a = b memiliki n = 20.',multi:[['a = 4, b = 5',true,'20 : 4 = 5'],['a = 5, b = 4',true,'20 : 5 = 4'],['a = 2, b = 10',true,'20 : 2 = 10'],['a = 10, b = 3',false,'20 : 10 = 2'],['a = 6, b = 3',false,'20 : 6 bukan 3']]},
  {say:'Tentukan b agar n + 8 = b memiliki solusi n = 15.',st:[{t:'Masukkan n = 15 ke n + 8. Berapa b?',o:['23','7','120'],b:'23',p:'15 + 8 = 23, jadi b = 23.'}]},
  {say:'Tentukan a agar a × n = 36 memiliki solusi n = 4.',st:[{t:'Masukkan n = 4. a × 4 = 36. Berapa a?',o:['9','32','40'],b:'9',p:'36 : 4 = 9, jadi a = 9.'}]},
  {say:'Tentukan b agar n − 12 = b memiliki solusi n = 30.',st:[{t:'Masukkan n = 30 ke n − 12. Berapa b?',o:['18','42','360'],b:'18',p:'30 − 12 = 18, jadi b = 18.'}]},
  {say:'Kiki berkata n = 9 adalah solusi n − 4 = 5. Periksa dengan memasukkan 9.',st:[{t:'Hitung 9 − 4.',o:['5','13','36'],b:'5',p:'9 − 4 = 5.'},{t:'Jadi klaim Kiki...',o:['benar, kedua ruas sama-sama 5','salah, n seharusnya 1'],b:'benar, kedua ruas sama-sama 5',p:'Substitusi: jika kedua ruas sama, nilai n benar.'}]}
];
var r4=0,pil4=[];
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);pil4=[];
  $('s4say').textContent=d.say;setKata(d.say);
  clear($('s4chip'));clear($('s4periksa'));clear($('s4aksi'));$('s4tanya').textContent='';$('s4next').disabled=true;barisTeks('s4tampil',[]);
  if(d.multi){
    d.multi.forEach(function(e){
      var b=el('button',null,e[0]);b.onclick=function(){var i=pil4.indexOf(e[0]);if(i>=0)pil4.splice(i,1);else pil4.push(e[0]);b.classList.toggle('pilih',i<0)};
      $('s4chip').appendChild(b);
    });
    var a=$('s4periksa');a.className='aksi';tombol(a,'Periksa',periksa4,'utama');
    msg('s4msg','','Ketuk semua yang benar, lalu Periksa. Masukkan n ke tiap persamaan.');
  }else{
    barisTeks('s4tampil',[d.say]);msg('s4msg','','Masukkan nilai n ke persamaan, lihat apakah kedua ruas sama.');
    ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
  }
}
function periksa4(){
  var d=R4[r4],ben=d.multi.filter(function(e){return e[1]}).map(function(e){return e[0]});
  var benar=pil4.length===ben.length&&ben.every(function(x){return pil4.indexOf(x)>=0});
  if(!benar){msg('s4msg','warn','Belum tepat. Masukkan n ke setiap persamaan dan periksa kedua ruasnya.');return}
  var bs=$('s4chip').children;for(var i=0;i<bs.length;i++){bs[i].disabled=true;if(ben.indexOf(bs[i].textContent)>=0)bs[i].classList.add('ok')}
  barisTeks('s4tampil',d.multi.map(function(e){return e[0]+' : '+e[2]+(e[1]?' ✓':' ✗')}));
  clear($('s4periksa'));msg('s4msg','good','Tepat! Yang benar membuat kedua ruas sama.');$('s4next').disabled=false;
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: seimbang atau miring ---- */
var R5=[
  {t:'Tambah 3 di kedua sisi',L:15,R:15,s:'seimbang'},
  {t:'Tambah 3 hanya di sisi kiri',L:15,R:12,s:'miring ke kiri'},
  {t:'Kalikan kedua sisi dengan 2',L:24,R:24,s:'seimbang'},
  {t:'Tukar isi sisi kiri dan kanan',L:12,R:12,s:'seimbang',x:{t:'Setelah ditukar, 12 = n + 5. Apakah nilai n berubah?',o:['Tidak, n tetap 7','Ya, n menjadi 5'],b:'Tidak, n tetap 7',p:'Menukar ruas tidak mengubah kesetaraan, jadi n tetap 7.'}}
];
var r5=0,jalan5=false;
function neraca5(l,r){gambarDi('s5alat',{k:'setara',angkaL:l,angkaR:r,sud:Math.max(-12,Math.min(12,(r-l)*3))})}
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);jalan5=false;
  var t='Neraca: n + 5 = 12, jadi n = 7.';$('s5say').textContent=t;setKata(t);
  neraca5(12,12);barisTeks('s5tampil',['n + 5 = 12']);
  clear($('s5aksi'));$('s5tanya').textContent='';$('s5next').disabled=true;
  var a=$('s5mulai');clear(a);a.className='aksi';tombol(a,d.t,lakukan5,'utama hint');
  msg('s5msg','','Tekan tombol untuk melakukan perubahan pada neraca.');
}
function lakukan5(){
  if(jalan5)return;jalan5=true;clear($('s5mulai'));
  var d=R5[r5];neraca5(d.L,d.R);barisTeks('s5tampil',['n + 5 = 12',d.t]);
  var st=[{t:'Setelah '+d.t.toLowerCase()+', neraca menjadi...',o:['seimbang','miring ke kiri','miring ke kanan'],b:d.s,p:d.s==='seimbang'?'Perubahan yang sama di kedua sisi menjaga neraca tetap seimbang.':'Hanya satu sisi berubah, jadi neraca miring.'}];
  if(d.x)st.push(d.x);
  later(function(){ruteSteps('s5aksi','s5tanya','s5msg',st,0,function(){$('s5next').disabled=false})},900);
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Neracamu selalu seimbang.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-24'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.setara({kb:1,ku:3,kn:10}));w.appendChild(el('div','baca','n + 3 = 10, n = 7'));
})();

/* ---- bonus: mesin persamaan ---- */
var bOp='+';
function mulaiBonus(){
  $('bA').value='7';$('bB').value='3';bOp='+';
  var w=$('bOp');clear(w);
  ['+','−','×',':'].forEach(function(o){var b=tombol(w,o,function(){bOp=o;gambarBonus()});b.setAttribute('data-o',o)});
  gambarBonus();
}
function gambarBonus(){
  var n=+$('bA').value,a=+$('bB').value,b,eq,rumus;
  $('bNilaiA').textContent='Nilai n: '+n;$('bNilaiB').textContent='Nilai a: '+a;
  var bs=$('bOp').children;for(var i=0;i<bs.length;i++)bs[i].classList.toggle('pilih',bs[i].getAttribute('data-o')===bOp);
  if(bOp==='+'){b=n+a;eq='n + '+a+' = '+b}
  else if(bOp==='−'){b=n-a;eq='n − '+a+' = '+b}
  else if(bOp==='×'){b=n*a;eq=a+' × n = '+b}
  else{b=n/a;eq='n : '+a+' = '+(Math.round(b*100)/100)}
  if(bOp==='−'&&b<=0){$('bTanda').textContent='Agar b positif, geser n lebih besar dari a.';msg('bmsg','','');return}
  if(bOp===':'&&n%a!==0){$('bTanda').textContent='Agar b bulat, pilih n kelipatan a.';msg('bmsg','','');return}
  var inv=KEB[bOp];
  barisTeks('bTanda',[eq,'n = '+(bOp===':'?b:b)+' '+inv+' '+a+' = '+n,'Periksa: '+(bOp==='×'?a+' × '+n:(bOp===':'?n+' : '+a:n+' '+bOp+' '+a))+' = '+b]);
  msg('bmsg','good','Operasi kebalikan dari '+NAMA[bOp]+' adalah '+NAMA[inv]+'.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC24 = rakit(DASAR, { kode: 'AC-24', data: DATA_AC24 })
