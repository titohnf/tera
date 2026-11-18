import { rakit } from './bersama'
import { DATA_AC01 } from './latihan/ac01'

/**
 * Materi interaktif AC-01 "Ikat Sepuluh" (Bilangan cacah sampai 100; komposisi
 * dan dekomposisi). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox
 * di `/mandiri/materi`. Disimpan sebagai string supaya ikut terbundel di build
 * Netlify tanpa membaca berkas saat runtime.
 *
 * Rancangan untuk anak kelas 1-2 (hampir tidak membaca): SATU stasiun per layar,
 * instruksi 6-8 kata, sentuh langsung (ketuk 10 lidi untuk mengikatnya), suara
 * sebagai tambahan (speechSynthesis, hanya tampil bila ada suara bahasa
 * Indonesia), dan akhir berupa bintang, bukan skor ujian.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-01 di Misi.
 *
 * LATIHAN SESUDAH STASIUN PRAKTIK. Tantangan lama diganti tiga stasiun dari mesin
 * bersama (`bersama.ts`): Benar atau salah, Siapa yang benar, dan Tantangan Misi.
 * Bahannya disusun dari konsep yang diuji bank soal topik ini (`latihan/ac01.ts`),
 * supaya anak terbiasa dengan bentuk soal Misi yang sebenarnya.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ikat Sepuluh</title>
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
/* lidi */
.lidi{width:30px;height:66px;padding:0;border:0;background:transparent;cursor:pointer;position:relative;flex:none;touch-action:manipulation}
.lidi::before{content:"";position:absolute;left:11px;top:4px;width:8px;height:58px;border-radius:4px;background:linear-gradient(90deg,var(--lidi),var(--lidi-dark));transition:transform .15s}
.lidi.sel::before{transform:translateY(-8px);box-shadow:0 0 0 4px var(--ikat)}
.lidi.hint::before{animation:denyut 1s infinite}
@keyframes denyut{50%{box-shadow:0 0 0 5px rgba(217,79,61,.45)}}
.mini{display:inline-block;width:5px;height:34px;border-radius:3px;background:linear-gradient(90deg,var(--lidi),var(--lidi-dark));margin:0 1px;vertical-align:bottom}
.mini.dim{opacity:.25}
.mini.on{animation:nyala .35s;box-shadow:0 0 0 3px var(--ikat)}
@keyframes nyala{0%{transform:scale(.6)}70%{transform:scale(1.25)}100%{transform:scale(1)}}
.bundle{position:relative;display:inline-flex;align-items:flex-end;padding:0 4px;flex:none}
.bundle .mini{height:50px;width:6px}
.bundle::after{content:"";position:absolute;left:0;right:0;top:20px;height:11px;background:var(--ikat);border-radius:6px;transform-origin:left;animation:tali .45s ease-out}
.bundle.m .mini{height:30px;width:4px}.bundle.m::after{top:10px;height:7px;animation:none}
.bundle.pop{animation:pop .4s}
.bundle.on{filter:drop-shadow(0 0 5px var(--ikat))}
@keyframes tali{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes pop{0%{transform:scale(.5)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
.area{display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;min-height:84px}
.area h3{width:100%;margin:0;font-family:var(--display);font-size:1rem;color:var(--muted);font-weight:600}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.num{font-family:var(--display);font-weight:800;font-size:4.2rem;line-height:1;font-variant-numeric:tabular-nums}
.num .t{color:var(--ikat)}.num .o{color:var(--lidi-dark)}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.row{display:flex;gap:10px;flex-wrap:wrap}
.chip{font:inherit;font-weight:800;border:2px solid var(--line);background:var(--card);color:var(--ink);border-radius:99px;padding:8px 14px;cursor:pointer;min-height:44px}
.chip.on{border-color:var(--ikat);background:var(--soft)}
.big-count{font-family:var(--display);font-weight:800;font-size:3.4rem;text-align:center;min-height:1.1em}
/* tantangan */
.q{font-family:var(--display);font-size:1.5rem;font-weight:800}
.opts{display:grid;gap:10px}
.opt{font:inherit;font-family:var(--display);font-weight:800;font-size:1.5rem;min-height:60px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.opt.right{background:var(--ok);border-color:var(--ok);color:#fff}
.opt.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.center{text-align:center}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
.cara{display:flex;flex-direction:column;gap:8px}
.cara .w{background:var(--soft);border-radius:14px;padding:8px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.cara .w b{font-family:var(--display);min-width:9ch}
input[type=range]{width:100%;accent-color:var(--ikat);height:40px}
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
      <h1>Ikat Sepuluh</h1>
      <div id="introLidi" style="display:flex;justify-content:center;align-items:flex-end;gap:14px;min-height:80px"></div>
      <p class="say">Ayo belajar bilangan dengan lidi!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: ikat -->
  <section class="screen" id="s1">
    <p class="say" id="s1say">Ketuk 10 lidi untuk diikat.</p>
    <div class="row" style="align-items:center;justify-content:space-between">
      <div><div class="num" id="s1n">13</div><div class="sub" id="s1t">tiga belas</div></div>
      <div class="dots" id="s1dots"></div>
    </div>
    <div class="panel" style="display:flex;flex-direction:column;gap:12px">
      <div class="area" id="s1ikat"><h3>Ikat</h3></div>
      <div class="area" id="s1lepas"><h3>Lidi lepas</h3></div>
    </div>
    <div class="msg" id="s1msg">Ketuk lidi yang berdenyut.</div>
    <div class="cta">
      <button class="big main" id="s1next" disabled>Lanjut</button>
      <button class="big soft" id="s1ulang">Mulai lagi</button>
    </div>
  </section>

  <!-- 2: tukar -->
  <section class="screen" id="s2">
    <p class="say">Tukar angkanya. Lihat apa yang berubah.</p>
    <div class="panel center">
      <div class="num" id="s2n">24</div>
      <div class="sub" id="s2t">2 ikat dan 4 lidi</div>
      <div id="s2v" style="display:flex;gap:6px;justify-content:center;align-items:flex-end;flex-wrap:wrap;margin-top:10px;min-height:60px"></div>
    </div>
    <button class="big" id="s2tukar">Tukar &#8646;</button>
    <div class="row" id="s2pil" style="justify-content:center"></div>
    <div class="msg" id="s2msg">Ketuk Tukar.</div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: hitung -->
  <section class="screen" id="s3">
    <p class="say" id="s3say">Hitung semua lidinya.</p>
    <div class="panel">
      <div id="s3v" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end"></div>
    </div>
    <div class="big-count" id="s3c"></div>
    <button class="big" id="s3hitung">Hitung!</button>
    <div id="s3tanya" hidden style="display:none;flex-direction:column;gap:10px">
      <p class="say">Siapa yang benar?</p>
      <button class="big" id="s3bela">Bela: 46</button>
      <button class="big" id="s3cika">Cika: 4 + 6 = 10</button>
    </div>
    <div class="msg" id="s3msg" hidden style="display:none"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: tantangan -->
  <section class="screen" id="s4">
    <div class="sub" id="s4n"></div>
    <div id="s4v" style="display:flex;gap:6px;align-items:flex-end;flex-wrap:wrap;min-height:20px"></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: banyak cara</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: satu bilangan, banyak cara.</p>
    <div class="row" style="align-items:center"><span class="num" id="bn">52</span><span class="sub">lidi</span></div>
    <input type="range" id="br" min="11" max="99" value="52" aria-label="Pilih bilangan">
    <div class="cara" id="bw"></div>
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

var sat=['nol','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan'];
function terbilang(n){
  if(n<10)return sat[n];
  if(n===10)return 'sepuluh';
  if(n===11)return 'sebelas';
  if(n<20)return sat[n-10]+' belas';
  if(n<100){var t=Math.floor(n/10),o=n%10;return sat[t]+' puluh'+(o?' '+sat[o]:'')}
  return 'seratus';
}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function mini(dim){return el('span','mini'+(dim?' dim':''))}
function bundle(m,pop){var b=el('span','bundle'+(m?' m':'')+(pop?' pop':''));for(var i=0;i<10;i++)b.appendChild(mini());return b}
function clear(n){while(n.firstChild)n.removeChild(n.firstChild)}

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
var cur='intro',sebelum='akhir';
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
  if(id==='bonus'){sebelum='akhir';renderBonus()}
  if(id==='intro')setKata('Ayo belajar bilangan dengan lidi!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};

/* intro: lidi diikat */
(function(){var w=$('introLidi');w.appendChild(bundle(false));for(var i=0;i<3;i++)w.appendChild(mini())})();
setKata('Ayo belajar bilangan dengan lidi!');

/* ---- stasiun 1: ketuk 10 lidi untuk diikat ---- */
var rondeList=[13,24,35],ri=0,lepas=[],ikat=0,terpilih=0;
function mulaiS1(){ri=0;mulaiRonde()}
function mulaiRonde(){
  var n=rondeList[ri];
  lepas=[];for(var i=0;i<n;i++)lepas.push({sel:false});
  ikat=0;terpilih=0;
  $('s1n').textContent=n;$('s1t').textContent=terbilang(n);
  var d=$('s1dots');clear(d);for(var j=0;j<rondeList.length;j++){var x=el('i',j<=ri?'on':'');d.appendChild(x)}
  $('s1next').disabled=true;
  $('s1msg').className='msg';
  $('s1msg').textContent=ri===0?'Ketuk lidi yang berdenyut.':'Ketuk 10 lidi.';
  setKata('Ketuk sepuluh lidi untuk diikat.');
  gambarS1(false);
}
function gambarS1(popTerakhir){
  var A=$('s1ikat'),B=$('s1lepas');
  clear(A);clear(B);
  A.appendChild(el('h3',null,'Ikat: '+ikat));B.appendChild(el('h3',null,'Lidi lepas: '+lepas.length));
  for(var i=0;i<ikat;i++)A.appendChild(bundle(false,popTerakhir&&i===ikat-1));
  lepas.forEach(function(s,idx){
    var b=el('button','lidi'+(s.sel?' sel':'')+(ri===0&&ikat===0&&idx<10&&!s.sel?' hint':''));
    b.setAttribute('aria-label','lidi');
    b.onclick=function(){
      if(!s.sel&&terpilih>=10)return;
      s.sel=!s.sel;terpilih+=s.sel?1:-1;
      if(terpilih===10){
        lepas=lepas.filter(function(x){return !x.sel});ikat++;terpilih=0;
        gambarS1(true);cekRonde();
      }else gambarS1(false);
    };
    B.appendChild(b);
  });
}
function cekRonde(){
  var n=rondeList[ri];
  if(lepas.length<10){
    $('s1msg').className='msg good';
    $('s1msg').textContent='Bagus! '+ikat+' ikat dan '+lepas.length+' lidi.';
    $('s1next').disabled=false;
    setKata(n+' sama dengan '+ikat+' ikat dan '+lepas.length+' lidi.');
  }else{
    $('s1msg').className='msg';
    $('s1msg').textContent='Masih ada 10 lidi lepas. Ikat lagi!';
  }
}
$('s1ulang').onclick=function(){mulaiRonde()};
$('s1next').onclick=function(){
  if(ri<rondeList.length-1){ri++;mulaiRonde()}else show('s2');
};

/* ---- stasiun 2: tukar tempat ---- */
var pasang=[[2,4],[3,8],[6,7],[5,9]],pi=0,pasangan=[2,4],sudahTukar=false;
function mulaiS2(){
  pi=0;pasangan=pasang[0].slice();sudahTukar=false;
  $('s2next').disabled=true;$('s2msg').textContent='Ketuk Tukar.';
  var p=$('s2pil');clear(p);
  pasang.forEach(function(ps,i){
    var c=el('button','chip'+(i===0?' on':''),ps[0]+' dan '+ps[1]);
    c.onclick=function(){pi=i;pasangan=ps.slice();var all=p.children;for(var k=0;k<all.length;k++)all[k].classList.toggle('on',k===i);gambarS2()};
    p.appendChild(c);
  });
  gambarS2();setKata('Tukar angkanya. Lihat apa yang berubah.');
}
function gambarS2(){
  var a=pasangan[0],b=pasangan[1];
  $('s2n').innerHTML='<span class="t">'+a+'</span><span class="o">'+b+'</span>';
  $('s2t').textContent=a+' ikat dan '+b+' lidi';
  var v=$('s2v');clear(v);
  for(var i=0;i<a;i++)v.appendChild(bundle(true));
  for(var j=0;j<b;j++)v.appendChild(mini());
}
$('s2tukar').onclick=function(){
  var a=pasangan[0],b=pasangan[1],lama=a*10+b;
  pasangan=[b,a];gambarS2();sudahTukar=true;
  $('s2msg').textContent=lama+' dan '+(b*10+a)+' berbeda!';
  $('s2next').disabled=false;
  setKata(terbilang(lama)+' dan '+terbilang(b*10+a)+' berbeda.');
};
$('s2next').onclick=function(){show('s3')};

/* ---- stasiun 3: hitung bersama ---- */
var menghitung=false;
function mulaiS3(){
  menghitung=false;
  var v=$('s3v');clear(v);
  for(var i=0;i<4;i++)v.appendChild(bundle(false));
  var l=el('span');l.style.display='inline-flex';l.id='s3lepas';
  for(var j=0;j<6;j++)l.appendChild(mini(true));
  v.appendChild(l);
  $('s3c').textContent='';
  $('s3hitung').style.display='';$('s3hitung').disabled=false;
  $('s3tanya').style.display='none';$('s3msg').style.display='none';
  $('s3next').disabled=true;
  setKata('Ada 4 ikat dan 6 lidi lepas. Hitung semua lidinya.');
}
$('s3hitung').onclick=function(){
  if(menghitung)return;menghitung=true;$('s3hitung').disabled=true;
  var bs=$('s3v').querySelectorAll('.bundle');var t=0;
  for(var i=0;i<bs.length;i++){(function(i){later(function(){
    bs[i].classList.add('on');$('s3c').textContent=(i+1)*10;
  },i*650)})(i)}
  var mulaiLepas=bs.length*650,ms=$('s3lepas').children;
  for(var j=0;j<ms.length;j++){(function(j){later(function(){
    ms[j].classList.remove('dim');ms[j].classList.add('on');$('s3c').textContent=40+j+1;
  },mulaiLepas+j*420)})(j)}
  later(function(){
    $('s3hitung').style.display='none';$('s3tanya').style.display='flex';
    setKata('Jumlahnya empat puluh enam. Siapa yang benar?');
  },mulaiLepas+ms.length*420+300);
};
$('s3bela').onclick=function(){
  var m=$('s3msg');m.style.display='flex';m.className='msg good';
  m.textContent='Benar! 4 ikat = 40, tambah 6 = 46.';
  $('s3next').disabled=false;setKata('Benar! Empat ikat itu empat puluh. Tambah enam jadi empat puluh enam.');
};
$('s3cika').onclick=function(){
  var m=$('s3msg');m.style.display='flex';m.className='msg warn';
  m.textContent='Hampir! 1 ikat isinya 10 lidi.';
  setKata('Hampir! Satu ikat isinya sepuluh lidi.');
};
$('s3next').onclick=function(){show('s4')};

/* ---- tantangan: 4 soal, balasan langsung ---- */
function bangunSoal(){
  function dua(){var a=rnd(1,9),b=rnd(1,9);while(a===b)b=rnd(1,9);return [a,b]}
  var s=[];
  (function(){var d=dua(),t=d[0],o=d[1];
    s.push({vis:{t:t,o:o},q:'Berapa semua lidinya?',a:String(t*10+o),w:[String(t+o),String(o*10+t)],e:t+' ikat = '+t*10+'. Tambah '+o+' = '+(t*10+o)+'.'})})();
  (function(){var d=dua(),t=d[0],o=d[1];
    s.push({q:'Angka '+t+' di '+(t*10+o)+' bernilai...',a:String(t*10),w:[String(t),String(o)],e:'Angka '+t+' ada di tempat puluhan. Nilainya '+t*10+'.'})})();
  (function(){var d=dua(),A=d[0]*10+d[1],B=d[1]*10+d[0];
    s.push({q:'Mana yang lebih besar?',a:String(Math.max(A,B)),w:[String(Math.min(A,B))],e:'Lihat puluhannya dulu. '+Math.max(A,B)+' lebih besar.'})})();
  (function(){var d=dua(),t=d[0],o=d[1];
    s.push({q:(t*10+o)+' = ... ikat + '+o+' lidi',a:String(t),w:[String(o),String(t+1)],e:(t*10+o)+' itu '+t+' ikat dan '+o+' lidi.'})})();
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
  if(q.vis){for(var i=0;i<q.vis.t;i++)v.appendChild(bundle(true));for(var j=0;j<q.vis.o;j++)v.appendChild(mini())}
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
  var teks=n===3?'Kamu paham ikat sepuluh.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-01'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};

/* ---- bonus: banyak cara ---- */
function renderBonus(){
  var n=+$('br').value;$('bn').textContent=n;
  var w=$('bw');clear(w);
  var maxT=Math.floor(n/10);
  for(var t=maxT;t>=Math.max(0,maxT-3);t--){
    var o=n-t*10,row=el('div','w');
    row.appendChild(el('b',null,t+' ikat + '+o));
    var iw=el('span');iw.style.display='inline-flex';iw.style.flexWrap='wrap';iw.style.gap='4px';iw.style.alignItems='flex-end';
    for(var i=0;i<t;i++)iw.appendChild(bundle(true));
    for(var j=0;j<o;j++)iw.appendChild(mini());
    row.appendChild(iw);w.appendChild(row);
  }
  setKata('Satu bilangan bisa disusun dengan banyak cara.');
}
$('br').oninput=renderBonus;
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC01 = rakit(DASAR, { kode: 'AC-01', tantangan: 's4', data: DATA_AC01 })
