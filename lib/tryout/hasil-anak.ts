import { learnerAnak } from '@/lib/belajar/sesi'
import { muatTryOut, tryOutSiswa, type DataTryOut } from '@/lib/reports/tryout-data'
import type { MasukanTryOut } from '@/lib/tryout/riwayat-kemampuan'

/** Percobaan TERBARU seorang anak pada tiap try out yang hasilnya sudah dibuka admin (quizId → percobaan). */
async function percobaanTerbaru(studentId: string): Promise<Map<string, { attemptId: string; dikirim: string }>> {
  const learnerId = await learnerAnak(studentId)
  const riwayat = learnerId ? await tryOutSiswa(learnerId) : []
  const terbaru = new Map<string, { attemptId: string; dikirim: string }>()
  for (const r of riwayat) if (!terbaru.has(r.quizId)) terbaru.set(r.quizId, { attemptId: r.attemptId, dikirim: r.dikirim })
  return terbaru
}

function nilaiDari(data: DataTryOut, attemptId: string): number | null {
  const saya = data.percobaan.find((x) => x.id === attemptId)
  if (!saya || saya.skor === null || data.bobotTotal <= 0) return null
  return (saya.skor / data.bobotTotal) * 100
}

/** Skor akhir (0–100) tiap try out yang sudah dikerjakan dan dibuka hasilnya (quizId → nilai). */
export async function muatNilaiAnak(studentId: string): Promise<Record<string, number | null>> {
  const hasil: Record<string, number | null> = {}
  for (const [quizId, p] of await percobaanTerbaru(studentId)) {
    const data = await muatTryOut(quizId)
    if (data) hasil[quizId] = nilaiDari(data, p.attemptId)
  }
  return hasil
}

/** Bahan analisis per topik untuk halaman Laporan Try Out (akun keluarga saja). */
export async function muatMasukanAnak(studentId: string): Promise<MasukanTryOut[]> {
  const masukan: MasukanTryOut[] = []
  for (const [quizId, p] of await percobaanTerbaru(studentId)) {
    const data = await muatTryOut(quizId)
    if (!data || !data.percobaan.some((x) => x.id === p.attemptId)) continue
    masukan.push({
      quizId,
      judul: data.judul,
      jenjang: data.jenjang,
      mapel: data.mapel,
      info: data.info,
      hasilDibuka: data.hasilDibuka,
      urut: data.urut,
      dikirim: p.dikirim,
      attemptId: p.attemptId,
      nilai: nilaiDari(data, p.attemptId),
      soal: data.soal,
      skor: data.skor,
      teks: {},
    })
  }
  return masukan
}

/** Satu try out beserta soal, jawaban anak, kunci, dan pembahasan; null bila belum dikerjakan atau hasilnya belum dibuka. */
export async function muatDetailAnak(studentId: string, quizId: string): Promise<{ data: DataTryOut; attemptId: string; nilai: number | null } | null> {
  const p = (await percobaanTerbaru(studentId)).get(quizId)
  if (!p) return null
  const data = await muatTryOut(quizId, { denganTeks: true, attemptId: p.attemptId })
  if (!data) return null
  return { data, attemptId: p.attemptId, nilai: nilaiDari(data, p.attemptId) }
}
