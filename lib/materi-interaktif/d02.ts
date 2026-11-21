import { rakit } from './bersama'
import { DATA_D02 } from './latihan/d02'

/**
 * Materi interaktif D-02 "Satu Nilai, Banyak Wajah" (bilangan rasional:
 * pecahan, desimal, persen, urutan, operasi, dan persen dalam keseharian).
 * Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi D-02. Disimpan
 * sebagai string supaya ikut terbundel di build tanpa membaca berkas saat
 * runtime.
 *
 * Gaya sama dengan AC-09 sampai D-01 (siswa SMP kelas 7, tiap stasiun
 * beranimasi). Lima stasiun praktik:
 * 1) Tiga wajah: papan seratus; pecahan, desimal, dan persen yang sama (3/4 =
 *    0,75 = 75%); pecahan ke persen dengan MEMBAGI lalu kali 100% (5/8 =
 *    62,5%, bukan 5 x 8 = 40%); persen ke pecahan sederhana.
 * 2) Urutkan: samakan bentuk lalu bandingkan; digit lebih banyak belum tentu
 *    lebih besar; membandingkan pembilang saja salah; bilangan negatif
 *    (-0,6 < -0,45) dan jarak ke 0.
 * 3) Tambah dan kurang: penyebut disamakan (1/2 + 3/8 = 7/8); desimal disejajarkan
 *    koma (0,9 - 0,35 = 0,55); campuran pecahan dan desimal; garis bilangan
 *    rasional untuk bilangan negatif.
 * 4) Kali dan bagi: 0,5 x 0,4 = 0,2; 3/4 : 1/2 = 3/2 (bukan 3/4 - 1/2); persen
 *    dari; diskon dan pajak.
 * 5) Persen bertingkat dan cerita: naik 20% lalu turun 10% bukan naik 10%;
 *    diskon 10% dua kali bukan 20%; alokasi uang saku; pertumbuhan.
 * Bonus: mesin diskon dan pajak: pilih harga dan persen.
 *
 * Soal Misi topik ini menguji: konversi pecahan-desimal-persen, urutan
 * bentuk campuran dan negatif, empat operasi rasional, persen dari, diskon
 * dan pajak, persen bertingkat, alokasi (pecahan dan persen), dan salah paham
 * (5/8 = 40%, 3/4 : 1/2 = 3/4 - 1/2, digit banyak berarti besar,
 * pembilang saja, negatif dibalik, diskon bertingkat dijumlah).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/d02.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik D-02 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Satu Nilai Banyak Wajah</title>
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
      <h1>Satu Nilai, Banyak Wajah</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo kenali pecahan, desimal, dan persen!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Warnai papan seratus.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Persen"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Samakan bentuk, lalu urutkan.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Tambah dan kurang.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Kali, bagi, dan persen dari.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Persen bertingkat dan cerita.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="tanda" id="s5tampil"></div></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin diskon dan pajak</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih harga, persen, dan jenisnya.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="10000" max="300000" step="10000" value="120000" aria-label="Harga">
      <div class="baca" id="bNB"></div><input type="range" id="bB" min="5" max="60" step="5" value="15" aria-label="Persen"><div class="tmp" id="bOp"></div></div>
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
  if(id==='intro')setKata('Ayo bermain dengan bilangan positif dan negatif!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo bermain dengan bilangan positif dan negatif!');

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
  },(s.o.length===2||s.o.some(function(x){return x.length>18}))?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Ubah ke bentuk yang sama dan hitung lagi.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
function fm(x){return String(Math.round(x*1000)/1000).replace('.',',')}
function rb(n){return titikRibu(n)}
function gcdQ(a,b){return b?gcdQ(b,a%b):a}
function bentukSed(p){if(p%1!==0)return fm(p/100);var g=gcdQ(p,100);return p===0?'0':(100/g===1?String(p/g):(p/g)+'/'+(100/g))}

/* ---- stasiun 1: tiga wajah ---- */
var R1=[
  {p:75,t:'3/4',st:[
    {t:'Bentuk desimal dari 3/4 adalah 0,...',o:['75','34','25'],b:'75',p:'3 : 4 = 0,75.'},
    {t:'0,75 sama dengan berapa persen?',o:['75%','7,5%','0,75%'],b:'75%',p:'0,75 × 100% = 75%.'}]},
  {p:35,t:'7/20',st:[
    {t:'7/20 dijadikan persen: 7/20 × 100% = ?',o:['35%','7,2%','70%'],b:'35%',p:'7/20 = 35/100 = 35%.'}]},
  {p:40,t:'40%',st:[
    {t:'Bentuk pecahan paling sederhana dari 40% adalah...',o:['2/5','1/4','4/5'],b:'2/5',p:'40/100 = 2/5.'}]},
  {p:8,t:'0,08',st:[
    {t:'0,08 sama dengan berapa persen?',o:['8%','80%','0,8%'],b:'8%',p:'0,08 = 8/100 = 8%.'}]},
  {p:62.5,t:'5/8',st:[
    {t:'Seorang siswa: "5/8 → 5 × 8 = 40, jadi 40%." Tepatkah?',o:['Salah. Pecahan dijadikan persen dengan membagi 5 : 8 = 0,625 lalu dikali 100%','Benar'],b:'Salah. Pecahan dijadikan persen dengan membagi 5 : 8 = 0,625 lalu dikali 100%',p:'5/8 = 0,625 = 62,5%.'},
    {t:'5/8 sama dengan berapa persen?',o:['62,5%','40%','58%'],b:'62,5%',p:'0,625 × 100% = 62,5%.'}]},
  {p:12.5,t:'0,125',st:[
    {t:'Bentuk pecahan paling sederhana dari 0,125 adalah...',o:['1/8','1/4','1/80'],b:'1/8',p:'0,125 = 125/1000 = 1/8.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){gambarDi('s1alat',{k:'seratus',p:Math.floor(v)})}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='0';sl.max='100';sl.step='0.5';sl.value='0';sl.disabled=false;
  var t='Warnai papan seratus sebanyak '+d.t+'.';$('s1say').textContent=t;setKata(t);
  gambar1(0);barisTeks('s1tampil',['Belum ada petak berwarna']);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Papan seratus bernilai 1. Tiap petak = 1% = 0,01.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;
  gambar1(v);barisTeks('s1tampil',[fm(v)+'% = '+fm(v/100)+(v%1===0?' = '+bentukSed(v):'')]);
  if(v===d.p){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good',d.t+' = '+fm(d.p/100)+' = '+fm(d.p)+'%'+(d.p%1===0?' = '+bentukSed(d.p):'')+'.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai '+fm(d.p)+'%.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: samakan bentuk, lalu urutkan ---- */
var R2=[
  {say:'Urutkan 0,4 ; 3/8 ; dan 35% dari yang terkecil.',lo:0,hi:1,bg:10,v:[['0,4',0.4],['3/8',0.375],['35%',0.35]],st:[
    {t:'Ubah 3/8 menjadi desimal: 3 : 8 = ?',o:['0,375','0,38','0,83'],b:'0,375',p:'3/8 = 0,375 = 37,5%.'},
    {t:'35% sama dengan desimal...',o:['0,35','3,5','0,035'],b:'0,35',p:'35% = 35/100 = 0,35.'},
    {t:'Urutan dari terkecil...',o:['35%, 3/8, 0,4','0,4, 3/8, 35%','3/8, 35%, 0,4'],b:'35%, 3/8, 0,4',p:'0,35 < 0,375 < 0,4.'}]},
  {say:'Bandingkan 0,45 dan 0,6.',lo:0,hi:1,bg:20,v:[['0,45',0.45],['0,6',0.6]],st:[
    {t:'Siswa: "0,45 punya dua angka di belakang koma, 0,6 hanya satu, jadi 0,45 lebih besar." Tepatkah?',o:['Salah. 0,6 = 0,60 lebih besar daripada 0,45','Benar, angkanya lebih banyak'],b:'Salah. 0,6 = 0,60 lebih besar daripada 0,45',p:'Samakan banyak angka: 0,60 > 0,45.'}]},
  {say:'Mana yang lebih besar, 3/8 atau 40%?',lo:0,hi:1,bg:10,v:[['3/8',0.375],['40%',0.4]],st:[
    {t:'Mana yang lebih besar, 3/8 atau 40%?',o:['40%, karena 3/8 = 37,5% < 40%','3/8, karena pecahan biasanya lebih besar daripada persen','sama besar'],b:'40%, karena 3/8 = 37,5% < 40%',p:'Ubah ke bentuk yang sama sebelum membandingkan.'}]},
  {say:'Bandingkan 2/3 dan 3/5.',lo:0,hi:1,bg:15,v:[['2/3',2/3],['3/5',0.6]],st:[
    {t:'Siswa membandingkan pembilang saja (2 dan 3), jadi 3/5 lebih besar. Tepatkah?',o:['Salah. 2/3 ≈ 0,67 lebih besar daripada 3/5 = 0,6','Benar'],b:'Salah. 2/3 ≈ 0,67 lebih besar daripada 3/5 = 0,6',p:'Pembilang saja tidak cukup, penyebutnya ikut menentukan.'}]},
  {say:'Bandingkan −0,6 dan −0,45 pada garis bilangan.',lo:-1,hi:0,bg:20,v:[['−0,6',-0.6],['−0,45',-0.45]],st:[
    {t:'Mana yang lebih kecil, −0,6 atau −0,45?',o:['−0,6, karena lebih jauh ke kiri','−0,45, karena angkanya lebih kecil'],b:'−0,6, karena lebih jauh ke kiri',p:'Untuk negatif, makin besar angkanya makin kecil nilainya.'},
    {t:'Bu Dewi: "Karena −3/4 < −1/2, jarak −3/4 ke 0 juga lebih kecil." Tepatkah?',o:['Salah. Jaraknya 3/4, lebih besar daripada 1/2','Benar'],b:'Salah. Jaraknya 3/4, lebih besar daripada 1/2',p:'Makin ke kiri bilangan makin kecil, tetapi jaraknya ke 0 makin besar.'}]},
  {say:'Urutkan −3/4 ; −0,4 ; dan 1/5 dari yang terkecil.',lo:-1,hi:1,bg:20,v:[['−3/4',-0.75],['−0,4',-0.4],['1/5',0.2]],st:[
    {t:'Urutan dari terkecil...',o:['−3/4, −0,4, 1/5','−0,4, −3/4, 1/5','1/5, −0,4, −3/4'],b:'−3/4, −0,4, 1/5',p:'Bilangan negatif lebih kecil daripada positif; −0,75 < −0,4 < 0,2.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Samakan bentuk, lalu urutkan.';setKata(d.say);
  gambarDi('s2alat',{k:'garisrat',lo:d.lo,hi:d.hi,bagi:d.bg});barisTeks('s2tampil',[d.say]);
  var st=d.st.slice();
  st[st.length-1]=Object.assign({},st[st.length-1],{lihat:function(){gambarDi('s2alat',{k:'garisrat',lo:d.lo,hi:d.hi,bagi:d.bg,titik:d.v.map(function(x,i){return {v:x[1],l:x[0],w:['merah','biru','kuning'][i%3]}})})}});
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Ubah semua ke satu bentuk (desimal atau persen) sebelum membandingkan.');
  ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: tambah dan kurang ---- */
var R3=[
  {ex:'1/2 + 3/8',g:{k:'pita',baris:[{n:8,w:4,l:'1/2'},{n:8,w:3,l:'3/8',warna:'kuning'},{n:8,w:7,l:'7/8',warna:'hijau'}]},st:[
    {t:'Samakan penyebut: 1/2 = ?/8',o:['4/8','2/8','1/8'],b:'4/8',p:'1/2 = 4/8.'},
    {t:'4/8 + 3/8 = ?',o:['7/8','7/16','4/16'],b:'7/8',p:'Penyebut tetap, pembilang dijumlahkan: 7/8.'}]},
  {ex:'2/3 + 1/6',g:{k:'pita',baris:[{n:6,w:4,l:'2/3'},{n:6,w:1,l:'1/6',warna:'kuning'},{n:6,w:5,l:'5/6',warna:'hijau'}]},st:[
    {t:'2/3 = ?/6',o:['4/6','2/6','3/6'],b:'4/6',p:'2/3 = 4/6.'},
    {t:'4/6 + 1/6 = ?',o:['5/6','5/12','4/12'],b:'5/6',p:'5/6 sudah paling sederhana.'}]},
  {ex:'0,9 − 0,35',g:{k:'garisrat',lo:0,hi:1,bagi:20,jejak:[0.9,0.55]},st:[
    {t:'Sejajarkan koma: 0,9 = 0,90. Berapa 0,90 − 0,35?',o:['0,55','0,65','0,45'],b:'0,55',p:'90 − 35 = 55 perseratusan: 0,55.'}]},
  {ex:'4,25 − 1,8',g:{k:'garisrat',lo:0,hi:5,bagi:4,jejak:[4.25,2.45]},st:[
    {t:'Sejajarkan koma: 1,8 = 1,80. Berapa 4,25 − 1,80?',o:['2,45','2,55','3,45'],b:'2,45',p:'425 − 180 = 245 perseratusan: 2,45.'}]},
  {ex:'2,5 − 3/4',g:{k:'garisrat',lo:0,hi:3,bagi:4,jejak:[2.5,1.75]},st:[
    {t:'Ubah 3/4 menjadi desimal.',o:['0,75','0,34','0,25'],b:'0,75',p:'3/4 = 0,75.'},
    {t:'2,5 − 0,75 = ?',o:['1,75','1,25','2,25'],b:'1,75',p:'Tali 2,5 m dipotong 3/4 m, sisa 1,75 m.'}]},
  {ex:'−3/4 + 1/2',g:{k:'garisrat',lo:-2,hi:1,bagi:4,jejak:[-0.75,-0.25]},st:[
    {t:'Dari −3/4 geser ke kanan 1/2 (= 2/4). Hasilnya...',o:['−1/4','−5/4','1/4'],b:'−1/4',p:'−3/4 + 2/4 = −1/4.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  var t='Hitung '+d.ex+'.';$('s3say').textContent='Tambah dan kurang.';setKata(t);
  gambarDi('s3alat',d.g);barisTeks('s3tampil',[t]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Pecahan: samakan penyebut. Desimal: sejajarkan koma.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: kali, bagi, persen dari ---- */
var R4=[
  {ex:'0,5 × 0,4',g:{k:'seratus',p:20},st:[{t:'5 × 4 = 20, dan ada dua angka di belakang koma. 0,5 × 0,4 = ?',o:['0,2','2','0,02'],b:'0,2',p:'0,5 × 0,4 = 0,20 = 0,2 (20 dari 100 petak).'}]},
  {ex:'3/4 : 1/2',g:{k:'pita',baris:[{n:4,w:3,l:'3/4'},{n:2,w:1,l:'1/2',warna:'kuning'}]},st:[
    {t:'3/4 : 1/2 sama dengan 3/4 × ...',o:['2 (kebalikan 1/2)','1/2','1/4'],b:'2 (kebalikan 1/2)',p:'Membagi dengan pecahan = mengalikan kebalikannya.'},
    {t:'3/4 × 2 = ?',o:['3/2','3/8','1/4'],b:'3/2',p:'6/4 = 3/2.'},
    {t:'Made menjawab 3/4 − 1/2 = 1/4. Apa kesalahannya?',o:['Pembagian dikerjakan sebagai pengurangan','Tidak ada kesalahan'],b:'Pembagian dikerjakan sebagai pengurangan',p:'Berapa kali 1/2 muat dalam 3/4? 1,5 kali.'}]},
  {ex:'0,6 : 3/4',st:[
    {t:'3/4 = 0,75. Berapa 0,6 : 0,75?',o:['0,8','−0,15','0,45'],b:'0,8',p:'0,6 : 0,75 = 60 : 75 = 0,8.'},
    {t:'Siswa menghitung 0,6 − 0,75 = −0,15. Apa kesalahannya?',o:['Pembagian dikerjakan sebagai pengurangan','Tidak ada kesalahan'],b:'Pembagian dikerjakan sebagai pengurangan',p:'Gunakan pembagian, bukan pengurangan.'}]},
  {ex:'20% dari 150',st:[{t:'20% dari 150 = 0,2 × 150 = ?',o:['30','20','7,5'],b:'30',p:'0,2 × 150 = 30.'}]},
  {ex:'diskon 25% untuk baju Rp80.000',st:[
    {t:'Potongan = 25% × 80.000 = ?',o:['20.000','55.000','60.000'],b:'20.000',p:'Seperempat dari 80.000 adalah 20.000.'},
    {t:'Harga setelah diskon = 80.000 − 20.000 = ?',o:['60.000','20.000','100.000'],b:'60.000',p:'Rp60.000.'}]},
  {ex:'diskon 15% untuk baju Rp120.000',st:[
    {t:'Potongan = 15% × 120.000 = ?',o:['18.000','12.000','15.000'],b:'18.000',p:'0,15 × 120.000 = 18.000.'},
    {t:'Harga setelah diskon?',o:['102.000','138.000','105.000'],b:'102.000',p:'120.000 − 18.000 = 102.000.'}]},
  {ex:'pajak 8% atas barang Rp250.000',st:[
    {t:'Pajak = 8% × 250.000 = ?',o:['20.000','8.000','200.000'],b:'20.000',p:'0,08 × 250.000 = 20.000.'},
    {t:'Harga akhir setelah pajak?',o:['270.000','258.000','230.000'],b:'270.000',p:'250.000 + 20.000 = 270.000.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  var t='Hitung '+d.ex+'.';$('s4say').textContent='Kali, bagi, dan persen dari.';setKata(t);
  if(d.g)gambarDi('s4alat',d.g);else clear($('s4alat'));
  barisTeks('s4tampil',[t]);$('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Persen dari = persen (sebagai desimal) × nilainya.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: persen bertingkat dan cerita ---- */
var R5=[
  {say:'Toko membeli beras Rp10.000 per kg, menjual dengan untung 20%, lalu mendiskon 10% dari harga jual.',st:[
    {t:'Harga jual = 10.000 + 20% = ?',o:['12.000','11.000','10.200'],b:'12.000',p:'10.000 + 2.000 = 12.000.'},
    {t:'Diskon 10% dari 12.000 = ?',o:['1.200','1.000','2.000'],b:'1.200',p:'0,1 × 12.000 = 1.200.'},
    {t:'Harga akhir = 12.000 − 1.200 = ?',o:['10.800','11.000','10.000'],b:'10.800',p:'Untung = 10.800 − 10.000 = 800, atau 8% dari harga beli.'},
    {t:'Pemilik: "Naik 20% lalu diskon 10% sama saja dengan naik 10%." Tepatkah?',o:['Salah. Untungnya 8%, bukan 10%','Benar'],b:'Salah. Untungnya 8%, bukan 10%',p:'Persen kedua dihitung dari harga yang sudah berubah.'}]},
  {say:'Barang Rp100.000 didiskon 10%, lalu didiskon 10% lagi.',st:[
    {t:'Setelah diskon pertama = ?',o:['90.000','80.000','95.000'],b:'90.000',p:'100.000 − 10.000 = 90.000.'},
    {t:'Diskon kedua 10% dari 90.000 = ?',o:['9.000','10.000','8.000'],b:'9.000',p:'0,1 × 90.000 = 9.000.'},
    {t:'Harga akhir = ?',o:['81.000','80.000','90.000'],b:'81.000',p:'90.000 − 9.000 = 81.000.'},
    {t:'Apakah diskon 10% dua kali sama dengan diskon 20% sekali (harga 80.000)?',o:['Tidak sama: 81.000 lawan 80.000','Sama saja'],b:'Tidak sama: 81.000 lawan 80.000',p:'Diskon bertingkat tidak dijumlahkan; ekuivalennya 19%.'}]},
  {say:'Pedagang menaikkan harga 25% lalu memberi diskon 20% dari harga baru. Harga awal Rp100.000.',st:[
    {t:'Harga setelah naik 25% = ?',o:['125.000','120.000','105.000'],b:'125.000',p:'100.000 + 25.000.'},
    {t:'Diskon 20% dari 125.000 = ?',o:['25.000','20.000','30.000'],b:'25.000',p:'0,2 × 125.000 = 25.000.'},
    {t:'Harga akhir dibanding harga awal...',o:['sama dengan harga awal (100.000)','lebih mahal','lebih murah'],b:'sama dengan harga awal (100.000)',p:'125.000 − 25.000 = 100.000. Kebetulan tepat kembali.'}]},
  {say:'Tanaman setinggi 40 cm tumbuh 15% di minggu pertama, lalu 10% dari tinggi baru di minggu kedua.',st:[
    {t:'Tinggi setelah minggu pertama = 40 + 15% × 40 = ?',o:['46','55','43'],b:'46',p:'40 + 6 = 46 cm.'},
    {t:'Tinggi setelah minggu kedua = 46 + 10% × 46 = ?',o:['50,6','51','50'],b:'50,6',p:'46 + 4,6 = 50,6 cm.'}]},
  {say:'Bu Sari punya Rp400.000: 3/8 untuk sembako, 20% dari uang awal untuk transportasi, sisanya ditabung.',st:[
    {t:'3/8 dari 400.000 = ?',o:['150.000','120.000','133.333'],b:'150.000',p:'400.000 : 8 × 3 = 150.000.'},
    {t:'20% dari 400.000 = ?',o:['80.000','20.000','8.000'],b:'80.000',p:'0,2 × 400.000 = 80.000.'},
    {t:'Tabungan = 400.000 − 150.000 − 80.000 = ?',o:['170.000','230.000','150.000'],b:'170.000',p:'Rp170.000.'}]},
  {say:'Dimas punya uang saku Rp150.000: 2/5 tabungan, 30% jajan, sisanya transportasi.',st:[
    {t:'Tabungan 2/5 × 150.000 = ?',o:['60.000','50.000','75.000'],b:'60.000',p:'Rp60.000.'},
    {t:'Transportasi = 150.000 − 60.000 − 45.000 (jajan 30%) = ?',o:['45.000','90.000','55.000'],b:'45.000',p:'Rp45.000.'},
    {t:'Apakah tabungan (2/5) tidak kurang dari jajan (30%)?',o:['Ya, 2/5 = 40% > 30%','Tidak, 30% lebih besar'],b:'Ya, 2/5 = 40% > 30%',p:'Ubah ke persen untuk membandingkan.'}]},
  {say:'Toko A memberi diskon 25% untuk barang Rp120.000. Toko B memberi potongan langsung Rp32.000.',st:[
    {t:'Potongan Toko A = 25% × 120.000 = ?',o:['30.000','25.000','40.000'],b:'30.000',p:'Rp30.000.'},
    {t:'Toko manakah yang memberi potongan lebih besar?',o:['Toko B (32.000 > 30.000)','Toko A (25% lebih banyak)'],b:'Toko B (32.000 > 30.000)',p:'Bandingkan dalam rupiah.'}]},
  {say:'Rina punya Rp200.000. Ia membelanjakan 1/4 untuk buku, lalu 30% dari SISA uangnya untuk alat tulis.',st:[
    {t:'Uang untuk buku = 1/4 × 200.000 = ?',o:['50.000','40.000','60.000'],b:'50.000',p:'Rp50.000, sisa 150.000.'},
    {t:'Alat tulis = 30% dari sisa (150.000) = ?',o:['45.000','60.000','30.000'],b:'45.000',p:'0,3 × 150.000 = 45.000. (30% dari 200.000 = 60.000 akan salah.)'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Persen bertingkat dan cerita.';setKata(d.say);
  barisTeks('s5tampil',[d.say]);$('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Persen kedua dihitung dari nilai yang SUDAH berubah.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Satu nilai punya banyak wajah.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-02'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.seratus({p:75}));w.appendChild(el('div','baca','3/4 = 0,75 = 75%'));
})();

/* ---- bonus: mesin diskon dan pajak ---- */
var bOp='−';
function mulaiBonus(){
  $('bA').value='120000';$('bB').value='15';bOp='−';
  var w=$('bOp');clear(w);
  [['−','Diskon'],['+','Pajak']].forEach(function(o){var b=tombol(w,o[1],function(){bOp=o[0];gambarBonus()});b.setAttribute('data-o',o[0])});
  gambarBonus();
}
function gambarBonus(){
  var a=+$('bA').value,b=+$('bB').value,pot=a*b/100,akhir=bOp==='−'?a-pot:a+pot,bs=$('bOp').children;
  for(var i=0;i<bs.length;i++)bs[i].classList.toggle('pilih',bs[i].getAttribute('data-o')===bOp);
  $('bNA').textContent='Harga: Rp'+rb(a);$('bNB').textContent=(bOp==='−'?'Diskon: ':'Pajak: ')+b+'%';
  gambarDi('bGambar',{k:'seratus',p:b});
  barisTeks('bTanda',[b+'% dari '+rb(a)+' = '+fm(b/100)+' × '+rb(a)+' = Rp'+rb(pot),'Harga akhir = '+rb(a)+(bOp==='−'?' − ':' + ')+rb(pot)+' = Rp'+rb(akhir)]);
  msg('bmsg','good',bOp==='−'?'Diskon mengurangi harga sebesar persen dari harga awal.':'Pajak menambah harga sebesar persen dari harga awal.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D02 = rakit(DASAR, { kode: 'D-02', data: DATA_D02 })
