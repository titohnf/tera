import { rakit } from './bersama'
import { DATA_AC27 } from './latihan/ac27'

/**
 * Materi interaktif AC-27 "Luas Mundur" (menentukan ukuran dari luas: persegi
 * panjang, persegi, segitiga, dan satuan luas). Satu halaman HTML mandiri,
 * ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah
 * Belajar di topik Misi AC-27. Disimpan sebagai string supaya ikut terbundel di
 * build tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-26 (anak kelas 5-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Persegi panjang: luas dibagi ukuran yang diketahui (48 : 8 = 6); operasi
 *    kebalikan dari kali; 54 x 6 = 324 adalah salah.
 * 2) Persegi: sisi = akar kuadrat dari luas (36 jadi 6, bukan 36 : 2 = 18).
 * 3) Segitiga: dua segitiga membentuk persegi panjang, jadi dua kali luas
 *    dibagi alas (42 x 2 : 7 = 12; 20 : 5 = 4 adalah salah).
 * 4) Satuan: 1 m persegi = 10.000 cm persegi; samakan satuan dulu (2 m persegi
 *    dan sisi 200 cm menjadi lebar 100 cm, bukan 0,01).
 * 5) Periksa dan rancang: masukkan kembali ke rumus luas; pasangan panjang dan
 *    lebar berluas 60; segitiga beralas 15 berluas 60; segitiga alas sama tinggi.
 * Bonus: pilih bangun dan ukuran; lihat luasnya dan cara mencari ukuran yang
 * hilang.
 *
 * Soal Misi topik ini menguji: arti menentukan ukuran dari luas, bagi untuk
 * persegi panjang, akar untuk persegi, dua kali luas untuk segitiga, satuan
 * (1 m persegi = 10.000 cm persegi), cerita (taman, ruangan, bendera),
 * memeriksa dengan substitusi, rancang, dan salah paham (dikali bukan dibagi,
 * dibagi 2 untuk persegi, lupa dua kali, lupa konversi satuan, satuan tidak
 * ditulis).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac27.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-27 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Luas Mundur</title>
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
      <h1>Luas Mundur</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo cari ukuran dari luas yang diketahui!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Cari lebar persegi panjang.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="1" max="20" value="1" aria-label="Ukuran"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Cari sisi persegi.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div>
      <input type="range" id="s2geser" min="1" max="14" value="1" aria-label="Ukuran"></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Cari alas atau tinggi segitiga.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Samakan satuan luasnya.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Periksa dan rancang.</p>
    <div class="dots" id="s5dots"></div>
    <div class="panel"><div class="tanda" id="s5tampil"></div><div class="fak" id="s5chip"></div></div>
    <div class="aksi" id="s5periksa"></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin luas mundur</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih bangun, lalu atur ukurannya.</p>
    <div class="panel"><div class="tmp" id="bBangun"></div><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNilaiX"></div><input type="range" id="bX" min="2" max="15" value="6" aria-label="Ukuran yang dicari">
      <div class="baca" id="bNilaiA"></div><input type="range" id="bA" min="2" max="12" value="8" aria-label="Ukuran yang diketahui"></div>
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
  if(id==='intro')setKata('Ayo cari ukuran dari luas yang diketahui!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo cari ukuran dari luas yang diketahui!');

/* ---- alat bantu ---- */
function ribu(n){return titikRibu(n)}
function fm(x){return String(x).replace('.',',')}
function uniq(benar,calon){var o=[String(benar)];calon.forEach(function(x){x=String(x);if(o.length<3&&o.indexOf(x)<0&&x.charAt(0)!=='-')o.push(x)});var t=1;while(o.length<3){var y=String(+benar+t++);if(o.indexOf(y)<0)o.push(y)}return o}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(s.lihat)s.lihat();
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Hitung lagi pelan-pelan.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
function gab(jenis,d,lab,o){var g={k:'gabungan',jenis:jenis,lab:lab||{}};for(var k in d)g[k]=d[k];if(o)for(var q in o)g[q]=o[q];return g}
var sdh={};
function pasang(k,gamb,tampil,cocok,steps){
  var sl=$('s'+k+'geser');
  sl.oninput=function(){
    if(sdh[k])return;var v=+sl.value;gamb(v);barisTeks('s'+k+'tampil',tampil(v));
    if(cocok(v)){
      sdh[k]=true;sl.disabled=true;
      later(function(){ruteSteps('s'+k+'aksi','s'+k+'tanya','s'+k+'msg',steps(),0,function(){$('s'+k+'next').disabled=false})},900);
    }else msg('s'+k+'msg','','Geser pegangan sampai luasnya cocok.');
  };
}
function siapGeser(k,maks){
  var sl=$('s'+k+'geser');sdh[k]=false;sl.min='1';sl.max=String(maks);sl.step='1';sl.value='1';sl.disabled=false;
  $('s'+k+'next').disabled=true;clear($('s'+k+'aksi'));$('s'+k+'tanya').textContent='';
}

/* ---- stasiun 1: persegi panjang ---- */
var R1=[
  {L:48,k:8,kn:'panjang',un:'lebar',u:'cm'},
  {L:120,k:15,kn:'panjang',un:'lebar',u:'m',q:'Taman persegi panjang luasnya 120 m², panjangnya 15 m. Cari lebarnya.'},
  {L:90,k:6,kn:'lebar',un:'panjang',u:'cm'},
  {L:54,k:6,kn:'panjang',un:'lebar',u:'cm',x:true}
];
var r1=0;
function mulaiS1(){r1=0;ronde1()}
function gambar1(d,v){
  var pj=d.kn==='panjang'?d.k:v,lb=d.kn==='panjang'?v:d.k;
  gambarDi('s1alat',gab('pp',{p:pj,l:lb},{p:(d.kn==='panjang'?d.k:v)+' '+d.u,l:(d.kn==='panjang'?v:d.k)+' '+d.u,isi:'luas '+d.L}));
}
function ronde1(){
  var d=R1[r1],ans=d.L/d.k;titik('s1dots',R1.length,r1);siapGeser(1,20);
  var t=d.q||'Persegi panjang luasnya '+d.L+' '+d.u+'² dan '+d.kn+'nya '+d.k+' '+d.u+'. Cari '+d.un+'nya.';$('s1say').textContent='Cari '+d.un+' persegi panjang.';setKata(t);
  gambar1(d,1);barisTeks('s1tampil',[t]);msg('s1msg','','Geser '+d.un+' sampai luasnya sama dengan '+d.L+'.');
  pasang(1,function(v){gambar1(d,v)},function(v){var h=d.k*v;return ['Luas target: '+d.L,d.k+' × '+v+' = '+h+(h<d.L?' (kurang)':(h>d.L?' (terlalu besar)':' (pas!)'))]},function(v){return v===ans},function(){
    var st=[
      {t:'Untuk mencari '+d.un+' dari luas dan '+d.kn+', kita...',o:['membagi luas dengan '+d.kn,'mengalikan luas dengan '+d.kn,'menjumlahkan luas dan '+d.kn],b:'membagi luas dengan '+d.kn,p:'Luas = panjang × lebar. Kebalikan dari kali adalah bagi.'},
      {t:'Berapa '+d.un+'nya? ('+d.L+' : '+d.k+')',o:uniq(ans,[d.L*d.k,d.L-d.k]),b:String(ans),p:d.un+' = '+d.L+' : '+d.k+' = '+ans+' '+d.u+'.'}
    ];
    if(d.x)st.push({t:'Rian mengalikan '+d.L+' × '+d.k+' = '+(d.L*d.k)+'. Tepatkah?',o:['Tidak. Operasi kebalikan dari perkalian adalah pembagian','Ya, dikali'],b:'Tidak. Operasi kebalikan dari perkalian adalah pembagian',p:'Hasil '+(d.L*d.k)+' jauh terlalu besar. Periksa: '+d.k+' × '+ans+' = '+d.L+'.'});
    return st;
  });
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: persegi ---- */
var R2=[
  {L:81,s:9},{L:64,s:8},
  {L:36,s:6,x:{t:'Wati membagi 36 dengan 2 dan mendapat 18. Tepatkah?',o:['Tidak. 18 × 18 bukan 36; sisinya 6, karena 6 × 6 = 36','Ya, luas dibagi 2'],b:'Tidak. 18 × 18 bukan 36; sisinya 6, karena 6 × 6 = 36',p:'Kedua sisi persegi sama, jadi dicari akar kuadrat dari luas.'}},
  {L:144,s:12}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);siapGeser(2,14);
  var t='Persegi luasnya '+d.L+' cm². Cari sisinya.';$('s2say').textContent='Cari sisi persegi.';setKata(t);
  gambarDi('s2alat',{k:'petak',n:1});barisTeks('s2tampil',['Luas target: '+d.L]);msg('s2msg','','Geser sisi sampai luasnya sama dengan '+d.L+'.');
  pasang(2,function(v){gambarDi('s2alat',{k:'petak',n:v})},function(v){var h=v*v;return ['Luas target: '+d.L,v+' × '+v+' = '+h+(h<d.L?' (kurang)':(h>d.L?' (terlalu besar)':' (pas!)'))]},function(v){return v===d.s},function(){
    var st=[
      {t:'Sisi persegi dari luasnya dicari dengan...',o:['akar kuadrat dari luas','luas dibagi 2','luas dikali 2'],b:'akar kuadrat dari luas',p:'Panjang dan lebar persegi sama, jadi sisi × sisi = luas.'},
      {t:'Berapa sisinya? (akar kuadrat dari '+d.L+')',o:uniq(d.s,[d.L/2,d.L*2]),b:String(d.s),p:d.s+' × '+d.s+' = '+d.L+', jadi sisinya '+d.s+' cm.'}
    ];
    if(d.x)st.push(d.x);return st;
  });
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: segitiga ---- */
var R3=[
  {L:42,kn:'alas',k:7,un:'tinggi',ans:12},
  {L:24,kn:'alas',k:8,un:'tinggi',ans:6},
  {L:50,kn:'tinggi',k:10,un:'alas',ans:10},
  {L:20,kn:'tinggi',k:5,un:'alas',ans:8,x:true}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3],L2=d.L*2,al=d.kn==='alas'?d.k:d.ans,ti=d.kn==='alas'?d.ans:d.k;titik('s3dots',R3.length,r3);
  var t='Segitiga luasnya '+d.L+' cm² dan '+d.kn+'nya '+d.k+' cm. Cari '+d.un+'nya.';$('s3say').textContent='Cari '+d.un+' segitiga.';setKata(t);
  var lab={};lab.a=d.kn==='alas'?d.k+' cm':'?';lab.t=d.kn==='alas'?'?':d.k+' cm';
  gambarDi('s3alat',gab('tri',{a:al,t:ti},lab));barisTeks('s3tampil',[t]);
  var st=[
    {t:'Dua segitiga yang sama membentuk persegi panjang. Berapa luas persegi panjangnya? (2 × '+d.L+')',o:uniq(L2,[d.L,d.L/2]),b:String(L2),p:'Dua kali luas segitiga = '+L2+' cm persegi.',lihat:function(){gambarDi('s3alat',gab('pp',{p:al,l:ti},{p:lab.a,l:lab.t,isi:'luas '+L2}));barisTeks('s3tampil',['alas × tinggi = 2 × '+d.L+' = '+L2])}},
    {t:'Berapa '+d.un+'nya? ('+L2+' : '+d.k+')',o:uniq(d.ans,[fm(d.L/d.k),L2*d.k]),b:String(d.ans),p:d.un+' = '+L2+' : '+d.k+' = '+d.ans+' cm.'}
  ];
  if(d.x)st.push({t:'Made langsung membagi '+d.L+' : '+d.k+' = '+(d.L/d.k)+'. Apa kesalahannya?',o:['Ia lupa mengalikan luas dengan 2 dulu','Tidak ada kesalahan'],b:'Ia lupa mengalikan luas dengan 2 dulu',p:'Luas segitiga adalah ½ × alas × tinggi, jadi alas × tinggi = 2 × luas.'});
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Luas segitiga = ½ × alas × tinggi.');
  ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: satuan ---- */
var R4=[{L:2,k:200,ans:100},{L:3,k:300,ans:100},{L:4,k:160,ans:250},{L:1,k:50,ans:200}];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4],cm=d.L*10000;titik('s4dots',R4.length,r4);
  var t='Ruangan luasnya '+d.L+' m². Satu sisinya '+d.k+' cm. Berapa sisi lainnya (cm)?';$('s4say').textContent='Samakan satuan dulu.';setKata(t);
  gambarDi('s4alat',{k:'petak',n:10});barisTeks('s4tampil',[t,'1 m² = 10 × 10 petak, tiap petak 10 cm × 10 cm = 100 cm²']);
  var st=[];
  if(r4===0)st.push({t:'Berapa cm persegi dalam 1 m persegi?',o:['10.000','100','1.000'],b:'10.000',p:'1 m = 100 cm, jadi 1 m² = 100 × 100 = 10.000 cm².'});
  st.push({t:'Ubah '+d.L+' m² menjadi cm².',o:uniq(ribu(cm),[ribu(d.L*100),ribu(d.L*1000)]),b:ribu(cm),p:d.L+' m² = '+ribu(cm)+' cm².',lihat:function(){barisTeks('s4tampil',[d.L+' m² = '+ribu(cm)+' cm²',d.un+'? = '+ribu(cm)+' : '+d.k])}});
  st.push({t:'Sisi lainnya = '+ribu(cm)+' : '+d.k+' = ... cm',o:uniq(d.ans,[fm(d.L/d.k),d.L*d.k]),b:String(d.ans),p:'Sisi lain = '+d.ans+' cm. Jika langsung membagi '+d.L+' : '+d.k+' = '+fm(d.L/d.k)+', satuannya belum disamakan.'});
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Luas dan sisi harus memakai satuan yang sama sebelum dibagi.');
  ruteSteps('s4aksi','s4tanya','s4msg',st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: periksa dan rancang ---- */
var R5=[
  {say:'Pilih semua pasangan (panjang, lebar) yang luasnya tepat 60 cm².',multi:[['panjang 12, lebar 5',true,'12 × 5 = 60'],['panjang 10, lebar 6',true,'10 × 6 = 60'],['panjang 8, lebar 8',false,'8 × 8 = 64'],['panjang 15, lebar 4',true,'15 × 4 = 60'],['panjang 20, lebar 2',false,'20 × 2 = 40']]},
  {say:'Segitiga luasnya 60 cm², alasnya 15 cm. Cari tingginya.',st:[{t:'Tinggi = (2 × 60) : 15 = ?',o:['8','4','40'],b:'8',p:'120 : 15 = 8 cm.'}]},
  {say:'Kebun persegi panjang luasnya 200 m², panjangnya 25 m. Cari lebarnya.',st:[{t:'Lebar = 200 : 25 = ?',o:['8','175','5.000'],b:'8',p:'200 : 25 = 8 m.'},{t:'Periksa: 25 × 8 = ?',o:['200','175','33'],b:'200',p:'25 × 8 = 200, sama dengan luas yang diberikan.'}]},
  {say:'Persegi luasnya 144 cm². Cari sisinya.',st:[{t:'Sisi = akar kuadrat dari 144 = ?',o:['12','72','288'],b:'12',p:'12 × 12 = 144.'}]},
  {say:'Segitiga luasnya 98 cm², alas sama panjang dengan tinggi.',st:[{t:'alas × alas = 2 × 98 = ?',o:['196','98','49'],b:'196',p:'2 × 98 = 196.'},{t:'Berapa alas (sekaligus tinggi)?',o:['14','98','49'],b:'14',p:'14 × 14 = 196, jadi alas dan tinggi 14 cm.'}]}
];
var r5=0,pil5=[];
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);pil5=[];
  $('s5say').textContent='Periksa dan rancang.';setKata(d.say);
  clear($('s5chip'));clear($('s5periksa'));clear($('s5aksi'));$('s5tanya').textContent='';$('s5next').disabled=true;barisTeks('s5tampil',[d.say]);
  if(d.multi){
    d.multi.forEach(function(e){
      var b=el('button',null,e[0]);b.onclick=function(){var i=pil5.indexOf(e[0]);if(i>=0)pil5.splice(i,1);else pil5.push(e[0]);b.classList.toggle('pilih',i<0)};
      $('s5chip').appendChild(b);
    });
    var a=$('s5periksa');a.className='aksi';tombol(a,'Periksa',periksa5,'utama');
    msg('s5msg','','Ketuk semua yang luasnya 60, lalu Periksa. Kalikan panjang dan lebarnya.');
  }else{
    msg('s5msg','','Hitung, lalu periksa dengan memasukkan kembali ke rumus luas.');
    ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
  }
}
function periksa5(){
  var d=R5[r5],ben=d.multi.filter(function(e){return e[1]}).map(function(e){return e[0]});
  var benar=pil5.length===ben.length&&ben.every(function(x){return pil5.indexOf(x)>=0});
  if(!benar){msg('s5msg','warn','Belum tepat. Kalikan panjang dan lebar tiap pasangan, lalu bandingkan dengan 60.');return}
  var bs=$('s5chip').children;for(var i=0;i<bs.length;i++){bs[i].disabled=true;if(ben.indexOf(bs[i].textContent)>=0)bs[i].classList.add('ok')}
  barisTeks('s5tampil',d.multi.map(function(e){return e[0]+' : '+e[2]+(e[1]?' ✓':' ✗')}));
  clear($('s5periksa'));msg('s5msg','good','Tepat! Banyak pasangan berbeda bisa berluas sama.');$('s5next').disabled=false;
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Luas mundurmu tepat.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-27'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.petak({n:5}));w.appendChild(el('div','baca','5² = 27'));
})();

/* ---- bonus: mesin luas mundur ---- */
var bBang='pp';
function mulaiBonus(){
  $('bX').value='6';$('bA').value='8';bBang='pp';
  var w=$('bBangun');clear(w);
  [['pp','Persegi panjang'],['sq','Persegi'],['tri','Segitiga']].forEach(function(o){var b=tombol(w,o[1],function(){bBang=o[0];gambarBonus()});b.setAttribute('data-b',o[0])});
  gambarBonus();
}
function gambarBonus(){
  var x=+$('bX').value,a=+$('bA').value,L,l=[],bs=$('bBangun').children;
  for(var i=0;i<bs.length;i++)bs[i].classList.toggle('pilih',bs[i].getAttribute('data-b')===bBang);
  $('bNilaiX').textContent='Ukuran yang dicari: '+x;$('bNilaiA').textContent=bBang==='sq'?'(tidak dipakai pada persegi)':'Ukuran yang diketahui: '+a;
  if(bBang==='pp'){L=a*x;gambarDi('bGambar',gab('pp',{p:a,l:x},{p:a+' cm',l:'?',isi:'luas '+L}));l=['Luas = '+a+' × x = '+L,'x = '+L+' : '+a+' = '+x]}
  else if(bBang==='sq'){L=x*x;gambarDi('bGambar',{k:'petak',n:x});l=['Luas = sisi × sisi = '+L,'sisi = akar kuadrat dari '+L+' = '+x]}
  else{L=a*x/2;gambarDi('bGambar',gab('tri',{a:a,t:x},{a:a+' cm',t:'?'}));l=['Luas = ½ × '+a+' × x = '+fm(L),'x = (2 × '+fm(L)+') : '+a+' = '+x]}
  barisTeks('bTanda',l);
  msg('bmsg','good',bBang==='pp'?'Persegi panjang: luas dibagi ukuran yang diketahui.':(bBang==='sq'?'Persegi: akar kuadrat dari luas.':'Segitiga: dua kali luas dibagi ukuran yang diketahui.'));
}
$('bX').oninput=function(){gambarBonus()};
$('bA').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC27 = rakit(DASAR, { kode: 'AC-27', data: DATA_AC27 })
