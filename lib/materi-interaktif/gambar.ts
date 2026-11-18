/**
 * Pustaka gambar untuk bahan latihan (stasiun mesin di `bersama.ts`).
 *
 * KENAPA ADA. Bahan latihan yang berupa teks saja terasa seperti ujian dan
 * menyulitkan anak yang baru membaca. Setiap butir boleh membawa `g`: satu
 * gambar (atau daftar gambar) yang menjelaskan soalnya secara visual. Gambar
 * digambar lewat SVG/HTML oleh skrip di halaman, tanpa berkas gambar, mengikuti
 * warna dan mode gelap halaman.
 *
 * BENTUK. `g` adalah objek `{ k: 'jenis', ...parameter }`. Jenis yang ada ada di
 * `GBR` pada `JS_GAMBAR` di bawah; di sisi TypeScript, pembangun kecil (`ikat`,
 * `nilai`, `pola`, ...) menjaga bahan topik tetap ringkas dan terbaca.
 * Jenis yang tidak dikenal membuat halaman menampilkan galat di konsol dan
 * pengujian per-butir gagal, jadi salah ketik tidak lolos diam-diam.
 *
 * Aturan menulis berkas ini sama dengan berkas materi: JANGAN memakai backtick
 * atau "${" di dalam string JS/CSS (isinya `String.raw`).
 */

export type Gambar = { k: string; [parameter: string]: unknown }
export type GambarItem = Gambar | Gambar[]

/* ---------- pembangun untuk bahan topik ---------- */
export const ikat = (t: number, l: number, label?: string): Gambar => ({ k: 'ikat', t, l, ...(label ? { label } : {}) })
export const nilai = (n: number, d = 4, sorot?: number, ket = false): Gambar => ({ k: 'nilai', n, d, ...(sorot === undefined ? {} : { sorot }), ket })
export const baris = (b: { e: string; n: number; l: string }[], skala?: string): Gambar => ({ k: 'baris', baris: b, ...(skala ? { skala } : {}) })
export const pola = (s: string[], hilang: number[] = [], kol?: number): Gambar => ({ k: 'pola', s, hilang, ...(kol ? { kol } : {}) })
export const bangun = (b: string, w = 'biru', l?: string): Gambar => ({ k: 'bangun', b, w, ...(l ? { l } : {}) })
export const bangunDaftar = (daftar: { b: string; w?: string; l?: string }[]): Gambar => ({ k: 'bangun', daftar })
export const garis = (a: number, b: number, langkah: number, o: { lab?: number; titik?: { v: number; w?: string; l?: string }[]; busur?: { dari: number; ke: number; l?: string }[] } = {}): Gambar => ({ k: 'garis', a, b, langkah, ...o })
export const kerangka = (isi: number, luar = 0, k = 1): Gambar => ({ k: 'kerangka', isi, luar, kerangka: k })
export const gabung = (e: string, a: number, b: number, op: '+' | '-'): Gambar => ({ k: 'gabung', e, a, b, op })
export const pecahan = (daftar: { b: string; n: number; w: number[]; u?: 'besar' | 'kecil'; l?: string }[]): Gambar => ({ k: 'pecahan', daftar })
export const neraca = (kiri: string, kanan: string, turun: 'kiri' | 'kanan' | null, kiriL = '', kananL = ''): Gambar => ({ k: 'neraca', kiri, kanan, turun, kiriL, kananL })
export const batang = (b: { l: string; n: number; w?: string }[], satuan = '', sejajar = true): Gambar => ({ k: 'batang', baris: b, satuan, sejajar })
export const tali = (n: number, satuan = 'jengkal'): Gambar => ({ k: 'tali', n, satuan })
export const lomba = (b: { l: string; e?: string; m: number; s: number; w?: string }[]): Gambar => ({ k: 'lomba', baris: b })
export const hadap = (bola: 'rani' | 'dodi' | 'tengah' | null = null, n1 = 'Rani', n2 = 'Dodi'): Gambar => ({ k: 'hadap', bola, n1, n2 })
export const antri = (n: string[], samping = false): Gambar => ({ k: 'antri', n, samping })
export const meja = (atas: string, bawah: string): Gambar => ({ k: 'meja', atas, bawah })
export const dalam = (dalamE: string, luarE: string): Gambar => ({ k: 'dalam', dalam: dalamE, luar: luarE })
export const susun = (items: { l: string; w?: string }[], arah: 'tegak' | 'datar' = 'tegak'): Gambar => ({ k: 'susun', items, arah })
export const kartu = (d: number[]): Gambar => ({ k: 'kartu', d })
export const blok = (n: number, label?: string): Gambar => ({ k: 'blok', n, ...(label ? { label } : {}) })
/** Soal bersusun. `tanda`: catatan kecil di atas kolom (kol 0 = ribuan ... 3 = satuan), mis. simpanan "1" atau pinjaman "+10". */
export const kolom = (a: number, b: number, op: '+' | '-', o: { hasil?: number; tanda?: { kol: number; teks: string }[]; sorot?: number } = {}): Gambar => ({ k: 'kolom', a, b, op, ...o })
/** Larik titik r baris x c kolom (perkalian). `sorot`: banyak baris pertama yang dinyalakan. */
export const larik = (r: number, c: number, sorot?: number): Gambar => ({ k: 'larik', r, c, ...(sorot === undefined ? {} : { sorot }) })
/** k kelompok (piring) masing-masing n benda; `plus` menulis tanda + di antaranya; `sisa` benda yang tidak kebagian. */
export const kelompok = (e: string, k: number, n: number, o: { sisa?: number; plus?: boolean } = {}): Gambar => ({ k: 'kelompok', e, jumlah: k, n, ...o })
/** Timbangan seimbang untuk kalimat dengan kotak: k kantong "?", p butir tambahan, m butir yang dikurangkan di kiri; n butir di kanan. */
export const timbang = (k: number, p: number, m: number, n: number): Gambar => ({ k: 'timbang', kantong: k, plus: p, minus: m, kanan: n })
/** Tabel mendatar: tiap baris diawali label, mis. posisi dan nilai suku pola. */
export const tabel = (baris: (string | number)[][]): Gambar => ({ k: 'tabel', baris })
export const bar = (bagian: { l: string; v: number; w?: string }[], atas?: string): Gambar => ({ k: 'bar', bagian, ...(atas ? { atas } : {}) })

export const CSS_GAMBAR = String.raw`
/* pustaka gambar bahan latihan (awalan mq-) */
.mq-gambar{display:flex;flex-direction:column;gap:10px;align-items:center;background:var(--card);border:2px solid var(--line);border-radius:20px;padding:12px;color:var(--ink)}
.mq-gambar:empty{display:none}
.mq-gambar>*{max-width:100%}
.mq-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;align-items:flex-end}
.mq-kolom{display:flex;flex-direction:column;align-items:center;gap:4px}
.mq-cap{font-family:var(--display);font-weight:800;font-size:1rem;text-align:center}
.mq-skala{font-family:var(--display);font-weight:800;font-size:1.05rem;background:var(--soft);border:2px dashed var(--lidi);border-radius:12px;padding:2px 12px;align-self:center}
.mq-baris{display:flex;flex-direction:column;gap:2px;width:100%}
.mq-br{display:flex;align-items:center;gap:8px;border-bottom:2px dashed var(--line);padding:3px 0;min-height:46px}
.mq-bl{font-family:var(--display);font-weight:800;font-size:1.05rem;width:5.2em;flex:none}
.mq-bi{display:flex;flex-wrap:wrap;gap:3px;font-size:1.7rem;line-height:1.1;flex:1}
.mq-bn{font-family:var(--display);font-weight:800;color:var(--muted);flex:none}
.mq-pola{display:grid;gap:5px;justify-content:center;width:100%}
.mq-pc{aspect-ratio:1;min-width:0;border-radius:12px;border:2px solid var(--line);background:var(--card);display:flex;align-items:center;justify-content:center;font-size:1.7rem;line-height:1}
.mq-pc svg{width:100%;height:100%}
.mq-pc .angka{font-family:var(--display);font-weight:800;font-size:1.15rem;line-height:1}
.mq-pc.q{border:2px dashed var(--ikat);background:var(--soft);font-family:var(--display);font-weight:800}
.mq-nilai{display:flex;gap:6px;justify-content:center}
.mq-nk{display:flex;flex-direction:column;align-items:center;gap:3px;border:2px solid var(--line);border-radius:14px;padding:6px 4px;min-width:64px;background:var(--card)}
.mq-nk .nm{font-size:.78rem;font-family:var(--display);font-weight:800;color:#fff;border-radius:99px;padding:0 7px}
.mq-nk .dg{font-family:var(--display);font-weight:800;font-size:2.4rem;line-height:1;font-variant-numeric:tabular-nums}
.mq-nk .vl{font-size:.8rem;color:var(--muted);font-variant-numeric:tabular-nums}
.mq-nk.sorot{border-color:var(--ikat);background:var(--soft);box-shadow:0 0 0 3px rgba(217,79,61,.25)}
.mq-gab{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;font-size:1.7rem;line-height:1.15}
.mq-gab .grup{display:flex;flex-wrap:wrap;gap:2px;max-width:230px;justify-content:center}
.mq-gab .op{font-family:var(--display);font-weight:800;font-size:2rem;color:var(--ikat)}
.mq-gab .coret{opacity:.28;filter:grayscale(1);position:relative}
.mq-kartu{display:flex;gap:10px;justify-content:center}
.mq-kartu span{width:58px;height:74px;border:3px solid var(--ink);border-radius:12px;background:var(--soft);font-family:var(--display);font-weight:800;font-size:2.2rem;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 var(--ink)}
.mq-lomba{display:flex;flex-direction:column;gap:8px;width:100%}
.mq-lr{display:grid;grid-template-columns:5.6em 1fr;gap:8px;align-items:center}
.mq-lr .lb{font-family:var(--display);font-weight:800;font-size:1.05rem}
.mq-lr .tr{position:relative;height:22px;border-radius:99px;background:var(--line)}
.mq-lr .tr i{position:absolute;top:0;bottom:0;border-radius:99px;border:2px solid var(--ink)}
.mq-blok{display:flex;gap:16px;align-items:flex-end;justify-content:center;flex-wrap:wrap}
.mq-bg{display:flex;flex-direction:column;align-items:center;gap:4px}
.mq-bg .isi{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;max-width:116px;min-height:16px}
.mq-bg .r .b{width:30px;height:30px;background:#4a7bd0;border:2px solid currentColor;border-radius:5px}
.mq-bg .p .b{width:10px;height:34px;background:#2e9a63;border:2px solid currentColor;border-radius:3px}
.mq-bg .s .b{width:11px;height:11px;background:#e0a93b;border:2px solid currentColor;border-radius:3px}
.mq-bg .cap{font-size:.82rem;color:var(--muted);font-weight:800}
.mq-kol{display:grid;grid-template-columns:34px repeat(4,46px);gap:2px 4px;font-family:var(--display);font-weight:800;font-size:2.2rem;line-height:1.15;font-variant-numeric:tabular-nums;justify-items:center;align-items:center}
.mq-kol .c{width:100%;text-align:center;border-radius:8px}
.mq-kol .c.sorot{background:var(--soft);box-shadow:0 0 0 2px var(--lidi)}
.mq-kol .t{font-size:1.1rem;color:var(--ikat);min-height:1.3em;animation:kedip 1.6s ease-in-out infinite}
.mq-kol .op{font-size:2rem;color:var(--ikat)}
.mq-kol .gr{grid-column:1 / -1;width:100%;border-top:4px solid var(--ink);border-radius:2px;margin:2px 0}
.mq-kol .q{color:var(--ikat)}
.mq-gambar>*{animation:masukG .4s ease-out}
@keyframes masukG{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
@keyframes kedip{50%{transform:translateY(-3px);opacity:.55}}
.mq-larik{display:grid;gap:4px;justify-content:center}
.mq-larik .dt{width:100%;aspect-ratio:1;border-radius:50%;border:2px solid var(--ink);background:var(--ikat)}
.mq-larik .dt.b{background:var(--rb,#4a7bd0)}
.mq-larik .dt.mati{background:var(--line)}
.mq-kel{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center}
.mq-kel .plus{font-family:var(--display);font-weight:800;font-size:1.6rem;color:var(--ikat)}
.mq-kel .piring{min-width:60px;min-height:60px;max-width:96px;border-radius:50%;border:3px solid var(--ink);background:var(--soft);display:flex;flex-wrap:wrap;gap:1px;justify-content:center;align-content:center;font-size:1.1rem;line-height:1.1;padding:5px}
.mq-kel .piring b{font-family:var(--display);font-size:1.5rem}
.mq-kel .sisa{min-width:60px;min-height:60px;border-radius:16px;border:3px dashed var(--ikat);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:1.1rem;padding:4px 8px}
.mq-kel .sisa small{color:var(--ikat);font-weight:800}
.mq-tabel{border-collapse:collapse;font-family:var(--display);font-weight:800;font-size:1.15rem;font-variant-numeric:tabular-nums}
.mq-tabel td{border:2px solid var(--ink);padding:4px 10px;text-align:center;min-width:2.2em}
.mq-tabel td:first-child{background:var(--soft);text-align:left}
.mq-tabel td.q{color:var(--ikat)}
.mq-lr .sk{grid-column:2;display:flex;justify-content:space-between;font-size:.8rem;color:var(--muted);margin-top:-4px}
`

export const JS_GAMBAR = String.raw`
/* ---- pustaka gambar bahan latihan (GBR) ---- */
var NSG='http://www.w3.org/2000/svg';
var PL={merah:'#d94f3d',biru:'#4a7bd0',hijau:'#2e9a63',kuning:'#e0a93b',ungu:'#c75ba0',abu:'#9b95ab',roti:'#f4d79a',oranye:'#ef8a3c'};
function sg(tag,a,p){var e=document.createElementNS(NSG,tag);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function kanvas(w,h,maks){var s=sg('svg',{viewBox:'0 0 '+w+' '+h,'aria-hidden':'true'});s.style.width='100%';s.style.maxWidth=(maks||w*1.5)+'px';s.style.height='auto';s.style.display='block';s.style.margin='0 auto';return s}
function tks(p,x,y,t,o){o=o||{};var e=sg('text',{x:x,y:y,'text-anchor':o.a||'middle','font-size':o.s||12,'font-weight':800,fill:o.c||'currentColor'},p);e.textContent=t;return e}
function garisan(e,w){e.setAttribute('stroke','currentColor');e.setAttribute('stroke-width',w||3);e.setAttribute('stroke-linejoin','round');e.setAttribute('stroke-linecap','round');return e}
function titikRibu(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
var GBR={};

/* deretan emoji dengan nama; dipakai piktogram dan hitungan */
GBR.baris=function(g){
  var w=el('div','mq-baris');
  if(g.skala)w.appendChild(el('div','mq-skala',g.skala));
  g.baris.forEach(function(b){
    var r=el('div','mq-br');r.appendChild(el('span','mq-bl',b.l));
    var ic=el('span','mq-bi');for(var i=0;i<b.n;i++)ic.appendChild(el('span',null,b.e));
    r.appendChild(ic);w.appendChild(r);
  });
  return w;
};

/* ikatan sepuluh dan satuan lepas */
GBR.ikat=function(g){
  var t=g.t||0,l=g.l||0,W=320,x=8,y=6,H=64,items=[],i;
  for(i=0;i<t;i++)items.push(46);
  for(i=0;i<l;i++)items.push(10);
  var pos=[];
  items.forEach(function(w,k){if(x+w>W-8){x=8;y+=H+6}pos.push([x,y,k<t]);x+=w+(w>20?8:4)});
  var s=kanvas(W,y+H+6,360);
  pos.forEach(function(p){
    if(p[2]){
      for(var j=0;j<10;j++)sg('rect',{x:p[0]+j*4.2,y:p[1],width:3.2,height:H-8,rx:1.6,fill:'#e0a93b',stroke:'#b97f12','stroke-width':.6},s);
      sg('rect',{x:p[0]-2,y:p[1]+(H-8)/2-6,width:46,height:12,rx:6,fill:'#d94f3d',stroke:'currentColor','stroke-width':1.5},s);
    }else sg('rect',{x:p[0],y:p[1],width:3.2,height:H-8,rx:1.6,fill:'#e0a93b',stroke:'#b97f12','stroke-width':.6},s);
  });
  var c=el('div','mq-kolom');c.appendChild(s);
  if(g.label)c.appendChild(el('div','mq-cap',g.label));
  return c;
};

/* kolom nilai tempat; sorot = indeks kolom dari kiri yang ditandai */
GBR.nilai=function(g){
  var d=g.d||4,nama=['Puluh ribuan','Ribuan','Ratusan','Puluhan','Satuan'].slice(5-d),war=['#7a5bd0','#4a7bd0','#d94f3d','#2e9a63','#c78a12'].slice(5-d);
  var s=String(g.n),pad=new Array(d-s.length+1).join(' ')+s;
  var w=el('div','mq-nilai');
  for(var i=0;i<d;i++){
    var ch=pad.charAt(i),k=el('div','mq-nk'+(g.sorot===i?' sorot':''));
    var nm=el('span','nm',nama[i]);nm.style.background=war[i];k.appendChild(nm);
    k.appendChild(el('span','dg',ch===' '?'':ch));
    if(g.ket&&ch!==' ')k.appendChild(el('span','vl',titikRibu(+ch*Math.pow(10,d-1-i))));
    w.appendChild(k);
  }
  return w;
};

/* bangun datar dan bangun ruang */
function bangunSvg(b,warna){
  var s=sg('svg',{viewBox:'0 0 120 120','aria-hidden':'true'}),c=PL[warna]||PL.biru;
  function poli(pts,fill,ov,op){garisan(sg('polygon',{points:pts,fill:fill},s));if(ov)sg('polygon',{points:pts,fill:ov,'fill-opacity':op},s)}
  if(b==='lingkaran')garisan(sg('circle',{cx:60,cy:60,r:48,fill:c},s));
  else if(b==='persegi')garisan(sg('rect',{x:16,y:16,width:88,height:88,rx:4,fill:c},s));
  else if(b==='persegi panjang')garisan(sg('rect',{x:6,y:32,width:108,height:56,rx:4,fill:c},s));
  else if(b==='segitiga')poli('60,12 112,104 8,104',c);
  else if(b==='bola'){garisan(sg('circle',{cx:60,cy:60,r:46,fill:c},s));sg('ellipse',{cx:44,cy:42,rx:13,ry:8,fill:'#fff','fill-opacity':.45,transform:'rotate(-35 44 42)'},s)}
  else if(b==='kubus'){poli('22,44 80,44 80,104 22,104',c);poli('22,44 44,22 102,22 80,44',c,'#fff',.4);poli('80,44 102,22 102,82 80,104',c,'#000',.25)}
  else if(b==='balok'){poli('8,50 84,50 84,100 8,100',c);poli('8,50 30,26 106,26 84,50',c,'#fff',.4);poli('84,50 106,26 106,76 84,100',c,'#000',.25)}
  else if(b==='tabung'){
    garisan(sg('ellipse',{cx:60,cy:94,rx:30,ry:11,fill:c},s));sg('rect',{x:30,y:30,width:60,height:64,fill:c},s);
    garisan(sg('line',{x1:30,y1:30,x2:30,y2:94},s));garisan(sg('line',{x1:90,y1:30,x2:90,y2:94},s));
    garisan(sg('ellipse',{cx:60,cy:30,rx:30,ry:11,fill:c},s));sg('ellipse',{cx:60,cy:30,rx:30,ry:11,fill:'#fff','fill-opacity':.4},s);
  }else if(b==='kerucut'){garisan(sg('ellipse',{cx:60,cy:96,rx:36,ry:12,fill:c},s));poli('24,96 96,96 60,14',c);sg('polygon',{points:'60,14 96,96 60,96',fill:'#000','fill-opacity':.2},s)}
  else throw new Error('bangun tidak dikenal: '+b);
  return s;
}
GBR.bangun=function(g){
  var w=el('div','mq-row');
  (g.daftar||[g]).forEach(function(d){
    var c=el('div','mq-kolom'),s=bangunSvg(d.b,d.w);s.style.width='104px';s.style.height='104px';c.appendChild(s);
    if(d.l)c.appendChild(el('div','mq-cap',d.l));w.appendChild(c);
  });
  return w;
};

/* deretan pola; token seperti "merah", "biru-lingkaran", "besar", "kuning-panjang", "tepuk" */
var BENTUK_TOKEN=['segitiga','lingkaran','bulat','persegi','kotak','bintang','bulan','oval','persegipanjang'];
var UKURAN_TOKEN=['besar','kecil','panjang','pendek'];
var BUNYI_TOKEN={tepuk:'\u{1F44F}',ketuk:'\u{1F941}',diam:'\u{1F92B}',hati:'\u2764\uFE0F',awan:'\u2601\uFE0F',bunga:'\u{1F338}',daun:'\u{1F343}',matahari:'\u2600\uFE0F'};
function tokenNode(tok){
  if(/^-?\d+$/.test(tok)){var n=el('span','angka',tok);return n}
  var p=tok.split('-'),w=null,b=null,u=null,e=null;
  p.forEach(function(x){
    if(PL[x]&&x!=='roti'&&x!=='abu')w=x;
    else if(BENTUK_TOKEN.indexOf(x)>=0)b=x;
    else if(UKURAN_TOKEN.indexOf(x)>=0)u=x;
    else if(BUNYI_TOKEN[x])e=x;
    else throw new Error('token pola tidak dikenal: '+tok);
  });
  if(e)return document.createTextNode(BUNYI_TOKEN[e]);
  var s=sg('svg',{viewBox:'0 0 40 40','aria-hidden':'true'}),c=PL[w]||(b==='bulan'||b==='bintang'?PL.kuning:PL.abu);
  var f=u==='kecil'?0.55:1,gr=sg('g',{transform:'translate(20 20) scale('+f+') translate(-20 -20)'},s);
  if(u==='panjang'||u==='pendek'){garisan(sg('rect',{x:u==='panjang'?3:12,y:14,width:u==='panjang'?34:16,height:12,rx:4,fill:c},gr),2);return s}
  if(b==='segitiga')garisan(sg('polygon',{points:'20,5 36,33 4,33',fill:c},gr),2.5);
  else if(b==='persegi'||b==='kotak')garisan(sg('rect',{x:7,y:7,width:26,height:26,rx:3,fill:c},gr),2.5);
  else if(b==='bintang')garisan(sg('polygon',{points:'20,3 25,15 38,15 28,23 32,36 20,28 8,36 12,23 2,15 15,15',fill:c},gr),2);
  else if(b==='bulan')garisan(sg('path',{d:'M26 5 A16 16 0 1 0 26 35 A12 12 0 1 1 26 5 Z',fill:c},gr),2);
  else if(b==='oval')garisan(sg('ellipse',{cx:20,cy:20,rx:16,ry:10,fill:c},gr),2.5);
  else if(b==='persegipanjang')garisan(sg('rect',{x:4,y:11,width:32,height:18,rx:3,fill:c},gr),2.5);
  else garisan(sg('circle',{cx:20,cy:20,r:14,fill:c},gr),2.5);
  return s;
}
GBR.pola=function(g){
  var w=el('div','mq-pola'),kol=g.kol||Math.min(g.s.length,9);
  w.style.gridTemplateColumns='repeat('+kol+',minmax(0,44px))';
  g.s.forEach(function(t,i){
    var c;
    if((g.hilang||[]).indexOf(i)>=0)c=el('div','mq-pc q','?');
    else{c=el('div','mq-pc');c.appendChild(tokenNode(t))}
    w.appendChild(c);
  });
  return w;
};

/* garis bilangan dengan titik dan busur lompatan */
GBR.garis=function(g){
  var a=g.a,b=g.b,st=g.langkah||1,W=320,top=g.busur?44:8,y=top+26,s=kanvas(W,y+36,440),x0=30,x1=W-30;
  var X=function(v){return x0+(v-a)/(b-a)*(x1-x0)};
  garisan(sg('line',{x1:x0-6,y1:y,x2:x1+6,y2:y},s),3);
  var n=Math.round((b-a)/st),lab=g.lab||(n<=22?st:Math.ceil(n/8)*st);
  for(var v=a;v<=b+1e-9;v+=st){
    var par=Math.abs((v-a)/lab-Math.round((v-a)/lab))<1e-9;
    garisan(sg('line',{x1:X(v),y1:y-(par?9:5),x2:X(v),y2:y+(par?9:5)},s),par?2.5:1.5);
    if(par)tks(s,X(v),y+24,titikRibu(v),{s:11});
  }
  (g.busur||[]).forEach(function(r){
    var xa=X(r.dari),xb=X(r.ke),mid=(xa+xb)/2,tinggi=Math.max(24,Math.min(34,10+Math.abs(xb-xa)/6));
    sg('path',{d:'M'+xa+' '+(y-4)+' Q'+mid+' '+(y-4-tinggi*1.6)+' '+xb+' '+(y-4),fill:'none',stroke:'#d94f3d','stroke-width':3,'stroke-linecap':'round'},s);
    sg('polygon',{points:xb+','+(y-3)+' '+(xb-6)+','+(y-12)+' '+(xb+6)+','+(y-12),fill:'#d94f3d'},s);
    if(r.l)tks(s,mid,y-8-tinggi*0.8-4,r.l,{s:12,c:'#d94f3d'});
  });
  (g.titik||[]).forEach(function(t){
    sg('circle',{cx:X(t.v),cy:y,r:7,fill:PL[t.w||'merah'],stroke:'currentColor','stroke-width':2.5},s);
    if(t.l)tks(s,X(t.v),y-14,t.l,{s:12});
  });
  return s;
};

/* kerangka sepuluh: sepuluh kotak, titik terisi, titik di luar */
GBR.kerangka=function(g){
  var fr=g.kerangka||1,cell=28,gap=4,fw=5*(cell+gap)+8,W=fr*fw+8+(g.luar?cell*3:0),s=kanvas(W,2*(cell+gap)+16,Math.max(300,W*1.4)),k,n=0;
  for(var f=0;f<fr;f++){
    for(k=0;k<10;k++){
      var cx=8+f*fw+(k%5)*(cell+gap),cy=8+Math.floor(k/5)*(cell+gap);
      garisan(sg('rect',{x:cx,y:cy,width:cell,height:cell,rx:5,fill:'none'},s),2);
      if(n<g.isi){sg('circle',{cx:cx+cell/2,cy:cy+cell/2,r:cell/2-4,fill:'#d94f3d',stroke:'currentColor','stroke-width':2},s)}
      n++;
    }
  }
  for(k=0;k<(g.luar||0);k++)sg('circle',{cx:8+fr*fw+10+(k%3)*(cell-2),cy:16+Math.floor(k/3)*(cell-2),r:cell/2-4,fill:'#e0a93b',stroke:'currentColor','stroke-width':2},s);
  return s;
};

/* gabung (+) atau ambil (-) dari sekelompok benda */
GBR.gabung=function(g){
  var w=el('div','mq-gab');
  function grup(n,coret){var d=el('div','grup');for(var i=0;i<n;i++)d.appendChild(el('span',coret&&i>=g.a-g.b?'coret':null,g.e));return d}
  if(g.op==='+'){w.appendChild(grup(g.a));w.appendChild(el('span','op','+'));w.appendChild(grup(g.b))}
  else{w.appendChild(grup(g.a,true));w.appendChild(el('span','op','−'+g.b))}
  return w;
};

/* bentuk terbelah: utuh dibagi n bagian sama besar, sebagian diwarnai */
function belah(d){
  var s=sg('svg',{viewBox:'0 0 100 100','aria-hidden':'true'}),L=[],b=d.b,i;
  if(b==='lingkaran'){
    if(d.n===2){L.push(['path',{d:'M50 10 A40 40 0 0 0 50 90 Z'}]);L.push(['path',{d:'M50 10 A40 40 0 0 1 50 90 Z'}])}
    else{L.push(['path',{d:'M50 50 L10 50 A40 40 0 0 1 50 10 Z'}]);L.push(['path',{d:'M50 50 L50 10 A40 40 0 0 1 90 50 Z'}]);L.push(['path',{d:'M50 50 L90 50 A40 40 0 0 1 50 90 Z'}]);L.push(['path',{d:'M50 50 L50 90 A40 40 0 0 1 10 50 Z'}])}
  }else{
    var x=b==='persegi'?14:5,y=b==='persegi'?14:22,w=b==='persegi'?72:90,h=b==='persegi'?72:56;
    if(d.n===2){L.push(['rect',{x:x,y:y,width:w/2,height:h}]);L.push(['rect',{x:x+w/2,y:y,width:w/2,height:h}])}
    else for(i=0;i<4;i++)L.push(['rect',{x:x+(i%2)*w/2,y:y+Math.floor(i/2)*h/2,width:w/2,height:h/2}]);
  }
  L.forEach(function(p,k){var e=garisan(sg(p[0],p[1],s),3);e.setAttribute('fill',(d.w||[]).indexOf(k)>=0?'#d94f3d':'#f4d79a')});
  return s;
}
GBR.pecahan=function(g){
  var w=el('div','mq-row');
  g.daftar.forEach(function(d){
    var c=el('div','mq-kolom'),s=belah(d);s.style.width=(d.u==='kecil'?78:d.u==='besar'?132:104)+'px';c.appendChild(s);
    if(d.l)c.appendChild(el('div','mq-cap',d.l));w.appendChild(c);
  });
  return w;
};

/* neraca: sisi yang turun lebih berat */
GBR.neraca=function(g){
  var s=kanvas(300,190,380),rot=g.turun==='kiri'?-9:g.turun==='kanan'?9:0,r=rot*Math.PI/180,cx=150,cy=70,L=110;
  var xl=cx-L*Math.cos(r),yl=cy-L*Math.sin(r),xr=cx+L*Math.cos(r),yr=cy+L*Math.sin(r);
  garisan(sg('polygon',{points:cx+','+cy+' '+(cx-22)+',172 '+(cx+22)+',172',fill:'#c78a12'},s),2.5);
  garisan(sg('line',{x1:xl,y1:yl,x2:xr,y2:yr},s),5);
  sg('circle',{cx:cx,cy:cy,r:6,fill:'#d94f3d',stroke:'currentColor','stroke-width':2},s);
  [[xl,yl,g.kiri,g.kiriL],[xr,yr,g.kanan,g.kananL]].forEach(function(p){
    garisan(sg('line',{x1:p[0]-34,y1:p[1],x2:p[0]+34,y2:p[1]},s),4);
    var t=sg('text',{x:p[0],y:p[1]-8,'text-anchor':'middle','font-size':36},s);t.textContent=p[2];
    if(p[3])tks(s,p[0],p[1]+20,p[3],{s:12});
  });
  return s;
};

/* batang satuan tidak baku: tiap kotak = satu satuan */
GBR.batang=function(g){
  var maks=0;g.baris.forEach(function(b){maks=Math.max(maks,b.n)});
  var u=Math.min(26,Math.floor(230/maks)),lab=78,W=lab+maks*u+14,H=g.baris.length*34+(g.satuan?22:6),s=kanvas(W,H,Math.max(300,W*1.3));
  g.baris.forEach(function(b,i){
    var y=6+i*34;tks(s,lab-8,y+17,b.l,{a:'end',s:12});
    for(var k=0;k<b.n;k++)garisan(sg('rect',{x:lab+k*u,y:y,width:u,height:24,fill:PL[b.w||'kuning']},s),2);
  });
  if(g.sejajar)sg('line',{x1:lab,y1:2,x2:lab,y2:H-(g.satuan?18:2),stroke:'#d94f3d','stroke-width':2,'stroke-dasharray':'4 3'},s);
  if(g.satuan)tks(s,lab,H-6,'1 kotak = 1 '+g.satuan,{a:'start',s:11});
  return s;
};

/* tali yang sama: lurus dan dilingkarkan */
GBR.tali=function(g){
  var s=kanvas(300,150,380);
  tks(s,150,16,'Tali diluruskan: '+g.n+' '+g.satuan,{s:12});
  var x0=30,x1=270;
  sg('line',{x1:x0,y1:34,x2:x1,y2:34,stroke:'#b97f12','stroke-width':7,'stroke-linecap':'round'},s);
  for(var i=0;i<=g.n;i++)sg('line',{x1:x0+(x1-x0)*i/g.n,y1:26,x2:x0+(x1-x0)*i/g.n,y2:42,stroke:'currentColor','stroke-width':2},s);
  tks(s,150,76,'Tali yang sama, dilingkarkan:',{s:12});
  sg('path',{d:'M110 128 C110 92 190 92 190 118 C190 140 120 140 128 112 C134 96 170 98 168 116',fill:'none',stroke:'#b97f12','stroke-width':7,'stroke-linecap':'round'},s);
  tks(s,230,122,'?',{s:26,c:'#d94f3d'});
  return s;
};

/* lomba waktu: tiap baris punya waktu mulai (m) dan lama (s) */
GBR.lomba=function(g){
  var maks=0;g.baris.forEach(function(b){maks=Math.max(maks,b.m+b.s)});
  var w=el('div','mq-lomba');
  g.baris.forEach(function(b){
    var r=el('div','mq-lr');r.appendChild(el('div','lb',(b.e?b.e+' ':'')+b.l));
    var tr=el('div','tr'),bar=el('i');bar.style.left=(b.m/maks*100)+'%';bar.style.width=(b.s/maks*100)+'%';bar.style.background=PL[b.w||'hijau'];
    tr.appendChild(bar);r.appendChild(tr);w.appendChild(r);
  });
  return w;
};

/* dua anak berhadapan, dilihat dari atas */
GBR.hadap=function(g){
  var s=kanvas(300,190,420);
  function orang(x,warna,nama,hadap,kananAtas){
    garisan(sg('circle',{cx:x,cy:95,r:22,fill:warna},s));
    sg('polygon',{points:hadap>0?(x+22)+',88 '+(x+34)+',95 '+(x+22)+',102':(x-22)+',88 '+(x-34)+',95 '+(x-22)+',102',fill:'currentColor'},s);
    tks(s,x,100,nama,{s:13,c:'#fff'});
    var yKa=kananAtas?53:137,yKi=kananAtas?137:53,dx=hadap>0?-14:14,an=hadap>0?'end':'start';
    garisan(sg('circle',{cx:x,cy:yKa,r:8,fill:'none'},s),2.5);garisan(sg('circle',{cx:x,cy:yKi,r:8,fill:'none'},s),2.5);
    tks(s,x+dx,yKa+4,'kanan',{a:an,s:11});tks(s,x+dx,yKi+4,'kiri',{a:an,s:11});
  }
  orang(70,'#4a7bd0',g.n1,1,false);orang(230,'#2e9a63',g.n2,-1,true);
  var b=g.bola,pos=b==='rani'?[70,137]:b==='dodi'?[230,137]:b==='tengah'?[150,95]:null;
  if(pos)garisan(sg('circle',{cx:pos[0],cy:pos[1],r:10,fill:'#d94f3d'},s),2.5);
  return s;
};

/* barisan anak (menghadap ke kanan): antri satu baris atau berdampingan */
GBR.antri=function(g){
  var n=g.n.length,s=kanvas(300,g.samping?150:120,400);
  function orang(x,y,nama,warna){
    garisan(sg('circle',{cx:x,cy:y,r:20,fill:warna},s));
    sg('polygon',{points:(x+20)+','+(y-7)+' '+(x+31)+','+y+' '+(x+20)+','+(y+7),fill:'currentColor'},s);
    tks(s,x,y+4,nama.charAt(0),{s:14,c:'#fff'});tks(s,x,y+36,nama,{s:11});
  }
  var war=['#4a7bd0','#2e9a63','#c75ba0','#e0a93b'];
  if(g.samping)g.n.forEach(function(nm,i){orang(130,34+i*70,nm,war[i%4])});
  else{var sp=Math.min(90,200/Math.max(1,n-1));g.n.forEach(function(nm,i){orang(246-i*sp,56,nm,war[i%4])})}
  tks(s,150,g.samping?146:112,'semua menghadap ke sini →',{s:11});
  return s;
};

/* meja: benda di atas dan di bawah meja */
GBR.meja=function(g){
  var s=kanvas(300,170,380);
  garisan(sg('rect',{x:60,y:78,width:180,height:10,rx:3,fill:'#b97f12'},s),2.5);
  garisan(sg('line',{x1:78,y1:88,x2:78,y2:150},s),5);garisan(sg('line',{x1:222,y1:88,x2:222,y2:150},s),5);
  var a=sg('text',{x:150,y:70,'text-anchor':'middle','font-size':44},s);a.textContent=g.atas;
  var b=sg('text',{x:150,y:140,'text-anchor':'middle','font-size':44},s);b.textContent=g.bawah;
  return s;
};

/* kotak berisi satu benda, benda lain di luar */
GBR.dalam=function(g){
  var s=kanvas(300,150,380);
  garisan(sg('rect',{x:50,y:40,width:110,height:80,rx:6,fill:'#f4d79a','fill-opacity':.55},s),3);
  var a=sg('text',{x:105,y:96,'text-anchor':'middle','font-size':44},s);a.textContent=g.dalam;
  var b=sg('text',{x:225,y:96,'text-anchor':'middle','font-size':44},s);b.textContent=g.luar;
  tks(s,105,136,'kotak',{s:12});
  return s;
};

/* tumpukan kotak berlabel dari atas ke bawah (tegak) atau kiri ke kanan (datar) */
GBR.susun=function(g){
  var n=g.items.length,tegak=g.arah!=='datar',s=kanvas(tegak?200:300,tegak?n*42+8:70,tegak?260:420);
  g.items.forEach(function(it,i){
    var x=tegak?30:8+i*96,y=tegak?6+i*42:12,w=tegak?140:88;
    garisan(sg('rect',{x:x,y:y,width:w,height:34,rx:8,fill:PL[it.w||['biru','hijau','kuning','merah'][i%4]]},s),3);
    tks(s,x+w/2,y+22,it.l,{s:14,c:'#fff'});
  });
  return s;
};

/* kartu angka */
GBR.kartu=function(g){
  var w=el('div','mq-kartu');g.d.forEach(function(x){w.appendChild(el('span',null,String(x)))});return w;
};

/* balok nilai tempat: ratusan (kotak biru), puluhan (batang hijau), satuan (kubus kuning) */
GBR.blok=function(g){
  var n=g.n,jum=[Math.floor(n/100)%10,Math.floor(n/10)%10,n%10],kls=['r','p','s'],nama=['ratusan','puluhan','satuan'];
  var w=el('div','mq-blok');
  jum.forEach(function(j,i){
    var d=el('div','mq-bg'),isi=el('div','isi '+kls[i]);
    for(var k=0;k<j;k++)isi.appendChild(el('span','b'));
    d.appendChild(isi);d.appendChild(el('div','cap',j+' '+nama[i]));w.appendChild(d);
  });
  if(g.label){var c=el('div','mq-kolom');c.appendChild(w);c.appendChild(el('div','mq-cap',g.label));return c}
  return w;
};

/* larik titik: r baris, c kolom; baris bergantian warna agar mudah dihitung per baris */
GBR.larik=function(g){
  var w=el('div','mq-larik');w.style.gridTemplateColumns='repeat('+g.c+',minmax(0,22px))';
  for(var i=0;i<g.r*g.c;i++){
    var baris=Math.floor(i/g.c),k=el('span','dt'+(baris%2?' b':'')+(g.sorot!==undefined&&baris>=g.sorot?' mati':''));
    w.appendChild(k);
  }
  var c=el('div','mq-kolom');c.appendChild(w);c.appendChild(el('div','mq-cap',g.r+' baris \u00d7 '+g.c+' kolom'));
  return c;
};

/* kelompok sama banyak (piring), boleh dengan tanda +, boleh dengan sisa yang tak kebagian */
GBR.kelompok=function(g){
  var w=el('div','mq-kel'),i,j;
  for(i=0;i<g.jumlah;i++){
    if(g.plus&&i>0)w.appendChild(el('span','plus','+'));
    var p=el('div','piring');
    if(g.n>8)p.appendChild(el('b',null,String(g.n)));
    else for(j=0;j<g.n;j++)p.appendChild(el('span',null,g.e));
    w.appendChild(p);
  }
  if(g.sisa){
    var s=el('div','sisa'),r=el('span');
    for(j=0;j<g.sisa;j++)r.appendChild(el('span',null,g.e));
    s.appendChild(r);s.appendChild(el('small',null,'sisa '+g.sisa));w.appendChild(s);
  }
  return w;
};

/* timbangan seimbang dengan kantong berisi "?" (nilai kotak yang belum diketahui) */
GBR.timbang=function(g){
  var s=kanvas(300,176,420),cx=150,cy=52,L=95;
  garisan(sg('polygon',{points:cx+','+cy+' '+(cx-22)+',168 '+(cx+22)+',168',fill:'#c78a12'},s),2.5);
  garisan(sg('line',{x1:cx-L,y1:cy,x2:cx+L,y2:cy},s),5);
  sg('circle',{cx:cx,cy:cy,r:6,fill:'#d94f3d',stroke:'currentColor','stroke-width':2},s);
  function pan(x,benda,angka){
    garisan(sg('line',{x1:x,y1:cy,x2:x-40,y2:cy+62},s),1.5);garisan(sg('line',{x1:x,y1:cy,x2:x+40,y2:cy+62},s),1.5);
    garisan(sg('line',{x1:x-46,y1:cy+62,x2:x+46,y2:cy+62},s),4);
    if(angka){sg('circle',{cx:x,cy:cy+36,r:20,fill:'#fff3d0',stroke:'currentColor','stroke-width':2.5},s);tks(s,x,cy+43,String(angka),{s:20});return}
    var baris=0,kol=0,lebar=46;
    benda.forEach(function(b){
      var w=b==='k'?26:15;
      if(kol+w>lebar*2-6){baris++;kol=0}
      var bx=x-lebar+4+kol,by=cy+62-4-baris*22;
      if(b==='k'){
        garisan(sg('rect',{x:bx,y:by-26,width:24,height:26,rx:7,fill:'#b97f12'},s),2);tks(s,bx+12,by-8,'?',{s:16,c:'#fff'});
      }else if(b==='p'){sg('circle',{cx:bx+7,cy:by-7,r:6.5,fill:'#d94f3d',stroke:'currentColor','stroke-width':2},s)}
      else{sg('circle',{cx:bx+7,cy:by-7,r:6.5,fill:'none',stroke:'#d94f3d','stroke-width':2,'stroke-dasharray':'3 2'},s);tks(s,bx+7,by-3.5,'\u2212',{s:11,c:'#d94f3d'})}
      kol+=w+2;
    });
  }
  var kiri=[],i;
  for(i=0;i<(g.kantong||0);i++)kiri.push('k');
  for(i=0;i<(g.plus||0);i++)kiri.push('p');
  for(i=0;i<(g.minus||0);i++)kiri.push('m');
  var kn=[];for(i=0;i<(g.kanan||0);i++)kn.push('p');
  pan(cx-L,kiri,0);
  if(kn.length>12)pan(cx+L,[],g.kanan);else pan(cx+L,kn,0);
  return s;
};

/* tabel: baris pertama biasanya "posisi", baris kedua "nilai"; sel "?" ditandai */
GBR.tabel=function(g){
  var t=el('table','mq-tabel');
  g.baris.forEach(function(b){
    var tr=el('tr');
    b.forEach(function(x,i){tr.appendChild(el('td',i>0&&String(x)==='?'?'q':null,String(x)))});
    t.appendChild(tr);
  });
  return t;
};

/* soal bersusun: penjumlahan atau pengurangan, dengan catatan simpanan/pinjaman di atas kolom */
GBR.kolom=function(g){
  var w=el('div','mq-kol');
  function digit(n){var t=String(n);return new Array(5-t.length).join(' ')+t}
  function baris(op,teks,kls){
    w.appendChild(el('span','op',op));
    for(var i=0;i<4;i++){
      var ch=teks.charAt(i);
      w.appendChild(el('span','c'+(g.sorot===i?' sorot':'')+((kls||ch==='?')?' q':''),ch===' '?' ':ch));
    }
  }
  if(g.tanda&&g.tanda.length){
    w.appendChild(el('span'));
    for(var i=0;i<4;i++){
      var t=null;g.tanda.forEach(function(x){if(x.kol===i)t=x});
      w.appendChild(el('span','t',t?t.teks:' '));
    }
  }
  baris('',digit(g.a));
  baris(g.op==='+'?'+':'−',digit(g.b));
  w.appendChild(el('span','gr'));
  if(g.hasil===undefined||g.hasil===null)baris('','   ?','q');
  else baris('',digit(g.hasil));
  return w;
};

/* model batang untuk soal cerita: bagian-bagian yang menyusun satu keseluruhan */
GBR.bar=function(g){
  var tot=0;g.bagian.forEach(function(b){tot+=b.v});
  var W=300,x0=10,lebar=W-20,s=kanvas(W,g.atas?92:58,400),x=x0,y=g.atas?40:8;
  if(g.atas){garisan(sg('path',{d:'M'+x0+' 32 L'+x0+' 24 L'+(x0+lebar)+' 24 L'+(x0+lebar)+' 32',fill:'none'},s),2.5);tks(s,W/2,16,g.atas,{s:13})}
  g.bagian.forEach(function(b){
    var wd=b.v/tot*lebar;
    garisan(sg('rect',{x:x,y:y,width:wd,height:38,fill:PL[b.w||'biru']},s),2.5);
    tks(s,x+wd/2,y+24,b.l,{s:13,c:'#fff'});x+=wd;
  });
  return s;
};

function gambarItem(g,wadah){
  clear(wadah);
  if(!g)return;
  (Array.isArray(g)?g:[g]).forEach(function(x){
    if(!GBR[x.k])throw new Error('jenis gambar tidak dikenal: '+x.k);
    wadah.appendChild(GBR[x.k](x));
  });
}
`
