import Link from 'next/link'
import { anakOrRedirect } from '@/lib/keluarga'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import DaftarTryOut, { paketTryOutTerbit } from '@/components/tryout/DaftarTryOut'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'
import { kodeAnak } from '@/lib/tryout/kode-anak'

export const metadata = { title: 'Try Out' }
export const dynamic = 'force-dynamic'

/** Try Out untuk siswa bimbel yang masuk dengan kode: daftar per jenjang dengan tombol Mulai berjadwal. */
export default async function TryOutSiswaPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  await anakOrRedirect(studentId)
  const paket = await paketTryOutTerbit(await createClient())
  const kode = await kodeAnak(studentId)

  // Yang sudah dikirim ditandai "sudah mengerjakan"; hasilnya dibuka admin kemudian.
  const selesai = new Map<string, boolean>()
  if (kode) {
    const { data } = await createAdminClient()
      .from('attempts')
      .select('quiz_id, quizzes!inner(kind, settings)')
      .eq('learner_id', kode.learnerId)
      .not('submitted_at', 'is', null)
      .eq('quizzes.kind', 'tryout')
    for (const r of (data ?? []) as unknown as { quiz_id: string; quizzes: { settings: { hasil_dibuka?: boolean } | null } }[]) {
      selesai.set(r.quiz_id, selesai.get(r.quiz_id) === true || r.quizzes?.settings?.hasil_dibuka === true)
    }
  }
  const hasil: HasilTryOut = {
    nama: null,
    paket: [...selesai].filter(([, buka]) => buka).map(([quiz_id]) => ({ quiz_id }) as unknown as HasilTryOut['paket'][number]),
    menunggu: [...selesai].filter(([, buka]) => !buka).map(([quiz_id]) => ({ quiz_id, judul: '' })),
  }

  return (
    <div className="space-y-5">
      <Link href={`/siswa/${studentId}`} className="text-sm text-gray-500 underline">← Beranda</Link>
      <h1 className="text-xl font-bold tracking-tight text-gray-900">Try Out</h1>
      <DaftarTryOut
        paket={paket}
        hasil={hasil}
        petunjukMasuk="Tekan Mulai, periksa datamu, lalu kerjakan."
        hrefHasil={(id) => `/keluarga/${studentId}/tryout#hasil-${id}`}
        kode={kode?.kode}
      />
    </div>
  )
}
