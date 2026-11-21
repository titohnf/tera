import { rakit } from './bersama'
import { DATA_D12 } from './latihan/d12'

/**
 * Materi interaktif D-12 "Teorema Pythagoras" (hipotenusa dan kaki, c^2 =
 * a^2 + b^2, triple Pythagoras dan kelipatannya, mencari kaki, bentuk akar
 * paling sederhana, jenis segitiga dari tiga sisi, soal cerita). Satu halaman
 * HTML mandiri, ditampilkan lewat iframe sandbox di `/mandiri/materi` dan
 * sebagai langkah Belajar di topik Misi D-12.
 *
 * Lima stasiun praktik: 1) geser kaki dan lihat luas persegi pada ketiga sisi
 * (renderer `pyth` di gambar.ts), 2) istilah dan rumus (hipotenusa, kebalikan
 * Pythagoras), 3) menghitung sisi (akar sederhana), 4) jenis segitiga (sama,
 * lebih besar, lebih kecil), 5) cerita (tangga, TV, kabel, kapal). Bonus:
 * mesin Pythagoras. Lalu tiga stasiun mesin latihan, bahannya di
 * `latihan/d12.ts`. Jawaban akar diberikan lewat pilihan, isian hanya angka.
 *
 * Aturan: JANGAN memakai backtick atau "${" di dalam HTML (isinya
 * `String.raw`). Nama fungsi tidak boleh sama dengan pustaka gambar atau mesin.
 */

const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Teorema Pythagoras</title>
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
      <h1>Teorema Pythagoras</h1>
      <div class="panel" style="max-width:360px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo hitung sisi miring dengan persegi!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1 -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Geser kaki segitiga.</p>
    <div class="dots" id="s1dots"></div>
    <div class="panel"><div class="alat" id="s1alat"></div><div class="tanda" id="s1tampil"></div>
      <input type="range" id="s1geser" min="0" max="100" step="0.5" value="0" aria-label="Kaki a"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi pil3" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2 -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Istilah dan rumus.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="alat" id="s2alat"></div><div class="tanda" id="s2tampil"></div></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi pil3" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3 -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Menghitung sisi segitiga siku-siku.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="alat" id="s3alat"></div><div class="tanda" id="s3tampil"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4 -->
  <section class="screen" id="s4">
    <p class="say" id="s4say">Jenis segitiga dari tiga sisi.</p>
    <div class="dots" id="s4dots"></div>
    <div class="panel"><div class="alat" id="s4alat"></div><div class="tanda" id="s4tampil"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi pil3" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
  </section>

  <!-- 5 -->
  <section class="screen" id="s5">
    <p class="say" id="s5say">Pythagoras dalam keseharian.</p>
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
      <button class="big soft" id="keBonus">Coba Bonus: mesin Pythagoras</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: mesin Pythagoras.</p>
    <div class="panel"><div class="alat" id="bGambar"></div>
      <div class="baca" id="bNA"></div><input type="range" id="bA" min="1" max="12" step="1" value="3" aria-label="Kaki a"><div class="baca" id="bNB"></div><input type="range" id="bB" min="1" max="12" step="1" value="4" aria-label="Kaki b">
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
  if(id==='intro')setKata('Ayo belajar Teorema Pythagoras!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo belajar Teorema Pythagoras!');

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

/* ---- stasiun 1: geser kaki, lihat luas persegi ---- */
function lp(a,b){return a*a+b*b}
function aksiC(c2){var r=Math.round(Math.sqrt(c2));return r*r===c2?String(r):'√'+c2}
var R1=[
  {b:4,tg:3,t:'Satu kaki 4. Geser kaki lainnya sampai hipotenusa bilangan bulat.',st:[
    {t:'Luas persegi di hipotenusa = 9 + 16 = ?',o:['25','49','7'],b:'25',p:'c² = a² + b² = 25.'},
    {t:'Hipotenusa c = √25 = ?',o:['5','25','12,5'],b:'5',p:'Setelah c², ambil akarnya: c = 5.'},
    {t:'Siswa menulis "c = 25". Kesalahannya?',o:['Lupa mengambil akar kuadrat','Salah menjumlah'],b:'Lupa mengambil akar kuadrat',p:'25 adalah c², bukan c.'}]},
  {b:12,tg:5,t:'Satu kaki 12. Cari kaki lain agar hipotenusa bulat.',st:[
    {t:'25 + 144 = ?',o:['169','149','289'],b:'169',p:'c² = 169.'},
    {t:'c = √169 = ?',o:['13','17','84,5'],b:'13',p:'13 × 13 = 169.'},
    {t:'Triple 5-12-13 dikali 4 menjadi 20-48-52. Masih memenuhi Pythagoras?',o:['Ya; rasio sisi tidak berubah','Tidak'],b:'Ya; rasio sisi tidak berubah',p:'Kelipatan triple tetap triple.'}]},
  {b:8,tg:6,t:'Satu kaki 8. Cari kaki lain agar hipotenusa bulat.',st:[
    {t:'36 + 64 = ?',o:['100','28','90'],b:'100',p:'c = 10.'},
    {t:'Triple 3-4-5 dikali 2?',o:['6-8-10','5-6-7','4-5-6'],b:'6-8-10',p:'Kelipatan 3-4-5.'}]},
  {b:15,tg:8,t:'Satu kaki 15. Cari kaki lain agar hipotenusa bulat.',st:[
    {t:'64 + 225 = ?',o:['289','229','161'],b:'289',p:'c = 17.'},
    {t:'Triple 8-15-17 dikali 3?',o:['24-45-51','16-30-34','11-18-20'],b:'24-45-51',p:'Tiga kali tiap bilangan.'}]}
];
var r1=0,sdh1=false;
function mulaiS1(){r1=0;ronde1()}
function gambar1(v){var d=R1[r1];gambarDi('s1alat',{k:'pyth',a:v,b:d.b,luas:true});barisTeks('s1tampil',[v+'² + '+d.b+'² = '+lp(v,d.b)+',  c = '+(Number.isInteger(Math.sqrt(lp(v,d.b)))?Math.sqrt(lp(v,d.b)):'√'+lp(v,d.b))])}
function ronde1(){
  var d=R1[r1],sl=$('s1geser');titik('s1dots',R1.length,r1);sdh1=false;
  sl.min='1';sl.max='12';sl.step='1';sl.value='2';sl.disabled=false;
  $('s1say').textContent=d.t;setKata(d.t);
  gambar1(2);
  $('s1next').disabled=true;clear($('s1aksi'));$('s1tanya').textContent='';msg('s1msg','','Luas persegi di hipotenusa = jumlah luas persegi di kedua kaki.');
}
$('s1geser').oninput=function(){
  if(sdh1)return;var d=R1[r1],v=+$('s1geser').value;gambar1(v);
  if(v===d.tg){
    sdh1=true;$('s1geser').disabled=true;
    msg('s1msg','good',v+'² + '+d.b+'² = '+lp(v,d.b)+' = '+Math.sqrt(lp(v,d.b))+'². Hipotenusanya bilangan bulat!');
    later(function(){ruteSteps('s1aksi','s1tanya','s1msg',d.st,0,function(){$('s1next').disabled=false})},900);
  }else msg('s1msg','','Geser terus. (Kadang hipotenusanya tidak bulat.)');
};
$('s1next').onclick=function(){if(r1<R1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: istilah dan rumus ---- */
var R2=[
  {say:'Segitiga PQR siku-siku di Q.',g:{k:'pyth',a:3,b:4,polos:true,lab:{a:'PQ',b:'QR',c:'PR'}},st:[
    {t:'Hipotenusa (sisi miring) adalah...',o:['PR','PQ','QR'],b:'PR',p:'Sisi di depan sudut siku-siku.'},
    {t:'PQ dan QR disebut...',o:['kaki (sisi siku-siku)','hipotenusa'],b:'kaki (sisi siku-siku)',p:'Kedua sisi yang mengapit sudut siku-siku.'}]},
  {say:'Segitiga LMN siku-siku di M dan segitiga XYZ siku-siku di X.',st:[
    {t:'Hipotenusa LMN?',o:['LN','LM','MN'],b:'LN',p:'Di depan sudut M.'},
    {t:'Hipotenusa XYZ?',o:['YZ','XY','XZ'],b:'YZ',p:'Di depan sudut X.'}]},
  {say:'Teorema Pythagoras.',st:[
    {t:'Pada segitiga siku-siku berlaku...',o:['c² = a² + b²','c = a + b','c² = a² − b²'],b:'c² = a² + b²',p:'c adalah hipotenusa.'},
    {t:'Rumus berlaku untuk...',o:['segitiga siku-siku saja','semua segitiga'],b:'segitiga siku-siku saja',p:'Hanya siku-siku.'},
    {t:'Hipotenusa selalu sisi terpendek. Tepatkah?',o:['Salah; hipotenusa selalu yang terpanjang','Benar'],b:'Salah; hipotenusa selalu yang terpanjang',p:'Lawan sudut terbesar (90°).'}]},
  {say:'Mencari kaki jika hipotenusa diketahui.',st:[
    {t:'Rumus untuk a?',o:['a² = c² − b²','a² = c² + b²','a = c − b'],b:'a² = c² − b²',p:'Pindah ruas membalik operasi.'}]},
  {say:'Siswa mengerjakan kaki 6 dan 8, tetapi menaruh 8 sebagai hipotenusa.',st:[
    {t:'Kesalahannya?',o:['Salah menentukan hipotenusa','Salah menjumlah'],b:'Salah menentukan hipotenusa',p:'Hipotenusa 10, bukan 8.'}]},
  {say:'Pada sembarang segitiga, sisi terpanjang otomatis hipotenusa.',st:[
    {t:'Tepatkah?',o:['Salah; hipotenusa hanya pada segitiga siku-siku','Benar'],b:'Salah; hipotenusa hanya pada segitiga siku-siku',p:'Istilah hanya untuk segitiga siku-siku.'}]},
  {say:'Sisi 9, 40, dan 41 cm; 9² + 40² = 1.681 = 41².',st:[
    {t:'Segitiga ini...',o:['pasti siku-siku','tidak siku-siku'],b:'pasti siku-siku',p:'Kebalikan Pythagoras: jika a² + b² = c², segitiganya siku-siku.'}]}
];
var r2=0;
function mulaiS2(){r2=0;ronde2()}
function ronde2(){
  var d=R2[r2];titik('s2dots',R2.length,r2);
  $('s2say').textContent='Istilah dan rumus.';setKata(d.say);
  if(d.g)gambarDi('s2alat',d.g);else clear($('s2alat'));
  barisTeks('s2tampil',[d.say]);
  $('s2next').disabled=true;clear($('s2aksi'));msg('s2msg','','Hipotenusa: di depan sudut siku-siku, dan sisi terpanjang.');
  ruteSteps('s2aksi','s2tanya','s2msg',d.st,0,function(){$('s2next').disabled=false});
}
$('s2next').onclick=function(){if(r2<R2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: menghitung sisi ---- */
var R3=[
  {say:'Kaki 6 dan 8. Hipotenusa?',g:{k:'pyth',a:6,b:8,polos:true,lab:{c:'?'}},st:[{t:'c² = 36 + 64 = 100, c = ?',o:['10','14','100'],b:'10',p:'√100 = 10.'}]},
  {say:'Kaki 9 dan 12; kaki 7 dan 24.',st:[
    {t:'9 dan 12: hipotenusa?',o:['15','21','225'],b:'15',p:'81 + 144 = 225.'},
    {t:'7 dan 24: hipotenusa?',o:['25','31','625'],b:'25',p:'49 + 576 = 625.'}]},
  {say:'Hipotenusa 13, satu kaki 5.',g:{k:'pyth',a:5,b:12,polos:true,lab:{a:'5',b:'?',c:'13'}},st:[
    {t:'Kaki lain: b² = 169 − 25 = 144, b = ?',o:['12','18','144'],b:'12',p:'√144 = 12.'}]},
  {say:'Hipotenusa 17, satu kaki 8; hipotenusa 26, satu kaki 10.',st:[
    {t:'17 dan 8: kaki lain?',o:['15','9','25'],b:'15',p:'289 − 64 = 225.'},
    {t:'26 dan 10: kaki lain?',o:['24','16','36'],b:'24',p:'676 − 100 = 576.'}]},
  {say:'Kaki 2 dan 4. Jawaban dalam akar paling sederhana.',st:[
    {t:'c² = 4 + 16 = 20. c = ?',o:['2√5','√20','4√5'],b:'2√5',p:'√20 = √4 × √5 = 2√5.'},
    {t:'Siswa menyederhanakan √20 menjadi 2√10. Kesalahannya?',o:['Memilih faktor kuadrat sempurna yang salah; 20 = 4 × 5','Tidak ada kesalahan'],b:'Memilih faktor kuadrat sempurna yang salah; 20 = 4 × 5',p:'√20 = 2√5.'}]},
  {say:'Kaki 3 dan 3 (sama panjang) dan kaki 5 dan 6.',st:[
    {t:'3 dan 3: hipotenusa?',o:['3√2','√6','6'],b:'3√2',p:'√18 = 3√2.'},
    {t:'5 dan 6: hipotenusa?',o:['√61','11','√11'],b:'√61',p:'25 + 36 = 61, sudah paling sederhana.'}]},
  {say:'Persegi bersisi 4 cm dan 6 cm; diagonalnya?',st:[
    {t:'Diagonal persegi bersisi s adalah...',o:['s√2','2s','s²'],b:'s√2',p:'4√2 dan 6√2.'},
    {t:'Persegi panjang 5 × 3: diagonal?',o:['√34','8','√8'],b:'√34',p:'25 + 9 = 34 = 2 × 17; tidak ada faktor kuadrat sempurna.'}]}
];
var r3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=R3[r3];titik('s3dots',R3.length,r3);
  $('s3say').textContent='Menghitung sisi segitiga siku-siku.';setKata(d.say);
  if(d.g)gambarDi('s3alat',d.g);else clear($('s3alat'));
  barisTeks('s3tampil',[d.say]);
  $('s3next').disabled=true;clear($('s3aksi'));msg('s3msg','','Hitung kuadratnya, lalu ambil akar.');
  ruteSteps('s3aksi','s3tanya','s3msg',d.st,0,function(){$('s3next').disabled=false});
}
$('s3next').onclick=function(){if(r3<R3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: jenis segitiga dari tiga sisi ---- */
var R4=[
  {say:'Sisi 9, 12, 15 (c = 15).',st:[
    {t:'a² + b² = 81 + 144 = 225 dan c² = 225. Jenisnya...',o:['siku-siku','lancip','tumpul'],b:'siku-siku',p:'a² + b² = c².'}]},
  {say:'Sisi 5, 6, 7 (c = 7).',st:[
    {t:'25 + 36 = 61 dan c² = 49. 61 > 49, jenisnya...',o:['lancip','siku-siku','tumpul'],b:'lancip',p:'a² + b² > c²: lancip.'}]},
  {say:'Sisi 4, 5, 6. Siswa: 16 + 25 = 41 > 36, jadi TUMPUL.',st:[
    {t:'Penilaian?',o:['Salah; a² + b² > c² berarti LANCIP','Benar'],b:'Salah; a² + b² > c² berarti LANCIP',p:'Tumpul bila a² + b² < c².'}]},
  {say:'Sisi 10, 15, 20.',st:[
    {t:'100 + 225 = 325 dan 20² = 400. Jenisnya...',o:['tumpul','siku-siku','lancip'],b:'tumpul',p:'a² + b² < c².'},
    {t:'Segitiga siku-siku?',o:['Tidak','Ya'],b:'Tidak',p:'325 ≠ 400.'}]},
  {say:'Sisi 33, 56, 65. Siswa: 33² + 56² = 4.225 = 65², jadi TUMPUL.',st:[
    {t:'Penilaian?',o:['Salah; sama berarti siku-siku','Benar'],b:'Salah; sama berarti siku-siku',p:'Tumpul butuh a² + b² < c².'}]},
  {say:'Sisi 3, 4, 6 dan sisi 6, 8, 10.',st:[
    {t:'3, 4, 6: 9 + 16 = 25 dan 36. Jenisnya...',o:['tumpul','lancip','siku-siku'],b:'tumpul',p:'25 < 36.'},
    {t:'6, 8, 10: jenisnya...',o:['siku-siku','lancip'],b:'siku-siku',p:'36 + 64 = 100.'}]}
];
var r4=0;
function mulaiS4(){r4=0;ronde4()}
function ronde4(){
  var d=R4[r4];titik('s4dots',R4.length,r4);
  $('s4say').textContent='Jenis segitiga dari tiga sisi.';setKata(d.say);
  clear($('s4alat'));barisTeks('s4tampil',[d.say]);
  $('s4next').disabled=true;clear($('s4aksi'));msg('s4msg','','Bandingkan a² + b² dengan c² (c = sisi terpanjang): sama, lebih besar, atau lebih kecil.');
  ruteSteps('s4aksi','s4tanya','s4msg',d.st,0,function(){$('s4next').disabled=false});
}
$('s4next').onclick=function(){if(r4<R4.length-1){r4++;ronde4()}else show('s5')};

/* ---- stasiun 5: cerita ---- */
var R5=[
  {say:'Tangga 10 m, kaki tangga 6 m dari tembok.',g:{k:'pyth',a:8,b:6,polos:true,lab:{a:'?',b:'6 m',c:'10 m'}},st:[
    {t:'Tinggi = √(100 − 36) = ?',o:['8 m','16 m','√136 m'],b:'8 m',p:'√64.'}]},
  {say:'Tangga 52 m, kaki tangga 20 m dari tembok.',st:[
    {t:'Tinggi = √(2.704 − 400) = ?',o:['48 m','32 m','2.304 m'],b:'48 m',p:'√2.304 = 48.'}]},
  {say:'Layar TV lebar 18 inci dan tinggi 24 inci.',g:{k:'pyth',a:18,b:24,polos:true,lab:{a:'18',b:'24',c:'?'}},st:[
    {t:'Diagonal = √(324 + 576) = √900 = ?',o:['30 inci','42 inci','900 inci'],b:'30 inci',p:'30.'}]},
  {say:'Tiang setinggi 15 m ditambatkan dengan kabel ke titik 20 m dari kaki tiang.',st:[
    {t:'Panjang kabel = √(225 + 400) = ?',o:['25 m','35 m','√175 m'],b:'25 m',p:'√625 = 25.'}]},
  {say:'Taman persegi panjang 12 m × 9 m; jalan setapak diagonal.',st:[
    {t:'Panjang jalan = √(144 + 81) = ?',o:['15 m','21 m','√63 m'],b:'15 m',p:'√225.'}]},
  {say:'Kapal berlayar 5 km ke utara lalu 7 km ke timur.',st:[
    {t:'Jarak lurus dari titik awal?',o:['√74 km','12 km','√12 km'],b:'√74 km',p:'25 + 49 = 74; sudah paling sederhana.'}]},
  {say:'Perahu berlayar 5 km ke barat lalu 12 km ke utara.',st:[
    {t:'Jarak lurus?',o:['13 km','17 km','√119 km'],b:'13 km',p:'25 + 144 = 169.'}]},
  {say:'Segitiga sama kaki: kaki 10 cm, alas 12 cm.',st:[
    {t:'Alas dibagi dua (6 cm) membentuk segitiga siku-siku. Tinggi = √(100 − 36) = ?',o:['8 cm','4 cm','√136 cm'],b:'8 cm',p:'Tinggi 8 cm.'}]},
  {say:'Tangga A 17 m (kaki 8 m dari tembok) dan Tangga B 25 m (kaki 7 m).',st:[
    {t:'Tinggi A dan B?',o:['15 m dan 24 m','8 m dan 7 m','25 m dan 17 m'],b:'15 m dan 24 m',p:'√(289−64) = 15 dan √(625−49) = 24.'},
    {t:'Yang mencapai tembok lebih tinggi?',o:['Tangga B','Tangga A'],b:'Tangga B',p:'24 > 15.'}]}
];
var r5=0;
function mulaiS5(){r5=0;ronde5()}
function ronde5(){
  var d=R5[r5];titik('s5dots',R5.length,r5);
  $('s5say').textContent='Pythagoras dalam keseharian.';setKata(d.say);
  if(d.g)gambarDi('s5alat',d.g);else clear($('s5alat'));
  barisTeks('s5tampil',[d.say]);
  $('s5next').disabled=true;clear($('s5aksi'));msg('s5msg','','Tentukan dulu mana hipotenusanya (biasanya yang miring).');
  ruteSteps('s5aksi','s5tanya','s5msg',d.st,0,function(){$('s5next').disabled=false});
}
$('s5next').onclick=function(){if(r5<R5.length-1){r5++;ronde5()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Luas persegi hipotenusa = jumlah luas persegi kedua kaki.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'D-12'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){
  var w=$('introGambar');w.style.flexDirection='column';w.style.alignItems='center';w.style.gap='8px';w.appendChild(GBR.pyth({a:3,b:4,luas:true}));
})();


/* ---- bonus: mesin Pythagoras ---- */
function mulaiBonus(){$('bA').value='3';$('bB').value='4';gambarBonus()}
function gambarBonus(){
  var a=+$('bA').value,b=+$('bB').value,c2=a*a+b*b,c=Math.sqrt(c2),bul=Math.round(c)*Math.round(c)===c2;
  $('bNA').textContent='Kaki a = '+a+', kaki b = '+b;
  gambarDi('bGambar',{k:'pyth',a:a,b:b,luas:true});
  barisTeks('bTanda',[a+'² + '+b+'² = '+(a*a)+' + '+(b*b)+' = '+c2,'c = '+(bul?Math.round(c):'√'+c2+' ≈ '+fm(c))]);
  msg('bmsg',bul?'good':'','Jika c² kuadrat sempurna, hipotenusa bilangan bulat (triple Pythagoras).');
}
$('bA').oninput=function(){gambarBonus()};
$('bB').oninput=function(){gambarBonus()};
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_D12 = rakit(DASAR, { kode: 'D-12', data: DATA_D12 })
