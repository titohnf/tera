import { rakit } from './bersama'
import { DATA_AC30 } from './latihan/ac30'

/**
 * Materi interaktif AC-30 "Jam dan Durasi" (menghitung durasi, waktu mulai,
 * dan waktu selesai; satuan jam dan menit berbasis 60). Satu halaman HTML
 * mandiri, ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai
 * langkah Belajar di topik Misi AC-30. Disimpan sebagai string supaya ikut
 * terbundel di build tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-29 (anak kelas 4-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Jam berbasis 60: tambah menit pada jam analog; 45 + 30 = 75 menit =
 *    1 jam 15 menit, jadi 7.45 + 30 menit = 8.15 (bukan 7.75); 1 jam = 60
 *    menit, 90 menit = 1 jam 30 menit.
 * 2) Durasi dari garis waktu: selesai dikurangi mulai (8.00 sampai 10.00 = 2
 *    jam, bukan menghitung jam 8, 9, 10).
 * 3) Meminjam 60 menit: 8.20 sampai 10.05 = 1 jam 45 menit; cara lain lewat
 *    total menit sejak tengah malam (9.30 = 570, 12.10 = 730).
 * 4) Waktu selesai, waktu mulai, dan tengah malam: mulai + durasi; selesai -
 *    durasi; 23.00 sampai 01.00 = 2 jam (bukan 01 - 23 negatif).
 * 5) Jadwal dan rancang: kegiatan berturut-turut dijumlahkan; pembagian
 *    durasi menjadi sesi; sisa waktu sampai batas.
 * Bonus: pilih pukul mulai dan durasi; lihat pukul selesai pada jam.
 *
 * Soal Misi topik ini menguji: 1 jam = 60 menit, durasi = selesai - mulai,
 * meminjam 60 menit, melewati tengah malam, waktu selesai dan waktu mulai,
 * total durasi kegiatan berurutan, cara lain lewat total menit, dan salah
 * paham (pukul 7.75, menghitung jam bukan selisih, mengurangkan menit
 * negatif, menjumlahkan dua pukul, 01-23 negatif).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac30.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-30 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jam dan Durasi</title>
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
      <h1>Jam dan Durasi</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo hitung lama waktu dan pukul!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Tambah menit pada jam.</p>
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
    <p class="say" id="s2say">Hitung durasi dari garis waktu.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Pinjam 60 menit.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Mulai, selesai, dan tengah malam.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Susun jadwal.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin jam</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: pilih pukul mulai dan lama kegiatan.</p>
    <div class="panel"><div class="alat" id="bGambar"></div><div class="alat" id="bJam"></div>
      <div class="baca" id="bNilaiM"></div><input type="range" id="bM" min="0" max="1435" step="5" value="500" aria-label="Pukul mulai">
      <div class="baca" id="bNilaiD"></div><input type="range" id="bD" min="5" max="360" step="5" value="105" aria-label="Durasi"></div>
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
  if(id==='intro')setKata('Ayo hitung lama waktu dan pukul!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo hitung lama waktu dan pukul!');

/* ---- alat bantu ---- */
function uniq(benar,calon){var o=[String(benar)];calon.forEach(function(x){x=String(x);if(o.length<3&&o.indexOf(x)<0&&x.charAt(0)!=='-')o.push(x)});var t=1;while(o.length<3){var y=String(+benar+t++);if(o.indexOf(y)<0)o.push(y)}return o}
function ruteSteps(wadahAksi,tanyaId,msgId,steps,idx,selesai){
  var s=steps[idx];
  $(tanyaId).textContent=s.t;setKata(s.t);
  pilihan($(wadahAksi),s.o,s.b,function(){
    msg(msgId,'good',s.p);setKata(s.p);clear($(wadahAksi));$(tanyaId).textContent='';
    if(s.lihat)s.lihat();
    if(idx+1<steps.length)later(function(){ruteSteps(wadahAksi,tanyaId,msgId,steps,idx+1,selesai)},1500);
    else selesai();
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Ingat: 1 jam = 60 menit.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
function pad2(m){return m<10?'0'+m:String(m)}
function jm(t){var T=((t%1440)+1440)%1440,h=Math.floor(T/60),m=T%60;return (h===0?'00':String(h))+'.'+pad2(m)}
function dur(m){var h=Math.floor(m/60),n=m%60;return h===0?n+' menit':(n===0?h+' jam':h+' jam '+n+' menit')}
function mnt(h,m){return h*60+m}

/* ---- stasiun 1: jam berbasis 60 ---- */
var R1=[
  {a:[7,45],plus:30,x:{t:'Berapa menit dalam 1 jam?',o:['60 menit','100 menit','30 menit'],b:'60 menit',p:'1 jam = 60 menit, bukan 100.'}},
  {a:[6,40],plus:30},{a:[5,50],plus:25},{a:[8,30],plus:45}
];
var r1=0,jam1=null,jalan1=false;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=R1[r1],ta=mnt(d.a[0],d.a[1]);titik('s1dots',R1.length,r1);jalan1=false;
  var t='Pukul '+jm(ta)+'. Tambahkan '+d.plus+' menit.';$('s1say').textContent='Tambah menit pada jam.';setKata(t);
  gambarDi('s1alat',{k:'jam',t:ta,lab:jm(ta)});jam1=$('s1alat').firstChild;barisTeks('s1tampil',[t]);
  clear($('s1aksi'));$('s1tanya').textContent='';$('s1next').disabled=true;
  var a=$('s1mulai');clear(a);a.className='aksi';tombol(a,'Tambah '+d.plus+' menit',tambah1,'utama hint');
  msg('s1msg','','Satu putaran jarum panjang = 60 menit.');
}
function tambah1(){
  if(jalan1)return;jalan1=true;clear($('s1mulai'));
  var d=R1[r1],ta=mnt(d.a[0],d.a[1]),m=d.a[1],mm=m+d.plus,hasil=ta+d.plus,h=d.a[0];
  ayun(jam1,ta,hasil,1400);
  later(function(){
    barisTeks('s1tampil',['Pukul '+jm(ta)+' + '+d.plus+' menit = ?']);
    var st=[
      {t:'Jumlahkan menitnya: '+m+' + '+d.plus+' = ?',o:uniq(mm,[m,d.plus+60]),b:String(mm),p:m+' + '+d.plus+' = '+mm+' menit.'},
      {t:mm+' menit sama dengan...',o:[dur(mm),'1 jam '+mm+' menit',mm+' jam'],b:dur(mm),p:'Menit tidak berbasis 100 tetapi 60: '+mm+' menit = '+dur(mm)+'.'},
      {t:'Pukul berapa sekarang?',o:uniq(jm(hasil),[h+'.'+mm,(h+1)+'.'+mm]),b:jm(hasil),p:'Pukul '+jm(hasil)+'. Menulis '+h+'.'+mm+' salah, karena menit tidak boleh melebihi 59.',lihat:function(){barisTeks('s1tampil',[jm(ta)+' + '+d.plus+' menit = '+jm(hasil)])}}
    ];
    if(d.x)st.unshift(d.x);
    ruteSteps('s1aksi','s1tanya','s1msg',st,0,function(){$('s1next').disabled=false});
  },1700);
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: durasi dari garis waktu ---- */
var R2=[
  {a:[8,0],b:[10,0],x:{t:'Made menghitung "jam 8, jam 9, jam 10" dan menjawab 3 jam. Mengapa keliru?',o:['Ia menghitung titik jam, bukan selisihnya; durasinya 10 − 8 = 2 jam','Jawaban 3 jam benar'],b:'Ia menghitung titik jam, bukan selisihnya; durasinya 10 − 8 = 2 jam',p:'Durasi = waktu selesai dikurangi waktu mulai.'}},
  {a:[7,0],b:[9,30]},{a:[13,0],b:[15,20]},{a:[10,0],b:[10,45]},{a:[22,0],b:[23,30]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2],a=mnt(d.a[0],d.a[1]),b=mnt(d.b[0],d.b[1]),dh=d.b[0]-d.a[0],dm=d.b[1]-d.a[1],D=b-a;titik('s2dots',R2.length,r2);
  var t='Kegiatan dari pukul '+jm(a)+' sampai pukul '+jm(b)+'. Berapa lamanya?';$('s2say').textContent='Hitung durasi dari garis waktu.';setKata(t);
  gambarDi('s2alat',{k:'lini',a:a,b:b,lab:{a:jm(a),b:jm(b)}});barisTeks('s2tampil',[t,'Durasi = selesai − mulai']);
  var st=[
    {t:'Selisih jam: '+d.b[0]+' − '+d.a[0]+' = ?',o:uniq(dh,[dh+1,d.b[0]+d.a[0]]),b:String(dh),p:d.b[0]+' − '+d.a[0]+' = '+dh+' jam.'},
    {t:'Selisih menit: '+d.b[1]+' − '+d.a[1]+' = ?',o:uniq(dm,[dm+60,d.b[1]+d.a[1]]),b:String(dm),p:d.b[1]+' − '+d.a[1]+' = '+dm+' menit.'},
    {t:'Jadi durasinya...',o:uniq(dur(D),[dur(D+60),dur(D+30)]),b:dur(D),p:'Durasi '+dur(D)+'.',lihat:function(){gambarDi('s2alat',{k:'lini',a:a,b:b,lab:{a:jm(a),b:jm(b),d:dur(D)}})}}
  ];
  if(d.x)st.unshift(d.x);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Jarak antara dua titik merah di garis waktu adalah durasinya.');
  ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: meminjam 60 menit ---- */
var R3=[
  {a:[8,20],b:[10,5]},{a:[7,35],b:[9,10]},{a:[7,45],b:[9,15]},{a:[9,50],b:[10,5]},{a:[6,50],b:[8,5]},{a:[9,30],b:[12,10],konv:true}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3],h1=d.a[0],m1=d.a[1],h2=d.b[0],m2=d.b[1],a=mnt(h1,m1),b=mnt(h2,m2),D=b-a,st;titik('s3dots',R3.length,r3);
  var t='Kegiatan dari pukul '+jm(a)+' sampai pukul '+jm(b)+'. Berapa lamanya?';$('s3say').textContent='Pinjam 60 menit.';setKata(t);
  gambarDi('s3alat',{k:'lini',a:a,b:b,lab:{a:jm(a),b:jm(b)}});barisTeks('s3tampil',[t]);
  if(d.konv){
    st=[
      {t:'Ubah pukul '+jm(a)+' menjadi menit sejak tengah malam: '+h1+' × 60 + '+m1+' = ?',o:uniq(a,[h1+m1,a+60]),b:String(a),p:h1+' × 60 + '+m1+' = '+a+' menit.'},
      {t:'Ubah pukul '+jm(b)+': '+h2+' × 60 + '+m2+' = ?',o:uniq(b,[h2+m2,b+60]),b:String(b),p:h2+' × 60 + '+m2+' = '+b+' menit.'},
      {t:'Selisih '+b+' − '+a+' = '+D+' menit. Itu sama dengan...',o:uniq(dur(D),['2 jam 16 menit',dur(D+20)]),b:dur(D),p:D+' menit = '+dur(D)+'.',lihat:function(){gambarDi('s3alat',{k:'lini',a:a,b:b,lab:{a:jm(a),b:jm(b),d:dur(D)}})}},
      {t:'Cara total menit dan cara meminjam 60 menit menghasilkan jawaban...',o:['yang sama','yang berbeda'],b:'yang sama',p:'Kedua cara benar dan selalu memberi durasi yang sama.'}
    ];
  }else{
    var sel=h2-1-h1,menit=m2+60-m1;
    st=[
      {t:'Menit '+m2+' lebih kecil daripada '+m1+'. Pinjam 1 jam (60 menit): '+m2+' + 60 = ?',o:uniq(m2+60,[m2,60-m1]),b:String(m2+60),p:'Menit selesai menjadi '+(m2+60)+', jam selesai turun 1 menjadi '+(h2-1)+'.'},
      {t:'Selisih jam: '+(h2-1)+' − '+h1+' = ?',o:uniq(sel,[h2-h1,sel+1]),b:String(sel),p:(h2-1)+' − '+h1+' = '+sel+' jam.'},
      {t:'Selisih menit: '+(m2+60)+' − '+m1+' = ?',o:uniq(menit,[m1-m2,menit+60]),b:String(menit),p:(m2+60)+' − '+m1+' = '+menit+' menit.'},
      {t:'Jadi durasinya...',o:uniq(dur(D),[dur(D+60),dur(D-30>0?D-30:D+15)]),b:dur(D),p:'Durasi '+dur(D)+'.',lihat:function(){gambarDi('s3alat',{k:'lini',a:a,b:b,lab:{a:jm(a),b:jm(b),d:dur(D)}})}}
    ];
  }
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','',d.konv?'Cara lain: ubah dua pukul menjadi menit dulu.':'Jika menit selesai lebih kecil, pinjam 1 jam = 60 menit.');
  ruteSteps('s3aksi','s3tanya','s3msg',st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: mulai, selesai, tengah malam ---- */
var R4=[
  {j:'plus',a:[9,0],d:105},{j:'plus',a:[6,40],d:95},
  {j:'minus',b:[10,0],d:100},{j:'minus',b:[11,0],d:85},
  {j:'malam',a:[23,0],b:[1,0]},{j:'malam2',a:[23,10],d:150}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4],st,a,b,t;titik('s4dots',R4.length,r4);
  if(d.j==='plus'){
    a=mnt(d.a[0],d.a[1]);b=a+d.d;var mm=d.a[1]+d.d%60,carry=Math.floor(mm/60),dh=Math.floor(d.d/60),jt=d.a[0]+dh+carry,mt=mm%60;
    t='Kegiatan mulai pukul '+jm(a)+' dan berdurasi '+dur(d.d)+'. Pukul berapa selesai?';
    st=[
      {t:'Jumlahkan menit: '+d.a[1]+' + '+d.d%60+' = ?',o:uniq(mm,[d.a[1],mm+60]),b:String(mm),p:d.a[1]+' + '+d.d%60+' = '+mm+' menit.'},
      {t:'Jam selesai: '+d.a[0]+' + '+dh+(carry?' + 1 (dari '+mm+' menit)':'')+' = ?',o:uniq(jt,[d.a[0]+dh,jt+1]),b:String(jt),p:'Jam menjadi '+jt+', menitnya '+pad2(mt)+'.'},
      {t:'Pukul selesai...',o:uniq(jm(b),[d.a[0]+dh+'.'+mm,jm(b+30)]),b:jm(b),p:'Pukul '+jm(b)+'.',lihat:function(){gambarDi('s4alat',{k:'lini',a:a,b:b,lab:{a:jm(a),b:jm(b),d:dur(d.d)}})}}
    ];
  }else if(d.j==='minus'){
    b=mnt(d.b[0],d.b[1]);var dh2=Math.floor(d.d/60),dm2=d.d%60,mid=b-dh2*60;a=b-d.d;
    t='Kegiatan harus selesai pukul '+jm(b)+' dan berdurasi '+dur(d.d)+'. Pukul berapa harus mulai?';
    st=[
      {t:'Mulai = selesai − durasi. '+jm(b)+' − '+dh2+' jam = ?',o:uniq(jm(mid),[jm(mid+60),jm(b+dh2*60)]),b:jm(mid),p:jm(b)+' − '+dh2+' jam = '+jm(mid)+'.'},
      {t:jm(mid)+' − '+dm2+' menit = ?',o:uniq(jm(a),[jm(mid-dm2-30),jm(mid+dm2)]),b:jm(a),p:'Mulai pukul '+jm(a)+'.',lihat:function(){gambarDi('s4alat',{k:'lini',a:a,b:b,lab:{a:jm(a),b:jm(b),d:dur(d.d)}})}}
    ];
  }else if(d.j==='malam'){
    a=mnt(d.a[0],d.a[1]);b=mnt(d.b[0],d.b[1])+1440;
    t='Kegiatan dari pukul '+jm(a)+' sampai pukul '+jm(b)+' keesokan harinya. Berapa lamanya?';
    st=[
      {t:'Dari 23.00 sampai tengah malam (24.00) berapa jam?',o:['1','23','24'],b:'1',p:'23.00 ke 24.00 = 1 jam.'},
      {t:'Dari 24.00 sampai 01.00 berapa jam?',o:['1','24','25'],b:'1',p:'24.00 ke 01.00 = 1 jam.'},
      {t:'Durasi total?',o:['2 jam','22 jam','−22 jam'],b:'2 jam',p:'1 + 1 = 2 jam.',lihat:function(){gambarDi('s4alat',{k:'lini',a:a,b:b,lab:{a:jm(a),b:jm(b),d:'2 jam'}})}},
      {t:'Dedi menghitung 01 − 23 = −22 dan bingung. Mengapa tidak bisa langsung?',o:['Karena melewati tengah malam; tambah 24 jam: 25 − 23 = 2 jam','Karena −22 jam adalah jawaban yang benar'],b:'Karena melewati tengah malam; tambah 24 jam: 25 − 23 = 2 jam',p:'Pukul 01.00 keesokan harinya sama dengan 25.00.'}
    ];
  }else{
    a=mnt(d.a[0],d.a[1]);b=a+d.d;
    t='Kegiatan mulai pukul '+jm(a)+' dan berdurasi '+dur(d.d)+'. Pukul berapa selesai?';
    st=[
      {t:'Menit: 10 + 30 = ?',o:['40','30','70'],b:'40',p:'10 + 30 = 40 menit.'},
      {t:'Jam: 23 + 2 = ?',o:['25','24','21'],b:'25',p:'23 + 2 = 25.'},
      {t:'Pukul 25.40 sama dengan pukul...',o:['01.40 keesokan harinya','25.40','00.40'],b:'01.40 keesokan harinya',p:'Kurangi 24 jam: 25.40 − 24 = 01.40.',lihat:function(){gambarDi('s4alat',{k:'lini',a:a,b:b,lab:{a:jm(a),b:jm(b),d:dur(d.d)}})}}
    ];
  }
  $('s4say').textContent='Mulai, selesai, dan tengah malam.';setKata(t);
  gambarDi('s4alat',{k:'lini',a:a,b:b,lab:{a:d.j==='minus'?'?':jm(a),b:d.j==='plus'||d.j==='malam2'?'?':jm(b)}});barisTeks('s4tampil',[t]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Waktu selesai = mulai + durasi. Waktu mulai = selesai − durasi.');
  ruteSteps('s4aksi','s4tanya','s4msg',st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: jadwal dan rancang ---- */
var R5=[
  {say:'Pilih semua pembagian 150 menit menjadi dua sesi.',multi:[['60 dan 90 menit',true,'60 + 90 = 150'],['75 dan 75 menit',true,'75 + 75 = 150'],['100 dan 40 menit',false,'100 + 40 = 140'],['30 dan 120 menit',true,'30 + 120 = 150'],['80 dan 80 menit',false,'80 + 80 = 160']]},
  {say:'Tiga kegiatan berturut-turut tanpa jeda: 45 menit, 1 jam 20 menit, dan 30 menit.',st:[
    {t:'Ubah 1 jam 20 menit menjadi menit.',o:['80','120','60'],b:'80',p:'60 + 20 = 80 menit.'},
    {t:'Total = 45 + 80 + 30 = ?',o:['155','145','165'],b:'155',p:'45 + 80 + 30 = 155 menit.'},
    {t:'155 menit sama dengan...',o:['2 jam 35 menit','1 jam 55 menit','2 jam 55 menit'],b:'2 jam 35 menit',p:'155 = 120 + 35.'}]},
  {say:'Jadwal mulai pukul 7.00: kegiatan 50 menit, 40 menit, dan 30 menit berturut-turut.',st:[
    {t:'Total durasi = 50 + 40 + 30 = ?',o:['120','110','130'],b:'120',p:'120 menit = 2 jam.'},
    {t:'Selesai pukul berapa? (7.00 + 2 jam)',o:['9.00','8.00','10.00'],b:'9.00',p:'Selesai pukul 9.00.'}]},
  {say:'Kegiatan mulai 6.45 dan harus selesai tepat pukul 9.00.',st:[
    {t:'Dari 6.45 ke 7.00 berapa menit?',o:['15','45','25'],b:'15',p:'60 − 45 = 15 menit.'},
    {t:'Dari 7.00 ke 9.00 = 120 menit. Durasi maksimal?',o:['135','165','120'],b:'135',p:'15 + 120 = 135 menit.'}]},
  {say:'Total latihan 2 jam dibagi dua sesi. Sesi pertama 55 menit.',st:[
    {t:'2 jam sama dengan berapa menit?',o:['120','200','60'],b:'120',p:'2 × 60 = 120.'},
    {t:'Sesi kedua = 120 − 55 = ?',o:['65','175','55'],b:'65',p:'120 − 55 = 65 menit.'}]},
  {say:'Tiga kegiatan total 4 jam. Kegiatan 1: 1 jam 15 menit. Kegiatan 2: 1 jam 45 menit.',st:[
    {t:'1 jam 15 menit + 1 jam 45 menit = ?',o:['3 jam','2 jam 60 menit','2 jam 15 menit'],b:'3 jam',p:'15 + 45 = 60 menit = 1 jam, jadi 3 jam.'},
    {t:'Kegiatan ketiga = 4 jam − 3 jam = ?',o:['1 jam','7 jam','45 menit'],b:'1 jam',p:'4 − 3 = 1 jam.'}]}
];
var r5=0,pil5=[];
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);pil5=[];
  $('s5say').textContent='Susun jadwal.';setKata(d.say);
  clear($('s5chip'));clear($('s5periksa'));clear($('s5aksi'));$('s5tanya').textContent='';$('s5next').disabled=true;barisTeks('s5tampil',[d.say]);
  if(d.multi){
    d.multi.forEach(function(e){
      var b=el('button',null,e[0]);b.onclick=function(){var i=pil5.indexOf(e[0]);if(i>=0)pil5.splice(i,1);else pil5.push(e[0]);b.classList.toggle('pilih',i<0)};
      $('s5chip').appendChild(b);
    });
    var a=$('s5periksa');a.className='aksi';tombol(a,'Periksa',periksa5,'utama');
    msg('s5msg','','Ketuk semua yang jumlahnya tepat 150 menit, lalu Periksa.');
  }else{
    msg('s5msg','','Ubah ke menit dulu bila perlu, lalu jumlahkan atau kurangkan.');
    ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
  }
}
function periksa5(){
  var d=R5[r5],ben=d.multi.filter(function(e){return e[1]}).map(function(e){return e[0]});
  var benar=pil5.length===ben.length&&ben.every(function(x){return pil5.indexOf(x)>=0});
  if(!benar){msg('s5msg','warn','Belum tepat. Jumlahkan kedua sesi, bandingkan dengan 150 menit.');return}
  var bs=$('s5chip').children;for(var i=0;i<bs.length;i++){bs[i].disabled=true;if(ben.indexOf(bs[i].textContent)>=0)bs[i].classList.add('ok')}
  barisTeks('s5tampil',d.multi.map(function(e){return e[0]+' : '+e[2]+(e[1]?' ✓':' ✗')}));
  clear($('s5periksa'));msg('s5msg','good','Tepat! Banyak pembagian berbeda bisa berjumlah 150 menit.');$('s5next').disabled=false;
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Jam dan durasimu tepat.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-30'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.petak({n:5}));w.appendChild(el('div','baca','5² = 30'));
})();

/* ---- bonus: mesin jam ---- */
function mulaiBonus(){$('bM').value='500';$('bD').value='105';gambarBonus()}
function gambarBonus(){
  var M=+$('bM').value,D=+$('bD').value,E=M+D,esok=E>=1440;
  $('bNilaiM').textContent='Mulai: '+jm(M);$('bNilaiD').textContent='Durasi: '+dur(D);
  gambarDi('bGambar',{k:'lini',a:M,b:E,lab:{a:jm(M),b:jm(E),d:dur(D)}});
  gambarDi('bJam',{k:'jam',t:E,lab:jm(E)+(esok?' (keesokan harinya)':'')});
  barisTeks('bTanda',['Mulai '+jm(M)+' + '+dur(D)+' = '+jm(E)+(esok?' keesokan harinya':''),'Periksa: '+jm(E)+(esok?' (+24 jam)':'')+' − '+jm(M)+' = '+dur(D)]);
  msg('bmsg',esok?'good':'',esok?'Melewati tengah malam: pukul bertambah 24 jam sebelum dikurangi.':'Geser mulai ke malam hari untuk melewati tengah malam.');
}
$('bM').oninput=function(){gambarBonus()};
$('bD').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC30 = rakit(DASAR, { kode: 'AC-30', data: DATA_AC30 })
