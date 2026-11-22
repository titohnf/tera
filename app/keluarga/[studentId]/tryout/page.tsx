import { anakOrRedirect } from '@/lib/keluarga'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import DaftarTryOut, { paketTryOutTerbit } from '@/components/tryout/DaftarTryOut'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'
import { kodeAnak } from '@/lib/tryout/kode-anak'
import { learnerAnak } from '@/lib/belajar/sesi'
import RiwayatKemampuan from '@/components/tryout/RiwayatKemampuan'
import { susunRiwayat, type MasukanTryOut } from '@/lib/tryout/riwayat-kemampuan'
import { muatTryOut, tryOutSiswa } from '@/lib/reports/tryout-data'

export const metadata = { title: 'Try Out' }

/**
 * Hasil Try Out seorang anak untuk orang tua: nilainya, dan kemampuannya per bidang dalam kata
 * (sudah kuat, cukup, perlu dilatih). Tanpa pembanding nasional atau rata-rata peserta dan tanpa
 * rincian indikator; itu untuk admin bimbel (Panel admin → Hasil Try Out).
 *
 * Hasil muncul di sini setelah admin membuka hasilnya.
 */
export default async function TryOutKeluargaPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  const learnerId = await learnerAnak(studentId)
  const riwayat = learnerId ? await tryOutSiswa(learnerId) : []

  // Try out yang bisa dikerjakan: tombol Mulai membawa anak ke Sora dengan kodenya sendiri
  // (dibuatkan bila belum ada), jadi tidak perlu mengetik apa pun. Yang sudah dikirim ditandai
  // "sudah mengerjakan", entah hasilnya sudah dibuka admin atau belum.
  const paket = await paketTryOutTerbit(await createClient())
  const kode = await kodeAnak(studentId)
  const selesai = new Map<string, boolean>()
  if (kode) {
    const { data: terkirim } = await createAdminClient()
      .from('attempts')
      .select('quiz_id, quizzes!inner(kind, settings)')
      .eq('learner_id', kode.learnerId)
      .not('submitted_at', 'is', null)
      .eq('quizzes.kind', 'tryout')
    for (const r of (terkirim ?? []) as unknown as { quiz_id: string; quizzes: { settings: { hasil_dibuka?: boolean } | null } }[]) {
      selesai.set(r.quiz_id, selesai.get(r.quiz_id) === true || r.quizzes?.settings?.hasil_dibuka === true)
    }
  }
  const hasilRingkas: HasilTryOut = {
    nama: null,
    paket: [...selesai].filter(([, buka]) => buka).map(([quiz_id]) => ({ quiz_id }) as unknown as HasilTryOut['paket'][number]),
    menunggu: [...selesai].filter(([, buka]) => !buka).map(([quiz_id]) => ({ quiz_id, judul: '' })),
  }
  const daftar = (
    <DaftarTryOut
      paket={paket}
      hasil={hasilRingkas}
      petunjukMasuk="Tekan Mulai, periksa data, lalu kerjakan."
      hrefHasil={(id) => `#hasil-${id}`}
      kode={kode?.kode}
    />
  )

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
      <div className="space-y-6">
      {daftar}
      <div className="rounded-xl bg-white p-4 shadow-kartu">
        <p className="font-semibold tracking-tight text-gray-900">Belum ada hasil try out</p>
        <p className="mt-1 text-sm text-gray-500">
          Hasil try out muncul di sini setelah anak mengerjakan try out dan hasilnya dibuka oleh admin Bimbel Tera, biasanya setelah semua sesi try out selesai.
        </p>
      </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {daftar}
      <h2 className="text-base font-semibold text-gray-900">Hasil</h2>
      <RiwayatKemampuan riwayat={seri} />
    </div>
  )
}
