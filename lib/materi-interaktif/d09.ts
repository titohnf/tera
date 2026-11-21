import { rakit } from './bersama'
import { DATA_D09 } from './latihan/d09'

/**
 * Materi interaktif D-09 "Persamaan dan Pertidaksamaan" (PLSV dan PtLSV:
 * istilah, operasi pada kedua ruas, kurung, variabel di dua ruas,
 * pertidaksamaan dengan membalik tanda, dan soal cerita). Satu halaman HTML
 * mandiri, ditampilkan lewat iframe sandbox di `/mandiri/materi` dan sebagai
 * langkah Belajar di topik Misi D-09.
 *
 * Lima stasiun praktik: 1) coba nilai x pada neraca (seimbang berarti
 * penyelesaian; pertidaksamaan punya banyak penyelesaian), 2) istilah dan
 * langkah dasar (memindah ruas membalik operasi), 3) menyelesaikan PLSV, 4)
 * pertidaksamaan (kali atau bagi negatif membalik tanda), 5) cerita. Bonus:
 * neraca ax + b = c. Lalu tiga stasiun mesin latihan, bahannya di
 * `latihan/d09.ts`.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Persamaan dan Pertidaksamaan</title>
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
      <h1>Persamaan dan Pertidaksamaan</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo seimbangkan neraca!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Coba nilai x.</p>
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
    <p class="say" id="s2say">Istilah dan langkah dasar.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Menyelesaikan PLSV.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Pertidaksamaan.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Persamaan dalam cerita.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: neraca bergerak</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: neraca ax + b = c.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="1" max="4" step="1" value="2" aria-label="Koefisien a"><div class="baca" id="bNB"></div><input type="range" id="bB" min="1" max="6" step="1" value="3" aria-label="Konstanta b">
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
  if(id==='intro')setKata('Ayo belajar persamaan dan pertidaksamaan!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar persamaan dan pertidaksamaan!');

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

/* ---- stasiun 1: coba nilai x pada neraca ---- */
var R1=[
  {tx:'x + 7 = 15',L:function(x){return x+7},R:function(x){return 15},tg:8,max:12,st:[
    {t:'Neraca seimbang saat x = 8. Operasi yang tepat pada KEDUA ruas?',o:['mengurangkan 7','menambahkan 7','mengalikan 7'],b:'mengurangkan 7',p:'x + 7 − 7 = 15 − 7, jadi x = 8.'},
    {t:'Siswa: "x + 7 = 15 menjadi x = 15 + 7." Tepatkah?',o:['Salah; seharusnya dikurangi 7: x = 8','Benar'],b:'Salah; seharusnya dikurangi 7: x = 8',p:'Pindah ruas membalik operasinya.'}]},
  {tx:'2x + 3 = 11',L:function(x){return 2*x+3},R:function(x){return 11},tg:4,max:10,st:[
    {t:'Langkah pertama: kurangi 3 di kedua ruas. 2x = ?',o:['8','14','11'],b:'8',p:'11 − 3 = 8.'},
    {t:'Lalu bagi kedua ruas dengan 2. x = ?',o:['4','16','6'],b:'4',p:'8 : 2 = 4.'},
    {t:'Periksa: 2(4) + 3 = ?',o:['11','8','14'],b:'11',p:'Benar, sama dengan ruas kanan.'}]},
  {tx:'3x + 2 = x + 8',L:function(x){return 3*x+2},R:function(x){return x+8},tg:3,max:8,st:[
    {t:'Variabel di kedua ruas. Kurangi x di kedua ruas: ?',o:['2x + 2 = 8','4x + 2 = 8','3x + 2 = 8'],b:'2x + 2 = 8',p:'3x − x = 2x.'},
    {t:'Lalu x = ?',o:['3','4','5'],b:'3',p:'2x = 6, x = 3.'},
    {t:'Untuk memastikan x = 3, cukup periksa satu ruas saja. Tepatkah?',o:['Salah; KEDUA ruas harus bernilai sama (11 dan 11)','Benar'],b:'Salah; KEDUA ruas harus bernilai sama (11 dan 11)',p:'Ruas kiri 3(3)+2 = 11; ruas kanan 3 + 8 = 11.'}]},
  {tx:'5x − 3 = 2x + 9',L:function(x){return 5*x-3},R:function(x){return 2*x+9},tg:4,max:8,st:[
    {t:'Kumpulkan x di kiri dan angka di kanan: 3x = ?',o:['12','6','15'],b:'12',p:'5x − 2x = 3x; 9 + 3 = 12.'},
    {t:'x = ?',o:['4','3','12'],b:'4',p:'12 : 3 = 4.'}]},
  {tx:'2(x + 3) = 10',L:function(x){return 2*(x+3)},R:function(x){return 10},tg:2,max:8,st:[
    {t:'Siswa menulis 2x + 3 = 10 sebagai langkah pertama. Kesalahannya?',o:['2 seharusnya dikalikan ke kedua suku: 2x + 6','Tidak ada kesalahan'],b:'2 seharusnya dikalikan ke kedua suku: 2x + 6',p:'Distributif: 2(x + 3) = 2x + 6.'},
    {t:'2x + 6 = 10, jadi x = ?',o:['2','8','3'],b:'2',p:'2x = 4.'}]},
  {tx:'2x + 1 > 8',L:function(x){return 2*x+1},R:function(x){return 8},tg:4,max:8,ineq:true,st:[
    {t:'Bilangan bulat terkecil yang memenuhi 2x + 1 > 8 adalah x = 4 (9 > 8). Apakah x = 3 memenuhi?',o:['Tidak; 7 > 8 salah','Ya'],b:'Tidak; 7 > 8 salah',p:'Pertidaksamaan: ada banyak penyelesaian, x > 3,5.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){
  var d=R1[r1],l=d.L(v),r=d.R(v);
  gambarDi('s1alat',{k:'setara',angkaL:l,angkaR:r,sud:d.ineq?0:Math.max(-12,Math.min(12,(r-l)*2))});
  barisTeks('s1tampil',['x = '+v+':  kiri = '+l+',  kanan = '+r+(d.ineq?(l>r?'  (memenuhi: kiri lebih besar)':'  (belum memenuhi)'):(l===r?'  (seimbang!)':'')) ]);
}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='0';sl.max=String(d.max);sl.step='1';sl.value='0';sl.disabled=false;
  var t=d.ineq?'Cari bilangan bulat terkecil yang memenuhi '+d.tx+'.':'Geser x sampai neraca seimbang: '+d.tx+'.';$('s1say').textContent=t;setKata(t);
  gambar1(0);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Coba beberapa nilai x. Penyelesaian membuat KEDUA ruas sama.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v===d.tg){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good',d.ineq?'x = '+v+' memenuhi, dan x = '+(v-1)+' belum.':'x = '+v+' membuat kedua ruas sama.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','',d.ineq?'Geser sampai x terkecil yang memenuhi.':'Geser terus sampai seimbang.');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: istilah dan langkah dasar ---- */
var R2=[
  {say:'2x + 3 = 7',g:{k:'setara',kb:2,ku:3,kn:7},st:[
    {t:'Bagian 2x + 3 disebut...',o:['ruas kiri','ruas kanan','konstanta'],b:'ruas kiri',p:'Yang di sebelah kiri tanda =.'},
    {t:'Pada 4x − 7 = 9, koefisien x dan konstanta ruas kiri?',o:['4 dan −7','4 dan 7','−7 dan 4'],b:'4 dan −7',p:'Koefisien 4, konstanta −7.'}]},
  {say:'Nilai variabel yang membuat persamaan benar.',st:[
    {t:'Disebut...',o:['penyelesaian (akar persamaan)','koefisien','suku'],b:'penyelesaian (akar persamaan)',p:'Penyelesaian.'},
    {t:'Apakah x = 2 penyelesaian 3x + 1 = 7?',o:['Ya, karena 3(2) + 1 = 7','Tidak'],b:'Ya, karena 3(2) + 1 = 7',p:'Substitusi lalu bandingkan.'},
    {t:'Apakah x = 5 penyelesaian 2x − 3 = 8?',o:['Tidak; 2(5) − 3 = 7, bukan 8','Ya'],b:'Tidak; 2(5) − 3 = 7, bukan 8',p:'7 ≠ 8.'}]},
  {say:'Mana yang persamaan linear satu variabel (PLSV)?',st:[
    {t:'Pilih yang BUKAN PLSV.',o:['x² + 1 = 5','3x − 5 = 10','2x + 3 = 7'],b:'x² + 1 = 5',p:'Pangkat variabel harus 1.'},
    {t:'x < 5 disebut...',o:['pertidaksamaan','persamaan'],b:'pertidaksamaan',p:'Tidak memakai tanda =.'}]},
  {say:'x − 3 = 7',st:[
    {t:'Kedua ruas ditambah 3. Persamaan setara?',o:['x = 10','x = 4','x = 7'],b:'x = 10',p:'x − 3 + 3 = 7 + 3.'}]},
  {say:'5x = 20 dan x/2 = 6',st:[
    {t:'5x = 20: kedua ruas dibagi...',o:['5','20','2'],b:'5',p:'x = 4.'},
    {t:'x/2 = 6: kedua ruas dikali 2, x = ?',o:['12','3','8'],b:'12',p:'Kebalikan dari bagi adalah kali.'}]},
  {say:'Simbol ≥ dan ≤.',st:[
    {t:'≥ dibaca...',o:['lebih dari atau sama dengan','kurang dari atau sama dengan','tidak sama dengan'],b:'lebih dari atau sama dengan',p:'≤: kurang dari atau sama dengan.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Istilah dan langkah dasar.';setKata(d.say);
  if(d.g)gambarDi('s2alat',d.g);else clear($('s2alat'));
  barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Lakukan operasi yang SAMA pada kedua ruas.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: menyelesaikan PLSV ---- */
var R3=[
  {say:'x + 5 = 12 dan x − 4 = 9',st:[
    {t:'x + 5 = 12, x = ?',o:['7','17','5'],b:'7',p:'12 − 5.'},
    {t:'x − 4 = 9, x = ?',o:['13','5','36'],b:'13',p:'9 + 4.'}]},
  {say:'3x = 15 dan 4x = 28',st:[
    {t:'3x = 15, x = ?',o:['5','12','45'],b:'5',p:'15 : 3.'},
    {t:'4x = 28, x = ?',o:['7','24','32'],b:'7',p:'28 : 4.'}]},
  {say:'3(x − 2) = 15',st:[
    {t:'Jabarkan: 3x − 6 = 15. 3x = ?',o:['21','9','15'],b:'21',p:'15 + 6.'},
    {t:'x = ?',o:['7','5','21'],b:'7',p:'21 : 3.'},
    {t:'Siswa menulis 3x − 2 = 15. Kesalahannya?',o:['3 tidak dikalikan ke −2','Salah menambah'],b:'3 tidak dikalikan ke −2',p:'Seharusnya 3x − 6.'}]},
  {say:'4(x − 1) = 16',st:[
    {t:'x = ?',o:['5','4','17'],b:'5',p:'4x − 4 = 16; 4x = 20; x = 5.'}]},
  {say:'4x − 1 = 2x + 7',st:[
    {t:'Siswa: "setara dengan 2x = 8." Tepatkah?',o:['Benar; kurangi 2x dan tambah 1','Salah'],b:'Benar; kurangi 2x dan tambah 1',p:'Hasil x = 4.'}]},
  {say:'3x + 2 = x + 8 dan 2x + 2 = 8.',st:[
    {t:'Apakah penyelesaiannya sama?',o:['Sama; 2x + 2 = 8 diperoleh dengan mengurangkan x dari kedua ruas','Berbeda'],b:'Sama; 2x + 2 = 8 diperoleh dengan mengurangkan x dari kedua ruas',p:'Keduanya x = 3.'}]},
  {say:'ax + 5 = 17 dengan x = 4.',st:[
    {t:'Nilai a = ?',o:['3','4','12'],b:'3',p:'4a + 5 = 17; 4a = 12.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Menyelesaikan PLSV.';setKata(d.say);
  clear($('s3alat'));barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Jabarkan kurung, kumpulkan suku sejenis, lalu bagi.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: pertidaksamaan ---- */
var R4=[
  {say:'2x > 8',g:{k:'garisbil',lo:0,hi:8,titik:[{v:4,l:'4'}]},st:[
    {t:'Bagi kedua ruas dengan 2 (positif). Tanda...',o:['tetap: x > 4','dibalik: x < 4'],b:'tetap: x > 4',p:'Membagi bilangan positif tidak mengubah tanda.'}]},
  {say:'−2x > 10',g:{k:'garisbil',lo:-8,hi:2,titik:[{v:-5,l:'−5'}]},st:[
    {t:'Dibagi −2 (negatif). Tanda...',o:['dibalik: x < −5','tetap: x > −5'],b:'dibalik: x < −5',p:'Kali atau bagi bilangan negatif membalik tanda.'},
    {t:'Siswa menjawab x > −5. Kesalahannya?',o:['Lupa membalik tanda saat membagi bilangan negatif','Salah membagi'],b:'Lupa membalik tanda saat membagi bilangan negatif',p:'Uji x = 0: −2(0) = 0 > 10? Salah.'}]},
  {say:'−3x ≤ 12',st:[
    {t:'Dibagi −3 dan tanda dibalik: x … −4',o:['≥','≤','>'],b:'≥',p:'−3x ≤ 12 menjadi x ≥ −4.'}]},
  {say:'−4x < 20',st:[
    {t:'Penyelesaian?',o:['x > −5','x < −5','x > 5'],b:'x > −5',p:'20 : (−4) = −5, tanda dibalik.'}]},
  {say:'−2x + 3 > 7',st:[
    {t:'−2x > 4, jadi x < −2. Nilai yang memenuhi?',o:['x = −3','x = 0','x = 2'],b:'x = −3',p:'−2(−3) + 3 = 9 > 7.'}]},
  {say:'Dikali bilangan negatif DUA kali berturut-turut.',st:[
    {t:'Arah tanda akhirnya...',o:['kembali seperti semula','dibalik'],b:'kembali seperti semula',p:'Dua kali dibalik = tetap.'}]},
  {say:'4x − 5 < 3x + 2',st:[
    {t:'Kurangi 3x dan tambah 5: ?',o:['x < 7','x > 7','x < −3'],b:'x < 7',p:'4x − 3x < 2 + 5.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Pertidaksamaan.';setKata(d.say);
  if(d.g)gambarDi('s4alat',d.g);else clear($('s4alat'));
  barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Kali atau bagi dengan bilangan NEGATIF: tanda dibalik.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: cerita ---- */
var R5=[
  {say:'Umur Ayah 3 kali umur Andi; selisihnya 24 tahun.',st:[
    {t:'Umur Andi = x: 3x − x = 24, jadi x = ?',o:['12','8','24'],b:'12',p:'2x = 24.'},
    {t:'Umur Ayah = 3 × 12 = ?',o:['36','24','48'],b:'36',p:'36 tahun.'}]},
  {say:'Tiket dewasa 2 kali tiket anak. 3 dewasa + 2 anak = Rp64.000.',st:[
    {t:'Anak = x, dewasa = 2x: 3(2x) + 2x = 64.000. 8x = ?',o:['64.000','32.000','16.000'],b:'64.000',p:'6x + 2x = 8x.'},
    {t:'Satu tiket anak?',o:['8.000','16.000','4.000'],b:'8.000',p:'64.000 : 8.'}]},
  {say:'Harga awal p, diskon 20%, harganya Rp80.000.',st:[
    {t:'p − 0,2p = 80.000, jadi 0,8p = 80.000. p = ?',o:['100.000','96.000','64.000'],b:'100.000',p:'80.000 : 0,8.'}]},
  {say:'Sepatu didiskon 25% menjadi Rp150.000.',st:[
    {t:'0,75p = 150.000, p = ?',o:['200.000','187.500','112.500'],b:'200.000',p:'150.000 : 0,75.'}]},
  {say:'Budi punya Rp50.000, buku Rp8.000 per buah, sisa minimal Rp10.000.',st:[
    {t:'50.000 − 8.000x ≥ 10.000. 8.000x ≤ ?',o:['40.000','60.000','10.000'],b:'40.000',p:'Dipindah: 50.000 − 10.000.'},
    {t:'Buku maksimal?',o:['5 buku','6 buku','4 buku'],b:'5 buku',p:'x ≤ 5.'}]},
  {say:'Jarak maksimal 120 km dalam 3 jam.',st:[
    {t:'3v ≤ 120, jadi v ≤ ?',o:['40 km/jam','360 km/jam','117 km/jam'],b:'40 km/jam',p:'Kecepatan maksimal 40 km/jam.'}]},
  {say:'Tangki 200 liter dikuras 15 liter per menit. Sisa kurang dari 50 liter.',st:[
    {t:'200 − 15t < 50, jadi 15t > 150, t > ?',o:['10','11','15'],b:'10',p:'t harus lebih dari 10.'},
    {t:'Bilangan bulat minimal?',o:['11 menit','10 menit','150 menit'],b:'11 menit',p:'10 menit tepat menyisakan 50, bukan kurang dari 50.'}]},
  {say:'Bilangan ganjil x dengan 2x + 3 > 11.',st:[
    {t:'x > 4. Ganjil terkecil?',o:['5','4','3'],b:'5',p:'5 adalah ganjil pertama yang lebih dari 4.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Persamaan dalam cerita.';setKata(d.say);
  clear($('s5alat'));barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Tulis model dengan huruf, lalu selesaikan.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Neraca seimbang jika kedua ruas diperlakukan sama.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-09'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.setara({kb:1,ku:3,kn:10}));
})();


/* ---- bonus: neraca ax + b = c ---- */
function mulaiBonus(){$('bA').value='2';$('bB').value='3';gambarBonus()}
function gambarBonus(){
  var a=+$('bA').value,b=+$('bB').value,x=4,c=a*x+b;
  $('bNA').textContent='Koefisien a = '+a;$('bNB').textContent='Konstanta b = '+b;
  gambarDi('bGambar',{k:'setara',kb:a,ku:b,kn:c});
  barisTeks('bTanda',[a+'x + '+b+' = '+c,a+'x = '+(c-b)+', jadi x = '+(c-b)/a]);
  msg('bmsg','good','Kurangi b di kedua ruas, lalu bagi dengan a.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D09 = rakit(DASAR, { kode: 'D-09', data: DATA_D09 })
