import RiwayatKemampuan from '@/components/tryout/RiwayatKemampuan'
import { learnerAnak } from '@/lib/belajar/sesi'
import { muatTryOut, tryOutSiswa } from '@/lib/reports/tryout-data'
import { susunRiwayat, type MasukanTryOut } from '@/lib/tryout/riwayat-kemampuan'

/**
 * Hasil Try Out seorang anak: nilai dan kemampuan per bidang, dipakai di halaman akun keluarga
 * dan akun siswa (masuk dengan kode), supaya keduanya tetap di akunnya sendiri.
 */
export default async function HasilAnak({ studentId }: { studentId: string }) {
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
  const seri = susunRiwayat(masukan)

  if (seri.length === 0) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-kartu">
        <p className="font-semibold tracking-tight text-gray-900">Belum ada hasil try out</p>
        <p className="mt-1 text-sm text-gray-500">
          Hasil try out muncul di sini setelah anak mengerjakan try out dan hasilnya dibuka oleh admin Bimbel Tera, biasanya setelah semua sesi try out selesai.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Hasil</h2>
      <RiwayatKemampuan riwayat={seri} />
    </div>
  )
}
