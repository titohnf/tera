import type {
  KunciPernyataan,
  OpsiMenjodohkan,
  OpsiPernyataan,
  OpsiUrutan,
  SoalLatihan,
  TipeSoal,
} from './tipe-soal'

/**
 * Sebuah jawaban yang siap dibaca: barisnya, dan kalau perlu nama barisnya.
 *
 * Bentuknya daftar, bukan satu string, karena separuh tipe soal memang bukan
 * satu nilai: menjodohkan itu pasangan, mengurutkan itu urutan, kisi pernyataan
 * itu satu keputusan per pernyataan. Menggabungkannya jadi "A, B, C" membuat
 * pembacanya menebak sendiri mana yang berpasangan dengan apa.
 *
 * `teks`-nya mentah — masih boleh memuat `$rumus$`, dan yang menggambarnya
 * `RumusTeks` di komponen. Modul ini tidak tahu apa-apa soal React supaya bisa
 * dipakai di sisi mana pun.
 */
export interface BarisJawaban {
  /** Nama barisnya: pernyataan, ruas kiri pasangan, nomor isian. */
  label?: string
  teks: string
}

function teks(nilai: unknown): string {
  return String(nilai ?? '').trim()
}

/** "Benar"/"Salah" sebagaimana anaknya melihatnya, bukan "true"/"false". */
function benarSalah(nilai: unknown): string {
  const v = teks(nilai).toLowerCase()
  if (v === 'true') return 'Benar'
  if (v === 'false') return 'Salah'
  return v
}

/**
 * Jawaban yang DIKIRIM anaknya, dibaca sesuai tipe soalnya.
 *
 * Null berarti tidak ada yang bisa ditampilkan — soal yang dilewati, atau
 * jawaban kosong. Itu keadaan yang berbeda dari "salah", dan pemanggilnya
 * menyebutnya dengan kata yang berbeda pula.
 */
export function bacaJawaban(soal: SoalLatihan, jawaban: unknown): BarisJawaban[] | null {
  if (jawaban === null || jawaban === undefined) return null

  switch (soal.tipe) {
    case 'true_false':
      return teks(jawaban) ? [{ teks: benarSalah(jawaban) }] : null

    case 'mcq_single':
    case 'short_answer':
      return teks(jawaban) ? [{ teks: teks(jawaban) }] : null

    case 'mcq_multi': {
      const dipilih = (Array.isArray(jawaban) ? jawaban : []).map(teks).filter(Boolean)
      return dipilih.length ? dipilih.map(t => ({ teks: t })) : null
    }

    case 'ordering': {
      const urut = (Array.isArray(jawaban) ? jawaban : []).map(teks).filter(Boolean)
      return urut.length ? urut.map((t, i) => ({ label: `${i + 1}.`, teks: t })) : null
    }

    case 'fill_blank': {
      const isian = Array.isArray(jawaban) ? jawaban : []
      const baris = isian.map((v, i) => ({ label: `Isian ${i + 1}`, teks: teks(v) || '—' }))
      return baris.length ? baris : null
    }

    case 'matching': {
      // Ruas kirinya dari OPSI, bukan dari kunci peta jawabannya: pasangan yang
      // dilewati anaknya harus tetap muncul sebagai baris kosong, bukan hilang.
      const pasangan = (soal.opsi as OpsiMenjodohkan | null)?.pairs ?? []
      const peta = (jawaban ?? {}) as Record<string, unknown>
      return pasangan.length
        ? pasangan.map(p => ({ label: p.left, teks: teks(peta[p.left]) || '—' }))
        : null
    }

    case 'statement_grid': {
      const opsi = soal.opsi as OpsiPernyataan | null
      const pernyataan = opsi?.statements ?? []
      const [labelBenar, labelSalah] = opsi?.answer_labels ?? ['Benar', 'Salah']
      const dikirim = Array.isArray(jawaban) ? jawaban : []
      return pernyataan.length
        ? pernyataan.map((p, i) => ({
            label: p,
            teks: dikirim[i] === true ? labelBenar : dikirim[i] === false ? labelSalah : '—',
          }))
        : null
    }

    default:
      return null
  }
}

/**
 * Kunci jawabannya, dalam bentuk yang sama persis dengan `bacaJawaban()`.
 *
 * Sengaja satu bentuk untuk keduanya: yang dilakukan pembacanya di layar hasil
 * adalah MEMBANDINGKAN dua daftar baris demi baris, dan dua susunan berbeda
 * memaksanya menerjemahkan dulu sebelum bisa membandingkan.
 *
 * Beberapa tipe kuncinya tidak ada di kolom `correct_answer` melainkan di
 * `options` — urutan yang benar itu urutan `items` apa adanya, dan pasangan
 * yang benar itu isi `pairs` sendiri. Di situlah keduanya diambil.
 */
export function bacaKunci(soal: SoalLatihan, kunci: unknown): BarisJawaban[] | null {
  switch (soal.tipe) {
    case 'ordering': {
      const item = (soal.opsi as OpsiUrutan | null)?.items ?? []
      return item.length ? item.map((t, i) => ({ label: `${i + 1}.`, teks: t })) : null
    }

    case 'matching': {
      const pasangan = (soal.opsi as OpsiMenjodohkan | null)?.pairs ?? []
      return pasangan.length ? pasangan.map(p => ({ label: p.left, teks: p.right })) : null
    }

    case 'statement_grid': {
      const opsi = soal.opsi as OpsiPernyataan | null
      const pernyataan = opsi?.statements ?? []
      const [labelBenar, labelSalah] = opsi?.answer_labels ?? ['Benar', 'Salah']
      const jawabanKunci = (kunci ?? {}) as Partial<KunciPernyataan>
      const baris = Array.isArray(jawabanKunci.answers) ? jawabanKunci.answers : []
      return pernyataan.length
        ? pernyataan.map((p, i) => ({
            label: p,
            // Pernyataan yang tidak ditandai penyusunnya tidak punya kunci, dan
            // memang tidak ikut dinilai (lihat `nilaiJawaban`). Ditulis "—",
            // bukan ditebak jadi salah satu label.
            teks: baris[i] === true ? labelBenar : baris[i] === false ? labelSalah : '—',
          }))
        : null
    }

    case 'short_answer': {
      // Kuncinya bisa berupa beberapa ejaan yang sama-sama diterima. Semuanya
      // disebut: "jawabannya 1/2" yang menyembunyikan bahwa "0,5" juga diterima
      // membuat anak mengira jawabannya salah bentuk.
      const daftar = (Array.isArray(kunci) ? kunci : [kunci]).map(teks).filter(Boolean)
      return daftar.length ? daftar.map(t => ({ teks: t })) : null
    }

    default:
      return bacaJawaban(soal, kunci)
  }
}

/** Ada tidaknya bentuk yang bisa digambar untuk tipe ini. */
export function bisaDitinjau(tipe: TipeSoal): boolean {
  return tipe !== 'essay' && tipe !== 'upload_file'
}
