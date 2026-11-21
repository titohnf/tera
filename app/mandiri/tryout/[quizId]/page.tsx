import { mandiriContext } from '@/lib/mandiri'
import { createClient } from '@/lib/supabase/server'
import HalamanHasil from '@/components/tryout/HalamanHasil'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'

export const metadata = { title: 'Hasil Try Out' }
export const dynamic = 'force-dynamic'

export default async function HasilTryOutMandiri({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params
  const { nama } = await mandiriContext()
  const supabase = await createClient()
  const { data } = await supabase.rpc('hasil_tryout_saya')
  return (
    <HalamanHasil
      hasil={(data as HasilTryOut | null) ?? null}
      quizId={quizId}
      nama={nama}
      ctaHref="/mandiri/langganan"
      kembaliHref="/mandiri/tryout"
    />
  )
}
