import { rakit } from './bersama'
import { DATA_D16 } from './latihan/d16'

/**
 * Materi interaktif D-16 "Transformasi Geometri" (translasi, refleksi,
 * rotasi, dilatasi pada titik; sifat kekongruenan dan faktor skala). Satu
 * halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi D-16.
 *
 * Lima stasiun praktik: 1) lihat titik berpindah pada bidang (translasi
 * berulang, rotasi 90, 180, 270, dilatasi, pilih cermin), 2) translasi
 * (bayangan, titik asal, vektor), 3) refleksi (sumbu-x, sumbu-y, y = x,
 * y = -x), 4) rotasi (90 searah dan berlawanan, 180), 5) dilatasi (k besar,
 * pecahan, negatif; sifat). Bonus: mesin transformasi. Renderer `kartesius`
 * (gambar.ts). Lalu tiga stasiun mesin latihan, bahannya di
 * `latihan/d16.ts`. Jawaban koordinat diketik seperti (8,1).
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Transformasi Geometri</title>
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
      <h1>Transformasi Geometri</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo geser, cerminkan, dan putar titik!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Gerakkan titik.</p>
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
    <p class="say" id="s2say">Translasi (pergeseran).</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Refleksi (pencerminan).</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Rotasi (perputaran).</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Dilatasi (perkalian).</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin transformasi</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: mesin transformasi.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="-6" max="6" step="1" value="3" aria-label="x"><input type="range" id="bB" min="-6" max="6" step="1" value="2" aria-label="y"><div class="tmp" id="bOp"></div>
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
  if(id==='intro')setKata('Ayo belajar transformasi geometri!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar transformasi geometri!');

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

/* ---- alat bantu transformasi ---- */
function pk(p){return '('+String(p[0]).replace('.',',').replace('-','−')+', '+String(p[1]).replace('.',',').replace('-','−')+')'}
function rotD(p,d){var k=((d%360)+360)%360;if(k===90)return [-p[1],p[0]];if(k===180)return [-p[0],-p[1]];if(k===270)return [p[1],-p[0]];return [p[0],p[1]]}
function cerminP(p,j){if(j===1)return [p[0],-p[1]];if(j===2)return [-p[0],p[1]];if(j===3)return [p[1],p[0]];return [-p[1],-p[0]]}
var NCER=['','sumbu-x','sumbu-y','garis y = x','garis y = −x'];

/* ---- stasiun 1: lihat titik berpindah ---- */
var R1=[
  {jenis:'trans',p:[1,2],vec:[2,1],tg:3,mn:0,mx:4,r:10,t:'Translasi (2, 1) berulang. Geser sampai 3 kali.',tx:'Translasi: setiap geseran menambah (2, 1).',st:[
    {t:'Posisi sesudah 3 geseran: (1 + 3×2, 2 + 3×1) = ?',o:['(7, 5)','(3, 2)','(5, 4)'],b:'(7, 5)',p:'Komponen vektor ditambahkan langsung ke koordinat.'},
    {t:'Translasi mengubah bentuk dan ukuran bangun?',o:['Tidak; hanya posisinya','Ya'],b:'Tidak; hanya posisinya',p:'Bangun bayangan kongruen.'}]},
  {jenis:'rot',p:[4,1],tg:90,mn:0,mx:270,r:6,t:'Putar titik (4, 1) berlawanan arah jarum jam. Geser sampai 90°.',tx:'Rotasi berpusat di O(0, 0).',st:[
    {t:'Aturan rotasi 90° berlawanan arah jarum jam: (x, y) menjadi...',o:['(−y, x)','(y, −x)','(−x, −y)'],b:'(−y, x)',p:'(4, 1) menjadi (−1, 4).'},
    {t:'Rotasi lengkap membutuhkan...',o:['pusat, besar sudut, dan arah putar','hanya sudut'],b:'pusat, besar sudut, dan arah putar',p:'Ketiganya wajib.'}]},
  {jenis:'rot',p:[4,1],tg:180,mn:0,mx:270,r:6,t:'Geser sampai putaran 180°.',tx:'Rotasi 180° membalik kedua koordinat.',st:[
    {t:'Rotasi 180°: (x, y) menjadi...',o:['(−x, −y)','(y, x)','(−y, x)'],b:'(−x, −y)',p:'(4, 1) menjadi (−4, −1).'}]},
  {jenis:'rot',p:[4,1],tg:270,mn:0,mx:270,r:6,t:'Geser sampai putaran 270° berlawanan arah jarum jam.',tx:'270° berlawanan sama dengan 90° searah.',st:[
    {t:'Rotasi 90° SEARAH jarum jam: (x, y) menjadi...',o:['(y, −x)','(−y, x)'],b:'(y, −x)',p:'(4, 1) menjadi (1, −4).'},
    {t:'Rotasi 90° searah dan berlawanan arah jarum jam selalu menghasilkan bayangan yang sama. Tepatkah?',o:['Salah; hasilnya berbeda','Benar'],b:'Salah; hasilnya berbeda',p:'Arah putar menentukan.'}]},
  {jenis:'dil',p:[2,3],tg:-4,mn:-4,mx:6,r:10,t:'Dilatasi titik (2, 3) berpusat di O. Geser faktor skala sampai k = −2.',tx:'Faktor skala k = nilai penggeser : 2.',st:[
    {t:'(x, y) menjadi (kx, ky). Untuk k = −2: ?',o:['(−4, −6)','(4, 6)','(−2, −3)'],b:'(−4, −6)',p:'Bayangan di sisi berlawanan dari pusat.'},
    {t:'Faktor skala negatif membuat bayangan berada...',o:['di sisi berlawanan pusat','di sisi yang sama'],b:'di sisi berlawanan pusat',p:'Berpindah ke seberang pusat.'}]},
  {jenis:'dil',p:[2,3],tg:1,mn:-4,mx:6,r:10,t:'Geser faktor skala sampai k = 0,5.',tx:'k = 0,5 memperkecil.',st:[
    {t:'(2, 3) dengan k = 0,5 menjadi...',o:['(1, 1,5)','(4, 6)','(0,5, 0,5)'],b:'(1, 1,5)',p:'Dikali 0,5.'},
    {t:'Dilatasi dengan k = 1 menghasilkan bangun yang...',o:['sama persis dengan aslinya','dua kali lebih besar'],b:'sama persis dengan aslinya',p:'Dilatasi tidak selalu mengubah ukuran.'}]},
  {jenis:'cer',p:[4,1],tg:3,mn:1,mx:4,r:6,t:'Pilih cermin: 1 = sumbu-x, 2 = sumbu-y, 3 = garis y = x, 4 = garis y = −x. Geser ke 3.',tx:'Refleksi terhadap garis y = x menukar koordinat.',st:[
    {t:'Refleksi terhadap y = x: (x, y) menjadi...',o:['(y, x)','(−y, −x)','(x, −y)'],b:'(y, x)',p:'(4, 1) menjadi (1, 4).'},
    {t:'T(6, 2) memiliki bayangan T’(2, 6). Transformasi yang paling mungkin?',o:['Refleksi terhadap y = x','Translasi','Dilatasi'],b:'Refleksi terhadap y = x',p:'Kedua koordinat bertukar.'}]},
  {jenis:'cer',p:[4,1],tg:1,mn:1,mx:4,r:6,t:'Geser cermin ke sumbu-x (1).',tx:'Sumbu-x mengubah tanda y.',st:[
    {t:'Refleksi terhadap sumbu-x: (4, 1) menjadi...',o:['(4, −1)','(−4, 1)','(1, 4)'],b:'(4, −1)',p:'x tetap, y berubah tanda.'},
    {t:'Refleksi mengubah ukuran dan bentuk bangun?',o:['Tidak; hanya arah (orientasi) yang terbalik','Ya'],b:'Tidak; hanya arah (orientasi) yang terbalik',p:'Bayangan tetap kongruen.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){
  var d=R1[r1],t=[],g=[],q,i;
  if(d.jenis==='trans'){
    for(i=0;i<=v;i++)t.push({x:d.p[0]+i*d.vec[0],y:d.p[1]+i*d.vec[1],w:i===v?'merah':'biru',l:i===v?pk([d.p[0]+i*d.vec[0],d.p[1]+i*d.vec[1]]):''});
    barisTeks('s1tampil',['Setelah '+v+' geseran: '+pk([d.p[0]+v*d.vec[0],d.p[1]+v*d.vec[1]])]);
  }else if(d.jenis==='rot'){
    q=rotD(d.p,v);t.push({x:d.p[0],y:d.p[1],w:'biru',l:'P'});if(v)t.push({x:q[0],y:q[1],w:'merah',l:'P’'});
    barisTeks('s1tampil',['Putar '+v+'°: '+pk(d.p)+' → '+pk(q)]);
  }else if(d.jenis==='dil'){
    var k=v/2;q=[d.p[0]*k,d.p[1]*k];t.push({x:d.p[0],y:d.p[1],w:'biru',l:'P'},{x:q[0],y:q[1],w:'merah',l:'P’'});g.push([0,0,q[0],q[1],'hijau']);
    barisTeks('s1tampil',['k = '+String(k).replace('.',',').replace('-','−')+': '+pk(d.p)+' → '+pk(q)]);
  }else{
    q=cerminP(d.p,v);t.push({x:d.p[0],y:d.p[1],w:'biru',l:'P'},{x:q[0],y:q[1],w:'merah',l:'P’'});
    var R=d.r;g.push(v===1?[-R,0,R,0,'hijau']:v===2?[0,-R,0,R,'hijau']:v===3?[-R,-R,R,R,'hijau']:[-R,R,R,-R,'hijau']);
    barisTeks('s1tampil',['Cermin: '+NCER[v]+'.  '+pk(d.p)+' → '+pk(q)]);
  }
  gambarDi('s1alat',{k:'kartesius',r:d.r,titik:t,garis:g});
}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min=String(d.mn);sl.max=String(d.mx);sl.step=d.jenis==='rot'?'90':'1';sl.value=String(d.mn);sl.disabled=false;
  $('s1say').textContent=d.t;setKata(d.t);
  gambar1(d.mn);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','',d.tx);
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v===d.tg){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good','Bagus! Perhatikan perubahan koordinatnya.');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','',d.tx);
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: translasi ---- */
var R2=[
  {say:'Translasi: (x, y) oleh vektor (a, b) menjadi (x + a, y + b).',st:[
    {t:'Translasi oleh vektor (a, b) menghasilkan bayangan (x + …, y + …)',o:['a dan b','b dan a','a dan a'],b:'a dan b',p:'Komponen pertama pada x, kedua pada y.'},
    {t:'Translasi tetap dijumlah langsung walau komponen vektor negatif. Tepatkah?',o:['Benar','Salah'],b:'Benar',p:'x + a, y + b, termasuk bila a atau b negatif.'}]},
  {say:'P(6, −4) oleh vektor (2, 5).',st:[{t:'P’ = ?',o:['(8, 1)','(4, −9)','(8, −9)'],b:'(8, 1)',p:'6 + 2 dan −4 + 5.'}]},
  {say:'N(9, −5) oleh (−4, 6) dan V(10, −4) oleh (−6, 3).',st:[
    {t:'N’ = ?',o:['(5, 1)','(13, 1)','(5, −11)'],b:'(5, 1)',p:'9 − 4 dan −5 + 6.'},
    {t:'V’ = ?',o:['(4, −1)','(16, −7)','(4, −7)'],b:'(4, −1)',p:'10 − 6 dan −4 + 3.'}]},
  {say:'E(4, 1) oleh (−3, 2). Siswa menjawab (1, 3).',st:[{t:'Tepatkah?',o:['Benar; 4 − 3 = 1 dan 1 + 2 = 3','Salah'],b:'Benar; 4 − 3 = 1 dan 1 + 2 = 3',p:'Komponen vektor langsung ditambahkan.'}]},
  {say:'Bayangan Q’(9, 1) oleh vektor (5, −3). Titik asal Q?',st:[
    {t:'Q = (9 − 5, 1 − (−3)) = ?',o:['(4, 4)','(14, −2)','(4, −2)'],b:'(4, 4)',p:'Kurangkan vektornya.'}]},
  {say:'R(2, −5) menjadi R’(−1, 3).',st:[{t:'Vektor translasi = (−1 − 2, 3 − (−5)) = ?',o:['(−3, 8)','(3, −8)','(1, −2)'],b:'(−3, 8)',p:'Bayangan dikurangi titik asal.'}]},
  {say:'Bayangan X’(6, 5) oleh vektor (−2, 7). Titik asal X?',st:[{t:'X = (6 + 2, 5 − 7) = ?',o:['(8, −2)','(4, 12)','(8, 12)'],b:'(8, −2)',p:'Kebalikan translasi.'}]},
  {say:'Robot memindahkan komponen dari (10, 4) ke (3, 4).',st:[{t:'Vektor translasinya?',o:['(−7, 0)','(7, 0)','(13, 8)'],b:'(−7, 0)',p:'3 − 10 dan 4 − 4.'}]},
  {say:'Karakter game (2, 3), vektor (4, −1), tombol ditekan 3 kali.',st:[{t:'Posisi akhir = (2 + 12, 3 − 3) = ?',o:['(14, 0)','(6, 2)','(14, 6)'],b:'(14, 0)',p:'3 kali vektor.'}]},
  {say:'Ubin: motif pertama di (0, 3), vektor (6, 0).',st:[{t:'Motif ketiga (dua kali geser) di...',o:['(12, 3)','(6, 3)','(12, 0)'],b:'(12, 3)',p:'0 + 2×6.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Translasi (pergeseran).';setKata(d.say);
  clear($('s2alat'));barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Bayangan = titik asal + vektor.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: refleksi ---- */
var R3=[
  {say:'Refleksi terhadap sumbu-x dan sumbu-y.',st:[
    {t:'Terhadap sumbu-x: koordinat yang berubah tanda adalah...',o:['y','x','keduanya'],b:'y',p:'x tetap.'},
    {t:'Terhadap sumbu-y: koordinat yang berubah tanda adalah...',o:['x','y','keduanya'],b:'x',p:'y tetap.'}]},
  {say:'A(3, 5) terhadap sumbu-x dan Q(−3, 7) terhadap sumbu-x.',st:[
    {t:'A’ = ?',o:['(3, −5)','(−3, 5)','(5, 3)'],b:'(3, −5)',p:'y berubah tanda.'},
    {t:'Q’ = ?',o:['(−3, −7)','(3, 7)','(−3, 7)'],b:'(−3, −7)',p:'y berubah tanda.'}]},
  {say:'B(4, −2), R(5, −2), dan P(−7, 4) terhadap sumbu-y.',st:[
    {t:'B’ = ?',o:['(−4, −2)','(4, 2)','(−4, 2)'],b:'(−4, −2)',p:'x berubah tanda.'},
    {t:'P’ = ?',o:['(7, 4)','(−7, −4)','(4, −7)'],b:'(7, 4)',p:'x berubah tanda.'}]},
  {say:'A(4, −1) terhadap y = x dan B(3, 5) terhadap y = −x.',st:[
    {t:'y = x: (x, y) menjadi (y, x). A’ = ?',o:['(−1, 4)','(1, −4)','(4, 1)'],b:'(−1, 4)',p:'Koordinat bertukar.'},
    {t:'y = −x: (x, y) menjadi (−y, −x). B’ = ?',o:['(−5, −3)','(5, 3)','(−3, −5)'],b:'(−5, −3)',p:'Bertukar sekaligus berubah tanda.'}]},
  {say:'Logo (5, −2) dicerminkan untuk kaca pintu; cermin sumbu-y.',st:[{t:'Titik logo cermin?',o:['(−5, −2)','(5, 2)','(−2, 5)'],b:'(−5, −2)',p:'x berubah tanda.'}]},
  {say:'Sifat refleksi.',st:[
    {t:'Refleksi mengubah...',o:['orientasi bangun, ukuran dan bentuk tetap','ukuran bangun','bentuk bangun'],b:'orientasi bangun, ukuran dan bentuk tetap',p:'Bayangan kongruen tetapi terbalik arah putarnya.'},
    {t:'Translasi, refleksi, dan rotasi selalu menghasilkan bayangan yang...',o:['kongruen dengan aslinya','sebangun saja'],b:'kongruen dengan aslinya',p:'Mempertahankan jarak.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Refleksi (pencerminan).';setKata(d.say);
  clear($('s3alat'));barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Sumbu-x: (x, −y). Sumbu-y: (−x, y). y = x: (y, x). y = −x: (−y, −x).');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: rotasi ---- */
var R4=[
  {say:'Aturan rotasi berpusat di O(0, 0).',st:[
    {t:'90° berlawanan arah jarum jam: (x, y) menjadi...',o:['(−y, x)','(y, −x)'],b:'(−y, x)',p:'C(2, 6) menjadi (−6, 2).'},
    {t:'90° searah jarum jam: (x, y) menjadi...',o:['(y, −x)','(−y, x)'],b:'(y, −x)',p:'D(5, −3) menjadi (−3, −5).'},
    {t:'180°: (x, y) menjadi...',o:['(−x, −y)','(y, x)'],b:'(−x, −y)',p:'S(3, 8) menjadi (−3, −8).'}]},
  {say:'T(4, −6) diputar 90° berlawanan arah jarum jam.',st:[{t:'T’ = (−(−6), 4) = ?',o:['(6, 4)','(−6, 4)','(6, −4)'],b:'(6, 4)',p:'Rumus (−y, x).'}]},
  {say:'U(−2, 5) diputar 90° searah jarum jam.',st:[{t:'U’ = (5, −(−2)) = ?',o:['(5, 2)','(−5, 2)','(5, −2)'],b:'(5, 2)',p:'Rumus (y, −x).'}]},
  {say:'L(−6, 4) diputar 90° berlawanan dan W(3, 11) diputar 90° berlawanan.',st:[
    {t:'L’ = (−4, −6)? Periksa: (−y, x) = (−4, −6). Benar?',o:['Ya','Tidak'],b:'Ya',p:'−y = −4 dan x = −6.'},
    {t:'W’ = ?',o:['(−11, 3)','(11, −3)','(3, −11)'],b:'(−11, 3)',p:'(−y, x).'}]},
  {say:'S(−3, −9) diputar 90° searah jarum jam.',st:[{t:'S’ = (y, −x) = ?',o:['(−9, 3)','(9, 3)','(−9, −3)'],b:'(−9, 3)',p:'y = −9; −x = 3.'}]},
  {say:'Titik P(3, 2) menjadi P’(−2, 3).',st:[{t:'Rotasi yang dipakai?',o:['90° berlawanan arah jarum jam','90° searah jarum jam','180°'],b:'90° berlawanan arah jarum jam',p:'(−y, x) = (−2, 3).'}]},
  {say:'Ujung bilah baling-baling di (5, 0) berputar berlawanan arah jarum jam 90°.',st:[{t:'Posisi baru?',o:['(0, 5)','(0, −5)','(−5, 0)'],b:'(0, 5)',p:'(−y, x) = (0, 5).'}]},
  {say:'Rotasi 180° dan dilatasi k = −1.',st:[
    {t:'Rotasi 180° sama dengan refleksi sumbu-x lalu sumbu-y. Tepatkah?',o:['Benar; (x, −y) lalu (−x, −y)','Salah'],b:'Benar; (x, −y) lalu (−x, −y)',p:'Hasilnya (−x, −y).'},
    {t:'Dilatasi k = −1 berpusat O hasilnya sama dengan...',o:['rotasi 180°','refleksi sumbu-x'],b:'rotasi 180°',p:'(−x, −y).'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Rotasi (perputaran).';setKata(d.say);
  clear($('s4alat'));barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Berlawanan: (−y, x). Searah: (y, −x). 180°: (−x, −y).');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: dilatasi ---- */
var R5=[
  {say:'Dilatasi berpusat di O(0, 0) dengan faktor skala k.',st:[
    {t:'(x, y) menjadi...',o:['(kx, ky)','(x + k, y + k)','(x/k, y/k)'],b:'(kx, ky)',p:'Dikali k.'}]},
  {say:'V(4, −3) dengan k = 3 dan W(6, −9) dengan k = 1/3.',st:[
    {t:'V’ = ?',o:['(12, −9)','(7, 0)','(12, 9)'],b:'(12, −9)',p:'3 × 4 dan 3 × (−3).'},
    {t:'W’ = ?',o:['(2, −3)','(18, −27)','(3, 6)'],b:'(2, −3)',p:'6 : 3 dan −9 : 3.'}]},
  {say:'S(4, 6) menjadi S’(10, 15) dan Y(5, 8) menjadi Y’(15, 24).',st:[
    {t:'Faktor skala S?',o:['2,5','6','1,5'],b:'2,5',p:'10 : 4.'},
    {t:'Faktor skala Y?',o:['3','10','19'],b:'3',p:'15 : 5.'}]},
  {say:'F(2, 3) dengan k = −2 dan M(2, −8) dengan k = −3.',st:[
    {t:'F’ = ?',o:['(−4, −6)','(4, 6)','(−4, 6)'],b:'(−4, −6)',p:'Berpindah ke sisi berlawanan pusat.'},
    {t:'M’ = ?',o:['(−6, 24)','(6, −24)','(−6, −24)'],b:'(−6, 24)',p:'−3 × 2 dan −3 × (−8).'}]},
  {say:'R(8, −12) dengan k = 1/4 dan radar (8, −6) dengan k = 0,25.',st:[
    {t:'R’ = ?',o:['(2, −3)','(32, −48)','(4, −8)'],b:'(2, −3)',p:'Dibagi 4.'},
    {t:'Posisi pada radar ringkas (8, −6) × 0,25 = ?',o:['(2, −1,5)','(2, −6)','(32, −24)'],b:'(2, −1,5)',p:'Faktor skala kecil memperkecil jarak.'}]},
  {say:'Denah (3, 2) diperbesar 4 kali; foto (1,5; 2) dengan k = 5; poster (2; 1,5) dengan k = 6.',st:[
    {t:'Denah?',o:['(12, 8)','(7, 6)','(3, 8)'],b:'(12, 8)',p:'4 × (3, 2).'},
    {t:'Foto?',o:['(7,5; 10)','(6,5; 7)','(1,5; 10)'],b:'(7,5; 10)',p:'5 × (1,5; 2).'},
    {t:'Poster?',o:['(12, 9)','(8, 7,5)','(2, 9)'],b:'(12, 9)',p:'6 × (2; 1,5).'}]},
  {say:'Sifat dilatasi.',st:[
    {t:'Dilatasi selalu mengubah ukuran. Tepatkah?',o:['Salah; k = 1 menghasilkan bayangan sama persis','Benar'],b:'Salah; k = 1 menghasilkan bayangan sama persis',p:'Faktor skala 1.'},
    {t:'Dilatasi dengan k = 0,5 menghasilkan bangun...',o:['lebih kecil tetapi tetap sebangun','kongruen dengan aslinya'],b:'lebih kecil tetapi tetap sebangun',p:'Bentuk sama, ukuran berbeda.'},
    {t:'Translasi, refleksi, rotasi mempertahankan jarak; dilatasi...',o:['mengubah jarak sesuai k','juga mempertahankan jarak'],b:'mengubah jarak sesuai k',p:'Jarak dikali |k|.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Dilatasi (perkalian).';setKata(d.say);
  clear($('s5alat'));barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Faktor skala besar memperbesar; antara 0 dan 1 memperkecil; negatif ke sisi seberang.');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Translasi, refleksi, dan rotasi mempertahankan bentuk dan ukuran.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-16'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.kartesius({r:5,titik:[{x:3,y:1,w:'biru',l:'P'},{x:-1,y:3,w:'merah',l:'P'}],garis:[[0,0,3,1,'hijau']]}));
})();


/* ---- bonus: mesin transformasi ---- */
var bJ=1;
function mulaiBonus(){
  $('bA').value='3';$('bB').value='2';bJ=1;
  var w=$('bOp');clear(w);
  [[1,'Geser (3, −1)'],[2,'Cermin sumbu-x'],[3,'Putar 90°'],[4,'Dilatasi ×2']].forEach(function(o){var b=tombol(w,o[1],function(){bJ=o[0];gambarBonus()});b.setAttribute('data-o',String(o[0]))});
  gambarBonus();
}
function gambarBonus(){
  var x=+$('bA').value,y=+$('bB').value,p=[x,y],q,bt=$('bOp').children,g=[];
  for(var i=0;i<bt.length;i++)bt[i].classList.toggle('pilih',bt[i].getAttribute('data-o')===String(bJ));
  if(bJ===1)q=[x+3,y-1];else if(bJ===2)q=[x,-y];else if(bJ===3)q=[-y,x];else q=[2*x,2*y];
  if(bJ===2)g.push([-8,0,8,0,'hijau']);
  $('bNA').textContent='Titik P('+x+', '+y+')';
  gambarDi('bGambar',{k:'kartesius',r:8,titik:[{x:x,y:y,w:'biru',l:'P'},{x:q[0],y:q[1],w:'merah',l:'P’'}],garis:g});
  barisTeks('bTanda',[pk(p)+' → '+pk(q)]);
  msg('bmsg','good',bJ===1?'Translasi: ditambah vektor.':bJ===2?'Refleksi sumbu-x: y berubah tanda.':bJ===3?'Rotasi 90° berlawanan: (−y, x).':'Dilatasi: dikali 2.');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D16 = rakit(DASAR, { kode: 'D-16', data: DATA_D16 })
