import { anakOrRedirect } from '@/lib/keluarga'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import DaftarTryOut, { paketTryOutTerbit } from '@/components/tryout/DaftarTryOut'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'
import { kodeAnak } from '@/lib/tryout/kode-anak'
import Link from 'next/link'
import { muatNilaiAnak } from '@/lib/tryout/hasil-anak'
import { jenjangAnak } from '@/lib/tryout/jenjang-anak'

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

  // Try out yang bisa dikerjakan: tombol Mulai membawa anak ke Sora dengan kodenya sendiri
  // (dibuatkan bila belum ada), jadi tidak perlu mengetik apa pun. Yang sudah dikirim ditandai
  // "sudah mengerjakan", entah hasilnya sudah dibuka admin atau belum.
  const jenjang = await jenjangAnak(studentId)
  // Hanya try out yang ditujukan untuk jenjang anak ini; kelas yang belum diisi menampilkan semuanya.
  const paket = (await paketTryOutTerbit(await createClient())).filter((p) => !jenjang || p.jenjang === jenjang || p.jenjang === 'Lainnya')
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
      hrefHasil={(id) => `/keluarga/${studentId}/tryout/${id}`}
      kode={kode?.kode}
      nilai={await muatNilaiAnak(studentId)}
    />
  )

  return (
    <div className="space-y-4">
      {[...selesai.values()].some(Boolean) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <div className="min-w-0">
            <p className="font-semibold tracking-tight text-gray-900">Laporan Try Out</p>
            <p className="mt-0.5 text-sm text-gray-500">Kemampuan anak per bidang dan topik dari try out yang sudah dikerjakan.</p>
          </div>
          <Link href={`/keluarga/${studentId}/tryout/laporan`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            Lihat Laporan
          </Link>
        </div>
      )}
      {daftar}
    </div>
  )
}
