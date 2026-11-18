/**
 * Materi interaktif AC-03 "Lompat Katak" (Operasi tambah-kurang bilangan cacah
 * sampai 20). Satu halaman HTML mandiri, ditampilkan lewat iframe sandbox di
 * `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-03. Disimpan
 * sebagai string supaya ikut terbundel di build tanpa membaca berkas saat
 * runtime.
 *
 * Rancangan sama dengan AC-01 dan AC-02 (anak kelas 1-2, hampir tidak membaca):
 * SATU stasiun per layar, instruksi pendek, sentuh langsung, suara sebagai
 * tambahan (speechSynthesis, hanya tampil bila ada suara bahasa Indonesia), dan
 * akhir berupa bintang, bukan skor ujian.
 *
 * Stasiun: 1) tambah = katak melompat maju di garis bilangan, 2) kurang = katak
 * melompat mundur, 3) teman sepuluh (isi kotak telur sampai penuh), 4) tantangan
 * 4 soal. Bonus: satu jumlah, banyak pasangan. Hasil tidak pernah melebihi 20.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-03 di Misi.
 */
export const HTML_AC03 = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lompat Katak</title>
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
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.row{display:flex;gap:10px;flex-wrap:wrap}
.center{text-align:center}
svg{color:var(--ink);display:block}
.num{font-family:var(--display);font-weight:800;font-size:3.4rem;line-height:1;font-variant-numeric:tabular-nums}
.num .op{color:var(--ikat)}
.num .hs{color:var(--ok)}
/* garis bilangan */
.gl{overflow-x:auto;padding:4px 0 6px;scrollbar-width:thin}
.gl .in{display:flex;width:max-content;position:relative}
.gl .c{width:38px;flex:none;display:flex;flex-direction:column;align-items:center;gap:2px}
.gl .c .kt{height:34px;display:flex;align-items:flex-end;justify-content:center;font-size:1.7rem;line-height:1}
.gl .c .tk{width:100%;height:12px;border-top:4px solid var(--ink);position:relative}
.gl .c .tk::before{content:"";position:absolute;left:50%;top:-4px;width:4px;height:12px;margin-left:-2px;background:var(--ink);border-radius:2px}
.gl .c .nm{font-family:var(--display);font-weight:800;font-size:1.05rem;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
.gl .c.lalu .nm{background:var(--soft);box-shadow:inset 0 0 0 2px var(--lidi)}
.gl .c.kini .nm{background:var(--ikat);color:#fff}
.gl .c.kini .kt{animation:loncat .3s}
@keyframes loncat{0%{transform:translateY(0)}50%{transform:translateY(-14px)}100%{transform:translateY(0)}}
.hop{font-size:1rem;color:var(--muted);min-height:1.4em}
/* teman sepuluh */
.telur{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;max-width:360px;margin:0 auto;width:100%}
.slot{aspect-ratio:1;border:2px dashed var(--line);border-radius:50%;background:transparent;padding:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;touch-action:manipulation}
.slot.isi{border-style:solid;border-color:transparent;cursor:default}
.slot.hint{animation:denyut 1s infinite}
.slot svg{width:100%;height:100%}
/* tantangan */
.q{font-family:var(--display);font-size:1.5rem;font-weight:800}
.opts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.opt{font:inherit;font-family:var(--display);font-weight:800;font-size:1.8rem;min-height:64px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.opt.right{background:var(--ok);border-color:var(--ok);color:#fff}
.opt.wrong{background:var(--bad);border-color:var(--bad);color:#fff}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
/* bonus */
input[type=range]{width:100%;accent-color:var(--ikat);height:40px}
.cara{display:flex;flex-direction:column;gap:8px}
.cara .w{background:var(--soft);border-radius:14px;padding:8px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.cara .w b{font-family:var(--display);min-width:7ch}
.blk{display:inline-block;width:14px;height:14px;border-radius:3px;margin:1px}
.blk.a{background:#4a7bd0}.blk.b{background:#d94f3d}
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
      <h1>Lompat Katak</h1>
      <div style="font-size:4.5rem;line-height:1" aria-hidden="true">&#128056;</div>
      <p class="say">Ayo tambah dan kurang bersama katak!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: tambah (maju) -->
  <section class="screen" id="s1">
    <p class="say">Tambah: katak lompat maju.</p>
    <div class="row" style="align-items:center;justify-content:space-between">
      <div class="num" id="s1n"></div>
      <div class="dots" id="s1dots"></div>
    </div>
    <div class="panel"><div class="gl" id="s1gl"></div><div class="hop" id="s1hop"></div></div>
    <button class="big" id="s1lompat">Lompat! &#8594;</button>
    <div class="msg" id="s1msg">Ketuk Lompat.</div>
    <div class="cta">
      <button class="big main" id="s1next" disabled>Lanjut</button>
      <button class="big soft" id="s1ulang">Mulai lagi</button>
    </div>
  </section>

  <!-- 2: kurang (mundur) -->
  <section class="screen" id="s2">
    <p class="say">Kurang: katak lompat mundur.</p>
    <div class="row" style="align-items:center;justify-content:space-between">
      <div class="num" id="s2n"></div>
      <div class="dots" id="s2dots"></div>
    </div>
    <div class="panel"><div class="gl" id="s2gl"></div><div class="hop" id="s2hop"></div></div>
    <button class="big" id="s2lompat">&#8592; Lompat!</button>
    <div class="msg" id="s2msg">Ketuk Lompat.</div>
    <div class="cta">
      <button class="big main" id="s2next" disabled>Lanjut</button>
      <button class="big soft" id="s2ulang">Mulai lagi</button>
    </div>
  </section>

  <!-- 3: teman sepuluh -->
  <section class="screen" id="s3">
    <p class="say">Penuhkan kotak telur sampai 10.</p>
    <div class="row" style="align-items:center;justify-content:space-between">
      <div class="num" id="s3n"></div>
      <div class="dots" id="s3dots"></div>
    </div>
    <div class="panel"><div class="telur" id="s3telur"></div></div>
    <div class="msg" id="s3msg">Ketuk tempat yang kosong.</div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: tantangan -->
  <section class="screen" id="s4">
    <div class="sub" id="s4n"></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: banyak pasangan</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: satu jumlah, banyak pasangan.</p>
    <div class="row" style="align-items:center"><span class="num" id="bn">12</span><span class="sub">semuanya</span></div>
    <input type="range" id="br" min="5" max="20" value="12" aria-label="Pilih jumlah">
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
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function clear(n){while(n.firstChild)n.removeChild(n.firstChild)}

var NS='http://www.w3.org/2000/svg';
function sh(tag,attrs){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);return e}
function apel(c){
  var s=sh('svg',{viewBox:'0 0 100 100','aria-hidden':'true'});
  s.appendChild(sh('circle',{cx:50,cy:56,r:34,fill:c,stroke:'currentColor','stroke-width':3}));
  s.appendChild(sh('path',{d:'M50 24 C50 16 54 10 60 8',fill:'none',stroke:'currentColor','stroke-width':4,'stroke-linecap':'round'}));
  s.appendChild(sh('ellipse',{cx:36,cy:44,rx:8,ry:5,fill:'#fff','fill-opacity':.45,transform:'rotate(-35 36 44)'}));
  return s;
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
  if(id==='s1')lompat1.mulai();
  if(id==='s2')lompat2.mulai();
  if(id==='s3')mulaiS3();
  if(id==='s4')mulaiS4();
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')renderBonus();
  if(id==='intro')setKata('Ayo tambah dan kurang bersama katak!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo tambah dan kurang bersama katak!');

/* ---- stasiun 1 dan 2: katak di garis bilangan 0-20 ---- */
function stasiunLompat(p,daftar,arah,lanjut){
  var ronde=0,pos=0,langkah=0,awal=0,n=0,selesai=false;
  var sel=[];
  function bangunGaris(){
    var host=$(p+'gl');clear(host);
    var inn=el('div','in');sel=[];
    for(var i=0;i<=20;i++){
      var c=el('div','c');
      c.appendChild(el('div','kt'));c.appendChild(el('div','tk'));c.appendChild(el('div','nm',String(i)));
      inn.appendChild(c);sel.push(c);
    }
    host.appendChild(inn);
  }
  function gambar(){
    for(var i=0;i<sel.length;i++){
      var c=sel[i];c.classList.remove('kini');c.firstChild.textContent='';
      var lalu=(arah>0)?(i>=awal&&i<=pos):(i<=awal&&i>=pos);
      c.classList.toggle('lalu',lalu&&i!==pos);
    }
    sel[pos].classList.add('kini');sel[pos].firstChild.innerHTML='&#128056;';
    var host=$(p+'gl'),c2=sel[pos];
    try{host.scrollTo({left:c2.offsetLeft-host.clientWidth/2+19,behavior:'smooth'})}catch(e){host.scrollLeft=c2.offsetLeft-host.clientWidth/2+19}
  }
  function mulai(){ronde=0;mulaiRonde()}
  function mulaiRonde(){
    var r=daftar[ronde];
    awal=r[0];n=r[1];pos=awal;langkah=0;selesai=false;
    var kt=$(p+'n');clear(kt);
    kt.appendChild(document.createTextNode(awal+' '));
    kt.appendChild(el('span','op',arah>0?'+':'−'));
    kt.appendChild(document.createTextNode(' '+n));
    var d=$(p+'dots');clear(d);for(var j=0;j<daftar.length;j++)d.appendChild(el('i',j<=ronde?'on':''));
    $(p+'hop').textContent='Katak mulai di '+awal+'. Lompat '+n+' kali.';
    $(p+'lompat').disabled=false;$(p+'next').disabled=true;
    $(p+'msg').className='msg';$(p+'msg').textContent='Ketuk Lompat.';
    bangunGaris();gambar();
    setKata(awal+(arah>0?' tambah ':' kurang ')+n+'. Ketuk lompat.');
  }
  $(p+'lompat').onclick=function(){
    if(selesai)return;
    pos+=arah;langkah++;gambar();
    $(p+'hop').textContent='Lompatan '+langkah+' dari '+n+'. Katak di '+pos+'.';
    if(langkah===n){
      selesai=true;$(p+'lompat').disabled=true;$(p+'next').disabled=false;
      var t=awal+(arah>0?' + ':' − ')+n+' = '+pos;
      $(p+'msg').className='msg good';$(p+'msg').textContent=t;
      setKata(awal+(arah>0?' tambah ':' kurang ')+n+' sama dengan '+pos+'.');
    }else{
      $(p+'msg').className='msg';$(p+'msg').textContent=String(pos);
    }
  };
  $(p+'ulang').onclick=function(){mulaiRonde()};
  $(p+'next').onclick=function(){
    if(ronde<daftar.length-1){ronde++;mulaiRonde()}else show(lanjut);
  };
  return {mulai:mulai};
}
var lompat1=stasiunLompat('s1',[[6,3],[8,5],[12,6]],1,'s2');
var lompat2=stasiunLompat('s2',[[9,4],[14,6],[17,5]],-1,'s3');

/* ---- stasiun 3: teman sepuluh ---- */
var AWAL=[7,4,9,6],tr=0,tambah=0;
function mulaiS3(){AWAL=shuffle([7,4,9,6]);tr=0;rondeTelur()}
function rondeTelur(){
  var n=AWAL[tr];tambah=0;
  var d=$('s3dots');clear(d);for(var j=0;j<AWAL.length;j++)d.appendChild(el('i',j<=tr?'on':''));
  var g=$('s3telur');clear(g);
  var pertama=true;
  for(var i=0;i<10;i++){
    var s=el('button','slot'+(i<n?' isi':''));
    if(i<n){s.disabled=true;s.appendChild(apel('#d94f3d'))}
    else{
      s.setAttribute('aria-label','kosong');
      if(tr===0&&pertama){s.classList.add('hint');pertama=false}
      s.onclick=(function(s){return function(){
        if(s.classList.contains('isi'))return;
        s.classList.remove('hint');s.classList.add('isi');s.appendChild(apel('#e0a93b'));
        tambah++;hitungS3(n);
      }})(s);
    }
    g.appendChild(s);
  }
  $('s3next').disabled=true;
  $('s3msg').className='msg';
  $('s3msg').textContent=tr===0?'Ketuk yang berdenyut.':'Ketuk tempat yang kosong.';
  hitungS3(n,true);
  setKata('Ada '+n+' apel. Penuhkan sampai sepuluh.');
}
function hitungS3(n,awal){
  var k=$('s3n');clear(k);
  k.appendChild(document.createTextNode(n+' + '));
  k.appendChild(el('span','hs',String(tambah)));
  if(awal)return;
  if(n+tambah===10){
    k.appendChild(document.createTextNode(' = 10'));
    $('s3msg').className='msg good';$('s3msg').textContent=n+' + '+tambah+' = 10. Penuh!';
    $('s3next').disabled=false;setKata(n+' tambah '+tambah+' sama dengan sepuluh.');
  }else{
    $('s3msg').className='msg';$('s3msg').textContent='Kurang '+(10-n-tambah)+' lagi.';
  }
}
$('s3next').onclick=function(){if(tr<AWAL.length-1){tr++;rondeTelur()}else show('s4')};

/* ---- tantangan: 4 soal, balasan langsung ---- */
function pilihan(r){
  var c=shuffle([r+1,r-1,r+2,r-2]).filter(function(x){return x>=0&&x!==r});
  return c.slice(0,2).map(String);
}
function bangunSoal(){
  var s=[];
  (function(){var a=rnd(3,9),b=rnd(3,9),r=a+b;
    s.push({q:a+' + '+b+' = ?',a:String(r),w:pilihan(r),e:a+' + '+b+' = '+r+'.'})})();
  (function(){var a=rnd(10,18),b=rnd(3,8),r=a-b;
    s.push({q:a+' − '+b+' = ?',a:String(r),w:pilihan(r),e:a+' − '+b+' = '+r+'.'})})();
  (function(){
    if(rnd(0,1)){var a=rnd(8,14),b=rnd(3,6),r=a+b;
      s.push({q:'Ada '+a+' kelereng. Dapat '+b+' lagi. Semuanya?',a:String(r),w:pilihan(r),e:a+' + '+b+' = '+r+'.'})}
    else{var a2=rnd(10,16),b2=rnd(3,7),r2=a2-b2;
      s.push({q:'Ada '+a2+' permen. Dimakan '+b2+'. Sisanya?',a:String(r2),w:pilihan(r2),e:a2+' − '+b2+' = '+r2+'.'})}
  })();
  (function(){var x=rnd(2,8),r=10-x;
    s.push({q:x+' + ? = 10',a:String(r),w:pilihan(r),e:x+' + '+r+' = 10.'})})();
  return s;
}
var soal=[],qi=0,benar=0,terkunci=false;
function mulaiS4(){soal=bangunSoal();qi=0;benar=0;tampilSoal()}
function tampilSoal(){
  terkunci=false;
  var q=soal[qi];
  $('s4n').textContent='Tantangan '+(qi+1)+' dari '+soal.length;
  $('s4q').textContent=q.q;
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
  var teks=n===3?'Kamu bisa tambah dan kurang.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-03'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};

/* ---- bonus: satu jumlah, banyak pasangan ---- */
function renderBonus(){
  var n=+$('br').value;$('bn').textContent=n;
  var w=$('bw');clear(w);
  var maks=Math.min(Math.floor(n/2),6);
  for(var a=1;a<=maks;a++){
    var b=n-a,row=el('div','w');
    row.appendChild(el('b',null,a+' + '+b));
    var iw=el('span');
    for(var i=0;i<a;i++)iw.appendChild(el('span','blk a'));
    for(var j=0;j<b;j++)iw.appendChild(el('span','blk b'));
    row.appendChild(iw);w.appendChild(row);
  }
  setKata('Satu jumlah bisa dibuat dari banyak pasangan.');
}
$('br').oninput=renderBonus;
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`
