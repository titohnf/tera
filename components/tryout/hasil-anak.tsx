import type { ReactNode } from 'react'
import { IsiHasil } from '@/components/tryout/RiwayatKemampuan'
import { learnerAnak } from '@/lib/belajar/sesi'
import { muatTryOut, tryOutSiswa } from '@/lib/reports/tryout-data'
import { susunRiwayat, type MasukanTryOut } from '@/lib/tryout/riwayat-kemampuan'

/**
 * Isi hasil tiap try out yang sudah dikerjakan seorang anak (kunci: id try out), untuk dipasang
 * di dalam kartu try out itu, baik di akun keluarga maupun akun siswa.
 */
export async function muatIsiHasil(studentId: string): Promise<Record<string, { nilai: number | null; isi: ReactNode }>> {
  const learnerId = await learnerAnak(studentId)
  const riwayat = learnerId ? await tryOutSiswa(learnerId) : []

  // Satu percobaan per try out, memakai percobaan TERBARU anak ini di try out itu.
  const terbaruPerKuis = new Map<string, { attemptId: string; dikirim: string }>()
  for (const r of riwayat) if (!terbaruPerKuis.has(r.quizId)) terbaruPerKuis.set(r.quizId, { attemptId: r.attemptId, dikirim: r.dikirim })

  const masukan: MasukanTryOut[] = []
  for (const [quizId, p] of terbaruPerKuis) {
    const data = await muatTryOut(quizId, { denganTeks: true, attemptId: p.attemptId })
    if (!data) continue
    const saya = data.percobaan.find((x) => x.id === p.attemptId)
    if (!saya) continue
    masukan.push({
      quizId,
      judul: data.judul,
      jenjang: data.jenjang,
      mapel: data.mapel,
      urut: data.urut,
      dikirim: p.dikirim,
      attemptId: p.attemptId,
      nilai: data.bobotTotal > 0 && saya.skor !== null ? (saya.skor / data.bobotTotal) * 100 : null,
      soal: data.soal,
      skor: data.skor,
      teks: data.teks,
    })
  }
  const hasil: Record<string, { nilai: number | null; isi: ReactNode }> = {}
  for (const m of masukan) {
    const [mapel] = susunRiwayat([m])
    if (mapel) hasil[m.quizId] = { nilai: m.nilai, isi: <IsiHasil m={mapel} /> }
  }
  return hasil
}
