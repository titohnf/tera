import { rakit } from './bersama'
import { DATA_D15 } from './latihan/d15'

/**
 * Materi interaktif D-15 "Barisan dan Deret" (barisan aritmetika dan
 * geometri, beda dan rasio, suku ke-n, mencari a dan b dari dua suku, deret
 * aritmetika dan geometri, dan cerita). Satu halaman HTML mandiri,
 * ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah
 * Belajar di topik Misi D-15.
 *
 * Lima stasiun praktik: 1) tambah suku satu per satu (diagram batang;
 * aritmetika tumbuh lurus, geometri melonjak), 2) aritmetika atau geometri
 * (kuadrat bukan keduanya, konstan keduanya, rasio boleh kurang dari 1),
 * 3) suku ke-n dan mencari a, b, r, 4) deret (lupa bagi 2, rumus yang salah),
 * 5) cerita (kursi, tabungan, bakteri, virus). Bonus: Un dan Sn. Lalu tiga
 * stasiun mesin latihan, bahannya di `latihan/d15.ts`.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Barisan dan Deret</title>
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
      <h1>Barisan dan Deret</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo temukan pola bilangan!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Tambah suku.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Nilai x"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Aritmetika atau geometri?</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Suku ke-n.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Deret: jumlah suku.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Barisan dan deret dalam cerita.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: barisan bergerak</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: Un dan Sn barisan aritmetika.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="1" max="9" step="1" value="3" aria-label="a"><input type="range" id="bB" min="1" max="6" step="1" value="2" aria-label="b"><input type="range" id="bC" min="2" max="10" step="1" value="6" aria-label="n">
    </div>
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
  if(id==='intro')setKata('Ayo belajar barisan dan deret!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar barisan dan deret!');

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

/* ---- alat bantu barisan ---- */
function suku(d,n){return d.jenis==='a'?d.a+(n-1)*d.u:d.a*Math.pow(d.u,n-1)}
function jml(d,n){var s=0,i;for(i=1;i<=n;i++)s+=suku(d,i);return s}
function nice(m){return Math.max(20,Math.ceil(m/20)*20)}

/* ---- stasiun 1: tambahkan suku satu per satu ---- */
var R1=[
  {jenis:'a',a:6,u:4,tg:10,t:'Barisan 6, 10, 14, ... Tambah suku sampai suku ke-10.',nm:'beda 4',st:[
    {t:'Selisih tiap suku tetap 4. Barisan ini...',o:['aritmetika, beda 4','geometri, rasio 4'],b:'aritmetika, beda 4',p:'Ditambah bilangan tetap.'},
    {t:'U10 = a + (n − 1)b = 6 + 9 × 4 = ?',o:['42','46','60'],b:'42',p:'6 + 36.'}]},
  {jenis:'g',a:2,u:3,tg:4,t:'Barisan 2, 6, 18, ... Tambah suku sampai suku ke-4.',nm:'rasio 3',st:[
    {t:'Tiap suku dikali bilangan tetap 3. Barisan ini...',o:['geometri, rasio 3','aritmetika, beda 3'],b:'geometri, rasio 3',p:'Rasio tetap.'},
    {t:'U4 = a × r^(n−1) = 2 × 3³ = ?',o:['54','24','162'],b:'54',p:'2 × 27.'},
    {t:'Siswa: "2, 6, 18, 54 aritmetika karena selisihnya (4, 12, 36) bertambah teratur." Tepatkah?',o:['Salah; selisih tidak tetap, rasio tetap 3','Benar'],b:'Salah; selisih tidak tetap, rasio tetap 3',p:'Itu geometri.'}]},
  {jenis:'a',a:5,u:6,tg:6,t:'Barisan 5, 11, 17, ... Tambah suku sampai suku ke-6.',nm:'beda 6',st:[
    {t:'U6 = 5 + 5 × 6 = ?',o:['35','36','30'],b:'35',p:'5 + 30.'}]},
  {jenis:'g',a:3,u:2,tg:5,t:'Barisan 3, 6, 12, ... Tambah suku sampai suku ke-5.',nm:'rasio 2',st:[
    {t:'U5 = 3 × 2⁴ = ?',o:['48','30','96'],b:'48',p:'3 × 16.'},
    {t:'Jumlah 5 suku pertama deret ini?',o:['93','48','96'],b:'93',p:'3 + 6 + 12 + 24 + 48.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(n){
  var d=R1[r1],t=[],i,mx=0;
  for(i=1;i<=n;i++){var v=suku(d,i);mx=Math.max(mx,v);t.push({l:'U'+i,v:v,w:i===n?'merah':'biru'})}
  var hi=nice(suku(d,d.tg));
  gambarDi('s1alat',{k:'diagram',d:t,lo:0,hi:hi,langkah:hi/4,nilai:true,anim:false});
  barisTeks('s1tampil',['U'+n+' = '+suku(d,n)+'   |   S'+n+' = '+jml(d,n)]);
}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='1';sl.max=String(d.tg);sl.step='1';sl.value='1';sl.disabled=false;
  $('s1say').textContent=d.t;setKata(d.t);
  gambar1(1);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Geser untuk menambah suku. Aritmetika: ditambah tetap. Geometri: dikali tetap.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v===d.tg){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good','U'+v+' = '+suku(d,v)+' ('+d.nm+').');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai suku ke-'+d.tg+'.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: aritmetika atau geometri? ---- */
var R2=[
  {say:'4, 9, 14, 19, ...',st:[
    {t:'Jenis barisan?',o:['Aritmetika, beda 5','Geometri, rasio 5','Bukan keduanya'],b:'Aritmetika, beda 5',p:'Selisih tetap 5.'}]},
  {say:'3, 9, 27, 81, ...',st:[
    {t:'Jenis barisan?',o:['Geometri, rasio 3','Aritmetika, beda 6','Bukan keduanya'],b:'Geometri, rasio 3',p:'Perbandingan tetap 3.'}]},
  {say:'1, 4, 9, 16, 25, ...',st:[
    {t:'Selisihnya 3, 5, 7, 9, ... Jenis barisan?',o:['Bukan aritmetika maupun geometri','Aritmetika','Geometri'],b:'Bukan aritmetika maupun geometri',p:'Selisih tidak tetap, rasio juga tidak.'}]},
  {say:'−3, −1, 1, 3, ...  dan  50, 44, 38, 32, ...',st:[
    {t:'−3, −1, 1, 3: beda?',o:['2','−2','3'],b:'2',p:'Aritmetika, beda 2.'},
    {t:'50, 44, 38, 32: beda?',o:['−6','6','44'],b:'−6',p:'Beda boleh negatif.'}]},
  {say:'100, 50, 25, ...',st:[
    {t:'Rasio?',o:['0,5','50','−50'],b:'0,5',p:'50 : 100.'},
    {t:'Barisan yang suku-sukunya mengecil tidak mungkin geometri. Tepatkah?',o:['Salah; rasio antara 0 dan 1 mengecilkan suku','Benar'],b:'Salah; rasio antara 0 dan 1 mengecilkan suku',p:'Mendekati nol, tidak pernah mencapai nol.'},
    {t:'Setiap barisan geometri rasionya lebih dari 1. Tepatkah?',o:['Salah','Benar'],b:'Salah',p:'Rasio bisa 1/2, 1, atau negatif.'}]},
  {say:'7, 7, 7, 7, ...',st:[
    {t:'Barisan konstan ini...',o:['aritmetika (beda 0) sekaligus geometri (rasio 1)','hanya aritmetika'],b:'aritmetika (beda 0) sekaligus geometri (rasio 1)',p:'Memenuhi kedua definisi.'}]},
  {say:'Istilah.',st:[
    {t:'Pada 7, 11, 15, 19, angka 7 disebut...',o:['suku pertama (a)','beda (b)','rasio (r)'],b:'suku pertama (a)',p:'a = 7.'},
    {t:'Deret adalah...',o:['jumlah suku-suku suatu barisan','daftar suku suatu barisan'],b:'jumlah suku-suku suatu barisan',p:'Barisan dijumlahkan menjadi deret.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Aritmetika atau geometri?';setKata(d.say);
  clear($('s2alat'));barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Periksa selisih (aritmetika) atau perbandingan (geometri), jangan menebak.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: suku ke-n ---- */
var R3=[
  {say:'a = 6, b = 4. Suku ke-10?',st:[
    {t:'U10 = 6 + 9 × 4 = ?',o:['42','46','40'],b:'42',p:'Rumus Un = a + (n − 1)b.'}]},
  {say:'20, 14, 8, 2, ... Suku ke-6?',st:[
    {t:'Beda = −6. U6 = 20 + 5 × (−6) = ?',o:['−10','−8','50'],b:'−10',p:'20 − 30.'}]},
  {say:'10, 7, 4, 1, ... Suku ke-7?',st:[
    {t:'Beda = −3. U7 = 10 + 6 × (−3) = ?',o:['−8','−5','28'],b:'−8',p:'10 − 18.'}]},
  {say:'a = 2, r = 3 (geometri). Suku ke-4?',st:[
    {t:'U4 = 2 × 3³ = ?',o:['54','18','162'],b:'54',p:'Un = a × r^(n−1).'}]},
  {say:'a = 4, r = 2 dan a = 5, r = 2.',st:[
    {t:'U5 untuk a = 4: 4 × 2⁴ = ?',o:['64','32','128'],b:'64',p:'4 × 16.'},
    {t:'U6 untuk a = 5: 5 × 2⁵ = ?',o:['160','50','320'],b:'160',p:'5 × 32.'}]},
  {say:'Aritmetika dengan U3 = 11 dan U7 = 23.',st:[
    {t:'Dari U3 ke U7 ada 4 langkah: 4b = 12. b = ?',o:['3','4','12'],b:'3',p:'b = 3.'},
    {t:'a = U3 − 2b = 11 − 6 = ?',o:['5','7','8'],b:'5',p:'a = 5.'}]},
  {say:'Aritmetika dengan U2 = 9 dan U9 = 44.',st:[
    {t:'7b = 35. b dan a?',o:['5 dan 4','7 dan 2','5 dan 9'],b:'5 dan 4',p:'a = 9 − 5.'}]},
  {say:'Geometri positif dengan U2 = 6 dan U4 = 54.',st:[
    {t:'U4 : U2 = r² = 9. Rasio r = ?',o:['3','9','−3'],b:'3',p:'Semua suku positif, jadi r = 3.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Suku ke-n.';setKata(d.say);
  clear($('s3alat'));barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Aritmetika: Un = a + (n − 1)b. Geometri: Un = a × r^(n − 1).');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: deret ---- */
var R4=[
  {say:'Deret aritmetika a = 3, b = 5. S10?',st:[
    {t:'Sn = n/2 (2a + (n − 1)b) = 5 (6 + 45) = ?',o:['255','51','510'],b:'255',p:'5 × 51.'}]},
  {say:'S6 dengan a = 4 dan b = 2.',st:[
    {t:'2a = 8 dan (n − 1)b = 10. Jumlahnya 18. Lalu × n/2 = 3 × 18 = ?',o:['54','108','24'],b:'54',p:'S6 = 54.'}]},
  {say:'Siswa menghitung S5 dengan a = 2, b = 4: n(2a + (n − 1)b) = 5 × 20 = 100.',st:[
    {t:'Kesalahannya?',o:['Lupa membagi dengan 2; yang benar 50','Salah menjumlah'],b:'Lupa membagi dengan 2; yang benar 50',p:'Sn = n/2 (…).'}]},
  {say:'Sn = n/2 (a + Un).',st:[
    {t:'a = 2 dan S5 = 50: 50 = 5/2 (2 + U5). U5 = ?',o:['18','20','22'],b:'18',p:'2 + U5 = 20.'}]},
  {say:'Deret geometri a = 2, r = 3. S4?',st:[
    {t:'Sn = a(rⁿ − 1)/(r − 1) = 2 × 80 / 2 = ?',o:['80','160','54'],b:'80',p:'2 + 6 + 18 + 54.'}]},
  {say:'Deret geometri a = 3, r = 2. S4?',st:[
    {t:'3 + 6 + 12 + 24 = ?',o:['45','48','36'],b:'45',p:'Atau 3(16 − 1)/1.'},
    {t:'Siswa memakai rumus aritmetika untuk deret geometri ini. Kesalahannya?',o:['Salah rumus; harus rumus deret geometri','Tidak ada kesalahan'],b:'Salah rumus; harus rumus deret geometri',p:'Jenis barisan menentukan rumus.'}]},
  {say:'Deret geometri a = 1, r = 2. S6?',st:[{t:'1(2⁶ − 1)/(2 − 1) = ?',o:['63','64','32'],b:'63',p:'1 + 2 + 4 + 8 + 16 + 32.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Deret: jumlah suku.';setKata(d.say);
  clear($('s4alat'));barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Pilih rumus sesuai jenis: aritmetika atau geometri.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: cerita ---- */
var R5=[
  {say:'Kursi aula: baris pertama 5, tiap baris bertambah 3; 8 baris.',st:[
    {t:'Aritmetika a = 5, b = 3. S8 = 4(10 + 21) = ?',o:['124','62','248'],b:'124',p:'Total kursi 124.'}]},
  {say:'Kursi bioskop: baris depan 20, tiap baris bertambah 4; 10 baris.',st:[
    {t:'S10 = 5 (40 + 36) = ?',o:['380','76','190'],b:'380',p:'Total 380.'}]},
  {say:'Gedung: baris pertama 8, tiap baris bertambah 5; 7 baris.',st:[
    {t:'S7 = 7/2 (16 + 30) = ?',o:['161','46','322'],b:'161',p:'Total 161.'}]},
  {say:'Piramida buah: 1, 3, 5, 7, ... ada 6 lapisan.',st:[
    {t:'Aritmetika a = 1, b = 2. S6 = 3 (2 + 10) = ?',o:['36','12','72'],b:'36',p:'Jumlah ganjil: n².'}]},
  {say:'Gaji awal Rp2.000.000, naik Rp150.000 tiap bulan.',st:[
    {t:'Bulan ke-13: U13 = 2.000.000 + 12 × 150.000 = ?',o:['3.800.000','3.650.000','2.150.000'],b:'3.800.000',p:'12 kenaikan.'}]},
  {say:'Menabung minggu pertama Rp10.000, bertambah Rp5.000 tiap minggu; 10 minggu.',st:[
    {t:'S10 = 5 (20.000 + 45.000) = ?',o:['325.000','65.000','100.000'],b:'325.000',p:'Total tabungan.'}]},
  {say:'Bakteri 10 mula-mula, berlipat dua tiap jam.',st:[
    {t:'Setelah 5 jam: 10 × 2⁵ = ?',o:['320','100','160'],b:'320',p:'Geometri r = 2.'}]},
  {say:'Pengunjung hari pertama 50, berlipat dua tiap hari.',st:[
    {t:'Hari ke-4: 50 × 2³ = ?',o:['400','200','800'],b:'400',p:'U4.'}]},
  {say:'Tabungan Rp500.000 tumbuh 1,2 kali tiap tahun.',st:[
    {t:'Setelah 3 tahun: 500.000 × 1,2³ = ?',o:['864.000','800.000','600.000'],b:'864.000',p:'1,2³ = 1,728.'}]},
  {say:'Virus berlipat tiga tiap hari, hari pertama 2 orang.',st:[
    {t:'Hari ke-4: 2 × 3³ = ?',o:['54','24','162'],b:'54',p:'U4.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Barisan dan deret dalam cerita.';setKata(d.say);
  clear($('s5alat'));barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Bertambah tetap: aritmetika. Berlipat tetap: geometri.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Aritmetika: ditambah tetap. Geometri: dikali tetap.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-15'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.diagram({d:[{l:'U1',v:2},{l:'U2',v:4},{l:'U3',v:6},{l:'U4',v:8}],lo:0,hi:10,langkah:5,nilai:true,anim:false}));
})();


/* ---- bonus: Un dan Sn aritmetika ---- */
function mulaiBonus(){$('bA').value='3';$('bB').value='2';$('bC').value='6';gambarBonus()}
function gambarBonus(){
  var a=+$('bA').value,b=+$('bB').value,n=+$('bC').value,d={jenis:'a',a:a,u:b},t=[],i;
  for(i=1;i<=n;i++)t.push({l:'U'+i,v:suku(d,i),w:i===n?'merah':'biru'});
  $('bNA').textContent='a = '+a+', b = '+b+', n = '+n;
  var hi=nice(suku(d,n));
  gambarDi('bGambar',{k:'diagram',d:t,lo:0,hi:hi,langkah:hi/4,nilai:n<=8,anim:false});
  barisTeks('bTanda',['U'+n+' = '+a+' + '+(n-1)+' × '+b+' = '+suku(d,n),'S'+n+' = '+n+'/2 × ('+a+' + '+suku(d,n)+') = '+jml(d,n)]);
  msg('bmsg','good','Jumlah = banyak suku × rata-rata suku pertama dan terakhir.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bC').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D15 = rakit(DASAR, { kode: 'D-15', data: DATA_D15 })
