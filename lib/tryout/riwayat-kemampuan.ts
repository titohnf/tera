import type { TeksSoal } from '@/lib/reports/tryout-data'
import type { SkorAnalisis, SoalAnalisis } from '@/lib/reports/kompetensi-tryout'

/**
 * Riwayat kemampuan seorang anak per mata pelajaran lintas try out, untuk orang tua dan anak.
 *
 * Satu mata pelajaran (jenjang + mapel) bisa punya beberapa try out berurutan (Try Out 1, 2, 3 ...).
 * Tiap try out menambah satu bagian di bawah topik yang sama, jadi perkembangan anak pada satu
 * topik terbaca dari atas ke bawah. Hanya milik anak itu sendiri: tanpa pembanding nasional atau
 * rata-rata peserta (itu untuk admin).
 *
 * Susunannya: bidang (elemen) → topik (kompetensi) → butir (nomor soal, hasilnya: benar,
 * sebagian, atau salah, dan soalnya). Sub-elemen dan indikator tidak ditampilkan.
 */

export type StatusButir = 'benar' | 'sebagian' | 'salah'

export interface ButirRiwayat {
  nomor: number
  /** Id soal dan bobotnya, untuk menampilkan soal itu lagi di pop up. */
  id: string
  bobot: number
  status: StatusButir
  /** Soalnya, bila dimuat. */
  teks: TeksSoal | null
}

export interface TopikPerTryOut {
  butir: ButirRiwayat[]
  benar: number
  total: number
  /** 0–100 menurut skor (jawaban sebagian dihitung sebagian). */
  persen: number | null
}

export interface TopikRiwayat {
  kunci: string
  nama: string
  /** Sejajar dengan `RiwayatMapel.tryOut`; null bila try out itu tidak menguji topik ini. */
  perTryOut: (TopikPerTryOut | null)[]
}

export interface BidangRiwayat {
  kunci: string
  nama: string
  persenPerTryOut: (number | null)[]
  topik: TopikRiwayat[]
}

export interface MasukanTryOut {
  quizId: string
  judul: string
  jenjang: string | null
  mapel: string | null
  /** Pengurut try out dalam satu mata pelajaran (jam buka, atau waktu dibuat). */
  urut: string
  dikirim: string
  attemptId: string
  nilai: number | null
  soal: SoalAnalisis[]
  skor: SkorAnalisis[]
  teks: Record<string, TeksSoal>
}

export interface RiwayatMapel {
  kunci: string
  judul: string
  tryOut: { quizId: string; label: string; judul: string; dikirim: string; nilai: number | null }[]
  bidang: BidangRiwayat[]
}

const EPS = 1e-6

function statusDari(skor: number, bobot: number): StatusButir {
  if (skor >= bobot - EPS) return 'benar'
  if (skor <= EPS) return 'salah'
  return 'sebagian'
}

export function susunRiwayat(masukan: MasukanTryOut[]): RiwayatMapel[] {
  const kelompok = new Map<string, MasukanTryOut[]>()
  for (const m of masukan) {
    const kunci = m.jenjang && m.mapel ? `${m.jenjang}|${m.mapel}` : m.judul
    kelompok.set(kunci, [...(kelompok.get(kunci) ?? []), m])
  }

  const hasil: RiwayatMapel[] = []
  for (const [kunci, daftar] of kelompok) {
    const urut = [...daftar].sort((a, b) => a.urut.localeCompare(b.urut))
    const bidang = new Map<string, { nama: string; skor: number[]; maks: number[]; topik: Map<string, TopikRiwayat> }>()

    urut.forEach((to, i) => {
      const skorSoal = new Map<string, number>()
      for (const s of to.skor) if (s.attemptId === to.attemptId) skorSoal.set(s.questionId, (skorSoal.get(s.questionId) ?? 0) + s.skor)

      for (const s of to.soal) {
        const k = s.kompetensi
        if (!k) continue
        let b = bidang.get(k.elemen.nama)
        if (!b) {
          b = { nama: k.elemen.nama, skor: [], maks: [], topik: new Map() }
          bidang.set(k.elemen.nama, b)
        }
        const skor = skorSoal.get(s.id) ?? 0
        b.skor[i] = (b.skor[i] ?? 0) + skor
        b.maks[i] = (b.maks[i] ?? 0) + s.bobot

        let t = b.topik.get(k.kompetensi.nama)
        if (!t) {
          t = { kunci: `${k.elemen.nama}/${k.kompetensi.nama}`, nama: k.kompetensi.nama, perTryOut: urut.map(() => null) }
          b.topik.set(k.kompetensi.nama, t)
        }
        const sel =
          t.perTryOut[i] ?? (t.perTryOut[i] = { butir: [], benar: 0, total: 0, persen: null })
        const status = statusDari(skor, s.bobot)
        sel.butir.push({ nomor: s.nomor, id: s.id, bobot: s.bobot, status, teks: to.teks[s.id] ?? null })
        sel.total += 1
        if (status === 'benar') sel.benar += 1
        // Persen sementara disimpan sebagai jumlah skor; dibagi bobot di bawah.
        sel.persen = (sel.persen ?? 0) + skor / s.bobot
      }
    })

    const daftarBidang: BidangRiwayat[] = [...bidang.entries()].map(([nama, b]) => ({
      kunci: nama,
      nama: b.nama,
      persenPerTryOut: urut.map((_, i) => (b.maks[i] ? (b.skor[i] / b.maks[i]) * 100 : null)),
      topik: [...b.topik.values()].map((t) => ({
        ...t,
        perTryOut: t.perTryOut.map((sel) =>
          sel ? { ...sel, butir: [...sel.butir].sort((x, y) => x.nomor - y.nomor), persen: sel.total > 0 ? ((sel.persen ?? 0) / sel.total) * 100 : null } : null,
        ),
      })),
    }))

    const contoh = urut[0]
    hasil.push({
      kunci,
      judul: contoh.jenjang && contoh.mapel ? `${contoh.mapel} · ${contoh.jenjang}` : contoh.judul,
      tryOut: urut.map((to, i) => ({ quizId: to.quizId, label: `Try Out ${i + 1}`, judul: to.judul, dikirim: to.dikirim, nilai: to.nilai })),
      bidang: daftarBidang,
    })
  }
  return hasil
}
