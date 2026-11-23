import { mandiriContext } from '@/lib/mandiri'
import { createClient } from '@/lib/supabase/server'
import { nilaiDariHasil } from '@/lib/tryout/nilai-hasil'
import DaftarTryOut, { paketTryOutTerbit } from '@/components/tryout/DaftarTryOut'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'

export const metadata = { title: 'Try Out' }
export const dynamic = 'force-dynamic'

/** Try Out untuk akun mandiri. Terbuka untuk semua akun, berlangganan atau tidak. */
export default async function TryOutMandiri() {
  await mandiriContext()
  const supabase = await createClient()
  const [paket, { data }, { data: penguji }] = await Promise.all([paketTryOutTerbit(supabase), supabase.rpc('hasil_tryout_saya'), supabase.rpc('akun_penguji')])
  return (
    <div className="space-y-5">
      <DaftarTryOut
        paket={paket}
        hasil={(data as HasilTryOut | null) ?? null}
        nilai={nilaiDariHasil((data as HasilTryOut | null) ?? null)}
        petunjukMasuk="Tekan Mulai, periksa datamu, lalu kerjakan."
        hrefHasil={(id) => `/mandiri/tryout/${id}`}
        lewatiJadwal={penguji === true}
      />
    </div>
  )
}
