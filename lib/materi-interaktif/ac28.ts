import { rakit } from './bersama'
import { DATA_AC28 } from './latihan/ac28'

/**
 * Materi interaktif AC-28 "Isi dan Kulit Kotak" (volume dan luas permukaan
 * kubus, balok, dan bangun ruang gabungan). Satu halaman HTML mandiri,
 * ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah
 * Belajar di topik Misi AC-28. Disimpan sebagai string supaya ikut terbundel di
 * build tanpa membaca berkas saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-27 (anak kelas 5-6, tiap stasiun beranimasi).
 * Lima stasiun praktik:
 * 1) Volume: tambah lapisan satu per satu; volume = p x l x t (bukan
 *    penjumlahan 5 + 4 + 3); kubus s x s x s; 6 x s x s adalah luas
 *    permukaan, bukan volume.
 * 2) Luas permukaan: tiga pasang sisi (atas-bawah, depan-belakang, samping),
 *    2 x (pl + pt + lt); kubus punya 6 sisi sama (bukan 5).
 * 3) Volume atau luas permukaan: satuan (cm kubik dan cm persegi), angka bisa
 *    kebetulan sama (kubus 6 cm: 216), rumus 2 x (pl + pt + lt) bukan volume.
 * 4) Volume gabungan: jumlahkan volume tiap bagian tanpa pengurangan.
 * 5) Luas permukaan gabungan: jumlah luas permukaan dikurangi DUA kali luas
 *    bidang yang menempel.
 * Bonus: geser panjang, lebar, tinggi; lihat volume dan luas permukaan.
 *
 * Soal Misi topik ini menguji: rumus volume dan luas permukaan kubus dan
 * balok, satuan, gabungan, rancang (cari tinggi, rusuk), dan salah paham
 * (jumlah bukan kali, 5 sisi, satuan persegi untuk volume, luas permukaan
 * gabungan dijumlah penuh, balok pasti kubus).
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac28.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa. Nama
 * fungsi di halaman ini tidak boleh sama dengan nama di pustaka gambar atau
 * mesin (mis. sg, el, belah, kanvas, fmtId, titikRibu, koma2): semuanya satu
 * cakupan.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-28 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Isi dan Kulit Kotak</title>
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
      <h1>Isi dan Kulit Kotak</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo hitung isi dan kulit kotak!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Susun lapisan demi lapisan.</p>
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
    <p class="say" id="s2say">Hitung semua sisi kotak.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Isi atau kulit?</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Gabungkan isi dua kotak.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Gabungkan kulit dua kotak.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: kotak ajaib</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: atur ukuran kotak.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNilaiP"></div><input type="range" id="bP" min="1" max="10" value="5" aria-label="Panjang">
      <div class="baca" id="bNilaiL"></div><input type="range" id="bL" min="1" max="10" value="4" aria-label="Lebar">
      <div class="baca" id="bNilaiT"></div><input type="range" id="bT" min="1" max="10" value="3" aria-label="Tinggi"></div>
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
  if(id==='intro')setKata('Ayo hitung isi dan kulit kotak!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo hitung isi dan kulit kotak!');

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
  },s.o.length===2?null:3,function(){msg(msgId,'warn',s.n||'Hampir! Lihat gambarnya dan hitung lagi.')});
}
function barisTeks(id,lines){var w=$(id);clear(w);lines.forEach(function(t){w.appendChild(el('div',null,t))})}
function gambarDi(id,g){var w=$(id);clear(w);w.appendChild(GBR[g.k](g))}
function bk(p,l,t,o){var g={k:'balok',p:p,l:l,t:t};if(o)for(var q in o)g[q]=o[q];return g}
function lp(p,l,t){return 2*(p*l+p*t+l*t)}

/* ---- stasiun 1: volume ---- */
var R1=[
  {p:9,l:4,t:5},
  {p:5,l:4,t:3,x:{t:'Dedi menjumlahkan 5 + 4 + 3 = 12. Tepatkah?',o:['Tidak. Volume dicari dengan MENGALIKAN: 5 × 4 × 3 = 60','Ya, volume adalah jumlah ketiga ukuran'],b:'Tidak. Volume dicari dengan MENGALIKAN: 5 × 4 × 3 = 60',p:'Volume adalah banyak kubus satuan di dalam kotak, hasil kali p × l × t.'}},
  {p:6,l:6,t:6,kubus:true,x:{t:'Rian memakai 6 × s × s = 216 dan menulis 216 cm persegi. Apa kesalahannya?',o:['Itu rumus luas permukaan; volume = s × s × s dan satuannya cm kubik','Tidak ada kesalahan'],b:'Itu rumus luas permukaan; volume = s × s × s dan satuannya cm kubik',p:'Volume kubus = s × s × s. Angkanya kebetulan sama dengan luas permukaan, tetapi artinya berbeda.'}},
  {p:4,l:4,t:4,kubus:true}
];
var r1=0,k1=0;
function mulaiS1(){r1=0;ronde1()}
function gambar1(d,k){gambarDi('s1alat',bk(d.p,d.l,d.t,{isi:k,grid:true,lab:{p:d.p+' cm',l:d.l+' cm',t:d.t+' cm'}}))}
function ronde1(){
  var d=R1[r1];titik('s1dots',R1.length,r1);k1=0;
  var t=d.kubus?'Susun kubus berusuk '+d.p+' cm.':'Susun balok '+d.p+' × '+d.l+' × '+d.t+'.';$('s1say').textContent='Susun lapisan demi lapisan.';setKata(t);
  gambar1(d,0.001);barisTeks('s1tampil',[t]);
  clear($('s1aksi'));$('s1tanya').textContent='';$('s1next').disabled=true;
  var a=$('s1mulai');clear(a);a.className='aksi';tombol(a,'Tambah lapisan',tambah1,'utama hint');
  msg('s1msg','','Tiap lapisan berisi '+d.p+' × '+d.l+' = '+(d.p*d.l)+' kubus satuan.');
}
function tambah1(){
  var d=R1[r1];if(k1>=d.t)return;k1++;gambar1(d,k1);
  barisTeks('s1tampil',[k1+' lapisan × '+(d.p*d.l)+' = '+(k1*d.p*d.l)+' kubus']);
  if(k1===d.t){
    clear($('s1mulai'));var V=d.p*d.l*d.t;
    var st=[
      {t:d.kubus?'Volume kubus berusuk '+d.p+' cm sama dengan...':'Volume balok sama dengan...',o:d.kubus?['sisi × sisi × sisi','sisi + sisi + sisi','6 × sisi × sisi']:['panjang × lebar × tinggi','panjang + lebar + tinggi','2 × (pl + pt + lt)'],b:d.kubus?'sisi × sisi × sisi':'panjang × lebar × tinggi',p:'Lapisan × isi tiap lapisan: '+(d.kubus?'s × s × s.':'p × l × t.')},
      {t:'Berapa volumenya?',o:uniq(V,[d.p+d.l+d.t,lp(d.p,d.l,d.t)]),b:String(V),p:'Volume = '+d.p+' × '+d.l+' × '+d.t+' = '+V+' cm kubik.'}
    ];
    if(d.x)st.push(d.x);
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',st,0,function(){$('s1next').disabled=false})},700);
  }
}
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: luas permukaan ---- */
var R2=[{p:9,l:5,t:4},{p:8,l:5,t:4},{p:6,l:4,t:3},{p:3,l:3,t:3,kubus:true},{p:5,l:5,t:5,kubus:true}];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2],p=d.p,l=d.l,t=d.t,a=p*l,b=p*t,c=l*t,L=lp(p,l,t),lab={p:p+' cm',l:l+' cm',t:t+' cm'};titik('s2dots',R2.length,r2);
  var tt=d.kubus?'Hitung luas permukaan kubus berusuk '+p+' cm.':'Hitung luas permukaan balok '+p+' × '+l+' × '+t+'.';$('s2say').textContent='Hitung semua sisi kotak.';setKata(tt);
  gambarDi('s2alat',bk(p,l,t,{lab:lab}));barisTeks('s2tampil',[tt]);
  function sor(n,tx){return function(){gambarDi('s2alat',bk(p,l,t,{lab:lab,sorot:n}));barisTeks('s2tampil',tx)}}
  var st;
  if(d.kubus){
    st=[
      {t:'Berapa luas satu sisi kubus? ('+p+' × '+p+')',o:uniq(a,[p*3,p*4]),b:String(a),p:'Satu sisi berupa persegi: '+p+' × '+p+' = '+a+' cm persegi.',lihat:sor('depan',['Satu sisi = '+a])},
      {t:'Kubus memiliki berapa sisi yang sama besar?',o:['6','5','4'],b:'6',p:'Kubus punya 6 sisi persegi yang sama (2 atas-bawah, 2 depan-belakang, 2 samping).'},
      {t:'Luas permukaan = 6 × '+a+' = ?',o:uniq(L,[5*a,a*3]),b:String(L),p:'Luas permukaan = 6 × s × s = '+L+' cm persegi. Mengalikan 5 salah (hanya 5 sisi).',lihat:function(){gambarDi('s2alat',bk(p,l,t,{lab:lab}));barisTeks('s2tampil',['6 × '+a+' = '+L+' cm²'])}}
    ];
  }else{
    st=[
      {t:'Sisi atas dan bawah masing-masing '+p+' × '+l+' = ?',o:uniq(a,[p+l,2*a]),b:String(a),p:p+' × '+l+' = '+a+' cm persegi (2 sisi).',lihat:sor('atas',['atas + bawah: 2 × '+a])},
      {t:'Sisi depan dan belakang masing-masing '+p+' × '+t+' = ?',o:uniq(b,[p+t,2*b]),b:String(b),p:p+' × '+t+' = '+b+' cm persegi (2 sisi).',lihat:sor('depan',['depan + belakang: 2 × '+b])},
      {t:'Dua sisi samping masing-masing '+l+' × '+t+' = ?',o:uniq(c,[l+t,2*c]),b:String(c),p:l+' × '+t+' = '+c+' cm persegi (2 sisi).',lihat:sor('samping',['samping kiri + kanan: 2 × '+c])},
      {t:'Luas permukaan = 2 × ('+a+' + '+b+' + '+c+') = ?',o:uniq(L,[a+b+c,p*l*t]),b:String(L),p:'2 × '+(a+b+c)+' = '+L+' cm persegi.',lihat:function(){gambarDi('s2alat',bk(p,l,t,{lab:lab}));barisTeks('s2tampil',['2 × ('+a+' + '+b+' + '+c+') = '+L+' cm²'])}}
    ];
  }
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Warna sama berarti pasangan sisi yang sama besar.');
  ruteSteps('s2aksi','s2tanya','s2msg',st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: isi atau kulit ---- */
var R3=[
  {p:6,l:4,t:3,st:[
    {t:'Volume balok 6 × 4 × 3 = ?',o:['72','13','108'],b:'72',p:'6 × 4 × 3 = 72.'},
    {t:'Luas permukaan = 2 × (24 + 18 + 12) = ?',o:['108','72','54'],b:'108',p:'2 × 54 = 108.'},
    {t:'Satuan volume adalah...',o:['cm kubik','cm persegi','cm'],b:'cm kubik',p:'Volume menghitung ruang, satuannya pangkat tiga.'},
    {t:'Satuan luas permukaan adalah...',o:['cm persegi','cm kubik','cm'],b:'cm persegi',p:'Luas permukaan menghitung permukaan, satuannya pangkat dua.'}]},
  {p:6,l:6,t:6,st:[
    {t:'Volume kubus berusuk 6 cm = ?',o:['216','36','18'],b:'216',p:'6 × 6 × 6 = 216 cm kubik.'},
    {t:'Luas permukaan kubus berusuk 6 cm = ?',o:['216','36','180'],b:'216',p:'6 × 6 × 6 = 216 cm persegi. Angkanya kebetulan sama!'},
    {t:'Angkanya sama. Apakah volume dan luas permukaannya sama?',o:['Tidak. Artinya dan satuannya berbeda (cm kubik dan cm persegi)','Ya, selalu sama'],b:'Tidak. Artinya dan satuannya berbeda (cm kubik dan cm persegi)',p:'Volume = isi, luas permukaan = kulit. Kebetulan angkanya sama pada rusuk 6.'}]},
  {p:12,l:8,t:6,st:[
    {t:'Kotak 12 × 8 × 6. Berapa volumenya?',o:['576','52','592'],b:'576',p:'12 × 8 × 6 = 576 cm kubik.'},
    {t:'Wati memakai 2 × (pl + pt + lt) untuk mencari volume. Rumus itu untuk mencari...',o:['luas permukaan','volume','keliling'],b:'luas permukaan',p:'2 × (pl + pt + lt) adalah luas permukaan balok.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  var t='Isi (volume) atau kulit (luas permukaan)?';$('s3say').textContent=t;setKata(t);
  gambarDi('s3alat',bk(d.p,d.l,d.t,{grid:true,lab:{p:d.p+' cm',l:d.l+' cm',t:d.t+' cm'}}));barisTeks('s3tampil',['Volume = isi kotak','Luas permukaan = kulit kotak']);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Volume menghitung kubus satuan di dalam, luas permukaan menghitung sisi-sisi luarnya.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: volume gabungan ---- */
var R4=[
  {A:{p:10,l:8,t:6},B:{p:10,l:8,t:4},x:{t:'Apakah volume gabungan perlu dikurangi bagian yang menempel?',o:['Tidak. Ruang di dalam tetap terisi penuh, cukup dijumlahkan','Ya, kurangi bidang yang menempel'],b:'Tidak. Ruang di dalam tetap terisi penuh, cukup dijumlahkan',p:'Volume gabungan dijumlahkan tanpa pengurangan. Pengurangan hanya pada luas permukaan.'}},
  {A:{p:5,l:5,t:5},B:{p:3,l:3,t:3}},
  {A:{p:4,l:4,t:4},B:{p:4,l:4,t:4}},
  {A:{p:12,l:8,t:5},B:{p:3,l:3,t:3}}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4],A=d.A,B=d.B,VA=A.p*A.l*A.t,VB=B.p*B.l*B.t,V=VA+VB,lab={p:A.p+' cm',l:A.l+' cm',t:A.t+' cm',ta:B.t+' cm'};titik('s4dots',R4.length,r4);
  var tt='Hitung volume bangun gabungan dua kotak yang ditumpuk.';$('s4say').textContent=tt;setKata(tt);
  gambarDi('s4alat',bk(A.p,A.l,A.t,{atas:B,lab:lab}));barisTeks('s4tampil',['Kotak bawah: '+A.p+' × '+A.l+' × '+A.t,'Kotak atas: '+B.p+' × '+B.l+' × '+B.t]);
  var st=[
    {t:'Volume kotak bawah = '+A.p+' × '+A.l+' × '+A.t+' = ?',o:uniq(VA,[A.p+A.l+A.t,lp(A.p,A.l,A.t)]),b:String(VA),p:'Volume bawah = '+VA+' cm kubik.',lihat:function(){barisTeks('s4tampil',['Bawah = '+VA,'Atas: '+B.p+' × '+B.l+' × '+B.t])}},
    {t:'Volume kotak atas = '+B.p+' × '+B.l+' × '+B.t+' = ?',o:uniq(VB,[B.p+B.l+B.t,lp(B.p,B.l,B.t)]),b:String(VB),p:'Volume atas = '+VB+' cm kubik.',lihat:function(){barisTeks('s4tampil',['Bawah = '+VA,'Atas = '+VB])}},
    {t:'Volume total = '+VA+' + '+VB+' = ?',o:uniq(V,[VA*VB,VA-VB]),b:String(V),p:'Volume total = '+V+' cm kubik.',lihat:function(){barisTeks('s4tampil',[VA+' + '+VB+' = '+V+' cm³'])}}
  ];
  if(d.x)st.push(d.x);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Volume gabungan = jumlah volume bagian-bagiannya.');
  ruteSteps('s4aksi','s4tanya','s4msg',st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: luas permukaan gabungan ---- */
var R5=[
  {A:{p:10,l:8,t:6},B:{p:10,l:8,t:4}},
  {A:{p:5,l:5,t:5},B:{p:3,l:3,t:3}},
  {A:{p:8,l:6,t:4},B:{p:8,l:6,t:3}}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5],A=d.A,B=d.B,LA=lp(A.p,A.l,A.t),LB=lp(B.p,B.l,B.t),T=B.p*B.l,L=LA+LB-2*T,lab={p:A.p+' cm',l:A.l+' cm',t:A.t+' cm',ta:B.t+' cm'};titik('s5dots',R5.length,r5);
  var tt='Hitung luas permukaan bangun gabungan dua kotak.';$('s5say').textContent=tt;setKata(tt);
  gambarDi('s5alat',bk(A.p,A.l,A.t,{atas:B,lab:lab}));barisTeks('s5tampil',['Kotak bawah: '+A.p+' × '+A.l+' × '+A.t,'Kotak atas: '+B.p+' × '+B.l+' × '+B.t]);
  var st=[
    {t:'Luas permukaan kotak bawah = ?',o:uniq(LA,[A.p*A.l*A.t,LA/2]),b:String(LA),p:'2 × ('+A.p*A.l+' + '+A.p*A.t+' + '+A.l*A.t+') = '+LA+' cm persegi.'},
    {t:'Luas permukaan kotak atas = ?',o:uniq(LB,[B.p*B.l*B.t,LB/2]),b:String(LB),p:'2 × ('+B.p*B.l+' + '+B.p*B.t+' + '+B.l*B.t+') = '+LB+' cm persegi.'},
    {t:'Bidang yang menempel (merah) luasnya '+B.p+' × '+B.l+' = ?',o:uniq(T,[B.p+B.l,2*T]),b:String(T),p:'Luas bidang menempel = '+T+' cm persegi.',lihat:function(){gambarDi('s5alat',bk(A.p,A.l,A.t,{atas:B,lab:lab,tempel:true}));barisTeks('s5tampil',['Menempel: '+T+' cm²'])}},
    {t:'Luas permukaan gabungan = '+LA+' + '+LB+' − 2 × '+T+' = ?',o:uniq(L,[LA+LB,LA+LB-T]),b:String(L),p:'Bidang menempel terhitung di kedua bagian dan tidak terlihat, jadi dikurangi DUA kali: '+L+' cm persegi.',lihat:function(){barisTeks('s5tampil',[LA+' + '+LB+' − '+2*T+' = '+L+' cm²'])}}
  ];
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Bidang yang menempel tidak lagi menjadi permukaan.');
  ruteSteps('s5aksi','s5tanya','s5msg',st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Isi dan kulit kotak dihitung tepat.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-28'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.petak({n:5}));w.appendChild(el('div','baca','5² = 28'));
})();

/* ---- bonus: kotak ajaib ---- */
function mulaiBonus(){$('bP').value='5';$('bL').value='4';$('bT').value='3';gambarBonus()}
function gambarBonus(){
  var p=+$('bP').value,l=+$('bL').value,t=+$('bT').value,V=p*l*t,L=lp(p,l,t),l2=[];
  $('bNilaiP').textContent='Panjang: '+p+' cm';$('bNilaiL').textContent='Lebar: '+l+' cm';$('bNilaiT').textContent='Tinggi: '+t+' cm';
  gambarDi('bGambar',bk(p,l,t,{grid:true,lab:{p:p+' cm',l:l+' cm',t:t+' cm'}}));
  l2.push('Volume = '+p+' × '+l+' × '+t+' = '+V+' cm kubik');
  l2.push('Luas permukaan = 2 × ('+(p*l)+' + '+(p*t)+' + '+(l*t)+') = '+L+' cm persegi');
  barisTeks('bTanda',l2);
  msg('bmsg',p===l&&l===t?'good':'',p===l&&l===t?'Ini kubus: panjang, lebar, dan tinggi sama.':'Kubus adalah balok khusus dengan p = l = t.');
}
$('bP').oninput=function(){gambarBonus()};
$('bL').oninput=function(){gambarBonus()};
$('bT').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC28 = rakit(DASAR, { kode: 'AC-28', data: DATA_AC28 })
