import type {
  KunciPernyataan,
  OpsiMenjodohkan,
  OpsiPernyataan,
  OpsiSoal,
  OpsiUrutan,
  TipeSoal,
} from './tipe-soal'

/**
 * Penilaian satu jawaban terhadap kuncinya.
 *
 * Salinan `gradeAnswer` dari `src/lib/grading.ts` di repo `form`, dan
 * KESAMAANNYA ADALAH INTINYA: sebuah soal harus bernilai sama persis entah
 * dikerjakan lewat Sora, lewat paket soal di kelas, atau di sini. Kalau
 * aturannya berubah di sana, berkas ini ikut berubah — perbedaannya tidak akan
 * terlihat sebagai galat, melainkan sebagai nilai yang berbeda untuk pekerjaan
 * yang sama.
 *
 * `null` berarti tidak dinilai otomatis. Permukaan ini tidak pernah mengundi
 * soal seperti itu (lihat `TIPE_TANPA_NILAI_OTOMATIS`), jadi null di sini
 * berarti sesi lama yang terlanjur memuatnya — dan halamannya melewatinya
 * alih-alih memberinya nol.
 */
export interface HasilNilai {
  nilai: number | null
}

function normal(nilai: unknown): string {
  return String(nilai ?? '').trim().toLowerCase()
}

function himpunan(nilai: unknown): Set<string> {
  return new Set((Array.isArray(nilai) ? nilai : []).map(normal))
}

function himpunanSama(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every(v => b.has(v))
}

export function nilaiJawaban(
  soal: { tipe: TipeSoal; opsi: OpsiSoal; bobot: number; kunci: unknown },
  jawaban: unknown
): HasilNilai {
  const { tipe, opsi, bobot, kunci } = soal

  switch (tipe) {
    case 'mcq_single':
    case 'true_false':
      return { nilai: normal(kunci) === normal(jawaban) ? bobot : 0 }

    case 'short_answer': {
      const kunciList = Array.isArray(kunci) ? (kunci as unknown[]) : [kunci]
      return { nilai: kunciList.some(k => normal(k) === normal(jawaban)) ? bobot : 0 }
    }

    case 'mcq_multi':
      return { nilai: himpunanSama(himpunan(kunci), himpunan(jawaban)) ? bobot : 0 }

    case 'matching': {
      const pasangan = (opsi as OpsiMenjodohkan | null)?.pairs ?? []
      const dikirim = (jawaban ?? {}) as Record<string, string>
      const benar = pasangan.every(p => normal(dikirim[p.left]) === normal(p.right))
      return { nilai: benar && pasangan.length > 0 ? bobot : 0 }
    }

    case 'ordering': {
      const urutanBenar = (opsi as OpsiUrutan | null)?.items ?? []
      const dikirim = Array.isArray(jawaban) ? (jawaban as unknown[]) : []
      const benar =
        urutanBenar.length > 0 &&
        urutanBenar.length === dikirim.length &&
        urutanBenar.every((item, i) => normal(item) === normal(dikirim[i]))
      return { nilai: benar ? bobot : 0 }
    }

    case 'fill_blank': {
      const kunciList = Array.isArray(kunci) ? (kunci as unknown[]) : []
      const dikirim = Array.isArray(jawaban) ? (jawaban as unknown[]) : []
      if (kunciList.length === 0) return { nilai: 0 }
      const benar = kunciList.filter((k, i) => normal(k) === normal(dikirim[i])).length
      return { nilai: (bobot * benar) / kunciList.length }
    }

    case 'statement_grid': {
      const pernyataan = (opsi as OpsiPernyataan | null)?.statements ?? []
      const k = (kunci ?? {}) as Partial<KunciPernyataan>
      const kunciBaris = Array.isArray(k.answers) ? k.answers : []
      const dikirim = Array.isArray(jawaban) ? (jawaban as unknown[]) : []
      if (pernyataan.length === 0) return { nilai: 0 }

      // `typeof` menjaga baris yang tidak ditandai tutor: tanpa itu, pernyataan
      // yang tidak dijawab (null) akan cocok dengan kunci yang belum ditandai
      // (null) dan terhitung benar.
      const benar = pernyataan.filter(
        (_, i) => typeof kunciBaris[i] === 'boolean' && dikirim[i] === kunciBaris[i]
      ).length

      if (k.grading_mode === 'all_or_nothing') {
        return { nilai: benar === pernyataan.length ? bobot : 0 }
      }
      return { nilai: (bobot * benar) / pernyataan.length }
    }

    case 'essay':
    case 'upload_file':
    default:
      return { nilai: null }
  }
}

/** Persentase dari skor maksimum, 0–100. Nol kalau tidak ada yang dikerjakan. */
export function persenDari(skor: number, maksimum: number): number {
  if (maksimum <= 0) return 0
  return Math.round((skor / maksimum) * 100)
}
