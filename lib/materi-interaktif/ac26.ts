import { rakit } from './bersama'
import { DATA_AC26 } from './latihan/ac26'

/**
 * Materi interaktif AC-26 "Rumah dari Bangun" (luas dan keliling bangun datar
 * gabungan: persegi panjang dan segitiga). Satu halaman HTML mandiri,
 * ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah
 * Belajar di topik Misi AC-26. Disimpan sebagai string supaya ikut terbundel di
 * build tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-25 (anak kelas 5-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Bagi bangun: bangun gabungan dipecah menjadi bangun sederhana (rumah,
 *    trapesium, layang-layang); langkah pertama adalah membagi, bukan
 *    p x l langsung.
 * 2) Luas segitiga: setengah x alas x tinggi; tinggi tegak lurus alas, bukan
 *    sisi miring (6 x 8 : 2 = 24, bukan memakai 10).
 * 3) Luas total: luas bagian dijumlahkan (bukan dikali); sisi yang menyatu
 *    tetap ikut sebagai bagian luas.
 * 4) Keliling: telusuri garis terluar; sisi yang menyatu tidak dihitung;
 *    jumlah keliling penuh dikurangi DUA kali sisi menyatu.
 * 5) Rancang: dari luas total cari luas atap, lalu tinggi atap; layang-layang
 *    dari luas total.
 * Bonus: geser panjang, lebar, dan tinggi atap rumah; lihat luas bagian dan
 * luas total.
 *
 * Soal Misi topik ini menguji: arti bangun gabungan, rumus luas segitiga dan
 * tinggi tegak lurus, membagi bangun, luas total, keliling terluar, cerita
 * (taman, kolam, rumah, layang-layang), memeriksa, rancang, dan salah paham
 * (p x l langsung, keliling penuh kedua bangun, sisi miring sebagai tinggi,
 * luas dikali, hasil beda bila pembagian berbeda).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac26.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-26 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rumah dari Bangun</title>
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
      <h1>Rumah dari Bangun</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo hitung luas dan keliling bangun gabungan!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Bagi bangun menjadi bangun sederhana.</p>
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
    <p class="say" id="s2say">Hitung luas segitiga.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Jumlahkan luas bagian-bagiannya.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Telusuri keliling terluar.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Rancang bagian yang kurang.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: rumah ajaib</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: atur ukuran rumah.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNilaiP"></div><input type="range" id="bP" min="4" max="14" value="10" aria-label="Panjang">
      <div class="baca" id="bNilaiL"></div><input type="range" id="bL" min="3" max="10" value="6" aria-label="Lebar">
      <div class="baca" id="bNilaiT"></div><input type="range" id="bT" min="2" max="8" value="4" aria-label="Tinggi atap"></div>
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
  if(id==='intro')setKata('Ayo hitung luas dan keliling bangun gabungan!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo hitung luas dan keliling bangun gabungan!');

/* ---- alat bantu ---- */
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
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Lihat gambarnya dan hitung lagi.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
function gab(jenis,d,lab,o){var g={k:'gabungan',jenis:jenis,lab:lab||{}};for(var k in d)g[k]=d[k];if(o)for(var q in o)g[q]=o[q];return g}

/* ---- stasiun 1: bagi bangun ---- */
var R1=[
  {j:'rumah',d:{p:12,l:7,t:4},lab:{p:'12 cm',l:'7 cm',t:'4 cm'},o:['persegi panjang dan segitiga','dua persegi panjang','satu lingkaran'],b:'persegi panjang dan segitiga'},
  {j:'siku',d:{p:8,l:5,a:3},lab:{p:'8 cm',l:'5 cm',a:'3 cm'},o:['persegi panjang dan segitiga siku-siku','dua persegi panjang','satu lingkaran'],b:'persegi panjang dan segitiga siku-siku'},
  {j:'layang',d:{a:8,t:3,t2:6},lab:{a:'8 cm',t:'3 cm',t2:'6 cm'},o:['dua segitiga','dua persegi panjang','satu lingkaran'],b:'dua segitiga'}
];
var r1=0,jalan1=false;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1];titik('s1dots',R1.length,r1);jalan1=false;
  var t='Bangun gabungan terbentuk dari beberapa bangun sederhana.';$('s1say').textContent='Bagi bangun menjadi bangun sederhana.';setKata(t);
  gambarDi('s1alat',gab(d.j,d.d,d.lab));barisTeks('s1tampil',['Bangun gabungan']);
  clear($('s1aksi'));$('s1tanya').textContent='';$('s1next').disabled=true;
  var a=$('s1mulai');clear(a);a.className='aksi';tombol(a,'Bagi bangun',bagi1,'utama hint');
  msg('s1msg','','Garis putus-putus merah menunjukkan sisi tempat bangun-bangun itu menyatu.');
}
function bagi1(){
  if(jalan1)return;jalan1=true;clear($('s1mulai'));
  var d=R1[r1];
  gambarDi('s1alat',gab(d.j,d.d,d.lab,{pisah:true}));barisTeks('s1tampil',['Dibagi di sisi yang menyatu']);
  later(function(){gambarDi('s1alat',gab(d.j,d.d,d.lab,{pisah:true,sorot:d.j==='layang'?'seg':'persegi'}));barisTeks('s1tampil',[d.j==='layang'?'Bagian 1: segitiga atas':'Bagian 1: persegi panjang'])},900);
  later(function(){gambarDi('s1alat',gab(d.j,d.d,d.lab,{pisah:true,sorot:d.j==='layang'?'persegi':'seg'}));barisTeks('s1tampil',[d.j==='layang'?'Bagian 2: segitiga bawah':'Bagian 2: segitiga'])},1800);
  later(function(){
    gambarDi('s1alat',gab(d.j,d.d,d.lab,{pisah:true}));barisTeks('s1tampil',['Sudah terbagi']);
    var st=[
      {t:'Bangun ini terbentuk dari...',o:d.o,b:d.b,p:'Bangun gabungan terbentuk dari '+d.b+'.'},
      {t:'Langkah PERTAMA menghitung luas bangun gabungan adalah...',o:['membagi menjadi bangun sederhana yang rumus luasnya diketahui','langsung mengalikan panjang terpanjang dengan lebar terlebar','menjumlahkan semua sisi'],b:'membagi menjadi bangun sederhana yang rumus luasnya diketahui',p:'Bagi dulu. Rumus p × l hanya berlaku untuk persegi panjang.'}
    ];
    ruteSteps('s1aksi','s1tanya','s1msg',st,0,function(){$('s1next').disabled=false});
  },2700);
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: luas segitiga ---- */
var R2=[{a:8,t:5},{a:10,t:6},{a:6,t:8,m:10},{a:9,t:8}];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2],L=d.a*d.t/2;titik('s2dots',R2.length,r2);
  var lab={a:d.a+' cm',t:d.t+' cm'};if(d.m)lab.m=d.m+' cm';
  var t='Segitiga beralas '+d.a+' cm.';$('s2say').textContent='Hitung luas segitiga.';setKata(t);
  gambarDi('s2alat',gab('tri',{a:d.a,t:d.t},lab));barisTeks('s2tampil',['Luas = ½ × alas × tinggi']);
  var st=[];
  if(d.m)st.push({t:'Manakah yang merupakan TINGGI segitiga?',o:['8 cm, garis putus-putus yang tegak lurus alas','10 cm, sisi miring'],b:'8 cm, garis putus-putus yang tegak lurus alas',p:'Tinggi diukur tegak lurus terhadap alas, bukan sepanjang sisi miring.'});
  st.push({t:'Berapa luas segitiga? (½ × '+d.a+' × '+d.t+')',o:uniq(L,[d.a*d.t,d.m?d.a*d.m/2:d.a+d.t]),b:String(L),p:'Luas = ½ × '+d.a+' × '+d.t+' = '+L+' cm persegi.',lihat:function(){barisTeks('s2tampil',['½ × '+d.a+' × '+d.t+' = '+L+' cm²'])}});
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Segitiga adalah setengah dari persegi panjang beralas dan bertinggi sama.');
  ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: luas total ---- */
var R3=[
  {j:'rumah',d:{p:12,l:7,t:4},x:true},
  {j:'rumah',d:{p:7,l:7,t:4}},
  {j:'samping',d:{p:9,l:4,t:3}},
  {j:'samping',d:{p:6,l:6,t:4}}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3],p=d.d.p,l=d.d.l,t=d.d.t,al=d.j==='rumah'?p:l,pl=p*l,tri=al*t/2,tot=pl+tri,lab={p:p+' cm',l:l+' cm',t:t+' cm'};
  var bound=d.j==='rumah'?p*(l+t):(p+t)*l;titik('s3dots',R3.length,r3);
  var tt='Hitung luas total bangun gabungan.';$('s3say').textContent=tt;setKata(tt);
  gambarDi('s3alat',gab(d.j,d.d,lab,{pisah:true}));barisTeks('s3tampil',['Luas total = luas persegi panjang + luas segitiga']);
  var st=[
    {t:'Berapa luas persegi panjang? ('+p+' × '+l+')',o:uniq(pl,[p+l,2*(p+l)]),b:String(pl),p:p+' × '+l+' = '+pl+' cm persegi.',lihat:function(){gambarDi('s3alat',gab(d.j,d.d,lab,{pisah:true,sorot:'persegi'}));barisTeks('s3tampil',[p+' × '+l+' = '+pl])}},
    {t:'Berapa luas segitiga? (½ × '+al+' × '+t+')',o:uniq(tri,[al*t,al+t]),b:String(tri),p:'½ × '+al+' × '+t+' = '+tri+' cm persegi.',lihat:function(){gambarDi('s3alat',gab(d.j,d.d,lab,{pisah:true,sorot:'seg'}));barisTeks('s3tampil',[p+' × '+l+' = '+pl,'½ × '+al+' × '+t+' = '+tri])}},
    {t:'Luas total = '+pl+' + '+tri+' = ?',o:uniq(tot,[bound,pl*tri]),b:String(tot),p:'Luas total '+tot+' cm persegi. Luas dijumlahkan, bukan dikalikan.',lihat:function(){gambarDi('s3alat',gab(d.j,d.d,lab,{pisah:true}));barisTeks('s3tampil',[pl+' + '+tri+' = '+tot+' cm²'])}}
  ];
  if(d.x)st.push({t:'Dedi mengalikan luas kedua bagian ('+pl+' × '+tri+'). Tepatkah?',o:['Tidak. Luas total adalah JUMLAH luas bagian-bagiannya','Ya, bagian-bagian dikalikan'],b:'Tidak. Luas total adalah JUMLAH luas bagian-bagiannya',p:'Kedua bagian menempati tempat yang berbeda, jadi luasnya ditambahkan.'});
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Hitung tiap bagian, lalu jumlahkan.');
  ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: keliling ---- */
var R4=[
  {p:8,l:5,m:6,t:4.5},
  {p:10,l:6,m:7,t:5,x:true},
  {p:6,l:6,m:5,t:4}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4],kel=2*d.l+d.p+2*d.m,penuh=2*(d.p+d.l)+(d.p+2*d.m),lab={p:d.p+' cm',l:d.l+' cm',m:d.m+' cm'};titik('s4dots',R4.length,r4);
  var tt='Hitung keliling bangun gabungan.';$('s4say').textContent=tt;setKata(tt);
  gambarDi('s4alat',gab('rumah',{p:d.p,l:d.l,t:d.t},lab,{pisah:true}));barisTeks('s4tampil',['Keliling = garis terluar']);
  var st=[
    {t:'Sisi manakah yang TIDAK menjadi bagian keliling?',o:['sisi yang menyatu (garis merah putus-putus)','sisi tegak persegi panjang','sisi miring segitiga'],b:'sisi yang menyatu (garis merah putus-putus)',p:'Sisi yang menyatu ada di dalam bangun, bukan batas terluar.'},
    {t:'Berapa keliling totalnya? ('+d.l+' + '+d.l+' + '+d.p+' + '+d.m+' + '+d.m+')',o:uniq(kel,[penuh,kel-d.p]),b:String(kel),p:'Keliling = '+d.l+' + '+d.l+' + '+d.p+' + '+d.m+' + '+d.m+' = '+kel+' cm.',lihat:function(){barisTeks('s4tampil',[d.l+' + '+d.l+' + '+d.p+' + '+d.m+' + '+d.m+' = '+kel+' cm'])}}
  ];
  if(d.x)st.push({t:'Menjumlahkan keliling PENUH kedua bangun memberi '+penuh+'. Berapa yang harus dikurangkan?',o:['dua kali sisi yang menyatu ('+2*d.p+')','satu kali sisi yang menyatu ('+d.p+')'],b:'dua kali sisi yang menyatu ('+2*d.p+')',p:'Sisi yang menyatu terhitung dua kali di keliling penuh, dan tidak boleh dihitung sama sekali. Jadi dikurangi 2 × '+d.p+'.'});
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Ikuti garis tepi bangun dari satu titik sampai kembali.');
  ruteSteps('s4aksi','s4tanya','s4msg',st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: rancang ---- */
var R5=[
  {say:'Rumah: persegi panjang 10 × 10 cm (luas 100). Luas total harus 130 cm². Alas atap 10 cm.',g:gab('rumah',{p:10,l:10,t:6},{p:'10 cm',l:'10 cm',t:'?'},{pisah:true}),st:[
    {t:'Berapa luas atap segitiga yang dibutuhkan?',o:['30','230','13'],b:'30',p:'130 − 100 = 30 cm persegi.'},
    {t:'Tinggi atap? (½ × 10 × t = 30)',o:['6','3','30'],b:'6',p:'5 × t = 30, jadi t = 6 cm.'}]},
  {say:'Taman: persegi panjang luas 72 m², lebar 8 m. Luas total harus 96 m². Alas segitiga 8 m.',g:gab('samping',{p:9,l:8,t:6},{p:'9 m',l:'8 m',t:'?'},{pisah:true}),st:[
    {t:'Berapa luas segitiga yang dibutuhkan?',o:['24','168','12'],b:'24',p:'96 − 72 = 24 m persegi.'},
    {t:'Tinggi segitiga? (½ × 8 × t = 24)',o:['6','3','12'],b:'6',p:'4 × t = 24, jadi t = 6 m.'}]},
  {say:'Layang-layang: dua segitiga beralas 14 cm. Tinggi atas 3 cm. Luas total 84 cm².',g:gab('layang',{a:14,t:3,t2:9},{a:'14 cm',t:'3 cm',t2:'?'}),st:[
    {t:'Berapa luas segitiga atas? (½ × 14 × 3)',o:['21','42','17'],b:'21',p:'½ × 14 × 3 = 21 cm persegi.'},
    {t:'Berapa luas segitiga bawah? (84 − 21)',o:['63','105','42'],b:'63',p:'84 − 21 = 63 cm persegi.'},
    {t:'Tinggi segitiga bawah? (½ × 14 × t = 63)',o:['9','4,5','63'],b:'9',p:'7 × t = 63, jadi t = 9 cm.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Rancang bagian yang kurang.';setKata(d.say);
  gambarDi('s5alat',d.g);barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Kurangi luas total dengan luas bagian yang sudah ada.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Rumahmu dihitung dengan tepat.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-26'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.petak({n:5}));w.appendChild(el('div','baca','5² = 26'));
})();

/* ---- bonus: rumah ajaib ---- */
function mulaiBonus(){$('bP').value='10';$('bL').value='6';$('bT').value='4';gambarBonus()}
function gambarBonus(){
  var p=+$('bP').value,l=+$('bL').value,t=+$('bT').value,pl=p*l,tri=p*t/2,tot=pl+tri;
  $('bNilaiP').textContent='Panjang: '+p+' cm';$('bNilaiL').textContent='Lebar: '+l+' cm';$('bNilaiT').textContent='Tinggi atap: '+t+' cm';
  gambarDi('bGambar',gab('rumah',{p:p,l:l,t:t},{p:p+' cm',l:l+' cm',t:t+' cm'},{pisah:true}));
  barisTeks('bTanda',['Persegi panjang: '+p+' × '+l+' = '+pl,'Segitiga: ½ × '+p+' × '+t+' = '+fm(tri),'Luas total = '+fm(tot)+' cm²']);
  msg('bmsg','good','Luas total adalah jumlah luas bagian-bagiannya.');
}
$('bP').oninput=function(){gambarBonus()};
$('bL').oninput=function(){gambarBonus()};
$('bT').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC26 = rakit(DASAR, { kode: 'AC-26', data: DATA_AC26 })
