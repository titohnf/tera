/**
 * Mengubah bank soal tutor di Drive (docx soal + docx pembahasan, dikaitkan
 * tutor per topik di tab Latihan Soal sesi) menjadi butir DRAF di
 * `question_bank_items`, dipasangi tag topik kurikulum.
 *
 *   node --env-file=.env.local scripts/impor-bank-soal-drive.mjs --kunci ~/kunci.json                      # periksa saja
 *   node --env-file=.env.local scripts/impor-bank-soal-drive.mjs --kunci ~/kunci.json --jalur "7 SMP" --tulis
 *
 * Sumbernya dua berkas per topik: soal (`cp_urls`, biasanya PDF — yang dibaca
 * saudara `.docx`-nya di folder yang sama) dan pembahasan (`cp_pembahasan_urls`),
 * yang memuat kunci: "N. Jawaban: C. 9". Rumus Word (pangkat, pecahan, akar)
 * dibaca dari objek persamaannya, bukan dari teks polos.
 *
 * KUNCI TIDAK PERNAH DITEBAK. Format kunci di pembahasan beragam; tiap butir
 * yang kuncinya tidak bisa dipastikan (nomor tidak cocok, huruf di luar opsi,
 * baris grid tanpa putusan, butir bergambar, tipe tak dikenali) DILEWATI dan
 * dicatat alasannya. Tetap saja, berkas sumber bisa salah sendiri (soal dan
 * pembahasan pernah berbeda tanda hitung), jadi butir masuk sebagai `draf` dan
 * hanya `aktif` yang sampai ke murid — aktivasi lewat Sora sesudah dibaca.
 *
 * Tipe yang dikenali: pilihan ganda (A–E), pilihan ganda kompleks (huruf ganda
 * atau pernyataan tanpa huruf + "pilih lebih dari satu"), dan tabel Benar/Salah.
 * Jalur tag (`question_curriculum_tags`) adalah yang dibaca menu Belajar per
 * topik kurikulum (`practice_paket_items`, migrasi 134).
 *
 * Aman diulang: butir dengan kalimat soal yang sama di topik yang sama dilewati.
 * Tidak menulis apa pun ke Drive (cakupan read-only).
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const TULIS = process.argv.includes('--tulis')
// Mengisi `paket_kunci` ("doc:<id berkas soal>") pada butir yang SUDAH ada, dicocokkan lewat kalimat soal.
const ISI_KUNCI = process.argv.includes('--isi-paket-kunci')
// Sumber lain: latihan soal TANPA file pembahasan dan asesmen berupa berkas Drive (bukan form).
// Tidak ada kunci di dokumen, jadi semua butir menunggu kunci buatan (`--kerja` lalu `--jawaban`).
const TANPA_PEMBAHASAN = process.argv.includes('--tanpa-pembahasan')
const arg = nama => {
  const i = process.argv.indexOf(nama)
  return i > 0 ? process.argv[i + 1] : null
}
const JALUR = arg('--jalur')
const BERKAS_KUNCI = arg('--kunci')
const BERKAS_KERJA = arg('--kerja') // ekspor butir yang soalnya terbaca tapi kuncinya tidak pasti
const BERKAS_JAWABAN = arg('--jawaban') // kunci+pembahasan buatan (JSON) untuk butir dari --kerja
const FOLDER = '115fSYDrele2qIHKnfJlkrVEQgdy2afMB'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const GDOC = 'application/vnd.google-apps.document'

if (!BERKAS_KUNCI) {
  console.error('--kunci butuh jalur ke berkas JSON kunci service account.')
  process.exit(1)
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const kunci = JSON.parse(readFileSync(BERKAS_KUNCI, 'utf8'))
const auth = new google.auth.JWT({
  email: kunci.client_email,
  key: kunci.private_key,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})
const drive = google.drive({ version: 'v3', auth })
const TMP = mkdtempSync(join(tmpdir(), 'bank-soal-'))

// ---------------------------------------------------------------- docx -> blok

function parseXml(xml) {
  const akar = { nama: '#akar', attr: {}, anak: [] }
  const tumpuk = [akar]
  const unesc = s =>
    s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) => {
      if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
      return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e.toLowerCase()]
    })
  for (const m of xml.matchAll(/<(\/?)([\w:.-]+)((?:\s+[\w:.-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g)) {
    if (m[5] !== undefined) {
      tumpuk.at(-1).anak.push({ nama: '#teks', teks: unesc(m[5]), attr: {}, anak: [] })
    } else if (m[1]) {
      tumpuk.pop()
    } else {
      const attr = {}
      for (const a of m[3].matchAll(/([\w:.-]+)="([^"]*)"/g)) attr[a[1]] = unesc(a[2])
      const el = { nama: m[2], attr, anak: [] }
      tumpuk.at(-1).anak.push(el)
      if (!m[4]) tumpuk.push(el)
    }
  }
  return akar
}

const anakNama = (e, n) => e.anak.filter(a => a.nama === n)
const cari = (e, n) => e.anak.find(a => a.nama === n)
const semua = (e, n, keluar = []) => {
  for (const a of e.anak) {
    if (a.nama === n) keluar.push(a)
    semua(a, n, keluar)
  }
  return keluar
}

function matematika(e) {
  const isi = x => x.anak.map(matematika).join('')
  const sub = n => {
    const c = cari(e, n)
    return c ? isi(c) : ''
  }
  switch (e.nama) {
    case 'm:t':
      return e.anak.map(a => a.teks ?? '').join('')
    case 'm:sSup': {
      const s = sub('m:sup')
      return `${sub('m:e')}^${s.length > 1 ? `(${s})` : s}`
    }
    case 'm:sSub': {
      const s = sub('m:sub')
      return `${sub('m:e')}_${s.length > 1 ? `(${s})` : s}`
    }
    case 'm:sSubSup':
      return `${sub('m:e')}_(${sub('m:sub')})^(${sub('m:sup')})`
    case 'm:f':
      return `(${sub('m:num')})/(${sub('m:den')})`
    case 'm:rad': {
      const d = sub('m:deg')
      return `${d === '3' ? '∛' : d === '4' ? '⁴√' : '√'}(${sub('m:e')})`
    }
    case 'm:d':
      return `(${isi(e).trim()})`
    case 'm:func':
      return `${sub('m:fName')}(${sub('m:e')})`
    default:
      return isi(e)
  }
}

function teksParagraf(p) {
  let out = ''
  const jalan = e => {
    for (const c of e.anak) {
      if (c.nama === 'w:t') out += c.anak.map(a => a.teks ?? '').join('')
      else if (c.nama === 'w:tab') out += '\t'
      else if (c.nama === 'w:br') out += '\n'
      else if (c.nama === 'm:oMath') out += matematika(c)
      else if (c.nama === 'w:r') {
        // Superskrip/subskrip yang diformat biasa (bukan objek persamaan).
        const va = cari(c, 'w:rPr') && cari(cari(c, 'w:rPr'), 'w:vertAlign')?.attr['w:val']
        const awal = out.length
        jalan(c)
        const isi = out.slice(awal)
        if (va === 'superscript' && isi.trim()) out = out.slice(0, awal) + `^${isi.length > 1 ? `(${isi})` : isi}`
        else if (va === 'subscript' && isi.trim()) out = out.slice(0, awal) + `_${isi.length > 1 ? `(${isi})` : isi}`
      } else jalan(c)
    }
  }
  jalan(p)
  return out.replace(/[ \t]+/g, ' ').trim()
}

/** docx -> [{jenis:'p', teks, gambar} | {jenis:'tabel', baris:[[sel]]}] */
function bacaDocx(jalurBerkas) {
  const xml = execFileSync('unzip', ['-p', jalurBerkas, 'word/document.xml'], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8')
  const badan = cari(parseXml(xml).anak.find(a => a.nama === 'w:document') ?? { anak: [] }, 'w:body')
  const blok = []
  for (const el of badan?.anak ?? []) {
    if (el.nama === 'w:p') {
      blok.push({ jenis: 'p', teks: teksParagraf(el), gambar: semua(el, 'w:drawing').length + semua(el, 'w:pict').length > 0 })
    } else if (el.nama === 'w:tbl') {
      const baris = anakNama(el, 'w:tr').map(tr =>
        anakNama(tr, 'w:tc').map(tc => anakNama(tc, 'w:p').map(teksParagraf).join(' ').trim()),
      )
      blok.push({ jenis: 'tabel', baris, gambar: semua(el, 'w:drawing').length > 0 })
    }
  }
  return blok
}

// ------------------------------------------------------------------ soal

const norm = s => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const AWAL_BUTIR = /^\s*(\d{1,2})\s*[.)]\s*\(\s*Level\s*C?\s*(\d)[^)]*\)\s*(.*)$/i
const HURUF = /^\s*([A-E])\s*[.)]\s+(.+)$/
const PETUNJUK_BANYAK = /pilih(?:lah)?\s+(?:lebih dari satu|semua|beberapa|dua|tiga|\d+)|lebih dari satu|dua atau lebih|banyak jawaban|jawaban(?:nya)?\s+(?:benar\s+)?(?:bisa|boleh|dapat)\b/i

function uraikanSoal(blok) {
  const butir = []
  let sekarang = null
  let harapan = 1
  for (const b of blok) {
    const m = b.jenis === 'p' ? AWAL_BUTIR.exec(b.teks) : null
    if (m && Number(m[1]) === harapan) {
      sekarang = { nomor: harapan, bloom: Number(m[2]), blok: [], awal: m[3] }
      butir.push(sekarang)
      harapan++
    } else if (sekarang) sekarang.blok.push(b)
  }

  return butir.map(b => {
    const isi = b.blok.filter(x => !(x.jenis === 'p' && !x.teks))
    if (b.awal || isi.length) {
      // sisa baris pertama menjadi paragraf pertama
      if (b.awal) isi.unshift({ jenis: 'p', teks: b.awal })
    }
    if (isi.some(x => x.gambar)) return { nomor: b.nomor, lewat: 'memuat gambar' }
    const tabel = isi.find(x => x.jenis === 'tabel')
    if (tabel) {
      const kepala = (tabel.baris[0] ?? []).join(' ').toLowerCase()
      const barisData = tabel.baris.slice(1).map(r => r[0]?.trim()).filter(Boolean)
      if (!/benar/.test(kepala) && !/\bb\b/.test(kepala)) return { nomor: b.nomor, lewat: 'tabel bukan Benar/Salah' }
      if (barisData.length < 2) return { nomor: b.nomor, lewat: 'tabel kurang dari 2 baris' }
      const awalTabel = isi.indexOf(tabel)
      const prompt = isi.slice(0, awalTabel).filter(x => x.jenis === 'p').map(x => x.teks).join('\n').trim()
      const kolom = tabel.baris[0].slice(1).map(s => s.trim())
      return { nomor: b.nomor, bloom: b.bloom, tipe: 'statement_grid', prompt, pernyataan: barisData, kolom: kolom.length === 2 ? kolom : ['Benar', 'Salah'] }
    }
    const paragraf = isi.filter(x => x.jenis === 'p').map(x => x.teks)
    const iPilihan = paragraf.findIndex(t => HURUF.test(t))
    if (iPilihan >= 0) {
      const pilihan = []
      for (const t of paragraf.slice(iPilihan)) {
        const h = HURUF.exec(t)
        if (!h) break
        pilihan.push({ huruf: h[1], teks: h[2].trim() })
      }
      const urut = pilihan.every((p, i) => p.huruf === String.fromCharCode(65 + i))
      if (!urut || pilihan.length < 2) return { nomor: b.nomor, lewat: 'huruf pilihan tidak berurutan' }
      return { nomor: b.nomor, bloom: b.bloom, tipe: 'pilihan', prompt: paragraf.slice(0, iPilihan).join('\n').trim(), pilihan }
    }
    // Kalimat soal = paragraf terakhir yang ditutup "...", "?", ":" atau "!";
    // 2–6 paragraf pendek sesudahnya adalah pilihan. Daftar bernomor otomatis di
    // Word kehilangan hurufnya saat dibaca, jadi pilihan tak berhuruf itu lazim.
    // Ada petunjuk "pilih lebih dari satu" -> pilihan ganda kompleks.
    const adaPetunjuk = paragraf.some(t => PETUNJUK_BANYAK.test(t))
    const iTanya = paragraf.map((t, i) => (/(\.\.\.|…|\?|:|!)\s*$/.test(t) ? i : -1)).filter(i => i >= 0).at(-1)
    if (iTanya !== undefined) {
      // Kalimat petunjuk ("Pilih lebih dari satu...") yang jatuh sesudah kalimat
      // soal adalah BAGIAN soal, bukan pilihan: kalau ikut jadi pilihan, nomor
      // "pernyataan 2 dan 3" di pembahasan bergeser satu dan kuncinya salah.
      const sisa = paragraf.slice(iTanya + 1).filter(Boolean)
      const petunjukDepan = []
      while (sisa.length && PETUNJUK_BANYAK.test(sisa[0])) petunjukDepan.push(sisa.shift())
      if (sisa.length >= 2 && sisa.length <= 6 && sisa.every(t => t.length < 300) && !sisa.some(t => PETUNJUK_BANYAK.test(t))) {
        return {
          nomor: b.nomor, bloom: b.bloom,
          tipe: adaPetunjuk ? 'multi_tanpa_huruf' : 'opsi_tanpa_huruf',
          prompt: [...paragraf.slice(0, iTanya + 1), ...petunjukDepan].join('\n').trim(), pernyataan: sisa,
        }
      }
    }
    const iPetunjuk = paragraf.findIndex(t => PETUNJUK_BANYAK.test(t))
    if (iPetunjuk >= 0) {
      const pernyataan = paragraf.slice(iPetunjuk + 1).filter(t => t && !PETUNJUK_BANYAK.test(t))
      if (pernyataan.length >= 2 && pernyataan.length <= 6) {
        return { nomor: b.nomor, bloom: b.bloom, tipe: 'multi_tanpa_huruf', prompt: paragraf.slice(0, iPetunjuk + 1).join('\n').trim(), pernyataan }
      }
    }
    return { nomor: b.nomor, lewat: 'tipe soal tidak dikenali (isian/esai/lainnya)', mentah: paragraf }
  })
}

// ------------------------------------------------------------- pembahasan

function uraikanPembahasan(blok) {
  // Empat bentuk yang ditemui di berkas tutor:
  //   "N. Jawaban: C. 9"            (kepala jawaban)
  //   "N. C. Distributor"           (huruf lalu teks jawabannya)
  //   "Soal N (Level ...) ... Kesimpulan: Jawaban yang tepat adalah B. ..."
  //   "N. <teks jawabannya>"        (hanya teks; dicocokkan ke pilihan saat dipakai)
  const hasil = new Map()
  let sekarang = null
  const mulai = (n, kepala, polos = null) => {
    sekarang = { kepala, polos, isi: [] }
    hasil.set(n, sekarang)
    return sekarang
  }
  for (const b of blok) {
    if (b.jenis !== 'p') {
      sekarang?.isi.push(b.baris.map(r => r.join(' | ')).join('\n'))
      continue
    }
    let m
    if ((m = /^\s*(\d{1,2})\s*[.)]\s*Jawaban(?:\s+(?:benar|tabel))?\s*:?\s*(.*)$/i.exec(b.teks)) && !hasil.has(Number(m[1]))) {
      mulai(Number(m[1]), m[2].trim())
    } else if ((m = /^\s*(\d{1,2})\s*[.)]\s*([A-E])\s*[.)]\s*(.*)$/.exec(b.teks)) && !hasil.has(Number(m[1]))) {
      mulai(Number(m[1]), `${m[2]}. ${m[3]}`.trim())
    } else if ((m = /^\s*Soal\s+(\d{1,2})\b/i.exec(b.teks)) && !hasil.has(Number(m[1]))) {
      mulai(Number(m[1]), null)
    } else if ((m = /^\s*Kesimpulan\s*:\s*(.*)$/i.exec(b.teks)) && sekarang && sekarang.kepala === null) {
      sekarang.kepala = m[1]
        .replace(/^.*?(?:jawaban(?:\s+yang)?\s+(?:tepat|benar)\s+adalah|opsi[^.]*?adalah)\s*/i, '')
        .trim()
      sekarang.isi.push(b.teks)
    } else if ((m = /^\s*(\d{1,2})\s*[.)]\s+(.+)$/.exec(b.teks)) && !hasil.has(Number(m[1]))) {
      mulai(Number(m[1]), null, m[2].trim())
    } else if (sekarang) {
      sekarang.isi.push(b.teks)
    }
  }
  for (const v of hasil.values()) if (v.kepala === null && v.polos) v.kepala = v.polos
  return hasil
}

const VERDIK = t => {
  const s = t.trim().toLowerCase()
  if (/^(b|benar|true|t)\b/.test(s)) return true
  if (/^(s|salah|false|f)\b/.test(s)) return false
  return null
}

/** Putusan per baris grid dari kepala jawaban atau badan pembahasan; null kalau tak pasti. */
function kunciGrid(jml, kepala, isi) {
  // "1) B  2) S" / "1 BENAR, 2 SALAH" / "1: B"
  const pasang = [...kepala.matchAll(/(\d+)\s*[).:\-]?\s*(Benar|Salah|B|S)\b/gi)]
  if (pasang.length === jml) {
    const hasil = Array(jml).fill(null)
    for (const p of pasang) hasil[Number(p[1]) - 1] = VERDIK(p[2])
    if (hasil.every(v => v !== null)) return hasil
  }
  // "Pernyataan 1, 3, dan 5 BENAR" -> yang disebut benar, sisanya salah
  const ang = /^\s*(?:pernyataan|nomor|no\.?)?\s*([\d,\s]+(?:dan\s*\d+)?)\s*(BENAR|SALAH)\s*$/i.exec(kepala)
  if (ang) {
    const nomor = [...ang[1].matchAll(/\d+/g)].map(x => Number(x[0]))
    if (nomor.length && nomor.every(n => n >= 1 && n <= jml)) {
      const v = ang[2].toUpperCase() === 'BENAR'
      return Array.from({ length: jml }, (_, i) => (nomor.includes(i + 1) ? v : !v))
    }
  }
  const teks = isi.join('\n')
  // Tabel kebenaran di pembahasan: "pernyataan | ✓ |  " (Benar) atau "pernyataan |  | ✓" (Salah).
  const tabel = teks.split('\n').filter(l => /\|/.test(l) && !/^\s*Pernyataan\s*\|/i.test(l)).map(l => l.split('|').map(x => x.trim()))
  const centang = tabel.filter(c => c.length === 3 && (/[✓✔]/.test(c[1]) !== /[✓✔]/.test(c[2])))
  if (centang.length === jml) return centang.map(c => /[✓✔]/.test(c[1]))
  // Badan: baris yang diawali angka bulat ①②③, "Pernyataan i", atau "i)", lalu putusan terakhir di blok itu.
  const BULAT = '①②③④⑤⑥⑦⑧⑨⑩'
  const bulat = [...BULAT].slice(0, jml)
  if (bulat.every(b => teks.includes(b))) {
    const v = bulat.map((b, i) => {
      const awal = teks.indexOf(b)
      const akhir = i + 1 < bulat.length ? teks.indexOf(bulat[i + 1]) : teks.length
      const potong = teks.slice(awal, akhir > awal ? akhir : teks.length)
      const m = [...potong.matchAll(/→\s*(BENAR|SALAH)/gi)].at(-1)
      return m ? VERDIK(m[1]) : null
    })
    if (v.every(x => x !== null)) return v
  }
  const hasil = []
  for (let i = 1; i <= jml; i++) {
    const awal = teks.search(new RegExp(`(?:^|\\n)\\s*(?:Pernyataan\\s*)?${i}\\s*[).—:-]`, 'i'))
    if (awal < 0) return null
    const berikut = teks.slice(awal + 1).search(new RegExp(`\\n\\s*(?:Pernyataan\\s*)?${i + 1}\\s*[).—:-]`, 'i'))
    const potong = berikut < 0 ? teks.slice(awal) : teks.slice(awal, awal + 1 + berikut)
    const v = [...potong.matchAll(/→\s*(BENAR|SALAH|B\b|S\b)|\b(BENAR|SALAH)\s*\.?\s*$/gim)].at(-1)
    if (!v) return null
    hasil.push(VERDIK(v[1] ?? v[2]))
  }
  return hasil.every(v => v !== null) ? hasil : null
}

function kunciButir(soal, p) {
  if (!p || p.kepala == null) return { lewat: 'tidak ada kunci di pembahasan' }
  const kepala = p.kepala
  // Templat "Soal N": "Deskripsi Soal:" mengulang soal; yang berguna sesudah "Langkah Pembahasan:".
  const baris = p.isi.join('\n').split('\n')
  const iLangkah = baris.findIndex(l => /^\s*Langkah Pembahasan\s*:?\s*$/i.test(l))
  const penjelasan = (iLangkah >= 0 ? baris.slice(iLangkah + 1) : baris)
    .join('\n')
    .replace(/^\s*Pembahasan\s*:?\s*/i, '')
    .trim()

  // Pemeriksaan silang: kalau pembahasan menyebut huruf DAN teks jawabannya,
  // teks itu harus cocok dengan pilihan di huruf tersebut. Nomor yang bergeser
  // atau pilihan yang diacak ulang tertangkap di sini, bukan jadi kunci salah.
  const cocokTeks = (teksKunci, teksOpsi) => {
    const a = norm(teksKunci).slice(0, 30)
    const o = norm(teksOpsi)
    return !a || o.startsWith(a) || a.startsWith(o.slice(0, 30)) || o.includes(a)
  }
  if (soal.tipe === 'pilihan') {
    const m = /^([A-E](?:\s*(?:,|dan|&|\/)\s*[A-E])*)\b/.exec(kepala)
    if (!m) {
      // "N. <teks jawaban>": cocokkan ke pilihan; harus tepat satu.
      const cocok = soal.pilihan.filter(x => norm(x.teks) === norm(kepala))
      if (cocok.length === 1) return { tipe: 'mcq_single', benar: cocok[0].teks, penjelasan }
      return { lewat: `kunci bukan huruf ("${kepala.slice(0, 40)}")` }
    }
    const huruf = [...new Set(m[1].match(/[A-E]/g))]
    const teks = huruf.map(h => soal.pilihan.find(x => x.huruf === h)?.teks)
    if (teks.some(t => !t)) return { lewat: `huruf kunci ${huruf.join(',')} di luar pilihan` }
    const sisa = /^[A-E]\s*[.)]\s*(.+)$/.exec(kepala)
    if (huruf.length === 1 && sisa && !cocokTeks(sisa[1], teks[0])) {
      return { lewat: `huruf ${huruf[0]} tidak cocok dengan teks kunci ("${sisa[1].slice(0, 30)}")` }
    }
    return huruf.length === 1
      ? { tipe: 'mcq_single', benar: teks[0], penjelasan }
      : { tipe: 'mcq_multi', benar: teks, penjelasan }
  }

  if (soal.tipe === 'multi_tanpa_huruf' || soal.tipe === 'opsi_tanpa_huruf') {
    const jml = soal.pernyataan.length
    const kutip = [...kepala.matchAll(/[“"]([^”"]+)[”"]/g)].map(x => norm(x[1]))
    let idx
    if (kutip.length) {
      idx = kutip.map(k => soal.pernyataan.findIndex(s => norm(s).includes(k) || k.includes(norm(s))))
    } else {
      const huruf = /^([A-E](?:\s*(?:,|dan|&|\/)\s*[A-E])*)\b/.exec(kepala)
      const polos = soal.pernyataan.map(t => norm(t) === norm(kepala))
      if (huruf) {
        idx = [...new Set(huruf[1].match(/[A-E]/g))].map(h => h.charCodeAt(0) - 65)
        const sisa = /^[A-E]\s*[.)]\s*(.+)$/.exec(kepala)
        if (idx.length === 1 && sisa && soal.pernyataan[idx[0]] && !cocokTeks(sisa[1], soal.pernyataan[idx[0]])) {
          return { lewat: `huruf ${huruf[1]} tidak cocok dengan teks kunci ("${sisa[1].slice(0, 30)}")` }
        }
      } else if (soal.tipe === 'opsi_tanpa_huruf' && polos.filter(Boolean).length === 1) idx = [polos.findIndex(Boolean)]
      else {
        const angka = kepala.replace(/(?:pernyataan|pilihan|nomor|no\.?|jawaban)/gi, '').match(/\d+/g)
        idx = (angka ?? []).map(n => Number(n) - 1)
      }
    }
    if (!idx.length || idx.some(i => i < 0 || i >= jml)) {
      return { lewat: `kunci pernyataan tidak terbaca ("${kepala.slice(0, 50)}")` }
    }
    const urut = [...new Set(idx)].sort((a, b) => a - b).map(i => soal.pernyataan[i])
    // Soal berpetunjuk "pilih lebih dari satu" tapi hanya satu kunci terbaca:
    // hampir selalu pembahasan prosa yang cuma menyebut pernyataan pertama.
    if (soal.tipe === 'multi_tanpa_huruf' && urut.length < 2) {
      return { lewat: 'soal "pilih lebih dari satu" tapi kunci terbaca hanya satu' }
    }
    const banyak = soal.tipe === 'multi_tanpa_huruf' || urut.length > 1
    return banyak
      ? { tipe: 'mcq_multi', benar: urut, penjelasan }
      : { tipe: 'mcq_single', benar: urut[0], penjelasan }
  }

  if (soal.tipe === 'statement_grid') {
    const k = kunciGrid(soal.pernyataan.length, kepala, p.isi)
    if (!k) {
      if (process.argv.includes('--tampil')) console.log(`   [grid ${soal.nomor}] kepala="${kepala}" isi=${JSON.stringify(p.isi).slice(0, 900)}`)
      return { lewat: `putusan grid tidak lengkap ("${kepala.slice(0, 50)}")` }
    }
    return { tipe: 'statement_grid', jawab: k, penjelasan }
  }
  return { lewat: 'tipe tidak dikenali' }
}

/** Buang baris awal pembahasan yang hanya mengulang kalimat soal. */
function tanpaUlangSoal(penjelasan, prompt) {
  const p = norm(prompt)
  const baris = (penjelasan ?? '').split('\n')
  while (baris.length && baris[0].trim() && (p.includes(norm(baris[0])) || norm(baris[0]).includes(p.slice(-60)))) baris.shift()
  return baris.join('\n').replace(/^\s*Pembahasan\s*:?\s*/i, '').trim()
}

function jadikanButir(soal, kunciHasil) {
  const dasar = { prompt: soal.prompt, weight: 1, explanation: tanpaUlangSoal(kunciHasil.penjelasan, soal.prompt).slice(0, 4000) || null, bloom: soal.bloom }
  if (kunciHasil.tipe === 'statement_grid') {
    return {
      ...dasar,
      type: 'statement_grid',
      options: { statements: soal.pernyataan, answer_labels: soal.kolom },
      correct_answer: { answers: kunciHasil.jawab, grading_mode: 'proportional' },
    }
  }
  const pilihan = soal.tipe === 'pilihan' ? soal.pilihan.map(x => x.teks) : soal.pernyataan
  if (pilihan.some(t => PETUNJUK_BANYAK.test(t) || /^\(.*(?:jawaban|pilih).*\)$/i.test(t.trim()))) return null
  if (new Set(pilihan).size !== pilihan.length) return null
  return {
    ...dasar,
    type: kunciHasil.tipe,
    options: { choices: pilihan },
    correct_answer: kunciHasil.benar,
  }
}

async function periksaKunci(b) {
  const jawab = b.type === 'statement_grid' ? b.correct_answer.answers : b.correct_answer
  for (const skema of ['sederhana', 'pengukuran']) {
    const { data, error } = await db.rpc('nilai_jawaban', {
      p_tipe: b.type, p_opsi: b.options, p_kunci: b.correct_answer, p_jawaban: jawab, p_bobot: b.weight, p_skema: skema,
    })
    if (error) return error.message
    if (Number(data) !== Number(b.weight)) return `kunci bernilai ${data} (skema ${skema})`
  }
  return null
}

// ------------------------------------------------------------ drive & sesi

async function telusuri(id, jalur, keluar) {
  let token
  do {
    const r = await drive.files.list({
      q: `'${id}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id,name,mimeType)',
      pageSize: 200, pageToken: token, supportsAllDrives: true, includeItemsFromAllDrives: true,
    })
    for (const f of r.data.files ?? []) {
      if (f.mimeType === 'application/vnd.google-apps.folder') await telusuri(f.id, `${jalur}/${f.name}`, keluar)
      else keluar.push({ ...f, jalur: `${jalur}/${f.name}` })
    }
    token = r.data.nextPageToken
  } while (token)
}

const idDari = u => (/\/d\/([\w-]+)/.exec(u ?? '') ?? /[?&]id=([\w-]+)/.exec(u ?? ''))?.[1] ?? null

async function unduh(fileId, mime, ke) {
  const r = mime === GDOC
    ? await drive.files.export({ fileId, mimeType: DOCX }, { responseType: 'arraybuffer' })
    : await drive.files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' })
  writeFileSync(ke, Buffer.from(r.data))
}

const berkas = []
await telusuri(FOLDER, '', berkas)
const perId = new Map(berkas.map(f => [f.id, f]))
const perJalur = new Map(berkas.map(f => [f.jalur, f]))
// Nama PDF dan docx sering berbeda tanda baca ("TKA: Bilangan" -> "TKA_ Bilangan"),
// jadi saudara dicari dalam folder yang sama dengan nama ternormalisasi.
const docxPerFolder = new Map()
for (const f of berkas) {
  if (f.mimeType !== DOCX) continue
  const folder = f.jalur.slice(0, f.jalur.lastIndexOf('/'))
  const kunciNama = f.name.replace(/\.docx$/i, '')
  ;(docxPerFolder.get(folder) ?? docxPerFolder.set(folder, []).get(folder)).push({ f, n: kunciNama.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() })
}
const saudaraDocx = pdf => {
  const folder = pdf.jalur.slice(0, pdf.jalur.lastIndexOf('/'))
  const n = pdf.name.replace(/\.pdf$/i, '').replace(/\.docx$/i, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  return (docxPerFolder.get(folder) ?? []).find(x => x.n === n)?.f ?? null
}

const sesi = []
for (let d = 0; ; d += 1000) {
  const { data } = await db.from('sessions').select('id, cp_urls, cp_pembahasan_urls, selected_cp_ids').order('id').range(d, d + 999)
  sesi.push(...data)
  if (data.length < 1000) break
}
const unik = new Map()
for (const s of sesi) {
  for (const [k, u] of Object.entries(s.cp_urls ?? {})) {
    const pemb = (s.cp_pembahasan_urls ?? {})[k]
    const sid = idDari(u), pid = idDari(pemb)
    if (sid && pid && !unik.has(sid)) unik.set(sid, { kunciTopik: k, soalId: sid, pembId: pid })
  }
}

const { data: grup } = await db.from('curriculum_topic_groups').select('id')
const grupSah = new Set(grup.map(g => g.id))
const cpKeGrup = new Map()
for (let d = 0; ; d += 1000) {
  const { data } = await db.from('curriculum_topics').select('id, group_id').order('id').range(d, d + 999)
  for (const c of data) cpKeGrup.set(c.id, c.group_id)
  if (data.length < 1000) break
}

if (TANPA_PEMBAHASAN) {
  unik.clear()
  // 1. Latihan soal yang tutor tautkan tanpa pembahasan (bukan topik custom).
  for (const x of sesi) {
    for (const [k, u] of Object.entries(x.cp_urls ?? {})) {
      if ((x.cp_pembahasan_urls ?? {})[k] || k.startsWith('custom')) continue
      const sid = idDari(u)
      if (sid && !unik.has(sid)) unik.set(sid, { kunciTopik: k, soalId: sid, pembId: null })
    }
  }
  // 2. Asesmen berupa berkas Drive (bukan form). Topiknya dari sesi tempat
  // dipakai, dan hanya bila semua sesinya menyebut SATU topik yang sama.
  const asesmen = []
  for (let d = 0; ; d += 1000) {
    const { data } = await db.from('assessments').select('link_url, session_id').not('link_url', 'is', null).order('id').range(d, d + 999)
    asesmen.push(...data)
    if (data.length < 1000) break
  }
  const grupSesi = new Map(sesi.map(x => [x.id, new Set((x.selected_cp_ids ?? []).map(c => cpKeGrup.get(c)).filter(Boolean))]))
  const perBerkas = new Map()
  for (const a of asesmen) {
    if (/forms/.test(a.link_url) || !/drive\.google|docs\.google\.com\/(document|presentation|spreadsheets)/.test(a.link_url)) continue
    const id = idDari(a.link_url)
    if (!id) continue
    const gs = perBerkas.get(id) ?? new Set()
    for (const g of grupSesi.get(a.session_id) ?? []) gs.add(g)
    perBerkas.set(id, gs)
  }
  for (const [id, gs] of perBerkas) if (gs.size === 1 && !unik.has(id)) unik.set(id, { kunciTopik: [...gs][0], soalId: id, pembId: null })
}

/**
 * Kunci + pembahasan BUATAN (ditulis Claude, 29 Okt 2026) untuk butir yang
 * soalnya terbaca tapi kuncinya tidak pasti di dokumen. Dikunci `soalId#nomor`.
 * Berbeda dari kunci dokumen: ini hasil mengerjakan soalnya, bukan membaca
 * kunci tutor — jadi butirnya masuk draf dan tercatat di manifes tinjauan
 * (`docs/bank-soal/butir-kunci-buatan-claude.json`) supaya pemeriksa tahu
 * mana yang kuncinya tidak berasal dari dokumen sumber.
 */
const buatan = BERKAS_JAWABAN ? JSON.parse(readFileSync(BERKAS_JAWABAN, 'utf8')) : {}

function dariJawabanBuatan(s, jw) {
  const opsi = s.tipe === 'pilihan' ? s.pilihan.map(x => x.teks) : s.pernyataan
  const penjelasan = (jw.pembahasan ?? '').trim()
  if (!penjelasan) return 'jawaban buatan tanpa pembahasan'
  if (s.tipe === 'statement_grid') {
    if (!Array.isArray(jw.jawab) || jw.jawab.length !== opsi.length || jw.jawab.some(v => typeof v !== 'boolean')) return 'kunci grid buatan tidak sesuai jumlah baris'
    return { prompt: s.prompt, weight: 1, explanation: penjelasan, bloom: s.bloom, type: 'statement_grid',
      options: { statements: opsi, answer_labels: s.kolom ?? ['Benar', 'Salah'] },
      correct_answer: { answers: jw.jawab, grading_mode: 'proportional' } }
  }
  const idx = [].concat(jw.jawab)
  if (!idx.length || idx.some(i => !Number.isInteger(i) || i < 0 || i >= opsi.length)) return 'indeks kunci buatan di luar pilihan'
  if (new Set(opsi).size !== opsi.length) return 'pilihan kembar'
  const banyak = Array.isArray(jw.jawab)
  if (banyak && idx.length < 2) return 'kunci buatan multi hanya satu'
  let prompt = s.prompt
  // Soal yang punya lebih dari satu kunci harus memberi tahu murid.
  if (banyak && !PETUNJUK_BANYAK.test(prompt)) prompt = `${prompt}\n(Pilih lebih dari satu jawaban yang benar)`
  return { prompt, weight: 1, explanation: penjelasan, bloom: s.bloom, type: banyak ? 'mcq_multi' : 'mcq_single',
    options: { choices: opsi }, correct_answer: banyak ? idx.map(i => opsi[i]) : opsi[idx[0]] }
}

const ringkas = { pasangan: 0, butirSiap: 0, butirLewat: 0, pasanganLewat: 0 }
const hasilSemua = []
const kerja = []

for (const p of unik.values()) {
  const groupId = grupSah.has(p.kunciTopik) ? p.kunciTopik : cpKeGrup.get(p.kunciTopik) ?? null
  const asal = perId.get(p.soalId)
  const nama = asal?.jalur ?? p.soalId
  if (JALUR && !nama.includes(JALUR)) continue
  ringkas.pasangan++
  if (!groupId) { console.log(`LEWAT    ${nama}: kunci topik "${p.kunciTopik.slice(0, 12)}" bukan topik kurikulum`); ringkas.pasanganLewat++; continue }
  let soalDocx = asal?.mimeType === DOCX || asal?.mimeType === GDOC ? asal : asal?.name.toLowerCase().endsWith('.pdf') ? saudaraDocx(asal) : null
  // Berkas di luar folder bimbel: tanyakan tipenya langsung (galat = belum dibagikan ke akun layanan).
  if (!asal && TANPA_PEMBAHASAN) {
    try {
      const m = (await drive.files.get({ fileId: p.soalId, fields: 'id, name, mimeType', supportsAllDrives: true })).data
      if (m.mimeType === DOCX || m.mimeType === GDOC) soalDocx = { id: m.id, name: m.name, mimeType: m.mimeType, jalur: m.name }
    } catch { /* tak terjangkau */ }
  }
  // Pembahasan sering disimpan tutor di luar folder bimbel, jadi tipenya
  // ditanyakan langsung (galat = belum dibagikan ke service account).
  let pemb = null
  if (p.pembId) {
    pemb = perId.get(p.pembId)
    if (!pemb) {
      try {
        pemb = { id: p.pembId, ...(await drive.files.get({ fileId: p.pembId, fields: 'mimeType', supportsAllDrives: true })).data }
      } catch {
        pemb = { id: p.pembId, mimeType: null }
      }
    }
  }
  if (!soalDocx || (soalDocx.mimeType !== DOCX && soalDocx.mimeType !== GDOC)) { console.log(`LEWAT    ${nama}: tidak ada saudara .docx untuk soal`); ringkas.pasanganLewat++; continue }
  if (pemb && pemb.mimeType !== DOCX && pemb.mimeType !== GDOC) { console.log(`LEWAT    ${nama}: pembahasan bukan docx/GDoc (${pemb.mimeType ?? 'tak terjangkau'})`); ringkas.pasanganLewat++; continue }

  let bSoal, bPemb
  try {
    await unduh(soalDocx.id, soalDocx.mimeType, join(TMP, 's.docx'))
    bSoal = bacaDocx(join(TMP, 's.docx'))
    if (pemb) {
      await unduh(pemb.id, pemb.mimeType, join(TMP, 'p.docx'))
      bPemb = bacaDocx(join(TMP, 'p.docx'))
    } else bPemb = []
  } catch (e) {
    console.log(`LEWAT    ${nama}: ${e.message.slice(0, 80)}`); ringkas.pasanganLewat++; continue
  }
  const soal = uraikanSoal(bSoal)
  if (process.argv.includes('--tampil')) {
    console.log(`   [pembahasan bernomor: ${[...uraikanPembahasan(bPemb).keys()].join(',')}]`)
    for (const t of bPemb.filter(x => x.jenis === 'p' && /^\s*(\d+\s*[.)]|jawaban|nomor)/i.test(x.teks)).slice(0, 14)) console.log(`   | ${t.teks.slice(0, 110)}`)
  }
  const pembahasan = uraikanPembahasan(bPemb)
  if (soal.length === 0) { console.log(`LEWAT    ${nama}: tidak ada butir "N. (Level Cx ...)"`); ringkas.pasanganLewat++; continue }

  const siap = []
  const lewat = []
  for (const s of soal) {
    if (s.lewat) {
      lewat.push(`${s.nomor}: ${s.lewat}`)
      if (process.argv.includes('--tampil') && s.mentah) console.log(`   [${s.nomor}] ${JSON.stringify(s.mentah).slice(0, 700)}`)
      continue
    }
    const k = kunciButir(s, pembahasan.get(s.nomor))
    const jwBuatan = k.lewat ? buatan[`${p.soalId}#${s.nomor}`] : null
    if (jwBuatan) {
      const b = dariJawabanBuatan(s, jwBuatan)
      if (typeof b === 'string') { lewat.push(`${s.nomor}: ${b}`); continue }
      const salah = await periksaKunci(b)
      if (salah) { lewat.push(`${s.nomor}: kunci buatan ditolak penilai (${salah})`); continue }
      siap.push({ ...b, buatan: `${p.soalId}#${s.nomor}`, nomor: s.nomor })
      continue
    }
    if (k.lewat) {
      lewat.push(`${s.nomor}: ${k.lewat}`)
      const ph = pembahasan.get(s.nomor)
      kerja.push({
        id: `${p.soalId}#${s.nomor}`, groupId, sumber: nama.replace(/^\//, ''), nomor: s.nomor, bloom: s.bloom,
        tipe: s.tipe, prompt: s.prompt,
        pilihan: s.tipe === 'pilihan' ? s.pilihan.map(x => x.teks) : s.pernyataan,
        kolom: s.kolom ?? null,
        alasanLewat: k.lewat,
        kunciDokumen: ph?.kepala ?? null,
        pembahasanDokumen: ph ? ph.isi.join('\n').slice(0, 1500) : null,
      })
      continue
    }
    const butir = jadikanButir(s, k)
    if (!butir || !butir.prompt) { lewat.push(`${s.nomor}: pilihan kembar / kalimat soal kosong`); continue }
    const salah = await periksaKunci(butir)
    if (salah) { lewat.push(`${s.nomor}: ${salah}`); continue }
    siap.push(butir)
  }
  ringkas.butirSiap += siap.length
  ringkas.butirLewat += lewat.length
  console.log(`${siap.length ? 'SIAP    ' : 'KOSONG  '} ${nama.replace(/^\//, '')}: ${siap.length}/${soal.length} butir${lewat.length ? ` | dilewati: ${lewat.join(' ; ').slice(0, 300)}` : ''}`)
  hasilSemua.push({ groupId, nama, siap, paketKunci: `doc:${p.soalId}` })
}

if (BERKAS_KERJA) {
  writeFileSync(BERKAS_KERJA, JSON.stringify(kerja, null, 1))
  console.log(`\n${kerja.length} butir kerja ditulis ke ${BERKAS_KERJA}`)
}
console.log(`\n${ringkas.pasangan} pasangan diperiksa (${ringkas.pasanganLewat} dilewati utuh); ${ringkas.butirSiap} butir siap, ${ringkas.butirLewat} butir dilewati.`)
if (ISI_KUNCI) {
  // Tidak menulis butir baru: hanya menempelkan penanda paket pada butir yang sudah ada.
  let terisi = 0, tanpaPasangan = 0
  for (const h of hasilSemua) {
    const { data: tag } = await db.from('question_curriculum_tags').select('question_bank_items(id, prompt, paket_kunci)').eq('group_id', h.groupId)
    const ada = ((tag ?? []).map(t => t.question_bank_items).filter(Boolean))
    for (const b of h.siap) {
      const cocok = ada.find(x => norm(x.prompt) === norm(b.prompt) && !x.paket_kunci)
      if (!cocok) { tanpaPasangan++; continue }
      cocok.paket_kunci = h.paketKunci
      const { error } = await db.from('question_bank_items').update({ paket_kunci: h.paketKunci }).eq('id', cocok.id)
      if (error) { console.error(`GAGAL    ${h.nama}: ${error.message}`); process.exit(1) }
      terisi++
    }
  }
  console.log(`\n${terisi} butir diberi paket_kunci doc:*; ${tanpaPasangan} butir hasil uraian tidak punya pasangan di bank (sudah ada penandanya atau bukan hasil impor).`)
  process.exit(0)
}
if (!TULIS) {
  console.log('Belum ditulis. Tambahkan --tulis untuk memasukkan yang SIAP sebagai butir draf.')
  process.exit(0)
}

const { data: admin } = await db.from('profiles').select('id').eq('role', 'admin').order('created_at').limit(1)
const penulis = admin?.[0]?.id ?? null
let masuk = 0
for (const h of hasilSemua) {
  if (!h.siap.length) continue
  const { data: ada } = await db.from('question_curriculum_tags').select('question_bank_items(prompt)').eq('group_id', h.groupId)
  const sudah = new Set((ada ?? []).map(a => norm(a.question_bank_items?.prompt ?? '')))
  const baru = h.siap.filter(b => !sudah.has(norm(b.prompt)))
  if (!baru.length) { console.log(`ADA      ${h.nama}: semua butir sudah ada`); continue }
  const { data: dimasukkan, error } = await db.from('question_bank_items').insert(
    baru.map(b => ({
      created_by: penulis, type: b.type, prompt: b.prompt, options: b.options, correct_answer: b.correct_answer,
      weight: b.weight, explanation: b.explanation, bloom_level: b.bloom, status_verifikasi: 'draf', sumber_pembuatan: 'manual',
      paket_kunci: h.paketKunci,
    })),
  ).select('id')
  if (error || !dimasukkan) { console.error(`GAGAL    ${h.nama}: ${error?.message}`); continue }
  const { error: galatTag } = await db.from('question_curriculum_tags').insert(
    dimasukkan.map(d => ({ question_bank_item_id: d.id, group_id: h.groupId })),
  )
  if (galatTag) {
    await db.from('question_bank_items').delete().in('id', dimasukkan.map(d => d.id))
    console.error(`GAGAL    ${h.nama}: tag topik gagal (${galatTag.message}); butir dibatalkan`)
    continue
  }
  masuk += dimasukkan.length
  // Manifes butir yang kuncinya buatan Claude: id baris di bank + asal dokumen.
  const manifes = baru
    .map((b, i) => (b.buatan ? { id: dimasukkan[i].id, ref: b.buatan, sumber: h.nama.replace(/^\//, ''), nomor: b.nomor } : null))
    .filter(Boolean)
  if (manifes.length) {
    const jalurManifes = 'docs/bank-soal/butir-kunci-buatan-claude.json'
    let lama = []
    try { lama = JSON.parse(readFileSync(jalurManifes, 'utf8')) } catch {}
    writeFileSync(jalurManifes, JSON.stringify([...lama, ...manifes], null, 1))
  }
  console.log(`DITULIS  ${h.nama}: ${dimasukkan.length} butir (draf)`)
}
console.log(`\n${masuk} butir masuk sebagai draf.`)
