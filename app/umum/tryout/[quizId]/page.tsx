import { alihkanKeTampilanSiswa, umumContext } from '@/lib/umum'
import { createClient } from '@/lib/supabase/server'
import HalamanHasil from '@/components/tryout/HalamanHasil'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'

export const metadata = { title: 'Hasil Try Out' }
export const dynamic = 'force-dynamic'

export default async function HasilTryOutUmum({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params
  const { kode, nama, studentId } = await umumContext()
  await alihkanKeTampilanSiswa(studentId, (id) => `/keluarga/${id}/tryout#hasil-${quizId}`)
  const supabase = await createClient()
  const { data } = await supabase.rpc('hasil_peserta_tryout', { p_kode: kode })
  return (
    <HalamanHasil
      hasil={(data as HasilTryOut | null) ?? null}
      quizId={quizId}
      nama={nama}
      ctaHref="/umum/langganan"
      kode={kode}
      kembaliHref="/umum/tryout"
    />
  )
}
