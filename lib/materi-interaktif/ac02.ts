/**
 * Materi interaktif AC-02 "Cari Bentuk" (Bangun datar dan bangun ruang dasar;
 * posisi benda). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox
 * di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-02.
 * Disimpan sebagai string supaya ikut terbundel di build tanpa membaca berkas
 * saat runtime.
 *
 * Rancangan sama dengan AC-01 (anak kelas 1-2, hampir tidak membaca): SATU
 * stasiun per layar, instruksi pendek, sentuh langsung, suara sebagai tambahan
 * (speechSynthesis, hanya tampil bila ada suara bahasa Indonesia), dan akhir
 * berupa bintang, bukan skor ujian. Semua gambar digambar dengan SVG lewat
 * skrip, tanpa berkas gambar.
 *
 * Stasiun: 1) ketuk semua bangun datar yang sama dengan target, 2) dorong benda
 * untuk melihat mana yang menggelinding, 3) taruh bola di atas/bawah/kiri/kanan
 * kotak, 4) tantangan 4 soal. Bonus: ketuk bagian rumah untuk melihat bentuknya.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-02 di Misi.
 */
export const HTML_AC02 = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cari Bentuk</title>
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
.say .k{color:var(--ikat)}
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
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.row{display:flex;gap:10px;flex-wrap:wrap}
.center{text-align:center}
svg{color:var(--ink);display:block}
/* stasiun 1: ubin bentuk */
.target{display:flex;align-items:center;gap:12px}
.target svg{width:64px;height:64px;flex:none}
.target b{font-family:var(--display);font-size:2rem;font-weight:800;line-height:1}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.tile{aspect-ratio:1;width:100%;border:2px solid var(--line);background:var(--card);border-radius:18px;padding:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;touch-action:manipulation}
.tile svg{width:100%;height:100%}
.tile.right{border-color:var(--ok);background:var(--soft)}
.tile.bad{border-color:var(--bad);animation:goyang .4s}
.tile.hint{animation:denyut 1s infinite}
/* stasiun 2: dorong benda */
.lintasan{height:104px;overflow:hidden;border-bottom:4px solid var(--line);display:flex;align-items:flex-end;padding-bottom:2px}
.obj{width:90px;height:90px;flex:none}
.obj svg{width:100%;height:100%}
.obj.roll{animation:gelinding 1.1s ease-out forwards}
.obj.geser{animation:geser 1.1s ease-out forwards}
.obj.diam{animation:goyang .45s}
@keyframes gelinding{to{transform:translateX(96px) rotate(450deg)}}
@keyframes geser{to{transform:translateX(96px)}}
.benda{display:flex;flex-direction:column;gap:8px;padding:10px}
.benda .nama{font-family:var(--display);font-weight:800;font-size:1.2rem;text-align:center}
.benda button.big{min-height:48px;font-size:1.1rem}
/* stasiun 3: adegan posisi */
.adegan{display:grid;grid-template-columns:repeat(3,76px);grid-auto-rows:76px;gap:6px;justify-content:center}
.zona{border:2px dashed var(--line);border-radius:16px;background:transparent;display:flex;align-items:center;justify-content:center;padding:6px;cursor:pointer;touch-action:manipulation}
.zona.stat{border-color:transparent;cursor:default}
.zona.hint{animation:denyut 1s infinite}
.kotak{display:flex;align-items:center;justify-content:center;padding:2px}
.zona svg,.kotak svg{width:100%;height:100%}
/* tantangan */
.q{font-family:var(--display);font-size:1.5rem;font-weight:800}
.opts{display:grid;gap:10px}
.opt{font:inherit;font-family:var(--display);font-weight:800;font-size:1.5rem;min-height:60px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.opt.right{background:var(--ok);border-color:var(--ok);color:#fff}
.opt.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
.vis{display:flex;justify-content:center}
.vis>svg{width:110px;height:110px}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
/* bonus: rumah */
.rumah{width:100%;max-width:420px;margin:0 auto}
.rumah svg{width:100%;height:auto}
.bagian{cursor:pointer}
.bagian:focus-visible{outline:3px solid var(--ikat);outline-offset:2px}
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
      <h1>Cari Bentuk</h1>
      <div id="introBentuk" style="display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap"></div>
      <p class="say">Ayo kenali bentuk di sekitarmu!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: cari bentuk -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Ketuk semua yang sama.</p>
    <div class="row" style="align-items:center;justify-content:space-between">
      <div class="target" id="s1target"></div>
      <div class="dots" id="s1dots"></div>
    </div>
    <div class="grid3" id="s1grid"></div>
    <div class="msg" id="s1msg">Ketuk bentuk yang sama.</div>
    <div class="cta">
      <button class="big main" id="s1next" disabled>Lanjut</button>
      <button class="big soft" id="s1ulang">Mulai lagi</button>
    </div>
  </section>

  <!-- 2: dorong benda -->
  <section class="screen" id="s2">
    <p class="say">Dorong bendanya. Mana yang menggelinding?</p>
    <div class="two" id="s2grid"></div>
    <div class="msg" id="s2msg">Ketuk Dorong.</div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: posisi -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Taruh bola di atas kotak.</p>
    <div class="dots" id="s3dots"></div>
    <div class="panel"><div id="s3adegan"></div></div>
    <div class="msg" id="s3msg">Ketuk tempat yang tepat.</div>
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
      <button class="big soft" id="keBonus">Coba Bonus: bentuk di rumah</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: bentuk apa saja di rumah ini?</p>
    <div class="rumah panel" id="bh"></div>
    <div class="msg" id="bmsg">Ketuk bagian rumah.</div>
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
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ---- gambar SVG ---- */
var NS='http://www.w3.org/2000/svg';
function sh(tag,attrs){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);return e}
function sv(px,vb){var s=sh('svg',{width:px,height:px,viewBox:vb||'0 0 100 100','aria-hidden':'true'});return s}
var WARNA=['#d94f3d','#e0a93b','#2e9a63','#4a7bd0','#c75ba0'];
var GARIS={stroke:'currentColor','stroke-width':3,'stroke-linejoin':'round'};
function gaya(e,a){for(var k in a)e.setAttribute(k,a[k]);return e}
function poly(g,pts,c,ov,op){
  g.appendChild(gaya(sh('polygon',{points:pts,fill:c}),GARIS));
  if(ov)g.appendChild(sh('polygon',{points:pts,fill:ov,'fill-opacity':op}));
}
/* bangun datar: lingkaran, persegi, persegi panjang, segitiga */
function datar(k,c,rot,px){
  var s=sv(px||100);
  var g=sh('g',{transform:'rotate('+(rot||0)+' 50 50)',fill:c});
  var b;
  if(k==='lingkaran')b=sh('circle',{cx:50,cy:50,r:40});
  else if(k==='persegi')b=sh('rect',{x:14,y:14,width:72,height:72,rx:3});
  else if(k==='persegi panjang')b=sh('rect',{x:5,y:26,width:90,height:48,rx:3});
  else b=sh('polygon',{points:'50,10 92,86 8,86'});
  g.appendChild(gaya(b,GARIS));s.appendChild(g);return s;
}
/* bangun ruang: bola, kubus, balok, tabung (direbahkan) */
function ruang(k,c,px){
  var s=sv(px||100),g=sh('g',{});
  if(k==='bola'){
    g.appendChild(gaya(sh('circle',{cx:50,cy:50,r:38,fill:c}),GARIS));
    g.appendChild(sh('ellipse',{cx:37,cy:35,rx:11,ry:7,fill:'#fff','fill-opacity':.45,transform:'rotate(-35 37 35)'}));
  }else if(k==='kubus'){
    poly(g,'20,38 70,38 70,88 20,88',c);
    poly(g,'20,38 40,18 90,18 70,38',c,'#fff',.4);
    poly(g,'70,38 90,18 90,68 70,88',c,'#000',.25);
  }else if(k==='balok'){
    poly(g,'8,42 72,42 72,82 8,82',c);
    poly(g,'8,42 28,24 92,24 72,42',c,'#fff',.4);
    poly(g,'72,42 92,24 92,64 72,82',c,'#000',.25);
  }else{
    g.appendChild(gaya(sh('ellipse',{cx:22,cy:50,rx:9,ry:24,fill:c}),GARIS));
    g.appendChild(sh('rect',{x:22,y:26,width:56,height:48,fill:c}));
    g.appendChild(gaya(sh('line',{x1:22,y1:26,x2:78,y2:26}),GARIS));
    g.appendChild(gaya(sh('line',{x1:22,y1:74,x2:78,y2:74}),GARIS));
    g.appendChild(gaya(sh('ellipse',{cx:78,cy:50,rx:9,ry:24,fill:c}),GARIS));
    g.appendChild(sh('ellipse',{cx:78,cy:50,rx:9,ry:24,fill:'#fff','fill-opacity':.4}));
  }
  s.appendChild(g);return s;
}

/* ---- suara (tambahan, hanya bila ada suara Indonesia) ---- */
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
  if(id==='s2')mulaiS2();
  if(id==='s3')mulaiS3();
  if(id==='s4')mulaiS4();
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')mulaiBonus();
  if(id==='intro')setKata('Ayo kenali bentuk di sekitarmu!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};

/* intro: empat bentuk */
(function(){
  var w=$('introBentuk');
  w.appendChild(datar('segitiga',WARNA[0],0,64));
  w.appendChild(datar('persegi',WARNA[1],0,64));
  w.appendChild(datar('lingkaran',WARNA[2],0,64));
  w.appendChild(datar('persegi panjang',WARNA[3],0,64));
})();
setKata('Ayo kenali bentuk di sekitarmu!');

/* ---- stasiun 1: ketuk semua bentuk yang sama ---- */
var KINDS=['segitiga','persegi','persegi panjang','lingkaran'];
var TARGET=['segitiga','persegi','lingkaran','persegi panjang'];
var ri=0,butuh=0,ketemu=0,selesai1=false;
function mulaiS1(){ri=0;mulaiRonde()}
function mulaiRonde(){
  var t=TARGET[ri];
  butuh=rnd(2,3);ketemu=0;selesai1=false;
  var ubin=[],i;
  for(i=0;i<butuh;i++)ubin.push({k:t,c:WARNA[rnd(0,4)],r:rnd(-10,10),ok:true});
  var lain=shuffle(KINDS.filter(function(x){return x!==t}));
  for(i=butuh;i<6;i++)ubin.push({k:lain[(i-butuh)%lain.length],c:WARNA[rnd(0,4)],r:rnd(-10,10),ok:false});
  ubin=shuffle(ubin);
  var tg=$('s1target');clear(tg);tg.appendChild(datar(t,'#bbb',0,64));tg.appendChild(el('b',null,cap(t)));
  var d=$('s1dots');clear(d);for(var j=0;j<TARGET.length;j++)d.appendChild(el('i',j<=ri?'on':''));
  var say=$('s1say');say.textContent='Ketuk semua '+t+'.';
  var g=$('s1grid');clear(g);
  var pertama=true;
  ubin.forEach(function(u){
    var b=el('button','tile'+(ri===0&&u.ok&&pertama?' hint':''));
    if(u.ok)pertama=false;
    b.setAttribute('aria-label',u.k);
    b.appendChild(datar(u.k,u.c,u.r));
    b.onclick=function(){
      if(selesai1||b.classList.contains('right'))return;
      if(u.ok){
        b.classList.remove('hint');b.classList.add('right');ketemu++;
        var m=$('s1msg');
        if(ketemu===butuh){
          selesai1=true;m.className='msg good';m.textContent='Hebat! Semua '+t+' ketemu.';
          $('s1next').disabled=false;setKata('Hebat! Semua '+t+' ketemu.');
        }else{
          m.className='msg good';m.textContent='Betul! Masih ada '+(butuh-ketemu)+' lagi.';
        }
      }else{
        b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');
        later(function(){b.classList.remove('bad')},600);
        var m2=$('s1msg');m2.className='msg warn';m2.textContent='Itu '+u.k+'. Cari '+t+'.';
        setKata('Itu '+u.k+'. Cari '+t+'.');
      }
    };
    g.appendChild(b);
  });
  $('s1next').disabled=true;
  $('s1msg').className='msg';
  $('s1msg').textContent=ri===0?'Ketuk yang berdenyut.':'Ketuk bentuk yang sama.';
  setKata('Ketuk semua '+t+'.');
}
$('s1ulang').onclick=function(){mulaiRonde()};
$('s1next').onclick=function(){
  if(ri<TARGET.length-1){ri++;mulaiRonde()}else show('s2');
};

/* ---- stasiun 2: dorong benda ---- */
var BENDA=[
  {n:'Bola',k:'bola',roll:true,c:'#d94f3d'},
  {n:'Kubus',k:'kubus',roll:false,c:'#4a7bd0'},
  {n:'Tabung',k:'tabung',roll:true,c:'#2e9a63'},
  {n:'Balok',k:'balok',roll:false,c:'#e0a93b'}
];
var didorong={};
function mulaiS2(){
  didorong={};
  var g=$('s2grid');clear(g);
  BENDA.forEach(function(b){
    var card=el('div','panel benda');
    var lin=el('div','lintasan'),o=el('div','obj');
    o.appendChild(ruang(b.k,b.c));lin.appendChild(o);card.appendChild(lin);
    card.appendChild(el('div','nama',b.n));
    var bt=el('button','big soft','Dorong');
    bt.onclick=function(){
      o.classList.remove('roll','geser','diam');void o.offsetWidth;
      o.classList.add(b.roll?(b.k==='bola'?'roll':'geser'):'diam');
      var m=$('s2msg');
      if(b.roll){m.className='msg good';m.textContent=b.n+' menggelinding! Badannya bulat.';setKata(b.n+' menggelinding. Badannya bulat.')}
      else{m.className='msg warn';m.textContent=b.n+' diam. Sisinya datar.';setKata(b.n+' diam. Sisinya datar.')}
      didorong[b.k]=true;
      if(Object.keys(didorong).length===BENDA.length){
        later(function(){
          m.className='msg good';m.textContent='Yang bulat menggelinding. Yang datar diam.';
          setKata('Yang bulat menggelinding. Yang datar diam.');
        },1300);
        $('s2next').disabled=false;
      }
    };
    card.appendChild(bt);g.appendChild(card);
  });
  $('s2next').disabled=true;$('s2msg').className='msg';$('s2msg').textContent='Ketuk Dorong.';
  setKata('Dorong bendanya. Mana yang menggelinding?');
}
$('s2next').onclick=function(){show('s3')};

/* ---- adegan posisi: kotak di tengah, bola di atas/bawah/kiri/kanan ---- */
function adegan(pos,tap){
  var root=el('div','adegan'),zona={};
  var peta=[null,'atas',null,'kiri','kotak','kanan',null,'bawah',null];
  peta.forEach(function(p){
    if(!p){root.appendChild(el('div'));return}
    if(p==='kotak'){var k=el('div','kotak');k.appendChild(ruang('kubus','#e0a93b'));root.appendChild(k);return}
    var z=el(tap?'button':'div','zona'+(tap?'':' stat'));
    if(tap){z.setAttribute('aria-label',p);z.onclick=function(){tap(p)}}
    zona[p]=z;
    if(pos===p)z.appendChild(ruang('bola','#d94f3d'));
    root.appendChild(z);
  });
  return {root:root,zona:zona,taruh:function(p){
    for(var k in zona){clear(zona[k]);zona[k].classList.remove('hint')}
    zona[p].appendChild(ruang('bola','#d94f3d'));
  }};
}

/* ---- stasiun 3: taruh bola ---- */
var POSISI=['atas','bawah','kiri','kanan'];
var urutP=[],pr=0;
function mulaiS3(){urutP=shuffle(POSISI);pr=0;rondePosisi()}
function rondePosisi(){
  var w=urutP[pr],kunci=false;
  var say=$('s3say');clear(say);
  say.appendChild(document.createTextNode('Taruh bola di '));
  say.appendChild(el('span','k',w));
  say.appendChild(document.createTextNode(' kotak.'));
  var d=$('s3dots');clear(d);for(var j=0;j<POSISI.length;j++)d.appendChild(el('i',j<=pr?'on':''));
  var host=$('s3adegan');clear(host);
  var ad=adegan(null,function(p){
    if(kunci)return;
    ad.taruh(p);
    var m=$('s3msg');
    if(p===w){
      kunci=true;m.className='msg good';m.textContent='Betul! Bola di '+w+' kotak.';
      $('s3next').disabled=false;setKata('Betul! Bola di '+w+' kotak.');
    }else{
      m.className='msg warn';m.textContent='Itu di '+p+' kotak. Coba lagi!';
      setKata('Itu di '+p+' kotak. Coba lagi.');
    }
  });
  host.appendChild(ad.root);
  if(pr===0)ad.zona[w].classList.add('hint');
  $('s3next').disabled=true;
  $('s3msg').className='msg';
  $('s3msg').textContent=pr===0?'Ketuk yang berdenyut.':'Ketuk tempat yang tepat.';
  setKata('Taruh bola di '+w+' kotak.');
}
$('s3next').onclick=function(){
  if(pr<POSISI.length-1){pr++;rondePosisi()}else show('s4');
};

/* ---- tantangan: 4 soal, balasan langsung ---- */
function bangunSoal(){
  var s=[],i;
  (function(){var k=KINDS[rnd(0,3)],lain=shuffle(KINDS.filter(function(x){return x!==k})).slice(0,2);
    s.push({vis:function(){return datar(k,WARNA[rnd(0,4)],0,110)},q:'Ini bentuk apa?',a:cap(k),w:lain.map(cap),e:'Ini '+k+'.'})})();
  (function(){var R=['bola','kubus','balok','tabung'],k=R[rnd(0,3)],lain=shuffle(R.filter(function(x){return x!==k})).slice(0,2);
    s.push({vis:function(){return ruang(k,WARNA[rnd(0,4)],110)},q:'Ini bangun apa?',a:cap(k),w:lain.map(cap),e:'Ini '+k+'.'})})();
  (function(){var p=POSISI[rnd(0,3)],lain=shuffle(POSISI.filter(function(x){return x!==p})).slice(0,2);
    s.push({vis:function(){var a=adegan(p,null);a.root.style.transform='scale(.8)';a.root.style.margin='-24px 0';return a.root},q:'Bola ada di ... kotak.',a:cap(p),w:lain.map(cap),e:'Bola ada di '+p+' kotak.'})})();
  (function(){
    if(rnd(0,1))s.push({q:'Mana yang punya 3 sisi?',a:'Segitiga',w:['Persegi','Lingkaran'],e:'Segitiga punya 3 sisi.'});
    else s.push({q:'Mana yang tidak punya sudut?',a:'Lingkaran',w:['Segitiga','Persegi'],e:'Lingkaran itu bulat. Tidak ada sudutnya.'});
  })();
  return s;
}
var soal=[],qi=0,benar=0,terkunci=false;
function mulaiS4(){soal=bangunSoal();qi=0;benar=0;tampilSoal()}
function tampilSoal(){
  terkunci=false;
  var q=soal[qi];
  $('s4n').textContent='Tantangan '+(qi+1)+' dari '+soal.length;
  $('s4q').textContent=q.q;
  var v=$('s4v');clear(v);
  if(q.vis)v.appendChild(q.vis());
  var o=$('s4o');clear(o);
  shuffle([q.a].concat(q.w)).forEach(function(x){
    var b=el('button','opt',x);
    b.onclick=function(){
      if(terkunci)return;terkunci=true;
      var ok=x===q.a;if(ok)benar++;
      var all=o.children;for(var k=0;k<all.length;k++){if(all[k].textContent===q.a)all[k].classList.add('right');else if(all[k]===b)all[k].classList.add('wrong')}
      var fb=$('s4fb');fb.style.display='flex';fb.className='msg '+(ok?'good':'warn');
      fb.textContent=(ok?'Benar! ':'Hampir! ')+q.e;
      setKata((ok?'Benar! ':'Hampir! ')+q.e);
      var nx=$('s4next');nx.style.display='';nx.textContent=qi===soal.length-1?'Selesai':'Lanjut';
    };
    o.appendChild(b);
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
  var teks=n===3?'Kamu kenal bentuk dan letak benda.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-02'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};

/* ---- bonus: bentuk di rumah ---- */
var BAGIAN=[
  {n:'Matahari',b:'lingkaran',mk:function(){return sh('circle',{cx:248,cy:46,r:26,fill:'#f2c94c'})}},
  {n:'Atap',b:'segitiga',mk:function(){return sh('polygon',{points:'55,104 150,34 245,104',fill:'#d94f3d'})}},
  {n:'Dinding',b:'persegi panjang',mk:function(){return sh('rect',{x:75,y:104,width:150,height:100,fill:'#f4d79a'})}},
  {n:'Jendela',b:'persegi',mk:function(){return sh('rect',{x:92,y:124,width:40,height:40,fill:'#8ec5ea'})}},
  {n:'Pintu',b:'persegi panjang',mk:function(){return sh('rect',{x:165,y:134,width:40,height:70,fill:'#8a5a2b'})}}
];
function mulaiBonus(){
  var host=$('bh');clear(host);
  var s=sh('svg',{viewBox:'0 0 300 220',role:'group','aria-label':'Gambar rumah'});
  s.appendChild(gaya(sh('line',{x1:10,y1:204,x2:290,y2:204}),{stroke:'currentColor','stroke-width':3,'stroke-linecap':'round'}));
  var dilihat={},jumlah=0;
  BAGIAN.forEach(function(p){
    var e=p.mk();gaya(e,GARIS);
    e.setAttribute('class','bagian');e.setAttribute('tabindex','0');e.setAttribute('role','button');e.setAttribute('aria-label',p.n);
    var tap=function(){
      var m=$('bmsg');m.className='msg good';
      m.textContent=p.n+' berbentuk '+p.b+'.';
      setKata(p.n+' berbentuk '+p.b+'.');
      e.setAttribute('stroke','#d94f3d');e.setAttribute('stroke-width',6);
      if(!dilihat[p.n]){dilihat[p.n]=true;jumlah++}
      if(jumlah===BAGIAN.length)later(function(){m.textContent='Hebat! Semua bentuk ketemu.';setKata('Hebat! Semua bentuk ketemu.')},1600);
    };
    e.onclick=tap;
    e.onkeydown=function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();tap()}};
    s.appendChild(e);
  });
  host.appendChild(s);
  $('bmsg').className='msg';$('bmsg').textContent='Ketuk bagian rumah.';
  setKata('Ketuk bagian rumah untuk melihat bentuknya.');
}
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`
