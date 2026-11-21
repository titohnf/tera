import Link from 'next/link'
import { mandiriContext } from '@/lib/mandiri'
import { createClient } from '@/lib/supabase/server'
import DaftarTryOut, { paketTryOutTerbit } from '@/components/tryout/DaftarTryOut'
import type { HasilTryOut } from '@/components/tryout/HasilPeserta'

export const metadata = { title: 'Try Out' }
export const dynamic = 'force-dynamic'

/** Try Out untuk akun mandiri. Terbuka untuk semua akun, berlangganan atau tidak. */
export default async function TryOutMandiri() {
  await mandiriContext()
  const supabase = await createClient()
  const [paket, { data }] = await Promise.all([paketTryOutTerbit(supabase), supabase.rpc('hasil_tryout_saya')])
  return (
    <div className="space-y-5">
      <Link href="/mandiri" className="text-sm text-gray-500 underline">← Beranda</Link>
      <h1 className="text-xl font-bold tracking-tight text-gray-900">Try Out</h1>
      <DaftarTryOut
        paket={paket}
        hasil={(data as HasilTryOut | null) ?? null}
        petunjukMasuk='Di layar masuk, pilih "Akun Tera" lalu masuk dengan email dan password akunmu.'
        hrefHasil={(id) => `/mandiri/tryout/${id}`}
      />
    </div>
  )
}
