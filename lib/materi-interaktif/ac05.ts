/**
 * Materi interaktif AC-05 "Bagi Adil" (Pecahan setengah dan seperempat,
 * konkret). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-05. Disimpan
 * sebagai string supaya ikut terbundel di build tanpa membaca berkas saat
 * runtime.
 *
 * Rancangan sama dengan AC-01 sampai AC-04 (anak kelas 1-2, hampir tidak
 * membaca): SATU stasiun per layar, instruksi pendek, sentuh langsung, suara
 * bacaan sebagai tambahan (speechSynthesis, hanya tampil bila ada suara bahasa
 * Indonesia), dan akhir berupa bintang, bukan skor ujian. Semua gambar digambar
 * dengan SVG lewat skrip.
 *
 * Stasiun: 1) pilih belahan yang SAMA BESAR (inti pecahan: bagian harus sama),
 * 2) warnai satu dari dua bagian = setengah, 3) warnai bagian dari empat
 * (1/4, 2/4 yang sama dengan 1/2, 3/4), 4) tantangan 4 soal. Bonus: belah
 * bentuk pilihan sendiri. Pecahan ditulis bertumpuk (pembilang, garis,
 * penyebut) lewat elemen `.frak`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-05 di Misi.
 */
export const HTML_AC05 = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bagi Adil</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#fbf6ea; --card:#ffffff; --ink:#2b2a33; --muted:#6b6878;
  --ikat:#d94f3d; --lidi:#e0a93b; --lidi-dark:#b97f12; --ok:#2e9a63; --bad:#d23b4e; --line:#eadfc4; --soft:#fff3d0;
  --display:'Baloo 2','Trebuchet MS',system-ui,sans-serif; --body:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;
}
@media (prefers-color-scheme: dark){
  :root{--bg:#1f1c17;--card:#2a2620;--ink:#f6efe0;--muted:#b9b09b;--line:#4a4231;--soft:#3a3220;--ok:#5cc990;--bad:#ff7a8a;--lidi:#e7b34a;--ikat:#ef6b59}
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-weight:600;font-size:20px;line-height:1.4;-webkit-tap-highlight-color:transparent}
.app{max-width:560px;margin:0 auto;min-height:100%;display:flex;flex-direction:column;padding:12px 16px 20px;gap:12px}
h1,h2{font-family:var(--display);margin:0;line-height:1.1;text-wrap:balance}
h1{font-size:clamp(2.6rem,12vw,3.6rem);font-weight:800}
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
button.big{font:inherit;font-family:var(--display);font-weight:800;font-size:1.35rem;min-height:60px;border-radius:18px;border:2px solid var(--ink);background:var(--card);color:var(--ink);box-shadow:0 4px 0 var(--ink);cursor:pointer;padding:10px 18px}
button.big:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink)}
button.big.main{background:var(--ikat);color:#fff}
button.big.soft{box-shadow:none;border-color:var(--line);font-size:1.1rem;min-height:52px}
button.big:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
@keyframes denyut{50%{box-shadow:0 0 0 5px rgba(217,79,61,.45)}}
@keyframes goyang{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.row{display:flex;gap:10px;flex-wrap:wrap}
.center{text-align:center}
svg{color:var(--ink);display:block}
/* pecahan bertumpuk */
.frak{display:inline-flex;flex-direction:column;align-items:center;line-height:1;font-family:var(--display);font-weight:800;vertical-align:middle}
.frak i{display:block;width:1.25em;height:.09em;min-height:3px;background:currentColor;margin:.12em 0;border-radius:2px}
.frak.besar{font-size:3rem}
.frak.sedang{font-size:1.8rem}
/* stasiun 1: pilih belahan adil */
.tiga{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.pot{aspect-ratio:1;width:100%;border:2px solid var(--line);background:var(--card);border-radius:18px;padding:6px;cursor:pointer;touch-action:manipulation}
.pot svg{width:100%;height:100%}
.pot.right{border-color:var(--ok);background:var(--soft)}
.pot.bad{border-color:var(--bad);animation:goyang .4s}
.pot.hint{animation:denyut 1s infinite}
/* stasiun 2-3 dan bonus: bagian yang bisa diwarnai */
.kanvas{max-width:260px;margin:0 auto;width:100%}
.kanvas svg{width:100%;height:auto}
.bag{cursor:pointer}
.bag:focus-visible{outline:3px solid var(--ikat);outline-offset:2px}
.tampil{display:flex;align-items:center;justify-content:center;gap:16px;min-height:72px}
/* tantangan */
.q{font-family:var(--display);font-size:1.5rem;font-weight:800}
.opts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.opt{font:inherit;font-family:var(--display);font-weight:800;font-size:1.5rem;min-height:84px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:6px;display:flex;align-items:center;justify-content:center}
.opt svg{width:100%;max-width:90px;height:auto}
.opt.right{background:var(--ok);border-color:var(--ok);color:#fff}
.opt.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
.vis{display:flex;justify-content:center}
.vis svg{width:150px;height:150px}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
/* bonus */
.chip{font:inherit;font-weight:800;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:99px;padding:8px 14px;cursor:pointer;min-height:44px}
.chip.on{border-color:var(--ikat);background:var(--soft)}
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
      <h1>Bagi Adil</h1>
      <div class="kanvas" id="introGambar" style="max-width:150px"></div>
      <p class="say">Ayo bagi kue sama besar!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: pilih belahan yang adil -->
  <section class="screen" id="s1">
    <p class="say">Pilih yang dibagi sama besar.</p>
    <div class="dots" id="s1dots"></div>
    <div class="tiga" id="s1grid"></div>
    <div class="msg" id="s1msg">Ketuk satu gambar.</div>
    <div class="cta">
      <button class="big main" id="s1next" disabled>Lanjut</button>
      <button class="big soft" id="s1ulang">Mulai lagi</button>
    </div>
  </section>

  <!-- 2: setengah -->
  <section class="screen" id="s2">
    <p class="say" id="s2say">Warnai setengah.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="kanvas" id="s2k"></div></div>
    <div class="tampil" id="s2t"></div>
    <div class="msg" id="s2msg">Ketuk satu bagian.</div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: seperempat -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Warnai 1 bagian.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div class="kanvas" id="s3k"></div></div>
    <div class="tampil" id="s3t"></div>
    <div class="msg" id="s3msg">Ketuk bagian untuk mewarnai.</div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: tantangan -->
  <section class="screen" id="s4">
    <div class="sub" id="s4n"></div>
    <div class="vis" id="s4v"></div>
    <p class="q" id="s4q"></p>
    <div class="opts" id="s4o"></div>
    <div class="msg" id="s4fb" style="display:none"></div>
    <div class="cta"><button class="big main" id="s4next" style="display:none">Lanjut</button></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: belah rotimu</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: belah rotimu sendiri.</p>
    <div class="row" id="bBentuk" style="justify-content:center"></div>
    <div class="row" id="bBagi" style="justify-content:center"></div>
    <div class="panel"><div class="kanvas" id="bk"></div></div>
    <div class="tampil" id="bt"></div>
    <div class="msg" id="bmsg">Ketuk bagian untuk mewarnai.</div>
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

/* pecahan bertumpuk: pembilang, garis, penyebut */
function fr(a,b,ukuran){
  var s=el('span','frak'+(ukuran?' '+ukuran:''));
  s.appendChild(el('b',null,String(a)));s.appendChild(el('i'));s.appendChild(el('b',null,String(b)));
  return s;
}

/* ---- gambar SVG ---- */
var NS='http://www.w3.org/2000/svg';
function sh(tag,attrs){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);return e}
var ROTI='#f4d79a',WARNA='#d94f3d';
var GARIS={stroke:'currentColor','stroke-width':3,'stroke-linejoin':'round'};
function gaya(e,a){for(var k in a)e.setAttribute(k,a[k]);return e}
function kotak(kind){
  if(kind==='persegi')return {x:14,y:14,w:72,h:72};
  return {x:5,y:22,w:90,h:56};
}
/* bentuk utuh dengan satu garis potong; pos = letak garis (0..1) */
function potong(kind,orient,pos){
  var s=sh('svg',{viewBox:'0 0 100 100','aria-hidden':'true'}),x1,y1,x2,y2;
  if(kind==='lingkaran'){
    s.appendChild(gaya(sh('circle',{cx:50,cy:50,r:40,fill:ROTI}),GARIS));
    var c=10+80*pos,dy=Math.sqrt(1600-(c-50)*(c-50));
    if(orient==='v'){x1=c;x2=c;y1=50-dy;y2=50+dy}else{y1=c;y2=c;x1=50-dy;x2=50+dy}
  }else{
    var b=kotak(kind);
    s.appendChild(gaya(sh('rect',{x:b.x,y:b.y,width:b.w,height:b.h,rx:3,fill:ROTI}),GARIS));
    if(orient==='v'){x1=b.x+b.w*pos;x2=x1;y1=b.y;y2=b.y+b.h}else{y1=b.y+b.h*pos;y2=y1;x1=b.x;x2=b.x+b.w}
  }
  s.appendChild(sh('line',{x1:x1,y1:y1,x2:x2,y2:y2,stroke:WARNA,'stroke-width':4,'stroke-linecap':'round','stroke-dasharray':'6 5'}));
  return s;
}
/* daftar bagian untuk n=2 (orient v/h) atau n=4 (empat penjuru) */
function daftarBagian(kind,n,orient){
  var L=[],i;
  if(kind==='lingkaran'){
    if(n===2){
      if(orient==='v'){L.push(['path',{d:'M50 10 A40 40 0 0 0 50 90 Z'}]);L.push(['path',{d:'M50 10 A40 40 0 0 1 50 90 Z'}])}
      else{L.push(['path',{d:'M10 50 A40 40 0 0 1 90 50 Z'}]);L.push(['path',{d:'M10 50 A40 40 0 0 0 90 50 Z'}])}
    }else{
      L.push(['path',{d:'M50 50 L10 50 A40 40 0 0 1 50 10 Z'}]);
      L.push(['path',{d:'M50 50 L50 10 A40 40 0 0 1 90 50 Z'}]);
      L.push(['path',{d:'M50 50 L90 50 A40 40 0 0 1 50 90 Z'}]);
      L.push(['path',{d:'M50 50 L50 90 A40 40 0 0 1 10 50 Z'}]);
    }
  }else{
    var b=kotak(kind),w=b.w/2,h=b.h/2;
    if(n===2){
      if(orient==='v'){L.push(['rect',{x:b.x,y:b.y,width:w,height:b.h}]);L.push(['rect',{x:b.x+w,y:b.y,width:w,height:b.h}])}
      else{L.push(['rect',{x:b.x,y:b.y,width:b.w,height:h}]);L.push(['rect',{x:b.x,y:b.y+h,width:b.w,height:h}])}
    }else{
      for(i=0;i<4;i++)L.push(['rect',{x:b.x+(i%2)*w,y:b.y+Math.floor(i/2)*h,width:w,height:h}]);
    }
  }
  return L;
}
/* bentuk terbelah; bagian di "warna" ikut diwarnai; tap(i) membuat bagian bisa diketuk */
function bagi(kind,n,orient,warna,tap){
  var s=sh('svg',{viewBox:'0 0 100 100','aria-hidden':tap?'false':'true'}),bag=[];
  daftarBagian(kind,n,orient).forEach(function(d,i){
    var e=gaya(sh(d[0],d[1]),GARIS);
    e.setAttribute('fill',warna&&warna.indexOf(i)>=0?WARNA:ROTI);
    if(tap){
      e.setAttribute('class','bag');e.setAttribute('tabindex','0');e.setAttribute('role','button');e.setAttribute('aria-label','bagian '+(i+1));
      e.onclick=function(){tap(i)};
      e.onkeydown=function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();tap(i)}};
    }
    s.appendChild(e);bag.push(e);
  });
  return {svg:s,bag:bag};
}
function warnai(b,i,on){b.bag[i].setAttribute('fill',on?WARNA:ROTI)}

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
var urut=['intro','s1','s2','s3','s4','akhir'];
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
  if(id==='s2')stasiun2.mulai();
  if(id==='s3')stasiun3.mulai();
  if(id==='s4')mulaiS4();
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')mulaiBonus();
  if(id==='intro')setKata('Ayo bagi kue sama besar!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
$('introGambar').appendChild(bagi('lingkaran',4,'v',[1],null).svg);
setKata('Ayo bagi kue sama besar!');

/* ---- stasiun 1: pilih belahan yang sama besar ---- */
var BENTUK=['lingkaran','persegi panjang','persegi'];
function opsiPotong(kind){
  var tak=shuffle([0.25,0.3,0.7,0.75]).slice(0,2),o=[];
  o.push({id:'ok',svg:potong(kind,rnd(0,1)?'v':'h',0.5)});
  tak.forEach(function(p,i){o.push({id:'x'+i,svg:potong(kind,rnd(0,1)?'v':'h',p)})});
  return shuffle(o);
}
var r1=0,selesai1=false;
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  selesai1=false;titik('s1dots',BENTUK.length,r1);
  var g=$('s1grid');clear(g);
  opsiPotong(BENTUK[r1]).forEach(function(o){
    var b=el('button','pot'+(r1===0&&o.id==='ok'?' hint':''));
    b.setAttribute('aria-label','pilihan');b.appendChild(o.svg);
    b.onclick=function(){
      if(selesai1)return;
      if(o.id==='ok'){
        selesai1=true;b.classList.remove('hint');b.classList.add('right');
        $('s1msg').className='msg good';$('s1msg').textContent='Betul! Dua bagian sama besar.';
        $('s1next').disabled=false;setKata('Betul! Dua bagian sama besar.');
      }else{
        b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');
        $('s1msg').className='msg warn';$('s1msg').textContent='Yang ini ada bagian lebih besar. Cari yang adil.';
        setKata('Yang ini ada bagian lebih besar. Cari yang adil.');
      }
    };
    g.appendChild(b);
  });
  $('s1next').disabled=true;$('s1msg').className='msg';
  $('s1msg').textContent=r1===0?'Ketuk yang berdenyut.':'Ketuk satu gambar.';
  setKata('Pilih yang dibagi sama besar.');
}
$('s1ulang').onclick=function(){ronde1()};
$('s1next').onclick=function(){if(r1<BENTUK.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2 dan 3: warnai bagian ---- */
function stasiunWarna(p,n,daftar,instruksi,pesan,kataPesan,lanjut){
  var r=0,b=null,pilih=[],target=0;
  function mulai(){r=0;ronde()}
  function ronde(){
    var d=daftar[r];target=d.target;pilih=[];
    titik(p+'dots',daftar.length,r);
    $(p+'say').textContent=instruksi(target);
    var host=$(p+'k');clear(host);
    b=bagi(d.kind,n,d.orient,null,function(i){
      var k=pilih.indexOf(i);
      if(k>=0)pilih.splice(k,1);else pilih.push(i);
      warnai(b,i,k<0);
      perbarui();
    });
    host.appendChild(b.svg);
    $(p+'next').disabled=true;
    $(p+'msg').className='msg';$(p+'msg').textContent=instruksi(target);
    tampil();
    setKata(instruksi(target));
  }
  function tampil(){
    var t=$(p+'t');clear(t);t.appendChild(fr(pilih.length,n,'besar'));
  }
  function perbarui(){
    tampil();
    var k=pilih.length,m=$(p+'msg');
    if(k===target){
      m.className='msg good';m.textContent=pesan(k);setKata(kataPesan(k));
      $(p+'next').disabled=false;
    }else{
      $(p+'next').disabled=true;m.className='msg warn';
      m.textContent=k>target?'Terlalu banyak. '+instruksi(target):instruksi(target);
      setKata(m.textContent);
    }
  }
  $(p+'next').onclick=function(){if(r<daftar.length-1){r++;ronde()}else show(lanjut)};
  return {mulai:mulai};
}
var stasiun2=stasiunWarna('s2',2,
  [{kind:'lingkaran',orient:'v',target:1},{kind:'persegi panjang',orient:'h',target:1},{kind:'persegi',orient:'v',target:1}],
  function(){return 'Warnai setengah.'},
  function(){return '1 dari 2 bagian sama besar. Itu setengah!'},
  function(){return 'Satu dari dua bagian sama besar. Itu setengah.'},
  's3');
var stasiun3=stasiunWarna('s3',4,
  [{kind:'lingkaran',orient:'v',target:1},{kind:'persegi',orient:'v',target:2},{kind:'persegi panjang',orient:'v',target:3}],
  function(t){return 'Warnai '+t+' bagian.'},
  function(k){return k===1?'1 dari 4 bagian. Itu seperempat!':k===2?'2 dari 4 bagian sama besar dengan setengah!':'3 dari 4 bagian. Itu tiga perempat!'},
  function(k){return k===1?'Satu dari empat bagian. Itu seperempat.':k===2?'Dua dari empat bagian sama besar dengan setengah.':'Tiga dari empat bagian. Itu tiga perempat.'},
  's4');

/* ---- tantangan: 4 soal, balasan langsung ---- */
function opsiPecahan(){return [{id:'1/2',fr:[1,2]},{id:'1/4',fr:[1,4]},{id:'3/4',fr:[3,4]}]}
function bangunSoal(){
  var s=[],k=BENTUK[rnd(0,2)];
  s.push({q:'Mana yang dibagi sama besar?',opsi:opsiPotong(k).map(function(o){return {id:o.id,svg:o.svg}}),a:'ok',e:'Bagian-bagiannya sama besar.'});
  (function(){var kind=BENTUK[rnd(0,2)],o=rnd(0,1)?'v':'h',w=rnd(0,1);
    s.push({vis:function(){return bagi(kind,2,o,[w],null).svg},q:'Berapa bagian yang diwarnai?',opsi:opsiPecahan(),a:'1/2',e:'1 dari 2 bagian. Itu setengah.'})})();
  (function(){var kind=BENTUK[rnd(0,2)],w=rnd(0,3);
    s.push({vis:function(){return bagi(kind,4,'v',[w],null).svg},q:'Berapa bagian yang diwarnai?',opsi:opsiPecahan(),a:'1/4',e:'1 dari 4 bagian. Itu seperempat.'})})();
  (function(){var kind=BENTUK[rnd(0,2)],w=shuffle([0,1,2,3]).slice(0,2);
    s.push({vis:function(){return bagi(kind,4,'v',w,null).svg},q:'2 dari 4 bagian diwarnai. Sama dengan?',opsi:opsiPecahan(),a:'1/2',e:'2 dari 4 bagian sama besar dengan setengah.'})})();
  return s;
}
var soal=[],qi=0,benar=0,terkunci=false;
function mulaiS4(){soal=bangunSoal();qi=0;benar=0;tampilSoal()}
function tampilSoal(){
  terkunci=false;
  var q=soal[qi];
  $('s4n').textContent='Tantangan '+(qi+1)+' dari '+soal.length;
  $('s4q').textContent=q.q;
  var v=$('s4v');clear(v);if(q.vis)v.appendChild(q.vis());
  var o=$('s4o');clear(o);
  shuffle(q.opsi).forEach(function(x){
    var bt=el('button','opt');bt.setAttribute('data-id',x.id);
    if(x.svg){bt.appendChild(x.svg);bt.setAttribute('aria-label','pilihan')}
    else bt.appendChild(fr(x.fr[0],x.fr[1],'sedang'));
    bt.onclick=function(){
      if(terkunci)return;terkunci=true;
      var ok=x.id===q.a;if(ok)benar++;
      var all=o.children;for(var k=0;k<all.length;k++){if(all[k].getAttribute('data-id')===q.a)all[k].classList.add('right');else if(all[k]===bt)all[k].classList.add('wrong')}
      var fb=$('s4fb');fb.style.display='flex';fb.className='msg '+(ok?'good':'warn');
      fb.textContent=(ok?'Benar! ':'Hampir! ')+q.e;
      setKata((ok?'Benar! ':'Hampir! ')+q.e);
      var nx=$('s4next');nx.style.display='';nx.textContent=qi===soal.length-1?'Selesai':'Lanjut';
    };
    o.appendChild(bt);
  });
  $('s4fb').style.display='none';$('s4next').style.display='none';
  setKata(q.q);
}
$('s4next').onclick=function(){if(qi<soal.length-1){qi++;tampilSoal()}else show('akhir')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu paham setengah dan seperempat.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-05'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};

/* ---- bonus: belah roti pilihan sendiri ---- */
var bKind='lingkaran',bN=2,bPilih=[],bB=null;
function mulaiBonus(){bKind='lingkaran';bN=2;chipBonus();gambarBonus()}
function chipBonus(){
  var a=$('bBentuk');clear(a);
  BENTUK.forEach(function(k){
    var c=el('button','chip'+(k===bKind?' on':''),k);c.onclick=function(){bKind=k;chipBonus();gambarBonus()};a.appendChild(c);
  });
  var b=$('bBagi');clear(b);
  [[2,'Bagi dua'],[4,'Bagi empat']].forEach(function(x){
    var c=el('button','chip'+(x[0]===bN?' on':''),x[1]);c.onclick=function(){bN=x[0];chipBonus();gambarBonus()};b.appendChild(c);
  });
}
function gambarBonus(){
  bPilih=[];
  var host=$('bk');clear(host);
  bB=bagi(bKind,bN,'v',null,function(i){
    var k=bPilih.indexOf(i);if(k>=0)bPilih.splice(k,1);else bPilih.push(i);
    warnai(bB,i,k<0);teksBonus();
  });
  host.appendChild(bB.svg);teksBonus();
  setKata('Belah rotimu sendiri. Ketuk bagian untuk mewarnai.');
}
function teksBonus(){
  var t=$('bt');clear(t);t.appendChild(fr(bPilih.length,bN,'besar'));
  var m=$('bmsg'),k=bPilih.length;
  if(k===0){m.className='msg';m.textContent='Ketuk bagian untuk mewarnai.'}
  else if(k===bN){m.className='msg good';m.textContent='Semua bagian diwarnai. Itu 1 utuh!'}
  else if(bN===4&&k===2){m.className='msg good';m.textContent='2 dari 4 sama besar dengan setengah!'}
  else{m.className='msg good';m.textContent=k+' dari '+bN+' bagian sama besar.'}
}
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`
