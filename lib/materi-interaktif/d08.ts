import { rakit } from './bersama'
import { DATA_D08 } from './latihan/d08'

/**
 * Materi interaktif D-08 "Pangkat, Akar, Notasi Ilmiah" (basis dan pangkat,
 * pangkat nol dan negatif, sifat pangkat, akar kuadrat dan pangkat tiga,
 * menyederhanakan bentuk akar, notasi ilmiah). Satu halaman HTML mandiri,
 * ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai langkah
 * Belajar di topik Misi D-08.
 *
 * Lima stasiun praktik: 1) geser pangkat (kotak berlipat; pangkat negatif jadi
 * pecahan), 2) sifat pangkat (jumlah, kurang, kali; (a+b)^2), 3) akar (invers
 * pangkat, akar dari jumlah, rasional lawan irasional), 4) menyederhanakan
 * bentuk akar (faktor kuadrat sempurna), 5) notasi ilmiah (bilangan besar dan
 * kecil, operasi). Bonus: geser koma. Soal bank memakai bentuk ketikan
 * sulit (superskrip, akar), jadi mesin latihan memakai pilihan untuk bentuk
 * itu dan isian untuk angka. Bahan di `latihan/d08.ts`.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pangkat, Akar, Notasi Ilmiah</title>
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
      <h1>Pangkat, Akar, Notasi Ilmiah</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo bermain dengan bilangan besar dan kecil!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser pangkatnya.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Pangkat"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Sifat-sifat pangkat.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Akar kuadrat dan akar pangkat tiga.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Menyederhanakan bentuk akar.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Notasi ilmiah.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: geser koma</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: a × 10 pangkat n.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="-5" max="6" step="1" value="3" aria-label="Pangkat"><div class="baca" id="bNB"></div><input type="range" id="bB" min="1" max="9" step="1" value="4" aria-label="Koefisien">
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
  if(id==='intro')setKata('Ayo belajar pangkat, akar, dan notasi ilmiah!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar pangkat, akar, dan notasi ilmiah!');

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

/* ---- alat bantu pangkat ---- */
function supD(n){var m={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};return String(n).split('').map(function(c){return m[c]}).join('')}
function pgn(b,n){return Math.pow(b,n)}

/* ---- stasiun 1: geser pangkat ---- */
var R1=[
  {b:2,e:'🟦',lo:-3,hi:5,tg:3,t:'Geser pangkat sampai 2'+'³.',st:[
    {t:'2³ berarti...',o:['2 × 2 × 2','2 × 3','2 + 2 + 2'],b:'2 × 2 × 2',p:'Basis 2 dikalikan sebanyak pangkat 3: 8.'},
    {t:'Pada 2³, angka 2 disebut...',o:['basis (bilangan pokok)','pangkat (eksponen)'],b:'basis (bilangan pokok)',p:'3 adalah pangkat atau eksponen.'}]},
  {b:2,e:'🟦',lo:-3,hi:5,tg:0,t:'Geser pangkat sampai 0.',st:[
    {t:'Nilai 2⁰ = ?',o:['1','0','2'],b:'1',p:'Bilangan apa pun (bukan nol) berpangkat 0 sama dengan 1.'},
    {t:'Nilai 7⁰ = ?',o:['1','0','7'],b:'1',p:'Tetap 1.'}]},
  {b:2,e:'🟦',lo:-3,hi:5,tg:-2,t:'Geser pangkat sampai −2.',st:[
    {t:'2⁻² = ?',o:['1/4','−4','1/2'],b:'1/4',p:'Pangkat negatif berarti kebalikan: 1/2² = 1/4.'},
    {t:'Siswa: "2⁻² = −4." Tepatkah?',o:['Salah; pangkat negatif berarti kebalikan, bukan hasil negatif','Benar'],b:'Salah; pangkat negatif berarti kebalikan, bukan hasil negatif',p:'2⁻² = 1/4 positif.'},
    {t:'Makin besar pangkat negatifnya (2⁻¹, 2⁻², 2⁻³), nilainya...',o:['makin kecil, mendekati 0','makin besar','tetap'],b:'makin kecil, mendekati 0',p:'0,5 lalu 0,25 lalu 0,125.'}]},
  {b:3,e:'🟩',lo:-2,hi:3,tg:2,t:'Basis 3. Geser pangkat sampai 2.',st:[
    {t:'3² = ?',o:['9','6','8'],b:'9',p:'3 × 3 = 9.'},
    {t:'(−3)² = ?',o:['9','−9','6'],b:'9',p:'Negatif kali negatif positif.'},
    {t:'(−2)³ = ?',o:['−8','8','−6'],b:'−8',p:'Pangkat ganjil: tetap negatif.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(n){
  var d=R1[r1],w=$('s1alat');clear(w);
  if(n>=0)w.appendChild(GBR.baris({baris:[{e:d.e,n:pgn(d.b,n),l:d.b+supD(n)+' = '+pgn(d.b,n)}]}));
  else w.appendChild(GBR.pita({baris:[{n:pgn(d.b,-n),w:1,l:'1/'+pgn(d.b,-n)}]}));
  barisTeks('s1tampil',[n>=0?d.b+supD(n)+' = '+pgn(d.b,n):d.b+supD(n)+' = 1/'+d.b+supD(-n)+' = 1/'+pgn(d.b,-n)]);
}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min=String(d.lo);sl.max=String(d.hi);sl.step='1';sl.value='1';sl.disabled=false;
  $('s1say').textContent=d.t;setKata(d.t);
  gambar1(1);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Pangkat naik: kotak berlipat. Pangkat negatif: pecahan.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v===d.tg){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good',d.b+supD(v)+' = '+(v>=0?pgn(d.b,v):'1/'+pgn(d.b,-v))+'.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai pangkat '+d.tg+'.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: sifat pangkat ---- */
var R2=[
  {say:'2³ × 2⁴',st:[
    {t:'Basis sama dikali: pangkatnya...',o:['dijumlahkan','dikalikan','dikurangi'],b:'dijumlahkan',p:'2³ × 2⁴ = 2⁷.'},
    {t:'2⁷ = ?',o:['128','14','64'],b:'128',p:'2⁷ = 128.'}]},
  {say:'5⁶ ÷ 5⁴',st:[
    {t:'Basis sama dibagi: pangkatnya...',o:['dikurangi','dibagi','dijumlahkan'],b:'dikurangi',p:'5⁶ ÷ 5⁴ = 5².'},
    {t:'5² = ?',o:['25','10','2'],b:'25',p:'25.'}]},
  {say:'(2³)²',st:[
    {t:'Pangkat dari pangkat: pangkatnya...',o:['dikalikan','dijumlahkan','dibagi'],b:'dikalikan',p:'(2³)² = 2⁶.'},
    {t:'2⁶ = ?',o:['64','32','12'],b:'64',p:'64.'}]},
  {say:'Siswa: "(a²)³ = a⁵."',st:[
    {t:'Penilaian?',o:['Salah; seharusnya a⁶ (pangkat dikalikan)','Benar'],b:'Salah; seharusnya a⁶ (pangkat dikalikan)',p:'2 × 3 = 6.'}]},
  {say:'Siswa: "(2³)⁴ = 2⁷."',st:[
    {t:'Penilaian?',o:['Salah; seharusnya 2¹²','Benar'],b:'Salah; seharusnya 2¹²',p:'Dikalikan, bukan dijumlahkan.'}]},
  {say:'Siswa: "(a + b)² = a² + b²."',st:[
    {t:'Penilaian?',o:['Salah; (a+b)² = a² + 2ab + b²','Benar'],b:'Salah; (a+b)² = a² + 2ab + b²',p:'Coba a = 1, b = 2: 9 lawan 5.'}]},
  {say:'Siswa: "a² × a³ = a⁵ untuk semua a."',st:[
    {t:'Penilaian?',o:['Benar; pangkat dijumlahkan untuk basis sama','Salah'],b:'Benar; pangkat dijumlahkan untuk basis sama',p:'a² × a³ = a⁵.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Sifat-sifat pangkat.';setKata(d.say);
  clear($('s2alat'));barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Basis sama: kali = jumlah pangkat, bagi = kurang pangkat, pangkat dari pangkat = kali pangkat.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: akar kuadrat dan akar pangkat tiga ---- */
var R3=[
  {say:'Persegi seluas 16 petak.',g:{k:'petak',n:4},st:[
    {t:'Panjang sisinya = √16 = ?',o:['4','8','16'],b:'4',p:'4 × 4 = 16.'},
    {t:'Akar kuadrat adalah kebalikan operasi...',o:['pangkat dua','pangkat tiga','perkalian dengan 2'],b:'pangkat dua',p:'√(n²) = n.'}]},
  {say:'√64, √81, √100.',st:[
    {t:'√64 = ?',o:['8','32','6'],b:'8',p:'8 × 8 = 64.'},
    {t:'√81 = ?',o:['9','27','8'],b:'9',p:'9 × 9.'},
    {t:'√100 = ?',o:['10','50','25'],b:'10',p:'10 × 10.'}]},
  {say:'∛27 dan ∛64.',g:{k:'lapis',n:3},st:[
    {t:'∛27 dibaca...',o:['akar pangkat tiga dari 27','akar kuadrat dari 27','27 dibagi 3'],b:'akar pangkat tiga dari 27',p:'3³ = 27, jadi ∛27 = 3.'},
    {t:'∛64 = ?',o:['4','8','16'],b:'4',p:'4³ = 64.'}]},
  {say:'Siswa: "√(9 + 16) = √9 + √16."',st:[
    {t:'√(9 + 16) = √25 = ?',o:['5','7','25'],b:'5',p:'√9 + √16 = 3 + 4 = 7. Tidak sama.'},
    {t:'Jadi √(a + b) = √a + √b?',o:['Tidak berlaku umum','Selalu benar'],b:'Tidak berlaku umum',p:'Akar tidak dapat dibagi ke penjumlahan.'}]},
  {say:'√(4 × 9) dan √4 × √9.',st:[
    {t:'Apakah keduanya sama?',o:['Sama: 6 = 2 × 3','Tidak sama'],b:'Sama: 6 = 2 × 3',p:'Akar dari perkalian boleh dipecah.'}]},
  {say:'Siswa: "√9 irasional karena ada tanda akar."',st:[
    {t:'Penilaian?',o:['Salah; √9 = 3, bilangan rasional','Benar'],b:'Salah; √9 = 3, bilangan rasional',p:'Tanda akar tidak otomatis irasional.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Akar kuadrat dan akar pangkat tiga.';setKata(d.say);
  if(d.g)gambarDi('s3alat',d.g);else clear($('s3alat'));
  barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Akar adalah kebalikan pangkat.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: menyederhanakan bentuk akar ---- */
var R4=[
  {say:'√50',st:[
    {t:'50 = 25 × 2, jadi √50 = √25 × √2 = ?',o:['5√2','25√2','2√5'],b:'5√2',p:'√25 = 5.'}]},
  {say:'√72',st:[
    {t:'72 = 36 × 2. √72 = ?',o:['6√2','36√2','8√3'],b:'6√2',p:'√36 = 6.'}]},
  {say:'√48 dan taman persegi seluas 48 m².',g:{k:'petak',n:7,isi:7},st:[
    {t:'48 = 16 × 3. √48 = ?',o:['4√3','16√3','3√4'],b:'4√3',p:'√16 = 4.'},
    {t:'Bentuk 4√3 berasal dari √n dengan n = ?',o:['48','12','7'],b:'48',p:'4√3 = √(16 × 3) = √48.'},
    {t:'Panjang sisi taman seluas 48 m²?',o:['4√3 m','12 m','24 m'],b:'4√3 m',p:'Sisi = √luas.'}]},
  {say:'3√2 + 5√2',st:[
    {t:'Akar sejenis dijumlahkan koefisiennya: 3 + 5 = ?',o:['8√2','8√4','15√2'],b:'8√2',p:'Seperti 3x + 5x = 8x.'}]},
  {say:'Siswa: "√2 + √3 = √5."',st:[
    {t:'Penilaian?',o:['Salah; akar tidak sejenis tidak dapat dijumlah','Benar'],b:'Salah; akar tidak sejenis tidak dapat dijumlah',p:'1,41 + 1,73 = 3,14 sedangkan √5 ≈ 2,24.'}]},
  {say:'5√3 dan 3√5.',st:[
    {t:'Apakah bernilai sama?',o:['Tidak: 8,66 lawan 6,71','Ya'],b:'Tidak: 8,66 lawan 6,71',p:'Urutan menentukan.'}]},
  {say:'√20 (bukan kuadrat sempurna).',st:[
    {t:'√20 = 2√5. Nilainya sekitar 4,47: bilangan...',o:['irasional (desimal tak berulang)','bulat'],b:'irasional (desimal tak berulang)',p:'Bukan akar bilangan kuadrat sempurna.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Menyederhanakan bentuk akar.';setKata(d.say);
  if(d.g)gambarDi('s4alat',d.g);else clear($('s4alat'));
  barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Cari faktor kuadrat sempurna: 4, 9, 16, 25, 36, ...');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: notasi ilmiah ---- */
var R5=[
  {say:'4.500',st:[
    {t:'Bentuk baku: a × 10ⁿ dengan 1 ≤ a < 10. Untuk 4.500?',o:['4,5 × 10³','45 × 10²','0,45 × 10⁴'],b:'4,5 × 10³',p:'Koma digeser 3 tempat ke kiri.'}]},
  {say:'0,00042',st:[
    {t:'Bentuk baku dari 0,00042?',o:['4,2 × 10⁻⁴','4,2 × 10⁴','42 × 10⁻⁵'],b:'4,2 × 10⁻⁴',p:'Koma digeser 4 tempat ke kanan: pangkat negatif.'}]},
  {say:'Diameter virus 0,00000012 m.',st:[
    {t:'Bentuk baku?',o:['1,2 × 10⁻⁷','1,2 × 10⁻⁶','12 × 10⁻⁸'],b:'1,2 × 10⁻⁷',p:'7 tempat.'}]},
  {say:'(2 × 10³) × (3 × 10²)',st:[
    {t:'Kalikan koefisien dan jumlahkan pangkat 10: hasilnya...',o:['6 × 10⁵','6 × 10⁶','5 × 10⁵'],b:'6 × 10⁵',p:'2 × 3 = 6; 3 + 2 = 5.'},
    {t:'Yang juga bernilai sama (600.000)?',o:['60 × 10⁴ (tetapi bukan bentuk baku)','6 × 10⁴'],b:'60 × 10⁴ (tetapi bukan bentuk baku)',p:'Bentuk baku butuh 1 ≤ a < 10.'}]},
  {say:'(4 × 10³) ÷ (2 × 10¹)',st:[
    {t:'Bagi koefisien, kurangi pangkat: ?',o:['2 × 10²','2 × 10⁴','8 × 10²'],b:'2 × 10²',p:'4 : 2 = 2; 3 − 1 = 2.'}]},
  {say:'5 × 10⁸ km + 2 × 10⁸ km.',st:[
    {t:'Pangkat sama: jumlahkan koefisien.',o:['7 × 10⁸','7 × 10¹⁶','10 × 10⁸'],b:'7 × 10⁸',p:'Pangkat 10 tetap.'}]},
  {say:'Nilai startup 3,5 × 10⁹ rupiah menjadi 2 kali lipat.',st:[
    {t:'Nilai baru?',o:['7 × 10⁹','7 × 10¹⁸','3,5 × 10¹⁸'],b:'7 × 10⁹',p:'3,5 × 2 = 7.'}]},
  {say:'Bakteri 2,4 × 10⁶ sel menjadi 2 kali lipat.',st:[
    {t:'Jumlah baru?',o:['4,8 × 10⁶','4,8 × 10¹²','2,4 × 10⁷'],b:'4,8 × 10⁶',p:'2,4 × 2 = 4,8.'}]},
  {say:'Cahaya 3 × 10⁸ m/detik selama 2 detik.',st:[
    {t:'Jarak?',o:['6 × 10⁸ m','6 × 10⁹ m','5 × 10⁸ m'],b:'6 × 10⁸ m',p:'3 × 2 = 6.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Notasi ilmiah.';setKata(d.say);
  clear($('s5alat'));barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Bentuk baku: a × 10ⁿ dengan 1 ≤ a < 10.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Pangkat negatif berarti kebalikan, bukan negatif.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-08'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.baris({baris:[{e:'\uD83D\uDFE6',n:8,l:'2\u00B3 = 8'}]}));
})();


/* ---- bonus: a x 10 pangkat n ---- */
function mulaiBonus(){$('bA').value='3';$('bB').value='4';gambarBonus()}
function tulisBil(a,n){
  if(n>=0){var v=Math.round(a*pgn(10,n));return rb(v)}
  var d=-n+0;var s=(a/pgn(10,-n)).toFixed(d+((String(a).split('.')[1]||'').length));return s.replace('.',',');
}
function gambarBonus(){
  var n=+$('bA').value,a=+$('bB').value;
  $('bNA').textContent='Pangkat 10: '+n;$('bNB').textContent='Koefisien a: '+a;
  $('bGambar').style.display='none';
  barisTeks('bTanda',[a+' × 10'+supD(n)+' = '+tulisBil(a,n),(n>=0?'Koma digeser '+n+' tempat ke kanan':'Koma digeser '+(-n)+' tempat ke kiri')]);
  msg('bmsg','good','Pangkat positif: bilangan besar. Pangkat negatif: bilangan kecil.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D08 = rakit(DASAR, { kode: 'D-08', data: DATA_D08 })
