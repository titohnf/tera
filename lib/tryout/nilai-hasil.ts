import type { HasilTryOut } from '@/components/tryout/HasilPeserta'

/** Skor akhir (0–100) tiap try out yang hasilnya sudah dibuka, dari hasil peserta berkode atau akun (quizId → nilai). */
export function nilaiDariHasil(hasil: HasilTryOut | null): Record<string, number | null> {
  const nilai: Record<string, number | null> = {}
  for (const p of hasil?.paket ?? []) {
    const bobot = p.soal.reduce((a, s) => a + s.bobot, 0)
    const skor = p.skor ?? p.soal.reduce((a, s) => a + s.skor, 0)
    nilai[p.quiz_id] = bobot > 0 ? (skor / bobot) * 100 : null
  }
  return nilai
}
