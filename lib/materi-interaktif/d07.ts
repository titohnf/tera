import { rakit } from './bersama'
import { DATA_D07 } from './latihan/d07'

/**
 * Materi interaktif D-07 "Bentuk Aljabar" (variabel, koefisien, konstanta,
 * suku sejenis, menyederhanakan, substitusi, sifat distributif termasuk
 * bilangan negatif, perkalian dua kurung, keliling dan luas, faktorisasi
 * sederhana). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi D-07.
 *
 * Lima stasiun praktik: 1) geser x dan bandingkan dua bentuk (3(x+2) bukan
 * 3x+2; satu nilai yang cocok belum membuktikan ekuivalen), 2) istilah dan
 * suku sejenis, 3) menyederhanakan, 4) sifat distributif (model luas,
 * tanda negatif), 5) dua kurung, bangun datar, faktorisasi. Bonus: k(x+2)
 * lawan kx+2k. Renderer `luasalj` (model luas) di gambar.ts. Lalu tiga
 * stasiun mesin latihan, bahannya di `latihan/d07.ts`.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bentuk Aljabar</title>
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
      <h1>Bentuk Aljabar</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo main dengan huruf dan angka!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser nilai x.</p>
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
    <p class="say" id="s2say">Istilah dan suku sejenis.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Menyederhanakan bentuk aljabar.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Sifat distributif.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Dua kurung dan bangun datar.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: distributif bergerak</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: k(x + 2) dan kx + 2k.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="0" max="8" step="1" value="3" aria-label="Nilai x"><div class="baca" id="bNB"></div><input type="range" id="bB" min="1" max="5" step="1" value="3" aria-label="Nilai k">
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
  if(id==='intro')setKata('Ayo belajar bentuk aljabar!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar bentuk aljabar!');

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

/* ---- stasiun 1: geser x, bandingkan dua bentuk ---- */
function dua(id,a,b){var w=$(id);clear(w);w.style.flexDirection='column';w.style.gap='4px';w.appendChild(GBR.bar(a));w.appendChild(GBR.bar(b))}
function pk(n,x,c){var r=[],i;for(i=0;i<n;i++)r.push({l:'x',v:x,w:'biru'});if(c)r.push({l:String(c),v:c,w:'merah'});return {atas:null,bagian:r}}
var R1=[
  {a:'2x + 5',b:null,tg:3,f1:function(x){return 2*x+5},g1:function(x){return pk(2,x,5)},st:[
    {t:'Jika x = 3, nilai 2x + 5 = ?',o:['11','10','35'],b:'11',p:'2 × 3 + 5 = 11. Menggantikan x dengan angka disebut substitusi.'},
    {t:'Dalam 2x + 5, angka 2 disebut...',o:['koefisien','konstanta','variabel'],b:'koefisien',p:'2 = koefisien, 5 = konstanta, x = variabel.'}]},
  {a:'3(x + 2)',b:'3x + 2',tg:4,f1:function(x){return 3*(x+2)},f2:function(x){return 3*x+2},g1:function(x){return {bagian:[0,1,2].map(function(){return {l:'x+2',v:x+2,w:'biru'}})}},g2:function(x){return pk(3,x,2)},st:[
    {t:'Pada x = 4, 3(x + 2) = 18 dan 3x + 2 = 14. Apakah sama?',o:['Tidak sama','Sama'],b:'Tidak sama',p:'Jadi 3(x+2) tidak sama dengan 3x + 2.'},
    {t:'Bentuk yang benar untuk 3(x + 2) adalah...',o:['3x + 6','3x + 2','x + 6'],b:'3x + 6',p:'3 dikalikan ke SEMUA suku di dalam kurung.'}]},
  {a:'2(x + 3)',b:'2x + 6',tg:5,f1:function(x){return 2*(x+3)},f2:function(x){return 2*x+6},g1:function(x){return {bagian:[0,1].map(function(){return {l:'x+3',v:x+3,w:'biru'}})}},g2:function(x){return {bagian:[{l:'x',v:x,w:'biru'},{l:'x',v:x,w:'biru'},{l:'6',v:6,w:'merah'}]}},st:[
    {t:'Pada x = 5 keduanya 16. Pada nilai x lain?',o:['Tetap sama untuk semua x','Mungkin berbeda'],b:'Tetap sama untuk semua x',p:'Sifat distributif: 2(x+3) = 2x + 6 berlaku untuk semua nilai x.'}]},
  {a:'4(x + 1)',b:'4x + 1',tg:2,f1:function(x){return 4*(x+1)},f2:function(x){return 4*x+1},g1:function(x){return {bagian:[0,1,2,3].map(function(){return {l:'x+1',v:x+1,w:'biru'}})}},g2:function(x){return pk(4,x,1)},st:[
    {t:'Siswa: "4(x + 1) = 4x + 1." Pada x = 2: 12 lawan 9. Tepatkah?',o:['Salah; seharusnya 4x + 4','Benar'],b:'Salah; seharusnya 4x + 4',p:'4 dikali juga ke angka 1.'}]},
  {a:'x + x',b:'x × x',tg:2,f1:function(x){return x+x},f2:function(x){return x*x},g1:function(x){return {bagian:[{l:'x',v:x,w:'biru'},{l:'x',v:x,w:'biru'}]}},g2:function(x){return {bagian:[{l:'x×x',v:x*x||1,w:'hijau'}]}},st:[
    {t:'Pada x = 2 keduanya 4. Cukup satu nilai untuk menyimpulkan keduanya selalu sama?',o:['Tidak; coba x = 3: 6 lawan 9','Ya, sama berarti ekuivalen'],b:'Tidak; coba x = 3: 6 lawan 9',p:'Satu nilai yang cocok belum membuktikan ekuivalen untuk semua x.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){
  var d=R1[r1];
  if(d.b){dua('s1alat',d.g1(v),d.g2(v));barisTeks('s1tampil',[d.a+' = '+d.f1(v),d.b+' = '+d.f2(v)])}
  else{gambarDi('s1alat',Object.assign({k:'bar'},d.g1(v)));barisTeks('s1tampil',[d.a+' = '+d.f1(v)])}
}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='1';sl.max='8';sl.step='1';sl.value='1';sl.disabled=false;
  var t='Geser x sampai x = '+d.tg+'.';$('s1say').textContent=t;setKata(t);
  $('s1alat').style.flexDirection='column';
  gambar1(1);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Ganti x dengan angka, lalu hitung nilainya.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v===d.tg){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good','x = '+v+': perhatikan nilai kedua bentuk.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus sampai x = '+d.tg+'.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: istilah dan suku sejenis ---- */
var R2=[
  {say:'Bentuk aljabar 5x + 3.',st:[
    {t:'Huruf x disebut...',o:['variabel','koefisien','konstanta'],b:'variabel',p:'Variabel = huruf pengganti bilangan.'},
    {t:'Angka 5 disebut...',o:['koefisien','konstanta','suku'],b:'koefisien',p:'Angka yang menempel pada variabel.'},
    {t:'Angka 3 (tanpa variabel) disebut...',o:['konstanta','koefisien','variabel'],b:'konstanta',p:'Konstanta.'}]},
  {say:'Bagian aljabar yang dipisahkan tanda + atau −.',st:[
    {t:'Bagian itu disebut...',o:['suku','faktor','variabel'],b:'suku',p:'3x + 5y − 2 punya 3 suku.'}]},
  {say:'Suku sejenis: variabel dan pangkatnya sama.',st:[
    {t:'Pasangan yang sejenis?',o:['5x dan 3x','2x dan 2x²','3x dan 3y'],b:'5x dan 3x',p:'2x dan 2x² berbeda pangkat; 3x dan 3y berbeda variabel.'},
    {t:'5xy dan 5yx sejenis?',o:['Ya, urutan huruf tidak berpengaruh','Tidak'],b:'Ya, urutan huruf tidak berpengaruh',p:'xy = yx.'},
    {t:'4m dan −4m sejenis?',o:['Ya','Tidak'],b:'Ya',p:'Variabelnya sama; koefisiennya boleh negatif.'}]},
  {say:'Siswa: "2x + 3y = 5xy."',st:[
    {t:'Penilaian?',o:['Salah; x dan y tidak sejenis, tidak bisa digabung','Benar'],b:'Salah; x dan y tidak sejenis, tidak bisa digabung',p:'2x + 3y sudah paling sederhana.'}]},
  {say:'Bentuk mana yang sudah paling sederhana?',st:[
    {t:'Pilih yang tidak punya suku sejenis lagi.',o:['5x + 3y − 2','4x + 3x − 2y','6a + 2a'],b:'5x + 3y − 2',p:'Yang lain masih bisa digabung.'}]},
  {say:'Siswa: "7p − 3p = 4."',st:[
    {t:'Penilaian?',o:['Salah; hasilnya 4p','Benar'],b:'Salah; hasilnya 4p',p:'Variabel tetap ikut.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Istilah dan suku sejenis.';setKata(d.say);
  clear($('s2alat'));barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Variabel: huruf. Koefisien: angka di depan huruf. Konstanta: angka sendiri.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: menyederhanakan ---- */
var R3=[
  {say:'5x + 3x',st:[{t:'Jumlahkan koefisiennya.',o:['8x','8x²','15x'],b:'8x',p:'5 + 3 = 8, variabel tetap.'}]},
  {say:'7y − 2y + 4y',st:[{t:'7 − 2 + 4 = ?',o:['9y','13y','5y'],b:'9y',p:'9y.'}]},
  {say:'6x − 2x + 3 − 1',st:[
    {t:'Suku x: 6x − 2x = ?',o:['4x','8x','4'],b:'4x',p:'4x.'},
    {t:'Konstanta: 3 − 1 = ?',o:['2','4','3x'],b:'2',p:'Hasil 4x + 2.'}]},
  {say:'4x + 3y − x + 2y',st:[
    {t:'Kelompokkan x dan y yang sejenis. Hasilnya...',o:['3x + 5y','5x + 3y','8xy'],b:'3x + 5y',p:'4x − x = 3x; 3y + 2y = 5y.'}]},
  {say:'5p + 2q − 3p + q',st:[
    {t:'Hasilnya...',o:['2p + 3q','8p + 3q','2p + q'],b:'2p + 3q',p:'5p − 3p = 2p; 2q + q = 3q.'}]},
  {say:'6a + 4a − a dan 8m − 3m + 5m',st:[
    {t:'6a + 4a − a = ?',o:['9a','10a','11a'],b:'9a',p:'6 + 4 − 1 = 9.'},
    {t:'8m − 3m + 5m = ?',o:['10m','16m','0'],b:'10m',p:'8 − 3 + 5 = 10.'}]},
  {say:'Jika a = 4, berapa 5a − 3?',st:[
    {t:'5 × 4 − 3 = ?',o:['17','23','11'],b:'17',p:'Substitusi a = 4.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Menyederhanakan bentuk aljabar.';setKata(d.say);
  clear($('s3alat'));barisTeks('s3tampil',['Sederhanakan: '+d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Gabungkan hanya suku yang sejenis: jumlahkan koefisiennya.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: sifat distributif ---- */
var R4=[
  {say:'3(x + 4)',g:{k:'luasalj',w:['x',4],h:[3]},st:[
    {t:'3 dikalikan ke...',o:['x dan 4 (semua suku)','x saja'],b:'x dan 4 (semua suku)',p:'3 × x = 3x dan 3 × 4 = 12.'},
    {t:'3(x + 4) = ?',o:['3x + 12','3x + 4','x + 12'],b:'3x + 12',p:'Dua persegi panjang: 3x dan 12.'}]},
  {say:'2(x + 5) dan 4(a + 3)',st:[
    {t:'2(x + 5) = ?',o:['2x + 10','2x + 5','x + 10'],b:'2x + 10',p:'2x + 10.'},
    {t:'4(a + 3) = ?',o:['4a + 12','4a + 3','a + 12'],b:'4a + 12',p:'4a + 12.'}]},
  {say:'−3(x − 4)',st:[
    {t:'(−3) × x = ?',o:['−3x','3x','−3'],b:'−3x',p:'−3x.'},
    {t:'(−3) × (−4) = ?',o:['+12','−12','−7'],b:'+12',p:'Negatif kali negatif = positif. Hasil −3x + 12.'}]},
  {say:'−(2x − 5)',st:[
    {t:'Siswa menulis −2x − 5. Tepatkah?',o:['Salah; tanda minus mengubah SEMUA suku: −2x + 5','Benar'],b:'Salah; tanda minus mengubah SEMUA suku: −2x + 5',p:'−(2x − 5) = −2x + 5.'}]},
  {say:'Siswa menyederhanakan 5(x − 2) + 3x: Langkah 1: 5x − 2 + 3x. Langkah 2: 8x − 2.',st:[
    {t:'Di mana kesalahannya?',o:['Langkah 1: 5 harus dikali juga ke −2 (−10)','Langkah 2: penjumlahan salah'],b:'Langkah 1: 5 harus dikali juga ke −2 (−10)',p:'Benar: 5x − 10 + 3x = 8x − 10.'}]},
  {say:'3(x + 4) − (x − 2)',st:[
    {t:'3(x + 4) = 3x + 12. Lalu −(x − 2) = ?',o:['−x + 2','−x − 2','x + 2'],b:'−x + 2',p:'Minus membalik kedua suku.'},
    {t:'Hasil akhir: 3x + 12 − x + 2 = ?',o:['2x + 14','4x + 14','2x + 10'],b:'2x + 14',p:'2x + 14.'}]},
  {say:'2(x − 3) + 3(x + 1)',st:[
    {t:'Jabarkan: 2x − 6 + 3x + 3 = ?',o:['5x − 3','5x + 9','5x − 9'],b:'5x − 3',p:'−6 + 3 = −3.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Sifat distributif.';setKata(d.say);
  if(d.g)gambarDi('s4alat',d.g);else clear($('s4alat'));
  barisTeks('s4tampil',['Jabarkan: '+d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','a(b + c) = ab + ac. Kalikan ke SEMUA suku, perhatikan tanda.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: dua kurung, bangun datar, faktorisasi ---- */
var R5=[
  {say:'(x + 2)(x + 3)',g:{k:'luasalj',w:['x',3],h:['x',2]},st:[
    {t:'Empat bagian luasnya: x², 3x, 2x, 6. Jumlah suku x = ?',o:['5x','6x','x'],b:'5x',p:'3x + 2x = 5x.'},
    {t:'(x + 2)(x + 3) = ?',o:['x² + 5x + 6','x² + 6','x² + 5x + 5'],b:'x² + 5x + 6',p:'Siswa yang menulis x² + 6 lupa hasil kali silang.'}]},
  {say:'(2x + 1)(x + 3)',g:{k:'luasalj',w:['x','x',3],h:['x',1]},st:[
    {t:'Hasil kali: 2x² + 6x + x + 3 = ?',o:['2x² + 7x + 3','2x² + 3','2x² + 7x'],b:'2x² + 7x + 3',p:'6x + x = 7x.'}]},
  {say:'Taman persegi panjang: panjang (2x + 3) m, lebar (x + 1) m.',g:{k:'luasalj',w:['x','x',3],h:['x',1]},st:[
    {t:'Luas setelah dijabarkan?',o:['2x² + 5x + 3','2x² + 3','3x + 4'],b:'2x² + 5x + 3',p:'2x² + 2x + 3x + 3.'}]},
  {say:'Persegi panjang: panjang (x + 5) cm, lebar 3 cm.',g:{k:'luasalj',w:['x',5],h:[3]},st:[
    {t:'Keliling = 2 × (panjang + lebar) = 2(x + 8) = ?',o:['2x + 16','2x + 8','x + 16'],b:'2x + 16',p:'2x + 16.'},
    {t:'Luas = 3(x + 5) = ?',o:['3x + 15','3x + 5','x + 15'],b:'3x + 15',p:'3x + 15.'}]},
  {say:'Keliling persegi (8x + 12) cm.',st:[
    {t:'Panjang sisi = keliling : 4 = ?',o:['2x + 3','2x + 12','8x + 3'],b:'2x + 3',p:'Setiap suku dibagi 4.'}]},
  {say:'Luas persegi panjang (5x + 15), panjang (x + 3).',st:[
    {t:'Lebar = (5x + 15) : (x + 3) = ?',o:['5','x + 5','15'],b:'5',p:'5x + 15 = 5(x + 3).'}]},
  {say:'6x + 9 ditulis sebagai perkalian (faktorisasi).',st:[
    {t:'Faktor persekutuannya 3, jadi 6x + 9 = ?',o:['3(2x + 3)','6(x + 9)','3(2x + 9)'],b:'3(2x + 3)',p:'Periksa dengan menjabarkan: 6x + 9.'}]},
  {say:'Umur Andi x tahun, kakaknya 5 tahun lebih tua.',st:[
    {t:'Jumlah umur mereka...',o:['2x + 5','2x','x + 5'],b:'2x + 5',p:'x + (x + 5) = 2x + 5.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Dua kurung dan bangun datar.';setKata(d.say);
  if(d.g)gambarDi('s5alat',d.g);else clear($('s5alat'));
  barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Setiap suku di kurung pertama dikali setiap suku di kurung kedua.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kalikan ke semua suku; gabung hanya yang sejenis.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-07'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.luasalj({w:['x',3],h:['x',2]}));
})();


/* ---- bonus: k(x + 2) lawan kx + 2k ---- */
function mulaiBonus(){$('bA').value='3';$('bB').value='3';gambarBonus()}
function gambarBonus(){
  var x=+$('bA').value,k=+$('bB').value;
  $('bNA').textContent='x = '+x;$('bNB').textContent='k = '+k;
  var a=[],b=[],i;for(i=0;i<k;i++){a.push({l:'x+2',v:x+2,w:'biru'});b.push({l:'x',v:x,w:'hijau'})}b.push({l:String(2*k),v:2*k,w:'merah'});
  var w=$('bGambar');clear(w);w.style.flexDirection='column';w.appendChild(GBR.bar({bagian:a}));w.appendChild(GBR.bar({bagian:b}));
  barisTeks('bTanda',[k+'(x + 2) = '+k+' × '+(x+2)+' = '+(k*(x+2)),k+'x + '+(2*k)+' = '+(k*x)+' + '+(2*k)+' = '+(k*x+2*k)]);
  msg('bmsg','good','Sama untuk setiap x dan k: sifat distributif.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D07 = rakit(DASAR, { kode: 'D-07', data: DATA_D07 })
