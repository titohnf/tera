/**
 * Mesin latihan bersama untuk semua materi interaktif.
 *
 * KENAPA ADA. Materi interaktif hanya berguna bila anak sesudahnya bisa
 * mengerjakan soal Misi topik itu. Soal di `question_bank_items` ternyata tidak
 * hanya "pilih gambar yang benar": ada benar-salah, pilihan ganda berbunyi
 * "Dito berkata ..., apakah tepat?", isian angka, dan bahasa yang cukup
 * panjang. Stasiun praktik (digambar, disentuh) membangun pemahaman, tetapi
 * anak juga perlu terbiasa dengan BENTUK soalnya. Mesin ini menambah tiga
 * stasiun di akhir tiap materi, bahannya disusun dari konsep yang diuji bank
 * soal topik itu (bukan salinan soalnya, supaya soal Misi tetap "baru"):
 *
 *   f1 "Benar atau salah?"   : 8 pernyataan, penjelasan seketika
 *   f2 "Siapa yang benar?"   : 4 perdebatan dua anak (salah paham umum)
 *   f3 "Tantangan Misi"      : 8 soal campuran (pilihan, benar-salah, isian);
 *                              bintang di akhir dihitung dari sini
 *
 * TIDAK TERASA SEPERTI UJIAN. Pertanyaan disampaikan maskot (burung hantu) dalam
 * gelembung ucapan, kemajuan berupa titik ("Tebakan 3 dari 8", bukan skor), jawaban
 * keliru dibalas lembut ("Hampir!" dengan penjelasan), dan hampir tiap butir
 * membawa gambar `g` (lihat `gambar.ts`) yang memperlihatkan soalnya: ikat lidi,
 * nilai tempat, pola, bangun, garis bilangan, pecahan, neraca, piktogram, dan
 * seterusnya. Butir tanpa gambar hanya yang sulit divisualkan (soal istilah murni).
 *
 * CARA PAKAI. Berkas `acNN.ts` menyimpan halaman dasarnya sebagai `DASAR`, lalu
 * `export const HTML_ACNN = rakit(DASAR, { tantangan: 'sX', data })`. `rakit`
 * (1) membuang stasiun tantangan lama, (2) memasang tiga stasiun di atas,
 * (3) menyambung urutan layar dan penghitung bintang. Bahan per topik ada di
 * `latihan/acNN.ts`. Penanda yang dicari `rakit` ada di halaman dasar; bila
 * hilang, `rakit` melempar galat saat modul dimuat (bukan diam-diam salah).
 *
 * Aturan menulis berkas ini sama dengan berkas materi: JANGAN memakai backtick
 * atau "${" di dalam string HTML/JS yang disisipkan (isinya `String.raw`).
 */

import { CSS_GAMBAR, JS_GAMBAR, type GambarItem } from './gambar'

export type Item =
  | { t: 'bs'; q: string; a: boolean; e: string; g?: GambarItem }
  | { t: 'pg'; q: string; o: string[]; a: number; e: string; g?: GambarItem }
  | { t: 'debat'; q: string; k: [string, string]; a: 0 | 1; e: string; g?: GambarItem }
  | { t: 'isi'; q: string; a: string[]; e: string; g?: GambarItem }
  | { t: 'kata'; q: string; a: string[]; e: string; g?: GambarItem }
  | { t: 'gen'; nama: string }

export interface DataMateri {
  fakta: Item[]
  debat: Item[]
  bank: Item[]
  /** JS tambahan (mis. `GEN.nama=function(){...}` untuk soal berangka acak). */
  jsTopik?: string
}

/** Pembangun item: menjaga data di berkas topik tetap ringkas dan seragam. */
export const bs = (q: string, a: boolean, e: string, g?: GambarItem): Item => ({ t: 'bs', q, a, e, ...(g ? { g } : {}) })
export const pg = (q: string, o: string[], a: number, e: string, g?: GambarItem): Item => ({ t: 'pg', q, o, a, e, ...(g ? { g } : {}) })
export const isi = (q: string, a: string | string[], e: string, g?: GambarItem): Item => ({ t: 'isi', q, a: ([] as string[]).concat(a), e, ...(g ? { g } : {}) })
export const kata = (q: string, a: string | string[], e: string, g?: GambarItem): Item => ({ t: 'kata', q, a: ([] as string[]).concat(a), e, ...(g ? { g } : {}) })
export const debat = (q: string, k: [string, string], a: 0 | 1, e: string, g?: GambarItem): Item => ({ t: 'debat', q, k, a, e, ...(g ? { g } : {}) })
export const gen = (nama: string): Item => ({ t: 'gen', nama })

const CSS_MESIN = String.raw`
/* mesin latihan bersama (awalan mq-) */
.mq-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mq-lang{color:var(--muted);font-size:1rem}
.mq-tanya{display:flex;gap:12px;align-items:flex-start}
.mq-mas{font-size:2.8rem;line-height:1;flex:none;filter:drop-shadow(0 2px 0 rgba(0,0,0,.15))}
.mq-gel{position:relative;flex:1;background:var(--card);border:2px solid var(--line);border-radius:20px;padding:10px 14px;font-family:var(--display);font-size:1.3rem;font-weight:800;line-height:1.3;text-wrap:pretty}
.mq-gel::before{content:"";position:absolute;left:-11px;top:16px;border:9px solid transparent;border-right-color:var(--line);border-left-width:0}
.mq-gel::after{content:"";position:absolute;left:-8px;top:17px;border:8px solid transparent;border-right-color:var(--card);border-left-width:0}
.mq-opsi{display:grid;gap:10px}
.mq-opsi.mq-dua{grid-template-columns:1fr 1fr}
.mq-opt{font:inherit;font-weight:800;font-size:1.1rem;line-height:1.3;text-align:left;min-height:56px;border-radius:16px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;padding:10px 14px;touch-action:manipulation}
.mq-opt.bs{font-family:var(--display);font-size:1.5rem;text-align:center}
.mq-opt.debat{border-radius:20px}
.mq-opt.right{background:var(--ok);border-color:var(--ok);color:#fff}
.mq-opt.wrong{background:var(--soft);border-color:var(--ikat);color:var(--ink)}
.mq-opt:disabled{cursor:default}
.mq-layar{min-height:64px;border:3px solid var(--ink);border-radius:16px;background:var(--card);font-family:var(--display);font-size:2.2rem;font-weight:800;display:flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums}
.mq-layar.right{background:var(--ok);border-color:var(--ok);color:#fff}
.mq-layar.wrong{background:var(--soft);border-color:var(--ikat);color:var(--ink)}
.mq-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.mq-pad button{font:inherit;font-family:var(--display);font-weight:800;font-size:1.6rem;min-height:56px;border-radius:14px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;touch-action:manipulation}
.mq-pad button.mq-ok{background:var(--ikat);border-color:var(--ikat);color:#fff}
.mq-input{font:inherit;font-weight:800;font-size:1.4rem;min-height:56px;border-radius:14px;border:3px solid var(--ink);padding:8px 14px;background:var(--card);color:var(--ink);width:100%}
`

const JS_MESIN = String.raw`
/* ---- mesin latihan bersama: Benar atau salah, Siapa yang benar, Tantangan Misi ---- */
var benar=0,totalSoal=0;
function bintangDari(){var f=totalSoal?benar/totalSoal:0;return f>=0.8?3:f>=0.5?2:1}
function sampel(a,n){return shuffle(a).slice(0,n)}
function normJawab(s){return String(s).toLowerCase().replace(/[.\s]/g,'')}
var GEN={};
/*JS_TOPIK*/
function Mesin(id,judul,label,ambil,pindah,hitung){
  var daftar=[],i=0,kunci=false;
  function mulai(){
    daftar=ambil().map(function(x){return x.t==='gen'?GEN[x.nama]():x});
    i=0;
    if(hitung){benar=0;totalSoal=0}
    tampil();
  }
  function selesai(ok,jawab,it){
    kunci=true;
    if(hitung){totalSoal++;if(ok)benar++}
    var fb=$(id+'fb');fb.style.display='flex';fb.className='msg '+(ok?'good':'warn');
    var t=(ok?'Benar! ':'Hampir! ')+(!ok&&jawab?'Jawabannya: '+jawab+'. ':'')+(it.e||'');
    fb.textContent=(ok?'\u{1F389} ':'\u{1F914} ')+t;setKata(t);
    var nx=$(id+'next');nx.style.display='';nx.textContent=i===daftar.length-1?'Selesai':'Lanjut';
  }
  function bangunBS(it,o){
    o.className='mq-opsi mq-dua';
    [true,false].forEach(function(x){
      var b=el('button','mq-opt bs',x?'Benar':'Salah');
      b.onclick=function(){
        if(kunci)return;
        var ok=x===it.a;
        var semua=o.children;
        for(var k=0;k<semua.length;k++){var bk=(semua[k].textContent==='Benar');if(bk===it.a)semua[k].classList.add('right');else if(semua[k]===b)semua[k].classList.add('wrong')}
        selesai(ok,it.a?'Benar':'Salah',it);
      };
      o.appendChild(b);
    });
  }
  function bangunPG(it,o){
    var pil=(it.k||it.o).map(function(t,j){return {t:t,ok:j===it.a}});
    shuffle(pil).forEach(function(p){
      var b=el('button','mq-opt'+(it.k?' debat':''),p.t);
      b.onclick=function(){
        if(kunci)return;
        var semua=o.children;
        for(var k=0;k<semua.length;k++){if(semua[k].getAttribute('data-ok')==='1')semua[k].classList.add('right');else if(semua[k]===b)semua[k].classList.add('wrong')}
        selesai(p.ok,it.k?'':(it.o[it.a]),it);
      };
      b.setAttribute('data-ok',p.ok?'1':'0');
      o.appendChild(b);
    });
  }
  function bangunIsi(it,o){
    var nilai='',layar=el('div','mq-layar');
    var gambarLayar=function(){layar.textContent=nilai||'…'};gambarLayar();
    var periksa=function(){
      if(kunci||!nilai)return;
      var ok=it.a.some(function(x){return normJawab(x)===normJawab(nilai)});
      layar.classList.add(ok?'right':'wrong');
      selesai(ok,it.a[0],it);
    };
    /* papan angka hanya cukup bila semua jawaban murni angka; koma, garis miring, dan daftar butuh kolom ketik */
    if(it.t==='isi'&&it.a.every(function(x){return /^[0-9]+$/.test(x)})){
      o.appendChild(layar);
      var pad=el('div','mq-pad');
      ['1','2','3','4','5','6','7','8','9','⌫','0','OK'].forEach(function(k){
        var b=el('button',k==='OK'?'mq-ok':null,k);
        b.onclick=function(){
          if(kunci)return;
          if(k==='OK'){periksa();return}
          if(k==='⌫')nilai=nilai.slice(0,-1);
          else if(nilai.length<7)nilai+=k;
          gambarLayar();
        };
        pad.appendChild(b);
      });
      o.appendChild(pad);
    }else{
      var inp=el('input','mq-input');inp.type='text';inp.placeholder='Ketik jawabanmu';
      inp.setAttribute('autocomplete','off');inp.setAttribute('autocapitalize','none');inp.setAttribute('aria-label','jawaban');
      inp.oninput=function(){nilai=inp.value};
      inp.onkeydown=function(ev){if(ev.key==='Enter')periksa()};
      var ok=el('button','big main','Periksa');
      ok.onclick=function(){
        periksa();
        if(kunci){inp.disabled=true;inp.style.borderColor=it.a.some(function(x){return normJawab(x)===normJawab(nilai)})?'var(--ok)':'var(--bad)'}
      };
      o.appendChild(inp);o.appendChild(ok);
    }
  }
  function tampil(){
    var it=daftar[i];kunci=false;
    $(id+'j').textContent=judul;
    $(id+'n').textContent=label+' '+(i+1)+' dari '+daftar.length;
    var dt=$(id+'d');clear(dt);for(var j=0;j<daftar.length;j++)dt.appendChild(el('i',j<=i?'on':''));
    $(id+'q').textContent=it.q;
    gambarItem(it.g,$(id+'v'));
    $(id+'fb').style.display='none';$(id+'next').style.display='none';
    var o=$(id+'o');clear(o);o.className='mq-opsi';
    if(it.t==='bs')bangunBS(it,o);
    else if(it.t==='isi'||it.t==='kata')bangunIsi(it,o);
    else bangunPG(it,o);
    setKata(it.q);
    window.scrollTo(0,0);
  }
  $(id+'next').onclick=function(){if(i<daftar.length-1){i++;tampil()}else show(pindah)};
  return {mulai:mulai};
}
var mesinF1=Mesin('f1','Tebak: benar atau salah?','Tebakan',function(){return sampel(DATA.fakta,8)},'f2',false);
var mesinF2=Mesin('f2','Siapa yang benar?','Cerita',function(){return sampel(DATA.debat,4)},'f3',false);
var mesinF3=Mesin('f3','Ayo buktikan!','Langkah',function(){return sampel(DATA.bank,8)},'akhir',true);
`

const bagianHtml = (id: string) => `  <section class="screen" id="${id}">
    <p class="say" id="${id}j"></p>
    <div class="mq-top"><span class="sub mq-lang" id="${id}n"></span><div class="dots" id="${id}d"></div></div>
    <div class="mq-tanya"><span class="mq-mas" aria-hidden="true">\u{1F989}</span><div class="mq-gel" id="${id}q"></div></div>
    <div class="mq-gambar" id="${id}v"></div>
    <div class="mq-opsi" id="${id}o"></div>
    <div class="msg" id="${id}fb" style="display:none"></div>
    <div class="cta"><button class="big main" id="${id}next" style="display:none">Lanjut</button></div>
  </section>
`

function wajibAda(dasar: string, penanda: string, kode: string): number {
  const i = dasar.indexOf(penanda)
  if (i < 0) throw new Error(`rakit(${kode}): penanda tidak ditemukan di halaman dasar: ${penanda}`)
  return i
}

/**
 * Memasang mesin latihan ke halaman dasar sebuah materi.
 *
 * - `tantangan` (mis. 's4'): id stasiun tantangan LAMA yang digantikan. Dipakai
 *   materi yang sudah ada (AC-01 sampai AC-07).
 * - tanpa `tantangan`: materi baru yang tidak punya tantangan lama. Mesin
 *   dipasang sebelum layar akhir, dan stasiun praktik terakhirnya harus sudah
 *   memanggil `show('f1')` sendiri.
 */
export function rakit(dasar: string, o: { kode: string; tantangan?: string; data: DataMateri }): string {
  const { kode, tantangan: tid, data } = o
  let h = dasar

  const bahan = JSON.stringify({ fakta: data.fakta, debat: data.debat, bank: data.bank })
  if (bahan.includes('</') || bahan.includes('`') || bahan.includes('${')) {
    throw new Error(`rakit(${kode}): bahan latihan memuat urutan karakter terlarang (</, backtick, atau dollar-kurung)`)
  }
  // Fungsi pengganti: `$` di dalam bahan topik tidak boleh ditafsirkan sebagai pola ganti.
  const js = 'var DATA=' + bahan + ';\n' + JS_GAMBAR + '\n' + JS_MESIN.replace('/*JS_TOPIK*/', () => data.jsTopik ?? '') + '\n'
  const html = ['f1', 'f2', 'f3'].map(bagianHtml).join('\n') + '\n  '
  const pemanggil = "if(id==='f1')mesinF1.mulai();if(id==='f2')mesinF2.mulai();if(id==='f3')mesinF3.mulai();"

  const akhirHtml = wajibAda(h, '<!-- akhir -->', kode)
  wajibAda(h, '/* ---- akhir', kode)
  const urut = /var urut=\[([^\]]*)\];/.exec(h)
  if (!urut) throw new Error(`rakit(${kode}): 'var urut=[...]' tidak ditemukan`)
  const sisaUrut = urut[1].split(',').map(x => x.trim()).filter(x => x !== "'akhir'" && (!tid || x !== `'${tid}'`))
  const urutBaru = `var urut=[${[...sisaUrut, "'f1'", "'f2'", "'f3'", "'akhir'"].join(',')}];`

  if (tid) {
    const nomor = tid.slice(1)
    // 1) HTML: ganti stasiun tantangan lama dengan tiga stasiun mesin.
    const a = wajibAda(h, `<!-- ${nomor}: tantangan -->`, kode)
    h = h.slice(0, a) + html + h.slice(akhirHtml)
    // 2) JS: ganti blok tantangan lama dengan mesin + bahan topik.
    const c = wajibAda(h, '/* ---- tantangan', kode)
    const d = wajibAda(h, '/* ---- akhir', kode)
    h = h.slice(0, c) + js + h.slice(d)
    // 3) Pemanggil stasiun.
    const hook = `if(id==='${tid}')mulaiS${nomor}();`
    wajibAda(h, hook, kode)
    h = h.replace(hook, pemanggil)
    // 4) Semua rujukan literal sisa ke stasiun lama (`show('s4')`, atau id yang
    //    dioper sebagai argumen) kini menuju stasiun mesin pertama. Wajib ada
    //    minimal satu: kalau tidak, stasiun praktik terakhir tak punya jalan
    //    ke latihan.
    const ke = `'${tid}'`
    wajibAda(h, ke, kode)
    h = h.split(ke).join("'f1'")
  } else {
    h = h.slice(0, akhirHtml) + html + h.slice(akhirHtml)
    const j = wajibAda(h, '/* ---- akhir', kode)
    h = h.slice(0, j) + js + h.slice(j)
    const hook = "if(id==='akhir')tampilAkhir();"
    wajibAda(h, hook, kode)
    h = h.replace(hook, pemanggil + hook)
    if (!h.includes("show('f1')")) throw new Error(`rakit(${kode}): stasiun praktik terakhir harus memanggil show('f1')`)
  }
  h = h.replace(/var urut=\[[^\]]*\];/, urutBaru)

  // Bintang dihitung dari Tantangan Misi (8 soal), bukan dari 4 soal lama.
  const bintang = 'var n=benar>=4?3:benar>=2?2:1;'
  wajibAda(h, bintang, kode)
  h = h.replace(bintang, 'var n=bintangDari();')

  // CSS.
  const css = wajibAda(h, '</style>', kode)
  h = h.slice(0, css) + CSS_GAMBAR + CSS_MESIN + h.slice(css)

  return h
}
