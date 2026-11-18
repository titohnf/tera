import { rakit } from './bersama'
import { DATA_AC12 } from './latihan/ac12'

/**
 * Materi interaktif AC-12 "Pola Ajaib" (Pola gambar dan bilangan sederhana;
 * tambah-kurang sampai 100). Satu halaman HTML mandiri, ditampilkan lewat iframe
 * sandbox di `/mandiri/materi` dan sebagai langkah Belajar di topik Misi AC-12.
 * Disimpan sebagai string supaya ikut terbundel di build tanpa membaca berkas
 * saat runtime.
 *
 * Gaya sama dengan AC-09 sampai AC-11 (anak kelas 3-4, tiap stasiun beranimasi):
 * 1) Gambar ke-n: tentukan kelompok yang berulang, susun kelompok demi
 *    kelompok (baris demi baris) sampai gambar ke-n bersinar, lalu bagi
 *    (15 : 4 = 3 sisa 3 berarti gambar ke-3 dalam kelompok).
 * 2) Selisih: ketuk celah di antara bilangan untuk melihat selisihnya, lalu
 *    pilih aturan (tetap, menurun, bergantian +4 lalu -3, selisih bertambah)
 *    dan isi bilangan yang hilang.
 * 3) Suku ke-n: tabel posisi dan nilai; dari suku pertama ke suku ke-n, selisih
 *    ditambahkan (n - 1) kali; lompatannya diputar sebagai pemeriksaan.
 * 4) Cerita pola: tabungan, parkir, kolam; diagram batang tumbuh selangkah demi
 *    selangkah.
 * Bonus: buat polamu (mulai dan selisih), lihat sukunya dan peringatan bila
 * polanya menurun sampai di bawah nol.
 *
 * Soal Misi topik ini menguji: pola gambar berulang dan posisi ke-n (kelipatan
 * panjang kelompok), pola bilangan (selisih tetap, menurun, bergantian, selisih
 * bertambah), suku ke-n, tabel posisi-nilai, cerita pola, membuat pola dari
 * syarat, dan salah paham: "cukup lihat satu bilangan terakhir", "bilangan ke-8
 * cukup dikira-kira", "2, 4, 8, 16 berselisih tetap", "pola menurun selalu
 * positif".
 *
 * Setelah itu tiga stasiun mesin latihan (`bersama.ts`), bahannya di
 * `latihan/ac12.ts`.
 *
 * Aturan menulis berkas ini: JANGAN memakai backtick atau "${" di dalam HTML,
 * karena isinya `String.raw`. Skrip memakai penggabungan string biasa.
 *
 * Tombol "Ayo berlatih" tidak menavigasi sendiri (iframe disandbox): ia mengirim
 * pesan `ayo-berlatih` ke halaman induk (`PenampilMateri`), yang berpindah ke
 * topik AC-12 di Misi.
 */
const DASAR = String.raw`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pola Ajaib</title>
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
@keyframes naik{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.msg{background:var(--soft);border:2px solid var(--lidi);border-radius:16px;padding:12px 14px;font-weight:800;min-height:56px;display:flex;align-items:center}
.msg.good{border-color:var(--ok)}.msg.warn{border-color:var(--ikat)}
.dots{display:flex;gap:6px;justify-content:center}
.dots i{width:10px;height:10px;border-radius:50%;background:var(--line)}
.dots i.on{background:var(--ikat)}
.center{text-align:center}
.besar{font-family:var(--display);font-weight:800;font-size:1.9rem;line-height:1.15;text-align:center}
.besar b{color:var(--ikat)}
.aksi{display:grid;gap:10px}
.aksi.pil3{grid-template-columns:repeat(3,1fr)}
.aksi button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.2rem;line-height:1.25;min-height:58px;border-radius:16px;border:2px solid var(--ink);background:var(--card);color:var(--ink);cursor:pointer;box-shadow:0 3px 0 var(--ink);touch-action:manipulation;padding:8px 10px;display:flex;align-items:center;justify-content:center;gap:4px}
.aksi button.utama{background:var(--ikat);color:#fff;font-size:1.3rem}
.aksi button.right{background:var(--ok);border-color:var(--ok);color:#fff;box-shadow:none}
.aksi button.wrong{background:var(--soft);border-color:var(--ikat);box-shadow:none}
.aksi button.hint{animation:denyut 1s infinite}
.aksi button svg{width:34px;height:34px}
.tanya{font-family:var(--display);font-weight:800;font-size:1.25rem;text-align:center}
/* stasiun 1: gambar ke-n */
.strip{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-items:center}
.strip .c,.rg .c{width:38px;height:38px;border-radius:10px;border:2px solid var(--line);background:var(--card);display:flex;align-items:center;justify-content:center;font-size:1.4rem;line-height:1;position:relative}
.strip .c svg,.rg .c svg{width:100%;height:100%}
.strip .titiktiga{font-family:var(--display);font-weight:800;color:var(--muted);font-size:1.3rem}
.rg{display:grid;gap:4px;justify-content:center;margin-top:8px}
.rg .c.baru{animation:pop .4s}
.rg .c.sorot{border-color:var(--ikat);box-shadow:0 0 0 3px rgba(217,79,61,.3);background:var(--soft)}
.rg .c .no{position:absolute;right:1px;bottom:0;font-size:.6rem;font-family:var(--display);color:var(--muted)}
.bagi{font-family:var(--display);font-weight:800;font-size:1.3rem;text-align:center;color:var(--ikat);min-height:1.5em}
/* stasiun 2: selisih */
.sel{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-items:center}
.sel .c{min-width:40px;height:44px;padding:0 4px;border-radius:12px;border:2px solid var(--ink);background:var(--card);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:800;font-size:1.15rem}
.sel .c.q{border:2px dashed var(--ikat);background:var(--soft);color:var(--ikat)}
.sel .c.ok{border-color:var(--ok);color:var(--ok);animation:pop .5s}
.sel .g{min-width:34px;height:30px;border-radius:99px;border:2px solid var(--line);background:var(--card);color:var(--muted);font-family:var(--display);font-weight:800;font-size:.9rem;cursor:pointer;padding:0 4px;touch-action:manipulation}
.sel .g.hint{animation:denyut 1s infinite}
.sel .g.buka{border-color:var(--ikat);background:var(--soft);color:var(--ikat);animation:pop .4s;cursor:default}
.sel .g:disabled{opacity:.35;cursor:default}
.aturan{font-family:var(--display);font-weight:800;font-size:1.2rem;text-align:center;color:var(--ikat);min-height:1.6em}
/* stasiun 3: suku ke-n */
.rantai{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;font-family:var(--display);font-weight:800;font-size:1.1rem;min-height:1.6em}
.rantai span{animation:pop .3s}
.rantai .akhir{color:var(--ok);font-size:1.4rem}
/* stasiun 4: cerita */
.cer{background:var(--card);border:2px solid var(--line);border-radius:16px;padding:10px 14px;font-weight:800;font-size:1.05rem}
.chart{display:flex;align-items:flex-end;gap:6px;height:150px;justify-content:center}
.chart .k{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;width:44px;height:100%}
.chart .k .v{font-family:var(--display);font-weight:800;font-size:.8rem}
.chart .k .b{width:100%;background:var(--rb);border:2px solid var(--ink);border-radius:6px 6px 0 0;transform-origin:bottom;animation:naik .5s ease-out}
.chart .k.baru .b{background:var(--ok)}
.chart .k .l{font-size:.7rem;color:var(--muted);font-weight:800;margin-top:2px}
/* akhir */
.stars{display:flex;gap:8px;justify-content:center;font-size:3.6rem;line-height:1}
.stars span{opacity:.25;filter:grayscale(1);transform:scale(.7)}
.stars span.on{opacity:1;filter:none;animation:bintang .6s both}
@keyframes bintang{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
.conf{position:fixed;top:-20px;width:10px;height:14px;border-radius:2px;animation:jatuh linear forwards;pointer-events:none}
@keyframes jatuh{to{transform:translateY(110vh) rotate(540deg)}}
/* bonus */
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
      <h1>Pola Ajaib</h1>
      <div class="panel" style="max-width:340px;margin:0 auto;width:100%"><div id="introGambar" style="display:flex;justify-content:center"></div></div>
      <p class="say">Ayo temukan aturan yang tersembunyi di dalam pola!</p>
    </div>
    <div class="cta"><button class="big main" id="mulai">Mulai</button></div>
  </section>

  <!-- 1: gambar ke-n -->
  <section class="screen" id="s1">
    <p class="say">Cari kelompok yang berulang, lalu susun sampai gambar yang dicari.</p>
    <div class="dots" id="s1dots"></div>
    <div class="besar" id="s1soal"></div>
    <div class="panel"><div class="strip" id="s1strip"></div><div class="rg" id="s1grid"></div></div>
    <div class="bagi" id="s1bagi"></div>
    <div class="tanya" id="s1tanya"></div>
    <div class="aksi" id="s1aksi"></div>
    <div class="msg" id="s1msg"></div>
    <div class="cta"><button class="big main" id="s1next" disabled>Lanjut</button></div>
  </section>

  <!-- 2: selisih -->
  <section class="screen" id="s2">
    <p class="say">Ketuk celah di antara bilangan untuk melihat selisihnya.</p>
    <div class="dots" id="s2dots"></div>
    <div class="panel"><div class="sel" id="s2pol"></div></div>
    <div class="aturan" id="s2aturan"></div>
    <div class="tanya" id="s2tanya"></div>
    <div class="aksi" id="s2aksi"></div>
    <div class="msg" id="s2msg"></div>
    <div class="cta"><button class="big main" id="s2next" disabled>Lanjut</button></div>
  </section>

  <!-- 3: suku ke-n -->
  <section class="screen" id="s3">
    <p class="say">Cari suku ke-n tanpa menulis semuanya.</p>
    <div class="dots" id="s3dots"></div>
    <div class="besar" id="s3soal"></div>
    <div class="panel" style="display:flex;flex-direction:column;gap:10px;align-items:center"><div id="s3tabel" style="max-width:100%;overflow-x:auto"></div><div class="rantai" id="s3rantai"></div></div>
    <div class="tanya" id="s3tanya"></div>
    <div class="aksi pil3" id="s3aksi"></div>
    <div class="msg" id="s3msg"></div>
    <div class="cta"><button class="big main" id="s3next" disabled>Lanjut</button></div>
  </section>

  <!-- 4: cerita pola -->
  <section class="screen" id="s4">
    <p class="say">Cerita pola: lihat diagramnya tumbuh.</p>
    <div class="dots" id="s4dots"></div>
    <div class="cer" id="s4cerita"></div>
    <div class="panel"><div class="chart" id="s4chart"></div></div>
    <div class="tanya" id="s4tanya"></div>
    <div class="aksi" id="s4aksi"></div>
    <div class="msg" id="s4msg"></div>
    <div class="cta"><button class="big main" id="s4next" disabled>Lanjut</button></div>
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
      <button class="big soft" id="keBonus">Coba Bonus: buat polamu</button>
      <button class="big soft" id="ulang">Main lagi</button>
    </div>
  </section>

  <!-- bonus -->
  <section class="screen" id="bonus">
    <p class="say">Bonus: tentukan bilangan awal dan selisihnya.</p>
    <div class="panel"><div id="bGambar" style="display:flex;justify-content:center"></div></div>
    <label class="sub" for="bA">Bilangan awal</label>
    <input type="range" id="bA" min="1" max="60" value="6">
    <label class="sub" for="bD">Selisih tiap langkah (boleh minus)</label>
    <input type="range" id="bD" min="-12" max="15" value="7">
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
var MIN='−',KALI='×';
function tandaSel(d){return d>=0?'+'+d:MIN+(-d)}

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
  if(id==='s2')mulaiS2();
  if(id==='s3')mulaiS3();
  if(id==='s4')mulaiS4();
  if(id==='akhir')tampilAkhir();
  if(id==='bonus')mulaiBonus();
  if(id==='intro')setKata('Ayo temukan aturan yang tersembunyi di dalam pola!');
}
$('back').onclick=function(){var k=urut.indexOf(cur);if(k>0)show(urut[k-1])};
$('mulai').onclick=function(){show('s1')};
setKata('Ayo temukan aturan yang tersembunyi di dalam pola!');

/* ---- stasiun 1: gambar ke-n lewat kelompok yang berulang ---- */
var T1=[
  {u:['lingkaran','lingkaran','segitiga'],n:9},
  {u:['bintang','bintang','hati','awan'],n:15},
  {u:['matahari','bulan','bulan'],n:11},
  {u:['bunga','bunga','daun','daun','matahari'],n:25}
];
var r1=0,fase1=0,baris1=0;
function sel1(tok,kls){var c=el('div','c'+(kls?' '+kls:''));c.appendChild(tokenNode(tok));return c}
function mulaiS1(){r1=0;ronde1()}
function ronde1(){
  var d=T1[r1];fase1=0;baris1=0;titik('s1dots',T1.length,r1);
  var so=$('s1soal');clear(so);so.appendChild(document.createTextNode('Gambar ke-'));so.appendChild(el('b',null,String(d.n)));so.appendChild(document.createTextNode(' adalah...'));
  var st=$('s1strip');clear(st);
  for(var i=0;i<d.u.length*2;i++)st.appendChild(sel1(d.u[i%d.u.length]));
  st.appendChild(el('span','titiktiga','...'));
  clear($('s1grid'));$('s1bagi').textContent='';$('s1next').disabled=true;
  msg('s1msg','','Lihat dulu: gambar apa yang berulang?');
  tanya1();
}
function gambarGrid(sorotN){
  var d=T1[r1],k=d.u.length,g=$('s1grid');clear(g);
  g.style.gridTemplateColumns='repeat('+k+',38px)';
  for(var b=0;b<baris1;b++)for(var j=0;j<k;j++){
    var no=b*k+j+1,c=sel1(d.u[j],(b===baris1-1&&!sorotN?'baru':'')+(sorotN&&no===d.n?' sorot':''));
    c.appendChild(el('span','no',String(no)));g.appendChild(c);
  }
}
function tanya1(){
  var d=T1[r1],k=d.u.length,w=$('s1aksi'),T=$('s1tanya');clear(w);w.className='aksi';
  if(fase1===0){
    T.textContent='Berapa gambar dalam satu kelompok yang berulang?';setKata(T.textContent);w.className='aksi pil3';
    shuffle([k-1,k,k+1]).forEach(function(x){
      var b=tombol(w,String(x),function(){
        if(x===k){b.classList.add('right');fase1=1;var t='Betul! Satu kelompok ada '+k+' gambar. Sekarang susun kelompok demi kelompok.';msg('s1msg','good',t);setKata(t);later(tanya1,900)}
        else{b.classList.add('wrong');var t2='Hampir! Cari bagian terkecil yang diulang-ulang.';msg('s1msg','warn',t2);setKata(t2)}
      });
    });
  }else if(fase1===1){
    T.textContent='Susun kelompok sampai gambar ke-'+d.n+' muncul.';setKata(T.textContent);
    tombol(w,'Susun 1 kelompok',function(){
      if(fase1!==1)return;
      baris1++;gambarGrid(false);
      var tot=baris1*k;
      if(tot>=d.n){
        fase1=2;gambarGrid(true);
        var q=Math.floor(d.n/k),r=d.n%k;
        $('s1bagi').textContent=d.n+' : '+k+' = '+q+(r?' sisa '+r:' (habis)');
        var t='Gambar ke-'+d.n+' sudah muncul! Lihat posisinya dalam kelompok.';msg('s1msg','good',t);setKata(t);later(tanya1,800);
      }else msg('s1msg','',baris1+' kelompok = '+tot+' gambar. Belum sampai gambar ke-'+d.n+'.');
    },'utama'+(baris1===0?' hint':''));
  }else{
    T.textContent='Gambar ke-'+d.n+' adalah...';setKata(T.textContent);
    var benar=d.u[(d.n-1)%k],pakai=[];
    d.u.forEach(function(x){if(pakai.indexOf(x)<0)pakai.push(x)});
    shuffle(pakai).forEach(function(tok){
      var b=el('button');b.setAttribute('aria-label',tok);b.appendChild(tokenNode(tok));
      b.onclick=function(){
        if(tok===benar){
          b.classList.add('right');clear(w);T.textContent='';
          var q=Math.floor(d.n/k),r=d.n%k;
          var t=r?d.n+' = '+q+' kelompok + '+r+'. Jadi gambar ke-'+d.n+' sama dengan gambar ke-'+r+' dalam kelompok.':d.n+' = '+q+' kelompok penuh. Jadi gambar ke-'+d.n+' adalah gambar terakhir dalam kelompok.';
          msg('s1msg','good',t);setKata(t);$('s1next').disabled=false;
        }else{b.classList.add('wrong');var t2='Hampir! Lihat kolom yang bersinar di diagram.';msg('s1msg','warn',t2);setKata(t2)}
      };
      w.appendChild(b);
    });
  }
}
$('s1next').onclick=function(){if(r1<T1.length-1){r1++;ronde1()}else show('s2')};

/* ---- stasiun 2: selisih antar bilangan ---- */
var T2=[
  {s:[14,21,28,35,42],h:3,aturan:'bertambah 7 setiap langkah',opsi:['bertambah 7 setiap langkah','bertambah 6 setiap langkah','dikali 2'],salah:[34,36]},
  {s:[90,78,66,54,42],h:3,aturan:'berkurang 12 setiap langkah',opsi:['berkurang 12 setiap langkah','berkurang 10 setiap langkah','dibagi 2'],salah:[56,52]},
  {s:[5,9,6,10,7,11,8,12],h:7,aturan:'bergantian +4 lalu '+MIN+'3',opsi:['bergantian +4 lalu '+MIN+'3','bertambah 4 terus','bergantian +4 lalu +3'],salah:[11,13]},
  {s:[2,4,7,11,16,22],h:5,aturan:'selisihnya bertambah 1 setiap langkah',opsi:['selisihnya bertambah 1 setiap langkah','bertambah 2 terus','dikali 2'],salah:[21,20]}
];
var r2=0,fase2=0,buka2=0,muncul2=[];
function mulaiS2(){r2=0;ronde2()}
function gambarPola2(isiHilang){
  var d=T2[r2],w=$('s2pol');clear(w);
  d.s.forEach(function(v,i){
    if(i>0){
      var bisa=(i-1!==d.h&&i!==d.h);
      var g=el('button','g'+(bisa&&!muncul2[i]&&r2===0&&i===1?' hint':''),!bisa?'·':muncul2[i]?tandaSel(d.s[i]-d.s[i-1]):'?');
      g.setAttribute('aria-label','selisih');
      if(!bisa)g.disabled=true;
      else if(muncul2[i])g.classList.add('buka');
      else g.onclick=(function(i){return function(){bukaCelah(i)}})(i);
      w.appendChild(g);
    }
    var hilang=i===d.h;
    w.appendChild(el('div','c'+(hilang?(isiHilang?' ok':' q'):''),hilang&&!isiHilang?'?':String(v)));
  });
}
function bukaCelah(i){
  var d=T2[r2];
  if(muncul2[i])return;
  muncul2[i]=true;buka2++;gambarPola2(false);
  var bisa=0;for(var k=1;k<d.s.length;k++)if(k-1!==d.h&&k!==d.h)bisa++;
  if(buka2>=bisa){
    fase2=1;var t='Semua selisih terlihat. Perhatikan: apakah selalu sama?';msg('s2msg','good',t);setKata(t);later(tanya2,900);
  }else msg('s2msg','',buka2+' selisih terlihat. Ketuk celah yang lain.');
}
function ronde2(){
  fase2=0;buka2=0;muncul2=[];titik('s2dots',T2.length,r2);
  gambarPola2(false);$('s2aturan').textContent='';$('s2tanya').textContent='';clear($('s2aksi'));$('s2next').disabled=true;
  msg('s2msg','','Ketuk celah yang berdenyut atau celah lain. Celah dekat "?" belum bisa dihitung.');
  setKata('Ketuk celah di antara bilangan untuk melihat selisihnya.');
}
function tanya2(){
  var d=T2[r2],w=$('s2aksi'),T=$('s2tanya');clear(w);w.className='aksi';
  if(fase2===1){
    T.textContent='Apa aturan polanya?';setKata(T.textContent);
    shuffle(d.opsi).forEach(function(o){
      var b=tombol(w,o,function(){
        if(o===d.aturan){
          b.classList.add('right');fase2=2;$('s2aturan').textContent='Aturan: '+d.aturan;
          var t='Betul! '+d.aturan+'. Sekarang isi bilangan yang hilang.';msg('s2msg','good',t);setKata(t);later(tanya2,900);
        }else{b.classList.add('wrong');var t2='Hampir! Lihat lagi selisih-selisih yang tadi muncul.';msg('s2msg','warn',t2);setKata(t2)}
      });
    });
  }else{
    w.className='aksi pil3';T.textContent='Bilangan yang hilang adalah...';setKata(T.textContent);
    var ans=d.s[d.h];
    shuffle([ans].concat(d.salah)).forEach(function(v){
      var b=tombol(w,String(v),function(){
        if(v===ans){
          b.classList.add('right');fase2=3;gambarPola2(true);clear(w);T.textContent='';
          var t='Betul! Bilangan yang hilang '+ans+'. Aturannya: '+d.aturan+'.';msg('s2msg','good',t);setKata(t);$('s2next').disabled=false;
        }else{b.classList.add('wrong');var t2='Hampir! Terapkan aturan pada bilangan sebelum tanda tanya.';msg('s2msg','warn',t2);setKata(t2)}
      });
    });
  }
}
$('s2next').onclick=function(){if(r2<T2.length-1){r2++;ronde2()}else show('s3')};

/* ---- stasiun 3: suku ke-n ---- */
var T3=[{a:4,d:3,n:9},{a:6,d:7,n:6},{a:3,d:4,n:9},{a:100,d:-6,n:7}];
var r3=0,fase3=0;
function mulaiS3(){r3=0;ronde3()}
function ronde3(){
  var d=T3[r3];fase3=0;titik('s3dots',T3.length,r3);
  var so=$('s3soal');clear(so);so.appendChild(document.createTextNode('Suku ke-'));so.appendChild(el('b',null,String(d.n)));so.appendChild(document.createTextNode(' dari pola ini?'));
  var pos=['posisi',1,2,3,4,d.n],nil=['nilai'];for(var i=0;i<4;i++)nil.push(d.a+i*d.d);nil.push('?');
  var t=$('s3tabel');clear(t);t.appendChild(GBR.tabel({baris:[pos,nil]}));
  clear($('s3rantai'));$('s3next').disabled=true;
  msg('s3msg','','Dari suku pertama, selisih ditambahkan beberapa kali?');
  tanya3();
}
function tanya3(){
  var d=T3[r3],w=$('s3aksi'),T=$('s3tanya'),ans=d.a+(d.n-1)*d.d;clear(w);
  if(fase3===0){
    T.textContent='Dari suku ke-1 sampai suku ke-'+d.n+', selisih ditambahkan berapa kali?';setKata(T.textContent);
    shuffle([d.n-1,d.n,d.n+1]).forEach(function(x){
      var b=tombol(w,String(x),function(){
        if(x===d.n-1){b.classList.add('right');fase3=1;var t='Betul! Suku ke-1 sudah ada, jadi tinggal '+(d.n-1)+' langkah lagi.';msg('s3msg','good',t);setKata(t);later(tanya3,900)}
        else{b.classList.add('wrong');var t2='Hampir! Suku pertama sudah diketahui, tidak perlu ditambah.';msg('s3msg','warn',t2);setKata(t2)}
      });
    });
  }else{
    T.textContent='Berapa nilai suku ke-'+d.n+'?';setKata(T.textContent);
    var daftar=[ans];[d.a+d.n*d.d,ans-d.d,ans+d.d].forEach(function(x){if(daftar.length<3&&daftar.indexOf(x)<0)daftar.push(x)});
    shuffle(daftar).forEach(function(v){
      var b=tombol(w,String(v),function(){
        if(v===ans){
          b.classList.add('right');clear(w);T.textContent='';
          var t=d.a+' + '+(d.n-1)+' '+KALI+' '+(d.d>=0?d.d:'('+d.d+')')+' = '+ans+'. Kita periksa dengan melompat!';msg('s3msg','good',t);setKata('Betul! Suku ke-'+d.n+' adalah '+ans);
          lompat3(d);
        }else{b.classList.add('wrong');var t2='Hampir! Hitung: bilangan awal + (n '+MIN+' 1) '+KALI+' selisih.';msg('s3msg','warn',t2);setKata(t2)}
      });
    });
  }
}
function lompat3(d){
  var rt=$('s3rantai');clear(rt);var nilai=d.a;
  rt.appendChild(el('span',null,String(nilai)));
  for(var i=1;i<d.n;i++){(function(i){later(function(){
    nilai+=d.d;rt.appendChild(el('span',null,'→'));rt.appendChild(el('span',i===d.n-1?'akhir':null,String(nilai)));
    if(i===d.n-1){$('s3next').disabled=false}
  },i*220)})(i)}
}
$('s3next').onclick=function(){if(r3<T3.length-1){r3++;ronde3()}else show('s4')};

/* ---- stasiun 4: cerita pola dengan diagram batang ---- */
var T4=[
  {c:'Rina menabung setiap minggu. Minggu 1: Rp8.000, minggu 2: Rp16.000, minggu 3: Rp24.000. Berapa tabungan Rina pada minggu ke-5?',lab:['Mg 1','Mg 2','Mg 3','Mg 4','Mg 5'],v:[8,16,24,32,40],awal:3,beda:'Rp8.000',salahBeda:['Rp6.000','Rp16.000'],fmt:function(x){return 'Rp'+x+'.000'},salah:['Rp48.000','Rp32.000']},
  {c:'Sebuah gedung parkir menambah 4 mobil setiap 10 menit. Pada menit ke-0 ada 12 mobil. Berapa mobil pada menit ke-30?',lab:['0 mnt','10 mnt','20 mnt','30 mnt'],v:[12,16,20,24],awal:1,beda:'4 mobil',salahBeda:['10 mobil','12 mobil'],fmt:function(x){return x+' mobil'},salah:['28 mobil','36 mobil']},
  {c:'Air di sebuah kolam naik 5 cm setiap jam. Pada jam ke-0 tinggi airnya 20 cm. Berapa tinggi air pada jam ke-4?',lab:['0 jam','1 jam','2 jam','3 jam','4 jam'],v:[20,25,30,35,40],awal:1,beda:'5 cm',salahBeda:['4 cm','20 cm'],fmt:function(x){return x+' cm'},salah:['45 cm','35 cm']}
];
var r4=0,fase4=0,tampil4=0;
function mulaiS4(){r4=0;ronde4()}
function gambarChart(baru){
  var d=T4[r4],c=$('s4chart');clear(c);var maks=d.v[d.v.length-1];
  for(var i=0;i<tampil4;i++){
    var k=el('div','k'+(baru===i?' baru':''));
    k.appendChild(el('div','v',String(d.v[i])));
    var b=el('div','b');b.style.height=Math.round(d.v[i]/maks*100)+'px';k.appendChild(b);
    k.appendChild(el('div','l',d.lab[i]));c.appendChild(k);
  }
}
function ronde4(){
  var d=T4[r4];fase4=0;tampil4=d.awal;titik('s4dots',T4.length,r4);
  $('s4cerita').textContent=d.c;setKata(d.c);gambarChart(-1);
  $('s4next').disabled=true;msg('s4msg','','Lihat diagram. Apa yang bertambah tiap langkah?');
  tanya4();
}
function tanya4(){
  var d=T4[r4],w=$('s4aksi'),T=$('s4tanya');clear(w);w.className='aksi';
  if(fase4===0){
    T.textContent='Berapa pertambahan tiap langkah?';w.className='aksi pil3';
    shuffle([d.beda].concat(d.salahBeda)).forEach(function(x){
      var b=tombol(w,x,function(){
        if(x===d.beda){b.classList.add('right');fase4=1;var t='Betul! Tiap langkah bertambah '+d.beda+'. Sekarang lanjutkan diagramnya.';msg('s4msg','good',t);setKata(t);later(tanya4,900)}
        else{b.classList.add('wrong');var t2='Hampir! Bandingkan dua batang yang bersebelahan.';msg('s4msg','warn',t2);setKata(t2)}
      });
    });
  }else if(fase4===1){
    T.textContent='Tambahkan satu langkah sampai akhir.';
    tombol(w,'Langkah berikutnya',function(){
      if(tampil4<d.v.length){
        tampil4++;gambarChart(tampil4-1);
        if(tampil4===d.v.length){fase4=2;var t='Diagram selesai! Sekarang jawab pertanyaannya.';msg('s4msg','good',t);setKata(t);later(tanya4,800)}
        else msg('s4msg','','Bertambah '+d.beda+': '+d.fmt(d.v[tampil4-1])+'.');
      }
    },'utama hint');
  }else{
    w.className='aksi pil3';T.textContent='Jawabannya...';
    var ans=d.fmt(d.v[d.v.length-1]);
    shuffle([ans].concat(d.salah)).forEach(function(x){
      var b=tombol(w,x,function(){
        if(x===ans){b.classList.add('right');clear(w);T.textContent='';var t='Betul! '+ans+'.';msg('s4msg','good',t);setKata(t);$('s4next').disabled=false}
        else{b.classList.add('wrong');var t2='Hampir! Lihat batang yang paling kanan.';msg('s4msg','warn',t2);setKata(t2)}
      });
    });
  }
}
$('s4next').onclick=function(){if(r4<T4.length-1){r4++;ronde4()}else show('f1')};

/* ---- akhir: bintang dan perayaan ---- */
function tampilAkhir(){
  var n=benar>=4?3:benar>=2?2:1;
  var sp=$('bintang').children;
  for(var i=0;i<sp.length;i++){sp[i].classList.remove('on');(function(i){later(function(){if(i<n)sp[i].classList.add('on')},300+i*350)})(i)}
  var judul=n===3?'Hebat sekali!':n===2?'Bagus!':'Kamu sudah mencoba!';
  var teks=n===3?'Kamu pandai menemukan aturan pola.':n===2?'Sedikit lagi, kamu pasti bisa.':'Ayo berlatih supaya makin jago.';
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
$('berlatih').onclick=function(){try{window.parent.postMessage({type:'ayo-berlatih',topik:'AC-12'},'*')}catch(e){}};
$('keBonus').onclick=function(){show('bonus')};
$('ulang').onclick=function(){show('s1')};
(function(){$('introGambar').appendChild(GBR.pola({s:['bintang','bintang','hati','awan','bintang','bintang','hati','awan'],hilang:[],kol:8}))})();

/* ---- bonus: buat polamu ---- */
function renderBonus(){
  var a=+$('bA').value,d=+$('bD').value,s=[];
  for(var i=0;i<6;i++)s.push(String(a+i*d));
  var g=$('bGambar');clear(g);g.appendChild(GBR.pola({s:s,hilang:[],kol:6}));
  var s10=a+9*d,t=d===0?'Selisih 0: semua bilangan sama.':'Selisih '+tandaSel(d)+'. Suku ke-10 = '+a+' + 9 '+KALI+' '+(d>=0?d:'('+d+')')+' = '+s10+'.';
  if(d<0){var habis=Math.floor(a/(-d));t+=' Pola menurun: setelah '+habis+' langkah bilangannya hampir habis, dan lama-lama jadi 0, lalu di bawah 0.'}
  msg('bmsg',d===0?'':'good',t);setKata(t);
}
function mulaiBonus(){renderBonus()}
$('bA').oninput=renderBonus;$('bD').oninput=renderBonus;
$('bonusSelesai').onclick=function(){show('akhir')};
})();
</script>
</body>
</html>`

export const HTML_AC12 = rakit(DASAR, { kode: 'AC-12', data: DATA_AC12 })
